'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import SidebarDirectory from '@/components/SidebarDirectory';
import QuestionCreator from '@/components/QuestionCreator';
import ResultsDashboard from '@/components/ResultsDashboard';
import { ProjectItem } from '@/lib/types';

export default function AdminPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileTab, setMobileTab] = useState<'SIDEBAR' | 'CREATOR' | 'DASHBOARD'>('SIDEBAR');
  const [isNewProjectMode, setIsNewProjectMode] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.success && data.projects) {
        // If server returns empty (e.g. serverless cold start), attempt auto-restore from browser localStorage cache
        if (data.projects.length === 0) {
          const localCache = localStorage.getItem('omnivote_projects_cache');
          if (localCache) {
            try {
              const cached = JSON.parse(localCache) as ProjectItem[];
              if (cached && cached.length > 0) {
                for (const p of cached) {
                  await fetch('/api/projects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(p)
                  });
                }
                const reFetch = await fetch('/api/projects');
                const reData = await reFetch.json();
                if (reData.success && reData.projects && reData.projects.length > 0) {
                  setProjects(reData.projects);
                  if (!selectedProjectId) {
                    setSelectedProjectId(reData.projects[0].id);
                  }
                  return;
                }
              }
            } catch (e) {
              console.error('Auto restore cache error:', e);
            }
          }
        }

        let localCacheList: ProjectItem[] = [];
        const localRawProjects = localStorage.getItem('omnivote_projects_cache');
        if (localRawProjects) {
          try { localCacheList = JSON.parse(localRawProjects); } catch {}
        }

        const mergedProjects = data.projects.map(sp => {
          const localP = localCacheList.find(lp => lp.id === sp.id);
          let baseP = sp;
          if (localP && localP.updatedAt && sp.updatedAt) {
            if (new Date(localP.updatedAt).getTime() > new Date(sp.updatedAt).getTime()) {
              baseP = { ...sp, status: localP.status, title: localP.title, updatedAt: localP.updatedAt };
            }
          } else if (localP && localP.status) {
            baseP = { ...sp, status: localP.status };
          }

          const cacheKey = `omnivote_resp_cache_${sp.id}`;
          const localRawResp = localStorage.getItem(cacheKey);
          if (localRawResp) {
            try {
              const cachedResps = JSON.parse(localRawResp);
              if (Array.isArray(cachedResps)) {
                baseP.responseCount = Math.max(baseP.responseCount || 0, cachedResps.length);
              }
            } catch {}
          }
          return baseP;
        });

        setProjects(mergedProjects);
        localStorage.setItem('omnivote_projects_cache', JSON.stringify(mergedProjects));
        if (!selectedProjectId && mergedProjects.length > 0) {
          setSelectedProjectId(mergedProjects[0].id);
        }
      }
    } catch (err) {
      console.error('Fetch projects error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    const interval = setInterval(fetchProjects, 3000);
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

      // Immediately lock and update local state + localStorage cache
      setProjects(prev => {
        const exists = prev.some(p => p.id === fullUpdated.id);
        const nextList = exists
          ? prev.map(p => (p.id === fullUpdated.id ? ({ ...p, ...fullUpdated } as ProjectItem) : p))
          : [fullUpdated as ProjectItem, ...prev];
        localStorage.setItem('omnivote_projects_cache', JSON.stringify(nextList));
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
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        const remaining = projects.filter(p => p.id !== id);
        setProjects(remaining);
        localStorage.setItem('omnivote_projects_cache', JSON.stringify(remaining));
        if (selectedProjectId === id) {
          setSelectedProjectId(remaining.length > 0 ? remaining[0].id : null);
        }
      }
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
