import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dbPath = process.env.STAND_DB_PATH ?? path.join(root, 'data/stand.db');
const db = new Database(dbPath);

const cols = [
  ['local_repo_path', 'TEXT'],
  ['last_sync_at', 'TEXT'],
  ['last_sync_commit', 'TEXT'],
  ['sync_status', 'TEXT'],
  ['sync_error', 'TEXT'],
];

const existing = db.prepare('PRAGMA table_info(projects)').all().map((r) => r.name);
for (const [name, type] of cols) {
  if (!existing.includes(name)) {
    db.exec(`ALTER TABLE projects ADD COLUMN ${name} ${type}`);
    console.log('added', name);
  }
}

db.exec(`
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

console.log('migrate done:', dbPath);
