import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { store, BuyerRecord } from '../store.ts';
import { signJwtToken, AuthenticatedBuyerRequest } from '../middleware/auth.ts';
import { normalizePhoneE164 } from '../utils/phone.ts';
import { findBuyerByEmail, isMysqlAvailable, saveBuyerToMysql } from '../database/mysqlPersistence.ts';

export async function buyerRegister(req: Request, res: Response): Promise<void> {
  try {
    const { full_name, email, password, phone, shipping_address_line1, shipping_address_line2, city, state, country, postal_code } = req.body;

    if (!full_name || !email || !password) {
      res.status(400).json({ error: 'Please provide full name, email, and password.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingBuyer = isMysqlAvailable()
      ? await findBuyerByEmail(normalizedEmail)
      : store.buyers.find((b) => b.email.toLowerCase() === normalizedEmail);
    if (existingBuyer) {
      res.status(409).json({ error: 'A buyer account with this email address already exists.' });
      return;
    }

    const password_hash = await bcrypt.hash(password, 10);
    const newBuyer: BuyerRecord = {
      id: `buyer-${Date.now()}`,
      full_name: full_name.trim(),
      email: normalizedEmail,
      password_hash,
      phone: normalizePhoneE164(phone),
      shipping_address_line1: shipping_address_line1 || '',
      shipping_address_line2: shipping_address_line2 || '',
      city: city || 'Lagos',
      state: state || 'Lagos State',
      country: country || 'Nigeria',
      postal_code: postal_code || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    store.buyers.push(newBuyer);
    if (isMysqlAvailable()) await saveBuyerToMysql(newBuyer);
    store.persistAuthRecords();

    const token = signJwtToken({ id: newBuyer.id, email: newBuyer.email, role: 'buyer' });
    const { password_hash: _, ...safeBuyer } = newBuyer;

    res.status(201).json({
      message: 'Buyer registered successfully.',
      token,
      buyer: safeBuyer,
      role: 'buyer',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to complete buyer registration: ' + err.message });
  }
}

export async function buyerLogin(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const buyer = isMysqlAvailable()
      ? await findBuyerByEmail(normalizedEmail)
      : store.buyers.find((b) => b.email.toLowerCase() === normalizedEmail);
    if (!buyer) {
      res.status(401).json({ error: 'Invalid buyer email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, buyer.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid buyer email or password.' });
      return;
    }

    const token = signJwtToken({ id: buyer.id, email: buyer.email, role: 'buyer' });
    const { password_hash: _, ...safeBuyer } = buyer;

    res.json({
      message: 'Buyer logged in successfully.',
      token,
      buyer: safeBuyer,
      role: 'buyer',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Buyer authentication error: ' + err.message });
  }
}

export async function getBuyerProfile(req: AuthenticatedBuyerRequest, res: Response): Promise<void> {
  if (!req.buyer) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }
  const { password_hash: _, ...safeBuyer } = req.buyer;
  res.json({ buyer: safeBuyer, role: 'buyer' });
}

export async function updateBuyerProfile(req: AuthenticatedBuyerRequest, res: Response): Promise<void> {
  if (!req.buyer) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }

  const { full_name, phone, shipping_address_line1, shipping_address_line2, city, state, postal_code } = req.body;
  if (full_name) req.buyer.full_name = full_name;
  if (phone !== undefined) req.buyer.phone = normalizePhoneE164(phone);
  if (shipping_address_line1 !== undefined) req.buyer.shipping_address_line1 = shipping_address_line1;
  if (shipping_address_line2 !== undefined) req.buyer.shipping_address_line2 = shipping_address_line2;
  if (city !== undefined) req.buyer.city = city;
  if (state !== undefined) req.buyer.state = state;
  if (postal_code !== undefined) req.buyer.postal_code = postal_code;
  req.buyer.updated_at = new Date().toISOString();
  if (isMysqlAvailable()) await saveBuyerToMysql(req.buyer);
  store.persistAuthRecords();

  const { password_hash: _, ...safeBuyer } = req.buyer;
  res.json({ message: 'Profile updated successfully.', buyer: safeBuyer });
}
