import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { requireBuyerAuth, optionalBuyerAuth, requireVendorAuth, requireApprovedVendor, requireAdminAuth, requireSocialAuth } from "../server/middleware/auth.js";
import { buyerRegister, buyerLogin, getBuyerProfile, updateBuyerProfile } from "../server/controllers/buyerAuth.js";
import { vendorRegister, vendorLogin, getVendorProfile, updateVendorBranding } from "../server/controllers/vendorAuth.js";
import { adminLogin, getAdminProfile } from "../server/controllers/adminAuth.js";
import { getProducts, getProductById, getVendorProducts, createProduct, updateProduct, deleteProduct } from "../server/controllers/productController.js";
import { adminReleaseEscrow } from "../server/controllers/escrowController.js";
import initializeFlutterwaveCheckout from "../api/checkout/initialize.js";
import verifyFlutterwavePayment from "../api/checkout/verify.js";
import flutterwaveWebhook from "../api/payments/flutterwave/webhook.js";
import getBuyerOrdersFromMongo from "../api/orders/buyer.js";
import getVendorOrdersFromMongo from "../api/orders/vendor.js";
import shipMongoOrder from "../api/orders/[id]/ship.js";
import confirmMongoDelivery from "../api/orders/[id]/confirm-delivery.js";
import getVendorWalletFromMongo from "../api/vendor/wallet.js";
import resolveVendorBank from "../api/vendor/banks/resolve.js";
import withdrawVendorWallet from "../api/vendor/wallet/withdraw.js";
import {
  getAdminDashboardStats,
  getAllVendors,
  approveVendor,
  rejectVendor,
  getAllEscrowTransactions,
  getAllOrders,
  getAllAdminProducts,
  approveProduct,
  toggleAutoReleaseEscrow,
  getEscrowSettings
} from "../server/controllers/adminDashboard.js";
import { getBuyerOrders, getVendorOrders } from "../server/controllers/orderQueries.js";
import { createVendorReview, listVendorReviews } from "../server/controllers/vendorReviews.js";
import { createMessage, createSocialPost, likeSocialPost, listMessages, listSocialPosts } from "../server/controllers/socialController.js";
import { listRestaurants, createRestaurant, getVendorFoodDashboard, createMenuItem, updateMenuAvailability, createFoodOrder, updateFoodOrderStatus, confirmFoodDelivery } from "../server/controllers/foodController.js";
import { googleLogin } from "../server/controllers/googleAuth.js";
import { googleBuyerRegister } from "../server/controllers/googleAuth.js";
import {
  getWallet,
  listWalletTransactions,
  initializeWalletPaystack,
  initializeWalletCrypto,
  handleNowPaymentsWebhook,
  adminVendorPayout
} from "../server/controllers/walletController.js";

export function createApp() {
  const app = express();
app.use(express.json({
  limit: "10mb",
  verify: (req, _res, buffer) => {
    req.rawBody = Buffer.from(buffer);
  }
}));
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "WebNexa Multi-Vendor Marketplace Core API",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    database: "MySQL Architecture (Strict Table Separation)",
    brand: "WebNexa - Next-Generation Web Solutions"
  });
});
app.post("/api/auth/buyer/register", buyerRegister);
app.post("/api/auth/buyer/login", buyerLogin);
app.post("/api/auth/google", googleLogin);
app.post("/api/auth/google/register", googleBuyerRegister);
app.get("/api/auth/buyer/me", requireBuyerAuth, getBuyerProfile);
app.put("/api/auth/buyer/profile", requireBuyerAuth, updateBuyerProfile);
app.post("/api/auth/vendor/register", vendorRegister);
app.post("/api/auth/vendor/login", vendorLogin);
app.get("/api/auth/vendor/me", requireVendorAuth, getVendorProfile);
app.patch("/api/vendor/branding", requireVendorAuth, updateVendorBranding);
app.get("/api/food/restaurants", listRestaurants);
app.post("/api/vendor/restaurant", requireVendorAuth, createRestaurant);
app.get("/api/vendor/food-dashboard", requireVendorAuth, getVendorFoodDashboard);
app.post("/api/vendor/menu-items", requireVendorAuth, requireApprovedVendor, createMenuItem);
app.patch("/api/vendor/menu-items/:itemId/availability", requireVendorAuth, updateMenuAvailability);
app.post("/api/food/orders", requireBuyerAuth, createFoodOrder);
app.patch("/api/vendor/food-orders/:orderId/status", requireVendorAuth, updateFoodOrderStatus);
app.post("/api/food/orders/:orderId/confirm-delivery", requireBuyerAuth, confirmFoodDelivery);
app.post("/api/auth/admin/login", adminLogin);
app.get("/api/auth/admin/me", requireAdminAuth, getAdminProfile);
app.get("/api/products", optionalBuyerAuth, getProducts);
app.get("/api/products/:id", getProductById);
app.get("/api/vendor/products", requireVendorAuth, getVendorProducts);
app.post("/api/vendor/products", requireVendorAuth, requireApprovedVendor, createProduct);
app.put("/api/vendor/products/:id", requireVendorAuth, requireApprovedVendor, updateProduct);
app.delete("/api/vendor/products/:id", requireVendorAuth, deleteProduct);
app.post("/api/checkout/initialize", requireBuyerAuth, initializeFlutterwaveCheckout);
app.get("/api/checkout/verify", requireBuyerAuth, verifyFlutterwavePayment);
app.post("/api/payments/flutterwave/webhook", flutterwaveWebhook);
app.get("/api/wallet", requireBuyerAuth, getWallet);
app.get("/api/wallet/transactions", requireBuyerAuth, listWalletTransactions);
app.get("/api/orders/buyer", requireBuyerAuth, getBuyerOrdersFromMongo);
app.post("/api/vendor-reviews", requireBuyerAuth, createVendorReview);
app.get("/api/vendor-reviews/:vendorId", listVendorReviews);
app.get("/api/vendors/:vendorId/profile", listVendorReviews);
app.get("/api/feed", listSocialPosts);
app.post("/api/feed", requireSocialAuth, createSocialPost);
app.post("/api/feed/:id/like", requireSocialAuth, likeSocialPost);
app.get("/api/messages", requireSocialAuth, listMessages);
app.post("/api/messages", requireSocialAuth, createMessage);
app.get("/api/orders/vendor", requireVendorAuth, getVendorOrdersFromMongo);
app.post("/api/orders/:id/ship", requireVendorAuth, shipMongoOrder);
app.post("/api/orders/:id/confirm-delivery", requireBuyerAuth, confirmMongoDelivery);
app.post("/api/vendor/banks/resolve", requireVendorAuth, resolveVendorBank);
app.post("/api/vendor/wallet/withdraw", requireVendorAuth, withdrawVendorWallet);
app.get("/api/vendor/wallet", requireVendorAuth, getVendorWalletFromMongo);
app.get("/api/vendor/wallet/transactions", requireVendorAuth, listWalletTransactions);
app.get("/api/admin/stats", requireAdminAuth, getAdminDashboardStats);
app.get("/api/admin/vendors", requireAdminAuth, getAllVendors);
app.post("/api/admin/vendors/:id/approve", requireAdminAuth, approveVendor);
app.post("/api/admin/vendors/:id/reject", requireAdminAuth, rejectVendor);
app.get("/api/admin/escrow", requireAdminAuth, getAllEscrowTransactions);
app.post("/api/admin/escrow/:id/release", requireAdminAuth, adminReleaseEscrow);
app.get("/api/admin/orders", requireAdminAuth, getAllOrders);
app.get("/api/admin/products", requireAdminAuth, getAllAdminProducts);
app.post("/api/admin/products/:id/approve", requireAdminAuth, approveProduct);
app.get("/api/admin/escrow/settings", requireAdminAuth, getEscrowSettings);
app.post("/api/admin/escrow/settings", requireAdminAuth, toggleAutoReleaseEscrow);
app.post("/api/admin/payments/wallet/paystack", requireAdminAuth, initializeWalletPaystack);
app.post("/api/admin/payments/wallet/crypto", requireAdminAuth, initializeWalletCrypto);
app.get("/api/admin/wallet", requireAdminAuth, getWallet);
app.get("/api/admin/wallet/transactions", requireAdminAuth, listWalletTransactions);
app.post("/api/admin/vendors/:vendorId/payout", requireAdminAuth, adminVendorPayout);
app.get("/api/docs/schema", (req, res) => {
  try {
    const schemaPath = path.join(process.cwd(), "server", "database", "schema.sql");
    const schemaContent = fs.readFileSync(schemaPath, "utf8");
    res.type("text/plain").send(schemaContent);
  } catch (err) {
    res.status(500).send("-- Failed to read schema file: " + err.message);
  }
});

  return app;
}

