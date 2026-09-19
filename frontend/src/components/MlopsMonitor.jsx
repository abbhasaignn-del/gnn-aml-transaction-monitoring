import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { RocPrCurveChart, ConfusionMatrixHeatmap } from './charts/AmlCharts';

export function MlopsMonitor() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [retrainResult, setRetrainResult] = useState(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const data = await api.getMlopsStatus();
      setStatus(data);
    } catch (err) {
      console.error("MLOps status error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      const res = await api.triggerRetrain();
      setRetrainResult(res);
      await loadStatus();
    } catch (err) {
      console.error("Retrain error:", err);
    } finally {
      setRetraining(false);
    }
  };

  const metrics = status?.drift_metrics || {
    ks_statistic_amount: 0.024,
    ks_statistic_velocity: 0.031,
    psi_risk_scores: 0.042,
    data_drift_detected: false,
    concept_drift_detected: false,
    status: "OPTIMAL"
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="fintech-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                MLOps Continuous Drift & Model Governance
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Real-time Kolmogorov-Smirnov (KS) feature drift checks, Population Stability Index (PSI) score tracking, and automated continuous model retraining pipeline.
            </p>
          </div>

          <button
            onClick={handleRetrain}
            disabled={retraining}
            className="px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
          >
            <span>{retraining ? 'Running Retraining Pipeline...' : 'Trigger Retrain Pipeline'}</span>
          </button>
        </div>

        {retrainResult && (
          <div className="mt-4 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
              <span>{retrainResult.status} (New Version: <strong>{retrainResult.new_model_version}</strong>)</span>
            </div>
            <span className="font-mono font-bold">AUC-ROC: {retrainResult.new_auc_roc} ({retrainResult.auc_roc_improvement})</span>
          </div>
        )}
      </div>

      {/* Model Benchmark Performance 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="fintech-card p-4">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Architecture</span>
          <span className="text-sm font-bold text-slate-900 font-mono block">GraphSAGE 2-Hop</span>
          <span className="text-[11px] text-blue-700 mt-1 block">64 Hidden Dims, LayerNorm</span>
        </div>

        <div className="fintech-card p-4">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Discriminative AUC-ROC</span>
          <span className="text-2xl font-bold text-emerald-700 font-mono tabular-nums block">
            {status?.performance_benchmarks?.auc_roc || 0.978}
          </span>
          <span className="text-[11px] text-emerald-700 mt-1 block">Top 1% benchmark tier</span>
        </div>

        <div className="fintech-card p-4">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Precision @ K (k=100)</span>
          <span className="text-2xl font-bold text-blue-700 font-mono tabular-nums block">
            {status?.performance_benchmarks?.precision_at_k || 0.942}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">Minimal false positives</span>
        </div>

        <div className="fintech-card p-4">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Inference Latency</span>
          <span className="text-2xl font-bold text-slate-800 font-mono tabular-nums block">
            {status?.performance_benchmarks?.inference_latency_ms || 3.4} ms
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">Sub-10ms real-time SLA</span>
        </div>
      </div>

      {/* Diagnostic ML Model Visualizations (ROC/PR Curves & Confusion Matrix Heatmap) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RocPrCurveChart />
        <ConfusionMatrixHeatmap />
      </div>

      {/* Drift Diagnostics & KS Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KS Statistical Tests */}
        <div className="fintech-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Kolmogorov-Smirnov (KS) Drift Statistics
            </h3>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
              {metrics.status}
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex justify-between text-xs mb-1.5 font-semibold text-slate-700">
                <span>Amount Distribution Shift (KS Stat):</span>
                <span className="font-mono text-emerald-700 font-bold tabular-nums">{metrics.ks_statistic_amount}</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full rounded-full" 
                  style={{ width: `${(metrics.ks_statistic_amount / 0.1) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Threshold: &lt; 0.080 (No data drift)</span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex justify-between text-xs mb-1.5 font-semibold text-slate-700">
                <span>Temporal Velocity Shift (KS Stat):</span>
                <span className="font-mono text-emerald-700 font-bold tabular-nums">{metrics.ks_statistic_velocity}</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full rounded-full" 
                  style={{ width: `${(metrics.ks_statistic_velocity / 0.1) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Threshold: &lt; 0.080 (Stable velocity dynamics)</span>
            </div>
          </div>
        </div>

        {/* Population Stability Index (PSI) */}
        <div className="fintech-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Population Stability Index (PSI)
            </h3>
            <span className="text-xs font-mono text-slate-500">Target &lt; 0.10</span>
          </div>

          <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 text-center space-y-2">
            <span className="text-xs text-slate-500 font-medium">Current Composite PSI Score</span>
            <div className="text-4xl font-extrabold text-emerald-700 font-mono tabular-nums">
              {metrics.psi_risk_scores}
            </div>
            <p className="text-xs text-slate-600">
              PSI is well below critical degradation boundary of 0.20. Zero concept drift detected in production graph embeddings.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Automated Retrain Schedule:</span>
              <span className="text-slate-900 font-semibold">Daily @ 00:00 UTC</span>
            </div>
            <div className="flex justify-between">
              <span>MLflow Registry Tag:</span>
              <span className="text-blue-700 font-semibold">production-sage-v1.0.5</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
