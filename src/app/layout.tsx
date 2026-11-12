import React from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { TopNav } from '@/ui/components/TopNav';
import { SITE, siteUrl } from './_brand/site';

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: { default: SITE.title, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [...SITE.keywords],
  category: 'finance',
  // Icons, apple-icon, manifest and social images come from the file conventions in src/app.
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
    url: '/',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE.title,
    description: SITE.description,
  },
  appleWebApp: { title: SITE.name, capable: true, statusBarStyle: 'default' },
  formatDetection: { telephone: false, email: false, address: false },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: SITE.ink,
  width: 'device-width',
  initialScale: 1,
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
