import type { CapexBudgetItem } from '../../types/investor-dossier';
import { CheckIcon } from '../../victron-icons';

interface ItemizedBudgetExplorerProps {
  budget: CapexBudgetItem[];
  title?: string;
  subtitle?: string;
  currency?: 'USDC' | 'CZK';
  currencySymbol?: string;
  advantages?: Array<{ title: string; desc: string }>;
}

export function ItemizedBudgetExplorer({
  budget,
  title = 'Itemized CAPEX & OPEX Budget Breakdown',
  subtitle = 'Turnkey engineering, equipment procurement, civil works, grid interconnection, and commissioning breakdown.',
  currency = 'USDC',
  currencySymbol = 'USDC ',
  advantages,
}: ItemizedBudgetExplorerProps) {
  const formatVal = (val: number) => {
    if (currency === 'CZK') {
      const usdcMln = val / 25_000_000;
      return `USDC ${usdcMln.toFixed(2)}M`;
    }
    if (Math.abs(val) >= 1_000_000) {
      return `${currencySymbol}${(val / 1_000_000).toFixed(2)}M`;
    }
    if (Math.abs(val) >= 1_000) {
      return `${currencySymbol}${(val / 1_000).toFixed(1)}k`;
    }
    return `${currencySymbol}${val.toFixed(0)}`;
  };

  const totalVarA_Ph1 = budget.reduce((acc, i) => acc + i.phase1VarA, 0);
  const totalVarA_Ph2 = budget.reduce((acc, i) => acc + i.phase2VarA, 0);
  const totalVarA = budget.reduce((acc, i) => acc + i.totalVarA, 0);
  const totalVarB = budget.reduce((acc, i) => acc + i.totalVarB, 0);

  const defaultAdvantages = [
    {
      title: 'Streamlined Civil Engineering',
      desc: 'Modular cabinet design eliminates heavy concrete pits and crane hire. Unloading and placement are performed with standard industrial forklifts directly on stabilized gravel bedding.',
    },
    {
      title: 'Optimized Auxiliary Power (OPEX)',
      desc: 'Passive thermal buffering and direct-convection airflow eliminate power-hungry compressors, saving 8–12% internal electricity consumption compared to standard containerized chillers.',
    },
    {
      title: 'N+1 Modular Hot-Swap Redundancy',
      desc: 'Individual cabinet isolation allows any component or inverter module to be serviced hot without taking down the full asset or risking availability penalties.',
    },
  ];

  const activeAdvantages =
    advantages && advantages.length > 0 ? advantages : defaultAdvantages;

  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8 shadow-xs space-y-8">
      {/* 1. HEADER */}
      <div className="border-b border-black/10 pb-6">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold tracking-[0.2em] text-t-blue uppercase">
            Itemized Capital Expenditure Budget
          </span>
        </div>
        <h3 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
          {title}
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-zinc-600 max-w-3xl leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* 2. ITEMIZED CAPEX TABLE */}
      <div className="overflow-x-auto rounded-2xl border border-black/10">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-zinc-50 border-b border-black/10 text-[11px] text-zinc-500 uppercase">
            <tr>
              <th className="py-3 px-4 font-semibold w-1/3">
                Budget Line Item (CAPEX)
              </th>
              <th className="py-3 px-3 text-right">
                Phase I
                <span className="block text-[10px] text-zinc-400 font-normal">
                  Primary Installation
                </span>
              </th>
              <th className="py-3 px-3 text-right">
                Phase II
                <span className="block text-[10px] text-zinc-400 font-normal">
                  Expansion Option
                </span>
              </th>
              <th className="py-3 px-3 text-right bg-blue-50/50 text-t-blue font-bold">
                Total Config A
                <span className="block text-[10px] text-t-blue/70 font-normal">
                  Standard Deployment
                </span>
              </th>
              <th className="py-3 px-3 text-right bg-zinc-100/60 font-bold">
                Total Config B
                <span className="block text-[10px] text-zinc-500 font-normal">
                  High-Capacity Scaled
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 bg-white text-zinc-800">
            {budget.map((item) => (
              <tr key={item.index} className="hover:bg-zinc-50/50 transition">
                <td className="py-3 px-4 font-sans font-medium text-zinc-900">
                  <span className="font-mono text-zinc-400 mr-2">
                    0{item.index}.
                  </span>
                  {item.title}
                </td>
                <td className="py-3 px-3 text-right">
                  {formatVal(item.phase1VarA)}
                </td>
                <td className="py-3 px-3 text-right">
                  {formatVal(item.phase2VarA)}
                </td>
                <td className="py-3 px-3 text-right bg-blue-50/30 font-bold text-zinc-950">
                  {formatVal(item.totalVarA)}
                </td>
                <td className="py-3 px-3 text-right bg-zinc-50/50 font-bold text-zinc-950">
                  {formatVal(item.totalVarB)}
                </td>
              </tr>
            ))}

            {/* Total Row without Subsidy */}
            <tr className="bg-zinc-950 text-white font-bold">
              <td className="py-3.5 px-4 font-sans">
                TOTAL CAPEX (100% Commercial / Unlevered)
              </td>
              <td className="py-3.5 px-3 text-right text-zinc-200">
                {formatVal(totalVarA_Ph1)}
              </td>
              <td className="py-3.5 px-3 text-right text-zinc-200">
                {formatVal(totalVarA_Ph2)}
              </td>
              <td className="py-3.5 px-3 text-right text-emerald-400 font-black">
                {formatVal(totalVarA)}
              </td>
              <td className="py-3.5 px-3 text-right text-cyan-300 font-black">
                {formatVal(totalVarB)}
              </td>
            </tr>

            {/* Total Row with 30% Subsidy */}
            <tr className="bg-emerald-50 text-emerald-950 font-bold border-t border-emerald-200">
              <td className="py-3 px-4 font-sans text-emerald-900">
                TOTAL CAPEX WITH 30% GRANT SUBSIDY
              </td>
              <td className="py-3 px-3 text-right">
                {formatVal(totalVarA_Ph1 * 0.7)}
              </td>
              <td className="py-3 px-3 text-right">
                {formatVal(totalVarA_Ph2 * 0.7)}
              </td>
              <td className="py-3 px-3 text-right text-emerald-700 font-black">
                {formatVal(totalVarA * 0.7)}
              </td>
              <td className="py-3 px-3 text-right text-emerald-700 font-black">
                {formatVal(totalVarB * 0.7)}
              </td>
            </tr>

            {/* Annual OPEX Row */}
            <tr className="bg-zinc-50/80 text-zinc-600 font-medium">
              <td className="py-3 px-4 font-sans">
                Annual Direct Operating Expenses (OPEX ~1.5% CAPEX)
              </td>
              <td className="py-3 px-3 text-right">
                {formatVal(totalVarA_Ph1 * 0.015)}/yr
              </td>
              <td className="py-3 px-3 text-right">
                {formatVal(totalVarA_Ph2 * 0.015)}/yr
              </td>
              <td className="py-3 px-3 text-right text-zinc-950 font-bold">
                {formatVal(totalVarA * 0.015)}/yr
              </td>
              <td className="py-3 px-3 text-right text-zinc-950 font-bold">
                {formatVal(totalVarB * 0.015)}/yr
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 3. THREE STRATEGIC COST ADVANTAGES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {activeAdvantages.map((adv, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-black/10 bg-zinc-50/70 p-5 space-y-2"
          >
            <div className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4 text-[#183d89]" />
              <h5 className="font-bold text-xs uppercase tracking-wider text-zinc-950">
                {adv.title}
              </h5>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">{adv.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
