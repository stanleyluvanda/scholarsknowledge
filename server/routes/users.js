// server/routes/users.js
import express from "express";
import db from "../db.js";

const router = express.Router();

/* ---------- ensure table & columns exist ---------- */
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    uid TEXT PRIMARY KEY,
    role TEXT,
    name TEXT,
    email TEXT,
    university TEXT,
    faculty TEXT,
    ufKey TEXT,
    title TEXT,
    photoURL TEXT,
    createdAt TEXT,
    updatedAt TEXT
  )
`).run();

// presence columns (safe no-ops if already exist)
try { db.prepare(`ALTER TABLE users ADD COLUMN lastSeen INTEGER`).run(); } catch {}
try { db.prepare(`ALTER TABLE users ADD COLUMN online INTEGER`).run(); } catch {}

/* ---------- helpers ---------- */
function canon(s = "") {
  return String(s)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
function ufKeyOf(u = "", f = "") {
  const U = canon(u).replace(/\s+/g, "-");
  const F = canon(f).replace(/\s+/g, "-");
  return `${U}::${F}`;
}
function isOnline(lastSeenMs) {
  if (!lastSeenMs) return false;
  return (Date.now() - Number(lastSeenMs)) < 120000; // 2 minutes
}

/* ---------- upsert (called on login) ---------- */
router.post("/upsert", (req, res) => {
  try {
    const {
      uid, role, name, email, university = "", faculty = "",
      title = "", photoURL = "", lastSeen
    } = req.body || {};
    if (!uid) return res.status(400).json({ ok:false, error: "uid required" });

    const nowIso = new Date().toISOString();
    const ufKey = ufKeyOf(university, faculty);
    const lastSeenVal = typeof lastSeen === "number" ? lastSeen : null;

    db.prepare(`
      INSERT INTO users (uid, role, name, email, university, faculty, ufKey, title, photoURL, createdAt, updatedAt, lastSeen, online)
      VALUES (@uid, @role, @name, @email, @university, @faculty, @ufKey, @title, @photoURL, @nowIso, @nowIso, @lastSeenVal, @online)
      ON CONFLICT(uid) DO UPDATE SET
        role=excluded.role,
        name=excluded.name,
        email=excluded.email,
        university=excluded.university,
        faculty=excluded.faculty,
        ufKey=excluded.ufKey,
        title=excluded.title,
        photoURL=excluded.photoURL,
        updatedAt=excluded.updatedAt,
        lastSeen=COALESCE(excluded.lastSeen, users.lastSeen),
        online=COALESCE(excluded.online, users.online)
    `).run({
      uid,
      role,
      name,
      email,
      university,
      faculty,
      ufKey,
      title,
      photoURL,
      nowIso,
      lastSeenVal,
      online: lastSeenVal ? 1 : 0
    });

    return res.json({ ok:true, ufKey });
  } catch (e) {
    console.error("users/upsert", e);
    return res.status(500).json({ ok:false, error: "server" });
  }
});

/* ---------- heartbeat: mark a user online ---------- */
router.post("/ping", (req, res) => {
  try {
    const { uid } = req.body || {};
    if (!uid) return res.status(400).json({ ok:false, error: "uid required" });

    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    db.prepare(`
      UPDATE users SET lastSeen = @nowMs, online = 1, updatedAt = @nowIso
      WHERE uid = @uid
    `).run({ uid, nowMs, nowIso });

    return res.json({ ok:true, lastSeen: nowMs });
  } catch (e) {
    console.error("users/ping", e);
    return res.status(500).json({ ok:false, error: "server" });
  }
});

/* ---------- list lecturers by ufKey (with presence) ---------- */
router.get("/", (req, res) => {
  try {
    const { university = "", faculty = "" } = req.query;
    const ufKey = ufKeyOf(university, faculty);

    const rows = db.prepare(`
      SELECT uid, role, name, email, university, faculty, ufKey, title, photoURL, lastSeen, online
      FROM users
      WHERE role = 'lecturer' AND ufKey = ?
      ORDER BY name COLLATE NOCASE ASC
      LIMIT 500
    `).all(ufKey);

    const out = rows.map(r => ({
      ...r,
      online: r.lastSeen ? isOnline(r.lastSeen) : !!r.online,
      lastSeen: r.lastSeen || null
    }));

    return res.json({ ok:true, lecturers: out });
  } catch (e) {
    console.error("users/list", e);
    return res.status(500).json({ ok:false, error: "server" });
  }
});

/* ---------- NEW: get a single user by uid ---------- */
router.get("/:uid", (req, res) => {
  try {
    const { uid } = req.params;
    if (!uid) return res.status(400).json({ ok:false, error: "uid required" });

    const row = db.prepare(`
      SELECT uid, role, name, email, university, faculty, ufKey, title, photoURL, lastSeen, online
      FROM users
      WHERE uid = ?
      LIMIT 1
    `).get(uid);

    if (!row) return res.status(404).json({ ok:false, error: "not_found" });

    const user = {
      ...row,
      online: row.lastSeen ? isOnline(row.lastSeen) : !!row.online,
      lastSeen: row.lastSeen || null
    };

    return res.json({ ok:true, user });
  } catch (e) {
    console.error("users/get", e);
    return res.status(500).json({ ok:false, error: "server" });
  }
});

export default router;