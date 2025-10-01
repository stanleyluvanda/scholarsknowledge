// src/pages/ScholarshipDetail.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Footer from "../components/Footer";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE ||
  "http://localhost:5000";

/* Small helper: render server-provided HTML with safe defaults.
   NOTE: If you later allow untrusted HTML, add DOMPurify sanitize here. */
function RichHtml({ html }) {
  if (!html) return null;
  return (
    <div
      className="rich-html prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default function ScholarshipDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/scholarships/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (alive) setItem(data);
      } catch (e) {
        if (alive) setErr(`Failed to load: ${e.message}`);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  if (err) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <p className="text-red-600">{err}</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-slate-600">
        Loading…
      </div>
    );
  }

  const {
    title,
    provider,
    country,
    level,
    field,
    fundingType,
    deadline,
    link,
    partnerApplyUrl,
    amount,
    description,
    eligibility,
    benefits,
    howToApply,
    imageUrl,
    imageData,
  } = item;

  const bannerSrc = imageUrl || imageData || "";

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col">
      {/* Force bullet styles regardless of global CSS resets */}
      <style>{`
        .rich-html ul { list-style: disc; padding-left: 1.25rem; margin: 0.5rem 0 0.75rem; }
        .rich-html ol { list-style: decimal; padding-left: 1.25rem; margin: 0.5rem 0 0.75rem; }
        .rich-html li { display: list-item; margin: 0.25rem 0; }
        .rich-html p { margin: 0.5rem 0; }
        .rich-html a { text-decoration: underline; }
      `}</style>

      {/* Main content */}
      <div className="flex-1">
        {/* Top breadcrumb / back */}
        <div className="max-w-5xl mx-auto px-4 pt-8">
          <Link to="/scholarship" className="text-blue-600 hover:underline text-sm">
            ← Back to Scholarships
          </Link>
        </div>

        {/* Header Card */}
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="mt-1 text-slate-600">
              <span className="font-medium">{provider}</span>
              {country ? ` • ${country}` : ""}
              {level ? ` • ${level}` : ""}
              {field ? ` • ${field}` : ""}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              {Array.isArray(fundingType) && fundingType.length > 0 && (
                <span className="inline-flex items-center gap-2">
                  <span className="text-slate-500">Funding:</span>
                  <span className="inline-flex flex-wrap gap-1">
                    {fundingType.map((f) => (
                      <span
                        key={f}
                        className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5"
                      >
                        {f}
                      </span>
                    ))}
                  </span>
                </span>
              )}
              {amount && (
                <span className="inline-flex items-center gap-2">
                  <span className="text-slate-500">Amount:</span>
                  <span className="font-medium">{amount}</span>
                </span>
              )}
              {deadline && (
                <span className="inline-flex items-center gap-2">
                  <span className="text-slate-500">Deadline:</span>
                  <span className="font-medium">{deadline}</span>
                </span>
              )}
            </div>

            <div className="mt-4 flex gap-3">
              {partnerApplyUrl && (
                <a
                  href={partnerApplyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700"
                >
                  Apply Now
                </a>
              )}
              {link && (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                  Provider Page
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Body sections */}
        <div className="max-w-5xl mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main */}
            <div className="lg:col-span-2 space-y-6">
              {description && (
                <section className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
                  <h2 className="text-lg font-semibold">Scholarship Description</h2>
                  <div className="mt-3">
                    <RichHtml html={description} />
                  </div>
                </section>
              )}

              {eligibility && (
                <section className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
                  <h2 className="text-lg font-semibold">Eligibility</h2>
                  <div className="mt-3">
                    <RichHtml html={eligibility} />
                  </div>
                </section>
              )}

              {benefits && (
                <section className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
                  <h2 className="text-lg font-semibold">Benefits</h2>
                  <div className="mt-3">
                    <RichHtml html={benefits} />
                  </div>
                </section>
              )}

              {/* Ad slot (hidden until you add AdSense) */}
              {false && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-4 text-center text-slate-500">
                  <div className="mx-auto max-w-full" style={{ minHeight: "120px" }}>
                    Ad Space (95px tall)
                  </div>
                </div>
              )}

              {howToApply && (
                <section className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
                  <h2 className="text-lg font-semibold">How to Apply</h2>
                  <div className="mt-3">
                    <RichHtml html={howToApply} />
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Banner / Logo above the “At a glance” card */}
              {bannerSrc && (
                <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
                  <img
                    src={bannerSrc}
                    alt={`${provider || title} banner`}
                    className="w-full h-40 object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-700">At a glance</h3>
                <dl className="mt-3 text-sm text-slate-700">
                  <dt className="font-medium">Provider</dt>
                  <dd className="mb-3">{provider || "-"}</dd>

                  <dt className="font-medium">Country</dt>
                  <dd className="mb-3">{country || "-"}</dd>

                  <dt className="font-medium">Level</dt>
                  <dd className="mb-3">{level || "-"}</dd>

                  <dt className="font-medium">Field</dt>
                  <dd className="mb-3">{field || "-"}</dd>

                  <dt className="font-medium">Deadline</dt>
                  <dd className="mb-3">{deadline || "-"}</dd>

                  {amount && (
                    <>
                      <dt className="font-medium">Max Amount</dt>
                      <dd className="mb-3">{amount}</dd>
                    </>
                  )}
                </dl>
                {partnerApplyUrl && (
                  <a
                    href={partnerApplyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block rounded bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700"
                  >
                    Apply Now
                  </a>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}