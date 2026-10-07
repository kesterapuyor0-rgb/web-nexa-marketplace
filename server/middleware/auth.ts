import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { store, BuyerRecord, VendorRecord, AdminRecord } from '../store.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'webnexa_super_secure_jwt_secret_key_2026';

export interface AuthenticatedBuyerRequest extends Request { buyer?: BuyerRecord; }
export interface AuthenticatedVendorRequest extends Request { vendor?: VendorRecord; }
export interface AuthenticatedAdminRequest extends Request { admin?: AdminRecord; }
export interface AuthenticatedSocialRequest extends Request {
  socialUser?: { id: string; role: 'buyer' | 'vendor'; name: string };
}

export function signJwtToken(payload: { id: string; email: string; role: 'buyer' | 'vendor' | 'admin' }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function requireBuyerAuth(req: AuthenticatedBuyerRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please log in to your Buyer account.' });
    return;
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as { id: string; role: string };
    if (decoded.role !== 'buyer') throw new Error('Buyer credentials required');
    const buyer = store.buyers.find((candidate) => candidate.id === decoded.id);
    if (!buyer) throw new Error('Buyer account not found');
    req.buyer = buyer;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}

export function requireVendorAuth(req: AuthenticatedVendorRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please log in to your Vendor portal.' });
    return;
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as { id: string; role: string };
    if (decoded.role !== 'vendor') throw new Error('Vendor credentials required');
    const vendor = store.vendors.find((candidate) => candidate.id === decoded.id);
    if (!vendor) throw new Error('Vendor account not found');
    req.vendor = vendor;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired vendor session token.' });
  }
}

export function requireApprovedVendor(req: AuthenticatedVendorRequest, res: Response, next: NextFunction): void {
  if (!req.vendor) {
    res.status(401).json({ error: 'Vendor authentication required.' });
    return;
  }
  if (!req.vendor.is_approved) {
    res.status(403).json({ error: 'Vendor Verification Pending', status: 'PENDING_APPROVAL' });
    return;
  }
  next();
}

export function requireAdminAuth(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Administrator authentication required.' });
    return;
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as { id: string; role: string };
    if (decoded.role !== 'admin') throw new Error('Admin credentials required');
    const admin = store.admins.find((candidate) => candidate.id === decoded.id);
    if (!admin) throw new Error('Admin not found');
    req.admin = admin;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired admin session token.' });
  }
}

export function requireSocialAuth(req: AuthenticatedSocialRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as { id: string; role: 'buyer' | 'vendor' };
    if (decoded.role === 'buyer') {
      const buyer = store.buyers.find((candidate) => candidate.id === decoded.id);
      if (!buyer) throw new Error('Buyer not found');
      req.socialUser = { id: buyer.id, role: 'buyer', name: buyer.full_name };
    } else {
      const vendor = store.vendors.find((candidate) => candidate.id === decoded.id);
      if (!vendor) throw new Error('Vendor not found');
      req.socialUser = { id: vendor.id, role: 'vendor', name: vendor.business_name };
    }
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}
