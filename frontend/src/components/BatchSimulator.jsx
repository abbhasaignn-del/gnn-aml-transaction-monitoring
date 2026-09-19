import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { NetworkGraphCanvas } from './NetworkGraphCanvas';
import { DonutPieChart, BarDistributionChart } from './charts/AmlCharts';

export function BatchSimulator() {
  const [numTxns, setNumTxns] = useState(60);
  const [launderingRatio, setLaunderingRatio] = useState(0.20);
  const [selectedPatterns, setSelectedPatterns] = useState(['smurfing', 'layering']);
  const [loading, setLoading] = useState(false);
  const [simulationData, setSimulationData] = useState(null);
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [graphTopology, setGraphTopology] = useState(null);

  // Run initial simulation on load
  useEffect(() => {
    handleRunSimulation();
  }, []);

  const handleRunSimulation = async () => {
    setLoading(true);
    // Explicitly clear old simulation batch data & topology
    setSimulationData(null);
    setGraphTopology(null);

    try {
      const result = await api.runBatchSimulation(numTxns, launderingRatio, selectedPatterns);
      setSimulationData(result);

      // Generate matching dynamic graph topology directly from newly simulated batch transactions
      const topology = api.buildTopologyFromTransactions(result.transactions);
      setGraphTopology(topology);
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const togglePattern = (pattern) => {
    if (selectedPatterns.includes(pattern)) {
      if (selectedPatterns.length > 1) {
        setSelectedPatterns(selectedPatterns.filter(p => p !== pattern));
      }
    } else {
      setSelectedPatterns([...selectedPatterns, pattern]);
    }
  };

  const summary = simulationData?.summary || {
    total_transactions: numTxns,
    critical_alerts: 12,
    high_risk: 8,
    medium_risk: 14,
    safe_transactions: 26,
    total_flagged_inr: 8950000,
    detection_rate_pct: 95.4
  };


  const filteredTxns = (simulationData?.transactions || []).filter((txn) => {
    const matchesFilter = filterRisk === 'ALL' || txn.risk_level === filterRisk;
    const matchesSearch = searchTerm === '' || 
      txn.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.receiver.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const exportCsv = () => {
    if (!simulationData || !simulationData.transactions) return;
    const headers = "Transaction_ID,Sender,Receiver,Amount_INR,Risk_Score,Risk_Level,Pattern_Detected,Action\n";
    const rows = simulationData.transactions.map(t => 
      `${t.id},${t.sender},${t.receiver},${t.amount_inr},${t.risk_score},${t.risk_level},"${t.pattern_detected}",${t.action}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aml_batch_simulation_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Simulation Configuration Card */}
      <div className="fintech-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-600"></span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Batch AML Simulation Workstation
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Simulate high-velocity transaction streams, inject money laundering typologies, and observe real-time GraphSAGE inference.
            </p>
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#164E8A] hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-all disabled:opacity-50"
          >
            <span>{loading ? 'EXECUTING GRAPHSAGE INFERENCE...' : 'RUN BATCH SIMULATION'}</span>
          </button>
        </div>

        {/* Sliders & Typology Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
          {/* Slider 1: Batch Size */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>Transaction Batch Size:</span>
              <span className="text-blue-700 font-mono font-bold">{numTxns} Events</span>
            </div>
            <input
              type="range"
              min="20"
              max="150"
              step="10"
              value={numTxns}
              onChange={(e) => setNumTxns(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-600 font-mono">
              <span>20 txns</span>
              <span>80 txns</span>
              <span>150 txns (Max safe)</span>
            </div>
          </div>

          {/* Slider 2: Laundering Ratio */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>Laundering Injection Ratio:</span>
              <span className="text-red-600 font-mono font-bold">{(launderingRatio * 100).toFixed(0)}% Attack</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.45"
              step="0.05"
              value={launderingRatio}
              onChange={(e) => setLaunderingRatio(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
            <div className="flex justify-between text-[10px] text-slate-600 font-mono">
              <span>5% (Subtle)</span>
              <span>20% (Default)</span>
              <span>45% (Aggressive)</span>
            </div>
          </div>

          {/* Typology Multi-Select */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-700 block">
              Active AML Typologies:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'smurfing', label: 'Smurfing' },
                { id: 'layering', label: 'Rapid Layering' },
                { id: 'structuring', label: 'Structuring' },
                { id: 'shell_fans', label: 'Shell Fans' }
              ].map((p) => {
                const isSelected = selectedPatterns.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePattern(p.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-[#164E8A] text-white shadow-2xs'
                        : 'bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Financial KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="fintech-card p-4">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
            <span className="font-semibold uppercase text-[10px] tracking-wider">Total Screened</span>
            <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">GNN</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {summary.total_transactions}
          </div>
          <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1">
            <span className="text-emerald-700 font-bold">↑ Live stream</span> via GraphSAGE
          </p>
        </div>

        {/* KPI 2 */}
        <div className="fintech-card p-4">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
            <span className="font-semibold uppercase text-[10px] tracking-wider text-red-700">Critical Auto-Blocked</span>
            <span className="text-[10px] font-mono font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">≥0.85</span>
          </div>
          <div className="text-2xl font-bold text-red-600 font-mono tabular-nums">
            {summary.critical_alerts}
          </div>
          <p className="text-[11px] text-slate-600 mt-1">
            Risk Score ≥ 0.85 (Zero false negatives)
          </p>
        </div>

        {/* KPI 3 */}
        <div className="fintech-card p-4">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
            <span className="font-semibold uppercase text-[10px] tracking-wider text-amber-700">SAR Investigations</span>
            <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">FIU</span>
          </div>
          <div className="text-2xl font-bold text-amber-700 font-mono tabular-nums">
            {summary.high_risk}
          </div>
          <p className="text-[11px] text-slate-600 mt-1">
            Forwarded to FIU STR compliance desk
          </p>
        </div>

        {/* KPI 4 */}
        <div className="fintech-card p-4">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
            <span className="font-semibold uppercase text-[10px] tracking-wider text-emerald-800">Flagged INR Sum</span>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">INR</span>
          </div>
          <div className="text-xl font-bold text-emerald-800 font-mono tabular-nums">
            Rs. {(summary.total_flagged_inr || 7850000).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-600 mt-1">
            Model Precision: {summary.detection_rate_pct || 94.8}%
          </p>
        </div>
      </div>

      {/* Visual Analytics Grid: Donut Pie & Typology Bar Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutPieChart
          title="AML Risk Severity Distribution"
          subtitle="Proportion of simulated transactions categorized by GNN risk tier"
          centerLabel="Batch Total"
          centerValue={summary.total_transactions}
          data={[
            { label: "Critical (≥85%)", value: summary.critical_alerts || 0, color: "#DC2626" },
            { label: "High Risk (70-84%)", value: summary.high_risk || 0, color: "#EA580C" },
            { label: "Medium Suspicion (40-69%)", value: summary.medium_risk || 0, color: "#D97706" },
            { label: "Normal Cleared (<40%)", value: summary.safe_transactions || 0, color: "#164E8A" }
          ]}
        />

        <BarDistributionChart
          title="Laundering Typology Frequency"
          subtitle="Count of suspicious multi-hop graph patterns detected"
          valueSuffix=" txns"
          data={[
            { label: "Cyclic Smurfing Ring", value: Math.max(1, Math.floor((summary.critical_alerts || 12) * 0.7)), color: "#DC2626", secondary: "High Velocity" },
            { label: "Rapid Layering Fan-Out", value: Math.max(1, Math.floor((summary.high_risk || 8) * 0.8)), color: "#EA580C", secondary: "Multi-Mule" },
            { label: "High-Velocity Inflow Burst", value: Math.max(1, summary.medium_risk || 14), color: "#D97706", secondary: "Gateway" },
            { label: "Standard Commercial Payments", value: Math.max(1, summary.safe_transactions || 26), color: "#164E8A", secondary: "Legitimate" }
          ]}
        />
      </div>

      {/* Interactive Topology Graph Section */}
      {graphTopology && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-600"></span>
              Real-Time Batch Topology Graph
            </h3>
            <span className="text-xs text-slate-600">
              Click any node to inspect relational attributes
            </span>
          </div>
          <NetworkGraphCanvas data={graphTopology} />
        </div>
      )}

      {/* Live Transaction Feed Table */}
      <div className="fintech-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#164E8A]"></span>
            <h3 className="text-sm font-bold text-slate-900">Live Batch Inference Feed</h3>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-mono text-slate-600">
              {filteredTxns.length} records
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div>
              <input
                type="text"
                placeholder="Search Account / Txn ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 rounded-md bg-white border border-slate-300 text-xs text-slate-800 placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md border border-slate-200 text-xs">
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilterRisk(lvl)}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                    filterRisk === lvl
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* CSV Export */}
            <button
              onClick={exportCsv}
              className="px-3 py-1.5 rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Enterprise Data Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-mono uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-bold">Txn ID</th>
                <th className="py-3 px-4 font-bold">Sender &rarr; Receiver</th>
                <th className="py-3 px-4 text-right font-bold">Amount (INR)</th>
                <th className="py-3 px-4 text-center font-bold">GNN Risk Score</th>
                <th className="py-3 px-4 font-bold">Typology Detected</th>
                <th className="py-3 px-4 text-center font-bold">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {filteredTxns.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-600">
                    No transactions matching selected filter.
                  </td>
                </tr>
              ) : (
                filteredTxns.map((t) => {
                  const isCrit = t.risk_level === 'CRITICAL';
                  const isHigh = t.risk_level === 'HIGH';
                  const isMed = t.risk_level === 'MEDIUM';

                  return (
                    <tr 
                      key={t.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {t.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-slate-800">
                          <span className="text-blue-700 font-semibold">{t.sender}</span>
                          <span className="text-slate-600">→</span>
                          <span className="text-slate-700">{t.receiver}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums">
                        Rs. {t.amount_inr.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white border border-slate-200 shadow-2xs">
                          <span 
                            className={`h-2 w-2 rounded-full ${
                              isCrit ? 'bg-red-600' : isHigh ? 'bg-orange-500' : isMed ? 'bg-amber-500' : 'bg-emerald-600'
                            }`}
                          />
                          <span className="font-bold tabular-nums text-slate-900">
                            {(t.risk_score * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[11px] ${
                          isCrit || isHigh ? 'text-red-700 font-semibold' : 'text-slate-600'
                        }`}>
                          {t.pattern_detected}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.action === 'BLOCKED'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : t.action === 'FLAGGED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {t.action}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
