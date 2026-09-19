import React from 'react';

export function Header({ activeTab, onToggleSidebar, systemStatus }) {
  const tabTitles = {
    overview: {
      title: "8-Stage AML Intelligence Pipeline",
      subtitle: "End-to-end multi-rail financial stream ingestion, GraphSAGE convolutions & SAR generation."
    },
    simulator: {
      title: "Batch Transaction Stream Simulator",
      subtitle: "Inject high-velocity transaction batches, detect smurfing rings, and analyze real-time inference."
    },
    single_test: {
      title: "Single Transaction Forensics & Testing",
      subtitle: "Isolated GNN risk classification, 1-click typology presets, and Integrated Gradients attribution."
    },
    topology: {
      title: "Heterogeneous Network Graph Topology",
      subtitle: "Multi-hop relational network analysis, circular smurfing detection, and shell account clustering."
    },
    alerts: {
      title: "FIU SAR / STR Compliance & Investigation Desk",
      subtitle: "Triage flagged suspicious alerts, inspect case evidence dossiers, and export regulatory filings."
    },
    mlops: {
      title: "MLOps Continuous Drift & Model Governance",
      subtitle: "Kolmogorov-Smirnov statistical tests, Population Stability Index (PSI), and auto-retraining."
    },
    benchmark: {
      title: "Comparative Benchmark Evaluation (Existing vs Our GNN)",
      subtitle: "Empirical performance charts, 93% false positive reduction, and structural capability matrix."
    }
  };

  const current = tabTitles[activeTab] || tabTitles.overview;

  return (
    <header className="sticky top-0 z-30 fintech-header h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      {/* Left: Mobile Menu Button & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden px-2.5 py-1 rounded-md text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          title="Toggle Navigation Menu"
        >
          MENU
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {current.title}
            </h1>
          </div>
          <p className="text-xs text-slate-600 hidden sm:block truncate max-w-xl">
            {current.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Operational Status Badges & Indicators */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Status Badges */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            <span>API ONLINE</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
            <span>GNN 2-HOP ACTIVE</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
            <span>FIU-IND GATE</span>
          </div>
        </div>

        {/* Currency & SLA Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50/80 border border-blue-200 text-[11px] font-medium text-blue-800">
          <span>INR (Rs.)</span>
          <span className="text-blue-300">|</span>
          <span className="font-mono font-bold">&lt; 3.4ms</span>
        </div>
      </div>
    </header>
  );
}
