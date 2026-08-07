'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import SidebarDirectory from '@/components/SidebarDirectory';
import QuestionCreator from '@/components/QuestionCreator';
import ResultsDashboard from '@/components/ResultsDashboard';
import { ProjectItem } from '@/lib/types';

// Track user-initiated status changes by projectId so polling never reverts them
const statusLock = new Map<string, { status: string; lockedAt: number }>();

// Helpers for deleted project ID tracking (survives across polls within a session)
const getDeletedIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem('omnivote_deleted_ids');
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {}
  return new Set();
};
const addDeletedId = (id: string) => {
  const ids = getDeletedIds();
  ids.add(id);
  localStorage.setItem('omnivote_deleted_ids', JSON.stringify(Array.from(ids)));
};

export default function AdminPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileTab, setMobileTab] = useState<'SIDEBAR' | 'CREATOR' | 'DASHBOARD'>('SIDEBAR');
  const [isNewProjectMode, setIsNewProjectMode] = useState(false);
  const isRestoringRef = useRef(false);

  const getLocalCache = (): ProjectItem[] => {
    try {
      const raw = localStorage.getItem('omnivote_projects_cache');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  };

  const setLocalCache = (projects: ProjectItem[]) => {
    localStorage.setItem('omnivote_projects_cache', JSON.stringify(projects));
  };

  const fetchProjects = async () => {
    if (isRestoringRef.current) return;
    try {
      const deletedIds = getDeletedIds();
      // Filter out deleted projects from local cache before any restore attempt
      const localCache = getLocalCache().filter(p => !deletedIds.has(p.id));

      const res = await fetch('/api/projects');
      const data = await res.json();

      if (!data.success) return;

      const allServerProjects: ProjectItem[] = data.projects || [];

      // Actively re-delete any "ghost" projects that a Lambda instance still has
      // This kills them across all warm Lambda instances over time
      const ghostProjects = allServerProjects.filter(p => deletedIds.has(p.id));
      for (const ghost of ghostProjects) {
        fetch(`/api/projects/${ghost.id}`, { method: 'DELETE' }).catch(() => {});
      }

      let serverProjects = allServerProjects.filter(p => !deletedIds.has(p.id));

      // Auto-restore ONLY non-deleted projects if serverless instance lost data
      if (serverProjects.length === 0 && localCache.length > 0) {
        isRestoringRef.current = true;
        for (const p of localCache) {
          await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(p)
          });
        }
        const reFetch = await fetch('/api/projects');
        const reData = await reFetch.json();
        serverProjects = (reData.success && reData.projects?.length > 0)
          ? (reData.projects || []).filter((p: ProjectItem) => !deletedIds.has(p.id))
          : localCache;
        isRestoringRef.current = false;
      }

      // Build final list based ONLY on server projects (no ghost local-only projects)
      const finalProjects = serverProjects.map(sp => {
        let mergedP = { ...sp };

        // Apply status lock if user recently changed status (within 30s)
        const lock = statusLock.get(sp.id);
        if (lock && Date.now() - lock.lockedAt < 30000) {
          mergedP.status = lock.status as any;
        }

        // Sync responseCount with local response cache
        const respKey = `omnivote_resp_cache_${sp.id}`;
        try {
          const respRaw = localStorage.getItem(respKey);
          if (respRaw) {
            const cached = JSON.parse(respRaw);
            if (Array.isArray(cached)) {
              mergedP.responseCount = Math.max(mergedP.responseCount || 0, cached.length);
            }
          }
        } catch {}

        return mergedP;
      });

      setProjects(finalProjects);
      setLocalCache(finalProjects);

      setSelectedProjectId(prev => {
        if (!prev && finalProjects.length > 0) return finalProjects[0].id;
        // Clear selection if selected project was deleted
        if (prev && !finalProjects.find(p => p.id === prev)) {
          return finalProjects.length > 0 ? finalProjects[0].id : null;
        }
        return prev;
      });
    } catch (err) {
      console.error('Fetch projects error:', err);
      const deletedIds = getDeletedIds();
      const cached = getLocalCache().filter(p => !deletedIds.has(p.id));
      if (cached.length > 0) {
        setProjects(cached);
        setSelectedProjectId(prev => prev || cached[0].id);
      } else {
        setProjects([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    const interval = setInterval(fetchProjects, 4000);
    return () => clearInterval(interval);
  }, []);

  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;

  const handleNewProject = () => {
    setSelectedProjectId(null);
    setIsNewProjectMode(true);
    setMobileTab('CREATOR');
  };

  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id);
    setIsNewProjectMode(false);
    setMobileTab('CREATOR');
  };

  const handleSaveProject = async (updatedData: Partial<ProjectItem>) => {
    try {
      const now = new Date().toISOString();
      const fullUpdated = { ...updatedData, updatedAt: now };

      // Lock the status for this project so polling won't revert it
      if (fullUpdated.id && fullUpdated.status) {
        statusLock.set(fullUpdated.id, { status: fullUpdated.status, lockedAt: Date.now() });
      }

      // Immediately update local state and cache
      setProjects(prev => {
        const exists = prev.some(p => p.id === fullUpdated.id);
        const nextList = exists
          ? prev.map(p => p.id === fullUpdated.id ? ({ ...p, ...fullUpdated } as ProjectItem) : p)
          : [fullUpdated as ProjectItem, ...prev];
        setLocalCache(nextList);
        return nextList;
      });

      const isEdit = !!fullUpdated.id;
      const url = isEdit ? `/api/projects/${fullUpdated.id}` : '/api/projects';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullUpdated)
      });
      const data = await res.json();
      if (data.success && data.project) {
        setSelectedProjectId(data.project.id);
        setIsNewProjectMode(false);
      }
    } catch (err) {
      console.error('Save project error:', err);
    }
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('이 투표 프로젝트를 정말 삭제하시겠습니까?')) return;
    try {
      // Mark as deleted BEFORE API call so polling can't restore it even if API is slow
      addDeletedId(id);
      statusLock.delete(id);
      const remaining = projects.filter(p => p.id !== id);
      setProjects(remaining);
      setLocalCache(remaining);
      if (selectedProjectId === id) {
        setSelectedProjectId(remaining.length > 0 ? remaining[0].id : null);
      }

      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      // Also clear any cached responses for this project
      localStorage.removeItem(`omnivote_resp_cache_${id}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
      {/* ── NAVBAR (h-16, z-30) ── */}
      <div className="shrink-0 z-30 bg-white border-b border-slate-200">
        <Navbar onNewProject={handleNewProject} />
      </div>

      {/* ── BODY: fills remaining height ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* ── SIDEBAR: static in flow on desktop, hidden on mobile ── */}
        <aside className="hidden lg:flex lg:flex-col w-72 xl:w-80 shrink-0 h-full border-r border-slate-200 bg-white overflow-hidden">
          <SidebarDirectory
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelectProject={handleSelectProject}
            onNewProject={handleNewProject}
            onDeleteProject={handleDeleteProject}
          />
        </aside>

        {/* ── MOBILE: tab switcher ── */}
        <div className="lg:hidden flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="shrink-0 grid grid-cols-3 bg-white border-b border-slate-200 p-1.5 gap-1.5">
            {([
              { id: 'SIDEBAR', label: '디렉토리', icon: '📁' },
              { id: 'CREATOR', label: '투표 만들기', icon: '✏️' },
              { id: 'DASHBOARD', label: '결과', icon: '📊' },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setMobileTab(tab.id)}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  mobileTab === tab.id
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden min-h-0">
            {mobileTab === 'SIDEBAR' && (
              <div className="h-full overflow-hidden bg-white">
                <SidebarDirectory
                  projects={projects}
                  selectedProjectId={selectedProjectId}
                  onSelectProject={handleSelectProject}
                  onNewProject={handleNewProject}
                  onDeleteProject={handleDeleteProject}
                />
              </div>
            )}
            {mobileTab === 'CREATOR' && (
              <div className="h-full overflow-hidden">
                <QuestionCreator
                  project={isNewProjectMode ? null : selectedProject}
                  onSaveProject={handleSaveProject}
                  isNew={isNewProjectMode}
                />
              </div>
            )}
            {mobileTab === 'DASHBOARD' && (
              <div className="h-full overflow-hidden">
                <ResultsDashboard project={selectedProject} onRefreshProject={fetchProjects} />
              </div>
            )}
          </div>
        </div>

        {/* ── DESKTOP: Creator + Dashboard side by side ── */}
        <main className="hidden lg:flex flex-1 overflow-hidden min-h-0 min-w-0">
          <div className="flex-1 min-w-0 h-full border-r border-slate-200 overflow-hidden">
            <QuestionCreator
              project={isNewProjectMode ? null : selectedProject}
              onSaveProject={handleSaveProject}
              isNew={isNewProjectMode}
            />
          </div>

          <div className="flex-1 min-w-0 h-full overflow-hidden">
            <ResultsDashboard project={selectedProject} onRefreshProject={fetchProjects} />
          </div>
        </main>
      </div>
    </div>
  );
}
