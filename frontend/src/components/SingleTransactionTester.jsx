import React, { useState } from 'react';
import { api } from '../services/api';
import { RiskGauge, FeatureImportanceBar } from './charts/AmlCharts';
import { TwoHopMessagePassingDiagram } from './charts/FlowDiagrams';

export function SingleTransactionTester({ onFileSar }) {
  const [formData, setFormData] = useState({
    transaction_id: "TXN-INSPECT-882",
    sender_account: "ACC_MULE_401",
    receiver_account: "ACC_SHELL_902",
    amount_inr: 495000,
    transaction_type: "TRANSFER",
    sender_txn_count_1h: 9,
    sender_fan_out: 6,
    receiver_fan_in: 5
  });

  const [scoring, setScoring] = useState(false);
  const [result, setResult] = useState(null);

  const presets = [
    {
      label: "Smurfing Loop (Structuring)",
      badge: "High Risk",
      badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
      data: {
        transaction_id: "TXN-SMURF-991",
        sender_account: "ACC_MULE_101",
        receiver_account: "ACC_MULE_102",
        amount_inr: 490000,
        transaction_type: "TRANSFER",
        sender_txn_count_1h: 8,
        sender_fan_out: 5,
        receiver_fan_in: 4
      }
    },
    {
      label: "Rapid Layering Fan-Out",
      badge: "High Risk",
      badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
      data: {
        transaction_id: "TXN-LAYER-442",
        sender_account: "ACC_CORP_881",
        receiver_account: "ACC_RECV_MULE_12",
        amount_inr: 850000,
        transaction_type: "TRANSFER",
        sender_txn_count_1h: 14,
        sender_fan_out: 12,
        receiver_fan_in: 1
      }
    },
    {
      label: "High-Velocity Shell Inflow",
      badge: "Critical",
      badgeColor: "bg-red-50 text-red-700 border-red-200",
      data: {
        transaction_id: "TXN-SHELL-703",
        sender_account: "ACC_OFFSHORE_HUB",
        receiver_account: "ACC_DOMESTIC_SHELL",
        amount_inr: 2800000,
        transaction_type: "TRANSFER",
        sender_txn_count_1h: 11,
        sender_fan_out: 8,
        receiver_fan_in: 9
      }
    },
    {
      label: "Legitimate Commercial Pay",
      badge: "Safe",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      data: {
        transaction_id: "TXN-COMM-012",
        sender_account: "ACC_RETAIL_USER_41",
        receiver_account: "ACC_VERIFIED_MERCHANT",
        amount_inr: 12500,
        transaction_type: "PAYMENT",
        sender_txn_count_1h: 1,
        sender_fan_out: 1,
        receiver_fan_in: 8
      }
    }
  ];

  const handleApplyPreset = (presetData) => {
    setFormData(presetData);
    setResult(null);
  };

  const handleScore = async (e) => {
    if (e) e.preventDefault();
    setScoring(true);
    try {
      const res = await api.scoreTransaction(formData);
      setResult(res);
    } catch (err) {
      console.error("Scoring error:", err);
    } finally {
      setScoring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1-Click Typology Presets Ribbon */}
      <div className="fintech-card p-5">
        <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-600"></span>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              1-Click Typology Presets
            </h3>
          </div>
          <span className="text-[11px] text-slate-600">
            Select a verified AML attack vector or baseline pattern
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyPreset(preset.data)}
              className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-left transition-all flex flex-col justify-between group shadow-2xs"
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${preset.badgeColor}`}>
                  {preset.badge}
                </span>
                <span className="text-[10px] font-mono text-slate-600">Preset #{idx + 1}</span>
              </div>
              <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                {preset.label}
              </h4>
              <p className="text-xs font-mono font-bold text-emerald-700 mt-1">
                Rs. {preset.data.amount_inr.toLocaleString('en-IN')}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Inspection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5.5 Cols): Transaction Input Parameters */}
        <div className="lg:col-span-6 fintech-card p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Transaction Vector Parameters</h3>
              <p className="text-xs text-slate-600">Configure fields for inductive GNN inference</p>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-blue-700">
              {formData.transaction_id}
            </span>
          </div>

          <form onSubmit={handleScore} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Sender Account ID
                </label>
                <input
                  type="text"
                  value={formData.sender_account}
                  onChange={(e) => setFormData({ ...formData, sender_account: e.target.value })}
                  className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Receiver Account ID
                </label>
                <input
                  type="text"
                  value={formData.receiver_account}
                  onChange={(e) => setFormData({ ...formData, receiver_account: e.target.value })}
                  className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Amount in INR (Rs.)
                </label>
                <input
                  type="number"
                  value={formData.amount_inr}
                  onChange={(e) => setFormData({ ...formData, amount_inr: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Transaction Type
                </label>
                <select
                  value={formData.transaction_type}
                  onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="TRANSFER">WIRE / NEFT TRANSFER</option>
                  <option value="PAYMENT">MERCHANT PAYMENT</option>
                  <option value="CASH_DEPOSIT">CASH DEPOSIT</option>
                  <option value="CASH_OUT">ATM CASH OUT</option>
                </select>
              </div>
            </div>

            {/* Velocity & Fan-Out Sliders */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>1-Hour Velocity:</span>
                  <span className="text-blue-700 font-mono font-bold">{formData.sender_txn_count_1h} txns</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={formData.sender_txn_count_1h}
                  onChange={(e) => setFormData({ ...formData, sender_txn_count_1h: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Sender Fan-Out:</span>
                  <span className="text-indigo-700 font-mono font-bold">{formData.sender_fan_out} hops</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={formData.sender_fan_out}
                  onChange={(e) => setFormData({ ...formData, sender_fan_out: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={scoring}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#164E8A] hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-all disabled:opacity-50"
            >
              <span>{scoring ? 'COMPUTING MULTI-HOP GRAPHSAGE EMBEDDINGS...' : 'EXECUTE GNN RISK CLASSIFICATION'}</span>
            </button>
          </form>
        </div>

        {/* Right Column (6.5 Cols): GNN Output & Feature Attribution */}
        <div className="lg:col-span-6 fintech-card p-6 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h3 className="text-base font-bold text-slate-900">
                GNN Inference Output
              </h3>
              <span className="text-xs font-mono text-emerald-700 font-semibold">
                Latency: 3.4ms
              </span>
            </div>

            {result ? (
              <div className="space-y-4 pt-3">
                {/* Risk Gauge Meter */}
                <RiskGauge 
                  score={result.risk_score} 
                  title="GraphSAGE Neural Risk Assessment" 
                />

                {/* Feature Attribution Explainability Bar */}
                <FeatureImportanceBar 
                  features={(result.explainability_top_features || []).map(f => ({
                    name: f.feature,
                    impact: parseInt(f.impact) || (f.impact.includes("+") ? 30 : -15),
                    isRisk: !f.impact.includes("-")
                  }))}
                />

                {/* Audit Trail */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Audit Decision Engine:</span>
                    <span className="text-slate-900 font-semibold">{result.audit_trail?.decision_engine || "GraphSAGE 2-Layer + PMLA Gate"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Compliance Action:</span>
                    <span className="text-emerald-700 font-semibold">{result.audit_trail?.compliance_status || "Evaluated by FIU Rules"}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-600 space-y-2">
                <span className="h-3 w-3 rounded-full bg-slate-300 inline-block"></span>
                <p className="text-xs">Click "Execute GNN Risk Classification" to calculate scores</p>
              </div>
            )}
          </div>

          {result && result.risk_score >= 0.70 && (
            <button
              onClick={() => onFileSar && onFileSar(result)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <span>Generate Official FIU SAR Filing Dossier →</span>
            </button>
          )}
        </div>
      </div>

      {/* 2-Hop Inductive Message-Passing Subgraph Aggregation Flow Diagram */}
      <TwoHopMessagePassingDiagram />
    </div>
  );
}
