#![allow(dead_code, unused_imports)]

pub use anchor_lang::{
    prelude::*,
    solana_program::{
        instruction::Instruction, program_option::COption, program_pack::Pack, system_program,
        sysvar::SysvarId,
    },
    InstructionData, ToAccountMetas,
};
pub use anchor_spl::{
    associated_token, metadata,
    token::{self, spl_token},
};
pub use litesvm::{types::FailedTransactionMetadata, LiteSVM};
pub use solana_account::Account as SolAccount;
pub use solana_keypair::Keypair;
pub use solana_message::Message;
pub use solana_signer::Signer;
pub use solana_transaction::Transaction;
pub use treetino::{
    accounts as a,
    constants::*,
    instruction as i,
    instructions::{AdminConfig, Phase, Position, Report, Tree},
};

pub const INTERVALS: usize = 96;
pub const EURTREE: u64 = 1_000_000;
pub const USDC: u64 = EURTREE;
pub const START: i64 = DAY * 20_000;
pub fn pda(seeds: &[&[u8]]) -> Pubkey {
    Pubkey::find_program_address(seeds, &treetino::id()).0
}
pub fn program_data() -> Pubkey {
    Pubkey::find_program_address(
        &[treetino::ID.as_ref()],
        &anchor_lang::solana_program::bpf_loader_upgradeable::ID,
    )
    .0
}
pub fn ix(accounts: impl ToAccountMetas, data: impl InstructionData) -> Instruction {
    Instruction {
        program_id: treetino::id(),
        accounts: accounts.to_account_metas(None),
        data: data.data(),
    }
}
pub fn ata(owner: &Pubkey, mint: &Pubkey) -> Pubkey {
    associated_token::get_associated_token_address(owner, mint)
}
pub fn payment_metadata(mint: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(
        &[b"metadata", metadata::ID.as_ref(), mint.as_ref()],
        &metadata::ID,
    )
    .0
}
pub fn position(tree: &Pubkey, owner: &Pubkey) -> Pubkey {
    pda(&[b"position", tree.as_ref(), owner.as_ref()])
}

mod builders;
mod svm;
pub use svm::Env;

pub fn custom(result: std::result::Result<(), Box<FailedTransactionMetadata>>, error: TreeError) {
    let code = error as u32 + 6000;
    let err = result.expect_err("expected rejection");
    assert!(
        format!("{:?}", err.err).contains(&format!("Custom({code})")),
        "{err:?}"
    );
}

pub use treetino::errors::TreeError;
