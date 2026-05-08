"""
excel_cleaner.py — Generic multi-sheet Excel cleaning utility.

Usage:
    python excel_cleaner.py input.xlsx                        # -> cleaned_input.xlsx
    python excel_cleaner.py input.xlsx -o output.xlsx
    python excel_cleaner.py input.xlsx --no-ffill --no-promote-header
    python excel_cleaner.py input.xlsx --drop-threshold 0.5
"""

from __future__ import annotations

import argparse
import logging
import sys
from dataclasses import dataclass, field
from pathlib import Path

import pandas as pd

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    format="%(levelname)s │ %(message)s",
    level=logging.INFO,
    stream=sys.stdout,
)
log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

@dataclass
class CleanConfig:
    """Controls which cleaning steps are applied to every sheet."""

    drop_empty_rows: bool = True
    drop_empty_cols: bool = True
    # Fraction of non-null values required to KEEP a row/column (0 = keep if any value exists)
    row_thresh: float = 0.0
    col_thresh: float = 0.0
    forward_fill: bool = True
    promote_header: bool = True          # Treat first non-empty row as column names
    strip_whitespace: bool = True        # Strip leading/trailing whitespace from string cells
    reset_index: bool = True
    sheet_name_max_len: int = 31         # Excel hard limit


# ---------------------------------------------------------------------------
# Core cleaning logic
# ---------------------------------------------------------------------------

def _drop_sparse(df: pd.DataFrame, config: CleanConfig) -> pd.DataFrame:
    """Drop rows/columns that are entirely empty or below the configured threshold."""
    if config.drop_empty_rows:
        thresh = int(df.shape[1] * config.row_thresh) + 1 if config.row_thresh else None
        df = df.dropna(axis=0, how="all") if thresh is None else df.dropna(axis=0, thresh=thresh)

    if config.drop_empty_cols:
        thresh = int(df.shape[0] * config.col_thresh) + 1 if config.col_thresh else None
        df = df.dropna(axis=1, how="all") if thresh is None else df.dropna(axis=1, thresh=thresh)

    return df


def _strip_whitespace(df: pd.DataFrame) -> pd.DataFrame:
    str_cols = df.select_dtypes(include="object").columns
    df[str_cols] = df[str_cols].apply(lambda col: col.str.strip())
    return df


def clean_sheet(df: pd.DataFrame, config: CleanConfig) -> pd.DataFrame:
    """Apply all configured cleaning steps to a single DataFrame."""
    df = _drop_sparse(df, config)

    if config.forward_fill:
        df = df.ffill(axis=0)

    if config.promote_header and not df.empty:
        df.columns = df.iloc[0]
        df = df.iloc[1:]
        df.columns.name = None

    if config.strip_whitespace:
        df = _strip_whitespace(df)

    if config.reset_index:
        df = df.reset_index(drop=True)

    return df


# ---------------------------------------------------------------------------
# File-level orchestration
# ---------------------------------------------------------------------------

def clean_excel(input_path: Path, output_path: Path, config: CleanConfig) -> None:
    if not input_path.exists():
        log.error("File not found: %s", input_path)
        sys.exit(1)

    log.info("Reading  → %s", input_path)
    sheets: dict[str, pd.DataFrame] = pd.read_excel(
        input_path, header=None, sheet_name=None
    )
    log.info("Found %d sheet(s). Cleaning…", len(sheets))

    with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
        for raw_name, df in sheets.items():
            before = df.shape
            df = clean_sheet(df, config)
            after = df.shape

            safe_name = str(raw_name)[: config.sheet_name_max_len]
            df.to_excel(writer, sheet_name=safe_name, index=False)

            log.info(
                "  %-30s  %d×%d  →  %d×%d",
                f"'{safe_name}'",
                before[0], before[1],
                after[0],  after[1],
            )

    log.info("✅ Saved  → %s", output_path)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Clean and normalize multi-sheet Excel files.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    p.add_argument("input", type=Path, help="Path to the source .xlsx file.")
    p.add_argument(
        "-o", "--output", type=Path, default=None,
        help="Destination path. Defaults to 'cleaned_<input>'.",
    )

    # Toggle steps
    p.add_argument("--no-drop-rows",      dest="drop_empty_rows", action="store_false", help="Keep fully empty rows.")
    p.add_argument("--no-drop-cols",      dest="drop_empty_cols", action="store_false", help="Keep fully empty columns.")
    p.add_argument("--no-ffill",          dest="forward_fill",    action="store_false", help="Skip forward-fill of merged cells.")
    p.add_argument("--no-promote-header", dest="promote_header",  action="store_false", help="Keep original header row as data.")
    p.add_argument("--no-strip",          dest="strip_whitespace",action="store_false", help="Skip whitespace stripping.")

    # Thresholds
    p.add_argument(
        "--row-thresh", type=float, default=0.0, metavar="0-1",
        help="Min fraction of non-null values to keep a row (0 = keep if any value).",
    )
    p.add_argument(
        "--col-thresh", type=float, default=0.0, metavar="0-1",
        help="Min fraction of non-null values to keep a column (0 = keep if any value).",
    )
    return p


def main() -> None:
    parser = _build_parser()
    args = parser.parse_args()

    config = CleanConfig(
        drop_empty_rows=args.drop_empty_rows,
        drop_empty_cols=args.drop_empty_cols,
        forward_fill=args.forward_fill,
        promote_header=args.promote_header,
        strip_whitespace=args.strip_whitespace,
        row_thresh=args.row_thresh,
        col_thresh=args.col_thresh,
    )

    output = args.output or args.input.with_name(f"cleaned_{args.input.name}")
    clean_excel(args.input, output, config)


if __name__ == "__main__":
    main()