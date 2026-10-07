import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { store } from '../store.ts';
import { signJwtToken, AuthenticatedAdminRequest } from '../middleware/auth.ts';
import { findAdminByEmail, isMysqlAvailable, saveAdminToMysql } from '../database/mysqlPersistence.ts';

export async function adminLogin(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Admin email and master security password are required.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const admin = isMysqlAvailable()
      ? await findAdminByEmail(normalizedEmail)
      : store.admins.find((a) => a.email.toLowerCase() === normalizedEmail);
    if (!admin) {
      res.status(401).json({ error: 'Access Denied: Invalid administrator credentials.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Access Denied: Invalid administrator credentials.' });
      return;
    }

    admin.last_login = new Date().toISOString();
    if (isMysqlAvailable()) await saveAdminToMysql(admin);

    const token = signJwtToken({ id: admin.id, email: admin.email, role: 'admin' });
    const { password_hash: _, ...safeAdmin } = admin;

    res.json({
      message: 'Admin authorization granted.',
      token,
      admin: safeAdmin,
      role: 'admin',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Admin security authentication error: ' + err.message });
  }
}

export async function getAdminProfile(req: AuthenticatedAdminRequest, res: Response): Promise<void> {
  if (!req.admin) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }
  const { password_hash: _, ...safeAdmin } = req.admin;
  res.json({ admin: safeAdmin, role: 'admin' });
}
