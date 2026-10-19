import { useState, useEffect, useSyncExternalStore, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useConnection } from '@solana/wallet-adapter-react';
import {
  REQUIRED_COLLATERAL_SOL,
  MSOL_PER_SOL_RATE,
  MARINADE_STAKING_APY,
  getRealMsolBalance,
  getLiveMarinadeState,
  getAssociatedMsolAddress,
} from '../../chain/marinade';

export interface CollateralPosition {
  id: string;
  clientWallet: string;
  treeId: string;
  treeTitle: string;
  solAmount: number;
  msolAmount: number;
  stakedAt: number;
  marinadeApy: number;
  status: 'active' | 'unstaked';
  txSignature: string;
  isSimulated: boolean;
  isOnChainVerified?: boolean;
  msolAta?: string;
  tariffKwhUsd: number;
  kwhConsumed: number;
  paidUsd: number;
}

export type CollateralStore = Record<string, CollateralPosition>;

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

function safeParse(json: string | null): CollateralStore {
  if (!json) return {};
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export function useClientCollateral(clientWalletAddress?: string) {
  const { connection } = useConnection();
  const storageKey = clientWalletAddress
    ? `treetino_client_collateral_${clientWalletAddress}`
    : 'treetino_client_collateral_default';

  const subscribe = useCallback(
    (listener: () => void) => {
      listeners.add(listener);
      const onStorage = (e: StorageEvent) => {
        if (e.key === storageKey) listener();
      };
      window.addEventListener('storage', onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', onStorage);
      };
    },
    [storageKey],
  );

  const getSnapshot = useCallback(() => {
    return localStorage.getItem(storageKey) || '{}';
  }, [storageKey]);

  const rawJson = useSyncExternalStore(subscribe, getSnapshot, () => '{}');
  const store = safeParse(rawJson);
  const positions = Object.values(store);
  const activePosition = positions.find((p) => p.status === 'active') ?? null;

  // Real-time on-chain mSOL balance and protocol APY
  const [onChainMsolBalance, setOnChainMsolBalance] = useState<number | null>(
    null,
  );
  const [liveApy, setLiveApy] = useState<number>(MARINADE_STAKING_APY);
  const [livePrice, setLivePrice] = useState<number>(1 / MSOL_PER_SOL_RATE);

  const refreshOnChainBalance = useCallback(async () => {
    if (!clientWalletAddress || !connection) return;
    try {
      const pubkey = new PublicKey(clientWalletAddress);
      const res = await getRealMsolBalance(connection, pubkey);
      setOnChainMsolBalance(res.uiAmount);

      const state = await getLiveMarinadeState(connection);
      setLiveApy(state.stakingApy);
      setLivePrice(state.mSolPrice);

      // If active position is real and on-chain balance is found, update mSOL amount
      if (activePosition && !activePosition.isSimulated && res.uiAmount > 0) {
        if (Math.abs(activePosition.msolAmount - res.uiAmount) > 0.0001) {
          const current = safeParse(localStorage.getItem(storageKey));
          if (current[activePosition.id]) {
            current[activePosition.id].msolAmount = res.uiAmount;
            current[activePosition.id].isOnChainVerified = true;
            localStorage.setItem(storageKey, JSON.stringify(current));
            notify();
          }
        }
      }
    } catch (err) {
      console.warn('Could not query on-chain mSOL balance:', err);
    }
  }, [clientWalletAddress, connection, activePosition, storageKey]);

  // Initial and periodic on-chain balance check (every 10s)
  useEffect(() => {
    const timer = setTimeout(() => {
      void refreshOnChainBalance();
    }, 0);
    const interval = setInterval(() => {
      void refreshOnChainBalance();
    }, 10000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [refreshOnChainBalance]);

  // Real-time ticking counter for continuous epoch streaming yield
  const [ticker, setTicker] = useState(0);
  const [currentTimestamp, setCurrentTimestamp] = useState(() => Date.now());

  useEffect(() => {
    if (!activePosition) return;
    const interval = setInterval(() => {
      setTicker((t) => t + 1);
      setCurrentTimestamp(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [activePosition]);

  // Calculate live accrued mSOL staking yield
  let accruedMsol = 0;
  if (activePosition) {
    const elapsedSeconds = Math.max(
      1,
      Math.floor((currentTimestamp - activePosition.stakedAt) / 1000),
    );
    const msolAmount =
      onChainMsolBalance &&
      !activePosition.isSimulated &&
      onChainMsolBalance > 0
        ? onChainMsolBalance
        : activePosition.msolAmount;
    const msolPerSecond =
      (msolAmount * (activePosition.marinadeApy || liveApy)) /
      (365 * 24 * 3600);
    accruedMsol = msolPerSecond * elapsedSeconds;
  }

  const depositCollateral = useCallback(
    (params: {
      treeId?: string;
      treeTitle?: string;
      solAmount?: number;
      msolAmount?: number;
      isSimulated?: boolean;
      txSignature?: string;
      msolAta?: string;
    }) => {
      const sol = params.solAmount ?? REQUIRED_COLLATERAL_SOL;
      const msol =
        params.msolAmount ?? Number((sol * MSOL_PER_SOL_RATE).toFixed(4));
      const posId = `pos_${Date.now()}`;
      const wallet =
        clientWalletAddress || 'DemoHostWallet11111111111111111111111111';

      let msolAta = params.msolAta;
      if (!msolAta && clientWalletAddress) {
        try {
          msolAta = getAssociatedMsolAddress(
            new PublicKey(clientWalletAddress),
          ).toBase58();
        } catch {
          // ignore
        }
      }

      const newPosition: CollateralPosition = {
        id: posId,
        clientWallet: wallet,
        treeId: params.treeId || '1',
        treeTitle:
          params.treeTitle ||
          'Treetino Biomimetic Solar Tree #01 (Zero-CAPEX Host PPA)',
        solAmount: sol,
        msolAmount: msol,
        stakedAt: Date.now(),
        marinadeApy: liveApy || MARINADE_STAKING_APY,
        status: 'active',
        txSignature:
          params.txSignature ||
          `devnet_sim_${Date.now().toString(16)}_marinade_${sol}sol`,
        isSimulated: params.isSimulated ?? false,
        isOnChainVerified: !params.isSimulated,
        msolAta,
        tariffKwhUsd: 0.24, // USDC 0.24 / kWh metered energy rate
        kwhConsumed: 185.5, // Initial metered energy from telemetry
        paidUsd: 0,
      };

      const current = safeParse(localStorage.getItem(storageKey));
      const updated: CollateralStore = {
        ...current,
        [posId]: newPosition,
      };

      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (err) {
        console.error('Storage error:', err);
      }
      notify();
      return newPosition;
    },
    [clientWalletAddress, storageKey, liveApy],
  );

  const simulateEnergyUsage = useCallback(
    (additionalKwh: number = 25.4) => {
      if (!activePosition) return;
      const current = safeParse(localStorage.getItem(storageKey));
      const pos = current[activePosition.id];
      if (!pos) return;

      const updated: CollateralStore = {
        ...current,
        [activePosition.id]: {
          ...pos,
          kwhConsumed: Number((pos.kwhConsumed + additionalKwh).toFixed(2)),
        },
      };

      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (err) {
        console.error('Storage error:', err);
      }
      notify();
    },
    [activePosition, storageKey],
  );

  const payEnergyBill = useCallback(
    (amountUsd: number) => {
      if (!activePosition) return;
      const current = safeParse(localStorage.getItem(storageKey));
      const pos = current[activePosition.id];
      if (!pos) return;

      const updated: CollateralStore = {
        ...current,
        [activePosition.id]: {
          ...pos,
          paidUsd: Number((pos.paidUsd + amountUsd).toFixed(2)),
        },
      };

      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (err) {
        console.error('Storage error:', err);
      }
      notify();
    },
    [activePosition, storageKey],
  );

  const unstakeCollateral = useCallback(
    (id: string) => {
      const current = safeParse(localStorage.getItem(storageKey));
      const pos = current[id];
      if (!pos) return;

      const updated: CollateralStore = {
        ...current,
        [id]: {
          ...pos,
          status: 'unstaked',
        },
      };

      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (err) {
        console.error('Storage error:', err);
      }
      notify();
    },
    [storageKey],
  );

  const resetDemo = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore
    }
    notify();
  }, [storageKey]);

  return {
    positions,
    activePosition,
    hasActiveCollateral: !!activePosition,
    onChainMsolBalance,
    liveApy,
    livePrice,
    accruedMsol,
    depositCollateral,
    simulateEnergyUsage,
    payEnergyBill,
    unstakeCollateral,
    resetDemo,
    refreshOnChainBalance,
    ticker,
  };
}
