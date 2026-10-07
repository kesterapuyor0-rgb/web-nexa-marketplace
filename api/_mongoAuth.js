import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import {
  MongoClient,
  MongoServerError,
  ServerApiVersion
} from "mongodb";
const globalMongo = globalThis;
export async function getDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not configured");
  if (!globalMongo.webnexaMongoClient) {
    const client2 = new MongoClient(uri, {
      appName: "webnexa-marketplace",
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 1e4,
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
      }
    });
    globalMongo.webnexaMongoClient = client2.connect().catch((error) => {
      globalMongo.webnexaMongoClient = void 0;
      throw error;
    });
  }
  const client = await globalMongo.webnexaMongoClient;
  const db = client.db(process.env.MONGODB_DB || "webnexa_marketplace");
  if (!globalMongo.webnexaMongoIndexes) {
    globalMongo.webnexaMongoIndexes = Promise.all([
      db.collection("accounts").createIndex({ role: 1, email: 1 }, { unique: true }),
      db.collection("accounts").createIndex(
        { role: 1, company_registration_no: 1 },
        { unique: true, partialFilterExpression: { role: "vendor", company_registration_no: { $exists: true } } }
      )
    ]).then(() => void 0).catch((error) => {
      globalMongo.webnexaMongoIndexes = void 0;
      throw error;
    });
  }
  await globalMongo.webnexaMongoIndexes;
  return db;
}
export async function getBuyerForRequest(req, db) {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) return null;
  let decoded;
  try {
    decoded = jwt.verify(authorization.slice(7), jwtSecret());
  } catch {
    return null;
  }
  if (decoded.role !== "buyer") return null;
  return db.collection("accounts").findOne({ role: "buyer", $or: [{ _id: decoded.id }, { id: decoded.id }] });
}
function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set to at least 32 characters");
  }
  return secret;
}
function publicAccount(account) {
  const { password_hash: _passwordHash, ...safeAccount } = account;
  return safeAccount;
}
function redactMongoUri(value) {
  let message = String(value);
  const uri = process.env.MONGODB_URI;
  if (uri) message = message.replaceAll(uri, "[REDACTED_MONGODB_URI]");
  return message.replace(/mongodb(?:\+srv)?:\/\/[^/\s@]+@/gi, "mongodb+srv://[REDACTED]@");
}
function sendConfigurationError(res, error, context = {}) {
  const rawMessage = error instanceof Error ? error.message : String(error);
  const errorDetails = error instanceof Error ? {
    name: error.name,
    message: redactMongoUri(error.message),
    code: error.code,
    codeName: error.codeName,
    stack: error.stack ? redactMongoUri(error.stack) : undefined
  } : { message: redactMongoUri(error) };
  const statusCode = Number(error?.statusCode || error?.status);
  if (statusCode >= 400 && statusCode < 500) {
    console.warn("[auth] Request rejected", { ...context, ...errorDetails });
    res.status(statusCode).json({
      error: statusCode === 400 ? "Request body must be valid JSON." : "The request could not be processed."
    });
    return;
  }
  console.error("[auth] Request failed", { ...context, ...errorDetails });
  if (rawMessage === "MONGODB_URI is not configured" || rawMessage.startsWith("JWT_SECRET")) {
    res.status(503).json({ error: "Authentication is not configured. Check the Vercel environment variables." });
    return;
  }
  res.status(503).json({ error: "The authentication database is temporarily unavailable." });
}
function normalizeEmail(value) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
function text(value) {
  return typeof value === "string" ? value.trim() : "";
}
function registrationError(role, body) {
  const email = normalizeEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || password.length < 8) {
    return "Enter a valid email and a password of at least 8 characters.";
  }
  if (role === "buyer" && !text(body.full_name)) {
    return "Please provide your full name.";
  }
  if (role === "vendor") {
    const required = [
      "business_name",
      "contact_person",
      "company_registration_no",
      "bank_name",
      "bank_account_number"
    ];
    if (required.some((key) => !text(body[key]))) {
      return "Complete the required business, registration, and bank details.";
    }
  }
  return null;
}
function requestBody(req) {
  let body = req.body;
  if (body == null || body === "") return {};
  if (Buffer.isBuffer(body)) body = body.toString("utf8");
  if (typeof body === "string") {
    if (!body.trim()) return {};
    try {
      body = JSON.parse(body);
    } catch {
      const error = new Error("Invalid JSON request body");
      error.statusCode = 400;
      throw error;
    }
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    const error = new Error("Request body must be a JSON object");
    error.statusCode = 400;
    throw error;
  }
  return body;
}
function issueToken(account) {
  return jwt.sign(
    { id: account.id, email: account.email, role: account.role },
    jwtSecret(),
    { expiresIn: "7d" }
  );
}
async function createAccount(db, role, body, res) {
  const email = normalizeEmail(body.email);
  const password = body.password;
  let fields;
  if (role === "buyer") {
    const fullName = text(body.full_name);
    fields = {
      full_name: fullName,
      phone: text(body.phone),
      shipping_address_line1: text(body.shipping_address_line1),
      shipping_address_line2: text(body.shipping_address_line2),
      city: text(body.city),
      state: text(body.state),
      country: text(body.country) || "Nigeria",
      location: text(body.location) || [text(body.city), text(body.state), text(body.country) || "Nigeria"].filter(Boolean).join(", "),
      postal_code: text(body.postal_code)
    };
  } else {
    fields = {
      business_name: text(body.business_name),
      contact_person: text(body.contact_person),
      phone: text(body.phone),
      city: text(body.city),
      state: text(body.state),
      country: text(body.country) || "Nigeria",
      location: text(body.location) || [text(body.city), text(body.state), text(body.country) || "Nigeria"].filter(Boolean).join(", "),
      company_registration_no: text(body.company_registration_no),
      tax_id: text(body.tax_id),
      bank_name: text(body.bank_name),
      bank_account_number: text(body.bank_account_number),
      bank_account_name: text(body.bank_account_name) || text(body.business_name),
      bank_code: text(body.bank_code) || "057",
      store_description: text(body.store_description) || "WebNexa Verified Merchant",
      store_logo_url: text(body.store_logo_url),
      is_approved: false,
      rejection_reason: null,
      approved_at: null,
      approved_by_admin_id: null,
      wallet_balance: 0,
      escrow_pending_balance: 0,
      business_category: body.business_category === "RESTAURANT_FOOD" ? "RESTAURANT_FOOD" : "GENERAL",
      restaurant_business_type: text(body.restaurant_business_type),
      operating_hours: text(body.operating_hours),
      delivery_radius_km: Number(body.delivery_radius_km) || 10,
      preparation_time_mins: Number(body.preparation_time_mins) || 30,
      hygiene_badges: Array.isArray(body.hygiene_badges) ? body.hygiene_badges : []
    };
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const id = `${role}-${randomUUID()}`;
  const account = {
    _id: id,
    id,
    role,
    email,
    password_hash: await bcrypt.hash(password, 12),
    ...fields,
    created_at: now,
    updated_at: now
  };
  try {
    await db.collection("accounts").insertOne(account);
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11e3) {
      res.status(409).json({ error: "An account with those details already exists." });
      return;
    }
    throw error;
  }
  const responseKey = role;
  res.status(201).json({
    message: role === "buyer" ? "Buyer registered successfully." : "Vendor application submitted successfully. Your account is currently pending verification by The WebNexa Platform.",
    token: issueToken(account),
    [responseKey]: publicAccount(account),
    role,
    ...role === "vendor" ? { status: "PENDING_APPROVAL" } : {}
  });
}
async function provisionAdminIfConfigured(db, email, password) {
  const configuredEmail = normalizeEmail(process.env.ADMIN_EMAIL);
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredEmail || !configuredPassword || email !== configuredEmail || password !== configuredPassword) return;
  const accounts = db.collection("accounts");
  const existing = await accounts.findOne({ role: "admin" });
  if (existing) return;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const id = `admin-${randomUUID()}`;
  const account = {
    _id: id,
    id,
    role: "admin",
    name: "WebNexa Administrator",
    email,
    password_hash: await bcrypt.hash(password, 12),
    privilege_level: "SUPER_ADMIN",
    last_login: now,
    created_at: now,
    updated_at: now
  };
  try {
    await accounts.insertOne(account);
  } catch (error) {
    if (!(error instanceof MongoServerError && error.code === 11e3)) throw error;
  }
}
async function login(db, role, body, res) {
  const email = normalizeEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }
  if (role === "admin") await provisionAdminIfConfigured(db, email, password);
  const account = await db.collection("accounts").findOne({ role, email });
  if (!account || !await bcrypt.compare(password, account.password_hash)) {
    res.status(401).json({ error: role === "admin" ? "Access Denied: Invalid administrator credentials." : `Invalid ${role} email or password.` });
    return;
  }
  const safeAccount = publicAccount(account);
  const roleKey = role;
  if (role === "vendor" && account.is_approved !== true) {
    res.json({ message: "Vendor login successful. Your account is pending verification.", token: issueToken(account), [roleKey]: safeAccount, role, status: "PENDING_APPROVAL" });
    return;
  }
  res.json({
    message: role === "admin" ? "Admin authorization granted." : `${role[0].toUpperCase()}${role.slice(1)} logged in successfully.`,
    token: issueToken(account),
    [roleKey]: safeAccount,
    role
  });
}
async function currentAccount(db, role, req, res) {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  const secret = jwtSecret();
  let decoded;
  try {
    decoded = jwt.verify(authorization.slice(7), secret);
  } catch {
    res.status(401).json({ error: "Invalid or expired session token." });
    return;
  }
  if (decoded.role !== role) {
    res.status(401).json({ error: "Invalid or expired session token." });
    return;
  }
  const account = await db.collection("accounts").findOne({ _id: decoded.id, role });
  if (!account) {
    res.status(401).json({ error: "Invalid or expired session token." });
    return;
  }
  res.json({ [role]: publicAccount(account), role });
}
async function handleMongoAuth(req, res, role, operation) {
  try {
    jwtSecret();
    const body = operation === "me" ? {} : requestBody(req);
    if (operation === "login" && (!normalizeEmail(body.email) || !text(body.password))) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }
    if (operation === "register") {
      if (role === "admin") {
        res.status(405).json({ error: "Administrator registration is disabled." });
        return;
      }
      const validationError = registrationError(role, body);
      if (validationError) {
        res.status(400).json({ error: validationError });
        return;
      }
    }
    const db = await getDatabase();
    if (operation === "me") {
      await currentAccount(db, role, req, res);
      return;
    }
    if (operation === "register") {
      await createAccount(db, role, body, res);
      return;
    }
    await login(db, role, body, res);
  } catch (error) {
    sendConfigurationError(res, error, { role, operation });
  }
}
async function handleMongoHealth(_req, res) {
  try {
    const db = await getDatabase();
    await db.command({ ping: 1 });
    res.status(200).json({ status: "ok", service: "WebNexa Authentication API", database: "MongoDB Atlas connected" });
  } catch (error) {
    sendConfigurationError(res, error, { operation: "health" });
  }
}
async function handleMongoGoogleAuth(req, res) {
  try {
    jwtSecret();
    const db = await getDatabase();
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const accessToken = typeof body.token === "string" ? body.token : "";
    const role = body.role;
    if (!accessToken || role !== "buyer" && role !== "vendor") {
      res.status(400).json({ success: false, message: "A Google token and valid account role are required." });
      return;
    }
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      res.status(503).json({ success: false, message: "Google Authentication is not configured on the server." });
      return;
    }
    const google = new OAuth2Client(clientId);
    const tokenInfo = await google.getTokenInfo(accessToken);
    if (tokenInfo.aud !== clientId || !tokenInfo.email) {
      res.status(401).json({ success: false, message: "Google token audience or email could not be verified." });
      return;
    }
    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!profileResponse.ok) {
      res.status(401).json({ success: false, message: "Unable to retrieve the Google account profile." });
      return;
    }
    const profile = await profileResponse.json();
    const email = normalizeEmail(profile.email || tokenInfo.email);
    if (!profile.sub || !email || profile.email_verified === false) {
      res.status(401).json({ success: false, message: "Google account email verification failed." });
      return;
    }
    const accounts = db.collection("accounts");
    let account = await accounts.findOne({ role, email });
    if (role === "vendor" && !account) {
      res.status(404).json({ success: false, message: "No vendor account is linked to this Google email. Complete vendor onboarding first." });
      return;
    }
    if (!account && role === "buyer") {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const id = `buyer-${randomUUID()}`;
      const newBuyer = {
        _id: id,
        id,
        role: "buyer",
        full_name: text(profile.name) || email.split("@")[0],
        email,
        password_hash: await bcrypt.hash(randomUUID(), 12),
        phone: "",
        shipping_address_line1: "",
        shipping_address_line2: "",
        city: "",
        state: "",
        country: "Nigeria",
        postal_code: "",
        created_at: now,
        updated_at: now
      };
      try {
        await accounts.insertOne(newBuyer);
        account = newBuyer;
      } catch (error) {
        if (!(error instanceof MongoServerError && error.code === 11e3)) throw error;
        account = await accounts.findOne({ role: "buyer", email });
      }
    }
    if (!account) {
      res.status(401).json({ success: false, message: "Unable to link this Google account." });
      return;
    }
    res.json({
      success: true,
      token: issueToken(account),
      [role]: publicAccount(account),
      role
    });
  } catch (error) {
    sendConfigurationError(res, error, { operation: "google" });
  }
}
export {
  handleMongoAuth,
  handleMongoGoogleAuth,
  handleMongoHealth
};
