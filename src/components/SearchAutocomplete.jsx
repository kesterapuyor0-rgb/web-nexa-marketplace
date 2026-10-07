import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Search } from "lucide-react";
export const SearchAutocomplete = ({
  searchQuery,
  onSearchQueryChange,
  inputId = "marketplace-search-input",
  placeholder = "Search computing, networking, solar equipment, verified gear..."
}) => {
  const navigate = useNavigate();
  const { token, role } = useAuth();
  const containerRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  useEffect(() => {
    let isMounted = true;
    fetch("/api/products", {
      headers: token && role === "buyer" ? { Authorization: `Bearer ${token}` } : {}
    }).then((response) => response.ok ? response.json() : Promise.reject(new Error("Catalog unavailable"))).then((data) => {
      if (isMounted) setProducts(data.products || []);
    }).catch(() => {
      if (isMounted) setProducts([]);
    });
    return () => {
      isMounted = false;
    };
  }, [token, role]);
  const suggestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return products.filter((product) => {
      const searchableText = [
        product.title,
        product.description,
        product.vendor_name,
        product.category,
        product.brand,
        ...product.tags || []
      ].filter(Boolean).join(" ").toLowerCase();
      return searchableText.includes(query);
    }).slice(0, 6);
  }, [products, searchQuery]);
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchQuery]);
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);
  const submitSearch = (query = searchQuery) => {
    const normalizedQuery = query.trim();
    setIsFocused(false);
    setHighlightedIndex(-1);
    navigate(normalizedQuery ? `/?search=${encodeURIComponent(normalizedQuery)}` : "/");
    window.requestAnimationFrame(() => {
      document.getElementById("product-catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };
  const selectSuggestion = (product) => {
    onSearchQueryChange(product.title);
    submitSearch(product.title);
  };
  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      setIsFocused(false);
      setHighlightedIndex(-1);
      return;
    }
    if (!isFocused || suggestions.length === 0) {
      if (event.key === "Enter") submitSearch();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((current) => (current + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((current) => (current - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (highlightedIndex >= 0) selectSuggestion(suggestions[highlightedIndex]);
      else submitSearch();
    }
  };
  const isOpen = isFocused && searchQuery.trim().length > 0;
  return <div ref={containerRef} className="relative flex-1">
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
        <input
    id={inputId}
    type="search"
    value={searchQuery}
    onChange={(event) => onSearchQueryChange(event.target.value)}
    onFocus={() => setIsFocused(true)}
    onKeyDown={handleKeyDown}
    placeholder={placeholder}
    autoComplete="off"
    className="w-full h-10 pl-9 pr-9 rounded-xl bg-zinc-900/90 border border-zinc-700/80 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-inner"
    aria-expanded={isOpen}
    aria-controls={`${inputId}-suggestions`}
  />
      </div>

      {isOpen && <div
    id={`${inputId}-suggestions`}
    role="listbox"
    className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-xl bg-[#18181e] border border-zinc-700/80 shadow-2xl z-50"
  >
          {suggestions.length > 0 ? <div className="p-1.5">
              {suggestions.map((product, index) => <button
    key={product.id}
    type="button"
    role="option"
    aria-selected={highlightedIndex === index}
    onMouseDown={(event) => event.preventDefault()}
    onClick={() => selectSuggestion(product)}
    className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${highlightedIndex === index ? "bg-purple-950/60" : "hover:bg-zinc-800/80"}`}
  >
                  <img
    src={product.images[0]}
    alt=""
    className="w-10 h-10 rounded-md object-cover bg-zinc-800 shrink-0"
  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-zinc-100">{product.title}</span>
                    <span className="mt-0.5 flex items-center gap-2 text-[10px] text-zinc-400">
                      <span className="truncate">{product.category}</span>
                      <span className="text-purple-300 font-mono shrink-0">₦{product.price.toLocaleString()}</span>
                    </span>
                  </span>
                </button>)}
            </div> : <p className="px-3 py-3 text-xs text-zinc-400">No matching products found.</p>}
          <button
    type="button"
    onMouseDown={(event) => event.preventDefault()}
    onClick={() => submitSearch()}
    className="w-full border-t border-zinc-800 px-3 py-2.5 text-left text-[11px] font-semibold text-purple-300 hover:bg-zinc-800/70"
  >
            View all results for '{searchQuery.trim()}'
          </button>
        </div>}
    </div>;
};
