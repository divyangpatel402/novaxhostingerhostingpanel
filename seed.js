import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

async function seed() {
    db.serialize(async () => {
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE,
                password TEXT
            )
        `);
        const hash = await bcrypt.hash('admin', 10);
        db.run('INSERT OR IGNORE INTO users (email, password) VALUES (?, ?)', ['admin@nova.host', hash], (err) => {
            if (err) console.error(err);
            else console.log('Test user created: admin@nova.host / admin');
            process.exit(0);
        });
    });
}
seed();
