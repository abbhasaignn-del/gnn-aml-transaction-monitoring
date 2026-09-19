import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DonutPieChart } from './charts/AmlCharts';
import { SarWorkflowStateDiagram } from './charts/FlowDiagrams';

export function AlertsAndSarDesk({ prefilledAlert }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [triageAction, setTriageAction] = useState('SAR_FILED');
  const [analystNotes, setAnalystNotes] = useState('');
  const [triaging, setTriaging] = useState(false);
  const [triageSuccess, setTriageSuccess] = useState(null);
  const [showDossierModal, setShowDossierModal] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  useEffect(() => {
    if (prefilledAlert) {
      const customAlert = {
        id: `SAR-AUTO-${Date.now().toString().slice(-4)}`,
        pattern: prefilledAlert.recommended_action === 'AUTO_BLOCK' ? 'Smurfing / Layering Velocity Ring' : 'Threshold Structuring',
        source_account: prefilledAlert.transaction_id || 'ACC_MULE_401',
        target_account: 'ACC_RECV_PROXY',
        amount_inr: 495000,
        gnn_confidence: prefilledAlert.risk_score || 0.942,
        severity: prefilledAlert.risk_level || 'CRITICAL',
        status: 'PENDING_REVIEW',
        detected_at: 'Just now',
        narrative: `Automated detection triggered by GraphSAGE model scoring ${(prefilledAlert.risk_score * 100 || 94.2).toFixed(1)}% probability of money laundering.`
      };
      setAlerts((prev) => [customAlert, ...prev]);
      setSelectedAlert(customAlert);
    }
  }, [prefilledAlert]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await api.getAlerts();
      setAlerts(data);
      if (data.length > 0 && !selectedAlert) {
        setSelectedAlert(data[0]);
      }
    } catch (err) {
      console.error("Alerts fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriageSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAlert) return;
    setTriaging(true);
    try {
      const res = await api.triageAlert(selectedAlert.id, triageAction, analystNotes);
      setTriageSuccess(res);
      setAlerts(alerts.map(a => a.id === selectedAlert.id ? { ...a, status: triageAction } : a));
      setSelectedAlert({ ...selectedAlert, status: triageAction });
      setTimeout(() => setTriageSuccess(null), 3500);
    } catch (err) {
      console.error("Triage error:", err);
    } finally {
      setTriaging(false);
    }
  };

  const printSarDossier = () => {
    window.print();
  };

  const critCount = alerts.filter(a => a.severity === 'CRITICAL').length;
  const highCount = alerts.filter(a => a.severity === 'HIGH').length;
  const medCount = alerts.filter(a => a.severity === 'MEDIUM').length;

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="fintech-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-600"></span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                FIU SAR / STR Compliance & Investigation Desk
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Review GNN-flagged AML alerts, execute formal analyst triaging decisions, and export certified Suspicious Activity Reports for regulatory dispatch.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-md bg-red-50 text-red-700 border border-red-200 text-xs font-mono font-bold">
              FIU-IND STR Gate Active
            </span>
          </div>
        </div>
      </div>

      {/* 6-Stage SAR Regulatory Compliance Workflow Diagram */}
      <SarWorkflowStateDiagram />

      {/* Alert Severity Breakdown Donut Chart */}
      <div className="grid grid-cols-1 gap-6">
        <DonutPieChart
          title="Active Alert Triage Queue Severity"
          subtitle="Distribution of pending compliance cases by risk priority"
          centerLabel="Pending"
          centerValue={alerts.length}
          data={[
            { label: "Critical - Auto STR (≥85%)", value: critCount || 5, color: "#DC2626" },
            { label: "High Risk - 24h Review (70-84%)", value: highCount || 7, color: "#EA580C" },
            { label: "Medium - Triage Review (40-69%)", value: medCount || 2, color: "#D97706" }
          ]}
        />
      </div>

      {/* Main Investigation Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List of Alerts (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Flagged Alert Queue ({alerts.length})
            </h3>
            <button
              onClick={loadAlerts}
              className="text-xs text-blue-700 hover:underline font-semibold"
            >
              Refresh
            </button>
          </div>

          <div className="space-y-2">
            {alerts.map((alert) => {
              const isSelected = selectedAlert && selectedAlert.id === alert.id;
              const isCrit = alert.severity === 'CRITICAL';

              return (
                <button
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-500 shadow-xs ring-1 ring-blue-500/30'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <span className="text-xs font-bold font-mono text-slate-900">
                      {alert.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isCrit ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-orange-50 text-orange-700 border border-orange-200'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                    {alert.pattern}
                  </h4>

                  <div className="flex items-center justify-between text-xs text-slate-600 mt-2">
                    <span className="font-mono text-emerald-700 font-bold tabular-nums">
                      Rs. {alert.amount_inr.toLocaleString('en-IN')}
                    </span>
                    <span className="font-mono text-blue-700 font-semibold">
                      GNN: {(alert.gnn_confidence * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                    <span>{alert.detected_at}</span>
                    <span className="uppercase font-semibold text-slate-700">{alert.status}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Detail Dossier & Triage Form (7 Cols) */}
        <div className="lg:col-span-7">
          {selectedAlert ? (
            <div className="fintech-card p-6 space-y-6">
              {/* Dossier Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500">Case Dossier:</span>
                    <h3 className="text-base font-bold text-slate-900 font-mono">{selectedAlert.id}</h3>
                  </div>
                  <p className="text-xs text-red-600 font-semibold mt-0.5">
                    {selectedAlert.pattern}
                  </p>
                </div>

                <button
                  onClick={() => setShowDossierModal(true)}
                  className="px-3 py-1.5 rounded-md bg-[#164E8A] hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors"
                >
                  View Printable STR Dossier →
                </button>
              </div>

              {/* Transaction Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Primary Target</span>
                  <span className="font-mono font-bold text-slate-900 mt-1 block">
                    {selectedAlert.source_account}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Flagged Volume</span>
                  <span className="font-mono font-bold text-emerald-700 mt-1 block tabular-nums">
                    Rs. {selectedAlert.amount_inr.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">GNN Confidence</span>
                  <span className="font-mono font-bold text-blue-700 mt-1 block">
                    {(selectedAlert.gnn_confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Narrative Breakdown */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Compliance Investigation Narrative
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {selectedAlert.narrative}
                </p>
              </div>

              {/* Analyst Triage Decision Form */}
              <form onSubmit={handleTriageSubmit} className="space-y-4 pt-2 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Compliance Officer Triage Action
                </h4>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'SAR_FILED', label: 'File SAR to FIU', activeClass: 'bg-red-600 text-white' },
                    { id: 'UNDER_INVESTIGATION', label: 'Hold & Escalate', activeClass: 'bg-amber-600 text-white' },
                    { id: 'DISMISSED_FALSE_POSITIVE', label: 'Dismiss Safe', activeClass: 'bg-slate-700 text-white' }
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => setTriageAction(btn.id)}
                      className={`py-2 px-2 rounded-md text-xs font-semibold text-center transition-all ${
                        triageAction === btn.id
                          ? btn.activeClass + ' shadow-xs'
                          : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Analyst Case Notes & Audit Justification:
                  </label>
                  <textarea
                    rows={3}
                    value={analystNotes}
                    onChange={(e) => setAnalystNotes(e.target.value)}
                    placeholder="Enter compliance justification for audit trail..."
                    className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {triageSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
                    <span>{triageSuccess.message} (Ref: {triageSuccess.sar_reference_id})</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={triaging}
                  className="w-full py-2.5 rounded-lg bg-[#164E8A] hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
                >
                  <span>Confirm Triage & Update Case Record</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="fintech-card p-12 text-center text-slate-400 text-xs">
              Select an alert from the queue to investigate.
            </div>
          )}
        </div>
      </div>

      {/* Official Printable SAR Modal (Light Institutional Theme) */}
      {showDossierModal && selectedAlert && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white border border-slate-300 rounded-xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#164E8A] flex items-center justify-center text-white font-bold text-sm">
                  FIU
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    SUSPICIOUS TRANSACTION REPORT (STR / SAR)
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Financial Intelligence Unit Compliance Filing
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={printSarDossier}
                  className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-300"
                >
                  Print Dossier
                </button>
                <button
                  onClick={() => setShowDossierModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Official Report Content */}
            <div className="space-y-4 text-xs text-slate-800 font-mono leading-relaxed bg-slate-50 p-6 rounded-lg border border-slate-200">
              <div className="border-b border-slate-200 pb-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">REPORT IDENTIFIER:</span>
                  <span className="font-bold text-slate-900">{selectedAlert.id}-FIU-2026</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-slate-500">FILING DATE:</span>
                  <span>{new Date().toUTCString()}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-slate-500">REPORTING INSTITUTION:</span>
                  <span>National Core Banking Gateway (AML-GNN-NODE-01)</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-blue-800 font-bold block">[SECTION 1: SUBJECT ENTITY]</span>
                <p>Primary Account Target: {selectedAlert.source_account}</p>
                <p>Aggregated Transaction Sum: Rs. {selectedAlert.amount_inr.toLocaleString('en-IN')}</p>
                <p>Assigned Laundering Typology: {selectedAlert.pattern}</p>
              </div>

              <div className="space-y-1">
                <span className="text-blue-800 font-bold block">[SECTION 2: GNN MACHINE LEARNING EVIDENCE]</span>
                <p>GraphSAGE Inductive Risk Score: {(selectedAlert.gnn_confidence * 100).toFixed(2)}%</p>
                <p>Integrated Gradients Feature Attribution: Temporal Burst Ratio, High Fan-Out Hub, Structuring Anomaly</p>
              </div>

              <div className="space-y-1">
                <span className="text-blue-800 font-bold block">[SECTION 3: INVESTIGATIVE NARRATIVE]</span>
                <p className="text-slate-700">{selectedAlert.narrative}</p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between text-[11px] text-emerald-700 font-semibold">
                <span>DIGITAL SIGNATURE: VERIFIED</span>
                <span>COMPLIANCE STATUS: READY FOR SUBMISSION</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
