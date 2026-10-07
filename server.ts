import 'dotenv/config';
import express, { Request } from 'express';
import { createServer } from 'http';
import { execFile } from 'child_process';
import { Server as SocketServer } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { requireBuyerAuth, requireVendorAuth, requireApprovedVendor, requireAdminAuth, requireSocialAuth } from './server/middleware/auth.ts';
import { buyerRegister, buyerLogin, getBuyerProfile, updateBuyerProfile } from './server/controllers/buyerAuth.ts';
import { vendorRegister, vendorLogin, getVendorProfile, updateVendorBranding } from './server/controllers/vendorAuth.ts';
import { adminLogin, getAdminProfile } from './server/controllers/adminAuth.ts';
import { getProducts, getProductById, getVendorProducts, createProduct, updateProduct, deleteProduct } from './server/controllers/productController.ts';
import {
  initializeCheckout,
  initializePaystackPayment,
  verifyPayment,
  handlePaystackWebhook,
  vendorShipOrder,
  buyerConfirmDelivery,
  adminReleaseEscrow,
} from './server/controllers/escrowController.ts';
import { paymentEvents } from './server/controllers/escrowController.ts';
import {
  getAdminDashboardStats,
  getAllVendors,
  approveVendor,
  rejectVendor,
  getAllEscrowTransactions,
  getAllOrders,
  getAllAdminProducts,
  approveProduct,
  toggleAutoReleaseEscrow,
  getEscrowSettings,
} from './server/controllers/adminDashboard.ts';
import { getBuyerOrders, getVendorOrders } from './server/controllers/orderQueries.ts';
import { createVendorReview, listVendorReviews } from './server/controllers/vendorReviews.ts';
import { createMessage, createSocialPost, likeSocialPost, listMessages, listSocialPosts } from './server/controllers/socialController.ts';
import { initializeMysqlDatabase, synchronizeAuthRecordsToMysql } from './server/database/mysqlPersistence.ts';
import { store } from './server/store.ts';
import { listRestaurants, createRestaurant, getVendorFoodDashboard, createMenuItem, updateMenuAvailability, createFoodOrder, updateFoodOrderStatus, confirmFoodDelivery } from './server/controllers/foodController.ts';
import { googleLogin } from './server/controllers/googleAuth.ts';
import { googleBuyerRegister } from './server/controllers/googleAuth.ts';
import {
  getWallet,
  listWalletTransactions,
  initializeWalletPaystack,
  initializeWalletCrypto,
  handleWalletPaystackWebhook,
  handleNowPaymentsWebhook,
  adminVendorPayout,
} from './server/controllers/walletController.ts';

async function startServer() {
  const mysqlReady = await initializeMysqlDatabase();
  if (mysqlReady) {
    await synchronizeAuthRecordsToMysql(store.buyers, store.vendors, store.admins);
  }
  const app = express();
  const PORT = Number(process.env.PORT) || 5000;
  const httpServer = createServer(app);
  const io = new SocketServer(httpServer, { cors: { origin: true, credentials: true } });

  paymentEvents.on('payment.verified', (payload) => {
    io.emit('payment.verified', payload);
  });

  io.on('connection', (socket) => {
    socket.on('join-conversation', (conversationId: string) => {
      if (typeof conversationId === 'string' && conversationId.length < 200) socket.join(conversationId);
    });
    socket.on('send-message', (message: { conversationId?: string }) => {
      if (message?.conversationId) io.to(message.conversationId).emit('message', message);
    });
  });

  // Body parser
  app.use(express.json({
    limit: '10mb',
    verify: (req, _res, buffer) => {
      (req as Request & { rawBody?: Buffer }).rawBody = Buffer.from(buffer);
    },
  }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'WebNexa Multi-Vendor Marketplace Core API',
      timestamp: new Date().toISOString(),
      database: 'MySQL Architecture (Strict Table Separation)',
      brand: 'WebNexa - Next-Generation Web Solutions',
    });
  });

  // -------------------------------------------------------------------------
  // BUYER AUTHENTICATION ROUTES (Dedicated /login portal)
  // -------------------------------------------------------------------------
  app.post('/api/auth/buyer/register', buyerRegister);
  app.post('/api/auth/buyer/login', buyerLogin);
  app.post('/api/auth/google', googleLogin);
  app.post('/api/auth/google/register', googleBuyerRegister);
  app.get('/api/auth/buyer/me', requireBuyerAuth, getBuyerProfile);
  app.put('/api/auth/buyer/profile', requireBuyerAuth, updateBuyerProfile);

  // -------------------------------------------------------------------------
  // VENDOR AUTHENTICATION & ONBOARDING ROUTES (Dedicated /vendor/login portal)
  // -------------------------------------------------------------------------
  app.post('/api/auth/vendor/register', vendorRegister);
  app.post('/api/auth/vendor/login', vendorLogin);
  app.get('/api/auth/vendor/me', requireVendorAuth, getVendorProfile);
  app.patch('/api/vendor/branding', requireVendorAuth, updateVendorBranding);

  app.get('/api/food/restaurants', listRestaurants);
  app.post('/api/vendor/restaurant', requireVendorAuth, createRestaurant);
  app.get('/api/vendor/food-dashboard', requireVendorAuth, getVendorFoodDashboard);
  app.post('/api/vendor/menu-items', requireVendorAuth, requireApprovedVendor, createMenuItem);
  app.patch('/api/vendor/menu-items/:itemId/availability', requireVendorAuth, updateMenuAvailability);
  app.post('/api/food/orders', requireBuyerAuth, createFoodOrder);
  app.patch('/api/vendor/food-orders/:orderId/status', requireVendorAuth, updateFoodOrderStatus);
  app.post('/api/food/orders/:orderId/confirm-delivery', requireBuyerAuth, confirmFoodDelivery);

  // -------------------------------------------------------------------------
  // ADMIN AUTHENTICATION ROUTES (Strictly isolated /admin/login portal)
  // -------------------------------------------------------------------------
  app.post('/api/auth/admin/login', adminLogin);
  app.get('/api/auth/admin/me', requireAdminAuth, getAdminProfile);

  // -------------------------------------------------------------------------
  // PRODUCT CATALOG & INVENTORY ROUTES
  // -------------------------------------------------------------------------
  app.get('/api/products', getProducts);
  app.get('/api/products/:id', getProductById);
  app.get('/api/vendor/products', requireVendorAuth, getVendorProducts);
  app.post('/api/vendor/products', requireVendorAuth, requireApprovedVendor, createProduct);
  app.put('/api/vendor/products/:id', requireVendorAuth, requireApprovedVendor, updateProduct);
  app.delete('/api/vendor/products/:id', requireVendorAuth, deleteProduct);

  // -------------------------------------------------------------------------
  // ORDER & WEBNEXA ESCROW VAULT WORKFLOW ROUTES
  // -------------------------------------------------------------------------
  app.post('/api/checkout/initialize', requireBuyerAuth, initializeCheckout);
  app.post('/api/checkout/verify', requireBuyerAuth, verifyPayment);
  app.post('/api/paystack/webhook', handlePaystackWebhook);
  app.post('/api/payments/verify-paystack', requireBuyerAuth, verifyPayment);
  app.get('/api/payments/verify-paystack', requireBuyerAuth, verifyPayment);
  app.post('/api/payments/paystack/initialize', requireBuyerAuth, initializePaystackPayment);
  app.post('/api/payments/paystack-webhook', handlePaystackWebhook);
  app.post('/api/payments/wallet/paystack', requireBuyerAuth, initializeWalletPaystack);
  app.post('/api/payments/wallet/crypto', requireBuyerAuth, initializeWalletCrypto);
  app.post('/api/payments/deposit/paystack', requireBuyerAuth, initializeWalletPaystack);
  app.post('/api/payments/deposit/crypto', requireBuyerAuth, initializeWalletCrypto);
  app.post('/api/payments/nowpayments-webhook', handleNowPaymentsWebhook);
  app.get('/api/wallet', requireBuyerAuth, getWallet);
  app.get('/api/wallet/transactions', requireBuyerAuth, listWalletTransactions);
  app.get('/api/orders/buyer', requireBuyerAuth, getBuyerOrders);
  app.post('/api/vendor-reviews', requireBuyerAuth, createVendorReview);
  app.get('/api/vendor-reviews/:vendorId', listVendorReviews);
  app.get('/api/vendors/:vendorId/profile', listVendorReviews);
  app.get('/api/feed', listSocialPosts);
  app.post('/api/feed', requireSocialAuth, createSocialPost);
  app.post('/api/feed/:id/like', requireSocialAuth, likeSocialPost);
  app.get('/api/messages', requireSocialAuth, listMessages);
  app.post('/api/messages', requireSocialAuth, createMessage);
  app.get('/api/orders/vendor', requireVendorAuth, getVendorOrders);
  app.post('/api/orders/:id/ship', requireVendorAuth, vendorShipOrder);
  app.post('/api/orders/:id/confirm-delivery', requireBuyerAuth, buyerConfirmDelivery);
  app.post('/api/vendor/payments/wallet/paystack', requireVendorAuth, initializeWalletPaystack);
  app.post('/api/vendor/payments/wallet/crypto', requireVendorAuth, initializeWalletCrypto);
  app.get('/api/vendor/wallet', requireVendorAuth, getWallet);
  app.get('/api/vendor/wallet/transactions', requireVendorAuth, listWalletTransactions);

  // -------------------------------------------------------------------------
  // ADMIN DASHBOARD & APPROVAL MANAGEMENT ROUTES
  // -------------------------------------------------------------------------
  app.get('/api/admin/stats', requireAdminAuth, getAdminDashboardStats);
  app.get('/api/admin/vendors', requireAdminAuth, getAllVendors);
  app.post('/api/admin/vendors/:id/approve', requireAdminAuth, approveVendor);
  app.post('/api/admin/vendors/:id/reject', requireAdminAuth, rejectVendor);
  app.get('/api/admin/escrow', requireAdminAuth, getAllEscrowTransactions);
  app.post('/api/admin/escrow/:id/release', requireAdminAuth, adminReleaseEscrow);
  app.get('/api/admin/orders', requireAdminAuth, getAllOrders);
  app.get('/api/admin/products', requireAdminAuth, getAllAdminProducts);
  app.post('/api/admin/products/:id/approve', requireAdminAuth, approveProduct);
  app.get('/api/admin/escrow/settings', requireAdminAuth, getEscrowSettings);
  app.post('/api/admin/escrow/settings', requireAdminAuth, toggleAutoReleaseEscrow);
  app.post('/api/admin/payments/wallet/paystack', requireAdminAuth, initializeWalletPaystack);
  app.post('/api/admin/payments/wallet/crypto', requireAdminAuth, initializeWalletCrypto);
  app.get('/api/admin/wallet', requireAdminAuth, getWallet);
  app.get('/api/admin/wallet/transactions', requireAdminAuth, listWalletTransactions);
  app.post('/api/admin/vendors/:vendorId/payout', requireAdminAuth, adminVendorPayout);

  // Schema & Documentation endpoint for interactive inspection
  app.get('/api/docs/schema', (req, res) => {
    try {
      const schemaPath = path.join(process.cwd(), 'server', 'database', 'schema.sql');
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      res.type('text/plain').send(schemaContent);
    } catch (err: any) {
      res.status(500).send('-- Failed to read schema file: ' + err.message);
    }
  });

  // -------------------------------------------------------------------------
  // VITE CLIENT INTEGRATION
  // -------------------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  let attemptedPortRecovery = false;
  httpServer.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      if (attemptedPortRecovery) {
        console.error(`[0] CRITICAL: Port ${PORT} is still in use after cleanup. Change process.env.PORT or stop the owning process.`);
        process.exitCode = 1;
        return;
      }
      attemptedPortRecovery = true;
      console.error(`[0] Port ${PORT} is occupied. Attempting to free it once...`);
      execFile(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['kill-port', String(PORT)], (cleanupError, _stdout, stderr) => {
        if (cleanupError) {
          console.error(`[0] CRITICAL: Unable to free port ${PORT}: ${stderr || cleanupError.message}`);
          process.exitCode = 1;
          return;
        }
        setTimeout(() => {
          httpServer.listen(PORT, '0.0.0.0', () => {
            console.log(`[0] Express Server recovered at http://127.0.0.1:${PORT}`);
          });
        }, 500);
      });
    } else {
      console.error('[0] CRITICAL: Server failed to start:', err);
      process.exitCode = 1;
    }
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log('[0] =================================');
    console.log(`[0] Express Server running at http://127.0.0.1:${PORT}`);
    console.log('[0] =================================');
  });
}

startServer().catch((err: unknown) => {
  console.error('Server startup failed:', err);
  process.exitCode = 1;
});
