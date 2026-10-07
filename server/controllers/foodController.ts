import { Response } from 'express';
import { FoodOrderRecord, MenuItemRecord, RestaurantRecord, store } from '../store.ts';
import { AuthenticatedBuyerRequest, AuthenticatedVendorRequest } from '../middleware/auth.ts';
import { normalizePhoneE164 } from '../utils/phone.ts';

export function listRestaurants(_req: any, res: Response): void {
  res.json({ restaurants: store.restaurants.map((restaurant) => ({
    ...restaurant,
    menu_items: store.menuItems.filter((item) => item.restaurant_id === restaurant.id),
  })) });
}

export function createRestaurant(req: AuthenticatedVendorRequest, res: Response): void {
  if (!req.vendor) { res.status(401).json({ error: 'Vendor authentication required.' }); return; }
  const restaurant: RestaurantRecord = {
    id: `restaurant-${Date.now()}`, vendor_id: req.vendor.id,
    business_name: req.body.business_name || req.vendor.business_name,
    cuisine_type: req.body.cuisine_type || req.vendor.restaurant_business_type || 'Restaurant',
    opening_hours: req.body.opening_hours || req.vendor.operating_hours || '09:00 - 22:00',
    delivery_radius_km: Number(req.body.delivery_radius_km) || req.vendor.delivery_radius_km || 10,
    preparation_time_mins: Number(req.body.preparation_time_mins) || req.vendor.preparation_time_mins || 30,
    hygiene_badges: Array.isArray(req.body.hygiene_badges) ? req.body.hygiene_badges : req.vendor.hygiene_badges || [],
  };
  store.restaurants.push(restaurant);
  res.status(201).json({ restaurant });
}

export function getVendorFoodDashboard(req: AuthenticatedVendorRequest, res: Response): void {
  if (!req.vendor) { res.status(401).json({ error: 'Vendor authentication required.' }); return; }
  const restaurant = store.restaurants.find((candidate) => candidate.vendor_id === req.vendor?.id);
  res.json({ restaurant, menu_items: restaurant ? store.menuItems.filter((item) => item.restaurant_id === restaurant.id) : [], orders: restaurant ? store.foodOrders.filter((order) => order.restaurant_id === restaurant.id) : [] });
}

export function createMenuItem(req: AuthenticatedVendorRequest, res: Response): void {
  if (!req.vendor) { res.status(401).json({ error: 'Vendor authentication required.' }); return; }
  const restaurant = store.restaurants.find((item) => item.id === req.body.restaurant_id && item.vendor_id === req.vendor?.id);
  if (!restaurant) { res.status(404).json({ error: 'Restaurant not found.' }); return; }
  const item: MenuItemRecord = {
    id: `menu-${Date.now()}`, restaurant_id: restaurant.id, item_name: req.body.item_name,
    description: req.body.description || '', price: Number(req.body.price), category: req.body.category || 'Main Course',
    image_url: req.body.image_url || '', is_available: req.body.is_available !== false,
    addons: Array.isArray(req.body.addons) ? req.body.addons.map((addon: any, index: number) => ({
      id: `addon-${Date.now()}-${index}`, addon_name: addon.addon_name, extra_price: Number(addon.extra_price) || 0,
    })) : [],
  };
  if (!item.item_name || !Number.isFinite(item.price)) { res.status(400).json({ error: 'Item name and price are required.' }); return; }
  store.menuItems.push(item);
  res.status(201).json({ item });
}

export function updateMenuAvailability(req: AuthenticatedVendorRequest, res: Response): void {
  const item = store.menuItems.find((candidate) => candidate.id === req.params.itemId);
  const restaurant = item && store.restaurants.find((candidate) => candidate.id === item.restaurant_id && candidate.vendor_id === req.vendor?.id);
  if (!item || !restaurant) { res.status(404).json({ error: 'Menu item not found.' }); return; }
  item.is_available = Boolean(req.body.is_available);
  res.json({ item });
}

export function createFoodOrder(req: AuthenticatedBuyerRequest, res: Response): void {
  if (!req.buyer) { res.status(401).json({ error: 'Buyer authentication required.' }); return; }
  const restaurant = store.restaurants.find((candidate) => candidate.id === req.body.restaurant_id);
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (!restaurant || !items.length || !req.body.delivery_address) { res.status(400).json({ error: 'Restaurant, items, and delivery address are required.' }); return; }
  const total = items.reduce((sum: number, entry: any) => {
    const menuItem = store.menuItems.find((candidate) => candidate.id === entry.menu_item_id && candidate.restaurant_id === restaurant.id && candidate.is_available);
    return sum + (menuItem ? menuItem.price * Math.max(1, Number(entry.quantity) || 1) : 0);
  }, 0);
  if (!total) { res.status(400).json({ error: 'No available menu items selected.' }); return; }
  const order: FoodOrderRecord = {
    id: `food-order-${Date.now()}`, buyer_id: req.buyer.id, restaurant_id: restaurant.id, total_amount: total,
    delivery_address: req.body.delivery_address, delivery_phone: normalizePhoneE164(req.body.delivery_phone), delivery_notes: req.body.delivery_notes,
    scheduled_for: req.body.scheduled_for || null, preparation_status: 'PLACED', delivery_status: 'PENDING',
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  };
  store.foodOrders.push(order);
  res.status(201).json({ order });
}

export function updateFoodOrderStatus(req: AuthenticatedVendorRequest, res: Response): void {
  const order = store.foodOrders.find((candidate) => candidate.id === req.params.orderId);
  const restaurant = order && store.restaurants.find((candidate) => candidate.id === order.restaurant_id && candidate.vendor_id === req.vendor?.id);
  if (!order || !restaurant) { res.status(404).json({ error: 'Food order not found.' }); return; }
  const status = req.body.status;
  if (['ACCEPTED', 'PREPARING', 'READY'].includes(status)) order.preparation_status = status;
  if (status === 'OUT_FOR_DELIVERY') order.delivery_status = status;
  order.updated_at = new Date().toISOString();
  res.json({ order });
}

export function confirmFoodDelivery(req: AuthenticatedBuyerRequest, res: Response): void {
  const order = store.foodOrders.find((candidate) => candidate.id === req.params.orderId && candidate.buyer_id === req.buyer?.id);
  if (!order) { res.status(404).json({ error: 'Food order not found.' }); return; }
  if (order.delivery_status === 'DELIVERED_AND_CONFIRMED') { res.json({ order, already_settled: true }); return; }
  order.delivery_status = 'DELIVERED_AND_CONFIRMED';
  order.updated_at = new Date().toISOString();
  const restaurant = store.restaurants.find((candidate) => candidate.id === order.restaurant_id);
  const vendor = restaurant && store.vendors.find((candidate) => candidate.id === restaurant.vendor_id);
  if (vendor) vendor.wallet_balance += order.total_amount;
  res.json({ order, payout: { vendor_id: vendor?.id, amount: order.total_amount, status: 'credited' } });
}
