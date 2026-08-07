'use client';

import React, { useState, useEffect, use } from 'react';
import { ProjectItem, QuestionItem } from '@/lib/types';
import { Vote, CheckCircle2, AlertCircle, Send, Sparkles, Clock, Lock } from 'lucide-react';

export default function PublicSurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state: { [qId]: { selectedOptions: string[], textAnswer?: string } }
  const [formState, setFormState] = useState<{
    [qId: string]: { selectedOptions: string[]; textAnswer: string };
  }>({});

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        const res = await fetch(`/api/projects/${id}`);
        const data = await res.json();
        if (data.success && data.project) {
          setProject(data.project);
          // Initialize form state
          const initial: any = {};
          data.project.questions.forEach((q: QuestionItem) => {
            initial[q.id] = { selectedOptions: [], textAnswer: '' };
          });
          setFormState(initial);
        } else {
          setError(data.message || '투표를 찾을 수 없습니다.');
        }
      } catch (err) {
        setError('서버 연결 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchSurvey();
  }, [id]);

  // Handle option checkbox / radio toggle
  const handleOptionToggle = (q: QuestionItem, optId: string) => {
    const current = formState[q.id]?.selectedOptions || [];
    let updated: string[];

    if (q.maxSelect === 1) {
      // Single selection (Radio behavior)
      updated = [optId];
    } else {
      // Multiple selection
      if (current.includes(optId)) {
        updated = current.filter(id => id !== optId);
      } else {
        if (current.length >= q.maxSelect) {
          alert(`이 질문은 최대 ${q.maxSelect}개까지만 선택할 수 있습니다.`);
          return;
        }
        updated = [...current, optId];
      }
    }

    setFormState({
      ...formState,
      [q.id]: {
        ...formState[q.id],
        selectedOptions: updated
      }
    });
  };

  // Handle subjective text answer change
  const handleTextChange = (qId: string, text: string) => {
    setFormState({
      ...formState,
      [qId]: {
        ...formState[qId],
        textAnswer: text
      }
    });
  };

  // Submit Survey Response
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    // Client-side min/max validation
    for (const q of project.questions) {
      if (q.type === 'MULTIPLE_CHOICE') {
        const selected = formState[q.id]?.selectedOptions || [];
        if (selected.length < q.minSelect) {
          alert(`'${q.title}' 질문은 최소 ${q.minSelect}개 이상 항목을 선택해주세요.`);
          return;
        }
      }
    }

    setSubmitting(true);

    try {
      const formattedAnswers = Object.keys(formState).map(qId => ({
        questionId: qId,
        selectedOptions: formState[qId].selectedOptions,
        textAnswer: formState[qId].textAnswer
      }));

      const res = await fetch(`/api/projects/${id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: formattedAnswers })
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        alert(data.message || '투표 제출에 실패했습니다.');
      }
    } catch (err) {
      alert('제출 처리 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl shadow-xl">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-300">투표 정보를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/20">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">접속 오류</h2>
          <p className="text-xs text-slate-400">{error || '존재하지 않거나 비활성화된 투표입니다.'}</p>
        </div>
      </div>
    );
  }

  if (project.status === 'CLOSED') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">투표가 종료되었습니다</h2>
          <p className="text-xs text-slate-400 font-medium">본 설문조사는 기획자에 의해 종료 처리되었습니다.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 p-8 rounded-3xl text-center space-y-5 shadow-2xl relative z-10 backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">투표가 성공적으로 소중하게 제출되었습니다!</h2>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            참여해 주셔서 진심으로 감사드립니다.<br />
            제출하신 의견은 실시간 통계 결과에 반영되었습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 flex justify-center">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header Branding Card */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-2xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
            <Vote className="w-4 h-4" />
            <span>OmniVote Public Survey</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-snug">{project.title}</h1>
          <div className="flex items-center gap-3 pt-2 text-xs text-slate-400 border-t border-slate-800/80">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              투표 진행 중
            </span>
            <span>•</span>
            <span>총 {project.questions.length}개의 문항</span>
          </div>
        </div>

        {/* Survey Questions Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {project.questions.map((q, idx) => (
            <div
              key={q.id}
              className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4 transition-all hover:border-slate-700"
            >
              {/* Question Header */}
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-xl bg-indigo-600/20 text-indigo-400 font-extrabold text-xs flex items-center justify-center border border-indigo-500/30 shrink-0 mt-0.5">
                  Q{idx + 1}
                </span>
                <div>
                  <h3 className="text-base font-bold text-white leading-snug">{q.title}</h3>
                  {q.type === 'MULTIPLE_CHOICE' && (
                    <p className="text-xs text-indigo-400 font-semibold mt-1">
                      (
                      {q.minSelect === q.maxSelect
                        ? `정확히 ${q.minSelect}개 선택`
                        : `최소 ${q.minSelect}개 ~ 최대 ${q.maxSelect}개 선택 가능`}
                      )
                    </p>
                  )}
                </div>
              </div>

              {/* Multiple Choice Options */}
              {q.type === 'MULTIPLE_CHOICE' && (
                <div className="space-y-2.5 pt-1">
                  {q.options.map(opt => {
                    const isChecked = (formState[q.id]?.selectedOptions || []).includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleOptionToggle(q, opt.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isChecked
                            ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-md shadow-indigo-950'
                            : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800/50 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-sm font-medium">{opt.text}</span>
                        <div
                          className={`w-5 h-5 rounded-${
                            q.maxSelect === 1 ? 'full' : 'md'
                          } border flex items-center justify-center transition-all ${
                            isChecked
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : 'border-slate-700 bg-slate-900'
                          }`}
                        >
                          {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Subjective Question Textarea */}
              {q.type === 'SUBJECTIVE' && (
                <div className="pt-1">
                  <textarea
                    rows={4}
                    value={formState[q.id]?.textAnswer || ''}
                    onChange={e => handleTextChange(q.id, e.target.value)}
                    placeholder="여기에 생각이나 의견을 자유롭게 적어주세요..."
                    className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none transition-all"
                  />
                </div>
              )}
            </div>
          ))}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-base shadow-2xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <Send className="w-5 h-5" />
            <span>{submitting ? '제출 처리 중...' : '투표 제출하기'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
