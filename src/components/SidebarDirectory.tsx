'use client';

import React, { useState } from 'react';
import { ProjectItem } from '@/lib/types';
import {
  Folder,
  FolderOpen,
  PlusCircle,
  Search,
  Users,
  Clock,
  Trash2
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
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            진행중
          </span>
        );
      case 'CLOSED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            종료
          </span>
        );
      case 'DRAFT':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            임시저장
          </span>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-slate-200 text-slate-800">
      {/* Top Header & New Project Button */}
      <div className="p-4 border-b border-slate-200 space-y-3 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-indigo-600" />
            <h2 className="font-bold text-sm tracking-tight text-slate-900 uppercase">프로젝트 디렉토리</h2>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
            {projects.length}개
          </span>
        </div>

        <button
          onClick={onNewProject}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ New Project</span>
        </button>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="프로젝트 검색..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500/30 transition-all"
          />
        </div>

        {/* Status Quick Filter Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-[10px]">
          {(['ALL', 'ACTIVE', 'CLOSED', 'DRAFT'] as const).map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`py-1 rounded-lg font-bold text-center transition-all ${
                filterStatus === st
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {st === 'ALL' ? '전체' : st === 'ACTIVE' ? '진행' : st === 'CLOSED' ? '종료' : '임시'}
            </button>
          ))}
        </div>
      </div>

      {/* Project Directory Folder List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar bg-slate-50/50">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-10 px-4">
            <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-600 font-bold">프로젝트가 없습니다.</p>
            <p className="text-[11px] text-slate-400 mt-1">상단의 [+ New Project] 버튼으로 첫 투표를 만들어보세요!</p>
          </div>
        ) : (
          filteredProjects.map(proj => {
            const isSelected = selectedProjectId === proj.id;
            return (
              <div
                key={proj.id}
                onClick={() => onSelectProject(proj.id)}
                className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50/80 border-indigo-500 shadow-sm ring-1 ring-indigo-500/30'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {/* Selected Accent Line */}
                {isSelected && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r bg-indigo-600" />
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    {isSelected ? (
                      <FolderOpen className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                    ) : (
                      <Folder className="w-4 h-4 text-slate-400 group-hover:text-slate-600 mt-0.5 shrink-0 transition-colors" />
                    )}
                    <div className="min-w-0">
                      <h3
                        className={`text-xs font-bold truncate leading-tight ${
                          isSelected ? 'text-indigo-950' : 'text-slate-800 group-hover:text-slate-900'
                        }`}
                      >
                        {proj.title}
                      </h3>
                      <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(proj.createdAt).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={e => onDeleteProject(proj.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all shrink-0"
                    title="프로젝트 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Footer stats badge */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  {getStatusBadge(proj.status)}
                  <div className="flex items-center gap-1 text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80">
                    <Users className="w-3 h-3 text-indigo-600" />
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
