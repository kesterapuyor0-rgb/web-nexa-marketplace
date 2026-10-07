import React from 'react';
import { ArrowRight, CheckCircle2, Globe2, ShieldCheck, Sparkles } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { Logo } from './Logo.tsx';

interface AuthShellProps {
  children: React.ReactNode;
  title: string;
  description: string;
  isVendor?: boolean;
  isRegistering?: boolean;
  onToggleRegistration?: () => void;
}

export const AuthShell: React.FC<AuthShellProps> = ({
  children,
  title,
  description,
  isVendor = false,
  isRegistering = false,
  onToggleRegistration,
}) => (
  <div className="auth-page pointer-events-auto">
    <div className="auth-shell pointer-events-auto">
      <aside className="auth-visual">
        <div className="auth-orb auth-orb-one" />
        <div className="auth-orb auth-orb-two" />
        <div className="relative z-10 flex h-full flex-col justify-between">
          <div>
            <Logo size="md" />
            <div className="mt-20 max-w-md">
              <p className="auth-eyebrow">
                <Sparkles className="h-3.5 w-3.5" />
                {isVendor ? 'WebNexa Merchant Console' : 'Secure Global Marketplace'}
              </p>
              <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-white">
                {isVendor ? 'Operate your business with clarity.' : 'Commerce infrastructure built for confidence.'}
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
                {isVendor
                  ? 'Manage inventory, incoming orders, and daily revenue from one protected merchant workspace.'
                  : 'Track orders, save delivery details, and shop verified sellers with WebNexa Buyer Protection.'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-6">
            <div>
              <div className="text-xl font-semibold text-white">{isVendor ? '24/7' : '99.9%'}</div>
              <div className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">{isVendor ? 'Order visibility' : 'Platform uptime'}</div>
            </div>
            <div>
              <div className="text-xl font-semibold text-white">{isVendor ? 'Live' : '24/7'}</div>
              <div className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">{isVendor ? 'Merchant metrics' : 'Protected access'}</div>
            </div>
            <div>
              <div className="text-xl font-semibold text-white">{isVendor ? 'Auto' : 'PCI'}</div>
              <div className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">{isVendor ? 'Settlement ready' : 'Payment ready'}</div>
            </div>
          </div>
        </div>
      </aside>

      <section className="auth-form-panel relative z-20 pointer-events-auto">
        <div className="auth-form-inner">
          <div className="mb-8 flex items-center justify-end gap-4">
            <div className="hidden items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500 sm:flex">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Secure access
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-white">{title}</h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">{description}</p>
          </div>

          {children}

          {onToggleRegistration && (
            <div className="mt-8 border-t border-gray-800 pt-6 text-center text-sm text-slate-500">
              {isRegistering ? 'Already have an account?' : 'New to WebNexa?'}{' '}
              <button type="button" onClick={onToggleRegistration} className="font-semibold text-purple-300 hover:text-white">
                {isRegistering ? 'Sign in' : 'Create an account'}
              </button>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between text-[11px] text-slate-600">
            <span className="flex items-center gap-1.5"><Globe2 className="h-3.5 w-3.5" /> WebNexa Platform</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Verified environment</span>
          </div>
        </div>
      </section>
    </div>
  </div>
);

interface SocialAuthButtonsProps {
  role: 'buyer' | 'vendor';
  disabled?: boolean;
  onSuccess: (token: string) => Promise<void>;
  onError: (message: string) => void;
}

export const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({ role, disabled, onSuccess, onError }) => {
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      if (!tokenResponse.access_token) {
        onError('Google did not return an access token.');
        return;
      }
      await onSuccess(tokenResponse.access_token);
    },
    onError: () => onError('Google Authentication failed. Please try again.'),
  });

  return (
    <div className="mt-5 space-y-3">
      <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-slate-600">
        <span className="h-px flex-1 bg-gray-800" />
        or continue with
        <span className="h-px flex-1 bg-gray-800" />
      </div>
      <button
        type="button"
        disabled={Boolean(disabled)}
        onClick={() => {
          console.log('Google login button clicked');
          login();
        }}
        className="auth-social-button relative z-50 cursor-pointer pointer-events-auto disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={`Continue as ${role} with Google`}
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-[#4285f4]">G</span>
        Continue with Google
        <ArrowRight className="ml-auto h-3.5 w-3.5 text-slate-600" />
      </button>
    </div>
  );
};
