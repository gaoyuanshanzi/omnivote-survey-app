'use client';

import React, { useState } from 'react';
import { ProjectItem } from '@/lib/types';
import {
  FolderPlus,
  Folder,
  FolderOpen,
  PlusCircle,
  Search,
  Users,
  Clock,
  Trash2,
  ChevronRight,
  FileCheck2,
  Sparkles
} from 'lucide-react';

interface SidebarDirectoryProps {
  projects: ProjectItem[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onDeleteProject: (id: string, e: React.MouseEvent) => void;
}

export default function SidebarDirectory({
  projects,
  selectedProjectId,
  onSelectProject,
  onNewProject,
  onDeleteProject
}: SidebarDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'CLOSED' | 'DRAFT'>('ALL');

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'ALL' || p.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            진행중
          </span>
        );
      case 'CLOSED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            종료
          </span>
        );
      case 'DRAFT':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            임시저장
          </span>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 border-r border-slate-800 text-slate-200">
      {/* Top Header & New Project Button */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-indigo-400" />
            <h2 className="font-bold text-sm tracking-wide text-white uppercase">프로젝트 디렉토리</h2>
          </div>
          <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
            {projects.length}개
          </span>
        </div>

        <button
          onClick={onNewProject}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ New Project</span>
        </button>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="프로젝트 검색..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 transition-all"
          />
        </div>

        {/* Status Quick Filter Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/60 rounded-lg border border-slate-800 text-[10px]">
          {(['ALL', 'ACTIVE', 'CLOSED', 'DRAFT'] as const).map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`py-1 rounded font-medium text-center transition-all ${
                filterStatus === st
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {st === 'ALL' ? '전체' : st === 'ACTIVE' ? '진행' : st === 'CLOSED' ? '종료' : '임시'}
            </button>
          ))}
        </div>
      </div>

      {/* Project Directory Folder List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-10 px-4">
            <FolderOpen className="w-10 h-10 text-slate-700 mx-auto mb-2 opacity-60" />
            <p className="text-xs text-slate-400 font-medium">프로젝트가 없습니다.</p>
            <p className="text-[11px] text-slate-500 mt-1">상단의 [+ New Project] 버튼으로 첫 투표를 만들어보세요!</p>
          </div>
        ) : (
          filteredProjects.map(proj => {
            const isSelected = selectedProjectId === proj.id;
            return (
              <div
                key={proj.id}
                onClick={() => onSelectProject(proj.id)}
                className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900 border-indigo-500/60 shadow-lg shadow-indigo-950/50'
                    : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                {/* Selected Accent Line */}
                {isSelected && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r bg-indigo-500 shadow-glow" />
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    {isSelected ? (
                      <FolderOpen className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                    ) : (
                      <Folder className="w-4 h-4 text-slate-500 group-hover:text-slate-300 mt-0.5 shrink-0 transition-colors" />
                    )}
                    <div className="min-w-0">
                      <h3
                        className={`text-xs font-semibold truncate leading-tight ${
                          isSelected ? 'text-white font-bold' : 'text-slate-300 group-hover:text-white'
                        }`}
                      >
                        {proj.title}
                      </h3>
                      <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-600" />
                        {new Date(proj.createdAt).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={e => onDeleteProject(proj.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all shrink-0"
                    title="프로젝트 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Footer stats badge */}
                <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                  {getStatusBadge(proj.status)}
                  <div className="flex items-center gap-1 text-slate-400 font-medium bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
                    <Users className="w-3 h-3 text-indigo-400" />
                    <span>{proj.responseCount || 0} 명</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
