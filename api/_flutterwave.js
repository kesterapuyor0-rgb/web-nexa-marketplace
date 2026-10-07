import crypto from "node:crypto";
import { getMongoClient } from "./_mongoAuth.js";

export function requireFlutterwaveCredentials() {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  const encryptionKey = process.env.FLUTTERWAVE_ENCRYPTION_KEY;
  if (!secretKey || !encryptionKey) {
    const error = new Error("Flutterwave server credentials are not configured.");
    error.statusCode = 503;
    throw error;
  }
  return { secretKey, encryptionKey };
}

export function webhookIsAuthentic(req) {
  const secretHash = process.env.FLUTTERWAVE_WEBHOOK_HASH;
  const suppliedHash = req.headers["verif-hash"];
  if (typeof secretHash !== "string" || !secretHash || typeof suppliedHash !== "string") return false;
  const expected = Buffer.from(secretHash);
  const received = Buffer.from(suppliedHash);
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

export async function flutterwaveRequest(path, { method = "GET", body } = {}) {
  const { secretKey } = requireFlutterwaveCredentials();
  const response = await fetch(`https://api.flutterwave.com/v3${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json"
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.status !== "success") {
    const error = new Error(payload.message || "Flutterwave request failed.");
    error.statusCode = 502;
    error.providerStatus = response.status;
    throw error;
  }
  return payload.data;
}

export async function verifyFlutterwaveTransaction(transactionId) {
  if (!transactionId) throw new Error("Flutterwave transaction ID is required.");
  return flutterwaveRequest(`/transactions/${encodeURIComponent(transactionId)}/verify`);
}

export async function withMongoTransaction(db, operation) {
  const client = await getMongoClient();
  const session = client.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await operation(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

export function toNaira(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) / 100 : 0;
}