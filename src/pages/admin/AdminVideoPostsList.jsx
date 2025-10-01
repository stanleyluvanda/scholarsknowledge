// src/pages/admin/AdminVideoPostsList.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import YouTubeEmbed from "../../components/YouTubeEmbed";

function safeParse(json) { try { return JSON.parse(json || ""); } catch { return null; } }

export default function AdminVideoPostsList() {
  const navigate = useNavigate();
  const [items, setItems] = useState(() => {
    const arr = safeParse(localStorage.getItem("videoPosts")) || [];
    return Array.isArray(arr) ? arr : [];
  });
  const [previewId, setPreviewId] = useState(null);

  // gate
  useEffect(() => {
    const isAuthed = !!localStorage.getItem("adminAuth");
    if (!isAuthed) navigate("/admin/login", { replace: true });
  }, [navigate]);

  // sync across tabs/creates/deletes
  useEffect(() => {
    const sync = () => {
      const arr = safeParse(localStorage.getItem("videoPosts")) || [];
      setItems(Array.isArray(arr) ? arr : []);
    };
    const onStorage = (e) => { if (!e || e.key === "videoPosts") sync(); };
    const onUpdated = () => sync();
    window.addEventListener("storage", onStorage);
    window.addEventListener("videoPosts:updated", onUpdated);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("videoPosts:updated", onUpdated);
    };
  }, []);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [items]);

  const remove = (id) => {
    if (!confirm("Delete this video post?")) return;
    const next = items.filter(p => p.id !== id);
    localStorage.setItem("videoPosts", JSON.stringify(next));
    setItems(next);
    window.dispatchEvent(new Event("videoPosts:updated"));
  };

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); alert("Copied!"); }
    catch { alert(text); } // fallback: show text to copy
  };

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Video Posts</h1>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/posts/video-new"
            className="rounded-full bg-slate-900 text-white px-4 py-2 text-sm font-semibold hover:opacity-90"
          >
            + New Video Post
          </Link>
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="text-sm text-slate-600 hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-600">
          No videos yet. Click “New Video Post” to add one.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">YouTube ID</th>
                <th className="px-4 py-3 text-left">Audience</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(p => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{p.title || <span className="text-slate-500 italic">(untitled)</span>}</td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">{p.videoUrlOrId}</code>
                  </td>
                  <td className="px-4 py-3 capitalize">{p.audience}</td>
                  <td className="px-4 py-3">{new Date(p.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded border border-slate-200 px-2 py-1 hover:bg-slate-50"
                        onClick={() => setPreviewId(previewId === p.id ? null : p.id)}
                      >
                        {previewId === p.id ? "Hide" : "Preview"}
                      </button>
                      <button
                        className="rounded border border-slate-200 px-2 py-1 hover:bg-slate-50"
                        onClick={() => copy(p.videoUrlOrId)}
                        title="Copy ID"
                      >
                        Copy ID
                      </button>
                      <button
                        className="rounded border border-slate-200 px-2 py-1 hover:bg-slate-50"
                        onClick={() => copy(`https://youtu.be/${p.videoUrlOrId}`)}
                        title="Copy share link"
                      >
                        Copy Link
                      </button>
                      {/* If you add edit later, navigate with ?id=... and update the form to support editing */}
                      {/* <button className="rounded border border-slate-200 px-2 py-1 hover:bg-slate-50" onClick={() => navigate(`/admin/posts/video-new?id=${p.id}`)}>Edit</button> */}
                      <button
                        className="rounded border border-red-200 text-red-700 px-2 py-1 hover:bg-red-50"
                        onClick={() => remove(p.id)}
                      >
                        Delete
                      </button>
                    </div>
                    {previewId === p.id && (
                      <div className="mt-3">
                        <div className="aspect-video w-full max-w-xl overflow-hidden rounded-lg border border-slate-100">
                          <YouTubeEmbed idOrUrl={p.videoUrlOrId} title={p.title || "Video Preview"} />
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}