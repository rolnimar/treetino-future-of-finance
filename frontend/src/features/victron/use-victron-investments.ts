import { useSyncExternalStore, useCallback } from 'react';

export interface InvestmentRecord {
  amountUsdc: number;
  investedAt: number;
  lastClaimedAt: number;
  totalClaimedUsdc: number;
  totalKaminoBonusClaimed?: number;
  kaminoAutoCompound?: boolean;
}

export type InvestmentsMap = Record<number, InvestmentRecord>;

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

function safeParse(json: string | null): InvestmentsMap {
  if (!json) return {};
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export function useVictronInvestments(walletAddress: string | undefined) {
  const storageKey = walletAddress
    ? `treetino_victron_investments_${walletAddress}`
    : 'treetino_victron_investments_guest';

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
  const investments = safeParse(rawJson);

  const invest = useCallback(
    (siteId: number, amountUsdc: number) => {
      if (amountUsdc <= 0) return;
      const current = safeParse(localStorage.getItem(storageKey));

      const existing = current[siteId] ?? {
        amountUsdc: 0,
        investedAt: Date.now(),
        lastClaimedAt: Date.now() - 37.5 * 3600 * 1000,
        totalClaimedUsdc: 0,
      };

      const updated: InvestmentsMap = {
        ...current,
        [siteId]: {
          amountUsdc: existing.amountUsdc + amountUsdc,
          investedAt:
            existing.amountUsdc > 0 ? existing.investedAt : Date.now(),
          lastClaimedAt: existing.lastClaimedAt,
          totalClaimedUsdc: existing.totalClaimedUsdc,
        },
      };

      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }
      notify();
    },
    [storageKey],
  );

  const claimYield = useCallback(
    (siteId: number, amountUsdc: number, kaminoBonusUsdc: number = 0) => {
      if (amountUsdc <= 0 && kaminoBonusUsdc <= 0) return;
      const current = safeParse(localStorage.getItem(storageKey));
      const existing = current[siteId];
      if (!existing) return;

      const totalPayout = amountUsdc + kaminoBonusUsdc;
      const updated: InvestmentsMap = {
        ...current,
        [siteId]: {
          ...existing,
          lastClaimedAt: Date.now(),
          totalClaimedUsdc: (existing.totalClaimedUsdc || 0) + totalPayout,
          totalKaminoBonusClaimed:
            (existing.totalKaminoBonusClaimed || 0) + kaminoBonusUsdc,
        },
      };

      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }
      notify();
    },
    [storageKey],
  );

  return {
    investments,
    invest,
    claimYield,
  };
}
