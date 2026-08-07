'use client';

import React from 'react';
import { Vote, LogOut, Menu, FolderPlus, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface NavbarProps {
  onNewProject?: () => void;
}

export default function Navbar({ onNewProject }: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-4 lg:px-6 shadow-xs">
      {/* Left Branding */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Vote className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">
                OmniVote
              </span>
              <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-200">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block font-medium">실시간 설문 & 투표 관리 시스템</p>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {onNewProject && (
          <button
            onClick={onNewProject}
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <FolderPlus className="w-4 h-4" />
            <span>새 투표 생성</span>
          </button>
        )}

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="font-bold text-emerald-700">admin</span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-semibold border border-slate-200 hover:border-rose-200 transition-all shadow-2xs"
          title="로그아웃"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">로그아웃</span>
        </button>
      </div>
    </header>
  );
}
