import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './Logo.tsx';
import { ShieldCheck, Mail, Phone, Send, Lock, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0f0f12] border-t border-zinc-800/80 text-zinc-400 text-sm mt-16">
      {/* Buyer protection highlight bar */}
      <div className="border-b border-zinc-800/60 bg-gradient-to-r from-purple-950/30 via-zinc-900/50 to-indigo-950/30 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h4 className="text-zinc-200 font-semibold text-sm">WebNexa Buyer Protection Guard</h4>
              <p className="text-xs text-zinc-400">Payment safely processed. Vendor is credited automatically upon verified delivery to your address.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-zinc-200 font-semibold text-sm">Vetted & Approved Sellers</h4>
              <p className="text-xs text-zinc-400">Strict CAC & business verification before listing.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 className="text-zinc-200 font-semibold text-sm">Secure Payment Integration</h4>
              <p className="text-xs text-zinc-400">Encrypted checkout, webhooks & automated ledger.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-4">
            <Logo size="lg" />
            <p className="text-xs text-zinc-400 leading-relaxed max-w-md">
              Software Engineers for WebNexa, creating scalable web applications. Interfaces, robust
              backend systems (React, Node.js, AWS), new features, and optimization.
            </p>
            <div className="text-xs font-cinzel text-zinc-300 font-semibold tracking-wider pt-1">
              FOUNDED BY KESTER APUYOR ON SEPT 13th, 2026
            </div>

            {/* Direct Contacts from the brand medallion */}
            <div className="pt-2 flex flex-col gap-2 text-xs">
              <a
                href="tel:+2348052168776"
                className="flex items-center gap-2 text-zinc-300 hover:text-purple-400 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-purple-400" />
                <span>+234 805 216 8776 (WhatsApp & Telegram)</span>
              </a>
              <a
                href="mailto:contact.webnexa.dev@gmail.com"
                className="flex items-center gap-2 text-zinc-300 hover:text-purple-400 transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-purple-400" />
                <span>contact.webnexa.dev@gmail.com</span>
              </a>
            </div>
          </div>

          {/* Separated Portals */}
          <div>
            <h5 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider mb-3">
              Separated Portals
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/login" className="hover:text-purple-400 transition-colors">
                  Buyer Login (/login)
                </Link>
              </li>
              <li>
                <Link to="/vendor/login" className="hover:text-purple-400 transition-colors">
                  Vendor Portal (/vendor/login)
                </Link>
              </li>
              <li>
                <Link to="/vendor/register" className="hover:text-purple-400 transition-colors">
                  Vendor Onboarding (/vendor/register)
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-purple-400 transition-colors text-red-400">
                  WebNexa Admin (/admin/login)
                </Link>
              </li>
              <li>
                <Link to="/admin/dashboard" className="hover:text-purple-400 transition-colors">
                  Admin Approval Panel
                </Link>
              </li>
            </ul>
          </div>

          {/* Database Architecture & secure settlement */}
          <div>
            <h5 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider mb-3">
              Architecture & Stack
            </h5>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>MySQL Relational Database</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                <span>Strict `buyers` & `vendors` Tables</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                <span>Sequelize ORM Schema Models</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                <span>Paystack payment webhooks</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>JWT Middleware Role Guards</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800/80 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <p>© 2026 WebNexa Multi-Vendor Marketplace. Next-Generation Web Solutions.</p>
          <div className="flex items-center gap-4">
            <span>Metallic Slate Grey #1A1A1A</span>
            <span>•</span>
            <span>Platform-Managed Secure Settlement v2.4</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
