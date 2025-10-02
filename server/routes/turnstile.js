// server/routes/turnstile.js
import { Router } from "express";
const router = Router();

router.post("/verify-turnstile", async (req, res) => {
  try {
    const { token, action = "login" } = req.body || {};
    if (!token) return res.status(400).json({ ok: false, error: "missing_token" });

    // Optional but helpful for CF risk scoring
    const ip =
      req.headers["cf-connecting-ip"] ||
      (req.headers["x-forwarded-for"] || "").toString().split(",")[0].trim() ||
      req.ip;

    const params = new URLSearchParams();
    params.append("secret", process.env.TURNSTILE_SECRET_KEY);
    params.append("response", token);
    if (ip) params.append("remoteip", ip);

    // Node 18+ has global fetch
    const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const outcome = await resp.json();

    // Enforce success and (recommended) that the action matches
    const ok = outcome.success === true && (!outcome.action || outcome.action === action);
    return res.status(ok ? 200 : 400).json({ ok, outcome });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

export default router; // <<< IMPORTANT