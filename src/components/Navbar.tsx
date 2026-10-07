import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { Logo } from './Logo.tsx';
import {
  ShoppingBag,
  ChevronDown,
  Layers,
  Store,
  ShieldCheck,
  LogOut,
  User,
  Package,
  ArrowRight,
  Monitor,
  Zap,
  Wifi,
  Sun,
  Server,
  Building,
  UserPlus,
  LogIn,
  Utensils,
} from 'lucide-react';
import { SearchAutocomplete } from './SearchAutocomplete.tsx';
import { Wallet, RefreshCw } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { role, buyer, vendor, admin, token, logout } = useAuth();
  const { totalCount, setIsCartOpen } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Search input state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthMenuOpen, setIsAuthMenuOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletAmount, setWalletAmount] = useState('');
  const [walletMethod, setWalletMethod] = useState<'card' | 'bank_transfer' | 'crypto'>('card');
  const [walletCrypto, setWalletCrypto] = useState('btc');
  const [walletMessage, setWalletMessage] = useState('');
  const [walletLoading, setWalletLoading] = useState(false);

  const categoryRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const authMenuRef = useRef<HTMLDivElement>(null);

  // Synchronize search input when URL query changes
  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (authMenuRef.current && !authMenuRef.current.contains(event.target as Node)) {
        setIsAuthMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const walletBase = role === 'buyer' ? '/api/wallet' : role ? `/api/${role}/wallet` : '';
  const walletPaymentBase = role === 'buyer' ? '/api/payments/wallet' : role ? `/api/${role}/payments/wallet` : '';

  const loadWalletBalance = async () => {
    if (!token || !walletBase) return;
    const response = await fetch(walletBase, { headers: { Authorization: `Bearer ${token}` } });
    if (response.ok) setWalletBalance((await response.json()).wallet?.balance || 0);
  };

  useEffect(() => {
    loadWalletBalance();
  }, [token, role]);

  const startWalletDeposit = async () => {
    if (!token || !walletAmount || !walletPaymentBase) return;
    setWalletLoading(true);
    setWalletMessage('');
    try {
      const response = await fetch(`${walletPaymentBase}/${walletMethod === 'crypto' ? 'crypto' : 'paystack'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount: Number(walletAmount),
          channel: walletMethod === 'bank_transfer' ? 'bank_transfer' : 'card',
          pay_currency: walletCrypto,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to initialize wallet deposit.');
      if (data.paystack?.authorization_url) window.location.href = data.paystack.authorization_url;
      else if (data.payment?.pay_address) setWalletMessage(`Send ${walletCrypto.toUpperCase()} to ${data.payment.pay_address}.`);
      setWalletAmount('');
    } catch (error) {
      setWalletMessage(error instanceof Error ? error.message : 'Wallet deposit failed.');
    } finally {
      setWalletLoading(false);
    }
  };

  const categories = [
    { name: 'Food & Drinks', label: 'Restaurants & Eateries', icon: Utensils },
    { name: 'Computing', label: 'Computing & IT', icon: Monitor },
    { name: 'Electronics', label: 'Consumer Electronics', icon: Zap },
    { name: 'Networking & Optics', label: 'Networking & Optics', icon: Wifi },
    { name: 'Solar & Power Solutions', label: 'Solar & Clean Energy', icon: Sun },
    { name: 'Servers & Infrastructure', label: 'Servers & Data Centers', icon: Server },
    { name: 'Home & Office', label: 'Office & Enterprise Gear', icon: Building },
  ];

  const handleCategorySelect = (categoryName: string) => {
    setIsCategoryDropdownOpen(false);
    if (categoryName === 'Food & Drinks') {
      navigate('/food-delivery');
      return;
    }
    navigate(`/?category=${encodeURIComponent(categoryName.toLowerCase())}`);
    window.requestAnimationFrame(() => {
      document.getElementById('product-catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const getUserDisplayName = () => {
    if (role === 'buyer') return buyer?.full_name || 'Buyer';
    if (role === 'vendor') return vendor?.business_name || 'Vendor';
    if (role === 'admin') return admin?.name || 'Administrator';
    return 'Account';
  };

  const getUserEmail = () => {
    if (role === 'buyer') return buyer?.email || '';
    if (role === 'vendor') return vendor?.email || '';
    if (role === 'admin') return admin?.email || '';
    return '';
  };

  return (
    <header className="sticky top-0 z-40 bg-[#141417]/95 backdrop-blur-md border-b border-zinc-800/90 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 md:gap-4">
        
        {/* 1. BRAND LOGO */}
        <div className="flex items-center shrink-0">
          <Logo size="md" onClick={() => navigate('/')} />
        </div>

        {/* 2. CATEGORIES MENU DROPDOWN & MARKETPLACE SEARCH BAR */}
        <div className="flex-1 max-w-2xl hidden sm:flex items-center gap-2">
          
          {/* Categories Dropdown Menu */}
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
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCategoryDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-[#18181e] border border-zinc-700/80 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono border-b border-zinc-800 mb-1">
                  Product Catalog
                </div>
                <div className="space-y-0.5">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.name}
                        onClick={() => handleCategorySelect(cat.name)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-purple-950/40 hover:border-purple-500/20 border border-transparent transition-all text-left group"
                      >
                        <Icon className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Marketplace Search Bar */}
          <SearchAutocomplete searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} />
        </div>

        {/* 3. RIGHT SIDE CONTROLS: CART ICON & STANDARD AUTH BUTTONS */}
        <div className="flex items-center gap-2.5 shrink-0">
          
          {/* Cart Icon Button */}
          <button
            id="open-cart-button"
            onClick={() => setIsCartOpen(true)}
            className="relative h-10 w-10 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 transition-all flex items-center justify-center shadow-sm"
            title="Open Shopping Cart"
          >
            <ShoppingBag className="w-4 h-4 text-purple-300" />
            {totalCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                {totalCount}
              </span>
            )}
          </button>

          {role && (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsWalletOpen((open) => !open);
                  loadWalletBalance();
                }}
                className="flex h-10 items-center gap-2 rounded-xl border border-emerald-800/60 bg-emerald-950/30 px-2 sm:px-3 text-xs text-emerald-200"
                aria-expanded={isWalletOpen}
              >
                <Wallet className="h-4 w-4" />
                <span>₦{(walletBalance || 0).toLocaleString()}</span>
              </button>
              {isWalletOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-zinc-700 bg-[#18181e] p-4 shadow-2xl">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-semibold text-white">Wallet</span>
                    <button type="button" onClick={loadWalletBalance} className="text-zinc-400 hover:text-white" aria-label="Refresh wallet"><RefreshCw className="h-4 w-4" /></button>
                  </div>
                  <div className="mb-3 text-xl font-mono text-emerald-300">₦{(walletBalance || 0).toLocaleString()}</div>
                  <input type="number" min="1" value={walletAmount} onChange={(event) => setWalletAmount(event.target.value)} placeholder="Amount in NGN" className="mb-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white" />
                  <div className="grid grid-cols-3 gap-1.5">
                    <button type="button" onClick={() => setWalletMethod('card')} className={`rounded-lg px-2 py-2 text-[11px] ${walletMethod === 'card' ? 'bg-purple-600' : 'bg-zinc-800'}`}>Card</button>
                    <button type="button" onClick={() => setWalletMethod('bank_transfer')} className={`rounded-lg px-2 py-2 text-[11px] ${walletMethod === 'bank_transfer' ? 'bg-indigo-600' : 'bg-zinc-800'}`}>Bank</button>
                    <button type="button" onClick={() => setWalletMethod('crypto')} className={`rounded-lg px-2 py-2 text-[11px] ${walletMethod === 'crypto' ? 'bg-emerald-700' : 'bg-zinc-800'}`}>Crypto</button>
                  </div>
                  {walletMethod === 'crypto' && (
                    <select value={walletCrypto} onChange={(event) => setWalletCrypto(event.target.value)} className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-white">
                      <option value="btc">Bitcoin (BTC)</option><option value="eth">Ethereum (ETH)</option><option value="usdt">Tether (USDT)</option>
                    </select>
                  )}
                  <button type="button" disabled={walletLoading || !walletAmount} onClick={startWalletDeposit} className="mt-3 w-full rounded-lg bg-purple-600 py-2.5 text-xs font-semibold disabled:opacity-50">
                    {walletLoading ? 'Opening secure payment...' : 'Deposit funds'}
                  </button>
                  {walletMessage && <p className="mt-2 break-all text-[11px] text-amber-300">{walletMessage}</p>}
                  <p className="mt-3 text-[10px] text-zinc-500">Crypto assets depend on the configured payment provider and account support.</p>
                </div>
              )}
            </div>
          )}

          {/* Standard Auth Controls: Authenticated User Profile Menu vs. Guest Sign In / Register */}
          {role ? (
            <div className="relative" ref={profileRef}>
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
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-[#18181e] border border-zinc-700/80 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* User Profile Header */}
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

                  {/* Navigation Links based on role */}
                  <div className="space-y-0.5">
                    {role === 'buyer' && (
                      <Link
                        to="/buyer/orders"
                        onClick={() => setIsProfileOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-zinc-800/80 transition-colors"
                      >
                        <Package className="w-4 h-4 text-emerald-400" />
                        <span>My Orders & Buyer Protection</span>
                      </Link>
                    )}

                    {role === 'vendor' && (
                      <Link
                        to="/vendor/dashboard"
                        onClick={() => setIsProfileOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-zinc-800/80 transition-colors"
                      >
                        <Store className="w-4 h-4 text-purple-400" />
                        <span>Vendor Dashboard</span>
                      </Link>
                    )}

                    {role === 'admin' && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setIsProfileOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-300 hover:text-red-200 hover:bg-zinc-800/80 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-red-400" />
                        <span>Admin Management</span>
                      </Link>
                    )}

                    <Link
                      to="/"
                      onClick={() => setIsProfileOpen(false)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors"
                    >
                      <Layers className="w-4 h-4 text-zinc-400" />
                      <span>Browse Marketplace</span>
                    </Link>
                  </div>

                  {/* Sign Out Button */}
                  <div className="pt-1.5 mt-1.5 border-t border-zinc-800">
                    <button
                      id="navbar-logout-btn"
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        logout();
                        navigate('/');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Guest Auth Buttons: Sign In / Register */
            <div className="relative" ref={authMenuRef}>
              <div className="flex items-center gap-2">
                <Link
                  id="navbar-login-link"
                  to="/login"
                  className="h-10 px-3.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Login</span>
                </Link>

                <div className="relative">
                  <button
                    id="navbar-register-menu-btn"
                    type="button"
                    onClick={() => setIsAuthMenuOpen(!isAuthMenuOpen)}
                    className="h-10 px-3.5 rounded-xl cta-gradient text-white text-xs font-bold shadow flex items-center gap-1.5 hover:opacity-95 transition-opacity"
                  >
                    <span>Register</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-white/80 transition-transform ${isAuthMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isAuthMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-[#18181e] border border-zinc-700/80 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
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
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile search bar visible on small screens below sm */}
      <div className="sm:hidden px-4 pb-3 pt-1 border-t border-zinc-800/60">
        <SearchAutocomplete
          inputId="mobile-marketplace-search-input"
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          placeholder="Search verified gear, brands..."
        />
      </div>
    </header>
  );
};
