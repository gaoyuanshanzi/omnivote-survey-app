'use client';

import React, { useState, useEffect } from 'react';
import { ProjectItem, DashboardSummary } from '@/lib/types';
import { QRCodeSVG } from 'qrcode.react';
import {
  BarChart3,
  Users,
  Copy,
  Check,
  QrCode,
  Download,
  Share2,
  ExternalLink,
  MessageSquare,
  Trophy,
  RefreshCw,
  Clock,
  PieChart as PieIcon,
  CheckCircle2,
  Sparkles,
  Search
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid
} from 'recharts';
import ExportModal from './ExportModal';

interface ResultsDashboardProps {
  project: ProjectItem | null;
  onRefreshProject?: () => void;
}

export default function ResultsDashboard({ project, onRefreshProject }: ResultsDashboardProps) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [subjectiveSearch, setSubjectiveSearch] = useState('');

  const fetchSummary = async () => {
    if (!project) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/dashboard`);
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [project?.id]);

  if (!project) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-950 text-slate-400 text-center">
        <BarChart3 className="w-12 h-12 text-slate-700 mb-3" />
        <h3 className="text-sm font-bold text-slate-300">선택된 프로젝트가 없습니다</h3>
        <p className="text-xs text-slate-500 mt-1">좌측 디렉토리에서 투표 프로젝트를 선택해주세요.</p>
      </div>
    );
  }

  // Share URL calculation
  const getSurveyUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/survey/${project.id}`;
    }
    return `/survey/${project.id}`;
  };

  const surveyUrl = getSurveyUrl();

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(surveyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Bar Chart custom color palette
  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Header Controls & Share/Export */}
      <div className="p-4 lg:p-5 border-b border-slate-800 bg-slate-900/60 backdrop-blur space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white tracking-wide">
                실시간 결과 대시보드 (Dashboard)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-md font-medium">
              "{project.title}" 투표 현황 및 집계 분석
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchSummary}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition-all"
              title="데이터 새로고침"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>

            <button
              onClick={() => setIsExportOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export / 결과 내보내기</span>
            </button>
          </div>
        </div>

        {/* Share Link & QR Code Card */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                공유 접속 URL & QR 코드
              </span>
              <div className="text-xs font-mono text-slate-300 truncate bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800/80 mt-0.5">
                {surveyUrl}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyUrl}
              className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '복사 완료!' : 'URL 복사'}</span>
            </button>

            <button
              onClick={() => setShowQR(!showQR)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                showQR
                  ? 'bg-purple-600 text-white border-purple-500'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR 코드</span>
            </button>

            <a
              href={`/survey/${project.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center transition-all"
              title="투표 페이지 바로가기"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* QR Code Popout Drawer/Card */}
        {showQR && (
          <div className="p-4 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-2xl flex flex-col items-center justify-center animate-fade-in">
            <QRCodeSVG value={surveyUrl} size={150} level="H" includeMargin />
            <p className="text-xs font-bold text-slate-800 mt-2">스마트폰으로 QR 코드를 스캔하세요</p>
            <p className="text-[11px] text-slate-500">실시간 투표 참여 화면으로 연결됩니다.</p>
          </div>
        )}
      </div>

      {/* Main Dashboard Analytics Scroll Container */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 custom-scrollbar">
        {/* SECTION 1: Summary Table (상단 - 전체 결과 표) */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">전체 결과 요약 표 (Summary Table)</h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold bg-indigo-500/10 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30">
              <span>총 참여 인원:</span>
              <span className="font-extrabold text-white text-sm">{summary?.totalResponses || 0} 명</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">문항</th>
                  <th className="py-2.5 px-3 font-semibold">질문 제목</th>
                  <th className="py-2.5 px-3 font-semibold">유형</th>
                  <th className="py-2.5 px-3 font-semibold text-center">총 응답 수</th>
                  <th className="py-2.5 px-3 font-semibold text-right">주요 현황</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {summary?.questionStats.map((q, idx) => (
                  <tr key={q.questionId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-indigo-400">Q{idx + 1}</td>
                    <td className="py-3 px-3 font-medium text-white max-w-xs truncate">{q.title}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 border border-slate-700">
                        {q.type === 'MULTIPLE_CHOICE' ? '다지선다' : '주관식'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-indigo-300">{q.totalAnswers}건</td>
                    <td className="py-3 px-3 text-right">
                      {q.type === 'MULTIPLE_CHOICE' && q.topOption ? (
                        <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          1위: {q.topOption.text} ({q.topOption.percentage}%)
                        </span>
                      ) : q.type === 'SUBJECTIVE' ? (
                        <span className="text-[11px] text-purple-300">텍스트 응답 {q.subjectiveAnswers.length}개</span>
                      ) : (
                        <span className="text-[11px] text-slate-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 2: Bar Graphs (중간 - 다지선다 항목별 막대그래프) */}
        {summary?.questionStats
          .filter(q => q.type === 'MULTIPLE_CHOICE')
          .map((q, qIdx) => (
            <div key={q.questionId} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider block">
                    Q{qIdx + 1} 다지선다 항목별 득표율 시각화
                  </span>
                  <h4 className="text-sm font-bold text-white mt-0.5">{q.title}</h4>
                </div>
                {q.topOption && (
                  <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/30">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>최다 선택: {q.topOption.text} ({q.topOption.percentage}%)</span>
                  </div>
                )}
              </div>

              {/* Recharts Bar Graph */}
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={q.optionCounts} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                      dataKey="text"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      interval={0}
                      tick={props => {
                        const { x, y, payload } = props;
                        const label = payload.value.length > 10 ? `${payload.value.slice(0, 10)}...` : payload.value;
                        return (
                          <g transform={`translate(${x},${y})`}>
                            <text x={0} y={0} dy={12} textAnchor="end" fill="#94a3b8" fontSize={11} transform="rotate(-15)">
                              {label}
                            </text>
                          </g>
                        );
                      }}
                    />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs">
                              <p className="font-bold text-white">{data.text}</p>
                              <p className="text-indigo-400 font-semibold mt-1">
                                득표 수: {data.count}표 ({data.percentage}%)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {q.optionCounts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Option details breakdown grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-4 pt-4 border-t border-slate-800">
                {q.optionCounts.map((opt, oIdx) => (
                  <div
                    key={opt.optionId}
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[oIdx % COLORS.length] }}
                      />
                      <span className="text-xs font-medium text-slate-300 truncate">{opt.text}</span>
                    </div>
                    <div className="text-xs font-bold text-white shrink-0 ml-2">
                      {opt.count}표 <span className="text-slate-500 font-normal text-[11px]">({opt.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

        {/* SECTION 3: Subjective Answers Feed (하단 - 통계 및 주관식 답변) */}
        {summary?.questionStats
          .filter(q => q.type === 'SUBJECTIVE')
          .map((q, qIdx) => {
            const filteredAnswers = q.subjectiveAnswers.filter(ans =>
              ans.text.toLowerCase().includes(subjectiveSearch.toLowerCase())
            );
            return (
              <div key={q.questionId} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-purple-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">주관식 답변 리스트 ({q.subjectiveAnswers.length}건)</h4>
                      <p className="text-xs text-slate-400 font-medium">{q.title}</p>
                    </div>
                  </div>

                  {/* Search within subjective responses */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="주관식 응답 검색..."
                      value={subjectiveSearch}
                      onChange={e => setSubjectiveSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {filteredAnswers.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-500">
                    주관식 응답 데이터가 없습니다.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                    {filteredAnswers.map((ans, aIdx) => (
                      <div
                        key={ans.id}
                        className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 text-xs text-slate-200 space-y-1.5 hover:border-purple-500/40 transition-colors"
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span className="font-bold text-purple-400">응답자 #{aIdx + 1}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-600" />
                            {new Date(ans.createdAt).toLocaleString('ko-KR')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-100 font-normal whitespace-pre-wrap leading-relaxed">
                          "{ans.text}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Modal for Exporting Data */}
      {summary && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          project={project}
          summary={summary}
        />
      )}
    </div>
  );
}
