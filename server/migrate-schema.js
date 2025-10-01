// server/migrate-schema.js  (ESM)
import Database from 'better-sqlite3';

// Use the same DB file your server uses
const db = new Database('./data.sqlite');

// Ensure table exists
db.exec(`
CREATE TABLE IF NOT EXISTS scholarships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  provider TEXT NOT NULL,
  country TEXT,
  level TEXT,
  field TEXT,
  fundingType TEXT,
  deadline TEXT,
  link TEXT,
  partnerApplyUrl TEXT,
  description TEXT,
  eligibility TEXT,
  benefits TEXT,
  howToApply TEXT,
  amount TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);
`);

try {
  db.prepare('ALTER TABLE scholarships ADD COLUMN partnerEmail TEXT').run();
  console.log('OK: partnerEmail added');
} catch (e) {
  console.log('Maybe exists:', e.message);
}

console.log('Done.');