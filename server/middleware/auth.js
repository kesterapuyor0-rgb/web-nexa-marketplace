import jwt from "jsonwebtoken";
import { getAccountForRequest, getDatabase } from "../api/_mongoAuth.js";

const JWT_SECRET = process.env.JWT_SECRET || "webnexa_super_secure_jwt_secret_key_2026";

export function signJwtToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

async function authenticate(req, res, role, assign) {
  try {
    const db = await getDatabase();
    const account = await getAccountForRequest(req, db, role);
    if (!account) {
      res.status(401).json({ error: role === "vendor"
        ? "Invalid or expired vendor session token."
        : "Invalid or expired session token." });
      return;
    }
    assign(account);
    return true;
  } catch (error) {
    console.error(`[auth] ${role} account lookup failed`, {
      message: error instanceof Error ? error.message : String(error),
      code: error?.code
    });
    res.status(503).json({ error: "The authentication database is temporarily unavailable." });
    return false;
  }
}

export async function requireBuyerAuth(req, res, next) {
  if (!await authenticate(req, res, "buyer", (buyer) => { req.buyer = buyer; })) return;
  next();
}

export async function optionalBuyerAuth(req, res, next) {
  if (!req.headers.authorization?.startsWith("Bearer ")) {
    next();
    return;
  }
  try {
    const db = await getDatabase();
    req.buyer = await getAccountForRequest(req, db, "buyer");
    next();
  } catch (error) {
    console.error("[auth] Optional buyer account lookup failed", {
      message: error instanceof Error ? error.message : String(error),
      code: error?.code
    });
    res.status(503).json({ error: "The authentication database is temporarily unavailable." });
  }
}

export async function requireVendorAuth(req, res, next) {
  if (!await authenticate(req, res, "vendor", (vendor) => { req.vendor = vendor; })) return;
  next();
}

export function requireApprovedVendor(req, res, next) {
  if (!req.vendor) {
    res.status(401).json({ error: "Vendor authentication required." });
    return;
  }
  if (req.vendor.is_approved !== true) {
    res.status(403).json({ error: "Vendor Verification Pending", status: "PENDING_APPROVAL" });
    return;
  }
  next();
}

export async function requireAdminAuth(req, res, next) {
  if (!await authenticate(req, res, "admin", (admin) => { req.admin = admin; })) return;
  next();
}

export async function requireSocialAuth(req, res, next) {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  try {
    const db = await getDatabase();
    const buyer = await getAccountForRequest(req, db, "buyer");
    const vendor = buyer ? null : await getAccountForRequest(req, db, "vendor");
    const account = buyer || vendor;
    if (!account) {
      res.status(401).json({ error: "Invalid or expired session token." });
      return;
    }
    req.socialUser = {
      id: account.id || String(account._id),
      role: account.role,
      name: account.role === "buyer" ? account.full_name : account.business_name
    };
    next();
  } catch (error) {
    console.error("[auth] Social account lookup failed", {
      message: error instanceof Error ? error.message : String(error),
      code: error?.code
    });
    res.status(503).json({ error: "The authentication database is temporarily unavailable." });
  }
}
