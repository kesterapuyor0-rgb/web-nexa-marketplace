import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { Loader2 } from 'lucide-react';

export const BuyerProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role, token, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        <span className="text-xs font-medium">Verifying buyer credentials...</span>
      </div>
    );
  }

  if (!token || role !== 'buyer') {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}&notice=checkout_required`}
        replace
      />
    );
  }

  return <>{children}</>;
};
