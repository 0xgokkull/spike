'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, CheckSquare, Layers, Award } from 'lucide-react';

export function TopNav() {
  const pathname = usePathname();

  const isQueue = pathname === '/' || pathname.startsWith('/cases');
  const isClose = pathname === '/close';

  return (
    <header className="h-14 bg-[#0B0F19] text-white border-b border-slate-800/80 px-6 flex items-center justify-between shadow-xs flex-shrink-0 select-none">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-xs group-hover:from-blue-400 group-hover:to-blue-500 transition-all duration-150">
            <Shield className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm tracking-tight text-slate-100 group-hover:text-white transition-colors leading-tight">
              Spike
            </span>
            <span className="text-[9px] text-slate-400 font-mono tracking-widest uppercase leading-none mt-0.5">
              Supervised PayPal Autonomy
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 pl-4 border-l border-slate-800/80">
          <Link
            href="/"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
              isQueue
                ? 'bg-slate-800/90 text-white border border-slate-700/60 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Dispute Queue</span>
          </Link>
          <Link
            href="/close"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
              isClose
                ? 'bg-slate-800/90 text-white border border-slate-700/60 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span>Day Close</span>
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full bg-blue-950/60 text-blue-300 border border-blue-800/40">
          <Award className="h-3 w-3 text-blue-400" />
          <span>PayPal AI Hackathon 2026</span>
        </div>
      </div>
    </header>
  );
}
