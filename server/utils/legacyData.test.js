import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeLegacyBuyer,
  normalizeLegacyOrder,
  normalizeLegacyProduct,
  normalizeLegacyVendor
} from "./legacyData.js";

test("normalizes legacy products without discarding unknown fields", () => {
  const product = normalizeLegacyProduct({
    id: "legacy-product",
    vendor_id: "legacy-vendor",
    old_field: "preserved",
    price: "not-a-number",
    category: null,
    images: ["https://example.com/image.jpg", 42],
    tags: "legacy-tag"
  });

  assert.equal(product.id, "legacy-product");
  assert.equal(product.old_field, "preserved");
  assert.equal(product.title, "Untitled product");
  assert.equal(product.description, "");
  assert.equal(product.category, "Hardware & Gear");
  assert.equal(product.price, 0);
  assert.deepEqual(product.images, ["https://example.com/image.jpg"]);
  assert.deepEqual(product.tags, []);
  assert.equal(product.is_active, false);
  assert.equal(product.is_approved_by_admin, false);
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

test("normalizes legacy buyers without overwriting unknown fields", () => {
  const buyer = normalizeLegacyBuyer({
    id: "legacy-buyer",
    city: null,
    legacy_preference: "kept"
  });

  assert.equal(buyer.full_name, "Buyer");
  assert.equal(buyer.city, "");
  assert.equal(buyer.country, "Nigeria");
  assert.equal(buyer.legacy_preference, "kept");
});

test("normalizes legacy orders with missing items and address fields", () => {
  const order = normalizeLegacyOrder({
    id: "legacy-order",
    total_amount: "",
    shipping_address: "Old street address",
    legacy_status: "kept"
  });

  assert.equal(order.total_amount, 0);
  assert.deepEqual(order.items, []);
  assert.equal(order.shipping_address.address_line1, "Old street address");
  assert.equal(order.shipping_address.country, "Nigeria");
  assert.equal(order.legacy_status, "kept");
});

test("returns null for invalid legacy records", () => {
  assert.equal(normalizeLegacyProduct(null), null);
  assert.equal(normalizeLegacyVendor(undefined), null);
  assert.equal(normalizeLegacyBuyer([]), null);
  assert.equal(normalizeLegacyOrder(null), null);
});
