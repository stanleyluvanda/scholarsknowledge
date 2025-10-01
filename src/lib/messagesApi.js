//src/lib/messagesApi.js//

const API_RAW = import.meta.env.VITE_API_URL || "http://localhost:5001";
const API = API_RAW.replace(/\/$/, "");

async function jsonOrError(res) {
  try { return await res.json(); } catch { return { ok:false, error:"bad_json" }; }
}

export async function startThread({ studentUid, lecturerUid, subject, text, attachments=[] }) {
  const r = await fetch(`${API}/api/messages/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentUid, lecturerUid, subject, text, attachments })
  });
  return jsonOrError(r);
}

export async function replyThread({ threadId, senderUid, senderRole, text, attachments=[] }) {
  const r = await fetch(`${API}/api/messages/reply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ threadId, senderUid, senderRole, text, attachments })
  });
  return jsonOrError(r);
}

export async function listThreadsByStudent(studentUid) {
  const r = await fetch(`${API}/api/messages/threads?studentUid=${encodeURIComponent(studentUid)}`);
  return jsonOrError(r);
}

export async function listThreadsByLecturer(lecturerUid) {
  const r = await fetch(`${API}/api/messages/threads?lecturerUid=${encodeURIComponent(lecturerUid)}`);
  return jsonOrError(r);
}

export async function getThread(threadId) {
  const r = await fetch(`${API}/api/messages/thread/${encodeURIComponent(threadId)}`);
  return jsonOrError(r);
}