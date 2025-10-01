// src/components/Navbar.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

/* ---------- Small helpers ---------- */
function safeParse(json) { try { return JSON.parse(json || ""); } catch { return null; } }
const ID_KEYS = ["authUserId","activeUserId","currentUserId","loggedInUserId"];

function loadActiveUser() {
  for (const src of [sessionStorage, localStorage]) {
    for (const k of ID_KEYS) {
      const id = src.getItem(k);
      if (id) {
        const byId = safeParse(localStorage.getItem("usersById")) || {};
        if (byId[id]) return byId[id];
        const list = safeParse(localStorage.getItem("users")) || [];
        const found = list.find(u => u.id === id || u.uid === id || u.userId === id);
        if (found) return found;
      }
    }
  }
  return safeParse(sessionStorage.getItem("currentUser")) ||
         safeParse(localStorage.getItem("currentUser")) || null;
}

function loadPartner() {
  try { return JSON.parse(localStorage.getItem("partnerAuth") || "null"); } catch { return null; }
}

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = (parts[0]?.[0] || "U").toUpperCase();
  const b = (parts[1]?.[0] || "S").toUpperCase();
  return a + b;
}
function clearAuthStateKeepData() {
  sessionStorage.clear();
  localStorage.removeItem("currentUser");
  for (const k of ID_KEYS) {
    sessionStorage.removeItem(k);
    localStorage.removeItem(k);
  }
}

/* ---------- Avatar ---------- */
function Avatar({ url, name }) {
  return (
    <div className="h-10 w-10 rounded-full bg-white/20 overflow-hidden flex items-center justify-center shrink-0">
      {url ? (
        <img src={url} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className="text-xs font-semibold text-white h-full w-full flex items-center justify-center">
          {initials(name)}
        </span>
      )}
    </div>
  );
}

/* ---------- Optional spinning globe ---------- */
function SpinningGlobe({ size = 40 }) {
  const candidates = ["images/globe.jpg", "images/globe.png", "images/globe.svg"];
  const [idx, setIdx] = useState(0);
  const [hidden, setHidden] = useState(false);
  const src = candidates[idx];
  const onErr = () => { if (idx < candidates.length - 1) setIdx(i => i + 1); else setHidden(true); };
  if (hidden) return null;

  return (
    <div className="rounded-full overflow-hidden shrink-0" style={{ width: size, height: size }} title="ScholarsKnowledge">
      <img
        src={src}
        onError={onErr}
        alt="Globe"
        className="h-full w-full object-cover animate-spin"
        style={{ animationDuration: "6s" }}
      />
    </div>
  );
}

/* ================= Navbar (fixed) with frozen reserved strip ================= */
export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(() => loadActiveUser());
  const [partner, setPartner] = useState(() => loadPartner());
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // dimensions (keep in sync with Spacer at bottom)
  const NAV_H = 56;      // 56px (h-14)
  const STRIP_H = 80;    // ~2cm reserved strip
  const TOTAL_H = NAV_H + STRIP_H;

  // keep auth states fresh
  useEffect(() => {
    const onStorage = () => {
      setUser(loadActiveUser());
      setPartner(loadPartner());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  useEffect(() => {
    setUser(loadActiveUser());
    setPartner(loadPartner());
  }, [location.pathname, location.search]);
  useEffect(() => {
    const onAuth = () => {
      setUser(loadActiveUser());
      setPartner(loadPartner());
    };
    window.addEventListener("auth:changed", onAuth);
    return () => window.removeEventListener("auth:changed", onAuth);
  }, []);

  // close menu on outside/esc
  useEffect(() => {
    const onDown = (e) => {
      if (e.key === "Escape") setOpen(false);
      if (!menuRef.current) return;
      if (open && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onDown);
    };
  }, [open]);

  const dashboardPath =
    (user?.role || "").toLowerCase() === "lecturer"
      ? "/lecturer-dashboard"
      : "/student-dashboard";

  const handleLogout = () => {
    const roleParam =
      (user?.role || "student").toLowerCase() === "lecturer" ? "lecturer" : "student";
    clearAuthStateKeepData();
    setUser(null);
    setOpen(false);
    window.dispatchEvent(new Event("auth:changed"));
    navigate(`/login?role=${roleParam}`);
  };

  const partnerLoggedIn = !!(partner && (partner.email || partner.username || partner.user));

  return (
    <>
      {/* FIXED CONTAINER that includes the navbar row AND the frozen strip row */}
      <div className="fixed top-0 inset-x-0 z-50" style={{ height: TOTAL_H }}>
        {/* Row 1: Navbar */}
        <nav
          className="h-14 text-white"
          style={{ backgroundColor: "#0A4595", fontFamily: '"Open Sans", Arial, sans-serif' }}
        >
          <div className="h-full px-3 flex items-center">
            {/* LEFT: brand */}
            <div className="flex items-center gap-2 min-w-0">
              <img
                src="images/1754280544595.jpeg"
                alt="ScholarsKnowledge logo"
                className="h-10 w-10 rounded-full object-cover"
              />
              <Link to="/" className="font-semibold text-base md:text-lg truncate text-white">
                ScholarsKnowledge
              </Link>
            </div>

            {/* CENTER: nav links with generous equal gaps */}
            <ul className="flex-1 flex items-center justify-center gap-10">
              <li><Link className="text-sm hover:opacity-90" to="/">Home</Link></li>
              <li><Link className="text-sm hover:opacity-90" to="/about">About Us</Link></li>
              <li><Link className="text-sm hover:opacity-90" to="/eduinfo">EduFinancing</Link></li>
              <li><Link className="text-sm hover:opacity-90" to="/partners">Partners</Link></li>
              <li><Link className="text-sm hover:opacity-90" to="/scholarship">Scholarship Directory</Link></li>
              <li><Link className="text-sm hover:opacity-90" to="/student-sign-up">Student Sign Up</Link></li>
              <li><Link className="text-sm hover:opacity-90" to="/lecturer-sign-up">Lecturer Sign Up</Link></li>

              {/* 👇 NEW: Partner Dashboard — only visible when partner is logged in */}
              {partnerLoggedIn && (
                <li>
                  <Link className="text-sm font-semibold hover:opacity-90 underline underline-offset-4" to="/partner/dashboard">
                    Partner Dashboard
                  </Link>
                </li>
              )}
            </ul>

            {/* RIGHT: globe + auth pinned to far right */}
            <div className="ml-auto flex items-center gap-3">
              <SpinningGlobe size={36} />
              {!user ? (
                <Link
                  to="/login"
                  className="rounded-full bg-white text-[#0A4595] px-4 py-1.5 text-sm font-semibold hover:bg-white/90"
                >
                  Log in
                </Link>
              ) : (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setOpen(v => !v)}
                    className="flex items-center gap-2 rounded-full hover:bg-white/10 pl-2 pr-1 py-1"
                  >
                    <span className="hidden md:block text-sm font-medium">Me ▾</span>
                    <Avatar url={user.photoUrl} name={user.name || "User"} />
                  </button>

                  {open && (
                    <div className="absolute right-0 mt-2 w-60 rounded-xl border border-white/20 bg-white text-slate-900 shadow-lg overflow-hidden">
                      <div className="p-3 flex items-center gap-3">
                        <Avatar url={user.photoUrl} name={user.name || "User"} />
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{user.name || "User"}</div>
                          {user.role && (
                            <div className="text-xs text-slate-500 capitalize truncate">
                              {String(user.role).toLowerCase()}
                            </div>
                          )}
                        </div>
                      </div>
                      <hr className="border-slate-100" />
                      <button
                        onClick={() => { setOpen(false); navigate(dashboardPath); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"
                      >
                        <span>👤</span> <span>View My Profile</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"
                      >
                        <span>🚪</span> <span>Log Out</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Row 2: Frozen transparent strip for ads (2cm ~ 80px) */}
        <div
          style={{
            height: STRIP_H,
            background: "transparent",
            pointerEvents: "none"
          }}
        />
      </div>

      {/* Spacer pushes the page content below the fixed container */}
      <div style={{ height: TOTAL_H }} />
    </>
  );
}