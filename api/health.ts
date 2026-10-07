import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleMongoHealth } from '../server/mongoAuth.ts';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  return handleMongoHealth(req, res);
}
