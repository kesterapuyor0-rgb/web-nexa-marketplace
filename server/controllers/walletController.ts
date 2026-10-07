import { Request, Response } from 'express';
import crypto from 'crypto';
import {
  store,
  BuyerRecord,
  VendorRecord,
  AdminRecord,
  WalletOwnerType,
  WalletRecord,
  WalletTransactionRecord,
} from '../store.ts';
import {
  AuthenticatedAdminRequest,
  AuthenticatedBuyerRequest,
  AuthenticatedVendorRequest,
} from '../middleware/auth.ts';

const paystackSecret = () => process.env.PAYSTACK_SECRET_KEY || '';
const nowPaymentsKey = () => process.env.NOWPAYMENTS_API_KEY || '';
const nowPaymentsUrl = () => process.env.NOWPAYMENTS_API_URL || 'https://api.nowpayments.io/v1';

type AuthRequest = Request & { buyer?: BuyerRecord; vendor?: VendorRecord; admin?: AdminRecord };
function owner(req: AuthRequest): { type: WalletOwnerType; id: string } | null {
  if (req.buyer) return { type: 'buyer', id: req.buyer.id };
  if (req.vendor) return { type: 'vendor', id: req.vendor.id };
  if (req.admin) return { type: 'admin', id: req.admin.id };
  return null;
}
function walletFor(type: WalletOwnerType, id: string): WalletRecord | undefined {
  const existing = store.wallets.find((wallet) => wallet.owner_type === type && wallet.owner_id === id);
  if (existing) return existing;
  const created: WalletRecord = {
    id: `wallet-${type}-${id}`,
    owner_type: type,
    owner_id: id,
    currency: 'NGN',
    balance: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  store.wallets.push(created);
  return created;
}
function platformWallet(): WalletRecord | undefined {
  return store.wallets.find((wallet) => wallet.owner_type === 'admin');
}
function amountInNaira(value: unknown): number {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) / 100 : 0;
}
function recordTransaction(wallet: WalletRecord, input: Omit<WalletTransactionRecord, 'id' | 'wallet_id' | 'owner_type' | 'owner_id' | 'created_at'>): WalletTransactionRecord {
  const transaction: WalletTransactionRecord = {
    ...input,
    id: `wtx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    wallet_id: wallet.id,
    owner_type: wallet.owner_type,
    owner_id: wallet.owner_id,
    created_at: new Date().toISOString(),
  };
  store.walletTransactions.unshift(transaction);
  return transaction;
}
function completeDeposit(reference: string, amount: number, provider: 'paystack' | 'nowpayments', metadata: Record<string, unknown> = {}) {
  const transaction = store.walletTransactions.find((item) => item.provider_reference === reference);
  if (!transaction) return { applied: false, reason: 'unknown_reference' };
  if (transaction.status === 'completed') return { applied: false, reason: 'already_processed', transaction };
  if (amount > 0 && Math.abs(transaction.amount - amount) > 0.01 && provider === 'paystack') {
    transaction.status = 'failed';
    return { applied: false, reason: 'amount_mismatch' };
  }

  const target = walletFor(transaction.owner_type, transaction.owner_id);
  if (!target) return { applied: false, reason: 'wallet_not_found' };
  target.balance += transaction.amount;
  target.updated_at = new Date().toISOString();
  transaction.status = 'completed';
  transaction.metadata = { ...(transaction.metadata || {}), ...metadata };
  return { applied: true, transaction };
}

/** Records an already verified marketplace checkout in the platform wallet. */
export function recordVerifiedBuyerPayment(reference: string, amount: number, provider: 'paystack' | 'nowpayments', orderId: string): void {
  const wallet = platformWallet();
  if (!wallet || store.walletTransactions.some((item) => item.provider_reference === reference && item.status === 'completed')) return;
  const transaction = recordTransaction(wallet, {
    type: 'payment',
    direction: 'credit',
    amount,
    currency: 'NGN',
    provider,
    provider_reference: reference,
    status: 'completed',
    description: `Verified marketplace payment for ${orderId}`,
    metadata: { order_id: orderId },
  });
  wallet.balance += transaction.amount;
  wallet.updated_at = new Date().toISOString();
}

export function getWallet(req: AuthRequest, res: Response): void {
  const identity = owner(req);
  if (!identity) { res.status(401).json({ error: 'Authentication required.' }); return; }
  const wallet = walletFor(identity.type, identity.id);
  if (!wallet) { res.status(404).json({ error: 'Wallet not found.' }); return; }
  res.json({ wallet, transactions: store.walletTransactions.filter((item) => item.wallet_id === wallet.id).slice(0, 100) });
}

export function listWalletTransactions(req: AuthRequest, res: Response): void {
  const identity = owner(req);
  if (!identity) { res.status(401).json({ error: 'Authentication required.' }); return; }
  res.json({ transactions: store.walletTransactions.filter((item) => item.owner_type === identity.type && item.owner_id === identity.id).slice(0, 100) });
}

function createPendingDeposit(req: AuthRequest, res: Response, provider: 'paystack' | 'nowpayments') {
  const identity = owner(req);
  if (!identity) { res.status(401).json({ error: 'Authentication required.' }); return; }
  const amount = amountInNaira(req.body.amount);
  if (!amount) { res.status(400).json({ error: 'A positive amount is required.' }); return; }
  const wallet = walletFor(identity.type, identity.id);
  if (!wallet) { res.status(404).json({ error: 'Wallet not found.' }); return; }
  // Buyer checkout funds belong to the platform wallet until an admin releases a vendor payout.
  const destination = identity.type === 'buyer' ? platformWallet() : wallet;
  if (!destination) { res.status(503).json({ error: 'Platform wallet is not configured.' }); return; }
  const reference = `${provider === 'paystack' ? 'WN_DEP' : 'WN_CRYPTO'}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const transaction = recordTransaction(destination, {
    type: identity.type === 'buyer' ? 'payment' : 'deposit',
    direction: 'credit',
    amount,
    currency: 'NGN',
    provider,
    provider_reference: reference,
    status: 'pending',
    description: identity.type === 'buyer' ? 'Verified buyer marketplace payment' : 'Wallet deposit',
    metadata: { source_owner_type: identity.type, source_owner_id: identity.id, ...req.body.metadata },
  });
  return { identity, wallet, destination, amount, reference, transaction };
}

export async function initializeWalletPaystack(req: AuthRequest, res: Response): Promise<void> {
  if (!paystackSecret()) { res.status(503).json({ error: 'Paystack is not configured on the server.' }); return; }
  const pending = createPendingDeposit(req, res, 'paystack');
  if (!pending) return;
  const email = req.buyer?.email || req.vendor?.email || req.admin?.email;
  try {
    const requestedChannel = typeof req.body.channel === 'string' ? req.body.channel : '';
    const channels = requestedChannel === 'bank_transfer' ? ['bank_transfer'] : requestedChannel === 'card' ? ['card'] : undefined;
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${paystackSecret()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        amount: Math.round(pending.amount * 100),
        reference: pending.reference,
        ...(channels ? { channels } : {}),
        callback_url: `${process.env.FRONTEND_URL || process.env.APP_URL || ''}/wallet`,
        metadata: { wallet_transaction_id: pending.transaction.id, owner_type: pending.identity.type, owner_id: pending.identity.id },
      }),
    });
    const payload: any = await response.json();
    if (!response.ok || !payload.status) {
      pending.transaction.status = 'failed';
      res.status(502).json({ error: payload.message || 'Paystack rejected wallet payment.' });
      return;
    }
    res.status(201).json({ provider: 'paystack', transaction: pending.transaction, paystack: { reference: pending.reference, authorization_url: payload.data?.authorization_url, access_code: payload.data?.access_code, publicKey: process.env.PAYSTACK_PUBLIC_KEY || '' } });
  } catch {
    pending.transaction.status = 'failed';
    res.status(502).json({ error: 'Unable to initialize Paystack wallet payment.' });
  }
}

export async function initializeWalletCrypto(req: AuthRequest, res: Response): Promise<void> {
  if (!nowPaymentsKey()) { res.status(503).json({ error: 'NOWPayments is not configured on the server.' }); return; }
  const pending = createPendingDeposit(req, res, 'nowpayments');
  if (!pending) return;
  const payCurrency = typeof req.body.pay_currency === 'string' ? req.body.pay_currency.toLowerCase() : 'btc';
  try {
    const response = await fetch(`${nowPaymentsUrl()}/payment`, {
      method: 'POST',
      headers: { 'x-api-key': nowPaymentsKey(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        price_amount: pending.amount,
        price_currency: 'ngn',
        pay_currency: payCurrency,
        order_id: pending.reference,
        ipn_callback_url: `${process.env.APP_URL || ''}/api/payments/nowpayments-webhook`,
        order_description: 'WebNexa wallet deposit',
      }),
    });
    const payload: any = await response.json();
    if (!response.ok || !payload.payment_id) {
      pending.transaction.status = 'failed';
      res.status(502).json({ error: payload.message || 'NOWPayments rejected wallet payment.' });
      return;
    }
    pending.transaction.provider_reference = String(payload.payment_id);
    pending.transaction.metadata = { ...(pending.transaction.metadata || {}), nowpayments_order_id: pending.reference, pay_currency: payCurrency };
    res.status(201).json({ provider: 'nowpayments', transaction: pending.transaction, payment: payload });
  } catch {
    pending.transaction.status = 'failed';
    res.status(502).json({ error: 'Unable to initialize crypto wallet payment.' });
  }
}

export function handleWalletPaystackWebhook(req: Request, res: Response): void {
  const signature = req.headers['x-paystack-signature'];
  if (!paystackSecret() || typeof signature !== 'string') { res.status(401).send('Paystack signature required'); return; }
  const raw = (req as Request & { rawBody?: Buffer }).rawBody || Buffer.from(JSON.stringify(req.body));
  const expected = crypto.createHmac('sha512', paystackSecret()).update(raw).digest('hex');
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) { res.status(401).send('Invalid signature'); return; }
  const data = req.body?.data;
  if (req.body?.event === 'charge.success' && data?.reference) completeDeposit(String(data.reference), Number(data.amount) / 100, 'paystack', { channel: data.channel });
  res.sendStatus(200);
}

export function handleNowPaymentsWebhook(req: Request, res: Response): void {
  const signature = req.headers['x-nowpayments-sig'];
  if (!nowPaymentsKey() || typeof signature !== 'string') { res.status(401).send('NOWPayments signature required'); return; }
  const canonical = JSON.stringify(req.body, Object.keys(req.body || {}).sort());
  const expected = crypto.createHmac('sha512', nowPaymentsKey()).update(canonical).digest('hex');
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) { res.status(401).send('Invalid signature'); return; }
  const status = req.body?.payment_status;
  if (['finished', 'confirmed'].includes(status)) {
    const reference = String(req.body?.order_id || req.body?.payment_id || '');
    const transaction = store.walletTransactions.find((item) => item.provider_reference === reference || item.metadata?.nowpayments_order_id === reference || item.provider_reference === String(req.body?.payment_id));
    if (transaction) completeDeposit(transaction.provider_reference || reference, transaction.amount, 'nowpayments', { payment_status: status, payment_id: req.body?.payment_id });
  }
  res.sendStatus(200);
}

export function adminVendorPayout(req: AuthenticatedAdminRequest, res: Response): void {
  const order = store.orders.find((item) => item.id === req.body.order_id);
  const vendor = store.vendors.find((item) => item.id === req.params.vendorId);
  if (!order || !vendor) { res.status(404).json({ error: 'Order or vendor not found.' }); return; }
  if (order.status !== 'delivered_and_completed') { res.status(409).json({ error: 'Vendor payout is only available after delivered_and_completed.' }); return; }
  const escrow = store.escrowTransactions.find((item) => item.order_id === order.id && item.vendor_id === vendor.id);
  if (!escrow || escrow.escrow_status === 'RELEASED_TO_VENDOR') { res.status(409).json({ error: 'This vendor settlement is already paid or unavailable.' }); return; }
  const amount = Math.round((Number(req.body.amount) || (escrow.amount - Math.round(escrow.amount * 0.02))) * 100) / 100;
  const adminWallet = platformWallet();
  const vendorWallet = walletFor('vendor', vendor.id);
  if (!adminWallet || !vendorWallet || adminWallet.balance < amount) { res.status(409).json({ error: 'Insufficient platform wallet balance for payout.' }); return; }
  adminWallet.balance -= amount; vendorWallet.balance += amount;
  const now = new Date().toISOString();
  adminWallet.updated_at = vendorWallet.updated_at = now;
  recordTransaction(adminWallet, { type: 'payout', direction: 'debit', amount, currency: 'NGN', provider: 'internal', provider_reference: `PAYOUT_${order.id}_${vendor.id}`, status: 'completed', description: `Manual payout for ${order.order_number}`, metadata: { order_id: order.id, vendor_id: vendor.id } });
  recordTransaction(vendorWallet, { type: 'payout', direction: 'credit', amount, currency: 'NGN', provider: 'internal', provider_reference: `PAYOUT_${order.id}_${vendor.id}`, status: 'completed', description: `Settlement for ${order.order_number}`, metadata: { order_id: order.id } });
  vendor.wallet_balance = vendorWallet.balance;
  vendor.escrow_pending_balance = Math.max(0, vendor.escrow_pending_balance - amount);
  escrow.escrow_status = 'RELEASED_TO_VENDOR'; escrow.released_by_admin_id = req.admin?.id; escrow.released_by_admin_name = req.admin?.name; escrow.released_at = now; escrow.updated_at = now;
  res.json({ message: 'Vendor payout completed.', amount, wallet: vendorWallet, transaction: store.walletTransactions[0] });
}
