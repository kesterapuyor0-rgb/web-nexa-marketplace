import { randomBytes } from 'crypto';
import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcryptjs';
import { store, BuyerRecord } from '../store.ts';
import { signJwtToken } from '../middleware/auth.ts';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

interface GoogleProfile {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
}

export async function googleLogin(req: Request, res: Response): Promise<void> {
  const { token, role } = req.body as { token?: string; role?: 'buyer' | 'vendor' };
  if (!token || (role !== 'buyer' && role !== 'vendor')) {
    res.status(400).json({ success: false, message: 'A Google token and valid account role are required.' });
    return;
  }

  if (!GOOGLE_CLIENT_ID) {
    res.status(503).json({ success: false, message: 'Google Authentication is not configured on the server.' });
    return;
  }

  try {
    const tokenInfo = await googleClient.getTokenInfo(token);
    if (tokenInfo.aud !== GOOGLE_CLIENT_ID || !tokenInfo.email) {
      res.status(401).json({ success: false, message: 'Google token audience or email could not be verified.' });
      return;
    }

    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!profileResponse.ok) {
      res.status(401).json({ success: false, message: 'Unable to retrieve the Google account profile.' });
      return;
    }
    const profile = await profileResponse.json() as GoogleProfile;
    const email = profile.email?.trim().toLowerCase() || tokenInfo.email.trim().toLowerCase();
    if (!profile.sub || !email || profile.email_verified === false) {
      res.status(401).json({ success: false, message: 'Google account email verification failed.' });
      return;
    }

    if (role === 'vendor') {
      const vendor = store.vendors.find((candidate) => candidate.email.toLowerCase() === email);
      if (!vendor) {
        res.status(404).json({ success: false, message: 'No vendor account is linked to this Google email. Complete vendor onboarding first.' });
        return;
      }
      const authToken = signJwtToken({ id: vendor.id, email: vendor.email, role: 'vendor' });
      const { password_hash: _, ...safeVendor } = vendor;
      res.json({ success: true, token: authToken, vendor: safeVendor, role: 'vendor' });
      return;
    }

    let buyer = store.buyers.find((candidate) => candidate.email.toLowerCase() === email);
    if (!buyer) {
      const timestamp = new Date().toISOString();
      const password_hash = await bcrypt.hash(randomBytes(32).toString('hex'), 10);
      buyer = {
        id: `buyer-${Date.now()}`,
        full_name: profile.name?.trim() || email.split('@')[0],
        email,
        password_hash,
        phone: '',
        shipping_address_line1: '',
        shipping_address_line2: '',
        city: 'Lagos',
        state: 'Lagos State',
        country: 'Nigeria',
        postal_code: '',
        created_at: timestamp,
        updated_at: timestamp,
      } satisfies BuyerRecord;
      store.buyers.push(buyer);
      store.persistAuthRecords();
    }

    const authToken = signJwtToken({ id: buyer.id, email: buyer.email, role: 'buyer' });
    const { password_hash: _, ...safeBuyer } = buyer;
    res.json({ success: true, token: authToken, buyer: safeBuyer, role: 'buyer' });
  } catch (error) {
    console.error('Google authentication error:', error);
    res.status(401).json({ success: false, message: 'Google Authentication failed.' });
  }
}

export async function googleBuyerRegister(req: Request, res: Response): Promise<void> {
  req.body = { ...req.body, role: 'buyer' };
  await googleLogin(req, res);
}
