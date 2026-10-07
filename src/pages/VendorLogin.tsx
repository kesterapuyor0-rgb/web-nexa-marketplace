import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { AuthShell, SocialAuthButtons } from '../components/AuthShell.tsx';
import { Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export const VendorLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { loginVendor } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Vendor login submit clicked');
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/vendor/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Vendor authentication failed.');
      }

      loginVendor(data.token, data.vendor);
      navigate('/vendor/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrefillApprovedVendor = () => {
    setEmail('vendor@webnexa.dev');
    setPassword('Password123!');
  };

  const handlePrefillPendingVendor = () => {
    setEmail('pending@vanguardsolar.ng');
    setPassword('Password123!');
  };

  const handleGoogleLogin = async (googleToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: googleToken, role: 'vendor' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || data.error || 'Google Authentication failed.');
      loginVendor(data.token, data.vendor);
      navigate('/vendor/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back to WebNexa"
      description="Sign in to manage your catalog, fulfillment, and platform-managed payouts."
      isVendor
    >

        {error && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-zinc-400 mb-1">Registered Business Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vendor@webnexa.dev"
                className="auth-input w-full pl-9 pr-3 py-3"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="auth-input w-full pl-9 pr-10 py-3"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-500 hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            onClick={() => console.log('Vendor login button clicked')}
            disabled={isLoading}
            className="relative z-50 w-full cursor-pointer pointer-events-auto py-3 px-4 rounded-xl cta-gradient text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 hover:opacity-95 transition-all disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <span>Verifying Merchant Credentials...</span>
            ) : (
              <>
                <span>Sign In to Merchant Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Merchant Credentials Helper */}
        <div className="space-y-2 pt-1">
          <div className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider text-center">
            Demo Merchant Credentials
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handlePrefillApprovedVendor}
              className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[11px] font-medium border border-zinc-800 text-left flex items-center gap-2 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
              <div className="truncate">
                <span className="block font-semibold text-white truncate">Apex Precision Tech</span>
                <span className="text-[10px] text-zinc-400 truncate">vendor@webnexa.dev</span>
              </div>
            </button>

            <button
              type="button"
              onClick={handlePrefillPendingVendor}
              className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[11px] font-medium border border-zinc-800 text-left flex items-center gap-2 transition-colors"
            >
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="truncate">
                <span className="block font-semibold text-white truncate">Vanguard Solar Ltd</span>
                <span className="text-[10px] text-zinc-400 truncate">pending@vanguardsolar.ng</span>
              </div>
            </button>
          </div>
        </div>

        <SocialAuthButtons role="vendor" disabled={isLoading} onSuccess={handleGoogleLogin} onError={setError} />
        <div className="mt-5 border-t border-gray-800 pt-5 text-center text-xs text-slate-500">
          Looking to shop?{' '}
          <Link to="/login" className="font-semibold text-purple-300 hover:text-white">
            Go to Buyer Sign-In →
          </Link>
        </div>
        <div className="mt-3 text-center text-xs text-slate-600">
          Need a merchant account? <Link to="/vendor/register" className="font-semibold text-slate-400 hover:text-white">Apply for onboarding</Link>
        </div>
    </AuthShell>
  );
};
