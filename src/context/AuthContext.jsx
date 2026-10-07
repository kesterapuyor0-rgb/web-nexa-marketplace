import { createContext, useContext, useState, useEffect } from "react";
const AuthContext = createContext(void 0);
export const AuthProvider = ({ children }) => {
  const [role, setRole] = useState(() => {
    return localStorage.getItem("webnexa_role") || null;
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem("webnexa_token");
  });
  const [buyer, setBuyer] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchCurrentProfile = async (currentToken, currentRole) => {
    if (!currentToken || !currentRole) return;
    try {
      if (currentRole === "buyer") {
        const res = await fetch("/api/auth/buyer/me", {
          headers: { Authorization: `Bearer ${currentToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setBuyer(data.buyer);
        } else {
          logout();
        }
      } else if (currentRole === "vendor") {
        const res = await fetch("/api/auth/vendor/me", {
          headers: { Authorization: `Bearer ${currentToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setVendor(data.vendor);
        } else {
          logout();
        }
      } else if (currentRole === "admin") {
        const res = await fetch("/api/auth/admin/me", {
          headers: { Authorization: `Bearer ${currentToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAdmin(data.admin);
        } else {
          logout();
        }
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
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
  const loginBuyer = (newToken, newBuyer) => {
    localStorage.setItem("webnexa_token", newToken);
    localStorage.setItem("webnexa_role", "buyer");
    setToken(newToken);
    setRole("buyer");
    setBuyer(newBuyer);
    setVendor(null);
    setAdmin(null);
  };
  const loginVendor = (newToken, newVendor) => {
    localStorage.setItem("webnexa_token", newToken);
    localStorage.setItem("webnexa_role", "vendor");
    setToken(newToken);
    setRole("vendor");
    setVendor(newVendor);
    setBuyer(null);
    setAdmin(null);
  };
  const loginAdmin = (newToken, newAdmin) => {
    localStorage.setItem("webnexa_token", newToken);
    localStorage.setItem("webnexa_role", "admin");
    setToken(newToken);
    setRole("admin");
    setAdmin(newAdmin);
    setBuyer(null);
    setVendor(null);
  };
  const logout = () => {
    localStorage.removeItem("webnexa_token");
    localStorage.removeItem("webnexa_role");
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
  return <AuthContext.Provider
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
      refreshProfiles
    }}
  >
      {children}
    </AuthContext.Provider>;
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
