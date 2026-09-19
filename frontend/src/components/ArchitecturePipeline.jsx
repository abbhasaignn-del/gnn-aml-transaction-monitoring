import React, { useState, useEffect } from 'react';
import { GnnPipelineFlowchart, TwoHopMessagePassingDiagram } from './charts/FlowDiagrams';

export function ArchitecturePipeline({ onNavigateToSimulator }) {
  const [selectedStage, setSelectedStage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStepAnim, setActiveStepAnim] = useState(0);

  const stages = [
    {
      id: 1,
      title: "Stage 1: Ingestion Gateway",
      subtitle: "Multi-Rail Transaction Streaming",
      badge: "Stream Layer",
      color: "bg-blue-600 text-white",
      description: "Ingests high-throughput real-time financial events across NEFT, RTGS, IMPS, UPI, and Wire Transfers with schema validation and sub-millisecond latency.",
      inputs: ["Transaction ID, Timestamp", "Sender & Receiver Account IDs", "Amount in INR", "Channel & Device Metadata"],
      processing: "Apache Kafka / Redis event queue with distributed schema validator and sliding deduplication window.",
      outputs: ["Validated Ingestion Payload Stream", "Kafka Partition Offsets"],
      complexity: "O(1) streaming latency < 2ms",
      codeSnippet: `def ingest_event(payload: dict) -> TransactionEvent:
    validated = schema.validate(payload)
    return stream_publisher.publish("aml_raw_events", validated)`
    },
    {
      id: 2,
      title: "Stage 2: Feature Engineering",
      subtitle: "Velocity & Topological Profiling",
      badge: "Stateful Aggregator",
      color: "bg-teal-600 text-white",
      description: "Computes 1-hour and 24-hour temporal velocity, fan-in/fan-out ratios, structuring threshold proximity, and sudden behavioral volume spikes.",
      inputs: ["Validated Ingestion Stream", "Historical Account State (30-day window)"],
      processing: "Sliding window accumulators calculate fan_out_ratio, burst_velocity_1h, amount_std_dev.",
      outputs: ["16-Dimensional Dense Feature Vector per Node/Transaction"],
      complexity: "O(k) where k = active window events",
      codeSnippet: `def extract_temporal_features(acc_id: str, window_hours=24):
    txns = redis_cache.get_window(acc_id, hours=window_hours)
    return compute_velocity_ratios(txns)`
    },
    {
      id: 3,
      title: "Stage 3: Graph Construction",
      subtitle: "Dynamic Heterogeneous Network",
      badge: "PyTorch Geometric",
      color: "bg-emerald-600 text-white",
      description: "Transforms isolated transactions into a dynamic graph where Accounts are Nodes and Transactions form Directed Weighted Edges.",
      inputs: ["Node Feature Vectors", "Source-Target Edge Index Tuples", "Edge Attributes (Amount, Timestamps)"],
      processing: "PyTorch Geometric Data object construction with dynamic adjacency matrix updater.",
      outputs: ["PyG Data(x=[N, 16], edge_index=[2, E], edge_attr=[E, 4])"],
      complexity: "Sparse CSR Graph Representation",
      codeSnippet: `data = Data(
    x=torch.tensor(node_features, dtype=torch.float),
    edge_index=torch.tensor(edge_indices, dtype=torch.long),
    edge_attr=torch.tensor(edge_weights, dtype=torch.float)
)`
    },
    {
      id: 4,
      title: "Stage 4: 2-Layer GraphSAGE",
      subtitle: "Relational Neighborhood Aggregation",
      badge: "Inductive GNN",
      color: "bg-indigo-600 text-white",
      description: "Aggregates multi-hop structural topology across neighboring accounts. Detects indirect laundering paths, mule rings, and shell proxies.",
      inputs: ["Heterogeneous Graph Adjacency", "Initial Node Embeddings h_v^(0)"],
      processing: "Mean Aggregation -> Linear Projection (64 dims) -> LayerNorm -> LeakyReLU -> Dropout(0.3) -> 2nd Hop Aggregation.",
      outputs: ["64-Dimensional Context-Aware Node Embeddings h_v^(2)"],
      complexity: "O(B * d1 * d2) where B = sample size",
      codeSnippet: `class GraphSAGEAML(torch.nn.Module):
    def forward(self, x, edge_index):
        h1 = F.relu(self.conv1(x, edge_index))
        h1 = self.dropout(h1)
        h2 = self.conv2(h1, edge_index)
        return torch.sigmoid(self.classifier(h2))`
    },
    {
      id: 5,
      title: "Stage 5: Risk Scoring Engine",
      subtitle: "Multi-Head Inference Output",
      badge: "Inference 3.4ms",
      color: "bg-blue-700 text-white",
      description: "Calculates calibrated risk probability score P(Laundering) between 0.000 and 1.000 along with confidence intervals and explainability impacts.",
      inputs: ["GraphSAGE Node Embeddings", "Transaction Risk Classifiers"],
      processing: "Sigmoidal classifier projection with Integrated Gradients for feature attribution breakdown.",
      outputs: ["Calibrated Risk Score (0.0 - 1.0)", "Top-3 Feature Impact Weights"],
      complexity: "AUC-ROC: 0.978 | Precision@K: 0.942",
      codeSnippet: `risk_prob = model.predict_proba(graph_batch)
explanations = integrated_gradients.attribute(model, inputs=graph_batch)`
    },
    {
      id: 6,
      title: "Stage 6: Policy Rule Gate",
      subtitle: "Compliance Tier Routing",
      badge: "Regulatory Gate",
      color: "bg-rose-600 text-white",
      description: "Maps calculated risk score against strict regulatory thresholds (Auto-Pass, Human Review, SAR Investigation, Auto-Block).",
      inputs: ["Calibrated Risk Probability", "Custom Enterprise Policy Rules"],
      processing: "Threshold Engine: <0.40: AUTO_PASS | 0.40-0.69: HUMAN_REVIEW | 0.70-0.84: SAR_INVESTIGATION | >=0.85: AUTO_BLOCK.",
      outputs: ["Compliance Triage Directive", "Automated Webhook / API Dispatch"],
      complexity: "Zero False-Negative Safety Guardrails",
      codeSnippet: `if risk_score >= 0.85:
    action = ComplianceAction.AUTO_BLOCK
elif risk_score >= 0.70:
    action = ComplianceAction.SAR_INVESTIGATION`
    },
    {
      id: 7,
      title: "Stage 7: SAR Generation",
      subtitle: "FIU STR / SAR Document Filing",
      badge: "FIU-IND Ready",
      color: "bg-amber-600 text-white",
      description: "Automatically compiles complete audit dossiers containing transaction chains, topological subgraphs, account KYC flags, and legal narrative.",
      inputs: ["Triaged High-Risk Alert", "Sub-Graph Topology Trace", "Account KYC Profiles"],
      processing: "Automated SAR Compiler formats regulatory filing JSON and printable STR dossier conforming to FIU standards.",
      outputs: ["Official SAR Audit Dossier", "Sub-Graph Cytoscape Snapshot"],
      complexity: "Complete Chain of Custody Audit Trail",
      codeSnippet: `def generate_sar_report(alert: Alert) -> SARDossier:
    return SARDossier(
        ref_id=f"FIU-STR-{uuid4()}",
        topology_nodes=alert.get_subgraph(),
        narrative=generate_llm_compliance_narrative(alert)
    )`
    },
    {
      id: 8,
      title: "Stage 8: MLOps Drift Monitor",
      subtitle: "Continuous KS & PSI Monitoring",
      badge: "Continuous Defense",
      color: "bg-slate-800 text-white",
      description: "Continuously tracks concept drift, feature distribution shifts using Kolmogorov-Smirnov (KS) tests and Population Stability Index (PSI).",
      inputs: ["Production Scoring Distribution", "Baseline Validation Dataset"],
      processing: "KS-Test statistic evaluation on amounts/velocity; PSI score computed across risk bins. Triggers automatic retrain when PSI > 0.2.",
      outputs: ["Model Health Telemetry Status", "Auto-Retrain Job Triggers"],
      complexity: "Automated Continuous Machine Learning",
      codeSnippet: `def check_concept_drift(prod_scores, baseline_scores):
    psi = calculate_psi(prod_scores, baseline_scores)
    if psi > 0.20:
        mlflow.trigger_pipeline_retrain()`
    }
  ];

  // Auto-play interactive animation across stages
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setActiveStepAnim((prev) => {
          const next = (prev + 1) % stages.length;
          setSelectedStage(next);
          return next;
        });
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const activeStage = stages[selectedStage];

  return (
    <div className="space-y-6">
      {/* Interactive 6-Stage End-to-End Architecture Flowchart */}
      <GnnPipelineFlowchart />

      {/* Top Banner & Simulation Controls */}
      <div className="fintech-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-600"></span>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                8-Stage AML Intelligence Pipeline
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              End-to-end intelligence lifecycle: from multi-rail banking stream ingestion to inductive GraphSAGE neighborhood convolutions, automated SAR regulatory dossiers, and continuous MLOps drift checks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-all ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-[#164E8A] hover:bg-blue-700 text-white'
              }`}
            >
              <span>{isPlaying ? 'PAUSE STREAM FLOW' : 'AUTO-SIMULATE PIPELINE'}</span>
            </button>

            <button
              onClick={onNavigateToSimulator}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
            >
              <span>OPEN BATCH SIMULATOR →</span>
            </button>
          </div>
        </div>

        {/* 8-Stage Interactive Stage Grid */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {stages.map((stage, idx) => {
            const isSelected = selectedStage === idx;
            const isCurrentAnim = activeStepAnim === idx && isPlaying;

            return (
              <button
                key={stage.id}
                onClick={() => {
                  setSelectedStage(idx);
                  setActiveStepAnim(idx);
                }}
                className={`relative text-left p-3 rounded-lg border transition-all flex flex-col justify-between h-32 ${
                  isSelected
                    ? 'bg-blue-50/90 border-blue-500 shadow-xs ring-1 ring-blue-500/30'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                }`}
              >
                {/* Active Indicator Line */}
                {isCurrentAnim && (
                  <span className="absolute -top-0.5 left-0 right-0 h-1 bg-blue-600 rounded-full animate-pulse"></span>
                )}

                <div className="flex items-center justify-between w-full">
                  <span className={`h-6 w-6 rounded-md font-mono text-[11px] font-bold flex items-center justify-center ${
                    isSelected ? 'bg-[#164E8A] text-white shadow-2xs' : 'bg-slate-100 text-slate-700'
                  }`}>
                    0{stage.id}
                  </span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    {stage.badge}
                  </span>
                </div>

                <div className="mt-2">
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                    {stage.title.split(":")[1] || stage.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                    {stage.subtitle}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-[10px] font-semibold text-blue-700 mt-1">
                  <span>INSPECT →</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stage Detail Deep Dive Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 Cols): Specifications & Transformation */}
        <div className="lg:col-span-7 fintech-card p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <span className="h-9 w-9 rounded-md bg-[#164E8A] text-white font-mono font-bold text-sm flex items-center justify-center shadow-2xs">
                0{activeStage.id}
              </span>
              <div>
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                  {activeStage.subtitle}
                </span>
                <h3 className="text-base font-bold text-slate-900">{activeStage.title}</h3>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
              {activeStage.badge}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {activeStage.description}
          </p>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                INPUT STREAMS
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {activeStage.inputs.map((inp, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>{inp}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                PROCESSING LOGIC
              </h5>
              <p className="text-xs text-slate-600 leading-relaxed">
                {activeStage.processing}
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                OUTPUT ARTIFACTS
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {activeStage.outputs.map((out, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{out}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-600 font-medium">Computational Benchmark:</span>
            <span className="font-mono text-emerald-700 font-bold">
              {activeStage.complexity}
            </span>
          </div>
        </div>

        {/* Right Column (5 Cols): Light Code Editor */}
        <div className="lg:col-span-5 fintech-card p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                PYTHON IMPLEMENTATION
              </h4>
              <span className="text-[11px] font-mono text-slate-500">production_core.py</span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto shadow-inner">
              <pre className="text-sky-300">
                <code>{activeStage.codeSnippet}</code>
              </pre>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-500 font-medium">
              Stage <strong className="text-slate-900">{selectedStage + 1}</strong> of <strong className="text-slate-900">8</strong>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={selectedStage === 0}
                onClick={() => setSelectedStage((prev) => Math.max(0, prev - 1))}
                className="px-3 py-1.5 rounded-md bg-white border border-slate-300 text-slate-700 text-xs font-semibold disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                disabled={selectedStage === stages.length - 1}
                onClick={() => setSelectedStage((prev) => Math.min(stages.length - 1, prev + 1))}
                className="px-3 py-1.5 rounded-md bg-[#164E8A] hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-40"
              >
                Next Stage
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
