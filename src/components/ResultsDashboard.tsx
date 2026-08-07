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
      <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-50 text-slate-500 text-center">
        <BarChart3 className="w-12 h-12 text-slate-300 mb-3" />
        <h3 className="text-sm font-bold text-slate-700">선택된 프로젝트가 없습니다</h3>
        <p className="text-xs text-slate-500 mt-1 font-medium">좌측 디렉토리에서 투표 프로젝트를 선택해주세요.</p>
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

  // Bar Chart custom color palette (vibrant & professional for light theme)
  const COLORS = ['#4f46e5', '#7c3aed', '#db2777', '#d97706', '#059669', '#0891b2', '#2563eb'];

  return (
    <div className="h-full flex flex-col bg-slate-50 text-slate-900 overflow-hidden">
      {/* Top Header Controls & Share/Export */}
      <div className="p-4 lg:p-5 border-b border-slate-200 bg-white space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                실시간 결과 대시보드 (Dashboard)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-md font-semibold">
              "{project.title}" 투표 현황 및 집계 분석
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchSummary}
              className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold flex items-center gap-1 transition-all shadow-2xs"
              title="데이터 새로고침"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            <button
              onClick={() => setIsExportOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export / 결과 내보내기</span>
            </button>
          </div>
        </div>

        {/* Share Link & QR Code Card */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider block">
                공유 접속 URL & QR 코드
              </span>
              <div className="text-xs font-mono text-slate-800 truncate bg-white px-2.5 py-1 rounded-lg border border-slate-200 mt-0.5 font-semibold">
                {surveyUrl}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyUrl}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '복사 완료!' : 'URL 복사'}</span>
            </button>

            <button
              onClick={() => setShowQR(!showQR)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all shadow-2xs ${
                showQR
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR 코드</span>
            </button>

            <a
              href={`/survey/${project.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold flex items-center transition-all shadow-2xs"
              title="투표 페이지 바로가기"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* QR Code Popout Drawer/Card */}
        {showQR && (
          <div className="p-4 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-xl flex flex-col items-center justify-center animate-fade-in">
            <QRCodeSVG value={surveyUrl} size={150} level="H" includeMargin />
            <p className="text-xs font-bold text-slate-900 mt-2">스마트폰으로 QR 코드를 스캔하세요</p>
            <p className="text-[11px] text-slate-500 font-medium">실시간 투표 참여 화면으로 연결됩니다.</p>
          </div>
        )}
      </div>

      {/* Main Dashboard Analytics Scroll Container */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 custom-scrollbar">
        {/* SECTION 1: Summary Table (상단 - 전체 결과 표) */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">전체 결과 요약 표 (Summary Table)</h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200">
              <span>총 참여 인원:</span>
              <span className="font-extrabold text-indigo-900 text-sm">{summary?.totalResponses || 0} 명</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                <tr>
                  <th className="py-2.5 px-3">문항</th>
                  <th className="py-2.5 px-3">질문 제목</th>
                  <th className="py-2.5 px-3">유형</th>
                  <th className="py-2.5 px-3 text-center">총 응답 수</th>
                  <th className="py-2.5 px-3 text-right">주요 현황</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {summary?.questionStats.map((q, idx) => (
                  <tr key={q.questionId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-bold text-indigo-600">Q{idx + 1}</td>
                    <td className="py-3 px-3 font-bold text-slate-900 max-w-xs truncate">{q.title}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-700">
                        {q.type === 'MULTIPLE_CHOICE' ? '다지선다' : '주관식'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-indigo-700">{q.totalAnswers}건</td>
                    <td className="py-3 px-3 text-right">
                      {q.type === 'MULTIPLE_CHOICE' && q.topOption ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                          1위: {q.topOption.text} ({q.topOption.percentage}%)
                        </span>
                      ) : q.type === 'SUBJECTIVE' ? (
                        <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                          텍스트 응답 {q.subjectiveAnswers.length}개
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">-</span>
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
            <div key={q.questionId} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider block">
                    Q{qIdx + 1} 다지선다 항목별 득표율 시각화
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">{q.title}</h4>
                </div>
                {q.topOption && (
                  <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
                    <Trophy className="w-4 h-4 text-amber-600" />
                    <span>최다 선택: {q.topOption.text} ({q.topOption.percentage}%)</span>
                  </div>
                )}
              </div>

              {/* Recharts Bar Graph */}
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={q.optionCounts} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="text"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      interval={0}
                      tick={props => {
                        const { x, y, payload } = props;
                        const label = payload.value.length > 10 ? `${payload.value.slice(0, 10)}...` : payload.value;
                        return (
                          <g transform={`translate(${x},${y})`}>
                            <text x={0} y={0} dy={12} textAnchor="end" fill="#475569" fontSize={11} fontWeight={600} transform="rotate(-15)">
                              {label}
                            </text>
                          </g>
                        );
                      }}
                    />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-lg text-xs">
                              <p className="font-bold text-slate-900">{data.text}</p>
                              <p className="text-indigo-600 font-bold mt-1">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-4 pt-4 border-t border-slate-100">
                {q.optionCounts.map((opt, oIdx) => (
                  <div
                    key={opt.optionId}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[oIdx % COLORS.length] }}
                      />
                      <span className="text-xs font-bold text-slate-800 truncate">{opt.text}</span>
                    </div>
                    <div className="text-xs font-extrabold text-slate-900 shrink-0 ml-2">
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
              <div key={q.questionId} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">주관식 답변 리스트 ({q.subjectiveAnswers.length}건)</h4>
                      <p className="text-xs text-slate-500 font-semibold">{q.title}</p>
                    </div>
                  </div>

                  {/* Search within subjective responses */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="주관식 응답 검색..."
                      value={subjectiveSearch}
                      onChange={e => setSubjectiveSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:bg-white"
                    />
                  </div>
                </div>

                {filteredAnswers.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 font-medium">
                    주관식 응답 데이터가 없습니다.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                    {filteredAnswers.map((ans, aIdx) => (
                      <div
                        key={ans.id}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 space-y-1.5 hover:border-purple-300 transition-colors"
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span className="font-extrabold text-purple-700">응답자 #{aIdx + 1}</span>
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {new Date(ans.createdAt).toLocaleString('ko-KR')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-900 font-medium whitespace-pre-wrap leading-relaxed">
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
