import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Logo } from "../components/Logo.jsx";
import { ShieldAlert, ShieldCheck, Lock, Mail, AlertCircle, KeyRound } from "lucide-react";
export const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Admin verification failed.");
      }
      loginAdmin(data.token, data.admin);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  const handlePrefillAdmin = () => {
    setEmail("admin@webnexa.dev");
    setPassword("Password123!");
  };
  return <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-[#16161b] border border-red-500/30 rounded-2xl p-8 shadow-[0_0_50px_rgba(239,68,68,0.15)] space-y-6 relative overflow-hidden">
        {
    /* Obsidian top security stripe */
  }
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-zinc-800 to-red-600" />

        {
    /* Header */
  }
        <div className="text-center space-y-2">
          <Logo size="lg" className="justify-center mx-auto" />
          <div className="pt-2">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 font-semibold border border-red-500/30 inline-flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> Isolated Executive Route (/admin/login)
            </span>
            <h2 className="text-xl font-bold text-white font-cinzel mt-2">
              WebNexa Administration
            </h2>
            <p className="text-xs text-zinc-400">
              Restricted portal for vendor review, compliance enforcement, and secure settlement moderation.
            </p>
          </div>
        </div>

        {error && <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-zinc-400 mb-1 font-medium">Administrator Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
    type="email"
    required
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    placeholder="admin@webnexa.dev"
    className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-red-500"
  />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1 font-medium">Master Security Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
    type="password"
    required
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    placeholder="••••••••"
    className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-red-500"
  />
            </div>
          </div>

          <button
    type="submit"
    disabled={isLoading}
    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 via-red-700 to-zinc-900 hover:from-red-500 hover:to-zinc-800 text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 border border-red-500/40"
  >
            {isLoading ? <span>Verifying Admin Token...</span> : <>
                <KeyRound className="w-4 h-4" />
                <span>Authorize Admin Session</span>
              </>}
          </button>
        </form>

        {
    /* Evaluation One-Click Button */
  }
        <button
    type="button"
    onClick={handlePrefillAdmin}
    className="w-full py-2.5 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-700 transition-colors flex items-center justify-center gap-1.5"
  >
          <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
          <span>Prefill Super Admin (Kester Apuyor)</span>
        </button>

        <div className="border-t border-zinc-800/80 pt-4 text-center text-[11px] text-zinc-500 space-y-1">
          <p>This portal is strictly monitored and audited.</p>
          <p className="font-mono text-[10px] text-zinc-600">IP & Authorization events logged to immutable MySQL ledger.</p>
        </div>
      </div>
    </div>;
};
