import type { ReactNode } from 'react';
import { TrendUpIcon } from '../victron-icons';

export interface SummaryMetricItem {
  label: string;
  value: string;
  subtext: string;
  icon?: ReactNode;
}

export interface FlowSummaryBannerProps {
  generation: SummaryMetricItem;
  consumption: SummaryMetricItem;
  revenueOrSavings: SummaryMetricItem;
  investorYield: {
    apyPercent: number;
    annualDistribution: string;
    subtext?: string;
  };
}

export function FlowSummaryBanner({
  generation,
  consumption,
  revenueOrSavings,
  investorYield,
}: FlowSummaryBannerProps) {
  return (
    <div className="rounded-2xl border border-black/10 bg-zinc-50/80 p-5 text-xs shadow-2xs">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-black/10">
        {/* Metric 1: Clean Generation */}
        <div className="sm:pr-4">
          <span className="font-mono text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
            {generation.label}
          </span>
          <div className="mt-1 font-mono text-xl font-black text-zinc-950">
            {generation.value}
          </div>
          <p className="mt-0.5 text-[11px] text-zinc-600">
            {generation.subtext}
          </p>
        </div>

        {/* Metric 2: Primary Consumption */}
        <div className="pt-2 sm:pt-0 sm:px-4">
          <span className="font-mono text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
            {consumption.label}
          </span>
          <div className="mt-1 font-mono text-xl font-black text-zinc-950">
            {consumption.value}
          </div>
          <p className="mt-0.5 text-[11px] text-zinc-600">
            {consumption.subtext}
          </p>
        </div>

        {/* Metric 3: Economic Run-Rate */}
        <div className="pt-2 sm:pt-0 sm:px-4">
          <span className="font-mono text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
            {revenueOrSavings.label}
          </span>
          <div className="mt-1 font-mono text-xl font-black text-t-blue">
            {revenueOrSavings.value}
          </div>
          <p className="mt-0.5 text-[11px] text-zinc-600">
            {revenueOrSavings.subtext}
          </p>
        </div>

        {/* Metric 4: Investor Yield Stream */}
        <div className="pt-2 sm:pt-0 sm:pl-4">
          <span className="font-mono text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
            Tokenholder Distribution
          </span>
          <div className="mt-1 font-mono text-xl font-black text-t-blue flex items-center gap-1.5">
            <TrendUpIcon className="h-4 w-4 text-t-accent" />
            <span>{investorYield.apyPercent}% APY</span>
            <span className="text-xs font-normal text-zinc-500">
              (€{investorYield.annualDistribution} / yr)
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-zinc-600">
            {investorYield.subtext ||
              'Direct programmatic yield distributions on Solana'}
          </p>
        </div>
      </div>
    </div>
  );
}
