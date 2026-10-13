import { useState, useId } from 'react';
import { ArrowRightIcon, TrendUpIcon, ShieldCheckIcon } from '../victron-icons';

interface CompoundingYieldCalculatorProps {
  initialApy?: number;
  assetTitle?: string;
  onBackProject?: () => void;
  className?: string;
  dark?: boolean;
}

export type StrategyMode = 'conservative' | 'contracted' | 'arbitrage';

export function CompoundingYieldCalculator({
  initialApy = 18.5,
  assetTitle = 'Solar EV Fast-Charging Hub',
  onBackProject,
  className = '',
  dark = false,
}: CompoundingYieldCalculatorProps) {
  const [strategyMode, setStrategyMode] = useState<StrategyMode>('contracted');
  const [years, setYears] = useState<number>(10);
  const [monthlyDepositEur, setMonthlyDepositEur] = useState<number>(100);
  const [hoverYear, setHoverYear] = useState<number | null>(null);

  // Format currency helper - strictly EUR only
  const formatVal = (amountEur: number, compact: boolean = false) => {
    if (compact && amountEur >= 1000) {
      return `€${(amountEur / 1000).toFixed(amountEur >= 10000 ? 0 : 1)}k`;
    }
    return `€${Math.round(amountEur).toLocaleString('en-US')}`;
  };

  // Derive APY multiplier from selected strategy mode
  const apyMultiplier =
    strategyMode === 'conservative'
      ? 0.65
      : strategyMode === 'arbitrage'
        ? 1.25
        : 1.0;

  const effectiveExpectedApy = initialApy * apyMultiplier;
  const effectiveOptimisticApy = initialApy * 1.25;
  const effectiveConservativeApy = initialApy * 0.65;

  const months = years * 12;

  // Annuity future value formula: FV = P * ((1 + r)^n - 1) / r
  const calcFv = (
    monthlyDeposit: number,
    apyPercent: number,
    totalMonths: number,
  ) => {
    if (totalMonths <= 0) return 0;
    const monthlyRate = apyPercent / 100 / 12;
    if (monthlyRate <= 0) return monthlyDeposit * totalMonths;
    return (
      monthlyDeposit *
      ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate)
    );
  };

  const totalPrincipalEur = monthlyDepositEur * months;
  const expectedFvEur = calcFv(monthlyDepositEur, effectiveExpectedApy, months);
  const optimisticFvEur = calcFv(
    monthlyDepositEur,
    effectiveOptimisticApy,
    months,
  );
  const conservativeFvEur = calcFv(
    monthlyDepositEur,
    effectiveConservativeApy,
    months,
  );
  const netProfitEur = expectedFvEur - totalPrincipalEur;
  const gainPercentage =
    totalPrincipalEur > 0 ? (netProfitEur / totalPrincipalEur) * 100 : 0;

  // Generate plot points for years 0 to `years`
  const plotPoints = Array.from({ length: years + 1 }, (_, yr) => {
    const m = yr * 12;
    const principal = monthlyDepositEur * m;
    const fvOpt = calcFv(monthlyDepositEur, effectiveOptimisticApy, m);
    const fvExp = calcFv(monthlyDepositEur, effectiveExpectedApy, m);
    const fvCons = calcFv(monthlyDepositEur, effectiveConservativeApy, m);
    return {
      year: yr,
      principal,
      fvOpt,
      fvExp,
      fvCons,
    };
  });

  // Calculate nice Y-axis max round number
  const rawMax = Math.max(
    ...plotPoints.map((p) => Math.max(p.fvOpt, p.fvExp)),
    1000,
  );
  const yTicksCount = 5;
  const stepMagnitude = Math.pow(10, Math.floor(Math.log10(rawMax)));
  const yTickStep =
    Math.ceil(rawMax / yTicksCount / (stepMagnitude / 2)) * (stepMagnitude / 2);
  const yMax = yTickStep * yTicksCount;
  const yTicks = Array.from(
    { length: yTicksCount + 1 },
    (_, i) => yTickStep * (yTicksCount - i),
  );

  // SVG Chart Geometry
  const chartWidth = 560;
  const chartHeight = 260;
  const padLeft = 8;
  const padRight = 60; // space for right-side Y labels
  const padTop = 15;
  const padBottom = 28; // space for bottom X labels

  const plotW = chartWidth - padLeft - padRight;
  const plotH = chartHeight - padTop - padBottom;

  const getX = (yr: number) => padLeft + (yr / years) * plotW;
  const getY = (val: number) => padTop + plotH - (val / yMax) * plotH;

  const expPts = plotPoints.map((p) => ({ x: getX(p.year), y: getY(p.fvExp) }));
  const principalPts = plotPoints.map((p) => ({
    x: getX(p.year),
    y: getY(p.principal),
  }));

  // Smooth Bezier Curve Generator
  const createSmoothLine = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpX = (prev.x + curr.x) / 2;
      d += ` C ${cpX.toFixed(1)} ${prev.y.toFixed(1)}, ${cpX.toFixed(1)} ${curr.y.toFixed(1)}, ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
    }
    return d;
  };

  // Smooth Bezier Area Generator (filled from curve down to baseline)
  const createSmoothAreaToBaseline = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    const baselineY = padTop + plotH;
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpX = (prev.x + curr.x) / 2;
      d += ` C ${cpX.toFixed(1)} ${prev.y.toFixed(1)}, ${cpX.toFixed(1)} ${curr.y.toFixed(1)}, ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
    }
    d += ` L ${pts[pts.length - 1].x.toFixed(1)} ${baselineY}`;
    d += ` L ${pts[0].x.toFixed(1)} ${baselineY} Z`;
    return d;
  };

  const areaGradientId = useId();
  const activeYearData =
    hoverYear !== null
      ? plotPoints[hoverYear]
      : plotPoints[plotPoints.length - 1];

  return (
    <div
      className={
        dark
          ? `rounded-3xl border border-blue-500/20 bg-gradient-to-b from-[#0a0f1d] via-[#070b14] to-[#0a0f1d] p-6 sm:p-8 shadow-2xl space-y-6 text-white ${className}`
          : `rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-6 text-zinc-950 ${className}`
      }
    >
      {/* 1. Header: Minimalist & Focused */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 ${
          dark ? 'border-b border-white/10' : 'border-b border-zinc-200/80'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold ${
                dark
                  ? 'bg-blue-950/60 text-blue-300 border border-blue-400/30'
                  : 'bg-blue-50 text-[#183d89] border border-blue-100'
              }`}
            >
              <TrendUpIcon className="h-3 w-3" />
              <span>PREDICTIVE YIELD MODEL</span>
            </span>
            <span
              className={`font-mono text-[10px] ${dark ? 'text-zinc-400' : 'text-zinc-400'}`}
            >
              · SOLANA DEPIN
            </span>
          </div>
          <h3
            className={`text-xl sm:text-2xl font-semibold tracking-tight mt-1.5 ${
              dark ? 'text-white' : 'text-zinc-950'
            }`}
          >
            Yield Projections & Compounding
          </h3>
          <p
            className={`text-xs mt-0.5 font-normal ${dark ? 'text-zinc-400' : 'text-zinc-500'}`}
          >
            Simulate monthly compound growth from verified physical
            infrastructure cashflows for {assetTitle}.
          </p>
        </div>

        {/* Currency Tag */}
        <div
          className={`flex items-center self-start sm:self-center gap-2 px-3 py-1.5 rounded-full font-mono text-xs font-semibold ${
            dark
              ? 'bg-white/5 border border-white/10 text-white'
              : 'bg-zinc-50 border border-zinc-200/80 text-zinc-800'
          }`}
        >
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>EURTree (1:1 EUR)</span>
        </div>
      </div>

      {/* 2. Main 2-Column Split: Controls Left (40%), Projection Chart Right (60%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Minimalist Controls */}
        <div className="lg:col-span-5 space-y-6">
          {/* A. Monthly Stacking Deposit */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span
                className={`font-semibold ${dark ? 'text-zinc-200' : 'text-zinc-800'}`}
              >
                Monthly Deposit
              </span>
              <span
                className={`font-mono text-sm font-semibold ${
                  dark ? 'text-blue-400' : 'text-[#183d89]'
                }`}
              >
                €{monthlyDepositEur} / month
              </span>
            </div>

            {/* Clean Presets */}
            <div className="grid grid-cols-4 gap-2">
              {[50, 100, 250, 500].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMonthlyDepositEur(preset)}
                  className={`py-1.5 rounded-xl font-mono text-xs font-semibold transition cursor-pointer ${
                    monthlyDepositEur === preset
                      ? dark
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#183d89] text-white shadow-xs'
                      : dark
                        ? 'border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
                        : 'border border-zinc-200/80 bg-zinc-50 hover:bg-zinc-100 text-zinc-700'
                  }`}
                >
                  €{preset}
                </button>
              ))}
            </div>

            {/* Refined Slider */}
            <input
              type="range"
              min={25}
              max={1000}
              step={25}
              value={monthlyDepositEur}
              onChange={(e) => setMonthlyDepositEur(Number(e.target.value))}
              className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                dark
                  ? 'bg-zinc-800 accent-blue-500'
                  : 'bg-zinc-200 accent-[#183d89]'
              }`}
              aria-label="Monthly Deposit"
            />
          </div>

          {/* B. Holding Horizon */}
          <div
            className={`space-y-2.5 pt-4 ${
              dark ? 'border-t border-white/10' : 'border-t border-zinc-200/80'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span
                className={`font-semibold ${dark ? 'text-zinc-200' : 'text-zinc-800'}`}
              >
                Investment Horizon
              </span>
              <span
                className={`font-mono text-xs font-semibold ${dark ? 'text-zinc-300' : 'text-zinc-700'}`}
              >
                {years} {years === 1 ? 'Year' : 'Years'}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[1, 3, 5, 10].map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setYears(yr)}
                  className={`py-1.5 rounded-xl font-mono text-xs font-semibold transition cursor-pointer ${
                    years === yr
                      ? dark
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#183d89] text-white shadow-xs'
                      : dark
                        ? 'border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
                        : 'border border-zinc-200/80 bg-zinc-50 hover:bg-zinc-100 text-zinc-700'
                  }`}
                >
                  {yr} {yr === 1 ? 'Yr' : 'Yrs'}
                </button>
              ))}
            </div>
          </div>

          {/* C. Strategy Mode (Clean 3-Way Segmented Selector) */}
          <div
            className={`space-y-2.5 pt-4 ${
              dark ? 'border-t border-white/10' : 'border-t border-zinc-200/80'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span
                className={`font-semibold ${dark ? 'text-zinc-200' : 'text-zinc-800'}`}
              >
                Operating Strategy
              </span>
              <span
                className={`font-mono text-xs font-semibold ${
                  dark ? 'text-emerald-400' : 'text-[#183d89]'
                }`}
              >
                {effectiveExpectedApy.toFixed(1)}% APY
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-zinc-200/80 bg-zinc-100/70 p-1 text-xs">
              <button
                type="button"
                onClick={() => setStrategyMode('conservative')}
                className={`py-2 px-2 rounded-xl font-medium text-center transition cursor-pointer ${
                  strategyMode === 'conservative'
                    ? 'bg-white text-zinc-950 font-semibold shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                Conservative
              </button>
              <button
                type="button"
                onClick={() => setStrategyMode('contracted')}
                className={`py-2 px-2 rounded-xl font-medium text-center transition cursor-pointer ${
                  strategyMode === 'contracted'
                    ? 'bg-white text-[#183d89] font-semibold shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                Contracted PPA
              </button>
              <button
                type="button"
                onClick={() => setStrategyMode('arbitrage')}
                className={`py-2 px-2 rounded-xl font-medium text-center transition cursor-pointer ${
                  strategyMode === 'arbitrage'
                    ? 'bg-white text-emerald-700 font-semibold shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                AI Arbitrage
              </button>
            </div>
          </div>

          {/* D. Backing Guarantee Summary */}
          <div
            className={`rounded-2xl p-3.5 text-xs flex items-start gap-2.5 ${
              dark
                ? 'bg-blue-950/30 border border-blue-500/20 text-zinc-300'
                : 'bg-zinc-50 border border-zinc-200/80 text-zinc-600'
            }`}
          >
            <ShieldCheckIcon className="h-4 w-4 text-[#183d89] shrink-0 mt-0.5" />
            <p className="leading-snug">
              Allocations are locked in Solana non-custodial smart contracts and
              backed 1:1 by revenue-generating physical hardware.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Minimalist High-End Projection Visualizer */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          {/* Headline Numbers */}
          <div
            className={`pb-3 ${
              dark ? 'border-b border-white/10' : 'border-b border-zinc-200/80'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-mono">
              <span
                className={`uppercase tracking-wider font-semibold ${dark ? 'text-zinc-400' : 'text-zinc-500'}`}
              >
                Projected Total Return
              </span>
              <span
                className={`font-semibold px-2.5 py-0.5 rounded-full ${
                  dark
                    ? 'text-blue-300 bg-blue-950/60 border border-blue-400/30'
                    : 'text-[#183d89] bg-blue-50 border border-blue-100'
                }`}
              >
                {effectiveExpectedApy.toFixed(1)}% APY
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-3 mt-1.5">
              <span
                className={`font-mono text-3xl sm:text-4xl font-semibold tracking-tight ${
                  dark ? 'text-white' : 'text-zinc-950'
                }`}
              >
                {formatVal(expectedFvEur)}
              </span>
              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full text-emerald-700 bg-emerald-50 border border-emerald-200">
                +{formatVal(netProfitEur)} (+{gainPercentage.toFixed(0)}% gain)
              </span>
            </div>

            <p
              className={`text-xs font-mono mt-1 ${dark ? 'text-zinc-400' : 'text-zinc-500'}`}
            >
              from {formatVal(totalPrincipalEur)} principal deposited (€
              {monthlyDepositEur}/mo over {years}{' '}
              {years === 1 ? 'year' : 'years'})
            </p>
          </div>

          {/* SVG Smooth Area Chart */}
          <div
            className={`relative w-full select-none rounded-2xl p-2 ${
              dark
                ? 'bg-[#060b17] border border-white/5'
                : 'bg-zinc-50/70 border border-zinc-200/80'
            }`}
          >
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto overflow-visible"
              preserveAspectRatio="xMidYMid meet"
              onMouseLeave={() => setHoverYear(null)}
            >
              <defs>
                <linearGradient id={areaGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="#183d89"
                    stopOpacity={dark ? 0.35 : 0.12}
                  />
                  <stop
                    offset="100%"
                    stopColor="#183d89"
                    stopOpacity={dark ? 0.02 : 0.0}
                  />
                </linearGradient>
              </defs>

              {/* Horizontal Gridlines & Y-Axis Labels */}
              {yTicks.map((val) => {
                const y = getY(val);
                return (
                  <g key={val}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={padLeft + plotW}
                      y2={y}
                      stroke={
                        dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'
                      }
                      strokeWidth="1"
                    />
                    <text
                      x={padLeft + plotW + 10}
                      y={y + 3.5}
                      fill={dark ? '#64748b' : '#71717a'}
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="start"
                    >
                      {formatVal(val, true)}
                    </text>
                  </g>
                );
              })}

              {/* Shaded Area under the Projected Curve */}
              <path
                d={createSmoothAreaToBaseline(expPts)}
                fill={`url(#${areaGradientId})`}
              />

              {/* Projected Value Curve Line */}
              <path
                d={createSmoothLine(expPts)}
                fill="none"
                stroke={dark ? '#3b82f6' : '#183d89'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Principal Paid Dashed Line */}
              <path
                d={createSmoothLine(principalPts)}
                fill="none"
                stroke={dark ? '#64748b' : '#94a3b8'}
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* X-Axis Baseline & Year Ticks */}
              <line
                x1={padLeft}
                y1={padTop + plotH}
                x2={padLeft + plotW}
                y2={padTop + plotH}
                stroke={dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}
                strokeWidth="1"
              />

              {plotPoints.map((p) => {
                const x = getX(p.year);
                return (
                  <g key={p.year}>
                    <line
                      x1={x}
                      y1={padTop + plotH}
                      x2={x}
                      y2={padTop + plotH + 4}
                      stroke={
                        dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)'
                      }
                      strokeWidth="1"
                    />
                    <text
                      x={x}
                      y={padTop + plotH + 16}
                      fill={dark ? '#94a3b8' : '#71717a'}
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {p.year === 0 ? 'Today' : `Yr ${p.year}`}
                    </text>
                  </g>
                );
              })}

              {/* Interactive Hover Crosshair */}
              {hoverYear !== null && (
                <g>
                  <line
                    x1={getX(hoverYear)}
                    y1={padTop}
                    x2={getX(hoverYear)}
                    y2={padTop + plotH}
                    stroke="#183d89"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  <circle
                    cx={getX(hoverYear)}
                    cy={getY(activeYearData.fvExp)}
                    r="4.5"
                    fill="#183d89"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                </g>
              )}

              {/* Invisible touch/hover columns */}
              {plotPoints.map((p) => {
                const colW = plotW / years;
                const x = getX(p.year) - colW / 2;
                return (
                  <rect
                    key={p.year}
                    x={x}
                    y={padTop}
                    width={colW}
                    height={plotH}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoverYear(p.year)}
                    onTouchStart={() => setHoverYear(p.year)}
                  />
                );
              })}
            </svg>
          </div>

          {/* Scenario Comparison Legend Cards */}
          <div className="grid grid-cols-3 gap-2.5 text-xs font-mono">
            {/* Conservative */}
            <div
              onClick={() => setStrategyMode('conservative')}
              className={`rounded-2xl p-3 border transition cursor-pointer ${
                strategyMode === 'conservative'
                  ? 'border-[#183d89] bg-blue-50/50 shadow-xs'
                  : 'border-zinc-200/80 bg-zinc-50/60 hover:bg-zinc-50'
              }`}
            >
              <div className="flex items-center gap-1.5 text-zinc-600 text-[11px]">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                <span>Conservative</span>
              </div>
              <div className="font-semibold text-zinc-950 mt-1">
                {formatVal(conservativeFvEur)}
              </div>
              <span className="text-[10px] text-zinc-500">
                {effectiveConservativeApy.toFixed(1)}% APY
              </span>
            </div>

            {/* Contracted Base */}
            <div
              onClick={() => setStrategyMode('contracted')}
              className={`rounded-2xl p-3 border transition cursor-pointer ${
                strategyMode === 'contracted'
                  ? 'border-[#183d89] bg-blue-50/70 shadow-xs'
                  : 'border-zinc-200/80 bg-zinc-50/60 hover:bg-zinc-50'
              }`}
            >
              <div className="flex items-center gap-1.5 text-[#183d89] text-[11px] font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-[#183d89]" />
                <span>Contracted PPA</span>
              </div>
              <div className="font-semibold text-zinc-950 mt-1">
                {formatVal(calcFv(monthlyDepositEur, initialApy, months))}
              </div>
              <span className="text-[10px] text-[#183d89] font-medium">
                {initialApy.toFixed(1)}% APY Base
              </span>
            </div>

            {/* AI Arbitrage */}
            <div
              onClick={() => setStrategyMode('arbitrage')}
              className={`rounded-2xl p-3 border transition cursor-pointer ${
                strategyMode === 'arbitrage'
                  ? 'border-emerald-500 bg-emerald-50/70 shadow-xs'
                  : 'border-zinc-200/80 bg-zinc-50/60 hover:bg-zinc-50'
              }`}
            >
              <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>AI Arbitrage</span>
              </div>
              <div className="font-semibold text-zinc-950 mt-1">
                {formatVal(optimisticFvEur)}
              </div>
              <span className="text-[10px] text-emerald-700 font-medium">
                {effectiveOptimisticApy.toFixed(1)}% APY
              </span>
            </div>
          </div>

          {/* Action Trigger */}
          {onBackProject && (
            <button
              type="button"
              onClick={onBackProject}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#183d89] to-[#2563eb] hover:from-[#1d4bb5] hover:to-[#3b82f6] px-6 py-3.5 text-xs font-semibold text-white shadow-xs transition active:scale-[0.98] cursor-pointer"
            >
              <span>Back Project with this Plan (€{monthlyDepositEur}/mo)</span>
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
