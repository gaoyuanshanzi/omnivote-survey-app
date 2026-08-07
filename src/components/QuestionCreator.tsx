'use client';

import React, { useState, useEffect } from 'react';
import { ProjectItem, QuestionItem, QuestionType } from '@/lib/types';
import {
  ListPlus,
  MessageSquarePlus,
  Trash2,
  Plus,
  Save,
  CheckCircle2,
  AlertCircle,
  GripVertical,
  HelpCircle,
  SlidersHorizontal,
  Layers,
  Sparkles,
  PlayCircle,
  PauseCircle,
  FileCheck
} from 'lucide-react';

interface QuestionCreatorProps {
  project: ProjectItem | null;
  onSaveProject: (updatedProject: Partial<ProjectItem>) => Promise<void>;
  isNew?: boolean;
}

export default function QuestionCreator({ project, onSaveProject, isNew = false }: QuestionCreatorProps) {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'CLOSED' | 'DRAFT'>('DRAFT');
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  // Add a new question (Multiple Choice or Subjective)
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

  // Remove question
  const removeQuestion = (qId: string) => {
    if (questions.length <= 1) {
      setMessage({ type: 'error', text: '최소 1개 이상의 질문이 필요합니다.' });
      return;
    }
    setQuestions(questions.filter(q => q.id !== qId));
  };

  // Update question title
  const updateQuestionTitle = (qId: string, newTitle: string) => {
    setQuestions(questions.map(q => (q.id === qId ? { ...q, title: newTitle } : q)));
  };

  // Update Min/Max Select Rules for Multiple Choice
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

  // Add option to Multiple Choice Question (min 2, max 20)
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
        const updatedOpts = [...q.options, newOpt];
        return {
          ...q,
          options: updatedOpts
        };
      })
    );
  };

  // Remove option from Multiple Choice Question (min 2)
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
        return {
          ...q,
          options: updatedOpts,
          minSelect: newMinSelect,
          maxSelect: newMaxSelect
        };
      })
    );
  };

  // Update option text
  const updateOptionText = (qId: string, optId: string, text: string) => {
    setQuestions(
      questions.map(q => {
        if (q.id !== qId) return q;
        return {
          ...q,
          options: q.options.map(o => (o.id === optId ? { ...o, text } : o))
        };
      })
    );
  };

  // Handle Save / Publish
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

    try {
      await onSaveProject({
        id: project?.id,
        title,
        status: finalStatus,
        createdAt: project?.createdAt,
        questions
      });
      setStatus(finalStatus);
      setMessage({
        type: 'success',
        text: finalStatus === 'ACTIVE' ? '투표가 게시되어 공개되었습니다!' : '프로젝트가 성공적으로 저장되었습니다.'
      });
    } catch (err) {
      setMessage({ type: 'error', text: '저장 중 오류가 발생했습니다.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Creation Header */}
      <div className="p-4 lg:p-6 border-b border-slate-800 bg-slate-900/60 backdrop-blur space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white tracking-wide">
                {isNew ? '새 투표 프로젝트 작성' : '투표 질문 구성기 (Creation Zone)'}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">다지선다형 및 주관식 문항을 자유롭게 생성 및 설정하세요.</p>
          </div>

          {/* Top Save & Publish Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSave('DRAFT')}
              disabled={saving}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <Save className="w-3.5 h-3.5 text-slate-400" />
              <span>임시저장</span>
            </button>
            <button
              onClick={() => handleSave('ACTIVE')}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 flex items-center gap-1.5 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlayCircle className="w-4 h-4" />
              <span>게시 & 투표 시작</span>
            </button>
          </div>
        </div>

        {/* Project Title & Status Toolbar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
          <div className="md:col-span-3">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              프로젝트 제목
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="예: 2026 하반기 팀 리모트 워크샵 장소 선호도 조사"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-semibold text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              투표 진행 상태
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500"
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
            className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-medium ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
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
            className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg relative group transition-all hover:border-slate-700"
          >
            {/* Header: Number & Type Badge & Delete */}
            <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 font-extrabold text-xs flex items-center justify-center border border-indigo-500/30">
                  Q{idx + 1}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                    q.type === 'MULTIPLE_CHOICE'
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                      : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                  }`}
                >
                  {q.type === 'MULTIPLE_CHOICE' ? '다지선다형 질문' : '주관식 질문'}
                </span>
              </div>

              <button
                onClick={() => removeQuestion(q.id)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="질문 삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Question Title Input */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">질문 제목</label>
              <input
                type="text"
                value={q.title}
                onChange={e => updateQuestionTitle(q.id, e.target.value)}
                placeholder="질문 내용을 입력하세요..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-medium text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* If Multiple Choice Question */}
            {q.type === 'MULTIPLE_CHOICE' && (
              <div className="space-y-4">
                {/* Min / Max Rules Bar */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      최소 선택 가능 개수 (최저 1개)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={q.maxSelect}
                      value={q.minSelect}
                      onChange={e => updateSelectRules(q.id, 'minSelect', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-semibold focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      최대 선택 가능 개수 (최대 {q.options.length}개)
                    </label>
                    <input
                      type="number"
                      min={q.minSelect}
                      max={q.options.length}
                      value={q.maxSelect}
                      onChange={e => updateSelectRules(q.id, 'maxSelect', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-semibold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Dynamic Options List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-300">
                      선택 항목 목록 ({q.options.length}개 / 최소 2개 ~ 최대 20개)
                    </span>
                    <button
                      onClick={() => addOption(q.id)}
                      disabled={q.options.length >= 20}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-semibold border border-indigo-500/30 flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>항목 추가</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {q.options.map((opt, oIdx) => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 w-5 text-right">{oIdx + 1}.</span>
                        <input
                          type="text"
                          value={opt.text}
                          onChange={e => updateOptionText(q.id, opt.id, e.target.value)}
                          placeholder={`항목 ${oIdx + 1} 입력`}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          onClick={() => removeOption(q.id, opt.id)}
                          disabled={q.options.length <= 2}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-colors"
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
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400">
                <p className="mb-2 font-medium">자유로운 서술형 텍스트 작성 영역이 투표자 화면에 제공됩니다.</p>
                <textarea
                  disabled
                  rows={2}
                  placeholder="[투표자 주관식 작성 예시] 의견을 입력해 주세요..."
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-xs text-slate-500 cursor-not-allowed resize-none"
                />
              </div>
            )}
          </div>
        ))}

        {/* Add Question Controls */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => addQuestion('MULTIPLE_CHOICE')}
            className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/50 text-indigo-300 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <ListPlus className="w-4 h-4 text-indigo-400" />
            <span>+ 다지선다 질문 추가</span>
          </button>
          <button
            onClick={() => addQuestion('SUBJECTIVE')}
            className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/50 text-purple-300 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <MessageSquarePlus className="w-4 h-4 text-purple-400" />
            <span>+ 주관식 질문 추가</span>
          </button>
        </div>
      </div>
    </div>
  );
}
