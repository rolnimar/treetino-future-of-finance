import { PublicKey, Transaction, type Connection } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, unpackAccount, unpackMint } from '@solana/spl-token';
import { assertDevnet } from './network';
import {
  paymentMintAddress,
  paymentAtaAddress,
  treeAddress,
  shareMintAddress,
  fundingVaultAddress,
  reportAddress,
} from './addresses';
import {
  buySharesInstruction,
  giveMeMoneyInstruction,
  payInvoiceInstruction,
  claimRewardsInstructions,
} from './instructions';
import { readTreeRewards } from './rewards';
import {
  publicActionSchema,
  type PublicAction,
} from '../features/marketplace/schemas';

/** Reads only the payment mint and the connected wallet's token account. */
export async function readEurTreeBalance(
  connection: Connection,
  address: string,
) {
  await assertDevnet(connection);
  const owner = new PublicKey(address);
  const mintAddress = paymentMintAddress();
  const ata = paymentAtaAddress(owner);
  const [mintAccount, tokenAccount] = await connection.getMultipleAccountsInfo([
    mintAddress,
    ata,
  ]);
  if (!mintAccount) return { initialized: false, balance: '0' };
  const mint = unpackMint(mintAddress, mintAccount, TOKEN_PROGRAM_ID);
  if (
    !mint.isInitialized ||
    mint.decimals !== 6 ||
    !mint.mintAuthority?.equals(mintAddress) ||
    mint.freezeAuthority
  )
    throw new Error('The payment mint is not the expected EURTree');
  if (!tokenAccount) return { initialized: true, balance: '0' };
  const token = unpackAccount(ata, tokenAccount, TOKEN_PROGRAM_ID);
  if (
    !token.owner.equals(owner) ||
    !token.mint.equals(mintAddress) ||
    !token.isInitialized ||
    token.isFrozen
  )
    throw new Error('Invalid EURTree wallet account');
  return { initialized: true, balance: token.amount.toString() };
}

export const readMockUsdcBalance = readEurTreeBalance;

export async function buildPublicTransaction(
  connection: Connection,
  address: string,
  value: PublicAction,
) {
  const input = publicActionSchema.parse(value);
  const owner = new PublicKey(address);
  const state = await readEurTreeBalance(connection, address);
  if (!state.initialized)
    throw new Error('The demo payment token has not been initialized yet');
  const transaction = new Transaction();
  transaction.feePayer = owner;
  if (input.action === 'giveMeMoney') {
    transaction.add(giveMeMoneyInstruction(owner, input.amount));
    return transaction;
  }
  const tree = input.tree;
  const key = new PublicKey(tree.address);
  if (
    !treeAddress(new PublicKey(tree.creator), tree.treeId).equals(key) ||
    !shareMintAddress(key).equals(new PublicKey(tree.shareMint)) ||
    !fundingVaultAddress(key).equals(new PublicKey(tree.fundingTokenAccount)) ||
    tree.paymentMint !== paymentMintAddress().toBase58()
  )
    throw new Error('Backend tree addresses do not match the program seeds');
  if (input.action === 'claimRewards') {
    const rewards = await readTreeRewards(connection, address, tree);
    if (!rewards.active) throw new Error('Rewards require an active tree');
    if (rewards.claimable === '0')
      throw new Error('No rewards available to claim');
    if (!rewards.canClaim)
      throw new Error('Insufficient funds in the tree revenue vault');
    transaction.add(...claimRewardsInstructions(owner, tree));
    return transaction;
  }
  if (input.action === 'payInvoice') {
    if (tree.client !== address)
      throw new Error('Only this tree’s client can pay its invoice');
    if (tree.phase !== 'active' || !input.report.invoiceIssued)
      throw new Error('Invoice has not been issued for an active tree');
    const report = new PublicKey(input.report.address);
    if (!reportAddress(key, input.report.dayStartTs).equals(report))
      throw new Error('Report does not belong to this tree');
    if (
      BigInt(input.report.paid) > BigInt(input.report.due) ||
      BigInt(input.amount) >
        BigInt(input.report.due) - BigInt(input.report.paid)
    )
      throw new Error('Amount exceeds the unpaid invoice');
    if (BigInt(input.amount) > BigInt(state.balance))
      throw new Error('Insufficient EURTree balance');
    transaction.add(payInvoiceInstruction(owner, tree, report, input.amount));
    return transaction;
  }
  if (tree.phase !== 'funding' || !tree.canBuy)
    throw new Error('This tree is no longer accepting funding');
  const target = BigInt(tree.target);
  const raised = BigInt(tree.raised);
  if (
    target === 0n ||
    raised > target ||
    BigInt(tree.remaining) !== target - raised
  )
    throw new Error('Invalid tree funding data');
  if (BigInt(input.amount) > target - raised)
    throw new Error('Amount exceeds remaining tree funding');
  if (BigInt(input.amount) > BigInt(state.balance))
    throw new Error('Insufficient EURTree balance');
  transaction.add(buySharesInstruction(owner, tree, input.amount));
  return transaction;
}
