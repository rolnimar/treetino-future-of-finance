import { useState } from 'react';
import type { ProjectDossier } from '../../types/investor-dossier';
import { DossierKeyMetrics } from './DossierKeyMetrics';
import { InteractiveFinancialModel } from './InteractiveFinancialModel';
import { DualRevenueEngine } from './DualRevenueEngine';
import { ItemizedBudgetExplorer } from './ItemizedBudgetExplorer';
import { SiteCadastralDossier } from './SiteCadastralDossier';
import { HardwareTechnologyCard } from './HardwareTechnologyCard';
import { ProjectRoadmapTracker } from './ProjectRoadmapTracker';
import { DocumentCenterViewer } from './DocumentCenterViewer';

interface ProjectInvestorDossierProps {
  dossier: ProjectDossier;
  initialTab?: DossierSectionTab;
}

export type DossierSectionTab =
  | 'overview'
  | 'financials'
  | 'revenue'
  | 'budget'
  | 'site'
  | 'technology'
  | 'roadmap'
  | 'documents';

export function ProjectInvestorDossier({
  dossier,
  initialTab = 'overview',
}: ProjectInvestorDossierProps) {
  const [activeSubTab, setActiveSubTab] =
    useState<DossierSectionTab>(initialTab);

  const currency = dossier.meta.currency ?? 'USDC';
  const currencySymbol = 'USDC ';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. TOP QUICK METRICS BAR */}
      <DossierKeyMetrics stats={dossier.highlights} />

      {/* 2. SUB-NAVIGATION PILLS FOR DEEP DUE DILIGENCE */}
      <div className="flex flex-wrap gap-2 border-b border-black/10 pb-4 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveSubTab('overview')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer ${
            activeSubTab === 'overview'
              ? 'bg-zinc-950 text-white shadow-xs'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          Executive Overview
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('financials')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer ${
            activeSubTab === 'financials'
              ? 'bg-t-blue text-white shadow-xs'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          Financial Model (ROI / IRR / NPV)
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('revenue')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer ${
            activeSubTab === 'revenue'
              ? 'bg-t-blue text-white shadow-xs'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          Revenue Engines & Arbitrage
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('budget')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer ${
            activeSubTab === 'budget'
              ? 'bg-t-blue text-white shadow-xs'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          Itemized Budget (CAPEX / OPEX)
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('site')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer ${
            activeSubTab === 'site'
              ? 'bg-t-blue text-white shadow-xs'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          Site & Grid Interconnection
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('technology')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer ${
            activeSubTab === 'technology'
              ? 'bg-t-blue text-white shadow-xs'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          Hardware & Technology
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('roadmap')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer ${
            activeSubTab === 'roadmap'
              ? 'bg-t-blue text-white shadow-xs'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          Execution Roadmap
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('documents')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'documents'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          <span>Due Diligence & Documents</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      </div>

      {/* 3. DYNAMIC TAB CONTENT */}
      {activeSubTab === 'overview' && (
        <div className="space-y-8">
          <InteractiveFinancialModel
            variants={dossier.variants}
            currency={currency}
            currencySymbol={currencySymbol}
          />
          <DualRevenueEngine
            pillars={dossier.revenuePillars}
            diurnalSchedule={dossier.diurnalSchedule}
          />
          <DocumentCenterViewer dossier={dossier} />
          <SiteCadastralDossier dossier={dossier} />
          <ItemizedBudgetExplorer
            budget={dossier.capexBudget}
            currency={currency}
            currencySymbol={currencySymbol}
          />
          <HardwareTechnologyCard spec={dossier.hardwareSpec} />
          <ProjectRoadmapTracker steps={dossier.roadmap} />
        </div>
      )}

      {activeSubTab === 'financials' && (
        <InteractiveFinancialModel
          variants={dossier.variants}
          currency={currency}
          currencySymbol={currencySymbol}
        />
      )}

      {activeSubTab === 'revenue' && (
        <DualRevenueEngine
          pillars={dossier.revenuePillars}
          diurnalSchedule={dossier.diurnalSchedule}
        />
      )}

      {activeSubTab === 'budget' && (
        <ItemizedBudgetExplorer
          budget={dossier.capexBudget}
          currency={currency}
          currencySymbol={currencySymbol}
        />
      )}

      {activeSubTab === 'site' && <SiteCadastralDossier dossier={dossier} />}

      {activeSubTab === 'technology' && (
        <HardwareTechnologyCard spec={dossier.hardwareSpec} />
      )}

      {activeSubTab === 'roadmap' && (
        <ProjectRoadmapTracker steps={dossier.roadmap} />
      )}

      {activeSubTab === 'documents' && (
        <DocumentCenterViewer dossier={dossier} />
      )}
    </div>
  );
}

// Backward-compatible alias
export const BessInvestorDossier = ProjectInvestorDossier;
