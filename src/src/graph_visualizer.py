import networkx as nx
import plotly.graph_objects as go
import numpy as np
from typing import List, Dict, Tuple

class GraphVisualizer:
    """
    Stage 7: Investigation Dashboard - Network Graph Visualizer
    Renders clean 2D topological transaction networks with highlighted AML patterns in INR.
    """
    def __init__(self):
        pass

    def build_plotly_network(
        self, 
        graph, 
        target_account: str = None, 
        highlight_rings: bool = True,
        max_nodes: int = 50
    ) -> go.Figure:
        G = graph.G
        if G.number_of_nodes() == 0:
            fig = go.Figure()
            fig.update_layout(
                title="No transaction graph data available",
                template="plotly_dark",
                paper_bgcolor="#111827",
                plot_bgcolor="#111827"
            )
            return fig

        if target_account and G.has_node(target_account):
            neighbors = set(G.successors(target_account)) | set(G.predecessors(target_account)) | {target_account}
            subG = G.subgraph(list(neighbors)[:max_nodes])
        else:
            degrees = dict(G.degree())
            top_nodes = sorted(degrees.keys(), key=lambda k: degrees[k], reverse=True)[:max_nodes]
            subG = G.subgraph(top_nodes)

        pos = nx.spring_layout(subG, k=0.5, iterations=40, seed=42)

        circular_nodes = set()
        if highlight_rings:
            cycles = graph.detect_circular_loops(max_length=5)
            for cyc in cycles:
                circular_nodes.update(cyc)

        edge_x, edge_y = [], []
        edge_hover = []
        for u, v, data in subG.edges(data=True):
            if u in pos and v in pos:
                x0, y0 = pos[u]
                x1, y1 = pos[v]
                edge_x.extend([x0, x1, None])
                edge_y.extend([y0, y1, None])
                amt = data.get("amount", 0)
                edge_hover.append(f"{u} -> {v}<br>Amount: Rs {amt:,.2f}<br>Channel: {data.get('channel', 'N/A')}")

        edge_trace = go.Scatter(
            x=edge_x, y=edge_y,
            line=dict(width=1.2, color="#4B5563"),
            hoverinfo="none",
            mode="lines"
        )

        node_x, node_y = [], []
        node_colors = []
        node_sizes = []
        node_texts = []
        node_hover_labels = []

        for node in subG.nodes():
            if node in pos:
                x, y = pos[node]
                node_x.append(x)
                node_y.append(y)
                
                in_deg = subG.in_degree(node)
                out_deg = subG.out_degree(node)
                stats = graph.account_stats[node]
                sent = stats["total_sent"]
                recv = stats["total_received"]
                
                if node in circular_nodes:
                    node_colors.append("#EF4444")
                    risk_status = "CRITICAL: Circular AML Ring Member"
                    size = 22
                elif out_deg >= 4:
                    node_colors.append("#F59E0B")
                    risk_status = "WARNING: Smurfing / Structuring Hub"
                    size = 18
                elif node == target_account:
                    node_colors.append("#3B82F6")
                    risk_status = "INSPECTED FOCUS ACCOUNT"
                    size = 24
                else:
                    node_colors.append("#10B981")
                    risk_status = "NORMAL / LOW RISK"
                    size = 14
                    
                node_sizes.append(size)
                node_texts.append(node)
                node_hover_labels.append(
                    f"<b>Account: {node}</b><br>"
                    f"Status: {risk_status}<br>"
                    f"In-Degree: {in_deg} | Out-Degree: {out_deg}<br>"
                    f"Total Sent: Rs {sent:,.2f}<br>"
                    f"Total Received: Rs {recv:,.2f}<br>"
                    f"Counterparties: {len(stats['counterparties'])}"
                )

        node_trace = go.Scatter(
            x=node_x, y=node_y,
            mode="markers+text",
            hoverinfo="text",
            text=node_texts,
            textposition="top center",
            textfont=dict(size=9, color="#E5E7EB"),
            hovertext=node_hover_labels,
            marker=dict(
                size=node_sizes,
                color=node_colors,
                line=dict(width=2, color="#1F2937"),
                opacity=0.95
            )
        )

        fig = go.Figure(
            data=[edge_trace, node_trace],
            layout=go.Layout(
                title=dict(
                    text=f"<b>AML Transaction Graph Topology</b> ({len(subG.nodes())} Accounts, {len(subG.edges())} Transfers)",
                    font=dict(color="#F3F4F6", size=15)
                ),
                showlegend=False,
                hovermode="closest",
                margin=dict(b=15, l=15, r=15, t=45),
                paper_bgcolor="#0F172A",
                plot_bgcolor="#0F172A",
                xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                yaxis=dict(showgrid=False, zeroline=False, showticklabels=False)
            )
        )
        return fig
