// server/routes/contact.js
import express from "express";
import db from "../db.js";

const router = express.Router();

/* ---------- schema ---------- */
db.prepare(`
  CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    createdAt TEXT,
    updatedAt TEXT,
    -- sender
    studentUid TEXT,
    studentName TEXT,
    studentProgram TEXT,
    -- recipient
    lecturerUid TEXT,
    lecturerName TEXT,
    lecturerTitle TEXT,
    lecturerFaculty TEXT,
    -- content
    subject TEXT,
    body TEXT,
    attachmentName TEXT,
    attachmentMime TEXT,
    attachmentData TEXT,
    -- state
    isRead INTEGER DEFAULT 0
  )
`).run();

try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_contact_lecturerUid ON contact_messages (lecturerUid, createdAt)`).run(); } catch {}
try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_contact_studentUid ON contact_messages (studentUid, createdAt)`).run(); } catch {}

/* ---------- helpers ---------- */
function nowIso() { return new Date().toISOString(); }
function clampStr(s = "", max = 2000) {
  s = String(s || "");
  return s.length > max ? s.slice(0, max) : s;
}
function cutoffIsoMonthsAgo(months = 5) {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString();
}

/* ---------- POST /api/contact  (student -> lecturer) ---------- */
router.post("/", (req, res) => {
  try {
    const {
      studentUid, studentName = "", studentProgram = "",
      lecturerUid, lecturerName = "", lecturerTitle = "", lecturerFaculty = "",
      subject = "", body = "",
      attachment = null // { name, mime, data }
    } = req.body || {};

    if (!studentUid || !lecturerUid) {
      return res.status(400).json({ ok:false, error:"studentUid and lecturerUid required" });
    }

    const row = {
      createdAt: nowIso(),
      updatedAt: nowIso(),
      studentUid,
      studentName: clampStr(studentName, 140),
      studentProgram: clampStr(studentProgram, 140),
      lecturerUid,
      lecturerName: clampStr(lecturerName, 140),
      lecturerTitle: clampStr(lecturerTitle, 40),
      lecturerFaculty: clampStr(lecturerFaculty, 200),
      subject: clampStr(subject, 240),
      body: clampStr(body, 8000),
      attachmentName: attachment?.name ? clampStr(attachment.name, 180) : null,
      attachmentMime: attachment?.mime ? clampStr(attachment.mime, 100) : null,
      attachmentData: attachment?.data ? String(attachment.data).slice(0, 2_000_000) : null, // ~2MB cap
    };

    const stmt = db.prepare(`
      INSERT INTO contact_messages (
        createdAt, updatedAt,
        studentUid, studentName, studentProgram,
        lecturerUid, lecturerName, lecturerTitle, lecturerFaculty,
        subject, body,
        attachmentName, attachmentMime, attachmentData,
        isRead
      ) VALUES (
        @createdAt, @updatedAt,
        @studentUid, @studentName, @studentProgram,
        @lecturerUid, @lecturerName, @lecturerTitle, @lecturerFaculty,
        @subject, @body,
        @attachmentName, @attachmentMime, @attachmentData,
        0
      )
    `);

    const info = stmt.run(row);
    return res.json({ ok:true, id: info.lastInsertRowid });
  } catch (e) {
    console.error("contact POST", e);
    return res.status(500).json({ ok:false, error:"server" });
  }
});

/* ---------- GET /api/contact?lecturerUid=... (lecturer inbox) ---------- */
router.get("/", (req, res) => {
  try {
    const { lecturerUid } = req.query || {};
    if (!lecturerUid) return res.status(400).json({ ok:false, error:"lecturerUid required" });

    const rows = db.prepare(`
      SELECT *
      FROM contact_messages
      WHERE lecturerUid = ?
      ORDER BY isRead ASC, datetime(createdAt) DESC
      LIMIT 500
    `).all(String(lecturerUid));

    return res.json({ ok:true, messages: rows });
  } catch (e) {
    console.error("contact GET", e);
    return res.status(500).json({ ok:false, error:"server" });
  }
});

/* ---------- NEW: GET /api/contact/sent?studentUid=... (student sent) ---------- */
router.get("/sent", (req, res) => {
  try {
    const { studentUid } = req.query || {};
    if (!studentUid) return res.status(400).json({ ok:false, error:"studentUid required" });

    const rows = db.prepare(`
      SELECT *
      FROM contact_messages
      WHERE studentUid = ?
      ORDER BY datetime(createdAt) DESC
      LIMIT 500
    `).all(String(studentUid));

    return res.json({ ok:true, messages: rows });
  } catch (e) {
    console.error("contact GET sent", e);
    return res.status(500).json({ ok:false, error:"server" });
  }
});

/* ---------- PATCH /api/contact/:id/read (mark read) ---------- */
router.patch("/:id/read", (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ ok:false, error:"bad id" });
    db.prepare(`
      UPDATE contact_messages
      SET isRead = 1, updatedAt = @now
      WHERE id = @id
    `).run({ id, now: nowIso() });
    return res.json({ ok:true });
  } catch (e) {
    console.error("contact PATCH read", e);
    return res.status(500).json({ ok:false, error:"server" });
  }
});

/* ---------- DELETE /api/contact/:id (allow either side to delete) ---------- */
router.delete("/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ ok:false, error:"bad id" });
    db.prepare(`DELETE FROM contact_messages WHERE id = ?`).run(id);
    return res.json({ ok:true });
  } catch (e) {
    console.error("contact DELETE", e);
    return res.status(500).json({ ok:false, error:"server" });
  }
});

/* ---------- Auto-purge: delete anything older than 5 months ---------- */
function purgeOldMessages(months = 5) {
  try {
    const cutoff = cutoffIsoMonthsAgo(months);
    db.prepare(`
      DELETE FROM contact_messages
      WHERE datetime(createdAt) < datetime(@cutoff)
    `).run({ cutoff });
    // Optional: you can log the change count with db.changes if you expose it.
  } catch (e) {
    console.error("contact purge", e);
  }
}

// run once on load, then daily
purgeOldMessages(5);
setInterval(() => purgeOldMessages(5), 24 * 60 * 60 * 1000);

export default router;