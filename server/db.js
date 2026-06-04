const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./db.sqlite');
module.exports = db;

db.serialize(() => {

    db.run(`
        CREATE TABLE IF NOT EXISTS heroes (
            hero_id TEXT PRIMARY KEY,
            name TEXT,
            role TEXT,
            subrole TEXT,
            portrait TEXT,
            color TEXT
        );
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS hero_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hero_id TEXT,
            tier TEXT,
            map_name TEXT,
            pickrate REAL,
            winrate REAL,
            banrate REAL,
            patch TEXT,
            collected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(hero_id)
                REFERENCES heroes(hero_id)
        );
    `);

});
