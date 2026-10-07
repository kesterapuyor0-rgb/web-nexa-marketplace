import { useState, useEffect } from "react";
import { ProductCartControl } from "../components/ProductCartControl.jsx";
import { ProductDetailsModal } from "../components/ProductDetailsModal.jsx";
import { Logo } from "../components/Logo.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { MARKETPLACE_CATEGORIES } from "../config/categories.js";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Flame,
  ChevronLeft,
  ChevronRight,
  Star,
  Store,
  Clock,
  Truck,
  Zap,
  Monitor,
  Wifi,
  Sun,
  Server,
  Building,
  BadgePercent,
  Layers,
  Utensils
} from "lucide-react";
export const MarketplaceHome = () => {
  const { token, role } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get("search") || "";
  const urlCategory = searchParams.get("category") || "All";
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locationInfo, setLocationInfo] = useState(null);
  const [catalogError, setCatalogError] = useState("");
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [selectedCategory, setSelectedCategory] = useState(urlCategory);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);
  useEffect(() => {
    setSearchQuery(urlSearch);
  }, [urlSearch]);
  useEffect(() => {
    setSelectedCategory(urlCategory);
  }, [urlCategory]);
  const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 24, seconds: 30 });
  const selectCategory = (category) => {
    const nextParams = new URLSearchParams(searchParams);
    if (category === "All") {
      nextParams.delete("category");
    } else {
      nextParams.set("category", category.toLowerCase());
    }
    setSearchParams(nextParams);
    window.requestAnimationFrame(() => {
      document.getElementById("product-catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };
  const categories = [
    { name: "All", icon: Layers, count: "All" },
    ...MARKETPLACE_CATEGORIES.filter((category) => category !== "Food & Drinks").map((name) => ({
      name,
      icon: name.includes("farm") || name.includes("provisions") || name.includes("Cosmetics") ? Utensils :
        name.includes("Computing") || name.includes("Infrastructure") ? Monitor :
          name.includes("Electronics") || name.includes("Phones") ? Zap :
            name.includes("Networking") ? Wifi :
              name.includes("Solar") ? Sun :
                name.includes("Home") ? Building : Layers,
      count: "Items"
    }))
  ];
  const promoSlides = [
    {
      id: 1,
      badge: "MEGA TECH EXPO \u2022 JUMIA-STYLE DEALS",
      title: "Enterprise Computing & Server Systems",
      subtitle: "Original hardware backed 100% by the WebNexa Buyer Protection Guard. Zero buyer risk.",
      highlight: "Up to 30% Off Commercial Rigs",
      ctaText: "Shop Computing",
      categoryFilter: "Computing",
      bgGradient: "from-purple-950/80 via-zinc-900 to-black",
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80"
    },
    {
      id: 2,
      badge: "OFFICIAL BRAND STORES",
      title: "Starlink & Enterprise Fiber Optics",
      subtitle: "High-speed gigabit satellite terminals and optical hardware directly from verified distributors.",
      highlight: "Free Express Shipping in Nigeria",
      ctaText: "Explore Networking",
      categoryFilter: "Networking & Optics",
      bgGradient: "from-blue-950/80 via-zinc-900 to-black",
      image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80"
    },
    {
      id: 3,
      badge: "CLEAN ENERGY REVOLUTION",
      title: "Solar Inverters & Lithium Storage Systems",
      subtitle: "Complete off-grid backup stations with certified manufacturer warranties.",
      highlight: "Instant Buyer Protection",
      ctaText: "View Solar Systems",
      categoryFilter: "Solar & Power Solutions",
      bgGradient: "from-amber-950/70 via-zinc-900 to-black",
      image: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&q=80"
    },
    {
      id: 4,
      badge: "WEBNEXA ESCROW VAULT",
      title: "Zero Risk Commerce with Paystack Gateway",
      subtitle: "Payment is securely held by the platform until you inspect and accept your package.",
      highlight: "Dispute Resolution Guaranteed",
      ctaText: "Browse All Catalog",
      categoryFilter: "All",
      bgGradient: "from-emerald-950/70 via-zinc-900 to-black",
      image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80"
    }
  ];
  useEffect(() => {
    loadProducts();
  }, [token, role]);
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % promoSlides.length);
    }, 6500);
    const countdownTimer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 6, minutes: 0, seconds: 0 };
      });
    }, 1e3);
    return () => {
      clearInterval(slideTimer);
      clearInterval(countdownTimer);
    };
  }, []);
  const loadProducts = async () => {
    setIsLoading(true);
    setCatalogError("");
    try {
      const res = await fetch("/api/products", {
        headers: token && role === "buyer" ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Product catalog is unavailable.");
      setProducts(data.products || []);
      setLocationInfo(data.location || null);
    } catch (e) {
      console.error("Failed to load products:", e);
      setCatalogError(e.message || "Product catalog is unavailable.");
      setProducts([]);
      setLocationInfo(null);
    } finally {
      setIsLoading(false);
    }
  };
  const filteredProducts = products.filter((p) => {
    const productCategory = String(p.category || "").toLowerCase();
    const matchesCat = selectedCategory === "All" || productCategory.includes(selectedCategory.toLowerCase()) || selectedCategory.toLowerCase().includes(productCategory);
    const query = searchQuery.trim().toLowerCase();
    const searchable = [p.title, p.description, p.vendor_name, p.brand, p.category, ...(p.tags || [])].filter(Boolean).join(" ").toLowerCase();
    const matchesSearch = !query || searchable.includes(query);
    return matchesCat && matchesSearch;
  });
  const buyerLocality = locationInfo?.buyer?.city || locationInfo?.buyer?.state || locationInfo?.buyer?.country;
  const flashSaleItems = products.filter((p) => p.discount_percent && p.discount_percent >= 10 || p.price > 4e5);
  return <div className="marketplace-home space-y-8 pb-20">
      {
    /* 1. TOP MARKETPLACE HERO WITH WEBNEXA TRUST WIDGET */
  }
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {
    /* Left: WebNexa brand and buyer protection trust widget */
  }
          <aside className="lg:col-span-3 bg-[#18181e] border border-zinc-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between min-h-0 lg:min-h-[340px]">
            <div className="space-y-4">
              <div className="flex flex-col items-center text-center gap-2 pb-4 border-b border-zinc-800">
                <Logo size="xl" showText={false} className="justify-center" />
                <div>
                  <h2 className="font-cinzel text-lg font-extrabold text-metallic-silver">Web<span className="text-metallic-gold">Nexa</span></h2>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Official Marketplace</p>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 text-xs text-zinc-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">100% Payout Protection</span>
                    <span className="text-[10px] text-zinc-400">The WebNexa Platform protects every settlement.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-zinc-200">
                  <Lock className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Zero Risk Payment Gateway</span>
                    <span className="text-[10px] text-zinc-400">Funds stay secured until delivery is confirmed.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-zinc-800 grid grid-cols-2 gap-3 text-center">
              <div>
                <span className="block text-lg font-black text-white">6</span>
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Tech Categories</span>
              </div>
              <div>
                <span className="block text-lg font-black text-white">100%</span>
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Verified Stores</span>
              </div>
            </div>
          </aside>

          {
    /* Center: Promotional Banner Carousel (Jumia-style) */
  }
          <div className="lg:col-span-9 relative bg-[#15151a] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl min-h-[340px] flex flex-col justify-between">
            {
    /* Active slide display */
  }
            <div className="relative flex-1 overflow-hidden">
              {promoSlides.map((slide, idx) => <div
    key={slide.id}
    className={`absolute inset-0 transition-opacity duration-700 ease-in-out flex flex-col justify-between p-6 sm:p-8 bg-gradient-to-r ${slide.bgGradient} ${idx === activeSlide ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}
  >
                  <div className="space-y-3 max-w-md relative z-10">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold border border-purple-500/30">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      {slide.badge}
                    </span>

                    <h2 className="text-xl sm:text-2xl font-black text-white font-cinzel leading-tight tracking-tight">
                      {slide.title}
                    </h2>

                    <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                      {slide.subtitle}
                    </p>

                    <div className="inline-block px-2.5 py-1 rounded-lg bg-black/50 border border-white/10 text-amber-300 text-xs font-bold font-mono">
                      {slide.highlight}
                    </div>
                  </div>

                  <div className="pt-4 relative z-10 flex items-center gap-3">
                    <button
    onClick={() => {
      if (slide.categoryFilter) selectCategory(slide.categoryFilter);
    }}
    className="px-4 py-2 rounded-xl cta-gradient text-white text-xs font-bold shadow-lg flex items-center gap-2 hover:scale-[1.02] transition-transform"
  >
                      <span>{slide.ctaText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] text-zinc-400">Buyer Protection Guard</span>
                  </div>

                  {
    /* Backdrop banner photo illustration with blend */
  }
                  <img
    src={slide.image}
    alt={slide.title}
    className="absolute right-0 top-0 bottom-0 w-1/2 h-full object-cover object-center opacity-25 mix-blend-screen pointer-events-none"
  />
                </div>)}
            </div>

            {
    /* Carousel navigation controls & dot indicators */
  }
            <div className="p-3 bg-[#111114]/90 border-t border-zinc-800/80 flex items-center justify-between z-20">
              <div className="flex gap-1.5">
                {promoSlides.map((_, i) => <button
    key={i}
    onClick={() => setActiveSlide(i)}
    className={`h-1.5 rounded-full transition-all ${i === activeSlide ? "w-6 bg-purple-400" : "w-2 bg-zinc-700 hover:bg-zinc-600"}`}
    title={`Slide ${i + 1}`}
  />)}
              </div>

              <div className="flex items-center gap-1">
                <button
    onClick={() => setActiveSlide((prev) => (prev - 1 + promoSlides.length) % promoSlides.length)}
    className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
    title="Previous slide"
  >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
    onClick={() => setActiveSlide((prev) => (prev + 1) % promoSlides.length)}
    className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
    title="Next slide"
  >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {
    /* 2. JUMIA-STYLE DAILY FLASH SALES BAR WITH LIVE COUNTDOWN */
  }
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-red-950/70 via-[#1c1822] to-[#18181e] border border-red-500/30 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
          {
    /* Flash sales header */
  }
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center animate-pulse">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-white font-cinzel tracking-wide flex items-center gap-2">
                  <span>WebNexa Daily Flash Sales</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 font-mono">
                    LIMITED QUANTITIES
                  </span>
                </h2>
                <p className="text-[11px] text-zinc-400">Exclusive discounts protected by WebNexa Buyer Protection Guard</p>
              </div>
            </div>

            {
    /* Countdown timer clock */
  }
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Ends in:
              </span>
              <div className="flex items-center gap-1 font-mono text-xs font-bold text-white">
                <span className="px-2 py-1 rounded bg-black/80 border border-zinc-700">
                  {String(timeLeft.hours).padStart(2, "0")}h
                </span>
                <span>:</span>
                <span className="px-2 py-1 rounded bg-black/80 border border-zinc-700">
                  {String(timeLeft.minutes).padStart(2, "0")}m
                </span>
                <span>:</span>
                <span className="px-2 py-1 rounded bg-black/80 border border-zinc-700 text-red-400">
                  {String(timeLeft.seconds).padStart(2, "0")}s
                </span>
              </div>
            </div>
          </div>

          {
    /* Flash sale products horizontal scroll / grid */
  }
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {flashSaleItems.slice(0, 4).map((product) => {
    const discount = product.discount_percent || 15;
    const originalPrice = Math.round(product.price * (1 + discount / 100));
    const soldCount = product.items_sold_count || 14;
    return <div
      key={product.id}
      className="bg-[#141418] border border-zinc-800 rounded-xl overflow-hidden p-3 flex flex-col justify-between hover:border-red-500/40 transition-all group shadow-md"
    >
                  <div>
                    {
      /* Thumbnail with discount tag */
    }
                    <div
      onClick={() => setSelectedProduct(product)}
      className="relative aspect-video sm:aspect-square bg-zinc-900 rounded-lg overflow-hidden cursor-pointer mb-2.5"
    >
                      <img
      src={product.images[0]}
      alt={product.title}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
    />
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-black text-[10px] shadow flex items-center gap-0.5">
                          <BadgePercent className="w-3 h-3" /> -{discount}%
                        </span>
                      </div>
                      {product.is_official_store && <div className="absolute top-2 right-2">
                          <span className="px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-amber-300 text-[9px] font-bold border border-amber-500/30">
                            Official Store
                          </span>
                        </div>}
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] text-zinc-400 font-medium truncate">
                        {product.vendor_name}
                      </p>
                      <h4
      onClick={() => setSelectedProduct(product)}
      className="text-xs font-bold text-zinc-100 line-clamp-1 hover:text-purple-300 cursor-pointer"
    >
                        {product.title}
                      </h4>

                      {
      /* Ratings */
    }
                      <div className="flex items-center gap-1 text-[10px] text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="font-bold">{product.rating || 4.9}</span>
                        <span className="text-zinc-500">({product.reviews_count || 32})</span>
                      </div>

                      {
      /* Pricing with strikethrough */
    }
                      <div className="pt-1">
                        <div className="text-sm font-black font-mono text-metallic-gold">
                          ₦{product.price.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-zinc-500 line-through font-mono">
                          ₦{originalPrice.toLocaleString()}
                        </div>
                      </div>

                      {
      /* Items sold progress bar */
    }
                      <div className="pt-1 space-y-1">
                        <div className="flex justify-between text-[9px] text-zinc-400">
                          <span>Sold: {soldCount}</span>
                          <span className="text-emerald-400 font-medium">In Stock</span>
                        </div>
                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
      className="h-full bg-red-500 rounded-full"
      style={{ width: `${Math.min(100, soldCount * 4)}%` }}
    />
                        </div>
                      </div>
                    </div>
                  </div>

                  <ProductCartControl product={product} compact />
                </div>;
  })}
          </div>
        </div>
      </section>

      {
    /* 3. VERIFIED VENDOR HIGHLIGHTS BAR */
  }
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-4 rounded-2xl bg-[#18181e] border border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider font-mono flex items-center gap-1">
              <Store className="w-3.5 h-3.5" /> Verified Stores:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {[
    "Starlink Direct Hub",
    "MikroTik Africa",
    "SolarMax Power Ltd",
    "Cisco Enterprise West Africa",
    "Apple Tech Depot",
    "Victron Energy Partner"
  ].map((store) => <button
    key={store}
    onClick={() => setSearchQuery(store.split(" ")[0])}
    className="px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-zinc-700/60 text-zinc-300 hover:text-white hover:border-purple-500/50 text-[11px] font-medium flex items-center gap-1.5 transition-colors"
  >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>{store}</span>
              </button>)}
          </div>

          <div className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
            <Truck className="w-3.5 h-3.5 text-amber-400" />
            <span>Nationwide Waybill Delivery</span>
          </div>
        </div>
      </section>

      {
    /* 4. MAIN PRODUCT CATALOG WITH SEARCH, FILTERS & PRODUCT CARDS */
  }
      <section id="product-catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="space-y-4 border-b border-zinc-800 pb-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-white">Marketplace</h1>
              <p className="mt-1 text-xs text-zinc-400">
                {locationInfo?.scope && locationInfo.scope !== "all"
                  ? `Showing ${locationInfo.scope}-matched vendor listings${buyerLocality ? ` near ${buyerLocality}` : ""}.`
                  : locationInfo?.message || "Browse products from approved vendors."}
              </p>
            </div>
            <p className="text-xs text-zinc-400">{filteredProducts.length} products</p>
          </div>
          <div role="group" aria-label="Filter products by category" className="flex gap-2 overflow-x-auto pb-1">
            {categories.map(({ name, icon: Icon }) => <button
      key={name}
      type="button"
      onClick={() => selectCategory(name)}
      aria-pressed={selectedCategory.toLowerCase() === name.toLowerCase()}
      className={`flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3.5 text-xs font-semibold transition-colors ${selectedCategory.toLowerCase() === name.toLowerCase() ? "border-purple-400/60 bg-purple-500/15 text-purple-200" : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-100"}`}
    >
              <Icon className="h-3.5 w-3.5" />
              {name}
            </button>)}
          </div>
        </div>

        {
    /* Product Cards Grid */
  }
        {catalogError ? <div role="alert" className="p-10 text-center text-sm text-rose-300">{catalogError}</div> : isLoading ? <div className="p-16 text-center text-zinc-400 text-xs">
            Loading WebNexa verified marketplace catalog...
          </div> : filteredProducts.length === 0 ? <div className="p-16 text-center bg-[#18181e] rounded-2xl border border-zinc-800 space-y-2">
            <ShoppingBag className="w-12 h-12 text-zinc-600 mx-auto" />
            <h3 className="text-base font-semibold text-zinc-300">No matching products found</h3>
            <p className="text-xs text-zinc-500">Try adjusting your search or category filter.</p>
            <button
    onClick={() => {
      selectCategory("All");
      setSearchQuery("");
    }}
    className="mt-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold"
  >
              Reset Filters
            </button>
          </div> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((product) => {
    const discount = product.discount_percent || 12;
    const originalPrice = Math.round(product.price * (1 + discount / 100));
    return <div
      key={product.id}
      className="bg-[#18181e] border border-zinc-800/90 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between group hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_4px_25px_rgba(139,92,246,0.15)]"
    >
                  {
      /* Card Header & Thumbnail */
    }
                  <div>
                    <div
      onClick={() => setSelectedProduct(product)}
      className="relative aspect-video sm:aspect-square bg-zinc-900 overflow-hidden cursor-pointer"
    >
                      <img
      src={product.images[0]}
      alt={product.title}
      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
    />

                      {
      /* Top Badges */
    }
                      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-purple-300 border border-purple-500/20">
                          {product.category}
                        </span>
                        {discount > 0 && <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-red-600 text-white shadow">
                            -{discount}% OFF
                          </span>}
                      </div>

                      <div className="absolute bottom-2.5 right-2.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      </div>
                    </div>

                    {
      /* Card Content */
    }
                    <div className="p-4 space-y-2.5">
                      {
      /* Vendor Store Line */
    }
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400 truncate flex items-center gap-1">
                          <Store className="w-3 h-3 text-purple-400 shrink-0" />
                          <span className="text-zinc-300 font-medium truncate">{product.vendor_name}</span>
                        </span>
                        {product.is_official_store && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold shrink-0">
                            Official
                          </span>}
                      </div>

                      {
      /* Title */
    }
                      <h3
      onClick={() => setSelectedProduct(product)}
      className="font-bold text-sm text-zinc-100 hover:text-purple-300 transition-colors line-clamp-1 cursor-pointer"
    >
                        {product.title}
                      </h3>

                      {
      /* Star ratings & review count */
    }
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <div className="flex items-center text-amber-400">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span className="ml-1 font-bold text-zinc-200">{product.rating || 4.8}</span>
                        </div>
                        <span className="text-zinc-500 text-[10px]">
                          ({product.reviews_count || 28} reviews)
                        </span>
                        {product.brand && <span className="ml-auto text-[10px] font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                            {product.brand}
                          </span>}
                      </div>

                      {
      /* Description */
    }
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                  </div>

                  {
      /* Card Bottom: Protected Price & Add to Cart */
    }
                  <div className="p-4 pt-2 border-t border-zinc-800/80 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                          WebNexa Protected Price
                        </div>
                        <div className="text-base font-extrabold font-mono text-metallic-gold">
                          ₦{product.price.toLocaleString()}
                        </div>
                      </div>

                      {discount > 0 && <div className="text-right">
                          <span className="text-[10px] text-zinc-500 line-through font-mono">
                            ₦{originalPrice.toLocaleString()}
                          </span>
                        </div>}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
      onClick={() => setSelectedProduct(product)}
      className="flex-1 py-2 px-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors text-center"
    >
                        Inspect Specs
                      </button>
                      <ProductCartControl product={product} />
                    </div>
                  </div>
                </div>;
  })}
          </div>}
      </section>

      {
    /* 5. WEBNEXA ESCROW TRUST PROTOCOL WORKFLOW & FOUNDER SECTION */
  }
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#18181e] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <span className="text-[10px] font-bold tracking-widest uppercase text-purple-400 font-mono">
              Proprietary Custody Protocol
            </span>
            <h2 className="text-xl font-bold text-white font-cinzel">
              How WebNexa Buyer Protection Guard Protects Buyers & Sellers
            </h2>
            <p className="text-xs text-zinc-400">
              Payments are safely processed through Platform-Managed Secure Settlement. Vendors are credited automatically upon verified delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center text-xs">
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
              <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-300 font-bold flex items-center justify-center mx-auto text-xs">
                1
              </div>
              <h4 className="font-bold text-zinc-200">Buyer Checks Out</h4>
              <p className="text-[11px] text-zinc-400">Select verified items and pay securely via Paystack gateway.</p>
            </div>

            <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-2">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center mx-auto text-xs">
                2
              </div>
              <h4 className="font-bold text-purple-200">WebNexa Buyer Protection Guard</h4>
              <p className="text-[11px] text-zinc-400">Deposit is safely locked in the vault until order completion.</p>
            </div>

            <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 space-y-2">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-300 font-bold flex items-center justify-center mx-auto text-xs">
                3
              </div>
              <h4 className="font-bold text-blue-200">Vendor Dispatches</h4>
              <p className="text-[11px] text-zinc-400">Merchant inputs verified carrier waybill and tracking details.</p>
            </div>

            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-2">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center mx-auto text-xs">
                4
              </div>
              <h4 className="font-bold text-amber-200">Buyer Delivery Check</h4>
              <p className="text-[11px] text-zinc-400">Buyer unpacks, tests items, and clicks "Confirm Delivery Receipt".</p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center mx-auto text-xs">
                5
              </div>
              <h4 className="font-bold text-emerald-200">Payout Settled</h4>
              <p className="text-[11px] text-zinc-400">WebNexa credits merchant wallet for instant bank withdrawal.</p>
            </div>
          </div>

          {
    /* Founder Assurance Stamp */
  }
          <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
            <div className="flex items-center gap-3">
              <Logo size="sm" showText={false} />
              <div>
                <span className="font-semibold text-zinc-200 block">WebNexa Technologies Ltd</span>
                <span className="text-[11px]">Founded Sept 13th, 2026 by Kester Apuyor</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <span>Official Support: <strong className="text-zinc-200 font-mono">+234 805 216 8776</strong></span>
              <span>•</span>
              <span className="text-purple-300">support@webnexa.ng</span>
            </div>
          </div>
        </div>
      </section>

      {
    /* Product Details Modal */
  }
      {selectedProduct && <ProductDetailsModal
    product={selectedProduct}
    onClose={() => setSelectedProduct(null)}
  />}
    </div>;
};
