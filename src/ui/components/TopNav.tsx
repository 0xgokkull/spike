'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckSquare, Layers, Award } from 'lucide-react';
import { SpikeLogo } from './SpikeLogo';

export function TopNav() {
  const pathname = usePathname();

  const isQueue = pathname === '/' || pathname.startsWith('/cases');
  const isClose = pathname === '/close';

  return (
    <header className="h-14 bg-[#080D1A] text-white border-b border-slate-800/80 flex-shrink-0 select-none">
      <div className="max-w-7xl mx-auto w-full h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <SpikeLogo size={34} />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white group-hover:text-cyan-400 transition-colors leading-tight">
                  Spike
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00E5FF]" />
              </div>
              <span className="text-[9px] text-slate-400 font-mono tracking-widest uppercase leading-none mt-0.5">
                Supervised PayPal Autonomy
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-1.5 pl-5 border-l border-slate-800/90">
            <Link
              href="/"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                isQueue
                  ? 'bg-slate-800 text-white border border-slate-700/80 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Layers className={`h-3.5 w-3.5 ${isQueue ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>Dispute Queue</span>
            </Link>
            <Link
              href="/close"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                isClose
                  ? 'bg-slate-800 text-white border border-slate-700/80 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <CheckSquare className={`h-3.5 w-3.5 ${isClose ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>Day Close</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] font-mono px-3 py-1 rounded-full bg-blue-950/70 text-blue-300 border border-blue-800/50 shadow-2xs">
            <Award className="h-3.5 w-3.5 text-cyan-400" />
            <span>PayPal AI Hackathon 2026</span>
          </div>
        </div>
      </div>
    </header>
  );
}
