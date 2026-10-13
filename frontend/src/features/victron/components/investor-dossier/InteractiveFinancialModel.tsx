import { useState } from 'react';
import type { FinancialVariant } from '../../types/investor-dossier';

interface InteractiveFinancialModelProps {
  variants: Record<'var-a' | 'var-b', FinancialVariant>;
  currency?: 'EUR' | 'USD' | 'CZK';
  currencySymbol?: string;
}

export function InteractiveFinancialModel({
  variants,
  currency = 'EUR',
  currencySymbol = '€',
}: InteractiveFinancialModelProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<'var-a' | 'var-b'>(
    'var-a',
  );
  const [withSubsidy, setWithSubsidy] = useState<boolean>(false);
  const [scenarioId, setScenarioId] = useState<
    'conservative' | 'realistic' | 'dynamic'
  >('realistic');

  const variant = variants[selectedVariantId];
  const scenario = variant.scenarios[scenarioId];

  const currentCapex = withSubsidy
    ? variant.capexSubsidy30Czk
    : variant.capexCommercialCzk;
  const currentPayback = withSubsidy
    ? scenario.paybackYearsWithSubsidy
    : scenario.paybackYearsNoSubsidy;
  const currentIrr = withSubsidy
    ? scenario.irr10yWithSubsidy
    : scenario.irr10yNoSubsidy;

  // Clean currency formatting
  const formatMln = (val: number) => {
    if (currency === 'CZK') {
      const eurMln = val / 25_000_000;
      const czkMln = val / 1_000_000;
      return `${eurMln >= 0 ? '+' : ''}€${eurMln.toFixed(2)}M (${czkMln.toFixed(1)}M CZK)`;
    }
    if (Math.abs(val) >= 1_000_000) {
      return `${val >= 0 ? '+' : ''}${currencySymbol}${(val / 1_000_000).toFixed(2)}M`;
    }
    if (Math.abs(val) >= 1_000) {
      return `${val >= 0 ? '+' : ''}${currencySymbol}${(val / 1_000).toFixed(1)}k`;
    }
    return `${val >= 0 ? '+' : ''}${currencySymbol}${val.toFixed(0)}`;
  };

  const formatCurrency = (val: number) => {
    if (currency === 'CZK') {
      const eur = val / 25;
      return `€${Math.round(eur).toLocaleString('en-US')} (${val.toLocaleString('cs-CZ')} CZK)`;
    }
    return `${currencySymbol}${val.toLocaleString('en-US')}`;
  };

  const formatShortValue = (val: number) => {
    if (currency === 'CZK') {
      return `€${(val / 25_000_000).toFixed(2)}M`;
    }
    if (val >= 1_000_000) {
      return `${currencySymbol}${(val / 1_000_000).toFixed(2)}M`;
    }
    if (val >= 1_000) {
      return `${currencySymbol}${(val / 1_000).toFixed(1)}k`;
    }
    return `${currencySymbol}${val.toFixed(0)}`;
  };

  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8 shadow-xs space-y-8">
      {/* 1. SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-black/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold tracking-[0.2em] text-t-blue uppercase">
              Financial Calculator & Investment Yield Model
            </span>
          </div>
          <h3 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
            Cash-Flow & Return Projections (ROI / IRR / NPV)
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-zinc-600 max-w-2xl">
            Simulate investment performance across hardware sizing
            configurations, factor in 30% green innovation subsidies, and
            evaluate 3 market development scenarios.
          </p>
        </div>

        {/* Subsidy Switcher Badge */}
        <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-2xl shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setWithSubsidy(false)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              !withSubsidy
                ? 'bg-white text-zinc-950 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Commercial (100% CapEx)
          </button>
          <button
            type="button"
            onClick={() => setWithSubsidy(true)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              withSubsidy
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            With 30% Grant Subsidy
          </button>
        </div>
      </div>

      {/* 2. VARIANT & SCENARIO TOGGLES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Variant Picker */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            1. Select Hardware Sizing Configuration:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSelectedVariantId('var-a')}
              className={`text-left p-3.5 rounded-2xl border transition cursor-pointer ${
                selectedVariantId === 'var-a'
                  ? 'border-t-blue bg-t-blue/5 text-zinc-950 shadow-2xs'
                  : 'border-black/10 bg-zinc-50/60 hover:bg-zinc-100/60 text-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-t-blue">
                  {variants['var-a'].code}
                </span>
                <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Fastest Payback
                </span>
              </div>
              <div className="mt-1 font-bold text-sm text-zinc-900 line-clamp-1">
                {variants['var-a'].capacityLabel}
              </div>
              <div className="text-[11px] text-zinc-500 line-clamp-1">
                {variants['var-a'].inverterRating}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedVariantId('var-b')}
              className={`text-left p-3.5 rounded-2xl border transition cursor-pointer ${
                selectedVariantId === 'var-b'
                  ? 'border-t-blue bg-t-blue/5 text-zinc-950 shadow-2xs'
                  : 'border-black/10 bg-zinc-50/60 hover:bg-zinc-100/60 text-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-t-blue">
                  {variants['var-b'].code}
                </span>
                <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  Maximum Profit
                </span>
              </div>
              <div className="mt-1 font-bold text-sm text-zinc-900 line-clamp-1">
                {variants['var-b'].capacityLabel}
              </div>
              <div className="text-[11px] text-zinc-500 line-clamp-1">
                {variants['var-b'].inverterRating}
              </div>
            </button>
          </div>
        </div>

        {/* Scenario Picker */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            2. Market & Offtake Scenario:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['conservative', 'realistic', 'dynamic'] as const).map((scId) => {
              const isSelected = scenarioId === scId;
              const sc = variant.scenarios[scId];
              return (
                <button
                  key={scId}
                  type="button"
                  onClick={() => setScenarioId(scId)}
                  className={`text-center p-3 rounded-2xl border transition cursor-pointer ${
                    isSelected
                      ? 'border-zinc-950 bg-zinc-950 text-white shadow-2xs'
                      : 'border-black/10 bg-zinc-50/60 hover:bg-zinc-100/60 text-zinc-700'
                  }`}
                >
                  <div className="font-bold text-xs">{sc.label}</div>
                  <div
                    className={`mt-1 font-mono text-[11px] ${
                      isSelected ? 'text-zinc-300' : 'text-zinc-500'
                    }`}
                  >
                    EBITDA {formatShortValue(sc.ebitdaCzk)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. KEY FINANCIAL METRICS RESULT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total CAPEX */}
        <div className="rounded-2xl border border-black/10 bg-zinc-50/80 p-4">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Total Turnkey CAPEX
          </span>
          <div className="mt-1.5 font-mono text-2xl font-black text-zinc-950">
            {formatShortValue(currentCapex)}
          </div>
          <span className="text-[11px] text-zinc-500">
            {withSubsidy
              ? 'After 30% Grant Subsidy'
              : '100% Commercial Project Cost'}
          </span>
        </div>

        {/* Clean EBITDA */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/60 p-4">
          <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
            Clean Annual EBITDA
          </span>
          <div className="mt-1.5 font-mono text-2xl font-black text-emerald-700">
            {formatShortValue(scenario.ebitdaCzk)} / yr
          </div>
          <span className="text-[11px] text-emerald-800/80">
            Net of aggregator & operating OPEX
          </span>
        </div>

        {/* Simple Payback */}
        <div className="rounded-2xl border border-t-blue/30 bg-t-blue/5 p-4">
          <span className="text-[11px] font-semibold text-t-blue uppercase tracking-wider">
            Simple Payback
          </span>
          <div className="mt-1.5 font-mono text-2xl font-black text-t-blue">
            {currentPayback.toFixed(2)} Years
          </div>
          <span className="text-[11px] text-zinc-500">
            {withSubsidy
              ? 'With 30% Grant Subsidy'
              : 'Unlevered 100% Commercial'}
          </span>
        </div>

        {/* 10-Yr Project IRR */}
        <div className="rounded-2xl border border-black/10 bg-zinc-50/80 p-4">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Project IRR (10 Years)
          </span>
          <div className="mt-1.5 font-mono text-2xl font-black text-zinc-950">
            {currentIrr.toFixed(1)}% p.a.
          </div>
          <span className="text-[11px] text-zinc-500">
            Equity IRR &gt; 35% with 70% project debt
          </span>
        </div>
      </div>

      {/* 4. ANNUAL REVENUE & COST BREAKDOWN ACCORDION */}
      <div className="rounded-2xl border border-black/10 p-5 bg-white space-y-3">
        <div className="flex items-center justify-between border-b border-black/5 pb-2 text-xs font-semibold text-zinc-700 uppercase tracking-wider">
          <span>Annual Cash-Flow Breakdown ({scenario.label} Scenario)</span>
          <span>Annual Run-Rate</span>
        </div>

        <div className="flex justify-between items-center text-xs py-1">
          <span className="text-zinc-600">
            A. Primary Off-Take & Grid Baseload Revenue
          </span>
          <strong className="font-mono text-zinc-950">
            {formatCurrency(scenario.svrRevenueCzk)} / yr
          </strong>
        </div>

        <div className="flex justify-between items-center text-xs py-1">
          <span className="text-zinc-600">
            B. Secondary Spot Arbitrage & Peak Flexibility Yield
          </span>
          <strong className="font-mono text-zinc-950">
            {formatCurrency(scenario.spotRevenueCzk)} / yr
          </strong>
        </div>

        <div className="flex justify-between items-center text-xs py-1.5 bg-zinc-50 px-2 rounded-lg font-medium">
          <span className="text-zinc-800">
            TOTAL GROSS ANNUAL RUN-RATE (A + B)
          </span>
          <strong className="font-mono text-zinc-950 font-bold">
            {formatCurrency(scenario.grossRevenueCzk)} / yr
          </strong>
        </div>

        <div className="flex justify-between items-center text-xs py-1 text-rose-700">
          <span>Aggregator / Management Fee & Cloud Dispatch</span>
          <strong className="font-mono font-bold">
            {formatCurrency(scenario.aggregatorFeeCzk)} / yr
          </strong>
        </div>

        <div className="flex justify-between items-center text-xs py-1 text-zinc-600">
          <span>
            Direct Operating Expenses (OPEX: warranty SLA, telemetry, servicing
            ~1.5% CAPEX)
          </span>
          <strong className="font-mono text-zinc-950">
            {formatCurrency(scenario.opexCzk)} / yr
          </strong>
        </div>

        <div className="flex justify-between items-center text-sm py-2 border-t border-black/10 font-bold">
          <span className="text-emerald-800">
            CLEAN ANNUAL OPERATING PROFIT (EBITDA)
          </span>
          <strong className="font-mono text-emerald-700 text-base">
            {formatCurrency(scenario.ebitdaCzk)} / yr
          </strong>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-black/5 text-xs text-zinc-500">
          <div>
            Net Present Value (NPV at 7% discount rate, 10 years):{' '}
            <strong className="font-mono text-zinc-900 font-bold">
              {formatMln(scenario.npv10yDiscount7PercentCzk)}
            </strong>
          </div>
          <div>
            10-Year Cumulative Clean Profit (after full CAPEX recovery):{' '}
            <strong className="font-mono text-emerald-700 font-bold">
              {formatMln(scenario.cumulative10yCleanProfitCzk)}
            </strong>
          </div>
        </div>
      </div>

      {/* 5. STRATEGIC PHASING HIGHLIGHT */}
      {Boolean(
        variant.phase2CapacityMwh &&
        variant.phase2CapacityMwh > 0 &&
        variant.phase2CapexCommercialCzk &&
        variant.phase2CapexCommercialCzk > 0,
      ) && (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-50/50 p-5 text-xs text-zinc-800 space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#183d89] text-[10px] font-bold text-white">
              P2
            </span>
            <h4 className="font-bold text-zinc-950 text-sm">
              Strategic Phased Expansion – Self-Funding Phase II via Operational
              Cash-Flow
            </h4>
          </div>
          <p className="leading-relaxed text-zinc-700">
            Phase I generates robust early cash flow, enabling Phase II
            expansion to be fully self-financed directly from operational
            proceeds within the first 18–24 months with zero external dilution.
          </p>
          <div className="rounded-xl bg-white p-3.5 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <strong className="text-zinc-950">
                Phase II Self-Financing Capability:
              </strong>
              <span className="block text-zinc-600">
                Phase I EBITDA covers Phase II CAPEX (
                {formatShortValue(variant.phase2CapexCommercialCzk ?? 0)})
                without requiring additional equity calls.
              </span>
            </div>
            <span className="font-mono text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
              0 New External Equity Required
            </span>
          </div>
        </div>
      )}

      {/* 6. 10-YEAR CASH-FLOW PROJECTION TABLE */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-zinc-950">
            10-Year Projected Cash-Flow Schedule (Year 0 to Year 10 ·{' '}
            {variant.name})
          </h4>
          <span className="text-[11px] font-mono text-zinc-500">
            Annual schedule in {currencySymbol}
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-black/10">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-zinc-50 border-b border-black/10 text-[11px] text-zinc-500 uppercase">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Metric</th>
                <th className="py-2.5 px-2 text-center">Y0</th>
                <th className="py-2.5 px-2 text-center">Y1</th>
                <th className="py-2.5 px-2 text-center">Y2</th>
                <th className="py-2.5 px-2 text-center">Y3</th>
                <th className="py-2.5 px-2 text-center">Y4</th>
                <th className="py-2.5 px-2 text-center">Y5</th>
                <th className="py-2.5 px-2 text-center">Y6</th>
                <th className="py-2.5 px-2 text-center">Y7</th>
                <th className="py-2.5 px-2 text-center">Y8</th>
                <th className="py-2.5 px-2 text-center">Y9</th>
                <th className="py-2.5 px-2 text-center">Y10</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 bg-white text-zinc-800">
              <tr>
                <td className="py-2 px-3 font-sans font-medium text-zinc-700">
                  Primary Offtake Revenue
                </td>
                {variant.cashFlow10y.map((row) => (
                  <td key={row.year} className="py-2 px-2 text-center">
                    {row.year === 0 ? '0.0' : row.svrRevenueMlnCzk.toFixed(1)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 px-3 font-sans font-medium text-zinc-700">
                  Secondary Arbitrage / Peak Yield
                </td>
                {variant.cashFlow10y.map((row) => (
                  <td key={row.year} className="py-2 px-2 text-center">
                    {row.year === 0 ? '0.0' : row.spotRevenueMlnCzk.toFixed(1)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 px-3 font-sans font-medium text-rose-700">
                  OPEX & Platform Fee
                </td>
                {variant.cashFlow10y.map((row) => (
                  <td
                    key={row.year}
                    className="py-2 px-2 text-center text-rose-700"
                  >
                    {row.year === 0
                      ? '0.0'
                      : row.opexAndAggregatorMlnCzk.toFixed(1)}
                  </td>
                ))}
              </tr>
              <tr className="bg-zinc-50 font-bold">
                <td className="py-2 px-3 font-sans text-emerald-800">
                  Annual Net Cash Flow (EBITDA)
                </td>
                {variant.cashFlow10y.map((row) => (
                  <td
                    key={row.year}
                    className={`py-2 px-2 text-center ${
                      row.year === 0 ? 'text-zinc-500' : 'text-emerald-700'
                    }`}
                  >
                    {row.year === 0 ? '-' : `+${row.ebitdaMlnCzk.toFixed(1)}`}
                  </td>
                ))}
              </tr>
              <tr className="font-bold border-t border-black/10">
                <td className="py-2 px-3 font-sans text-zinc-900">
                  Cumulative CF (100% Commercial)
                </td>
                {variant.cashFlow10y.map((row) => {
                  const isPositive = row.cumCfNoSubsidyMlnCzk >= 0;
                  return (
                    <td
                      key={row.year}
                      className={`py-2 px-2 text-center ${
                        isPositive ? 'text-emerald-700' : 'text-zinc-500'
                      }`}
                    >
                      {row.cumCfNoSubsidyMlnCzk > 0 ? '+' : ''}
                      {row.cumCfNoSubsidyMlnCzk.toFixed(1)}
                    </td>
                  );
                })}
              </tr>
              <tr className="font-bold bg-emerald-50/50">
                <td className="py-2 px-3 font-sans text-emerald-900">
                  Cumulative CF (With 30% Subsidy)
                </td>
                {variant.cashFlow10y.map((row) => {
                  const isPositive = row.cumCfWithSubsidyMlnCzk >= 0;
                  return (
                    <td
                      key={row.year}
                      className={`py-2 px-2 text-center ${
                        isPositive ? 'text-emerald-700' : 'text-zinc-500'
                      }`}
                    >
                      {row.cumCfWithSubsidyMlnCzk > 0 ? '+' : ''}
                      {row.cumCfWithSubsidyMlnCzk.toFixed(1)}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] text-zinc-500 pt-1">
          <span>
            Breakeven without subsidy:{' '}
            <strong className="text-zinc-900">
              {variant.scenarios.realistic.paybackYearsNoSubsidy} Years
            </strong>{' '}
            | With 30% Grant:{' '}
            <strong className="text-[#183d89]">
              {variant.scenarios.realistic.paybackYearsWithSubsidy} Years
            </strong>
          </span>
          <span>
            Asset design life: 15–20 Years (5–10 additional years of clean cash
            flow beyond 10-year warranty)
          </span>
        </div>
      </div>
    </div>
  );
}
