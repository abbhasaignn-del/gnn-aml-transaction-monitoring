import networkx as nx
import plotly.graph_objects as go
import numpy as np
from typing import List, Dict, Tuple, Optional

class GraphVisualizer:
    """
    Stage 7: Investigation Dashboard - Network Graph Visualizer
    Renders high-clarity topological transaction networks in Plotly with
    directed arrows, interactive hover telemetry, and AML pattern highlights in INR.
    """
    def __init__(self):
        pass

    def build_plotly_network(
        self, 
        graph, 
        target_account: Optional[str] = None, 
        highlight_rings: bool = True,
        max_nodes: int = 60
    ) -> go.Figure:
        """
        Builds a crisp, high-clarity Plotly network graph with categorized traces,
        directed flow arrows, interactive hover cards, and clean dark-theme aesthetics.
        """
        G = graph.G
        if G.number_of_nodes() == 0:
            fig = go.Figure()
            fig.update_layout(
                title=dict(
                    text="<b>No Transaction Graph Data Available</b>",
                    font=dict(color="#94A3B8", size=14)
                ),
                template="plotly_dark",
                paper_bgcolor="#0F172A",
                plot_bgcolor="#0F172A",
                xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                margin=dict(l=20, r=20, t=40, b=20)
            )
            return fig

        # Filter Subgraph
        if target_account and G.has_node(target_account):
            neighbors = set(G.successors(target_account)) | set(G.predecessors(target_account)) | {target_account}
            if len(neighbors) < max_nodes:
                second_hop = set()
                for n in list(neighbors):
                    second_hop.update(G.successors(n))
                    second_hop.update(G.predecessors(n))
                neighbors = (neighbors | second_hop)
            sub_nodes = list(neighbors)[:max_nodes]
            subG = G.subgraph(sub_nodes)
        else:
            degrees = dict(G.degree())
            top_nodes = sorted(degrees.keys(), key=lambda k: degrees[k], reverse=True)[:max_nodes]
            subG = G.subgraph(top_nodes)

        # Compute Layout with fixed reproducible seed
        pos = nx.spring_layout(subG, k=0.55, iterations=50, seed=42)

        # Detect circular laundering rings
        circular_nodes = set()
        circular_edges = set()
        if highlight_rings:
            cycles = graph.detect_circular_loops(max_length=5)
            for cyc in cycles:
                circular_nodes.update(cyc)
                for idx in range(len(cyc)):
                    u = cyc[idx]
                    v = cyc[(idx + 1) % len(cyc)]
                    circular_edges.add((u, v))

        # Edge traces: normal edges and ring edges
        normal_edge_x, normal_edge_y = [], []
        ring_edge_x, ring_edge_y = [], []
        annotations = []

        for u, v, data in subG.edges(data=True):
            if u in pos and v in pos:
                x0, y0 = pos[u]
                x1, y1 = pos[v]
                amt = data.get("amount", 0.0)
                channel = data.get("channel", "TRANSFER")
                
                is_ring = (u, v) in circular_edges or (u in circular_nodes and v in circular_nodes)
                
                if is_ring:
                    ring_edge_x.extend([x0, x1, None])
                    ring_edge_y.extend([y0, y1, None])
                    arr_color = "#EF4444"
                else:
                    normal_edge_x.extend([x0, x1, None])
                    normal_edge_y.extend([y0, y1, None])
                    arr_color = "#475569"

                # Add directed arrow annotation along edge midpoint
                if len(subG.edges()) <= 45:
                    mx = (x0 * 0.4 + x1 * 0.6)
                    my = (y0 * 0.4 + y1 * 0.6)
                    annotations.append(dict(
                        ax=x0, ay=y0,
                        x=mx, y=my,
                        xref='x', yref='y',
                        axref='x', ayref='y',
                        showarrow=True,
                        arrowhead=2,
                        arrowsize=1.2,
                        arrowwidth=1.5 if is_ring else 1.0,
                        arrowcolor=arr_color,
                        opacity=0.85
                    ))

        normal_edge_trace = go.Scatter(
            x=normal_edge_x, y=normal_edge_y,
            line=dict(width=1.2, color="#475569"),
            hoverinfo="none",
            mode="lines",
            name="Normal Transfers",
            showlegend=False
        )

        ring_edge_trace = go.Scatter(
            x=ring_edge_x, y=ring_edge_y,
            line=dict(width=2.4, color="#EF4444"),
            hoverinfo="none",
            mode="lines",
            name="Laundering Ring Transfers",
            showlegend=False
        )

        # Categorized Node Data
        cats = {
            "focus": {"x": [], "y": [], "text": [], "hover": [], "name": "Focus Account", "color": "#38BDF8", "size": 24},
            "ring": {"x": [], "y": [], "text": [], "hover": [], "name": "Circular Ring (AML)", "color": "#EF4444", "size": 20},
            "smurf": {"x": [], "y": [], "text": [], "hover": [], "name": "Smurfing Hub", "color": "#F59E0B", "size": 18},
            "normal": {"x": [], "y": [], "text": [], "hover": [], "name": "Normal Account", "color": "#10B981", "size": 14}
        }

        for node in subG.nodes():
            if node in pos:
                x, y = pos[node]
                in_deg = subG.in_degree(node)
                out_deg = subG.out_degree(node)
                stats = graph.account_stats.get(node, {
                    "total_sent": 0.0, "total_received": 0.0, "counterparties": set()
                })
                sent = stats.get("total_sent", 0.0)
                recv = stats.get("total_received", 0.0)
                cparties = len(stats.get("counterparties", set()))

                if node == target_account:
                    cat_key = "focus"
                    status = "INSPECTED FOCUS ACCOUNT"
                elif node in circular_nodes:
                    cat_key = "ring"
                    status = "CRITICAL: Circular AML Ring"
                elif out_deg >= 4:
                    cat_key = "smurf"
                    status = "WARNING: Smurfing Structuring Hub"
                else:
                    cat_key = "normal"
                    status = "NORMAL: Legitimate Retail Account"

                hover_html = (
                    f"<b>Account: {node}</b><br>"
                    f"<b>Status:</b> {status}<br>"
                    f"<b>Total Sent:</b> Rs {sent:,.2f}<br>"
                    f"<b>Total Received:</b> Rs {recv:,.2f}<br>"
                    f"<b>In / Out Degree:</b> {in_deg} in / {out_deg} out<br>"
                    f"<b>Direct Counterparties:</b> {cparties} accounts"
                )

                cats[cat_key]["x"].append(x)
                cats[cat_key]["y"].append(y)
                cats[cat_key]["text"].append(node)
                cats[cat_key]["hover"].append(hover_html)

        node_traces = []
        for key, d in cats.items():
            if len(d["x"]) > 0:
                node_traces.append(go.Scatter(
                    x=d["x"], y=d["y"],
                    mode="markers+text",
                    name=d["name"],
                    hoverinfo="text",
                    hovertext=d["hover"],
                    text=d["text"],
                    textposition="top center",
                    textfont=dict(size=10, color="#E2E8F0", family="Inter, sans-serif"),
                    marker=dict(
                        size=d["size"],
                        color=d["color"],
                        line=dict(width=2, color="#0F172A"),
                        opacity=0.95
                    )
                ))

        fig = go.Figure(
            data=[normal_edge_trace, ring_edge_trace] + node_traces,
            layout=go.Layout(
                title=dict(
                    text=f"<b>Topology Network Graph</b> ({len(subG.nodes())} Accounts, {len(subG.edges())} Financial Transfers)",
                    font=dict(color="#F8FAFC", size=15, family="Inter, sans-serif")
                ),
                showlegend=True,
                legend=dict(
                    orientation="h",
                    yanchor="bottom",
                    y=-0.12,
                    xanchor="center",
                    x=0.5,
                    font=dict(color="#94A3B8", size=11),
                    bgcolor="rgba(15, 23, 42, 0.7)"
                ),
                hovermode="closest",
                margin=dict(b=35, l=15, r=15, t=45),
                paper_bgcolor="#0F172A",
                plot_bgcolor="#0F172A",
                xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                annotations=annotations
            )
        )
        return fig
