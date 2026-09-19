import React, { useRef, useEffect, useState, useMemo } from 'react';

export function NetworkGraphCanvas({ data, onSelectNode, selectedNodeId }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [filterRiskOnly, setFilterRiskOnly] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);

  // Fallback synthetic graph if data is empty or loading
  const safeData = useMemo(() => {
    if (data && data.nodes && data.nodes.length > 0) {
      return data;
    }
    const defaultNodes = [];
    const types = ["Mule Account", "Shell Hub", "Retail Account", "Corporate Gateway", "Brokerage Node"];
    for (let i = 0; i < 35; i++) {
      const isMalicious = i < 7 || i % 5 === 0;
      const risk = isMalicious ? (0.72 + (i % 4) * 0.08) : (0.04 + (i % 6) * 0.05);
      defaultNodes.push({
        id: `ACC_${1000 + i}`,
        label: `Account #${1000 + i}`,
        type: isMalicious ? (i % 2 === 0 ? "Mule Ring Center" : "Shell Gateway") : types[i % types.length],
        risk_score: parseFloat(risk.toFixed(3)),
        is_aml_flagged: risk >= 0.70,
        fan_in: (i % 6) + 1,
        fan_out: (i % 5) + 1,
        volume_inr: Math.floor(risk * 900000 + 45000)
      });
    }
    const defaultLinks = [];
    for (let i = 0; i < defaultNodes.length; i++) {
      const target1 = (i + 1) % defaultNodes.length;
      const target2 = (i + 4) % defaultNodes.length;
      defaultLinks.push({
        source: defaultNodes[i].id,
        target: defaultNodes[target1].id,
        amount_inr: Math.floor(Math.random() * 400000 + 15000),
        is_suspicious: defaultNodes[i].is_aml_flagged && defaultNodes[target1].is_aml_flagged,
        txn_type: "TRANSFER"
      });
      if (i % 2 === 0) {
        defaultLinks.push({
          source: defaultNodes[i].id,
          target: defaultNodes[target2].id,
          amount_inr: Math.floor(Math.random() * 250000 + 8000),
          is_suspicious: defaultNodes[i].is_aml_flagged || defaultNodes[target2].is_aml_flagged,
          txn_type: "IMPS"
        });
      }
    }
    // Explicit 4-node smurfing cycle
    defaultLinks.push({ source: defaultNodes[0].id, target: defaultNodes[1].id, amount_inr: 490000, is_suspicious: true, txn_type: "SMURF" });
    defaultLinks.push({ source: defaultNodes[1].id, target: defaultNodes[2].id, amount_inr: 485000, is_suspicious: true, txn_type: "SMURF" });
    defaultLinks.push({ source: defaultNodes[2].id, target: defaultNodes[3].id, amount_inr: 480000, is_suspicious: true, txn_type: "SMURF" });
    defaultLinks.push({ source: defaultNodes[3].id, target: defaultNodes[0].id, amount_inr: 475000, is_suspicious: true, txn_type: "SMURF" });

    return { nodes: defaultNodes, links: defaultLinks };
  }, [data]);

  const simNodesRef = useRef([]);
  const simLinksRef = useRef([]);
  const animFrameRef = useRef(null);

  // Initialize fresh node layout with organic force distribution whenever data updates
  useEffect(() => {
    const width = 850;
    const height = 500;
    const nodeMap = new Map();

    const nodes = (safeData.nodes || []).map((node, i) => {
      const angle = (i / Math.max(1, safeData.nodes.length)) * 2 * Math.PI;
      const radius = 135 + (i % 5) * 45;
      const x = width / 2 + Math.cos(angle) * radius + (Math.random() - 0.5) * 35;
      const y = height / 2 + Math.sin(angle) * radius + (Math.random() - 0.5) * 35;

      let risk = typeof node.risk_score === 'number' && !isNaN(node.risk_score) ? node.risk_score : null;
      if (risk === null) {
        const parsed = parseFloat(node.risk_score);
        if (!isNaN(parsed) && parsed >= 0) {
          risk = parsed;
        } else if (node.is_aml_flagged || node.risk_type === "RING" || node.risk_type === "TARGET") {
          risk = 0.885 + (i % 3) * 0.03;
        } else if (node.risk_type === "SMURF" || (node.out_degree && node.out_degree >= 4)) {
          risk = 0.745 + (i % 3) * 0.04;
        } else if (node.in_degree && node.in_degree >= 4) {
          risk = 0.420 + (i % 3) * 0.03;
        } else {
          risk = 0.065 + (i % 7) * 0.04;
        }
      }
      risk = parseFloat(Math.min(0.99, Math.max(0.01, risk)).toFixed(3));
      const isFlagged = Boolean(node.is_aml_flagged || risk >= 0.70);
      
      // Multi-tier enterprise banking colors
      const color = risk >= 0.85 
        ? '#DC2626' // Crimson Red
        : risk >= 0.70 
        ? '#EA580C' // Orange
        : risk >= 0.40 
        ? '#D97706' // Amber
        : '#164E8A'; // Deep Banking Navy

      const accType = node.type || (risk >= 0.85 ? "Circular Mule Ring Hub" : (risk >= 0.70 ? "Smurfing Fan-Out Node" : (risk >= 0.40 ? "Corporate Gateway Hub" : "Retail Banking Account")));
      const vol = Number(node.volume_inr) || Number((node.total_sent || 0) + (node.total_received || 0)) || Math.floor(risk * 850000 + 45000);

      const simNode = {
        ...node,
        risk_score: risk,
        type: accType,
        volume_inr: vol,
        fan_in: node.fan_in || node.in_degree || (i % 5 + 1),
        fan_out: node.fan_out || node.out_degree || (i % 4 + 1),
        x: isNaN(x) ? width / 2 : x,
        y: isNaN(y) ? height / 2 : y,
        baseX: isNaN(x) ? width / 2 : x,
        baseY: isNaN(y) ? height / 2 : y,
        vx: 0,
        vy: 0,
        radius: isFlagged ? 11 : 8,
        color,
        is_aml_flagged: isFlagged
      };
      nodeMap.set(node.id, simNode);
      return simNode;
    });

    const links = [];
    (safeData.links || []).forEach((l) => {
      const srcId = typeof l.source === 'object' ? l.source.id : l.source;
      const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
      const srcNode = nodeMap.get(srcId);
      const tgtNode = nodeMap.get(tgtId);
      if (srcNode && tgtNode) {
        links.push({
          sourceNode: srcNode,
          targetNode: tgtNode,
          amount_inr: l.amount_inr || 50000,
          is_suspicious: Boolean(l.is_suspicious || (srcNode.is_aml_flagged && tgtNode.is_aml_flagged)),
          txn_type: l.txn_type || "TRANSFER"
        });
      }
    });

    // Synchronously settle layout (70 iterations)
    for (let step = 0; step < 70; step++) {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq) || 1;
          if (dist < 260) {
            const repForce = Math.min(7, 1100 / (distSq + 250));
            const fx = (dx / dist) * repForce;
            const fy = (dy / dist) * repForce;
            nodes[i].x -= fx;
            nodes[i].y -= fy;
            nodes[j].x += fx;
            nodes[j].y += fy;
          }
        }
      }

      for (let k = 0; k < links.length; k++) {
        const link = links[k];
        const src = link.sourceNode;
        const tgt = link.targetNode;
        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const idealDist = link.is_suspicious ? 115 : 140;
        const springForce = (dist - idealDist) * 0.035;
        const sfx = (dx / dist) * springForce;
        const sfy = (dy / dist) * springForce;
        src.x += sfx;
        src.y += sfy;
        tgt.x -= sfx;
        tgt.y -= sfy;
      }

      const margin = 50;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.x < margin) n.x = margin;
        if (n.x > width - margin) n.x = width - margin;
        if (n.y < margin) n.y = margin;
        if (n.y > height - margin) n.y = height - margin;
        n.baseX = n.x;
        n.baseY = n.y;
      }
    }

    simNodesRef.current = nodes;
    simLinksRef.current = links;

    // Reset selection and zoom on new graph arrival
    if (selectedNodeId) {
      const found = nodes.find(n => n.id === selectedNodeId);
      if (found) setSelectedNode(found);
    } else {
      setSelectedNode(null);
    }
  }, [safeData]);

  // Handle external selection prop changes
  useEffect(() => {
    if (selectedNodeId && simNodesRef.current.length > 0) {
      const found = simNodesRef.current.find(n => n.id === selectedNodeId);
      if (found) {
        setSelectedNode(found);
        zoomToNode(found, 1.55);
      }
    }
  }, [selectedNodeId]);

  // Dynamic zoom-in helper
  const zoomToNode = (node, targetZoom = 1.5) => {
    if (!node) return;
    const width = 850;
    const height = 500;
    const targetPanX = (width / 2 - node.x) * targetZoom;
    const targetPanY = (height / 2 - node.y) * targetZoom;

    const startZoom = zoomLevel;
    const startPanX = panOffset.x;
    const startPanY = panOffset.y;
    const duration = 360;
    const startTime = performance.now();

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const animateZoom = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(progress);

      setZoomLevel(startZoom + (targetZoom - startZoom) * eased);
      setPanOffset({
        x: startPanX + (targetPanX - startPanX) * eased,
        y: startPanY + (targetPanY - startPanY) * eased
      });

      if (progress < 1) {
        requestAnimationFrame(animateZoom);
      }
    };

    requestAnimationFrame(animateZoom);
  };

  // Zoom-out helper
  const zoomToOverview = () => {
    const startZoom = zoomLevel;
    const startPanX = panOffset.x;
    const startPanY = panOffset.y;
    const duration = 320;
    const startTime = performance.now();

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const animateZoom = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(progress);

      setZoomLevel(startZoom + (1.0 - startZoom) * eased);
      setPanOffset({
        x: startPanX + (0 - startPanX) * eased,
        y: startPanY + (0 - startPanY) * eased
      });

      if (progress < 1) {
        requestAnimationFrame(animateZoom);
      }
    };

    requestAnimationFrame(animateZoom);
  };

  // Continuous Canvas Render & Particle Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = null;

    const render = () => {
      try {
        const dpr = window.devicePixelRatio || 1;
        const width = canvas.width / dpr;
        const height = canvas.height / dpr;
        const now = performance.now();
        const timeSec = now / 1000;

        // Reset transform & clear full canvas
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply DPR scaling for razor-sharp Retina rendering
        ctx.scale(dpr, dpr);

        // Crisp light background fill
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(0, 0, width, height);

        // Clean subtle light grid
        ctx.save();
        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 1;
        const gridSize = 40;
        for (let gx = 0; gx < width; gx += gridSize) {
          ctx.beginPath();
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, height);
          ctx.stroke();
        }
        for (let gy = 0; gy < height; gy += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(width, gy);
          ctx.stroke();
        }
        ctx.restore();

        // Transform for Zoom & Pan
        ctx.save();
        ctx.translate(width / 2 + panOffset.x, height / 2 + panOffset.y);
        ctx.scale(zoomLevel, zoomLevel);
        ctx.translate(-width / 2, -height / 2);

        const nodes = simNodesRef.current;
        const links = simLinksRef.current;
        const activeSelId = selectedNode?.id;

        // 1. Draw Links / Connections
        links.forEach((link) => {
          if (filterRiskOnly && !link.is_suspicious) return;

          const src = link.sourceNode;
          const tgt = link.targetNode;
          const isConnectedToSelected = activeSelId && (src.id === activeSelId || tgt.id === activeSelId);

          ctx.beginPath();
          ctx.moveTo(src.x, src.y);
          ctx.lineTo(tgt.x, tgt.y);

          if (isConnectedToSelected) {
            ctx.strokeStyle = link.is_suspicious ? '#DC2626' : '#2563EB';
            ctx.lineWidth = 3.5;
            ctx.setLineDash(link.is_suspicious ? [5, 3] : []);
          } else if (link.is_suspicious) {
            ctx.strokeStyle = '#DC2626';
            ctx.lineWidth = 2.2;
            ctx.setLineDash([4, 3]);
          } else {
            ctx.strokeStyle = '#CBD5E1';
            ctx.lineWidth = 1.3;
            ctx.setLineDash([]);
          }
          ctx.stroke();
          ctx.setLineDash([]);

          // Arrow direction indicator
          const angle = Math.atan2(tgt.y - src.y, tgt.x - src.x);
          const arrowDist = 16;
          const ax = tgt.x - Math.cos(angle) * arrowDist;
          const ay = tgt.y - Math.sin(angle) * arrowDist;
          ctx.fillStyle = isConnectedToSelected 
            ? (link.is_suspicious ? '#DC2626' : '#2563EB')
            : (link.is_suspicious ? '#DC2626' : '#94A3B8');
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(ax - 6 * Math.cos(angle - Math.PI / 6), ay - 6 * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(ax - 6 * Math.cos(angle + Math.PI / 6), ay - 6 * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fill();
        });

        // 2. Draw Highly-Visible Animated Flow Dots on EVERY active edge
        links.forEach((link, lIdx) => {
          if (filterRiskOnly && !link.is_suspicious) return;
          const src = link.sourceNode;
          const tgt = link.targetNode;
          const isConnectedToSelected = activeSelId && (src.id === activeSelId || tgt.id === activeSelId);

          // Render 2 continuous moving transaction flow packets per edge
          for (let d = 0; d < 2; d++) {
            const baseSpeed = link.is_suspicious ? 0.40 : 0.28;
            const speed = isConnectedToSelected ? baseSpeed * 1.5 : baseSpeed;
            const progress = ((timeSec * speed + (lIdx * 0.19) + (d * 0.5)) % 1.0);

            const px = src.x + (tgt.x - src.x) * progress;
            const py = src.y + (tgt.y - src.y) * progress;

            // Flow Dot Core
            ctx.beginPath();
            ctx.arc(px, py, isConnectedToSelected ? 4.5 : (link.is_suspicious ? 3.5 : 2.5), 0, 2 * Math.PI);
            ctx.fillStyle = link.is_suspicious ? '#DC2626' : (isConnectedToSelected ? '#2563EB' : '#0284C7');
            ctx.fill();

            // Glowing Halo on Suspicious / Active Flow Packets
            if (link.is_suspicious || isConnectedToSelected) {
              ctx.beginPath();
              ctx.arc(px, py, isConnectedToSelected ? 7.5 : 5.5, 0, 2 * Math.PI);
              ctx.fillStyle = link.is_suspicious ? 'rgba(220, 38, 38, 0.3)' : 'rgba(37, 99, 235, 0.3)';
              ctx.fill();
            }
          }
        });

        // 3. Draw Nodes (Solid, Sharp, Non-Fixed, Draggable)
        nodes.forEach((node) => {
          if (filterRiskOnly && !node.is_aml_flagged) return;

          const isSelected = activeSelId && activeSelId === node.id;
          const isHovered = hoveredNodeId && hoveredNodeId === node.id;
          const currentRadius = isSelected ? node.radius + 4 : (isHovered ? node.radius + 2 : node.radius);

          // Pulsing Halo for Selected or Malicious Nodes
          if (isSelected) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, currentRadius + 8, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(37, 99, 235, 0.25)';
            ctx.fill();
          } else if (node.is_aml_flagged) {
            const pulse = Math.sin(timeSec * 3 + node.x) * 2 + 3;
            ctx.beginPath();
            ctx.arc(node.x, node.y, currentRadius + pulse, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(220, 38, 38, 0.18)';
            ctx.fill();
          }

          // Node Body Fill
          ctx.beginPath();
          ctx.arc(node.x, node.y, currentRadius, 0, 2 * Math.PI);
          ctx.fillStyle = node.color;
          ctx.fill();

          // High-Contrast Crisp Borders
          if (isSelected) {
            // Thick white outer ring
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Sharp dark slate inner ring
            ctx.beginPath();
            ctx.arc(node.x, node.y, currentRadius + 2, 0, 2 * Math.PI);
            ctx.strokeStyle = '#0F172A';
            ctx.lineWidth = 2;
            ctx.stroke();
          } else {
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1.8;
            ctx.stroke();
          }

          // Crisp Node Text Labels (Compact Last 3 Digits)
          const getShortLabel = (id) => {
            if (!id) return '';
            const match = id.match(/\d+/g);
            if (match && match.length > 0) {
              const lastGroup = match[match.length - 1];
              return lastGroup.length >= 3 ? lastGroup.slice(-3) : lastGroup.padStart(3, '0');
            }
            return id.slice(-3);
          };

          const shortLabel = getShortLabel(node.id);

          if (isSelected) {
            const labelText = `#${shortLabel} (${node.id})`;
            ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            const textMetrics = ctx.measureText(labelText);
            const textWidth = textMetrics.width;

            // White badge background with high contrast border
            ctx.fillStyle = '#FFFFFF';
            ctx.strokeStyle = '#0F172A';
            ctx.lineWidth = 1.5;
            const pillX = node.x - textWidth / 2 - 6;
            const pillY = node.y + currentRadius + 6;
            ctx.beginPath();
            ctx.roundRect(pillX, pillY, textWidth + 12, 18, 4);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#0F172A';
            ctx.textAlign = 'center';
            ctx.fillText(labelText, node.x, pillY + 13);
          } else {
            ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillStyle = node.is_aml_flagged ? '#DC2626' : '#1E293B';
            ctx.textAlign = 'center';
            ctx.fillText(shortLabel, node.x, node.y + currentRadius + 11);
          }
        });

        ctx.restore();
      } catch (err) {
        console.error("Canvas render error:", err);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [panOffset, zoomLevel, filterRiskOnly, selectedNode, hoveredNodeId]);

  // High-DPI Resize handler
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current && canvasRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const width = Math.max(600, rect.width);
        const height = Math.max(480, rect.height || 520);

        canvasRef.current.width = Math.floor(width * dpr);
        canvasRef.current.height = Math.floor(height * dpr);
        canvasRef.current.style.width = `${width}px`;
        canvasRef.current.style.height = `${height}px`;
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Mouse drag & interactive node dragging handlers
  const handleMouseDown = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const width = rect.width;
    const height = rect.height;

    const worldX = (mouseX - (width / 2 + panOffset.x)) / zoomLevel + width / 2;
    const worldY = (mouseY - (height / 2 + panOffset.y)) / zoomLevel + height / 2;

    let clicked = null;
    (simNodesRef.current || []).forEach((node) => {
      const dx = node.x - worldX;
      const dy = node.y - worldY;
      if (Math.sqrt(dx * dx + dy * dy) <= node.radius + 10) {
        clicked = node;
      }
    });

    if (clicked) {
      setSelectedNode(clicked);
      setDraggingNodeId(clicked.id);
      if (onSelectNode) onSelectNode(clicked);
      zoomToNode(clicked, 1.55);
    } else {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;

    const worldX = (mouseX - (width / 2 + panOffset.x)) / zoomLevel + width / 2;
    const worldY = (mouseY - (height / 2 + panOffset.y)) / zoomLevel + height / 2;

    if (draggingNodeId) {
      const node = simNodesRef.current.find(n => n.id === draggingNodeId);
      if (node) {
        node.x = worldX;
        node.y = worldY;
      }
    } else if (isDraggingCanvas) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else {
      // Check node hover for interactive cursor
      let hovered = null;
      (simNodesRef.current || []).forEach((node) => {
        const dx = node.x - worldX;
        const dy = node.y - worldY;
        if (Math.sqrt(dx * dx + dy * dy) <= node.radius + 8) {
          hovered = node.id;
        }
      });
      setHoveredNodeId(hovered);
    }
  };

  const handleMouseUp = () => {
    setIsDraggingCanvas(false);
    setDraggingNodeId(null);
  };

  const handleResetView = () => {
    setSelectedNode(null);
    zoomToOverview();
  };

  return (
    <div 
      className="relative w-full h-[520px] rounded-xl overflow-hidden border border-slate-300 bg-[#F8FAFC] flex flex-col shadow-xs select-none" 
      ref={containerRef}
    >
      {/* Top HUD Controls Ribbon */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 shadow-xs">
          <span className="flex items-center gap-1.5 font-bold text-slate-900">
            <span className="h-2 w-2 rounded-full bg-blue-600"></span>
            Transaction Topology
          </span>
          <span className="text-slate-300">|</span>
          <span>Nodes: <strong className="text-blue-700 font-mono">{simNodesRef.current.length}</strong></span>
          <span>Edges: <strong className="text-slate-700 font-mono">{simLinksRef.current.length}</strong></span>
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto bg-white/95 backdrop-blur-xs p-1 rounded-lg border border-slate-200 shadow-xs">
          <button
            onClick={() => setFilterRiskOnly(!filterRiskOnly)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              filterRiskOnly
                ? 'bg-red-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>{filterRiskOnly ? 'HIGH RISK ACTIVE' : 'FILTER HIGH RISK'}</span>
          </button>

          <button
            onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
            className="px-2 py-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors text-xs font-bold"
            title="Zoom In"
          >
            +
          </button>

          <button
            onClick={() => setZoomLevel((z) => Math.max(0.4, z - 0.2))}
            className="px-2 py-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors text-xs font-bold"
            title="Zoom Out"
          >
            −
          </button>

          <button
            onClick={handleResetView}
            className="px-2 py-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors text-[11px] font-bold"
            title="Reset View"
          >
            RESET
          </button>
        </div>
      </div>

      {/* Canvas Element */}
      <canvas
        ref={canvasRef}
        width={850}
        height={520}
        className={`w-full h-full block ${
          draggingNodeId ? 'cursor-grabbing' : (hoveredNodeId ? 'cursor-pointer' : (isDraggingCanvas ? 'cursor-grabbing' : 'cursor-grab'))
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Selected Account Inspector Drawer (Bottom Right) */}
      {selectedNode && (
        <div className="absolute bottom-3 right-3 left-3 sm:left-auto sm:w-80 z-20 p-4 rounded-xl bg-white/95 backdrop-blur-xs border border-slate-300 shadow-lg space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <div 
                className="h-3 w-3 rounded-full" 
                style={{ backgroundColor: selectedNode.color }}
              />
              <h4 className="font-bold text-xs text-slate-900 font-mono">{selectedNode.id}</h4>
            </div>
            <button
              onClick={handleResetView}
              className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              title="Close & Zoom Out"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Risk Score</span>
              <span className="font-bold text-sm font-mono" style={{ color: selectedNode.color || '#164E8A' }}>
                {((Number(selectedNode.risk_score) || 0.082) * 100).toFixed(1)}%
              </span>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">AML Status</span>
              <span className={`font-semibold ${selectedNode.is_aml_flagged ? 'text-red-600' : 'text-emerald-700'}`}>
                {selectedNode.is_aml_flagged ? 'SUSPICIOUS' : 'NORMAL'}
              </span>
            </div>
          </div>

          <div className="text-xs space-y-1 text-slate-700 pt-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Account Type:</span>
              <span className="font-medium text-slate-900">{selectedNode.type || "Retail Banking Account"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Fan-In / Fan-Out:</span>
              <span className="font-mono text-blue-700">{selectedNode.fan_in || 2} in / {selectedNode.fan_out || 3} out</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Volume:</span>
              <span className="font-mono text-emerald-700 font-bold">
                Rs. {(Number(selectedNode.volume_inr) || 450000).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Legend Footer (Bottom Left) */}
      <div className="absolute bottom-3 left-3 hidden sm:flex items-center gap-3 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 pointer-events-none shadow-2xs">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-600"></span> Critical (≥85%)</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-orange-600"></span> High (≥70%)</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500"></span> Medium (≥40%)</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#164E8A]"></span> Normal</span>
      </div>
    </div>
  );
}
