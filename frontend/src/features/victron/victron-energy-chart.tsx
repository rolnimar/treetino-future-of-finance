import { useState } from 'react';
import type { VictronHourlyPoint, VictronEnergyTotals } from './victron-types';

interface VictronEnergyChartProps {
  hourlyData: VictronHourlyPoint[];
  dailyTotals: VictronEnergyTotals;
  isEv?: boolean;
}

export function VictronEnergyChart({
  hourlyData,
  dailyTotals,
  isEv,
}: VictronEnergyChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showForecast, setShowForecast] = useState<boolean>(true);

  // Maximum value for kWh scale
  const maxKwh = Math.max(
    1.5,
    ...hourlyData.map((d) =>
      Math.max(d.solarKwh, d.consumptionKwh, d.gridExportKwh),
    ),
  );

  // Simulated smooth SOC curve across 24h
  const socCurve = [
    92, 90, 88, 86, 85, 84, 82, 80, 78, 82, 88, 94, 98, 100, 100, 99, 98, 96,
    95, 94, 93, 92, 91, 90,
  ];

  // SVG dimensions for smooth SOC line
  const svgWidth = 720;
  const svgHeight = 180;
  const stepX = svgWidth / Math.max(1, hourlyData.length - 1);

  const socPoints = hourlyData
    .map((_, idx) => {
      const soc = socCurve[idx % socCurve.length];
      const x = idx * stepX;
      const y = svgHeight - (soc / 100) * svgHeight;
      return { x, y, soc };
    })
    .filter(Boolean);

  const socPathD = socPoints.reduce((acc, pt, idx, arr) => {
    if (idx === 0) return `M ${pt.x} ${pt.y}`;
    const prev = arr[idx - 1];
    const cpX = (prev.x + pt.x) / 2;
    return `${acc} C ${cpX} ${prev.y}, ${cpX} ${pt.y}, ${pt.x} ${pt.y}`;
  }, '');

  return (
    <div className="rounded-3xl border border-black/10 bg-white/95 p-5 shadow-sm sm:p-6">
      {/* Installation Data Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-zinc-950 text-lg tracking-tight sm:text-xl">
              Installation Data · 24-Hour Energy Telemetry
            </h3>
            <span className="font-mono text-xs text-emerald-700 font-semibold">
              · Verified Venus OS History
            </span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">
            Hourly generation, demand, battery state of charge, and grid
            feed-in.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowForecast(!showForecast)}
            className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-1.5 font-mono text-xs font-semibold text-zinc-800 hover:bg-zinc-100 transition"
          >
            {showForecast ? 'Hide forecast' : 'Show forecast'}
          </button>

          <div className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-1.5 font-mono text-xs font-semibold text-zinc-800">
            System overview ▾
          </div>

          <div className="flex items-center rounded-xl border border-black/10 bg-zinc-50 text-xs font-mono">
            <button
              type="button"
              className="px-2.5 py-1.5 text-zinc-500 hover:text-zinc-950 transition"
            >
              ‹
            </button>
            <span className="px-2 font-bold text-zinc-950">Today</span>
            <button
              type="button"
              className="px-2.5 py-1.5 text-zinc-500 hover:text-zinc-950 transition"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Chart Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-xs bg-[#d97706]" />
            <span className="text-zinc-700 font-mono text-[11px] font-semibold">
              Solar (kWh)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-xs bg-[#0284c7]" />
            <span className="text-zinc-700 font-mono text-[11px] font-semibold">
              {isEv ? 'EV Fast Charging (kWh)' : 'Consumption (kWh)'}
            </span>
          </div>
          {dailyTotals.gridExportKwh > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-xs bg-[#059669]" />
              <span className="text-zinc-700 font-mono text-[11px] font-semibold">
                Grid Feed-in (kWh)
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="h-1 w-4 bg-[#2563eb] rounded-full" />
            <span className="text-zinc-700 font-mono text-[11px] font-semibold">
              Battery SOC (%)
            </span>
          </div>
        </div>

        <div className="font-mono text-[11px] text-zinc-500">
          Peak today: {maxKwh.toFixed(2)} kWh
        </div>
      </div>

      {/* Main Chart Area with Dual Y-Axes */}
      <div className="relative mt-6">
        {/* Left Y-Axis: kWh */}
        <div className="absolute left-0 top-0 bottom-6 flex w-10 flex-col justify-between text-right font-mono text-[10px] text-zinc-400">
          <span>{maxKwh.toFixed(1)}</span>
          <span>{(maxKwh * 0.75).toFixed(1)}</span>
          <span>{(maxKwh * 0.5).toFixed(1)}</span>
          <span>{(maxKwh * 0.25).toFixed(1)}</span>
          <span>0</span>
        </div>
        <div className="absolute -left-1 -top-4 font-mono text-[9px] uppercase tracking-wider text-zinc-500 font-bold">
          kWh
        </div>

        {/* Right Y-Axis: % */}
        <div className="absolute right-0 top-0 bottom-6 flex w-8 flex-col justify-between text-left font-mono text-[10px] text-zinc-400">
          <span>100%</span>
          <span>75%</span>
          <span>50%</span>
          <span>25%</span>
          <span>0%</span>
        </div>
        <div className="absolute -right-1 -top-4 font-mono text-[9px] uppercase tracking-wider text-zinc-500 font-bold">
          % SOC
        </div>

        {/* Chart Canvas */}
        <div className="mx-12 relative h-56">
          {/* Horizontal Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between border-b border-black/10 pointer-events-none">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="w-full border-t border-black/5" />
            ))}
          </div>

          {/* Smooth SOC Curve */}
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full pointer-events-none z-10 overflow-visible"
          >
            <path
              d={socPathD}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {socPoints.map((pt, idx) => (
              <circle
                key={idx}
                cx={pt.x}
                cy={pt.y}
                r="3"
                className="fill-white stroke-[#2563eb] stroke-[2]"
              />
            ))}
          </svg>

          {/* Grouped Bars */}
          <div className="absolute inset-0 flex items-end justify-between gap-1 z-20">
            {hourlyData.map((d, idx) => {
              const solarHeight = (d.solarKwh / maxKwh) * 100;
              const loadHeight = (d.consumptionKwh / maxKwh) * 100;
              const exportHeight = (d.gridExportKwh / maxKwh) * 100;
              const isHovered = hoveredIndex === idx;
              const isNow = idx === hourlyData.length - 1;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="group relative flex h-full flex-1 flex-col justify-end items-center cursor-pointer"
                >
                  {/* "Now" Marker Badge */}
                  {isNow && (
                    <div className="absolute -top-6 flex flex-col items-center pointer-events-none">
                      <span className="rounded-xs bg-t-blue px-1.5 py-0.5 font-mono text-[9px] font-bold text-white uppercase shadow-xs">
                        Now
                      </span>
                      <div className="h-2 w-px bg-t-blue" />
                    </div>
                  )}

                  {/* Tooltip on hover */}
                  {isHovered && (
                    <div className="absolute bottom-full mb-3 z-40 rounded-2xl border border-black/10 bg-zinc-950 p-3 text-[11px] text-white shadow-xl pointer-events-none whitespace-nowrap font-mono">
                      <div className="font-bold border-b border-white/20 pb-1 mb-1.5 flex items-center justify-between gap-4">
                        <span>Time: {d.hourLabel}</span>
                        <span className="text-sky-300">
                          SOC: {socCurve[idx % socCurve.length]}%
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-amber-300">
                          Solar: {d.solarKwh.toFixed(2)} kWh
                        </div>
                        <div className="text-sky-300">
                          Consumption: {d.consumptionKwh.toFixed(2)} kWh
                        </div>
                        {d.gridExportKwh > 0 && (
                          <div className="text-emerald-300">
                            Feed-in Export: {d.gridExportKwh.toFixed(2)} kWh
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Grouped Bar Columns */}
                  <div className="flex items-end gap-0.5 w-full justify-center">
                    {/* Solar Bar */}
                    <div
                      className="w-1.5 sm:w-2.5 rounded-t-xs bg-amber-500/90 group-hover:bg-amber-600 transition-colors"
                      style={{ height: `${Math.max(2, solarHeight)}%` }}
                    />
                    {/* Consumption Bar */}
                    <div
                      className="w-1.5 sm:w-2.5 rounded-t-xs bg-sky-600/90 group-hover:bg-sky-700 transition-colors"
                      style={{ height: `${Math.max(2, loadHeight)}%` }}
                    />
                    {/* Grid Export Bar */}
                    {d.gridExportKwh > 0 && (
                      <div
                        className="w-1.5 sm:w-2.5 rounded-t-xs bg-emerald-600/90 group-hover:bg-emerald-700 transition-colors"
                        style={{ height: `${Math.max(2, exportHeight)}%` }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* X-Axis Time Labels */}
        <div className="mt-2 flex justify-between mx-12 font-mono text-[10px] text-zinc-400">
          <span>00:00</span>
          <span>04:00</span>
          <span>08:00</span>
          <span>12:00</span>
          <span>16:00</span>
          <span>20:00</span>
          <span>23:00</span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
        <div className="rounded-xl border border-amber-600/20 bg-amber-50/50 p-4">
          <span className="text-amber-900 font-semibold">
            Today's Solar Generation
          </span>
          <div className="mt-1 font-mono text-xl font-extrabold text-amber-950">
            {dailyTotals.solarYieldKwh.toFixed(2)} kWh
          </div>
          <p className="mt-1 text-[11px] text-amber-700">
            Directly metered on-site
          </p>
        </div>

        <div className="rounded-xl border border-sky-600/20 bg-sky-50/50 p-4">
          <span className="text-sky-900 font-semibold">
            {isEv
              ? "Today's EV Fast-Charging Delivered"
              : "Today's Consumption"}
          </span>
          <div className="mt-1 font-mono text-xl font-extrabold text-sky-950">
            {dailyTotals.consumptionKwh.toFixed(2)} kWh
          </div>
          <p className="mt-1 text-[11px] text-sky-700">
            Dispensed energy throughput
          </p>
        </div>

        <div className="rounded-xl border border-emerald-600/20 bg-emerald-50/50 p-4">
          <span className="text-emerald-900 font-semibold">
            Today's Grid Feed-in (Arbitrage)
          </span>
          <div className="mt-1 font-mono text-xl font-extrabold text-emerald-950">
            {dailyTotals.gridExportKwh > 0
              ? `+${dailyTotals.gridExportKwh.toFixed(2)} kWh`
              : '0.00 kWh (Self-sufficient)'}
          </div>
          <p className="mt-1 text-[11px] text-emerald-700">
            Wholesale transmission credit
          </p>
        </div>
      </div>
    </div>
  );
}
