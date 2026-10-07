import { Response } from 'express';
import { AuthenticatedBuyerRequest } from '../middleware/auth.ts';
import { store, VendorReviewRecord } from '../store.ts';
import { listVendorReviewsFromMysql, saveVendorReviewToMysql } from '../database/mysqlPersistence.ts';

export function getVendorRating(vendorId: string) {
  const reviews = store.vendorReviews.filter((review) => review.vendor_id === vendorId);
  if (reviews.length === 0) return { average_rating: 0, review_count: 0 };
  const average_rating = Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1));
  return { average_rating, review_count: reviews.length };
}

export async function createVendorReview(req: AuthenticatedBuyerRequest, res: Response): Promise<void> {
  const buyer = req.buyer;
  if (!buyer) {
    res.status(401).json({ error: 'Buyer authentication required.' });
    return;
  }

  const { vendor_id, order_id, rating, review_text, photo_url } = req.body;
  const numericRating = Number(rating);
  const order = store.orders.find((candidate) => candidate.id === order_id && candidate.buyer_id === buyer.id);
  const vendorPurchased = order?.items.some((item) => item.vendor_id === vendor_id) || order?.vendor_id === vendor_id;

  if (!order || !vendorPurchased || !['DELIVERED', 'delivered_and_completed', 'ESCROW_RELEASED'].includes(order.status)) {
    res.status(403).json({ error: 'Reviews are available only after a successfully delivered and completed order.' });
    return;
  }
  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    res.status(400).json({ error: 'Rating must be a whole number from 1 to 5.' });
    return;
  }
  if (store.vendorReviews.some((review) => review.buyer_id === buyer.id && review.order_id === order_id && review.vendor_id === vendor_id)) {
    res.status(409).json({ error: 'You have already reviewed this vendor for this order.' });
    return;
  }

  const review: VendorReviewRecord = {
    id: `review-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    vendor_id,
    buyer_id: buyer.id,
    order_id,
    rating: numericRating,
    review_text: typeof review_text === 'string' ? review_text.trim().slice(0, 2000) : '',
    photo_url: typeof photo_url === 'string' ? photo_url : '',
    created_at: new Date().toISOString(),
  };
  store.vendorReviews.push(review);
  await saveVendorReviewToMysql(review);
  res.status(201).json({ review, rating: getVendorRating(vendor_id) });
}

export async function listVendorReviews(req: any, res: Response): Promise<void> {
  const mysqlReviews = await listVendorReviewsFromMysql(req.params.vendorId);
  const reviews = mysqlReviews || store.vendorReviews.filter((review) => review.vendor_id === req.params.vendorId);
  const vendor = store.vendors.find((candidate) => candidate.id === req.params.vendorId);
  if (!vendor) {
    res.status(404).json({ error: 'Vendor not found.' });
    return;
  }
  const { password_hash: _, ...safeVendor } = vendor;
  res.json({
    vendor: { ...safeVendor, ...getVendorRating(vendor.id) },
    products: store.products.filter((product) => product.vendor_id === vendor.id && product.is_active && product.is_approved_by_admin),
    reviews,
    rating: getVendorRating(vendor.id),
  });
}
