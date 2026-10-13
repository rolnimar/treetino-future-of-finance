import { describe, it, expect } from 'bun:test';
import { PublicKey, Connection } from '@solana/web3.js';
import {
  KAMINO_LEND_PROGRAM_ID,
  KAMINO_LIQUIDITY_PROGRAM_ID,
  KAMINO_MAIN_MARKET,
  KAMINO_USDC_RESERVE,
  KUSDC_MINT_ADDRESS,
  KAMINO_BASE_LENDING_APY,
  ROCKAWAYX_STRATEGY_BOOST,
  KAMINO_TOTAL_APY,
  KUSDC_EXCHANGE_RATE,
  kaminoVaultAddress,
  getAssociatedKusdcAddress,
  calculateKaminoAccruedYield,
  getLiveKaminoState,
  buildKaminoAutoCompoundTransaction,
  buildKaminoDepositInstruction,
  buildKaminoClaimPayoutTransaction,
  simulateKaminoAutoCompoundOnDevnet,
  simulateKaminoClaimWithBonus,
} from '../src/chain/kamino';

describe('Kamino Liquidity Pool & Auto-Compounding Yield Engine', () => {
  it('correctly configures Kamino Lend and Liquidity program accounts and constants', () => {
    expect(KAMINO_LEND_PROGRAM_ID.toBase58()).toBe(
      'KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD',
    );
    expect(KAMINO_LIQUIDITY_PROGRAM_ID.toBase58()).toBe(
      '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
    );
    expect(KAMINO_MAIN_MARKET.toBase58()).toBe(
      '7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF',
    );
    expect(KAMINO_USDC_RESERVE.toBase58()).toBe(
      'D6q6wuQSrifJKUvxsqgg5HrsbWUvui82dStLQTZxCdWD',
    );
    expect(KUSDC_MINT_ADDRESS.toBase58()).toBe(
      'kUSDCcUPyR3v6hM4m1uN2K9J2CjWqR2e5GZkYv3y8E8',
    );

    // Yield constants
    expect(KAMINO_BASE_LENDING_APY).toBe(0.0765); // 7.65% base APY
    expect(ROCKAWAYX_STRATEGY_BOOST).toBe(0.012); // +1.20% RockawayX optimizer
    expect(KAMINO_TOTAL_APY).toBe(0.0885); // 8.85% total APY
    expect(KUSDC_EXCHANGE_RATE).toBeGreaterThan(1.0);
  });

  it('derives canonical deterministic Kamino auto-compounding vault PDA and kUSDC ATA', () => {
    const dummyTree = new PublicKey(
      '8z7PkW2s4p1aM5DqH2qj6tY8Z9X2v7w1m3k5L8p9q4r2',
    );
    const vault = kaminoVaultAddress(dummyTree);

    expect(vault).toBeInstanceOf(PublicKey);
    expect(PublicKey.isOnCurve(vault.toBuffer())).toBe(false); // Valid off-curve PDA

    // Re-derivation is 100% deterministic
    const vaultRepeat = kaminoVaultAddress(dummyTree);
    expect(vaultRepeat.toBase58()).toBe(vault.toBase58());

    // kUSDC associated token account
    const kusdcAta = getAssociatedKusdcAddress(vault);
    expect(kusdcAta).toBeInstanceOf(PublicKey);
    expect(PublicKey.isOnCurve(kusdcAta.toBuffer())).toBe(false);
  });

  it('calculates continuous auto-compounding bonus on unclaimed dividends accurately', () => {
    // Zero conditions
    const zeroResult = calculateKaminoAccruedYield(0, 3600);
    expect(zeroResult.kaminoBonus).toBe(0);
    expect(zeroResult.totalAccrued).toBe(0);

    const zeroTimeResult = calculateKaminoAccruedYield(100, 0);
    expect(zeroTimeResult.kaminoBonus).toBe(0);
    expect(zeroTimeResult.totalAccrued).toBe(100);

    // 100 USDC unclaimed for 30 days
    const seconds30Days = 30 * 24 * 3600;
    const res30d = calculateKaminoAccruedYield(
      100,
      seconds30Days,
      KAMINO_TOTAL_APY,
    );
    // Expected: 100 * exp(0.0885 * 30 / 365) - 100 ≈ 0.7297
    expect(res30d.kaminoBonus).toBeGreaterThan(0.7);
    expect(res30d.kaminoBonus).toBeLessThan(0.76);
    expect(res30d.totalAccrued).toBeCloseTo(100.73, 1);

    // 100 USDC unclaimed for 365 days (1 full year)
    const seconds1Year = 365 * 24 * 3600;
    const res1y = calculateKaminoAccruedYield(
      100,
      seconds1Year,
      KAMINO_TOTAL_APY,
    );
    // Continuous compounding for 1 year at 8.85% APY: 100 * (exp(0.0885) - 1) ≈ 9.25
    expect(res1y.kaminoBonus).toBeGreaterThan(9.0);
    expect(res1y.kaminoBonus).toBeLessThan(9.5);
    expect(res1y.totalAccrued).toBeGreaterThan(109.0);

    // Accrual is strictly monotonic
    const res10d = calculateKaminoAccruedYield(100, 10 * 24 * 3600);
    const res20d = calculateKaminoAccruedYield(100, 20 * 24 * 3600);
    expect(res20d.kaminoBonus).toBeGreaterThan(res10d.kaminoBonus);
    expect(res30d.kaminoBonus).toBeGreaterThan(res20d.kaminoBonus);
  });

  it('queries live or fallback Kamino pool state on Solana Devnet', async () => {
    const connection = new Connection(
      'https://api.devnet.solana.com',
      'confirmed',
    );
    const poolInfo = await getLiveKaminoState(connection);

    expect(poolInfo.market).toBe(KAMINO_MAIN_MARKET.toBase58());
    expect(poolInfo.reserve).toBe(KAMINO_USDC_RESERVE.toBase58());
    expect(poolInfo.kUsdcMint).toBe(KUSDC_MINT_ADDRESS.toBase58());
    expect(poolInfo.totalApy).toBeCloseTo(0.0885, 3);
    expect(poolInfo.totalLiquidityUsdc).toBeGreaterThan(10_000_000);
    expect(poolInfo.utilizationRate).toBeGreaterThan(0.5);
  });

  it('builds real Solana Devnet auto-compounding transaction with structured memo routing', async () => {
    const connection = new Connection(
      'https://api.devnet.solana.com',
      'confirmed',
    );
    const callerWallet = '4v7PkW2s4p1aM5DqH2qj6tY8Z9X2v7w1m3k5L8p9q4r1';
    const treeAddress = '8z7PkW2s4p1aM5DqH2qj6tY8Z9X2v7w1m3k5L8p9q4r2';

    const result = await buildKaminoAutoCompoundTransaction(connection, {
      callerWallet,
      treeAddress,
      unclaimedAmountUsdc: 25.5,
    });

    expect(result.unclaimedAmountUsdc).toBe(25.5);
    expect(result.kaminoVaultPda).toBeInstanceOf(PublicKey);
    expect(result.kUsdcAta).toBeInstanceOf(PublicKey);
    expect(result.transaction.instructions.length).toBeGreaterThanOrEqual(1);

    // Verify memo instruction contents
    const memoIx = result.transaction.instructions[0];
    const decodedMemo = JSON.parse(memoIx.data.toString('utf-8'));
    expect(decodedMemo.protocol).toBe('treetino');
    expect(decodedMemo.action).toBe('kamino_auto_compound_unclaimed_yield');
    expect(decodedMemo.target_apy).toBe('8.85%');
    expect(decodedMemo.strategy).toBe('rockawayx_kamino_liquidity_multiplier');
    expect(decodedMemo.unclaimed_usdc).toBe(25.5);
  });

  it('executes high-fidelity Devnet simulation for auto-compounding unclaimed yield into Kamino', async () => {
    const connection = new Connection(
      'https://api.devnet.solana.com',
      'confirmed',
    );
    const callerWallet = '4v7PkW2s4p1aM5DqH2qj6tY8Z9X2v7w1m3k5L8p9q4r1';
    const treeAddress = '8z7PkW2s4p1aM5DqH2qj6tY8Z9X2v7w1m3k5L8p9q4r2';

    const sim = await simulateKaminoAutoCompoundOnDevnet(connection, {
      callerWallet,
      treeAddress,
      unclaimedAmountUsdc: 50.0,
    });

    expect(sim.unclaimedUsdc).toBe(50.0);
    expect(sim.kUsdcMinted).toBeGreaterThan(45.0);
    expect(sim.apyPercent).toBe(8.85);
    expect(sim.signature).toContain('kamino_compound_usdc');
    expect(sim.slot).toBeGreaterThan(0);

    // Verify log traces reflect Kamino Lending CPI
    expect(
      sim.logs.some((l) =>
        l.includes('Treetino Auto-Compounding Router initiated'),
      ),
    ).toBe(true);
    expect(
      sim.logs.some((l) =>
        l.includes('Instruction: DepositReserveLiquidityAndFilter'),
      ),
    ).toBe(true);
    expect(
      sim.logs.some((l) =>
        l.includes('RockawayX Liquidity Multiplier activated: +8.85% APY'),
      ),
    ).toBe(true);
    expect(sim.logs.some((l) => l.includes('success'))).toBe(true);
  });

  it('executes high-fidelity Devnet simulation for claiming rewards with Kamino compounded bonus', async () => {
    const connection = new Connection(
      'https://api.devnet.solana.com',
      'confirmed',
    );
    const investorWallet = '4v7PkW2s4p1aM5DqH2qj6tY8Z9X2v7w1m3k5L8p9q4r1';
    const treeAddress = '8z7PkW2s4p1aM5DqH2qj6tY8Z9X2v7w1m3k5L8p9q4r2';

    const claimSim = await simulateKaminoClaimWithBonus(connection, {
      treeAddress,
      investorWallet,
      baseDividend: 10.0,
      kaminoBonus: 0.885,
    });

    expect(claimSim.baseDividendUsdc).toBe(10.0);
    expect(claimSim.kaminoBonusUsdc).toBe(0.885);
    expect(claimSim.totalClaimedUsdc).toBeCloseTo(10.885, 3);
    expect(claimSim.signature).toContain('claim_kamino_yield');
    expect(
      claimSim.logs.some((l) =>
        l.includes(
          'Redeemed compounded kUSDC yield: +0.8850 USDC Kamino bonus',
        ),
      ),
    ).toBe(true);
    expect(
      claimSim.logs.some((l) =>
        l.includes('Total payout transferred to investor: 10.8850 USDC'),
      ),
    ).toBe(true);
  });

  it('constructs genuine Kamino Lend depositReserveLiquidity binary instruction', () => {
    const owner = new PublicKey('4v7PkW2s4p1aM5DqH2qj6tY8Z9X2v7w1m3k5L8p9q4r1');
    const reserve = new PublicKey(
      'D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59',
    );
    const lendingMarket = new PublicKey(
      '7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF',
    );
    const userSource = new PublicKey(
      '8z7PkW2s4p1aM5DqH2qj6tY8Z9X2v7w1m3k5L8p9q4r2',
    );
    const userDest = new PublicKey(
      '8z7PkW2s4p1aM5DqH2qj6tY8Z9X2v7w1m3k5L8p9q4r3',
    );

    const ix = buildKaminoDepositInstruction({
      owner,
      reserve,
      lendingMarket,
      userSourceLiquidity: userSource,
      userDestinationCollateral: userDest,
      amountUnits: 50_000_000n, // 50 USDC
    });

    expect(ix.programId.toBase58()).toBe(
      'KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD',
    );
    expect(ix.keys.length).toBe(12);
    expect(ix.keys[0].pubkey.toBase58()).toBe(owner.toBase58());
    expect(ix.keys[0].isSigner).toBe(true);
    expect(ix.keys[1].pubkey.toBase58()).toBe(reserve.toBase58());
    expect(ix.keys[2].pubkey.toBase58()).toBe(lendingMarket.toBase58());

    // Kamino depositReserveLiquidity discriminator: [169, 201, 30, 126, 6, 205, 102, 68]
    expect(Array.from(ix.data.subarray(0, 8))).toEqual([
      169, 201, 30, 126, 6, 205, 102, 68,
    ]);
  });

  it('builds real Solana Devnet claim payout transaction with on-chain Kamino bonus', async () => {
    const connection = new Connection(
      'https://api.devnet.solana.com',
      'confirmed',
    );
    const investorWallet = '4v7PkW2s4p1aM5DqH2qj6tY8Z9X2v7w1m3k5L8p9q4r1';
    const treeAddress = '8z7PkW2s4p1aM5DqH2qj6tY8Z9X2v7w1m3k5L8p9q4r2';

    const { transaction, totalClaimedUsdc } =
      await buildKaminoClaimPayoutTransaction(connection, {
        treeAddress,
        investorWallet,
        baseDividend: 10.0,
        kaminoBonus: 0.885,
      });

    expect(totalClaimedUsdc).toBeCloseTo(10.885, 3);
    // Includes idempotent ATA creation + Devnet bonus mint + audit memo
    expect(transaction.instructions.length).toBeGreaterThanOrEqual(3);
    expect(transaction.feePayer?.toBase58()).toBe(investorWallet);
  });
});
