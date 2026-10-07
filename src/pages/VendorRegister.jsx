import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { AuthShell } from "../components/AuthShell.jsx";
import { PhoneInput } from "../components/PhoneInput.jsx";
import {
  Building,
  Lock,
  CreditCard,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  Eye,
  EyeOff
} from "lucide-react";
export const VendorRegister = () => {
  const [formData, setFormData] = useState({
    business_name: "",
    contact_person: "",
    email: "",
    password: "",
    phone: "",
    city: "",
    state: "",
    country: "Nigeria",
    company_registration_no: "",
    tax_id: "",
    bank_name: "Zenith Bank PLC",
    bank_account_number: "",
    bank_account_name: "",
    bank_code: "057",
    store_description: "",
    business_category: "GENERAL",
    restaurant_business_type: "",
    operating_hours: "",
    delivery_radius_km: "10",
    preparation_time_mins: "30",
    hygiene_badges: "",
    store_logo_url: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const { loginVendor } = useAuth();
  const navigate = useNavigate();
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setError("Please choose a JPEG, PNG, WEBP, or GIF logo.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Logo files must be 5 MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setFormData((current) => ({ ...current, store_logo_url: reader.result }));
        setError(null);
      }
    };
    reader.onerror = () => setError("Unable to read the logo file.");
    reader.readAsDataURL(file);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Vendor registration submit clicked");
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/vendor/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Vendor onboarding failed.");
      }
      loginVendor(data.token, data.vendor);
      navigate("/vendor/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  return <AuthShell
    title="Apply for merchant verification"
    description="Create a verified vendor profile to bring your catalog to WebNexa buyers."
    isVendor
  >

        {
    /* Important Onboarding Protocol Notice */
  }
        <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-amber-300 block">
              Architectural Separation & Verification Policy
            </span>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              Vendor credentials and company registration records are stored in the distinct <code className="text-amber-400 bg-amber-950/60 px-1 rounded">vendors</code> table with <code className="text-amber-400 bg-amber-950/60 px-1 rounded">is_approved: false</code> by default. You will not be permitted to publish products until verification by The WebNexa Platform is complete.
            </p>
          </div>
        </div>

        {error && <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {
    /* Section 1: Business Identification */
  }
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" />
              <span>1. Corporate Identification</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <label className="block text-zinc-400 mb-1">Registered Business Name *</label>
                <input
    type="text"
    name="business_name"
    required
    value={formData.business_name}
    onChange={handleChange}
    placeholder="e.g. Apex Precision Electronics Ltd"
    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-purple-500"
  />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Contact Officer Name *</label>
                <input
    type="text"
    name="contact_person"
    required
    value={formData.contact_person}
    onChange={handleChange}
    placeholder="e.g. Emeka Okafor"
    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-purple-500"
  />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Company CAC/RC Registration Number *</label>
                <input
    type="text"
    name="company_registration_no"
    required
    value={formData.company_registration_no}
    onChange={handleChange}
    placeholder="e.g. RC-1849204"
    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-purple-500 font-mono"
  />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Tax Identification Number (TIN)</label>
                <input
    type="text"
    name="tax_id"
    value={formData.tax_id}
    onChange={handleChange}
    placeholder="e.g. TIN-90823412"
    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-purple-500 font-mono"
  />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Business City</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="e.g. Lagos" className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">State / Province</label>
                <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="e.g. Lagos State" className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Country</label>
                <input type="text" name="country" value={formData.country} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-purple-500" />
              </div>
            </div>
          </div>

          {
    /* Section 2: Contact & Access */
  }
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-400">Food & Restaurant Profile</h4>
            <select name="business_category" value={formData.business_category} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white">
              <option value="GENERAL">General marketplace vendor</option>
              <option value="RESTAURANT_FOOD">Restaurant / Food Vendor</option>
            </select>
            {formData.business_category === "RESTAURANT_FOOD" && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-zinc-400 mb-1">Restaurant / Brand Logo</label>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleLogoChange} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-zinc-300" />
                {formData.store_logo_url && <img src={formData.store_logo_url} alt="Logo preview" className="mt-2 h-16 w-16 rounded-xl border border-zinc-700 object-cover" />}
              </div>
              <input name="restaurant_business_type" value={formData.restaurant_business_type} onChange={handleChange} placeholder="Business type (Bakery, Fine Dining...)" className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white" />
              <input name="operating_hours" value={formData.operating_hours} onChange={handleChange} placeholder="Operating hours (09:00 - 22:00)" className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white" />
              <input type="number" name="delivery_radius_km" value={formData.delivery_radius_km} onChange={handleChange} placeholder="Delivery radius (km)" className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white" />
              <input type="number" name="preparation_time_mins" value={formData.preparation_time_mins} onChange={handleChange} placeholder="Prep time (minutes)" className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white" />
              <input name="hygiene_badges" value={formData.hygiene_badges} onChange={handleChange} placeholder="Hygiene badges (comma separated)" className="sm:col-span-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white" />
            </div>}
          </div>

          {
    /* Section 2: Contact & Access */
  }
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>2. Portal Access & Contact</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-zinc-400 mb-1">Official Business Email *</label>
                <input
    type="email"
    name="email"
    required
    value={formData.email}
    onChange={handleChange}
    placeholder="seller@company.ng"
    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-purple-500"
  />
              </div>

              <div className="relative">
                <label className="block text-zinc-400 mb-1">Portal Password *</label>
                <input
    type={showPassword ? "text" : "password"}
    name="password"
    required
    value={formData.password}
    onChange={handleChange}
    placeholder="••••••••"
    className="auth-input w-full px-3 py-3 pr-10"
  />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-500 hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Official Contact Phone *</label>
                <PhoneInput value={formData.phone} onChange={(phone) => setFormData({ ...formData, phone })} required />
              </div>
            </div>
          </div>

          {
    /* Section 3: Bank / Settlement Account */
  }
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              <span>3. Vendor Payout Bank Account</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-zinc-400 mb-1">Settlement Bank *</label>
                <select
    name="bank_name"
    value={formData.bank_name}
    onChange={handleChange}
    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-purple-500"
  >
                  <option value="Zenith Bank PLC">Zenith Bank PLC</option>
                  <option value="Guaranty Trust Bank (GTBank)">Guaranty Trust Bank</option>
                  <option value="Access Bank PLC">Access Bank PLC</option>
                  <option value="First Bank of Nigeria">First Bank of Nigeria</option>
                  <option value="United Bank for Africa (UBA)">UBA</option>
                  <option value="Stanbic IBTC Bank">Stanbic IBTC Bank</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">NUBAN Account Number *</label>
                <input
    type="text"
    name="bank_account_number"
    required
    value={formData.bank_account_number}
    onChange={handleChange}
    placeholder="10-digit NUBAN"
    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-purple-500 font-mono"
  />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Account Holder Name</label>
                <input
    type="text"
    name="bank_account_name"
    value={formData.bank_account_name}
    onChange={handleChange}
    placeholder="Official registered entity"
    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-purple-500"
  />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Catalog Specialization / Description</label>
            <textarea
    name="store_description"
    rows={2}
    value={formData.store_description}
    onChange={handleChange}
    placeholder="Describe the hardware, gear, or systems your firm specializes in distributing..."
    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-purple-500"
  />
          </div>

          <div className="flex gap-2 pt-2">
            <button
    type="submit"
    onClick={() => console.log("Vendor registration button clicked")}
    disabled={isLoading}
    className="relative z-50 flex-1 cursor-pointer pointer-events-auto py-3 px-4 rounded-xl cta-gradient text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 hover:opacity-95 transition-all disabled:cursor-not-allowed disabled:opacity-50"
  >
              {isLoading ? <span>Registering Vendor Record...</span> : <>
                  <span>Submit Vendor Application</span>
                  <ArrowRight className="w-4 h-4" />
                </>}
            </button>
          </div>
        </form>

    </AuthShell>;
};
