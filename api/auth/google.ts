import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleMongoGoogleAuth } from '../../server/mongoAuth.ts';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  return handleMongoGoogleAuth(req, res);
}
