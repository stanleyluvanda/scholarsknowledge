// src/pages/Login.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";

/* ---------- Helpers ---------- */
function safeParse(json) { try { return JSON.parse(json || ""); } catch { return null; } }
async function sha256Hex(str) {
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}
function trySetItem(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function now() { return Date.now(); }

/* Store a short-lived reset token mapping -> { userId, expiresAt } */
function createResetToken(userId, ttlMinutes = 30) {
  const token = `${userId}-${Math.random().toString(36).slice(2)}-${Date.now()}`;
  const data = { userId, expiresAt: now() + ttlMinutes * 60_000 };
  localStorage.setItem(`pwreset:${token}`, JSON.stringify(data));
  return token;
}
function consumeResetToken(token) {
  const raw = localStorage.getItem(`pwreset:${token}`);
  if (!raw) return null;
  const obj = safeParse(raw);
  if (!obj || obj.expiresAt < now()) {
    localStorage.removeItem(`pwreset:${token}`);
    return null;
  }
  localStorage.removeItem(`pwreset:${token}`);
  return obj.userId;
}

/* Update password for a user across both "users" array and "usersById" map */
async function setUserPassword(userId, newPlainPassword) {
  const newHash = await sha256Hex(newPlainPassword);

  // users array
  const arr = safeParse(localStorage.getItem("users")) || [];
  const i = arr.findIndex(u => u.id === userId);
  if (i >= 0) {
    arr[i] = { ...arr[i], passwordHash: newHash, password: undefined };
    localStorage.setItem("users", JSON.stringify(arr));
  }

  // usersById map
  const map = safeParse(localStorage.getItem("usersById")) || {};
  if (map[userId]) {
    map[userId] = { ...map[userId], passwordHash: newHash, password: undefined };
    localStorage.setItem("usersById", JSON.stringify(map));
  }
}

/* ---------- Page ---------- */
export default function Login() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  const mode = (sp.get("mode") || "login").toLowerCase(); // 'login' | 'forgot' | 'reset'
  const initialRole = (sp.get("role") || "student").toLowerCase() === "lecturer" ? "lecturer" : "student";
  const [role, setRole] = useState(initialRole);

  useEffect(() => {
    const r = (sp.get("role") || "student").toLowerCase();
    setRole(r === "lecturer" ? "lecturer" : "student");
  }, [sp]);

  /* ====== LOGIN STATE ====== */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  /* ====== Turnstile ====== */
  const turnstileRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [turnToken, setTurnToken] = useState("");     // require a non-empty token
  const [turnReady, setTurnReady] = useState(false);  // optional UI state

  // replace with your real site key (already set correctly for you)
  const SITE_KEY = "0x4AAAAAAB2QBaumf-KRvBPY";


  // Backend API base for verification (use VITE_API_BASE if set)
  const API_BASE =
    (import.meta?.env?.VITE_API_BASE && String(import.meta.env.VITE_API_BASE).trim()) ||
    "http://localhost:5001";

  // Make a global callback (handy for debugging & consistency)
  if (typeof window !== "undefined" && !window.onTurnstileSuccess) {
    window.onTurnstileSuccess = (token) => {
      try {
        console.log("✅ Turnstile token:", token);
        sessionStorage.setItem("turnstileToken", token || "");
      } catch {}
    };
  }

  // Render Turnstile once the script is available
  useEffect(() => {
    let cancelled = false;

    function renderWidget() {
      if (cancelled) return;
      if (!turnstileRef.current) return;
      if (!window.turnstile || typeof window.turnstile.render !== "function") {
        // try again shortly
        setTimeout(renderWidget, 200);
        return;
      }

      // If a widget exists (hot reloads), remove then re-render
      if (widgetIdRef.current && window.turnstile.remove) {
        try { window.turnstile.remove(widgetIdRef.current); } catch {}
        widgetIdRef.current = null;
      }

      widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
        sitekey: SITE_KEY,
        theme: "light",
        action: "login",
        retry: "auto",
        "refresh-expired": "auto",
        callback: (token) => {
          setTurnToken(token || "");
          setTurnReady(!!token);
          setError(""); // clear previous “complete verification” error
          try { window.onTurnstileSuccess?.(token); } catch {}
        },
        "expired-callback": () => {
          setTurnToken("");
          setTurnReady(false);
        },
        "error-callback": () => {
          setTurnToken("");
          setTurnReady(false);
        }
      });
    }

    // Only render on the login view
    if (mode === "login") {
      renderWidget();
    }

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile?.remove) {
        try { window.turnstile.remove(widgetIdRef.current); } catch {}
      }
    };
  }, [SITE_KEY, mode]); // re-render if page mode changes

  // Optional: when role changes, reset the widget so each attempt solves afresh
  useEffect(() => {
    if (window.turnstile?.reset && widgetIdRef.current) {
      try { window.turnstile.reset(widgetIdRef.current); } catch {}
      setTurnToken("");
      setTurnReady(false);
    }
  }, [role]);

  /* ====== FORGOT STATE ====== */
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSentToken, setForgotSentToken] = useState("");
  const [forgotError, setForgotError] = useState("");

  /* ====== RESET STATE ====== */
  const token = sp.get("token") || "";
  const [newPass, setNewPass] = useState("");
  const [newPass2, setNewPass2] = useState("");
  const [resetMsg, setResetMsg] = useState("");

  /* ====== Handlers ====== */
  const onSubmitLogin = async (e) => {
    e.preventDefault();
    setError("");

    // 1) Require a Turnstile token
    const tsToken = sessionStorage.getItem("turnstileToken") || turnToken;
    if (!tsToken) {
      setError("Please complete the human verification.");
      return;
    }

    // 2) Verify the token with your Node endpoint BEFORE any password checks
    try {
      const ver = await fetch(`${API_BASE}/api/verify-turnstile`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: tsToken, action: "login" }),
      });
      const verRes = await ver.json().catch(() => ({}));
      if (!ver.ok || !verRes?.ok) {
        setError("Human verification failed. Please try again.");
        // reset the widget for another attempt
        try {
          if (window.turnstile?.reset && widgetIdRef.current) {
            window.turnstile.reset(widgetIdRef.current);
          }
        } catch {}
        setTurnToken("");
        setTurnReady(false);
        return;
      }
    } catch (err) {
      console.error("[turnstile] verify error:", err);
      setError("Cannot reach verification service. Please try again.");
      return;
    }

    // 3) Basic form checks
    const em = email.trim().toLowerCase();
    if (!em || !password) {
      setError("Please enter email and password.");
      return;
    }

    // 4) Your existing local auth logic
    const users = safeParse(localStorage.getItem("users")) || [];
    const user = users.find(u =>
      (u?.role || "student") === role &&
      (u?.email || "").toLowerCase() === em
    );

    if (!user) { setError(`No ${role} account found for that email.`); return; }

    let ok = true;
    if (user.passwordHash) {
      const entered = await sha256Hex(password);
      ok = entered === user.passwordHash;
    } else if (user.password) {
      ok = password === user.password;
    }
    if (!ok) { setError("Incorrect password."); return; }

    // 5) Mark ACTIVE
    sessionStorage.setItem("currentUser", JSON.stringify(user));
    for (const k of ["authUserId","activeUserId","currentUserId","loggedInUserId"]) {
      sessionStorage.setItem(k, user.id);
      trySetItem(k, user.id);
    }
    trySetItem("currentUser", JSON.stringify(user));

    // Inform navbar in this tab
    window.dispatchEvent(new Event("auth:changed"));

    navigate(role === "lecturer" ? "/lecturer-dashboard" : "/student-dashboard");
  };

  const onSubmitForgot = (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotSentToken("");

    const em = forgotEmail.trim().toLowerCase();
    if (!em) { setForgotError("Please enter your registered email."); return; }

    const users = safeParse(localStorage.getItem("users")) || [];
    const found = users.find(u => (u?.email || "").toLowerCase() === em);
    if (!found) {
      setForgotSentToken("dummy");
      return;
    }

    const tok = createResetToken(found.id, 30);
    setForgotSentToken(tok);
  };

  const onSubmitReset = async (e) => {
    e.preventDefault();
    setResetMsg("");

    if (!newPass || newPass.length < 6) {
      setResetMsg("Password must be at least 6 characters.");
      return;
    }
    if (newPass !== newPass2) {
      setResetMsg("Passwords do not match.");
      return;
    }

    const userId = consumeResetToken(token);
    if (!userId) {
      setResetMsg("This reset link is invalid or expired. Please request a new one.");
      return;
    }

    await setUserPassword(userId, newPass);
    setResetMsg("Your password has been reset. You can now log in with your new password.");
    setTimeout(() => navigate("/login"), 1200);
  };

  /* ====== Views ====== */
  const RoleTabs = (
    <div className="mt-6 grid grid-cols-2 rounded-lg overflow-hidden border border-slate-200">
      <button
        onClick={() => setRole("student")}
        className={`py-2 font-medium ${role==="student" ? "bg-blue-600 text-white" : "bg-white text-slate-700"}`}
        type="button"
      >
        Student
      </button>
      <button
        onClick={() => setRole("lecturer")}
        className={`py-2 font-medium ${role==="lecturer" ? "bg-blue-600 text-white" : "bg-white text-slate-700"}`}
        type="button"
      >
        Lecturer
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#f0f6ff] via-white to-[#eef2ff]">
      <main className="flex-1">
        <section className="max-w-md mx-auto px-4 py-12">
          <div className="text-center">
            <img
              src="/images/1754280544595.jpeg"
              alt="ScholarsKnowledge Logo"
              className="mx-auto h-14 w-14 rounded-full object-cover"
            />
            <h1 className="mt-3 text-3xl md:text-4xl font-bold text-slate-900">
              {mode === "forgot" ? "Forgot Password" : mode === "reset" ? "Reset Password" : "Log in"}
            </h1>
          </div>

          {/* ====== LOGIN ====== */}
          {mode === "login" && (
            <>
              {RoleTabs}

              <form onSubmit={onSubmitLogin} className="mt-6 space-y-4 bg-white/70 rounded-2xl p-6 border">
                {error && (
                  <p className="text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2" role="alert">
                    {error}
                  </p>
                )}

                <label className="block">
                  <span className="block text-sm text-slate-600 mb-1">Email</span>
                  <input
                    type="email"
                    className="w-full border rounded px-3 py-2"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e=>setEmail(e.target.value)}
                  />
                </label>

                <label className="block">
                  <span className="block text-sm text-slate-600 mb-1">Password</span>
                  <input
                    type="password"
                    className="w-full border rounded px-3 py-2"
                    placeholder="Your password"
                    value={password}
                    onChange={e=>setPassword(e.target.value)}
                  />
                </label>

                {/* Cloudflare Turnstile widget container */}
                <div className="pt-1">
                  <div ref={turnstileRef} />
                  {!turnReady && (
                    <p className="mt-2 text-xs text-slate-500">
                      Human verification will appear here. If it doesn’t, refresh the page.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#1a73e8] text-white py-2 rounded font-semibold hover:opacity-90"
                >
                  Log in
                </button>

                <div className="text-sm text-slate-600 text-center">
                  Don’t have an account?{" "}
                  {role === "lecturer" ? (
                    <Link className="text-[#1a73e8] underline" to="/lecturer-sign-up">Create Lecturer account</Link>
                  ) : (
                    <Link className="text-[#1a73e8] underline" to="/student-sign-up">Create Student account</Link>
                  )}
                </div>

                <div className="text-center">
                  <Link className="inline-block mt-2 text-[#1a73e8] underline text-sm" to="/login?mode=forgot">
                    Forgot password?
                  </Link>
                </div>
              </form>
            </>
          )}

          {/* ====== FORGOT PASSWORD ====== */}
          {mode === "forgot" && (
            <form onSubmit={onSubmitForgot} className="mt-6 space-y-4 bg-white/70 rounded-2xl p-6 border">
              {forgotError && (
                <p className="text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2" role="alert">
                  {forgotError}
                </p>
              )}

              {!forgotSentToken ? (
                <>
                  <p className="text-sm text-slate-700">
                    Enter your registered email. We’ll send a password reset link.
                  </p>
                  <label className="block">
                    <span className="block text-sm text-slate-600 mb-1">Email</span>
                    <input
                      type="email"
                      className="w-full border rounded px-3 py-2"
                      placeholder="you@example.com"
                      value={forgotEmail}
                      onChange={e=>setForgotEmail(e.target.value)}
                    />
                  </label>
                  <button className="w-full bg-[#1a73e8] text-white py-2 rounded font-semibold hover:opacity-90">
                    Send reset link
                  </button>
                  <div className="text-center">
                    <Link className="inline-block mt-2 text-[#1a73e8] underline text-sm" to="/login">
                      Back to login
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-700">
                    If that email exists, we’ve sent a password reset link. (Dev mode: open it directly below.)
                  </p>
                  {forgotSentToken !== "dummy" && (
                    <div className="mt-3">
                      <Link
                        to={`/login?mode=reset&token=${encodeURIComponent(forgotSentToken)}`}
                        className="inline-block text-[#1a73e8] underline text-sm"
                      >
                        Open reset link
                      </Link>
                    </div>
                  )}
                  <div className="text-center">
                    <Link className="inline-block mt-4 text-[#1a73e8] underline text-sm" to="/login">
                      Back to login
                    </Link>
                  </div>
                </>
              )}
            </form>
          )}

          {/* ====== RESET PASSWORD ====== */}
          {mode === "reset" && (
            <form onSubmit={onSubmitReset} className="mt-6 space-y-4 bg-white/70 rounded-2xl p-6 border">
              {resetMsg && (
                <p className={`rounded px-3 py-2 ${resetMsg.includes("reset link is invalid") ? "text-red-600 bg-red-50 border border-red-200" : "text-green-700 bg-green-50 border border-green-200"}`}>
                  {resetMsg}
                </p>
              )}

              <p className="text-sm text-slate-700">
                Choose a new password for your account.
              </p>

              <label className="block">
                <span className="block text-sm text-slate-600 mb-1">New password</span>
                <input
                  type="password"
                  className="w-full border rounded px-3 py-2"
                  value={newPass}
                  onChange={e=>setNewPass(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </label>

              <label className="block">
                <span className="block text-sm text-slate-600 mb-1">Confirm new password</span>
                <input
                  type="password"
                  className="w-full border rounded px-3 py-2"
                  value={newPass2}
                  onChange={e=>setNewPass2(e.target.value)}
                  placeholder="Re-enter password"
                />
              </label>

              <button className="w-full bg-[#1a73e8] text-white py-2 rounded font-semibold hover:opacity-90">
                Set new password
              </button>

              <div className="text-center">
                <Link className="inline-block mt-2 text-[#1a73e8] underline text-sm" to="/login">
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </section>
      </main>

      <footer className="bg-blue-900 text-white py-6 text-center text-sm">
        © {new Date().getFullYear()} ScholarsKnowledge · <a href="/login" className="underline">Contact Sales</a>
      </footer>
    </div>
  );
}