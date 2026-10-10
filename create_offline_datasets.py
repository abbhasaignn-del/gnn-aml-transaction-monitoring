import os
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

def generate_offline_datasets(output_dir="dataset", seed=42):
    random.seed(seed)
    np.random.seed(seed)
    os.makedirs(output_dir, exist_ok=True)

    base_time = datetime(2026, 1, 10, 8, 0, 0)
    tx_counter = 100000

    banks = [
        {"name": "State Bank of India", "code": "SBI", "file": "01_sbi_retail_upi_stream.csv", "channels": ["UPI", "IMPS"], "weights": [0.8, 0.2], "mean_amt": 5.8, "sigma_amt": 1.0, "count": 2200},
        {"name": "HDFC Bank", "code": "HDFC", "file": "02_hdfc_corporate_settlements.csv", "channels": ["NEFT", "RTGS"], "weights": [0.4, 0.6], "mean_amt": 12.5, "sigma_amt": 1.1, "count": 1800},
        {"name": "ICICI Bank", "code": "ICICI", "file": "03_icici_merchant_pos_transfers.csv", "channels": ["UPI", "IMPS", "POS"], "weights": [0.5, 0.3, 0.2], "mean_amt": 7.2, "sigma_amt": 0.9, "count": 1900},
        {"name": "Axis Bank", "code": "AXIS", "file": "04_axis_high_velocity_wire.csv", "channels": ["IMPS", "NEFT"], "weights": [0.6, 0.4], "mean_amt": 9.2, "sigma_amt": 1.0, "count": 1700},
        {"name": "Kotak Mahindra Bank", "code": "KOTAK", "file": "05_kotak_digital_payments.csv", "channels": ["UPI", "IMPS"], "weights": [0.85, 0.15], "mean_amt": 6.1, "sigma_amt": 0.8, "count": 1600},
        {"name": "Punjab National Bank", "code": "PNB", "file": "06_pnb_commercial_clearing.csv", "channels": ["NEFT", "IMPS"], "weights": [0.7, 0.3], "mean_amt": 9.8, "sigma_amt": 1.1, "count": 1500},
        {"name": "IndusInd Bank", "code": "INDUS", "file": "07_indusind_crossborder_remittance.csv", "channels": ["RTGS", "WIRE"], "weights": [0.5, 0.5], "mean_amt": 11.5, "sigma_amt": 1.2, "count": 1400},
        {"name": "Yes Bank", "code": "YES", "file": "08_yesbank_fintech_gateway.csv", "channels": ["UPI", "IMPS"], "weights": [0.75, 0.25], "mean_amt": 6.9, "sigma_amt": 0.9, "count": 1500},
        {"name": "Canara Bank", "code": "CANARA", "file": "09_canara_interbank_rtgs.csv", "channels": ["NEFT", "RTGS"], "weights": [0.45, 0.55], "mean_amt": 12.0, "sigma_amt": 1.0, "count": 1400},
        {"name": "Bank of Baroda", "code": "BOB", "file": "10_bob_corporate_payroll.csv", "channels": ["NEFT", "IMPS"], "weights": [0.6, 0.4], "mean_amt": 10.2, "sigma_amt": 0.9, "count": 1500},
    ]

    # Shared interbank accounts pool
    all_accounts = {}
    for b in banks:
        all_accounts[b["code"]] = [f"{b['code']}_ACC_{20000 + i}" for i in range(250)]

    shared_mule_pool = [f"MULE_ACC_{90000 + i}" for i in range(120)]
    shared_offshore_pool = [f"OFFSHORE_ACC_{80000 + i}" for i in range(30)]

    created_files = []

    # 1. Generate 10 Bank-Specific Operational Streams
    for idx, b in enumerate(banks):
        records = []
        b_accs = all_accounts[b["code"]]
        other_codes = [x["code"] for x in banks if x["code"] != b["code"]]

        for i in range(b["count"]):
            tx_counter += 1
            t = base_time + timedelta(seconds=i * random.randint(15, 60) + idx * 3600)
            ch = random.choices(b["channels"], weights=b["weights"], k=1)[0]
            amt = float(np.random.lognormal(mean=b["mean_amt"], sigma=b["sigma_amt"]))
            amt = max(15.0, min(round(amt, 2), 4500000.0))

            sender = random.choice(b_accs)
            # 70% intra-bank, 30% inter-bank
            if random.random() < 0.70:
                receiver = random.choice([a for a in b_accs if a != sender])
            else:
                dest_b = random.choice(other_codes)
                receiver = random.choice(all_accounts[dest_b])

            records.append({
                "transaction_id": f"TX_{b['code']}_{tx_counter}",
                "sender_account": sender,
                "receiver_account": receiver,
                "amount": amt,
                "timestamp": t.strftime("%Y-%m-%d %H:%M:%S"),
                "transaction_type": "TRANSFER" if ch in ["UPI", "IMPS"] else "SETTLEMENT",
                "channel": ch,
                "bank": b["name"],
                "country": "IN",
                "is_aml": 0,
                "pattern_type": "NORMAL_BANKING_FLOW"
            })

        filepath = os.path.join(output_dir, b["file"])
        df_bank = pd.DataFrame(records)
        df_bank.to_csv(filepath, index=False)
        created_files.append((b["file"], len(df_bank), 0))
        print(f"[+] Saved {b['file']}: {len(df_bank)} records")

    # 2. File 11: Circular Layering Rings (Cross-Bank Laundering Loops)
    records_rings = []
    num_rings = 75
    for r in range(num_rings):
        ring_len = random.randint(3, 6)
        # Select nodes spanning multiple banks
        selected_banks = random.sample(banks, min(ring_len, len(banks)))
        ring_nodes = [random.choice(all_accounts[sb["code"]]) for sb in selected_banks]
        base_amt = random.uniform(350000, 1800000)
        ring_start = base_time + timedelta(hours=random.randint(1, 300))

        for step in range(len(ring_nodes)):
            tx_counter += 1
            u = ring_nodes[step]
            v = ring_nodes[(step + 1) % len(ring_nodes)]
            step_amt = round(base_amt * (0.97 ** step), 2)
            t_tx = ring_start + timedelta(minutes=step * random.randint(8, 25))
            sender_bank_code = u.split("_")[0]

            records_rings.append({
                "transaction_id": f"TX_RING_{tx_counter}",
                "sender_account": u,
                "receiver_account": v,
                "amount": step_amt,
                "timestamp": t_tx.strftime("%Y-%m-%d %H:%M:%S"),
                "transaction_type": "SETTLEMENT",
                "channel": random.choice(["IMPS", "NEFT", "RTGS"]),
                "bank": next((b["name"] for b in banks if b["code"] == sender_bank_code), "Interbank Ring"),
                "country": random.choice(["IN", "IN", "KY", "CH"]),
                "is_aml": 1,
                "pattern_type": "CIRCULAR_RING"
            })

    f11 = "11_circular_layering_rings.csv"
    df_rings = pd.DataFrame(records_rings)
    df_rings.to_csv(os.path.join(output_dir, f11), index=False)
    created_files.append((f11, len(df_rings), len(df_rings)))
    print(f"[+] Saved {f11}: {len(df_rings)} laundering records across loops")

    # 3. File 12: Smurfing & Structuring Batches (Sub-Threshold Fan-Out / Fan-In)
    records_smurfs = []
    num_smurf_syndicates = 55
    for s in range(num_smurf_syndicates):
        source_b = random.choice(banks)
        source = random.choice(all_accounts[source_b["code"]])
        collector_b = random.choice(banks)
        collector = random.choice(all_accounts[collector_b["code"]])
        
        mule_count = random.randint(4, 8)
        mules = random.sample(shared_mule_pool, mule_count)
        total_illicit = random.uniform(900000, 3200000)
        chunk = total_illicit / mule_count
        smurf_time = base_time + timedelta(hours=random.randint(5, 350))

        # Fan-out phase
        for m_idx, mule in enumerate(mules):
            tx_counter += 1
            amt_fo = round(chunk * random.uniform(0.93, 1.04), 2)
            t_fo = smurf_time + timedelta(minutes=m_idx * 3)
            records_smurfs.append({
                "transaction_id": f"TX_SMURF_FO_{tx_counter}",
                "sender_account": source,
                "receiver_account": mule,
                "amount": amt_fo,
                "timestamp": t_fo.strftime("%Y-%m-%d %H:%M:%S"),
                "transaction_type": "TRANSFER",
                "channel": "UPI" if amt_fo < 100000 else "IMPS",
                "bank": source_b["name"],
                "country": "IN",
                "is_aml": 1,
                "pattern_type": "SMURF_FAN_OUT"
            })

        # Fan-in consolidation phase
        for m_idx, mule in enumerate(mules):
            tx_counter += 1
            amt_fi = round(chunk * 0.96, 2)
            t_fi = smurf_time + timedelta(hours=1, minutes=m_idx * 5)
            records_smurfs.append({
                "transaction_id": f"TX_SMURF_FI_{tx_counter}",
                "sender_account": mule,
                "receiver_account": collector,
                "amount": amt_fi,
                "timestamp": t_fi.strftime("%Y-%m-%d %H:%M:%S"),
                "transaction_type": "SETTLEMENT",
                "channel": "NEFT",
                "bank": collector_b["name"],
                "country": "IN",
                "is_aml": 1,
                "pattern_type": "SMURF_FAN_IN"
            })

    f12 = "12_smurfing_structuring_batches.csv"
    df_smurfs = pd.DataFrame(records_smurfs)
    df_smurfs.to_csv(os.path.join(output_dir, f12), index=False)
    created_files.append((f12, len(df_smurfs), len(df_smurfs)))
    print(f"[+] Saved {f12}: {len(df_smurfs)} smurfing records")

    # 4. File 13: Mule Fan-In / Fan-Out Syndicates
    records_mules = []
    num_mule_chains = 45
    for mc in range(num_mule_chains):
        origin = random.choice(all_accounts[random.choice(banks)["code"]])
        dest = random.choice(shared_offshore_pool)
        chain_len = random.randint(3, 5)
        chain_mules = random.sample(shared_mule_pool, chain_len)
        mule_path = [origin] + chain_mules + [dest]
        base_wire = random.uniform(600000, 2400000)
        start_mule = base_time + timedelta(hours=random.randint(10, 360))

        for step in range(len(mule_path) - 1):
            tx_counter += 1
            u = mule_path[step]
            v = mule_path[step + 1]
            amt_mule = round(base_wire * (0.98 ** step), 2)
            t_m = start_mule + timedelta(minutes=step * random.randint(10, 30))
            is_cross = (step == len(mule_path) - 2)
            records_mules.append({
                "transaction_id": f"TX_MULE_{tx_counter}",
                "sender_account": u,
                "receiver_account": v,
                "amount": amt_mule,
                "timestamp": t_m.strftime("%Y-%m-%d %H:%M:%S"),
                "transaction_type": "TRANSFER",
                "channel": "RTGS" if is_cross else "NEFT",
                "bank": "Interbank Mule Syndicate",
                "country": "AE" if is_cross else "IN",
                "is_aml": 1,
                "pattern_type": "MULE_CHAIN"
            })

    f13 = "13_mule_fan_in_out_networks.csv"
    df_mules = pd.DataFrame(records_mules)
    df_mules.to_csv(os.path.join(output_dir, f13), index=False)
    created_files.append((f13, len(df_mules), len(df_mules)))
    print(f"[+] Saved {f13}: {len(df_mules)} mule records")

    # 5. File 14: NPCI / RBI Interbank Clearing Stream (Combined high-volume stream)
    records_clearing = []
    for i in range(2500):
        tx_counter += 1
        t = base_time + timedelta(seconds=i * random.randint(5, 30))
        b_src = random.choice(banks)
        b_dst = random.choice(banks)
        ch = random.choices(["UPI", "IMPS", "NEFT", "RTGS"], weights=[0.6, 0.2, 0.15, 0.05], k=1)[0]
        amt = float(np.random.lognormal(mean=7.8, sigma=1.2))
        amt = max(20.0, round(amt, 2))
        
        records_clearing.append({
            "transaction_id": f"TX_NPCI_{tx_counter}",
            "sender_account": random.choice(all_accounts[b_src["code"]]),
            "receiver_account": random.choice(all_accounts[b_dst["code"]]),
            "amount": amt,
            "timestamp": t.strftime("%Y-%m-%d %H:%M:%S"),
            "transaction_type": "INTERBANK_SETTLEMENT",
            "channel": ch,
            "bank": f"NPCI Interbank ({b_src['code']} -> {b_dst['code']})",
            "country": "IN",
            "is_aml": 0,
            "pattern_type": "INTERBANK_CLEARING"
        })

    f14 = "14_interbank_clearing_stream.csv"
    df_clearing = pd.DataFrame(records_clearing)
    df_clearing.to_csv(os.path.join(output_dir, f14), index=False)
    created_files.append((f14, len(df_clearing), 0))
    print(f"[+] Saved {f14}: {len(df_clearing)} clearing records")

    # Create README index inside dataset directory
    index_md = "# Multi-Bank Transactional Record Benchmark Dataset\n\n"
    index_md += "| # | Dataset Filename | Institutional Source / Typology | Total Records | Illicit AML Records |\n"
    index_md += "| :--- | :--- | :--- | :--- | :--- |\n"
    total_tx = 0
    total_aml = 0
    for idx, (fn, count, aml) in enumerate(created_files):
        total_tx += count
        total_aml += aml
        index_md += f"| {idx+1} | `{fn}` | {fn.replace('.csv','').replace('_',' ').title()} | {count:,} | {aml:,} |\n"
    index_md += f"| **Total** | **14 Benchmark Files** | **Unified Multi-Bank Banking Stream** | **{total_tx:,}** | **{total_aml:,} ({total_aml/total_tx*100:.2f}%)** |\n"

    with open(os.path.join(output_dir, "DATASET_INDEX.md"), "w", encoding="utf-8") as f:
        f.write(index_md)

    print(f"\n=======================================================")
    print(f"   OFFLINE DATASETS GENERATED SUCCESSFULLY")
    print(f"   Total Files: {len(created_files)}")
    print(f"   Total Transactions: {total_tx:,}")
    print(f"   Total AML Crimes: {total_aml:,} ({total_aml/total_tx*100:.2f}%)")
    print(f"   Stored Directory: {output_dir}/")
    print(f"=======================================================")

if __name__ == "__main__":
    generate_offline_datasets()
