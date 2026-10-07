import jwt from "jsonwebtoken";
import { store } from "../store.js";
const JWT_SECRET = process.env.JWT_SECRET || "webnexa_super_secure_jwt_secret_key_2026";
export function signJwtToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
export function requireBuyerAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required. Please log in to your Buyer account." });
    return;
  }
  try {
    const decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
    if (decoded.role !== "buyer") throw new Error("Buyer credentials required");
    const buyer = store.buyers.find((candidate) => candidate.id === decoded.id);
    if (!buyer) throw new Error("Buyer account not found");
    req.buyer = buyer;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session token." });
  }
}
export function optionalBuyerAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    next();
    return;
  }
  try {
    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET);
    if (decoded.role === "buyer") {
      req.buyer = store.buyers.find((candidate) => candidate.id === decoded.id) || null;
    }
  } catch {
    req.buyer = null;
  }
  next();
}
export function requireVendorAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required. Please log in to your Vendor portal." });
    return;
  }
  try {
    const decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
    if (decoded.role !== "vendor") throw new Error("Vendor credentials required");
    const vendor = store.vendors.find((candidate) => candidate.id === decoded.id);
    if (!vendor) throw new Error("Vendor account not found");
    req.vendor = vendor;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired vendor session token." });
  }
}
export function requireApprovedVendor(req, res, next) {
  if (!req.vendor) {
    res.status(401).json({ error: "Vendor authentication required." });
    return;
  }
  if (!req.vendor.is_approved) {
    res.status(403).json({ error: "Vendor Verification Pending", status: "PENDING_APPROVAL" });
    return;
  }
  next();
}
export function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Administrator authentication required." });
    return;
  }
  try {
    const decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
    if (decoded.role !== "admin") throw new Error("Admin credentials required");
    const admin = store.admins.find((candidate) => candidate.id === decoded.id);
    if (!admin) throw new Error("Admin not found");
    req.admin = admin;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired admin session token." });
  }
}
export function requireSocialAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  try {
    const decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
    if (decoded.role === "buyer") {
      const buyer = store.buyers.find((candidate) => candidate.id === decoded.id);
      if (!buyer) throw new Error("Buyer not found");
      req.socialUser = { id: buyer.id, role: "buyer", name: buyer.full_name };
    } else {
      const vendor = store.vendors.find((candidate) => candidate.id === decoded.id);
      if (!vendor) throw new Error("Vendor not found");
      req.socialUser = { id: vendor.id, role: "vendor", name: vendor.business_name };
    }
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session token." });
  }
}
