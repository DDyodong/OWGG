import sqlite3

db = sqlite3.connect('../db.sqlite')

def already_collected(patch, tier, map_name):
    cursor = db.execute(
        "SELECT 1 FROM hero_stats WHERE patch=? AND tier=? AND map_name=? LIMIT 1",
        (patch, tier, map_name)
    )
    return cursor.fetchone() is not None


def save_stats(hero, tier, map_name, patch):
    db.execute("""
        INSERT OR IGNORE INTO hero_stats 
            (hero_id, tier, map_name, pickrate, winrate, banrate, patch)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (hero['hero_id'], tier, map_name, hero['pickrate'], hero['winrate'], hero['banrate'], patch))
    db.commit()

