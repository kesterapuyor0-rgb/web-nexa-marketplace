import { Request, Response } from 'express';
import { store, ChatMessageRecord, SocialPostRecord } from '../store.ts';
import { AuthenticatedSocialRequest } from '../middleware/auth.ts';

export function listSocialPosts(_req: Request, res: Response): void {
  res.json({ posts: [...store.socialPosts].sort((a, b) => b.created_at.localeCompare(a.created_at)) });
}

export function createSocialPost(req: AuthenticatedSocialRequest, res: Response): void {
  const user = req.socialUser;
  const body = typeof req.body.body === 'string' ? req.body.body.trim() : '';
  if (!user || !body) {
    res.status(400).json({ error: 'Post content is required.' });
    return;
  }
  const post: SocialPostRecord = {
    id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    author_id: user.id,
    author_role: user.role,
    handle: `@${user.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
    body: body.slice(0, 4000),
    media_url: typeof req.body.media_url === 'string' ? req.body.media_url : undefined,
    product_id: typeof req.body.product_id === 'string' ? req.body.product_id : undefined,
    likes_count: 0,
    created_at: new Date().toISOString(),
  };
  store.socialPosts.unshift(post);
  res.status(201).json({ post });
}

export function likeSocialPost(req: AuthenticatedSocialRequest, res: Response): void {
  const post = store.socialPosts.find((candidate) => candidate.id === req.params.id);
  if (!post) {
    res.status(404).json({ error: 'Post not found.' });
    return;
  }
  post.likes_count += 1;
  res.json({ post });
}

export function listMessages(req: AuthenticatedSocialRequest, res: Response): void {
  const user = req.socialUser;
  if (!user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const messages = store.chatMessages.filter(
    (message) => (message.sender_id === user.id || message.recipient_id === user.id)
      && (!req.query.with || message.sender_id === req.query.with || message.recipient_id === req.query.with)
  );
  res.json({ messages });
}

export function createMessage(req: AuthenticatedSocialRequest, res: Response): void {
  const user = req.socialUser;
  const body = typeof req.body.body === 'string' ? req.body.body.trim() : '';
  const recipientId = typeof req.body.recipient_id === 'string' ? req.body.recipient_id : '';
  if (!user || !body || !recipientId) {
    res.status(400).json({ error: 'Recipient and message body are required.' });
    return;
  }
  const recipientRole = store.buyers.some((buyer) => buyer.id === recipientId) ? 'buyer' : 'vendor';
  const message: ChatMessageRecord = {
    id: `message-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sender_id: user.id,
    sender_role: user.role,
    recipient_id: recipientId,
    recipient_role: recipientRole,
    body: body.slice(0, 4000),
    created_at: new Date().toISOString(),
  };
  store.chatMessages.push(message);
  res.status(201).json({ message });
}
