// src/LoginPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithGoogle, signInEmail, registerEmail, resetPassword } from "./firebase";
import LogoBitematch from "./LogoBiteMatch";

export default function LoginPage() {
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function doGoogle() {
    setErr(""); setBusy(true);
    try { await signInWithGoogle(); navigate("/"); }
    catch (e) { setErr(e.message || String(e)); }
    finally { setBusy(false); }
  }
  async function doEmail() {
    setErr(""); setBusy(true);
    try {
      if (mode === "signin") await signInEmail(email, password);
      else await registerEmail({ name, email, phoneNumber, password });
      navigate("/");
    } catch (e) {
      setErr(e.message || String(e));
    } finally { setBusy(false); }
  }
  async function doReset() {
    if (!email) return setErr("Enter your email to reset.");
    setErr(""); setBusy(true);
    try { await resetPassword(email); alert("Password reset email sent."); }
    catch (e) { setErr(e.message || String(e)); }
    finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen bg-gray-50 grid place-items-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white border shadow-xl overflow-hidden">
        <header className="px-5 py-4 border-b bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoBitematch size={22} />
          </div>
          <Link to="/" className="text-sm text-indigo-600 hover:underline">Back</Link>
        </header>

        <div className="p-5 space-y-4">
          <div className="flex gap-2 text-sm">
            <button
              onClick={() => setMode("signin")}
              className={`px-3 py-1.5 rounded-lg border ${mode==='signin' ? 'bg-gray-100' : 'bg-white'}`}
            >
              Sign in
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`px-3 py-1.5 rounded-lg border ${mode==='signup' ? 'bg-gray-100' : 'bg-white'}`}
            >
              Create account
            </button>
          </div>

          <button
            onClick={doGoogle}
            disabled={busy}
            className="w-full py-2 rounded-lg border bg-white hover:bg-gray-50 font-medium disabled:opacity-60"
          >
            Continue with Google
          </button>

          <div className="grid gap-2">
{mode === "signup" && (
  <>
    <input
      value={name}
      onChange={(e)=>setName(e.target.value)}
      placeholder="Full name"
      className="px-3 py-2 rounded-lg border"
    />
    <input
      type="tel"
      value={phoneNumber}
      onChange={(e)=>setPhoneNumber(e.target.value)}
      placeholder="Phone number"
      className="px-3 py-2 rounded-lg border"
    />
  </>
)}
            <input
              type="email"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              placeholder="Email"
              className="px-3 py-2 rounded-lg border"
            />
            <input
              type="password"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              placeholder="Password"
              className="px-3 py-2 rounded-lg border"
            />
            <button
              onClick={doEmail}
              disabled={busy}
              className="mt-1 w-full py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-60"
            >
              {mode === "signin" ? "Sign in with Email" : "Create account with Email"}
            </button>
            <button
              onClick={doReset}
              disabled={busy}
              className="text-xs text-gray-600 underline justify-self-start"
            >
              Forgot password?
            </button>
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}

          <div className="text-xs text-gray-600">
            You can also continue as a guest — your likes and week plan
            are saved to your device until you link an account.
          </div>

          <Link
            to="/"
            className="block text-center text-sm text-gray-700 underline"
            title="Continue as guest"
          >
            Continue as guest
          </Link>
        </div>
      </div>
    </div>
  );
}
