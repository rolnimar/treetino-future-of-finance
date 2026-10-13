import type { ReactNode } from 'react';
import type { VictronDemoItem } from '../victron-types';
import { CloudIcon } from '../victron-icons';

export interface TelemetrySidepanelProps {
  demo: VictronDemoItem;
  specialtyTitle?: string;
  specialtyBadge?: string;
  specialtyContent?: ReactNode;
}

export function TelemetrySidepanel({
  demo,
  specialtyTitle,
  specialtyBadge,
  specialtyContent,
}: TelemetrySidepanelProps) {
  const { location, liveWeather, systemInfo } = demo;

  const gateway = demo.devices.find(
    (d) =>
      d.deviceType === 'gateway' ||
      d.name.toLowerCase().includes('gateway') ||
      d.productName.toLowerCase().includes('cerbo'),
  );
  const gatewayName = gateway
    ? gateway.productName || gateway.name
    : 'Cerbo GX';

  return (
    <aside
      aria-label="Site Telemetry and Climate Diagnostics"
      className="h-full rounded-2xl border border-black/10 bg-zinc-50/90 p-4 shadow-xs flex flex-col justify-between text-zinc-900 space-y-4"
    >
      {/* 1. TELEMETRY HEADER */}
      <div className="border-b border-black/10 pb-2.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-extrabold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Telemetry
          </span>
          <span className="font-mono text-[10px] font-bold text-[#183d89] uppercase tracking-wider">
            Uncoupled
          </span>
        </div>
        <p className="text-[11px] text-zinc-500 mt-1 font-medium">
          Environmental & Venus OS Diagnostics
        </p>
      </div>

      <div className="space-y-3.5 flex-1">
        {/* 2. ARCHETYPE SPECIALTY COMPONENT (Modular per site) */}
        {specialtyContent && (
          <div className="rounded-xl border border-black/10 bg-white p-3.5 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-900">
                {specialtyTitle || 'Site Diagnostic'}
              </span>
              {specialtyBadge && (
                <span className="rounded bg-emerald-50 px-2 py-0.5 font-mono text-[9px] text-emerald-800 font-bold border border-emerald-200">
                  {specialtyBadge}
                </span>
              )}
            </div>
            {specialtyContent}
          </div>
        )}

        {/* 3. REAL-TIME WEATHER STATION (Unified across all 4) */}
        <div className="rounded-xl border border-black/10 bg-white p-3.5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold flex items-center gap-1.5 text-zinc-900">
              <CloudIcon className="h-4 w-4 text-zinc-500" />
              Weather Station
            </span>
            <span className="font-mono text-[10px] text-zinc-400">
              Open-Meteo Live
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-zinc-950 font-mono">
              {liveWeather?.tempCelsius ?? 17} °C
            </span>
            <span className="font-mono text-xs font-semibold text-zinc-600">
              {liveWeather?.condition ?? 'Partly Cloudy'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-black/5 pt-2 font-mono text-[10px] text-zinc-500">
            <div>
              <span>Humidity: </span>
              <strong className="text-zinc-900">
                {liveWeather?.humidityPercent ?? 65}%
              </strong>
            </div>
            <div className="text-right">
              <span>Wind: </span>
              <strong className="text-zinc-900">
                {liveWeather?.windSpeedKmh ?? 8.0} km/h
              </strong>
            </div>
          </div>
          <div className="text-[10px] text-zinc-400 font-mono">
            {location.city}, {location.country}
          </div>
        </div>

        {/* 4. CERBO GX & VENUS OS CONNECTIVITY (Unified across all 4) */}
        <div className="rounded-xl border border-black/10 bg-white p-3.5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-zinc-900">Cerbo GX Gateway</span>
            <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-[9px] text-zinc-600 font-bold">
              {systemInfo.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono text-[10px] text-zinc-600">
            <div>
              <span className="text-zinc-400">Hardware:</span>
              <div
                className="font-bold text-zinc-900 truncate"
                title={gatewayName}
              >
                {gatewayName}
              </div>
            </div>
            <div>
              <span className="text-zinc-400">Firmware:</span>
              <div className="font-bold text-zinc-900 truncate">
                {systemInfo.firmwareVersion}
              </div>
            </div>
            <div>
              <span className="text-zinc-400">DBus RTT:</span>
              <div className="font-bold text-t-blue">{systemInfo.dbusRtt}</div>
            </div>
            <div>
              <span className="text-zinc-400">System Mode:</span>
              <div className="font-bold text-emerald-700 truncate">
                {systemInfo.systemState}
              </div>
            </div>
          </div>

          <div className="border-t border-black/5 pt-1.5 font-mono text-[9px] text-zinc-400 truncate">
            ID: {demo.identifier}
          </div>
        </div>
      </div>

      {/* 5. CONSOLE FOOTER */}
      <div className="text-center font-mono text-[9px] text-zinc-400 border-t border-black/10 pt-2">
        Venus OS · Real-Time Telemetry Node
      </div>
    </aside>
  );
}
