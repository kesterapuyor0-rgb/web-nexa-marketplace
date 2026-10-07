import { Response } from 'express';
import { store } from '../store.ts';
import { AuthenticatedBuyerRequest, AuthenticatedVendorRequest } from '../middleware/auth.ts';

export async function getBuyerOrders(req: AuthenticatedBuyerRequest, res: Response): Promise<void> {
  try {
    const buyer = req.buyer;
    if (!buyer) {
      res.status(401).json({ error: 'Buyer unauthorized.' });
      return;
    }

    const orders = store.orders.filter((o) => o.buyer_id === buyer.id);
    res.json({ orders });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve buyer orders: ' + err.message });
  }
}

export async function getVendorOrders(req: AuthenticatedVendorRequest, res: Response): Promise<void> {
  try {
    const vendor = req.vendor;
    if (!vendor) {
      res.status(401).json({ error: 'Vendor unauthorized.' });
      return;
    }

    const orders = store.orders.filter(
      (o) => o.vendor_id === vendor.id || o.items.some((i) => i.vendor_id === vendor.id)
    );
    res.json({ orders });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve vendor orders: ' + err.message });
  }
}
