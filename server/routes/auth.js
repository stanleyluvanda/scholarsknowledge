// server/routes/auth.js
import express from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
// If you plan to actually send emails, add your Resend key in server/.env
// and uncomment the next line:
// import { Resend } from "resend";

const router = express.Router();

// --- open the same DB your migration created: server/data/data.sqlite ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "../data/data.sqlite");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);

// Ensure table exists (harmless if already there)
db.exec(`
  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at INTEGER NOT NULL,
    used_at INTEGER,
    created_at INTEGER NOT NULL,
    ip TEXT,
    user_agent TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_prt_token_hash ON password_reset_tokens(token_hash);
  CREATE INDEX IF NOT EXISTS idx_prt_email      ON password_reset_tokens(email);
`);

// Config
const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:5174";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const FROM_EMAIL = process.env.FROM_EMAIL || "ScholarsKnowledge <no-reply@example.com>";
// const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// POST /api/auth/forgot  { email }
router.post("/forgot", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ ok: false, error: "Email required" });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const now = Date.now();
    const expires = now + 30 * 60 * 1000; // 30 minutes

    const ip = (req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.socket?.remoteAddress || "").trim();
    const ua = String(req.headers["user-agent"] || "");

    db.prepare(
      `INSERT INTO password_reset_tokens (email, token_hash, expires_at, created_at, ip, user_agent)
       VALUES (?,?,?,?,?,?)`
    ).run(email, tokenHash, expires, now, ip, ua);

    const link = `${APP_BASE_URL}/login?mode=reset&token=${rawToken}`;

    // If you connect Resend later, uncomment to actually send emails:
    /*
    if (resend) {
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: "Reset your ScholarsKnowledge password",
          html: `<p>We received a request to reset your password.</p>
                 <p><a href="${link}">Click here to reset your password</a> (valid for 30 minutes).</p>
                 <p>If you didn’t request this, you can ignore this email.</p>`,
        });
        return res.json({ ok: true, emailed: true });
      } catch (e) {
        console.error("[auth/forgot] Resend error:", e);
      }
    }
    */

    // Dev fallback: return the link so you can click it locally
    return res.json({ ok: true, emailed: false, devLink: link });
  } catch (err) {
    console.error("[auth/forgot] error:", err);
    return res.status(500).json({ ok: false, error: "Internal error" });
  }
});

// POST /api/auth/reset  { token }
// Verifies token server-side and returns the email mapped to it.
// (You update the client-side user’s password using that email.)
router.post("/reset", (req, res) => {
  try {
    const rawToken = String(req.body?.token || "");
    if (!rawToken) return res.status(400).json({ ok: false, error: "Missing token" });

    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const now = Date.now();

    const row = db.prepare(`SELECT * FROM password_reset_tokens WHERE token_hash = ?`).get(tokenHash);
    if (!row) return res.status(400).json({ ok: false, error: "Invalid or used token" });
    if (row.used_at) return res.status(400).json({ ok: false, error: "Token already used" });
    if (row.expires_at < now) return res.status(400).json({ ok: false, error: "Token expired" });

    db.prepare(`UPDATE password_reset_tokens SET used_at = ? WHERE id = ?`).run(now, row.id);

    // We don't have a server-side users table here, so return the email
    // so the frontend can update the localStorage user with that email.
    return res.json({ ok: true, email: row.email });
  } catch (err) {
    console.error("[auth/reset] error:", err);
    return res.status(500).json({ ok: false, error: "Internal error" });
  }
});

export default router;