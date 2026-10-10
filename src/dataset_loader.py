import os
import glob
import pandas as pd
from typing import List, Dict, Any, Optional

class BankDatasetLoader:
    """
    Dedicated Offline Dataset Loader for Multi-Bank Transactional Streams.
    Loads and serves real/realistic transactional records directly from 
    the persistent 'dataset/' directory across 14 institutional sources.
    """
    def __init__(self, dataset_dir: str = "dataset"):
        self.dataset_dir = dataset_dir
        self._cached_df: Optional[pd.DataFrame] = None

    def list_available_datasets(self) -> List[Dict[str, Any]]:
        """Lists all physical dataset files and their basic statistics."""
        files = sorted(glob.glob(os.path.join(self.dataset_dir, "*.csv")))
        summaries = []
        for f in files:
            fname = os.path.basename(f)
            size_kb = round(os.path.getsize(f) / 1024, 1)
            try:
                # Fast row count
                df = pd.read_csv(f)
                row_count = len(df)
                aml_count = int(df["is_aml"].sum()) if "is_aml" in df.columns else 0
                bank_name = str(df["bank"].iloc[0]) if "bank" in df.columns and len(df) > 0 else "Unknown"
            except Exception:
                row_count = 0
                aml_count = 0
                bank_name = "Unknown"
                
            summaries.append({
                "filename": fname,
                "filepath": f,
                "size_kb": size_kb,
                "total_records": row_count,
                "aml_records": aml_count,
                "bank": bank_name
            })
        return summaries

    def load_all_datasets(self, reload: bool = False) -> pd.DataFrame:
        """
        Loads all 14 dataset files from disk, concatenates them into a unified 
        multi-bank continuous stream, and sorts them chronologically.
        """
        if self._cached_df is not None and not reload:
            return self._cached_df.copy()

        files = sorted(glob.glob(os.path.join(self.dataset_dir, "*.csv")))
        if not files:
            raise FileNotFoundError(f"No CSV dataset files found in directory: {self.dataset_dir}")

        dfs = []
        for f in files:
            try:
                df = pd.read_csv(f)
                dfs.append(df)
            except Exception as e:
                print(f"[!] Warning: Failed to read {f}: {e}")

        if not dfs:
            raise ValueError(f"Failed to load any valid data from {self.dataset_dir}")

        combined = pd.concat(dfs, ignore_index=True)
        # Sort chronologically by timestamp
        if "timestamp" in combined.columns:
            combined["_dt"] = pd.to_datetime(combined["timestamp"], errors="coerce")
            combined = combined.sort_values("_dt").reset_index(drop=True).drop(columns=["_dt"])

        self._cached_df = combined
        return combined.copy()

    def load_single_dataset(self, filename: str) -> pd.DataFrame:
        """Loads a specific dataset file by filename (e.g. '01_sbi_retail_upi_stream.csv')."""
        target = os.path.join(self.dataset_dir, filename)
        if not os.path.exists(target):
            # Try fuzzy match
            matches = glob.glob(os.path.join(self.dataset_dir, f"*{filename}*"))
            if matches:
                target = matches[0]
            else:
                raise FileNotFoundError(f"Dataset file '{filename}' not found in {self.dataset_dir}")
        return pd.read_csv(target)

    def sample_transactions(self, n: int = 50, pattern_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Samples realistic transaction dictionaries directly from the stored dataset files 
        to serve live simulation endpoints.
        """
        df = self.load_all_datasets()
        if pattern_filter and "pattern_type" in df.columns:
            filtered = df[df["pattern_type"].str.contains(pattern_filter, case=False, na=False)]
            if len(filtered) > 0:
                df = filtered

        sampled_df = df.sample(min(n, len(df)), replace=False if len(df) >= n else True)
        return sampled_df.to_dict(orient="records")

if __name__ == "__main__":
    loader = BankDatasetLoader()
    summary = loader.list_available_datasets()
    print(f"Discovered {len(summary)} dataset files:")
    for s in summary:
        print(f" - {s['filename']}: {s['total_records']} rows, {s['aml_records']} AML ({s['bank']})")
    all_df = loader.load_all_datasets()
    print(f"Total Combined Unified Records: {len(all_df)}")
