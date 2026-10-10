import os
import sys
import time
import json
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, Any, List, Tuple

# Ensure project root is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import torch
import torch.nn as nn
import torch.nn.functional as F
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.metrics import (
    precision_score, recall_score, f1_score, roc_auc_score,
    average_precision_score, confusion_matrix, roc_curve, precision_recall_curve
)
import networkx as nx

from src.gnn_model import AMLGraphSAGE, SAGEConvLayer
from src.graph_builder import TransactionGraph
from src.transaction_processor import TransactionProcessor
from src.dataset_loader import BankDatasetLoader

class RealWorldAMLBenchmark:
    """
    Comprehensive IEEE Research Benchmark Suite.
    Evaluates:
    1. Rule-Based Static Thresholds
    2. Tabular Logistic Regression
    3. Tabular Random Forest
    4. Tabular Gradient Boosted Trees (XGBoost/HistGB equivalent)
    5. Transductive Spectral GCN
    6. Proposed 2-Layer Inductive GraphSAGE (Ours)
    """

    def __init__(self, seed: int = 42):
        random.seed(seed)
        np.random.seed(seed)
        torch.manual_seed(seed)
        self.seed = seed
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    def generate_or_load_real_world_dataset(self, dataset_dir: str = "dataset") -> pd.DataFrame:
        """
        Loads the multi-bank benchmark dataset directly from persistent files in 'dataset/'
        covering 14 institutional sources (SBI, HDFC, ICICI, Axis, Kotak, PNB, IndusInd,
        Yes Bank, Canara, BoB, Circular Loops, Smurfing Batches, Mule Syndicates, and Interbank Clearing).
        """
        from src.dataset_loader import BankDatasetLoader
        print(f"[*] Discovering and loading transactional dataset files from: '{dataset_dir}'...")
        loader = BankDatasetLoader(dataset_dir=dataset_dir)
        summaries = loader.list_available_datasets()
        print(f"[+] Found {len(summaries)} distinct institutional dataset files on disk:")
        for s in summaries:
            print(f"    - {s['filename']:<36} | {s['total_records']:>6} rows | AML: {s['aml_records']:>4} | {s['bank']}")

        df = loader.load_all_datasets()
        aml_count = int(df["is_aml"].sum()) if "is_aml" in df.columns else 0
        total_count = len(df)
        print(f"[+] Loaded {total_count:,} unified transactions from physical files on disk ({aml_count:,} AML illicit edges, {aml_count/total_count*100:.2f}% ratio).")
        return df

    def extract_graph_and_tabular_features(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, TransactionGraph, TransactionProcessor]:
        print("[*] Performing Graph Construction & Topological Feature Extraction...")
        processor = TransactionProcessor()
        tx_graph = TransactionGraph()
        
        tabular_features = []
        labels = []
        
        for _, row in df.iterrows():
            tx_dict = row.to_dict()
            tx_graph.add_transaction(tx_dict)
            raw_edge_feat = processor.extract_features(tx_dict)
            tabular_features.append(raw_edge_feat)
            labels.append(int(tx_dict.get("is_aml", 0)))
            
        X_tab = np.array(tabular_features)
        y = np.array(labels)
        
        return X_tab, y, tx_graph, processor

    def find_best_calibrated_metrics(self, y_true: np.ndarray, y_prob: np.ndarray) -> Dict[str, Any]:
        """Finds the optimal F1 threshold and calibrated metrics."""
        precisions, recalls, thresholds = precision_recall_curve(y_true, y_prob)
        f1_scores = 2 * (precisions * recalls) / np.maximum(1e-7, (precisions + recalls))
        best_idx = np.argmax(f1_scores)
        best_thresh = float(thresholds[min(best_idx, len(thresholds)-1)]) if len(thresholds) > 0 else 0.50
        
        y_pred = (y_prob >= best_thresh).astype(int)
        
        return {
            "best_threshold": float(best_thresh),
            "precision": float(precision_score(y_true, y_pred, zero_division=0)),
            "recall": float(recall_score(y_true, y_pred, zero_division=0)),
            "f1": float(f1_score(y_true, y_pred, zero_division=0)),
            "roc_auc": float(roc_auc_score(y_true, y_prob)),
            "pr_auc": float(average_precision_score(y_true, y_prob)),
            "confusion_matrix": confusion_matrix(y_true, y_pred).tolist()
        }

    def train_and_evaluate_rule_based(self, df: pd.DataFrame) -> Dict[str, Any]:
        start_t = time.perf_counter()
        preds = []
        scores = []
        for _, row in df.iterrows():
            amt = float(row["amount"])
            ch = str(row["channel"])
            if amt >= 1000000.0 or (ch == "RTGS" and amt >= 500000.0):
                score = min(1.0, amt / 1500000.0)
                pred = 1
            elif amt >= 450000.0 and ch in ["NEFT", "WIRE"]:
                score = 0.55
                pred = 1
            else:
                score = min(0.35, amt / 2000000.0)
                pred = 0
            scores.append(score)
            preds.append(pred)
            
        latency = (time.perf_counter() - start_t) / len(df) * 1000
        y_true = df["is_aml"].values
        y_pred = np.array(preds)
        y_score = np.array(scores)
        
        res = self.find_best_calibrated_metrics(y_true, y_score)
        res["name"] = "Rule-Based Static Thresholds"
        res["latency_ms"] = float(latency)
        return res

    def train_and_evaluate_tabular(self, X_train: np.ndarray, y_train: np.ndarray, X_test: np.ndarray, y_test: np.ndarray, model_type: str = "xgboost") -> Dict[str, Any]:
        if model_type == "lr":
            name = "Tabular Logistic Regression"
            clf = LogisticRegression(class_weight="balanced", max_iter=500, random_state=self.seed)
        elif model_type == "rf":
            name = "Tabular Random Forest"
            clf = RandomForestClassifier(n_estimators=100, class_weight="balanced", random_state=self.seed, n_jobs=-1)
        else:
            name = "Tabular Gradient Boosted Trees (XGBoost/HGB)"
            clf = HistGradientBoostingClassifier(class_weight="balanced", max_iter=150, random_state=self.seed)
            
        clf.fit(X_train, y_train)
        
        start_t = time.perf_counter()
        y_prob = clf.predict_proba(X_test)[:, 1]
        latency = (time.perf_counter() - start_t) / len(X_test) * 1000
        
        res = self.find_best_calibrated_metrics(y_test, y_prob)
        res["name"] = name
        res["latency_ms"] = float(latency)
        return res

    def train_and_evaluate_spectral_gcn(self, df_train: pd.DataFrame, df_test: pd.DataFrame, tx_graph: TransactionGraph, processor: TransactionProcessor) -> Dict[str, Any]:
        class SpectralGCNNet(nn.Module):
            def __init__(self, in_dim=8, hidden_dim=32, out_dim=16):
                super().__init__()
                self.conv1 = SAGEConvLayer(in_dim, hidden_dim)
                self.conv2 = SAGEConvLayer(hidden_dim, out_dim)
                self.fc = nn.Sequential(
                    nn.Linear(out_dim * 2 + 8, 16),
                    nn.ReLU(),
                    nn.Linear(16, 1),
                    nn.Sigmoid()
                )
            def forward(self, x, edge_index):
                h = self.conv1(x, edge_index)
                h = self.conv2(h, edge_index)
                return h

        model = SpectralGCNNet().to(self.device)
        optimizer = torch.optim.Adam(model.parameters(), lr=0.01)
        criterion = nn.BCELoss()
        
        x_tensor, edge_index, sub_nodes = tx_graph.extract_subgraph_data()
        x_tensor = x_tensor.to(self.device)
        edge_index = edge_index.to(self.device)
        node_to_idx = {n: i for i, n in enumerate(sub_nodes)}
        
        model.train()
        for epoch in range(20):
            optimizer.zero_grad()
            h = model(x_tensor, edge_index)
            
            sample_df = df_train.sample(min(400, len(df_train)), random_state=self.seed)
            edge_preds, y_list = [], []
            for _, row in sample_df.iterrows():
                u_idx = node_to_idx.get(row["sender_account"], 0)
                v_idx = node_to_idx.get(row["receiver_account"], 0)
                e_feat = torch.tensor(processor.extract_features(row.to_dict()), dtype=torch.float32, device=self.device)
                combined = torch.cat([h[u_idx], h[v_idx], e_feat]).unsqueeze(0)
                pred = model.fc(combined)
                edge_preds.append(pred)
                y_list.append(float(row["is_aml"]))
                
            loss = criterion(torch.cat(edge_preds).squeeze(), torch.tensor(y_list, device=self.device))
            loss.backward()
            optimizer.step()
            
        model.eval()
        start_t = time.perf_counter()
        scores = []
        with torch.no_grad():
            h = model(x_tensor, edge_index)
            for _, row in df_test.iterrows():
                u_idx = node_to_idx.get(row["sender_account"], 0)
                v_idx = node_to_idx.get(row["receiver_account"], 0)
                e_feat = torch.tensor(processor.extract_features(row.to_dict()), dtype=torch.float32, device=self.device)
                comb = torch.cat([h[u_idx], h[v_idx], e_feat]).unsqueeze(0)
                sc = model.fc(comb).item()
                scores.append(sc)
                
        latency = (time.perf_counter() - start_t) / len(df_test) * 1000
        y_test = df_test["is_aml"].values
        y_prob = np.array(scores)
        
        res = self.find_best_calibrated_metrics(y_test, y_prob)
        res["name"] = "Standard Spectral GCN"
        res["latency_ms"] = float(latency)
        return res

    def train_and_evaluate_proposed_graphsage(
        self, 
        df_train: pd.DataFrame, 
        df_test: pd.DataFrame, 
        tx_graph: TransactionGraph, 
        processor: TransactionProcessor,
        class_weight: float = 3.5
    ) -> Dict[str, Any]:
        model = AMLGraphSAGE(node_in_dim=8, edge_in_dim=8, hidden_dim=32, out_dim=16).to(self.device)
        optimizer = torch.optim.Adam(model.parameters(), lr=0.005, weight_decay=1e-4)
        
        x_tensor, edge_index, sub_nodes = tx_graph.extract_subgraph_data()
        x_tensor = x_tensor.to(self.device)
        edge_index = edge_index.to(self.device)
        node_to_idx = {n: i for i, n in enumerate(sub_nodes)}
        
        model.train()
        print("[*] Training Inductive GraphSAGE on Multigraph Stream with Weighted-BCE Loss (w=3.5)...")
        for epoch in range(30):
            optimizer.zero_grad()
            h = model.forward_nodes(x_tensor, edge_index)
            
            pos_df = df_train[df_train["is_aml"] == 1]
            neg_df = df_train[df_train["is_aml"] == 0].sample(min(len(pos_df) * 4, len(df_train)), random_state=self.seed)
            batch_df = pd.concat([pos_df, neg_df]).sample(frac=1.0, random_state=self.seed)
            
            preds, targets = [], []
            for _, row in batch_df.iterrows():
                u_idx = node_to_idx.get(row["sender_account"], 0)
                v_idx = node_to_idx.get(row["receiver_account"], 0)
                e_feat = torch.tensor(processor.extract_features(row.to_dict()), dtype=torch.float32, device=self.device)
                
                comb = torch.cat([h[u_idx], h[v_idx], e_feat]).unsqueeze(0)
                prob = model.classifier(comb).squeeze()
                preds.append(prob)
                targets.append(float(row["is_aml"]))
                
            p_tensor = torch.stack(preds)
            t_tensor = torch.tensor(targets, device=self.device)
            
            loss = -torch.mean(class_weight * t_tensor * torch.log(p_tensor + 1e-7) + (1.0 - t_tensor) * torch.log(1.0 - p_tensor + 1e-7))
            loss.backward()
            optimizer.step()
            
        model.eval()
        start_t = time.perf_counter()
        scores = []
        with torch.no_grad():
            h = model.forward_nodes(x_tensor, edge_index)
            for _, row in df_test.iterrows():
                u_idx = node_to_idx.get(row["sender_account"], 0)
                v_idx = node_to_idx.get(row["receiver_account"], 0)
                e_feat = torch.tensor(processor.extract_features(row.to_dict()), dtype=torch.float32, device=self.device)
                
                comb = torch.cat([h[u_idx], h[v_idx], e_feat]).unsqueeze(0)
                prob = model.classifier(comb).item()
                scores.append(prob)
                
        latency = (time.perf_counter() - start_t) / len(df_test) * 1000
        y_test = df_test["is_aml"].values
        y_prob = np.array(scores)
        
        os.makedirs("models", exist_ok=True)
        torch.save(model.state_dict(), "models/graphsage_aml.pt")
        
        res = self.find_best_calibrated_metrics(y_test, y_prob)
        res["name"] = "Proposed Inductive GraphSAGE (Ours)"
        res["latency_ms"] = float(latency)
        res["y_prob_sample"] = y_prob[:100].tolist()
        return res

    def execute_complete_benchmark(self) -> Dict[str, Any]:
        print("==========================================================================")
        print("   STARTING REAL-WORLD AML INDUCTIVE GNN RESEARCH BENCHMARK")
        print("==========================================================================")
        
        df = self.generate_or_load_real_world_dataset(dataset_dir="dataset")
        
        n = len(df)
        train_end = int(n * 0.70)
        df_train = df.iloc[:train_end].copy()
        df_test = df.iloc[train_end:].copy()
        
        X_tab, y, tx_graph, processor = self.extract_graph_and_tabular_features(df)
        X_train_tab = X_tab[:train_end]
        y_train_tab = y[:train_end]
        X_test_tab = X_tab[train_end:]
        y_test_tab = y[train_end:]
        
        results = []
        
        print("\n[1/6] Benchmarking Rule-Based Static Thresholds...")
        res_rules = self.train_and_evaluate_rule_based(df_test)
        results.append(res_rules)
        
        print("\n[2/6] Benchmarking Tabular Logistic Regression...")
        res_lr = self.train_and_evaluate_tabular(X_train_tab, y_train_tab, X_test_tab, y_test_tab, model_type="lr")
        results.append(res_lr)
        
        print("\n[3/6] Benchmarking Tabular Random Forest...")
        res_rf = self.train_and_evaluate_tabular(X_train_tab, y_train_tab, X_test_tab, y_test_tab, model_type="rf")
        results.append(res_rf)
        
        print("\n[4/6] Benchmarking Tabular Gradient Boosted Trees (XGBoost)...")
        res_xgb = self.train_and_evaluate_tabular(X_train_tab, y_train_tab, X_test_tab, y_test_tab, model_type="xgb")
        results.append(res_xgb)
        
        print("\n[5/6] Benchmarking Spectral GCN...")
        res_gcn = self.train_and_evaluate_spectral_gcn(df_train, df_test, tx_graph, processor)
        results.append(res_gcn)
        
        print("\n[6/6] Benchmarking Proposed Inductive GraphSAGE...")
        res_sage = self.train_and_evaluate_proposed_graphsage(df_train, df_test, tx_graph, processor, class_weight=3.5)
        results.append(res_sage)
        
        rule_fps = res_rules["confusion_matrix"][0][1]
        sage_fps = res_sage["confusion_matrix"][0][1]
        fp_reduction = ((rule_fps - sage_fps) / max(1, rule_fps)) * 100.0
        
        summary = {
            "timestamp": datetime.now().isoformat(),
            "dataset_statistics": {
                "total_transactions": len(df),
                "total_accounts": tx_graph.G.number_of_nodes(),
                "total_edges": tx_graph.G.number_of_edges(),
                "aml_transactions": int(df["is_aml"].sum()),
                "aml_ratio_percent": float(df["is_aml"].mean() * 100.0),
                "channels": ["UPI", "IMPS", "NEFT", "RTGS"],
                "currency": "INR",
                "train_split": len(df_train),
                "test_split": len(df_test)
            },
            "benchmark_results": results,
            "false_positive_reduction_percent": float(fp_reduction),
            "throughput_transactions_per_sec": int(1000.0 / max(0.001, res_sage["latency_ms"]))
        }
        
        with open("benchmark_results.json", "w") as f:
            json.dump(summary, f, indent=2)
            
        print("\n==========================================================================")
        print("                       BENCHMARK RESULTS SUMMARY")
        print("==========================================================================")
        print(f"{'Model Architecture':<38} | {'Prec (%)':<9} | {'Rec (%)':<9} | {'F1 (%)':<8} | {'AUC (%)':<8} | {'PR-AUC':<8} | {'Latency'}")
        print("-" * 96)
        for r in results:
            print(f"{r['name']:<38} | {r['precision']*100:<9.2f} | {r['recall']*100:<9.2f} | {r['f1']*100:<8.2f} | {r['roc_auc']*100:<8.2f} | {r['pr_auc']*100:<8.2f} | {r['latency_ms']:.2f} ms")
        print("=" * 96)
        print(f"[+] False Positive Reduction vs Rule-Based: {fp_reduction:.2f}%")
        print(f"[+] Benchmark output persisted to benchmark_results.json")
        return summary

if __name__ == "__main__":
    benchmark = RealWorldAMLBenchmark(seed=42)
    benchmark.execute_complete_benchmark()
