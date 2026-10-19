export function PitchVictronTopology() {
  return (
    <div className="w-full flex items-center justify-center py-2">
      <svg
        viewBox="0 0 770 480"
        className="w-full max-w-[840px] h-auto select-none"
      >
        <defs>
          <style>{`
            @keyframes pulseFlow {
              from { stroke-dashoffset: 24; }
              to { stroke-dashoffset: 0; }
            }
            .conduit-flow-emerald {
              stroke: #059669;
              stroke-width: 2.5;
              stroke-linecap: round;
              stroke-dasharray: 6 6;
              animation: pulseFlow 1.2s linear infinite;
            }
            .conduit-flow-amber {
              stroke: #d97706;
              stroke-width: 2.5;
              stroke-linecap: round;
              stroke-dasharray: 6 6;
              animation: pulseFlow 1.4s linear infinite;
            }
            .conduit-flow-sky {
              stroke: #2563eb;
              stroke-width: 2.5;
              stroke-linecap: round;
              stroke-dasharray: 6 6;
              animation: pulseFlow 1.2s linear infinite;
            }
            .conduit-shield {
              stroke: rgba(0, 0, 0, 0.06);
              stroke-width: 8;
              stroke-linecap: round;
            }
            .conduit-core {
              stroke: #cbd5e1;
              stroke-width: 3;
              stroke-linecap: round;
            }
          `}</style>
        </defs>

        {/* ================= CONDUIT PIPES LAYER ================= */}
        {/* 1. Grid drop: Card 1.1 bottom (130, 145) down to junction (130, 245) */}
        <line x1={130} y1={145} x2={130} y2={245} className="conduit-shield" />
        <line x1={130} y1={145} x2={130} y2={245} className="conduit-core" />
        <line
          x1={130}
          y1={145}
          x2={130}
          y2={245}
          className="conduit-flow-emerald"
        />

        {/* 2. Transformer right (235, 245) through junction (130, 245) to Center PCS left (280, 245) */}
        <line x1={235} y1={245} x2={280} y2={245} className="conduit-shield" />
        <line x1={235} y1={245} x2={280} y2={245} className="conduit-core" />
        <line
          x1={235}
          y1={245}
          x2={280}
          y2={245}
          className="conduit-flow-amber"
        />

        {/* 3. AI EMS tap: Card 1.2 bottom (385, 145) down to Center PCS top (385, 180) */}
        <line x1={385} y1={145} x2={385} y2={180} className="conduit-shield" />
        <line x1={385} y1={145} x2={385} y2={180} className="conduit-core" />
        <line
          x1={385}
          y1={145}
          x2={385}
          y2={180}
          className="conduit-flow-emerald"
        />

        {/* 4. Center PCS right (490, 245) to Fire Safety left (535, 245) */}
        <line x1={490} y1={245} x2={535} y2={245} className="conduit-shield" />
        <line x1={490} y1={245} x2={535} y2={245} className="conduit-core" />
        <line
          x1={490}
          y1={245}
          x2={535}
          y2={245}
          className="conduit-flow-sky"
        />

        {/* 5. Branch to Thermal Buffer top right (512, 145) & SCADA Gateway bottom right (512, 345) */}
        <path
          d="M 512 245 V 145 H 535"
          className="conduit-shield"
          fill="none"
        />
        <path d="M 512 245 V 145 H 535" className="conduit-core" fill="none" />
        <path
          d="M 512 245 V 145 H 535"
          className="conduit-flow-sky"
          fill="none"
        />

        {/* 6. Center PCS bottom (385, 310) down to Battery top (385, 345) */}
        <line x1={385} y1={310} x2={385} y2={345} className="conduit-shield" />
        <line x1={385} y1={310} x2={385} y2={345} className="conduit-core" />
        <line
          x1={385}
          y1={310}
          x2={385}
          y2={345}
          className="conduit-flow-emerald"
        />

        {/* 7. Battery right (490, 410) to Cerbo SCADA left (535, 410) */}
        <line x1={490} y1={410} x2={535} y2={410} className="conduit-shield" />
        <line x1={490} y1={410} x2={535} y2={410} className="conduit-core" />
        <line
          x1={490}
          y1={410}
          x2={535}
          y2={410}
          className="conduit-flow-amber"
        />

        {/* Junction Dots */}
        <circle
          cx={130}
          cy={245}
          r={5}
          fill="#059669"
          stroke="#ffffff"
          strokeWidth={2}
        />
        <circle
          cx={512}
          cy={245}
          r={5}
          fill="#2563eb"
          stroke="#ffffff"
          strokeWidth={2}
        />

        {/* ================= HARDWARE NODES LAYER (8 CLEAN WHITE CARDS) ================= */}

        {/* CARD 1.1: 110/22 kV GRID */}
        <foreignObject x={25} y={20} width={210} height={125}>
          <div className="h-full w-full border border-zinc-300 bg-white p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
              <span>Grid Interconnect</span>
              <span className="text-blue-600 font-bold">ČEZ 22 kV</span>
            </div>
            <div>
              <div className="font-mono text-2xl font-black text-zinc-950 tracking-tight">
                6,200 kW
              </div>
              <p className="text-[11px] font-semibold text-zinc-600">
                Přeštice Substation
              </p>
            </div>
            <div className="border-t border-zinc-100 pt-1 flex items-center justify-between font-mono text-[10px] text-zinc-500">
              <span>Arbitrage Spread:</span>
              <span className="font-bold text-zinc-900">
                USDC 95–USDC 98 / MWh
              </span>
            </div>
          </div>
        </foreignObject>

        {/* CARD 1.2: GRID BALANCING */}
        <foreignObject x={280} y={20} width={210} height={125}>
          <div className="h-full w-full border border-emerald-400 bg-emerald-50/60 p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between font-mono text-[10px] text-emerald-800 uppercase tracking-wider font-bold">
              <span>Grid Balancing</span>
              <span className="text-emerald-700 font-black">ČEPS aFRR+</span>
            </div>
            <div>
              <div className="font-mono text-2xl font-black text-emerald-700 tracking-tight">
                &lt; 10 ms
              </div>
              <p className="text-[11px] font-bold text-emerald-900">
                Fast Primary Response
              </p>
            </div>
            <div className="border-t border-emerald-200/60 pt-1 flex items-center justify-between font-mono text-[10px] text-emerald-800">
              <span>Regulation:</span>
              <span className="font-bold text-emerald-950">FCR ±200mHz</span>
            </div>
          </div>
        </foreignObject>

        {/* CARD 1.3: THERMAL BUFFER */}
        <foreignObject x={535} y={20} width={210} height={125}>
          <div className="h-full w-full border border-zinc-300 bg-white p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
              <span>Thermal Buffer</span>
              <span className="text-rose-600 font-bold">Passive</span>
            </div>
            <div>
              <div className="font-mono text-2xl font-black text-rose-600 tracking-tight">
                31.8 °C
              </div>
              <p className="text-[11px] font-semibold text-zinc-600">
                Optimal Liquid Cooling
              </p>
            </div>
            <div className="border-t border-zinc-100 pt-1 flex items-center justify-between font-mono text-[10px] text-zinc-500">
              <span>Parasitic Savings:</span>
              <span className="font-bold text-zinc-900">8–12% Energy</span>
            </div>
          </div>
        </foreignObject>

        {/* CARD 2.1: TRANSFORMER */}
        <foreignObject x={25} y={180} width={210} height={130}>
          <div className="h-full w-full border border-zinc-300 bg-white p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
              <span>Substation Trafo</span>
              <span className="text-amber-600 font-bold">Reserved</span>
            </div>
            <div>
              <div className="font-mono text-2xl font-black text-zinc-950 tracking-tight">
                8,600 kVA
              </div>
              <p className="text-[11px] font-semibold text-zinc-600">
                Agreement #4122602318
              </p>
            </div>
            <div className="border-t border-zinc-100 pt-1 flex items-center justify-between font-mono text-[10px] text-zinc-500">
              <span>Interconnect:</span>
              <span className="font-bold text-zinc-900">22 kV Cabling</span>
            </div>
          </div>
        </foreignObject>

        {/* CARD 2.2: WATTINO hBESS (CENTER HERO NODE) */}
        <foreignObject x={280} y={180} width={210} height={130}>
          <div className="h-full w-full border-2 border-blue-600 bg-blue-600 text-white p-3.5 flex flex-col justify-between select-none shadow-md">
            <div className="flex items-center justify-between font-mono text-[10px] text-blue-100 uppercase tracking-wider font-bold">
              <span>WATTINO hBESS</span>
              <span className="border border-white/40 px-1.5 py-0.5 text-[9px] font-bold text-white">
                50 Racks
              </span>
            </div>
            <div>
              <div className="font-mono text-xl font-black text-white">
                PCS 200 kW
              </div>
              <p className="text-[11px] text-blue-100 font-bold">
                Peak Discharge Active
              </p>
            </div>
            <div className="border-t border-white/20 pt-1 flex items-center justify-between font-mono text-[10px] text-white">
              <span>Project IRR:</span>
              <strong className="text-white font-black">21.8% p.a.</strong>
            </div>
          </div>
        </foreignObject>

        {/* CARD 2.3: FIRE SAFETY SYSTEM */}
        <foreignObject x={535} y={180} width={210} height={130}>
          <div className="h-full w-full border border-zinc-300 bg-white p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
              <span>Safety System</span>
              <span className="text-emerald-700 font-bold">IP54</span>
            </div>
            <div>
              <div className="font-mono text-xl font-black text-zinc-950 tracking-tight">
                Class A1
              </div>
              <p className="text-[11px] font-semibold text-zinc-600">
                100 mm Mineral Barrier
              </p>
            </div>
            <div className="border-t border-zinc-100 pt-1 flex items-center justify-between font-mono text-[10px] text-zinc-500">
              <span>Extinguish:</span>
              <span className="font-bold text-zinc-900">Automated Aerosol</span>
            </div>
          </div>
        </foreignObject>

        {/* CARD 3.2: SAMSUNG SDI BATTERY RACKS */}
        <foreignObject x={280} y={345} width={210} height={125}>
          <div className="h-full w-full border border-zinc-300 bg-white p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between font-mono text-[10px] text-emerald-700 uppercase tracking-wider font-bold">
              <span>Battery Storage</span>
              <span className="text-zinc-500">Samsung SDI EU</span>
            </div>
            <div>
              <div className="font-mono text-2xl font-black text-emerald-700 tracking-tight flex items-baseline justify-between">
                <span>68.4% SoC</span>
                <span className="text-[10px] text-zinc-500 font-bold">
                  666 VDC
                </span>
              </div>
              <div className="h-2 w-full bg-zinc-100 mt-1.5 overflow-hidden border border-zinc-200">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: '68.4%' }}
                />
              </div>
            </div>
            <div className="border-t border-zinc-100 pt-1 flex items-center justify-between font-mono text-[10px] text-zinc-500">
              <span>Warranty:</span>
              <span className="font-bold text-zinc-900">10+10 Years EU</span>
            </div>
          </div>
        </foreignObject>

        {/* CARD 3.3: CERBO-S GX SCADA GATEWAY */}
        <foreignObject x={535} y={345} width={210} height={125}>
          <div className="h-full w-full border border-amber-400 bg-amber-50/60 p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between font-mono text-[10px] text-amber-800 uppercase tracking-wider font-bold">
              <span>SCADA Gateway</span>
              <span className="text-amber-700 font-bold">Venus OS</span>
            </div>
            <div>
              <div className="font-mono text-2xl font-black text-amber-800 tracking-tight">
                10 ms RTT
              </div>
              <p className="text-[11px] font-bold text-amber-900">
                Modbus TCP / CAN / RS485
              </p>
            </div>
            <div className="border-t border-amber-200/60 pt-1 flex items-center justify-between font-mono text-[10px] text-amber-900">
              <span>Oracle Dispatch:</span>
              <span className="font-bold text-emerald-700">ČEPS Certified</span>
            </div>
          </div>
        </foreignObject>
      </svg>
    </div>
  );
}
