import test from "node:test";
import assert from "node:assert/strict";
import { normalizeLegacyProduct, normalizeLegacyVendor } from "./legacyData.js";

test("normalizes legacy products without discarding unknown fields", () => {
  const product = normalizeLegacyProduct({
    id: "legacy-product",
    vendor_id: "legacy-vendor",
    old_field: "preserved",
    price: "not-a-number",
    category: null,
    images: ["https://example.com/image.jpg", 42]
  });

  assert.equal(product.id, "legacy-product");
  assert.equal(product.old_field, "preserved");
  assert.equal(product.title, "Untitled product");
  assert.equal(product.description, "");
  assert.equal(product.category, "Hardware & Gear");
  assert.equal(product.price, 0);
  assert.deepEqual(product.images, ["https://example.com/image.jpg"]);
});

test("normalizes legacy vendor fields and preserves optional metadata", () => {
  const vendor = normalizeLegacyVendor({
    id: "legacy-vendor",
    business_name: "  Legacy Store  ",
    requested_categories: ["Food", "Fashion"],
    is_approved: false
  });

  assert.equal(vendor.business_name, "Legacy Store");
  assert.equal(vendor.country, "Nigeria");
  assert.equal(vendor.is_approved, false);
  assert.deepEqual(vendor.requested_categories, ["Food", "Fashion"]);
});

test("returns null for invalid legacy records", () => {
  assert.equal(normalizeLegacyProduct(null), null);
  assert.equal(normalizeLegacyVendor(undefined), null);
});
