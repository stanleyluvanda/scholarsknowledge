import { useEffect, useMemo, useState, useRef } from "react";
import { getLecturers } from "../../lib/usersApi";
import { sendContactMessage } from "../../lib/contactApi";

function getMe() {
  try {
    const raw = localStorage.getItem("currentUser");
    const u = raw ? JSON.parse(raw) : null;
    if (!u) return null;
    if (!u.uid) u.uid = u.id || u.userId || u.email || "";
    return u;
  } catch { return null; }
}

export default function StudentContactPanel() {
  const me = getMe();
  const [lecturers, setLecturers] = useState([]);
  const [search, setSearch] = useState("");
  const [sel, setSel] = useState(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [att, setAtt] = useState(null); // {name, mime, data}
  const [sending, setSending] = useState(false);
  const fileRef = useRef(null);

  // load lecturers for my faculty
  useEffect(() => {
    if (!me?.university || !me?.faculty) return;
    getLecturers(me.university, me.faculty).then((r) => {
      if (r?.ok) setLecturers(r.lecturers || []);
    });
  }, [me?.university, me?.faculty]);

  const filtered = useMemo(() => {
    const q = (search || "").toLowerCase().trim();
    if (!q) return lecturers;
    return lecturers.filter((l) =>
      (l.name || "").toLowerCase().includes(q) ||
      (l.title || "").toLowerCase().includes(q)
    );
  }, [lecturers, search]);

  async function pickFile() {
    fileRef.current?.click();
  }
  async function onFile(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const data = await new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.onerror = rej;
      fr.readAsDataURL(f); // dataURL for simplicity
    });
    setAtt({ name: f.name, mime: f.type || "application/octet-stream", data });
  }

  async function send() {
    if (!me?.uid || !sel?.uid) return;
    if (!subject.trim() && !body.trim()) return;
    setSending(true);
    try {
      const payload = {
        studentUid: String(me.uid),
        studentName: me.name || "",
        studentProgram: me.program || me.selectedProgram || "", // optional field if you save it
        lecturerUid: String(sel.uid),
        lecturerName: sel.name || "",
        lecturerTitle: sel.title || "",
        lecturerFaculty: me.faculty || "",
        subject,
        body,
        attachment: att ? { name: att.name, mime: att.mime, data: att.data } : null
      };
      const r = await sendContactMessage(payload);
      if (r?.ok) {
        // clear form
        setSubject(""); setBody(""); setAtt(null);
        alert("Message sent to " + (sel.title ? `${sel.title}. ` : "") + (sel.name || "lecturer"));
      } else {
        alert("Failed to send.");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow p-4">
      <div className="font-semibold text-lg mb-2">Contact a Lecturer</div>

      {/* Lecturer picker */}
      <div className="mb-3">
        <div className="text-sm text-slate-600 mb-1">Choose Lecturer</div>
        <div className="flex items-center gap-2 mb-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter lecturers by name or title…"
            className="flex-1 rounded-lg border px-3 py-2 outline-none"
          />
        </div>
        <div className="max-h-48 overflow-auto rounded border">
          {filtered.length ? (
            <ul className="divide-y">
              {filtered.map((l) => (
                <li key={l.uid}>
                  <button
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 ${sel?.uid===l.uid?"bg-blue-50":""}`}
                    onClick={() => setSel(l)}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        className="h-8 w-8 rounded-full object-cover"
                        src={l.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(l.name || "U")}`}
                        alt={l.name || "Lecturer"}
                      />
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          {(l.title ? `${l.title}. ` : "") + (l.name || "Lecturer")}
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-3 text-sm text-slate-500">No lecturers found.</div>
          )}
        </div>
        {sel && (
          <div className="mt-2 text-sm text-slate-600">
            Selected: <span className="font-medium">{(sel.title ? `${sel.title}. ` : "") + (sel.name || "")}</span>
          </div>
        )}
      </div>

      {/* Message form */}
      <div className="grid gap-2">
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          className="rounded-lg border px-3 py-2 outline-none"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your message… (Shift+Enter for new line)"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); } }}
          className="min-h-[120px] rounded-lg border px-3 py-2 outline-none"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={pickFile}
            className="rounded px-3 py-2 border hover:bg-slate-50"
            type="button"
            title="Attach a file"
          >
            Attach
          </button>
          {att && (
            <>
              <span className="text-sm truncate max-w-[220px]">{att.name}</span>
              <button className="text-sm text-red-600" onClick={() => setAtt(null)} type="button">Remove</button>
            </>
          )}
          <input ref={fileRef} type="file" className="hidden" onChange={onFile} />
          <div className="flex-1" />
          <button
            onClick={send}
            disabled={!sel || (!subject.trim() && !body.trim()) || sending}
            className="rounded bg-blue-600 text-white px-4 py-2 disabled:opacity-50"
            type="button"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}