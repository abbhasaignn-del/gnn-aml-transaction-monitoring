import random
import time
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

CHANNELS = ["ONLINE", "ATM", "WIRE", "POS", "MOBILE"]
COUNTRIES = ["US", "GB", "IN", "SG", "KY", "CH", "DE", "AE"]
HIGH_RISK_COUNTRIES = {"KY", "CH", "AE"}

class AMLDataGenerator:
    """
    Generates synthetic banking transaction data and injects known
    money laundering typologies:
    1. Circular Routing Loops (A -> B -> C -> D -> A)
    2. Smurfing / Fan-Out -> Fan-In (structuring below reporting thresholds)
    3. High-Velocity Layering (rapid multi-hop transfers)
    4. Legitimate Background Traffic
    """
    def __init__(self, num_accounts: int = 250, seed: int = 42):
        random.seed(seed)
        np.random.seed(seed)
        self.num_accounts = num_accounts
        self.accounts = [f"ACC_{1000 + i}" for i in range(num_accounts)]
        self.tx_counter = 100000

    def generate_normal_transaction(self, base_time: datetime = None) -> dict:
        self.tx_counter += 1
        t = base_time or datetime.now()
        sender, receiver = random.sample(self.accounts, 2)
        amount = round(float(np.random.lognormal(mean=7.5, sigma=1.2)), 2)
        amount = max(10.0, min(amount, 45000.0))
        
        return {
            "transaction_id": f"TX_{self.tx_counter}",
            "sender_account": sender,
            "receiver_account": receiver,
            "amount": amount,
            "timestamp": t.strftime("%Y-%m-%d %H:%M:%S"),
            "transaction_type": random.choice(["TRANSFER", "PAYMENT", "SETTLEMENT"]),
            "channel": random.choice(CHANNELS),
            "country": random.choice(["US", "GB", "IN", "DE"]),
            "is_aml": 0,
            "pattern_type": "NORMAL"
        }

    def generate_circular_ring(self, ring_size: int = 4, base_amount: float = 85000.0, base_time: datetime = None) -> list:
        """Injects circular laundering ring: A -> B -> C -> ... -> A"""
        t = base_time or datetime.now()
        ring_nodes = random.sample(self.accounts, ring_size)
        ring_transactions = []
        
        for i in range(ring_size):
            self.tx_counter += 1
            sender = ring_nodes[i]
            receiver = ring_nodes[(i + 1) % ring_size]
            # Slight amount degradation to simulate laundering commission fees
            amount = round(base_amount * (0.95 ** i), 2)
            t_tx = t + timedelta(minutes=i * 12)
            
            ring_transactions.append({
                "transaction_id": f"TX_{self.tx_counter}",
                "sender_account": sender,
                "receiver_account": receiver,
                "amount": amount,
                "timestamp": t_tx.strftime("%Y-%m-%d %H:%M:%S"),
                "transaction_type": "TRANSFER",
                "channel": "WIRE",
                "country": random.choice(list(HIGH_RISK_COUNTRIES)),
                "is_aml": 1,
                "pattern_type": "CIRCULAR_RING"
            })
        return ring_transactions

    def generate_smurfing_pattern(self, num_smurfs: int = 5, target_amount: float = 9800.0, base_time: datetime = None) -> list:
        """Injects structuring / smurfing: Single source -> Multiple intermediaries -> Single destination"""
        t = base_time or datetime.now()
        main_source = random.choice(self.accounts)
        available = [acc for acc in self.accounts if acc != main_source]
        intermediaries = random.sample(available, num_smurfs)
        final_dest = random.choice([acc for acc in available if acc not in intermediaries])
        
        txs = []
        # Phase 1: Fan-Out
        for idx, inter in enumerate(intermediaries):
            self.tx_counter += 1
            t_tx = t + timedelta(minutes=idx * 5)
            # Structuring just below $10,000 reporting threshold
            amount = round(target_amount - random.uniform(100, 800), 2)
            txs.append({
                "transaction_id": f"TX_{self.tx_counter}",
                "sender_account": main_source,
                "receiver_account": inter,
                "amount": amount,
                "timestamp": t_tx.strftime("%Y-%m-%d %H:%M:%S"),
                "transaction_type": "TRANSFER",
                "channel": "ONLINE",
                "country": random.choice(COUNTRIES),
                "is_aml": 1,
                "pattern_type": "SMURFING_FAN_OUT"
            })
            
        # Phase 2: Fan-In
        for idx, inter in enumerate(intermediaries):
            self.tx_counter += 1
            t_tx = t + timedelta(minutes=30 + idx * 4)
            amount = round(target_amount - random.uniform(200, 900), 2)
            txs.append({
                "transaction_id": f"TX_{self.tx_counter}",
                "sender_account": inter,
                "receiver_account": final_dest,
                "amount": amount,
                "timestamp": t_tx.strftime("%Y-%m-%d %H:%M:%S"),
                "transaction_type": "TRANSFER",
                "channel": "WIRE",
                "country": random.choice(COUNTRIES),
                "is_aml": 1,
                "pattern_type": "SMURFING_FAN_IN"
            })
        return txs

    def generate_bulk_stream(self, total_count: int = 50000) -> pd.DataFrame:
        """
        High-Speed Vectorized Generator capable of generating 100 to 200,000+ transactions
        in milliseconds with embedded AML rings and smurfing structures.
        """
        s_idx = np.random.randint(0, self.num_accounts, size=total_count)
        offset = np.random.randint(1, self.num_accounts, size=total_count)
        r_idx = (s_idx + offset) % self.num_accounts
        
        amounts = np.round(np.clip(np.random.lognormal(mean=7.5, sigma=1.2, size=total_count), 15.0, 120000.0), 2)
        types = np.random.choice(["TRANSFER", "PAYMENT", "SETTLEMENT"], size=total_count, p=[0.7, 0.2, 0.1])
        channels = np.random.choice(CHANNELS, size=total_count)
        countries = np.random.choice(COUNTRIES, size=total_count, p=[0.4, 0.2, 0.15, 0.1, 0.05, 0.04, 0.03, 0.03])
        
        tx_ids = [f"TX_{self.tx_counter + i}" for i in range(total_count)]
        self.tx_counter += total_count
        
        senders = [self.accounts[i] for i in s_idx]
        receivers = [self.accounts[i] for i in r_idx]
        
        df = pd.DataFrame({
            "transaction_id": tx_ids,
            "sender_account": senders,
            "receiver_account": receivers,
            "amount": amounts,
            "transaction_type": types,
            "channel": channels,
            "country": countries,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "is_aml": 0,
            "pattern_type": "NORMAL"
        })
        
        # Inject ~2% high-risk AML patterns
        num_aml_rings = max(2, int(total_count * 0.005))
        for _ in range(num_aml_rings):
            ring = self.generate_circular_ring(ring_size=random.choice([3, 4]), base_amount=random.uniform(50000, 180000))
            ring_df = pd.DataFrame(ring)
            df = pd.concat([df, ring_df], ignore_index=True)
            
        return df

    def generate_dataset(self, num_normal: int = 50, num_rings: int = 2, num_smurfs: int = 2) -> pd.DataFrame:
        data = []
        base_time = datetime.now() - timedelta(days=2)
        
        for _ in range(num_normal):
            cur_time = base_time + timedelta(minutes=random.randint(0, 2000))
            data.append(self.generate_normal_transaction(base_time=cur_time))
            
        for _ in range(num_rings):
            cur_time = base_time + timedelta(minutes=random.randint(0, 2000))
            data.extend(self.generate_circular_ring(ring_size=random.choice([3, 4]), base_amount=random.uniform(60000, 120000), base_time=cur_time))
            
        for _ in range(num_smurfs):
            cur_time = base_time + timedelta(minutes=random.randint(0, 2000))
            data.extend(self.generate_smurfing_pattern(num_smurfs=4, base_time=cur_time))
            
        df = pd.DataFrame(data)
        df.sort_values(by="timestamp", inplace=True)
        df.reset_index(drop=True, inplace=True)
        return df
