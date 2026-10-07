import { Request, Response } from 'express';
import crypto from 'crypto';
import { store, OrderRecord, OrderItemRecord, EscrowTransactionRecord } from '../store.ts';
import { AuthenticatedBuyerRequest, AuthenticatedVendorRequest, AuthenticatedAdminRequest } from '../middleware/auth.ts';
import { EventEmitter } from 'events';
import { recordVerifiedBuyerPayment } from './walletController.ts';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY || '';
const PLATFORM_PROTECTION_FEE_PERCENTAGE = 0.02; // 2% platform protection fee
export const paymentEvents = new EventEmitter();

/**
 * 1. BUYER INITIATES CHECKOUT & WEBNEXA ESCROW VAULT SESSION
 */
export async function initializeCheckout(req: AuthenticatedBuyerRequest, res: Response): Promise<void> {
  try {
    const buyer = req.buyer;
    if (!buyer) {
      res.status(401).json({ error: 'Buyer authentication required.' });
      return;
    }

    const { items, shipping_address } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Checkout cart is empty.' });
      return;
    }

    // Resolve products from store
    const orderItems: OrderItemRecord[] = [];
    let totalAmount = 0;
    const orderId = `ord-${Date.now()}`;
    const orderNumber = `WN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const paystackReference = `WN_ORD_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    for (const item of items) {
      const product = store.products.find((p) => p.id === item.productId);
      if (!product) {
        res.status(400).json({ error: `Product ID ${item.productId} not found.` });
        return;
      }

      const vendor = store.vendors.find((v) => v.id === product.vendor_id);
      const vendorName = vendor ? vendor.business_name : (product.vendor_name || 'Verified Vendor');

      const qty = Number(item.quantity) || 1;
      const subtotal = product.price * qty;
      totalAmount += subtotal;

      orderItems.push({
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        order_id: orderId,
        product_id: product.id,
        vendor_id: product.vendor_id,
        vendor_name: vendorName,
        title: product.title,
        price: product.price,
        quantity: qty,
        subtotal,
        image: product.images[0] || '',
      });
    }

    const vendorIds = Array.from(new Set(orderItems.map((i) => i.vendor_id)));
    const vendorNames = Array.from(new Set(orderItems.map((i) => i.vendor_name)));
    const isMultiVendor = vendorIds.length > 1;
    const primaryVendorId = isMultiVendor ? 'MULTI_VENDOR' : vendorIds[0];
    const primaryVendorName = isMultiVendor ? vendorNames.join(', ') : vendorNames[0];

    const escrowFee = Math.round(totalAmount * PLATFORM_PROTECTION_FEE_PERCENTAGE);
    const vendorPayoutAmount = totalAmount - escrowFee;

    const newOrder: OrderRecord = {
      id: orderId,
      order_number: orderNumber,
      buyer_id: buyer.id,
      buyer_name: buyer.full_name,
      buyer_email: buyer.email,
      vendor_id: primaryVendorId,
      vendor_name: primaryVendorName,
      total_amount: totalAmount,
      escrow_fee: escrowFee,
      vendor_payout_amount: vendorPayoutAmount,
      currency: 'NGN',
      status: 'PENDING_PAYMENT',
      shipping_address: shipping_address || {
        recipient_name: buyer.full_name,
        phone: buyer.phone,
        address_line1: buyer.shipping_address_line1,
        city: buyer.city,
        state: buyer.state,
        country: buyer.country,
      },
      items: orderItems,
      paystack_reference: paystackReference,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    store.orders.unshift(newOrder);

    // If real Paystack Secret Key is provided, call Paystack API
    let authorizationUrl = '';
    let accessCode = '';

    if (!req.body.defer_payment && !PAYSTACK_SECRET_KEY) {
      res.status(503).json({ error: 'Paystack is not configured on the server.' });
      return;
    }
    if (!req.body.defer_payment) {
      try {
        const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: buyer.email,
            amount: totalAmount * 100, // Paystack operates in kobo (x100)
            reference: paystackReference,
            callback_url: `${process.env.APP_URL || ''}/buyer/orders?ref=${paystackReference}`,
            metadata: {
              order_id: orderId,
              order_number: orderNumber,
              buyer_id: buyer.id,
              vendor_id: primaryVendorId,
              payment_protection: 'WebNexa Buyer Protection Guard',
            },
          }),
        });

        const paystackData: any = await paystackRes.json();
        if (paystackRes.ok && paystackData.status && paystackData.data?.reference === paystackReference) {
          authorizationUrl = paystackData.data.authorization_url;
          accessCode = paystackData.data.access_code;
        } else {
          store.orders = store.orders.filter((candidate) => candidate.id !== orderId);
          res.status(502).json({ error: paystackData.message || 'Paystack rejected payment initialization.' });
          return;
        }
      } catch (e) {
        res.status(502).json({ error: 'Unable to initialize Paystack payment.' });
        return;
      }
    }

    res.status(201).json({
      message: 'Secure order created. Proceed to payment.',
      order: newOrder,
      paystack: {
        reference: paystackReference,
        amount: totalAmount,
        publicKey: PAYSTACK_PUBLIC_KEY,
        authorization_url: authorizationUrl,
        access_code: accessCode,
        is_live_key_configured: Boolean(PAYSTACK_SECRET_KEY && !PAYSTACK_SECRET_KEY.includes('sk_test_xxxx')),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Checkout initialization failed: ' + err.message });
  }
}

export async function initializePaystackPayment(req: AuthenticatedBuyerRequest, res: Response): Promise<void> {
  const buyer = req.buyer;
  if (!buyer) {
    res.status(401).json({ error: 'Buyer authentication required.' });
    return;
  }
  if (!PAYSTACK_SECRET_KEY) {
    res.status(503).json({ error: 'Paystack is not configured on the server.' });
    return;
  }

  const requestedAmount = Number(req.body.amount);
  const order = store.orders.find((candidate) =>
    candidate.buyer_id === buyer.id &&
    (req.body.order_id ? candidate.id === req.body.order_id : candidate.status === 'PENDING_PAYMENT' && (!Number.isFinite(requestedAmount) || Math.round(candidate.total_amount * 100) === Math.round(requestedAmount * 100))),
  );
  if (!order) {
    res.status(404).json({ error: 'Checkout order not found.' });
    return;
  }
  if (order.status !== 'PENDING_PAYMENT') {
    res.status(409).json({ error: 'This order is no longer awaiting payment.' });
    return;
  }

  const reference = typeof req.body.reference === 'string' && req.body.reference.trim()
    ? req.body.reference.trim()
    : `WN_ORD_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const callbackUrl = `${process.env.FRONTEND_URL || process.env.APP_URL || `${req.protocol}://${req.get('host')}`}/checkout/verify`;
  let response: globalThis.Response;
  let payload: any;
  try {
    response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `******`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: typeof req.body.email === 'string' && req.body.email.trim() ? req.body.email.trim() : buyer.email,
        amount: Math.round(order.total_amount * 100),
        reference,
        callback_url: callbackUrl,
        metadata: { order_id: order.id, order_number: order.order_number, buyer_id: buyer.id },
      }),
    });
    payload = await response.json();
  } catch {
    res.status(502).json({ error: 'Unable to reach Paystack payment initialization.' });
    return;
  }
  if (!response.ok || !payload.status || !payload.data?.authorization_url) {
    res.status(502).json({ error: payload.message || 'Paystack rejected payment initialization.' });
    return;
  }

  order.paystack_reference = payload.data.reference || reference;
  order.updated_at = new Date().toISOString();
  res.json({
    status: true,
    data: {
      authorization_url: payload.data.authorization_url,
      reference: order.paystack_reference,
    },
  });
}

/**
 * 2. VERIFY PAYSTACK TRANSACTION & LOCK FUNDS IN WEBNEXA ESCROW
 */
export async function verifyPayment(req: AuthenticatedBuyerRequest, res: Response): Promise<void> {
  try {
    const reference = req.body.reference || req.query.reference;
    if (!reference) {
      res.status(400).json({ error: 'Transaction reference is required.' });
      return;
    }

    const order = store.orders.find((o) => o.paystack_reference === reference);
    if (!order) {
      res.status(404).json({ error: 'Order not found for given reference.' });
      return;
    }

    if (order.buyer_id !== req.buyer?.id) {
      res.status(403).json({ error: 'Access denied: this order was created by another buyer account.' });
      return;
    }

    if (order.status === 'payment_verified_pending_admin_approval' || order.status === 'HELD_IN_ESCROW' || order.status === 'SHIPPED' || order.status === 'DELIVERED') {
      res.json({ message: 'Payment is already verified and held by the platform.', order });
      return;
    }

    if (!PAYSTACK_SECRET_KEY) {
      res.status(503).json({ error: 'Paystack is not configured on the server.' });
      return;
    }
    let paymentVerified = false;
    let channel = 'card';

    {
      try {
        const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
          headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
        });
        const verifyData: any = await verifyRes.json();
        if (
          verifyData.status &&
          verifyData.data?.status === 'success' &&
          Number(verifyData.data.amount) === Math.round(order.total_amount * 100)
        ) {
          paymentVerified = true;
          channel = verifyData.data.channel || 'card';
        }
      } catch (err) {
        res.status(502).json({ error: 'Unable to verify the Paystack transaction.' });
        return;
      }
    }

    if (!paymentVerified) {
      res.status(400).json({ error: 'Paystack transaction could not be verified.' });
      return;
    }

    // Verify payment and hold it under platform-managed secure settlement.
    order.status = 'payment_verified_pending_admin_approval';
    order.updated_at = new Date().toISOString();
    recordVerifiedBuyerPayment(reference, order.total_amount, 'paystack', order.id);
    paymentEvents.emit('payment.verified', { orderId: order.id, reference, status: order.status });

    // Group items by vendor to create vendor-specific escrow transaction entries
    const vendorIds = Array.from(new Set(order.items.map((i) => i.vendor_id || order.vendor_id)));
    const createdEscrowTxs: EscrowTransactionRecord[] = [];

    for (const vId of vendorIds) {
      const vendorItems = order.items.filter((i) => (i.vendor_id || order.vendor_id) === vId);
      const vendorSubtotal = vendorItems.reduce((sum, i) => sum + i.subtotal, 0);
      const vendorProtectionFee = Math.round(vendorSubtotal * PLATFORM_PROTECTION_FEE_PERCENTAGE);
      const vendorPayout = vendorSubtotal - vendorProtectionFee;

      const vendor = store.vendors.find((v) => v.id === vId);
      const vendorName = vendor ? vendor.business_name : (vendorItems[0]?.vendor_name || 'Verified Vendor');

      // Create separate escrow transaction entry per vendor under the parent order
      const escrowTx: EscrowTransactionRecord = {
        id: `esc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        order_id: order.id,
        order_number: order.order_number,
        buyer_id: order.buyer_id,
        buyer_name: order.buyer_name,
        vendor_id: vId,
        vendor_name: vendorName,
        paystack_reference: reference,
        paystack_channel: channel,
        amount: vendorSubtotal,
        currency: 'NGN',
        escrow_status: 'HOLDING',
        released_by_admin_id: null,
        released_by_admin_name: null,
        released_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      store.escrowTransactions.unshift(escrowTx);
      createdEscrowTxs.push(escrowTx);

      // Split into vendor-specific escrow pending balances
      if (vendor) {
        vendor.escrow_pending_balance += vendorPayout;
      }
    }

    res.json({
      message: `Payment verified! ₦${order.total_amount.toLocaleString()} is pending admin approval across ${createdEscrowTxs.length} vendor settlement record(s).`,
      order,
      escrow: createdEscrowTxs[0],
      escrow_transactions: createdEscrowTxs,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Verification error: ' + err.message });
  }
}

/**
 * 3. PAYSTACK WEBHOOK HANDLER
 */
export async function handlePaystackWebhook(req: Request, res: Response): Promise<void> {
  try {
    const signature = req.headers['x-paystack-signature'];
    if (!PAYSTACK_SECRET_KEY || typeof signature !== 'string') {
      res.status(401).send('Paystack signature required');
      return;
    }
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody || Buffer.from(JSON.stringify(req.body));
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(rawBody).digest('hex');
    const receivedSignature = Buffer.from(signature);
    const expectedSignature = Buffer.from(hash);
    if (receivedSignature.length !== expectedSignature.length || !crypto.timingSafeEqual(expectedSignature, receivedSignature)) {
      res.status(401).send('Invalid signature');
      return;
    }

    const event = req.body;
    if (event.event === 'charge.success') {
      const reference = event.data.reference;
      const order = store.orders.find((o) => o.paystack_reference === reference);
      if (order && order.status === 'PENDING_PAYMENT' && Number(event.data?.amount) === Math.round(order.total_amount * 100)) {
        order.status = 'payment_verified_pending_admin_approval';
        order.updated_at = new Date().toISOString();
        recordVerifiedBuyerPayment(reference, order.total_amount, 'paystack', order.id);
        paymentEvents.emit('payment.verified', { orderId: order.id, reference, status: order.status });

        // Check if escrow transactions already exist, if not create per vendor
        const existingTx = store.escrowTransactions.find((e) => e.order_id === order.id);
        if (!existingTx) {
          const vendorIds = Array.from(new Set(order.items.map((i) => i.vendor_id || order.vendor_id)));
          for (const vId of vendorIds) {
            const vendorItems = order.items.filter((i) => (i.vendor_id || order.vendor_id) === vId);
            const vendorSubtotal = vendorItems.reduce((sum, i) => sum + i.subtotal, 0);
            const vendorProtectionFee = Math.round(vendorSubtotal * PLATFORM_PROTECTION_FEE_PERCENTAGE);
            const vendorPayout = vendorSubtotal - vendorProtectionFee;

            const vendor = store.vendors.find((v) => v.id === vId);
            const vendorName = vendor ? vendor.business_name : (vendorItems[0]?.vendor_name || 'Verified Vendor');

            const escrowTx: EscrowTransactionRecord = {
              id: `esc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              order_id: order.id,
              order_number: order.order_number,
              buyer_id: order.buyer_id,
              buyer_name: order.buyer_name,
              vendor_id: vId,
              vendor_name: vendorName,
              paystack_reference: reference,
              paystack_channel: event.data?.channel || 'card',
              amount: vendorSubtotal,
              currency: 'NGN',
              escrow_status: 'HOLDING',
              released_by_admin_id: null,
              released_by_admin_name: null,
              released_at: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            store.escrowTransactions.unshift(escrowTx);

            if (vendor) {
              vendor.escrow_pending_balance += vendorPayout;
            }
          }
        }
      }
    }

    // Delivery providers can notify this endpoint when a shipment is received.
    // Delivery confirmation, not payment capture, is the payout trigger.
    if (event.event === 'delivery.confirmed' || event.event === 'order.delivered') {
      const orderId = event.data?.order_id || event.data?.orderId;
      const reference = event.data?.reference || event.data?.paystack_reference;
      const order = store.orders.find(
        (candidate) => candidate.id === orderId || candidate.paystack_reference === reference
      );

      if (order && order.status !== 'delivered_and_completed') {
        order.status = 'delivered_and_completed';
        order.delivered_at = event.data?.delivered_at || new Date().toISOString();
        order.escrow_released_at = order.delivered_at;
        order.updated_at = new Date().toISOString();
        settleOrderPayout(order, order.updated_at);
      }
    }

    res.sendStatus(200);
  } catch (err: any) {
    res.status(500).json({ error: 'Webhook processing error: ' + err.message });
  }
}

/**
 * 4. VENDOR FULFILLS ORDER AND MARKS AS "SHIPPED"
 */
export async function vendorShipOrder(req: AuthenticatedVendorRequest, res: Response): Promise<void> {
  try {
    const vendor = req.vendor;
    const { id } = req.params;
    const { carrier_name, tracking_number } = req.body;

    const order = store.orders.find(
      (o) => o.id === id && (o.vendor_id === vendor!.id || o.items.some((i) => i.vendor_id === vendor!.id))
    );
    if (!order) {
      res.status(404).json({ error: 'Order not found in vendor orders.' });
      return;
    }

    if (order.status !== 'HELD_IN_ESCROW') {
      res.status(400).json({ error: `Cannot mark as shipped. Current order status is: ${order.status}` });
      return;
    }

    order.status = 'SHIPPED';
    order.carrier_name = carrier_name || 'WebNexa Express Freight';
    order.tracking_number = tracking_number || `WN-TRK-${Math.floor(100000 + Math.random() * 900000)}`;
    order.shipped_at = new Date().toISOString();
    order.updated_at = new Date().toISOString();

    res.json({
      message: 'Order status updated to SHIPPED. Buyer notified with tracking credentials.',
      order,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Shipment update failed: ' + err.message });
  }
}

/**
 * Settle each vendor's net order amount exactly once after verified delivery.
 * `wallet_balance` is the platform wallet balance exposed to vendors.
 */
function settleOrderPayout(order: OrderRecord, settlementTime: string): void {
  let settlementTransactions = store.escrowTransactions.filter((tx) => tx.order_id === order.id);

  if (settlementTransactions.length === 0) {
    const vendorIds = Array.from(new Set(order.items.map((item) => item.vendor_id || order.vendor_id)));
    settlementTransactions = vendorIds.map((vendorId) => {
      const vendorItems = order.items.filter((item) => (item.vendor_id || order.vendor_id) === vendorId);
      const vendor = store.vendors.find((candidate) => candidate.id === vendorId);
      const transaction: EscrowTransactionRecord = {
        id: `settlement-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        order_id: order.id,
        order_number: order.order_number,
        buyer_id: order.buyer_id,
        buyer_name: order.buyer_name,
        vendor_id: vendorId,
        vendor_name: vendor?.business_name || vendorItems[0]?.vendor_name || 'Verified Vendor',
        paystack_reference: order.paystack_reference || '',
        paystack_channel: 'delivery_confirmation',
        amount: vendorItems.reduce((sum, item) => sum + item.subtotal, 0),
        currency: order.currency,
        escrow_status: 'HOLDING',
        released_by_admin_id: null,
        released_by_admin_name: null,
        released_at: null,
        created_at: settlementTime,
        updated_at: settlementTime,
      };
      store.escrowTransactions.unshift(transaction);
      return transaction;
    });
  }

  for (const tx of settlementTransactions) {
    if (tx.escrow_status === 'RELEASED_TO_VENDOR') continue;

    const vendor = store.vendors.find((candidate) => candidate.id === tx.vendor_id);
    if (!vendor) continue;

    const vendorPayout = tx.amount - Math.round(tx.amount * PLATFORM_PROTECTION_FEE_PERCENTAGE);
    tx.escrow_status = 'RELEASED_TO_VENDOR';
    tx.released_by_admin_name = 'WebNexa Platform Settlement';
    tx.released_at = settlementTime;
    tx.updated_at = settlementTime;
    vendor.wallet_balance += vendorPayout;
    vendor.escrow_pending_balance = Math.max(0, vendor.escrow_pending_balance - vendorPayout);
    vendor.updated_at = settlementTime;
  }
}

/**
 * 5. BUYER CONFIRMS DELIVERY RECEIPT
 */
export async function buyerConfirmDelivery(req: AuthenticatedBuyerRequest, res: Response): Promise<void> {
  try {
    const buyer = req.buyer;
    const { id } = req.params;

    const order = store.orders.find((o) => o.id === id && o.buyer_id === buyer!.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found for authenticated buyer.' });
      return;
    }

    if (order.status === 'delivered_and_completed') {
      res.json({ message: 'Delivery was already confirmed and the vendor payout was completed.', order, autoReleased: true });
      return;
    }

    if (order.status !== 'SHIPPED') {
      res.status(400).json({ error: `Cannot confirm delivery. Order must be SHIPPED first. Current status: ${order.status}` });
      return;
    }

    order.status = 'delivered_and_completed';
    order.delivered_at = new Date().toISOString();
    order.escrow_released_at = new Date().toISOString();
    order.updated_at = new Date().toISOString();

    const settlementTime = new Date().toISOString();
    settleOrderPayout(order, settlementTime);

    res.json({
      message: 'Delivery confirmed. The vendor was credited ₦' + order.vendor_payout_amount.toLocaleString() + ' immediately through Platform-Managed Secure Settlement.',
      order,
      autoReleased: true,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Delivery confirmation failed: ' + err.message });
  }
}

/**
 * 6. WEBNEXA PLATFORM RELEASES ESCROW FUNDS TO VENDOR BALANCE
 */
export async function adminReleaseEscrow(req: AuthenticatedAdminRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const order = store.orders.find((o) => o.id === id);
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    if (order.status === 'ESCROW_RELEASED') {
      res.status(400).json({ error: 'This order has already been settled to the vendor wallet.' });
      return;
    }

    if (order.status !== 'delivered_and_completed') {
      res.status(400).json({ error: 'Payouts are released automatically only after verified delivery.' });
      return;
    }

    const settlementTime = new Date().toISOString();
    settleOrderPayout(order, settlementTime);
    const escrowTxs = store.escrowTransactions.filter((e) => e.order_id === order.id);

    res.json({
      message: `Payout of ₦${order.vendor_payout_amount.toLocaleString()} is already settled across vendor wallet balance(s).`,
      order,
      escrow_transactions: escrowTxs,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Escrow release failed: ' + err.message });
  }
}
