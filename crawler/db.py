import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parents[1] / "db.sqlite"
db = sqlite3.connect(DB_PATH)

db.execute("""
    CREATE UNIQUE INDEX IF NOT EXISTS ux_hero_stats_collection
    ON hero_stats(hero_id, tier, map_name, patch)
""")
db.execute("""
    CREATE TABLE IF NOT EXISTS collection_runs (
        patch TEXT NOT NULL,
        tier TEXT NOT NULL,
        map_name TEXT NOT NULL,
        hero_count INTEGER NOT NULL,
        completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (patch, tier, map_name)
    )
""")
db.commit()

def already_collected(patch, tier, map_name):
    cursor = db.execute(
        "SELECT 1 FROM collection_runs WHERE patch=? AND tier=? AND map_name=? LIMIT 1",
        (patch, tier, map_name)
    )
    return cursor.fetchone() is not None


def save_collection(heroes, tier, map_name, patch):
    if not heroes:
        raise ValueError("빈 통계 결과는 저장할 수 없습니다.")

    rows = [
        (
            hero['hero_id'], tier, map_name,
            hero['pickrate'], hero['winrate'], hero['banrate'], patch
        )
        for hero in heroes
    ]

    with db:
        db.executemany("""
            INSERT INTO hero_stats
                (hero_id, tier, map_name, pickrate, winrate, banrate, patch)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(hero_id, tier, map_name, patch) DO UPDATE SET
                pickrate=excluded.pickrate,
                winrate=excluded.winrate,
                banrate=excluded.banrate,
                collected_at=CURRENT_TIMESTAMP
        """, rows)
        db.execute("""
            INSERT INTO collection_runs
                (patch, tier, map_name, hero_count, completed_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(patch, tier, map_name) DO UPDATE SET
                hero_count=excluded.hero_count,
                completed_at=CURRENT_TIMESTAMP
        """, (patch, tier, map_name, len(rows)))

