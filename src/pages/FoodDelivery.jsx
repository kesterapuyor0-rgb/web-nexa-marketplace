import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clock, MapPin, Minus, Plus, ShieldCheck, Star, X, ShoppingBag, Flame } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
const filters = ["All", "Fast Food", "African Cuisine", "Fine Dining", "Drinks & Desserts", "Vegetarian", "Top Rated"];
const naira = (value) => `\u20A6${value.toLocaleString("en-NG")}`;
export default function FoodDelivery() {
  const { addToCart } = useCart();
  const [restaurants, setRestaurants] = useState([]);
  const [filter, setFilter] = useState("All");
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [selectedDish, setSelectedDish] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [customization, setCustomization] = useState({ addon: "", spice: "Medium", notes: "" });
  const [trackerStep, setTrackerStep] = useState(0);
  useEffect(() => {
    fetch("/api/food/restaurants").then((response) => response.json()).then((data) => setRestaurants(data.restaurants || [])).catch(() => setRestaurants([]));
  }, []);
  const visibleRestaurants = useMemo(() => restaurants.filter((restaurant) => {
    if (filter === "All") return true;
    if (filter === "Top Rated") return (restaurant.rating || 0) >= 4.8;
    return restaurant.category === filter;
  }), [restaurants, filter]);
  const setQuantity = (dish, restaurant, nextQuantity) => {
    const quantity = Math.max(0, nextQuantity);
    setQuantities((current) => ({ ...current, [dish.id]: quantity }));
    if (quantity > 0) {
      const product = {
        id: `food-${dish.id}`,
        vendor_id: restaurant.vendor_id,
        vendor_name: restaurant.business_name,
        title: dish.item_name,
        slug: dish.id,
        description: dish.description,
        price: dish.price,
        inventory_count: 999,
        category: "Food & Drinks",
        images: [dish.image_url],
        is_active: true,
        is_approved_by_admin: true,
        rating: restaurant.rating,
        reviews_count: restaurant.reviews_count,
        tags: ["food", restaurant.category || "Food"],
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      addToCart(product, 1);
    }
  };
  const openDish = (dish, restaurant) => {
    setSelectedRestaurant(restaurant);
    setSelectedDish(dish);
    setCustomization({ addon: "", spice: "Medium", notes: "" });
  };
  const addCustomizedDish = () => {
    if (selectedDish && selectedRestaurant) setQuantity(selectedDish, selectedRestaurant, (quantities[selectedDish.id] || 0) + 1);
    setSelectedDish(null);
  };
  return <div className="min-h-screen bg-[#0b0b0f] text-white">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <section className="mb-7">
          <p className="text-purple-300 text-xs font-bold uppercase tracking-[0.2em]">WebNexa Restaurants & Eateries</p>
          <h1 className="text-4xl md:text-5xl font-bold mt-2">Good food, protected from kitchen to doorstep.</h1>
          <p className="text-zinc-400 mt-3 max-w-2xl">Discover restaurants and eateries, browse their food menus, customize every order, and track preparation in real time with WebNexa Buyer Protection.</p>
        </section>

        <div className="sticky top-16 z-20 -mx-4 px-4 py-3 mb-7 bg-[#0b0b0f]/95 backdrop-blur border-y border-zinc-800/80 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-full px-4 py-2 text-xs font-semibold transition ${filter === item ? "bg-purple-600 text-white" : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white"}`}>{item}</button>)}
          </div>
        </div>

        {selectedRestaurant ? <section className="space-y-6">
            <button type="button" onClick={() => setSelectedRestaurant(null)} className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-200 hover:border-purple-500 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Back to restaurants and eateries
            </button>
            <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/60 shadow-xl">
              <div className="relative h-56">
                <img src={selectedRestaurant.banner_url} alt={selectedRestaurant.business_name} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <img src={selectedRestaurant.logo_url} alt="" className="absolute bottom-5 left-5 h-16 w-16 rounded-2xl border-2 border-white/30 bg-purple-700 object-cover" />
                <div className="absolute bottom-5 left-28">
                  <p className="text-xs font-bold uppercase tracking-wider text-purple-300">Restaurant / Eatery</p>
                  <h2 className="text-3xl font-bold">{selectedRestaurant.business_name}</h2>
                  <p className="text-sm text-zinc-300">{selectedRestaurant.cuisine_type} · {selectedRestaurant.category}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 border-b border-zinc-800 px-5 py-4 text-xs">
                <span className="text-amber-300"><Star className="inline h-3.5 w-3.5 fill-current" /> {selectedRestaurant.rating?.toFixed(1)} ({selectedRestaurant.reviews_count} reviews)</span>
                <span className="text-zinc-400"><Clock className="inline h-3.5 w-3.5 mr-1" />{selectedRestaurant.preparation_time_mins}-{selectedRestaurant.preparation_time_mins + 10} min</span>
                <span className="text-zinc-400"><MapPin className="inline h-3.5 w-3.5 mr-1" />Delivery {naira(selectedRestaurant.delivery_fee || 0)}</span>
                <span className="text-emerald-300">Buyer Protection covered</span>
              </div>
              <div className="p-5">
                <h3 className="mb-4 text-xl font-bold">Food menu at {selectedRestaurant.business_name}</h3>
                {!selectedRestaurant.menu_items.length ? <p className="rounded-2xl border border-zinc-800 p-8 text-center text-zinc-400">This eatery has not published food items yet.</p> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {selectedRestaurant.menu_items.map((dish) => <div key={dish.id} className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/50">
                        <button type="button" onClick={() => openDish(dish, selectedRestaurant)} className="w-full text-left">
                          <img src={dish.image_url} alt={dish.item_name} className="h-36 w-full object-cover" />
                          <div className="p-3">
                            <p className="text-[10px] uppercase text-purple-300">{dish.category}</p>
                            <h4 className="mt-1 font-semibold">{dish.item_name}</h4>
                            <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{dish.description}</p>
                            <p className="mt-2 font-bold text-purple-300">{naira(dish.price)}</p>
                          </div>
                        </button>
                        <div className="flex items-center justify-between px-3 pb-3">
                          <span className="text-[11px] text-zinc-500">{dish.prep_time_mins || 20} min prep</span>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setQuantity(dish, selectedRestaurant, (quantities[dish.id] || 0) - 1)} className="rounded-lg bg-zinc-800 p-1.5"><Minus className="h-3.5 w-3.5" /></button>
                            <span className="w-4 text-center text-xs">{quantities[dish.id] || 0}</span>
                            <button type="button" onClick={() => setQuantity(dish, selectedRestaurant, (quantities[dish.id] || 0) + 1)} className="rounded-lg bg-purple-600 p-1.5"><Plus className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                      </div>)}
                  </div>}
              </div>
            </div>
          </section> : !visibleRestaurants.length ? <div className="rounded-2xl border border-zinc-800 p-12 text-center text-zinc-400">No restaurants or eateries match this filter yet.</div> : <div className="space-y-8">
            {visibleRestaurants.map((restaurant) => <article key={restaurant.id} className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/60 shadow-xl">
                <button className="relative w-full h-52 text-left" onClick={() => setSelectedRestaurant(restaurant)}>
                  <img src={restaurant.banner_url} alt={restaurant.business_name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <img src={restaurant.logo_url} alt="" className="absolute left-5 bottom-5 w-14 h-14 rounded-2xl border-2 border-white/30 bg-purple-700" />
                  <div className="absolute left-24 bottom-5"><p className="text-xs font-bold uppercase tracking-wider text-purple-300">Restaurant / Eatery</p><h2 className="text-2xl font-bold">{restaurant.business_name}</h2><p className="text-sm text-zinc-300">{restaurant.cuisine_type} · {restaurant.category}</p></div>
                  <span className="absolute top-4 right-4 rounded-full bg-emerald-500/90 px-3 py-1.5 text-[11px] font-bold"><ShieldCheck className="inline w-3.5 h-3.5 mr-1" />Verified Kitchen</span>
                </button>
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-zinc-800 text-xs">
                  <span className="text-amber-300"><Star className="inline w-3.5 h-3.5 fill-current" /> {restaurant.rating?.toFixed(1)} ({restaurant.reviews_count})</span>
                  <span className="text-zinc-400"><Clock className="inline w-3.5 h-3.5 mr-1" />{restaurant.preparation_time_mins}-{restaurant.preparation_time_mins + 10} min</span>
                  <span className="text-zinc-400"><MapPin className="inline w-3.5 h-3.5 mr-1" />Delivery {naira(restaurant.delivery_fee || 0)}</span>
                  <span className="text-emerald-300">Buyer Protection covered</span>
                </div>
                <div className="flex flex-col items-center gap-3 p-7 text-center">
                  <p className="text-sm text-zinc-300">
                    {restaurant.menu_items.length ? `${restaurant.menu_items.length} food item${restaurant.menu_items.length === 1 ? "" : "s"} available` : "Menu coming soon"}
                  </p>
                  <button type="button" onClick={() => setSelectedRestaurant(restaurant)} className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold transition hover:bg-purple-500">
                    {restaurant.menu_items.length ? `Select ${restaurant.business_name} & view menu` : `View ${restaurant.business_name}`}
                  </button>
                </div>
              </article>)}
          </div>}

        <section className="mt-10 rounded-3xl border border-purple-500/20 bg-purple-950/20 p-5">
          <div className="flex items-center gap-2"><Flame className="text-orange-400 w-5 h-5" /><h2 className="font-bold">Live preparation tracker</h2></div>
          <div className="grid grid-cols-4 gap-2 mt-5">{["Order Placed", "Vendor Processing", "Out for Delivery", "Delivered"].map((step, index) => <button key={step} onClick={() => setTrackerStep(index)} className={`text-left ${index <= trackerStep ? "text-purple-200" : "text-zinc-600"}`}><div className={`h-1 rounded ${index <= trackerStep ? "bg-purple-500" : "bg-zinc-800"}`} /><p className="text-xs mt-2">{step}</p></button>)}</div>
          <p className="text-xs text-zinc-400 mt-4">Payment verification moves your order into the protected processing queue. Updates remain visible here as the vendor processes your order under WebNexa Escrow Protection.</p>
        </section>
      </main>

      {selectedDish && selectedRestaurant && <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedDish(null)}><div className="w-full max-w-lg rounded-3xl border border-zinc-700 bg-[#18181e] p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex justify-between items-start"><div><p className="text-xs text-purple-300 uppercase">{selectedRestaurant.business_name}</p><h2 className="text-2xl font-bold mt-1">{selectedDish.item_name}</h2></div><button onClick={() => setSelectedDish(null)}><X /></button></div><p className="text-sm text-zinc-400 mt-3">{selectedDish.description}</p><div className="grid sm:grid-cols-2 gap-3 mt-5"><label className="text-xs text-zinc-400">Spice level<select value={customization.spice} onChange={(event) => setCustomization({ ...customization, spice: event.target.value })} className="mt-1 w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-white"><option>Mild</option><option>Medium</option><option>Hot</option></select></label><label className="text-xs text-zinc-400">Add-on<select value={customization.addon} onChange={(event) => setCustomization({ ...customization, addon: event.target.value })} className="mt-1 w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-white"><option value="">No add-on</option>{selectedDish.addons.map((addon) => <option key={addon.id} value={addon.addon_name}>{addon.addon_name} (+{naira(addon.extra_price)})</option>)}</select></label></div><textarea value={customization.notes} onChange={(event) => setCustomization({ ...customization, notes: event.target.value })} placeholder="Special notes for the kitchen" className="mt-3 w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-sm" /><button onClick={addCustomizedDish} className="mt-4 w-full rounded-xl bg-purple-600 py-3 font-bold"><ShoppingBag className="inline w-4 h-4 mr-2" />Add to protected cart · {naira(selectedDish.price)}</button></div></div>}
    </div>;
}
