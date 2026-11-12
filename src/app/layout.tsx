import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { TopNav } from '@/ui/components/TopNav';

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
        <TopNav />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
      </body>
    </html>
  );
}
