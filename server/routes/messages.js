// server/routes/messages.js
import express from "express";
import db from "../db.js";

const router = express.Router();

/* ----------------- tables ------------------ */
db.prepare(`
  CREATE TABLE IF NOT EXISTS threads (
    id TEXT PRIMARY KEY,
    studentUid TEXT,
    lecturerUid TEXT,
    subject TEXT,
    createdAt TEXT,
    updatedAt TEXT
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    threadId TEXT,
    senderUid TEXT,
    senderRole TEXT, /* "student" | "lecturer" */
    text TEXT,
    attachments TEXT, /* JSON array: [{name,mime,dataUrl}] */
    createdAt TEXT
  )
`).run();

/* index for quick lookups */
try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_threads_student ON threads(studentUid)`).run(); } catch {}
try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_threads_lecturer ON threads(lecturerUid)`).run(); } catch {}
try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(threadId)`).run(); } catch {}

/* ----------------- helpers ------------------ */
function newId(prefix = "m") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
}
function nowIso() { return new Date().toISOString(); }

/* Auto-purge: delete threads whose updatedAt older than ~5 months (≈150 days) */
function purgeOld() {
  try {
    const cutoff = Date.now() - 150 * 24 * 60 * 60 * 1000;
    const cutoffIso = new Date(cutoff).toISOString();
    // Delete orphan messages first
    const oldThreads = db.prepare(`SELECT id FROM threads WHERE updatedAt < ?`).all(cutoffIso);
    const ids = oldThreads.map(t => t.id);
    if (ids.length) {
      const placeholders = ids.map(_ => "?").join(",");
      db.prepare(`DELETE FROM messages WHERE threadId IN (${placeholders})`).run(...ids);
      db.prepare(`DELETE FROM threads WHERE id IN (${placeholders})`).run(...ids);
    }
  } catch (e) {
    console.error("purgeOld failed", e);
  }
}
// run at startup
purgeOld();

/* -------------- start a thread --------------
POST /api/messages/start
{
  studentUid, lecturerUid, subject, text, attachments: [{name,mime,dataUrl}]
}
----------------------------------------------*/
router.post("/start", (req, res) => {
  try {
    const { studentUid, lecturerUid, subject = "", text = "", attachments = [] } = req.body || {};
    if (!studentUid || !lecturerUid) return res.status(400).json({ ok:false, error:"studentUid & lecturerUid required" });
    const tid = newId("t");
    const mid = newId("msg");
    const createdAt = nowIso();

    db.prepare(`
      INSERT INTO threads (id, studentUid, lecturerUid, subject, createdAt, updatedAt)
      VALUES (@tid, @studentUid, @lecturerUid, @subject, @createdAt, @createdAt)
    `).run({ tid, studentUid, lecturerUid, subject, createdAt });

    db.prepare(`
      INSERT INTO messages (id, threadId, senderUid, senderRole, text, attachments, createdAt)
      VALUES (@mid, @threadId, @senderUid, @senderRole, @text, @attachments, @createdAt)
    `).run({
      mid,
      threadId: tid,
      senderUid: studentUid,
      senderRole: "student",
      text: text || "",
      attachments: JSON.stringify(Array.isArray(attachments) ? attachments : []),
      createdAt
    });

    return res.json({ ok:true, threadId: tid });
  } catch (e) {
    console.error("messages/start", e);
    return res.status(500).json({ ok:false, error:"server" });
  }
});

/* -------------- reply in a thread --------------
POST /api/messages/reply
{
  threadId, senderUid, senderRole, text, attachments:[]
}
-------------------------------------------------*/
router.post("/reply", (req, res) => {
  try {
    const { threadId, senderUid, senderRole, text = "", attachments = [] } = req.body || {};
    if (!threadId || !senderUid || !senderRole) {
      return res.status(400).json({ ok:false, error:"threadId, senderUid, senderRole required" });
    }
    const mid = newId("msg");
    const createdAt = nowIso();

    const t = db.prepare(`SELECT id FROM threads WHERE id = ?`).get(threadId);
    if (!t) return res.status(404).json({ ok:false, error:"thread_not_found" });

    db.prepare(`
      INSERT INTO messages (id, threadId, senderUid, senderRole, text, attachments, createdAt)
      VALUES (@mid, @threadId, @senderUid, @senderRole, @text, @attachments, @createdAt)
    `).run({
      mid,
      threadId,
      senderUid: String(senderUid),
      senderRole: (senderRole || "").toLowerCase(),
      text,
      attachments: JSON.stringify(Array.isArray(attachments) ? attachments : []),
      createdAt
    });

    db.prepare(`UPDATE threads SET updatedAt = @ts WHERE id = @id`).run({ ts: createdAt, id: threadId });

    return res.json({ ok:true, messageId: mid });
  } catch (e) {
    console.error("messages/reply", e);
    return res.status(500).json({ ok:false, error:"server" });
  }
});

/* -------------- list my threads --------------
GET /api/messages/threads?studentUid=... | lecturerUid=...
returns: [{ id, subject, studentUid, lecturerUid, createdAt, updatedAt, lastMessageText }]
-----------------------------------------------*/
router.get("/threads", (req, res) => {
  try {
    const { studentUid, lecturerUid } = req.query || {};
    if (!studentUid && !lecturerUid) return res.status(400).json({ ok:false, error:"studentUid or lecturerUid required" });

    let rows = [];
    if (studentUid) {
      rows = db.prepare(`SELECT * FROM threads WHERE studentUid = ? ORDER BY updatedAt DESC LIMIT 1000`).all(String(studentUid));
    } else {
      rows = db.prepare(`SELECT * FROM threads WHERE lecturerUid = ? ORDER BY updatedAt DESC LIMIT 1000`).all(String(lecturerUid));
    }

    const out = rows.map(t => {
      const last = db.prepare(`SELECT text FROM messages WHERE threadId = ? ORDER BY createdAt DESC LIMIT 1`).get(t.id);
      return { ...t, lastMessageText: last?.text || "" };
    });

    return res.json({ ok:true, threads: out });
  } catch (e) {
    console.error("messages/threads", e);
    return res.status(500).json({ ok:false, error:"server" });
  }
});

/* -------------- get a thread --------------
GET /api/messages/thread/:id
returns: { thread, messages: [{ id, senderUid, senderRole, text, attachments[], createdAt }] }
---------------------------------------------*/
router.get("/thread/:id", (req, res) => {
  try {
    const id = req.params.id;
    const thread = db.prepare(`SELECT * FROM threads WHERE id = ?`).get(id);
    if (!thread) return res.status(404).json({ ok:false, error:"not_found" });
    const msgs = db.prepare(`SELECT id, threadId, senderUid, senderRole, text, attachments, createdAt
                             FROM messages WHERE threadId = ? ORDER BY createdAt ASC`).all(id)
      .map(m => ({
        ...m,
        attachments: m.attachments ? JSON.parse(m.attachments) : []
      }));
    return res.json({ ok:true, thread, messages: msgs });
  } catch (e) {
    console.error("messages/thread", e);
    return res.status(500).json({ ok:false, error:"server" });
  }
});

export default router;