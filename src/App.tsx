import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import { CartProvider } from './context/CartContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { CheckoutModal } from './components/CheckoutModal.tsx';

// Pages
import { MarketplaceHome } from './pages/MarketplaceHome.tsx';
import { BuyerLogin } from './pages/BuyerLogin.tsx';
import { BuyerOrders } from './pages/BuyerOrders.tsx';
import { Checkout } from './pages/Checkout.tsx';
import { BuyerProtectedRoute } from './components/BuyerProtectedRoute.tsx';
import { VendorLogin } from './pages/VendorLogin.tsx';
import { VendorRegister } from './pages/VendorRegister.tsx';
import { VendorDashboard } from './pages/VendorDashboard.tsx';
import { AdminLogin } from './pages/AdminLogin.tsx';
import { AdminDashboard } from './pages/AdminDashboard.tsx';
import { SocialFeed } from './pages/SocialFeed.tsx';
import { Messages } from './pages/Messages.tsx';
import FoodDelivery from './pages/FoodDelivery.tsx';
import { PaymentVerification } from './pages/PaymentVerification.tsx';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-[#111114] text-zinc-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
            {/* Global Metallic Navigation Bar */}
            <Navbar />

            {/* Shopping Cart Drawer */}
            <CartDrawer />

            {/* WebNexa Buyer Protection Checkout Modal */}
            <CheckoutModal />

            {/* Main Application Routes */}
            <main className="flex-1">
              <Routes>
                {/* Public Marketplace Catalog */}
                <Route path="/" element={<MarketplaceHome />} />
                <Route path="/marketplace" element={<MarketplaceHome />} />

                {/* 1. Separated Buyer Portal */}
                <Route path="/login" element={<BuyerLogin />} />
                <Route path="/register" element={<BuyerLogin />} />
                <Route
                  path="/checkout"
                  element={
                    <BuyerProtectedRoute>
                      <Checkout />
                    </BuyerProtectedRoute>
                  }
                />
                <Route
                  path="/checkout/verify"
                  element={
                    <BuyerProtectedRoute>
                      <PaymentVerification />
                    </BuyerProtectedRoute>
                  }
                />
                <Route
                  path="/buyer/orders"
                  element={
                    <BuyerProtectedRoute>
                      <BuyerOrders />
                    </BuyerProtectedRoute>
                  }
                />

                {/* 2. Separated Vendor Portal & Onboarding */}
                <Route path="/vendor/login" element={<VendorLogin />} />
                <Route path="/vendor/register" element={<VendorRegister />} />
                <Route path="/vendor/dashboard" element={<VendorDashboard />} />
                <Route path="/feed" element={<SocialFeed />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/food-delivery" element={<FoodDelivery />} />

                {/* 3. Isolated Admin Portal & Compliance Board */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            {/* Global WebNexa Footer */}
            <Footer />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}
