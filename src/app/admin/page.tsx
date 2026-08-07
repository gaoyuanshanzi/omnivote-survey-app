'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import SidebarDirectory from '@/components/SidebarDirectory';
import QuestionCreator from '@/components/QuestionCreator';
import ResultsDashboard from '@/components/ResultsDashboard';
import { ProjectItem } from '@/lib/types';
import { Layers, BarChart3, X } from 'lucide-react';

export default function AdminPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'CREATOR' | 'DASHBOARD'>('CREATOR');
  const [isNewProjectMode, setIsNewProjectMode] = useState(false);

  // Fetch projects list
  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.success && data.projects) {
        setProjects(data.projects);
        if (!selectedProjectId && data.projects.length > 0) {
          setSelectedProjectId(data.projects[0].id);
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
  }, []);

  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;

  // New Project Action: reset form to clean project state
  const handleNewProject = () => {
    setSelectedProjectId(null);
    setIsNewProjectMode(true);
    setIsMobileDrawerOpen(false);
  };

  // Select project action
  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id);
    setIsNewProjectMode(false);
    setIsMobileDrawerOpen(false);
  };

  // Save / Update Project Action
  const handleSaveProject = async (updatedData: Partial<ProjectItem>) => {
    try {
      const isEdit = !!updatedData.id;
      const url = isEdit ? `/api/projects/${updatedData.id}` : '/api/projects';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      const data = await res.json();
      if (data.success && data.project) {
        await fetchProjects();
        setSelectedProjectId(data.project.id);
        setIsNewProjectMode(false);
      }
    } catch (err) {
      console.error('Save project error:', err);
    }
  };

  // Delete project action
  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('이 투표 프로젝트를 정말 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다.')) return;

    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        const remaining = projects.filter(p => p.id !== id);
        setProjects(remaining);
        if (selectedProjectId === id) {
          setSelectedProjectId(remaining.length > 0 ? remaining[0].id : null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-100 text-slate-900 overflow-hidden font-sans">
      {/* Top Navbar Header */}
      <Navbar
        onToggleMobileDrawer={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
        onNewProject={handleNewProject}
      />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden relative bg-slate-100">
        {/* Mobile Sliding Drawer Overlay */}
        {isMobileDrawerOpen && (
          <div
            onClick={() => setIsMobileDrawerOpen(false)}
            className="md:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs animate-fade-in"
          />
        )}

        {/* Panel 1: Sidebar Directory (PC: 3분할 1열 flex-row, Mobile: Drawer under Top-16 Navbar) */}
        <aside
          className={`fixed md:static z-50 md:z-auto top-16 md:top-0 bottom-0 left-0 w-80 md:w-72 xl:w-80 shrink-0 h-[calc(100vh-4rem)] md:h-full bg-white transition-transform duration-300 ease-in-out shadow-xl md:shadow-none ${
            isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="h-full relative">
            {/* Mobile close button inside drawer */}
            <button
              onClick={() => setIsMobileDrawerOpen(false)}
              className="md:hidden absolute top-3 right-3 z-50 p-1.5 rounded-lg text-slate-500 hover:text-slate-900 bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
            <SidebarDirectory
              projects={projects}
              selectedProjectId={selectedProjectId}
              onSelectProject={handleSelectProject}
              onNewProject={handleNewProject}
              onDeleteProject={handleDeleteProject}
            />
          </div>
        </aside>

        {/* Mobile Tab Switcher Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-14 bg-white/95 border-t border-slate-200 backdrop-blur grid grid-cols-2 p-1.5 gap-2 shadow-lg">
          <button
            onClick={() => setMobileTab('CREATOR')}
            className={`flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all ${
              mobileTab === 'CREATOR'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>[투표 만들기]</span>
          </button>
          <button
            onClick={() => setMobileTab('DASHBOARD')}
            className={`flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all ${
              mobileTab === 'DASHBOARD'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>[결과 대시보드]</span>
          </button>
        </div>

        {/* PC: Panels 2 & 3 Split (Left Main: Question Creator, Right Main: Dashboard) */}
        <main className="flex-1 flex flex-col md:flex-row overflow-hidden pb-14 md:pb-0 min-w-0 bg-slate-100">
          {/* Panel 2: Question Creation Zone (Center) */}
          <div
            className={`flex-1 min-w-0 h-full border-r border-slate-200 overflow-hidden ${
              mobileTab === 'CREATOR' ? 'block' : 'hidden md:block'
            }`}
          >
            <QuestionCreator
              project={isNewProjectMode ? null : selectedProject}
              onSaveProject={handleSaveProject}
              isNew={isNewProjectMode}
            />
          </div>

          {/* Panel 3: Dashboard Zone (Right) */}
          <div
            className={`flex-1 min-w-0 h-full overflow-hidden ${
              mobileTab === 'DASHBOARD' ? 'block' : 'hidden md:block'
            }`}
          >
            <ResultsDashboard project={selectedProject} onRefreshProject={fetchProjects} />
          </div>
        </main>
      </div>
    </div>
  );
}
