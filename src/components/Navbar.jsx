import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { Logo } from "./Logo.jsx";
import {
  ShoppingBag,
  ChevronDown,
  Layers,
  Store,
  ShieldCheck,
  LogOut,
  User,
  Package,
  Monitor,
  Zap,
  Wifi,
  Sun,
  Server,
  Building,
  UserPlus,
  LogIn,
  Utensils
} from "lucide-react";
import { SearchAutocomplete } from "./SearchAutocomplete.jsx";
import { Wallet } from "lucide-react";
export const Navbar = () => {
  const { role, buyer, vendor, admin, token, logout } = useAuth();
  const { totalCount, setIsCartOpen } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const isMarketplace = location.pathname === "/" || location.pathname === "/marketplace";
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthMenuOpen, setIsAuthMenuOpen] = useState(false);
  const categoryRef = useRef(null);
  const profileRef = useRef(null);
  const authMenuRef = useRef(null);
  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
  }, [searchParams]);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setIsCategoryDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (authMenuRef.current && !authMenuRef.current.contains(event.target)) {
        setIsAuthMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const categories = [
    { name: "Food & Drinks", label: "Restaurants & Eateries", icon: Utensils },
    { name: "Computing", label: "Computing & IT", icon: Monitor },
    { name: "Electronics", label: "Consumer Electronics", icon: Zap },
    { name: "Networking & Optics", label: "Networking & Optics", icon: Wifi },
    { name: "Solar & Power Solutions", label: "Solar & Clean Energy", icon: Sun },
    { name: "Servers & Infrastructure", label: "Servers & Data Centers", icon: Server },
    { name: "Home & Office", label: "Office & Enterprise Gear", icon: Building }
  ];
  const handleCategorySelect = (categoryName) => {
    setIsCategoryDropdownOpen(false);
    if (categoryName === "Food & Drinks") {
      navigate("/food-delivery");
      return;
    }
    navigate(`/?category=${encodeURIComponent(categoryName.toLowerCase())}`);
    window.requestAnimationFrame(() => {
      document.getElementById("product-catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };
  const getUserDisplayName = () => {
    if (role === "buyer") return buyer?.full_name || "Buyer";
    if (role === "vendor") return vendor?.business_name || "Vendor";
    if (role === "admin") return admin?.name || "Administrator";
    return "Account";
  };
  const getUserEmail = () => {
    if (role === "buyer") return buyer?.email || "";
    if (role === "vendor") return vendor?.email || "";
    if (role === "admin") return admin?.email || "";
    return "";
  };
  return <header className="sticky top-0 z-40 bg-[#141417]/95 backdrop-blur-md border-b border-zinc-800/90 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 md:gap-4">
        
        {
    /* 1. BRAND LOGO */
  }
        <div className="flex items-center shrink-0">
          <Logo size="md" className="navbar-logo" onClick={() => navigate("/")} />
        </div>

        {
    /* 2. CATEGORIES MENU DROPDOWN & MARKETPLACE SEARCH BAR */
  }
        <div className="flex-1 max-w-2xl hidden sm:flex items-center gap-2">
          
          {
    /* Categories Dropdown Menu */
  }
          <div className="relative" ref={categoryRef}>
            <button
    id="categories-dropdown-btn"
    type="button"
    onClick={() => setIsCategoryDropdownOpen((isOpen) => !isOpen)}
    className="h-10 px-3.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700/90 text-zinc-200 border border-zinc-700/70 text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shadow-sm"
    aria-expanded={isCategoryDropdownOpen}
    title="Browse Categories"
  >
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Categories</span>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isCategoryDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {isCategoryDropdownOpen && <div className="absolute left-0 top-full mt-2 w-64 bg-[#18181e] border border-zinc-700/80 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono border-b border-zinc-800 mb-1">
                  Product Catalog
                </div>
                <div className="space-y-0.5">
                  {categories.map((cat) => {
    const Icon = cat.icon;
    return <button
      key={cat.name}
      onClick={() => handleCategorySelect(cat.name)}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-purple-950/40 hover:border-purple-500/20 border border-transparent transition-all text-left group"
    >
                        <Icon className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">{cat.label}</span>
                      </button>;
  })}
                </div>
              </div>}
          </div>

          {
    /* Marketplace Search Bar */
  }
          <SearchAutocomplete searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} />
        </div>

        {
    /* 3. RIGHT SIDE CONTROLS: CART ICON & STANDARD AUTH BUTTONS */
  }
        <div className="flex items-center gap-2.5 shrink-0">
          
          {
    /* Cart Icon Button */
  }
          <button
    id="open-cart-button"
    onClick={() => setIsCartOpen(true)}
    className="relative h-10 w-10 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 transition-all flex items-center justify-center shadow-sm"
    title="Open Shopping Cart"
  >
            <ShoppingBag className="w-4 h-4 text-purple-300" />
            {totalCount > 0 && <span className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                {totalCount}
              </span>}
          </button>

          {role === "vendor" && <button
      type="button"
      onClick={() => navigate("/vendor/dashboard")}
      className="flex h-10 items-center gap-2 rounded-lg border border-emerald-800/60 bg-emerald-950/30 px-2.5 text-xs text-emerald-200"
      aria-label="Open vendor wallet"
    >
              <Wallet className="h-4 w-4" />
              <span>Wallet</span>
            </button>}

          {
    /* Standard Auth Controls: Authenticated User Profile Menu vs. Guest Sign In / Register */
  }
          {role ? <div className="relative" ref={profileRef}>
              <button
    id="user-profile-menu-btn"
    type="button"
    onClick={() => setIsProfileOpen(!isProfileOpen)}
    className="h-10 px-3 rounded-xl bg-zinc-800/90 hover:bg-zinc-700/90 border border-zinc-700/70 text-xs flex items-center gap-2 transition-colors shadow-sm"
    aria-expanded={isProfileOpen}
  >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-900 to-indigo-900 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-xs">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="font-semibold text-zinc-200 truncate max-w-[120px] text-xs">
                    {getUserDisplayName()}
                  </span>
                  <span className="text-[9px] text-purple-300 font-mono uppercase tracking-wider">
                    {role}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isProfileOpen ? "rotate-180" : ""}`} />
              </button>

              {
    /* Profile Dropdown Menu */
  }
              {isProfileOpen && <div className="absolute right-0 top-full mt-2 w-64 bg-[#18181e] border border-zinc-700/80 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {
    /* User Profile Header */
  }
                  <div className="p-3 border-b border-zinc-800 bg-zinc-900/50 rounded-xl mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-900/60 border border-purple-500/30 flex items-center justify-center text-purple-300">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <span className="font-bold text-xs text-white block truncate">
                          {getUserDisplayName()}
                        </span>
                        <span className="text-[11px] text-zinc-400 block truncate">
                          {getUserEmail()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {
    /* Navigation Links based on role */
  }
                  <div className="space-y-0.5">
                    {role === "buyer" && <Link
    to="/buyer/orders"
    onClick={() => setIsProfileOpen(false)}
    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-zinc-800/80 transition-colors"
  >
                        <Package className="w-4 h-4 text-emerald-400" />
                        <span>My Orders & Buyer Protection</span>
                      </Link>}

                    {role === "vendor" && <Link
    to="/vendor/dashboard"
    onClick={() => setIsProfileOpen(false)}
    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-zinc-800/80 transition-colors"
  >
                        <Store className="w-4 h-4 text-purple-400" />
                        <span>Vendor Dashboard</span>
                      </Link>}

                    {role === "admin" && <Link
    to="/admin/dashboard"
    onClick={() => setIsProfileOpen(false)}
    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-300 hover:text-red-200 hover:bg-zinc-800/80 transition-colors"
  >
                        <ShieldCheck className="w-4 h-4 text-red-400" />
                        <span>Admin Management</span>
                      </Link>}

                    <Link
    to="/"
    onClick={() => setIsProfileOpen(false)}
    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors"
  >
                      <Layers className="w-4 h-4 text-zinc-400" />
                      <span>Browse Marketplace</span>
                    </Link>
                  </div>

                  {
    /* Sign Out Button */
  }
                  <div className="pt-1.5 mt-1.5 border-t border-zinc-800">
                    <button
    id="navbar-logout-btn"
    type="button"
    onClick={() => {
      setIsProfileOpen(false);
      logout();
      navigate("/");
    }}
    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors text-left"
  >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>}
            </div> : (
    /* Guest Auth Buttons: Sign In / Register */
    <div className="relative" ref={authMenuRef}>
              <div className="flex items-center gap-2">
                <Link
      id="navbar-login-link"
      to="/login"
                  aria-label="Log in"
                  className="h-10 px-2 sm:px-3.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 text-xs font-semibold transition-colors flex items-center gap-1.5"
    >
                  <LogIn className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="hidden sm:inline">Login</span>
                </Link>

                <div className="relative">
                  <button
      id="navbar-register-menu-btn"
      type="button"
      onClick={() => setIsAuthMenuOpen(!isAuthMenuOpen)}
      aria-label="Register an account"
      className="h-10 px-2 sm:px-3.5 rounded-xl cta-gradient text-white text-xs font-bold shadow flex items-center gap-1.5 hover:opacity-95 transition-opacity"
    >
                    <UserPlus className="w-3.5 h-3.5 sm:hidden" />
                    <span className="hidden sm:inline">Register</span>
                    <ChevronDown className={`hidden sm:block w-3.5 h-3.5 text-white/80 transition-transform ${isAuthMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isAuthMenuOpen && <div className="absolute right-0 top-full mt-2 w-56 bg-[#18181e] border border-zinc-700/80 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono border-b border-zinc-800 mb-1">
                        Create an Account
                      </div>
                      <Link
      to="/login"
      onClick={() => setIsAuthMenuOpen(false)}
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-zinc-800/80 transition-colors"
    >
                        <UserPlus className="w-4 h-4 text-purple-400" />
                        <div>
                          <span className="font-semibold block">Buyer Account</span>
                          <span className="text-[10px] text-zinc-400">Shop with Buyer Protection Guard</span>
                        </div>
                      </Link>
                      <Link
      to="/vendor/register"
      onClick={() => setIsAuthMenuOpen(false)}
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-purple-950/30 transition-colors"
    >
                        <Store className="w-4 h-4 text-amber-400" />
                        <div>
                          <span className="font-semibold block">Merchant Account</span>
                          <span className="text-[10px] text-zinc-400">Sell on WebNexa</span>
                        </div>
                      </Link>
                    </div>}
                </div>
              </div>
            </div>
  )}
        </div>
      </div>

      {
    /* Mobile search bar visible on small screens below sm */
  }
      <div className="sm:hidden px-4 pb-3 pt-1 border-t border-zinc-800/60">
        <SearchAutocomplete
    inputId="mobile-marketplace-search-input"
    searchQuery={searchQuery}
    onSearchQueryChange={setSearchQuery}
    placeholder="Search verified gear, brands..."
  />
      </div>
      <nav aria-label="Browse categories" className={`${isMarketplace ? "hidden" : "flex"} mobile-category-nav sm:hidden gap-2 overflow-x-auto px-4 pb-3`}>
        {categories.map((category) => {
    const Icon = category.icon;
    return <button
      key={category.name}
      type="button"
      onClick={() => handleCategorySelect(category.name)}
      className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 px-3 text-[11px] font-medium text-zinc-300 active:bg-zinc-800"
    >
            <Icon className="h-3.5 w-3.5 text-purple-300" />
            <span>{category.name}</span>
          </button>;
  })}
      </nav>
    </header>;
};
