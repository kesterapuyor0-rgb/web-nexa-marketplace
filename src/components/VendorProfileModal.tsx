import React, { useEffect, useState } from 'react';
import { CheckCircle2, Star, X } from 'lucide-react';
import { Product, VendorReview, VendorProfile } from '../types.ts';

interface VendorProfileResponse {
  vendor: VendorProfile;
  products: Product[];
  reviews: VendorReview[];
  rating: { average_rating: number; review_count: number };
}

interface VendorProfileModalProps {
  vendorId: string;
  vendorName: string;
  onClose: () => void;
}

export const VendorProfileModal: React.FC<VendorProfileModalProps> = ({ vendorId, vendorName, onClose }) => {
  const [profile, setProfile] = useState<VendorProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/vendors/${encodeURIComponent(vendorId)}/profile`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load vendor profile.');
        if (active) setProfile(data);
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load vendor profile.');
      });
    return () => { active = false; };
  }, [vendorId]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-zinc-700 bg-[#18181e] text-zinc-100 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-zinc-800 p-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-300">Verified vendor profile</p>
            <h2 className="mt-1 text-2xl font-bold">{profile?.vendor.business_name || vendorName}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white" aria-label="Close vendor profile"><X className="h-5 w-5" /></button>
        </div>
        {error && <p className="m-5 rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-200">{error}</p>}
        {!profile && !error && <p className="p-8 text-center text-sm text-zinc-400">Loading vendor profile...</p>}
        {profile && (
          <div className="space-y-6 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <img src={profile.vendor.store_logo_url} alt={`${profile.vendor.business_name} logo`} className="h-20 w-20 rounded-2xl border border-zinc-700 bg-zinc-900 object-cover" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold">{profile.vendor.business_name}</h3>
                  {profile.vendor.is_approved && <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-300"><CheckCircle2 className="h-3 w-3" /> Verified merchant</span>}
                </div>
                <p className="mt-1 text-sm text-zinc-400">{profile.vendor.store_description || 'WebNexa marketplace vendor.'}</p>
                <div className="mt-2 flex items-center gap-2 text-sm text-amber-300"><Star className="h-4 w-4 fill-current" /> {profile.rating.average_rating ? profile.rating.average_rating.toFixed(1) : 'No rating yet'} <span className="text-xs text-zinc-500">({profile.rating.review_count} reviews)</span></div>
              </div>
            </div>
            <div>
              <h3 className="mb-3 font-semibold">Products from {profile.vendor.business_name}</h3>
              {profile.products.length === 0 ? <p className="text-sm text-zinc-500">No active products are currently listed.</p> : <div className="grid gap-3 sm:grid-cols-2">{profile.products.map((product) => <div key={product.id} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3"><p className="font-medium">{product.title}</p><p className="mt-1 text-sm text-purple-300">₦{product.price.toLocaleString()}</p></div>)}</div>}
            </div>
            <div>
              <h3 className="mb-3 font-semibold">Buyer ratings and reviews</h3>
              {profile.reviews.length === 0 ? <p className="text-sm text-zinc-500">No verified buyer reviews yet.</p> : <div className="space-y-3">{profile.reviews.map((review) => <article key={review.id} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3"><div className="flex items-center gap-1 text-amber-300">{[1, 2, 3, 4, 5].map((star) => <Star key={star} className={`h-3.5 w-3.5 ${star <= review.rating ? 'fill-current' : 'text-zinc-700'}`} />)}</div>{review.review_text && <p className="mt-2 text-sm text-zinc-300">{review.review_text}</p>}<p className="mt-2 text-[10px] text-zinc-500">Verified purchase · {new Date(review.created_at).toLocaleDateString()}</p></article>)}</div>}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
