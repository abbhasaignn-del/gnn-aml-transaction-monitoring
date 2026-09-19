import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import os
from typing import Tuple, Dict

class SAGEConvLayer(nn.Module):
    """
    GraphSAGE Mean Aggregator Layer.
    Aggregates neighbor features and combines with self features:
    h_v = W * concat(h_v, mean_{u in N(v)}(h_u))
    """
    def __init__(self, in_features: int, out_features: int):
        super().__init__()
        self.linear_self = nn.Linear(in_features, out_features, bias=False)
        self.linear_neigh = nn.Linear(in_features, out_features, bias=True)
        self.batch_norm = nn.BatchNorm1d(out_features)

    def forward(self, x: torch.Tensor, edge_index: torch.Tensor) -> torch.Tensor:
        num_nodes = x.size(0)
        
        # Self transformation
        self_feat = self.linear_self(x)
        
        # Neighborhood aggregation
        if edge_index.size(1) == 0:
            neigh_feat = torch.zeros_like(self_feat)
        else:
            src, dst = edge_index[0], edge_index[1]
            # Aggregate incoming neighbors
            neigh_sum = torch.zeros(num_nodes, x.size(1), device=x.device)
            neigh_count = torch.zeros(num_nodes, 1, device=x.device)
            
            neigh_sum.index_add_(0, dst, x[src])
            ones = torch.ones(src.size(0), 1, device=x.device)
            neigh_count.index_add_(0, dst, ones)
            
            neigh_mean = neigh_sum / torch.clamp(neigh_count, min=1.0)
            neigh_feat = self.linear_neigh(neigh_mean)
            
        out = self_feat + neigh_feat
        if out.size(0) > 1:
            out = self.batch_norm(out)
        return F.relu(out)

class AMLGraphSAGE(nn.Module):
    """
    Stage 5: GNN Model Analysis
    2-Layer GraphSAGE Network + Transaction Edge Classifier for AML Risk Scoring.
    """
    def __init__(self, node_in_dim: int = 8, edge_in_dim: int = 8, hidden_dim: int = 32, out_dim: int = 16):
        super().__init__()
        self.conv1 = SAGEConvLayer(node_in_dim, hidden_dim)
        self.conv2 = SAGEConvLayer(hidden_dim, out_dim)
        self.dropout = nn.Dropout(p=0.2)
        
        # Transaction Risk Scorer Head: takes (sender_node_emb + receiver_node_emb + edge_features)
        total_classifier_dim = out_dim * 2 + edge_in_dim
        self.classifier = nn.Sequential(
            nn.Linear(total_classifier_dim, 32),
            nn.ReLU(),
            nn.Dropout(p=0.2),
            nn.Linear(32, 16),
            nn.ReLU(),
            nn.Linear(16, 1),
            nn.Sigmoid()
        )

    def forward_nodes(self, x: torch.Tensor, edge_index: torch.Tensor) -> torch.Tensor:
        """Computes node representation embeddings."""
        h = self.conv1(x, edge_index)
        h = self.dropout(h)
        h = self.conv2(h, edge_index)
        return h

    def predict_transaction_risk(
        self, 
        sender_emb: torch.Tensor, 
        receiver_emb: torch.Tensor, 
        edge_features: torch.Tensor
    ) -> float:
        """Computes risk probability score [0.0 - 1.0] for an individual transaction."""
        self.eval()
        with torch.no_grad():
            combined = torch.cat([sender_emb, receiver_emb, edge_features], dim=-1)
            if combined.dim() == 1:
                combined = combined.unsqueeze(0)
            risk_prob = self.classifier(combined).item()
        return float(np.clip(risk_prob, 0.0, 1.0))

class GNNModelManager:
    """Manages training, inference, and model weights persistence."""
    def __init__(self, model_path: str = "models/graphsage_aml.pt"):
        self.model_path = model_path
        self.model = AMLGraphSAGE()
        self.trained = False
        os.makedirs(os.path.dirname(model_path) if os.path.dirname(model_path) else ".", exist_ok=True)
        self._initialize_or_load()

    def _initialize_or_load(self):
        if os.path.exists(self.model_path):
            try:
                self.model.load_state_dict(torch.load(self.model_path, map_location=torch.device('cpu')))
                self.trained = True
            except Exception:
                self._train_initial_model()
        else:
            self._train_initial_model()

    def _train_initial_model(self):
        """Pre-trains model on initial synthetic banking dataset."""
        from .data_generator import AMLDataGenerator
        from .transaction_processor import TransactionProcessor
        from .graph_builder import TransactionGraph
        
        gen = AMLDataGenerator(num_accounts=100, seed=42)
        df = gen.generate_dataset(num_normal=500, num_rings=15, num_smurfs=10)
        
        proc = TransactionProcessor()
        graph = TransactionGraph()
        
        # Build graph
        for _, row in df.iterrows():
            graph.add_transaction(row.to_dict())
            
        x, edge_index, nodes = graph.extract_subgraph_data()
        node_to_idx = {n: i for i, n in enumerate(nodes)}
        
        # Build training batch
        features_list = []
        labels_list = []
        
        optimizer = torch.optim.Adam(self.model.parameters(), lr=0.01, weight_decay=1e-4)
        pos_weight = torch.tensor([4.0]) # Imbalance compensation
        criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
        
        # Raw classifier pre-training
        self.model.train()
        for epoch in range(40):
            optimizer.zero_grad()
            node_embs = self.model.forward_nodes(x, edge_index)
            
            batch_embs = []
            batch_labels = []
            for _, row in df.sample(min(len(df), 250)).iterrows():
                u_idx = node_to_idx.get(row["sender_account"], 0)
                v_idx = node_to_idx.get(row["receiver_account"], 0)
                u_emb = node_embs[u_idx]
                v_emb = node_embs[v_idx]
                edge_feat = torch.tensor(proc.extract_features(row.to_dict()), dtype=torch.float32)
                
                feat = torch.cat([u_emb, v_emb, edge_feat], dim=-1)
                batch_embs.append(feat)
                batch_labels.append(float(row["is_aml"]))
                
            input_tensor = torch.stack(batch_embs)
            target_tensor = torch.tensor(batch_labels, dtype=torch.float32).unsqueeze(1)
            
            # Forward classifier
            preds = self.model.classifier(input_tensor)
            loss = F.binary_cross_entropy(preds, target_tensor)
            loss.backward()
            optimizer.step()
            
        self.trained = True
        try:
            torch.save(self.model.state_dict(), self.model_path)
        except Exception:
            pass

    def score_transaction(self, tx: dict, graph, processor) -> Tuple[float, Dict[str, any]]:
        """
        Stage 6: Risk Score Generation
        Executes GNN forward pass on local ego-subgraph and returns risk score + embeddings.
        """
        sender = tx["sender_account"]
        receiver = tx["receiver_account"]
        
        # Extract local ego subgraph
        x, edge_index, nodes = graph.extract_subgraph_data(target_nodes=[sender, receiver], max_hops=2)
        node_to_idx = {n: i for i, n in enumerate(nodes)}
        
        self.model.eval()
        with torch.no_grad():
            node_embs = self.model.forward_nodes(x, edge_index)
            u_idx = node_to_idx.get(sender, 0)
            v_idx = node_to_idx.get(receiver, 0)
            u_emb = node_embs[u_idx]
            v_emb = node_embs[v_idx]
            
            edge_feat = torch.tensor(processor.extract_features(tx), dtype=torch.float32)
            risk_score = self.model.predict_transaction_risk(u_emb, v_emb, edge_feat)
            
        # Prior heuristic adjustments based on topological graph structure
        heuristic_boost = 0.0
        if tx.get("pattern_type") == "CIRCULAR_RING" or (graph.G.has_node(sender) and graph.compute_node_features(sender)[6] > 0.5):
            heuristic_boost += 0.25
        if 8500.0 <= float(tx["amount"]) <= 9999.0:
            heuristic_boost += 0.15
        if tx.get("country") in {"KY", "CH", "AE"}:
            heuristic_boost += 0.10
            
        final_risk = float(np.clip(risk_score * 0.65 + heuristic_boost + 0.05, 0.01, 0.99))
        return final_risk, {"sender_emb": u_emb.numpy().tolist(), "receiver_emb": v_emb.numpy().tolist()}
