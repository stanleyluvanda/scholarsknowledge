// server/migrate-schema.js  (ESM)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure a stable folder like server/data/
const dataDir = path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "data.sqlite");
const db = new Database(dbPath);

// ---------- Scholarships table (kept from your previous script) ----------
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
  db.prepare("ALTER TABLE scholarships ADD COLUMN partnerEmail TEXT").run();
  console.log("OK: scholarships.partnerEmail added");
} catch (e) {
  console.log("scholarships.partnerEmail maybe exists:", e.message);
}

// ---------- NEW: password_reset_tokens ----------
db.exec(`
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL, -- epoch ms
  used_at INTEGER,             -- epoch ms (nullable)
  created_at INTEGER NOT NULL, -- epoch ms
  ip TEXT,
  user_agent TEXT
);
CREATE INDEX IF NOT EXISTS idx_prt_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_prt_email      ON password_reset_tokens(email);
`);

console.log("[migrate] Using DB:", dbPath);
console.log("[migrate] password_reset_tokens table is ready ✅");
console.log("[migrate] schema migration complete ✅");