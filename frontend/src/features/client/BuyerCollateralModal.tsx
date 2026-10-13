import { useState, useEffect, useCallback } from 'react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useConnectedWallet } from '../wallet/use-connected-wallet';
import { UniversalPopup } from '../fintech/UniversalPopup';
import { CheckIcon, ExternalLinkIcon } from '../victron/victron-icons';
import { useClientCollateral } from './use-client-collateral';
import {
  REQUIRED_COLLATERAL_SOL,
  DEMO_COLLATERAL_SOL,
  MSOL_PER_SOL_RATE,
  MARINADE_STAKING_APY,
  buildCollateralDepositTransaction,
  simulateCollateralDepositOnDevnet,
  getRealMsolBalance,
  requestDevnetAirdrop,
  getLiveMarinadeState,
} from '../../chain/marinade';
import { requestWalletApproval } from '../../chain/wallet-action';

interface BuyerCollateralModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetTitle?: string;
  assetCategory?: string;
  treeId?: string;
  onSuccess?: () => void;
}

export function BuyerCollateralModal(props: BuyerCollateralModalProps) {
  if (!props.isOpen) return null;
  return <BuyerCollateralModalContent key="open" {...props} />;
}

function BuyerCollateralModalContent({
  isOpen,
  onClose,
  assetTitle = 'Clean Energy Infrastructure (BESS / Solar Tree / EV Hub)',
  assetCategory = 'Industrial Off-Taker PPA',
  treeId = '1',
  onSuccess,
}: BuyerCollateralModalProps) {
  const { connection } = useConnection();
  const wallet = useConnectedWallet();
  const { setVisible: openWalletModal } = useWalletModal();
  const { depositCollateral, refreshOnChainBalance } = useClientCollateral(
    wallet?.address,
  );

  const [step, setStep] = useState<'input' | 'confirming' | 'success'>('input');
  const [selectedSolAmount, setSelectedSolAmount] =
    useState<number>(DEMO_COLLATERAL_SOL);
  const [walletSolBalance, setWalletSolBalance] = useState<number | null>(null);
  const [isAirdropping, setIsAirdropping] = useState(false);
  const [liveYieldTicks, setLiveYieldTicks] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedTxSig, setConfirmedTxSig] = useState<string | null>(null);
  const [confirmedMsolAta, setConfirmedMsolAta] = useState<string | null>(null);
  const [actualMintedMsol, setActualMintedMsol] = useState<number | null>(null);
  const [liveMsolPrice, setLiveMsolPrice] = useState<number>(
    1 / MSOL_PER_SOL_RATE,
  );

  const fetchWalletBalance = useCallback(async () => {
    if (!wallet?.address || !connection) {
      setWalletSolBalance(null);
      return;
    }
    try {
      const lamports = await connection.getBalance(
        new PublicKey(wallet.address),
        'confirmed',
      );
      setWalletSolBalance(lamports / LAMPORTS_PER_SOL);
    } catch {
      setWalletSolBalance(null);
    }
  }, [wallet, connection]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchWalletBalance();
      void getLiveMarinadeState(connection)
        .then((state) => {
          setLiveMsolPrice(state.mSolPrice);
        })
        .catch(() => {});
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchWalletBalance, connection]);

  useEffect(() => {
    if (step !== 'success') return;
    const interval = setInterval(() => {
      setLiveYieldTicks((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const solAmount = selectedSolAmount;
  const msolRate = liveMsolPrice > 0 ? 1 / liveMsolPrice : MSOL_PER_SOL_RATE;
  const msolAmount =
    actualMintedMsol ?? Number((solAmount * msolRate).toFixed(4));
  const annualEarnedSol = (solAmount * MARINADE_STAKING_APY).toFixed(3);
  const annualEarnedMsol = (msolAmount * MARINADE_STAKING_APY).toFixed(4);

  const streamingMsolCents = (
    (parseFloat(annualEarnedMsol) / (365 * 24 * 3600)) *
    (liveYieldTicks + 1)
  ).toFixed(6);

  // 1. Devnet Faucet Airdrop
  const handleAirdrop = async () => {
    if (!wallet?.address) return;
    setIsAirdropping(true);
    setErrorMessage(null);
    try {
      await requestDevnetAirdrop(connection, new PublicKey(wallet.address), 1);
      await fetchWalletBalance();
    } catch (err: unknown) {
      console.warn('Airdrop failed:', err);
      setErrorMessage(
        'Devnet airdrop rate limit reached. If your balance is low, you can select 0.1 SOL or use the 1-Click Simulation.',
      );
    } finally {
      setIsAirdropping(false);
    }
  };

  // 2. Devnet Simulation (Guaranteed smooth demo mode)
  const handleSimulateDevnet = async () => {
    setErrorMessage(null);
    setSelectedSolAmount(REQUIRED_COLLATERAL_SOL);
    setStep('confirming');

    try {
      const clientAddress =
        wallet?.address || 'HostDemoWallet111111111111111111111111111';

      const sim = await simulateCollateralDepositOnDevnet(connection, {
        clientAddress,
        solAmount: REQUIRED_COLLATERAL_SOL,
      });

      const txSig = sim.signature;
      const position = depositCollateral({
        treeId,
        treeTitle: assetTitle,
        solAmount: REQUIRED_COLLATERAL_SOL,
        msolAmount: sim.msolAmount,
        isSimulated: true,
        txSignature: txSig,
      });

      setConfirmedTxSig(txSig);
      setActualMintedMsol(position.msolAmount);

      setTimeout(() => {
        setStep('success');
      }, 700);
    } catch (err: unknown) {
      console.warn('Simulation error:', err);
      const fallbackMsol = Number(
        (REQUIRED_COLLATERAL_SOL * MSOL_PER_SOL_RATE).toFixed(4),
      );
      depositCollateral({
        treeId,
        treeTitle: assetTitle,
        solAmount: REQUIRED_COLLATERAL_SOL,
        msolAmount: fallbackMsol,
        isSimulated: true,
      });
      setActualMintedMsol(fallbackMsol);
      setStep('success');
    }
  };

  // 3. Real On-Chain Devnet Transaction with Marinade TS SDK
  const handleRealDevnetDeposit = async () => {
    if (!wallet) {
      openWalletModal(true);
      return;
    }

    setErrorMessage(null);
    setStep('confirming');

    try {
      const { transaction, associatedMSolTokenAccountAddress } =
        await buildCollateralDepositTransaction(connection, {
          clientAddress: wallet.address,
          solAmount,
        });

      try {
        const approval = await requestWalletApproval({
          connection,
          wallet,
          transaction,
          actionName: 'marinade_liquid_stake_collateral',
          memoPayload: {
            asset: assetTitle,
            category: assetCategory,
            tree_id: treeId,
            sol_amount: solAmount,
            msol_ata: associatedMSolTokenAccountAddress.toBase58(),
          },
        });

        const sig = approval.signature;
        setConfirmedTxSig(sig);
        setConfirmedMsolAta(associatedMSolTokenAccountAddress.toBase58());

        // Fetch real on-chain mSOL balance minted by Marinade
        let mintedMsol = msolAmount;
        try {
          const res = await getRealMsolBalance(
            connection,
            new PublicKey(wallet.address),
          );
          if (res.uiAmount > 0) {
            mintedMsol = res.uiAmount;
          }
        } catch {
          // fallback
        }
        setActualMintedMsol(mintedMsol);

        depositCollateral({
          treeId,
          treeTitle: assetTitle,
          solAmount,
          msolAmount: mintedMsol,
          isSimulated: false,
          txSignature: sig,
          msolAta: associatedMSolTokenAccountAddress.toBase58(),
        });

        await refreshOnChainBalance();
        await fetchWalletBalance();
        setStep('success');
      } catch (txErr: unknown) {
        console.warn('Wallet signing failed or rejected:', txErr);
        const errStr = txErr instanceof Error ? txErr.message : String(txErr);
        if (errStr.includes('cancelled') || errStr.includes('rejected')) {
          setErrorMessage('Transaction was cancelled in wallet.');
          setStep('input');
        } else {
          setErrorMessage(
            `Transaction failed: ${errStr}. You can retry or use 1-Click Simulation.`,
          );
          setStep('input');
        }
      }
    } catch (err: unknown) {
      console.error('Error building Marinade transaction:', err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Failed to initialize Marinade deposit',
      );
      setStep('input');
    }
  };

  // STEP 2: CONFIRMING STATE
  if (step === 'confirming') {
    return (
      <UniversalPopup
        isOpen={isOpen}
        onClose={onClose}
        icon={
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 ring-4 ring-blue-100/60 shadow-xs">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#183d89] border-t-transparent" />
          </div>
        }
        tag="MARINADE FINANCE LIQUID STAKING · SOLANA DEVNET"
        title={`Staking ${solAmount} SOL with Marinade…`}
        description="Executing liquid staking deposit via Marinade Protocol and minting authentic mSOL tokens to your wallet."
        mainPoint={
          <div className="space-y-2 py-2 text-xs font-mono text-zinc-600">
            <div className="flex items-center justify-between text-zinc-900 font-semibold">
              <span>1. Zero-CAPEX Agreement</span>
              <span className="text-[#183d89]">Approved (€0 Capex)</span>
            </div>
            <div className="flex items-center justify-between text-[#183d89] font-semibold">
              <span>2. Marinade Liquid Stake CPI</span>
              <span>Staking {solAmount} SOL…</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>3. mSOL Token Account</span>
              <span>Minting ~{msolAmount} mSOL…</span>
            </div>
          </div>
        }
        primaryButton={{
          label: 'Staking in Progress…',
          onClick: () => {},
          isLoading: true,
          disabled: true,
        }}
      />
    );
  }

  // STEP 3: SUCCESS STATE
  if (step === 'success') {
    const isRealTx =
      confirmedTxSig &&
      !confirmedTxSig.startsWith('devnet_sim') &&
      !confirmedTxSig.startsWith('sim_');
    return (
      <UniversalPopup
        isOpen={isOpen}
        onClose={onClose}
        icon={
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#183d89] text-white shadow-md shadow-blue-900/20">
            <CheckIcon className="h-8 w-8" />
          </div>
        }
        tag={
          isRealTx
            ? 'CONFIRMED ON SOLANA DEVNET · MARINADE PROTOCOL'
            : 'COLLATERAL STAKED IN MARINADE'
        }
        title="Hardware Approved for 100% Free!"
        description={`Your ${solAmount} SOL collateral is actively staked in Marinade. You hold ~${msolAmount} mSOL earning 7.82% APY.`}
        mainPoint={
          <div className="space-y-3 text-center py-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#183d89] border border-blue-100">
              <span className="h-1.5 w-1.5 rounded-full bg-[#183d89] animate-pulse" />
              <span>MARINADE LIQUID STAKING ACTIVE</span>
            </div>
            <div className="font-mono text-3xl sm:text-4xl font-bold text-zinc-950 tracking-tight pt-1">
              {msolAmount}{' '}
              <span className="text-xs text-zinc-500 font-normal font-sans">
                mSOL
              </span>
            </div>
            <div className="font-mono text-xs font-semibold text-[#183d89]">
              +{streamingMsolCents} mSOL continuous streaming yield
            </div>
            <div className="rounded-xl bg-zinc-50 border border-zinc-200/60 px-3 py-1.5 text-[11px] text-zinc-600 flex items-center justify-between font-mono">
              <span>Backed by Staked Principal:</span>
              <strong className="text-zinc-950">
                {solAmount} SOL (1 mSOL ≈ {(solAmount / msolAmount).toFixed(4)}{' '}
                SOL)
              </strong>
            </div>

            {/* On-Chain Proofs */}
            <div className="pt-2 border-t border-zinc-200/60 text-[11px] text-zinc-500 space-y-1.5 text-left">
              <div className="flex justify-between">
                <span>Hardware Cost:</span>
                <span className="font-bold text-zinc-950">
                  €0.00 (100% Free Capex)
                </span>
              </div>
              <div className="flex justify-between">
                <span>Off-taker Obligation:</span>
                <span className="font-bold text-[#183d89]">
                  Pay only for energy (€0.24/kWh)
                </span>
              </div>
              {confirmedTxSig && (
                <div className="flex justify-between items-center pt-1">
                  <span>Solana Transaction:</span>
                  {isRealTx ? (
                    <a
                      href={`https://solscan.io/tx/${confirmedTxSig}?cluster=devnet`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[#183d89] hover:underline inline-flex items-center gap-1 font-semibold"
                    >
                      <span>
                        {confirmedTxSig.slice(0, 8)}…{confirmedTxSig.slice(-6)}
                      </span>
                      <ExternalLinkIcon className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="font-mono text-zinc-600">
                      Simulated Demo
                    </span>
                  )}
                </div>
              )}
              {confirmedMsolAta && (
                <div className="flex justify-between items-center">
                  <span>mSOL Token Account:</span>
                  <a
                    href={`https://solscan.io/account/${confirmedMsolAta}?cluster=devnet`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[#183d89] hover:underline inline-flex items-center gap-1 font-semibold"
                  >
                    <span>
                      {confirmedMsolAta.slice(0, 8)}…
                      {confirmedMsolAta.slice(-6)}
                    </span>
                    <ExternalLinkIcon className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        }
        primaryButton={{
          label: 'View Host Dashboard →',
          onClick: () => {
            onClose();
            onSuccess?.();
            window.location.hash = '#client';
          },
        }}
        secondaryButton={{
          label: 'Done',
          onClick: onClose,
        }}
      />
    );
  }

  // STEP 1: INPUT STATE
  return (
    <UniversalPopup
      isOpen={isOpen}
      onClose={onClose}
      icon={
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#183d89] text-white shadow-md shadow-blue-900/20">
          <span className="font-mono text-2xl font-black">M</span>
        </div>
      }
      tag="ZERO-CAPEX HARDWARE ESCROW · MARINADE STAKING"
      title="Post Staked Collateral"
      description="Host commercial clean energy at €0 upfront CAPEX. Your SOL is staked into Marinade mSOL at 7.82% APY to secure the agreement."
      mainPoint={
        <div className="space-y-3 text-center py-2">
          {/* Centered Marinade Status Pill */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#183d89] border border-blue-100">
            <span className="h-1.5 w-1.5 rounded-full bg-[#183d89] animate-pulse" />
            <span>MARINADE LIQUID STAKING</span>
          </div>

          {/* Big Bold Receipt Preview */}
          <div className="font-mono text-3xl sm:text-4xl font-bold text-zinc-950 tracking-tight pt-1">
            {msolAmount}{' '}
            <span className="text-xs text-zinc-500 font-normal font-sans">
              mSOL
            </span>
          </div>
          <div className="font-mono text-xs font-semibold text-[#183d89]">
            +7.82% native APY (+{annualEarnedSol} SOL/yr)
          </div>

          {/* Clean Segmented Tier Selector */}
          <div className="pt-1 text-left">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 mb-1.5">
              <span>Select Collateral Tier</span>
              {walletSolBalance !== null ? (
                <div className="flex items-center gap-1.5">
                  <span>
                    Balance:{' '}
                    <strong className="text-zinc-950 font-bold">
                      {walletSolBalance.toFixed(2)} SOL
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleAirdrop}
                    disabled={isAirdropping}
                    className="text-[#183d89] hover:underline font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {isAirdropping ? '…' : '+1'}
                  </button>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-zinc-100/90 border border-zinc-200/80 font-mono text-xs">
              <button
                type="button"
                onClick={() => setSelectedSolAmount(DEMO_COLLATERAL_SOL)}
                className={`py-1.5 rounded-lg font-semibold transition cursor-pointer text-center ${
                  selectedSolAmount === DEMO_COLLATERAL_SOL
                    ? 'bg-white text-zinc-950 shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                0.1 SOL
              </button>
              <button
                type="button"
                onClick={() => setSelectedSolAmount(1)}
                className={`py-1.5 rounded-lg font-semibold transition cursor-pointer text-center ${
                  selectedSolAmount === 1
                    ? 'bg-white text-zinc-950 shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                1.0 SOL
              </button>
              <button
                type="button"
                onClick={() => setSelectedSolAmount(REQUIRED_COLLATERAL_SOL)}
                className={`py-1.5 rounded-lg font-semibold transition cursor-pointer text-center ${
                  selectedSolAmount === REQUIRED_COLLATERAL_SOL
                    ? 'bg-white text-zinc-950 shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                100 SOL
              </button>
            </div>
          </div>

          {/* Clean On-Chain Spec Rows - No multi-line wrap */}
          <div className="pt-2 border-t border-zinc-200/60 text-[11px] text-zinc-500 space-y-1.5 text-left">
            <div className="flex justify-between">
              <span>Hardware CAPEX:</span>
              <span className="font-bold text-zinc-950">€0.00 (100% Free)</span>
            </div>
            <div className="flex justify-between">
              <span>Power Consumption:</span>
              <span className="font-bold text-[#183d89]">
                Metered €0.24 / kWh
              </span>
            </div>
            <div className="flex justify-between">
              <span>Staking Route:</span>
              <span className="font-mono text-zinc-700">
                Marinade Liquid Staking
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-xl bg-zinc-100 border border-zinc-200 p-2.5 text-xs text-zinc-800">
              {errorMessage}
            </div>
          )}
        </div>
      }
      primaryButton={{
        label: !wallet
          ? 'Connect Wallet to Post Collateral'
          : `Stake ${solAmount} SOL via Marinade on Devnet →`,
        onClick: !wallet
          ? () => openWalletModal(true)
          : handleRealDevnetDeposit,
      }}
      secondaryButton={{
        label: 'Simulate 100 SOL (1-Click Demo Mode)',
        onClick: handleSimulateDevnet,
      }}
      footerNote="Solana Devnet · Marinade Liquid Staking · Redeemable at PPA completion"
    />
  );
}
