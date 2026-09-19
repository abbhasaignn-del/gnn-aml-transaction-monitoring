import networkx as nx
import numpy as np
import torch
from collections import defaultdict
from typing import Dict, List, Tuple, Set

class TransactionGraph:
    """
    Stage 3: Graph Construction
    Maps accounts as nodes and transactions as directed edges with rich topological features.
    """
    def __init__(self):
        self.G = nx.MultiDiGraph()
        self.account_stats = defaultdict(lambda: {
            "total_sent": 0.0,
            "total_received": 0.0,
            "tx_sent_count": 0,
            "tx_received_count": 0,
            "counterparties": set(),
            "last_tx_time": None,
            "risk_score": 0.05
        })
        self.transactions_history: List[dict] = []

    def add_transaction(self, tx: dict) -> None:
        """Dynamically ingests a transaction and updates the directed graph topology."""
        sender = tx["sender_account"]
        receiver = tx["receiver_account"]
        amt = float(tx["amount"])
        
        # Ensure nodes exist
        if not self.G.has_node(sender):
            self.G.add_node(sender, account_id=sender)
        if not self.G.has_node(receiver):
            self.G.add_node(receiver, account_id=receiver)
            
        # Add directed edge
        self.G.add_edge(
            sender, 
            receiver, 
            key=tx.get("transaction_id", f"TX_{len(self.transactions_history)}"),
            amount=amt,
            timestamp=tx.get("timestamp", ""),
            channel=tx.get("channel", "ONLINE"),
            tx_type=tx.get("transaction_type", "TRANSFER"),
            is_aml=tx.get("is_aml", 0)
        )
        
        # Update node internal statistics
        s_stats = self.account_stats[sender]
        s_stats["total_sent"] += amt
        s_stats["tx_sent_count"] += 1
        s_stats["counterparties"].add(receiver)
        
        r_stats = self.account_stats[receiver]
        r_stats["total_received"] += amt
        r_stats["tx_received_count"] += 1
        r_stats["counterparties"].add(sender)
        
        self.transactions_history.append(tx)

    def compute_node_features(self, account_id: str) -> np.ndarray:
        """
        Extracts an 8-dimensional node feature vector for GNN inputs:
        [0]: log_total_sent
        [1]: log_total_received
        [2]: out_degree (normalized)
        [3]: in_degree (normalized)
        [4]: flow_ratio (received / (sent + 1.0))
        [5]: counterparty_diversity (unique counterparties)
        [6]: cycle_involvement (1.0 if in a detected circular cycle, else 0.0)
        [7]: historical_risk_prior
        """
        stats = self.account_stats[account_id]
        sent = stats["total_sent"]
        recv = stats["total_received"]
        out_deg = self.G.out_degree(account_id) if self.G.has_node(account_id) else 0
        in_deg = self.G.in_degree(account_id) if self.G.has_node(account_id) else 0
        
        log_sent = np.log1p(sent) / 12.0
        log_recv = np.log1p(recv) / 12.0
        flow_ratio = float(recv) / float(sent + 10.0)
        flow_ratio = min(5.0, flow_ratio) / 5.0
        counterparties_count = min(30.0, float(len(stats["counterparties"]))) / 30.0
        
        in_cycle = 0.0
        if self.G.has_node(account_id) and out_deg > 0 and in_deg > 0:
            # Check if part of 2-hop or 3-hop circular loop
            try:
                # Check for simple cycle
                successors = set(self.G.successors(account_id))
                predecessors = set(self.G.predecessors(account_id))
                if successors & predecessors:
                    in_cycle = 1.0
                else:
                    # 3-hop check
                    for succ in successors:
                        if set(self.G.successors(succ)) & predecessors:
                            in_cycle = 1.0
                            break
            except Exception:
                in_cycle = 0.0
                
        risk_prior = stats["risk_score"]
        
        return np.array([
            log_sent,
            log_recv,
            min(1.0, out_deg / 20.0),
            min(1.0, in_deg / 20.0),
            flow_ratio,
            counterparties_count,
            in_cycle,
            risk_prior
        ], dtype=np.float32)

    def extract_subgraph_data(self, target_nodes: List[str] = None, max_hops: int = 2) -> Tuple[torch.Tensor, torch.Tensor, List[str]]:
        """
        Extracts adjacency structure and node feature matrices for PyTorch GNN execution.
        Returns:
        - x: [num_nodes, node_feat_dim] Tensor
        - edge_index: [2, num_edges] LongTensor
        - node_list: list of account IDs corresponding to node tensor rows
        """
        if not target_nodes:
            sub_nodes = list(self.G.nodes())
        else:
            sub_nodes_set = set(target_nodes)
            for _ in range(max_hops):
                neighbors = set()
                for n in sub_nodes_set:
                    if self.G.has_node(n):
                        neighbors.update(self.G.successors(n))
                        neighbors.update(self.G.predecessors(n))
                sub_nodes_set.update(neighbors)
            sub_nodes = list(sub_nodes_set)
            
        if not sub_nodes:
            sub_nodes = ["ACC_DEFAULT"]
            
        node_to_idx = {n: i for i, n in enumerate(sub_nodes)}
        
        # Build node feature tensor
        node_features = [self.compute_node_features(n) for n in sub_nodes]
        x = torch.tensor(np.array(node_features), dtype=torch.float32)
        
        # Build edge index
        src_list, dst_list = [], []
        for u, v in self.G.edges():
            if u in node_to_idx and v in node_to_idx:
                src_list.append(node_to_idx[u])
                dst_list.append(node_to_idx[v])
                
        if not src_list:
            edge_index = torch.empty((2, 0), dtype=torch.long)
        else:
            edge_index = torch.tensor([src_list, dst_list], dtype=torch.long)
            
        return x, edge_index, sub_nodes

    def detect_circular_loops(self, max_length: int = 5) -> List[List[str]]:
        """Finds directed circular money routing loops."""
        try:
            # Convert to simple DiGraph to find elementary cycles
            simple_dg = nx.DiGraph(self.G)
            cycles = list(nx.simple_cycles(simple_dg))
            return [c for c in cycles if 2 <= len(c) <= max_length]
        except Exception:
            return []
