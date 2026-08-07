'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ProjectItem, QuestionItem, QuestionType } from '@/lib/types';
import { QRCodeSVG } from 'qrcode.react';
import {
  ListPlus,
  MessageSquarePlus,
  Trash2,
  Plus,
  Save,
  CheckCircle2,
  AlertCircle,
  Layers,
  PlayCircle,
  X,
  Copy,
  ExternalLink,
  Share2,
  QrCode,
  Download
} from 'lucide-react';

interface QuestionCreatorProps {
  project: ProjectItem | null;
  onSaveProject: (updatedProject: Partial<ProjectItem>) => Promise<void>;
  isNew?: boolean;
}

// ── Publish Success Modal ──────────────────────────────────────
function PublishModal({
  projectId,
  projectTitle,
  onClose,
}: {
  projectId: string;
  projectTitle: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const surveyUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/survey/${projectId}`
      : `https://omnivote-survey-app.vercel.app/survey/${projectId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(surveyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
      const el = document.createElement('textarea');
      el.value = surveyUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadQR = () => {
    const svgEl = qrRef.current?.querySelector('svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-${projectId}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg leading-tight">투표가 게시되었습니다! 🎉</h3>
              <p className="text-emerald-100 text-xs mt-0.5">투표 참여 링크를 공유하세요</p>
            </div>
          </div>
          <p className="text-white/80 text-xs mt-2 font-medium line-clamp-2">📊 {projectTitle}</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* QR Code */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <QrCode className="w-4 h-4 text-indigo-600" />
              <span>QR 코드로 참여 (스마트폰 카메라로 스캔)</span>
            </div>
            <div
              ref={qrRef}
              className="p-4 bg-white rounded-2xl border-2 border-indigo-100 shadow-inner"
            >
              <QRCodeSVG
                value={surveyUrl}
                size={180}
                level="H"
                includeMargin={false}
                fgColor="#312e81"
                bgColor="#ffffff"
              />
            </div>
            <button
              onClick={handleDownloadQR}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1.5 hover:underline transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              QR 코드 다운로드 (SVG)
            </button>
          </div>

          <div className="relative flex items-center">
            <div className="flex-1 border-t border-slate-200" />
            <span className="px-3 text-[11px] font-bold text-slate-400 uppercase">또는</span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          {/* URL Copy */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              투표 참여 링크
            </label>
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 overflow-hidden text-ellipsis whitespace-nowrap">
                {surveyUrl}
              </div>
              <button
                onClick={handleCopy}
                className={`shrink-0 px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? '복사됨!' : '복사'}
              </button>
            </div>
          </div>

          {/* Open Link */}
          <a
            href={surveyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            투표 페이지 직접 열기
          </a>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-all"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main QuestionCreator ───────────────────────────────────────
export default function QuestionCreator({ project, onSaveProject, isNew = false }: QuestionCreatorProps) {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'CLOSED' | 'DRAFT'>('DRAFT');
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [publishedProjectId, setPublishedProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (project) {
      setTitle(project.title || '');
      setStatus(project.status || 'DRAFT');
      setQuestions(project.questions || []);
    } else {
      setTitle('새 투표 프로젝트');
      setStatus('DRAFT');
      setQuestions([
        {
          id: `q-init-1-${Date.now()}`,
          type: 'MULTIPLE_CHOICE',
          title: '첫 번째 다지선다 질문을 입력하세요.',
          minSelect: 1,
          maxSelect: 1,
          order: 1,
          options: [
            { id: `opt-1-${Date.now()}`, text: '선택 항목 1', order: 1 },
            { id: `opt-2-${Date.now()}`, text: '선택 항목 2', order: 2 }
          ]
        }
      ]);
    }
    setMessage(null);
  }, [project]);

  const addQuestion = (type: QuestionType) => {
    const newQId = `q-${Date.now()}-${questions.length + 1}`;
    if (type === 'MULTIPLE_CHOICE') {
      const newQ: QuestionItem = {
        id: newQId,
        type: 'MULTIPLE_CHOICE',
        title: '새 다지선다 질문',
        minSelect: 1,
        maxSelect: 1,
        order: questions.length + 1,
        options: [
          { id: `opt-${Date.now()}-1`, text: '선택 항목 1', order: 1 },
          { id: `opt-${Date.now()}-2`, text: '선택 항목 2', order: 2 }
        ]
      };
      setQuestions([...questions, newQ]);
    } else {
      const newQ: QuestionItem = {
        id: newQId,
        type: 'SUBJECTIVE',
        title: '새 주관식 질문',
        minSelect: 0,
        maxSelect: 0,
        order: questions.length + 1,
        options: []
      };
      setQuestions([...questions, newQ]);
    }
  };

  const removeQuestion = (qId: string) => {
    if (questions.length <= 1) {
      setMessage({ type: 'error', text: '최소 1개 이상의 질문이 필요합니다.' });
      return;
    }
    setQuestions(questions.filter(q => q.id !== qId));
  };

  const updateQuestionTitle = (qId: string, newTitle: string) => {
    setQuestions(questions.map(q => (q.id === qId ? { ...q, title: newTitle } : q)));
  };

  const updateSelectRules = (qId: string, field: 'minSelect' | 'maxSelect', val: number) => {
    setQuestions(
      questions.map(q => {
        if (q.id !== qId) return q;
        const totalOpts = q.options.length;
        if (field === 'minSelect') {
          const clamped = Math.max(1, Math.min(val, q.maxSelect));
          return { ...q, minSelect: clamped };
        } else {
          const clamped = Math.max(q.minSelect, Math.min(val, totalOpts));
          return { ...q, maxSelect: clamped };
        }
      })
    );
  };

  const addOption = (qId: string) => {
    setQuestions(
      questions.map(q => {
        if (q.id !== qId) return q;
        if (q.options.length >= 20) {
          setMessage({ type: 'error', text: '선택 항목은 최대 20개까지만 추가 가능합니다.' });
          return q;
        }
        const newOptOrder = q.options.length + 1;
        const newOpt = {
          id: `opt-${qId}-${Date.now()}-${newOptOrder}`,
          text: `선택 항목 ${newOptOrder}`,
          order: newOptOrder
        };
        return { ...q, options: [...q.options, newOpt] };
      })
    );
  };

  const removeOption = (qId: string, optId: string) => {
    setQuestions(
      questions.map(q => {
        if (q.id !== qId) return q;
        if (q.options.length <= 2) {
          setMessage({ type: 'error', text: '다지선다 질문은 최소 2개의 항목이 필요합니다.' });
          return q;
        }
        const updatedOpts = q.options.filter(o => o.id !== optId);
        const newMaxSelect = Math.min(q.maxSelect, updatedOpts.length);
        const newMinSelect = Math.min(q.minSelect, newMaxSelect);
        return { ...q, options: updatedOpts, minSelect: newMinSelect, maxSelect: newMaxSelect };
      })
    );
  };

  const updateOptionText = (qId: string, optId: string, text: string) => {
    setQuestions(
      questions.map(q => {
        if (q.id !== qId) return q;
        return { ...q, options: q.options.map(o => (o.id === optId ? { ...o, text } : o)) };
      })
    );
  };

  // ── Save/Publish ──────────────────────────────────────────────
  const handleSave = async (targetStatus?: 'ACTIVE' | 'CLOSED' | 'DRAFT') => {
    if (!title.trim()) {
      setMessage({ type: 'error', text: '투표 프로젝트 제목을 입력해주세요.' });
      return;
    }
    if (questions.length === 0) {
      setMessage({ type: 'error', text: '최소 1개 이상의 질문을 구성해주세요.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    const finalStatus = targetStatus || status;
    const payload: Partial<ProjectItem> = {
      id: project?.id,
      title,
      status: finalStatus,
      createdAt: project?.createdAt,
      questions
    };

    try {
      // Call parent save and capture returned project ID
      await onSaveProject(payload);
      setStatus(finalStatus);

      if (finalStatus === 'ACTIVE') {
        // Determine project ID: for existing project use project.id,
        // for new project we need to fetch it from the API after save.
        if (project?.id) {
          setPublishedProjectId(project.id);
        } else {
          // Fetch the most recently created project
          const res = await fetch('/api/projects');
          const data = await res.json();
          if (data.success && data.projects?.length > 0) {
            const newest = data.projects[data.projects.length - 1];
            setPublishedProjectId(newest.id);
          }
        }
      } else {
        setMessage({
          type: 'success',
          text: '프로젝트가 성공적으로 저장되었습니다.'
        });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: '저장 중 오류가 발생했습니다.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Publish Success Modal */}
      {publishedProjectId && (
        <PublishModal
          projectId={publishedProjectId}
          projectTitle={title}
          onClose={() => setPublishedProjectId(null)}
        />
      )}

      <div className="h-full flex flex-col bg-slate-50 text-slate-900 overflow-hidden">
        {/* Top Creation Header */}
        <div className="p-4 lg:p-6 border-b border-slate-200 bg-white space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  {isNew ? '새 투표 프로젝트 작성' : '투표 질문 구성기 (Creation Zone)'}
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">다지선다형 및 주관식 문항을 자유롭게 생성 및 설정하세요.</p>
            </div>

            {/* Top Save & Publish Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSave('DRAFT')}
                disabled={saving}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-300 flex items-center gap-1.5 transition-all shadow-2xs disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5 text-slate-500" />
                <span>임시저장</span>
              </button>
              <button
                onClick={() => handleSave('ACTIVE')}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                <PlayCircle className="w-4 h-4" />
                <span>{saving ? '저장 중...' : '게시 & 투표 시작'}</span>
              </button>
            </div>
          </div>

          {/* Project Title & Status Toolbar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
            <div className="md:col-span-3">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                프로젝트 제목
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="예: 2026 하반기 팀 리모트 워크샵 장소 선호도 조사"
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                투표 진행 상태
              </label>
              <select
                value={status}
                onChange={async e => {
                  const newStatus = e.target.value as 'ACTIVE' | 'CLOSED' | 'DRAFT';
                  setStatus(newStatus);
                  if (project?.id) {
                    await handleSave(newStatus);
                  }
                }}
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600 shadow-2xs"
              >
                <option value="DRAFT">📋 임시저장 (DRAFT)</option>
                <option value="ACTIVE">🟢 진행중 (ACTIVE)</option>
                <option value="CLOSED">🔴 종료됨 (CLOSED)</option>
              </select>
            </div>
          </div>

          {/* Notification Alert Message */}
          {message && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-bold ${
                message.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}
        </div>

        {/* Main Question Editor List */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 custom-scrollbar">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative group transition-all hover:border-slate-300 hover:shadow-md"
            >
              {/* Header: Number & Type Badge & Delete */}
              <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-extrabold text-xs flex items-center justify-center border border-indigo-200">
                    Q{idx + 1}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      q.type === 'MULTIPLE_CHOICE'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-purple-50 text-purple-700 border-purple-200'
                    }`}
                  >
                    {q.type === 'MULTIPLE_CHOICE' ? '다지선다형 질문' : '주관식 질문'}
                  </span>
                </div>

                <button
                  onClick={() => removeQuestion(q.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="질문 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Question Title Input */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">질문 제목</label>
                <input
                  type="text"
                  value={q.title}
                  onChange={e => updateQuestionTitle(q.id, e.target.value)}
                  placeholder="질문 내용을 입력하세요..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              {/* If Multiple Choice Question */}
              {q.type === 'MULTIPLE_CHOICE' && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        최소 선택 가능 개수 (최저 1개)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={q.maxSelect}
                        value={q.minSelect}
                        onChange={e => updateSelectRules(q.id, 'minSelect', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-bold focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        최대 선택 가능 개수 (최대 {q.options.length}개)
                      </label>
                      <input
                        type="number"
                        min={q.minSelect}
                        max={q.options.length}
                        value={q.maxSelect}
                        onChange={e => updateSelectRules(q.id, 'maxSelect', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-bold focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700">
                        선택 항목 목록 ({q.options.length}개 / 최소 2개 ~ 최대 20개)
                      </span>
                      <button
                        onClick={() => addOption(q.id)}
                        disabled={q.options.length >= 20}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white text-xs font-bold border border-indigo-200 flex items-center gap-1 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>항목 추가</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {q.options.map((opt, oIdx) => (
                        <div key={opt.id} className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400 w-5 text-right">{oIdx + 1}.</span>
                          <input
                            type="text"
                            value={opt.text}
                            onChange={e => updateOptionText(q.id, opt.id, e.target.value)}
                            placeholder={`항목 ${oIdx + 1} 입력`}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
                          />
                          <button
                            onClick={() => removeOption(q.id, opt.id)}
                            disabled={q.options.length <= 2}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
                            title="항목 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* If Subjective Question */}
              {q.type === 'SUBJECTIVE' && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium">
                  <p className="mb-2 font-bold text-slate-700">자유로운 서술형 텍스트 작성 영역이 투표자 화면에 제공됩니다.</p>
                  <textarea
                    disabled
                    rows={2}
                    placeholder="[투표자 주관식 작성 예시] 의견을 입력해 주세요..."
                    className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-400 cursor-not-allowed resize-none"
                  />
                </div>
              )}
            </div>
          ))}

          {/* Add Question Controls */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => addQuestion('MULTIPLE_CHOICE')}
              className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-2xs"
            >
              <ListPlus className="w-4 h-4 text-indigo-600" />
              <span>+ 다지선다 질문 추가</span>
            </button>
            <button
              onClick={() => addQuestion('SUBJECTIVE')}
              className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-white hover:bg-purple-50 border border-purple-200 text-purple-700 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-2xs"
            >
              <MessageSquarePlus className="w-4 h-4 text-purple-600" />
              <span>+ 주관식 질문 추가</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
