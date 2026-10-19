mod common;
use common::*;

#[test]
fn payment_token_is_initialized_once_with_immutable_metadata_and_program_authority() {
    let mut e = Env::uninitialized();
    assert!(e.svm.get_account(&e.mint).is_none());
    e.send(e.init_payment_token_ix(), 0).unwrap();
    let account = e.svm.get_account(&e.mint).unwrap();
    let mint = spl_token::state::Mint::unpack(&account.data).unwrap();
    assert_eq!(account.owner, token::ID);
    assert_eq!(mint.decimals, 6);
    assert_eq!(mint.supply, 0);
    assert_eq!(mint.mint_authority, COption::Some(e.mint));
    assert_eq!(mint.freeze_authority, COption::None);

    let retry = ix(
        a::InitPaymentToken {
            payer: e.alice.pubkey(),
            payment_mint: e.mint,
            payment_metadata: payment_metadata(&e.mint),
            metadata_program: metadata::ID,
            rent: Rent::id(),
            token_program: token::ID,
            system_program: system_program::ID,
        },
        i::InitPaymentToken {},
    );
    assert!(e.send(retry, 1).is_err());
    assert_eq!(e.svm.get_account(&e.mint).unwrap(), account);

    let metadata_account = e.svm.get_account(&payment_metadata(&e.mint)).unwrap();
    assert_eq!(metadata_account.owner, metadata::ID);
    let data = metadata::mpl_token_metadata::accounts::Metadata::from_bytes(&metadata_account.data)
        .unwrap();
    assert_eq!(data.name.trim_end_matches('\0'), "USDC");
    assert_eq!(data.symbol.trim_end_matches('\0'), "USDC");
    assert!(data.uri.trim_end_matches('\0').is_empty());
    assert_eq!(data.mint, e.mint);
    assert_eq!(data.update_authority, e.mint);
    assert!(!data.is_mutable);
    assert_eq!(data.seller_fee_basis_points, 0);
    assert_eq!(
        data.token_standard,
        Some(metadata::mpl_token_metadata::types::TokenStandard::Fungible)
    );
}

#[test]
fn incorrect_metadata_address_rolls_back_payment_mint_initialization() {
    let mut e = Env::uninitialized();
    let mut instruction = e.init_payment_token_ix();
    instruction.accounts[2].pubkey = Pubkey::new_unique();
    assert!(e.send(instruction, 0).is_err());
    assert!(e.svm.get_account(&e.mint).is_none());
    assert!(e.svm.get_account(&payment_metadata(&e.mint)).is_none());
}

#[test]
fn trees_require_payment_token_initialization_and_share_one_mint() {
    let mut e = Env::uninitialized();
    e.send(e.init_admins_ix(vec![e.creator.pubkey()]), 0)
        .unwrap();
    assert!(e.send(e.init_tree_ix(1, USDC, e.mint), 0).is_err());
    for key in [
        e.tree,
        e.share_mint,
        e.funding_token_account,
        e.revenue_token_account,
    ] {
        assert!(e.svm.get_account(&key).is_none());
    }
    e.send(e.init_payment_token_ix(), 0).unwrap();
    e.send(e.init_tree_ix(1, USDC, e.mint), 0).unwrap();
    e.send(e.init_tree_ix(2, 2 * USDC, e.mint), 0).unwrap();
    let second = pda(&[b"tree", e.creator.pubkey().as_ref(), &2u64.to_le_bytes()]);
    assert_eq!(e.tree().payment_mint, e.mint);
    assert_eq!(e.read::<Tree>(second).payment_mint, e.mint);
}

#[test]
fn another_six_decimal_mint_cannot_initialize_payment_token_or_tree() {
    let mut e = Env::new(USDC);
    // A valid six-decimal SPL mint at a different address is still unsupported.
    let other_mint = Pubkey::new_unique();
    e.svm
        .set_account(other_mint, e.svm.get_account(&e.mint).unwrap())
        .unwrap();
    let wrong_mint = Pubkey::new_unique();
    let init_payment_token = ix(
        a::InitPaymentToken {
            payer: e.creator.pubkey(),
            payment_mint: wrong_mint,
            payment_metadata: payment_metadata(&wrong_mint),
            metadata_program: metadata::ID,
            rent: Rent::id(),
            token_program: token::ID,
            system_program: system_program::ID,
        },
        i::InitPaymentToken {},
    );
    let error = e.send(init_payment_token, 0).unwrap_err();
    assert!(error
        .meta
        .logs
        .iter()
        .any(|log| log.contains("ConstraintSeeds")));
    let error = e.send(e.init_tree_ix(2, USDC, other_mint), 0).unwrap_err();
    assert!(error
        .meta
        .logs
        .iter()
        .any(|log| log.contains("ConstraintSeeds")));
    let second = pda(&[b"tree", e.creator.pubkey().as_ref(), &2u64.to_le_bytes()]);
    for key in [
        second,
        pda(&[b"shares", second.as_ref()]),
        pda(&[b"funding", second.as_ref()]),
        pda(&[b"revenue", second.as_ref()]),
    ] {
        assert!(e.svm.get_account(&key).is_none());
    }
}

#[test]
fn legacy_tree_with_other_mint_cannot_move_payments() {
    let mut e = Env::new(USDC);
    e.buy(1, USDC).unwrap();
    e.activate();
    e.set_time(START + DAY);
    e.send(e.report(START, vec![1; INTERVALS]), 5).unwrap();
    e.invoice(START, USDC).unwrap();

    // Simulate an existing tree created before the singleton-mint requirement.
    let mut account = e.svm.get_account(&e.tree).unwrap();
    let mut tree = e.tree();
    tree.payment_mint = Pubkey::new_unique();
    tree.try_serialize(&mut account.data.as_mut_slice())
        .unwrap();
    e.svm.set_account(e.tree, account).unwrap();

    custom(e.buy(1, 1), TreeError::InvalidPaymentMint);
    custom(e.pay(START, USDC), TreeError::InvalidPaymentMint);
    custom(e.claim(1), TreeError::InvalidPaymentMint);
    let purchase = ix(
        a::PurchaseTree {
            creator: e.creator.pubkey(),
            tree: e.tree,
            funding_token_account: e.funding_token_account,
            supplier_payment_token_account: ata(&e.supplier.pubkey(), &e.mint),
            token_program: token::ID,
        },
        i::PurchaseTree {},
    );
    custom(e.send(purchase, 0), TreeError::InvalidPaymentMint);
    assert_eq!(e.tree().paid, 0);
    assert_eq!(e.tree().claimed, 0);
    assert_eq!(e.balance(e.revenue_token_account), 0);
}
