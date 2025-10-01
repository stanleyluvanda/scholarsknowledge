import { useEffect, useState } from "react";
import { listSent, removeMessage } from "../../lib/contactApi";

function getMe() {
  try {
    const raw = localStorage.getItem("currentUser");
    const u = raw ? JSON.parse(raw) : null;
    if (!u) return null;
    if (!u.uid) u.uid = u.id || u.userId || u.email || "";
    return u;
  } catch { return null; }
}

export default function StudentSent() {
  const me = getMe();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  async function refresh() {
    if (!me?.uid) return;
    setLoading(true);
    try {
      const r = await listSent(String(me.uid));
      if (r?.ok) setRows(r.messages || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [me?.uid]);

  async function onDelete(id) {
    if (!confirm("Delete this message from your sent list?")) return;
    await removeMessage(id);
    await refresh();
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="font-semibold text-lg">My Sent Messages</div>
        <button className="text-sm rounded border px-3 py-1 hover:bg-slate-50" onClick={refresh}>
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="p-6 text-sm text-slate-500">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="p-6 text-sm text-slate-500">No messages sent yet.</div>
      ) : (
        <ul className="divide-y">
          {rows.map((m) => (
            <li key={m.id} className="p-3">
              <div className="flex items-center gap-2">
                {/* read badge (as known by lecturer) */}
                <span className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full text-white text-xs px-1 ${
                  m.isRead ? "bg-slate-400" : "bg-blue-600"
                }`}>
                  {m.isRead ? "Read" : "Sent"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="truncate font-medium">
                      {m.subject || "(No subject)"} —{" "}
                      <span className="text-slate-500">
                        {(m.lecturerTitle ? `${m.lecturerTitle}. ` : "") + (m.lecturerName || "Lecturer")}
                      </span>
                    </div>
                    <div className="shrink-0 text-xs text-slate-500">
                      {new Date(m.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="truncate text-sm text-slate-600">
                    {(m.body || "").split("\n")[0]}
                  </div>
                </div>
                <button
                  className="text-sm rounded px-2 py-1 hover:bg-slate-100"
                  onClick={() => setOpenId(openId === m.id ? null : m.id)}
                >
                  {openId === m.id ? "Hide" : "Open"}
                </button>
                <button
                  className="text-sm text-red-600 rounded px-2 py-1 hover:bg-red-50"
                  onClick={() => onDelete(m.id)}
                >
                  Delete
                </button>
              </div>

              {openId === m.id && (
                <div className="mt-3 rounded bg-slate-50 p-3">
                  <div className="text-sm mb-2">
                    <span className="font-medium">To:</span>{" "}
                    {(m.lecturerTitle ? `${m.lecturerTitle}. ` : "") + (m.lecturerName || "Lecturer")}
                    {m.lecturerFaculty ? <span className="text-slate-600"> • {m.lecturerFaculty}</span> : null}
                  </div>
                  <div className="whitespace-pre-wrap text-sm">{m.body || ""}</div>

                  {m.attachmentData && (
                    <div className="mt-3">
                      <div className="text-sm font-medium mb-1">Attachment</div>
                      {String(m.attachmentMime || "").startsWith("image/") ? (
                        <img
                          alt={m.attachmentName || "attachment"}
                          src={m.attachmentData}
                          className="max-h-64 rounded border"
                          onClick={() => window.open(m.attachmentData, "_blank")}
                        />
                      ) : (
                        <a
                          href={m.attachmentData}
                          download={m.attachmentName || "attachment"}
                          className="underline text-blue-600"
                        >
                          Download {m.attachmentName || "attachment"}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}