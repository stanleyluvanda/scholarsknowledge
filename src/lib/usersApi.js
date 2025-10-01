// src/lib/usersApi.js
const API_RAW = import.meta.env.VITE_API_URL || "http://localhost:5001";
const API = API_RAW.replace(/\/$/, ""); // strip trailing slash

/* ---------------- helpers ---------------- */
function normalizeUser(u = {}) {
  return {
    uid: u.uid || u.id || u.userId || u.email || "",
    role: (u.role || "").toLowerCase() || "student",
    name: u.name || u.displayName || "",
    email: u.email || u.username || "",
    university: u.university || "",
    faculty: u.faculty || "",
    title: u.title || "",
    photoURL: u.photoURL || u.photoUrl || "",
  };
}
async function safeJson(res) {
  try { return await res.json(); } catch { return { ok: false, error: "bad_json" }; }
}
function withTimeout(promise, ms = 10000) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
  ]);
}

/* --------------- API calls --------------- */

/** Upsert a user (also carries a presence ping via updatedAt on the server side). */
export async function upsertUser(user) {
  const payload = normalizeUser(user);
  if (!payload.uid) return { ok: false, error: "no_uid" };

  try {
    const res = await withTimeout(
      fetch(`${API}/api/users/upsert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
      12000
    );
    if (!res.ok) {
      const j = await safeJson(res);
      return { ok: false, status: res.status, ...j };
    }
    return await safeJson(res);
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
}

/** Get all lecturers for a university+faculty (used to populate ChatDock People). */
export async function getLecturers(university, faculty) {
  const u = encodeURIComponent(university || "");
  const f = encodeURIComponent(faculty || "");
  const url = `${API}/api/users?university=${u}&faculty=${f}`;

  try {
    const res = await withTimeout(fetch(url), 12000);
    if (!res.ok) {
      const j = await safeJson(res);
      return { ok: false, status: res.status, ...j };
    }
    const data = await safeJson(res);
    // normalize a bit for UI consistency
    if (data?.lecturers?.length) {
      data.lecturers = data.lecturers.map((p) => ({
        ...p,
        uid: p.uid || p.id || p.email,
        name: p.name || p.displayName || "",
        title: p.title || "",
        photoURL: p.photoURL || p.photoUrl || "",
      }));
    }
    return data;
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
}

/* --------- new: helpers to resolve users for Recents --------- */

/** Fetch a single user by uid. Returns { ok, user } */
export async function getUser(uid) {
  if (!uid) return { ok: false, error: "no_uid" };
  try {
    const res = await withTimeout(fetch(`${API}/api/users/${encodeURIComponent(uid)}`), 12000);
    if (!res.ok) {
      const j = await safeJson(res);
      return { ok: false, status: res.status, ...j };
    }
    const data = await safeJson(res);
    if (data?.user) {
      // normalize minimal shape used by UI
      data.user = {
        uid: data.user.uid || uid,
        name: data.user.name || "",
        title: data.user.title || "",
        email: data.user.email || "",
        photoURL: data.user.photoURL || "",
        university: data.user.university || "",
        faculty: data.user.faculty || "",
      };
    }
    return data;
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
}

/**
 * Batch fetch users by ids. Returns a map: { [uid]: user }
 * Missing/failed lookups are simply omitted from the map.
 */
export async function getUsersByIds(uids = []) {
  const unique = Array.from(new Set((uids || []).filter(Boolean)));
  if (!unique.length) return {};

  const results = await Promise.all(
    unique.map((id) =>
      getUser(id).catch(() => ({ ok: false }))
    )
  );

  const map = {};
  unique.forEach((id, i) => {
    const r = results[i];
    if (r?.ok && r.user) map[id] = r.user;
  });
  return map;
}

/* ------------- optional presence ------------- */
/**
 * Start a lightweight presence heartbeat.
 * Calls upsertUser(user) every `intervalMs` to refresh updatedAt
 * so the “online” dot stays green while the user is active.
 *
 * Call this once after login on dashboards; it returns a stop() function.
 */
export function startPresenceHeartbeat(user, intervalMs = 60_000) {
  const payload = normalizeUser(user);
  if (!payload.uid) return () => {};

  let stopped = false;

  // immediate ping
  upsertUser(payload).catch(() => {});

  const id = setInterval(() => {
    if (stopped) return;
    upsertUser(payload).catch(() => {});
  }, Math.max(30_000, intervalMs)); // minimum 30s

  return () => {
    stopped = true;
    clearInterval(id);
  };
}