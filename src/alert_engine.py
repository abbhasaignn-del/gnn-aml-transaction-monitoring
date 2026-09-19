from datetime import datetime
from typing import Dict, List, Optional
import uuid

class AlertEngine:
    """
    Stage 6 & 7: AML Alert Generation, Decision Rules & Explainability
    Evaluates GNN risk scores against configurable thresholds and creates investigative AML alerts.
    """
    def __init__(self, high_risk_threshold: float = 0.70, medium_risk_threshold: float = 0.40):
        self.high_risk_threshold = high_risk_threshold
        self.medium_risk_threshold = medium_risk_threshold
        self.alerts_store: List[Dict] = []
        self.alert_counter = 1000

    def evaluate_transaction(self, tx: dict, risk_score: float, graph, processor) -> Dict:
        """
        Decision Logic:
        Risk Score > Threshold?
        - No: Normal Transaction (Allow Transaction, Continue Monitoring)
        - Yes: Suspicious Transaction (Generate AML Alert)
        """
        is_suspicious = risk_score >= self.high_risk_threshold
        risk_level = "HIGH" if risk_score >= self.high_risk_threshold else ("MEDIUM" if risk_score >= self.medium_risk_threshold else "LOW")
        
        # Explainability & Contributing Factors Engine
        reasons = []
        amt = float(tx.get("amount", 0))
        sender = tx.get("sender_account", "")
        receiver = tx.get("receiver_account", "")
        country = tx.get("country", "US")
        
        if 8500.0 <= amt <= 9999.0:
            reasons.append("Structuring / Smurfing: Amount positioned immediately below $10,000 regulatory reporting threshold.")
        if amt >= 50000.0:
            reasons.append(f"Unusually large transfer volume of ${amt:,.2f}.")
        if country in {"KY", "CH", "AE", "PA", "VG"}:
            reasons.append(f"High-risk offshore secrecy jurisdiction involved ({country}).")
        
        # Graph topological reasons
        if graph.G.has_node(sender) and graph.compute_node_features(sender)[6] > 0.5:
            reasons.append("Circular Flow Topology: Account detected inside a closed circular transaction loop (A -> B -> C -> A).")
            
        if graph.G.has_node(sender) and graph.G.out_degree(sender) > 5:
            reasons.append(f"High fan-out velocity: Sender connected to {graph.G.out_degree(sender)} distinct counterparties in a short interval.")
            
        if tx.get("channel") == "WIRE" and amt > 30000:
            reasons.append("Rapid wire transfer routing with rapid funds dispersion pattern.")
            
        if not reasons and is_suspicious:
            reasons.append("GNN Embedding Anomaly: Higher-order topological graph neighborhood matches historical money laundering signatures.")

        alert_record = None
        if is_suspicious:
            self.alert_counter += 1
            alert_id = f"ALT-{self.alert_counter}"
            
            sar_narrative = (
                f"Suspicious Activity Report (SAR) auto-generated for Transaction {tx.get('transaction_id')}. "
                f"Account {sender} routed ${amt:,.2f} to {receiver} across jurisdiction {country}. "
                f"The GraphSAGE GNN model produced an elevated AML risk score of {risk_score:.2f}. "
                f"Primary indicators: {'; '.join(reasons)}."
            )
            
            alert_record = {
                "alert_id": alert_id,
                "transaction_id": tx.get("transaction_id"),
                "sender_account": sender,
                "receiver_account": receiver,
                "amount": amt,
                "risk_score": round(risk_score, 4),
                "risk_level": risk_level,
                "reasons": reasons,
                "status": "OPEN", # OPEN, INVESTIGATING, SAR_FILED, FALSE_ALARM
                "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "investigator_notes": "",
                "sar_narrative": sar_narrative
            }
            self.alerts_store.insert(0, alert_record)

        return {
            "transaction_id": tx.get("transaction_id"),
            "risk_score": round(risk_score, 4),
            "risk_level": risk_level,
            "is_suspicious": is_suspicious,
            "decision": "GENERATE_AML_ALERT" if is_suspicious else "ALLOW_TRANSACTION",
            "alert": alert_record,
            "reasons": reasons
        }

    def update_alert_status(self, alert_id: str, new_status: str, notes: str = "") -> Optional[Dict]:
        for alt in self.alerts_store:
            if alt["alert_id"] == alert_id:
                alt["status"] = new_status
                if notes:
                    alt["investigator_notes"] = notes
                return alt
        return None
