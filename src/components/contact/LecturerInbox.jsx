// src/components/contact/LecturerInbox.jsx
import { useEffect, useRef, useState } from "react";
import { listThreadsByLecturer, getThread, replyThread } from "../../lib/messagesApi";

function safeParse(j){ try { return JSON.parse(j||""); } catch { return null; } }
function getMe() {
  const s = safeParse(sessionStorage.getItem("currentUser")) || {};
  const l = safeParse(localStorage.getItem("currentUser")) || {};
  const u = Object.keys(s).length ? s : l;
  if (!u.uid) u.uid = u.id || u.userId || u.email || "";
  if (!u.role) u.role = "lecturer";
  return u;
}
function Avatar({ url, name, size=32 }) {
  const src = url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name||"U")}`;
  return <img src={src} alt={name||"User"} className="rounded-full object-cover" style={{ width:size, height:size }} />;
}
async function readAsDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file);
  });
}

export default function LecturerInbox() {
  const me = getMe();
  const [threads, setThreads] = useState([]);
  const [active, setActive] = useState(null); // {thread, messages:[]}
  const [reply, setReply] = useState("");
  const [att, setAtt] = useState([]);
  const replyRef = useRef(null);

  useEffect(() => {
    if (!me.uid) return;
    listThreadsByLecturer(me.uid).then((r) => {
      if (r?.ok) setThreads(r.threads || []);
    }).catch(console.error);
  }, [me.uid]);

  async function openThread(id) {
    const r = await getThread(id);
    if (r?.ok) {
      setActive({ thread:r.thread, messages:r.messages });
      setReply(""); setAtt([]);
      setTimeout(()=> replyRef.current?.focus(), 100);
    }
  }

  async function sendReply(e) {
    e.preventDefault();
    if (!active?.thread?.id) return;
    if (!reply.trim() && att.length === 0) return;

    const rr = await replyThread({
      threadId: active.thread.id,
      senderUid: String(me.uid),
      senderRole: "lecturer",
      text: reply.trim(),
      attachments: att
    });
    if (rr?.ok) {
      const again = await getThread(active.thread.id);
      if (again?.ok) setActive({ thread: again.thread, messages: again.messages });
      setReply(""); setAtt([]);
      replyRef.current?.focus();
    }
  }

  function onPick(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    Promise.all(files.map(async f => ({
      name: f.name, mime: f.type || "application/octet-stream", dataUrl: await readAsDataURL(f)
    }))).then(arr => setAtt(a => [...a, ...arr]));
  }

  return (
    <div className="border border-slate-200 bg-white rounded-2xl overflow-hidden">
      <div className="bg-indigo-50 px-3 py-2 font-semibold text-slate-800 text-center">Inbox</div>

      {/* Threads list */}
      {(!active) && (
        <div className="p-0">
          {threads.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">No messages yet.</div>
          ) : (
            <ul className="divide-y">
              {threads.map(t => (
                <li key={t.id}>
                  <button
                    onClick={() => openThread(t.id)}
                    className="w-full text-left px-3 py-3 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      {/* Replace "From" with STUDENT avatar */}
                      <Avatar url={""} name={"Student"} size={28} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-sm">{t.subject || "No subject"}</div>
                        <div className="truncate text-xs text-slate-500">{t.lastMessageText || ""}</div>
                      </div>
                      <div className="text-xs text-slate-500">{new Date(t.updatedAt).toLocaleString()}</div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Thread view */}
      {active && (
        <div className="flex flex-col">
          <div className="px-3 py-2 border-b flex items-center justify-between">
            <div className="font-semibold">{active.thread.subject || "Conversation"}</div>
            <button className="text-sm rounded border border-slate-200 px-2 py-1 hover:bg-slate-50" onClick={()=>setActive(null)}>
              Back
            </button>
          </div>

          <div className="p-3 space-y-3 max-h-[55vh] overflow-auto">
            {active.messages.map(m => {
              const whoName = m.senderRole === "student" ? "Student" : "Me";
              const whoPhoto = ""; // you can store/look up avatars by uid if desired
              return (
                <div key={m.id} className="flex items-start gap-2">
                  {/* Always left-side avatars */}
                  <Avatar url={whoPhoto} name={whoName} size={28} />
                  <div className="max-w-[85%]">
                    <div className="text-xs text-slate-500">{new Date(m.createdAt).toLocaleString()}</div>
                    {m.text && (
                      <div className="mt-1 bg-slate-100 text-slate-900 rounded-2xl px-3 py-2 whitespace-pre-wrap break-words">
                        {m.text}
                      </div>
                    )}
                    {Array.isArray(m.attachments) && m.attachments.length > 0 && (
                      <ul className="mt-1 text-xs space-y-1">
                        {m.attachments.map((a, i) => (
                          <li key={i} className="flex items-center gap-2">
                            📎 <a href={a.dataUrl} download={a.name} target="_blank" rel="noopener noreferrer" className="underline">{a.name}</a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reply */}
          <form onSubmit={sendReply} className="border-t p-3">
            <div className="flex items-start gap-2">
              <textarea
                ref={replyRef}
                value={reply}
                onChange={(e)=>setReply(e.target.value)}
                placeholder="Write a reply…"
                className="flex-1 min-h-[70px] max-h-[40vh] overflow-auto border border-slate-200 rounded px-3 py-2"
              />
              <div className="flex flex-col gap-2">
                <label className="text-xs px-2 py-1 border border-slate-200 rounded cursor-pointer text-center">
                  📎
                  <input type="file" multiple className="hidden" onChange={onPick}/>
                </label>
                <button className="rounded bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700">
                  Send
                </button>
              </div>
            </div>
            {(att.length>0) && (
              <ul className="mt-2 text-sm text-slate-700 space-y-1">
                {att.map((a, i) => (
                  <li key={i} className="flex items-center gap-2">
                    📎 <span className="truncate">{a.name}</span>
                    <button type="button" className="text-xs underline"
                      onClick={() => setAtt(prev => prev.filter((_, idx) => idx !== i))}
                    >remove</button>
                  </li>
                ))}
              </ul>
            )}
          </form>
        </div>
      )}
    </div>
  );
}