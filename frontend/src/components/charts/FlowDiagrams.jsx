import React, { useState } from 'react';

/**
 * Interactive 6-Stage GNN AML Pipeline Flowchart
 */
export function GnnPipelineFlowchart() {
  const [activeStage, setActiveStage] = useState(3); // Default on GraphSAGE Conv

  const stages = [
    {
      id: 1,
      name: "Transaction Stream Ingestion",
      tech: "Kafka / FastAPI Streaming",
      badge: "01",
      desc: "Consumes real-time banking event payloads (IMPS, NEFT, RTGS, UPI) with sub-5ms serialization.",
      inputs: "Raw Transaction JSON (amount, timestamp, sender, receiver, channel)",
      outputs: "Validated Event Objects with idempotency hashes"
    },
    {
      id: 2,
      name: "Dynamic Heterogeneous Graph Builder",
      tech: "NetworkX / InMemory Digraph",
      badge: "02",
      desc: "Maintains temporal directed multi-graph G=(V,E), updating node degree counters, velocity, and circular cycle structures.",
      inputs: "Event Tuples (u, v, t, amt)",
      outputs: "Adjacency Matrix & Multi-hop Neighbor Lookups"
    },
    {
      id: 3,
      name: "2-Hop Neighborhood Subgraph Sampler",
      tech: "Inductive Sampling Pool",
      badge: "03",
      desc: "Extracts k=2 hop localized computational graph around active counterparties to overcome graph bottlenecking.",
      inputs: "Target Account ID + Target Transaction",
      outputs: "Layer-1 (S1=15) & Layer-2 (S2=10) Sampled Subgraphs"
    },
    {
      id: 4,
      name: "GraphSAGE 2-Layer Neural Convolution",
      tech: "PyTorch Geometric (PyG)",
      badge: "04",
      desc: "Computes MEAN aggregation over neighboring node embeddings with LayerNorm and Dropout (p=0.3) to output 64-dim latent vectors.",
      inputs: "Node Feature Matrix X (7 features/node) + Sampled Edges",
      outputs: "64-Dim Graph Embedding + Calibrated Risk Probability [0.0 - 1.0]"
    },
    {
      id: 5,
      name: "SAR & FIU Compliance Rule Gate",
      tech: "Statutory Rule Engine",
      badge: "05",
      desc: "Combines ML risk probability with statutory Indian AML rules (PMLA 2002, Rs. 500,000 threshold CTR rules, OFAC sanctions list).",
      inputs: "GNN Risk Score + Account Kyc Status + Historical CTRs",
      outputs: "Triaged Action: AUTO_PASS, HUMAN_REVIEW, or AUTO_BLOCK"
    },
    {
      id: 6,
      name: "Automated FIU STR Filing Desk",
      tech: "FIU-IND XML Export",
      badge: "06",
      desc: "Compiles Suspicious Transaction Report (STR-1002) with 2-hop topological evidence graphs for compliance officers.",
      inputs: "Critical AML Flagged Transaction Bundle",
      outputs: "FIU XML Dossier + Audit Log Hash"
    }
  ];

  const current = stages.find(s => s.id === activeStage) || stages[3];

  return (
    <div className="fintech-card p-6 space-y-6">
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-600"></span>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Interactive End-to-End AML Architecture Flowchart
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Click any processing stage to inspect data structures, computational throughput, and transformations.
          </p>
        </div>
        <span className="text-[11px] font-mono text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 font-semibold self-start sm:self-auto">
          End-to-End Latency: &lt; 14.2 ms
        </span>
      </div>

      {/* Horizontal Interactive Flow Pipeline */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
        {stages.map((stage) => {
          const isSelected = activeStage === stage.id;
          return (
            <div
              key={stage.id}
              onClick={() => setActiveStage(stage.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 text-left ${
                isSelected
                  ? 'bg-blue-50/80 border-blue-600 shadow-sm ring-1 ring-blue-500'
                  : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                  isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  STAGE {stage.badge}
                </span>
                {stage.id < 6 && (
                  <span className="text-slate-300 font-bold text-xs hidden lg:inline">→</span>
                )}
              </div>

              <div>
                <h4 className={`text-xs font-bold leading-snug line-clamp-2 ${
                  isSelected ? 'text-blue-900' : 'text-slate-800'
                }`}>
                  {stage.name}
                </h4>
                <p className="text-[10px] text-slate-500 font-mono mt-1 truncate">
                  {stage.tech}
                </p>
              </div>

              <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px]">
                <span className={`font-semibold ${isSelected ? 'text-blue-700' : 'text-slate-400'}`}>
                  {isSelected ? 'INSPECTING' : 'CLICK TO VIEW'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Stage Deep Inspector Panel */}
      <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="h-6 w-6 rounded-lg bg-[#164E8A] text-white font-mono font-bold text-xs flex items-center justify-center">
              {current.badge}
            </span>
            <div>
              <h4 className="text-xs font-bold text-slate-900">{current.name}</h4>
              <span className="text-[10px] font-mono text-blue-700 font-medium">{current.tech}</span>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Pipeline Step {current.id} of 6
          </span>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed">
          {current.desc}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
          <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Input Invariants</span>
            <p className="text-slate-800 font-mono text-[11px]">{current.inputs}</p>
          </div>

          <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Output Transformation</span>
            <p className="text-blue-900 font-mono text-[11px] font-semibold">{current.outputs}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 4-Node Smurfing Cycle Money-Flow Diagram (Structuring Under Statutory Limit)
 */
export function SmurfingCycleFlowchart() {
  const [highlightHop, setHighlightHop] = useState(null);

  const nodes = [
    { id: "ACC_MULE_101", label: "Mule Account A", amount: "Rs. 4,90,000", tag: "Smurf Origin", color: "#DC2626" },
    { id: "ACC_MULE_102", label: "Mule Account B", amount: "Rs. 4,85,000", tag: "Layering Hop 1", color: "#EA580C" },
    { id: "ACC_MULE_103", label: "Mule Account C", amount: "Rs. 4,80,000", tag: "Layering Hop 2", color: "#D97706" },
    { id: "ACC_SHELL_OFFSHORE", label: "Offshore Gateway", amount: "Rs. 4,75,000", tag: "Integration Exit", color: "#DC2626" }
  ];

  return (
    <div className="fintech-card p-5 space-y-4">
      <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-900">4-Hop Circular Smurfing Cycle Vector</h4>
          <p className="text-[11px] text-slate-500">Structured Just Under Statutory Rs. 500,000 CTR Threshold</p>
        </div>
        <span className="text-[10px] font-mono font-bold bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-200">
          Cycle Detected (Net: Rs. 19.3L)
        </span>
      </div>

      {/* SVG Diagram */}
      <div className="relative flex justify-center py-2">
        <svg width="100%" height="160" viewBox="0 0 620 160" className="overflow-visible">
          {/* Connecting Arrows */}
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#DC2626" />
            </marker>
          </defs>

          {/* Hop 1 -> Hop 2 */}
          <line x1="140" y1="50" x2="190" y2="50" stroke="#DC2626" strokeWidth="2" markerEnd="url(#arrow)" />
          {/* Hop 2 -> Hop 3 */}
          <line x1="290" y1="50" x2="340" y2="50" stroke="#DC2626" strokeWidth="2" markerEnd="url(#arrow)" />
          {/* Hop 3 -> Hop 4 */}
          <line x1="440" y1="50" x2="490" y2="50" stroke="#DC2626" strokeWidth="2" markerEnd="url(#arrow)" />

          {/* Return Cycle Arc from Hop 4 to Hop 1 */}
          <path
            d="M 545 80 C 545 140, 95 140, 95 80"
            fill="none"
            stroke="#DC2626"
            strokeWidth="2"
            strokeDasharray="4 4"
            markerEnd="url(#arrow)"
          />
          <text x="310" y="145" textAnchor="middle" fill="#DC2626" className="text-[10px] font-mono font-bold">
            Loop Closure / Repatriation
          </text>

          {/* 4 Node Rectangles */}
          {nodes.map((node, i) => {
            const x = 40 + i * 150;
            const isHovered = highlightHop === i;
            return (
              <g 
                key={node.id} 
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHighlightHop(i)}
                onMouseLeave={() => setHighlightHop(null)}
              >
                <rect
                  x={x}
                  y="20"
                  width="110"
                  height="60"
                  rx="8"
                  fill={isHovered ? "#FEF2F2" : "#FFFFFF"}
                  stroke={node.color}
                  strokeWidth={isHovered ? "2.5" : "1.5"}
                />
                <text x={x + 55} y="38" textAnchor="middle" className="text-[10px] font-mono font-bold fill-slate-900">
                  {node.id}
                </text>
                <text x={x + 55} y="52" textAnchor="middle" className="text-[9px] font-mono fill-red-600 font-semibold">
                  {node.amount}
                </text>
                <text x={x + 55} y="68" textAnchor="middle" className="text-[8px] fill-slate-500">
                  {node.tag}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
        <strong className="text-slate-900 font-semibold">GNN Structural Detection Rationale:</strong> Standard single-transaction rule engines pass each transaction because amounts are below the statutory Rs. 500,000 threshold. GraphSAGE detects the closed topological cycle and flag-propagates risk across all 4 accounts.
      </div>
    </div>
  );
}

/**
 * GraphSAGE 2-Hop Inductive Message-Passing Diagram
 */
export function TwoHopMessagePassingDiagram() {
  return (
    <div className="fintech-card p-5 space-y-4">
      <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-900">GraphSAGE 2-Hop Inductive Message Passing</h4>
          <p className="text-[11px] text-slate-500">Localized Embedding Aggregation Flow</p>
        </div>
        <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
          Layer 1 & Layer 2 Aggregators
        </span>
      </div>

      {/* Mathematical Flow Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        {/* Step 1: 2-Hop Neighbor Pool */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 text-[11px]">Hop 2: Outer Context</span>
            <span className="text-[10px] font-mono text-slate-500">S2 = 10 Nodes</span>
          </div>
          <div className="p-2 rounded bg-white border border-slate-200 font-mono text-[10px] text-slate-700 space-y-1">
            <div>h_u^(0) = [amount, fan_out, degree, velocity, balance]</div>
          </div>
          <p className="text-[10px] text-slate-600">
            Pools remote counterparty transactional signals from up to 2 steps away.
          </p>
        </div>

        {/* Step 2: Layer 1 Mean Aggregation */}
        <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-900 text-[11px]">Hop 1: Immediate Ring</span>
            <span className="text-[10px] font-mono text-blue-700">S1 = 15 Nodes</span>
          </div>
          <div className="p-2 rounded bg-white border border-blue-200 font-mono text-[10px] text-blue-900 space-y-1">
            <div>h_N(v)^(1) = MEAN({'{'}h_u^(0) | u in N(v){'}'})</div>
            <div>h_v^(1) = ReLU(W1 * [h_v^(0) || h_N(v)^(1)])</div>
          </div>
          <p className="text-[10px] text-blue-800">
            Aggregates immediate transacting counterparties with LayerNorm and Dropout (p=0.3).
          </p>
        </div>

        {/* Step 3: Target Account Embedding */}
        <div className="p-3 rounded-xl bg-slate-900 text-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-[11px]">Final Classification</span>
            <span className="text-[10px] font-mono text-emerald-400">Risk Prob</span>
          </div>
          <div className="p-2 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-emerald-400 space-y-1">
            <div>z_v = W2 * [h_v^(1) || h_N(v)^(2)]</div>
            <div>P(AML) = Sigmoid(MLP(z_v))</div>
          </div>
          <p className="text-[10px] text-slate-300">
            Outputs calibrated 64-dim embedding vector and binary suspicion probability.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * 6-Stage SAR Regulatory Compliance Workflow Diagram
 */
export function SarWorkflowStateDiagram() {
  const steps = [
    { num: "01", title: "Anomaly Trigger", sub: "GNN Risk Score ≥ 0.70", status: "AUTOMATED", color: "bg-red-600" },
    { num: "02", title: "Analyst Triage", sub: "Priority Queue Desk", status: "IN_REVIEW", color: "bg-orange-600" },
    { num: "03", title: "Evidence Graph", sub: "2-Hop Subgraph Snapshot", status: "ENRICHED", color: "bg-blue-600" },
    { num: "04", title: "SAR Dossier", sub: "STR-1002 XML Compilation", status: "PREPARED", color: "bg-blue-800" },
    { num: "05", title: "Compliance Signoff", sub: "Principal Officer Review", status: "APPROVED", color: "bg-emerald-600" },
    { num: "06", title: "FIU Transmission", sub: "Secure Regulatory Portal", status: "FILED", color: "bg-slate-900" }
  ];

  return (
    <div className="fintech-card p-5 space-y-4">
      <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-900">Regulatory SAR / STR Compliance Lifecycle</h4>
          <p className="text-[11px] text-slate-500">Statutory Anti-Money Laundering Review Protocol</p>
        </div>
        <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
          PMLA 2002 Compliant
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
        {steps.map((s, idx) => (
          <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-left">
            <div className="flex items-center justify-between">
              <span className={`text-[9px] font-mono font-bold text-white px-1.5 py-0.5 rounded ${s.color}`}>
                {s.num}
              </span>
              <span className="text-[9px] font-mono text-slate-400 font-semibold">{s.status}</span>
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-900 leading-tight">{s.title}</h5>
              <p className="text-[10px] text-slate-500 mt-0.5">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
