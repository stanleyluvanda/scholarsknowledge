const API_RAW = import.meta.env.VITE_API_URL || "http://localhost:5001";
const API = API_RAW.replace(/\/$/, "");

async function safeJson(res) {
  try { return await res.json(); } catch { return { ok:false, error:"bad_json" }; }
}

export async function sendContactMessage(payload) {
  const res = await fetch(`${API}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return safeJson(res);
}

export async function listInbox(lecturerUid) {
  const res = await fetch(`${API}/api/contact?lecturerUid=${encodeURIComponent(lecturerUid)}`);
  return safeJson(res);
}

export async function listSent(studentUid) {
  const res = await fetch(`${API}/api/contact/sent?studentUid=${encodeURIComponent(studentUid)}`);
  return safeJson(res);
}

export async function markRead(messageId) {
  const res = await fetch(`${API}/api/contact/${messageId}/read`, { method: "PATCH" });
  return safeJson(res);
}

export async function removeMessage(messageId) {
  const res = await fetch(`${API}/api/contact/${messageId}`, { method: "DELETE" });
  return safeJson(res);
}