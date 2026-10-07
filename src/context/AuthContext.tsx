import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, BuyerProfile, VendorProfile, AdminProfile } from '../types.ts';

interface AuthContextType {
  role: UserRole;
  token: string | null;
  buyer: BuyerProfile | null;
  vendor: VendorProfile | null;
  admin: AdminProfile | null;
  isLoading: boolean;
  loginBuyer: (token: string, buyer: BuyerProfile) => void;
  loginVendor: (token: string, vendor: VendorProfile) => void;
  loginAdmin: (token: string, admin: AdminProfile) => void;
  logout: () => void;
  refreshProfiles: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>(() => {
    return (localStorage.getItem('webnexa_role') as UserRole) || null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('webnexa_token');
  });
  const [buyer, setBuyer] = useState<BuyerProfile | null>(null);
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentProfile = async (currentToken: string, currentRole: UserRole) => {
    if (!currentToken || !currentRole) return;
    try {
      if (currentRole === 'buyer') {
        const res = await fetch('/api/auth/buyer/me', {
          headers: { Authorization: `Bearer ${currentToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setBuyer(data.buyer);
        } else {
          logout();
        }
      } else if (currentRole === 'vendor') {
        const res = await fetch('/api/auth/vendor/me', {
          headers: { Authorization: `Bearer ${currentToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setVendor(data.vendor);
        } else {
          logout();
        }
      } else if (currentRole === 'admin') {
        const res = await fetch('/api/auth/admin/me', {
          headers: { Authorization: `Bearer ${currentToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAdmin(data.admin);
        } else {
          logout();
        }
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      if (token && role) {
        await fetchCurrentProfile(token, role);
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const loginBuyer = (newToken: string, newBuyer: BuyerProfile) => {
    localStorage.setItem('webnexa_token', newToken);
    localStorage.setItem('webnexa_role', 'buyer');
    setToken(newToken);
    setRole('buyer');
    setBuyer(newBuyer);
    setVendor(null);
    setAdmin(null);
  };

  const loginVendor = (newToken: string, newVendor: VendorProfile) => {
    localStorage.setItem('webnexa_token', newToken);
    localStorage.setItem('webnexa_role', 'vendor');
    setToken(newToken);
    setRole('vendor');
    setVendor(newVendor);
    setBuyer(null);
    setAdmin(null);
  };

  const loginAdmin = (newToken: string, newAdmin: AdminProfile) => {
    localStorage.setItem('webnexa_token', newToken);
    localStorage.setItem('webnexa_role', 'admin');
    setToken(newToken);
    setRole('admin');
    setAdmin(newAdmin);
    setBuyer(null);
    setVendor(null);
  };

  const logout = () => {
    localStorage.removeItem('webnexa_token');
    localStorage.removeItem('webnexa_role');
    setToken(null);
    setRole(null);
    setBuyer(null);
    setVendor(null);
    setAdmin(null);
  };

  const refreshProfiles = async () => {
    if (token && role) {
      await fetchCurrentProfile(token, role);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        token,
        buyer,
        vendor,
        admin,
        isLoading,
        loginBuyer,
        loginVendor,
        loginAdmin,
        logout,
        refreshProfiles,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
