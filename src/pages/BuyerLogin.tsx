import React, { useState } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { AuthShell, SocialAuthButtons } from '../components/AuthShell.tsx';
import { PhoneInput } from '../components/PhoneInput.tsx';
import { Eye, EyeOff, Lock, Mail, User, Phone, MapPin, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

export const BuyerLogin: React.FC = () => {
  const location = useLocation();
  const [isRegistering, setIsRegistering] = useState(location.pathname === '/register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { loginBuyer } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const redirect = redirectParam ? (redirectParam.startsWith('/') ? redirectParam : `/${redirectParam}`) : '/marketplace';
  const noticeParam = searchParams.get('notice');
  const isCheckoutRedirect = redirect.includes('checkout') || noticeParam === 'checkout_required';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(isRegistering ? 'Buyer registration submit clicked' : 'Buyer login submit clicked');
    setIsLoading(true);
    setError(null);

    const endpoint = isRegistering ? '/api/auth/buyer/register' : '/api/auth/buyer/login';
    const payload = isRegistering
      ? {
          full_name: fullName,
          email,
          password,
          shipping_address_line1: address,
          city,
          state,
        }
      : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      loginBuyer(data.token, data.buyer);
      navigate(redirect);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (googleToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: googleToken, role: 'buyer' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || data.error || 'Google Authentication failed.');
      loginBuyer(data.token, data.buyer);
      navigate(redirect);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async (googleToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/google/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: googleToken, role: 'buyer' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Google account setup failed.');
      }
      loginBuyer(data.token, data.buyer);
      navigate(redirect);
    } catch (err: unknown) {
      console.error('Google Register Error:', err);
      setError(err instanceof Error ? err.message : 'Unable to register with Google. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title={isRegistering ? 'Create your WebNexa account' : 'Welcome back to WebNexa'}
      description={isRegistering ? 'Set up your buyer profile to shop verified products with confidence.' : 'Sign in to manage orders, delivery details, and protected payments.'}
      isRegistering={isRegistering}
      onToggleRegistration={() => setIsRegistering(!isRegistering)}
    >

        {/* Platform Notification for Intercepted Checkout */}
        {isCheckoutRedirect && (
          <div
            id="checkout-auth-required-notice"
            className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/40 text-purple-200 text-xs flex items-start gap-2.5 shadow-md"
          >
            <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold block text-white">Buyer Protection Guard Checkout</span>
              <p className="text-zinc-300 text-[11px] leading-relaxed">
                Please log in or create a WebNexa account to complete your order.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isRegistering && (
            <>
              <div>
                <label className="block text-zinc-400 mb-1">Full Legal Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Amara Nwosu"
                    className="auth-input w-full pl-9 pr-3 py-3"
                  />
                </div>
              </div>

              <PhoneInput label="Phone Number" value={phone} onChange={setPhone} />

              <div>
                <label className="block text-zinc-400 mb-1">Delivery Address</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street name & number"
                    className="auth-input w-full pl-9 pr-3 py-3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-400 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Lagos"
                    className="auth-input w-full px-3 py-3"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Lagos State"
                    className="auth-input w-full px-3 py-3"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-zinc-400 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="buyer@webnexa.dev"
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
            onClick={() => console.log(isRegistering ? 'Buyer registration button clicked' : 'Buyer login button clicked')}
            disabled={isLoading}
            className="relative z-50 w-full cursor-pointer pointer-events-auto py-3 px-4 rounded-xl cta-gradient text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 hover:opacity-95 transition-all disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <span>Authenticating Buyer...</span>
            ) : (
              <>
                <span>{isRegistering ? 'Register as Buyer' : 'Sign In as Buyer'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <SocialAuthButtons
          role="buyer"
          disabled={isLoading}
          onSuccess={isRegistering ? handleGoogleSignUp : handleGoogleLogin}
          onError={setError}
        />
        <div className="mt-6 border-t border-gray-800 pt-5 text-center text-xs text-slate-500">
          Are you a store owner or restaurant?{' '}
          <Link to="/vendor/login" className="font-semibold text-purple-300 hover:text-white">
            Access Vendor Portal →
          </Link>
        </div>
    </AuthShell>
  );
};
