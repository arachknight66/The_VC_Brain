"""SQLite persistence for raw Stage 0 scanner signals."""
from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager

from memory.signals import Signal
from memory.store import DB_PATH

_SCHEMA = """
CREATE TABLE IF NOT EXISTS signals (
    signal_id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    external_id TEXT NOT NULL,
    title TEXT NOT NULL,
    source_url TEXT NOT NULL,
    query TEXT NOT NULL,
    score REAL NOT NULL DEFAULT 0,
    observed_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'raw',
    signal_json TEXT NOT NULL,
    UNIQUE(source, external_id)
);
CREATE INDEX IF NOT EXISTS idx_signals_source ON signals (source);
CREATE INDEX IF NOT EXISTS idx_signals_score ON signals (score DESC);
"""


class SignalStore:
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

    def upsert_many(self, signals: list[Signal]) -> list[Signal]:
        with self._connect() as conn:
            for signal in signals:
                external_id = signal.external_id or signal.source_url
                signal.external_id = external_id
                existing = conn.execute(
                    "SELECT signal_id FROM signals WHERE source = ? AND external_id = ?",
                    (signal.source, external_id),
                ).fetchone()
                if existing:
                    signal.signal_id = existing["signal_id"]
                conn.execute(
                    """
                    INSERT INTO signals
                        (signal_id, source, external_id, title, source_url, query, score,
                         observed_at, status, signal_json)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(source, external_id) DO UPDATE SET
                        title=excluded.title,
                        source_url=excluded.source_url,
                        query=excluded.query,
                        score=excluded.score,
                        observed_at=excluded.observed_at,
                        status=excluded.status,
                        signal_json=excluded.signal_json
                    """,
                    (
                        signal.signal_id,
                        signal.source,
                        external_id,
                        signal.title,
                        signal.source_url,
                        signal.query,
                        signal.score,
                        signal.observed_at,
                        signal.status,
                        json.dumps(signal.to_dict()),
                    ),
                )
        return signals

    def list(self, *, source: str | None = None, limit: int = 100) -> list[Signal]:
        limit = max(1, min(limit, 500))
        with self._connect() as conn:
            if source:
                rows = conn.execute(
                    "SELECT signal_json FROM signals WHERE source = ? ORDER BY score DESC, observed_at DESC LIMIT ?",
                    (source, limit),
                ).fetchall()
            else:
                rows = conn.execute(
                    "SELECT signal_json FROM signals ORDER BY score DESC, observed_at DESC LIMIT ?",
                    (limit,),
                ).fetchall()
        return [Signal.from_dict(json.loads(row["signal_json"])) for row in rows]

    def count_by_source(self) -> dict[str, int]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT source, COUNT(*) AS total FROM signals GROUP BY source ORDER BY source"
            ).fetchall()
        return {row["source"]: row["total"] for row in rows}

    def reset(self) -> None:
        with self._connect() as conn:
            conn.execute("DROP TABLE IF EXISTS signals")
            conn.executescript(_SCHEMA)
