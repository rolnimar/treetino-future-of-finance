import { Buffer } from 'buffer';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { TREETINO_PROGRAM_ID } from '@treetino/contracts';

export const PROGRAM_ID = new PublicKey(TREETINO_PROGRAM_ID);
export const UPGRADEABLE_LOADER_ID = new PublicKey(
  'BPFLoaderUpgradeab1e11111111111111111111111',
);
export const METADATA_PROGRAM_ID = new PublicKey(
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
);
export const SEEDS = {
  admins: 'admins',
  paymentMint: 'payment_mint',
  tree: 'tree',
  shares: 'shares',
  funding: 'funding',
  revenue: 'revenue',
  report: 'report',
  position: 'position',
  kamino: 'kamino_vault',
} as const;

function derive(seed: string, ...parts: Buffer[]) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(seed), ...parts],
    PROGRAM_ID,
  )[0];
}
export function u64Seed(value: bigint | string) {
  const n = BigInt(value);
  if (n < 0n || n > 18446744073709551615n)
    throw new Error('Value must fit in u64');
  const bytes = Buffer.alloc(8);
  bytes.writeBigUInt64LE(n);
  return bytes;
}
export function i64Seed(value: bigint | string) {
  const n = BigInt(value);
  if (n < -9223372036854775808n || n > 9223372036854775807n)
    throw new Error('Value must fit in i64');
  const bytes = Buffer.alloc(8);
  bytes.writeBigInt64LE(n);
  return bytes;
}
export const adminConfigAddress = () => derive(SEEDS.admins);
export const paymentMintAddress = () => derive(SEEDS.paymentMint);
export const treeAddress = (creator: PublicKey, treeId: bigint | string) =>
  derive(SEEDS.tree, creator.toBuffer(), u64Seed(treeId));
export const shareMintAddress = (tree: PublicKey) =>
  derive(SEEDS.shares, tree.toBuffer());
export const fundingVaultAddress = (tree: PublicKey) =>
  derive(SEEDS.funding, tree.toBuffer());
export const revenueVaultAddress = (tree: PublicKey) =>
  derive(SEEDS.revenue, tree.toBuffer());
export const kaminoVaultAddress = (tree: PublicKey) =>
  derive(SEEDS.kamino, tree.toBuffer());
export const reportAddress = (tree: PublicKey, dayStartTs: bigint | string) =>
  derive(SEEDS.report, tree.toBuffer(), i64Seed(dayStartTs));
export const paymentMetadataAddress = () =>
  PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      METADATA_PROGRAM_ID.toBuffer(),
      paymentMintAddress().toBuffer(),
    ],
    METADATA_PROGRAM_ID,
  )[0];
/** Supports supplier PDAs as well as ordinary wallet owners. */
export const paymentAtaAddress = (owner: PublicKey) =>
  getAssociatedTokenAddressSync(paymentMintAddress(), owner, true);

export const positionAddress = (tree: PublicKey, owner: PublicKey) =>
  derive(SEEDS.position, tree.toBuffer(), owner.toBuffer());
export const shareAtaAddress = (tree: PublicKey, owner: PublicKey) =>
  getAssociatedTokenAddressSync(shareMintAddress(tree), owner);
