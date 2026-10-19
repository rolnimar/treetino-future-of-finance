import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { Connection, Keypair, Transaction } from '@solana/web3.js';
import { FLAGSHIP_CREATOR, FLAGSHIP_FUNDING } from '@treetino/contracts';
import { initTreeInstruction } from '../src/chain/instructions';
import { treeAddress } from '../src/chain/addresses';
import { parseTokenAmount } from '../src/chain/amounts';
import { DEVNET_GENESIS } from '../src/chain/network';
import { decodeProgramAccount } from '../src/chain/read';

// Run from frontend: bun scripts/setup-funding-pools.ts [--execute]
const connection = new Connection(
  process.env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com',
  'confirmed',
);
if ((await connection.getGenesisHash()) !== DEVNET_GENESIS)
  throw new Error('Devnet only');
const creator = Keypair.fromSecretKey(
  Uint8Array.from(
    JSON.parse(
      readFileSync(
        process.env.SOLANA_KEYPAIR_PATH ??
          `${homedir()}/.config/solana/id.json`,
        'utf8',
      ),
    ),
  ),
);
if (creator.publicKey.toBase58() !== FLAGSHIP_CREATOR)
  throw new Error('Funding pool creator does not match');
for (const [siteId, pool] of Object.entries(FLAGSHIP_FUNDING)) {
  const address = treeAddress(creator.publicKey, pool.treeId);
  if (address.toBase58() !== pool.address)
    throw new Error('Invalid pool binding');
  const account = await connection.getAccountInfo(address);
  if (account) {
    const tree = decodeProgramAccount<{
      creator: { equals: (key: typeof creator.publicKey) => boolean };
      target: { toString: () => string };
    }>('Tree', account);
    if (
      !tree.creator.equals(creator.publicKey) ||
      tree.target.toString() !== parseTokenAmount(pool.targetUsdc)
    )
      throw new Error('Existing pool does not match');
    console.log(siteId, pool.address, 'already initialized');
    continue;
  }
  const tx = new Transaction().add(
    initTreeInstruction(creator.publicKey, {
      treeId: pool.treeId,
      target: parseTokenAmount(pool.targetUsdc),
      supplier: creator.publicKey,
      client: creator.publicKey,
      reporter: creator.publicKey,
    }),
  );
  const block = await connection.getLatestBlockhash();
  tx.feePayer = creator.publicKey;
  tx.recentBlockhash = block.blockhash;
  tx.sign(creator);
  const simulation = await connection.simulateTransaction(tx);
  if (simulation.value.err) throw new Error(JSON.stringify(simulation.value));
  console.log(siteId, pool.address, 'simulation passed');
  if (process.argv.includes('--execute')) {
    const signature = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
    });
    const result = await connection.confirmTransaction(
      { ...block, signature },
      'confirmed',
    );
    if (result.value.err) throw new Error(JSON.stringify(result.value.err));
    console.log(siteId, 'confirmed', signature);
  }
}
