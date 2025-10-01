// src/auth/ForgotPassword.jsx
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../lib/firebase"; // adjust the path if needed

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email) return setMsg("Enter your email first.");
    if (sending) return;
    setSending(true);
    setMsg("");

    try {
      // ← THIS is the one call to Firebase
      await sendPasswordResetEmail(auth, email.trim());
      setMsg("Reset link sent. Check your inbox (and Spam).");
    } catch (err) {
      setMsg(err.code || err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
      />
      <button type="submit" disabled={sending}>
        {sending ? "Sending…" : "Send reset link"}
      </button>
      {msg && <div>{msg}</div>}
    </form>
  );
}