import pytest
import numpy as np
import pandas as pd
from src.data_generator import AMLDataGenerator
from src.transaction_processor import TransactionProcessor
from src.graph_builder import TransactionGraph
from src.gnn_model import GNNModelManager
from src.alert_engine import AlertEngine
from src.mlops_monitor import MLOpsMonitor

def test_data_generator():
    gen = AMLDataGenerator(num_accounts=20, seed=42)
    tx = gen.generate_normal_transaction()
    assert "transaction_id" in tx
    assert "sender_account" in tx
    assert "receiver_account" in tx
    assert tx["amount"] > 0

    ring = gen.generate_circular_ring(ring_size=3)
    assert len(ring) == 3
    assert ring[0]["sender_account"] == ring[-1]["receiver_account"]

def test_transaction_processor():
    proc = TransactionProcessor()
    tx = {
        "transaction_id": "TX_1",
        "sender_account": "ACC_1001",
        "receiver_account": "ACC_1002",
        "amount": 9500.0,
        "transaction_type": "TRANSFER",
        "channel": "WIRE",
        "country": "KY"
    }
    feats = proc.extract_features(tx)
    assert len(feats) == 8
    assert isinstance(feats, np.ndarray)

def test_graph_and_gnn_pipeline():
    graph = TransactionGraph()
    proc = TransactionProcessor()
    gen = AMLDataGenerator(num_accounts=15, seed=42)
    
    # Ingest ring
    ring = gen.generate_circular_ring(ring_size=3)
    for t in ring:
        graph.add_transaction(proc.clean_and_validate(t))
        
    assert graph.G.number_of_nodes() >= 3
    assert graph.G.number_of_edges() >= 3
    
    gnn = GNNModelManager()
    risk_score, embs = gnn.score_transaction(ring[0], graph, proc)
    assert 0.0 <= risk_score <= 1.0

def test_alert_engine():
    alert_engine = AlertEngine(high_risk_threshold=0.70)
    graph = TransactionGraph()
    proc = TransactionProcessor()
    
    tx = {
        "transaction_id": "TX_TEST_ALERT",
        "sender_account": "ACC_9999",
        "receiver_account": "ACC_8888",
        "amount": 95000.0,
        "country": "KY"
    }
    graph.add_transaction(tx)
    
    # Evaluate high risk
    res = alert_engine.evaluate_transaction(tx, 0.92, graph, proc)
    assert res["is_suspicious"] is True
    assert res["decision"] == "GENERATE_AML_ALERT"
    assert len(alert_engine.alerts_store) > 0

def test_mlops_monitoring():
    mlops = MLOpsMonitor()
    for _ in range(30):
        mlops.record_production_inference(np.random.uniform(100, 5000), np.random.uniform(0.1, 0.3))
        
    drift = mlops.check_drift()
    assert "ks_statistic" in drift
    assert "drift_detected" in drift
    
    perf = mlops.evaluate_performance()
    assert "f1_score" in perf

def test_graph_visualizer():
    from src.graph_visualizer import GraphVisualizer
    graph = TransactionGraph()
    vis = GraphVisualizer()
    
    # Test empty graph
    fig_empty = vis.build_plotly_network(graph)
    assert fig_empty is not None
    
    # Add transaction
    graph.add_transaction({
        "transaction_id": "TX_TEST_1",
        "sender_account": "ACC_1",
        "receiver_account": "ACC_2",
        "amount": 50000.0,
        "channel": "UPI"
    })
    
    fig_populated = vis.build_plotly_network(graph)
    assert fig_populated is not None
    assert len(fig_populated.data) > 0


