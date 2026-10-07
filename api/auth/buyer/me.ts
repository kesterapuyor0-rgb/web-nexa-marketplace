import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleMongoAuth } from '../../_mongoAuth.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  return handleMongoAuth(req, res, 'buyer', 'me');
}
