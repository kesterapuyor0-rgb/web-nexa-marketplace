import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNavigate } from 'react-router-dom';
import { AdminStats, VendorProfile, EscrowTransaction, Order, Product } from '../types.ts';
import { WalletPanel } from '../components/WalletPanel.tsx';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Wallet,
  Lock,
  Database,
  Users,
  Store,
  Package,
  Layers,
  FileCode,
  Copy,
  Check,
  AlertCircle,
  ArrowUpRight,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  Sliders,
  Tag,
  Star,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { admin, token, role } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [vendorFilter, setVendorFilter] = useState<'pending' | 'approved' | 'all'>('pending');
  const [escrowList, setEscrowList] = useState<EscrowTransaction[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [autoReleaseEscrow, setAutoReleaseEscrow] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'vendors' | 'products' | 'escrow' | 'orders' | 'architecture' | 'setup'>('vendors');
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Reject modal state
  const [rejectingVendor, setRejectingVendor] = useState<VendorProfile | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Action loading states
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    loadAdminData();
  }, [role, token]);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      // 1. Stats
      const sRes = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (sRes.ok) {
        const sData = await sRes.json();
        setStats(sData.stats);
      }

      // 2. Vendors
      const vRes = await fetch('/api/admin/vendors', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (vRes.ok) {
        const vData = await vRes.json();
        setVendors(vData.vendors || []);
      }

      // 3. Escrow
      const eRes = await fetch('/api/admin/escrow', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (eRes.ok) {
        const eData = await eRes.json();
        setEscrowList(eData.transactions || []);
      }

      // 4. Orders
      const oRes = await fetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (oRes.ok) {
        const oData = await oRes.json();
        setOrders(oData.orders || []);
      }

      // 5. Admin Products Queue
      const pRes = await fetch('/api/admin/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (pRes.ok) {
        const pData = await pRes.json();
        setProducts(pData.products || []);
      }

      // 6. Escrow Settings
      const setRes = await fetch('/api/admin/escrow/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (setRes.ok) {
        const setData = await setRes.json();
        setAutoReleaseEscrow(!!setData.autoReleaseEscrow);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAutoRelease = async () => {
    try {
      const res = await fetch('/api/admin/escrow/settings/auto-release', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setAutoReleaseEscrow(data.autoReleaseEscrow);
        setFeedback(
          data.autoReleaseEscrow
            ? 'Platform settlement set to AUTOMATED payout on buyer delivery confirmation.'
            : 'Platform settlement set to MANUAL admin approval mode.'
        );
      }
    } catch (err) {
      console.error('Failed to toggle auto release:', err);
    }
  };

  const handleApproveProduct = async (productId: string) => {
    setProcessingId(productId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/products/${productId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, is_approved_by_admin: true } : p))
        );
        setFeedback(`Product "${data.product?.title || 'Item'}" is now approved and live on marketplace.`);
      }
    } catch (err) {
      console.error('Failed to approve product:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveVendor = async (vendorId: string) => {
    setProcessingId(vendorId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/vendors/${vendorId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Approval failed.');

      setFeedback(data.message);
      await loadAdminData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingVendor) return;
    setProcessingId(rejectingVendor.id);
    try {
      const res = await fetch(`/api/admin/vendors/${rejectingVendor.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Rejection failed.');

      setFeedback(data.message);
      setRejectingVendor(null);
      setRejectReason('');
      await loadAdminData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReleaseEscrow = async (orderId: string) => {
    setProcessingId(orderId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/escrow/${orderId}/release`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to release payout.');

      setFeedback(data.message);
      await loadAdminData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredVendors = vendors.filter((v) => {
    if (vendorFilter === 'pending') return !v.is_approved && !v.rejection_reason;
    if (vendorFilter === 'approved') return v.is_approved;
    return true;
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Executive Header */}
      <div className="bg-[#15151a] border border-red-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-950/40 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <WalletPanel token={token} role="admin" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white font-cinzel">WebNexa Executive Oversight</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-900/60 text-red-300 border border-red-500/40 uppercase tracking-widest font-mono">
                  {admin?.privilege_level || 'SUPER_ADMIN'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Signed in as: <span className="text-zinc-200 font-semibold">{admin?.name}</span> ({admin?.email}) •
                Strict MySQL Table Separation Enforcement
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAdminData}
              className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700 transition-colors"
            >
              Refresh Platform State
            </button>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#18181e] border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Total Payments Pending Settlement</span>
            <Lock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black font-mono text-purple-300">
            ₦{(stats?.totalEscrowHeld || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Locked in vault awaiting delivery</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#18181e] border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Total Payouts Released</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">
            ₦{(stats?.totalEscrowReleased || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Disbursed to verified merchant accounts</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#18181e] border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Pending Vendor Approvals</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-300">
            {stats?.pendingVendors || 0}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Awaiting CAC & bank audit</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#18181e] border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Marketplace Gross (GMV)</span>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black font-mono text-metallic-gold">
            ₦{(stats?.totalGmv || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Across all order transactions</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab('vendors')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'vendors'
              ? 'bg-purple-900/40 text-purple-200 border border-purple-500/30'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Vendor Onboarding ({stats?.pendingVendors || 0} Pending)</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'products'
              ? 'bg-purple-900/40 text-purple-200 border border-purple-500/30'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Product Moderation ({products.filter((p) => !p.is_approved_by_admin).length} Pending)</span>
        </button>

        <button
          onClick={() => setActiveTab('escrow')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'escrow'
              ? 'bg-purple-900/40 text-purple-200 border border-purple-500/30'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Platform-Managed Secure Settlement</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'bg-purple-900/40 text-purple-200 border border-purple-500/30'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>All Platform Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('architecture')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'architecture'
              ? 'bg-purple-900/40 text-purple-200 border border-purple-500/30'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>MySQL Schema & Sequelize Models</span>
        </button>

        <button
          onClick={() => setActiveTab('setup')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'setup'
              ? 'bg-purple-900/40 text-purple-200 border border-purple-500/30'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Setup & Paystack Testing Guide</span>
        </button>
      </div>

      {/* Tab 1: Vendor Approval Queue */}
      {activeTab === 'vendors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setVendorFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  vendorFilter === 'pending'
                    ? 'bg-amber-900/50 text-amber-300 border border-amber-500/40'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                Pending Verification ({stats?.pendingVendors || 0})
              </button>
              <button
                onClick={() => setVendorFilter('approved')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  vendorFilter === 'approved'
                    ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-500/40'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                Approved Merchants ({stats?.approvedVendors || 0})
              </button>
              <button
                onClick={() => setVendorFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  vendorFilter === 'all'
                    ? 'bg-zinc-700 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                All Applications ({vendors.length})
              </button>
            </div>
          </div>

          <div className="bg-[#18181e] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-[#131317] border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Business & Contact</th>
                    <th className="py-3 px-4">Company CAC / RC</th>
                    <th className="py-3 px-4">Settlement Bank & NUBAN</th>
                    <th className="py-3 px-4">Status in `vendors` Table</th>
                    <th className="py-3 px-4 text-right">Compliance Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80">
                  {filteredVendors.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-500">
                        No vendors found matching this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredVendors.map((v) => (
                      <tr key={v.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-bold text-white text-sm">{v.business_name}</div>
                          <div className="text-zinc-400 text-[11px]">
                            {v.contact_person} • {v.email}
                          </div>
                          <div className="text-zinc-500 text-[10px]">{v.phone}</div>
                        </td>

                        <td className="py-4 px-4">
                          <span className="font-mono bg-zinc-900 px-2 py-1 rounded text-purple-300 border border-zinc-700 text-xs">
                            {v.company_registration_no}
                          </span>
                          {v.tax_id && (
                            <div className="text-[10px] text-zinc-500 mt-1 font-mono">
                              TIN: {v.tax_id}
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <div className="font-medium text-zinc-200">{v.bank_name}</div>
                          <div className="font-mono text-zinc-400 text-[11px]">
                            Acct: {v.bank_account_number}
                          </div>
                          <div className="text-[10px] text-zinc-500 truncate max-w-[140px]">
                            {v.bank_account_name}
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          {v.is_approved ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1 w-max">
                              <CheckCircle2 className="w-3 h-3" />
                              Approved & Active
                            </span>
                          ) : v.rejection_reason ? (
                            <div>
                              <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-semibold flex items-center gap-1 w-max">
                                <XCircle className="w-3 h-3" />
                                Application Rejected
                              </span>
                              <p className="text-[10px] text-zinc-500 mt-1 max-w-xs truncate">
                                Reason: {v.rejection_reason}
                              </p>
                            </div>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-semibold flex items-center gap-1 w-max">
                              <Clock className="w-3 h-3" />
                              Pending Approval
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-right">
                          {!v.is_approved ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleApproveVendor(v.id)}
                                disabled={processingId === v.id}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-1 shadow"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approve Seller</span>
                              </button>
                              <button
                                onClick={() => setRejectingVendor(v)}
                                className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-red-950/60 hover:text-red-300 text-zinc-400 border border-zinc-700 text-xs transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-zinc-500 font-mono">
                              Approved on{' '}
                              {v.approved_at ? new Date(v.approved_at).toLocaleDateString() : 'Active'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Product Moderation Queue (Jumia-style catalog verification) */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-semibold block mb-1">Catalog Review & Quality Moderation</span>
              <p className="text-[11px] text-zinc-400">
                To guarantee genuine computing, electronics, and solar items, vendor listings undergo admin inspection before appearing on the public marketplace.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 rounded-lg bg-zinc-800 text-zinc-300 font-mono text-xs">
                {products.filter((p) => p.is_approved_by_admin).length} Active Listings
              </span>
              <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono text-xs">
                {products.filter((p) => !p.is_approved_by_admin).length} Pending Review
              </span>
            </div>
          </div>

          <div className="bg-[#18181e] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-[#131317] border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Product Info</th>
                    <th className="py-3 px-4">Vendor / Store</th>
                    <th className="py-3 px-4">Category / Brand</th>
                    <th className="py-3 px-4">Price / Stock</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Moderation Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-500">
                        No vendor products listed yet.
                      </td>
                    </tr>
                  ) : (
                    products.map((prod) => (
                      <tr key={prod.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={prod.images?.[0] || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=120&q=80'}
                              alt={prod.title}
                              className="w-12 h-12 rounded-lg object-cover bg-zinc-800 shrink-0 border border-zinc-700"
                            />
                            <div className="min-w-0 max-w-xs">
                              <p className="font-semibold text-zinc-100 truncate">{prod.title}</p>
                              <p className="text-[11px] text-zinc-400 truncate">{prod.description}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="text-zinc-200 font-medium">{prod.vendor_name}</div>
                          {prod.is_official_store && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold inline-block mt-0.5">
                              Official Brand Store
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-medium">
                            {prod.category}
                          </span>
                          {prod.brand && (
                            <div className="text-[10px] text-zinc-400 mt-1 font-mono">{prod.brand}</div>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <div className="font-mono font-bold text-metallic-gold">
                            ₦{prod.price.toLocaleString()}
                          </div>
                          <div className="text-zinc-500 text-[10px]">
                            Qty: {prod.inventory_count} in stock
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          {prod.is_approved_by_admin ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1 w-max">
                              <CheckCircle2 className="w-3 h-3" />
                              Approved & Live
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-semibold flex items-center gap-1 w-max">
                              <Clock className="w-3 h-3" />
                              Pending Approval
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-right">
                          {!prod.is_approved_by_admin ? (
                            <button
                              onClick={() => handleApproveProduct(prod.id)}
                              disabled={processingId === prod.id}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-1 shadow ml-auto"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{processingId === prod.id ? 'Approving...' : 'Approve & Publish'}</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-400 font-semibold flex items-center justify-end gap-1">
                              <Check className="w-3.5 h-3.5" /> Published
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Secure Settlement Moderation */}
      {activeTab === 'escrow' && (
        <div className="space-y-4">
          {/* Settlement automation toggle banner */}
          <div className="p-4 rounded-xl bg-[#18181e] border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-center shrink-0">
                <Sliders className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-zinc-100 flex items-center gap-2">
                  <span>WebNexa Payout Release Policy</span>
                  {autoReleaseEscrow ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
                      Automated Mode
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-semibold border border-amber-500/30">
                      Manual Admin Approval
                    </span>
                  )}
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {autoReleaseEscrow
                    ? 'When a buyer confirms receipt, the platform immediately and automatically credits the vendor wallet.'
                    : 'When a buyer confirms receipt, payments remain pending until an administrator conducts the final payout disbursement.'}
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleAutoRelease}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shrink-0 ${
                autoReleaseEscrow
                  ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
              }`}
            >
              {autoReleaseEscrow ? (
                <>
                  <ToggleRight className="w-5 h-5 text-emerald-400" />
                  <span>Switch to Manual Release</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-5 h-5 text-zinc-400" />
                  <span>Enable Auto-Release on Delivery</span>
                </>
              )}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-purple-200">
            <span className="font-semibold block mb-1">WebNexa Secure Settlement State Protocol</span>
            <p className="text-[11px] text-zinc-400">
              Payments are safely processed through Platform-Managed Secure Settlement (via Paystack gateway). Administrators monitor tracking waybills, resolve fulfillment disputes, and audit vendor settlements.
            </p>
          </div>

          <div className="bg-[#18181e] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-[#131317] border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Order / Paystack Ref</th>
                    <th className="py-3 px-4">Buyer</th>
                    <th className="py-3 px-4">Vendor</th>
                    <th className="py-3 px-4">Vault Amount</th>
                    <th className="py-3 px-4">Settlement Status</th>
                    <th className="py-3 px-4 text-right">Settlement Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80">
                  {escrowList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-500">
                        No payment settlements logged yet.
                      </td>
                    </tr>
                  ) : (
                    escrowList.map((tx) => {
                      const relatedOrder = orders.find((o) => o.id === tx.order_id);
                      const isDelivered = relatedOrder?.status === 'DELIVERED';
                      const isReleased = tx.escrow_status === 'RELEASED_TO_VENDOR';

                      return (
                        <tr key={tx.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="py-4 px-4">
                            <div className="font-mono font-bold text-white">{tx.order_number}</div>
                            <div className="font-mono text-purple-400 text-[10px] mt-0.5">
                              {tx.paystack_reference}
                            </div>
                          </td>

                          <td className="py-4 px-4 text-zinc-200">{tx.buyer_name}</td>
                          <td className="py-4 px-4 text-zinc-200">{tx.vendor_name}</td>

                          <td className="py-4 px-4">
                            <span className="font-mono font-bold text-metallic-gold text-sm">
                              ₦{tx.amount.toLocaleString()}
                            </span>
                          </td>

                          <td className="py-4 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isReleased
                                  ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-purple-900/50 text-purple-300 border border-purple-500/30'
                              }`}
                            >
                              {tx.escrow_status}
                            </span>
                            {relatedOrder && (
                              <div className="text-[10px] text-zinc-400 mt-1">
                                Order Delivery: <span className="font-bold text-zinc-300">{relatedOrder.status}</span>
                              </div>
                            )}
                          </td>

                          <td className="py-4 px-4 text-right">
                            {!isReleased ? (
                              <button
                                onClick={() => handleReleaseEscrow(tx.order_id)}
                                disabled={processingId === tx.order_id}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  isDelivered
                                    ? 'cta-gradient text-white shadow-lg hover:opacity-90'
                                    : 'bg-zinc-800 hover:bg-zinc-700 text-purple-300 border border-purple-500/30'
                                }`}
                                title={
                                  isDelivered
                                    ? 'Buyer has confirmed delivery! Click to release payout to vendor.'
                                    : 'Admin Override: Release payout directly to vendor'
                                }
                              >
                                {isDelivered ? 'Release Payout (Delivered)' : 'Release Payout to Vendor'}
                              </button>
                            ) : (
                              <div className="text-emerald-400 text-[11px] font-semibold flex items-center justify-end gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Released by {tx.released_by_admin_name || 'Admin'}</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: All Marketplace Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="bg-[#18181e] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-[#131317] border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Order Details</th>
                    <th className="py-3 px-4">Buyer</th>
                    <th className="py-3 px-4">Vendor</th>
                    <th className="py-3 px-4">Total / Platform Fee</th>
                    <th className="py-3 px-4">Carrier Tracking</th>
                    <th className="py-3 px-4">Lifecycle Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-mono font-bold text-white">{o.order_number}</div>
                        <div className="text-zinc-500 text-[10px]">
                          {new Date(o.created_at).toLocaleString()}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="text-zinc-200 font-medium">{o.buyer_name}</div>
                        <div className="text-zinc-500 text-[10px]">{o.shipping_address.city}, {o.shipping_address.state}</div>
                      </td>

                      <td className="py-4 px-4 text-zinc-200 font-medium">{o.vendor_name}</td>

                      <td className="py-4 px-4">
                        <div className="font-mono font-bold text-metallic-gold">
                          ₦{o.total_amount.toLocaleString()}
                        </div>
                        <div className="text-zinc-500 text-[10px]">Fee: ₦{o.escrow_fee.toLocaleString()}</div>
                      </td>

                      <td className="py-4 px-4">
                        {o.carrier_name ? (
                          <div>
                            <div className="text-zinc-300 font-medium">{o.carrier_name}</div>
                            <div className="font-mono text-purple-400 text-[10px]">{o.tracking_number}</div>
                          </div>
                        ) : (
                          <span className="text-zinc-500 italic">Not shipped yet</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            o.status === 'ESCROW_RELEASED'
                              ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-500/30'
                              : o.status === 'DELIVERED'
                              ? 'bg-amber-900/50 text-amber-300 border border-amber-500/30'
                              : o.status === 'SHIPPED'
                              ? 'bg-blue-900/50 text-blue-300 border border-blue-500/30'
                              : 'bg-purple-900/50 text-purple-300 border border-purple-500/30'
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: MySQL Schema & Architecture Inspector */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          <div className="bg-[#18181e] border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white font-cinzel">
                  MySQL Relational Architecture (Strict Table Separation)
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Normalized MySQL DDL demonstrating separate <code className="text-purple-400">buyers</code> and{' '}
                  <code className="text-purple-400">vendors</code> tables with foreign keys.
                </p>
              </div>
              <button
                onClick={() =>
                  handleCopy(`-- WebNexa MySQL DDL
CREATE TABLE buyers (
  id VARCHAR(36) PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30) NULL,
  shipping_address_line1 VARCHAR(255) NULL,
  city VARCHAR(80) NULL,
  state VARCHAR(80) NULL,
  country VARCHAR(60) NOT NULL DEFAULT 'Nigeria',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vendors (
  id VARCHAR(36) PRIMARY KEY,
  business_name VARCHAR(160) NOT NULL,
  contact_person VARCHAR(120) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  company_registration_no VARCHAR(80) NOT NULL UNIQUE,
  bank_name VARCHAR(100) NOT NULL,
  bank_account_number VARCHAR(30) NOT NULL,
  bank_account_name VARCHAR(150) NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  wallet_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00
);`)
                }
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy DDL Snippet'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                <span className="font-bold text-emerald-400 font-mono block">TABLE: `buyers`</span>
                <p className="text-zinc-400 text-[11px]">
                  Holds retail consumer credentials, shipping addresses, phone numbers, and profile timestamps. Completely isolated from vendor payouts.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                <span className="font-bold text-purple-400 font-mono block">TABLE: `vendors`</span>
                <p className="text-zinc-400 text-[11px]">
                  Holds merchant legal corporate registration (CAC/RC), settlement bank details, verification flags (<code className="text-amber-300">is_approved</code>), and wallet ledger balances.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                <span className="font-bold text-red-400 font-mono block">TABLE: `admins`</span>
                <p className="text-zinc-400 text-[11px]">
                  Executive compliance credentials, audit trails, and role designations (SUPER_ADMIN, ESCROW_OFFICER).
                </p>
              </div>
            </div>

            {/* SQL Code Block */}
            <div className="bg-[#111114] border border-zinc-800 rounded-xl p-4 overflow-x-auto text-[11px] font-mono text-zinc-300 max-h-80">
              <pre>{`-- WebNexa Multi-Vendor Relational Schema
-- Located at /server/database/schema.sql

CREATE TABLE admins (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  privilege_level ENUM('SUPER_ADMIN', 'ESCROW_OFFICER', 'COMPLIANCE_MANAGER') DEFAULT 'SUPER_ADMIN',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE buyers (
  id VARCHAR(36) PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30) NULL,
  shipping_address_line1 VARCHAR(255) NULL,
  city VARCHAR(80) NULL,
  state VARCHAR(80) NULL,
  country VARCHAR(60) NOT NULL DEFAULT 'Nigeria',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vendors (
  id VARCHAR(36) PRIMARY KEY,
  business_name VARCHAR(160) NOT NULL,
  contact_person VARCHAR(120) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  company_registration_no VARCHAR(80) NOT NULL UNIQUE, -- CAC / RC Number
  bank_name VARCHAR(100) NOT NULL,
  bank_account_number VARCHAR(30) NOT NULL,
  bank_account_name VARCHAR(150) NOT NULL,
  bank_code VARCHAR(20) NOT NULL DEFAULT '057',
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  rejection_reason TEXT NULL,
  approved_by_admin_id VARCHAR(36) NULL,
  wallet_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (approved_by_admin_id) REFERENCES admins(id)
);

CREATE TABLE products (
  id VARCHAR(36) PRIMARY KEY,
  vendor_id VARCHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  price DECIMAL(15, 2) NOT NULL,
  inventory_count INT NOT NULL DEFAULT 0,
  category VARCHAR(80) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);

CREATE TABLE orders (
  id VARCHAR(36) PRIMARY KEY,
  order_number VARCHAR(60) NOT NULL UNIQUE,
  buyer_id VARCHAR(36) NOT NULL,
  vendor_id VARCHAR(36) NOT NULL,
  total_amount DECIMAL(15, 2) NOT NULL,
  escrow_fee DECIMAL(15, 2) NOT NULL,
  vendor_payout_amount DECIMAL(15, 2) NOT NULL,
  status ENUM('PENDING_PAYMENT', 'HELD_IN_ESCROW', 'SHIPPED', 'DELIVERED', 'ESCROW_RELEASED') NOT NULL,
  FOREIGN KEY (buyer_id) REFERENCES buyers(id),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id)
);

CREATE TABLE escrow_transactions (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL UNIQUE,
  paystack_reference VARCHAR(120) NOT NULL UNIQUE,
  amount DECIMAL(15, 2) NOT NULL,
  escrow_status ENUM('HOLDING', 'RELEASED_TO_VENDOR', 'REFUNDED_TO_BUYER') NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);`}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Setup & WebNexa Secure Settlement Testing Guide */}
      {activeTab === 'setup' && (
        <div className="space-y-6">
          <div className="bg-[#18181e] border border-zinc-800 rounded-2xl p-6 space-y-5">
            <div>
              <h3 className="text-base font-bold text-white font-cinzel">
                Local MySQL Migration & WebNexa Secure Settlement Testing Guide
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Comprehensive step-by-step instructions for running migrations on your local machine and executing the secure payment lifecycle.
              </p>
            </div>

            <div className="space-y-4 text-xs text-zinc-300">
              {/* Step 1 */}
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-white text-sm">
                  <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs">
                    1
                  </span>
                  <span>Setting Up MySQL & Running Migrations</span>
                </div>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  WebNexa provides raw DDL scripts in <code className="text-purple-400">/server/database/schema.sql</code> and programmatic Sequelize models in <code className="text-purple-400">/server/database/sequelizeModels.ts</code>.
                </p>
                <div className="bg-black/60 p-3 rounded-lg font-mono text-[11px] text-zinc-300 space-y-1">
                  <p className="text-zinc-500"># Log into your MySQL CLI or workbench</p>
                  <p>mysql -u root -p</p>
                  <p className="text-zinc-500"># Create database</p>
                  <p>CREATE DATABASE webnexa_marketplace CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;</p>
                  <p className="text-zinc-500"># Run the full schema</p>
                  <p>mysql -u root -p webnexa_marketplace &lt; server/database/schema.sql</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-white text-sm">
                  <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs">
                    2
                  </span>
                  <span>Environment Variables Configuration (.env)</span>
                </div>
                <p className="text-zinc-400 text-[11px]">
                  Configure your MySQL connection string and Paystack test keys:
                </p>
                <div className="bg-black/60 p-3 rounded-lg font-mono text-[11px] text-zinc-300 space-y-1">
                  <p>DB_HOST=localhost</p>
                  <p>DB_PORT=3306</p>
                  <p>DB_USER=root</p>
                  <p>DB_PASSWORD=your_mysql_password</p>
                  <p>DB_NAME=webnexa_marketplace</p>
                  <p>JWT_SECRET=your_long_random_secret</p>
                  <p>PAYSTACK_SECRET_KEY=your_paystack_secret_key</p>
                  <p>PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxx</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-white text-sm">
                  <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs">
                    3
                  </span>
                  <span>Testing the 5-Stage WebNexa Secure Settlement Protocol (with Paystack Gateway)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-center text-[10px] pt-1">
                  <div className="p-2.5 rounded-lg bg-zinc-800 border border-zinc-700">
                    <span className="font-bold text-zinc-300 block mb-1">Stage 1</span>
                    <span className="text-zinc-400">PENDING_PAYMENT</span>
                    <p className="text-[9px] text-zinc-500 mt-1">Buyer checks out; Paystack session initialized.</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-purple-950/40 border border-purple-500/40">
                    <span className="font-bold text-purple-300 block mb-1">Stage 2</span>
                    <span className="text-purple-200">HELD_IN_ESCROW</span>
                    <p className="text-[9px] text-zinc-400 mt-1">Paystack charges card. WebNexa locks deposit in vault.</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-500/40">
                    <span className="font-bold text-blue-300 block mb-1">Stage 3</span>
                    <span className="text-blue-200">SHIPPED</span>
                    <p className="text-[9px] text-zinc-400 mt-1">Vendor provides carrier waybill & tracking number.</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/40">
                    <span className="font-bold text-amber-300 block mb-1">Stage 4</span>
                    <span className="text-amber-200">DELIVERED</span>
                    <p className="text-[9px] text-zinc-400 mt-1">Buyer receives goods and clicks "Confirm Delivery".</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40">
                    <span className="font-bold text-emerald-300 block mb-1">Stage 5</span>
                    <span className="text-emerald-200">ESCROW_RELEASED</span>
                    <p className="text-[9px] text-zinc-400 mt-1">Admin authorizes payout to vendor settlement bank.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#18181e] border border-red-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white font-cinzel">
              Reject Vendor: {rejectingVendor.business_name}
            </h3>
            <p className="text-xs text-zinc-400">
              Please specify the compliance reason for rejecting CAC registration #
              {rejectingVendor.company_registration_no}.
            </p>

            <form onSubmit={handleRejectVendor} className="space-y-3 text-xs">
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. CAC number could not be validated on the corporate registry portal."
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-red-500"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingVendor(null)}
                  className="flex-1 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingId === rejectingVendor.id}
                  className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
