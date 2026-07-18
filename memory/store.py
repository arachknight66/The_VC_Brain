"""SQLite persistence layer for FounderRecords.

Records are stored as a JSON blob (the full FounderRecord contract) plus a
few indexed columns used for the dashboard's ranked list and for entity
matching on repeat pipeline runs.
"""
from __future__ import annotations

import json
import os
import sqlite3
from contextlib import contextmanager
from typing import Optional

from memory.models import FounderRecord, FounderScoreHistoryEntry, now_iso

DB_PATH = os.path.join(os.path.dirname(__file__), "vc_brain.db")

_SCHEMA = """
CREATE TABLE IF NOT EXISTS founders (
    founder_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    company_name TEXT NOT NULL,
    founder_score REAL DEFAULT 0,
    last_updated_at TEXT NOT NULL,
    record_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_founders_name ON founders (name);
CREATE INDEX IF NOT EXISTS idx_founders_score ON founders (founder_score);
"""


class FounderStore:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self._init_db()

    @contextmanager
    def _connect(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()

    def _init_db(self) -> None:
        with self._connect() as conn:
            conn.executescript(_SCHEMA)

    def find_by_name(self, name: str) -> Optional[FounderRecord]:
        """Entity match for repeat pipeline runs (case-insensitive name match)."""
        with self._connect() as conn:
            row = conn.execute(
                "SELECT record_json FROM founders WHERE lower(name) = lower(?) LIMIT 1",
                (name,),
            ).fetchone()
        if row is None:
            return None
        return FounderRecord.from_dict(json.loads(row["record_json"]))

    def get(self, founder_id: str) -> Optional[FounderRecord]:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT record_json FROM founders WHERE founder_id = ?", (founder_id,)
            ).fetchone()
        if row is None:
            return None
        return FounderRecord.from_dict(json.loads(row["record_json"]))

    def list_all(self) -> list[FounderRecord]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT record_json FROM founders ORDER BY founder_score DESC"
            ).fetchall()
        return [FounderRecord.from_dict(json.loads(r["record_json"])) for r in rows]

    def upsert(self, record: FounderRecord, score_context: Optional[str] = None) -> FounderRecord:
        """Insert or update a record. If a prior record exists for this name,
        carries forward founder_score.history (appending a new entry rather
        than overwriting) before saving.
        """
        existing = self.find_by_name(record.name)
        if existing is not None:
            record.founder_id = existing.founder_id
            record.first_seen_at = existing.first_seen_at
            record.founder_score.history = list(existing.founder_score.history)

        record.founder_score.history.append(
            FounderScoreHistoryEntry(
                timestamp=now_iso(),
                value=record.founder_score.value,
                context=score_context or "pipeline_run",
            )
        )
        record.touch()

        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO founders (founder_id, name, company_name, founder_score, last_updated_at, record_json)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(founder_id) DO UPDATE SET
                    name=excluded.name,
                    company_name=excluded.company_name,
                    founder_score=excluded.founder_score,
                    last_updated_at=excluded.last_updated_at,
                    record_json=excluded.record_json
                """,
                (
                    record.founder_id,
                    record.name,
                    record.company_name,
                    record.founder_score.value,
                    record.last_updated_at,
                    json.dumps(record.to_dict()),
                ),
            )
        return record

    def reset(self) -> None:
        """Drop and recreate the founders table. Used for a clean demo run."""
        with self._connect() as conn:
            conn.executescript("DROP TABLE IF EXISTS founders;")
            conn.executescript(_SCHEMA)
