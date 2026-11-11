import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { Shield, CheckSquare, Layers } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Resolution Desk | Supervised Autonomy for PayPal Disputes',
  description: 'Automated daily dispute & refund triage queue with supervised autonomy for PayPal sellers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-50">
      <body className="h-full flex flex-col text-slate-900 antialiased font-sans">
        {/* Top Navbar */}
        <header className="bg-slate-900 text-white border-b border-slate-800 px-6 py-3.5 flex items-center justify-between shadow-sm flex-shrink-0">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="p-1.5 rounded-lg bg-blue-600 text-white group-hover:bg-blue-500 transition-colors shadow-sm">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-white block leading-none">
                  Resolution Desk
                </span>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase block mt-0.5">
                  Supervised PayPal Autonomy
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-2 pl-4 border-l border-slate-800">
              <Link
                href="/"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Layers className="h-3.5 w-3.5" />
                Dispute Queue
              </Link>
              <Link
                href="/close"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <CheckSquare className="h-3.5 w-3.5" />
                Day Close
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
              PayPal AI Hackathon 2026
            </span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
      </body>
    </html>
  );
}
