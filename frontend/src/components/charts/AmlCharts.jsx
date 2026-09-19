import React, { useState } from 'react';

/**
 * Interactive Pure SVG Donut / Pie Chart
 * Supports hover animations, slice selection, center metrics, and enterprise legends.
 */
export function DonutPieChart({ 
  data = [], 
  title = "Distribution", 
  subtitle = "Breakdown by Category",
  centerLabel = "Total",
  centerValue = null,
  size = 220 
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  const radius = 80;
  const innerRadius = 52;
  const cx = size / 2;
  const cy = size / 2;

  let currentAngle = -90; // Start at top

  const slices = data.map((item, idx) => {
    const val = Number(item.value) || 0;
    const pct = total > 0 ? val / total : 0;
    const angle = pct * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle += angle;

    const isHovered = hoveredIdx === idx;
    const currentR = isHovered ? radius + 5 : radius;
    const currentInnerR = innerRadius;

    // Convert angles to radians
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + currentR * Math.cos(startRad);
    const y1 = cy + currentR * Math.sin(startRad);
    const x2 = cx + currentR * Math.cos(endRad);
    const y2 = cy + currentR * Math.sin(endRad);

    const ix1 = cx + currentInnerR * Math.cos(endRad);
    const iy1 = cy + currentInnerR * Math.sin(endRad);
    const ix2 = cx + currentInnerR * Math.cos(startRad);
    const iy2 = cy + currentInnerR * Math.sin(startRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData = val > 0 && total > 0
      ? `M ${x1} ${y1} A ${currentR} ${currentR} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${currentInnerR} ${currentInnerR} 0 ${largeArcFlag} 0 ${ix2} ${iy2} Z`
      : '';

    return {
      ...item,
      idx,
      pct: (pct * 100).toFixed(1),
      pathData,
      isHovered
    };
  });

  const activeSlice = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <div className="fintech-card p-5 flex flex-col justify-between">
      <div className="border-b border-slate-200 pb-3">
        <h4 className="text-xs font-bold text-slate-900 tracking-tight">{title}</h4>
        {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-3">
        {/* SVG Donut */}
        <div className="relative flex items-center justify-center">
          <svg width={size} height={size} className="overflow-visible">
            {slices.map((slice) => (
              <path
                key={slice.idx}
                d={slice.pathData}
                fill={slice.color || '#164E8A'}
                stroke="#FFFFFF"
                strokeWidth="2"
                className="transition-all duration-200 cursor-pointer"
                style={{
                  opacity: hoveredIdx !== null && hoveredIdx !== slice.idx ? 0.6 : 1,
                  transformOrigin: `${cx}px ${cy}px`,
                }}
                onMouseEnter={() => setHoveredIdx(slice.idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            ))}
          </svg>

          {/* Center Callout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            {activeSlice ? (
              <>
                <span className="text-[10px] uppercase font-bold text-slate-500 truncate max-w-[90px]">
                  {activeSlice.label}
                </span>
                <span className="text-base font-bold font-mono" style={{ color: activeSlice.color }}>
                  {activeSlice.pct}%
                </span>
                <span className="text-[10px] text-slate-600 font-mono">
                  {typeof activeSlice.value === 'number' && activeSlice.value >= 1000 
                    ? activeSlice.value.toLocaleString('en-IN') 
                    : activeSlice.value}
                </span>
              </>
            ) : (
              <>
                <span className="text-[10px] uppercase font-semibold text-slate-400">
                  {centerLabel}
                </span>
                <span className="text-base font-bold text-slate-900 font-mono">
                  {centerValue !== null 
                    ? (typeof centerValue === 'number' ? centerValue.toLocaleString('en-IN') : centerValue)
                    : total.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400">Items</span>
              </>
            )}
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 space-y-2 w-full max-w-[200px]">
          {slices.map((slice) => (
            <div
              key={slice.idx}
              onMouseEnter={() => setHoveredIdx(slice.idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`flex items-center justify-between p-1.5 rounded-md cursor-pointer transition-colors text-xs ${
                hoveredIdx === slice.idx ? 'bg-slate-100' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span 
                  className="h-2.5 w-2.5 rounded-full shrink-0" 
                  style={{ backgroundColor: slice.color }}
                />
                <span className="text-slate-700 truncate font-medium text-[11px]">{slice.label}</span>
              </div>
              <div className="text-right shrink-0 font-mono">
                <span className="font-bold text-slate-900 text-xs">{slice.value}</span>
                <span className="text-[10px] text-slate-400 ml-1">({slice.pct}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Interactive Bar Distribution Chart
 */
export function BarDistributionChart({
  data = [],
  title = "Typology Breakdown",
  subtitle = "Frequency by Laundering Pattern",
  valueSuffix = " txns",
  maxVal = null
}) {
  const [activeIdx, setActiveIdx] = useState(null);

  const highest = maxVal || Math.max(...data.map(d => Number(d.value) || 0), 1);

  return (
    <div className="fintech-card p-5 space-y-4">
      <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-900 tracking-tight">{title}</h4>
          {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <span className="text-[11px] font-mono text-slate-500">
          Peak: <strong className="text-slate-800">{highest}{valueSuffix}</strong>
        </span>
      </div>

      <div className="space-y-3 pt-1">
        {data.map((item, idx) => {
          const val = Number(item.value) || 0;
          const pct = Math.min(100, Math.max(4, (val / highest) * 100));
          const isSelected = activeIdx === idx;

          return (
            <div 
              key={idx}
              onMouseEnter={() => setActiveIdx(idx)}
              onMouseLeave={() => setActiveIdx(null)}
              className="space-y-1 group cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span 
                    className="h-2 w-2 rounded-full" 
                    style={{ backgroundColor: item.color || '#164E8A' }}
                  />
                  <span className={`font-medium ${isSelected ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  {item.secondary && (
                    <span className="text-[10px] text-slate-500">{item.secondary}</span>
                  )}
                  <span className="font-bold text-slate-900">
                    {val.toLocaleString('en-IN')}{valueSuffix}
                  </span>
                </div>
              </div>

              {/* Progress Track */}
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5">
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{ 
                    width: `${pct}%`, 
                    backgroundColor: item.color || '#164E8A',
                    opacity: activeIdx !== null && activeIdx !== idx ? 0.6 : 1
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Semi-Circular Risk Meter Dial Gauge
 */
export function RiskGauge({ score = 0.885, title = "GNN Risk Assessment", size = 200 }) {
  const clampedScore = Math.min(1.0, Math.max(0.0, Number(score) || 0));
  const pct = clampedScore * 100;

  // Arc angles from -180 deg to 0 deg (top half circle)
  const radius = 70;
  const strokeWidth = 14;
  const cx = size / 2;
  const cy = size / 2 + 10;

  // Circumference of semi-circle
  const semiCircumference = Math.PI * radius;
  const strokeDashoffset = semiCircumference * (1 - clampedScore);

  let statusLabel = "LOW RISK";
  let statusColor = "#164E8A";
  if (clampedScore >= 0.85) {
    statusLabel = "CRITICAL AML";
    statusColor = "#DC2626";
  } else if (clampedScore >= 0.70) {
    statusLabel = "HIGH RISK";
    statusColor = "#EA580C";
  } else if (clampedScore >= 0.40) {
    statusLabel = "MEDIUM SUSPICION";
    statusColor = "#D97706";
  }

  return (
    <div className="fintech-card p-5 flex flex-col items-center justify-between text-center">
      <div className="w-full border-b border-slate-200 pb-2 flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-900">{title}</h4>
        <span 
          className="text-[10px] font-bold px-2 py-0.5 rounded-md font-mono"
          style={{ backgroundColor: `${statusColor}15`, color: statusColor }}
        >
          {statusLabel}
        </span>
      </div>

      <div className="relative my-2">
        <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
          {/* Background Track */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Active Gradient Arc */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke={statusColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={semiCircumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 top-6 flex flex-col items-center justify-center">
          <span className="text-3xl font-black font-mono tracking-tight" style={{ color: statusColor }}>
            {pct.toFixed(1)}%
          </span>
          <span className="text-[11px] text-slate-500 font-medium">Confidence: 94.8%</span>
        </div>
      </div>

      {/* Threshold Scale Marker */}
      <div className="w-full grid grid-cols-4 gap-1 text-[9px] font-mono text-slate-500 pt-2 border-t border-slate-200">
        <span className="text-left text-[#164E8A]">0% Safe</span>
        <span className="text-center text-amber-600">40% Med</span>
        <span className="text-center text-orange-600">70% High</span>
        <span className="text-right text-red-600">85% Crit</span>
      </div>
    </div>
  );
}

/**
 * ROC and Precision-Recall Diagnostic Curves
 */
export function RocPrCurveChart() {
  const [activeTab, setActiveTab] = useState('ROC'); // 'ROC' | 'PR'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // SVG dimensions
  const width = 380;
  const height = 210;
  const pad = 35;
  const plotW = width - pad * 2;
  const plotH = height - pad * 2;

  // ROC Curve Points (FPR vs TPR)
  const rocPoints = [
    { x: 0.00, y: 0.00, th: 1.00 },
    { x: 0.01, y: 0.45, th: 0.95 },
    { x: 0.02, y: 0.72, th: 0.88 },
    { x: 0.04, y: 0.88, th: 0.75 },
    { x: 0.08, y: 0.94, th: 0.50 },
    { x: 0.15, y: 0.97, th: 0.30 },
    { x: 0.30, y: 0.99, th: 0.15 },
    { x: 1.00, y: 1.00, th: 0.00 }
  ];

  // Baseline XGBoost ROC
  const xgbRoc = [
    { x: 0.00, y: 0.00 },
    { x: 0.05, y: 0.52 },
    { x: 0.12, y: 0.76 },
    { x: 0.22, y: 0.86 },
    { x: 0.40, y: 0.92 },
    { x: 1.00, y: 1.00 }
  ];

  // PR Curve Points (Recall vs Precision)
  const prPoints = [
    { x: 0.00, y: 0.99, th: 0.99 },
    { x: 0.45, y: 0.98, th: 0.90 },
    { x: 0.72, y: 0.96, th: 0.80 },
    { x: 0.88, y: 0.94, th: 0.65 },
    { x: 0.92, y: 0.91, th: 0.50 },
    { x: 0.95, y: 0.84, th: 0.35 },
    { x: 0.98, y: 0.62, th: 0.20 },
    { x: 1.00, y: 0.28, th: 0.00 }
  ];

  const currentPoints = activeTab === 'ROC' ? rocPoints : prPoints;

  const toSvgCoords = (p) => ({
    x: pad + p.x * plotW,
    y: pad + (1 - p.y) * plotH
  });

  const pathString = currentPoints.reduce((acc, p, i) => {
    const pt = toSvgCoords(p);
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const xgbPath = activeTab === 'ROC' ? xgbRoc.reduce((acc, p, i) => {
    const pt = toSvgCoords(p);
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '') : '';

  return (
    <div className="fintech-card p-5 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h4 className="text-xs font-bold text-slate-900">Model Discriminative Power</h4>
          <p className="text-[11px] text-slate-500">GraphSAGE vs Baseline Ensembles</p>
        </div>
        <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('ROC')}
            className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-colors ${
              activeTab === 'ROC' ? 'bg-[#164E8A] text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ROC (AUC 0.978)
          </button>
          <button
            onClick={() => setActiveTab('PR')}
            className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-colors ${
              activeTab === 'PR' ? 'bg-[#164E8A] text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            PR Curve (F1 0.930)
          </button>
        </div>
      </div>

      {/* SVG Canvas Plot */}
      <div className="relative flex justify-center">
        <svg width={width} height={height} className="overflow-visible bg-slate-50 rounded-lg border border-slate-200">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((val, idx) => {
            const y = pad + (1 - val) * plotH;
            const x = pad + val * plotW;
            return (
              <g key={idx} className="text-[9px] fill-slate-400 font-mono">
                <line x1={pad} y1={y} x2={width - pad} y2={y} stroke="#E2E8F0" strokeDasharray="3 3" />
                <line x1={x} y1={pad} x2={x} y2={height - pad} stroke="#E2E8F0" strokeDasharray="3 3" />
                <text x={pad - 6} y={y + 3} textAnchor="end">{val.toFixed(2)}</text>
                <text x={x} y={height - pad + 14} textAnchor="middle">{val.toFixed(2)}</text>
              </g>
            );
          })}

          {/* Random Baseline Diagonal */}
          {activeTab === 'ROC' && (
            <line 
              x1={pad} y1={height - pad} 
              x2={width - pad} y2={pad} 
              stroke="#CBD5E1" 
              strokeDasharray="4 4" 
              strokeWidth="1.5"
            />
          )}

          {/* XGBoost Baseline Line */}
          {activeTab === 'ROC' && (
            <path 
              d={xgbPath} 
              fill="none" 
              stroke="#94A3B8" 
              strokeWidth="2" 
              strokeDasharray="5 3"
            />
          )}

          {/* Primary GNN GraphSAGE Line */}
          <path
            d={pathString}
            fill="none"
            stroke="#164E8A"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Interactive Data Points */}
          {currentPoints.map((p, idx) => {
            const pt = toSvgCoords(p);
            const isHovered = hoveredPoint === idx;
            return (
              <circle
                key={idx}
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? 6 : 3.5}
                fill={isHovered ? "#DC2626" : "#164E8A"}
                stroke="#FFFFFF"
                strokeWidth="1.5"
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHoveredPoint(idx)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint !== null && (
          <div className="absolute top-2 right-2 bg-slate-900 text-white text-[10px] p-2 rounded-md shadow-md font-mono space-y-0.5 pointer-events-none">
            <div>Threshold: ≥ {currentPoints[hoveredPoint].th}</div>
            <div>{activeTab === 'ROC' ? 'FPR' : 'Recall'}: {(currentPoints[hoveredPoint].x * 100).toFixed(1)}%</div>
            <div>{activeTab === 'ROC' ? 'TPR' : 'Precision'}: {(currentPoints[hoveredPoint].y * 100).toFixed(1)}%</div>
          </div>
        )}
      </div>

      {/* Legend & Stats */}
      <div className="flex items-center justify-between text-xs pt-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium text-slate-800">
            <span className="h-2 w-4 bg-[#164E8A] rounded-xs inline-block"></span>
            GraphSAGE (AUC 0.978)
          </span>
          {activeTab === 'ROC' && (
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="h-0.5 w-4 bg-slate-400 inline-block"></span>
              XGBoost (AUC 0.912)
            </span>
          )}
        </div>
        <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
          +6.6% AUC Lift over Baseline
        </span>
      </div>
    </div>
  );
}

/**
 * 2x2 Confusion Matrix Heatmap
 */
export function ConfusionMatrixHeatmap() {
  return (
    <div className="fintech-card p-5 space-y-4">
      <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-900">AML Binary Classification Matrix</h4>
          <p className="text-[11px] text-slate-500">Empirical Test Dataset (N = 10,000 txns)</p>
        </div>
        <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          Accuracy: 98.4%
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* True Positive (Critical AML Caught) */}
        <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 space-y-1">
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-semibold text-emerald-900">True Positives (TP)</span>
            <span className="font-mono text-emerald-700 font-bold">1,836</span>
          </div>
          <p className="text-[10px] text-emerald-700">Laundering Rings Blocked</p>
          <div className="w-full bg-emerald-200 h-1 rounded-full overflow-hidden">
            <div className="bg-emerald-600 h-full w-[91.8%]"></div>
          </div>
          <span className="text-[9px] font-mono text-emerald-800">Recall: 91.8%</span>
        </div>

        {/* False Positive (Normal Flagged) */}
        <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200 space-y-1">
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-semibold text-amber-900">False Positives (FP)</span>
            <span className="font-mono text-amber-700 font-bold">112</span>
          </div>
          <p className="text-[10px] text-amber-700">Benign Commercial Review</p>
          <div className="w-full bg-amber-200 h-1 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full w-[5.8%]"></div>
          </div>
          <span className="text-[9px] font-mono text-amber-800">FPR: 1.4% (Ultra Low)</span>
        </div>

        {/* False Negative (Missed Laundering) */}
        <div className="p-3 rounded-lg bg-red-50/80 border border-red-200 space-y-1">
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-semibold text-red-900">False Negatives (FN)</span>
            <span className="font-mono text-red-700 font-bold">164</span>
          </div>
          <p className="text-[10px] text-red-700">Evasive Structuring Leaks</p>
          <div className="w-full bg-red-200 h-1 rounded-full overflow-hidden">
            <div className="bg-red-500 h-full w-[8.2%]"></div>
          </div>
          <span className="text-[9px] font-mono text-red-800">Miss Rate: 8.2%</span>
        </div>

        {/* True Negative (Safe Cleared) */}
        <div className="p-3 rounded-lg bg-blue-50/80 border border-blue-200 space-y-1">
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-semibold text-blue-900">True Negatives (TN)</span>
            <span className="font-mono text-blue-700 font-bold">7,888</span>
          </div>
          <p className="text-[10px] text-blue-700">Auto-Approved Legitimate</p>
          <div className="w-full bg-blue-200 h-1 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full w-[98.6%]"></div>
          </div>
          <span className="text-[9px] font-mono text-blue-800">Specificity: 98.6%</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Feature Importance Horizontal Bars
 */
export function FeatureImportanceBar({ features = [] }) {
  const defaultFeatures = [
    { name: "Sender Out-Degree Fan-Out", impact: 34, isRisk: true },
    { name: "1-Hour Transaction Velocity Burst", impact: 28, isRisk: true },
    { name: "Circular Cycle Topology Membership", impact: 22, isRisk: true },
    { name: "Rs. 500k CTR Structuring Proximity", impact: 14, isRisk: true },
    { name: "Verified Merchant Whitelist History", impact: -18, isRisk: false }
  ];

  const list = features.length > 0 ? features : defaultFeatures;

  return (
    <div className="fintech-card p-5 space-y-3">
      <div className="border-b border-slate-200 pb-3">
        <h4 className="text-xs font-bold text-slate-900">GraphSAGE Explainability Attribution</h4>
        <p className="text-[11px] text-slate-500">Shapley Feature Impact on Node Risk Score</p>
      </div>

      <div className="space-y-2.5 pt-1">
        {list.map((f, idx) => (
          <div key={idx} className="space-y-1 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-700 text-[11px]">{f.name}</span>
              <span className={`font-mono font-bold text-[11px] ${f.isRisk ? 'text-red-600' : 'text-emerald-600'}`}>
                {f.isRisk ? `+${f.impact}% Risk` : `${f.impact}% Mitigation`}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-300 ${f.isRisk ? 'bg-red-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.abs(f.impact) * 2.5}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
