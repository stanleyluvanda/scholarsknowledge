// src/pages/PartnerSignUp.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

/* Helpers */
function safeParse(json) { try { return JSON.parse(json || ""); } catch { return null; } }
async function sha256Hex(str) {
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}
function isEmail(x = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x);
}
function pwStrengthLabel(pw = "") {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return { label: "Weak", bar: 2 };
  if (score === 3) return { label: "Fair", bar: 3 };
  if (score === 4) return { label: "Good", bar: 4 };
  return { label: "Strong", bar: 5 };
}

export default function PartnerSignUp() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    orgName: "",
    contactName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const validate = () => {
    if (!form.orgName.trim() || !form.contactName.trim() || !form.email.trim() || !form.password || !form.confirmPassword) {
      return "Please complete all required fields.";
    }
    if (!isEmail(form.email.trim())) {
      return "Please enter a valid email address.";
    }
    if (form.password.length < 6) {
      return "Password must be at least 6 characters.";
    }
    if (form.password !== form.confirmPassword) {
      return "Passwords do not match.";
    }
    if (!form.agree) {
      return "Please agree to the partnership terms.";
    }
    return "";
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    const v = validate();
    if (v) { setErr(v); return; }

    setSubmitting(true);
    try {
      const partners = safeParse(localStorage.getItem("partners")) || [];
      if (partners.find((p) => (p.email || "").toLowerCase() === form.email.toLowerCase())) {
        setErr("An account with this email already exists. Please log in.");
        setSubmitting(false);
        return;
      }

      const user = {
        id: "p_" + Date.now(),
        orgName: form.orgName.trim(),
        contactName: form.contactName.trim(),
        email: form.email.trim(),
        passwordHash: await sha256Hex(form.password),
      };

      localStorage.setItem("partners", JSON.stringify([user, ...partners]));
      localStorage.setItem("partnerAuth", JSON.stringify(user));

      nav("/partner/welcome", { replace: true });
    } catch (e) {
      console.error(e);
      setErr("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  const strength = pwStrengthLabel(form.password);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#f0f6ff] via-white to-[#eef2ff]">
      <main className="flex-1">
        <section className="max-w-xl mx-auto px-4 py-12">
          <div className="text-center">
            <img
              src="/images/1754280544595.jpeg"
              alt="ScholarsKnowledge Logo"
              className="mx-auto h-14 w-14 rounded-full object-cover"
            />
            <h1 className="mt-3 text-3xl md:text-4xl font-bold text-slate-900">
              Partner Sign Up
            </h1>
            <p className="mt-1 text-slate-600">
              Create an account to list scholarships on ScholarsKnowledge.
            </p>
          </div>

          <form
            onSubmit={submit}
            className="mt-6 bg-white/70 rounded-2xl p-6 border space-y-5"
          >
            {err && (
              <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700">
                {err}
              </div>
            )}

            <label className="block">
              <span className="block text-sm text-slate-600 mb-1">Organization / University *</span>
              <input
                name="orgName"
                value={form.orgName}
                onChange={onChange}
                className="w-full border rounded px-3 py-2"
                placeholder="e.g., University of Example"
              />
            </label>

            <label className="block">
              <span className="block text-sm text-slate-600 mb-1">Contact Person *</span>
              <input
                name="contactName"
                value={form.contactName}
                onChange={onChange}
                className="w-full border rounded px-3 py-2"
                placeholder="Full name"
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-sm text-slate-600 mb-1">Email *</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="you@org.edu"
                />
              </label>

              <label className="block">
                <span className="block text-sm text-slate-600 mb-1">Password *</span>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={onChange}
                    className="w-full border rounded px-3 py-2 pr-20"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(s => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-slate-600 hover:text-slate-800"
                  >
                    {showPw ? "Hide" : "Show"}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded ${i < strength.bar ? "bg-green-500" : "bg-slate-200"}`}
                        />
                      ))}
                    </div>
                    <div className="mt-1 text-xs text-slate-600">Strength: {strength.label}</div>
                  </div>
                )}
              </label>
            </div>

            <label className="block">
              <span className="block text-sm text-slate-600 mb-1">Confirm Password *</span>
              <div className="relative">
                <input
                  type={showPw2 ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={onChange}
                  className="w-full border rounded px-3 py-2 pr-20"
                  placeholder="Re-enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw2(s => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-slate-600 hover:text-slate-800"
                >
                  {showPw2 ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                name="agree"
                checked={form.agree}
                onChange={onChange}
                className="mt-1"
              />
              <span className="text-sm text-slate-700">
                I agree to the partnership requirements: no essays, no application fees,
                and no collection of confidential personal data (e.g., bank details, SSN).
              </span>
            </label>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                disabled={submitting}
                className={`rounded px-4 py-2 text-sm font-semibold text-white ${submitting ? "bg-blue-400 cursor-not-allowed" : "bg-[#1a73e8] hover:opacity-90"}`}
              >
                {submitting ? "Creating..." : "Create Account"}
              </button>
              <span className="text-sm text-slate-600">
                Already have an account?{" "}
                <Link to="/partner/login" className="text-[#1a73e8] underline">
                  Log in
                </Link>
              </span>
            </div>
          </form>
        </section>
      </main>

      <footer className="bg-blue-900 text-white py-6 text-center text-sm">
        © {new Date().getFullYear()} ScholarsKnowledge · <a href="/login" className="underline">Contact Sales</a>
      </footer>
    </div>
  );
}