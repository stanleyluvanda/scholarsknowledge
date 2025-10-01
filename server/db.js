// server/db.js
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Save database in a file "data.sqlite"
const db = new Database(path.join(__dirname, "data.sqlite"));

// Create scholarships table if not exists
db.prepare(`
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
    eligibility TEXT,
    benefits TEXT,
    howToApply TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending'  -- admin approves later
  )
`).run();

export default db;