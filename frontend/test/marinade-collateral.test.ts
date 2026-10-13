import { describe, it, expect } from 'bun:test';
import { PublicKey, Connection } from '@solana/web3.js';
import {
  MARINADE_PROGRAM_ID,
  MARINADE_STATE_ADDRESS,
  MSOL_MINT_ADDRESS,
  MARINADE_STAKING_APY,
  REQUIRED_COLLATERAL_SOL,
  DEMO_COLLATERAL_SOL,
  MSOL_PER_SOL_RATE,
  collateralVaultAddress,
  getAssociatedMsolAddress,
  simulateCollateralDepositOnDevnet,
  buildCollateralDepositTransaction,
  getLiveMarinadeState,
  getRealMsolBalance,
} from '../src/chain/marinade';

describe('Marinade Liquid Staking & Host Collateral Architecture', () => {
  it('correctly configures Marinade protocol accounts and constants', () => {
    expect(MARINADE_PROGRAM_ID.toBase58()).toBe(
      'MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD',
    );
    expect(MARINADE_STATE_ADDRESS.toBase58()).toBe(
      '8SzNgZWNu9ZXU42nuGQDuJkWy1ymJTSEG5wqG5E17qw6',
    );
    expect(MSOL_MINT_ADDRESS.toBase58()).toBe(
      'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
    );
    expect(MARINADE_STAKING_APY).toBe(0.0782); // 7.82% APY
    expect(REQUIRED_COLLATERAL_SOL).toBe(100);
    expect(DEMO_COLLATERAL_SOL).toBe(0.1);
  });

  it('calculates the exact Marinade mSOL liquid staking conversion for 100 SOL', () => {
    const sol = 100;
    const msol = sol * MSOL_PER_SOL_RATE;
    // 100 SOL at ~1.17314 SOL per mSOL = ~85.2415 mSOL
    expect(msol).toBeGreaterThan(85.2);
    expect(msol).toBeLessThan(85.3);

    // Staking annual return for the host
    const annualSolReturn = sol * MARINADE_STAKING_APY;
    expect(annualSolReturn).toBeCloseTo(7.82, 2);
  });

  it('derives a canonical, deterministic collateral vault PDA for tree and client', () => {
    const dummyTree = new PublicKey(
      '8z7PkW2s4p1aM5DqH2qj6tY8Z9X2v7w1m3k5L8p9q4r2',
    );
    const dummyClient = new PublicKey(
      '4v7PkW2s4p1aM5DqH2qj6tY8Z9X2v7w1m3k5L8p9q4r1',
    );

    const vault = collateralVaultAddress(dummyTree, dummyClient);
    expect(vault).toBeInstanceOf(PublicKey);
    expect(PublicKey.isOnCurve(vault.toBuffer())).toBe(false); // Valid off-curve PDA

    // Re-derivation matches exactly
    const vaultRepeat = collateralVaultAddress(dummyTree, dummyClient);
    expect(vaultRepeat.toBase58()).toBe(vault.toBase58());
  });

  it('derives canonical associated mSOL token address', () => {
    const dummyClient = new PublicKey(
      '4v7PkW2s4p1aM5DqH2qj6tY8Z9X2v7w1m3k5L8p9q4r1',
    );
    const msolAta = getAssociatedMsolAddress(dummyClient);
    expect(msolAta).toBeInstanceOf(PublicKey);
    expect(PublicKey.isOnCurve(msolAta.toBuffer())).toBe(false);
  });

  it('executes high-fidelity Devnet simulation for 100 SOL deposit and Marinade liquid staking', async () => {
    const mockConnection = {
      getSlot: async () => 318592810,
    } as any;

    const clientAddress = '4v7PkW2s4p1aM5DqH2qj6tY8Z9X2v7w1m3k5L8p9q4r1';
    const result = await simulateCollateralDepositOnDevnet(mockConnection, {
      clientAddress,
      solAmount: 100,
    });

    expect(result.solAmount).toBe(100);
    expect(result.msolAmount).toBeCloseTo(85.2415, 2);
    expect(result.slot).toBe(318592810);
    expect(result.signature).toContain('marinade_stake_100sol');
    expect(result.logs.some((l) => l.includes('Transferring 100 SOL'))).toBe(
      true,
    );
    expect(
      result.logs.some((l) => l.includes(`Minting ${result.msolAmount} mSOL`)),
    ).toBe(true);
    expect(result.logs.some((l) => l.includes('Marinade 7.82% APY'))).toBe(
      true,
    );
  });

  it('fetches live Marinade state and builds authentic deposit transaction on Devnet', async () => {
    const connection = new Connection(
      'https://api.devnet.solana.com',
      'confirmed',
    );
    const state = await getLiveMarinadeState(connection);
    expect(state.mSolPrice).toBeGreaterThan(0.9);
    expect(state.totalActiveBalanceSol).toBeGreaterThan(0);

    const clientAddress = '4v7PkW2s4p1aM5DqH2qj6tY8Z9X2v7w1m3k5L8p9q4r1';
    const depositResult = await buildCollateralDepositTransaction(connection, {
      clientAddress,
      solAmount: 0.1,
    });

    expect(
      depositResult.transaction.instructions.length,
    ).toBeGreaterThanOrEqual(2);
    expect(depositResult.associatedMSolTokenAccountAddress).toBeInstanceOf(
      PublicKey,
    );
    expect(depositResult.transaction.feePayer?.toBase58()).toBe(clientAddress);

    // Verify balance querying works
    const balance = await getRealMsolBalance(
      connection,
      new PublicKey(clientAddress),
    );
    expect(typeof balance.uiAmount).toBe('number');
  });
});
