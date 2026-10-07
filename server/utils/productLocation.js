function locationValue(record, field) {
  const nested = record?.vendor_location || (record?.location && typeof record.location === "object" ? record.location : null) || record?.vendor || record || {};
  const aliases = {
    city: ["city", "business_city"],
    state: ["state", "business_state"],
    country: ["country", "business_country"]
  };
  for (const key of aliases[field]) {
    const value = nested[key];
    if (typeof value === "string" && value.trim()) return value.trim().toLocaleLowerCase();
  }
  const location = typeof record?.location === "string" ? record.location : typeof nested.location === "string" ? nested.location : "";
  const parts = location.split(/[,|/]/).map((part) => part.trim().toLocaleLowerCase()).filter(Boolean);
  if (field === "city") return parts[0] || "";
  if (field === "state") return parts[1] || parts[0] || "";
  if (field === "country") return parts[2] || "";
  return "";
}

export function filterProductsByBuyerLocation(products, buyer, getVendor = (product) => product.vendor) {
  const buyerLocation = {
    city: locationValue(buyer, "city"),
    state: locationValue(buyer, "state"),
    country: locationValue(buyer, "country")
  };
  const levels = ["city", "state", "country"].filter((level) => buyerLocation[level]);

  for (const level of levels) {
    const matching = products.filter((product) => {
      const vendor = getVendor(product);
      const vendorValue = locationValue(vendor || product, level);
      if (!vendorValue || vendorValue !== buyerLocation[level]) return false;
      const vendorCountry = locationValue(vendor || product, "country");
      return !buyerLocation.country || !vendorCountry || vendorCountry === buyerLocation.country;
    });
    if (matching.length) {
      return {
        products: matching,
        location: { scope: level, fallback: level !== levels[0] }
      };
    }
  }

  return {
    products,
    location: {
      scope: "all",
      fallback: Boolean(levels.length),
      message: levels.length ? "No nearby listings yet; showing all available products." : "Showing all available products."
    }
  };
}