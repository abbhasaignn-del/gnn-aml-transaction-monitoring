import numpy as np
import pandas as pd
from datetime import datetime

HIGH_RISK_JURISDICTIONS = {"KY", "CH", "AE", "PA", "VG"}

class TransactionProcessor:
    """
    Stage 2: Data Preprocessing
    Cleans, normalizes, and extracts statistical & categorical features from transactions.
    """
    def __init__(self):
        self.channel_map = {"ONLINE": 0, "ATM": 1, "WIRE": 2, "POS": 3, "MOBILE": 4}
        self.type_map = {"TRANSFER": 0, "PAYMENT": 1, "SETTLEMENT": 2, "WITHDRAWAL": 3}
        self.amount_mean = 8.5
        self.amount_std = 1.8

    def clean_and_validate(self, tx: dict) -> dict:
        """Validates schema, handles missing fields, and trims whitespace."""
        cleaned = dict(tx)
        cleaned["sender_account"] = str(cleaned.get("sender_account", "ACC_UNKNOWN")).strip()
        cleaned["receiver_account"] = str(cleaned.get("receiver_account", "ACC_UNKNOWN")).strip()
        cleaned["amount"] = max(0.01, float(cleaned.get("amount", 0.0)))
        cleaned["channel"] = str(cleaned.get("channel", "ONLINE")).upper().strip()
        cleaned["transaction_type"] = str(cleaned.get("transaction_type", "TRANSFER")).upper().strip()
        cleaned["country"] = str(cleaned.get("country", "US")).upper().strip()
        if "timestamp" not in cleaned or not cleaned["timestamp"]:
            cleaned["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        return cleaned

    def extract_features(self, tx: dict) -> np.ndarray:
        """
        Converts a transaction into a normalized feature vector for graph & GNN inputs.
        Vector schema:
        [0]: log_normalized_amount
        [1]: channel_encoded (normalized)
        [2]: type_encoded (normalized)
        [3]: high_risk_country_flag (0 or 1)
        [4]: structuring_amount_flag (0 or 1, amount between 8500 and 9999)
        [5]: wire_high_value_flag (0 or 1, wire > 50000)
        [6]: hour_of_day_sin
        [7]: hour_of_day_cos
        """
        tx = self.clean_and_validate(tx)
        amt = tx["amount"]
        log_amt = np.log1p(amt)
        norm_amt = (log_amt - self.amount_mean) / self.amount_std
        
        ch_idx = self.channel_map.get(tx["channel"], 0) / float(len(self.channel_map))
        tp_idx = self.type_map.get(tx["transaction_type"], 0) / float(len(self.type_map))
        
        is_high_risk_country = 1.0 if tx["country"] in HIGH_RISK_JURISDICTIONS else 0.0
        is_structuring = 1.0 if 8500.0 <= amt <= 9999.0 else 0.0
        is_wire_high_value = 1.0 if (tx["channel"] == "WIRE" and amt >= 50000.0) else 0.0
        
        try:
            dt = datetime.strptime(str(tx["timestamp"]), "%Y-%m-%d %H:%M:%S")
            hour = dt.hour
        except Exception:
            hour = 12
            
        hour_sin = np.sin(2 * np.pi * hour / 24.0)
        hour_cos = np.cos(2 * np.pi * hour / 24.0)
        
        return np.array([
            norm_amt,
            ch_idx,
            tp_idx,
            is_high_risk_country,
            is_structuring,
            is_wire_high_value,
            hour_sin,
            hour_cos
        ], dtype=np.float32)
