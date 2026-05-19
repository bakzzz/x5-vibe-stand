import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { DEFAULT_STAND_BRANDING_JSON } from '../../src/shared/branding/standBranding';
import { STAND_BRANDING_KEY } from '../../src/lib/constants';

function dbPath() {
  return process.env.STAND_DB_PATH ?? path.join(process.cwd(), 'data/stand.db');
}

function openDb(readonly: boolean) {
  const p = dbPath();
  if (!fs.existsSync(p)) throw new Error(`Database not found: ${p}. Run npm run db:init`);
  return new Database(p, { readonly });
}

function ensureSettingsTable(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

export const settingsApi = new Hono()
  .get('/:key', (c) => {
    const key = c.req.param('key');
    if (key !== STAND_BRANDING_KEY) return c.json({ error: 'Not found' }, 404);
    const db = openDb(true);
    ensureSettingsTable(db);
    const row = db
      .prepare('SELECT key, value, updated_at AS updatedAt FROM system_settings WHERE key = ?')
      .get(key) as { value: string; updatedAt: string } | undefined;
    db.close();
    const empty = !row?.value?.trim() || row.value.trim() === '{}';
    return c.json({
      key: STAND_BRANDING_KEY,
      value: empty ? DEFAULT_STAND_BRANDING_JSON : row!.value,
      updatedAt: row?.updatedAt ?? new Date().toISOString(),
    });
  })
  .put(
    '/:key',
    zValidator('json', z.object({ value: z.string() })),
    (c) => {
      const key = c.req.param('key');
      if (key !== STAND_BRANDING_KEY) return c.json({ error: 'Forbidden' }, 403);
      const { value } = c.req.valid('json');
      const db = openDb(false);
      ensureSettingsTable(db);
      const now = new Date().toISOString();
      const existing = db.prepare('SELECT key FROM system_settings WHERE key = ?').get(key);
      if (existing) {
        db.prepare('UPDATE system_settings SET value = ?, updated_at = ? WHERE key = ?').run(value, now, key);
      } else {
        db.prepare('INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)').run(key, value, now);
      }
      const row = db
        .prepare('SELECT key, value, updated_at AS updatedAt FROM system_settings WHERE key = ?')
        .get(key);
      db.close();
      return c.json(row);
    },
  );
