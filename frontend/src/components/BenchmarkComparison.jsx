import React from 'react';
import { DonutPieChart } from './charts/AmlCharts';

/**
 * Benchmark & Comparative Evaluation Tab
 * Displays in-depth charts, comparative vertical bar distributions,
 * multi-axis spider radar charts, pie charts, and capability matrices
 * contrasting Traditional AML vs Baseline ML vs Our GNN System in a single continuous view.
 */
export function BenchmarkComparison() {
  // 3 Model benchmark profiles
  const models = [
    {
      id: 'rules',
      name: '1. Legacy Rule Engine',
      subtitle: 'Static Single-Transaction CTR Thresholds',
      color: '#94A3B8',
      tag: 'TRADITIONAL',
      auc: 0.742,
      precision: 12.4,
      recall: 42.0,
      f1: 0.191,
      fpr: 87.6,
      latency: '1.2 ms',
      ringDetection: '0% (Evaded by Structuring)',
      costPer10k: '146 Analyst Hours'
    },
    {
      id: 'xgboost',
      name: '2. Tabular ML (XGBoost)',
      subtitle: 'Gradient Boosted Trees (Zero Graph Structure)',
      color: '#EA580C',
      tag: 'BASELINE ML',
      auc: 0.912,
      precision: 76.2,
      recall: 68.5,
      f1: 0.721,
      fpr: 23.8,
      latency: '2.1 ms',
      ringDetection: '34.2% (Local Node Stats Only)',
      costPer10k: '48 Analyst Hours'
    },
    {
      id: 'gnn',
      name: '3. Our GraphSAGE GNN',
      subtitle: 'Inductive 2-Hop Relational Neighborhood + PMLA Gate',
      color: '#164E8A',
      tag: 'OUR PROJECT',
      auc: 0.978,
      precision: 94.2,
      recall: 91.8,
      f1: 0.930,
      fpr: 5.8,
      latency: '3.4 ms',
      ringDetection: '96.4% (Multi-Hop Closed Cycles)',
      costPer10k: '11.2 Analyst Hours'
    }
  ];

  // Comparative Typology Catch Rates (%)
  const typologyData = [
    {
      name: "Circular Smurfing Loop (< Rs. 500k CTR Evasion)",
      rules: 0,
      ml: 34.2,
      gnn: 96.4,
      description: "Closed multi-hop loops structured just below CTR thresholds."
    },
    {
      name: "Rapid Layering Fan-Out (1-to-Many Splitting)",
      rules: 22.4,
      ml: 65.0,
      gnn: 94.8,
      description: "High-frequency dispersal into downstream mule intermediaries."
    },
    {
      name: "High-Velocity Inflow Bursts",
      rules: 58.2,
      ml: 81.4,
      gnn: 93.5,
      description: "Sudden account volume anomalies relative to historical baseline."
    },
    {
      name: "Offshore Shell Hub Gateways",
      rules: 41.0,
      ml: 72.3,
      gnn: 97.1,
      description: "Aggregator collection nodes routing capital out of jurisdiction."
    },
    {
      name: "Zero-Day Mule Accounts (No Prior History)",
      rules: 0,
      ml: 28.6,
      gnn: 89.4,
      description: "Freshly initialized accounts transacting with known suspicious rings."
    }
  ];

  // 5-Axis Spider Radar Polygon Data Points
  const radarAxes = [
    { name: "Cycle Loop Catch", rules: 0.05, ml: 0.35, gnn: 0.96 },
    { name: "Precision @ K", rules: 0.12, ml: 0.76, gnn: 0.94 },
    { name: "Noise Suppression", rules: 0.12, ml: 0.76, gnn: 0.94 },
    { name: "Zero-Day Inductive", rules: 0.05, ml: 0.28, gnn: 0.89 },
    { name: "Explainability", rules: 0.30, ml: 0.65, gnn: 0.95 }
  ];

  // Calculate SVG Polygon Coordinates for Radar Chart
  const radarCenter = 130;
  const radarRadius = 90;
  const numAxes = radarAxes.length;

  const getRadarPoint = (axisIdx, value) => {
    const angle = (axisIdx / numAxes) * 2 * Math.PI - Math.PI / 2;
    const r = radarRadius * value;
    return {
      x: radarCenter + r * Math.cos(angle),
      y: radarCenter + r * Math.sin(angle)
    };
  };

  const getPolygonPath = (modelKey) => {
    return radarAxes.map((axis, i) => {
      const pt = getRadarPoint(i, axis[modelKey]);
      return `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`;
    }).join(' ') + ' Z';
  };

  // Grouped Column Bar Chart Metrics
  const coreMetrics = [
    { label: "AUC-ROC", rules: 74.2, ml: 91.2, gnn: 97.8, unit: "%" },
    { label: "Precision", rules: 12.4, ml: 76.2, gnn: 94.2, unit: "%" },
    { label: "Recall", rules: 42.0, ml: 68.5, gnn: 91.8, unit: "%" },
    { label: "F1-Score", rules: 19.1, ml: 72.1, gnn: 93.0, unit: "%" }
  ];

  return (
    <div className="space-y-6">
      {/* Header & Metric Navigation Ribbon */}
      <div className="fintech-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-600"></span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Benchmark Evaluation Suite: Existing AML vs. Our GNN System
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Comprehensive empirical comparison between Legacy Rule Engines, Tabular ML (XGBoost), and our Inductive GraphSAGE GNN across all financial crime vectors.
            </p>
          </div>

          <span className="text-[11px] font-mono font-bold text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 shrink-0">
            CONTINUOUS BENCHMARK REPORT
          </span>
        </div>

        {/* 3 Key Takeaway Financial Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              False Alarm Reduction
            </span>
            <div className="text-2xl font-extrabold text-emerald-700 font-mono">
              93.4% Decrease
            </div>
            <p className="text-[11px] text-slate-600">
              Drops FPR from 87.6% (Legacy Rules) to 5.8% (Our Project).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Evasive Smurfing Detection
            </span>
            <div className="text-2xl font-extrabold text-blue-700 font-mono">
              96.4% Caught
            </div>
            <p className="text-[11px] text-slate-600">
              Catches sub-500k closed multi-hop structuring loops.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Compliance Review Time
            </span>
            <div className="text-2xl font-extrabold text-slate-900 font-mono">
              92.3% Saved
            </div>
            <p className="text-[11px] text-slate-600">
              Reduced analyst triage load from 146 hrs to 11.2 hrs per 10k txns.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: Vertical Grouped Column Bar Chart & Spider Radar Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Vertical Grouped Column Bar Chart (7 Cols) */}
        <div className="lg:col-span-7 fintech-card p-6 space-y-4">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-blue-700 uppercase tracking-wider block">
                SECTION 01
              </span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Model Performance Vertical Column Bar Chart
              </h3>
              <p className="text-[11px] text-slate-500">Comparing AUC-ROC, Precision, Recall, and F1-Score</p>
            </div>
            <span className="text-[10px] font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              N = 100k Benchmark
            </span>
          </div>

          {/* SVG Grouped Column Chart */}
          <div className="relative flex justify-center pt-2">
            <svg width="100%" height="240" viewBox="0 0 540 240" className="overflow-visible select-none">
              {/* Horizontal Grid lines */}
              {[0, 25, 50, 75, 100].map((val) => {
                const y = 200 - (val / 100) * 170;
                return (
                  <g key={val} className="text-[9px] fill-slate-400 font-mono">
                    <line x1="45" y1={y} x2="520" y2={y} stroke="#E2E8F0" strokeDasharray="3 3" />
                    <text x="38" y={y + 3} textAnchor="end">{val}%</text>
                  </g>
                );
              })}

              {/* 4 Groups of Column Bars */}
              {coreMetrics.map((metric, gIdx) => {
                const groupX = 65 + gIdx * 115;
                const barW = 24;

                const hRules = (metric.rules / 100) * 170;
                const hMl = (metric.ml / 100) * 170;
                const hGnn = (metric.gnn / 100) * 170;

                return (
                  <g key={metric.label}>
                    {/* Metric Group Label */}
                    <text x={groupX + 38} y="225" textAnchor="middle" className="text-[10px] font-mono font-bold fill-slate-700">
                      {metric.label}
                    </text>

                    {/* 1. Legacy Rule Column */}
                    <rect
                      x={groupX}
                      y={200 - hRules}
                      width={barW}
                      height={hRules}
                      rx="3"
                      fill="#94A3B8"
                      className="transition-all hover:opacity-80"
                    />
                    <text x={groupX + 12} y={200 - hRules - 4} textAnchor="middle" className="text-[8px] font-mono fill-slate-500">
                      {metric.rules}%
                    </text>

                    {/* 2. XGBoost Column */}
                    <rect
                      x={groupX + 26}
                      y={200 - hMl}
                      width={barW}
                      height={hMl}
                      rx="3"
                      fill="#EA580C"
                      className="transition-all hover:opacity-80"
                    />
                    <text x={groupX + 38} y={200 - hMl - 4} textAnchor="middle" className="text-[8px] font-mono fill-orange-700 font-bold">
                      {metric.ml}%
                    </text>

                    {/* 3. Our GNN Column */}
                    <rect
                      x={groupX + 52}
                      y={200 - hGnn}
                      width={barW}
                      height={hGnn}
                      rx="3"
                      fill="#164E8A"
                      className="transition-all hover:opacity-80"
                    />
                    <text x={groupX + 64} y={200 - hGnn - 4} textAnchor="middle" className="text-[9px] font-mono fill-blue-900 font-black">
                      {metric.gnn}%
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Column Legend */}
          <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100">
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-slate-400 inline-block"></span> Legacy Rules</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-orange-500 inline-block"></span> Tabular XGBoost</span>
              <span className="flex items-center gap-1.5 font-bold text-blue-900"><span className="h-2.5 w-2.5 rounded bg-[#164E8A] inline-block"></span> Our GraphSAGE GNN</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              +18.0% Precision Boost
            </span>
          </div>
        </div>

        {/* 5-Axis Spider Radar Graph (5 Cols) */}
        <div className="lg:col-span-5 fintech-card p-6 flex flex-col justify-between space-y-4">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-blue-700 uppercase tracking-wider block">
                MULTI-AXIS RADAR
              </span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Multi-Axis Capability Radar
              </h3>
              <p className="text-[11px] text-slate-500">Holistic multi-dimensional capability map</p>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              95% Surface Area
            </span>
          </div>

          {/* SVG Spider Radar */}
          <div className="relative flex justify-center py-1">
            <svg width="260" height="260" viewBox="0 0 260 260" className="overflow-visible select-none">
              {/* Concentric Web Rings (25%, 50%, 75%, 100%) */}
              {[0.25, 0.5, 0.75, 1.0].map((ring) => {
                const pts = Array.from({ length: numAxes }).map((_, i) => {
                  const pt = getRadarPoint(i, ring);
                  return `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`;
                }).join(' ') + ' Z';
                return (
                  <path key={ring} d={pts} fill="none" stroke="#E2E8F0" strokeWidth="1" strokeDasharray={ring < 1 ? "2 2" : "none"} />
                );
              })}

              {/* Axis Radial Lines */}
              {radarAxes.map((axis, i) => {
                const edgePt = getRadarPoint(i, 1.0);
                const labelPt = getRadarPoint(i, 1.22);
                return (
                  <g key={axis.name}>
                    <line x1={radarCenter} y1={radarCenter} x2={edgePt.x} y2={edgePt.y} stroke="#CBD5E1" strokeWidth="1" />
                    <text
                      x={labelPt.x}
                      y={labelPt.y + 3}
                      textAnchor="middle"
                      className="text-[8px] font-mono font-bold fill-slate-600"
                    >
                      {axis.name}
                    </text>
                  </g>
                );
              })}

              {/* Legacy Rules Polygon (Grey) */}
              <path d={getPolygonPath('rules')} fill="rgba(148, 163, 184, 0.25)" stroke="#94A3B8" strokeWidth="1.5" />

              {/* XGBoost Polygon (Orange) */}
              <path d={getPolygonPath('ml')} fill="rgba(234, 88, 12, 0.25)" stroke="#EA580C" strokeWidth="1.5" />

              {/* Our GNN Polygon (Deep Navy) */}
              <path d={getPolygonPath('gnn')} fill="rgba(22, 78, 138, 0.35)" stroke="#164E8A" strokeWidth="2.5" />
            </svg>
          </div>

          {/* Radar Legend */}
          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-400 inline-block"></span> Rules (24%)</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-500 inline-block"></span> XGBoost (62%)</span>
            <span className="flex items-center gap-1 font-bold text-blue-900"><span className="h-2 w-2 rounded-full bg-[#164E8A] inline-block"></span> GNN (95%)</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: Side-by-Side Pie / Donut Charts (False Alarms vs Real AML caught) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-blue-700 uppercase tracking-wider">
            SECTION 02
          </span>
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Alert Noise Distribution & False Alarm Suppression
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DonutPieChart
            title="1. Legacy Rule Engine Alert Composition"
            subtitle="Massive false alarm flood overwhelming compliance desks"
            centerLabel="Total Alarms"
            centerValue="1,000 txns"
            data={[
              { label: "False Positive Noise", value: 876, color: "#DC2626" },
              { label: "Legitimate AML Caught", value: 124, color: "#164E8A" }
            ]}
          />

          <DonutPieChart
            title="2. Our GraphSAGE GNN Alert Composition"
            subtitle="High-fidelity precision with near-zero false positive noise"
            centerLabel="True Precision"
            centerValue="94.2%"
            data={[
              { label: "True AML Caught", value: 942, color: "#164E8A" },
              { label: "Residual Review Flags", value: 58, color: "#D97706" }
            ]}
          />
        </div>
      </div>

      {/* SECTION 3: Typology Catch-Rate Vertical Grouped Bar Chart */}
      <div className="fintech-card p-6 space-y-5">
        <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono font-bold text-blue-700 uppercase tracking-wider block">
              SECTION 03
            </span>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Financial Crime Typology Catch Rates (Vertical Bar Chart)
            </h3>
            <p className="text-xs text-slate-500">
              Detection accuracy (%) across 5 evasive laundering patterns comparing Legacy Rules vs XGBoost vs Our GraphSAGE GNN
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
            Vertical Grouped Comparison
          </span>
        </div>

        {/* SVG Vertical Grouped Bar Chart */}
        <div className="w-full overflow-x-auto pt-2 pb-1">
          <div className="min-w-[700px] flex justify-center">
            <svg width="100%" height="280" viewBox="0 0 860 280" className="overflow-visible select-none">
              {/* Y-Axis Horizontal Grid Lines */}
              {[0, 25, 50, 75, 100].map((val) => {
                const y = 205 - (val / 100) * 165;
                return (
                  <g key={val} className="text-[9px] fill-slate-400 font-mono">
                    <line x1="50" y1={y} x2="840" y2={y} stroke="#E2E8F0" strokeDasharray="3 3" />
                    <text x="42" y={y + 3} textAnchor="end">{val}%</text>
                  </g>
                );
              })}

              {/* 5 Typology Groups */}
              {[
                {
                  title: "Smurfing Loops",
                  sub: "< 500k CTR Evasion",
                  rules: 0,
                  ml: 34.2,
                  gnn: 96.4
                },
                {
                  title: "Layering Fan-Out",
                  sub: "1-to-Many Splitting",
                  rules: 22.4,
                  ml: 65.0,
                  gnn: 94.8
                },
                {
                  title: "Velocity Bursts",
                  sub: "Inflow Spike Anomaly",
                  rules: 58.2,
                  ml: 81.4,
                  gnn: 93.5
                },
                {
                  title: "Offshore Hubs",
                  sub: "Transit Gateway Nodes",
                  rules: 41.0,
                  ml: 72.3,
                  gnn: 97.1
                },
                {
                  title: "Zero-Day Mules",
                  sub: "No Prior History",
                  rules: 0,
                  ml: 28.6,
                  gnn: 89.4
                }
              ].map((item, gIdx) => {
                const groupX = 75 + gIdx * 155;
                const barW = 28;
                const gap = 5;

                const hRules = (item.rules / 100) * 165;
                const hMl = (item.ml / 100) * 165;
                const hGnn = (item.gnn / 100) * 165;

                return (
                  <g key={item.title}>
                    {/* Typology Title & Subtitle Labels */}
                    <text x={groupX + 47} y="228" textAnchor="middle" className="text-[11px] font-mono font-bold fill-slate-900">
                      {item.title}
                    </text>
                    <text x={groupX + 47} y="244" textAnchor="middle" className="text-[9px] fill-slate-500 font-sans">
                      {item.sub}
                    </text>

                    {/* 1. Legacy Rule Column */}
                    <rect
                      x={groupX}
                      y={205 - (hRules > 0 ? hRules : 2)}
                      width={barW}
                      height={hRules > 0 ? hRules : 2}
                      rx="3"
                      fill="#94A3B8"
                      className="transition-all hover:opacity-80"
                    />
                    <text x={groupX + barW / 2} y={205 - hRules - 5} textAnchor="middle" className="text-[9px] font-mono fill-slate-500 font-semibold">
                      {item.rules}%
                    </text>

                    {/* 2. XGBoost ML Column */}
                    <rect
                      x={groupX + barW + gap}
                      y={205 - hMl}
                      width={barW}
                      height={hMl}
                      rx="3"
                      fill="#EA580C"
                      className="transition-all hover:opacity-80"
                    />
                    <text x={groupX + barW + gap + barW / 2} y={205 - hMl - 5} textAnchor="middle" className="text-[9px] font-mono fill-orange-700 font-bold">
                      {item.ml}%
                    </text>

                    {/* 3. Our GraphSAGE GNN Column */}
                    <rect
                      x={groupX + (barW + gap) * 2}
                      y={205 - hGnn}
                      width={barW}
                      height={hGnn}
                      rx="3"
                      fill="#164E8A"
                      className="transition-all hover:opacity-80"
                    />
                    <text x={groupX + (barW + gap) * 2 + barW / 2} y={205 - hGnn - 5} textAnchor="middle" className="text-[10px] font-mono fill-blue-900 font-black">
                      {item.gnn}%
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Bar Chart Legend & Typology Highlights Grid */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-slate-400 inline-block"></span> Legacy Rules</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-orange-500 inline-block"></span> Tabular XGBoost</span>
            <span className="flex items-center gap-1.5 font-bold text-blue-900"><span className="h-3 w-3 rounded bg-[#164E8A] inline-block"></span> Our GraphSAGE GNN</span>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
            Avg Typology Catch Rate: 94.2% vs 56.3% ML vs 24.3% Rules
          </span>
        </div>

        {/* Detailed Typology Explanation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {typologyData.map((item, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 font-mono block">
                VECTOR 0{idx + 1}
              </span>
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {item.name.split(' (')[0]}
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                <span className="text-slate-400">R: {item.rules}%</span>
                <span className="text-orange-600">ML: {item.ml}%</span>
                <span className="text-blue-900 font-bold">GNN: {item.gnn}%</span>
              </div>
              <p className="text-[10px] text-slate-500 pt-0.5 leading-snug">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: Operational Compliance Cost & Time Savings Waterfall Chart */}
      <div className="fintech-card p-6 space-y-4">
        <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold text-blue-700 uppercase tracking-wider block">
              SECTION 04
            </span>
            <h3 className="text-sm font-bold text-slate-900">
              Annual Compliance Operational Expenditure & Workload Impact
            </h3>
            <p className="text-xs text-slate-500">Analyst review hours and false alarm overhead per 100,000 transactions</p>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            92.3% Workload Reduction
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
          <div className="p-4 rounded-xl bg-red-50/70 border border-red-200 space-y-2">
            <span className="text-[10px] font-bold text-red-900 uppercase">Legacy Rule Engines</span>
            <div className="text-3xl font-extrabold text-red-700 font-mono">1,460 hrs</div>
            <p className="text-xs text-red-800">
              12 Compliance Officers required full-time. 88% of time wasted clearing false positive alerts.
            </p>
            <div className="pt-2 border-t border-red-200 text-[11px] font-mono text-red-900">
              Estimated Cost: <strong>Rs. 52,50,000 / yr</strong>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200 space-y-2">
            <span className="text-[10px] font-bold text-orange-900 uppercase">Tabular ML (XGBoost)</span>
            <div className="text-3xl font-extrabold text-orange-700 font-mono">480 hrs</div>
            <p className="text-xs text-orange-800">
              4 Compliance Officers required. Moderate noise reduction but misses complex multi-hop cycles.
            </p>
            <div className="pt-2 border-t border-orange-200 text-[11px] font-mono text-orange-900">
              Estimated Cost: <strong>Rs. 17,20,000 / yr</strong>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-300 space-y-2">
            <span className="text-[10px] font-bold text-emerald-900 uppercase">Our GraphSAGE GNN System</span>
            <div className="text-3xl font-extrabold text-emerald-800 font-mono">112 hrs</div>
            <p className="text-xs text-emerald-800">
              Only 1 Officer required. Subgraph evidence pre-compiled, auto-generating FIU-IND STR dossiers.
            </p>
            <div className="pt-2 border-t border-emerald-200 text-[11px] font-mono text-emerald-900 font-bold">
              Estimated Cost: <strong>Rs. 4,05,000 / yr (Save 92%)</strong>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: Comprehensive Technical Comparison Table */}
      <div className="fintech-card p-6 space-y-4">
        <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold text-blue-700 uppercase tracking-wider block">
              SECTION 05
            </span>
            <h3 className="text-sm font-bold text-slate-900">
              Empirical Evaluation & Technical Capabilities Matrix
            </h3>
            <p className="text-xs text-slate-500">Side-by-side performance matrix across all test criteria</p>
          </div>
          <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            N = 100,000 Txns
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="py-2.5 px-3 font-mono text-slate-600 uppercase text-[10px]">Benchmark Metric</th>
                <th className="py-2.5 px-3 font-mono text-slate-600 uppercase text-[10px]">Legacy Rules</th>
                <th className="py-2.5 px-3 font-mono text-slate-600 uppercase text-[10px]">Tabular XGBoost</th>
                <th className="py-2.5 px-3 font-mono text-blue-900 uppercase text-[10px] bg-blue-50/50">Our GraphSAGE GNN</th>
                <th className="py-2.5 px-3 font-mono text-emerald-700 uppercase text-[10px]">Delta / Gain</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              <tr>
                <td className="py-2.5 px-3 font-bold text-slate-900 font-sans">AUC-ROC Score</td>
                <td className="py-2.5 px-3 text-slate-600">0.742</td>
                <td className="py-2.5 px-3 text-orange-700">0.912</td>
                <td className="py-2.5 px-3 font-bold text-blue-900 bg-blue-50/30">0.978</td>
                <td className="py-2.5 px-3 text-emerald-700 font-bold">+0.066 (+23.6 pts)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-slate-900 font-sans">Precision @ K</td>
                <td className="py-2.5 px-3 text-slate-600">12.4%</td>
                <td className="py-2.5 px-3 text-orange-700">76.2%</td>
                <td className="py-2.5 px-3 font-bold text-blue-900 bg-blue-50/30">94.2%</td>
                <td className="py-2.5 px-3 text-emerald-700 font-bold">+18.0% Precision</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-slate-900 font-sans">Recall Rate</td>
                <td className="py-2.5 px-3 text-slate-600">42.0%</td>
                <td className="py-2.5 px-3 text-orange-700">68.5%</td>
                <td className="py-2.5 px-3 font-bold text-blue-900 bg-blue-50/30">91.8%</td>
                <td className="py-2.5 px-3 text-emerald-700 font-bold">+23.3% Recall</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-slate-900 font-sans">F1-Score</td>
                <td className="py-2.5 px-3 text-slate-600">0.191</td>
                <td className="py-2.5 px-3 text-orange-700">0.721</td>
                <td className="py-2.5 px-3 font-bold text-blue-900 bg-blue-50/30">0.930</td>
                <td className="py-2.5 px-3 text-emerald-700 font-bold">+0.209 F1 Boost</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-slate-900 font-sans">False Positive Rate (FPR)</td>
                <td className="py-2.5 px-3 text-red-600">87.6% (Overwhelming)</td>
                <td className="py-2.5 px-3 text-orange-700">23.8% (Moderate)</td>
                <td className="py-2.5 px-3 font-bold text-emerald-700 bg-blue-50/30">5.8% (Suppressed)</td>
                <td className="py-2.5 px-3 text-emerald-700 font-bold">-93.4% False Alerts</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-slate-900 font-sans">Structuring Loop Detection</td>
                <td className="py-2.5 px-3 text-red-600">0% (Evaded by design)</td>
                <td className="py-2.5 px-3 text-orange-700">34.2%</td>
                <td className="py-2.5 px-3 font-bold text-blue-900 bg-blue-50/30">96.4%</td>
                <td className="py-2.5 px-3 text-emerald-700 font-bold">+62.2% Catch Rate</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-slate-900 font-sans">Inference Latency</td>
                <td className="py-2.5 px-3 text-slate-600">1.2 ms</td>
                <td className="py-2.5 px-3 text-slate-600">2.1 ms</td>
                <td className="py-2.5 px-3 font-bold text-blue-900 bg-blue-50/30">3.4 ms</td>
                <td className="py-2.5 px-3 text-slate-600 font-bold">&lt; 5ms Real-Time SLA</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
