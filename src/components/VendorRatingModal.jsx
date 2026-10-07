import { useState } from "react";
import { Star, Upload, X, ShieldCheck } from "lucide-react";
export const VendorRatingModal = ({ order, vendorId, vendorName, token, onClose, onSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!rating) {
      setError("Select a star rating before submitting.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/vendor-reviews", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: vendorId,
          order_id: order.id,
          rating,
          review_text: reviewText,
          photo_url: photoUrl
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save your review.");
      onSubmitted("Thanks. Your verified vendor review has been published.");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-[#18181e] p-6 text-zinc-100 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified purchase
            </span>
            <h2 className="mt-2 text-xl font-bold text-white">Rate & Review Vendor</h2>
            <p className="mt-1 text-xs text-zinc-400">{vendorName} • {order.order_number}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white" title="Close review">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <p className="text-xs font-semibold text-zinc-300">Vendor service and product quality</p>
            <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Vendor rating">
              {[1, 2, 3, 4, 5].map((value) => <button
    key={value}
    type="button"
    onClick={() => setRating(value)}
    className="rounded-lg p-1 text-amber-400 transition-transform hover:scale-110"
    aria-label={`${value} star${value === 1 ? "" : "s"}`}
    aria-pressed={rating === value}
  >
                  <Star className={`h-8 w-8 ${value <= rating ? "fill-amber-400" : "fill-transparent text-zinc-600"}`} />
                </button>)}
            </div>
          </div>

          <label className="block text-xs font-semibold text-zinc-300">
            Review (optional)
            <textarea
    value={reviewText}
    onChange={(event) => setReviewText(event.target.value)}
    rows={4}
    maxLength={2e3}
    placeholder="Tell other buyers about the vendor experience and product quality."
    className="mt-2 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-xs text-white outline-none focus:border-purple-500"
  />
          </label>

          <div>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-zinc-700 px-3 py-3 text-xs text-zinc-300 hover:border-purple-500">
              <Upload className="h-4 w-4 text-purple-400" />
              <span>{photoUrl ? "Product photo attached" : "Upload product photo (optional)"}</span>
              <input type="file" accept="image/*" onChange={handlePhotoChange} className="sr-only" />
            </label>
            {photoUrl && <img src={photoUrl} alt="Selected product" className="mt-2 h-20 w-20 rounded-lg object-cover" />}
          </div>

          {error && <p className="rounded-lg border border-red-500/30 bg-red-950/30 p-2.5 text-xs text-red-200">{error}</p>}

          <button type="submit" disabled={isSubmitting} className="w-full rounded-xl cta-gradient px-4 py-3 text-xs font-bold text-white disabled:opacity-50">
            {isSubmitting ? "Publishing Review..." : "Publish Verified Review"}
          </button>
        </form>
      </div>
    </div>;
};
