'use client';

import React, { useState } from 'react';
import { ProjectItem, DashboardSummary } from '@/lib/types';
import {
  Download,
  FileText,
  FileCode,
  FileSpreadsheet,
  FileType,
  X,
  Check,
  Sparkles
} from 'lucide-react';
import jsPDF from 'jspdf';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectItem;
  summary: DashboardSummary;
}

export default function ExportModal({ isOpen, onClose, project, summary }: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<'TXT' | 'PDF' | 'HTML' | 'CSV'>('TXT');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  // Generate TXT Content
  const generateTXT = () => {
    let txt = `=====================================================\n`;
    txt += `  OMNIVOTE 투표 결과 보고서\n`;
    txt += `=====================================================\n\n`;
    txt += `프로젝트 제목: ${project.title}\n`;
    txt += `투표 상태: ${project.status}\n`;
    txt += `총 참여 인원: ${summary.totalResponses} 명\n`;
    txt += `생성 일시: ${new Date(project.createdAt).toLocaleString('ko-KR')}\n`;
    txt += `보고서 출력 시각: ${new Date().toLocaleString('ko-KR')}\n\n`;
    txt += `-----------------------------------------------------\n`;
    txt += ` 문항별 세부 투표 집계\n`;
    txt += `-----------------------------------------------------\n\n`;

    summary.questionStats.forEach((q, idx) => {
      txt += `[Q${idx + 1}] ${q.title} (총 응답: ${q.totalAnswers}건)\n`;
      if (q.type === 'MULTIPLE_CHOICE') {
        q.optionCounts.forEach((opt, oIdx) => {
          txt += `  - 항목 ${oIdx + 1}: ${opt.text} => ${opt.count}표 (${opt.percentage}%)\n`;
        });
        if (q.topOption) {
          txt += `  * 최다 선택 항목: ${q.topOption.text} (${q.topOption.count}표, ${q.topOption.percentage}%)\n`;
        }
      } else {
        txt += `  - 주관식 응답 목록 (${q.subjectiveAnswers.length}건):\n`;
        q.subjectiveAnswers.forEach((ans, aIdx) => {
          txt += `    (${aIdx + 1}) "${ans.text}" [${new Date(ans.createdAt).toLocaleString('ko-KR')}]\n`;
        });
      }
      txt += `\n`;
    });

    return txt;
  };

  // Generate CSV Content
  const generateCSV = () => {
    let csv = `\uFEFF"문항 번호","질문 제목","질문 유형","선택 항목 / 주관식 응답","득표 수 / 응답 시각","득표율 (%)\"\n`;

    summary.questionStats.forEach((q, idx) => {
      if (q.type === 'MULTIPLE_CHOICE') {
        q.optionCounts.forEach(opt => {
          csv += `"Q${idx + 1}","${q.title.replace(/"/g, '""')}","다지선다","${opt.text.replace(/"/g, '""')}","${opt.count}","${opt.percentage}%"\n`;
        });
      } else {
        q.subjectiveAnswers.forEach(ans => {
          csv += `"Q${idx + 1}","${q.title.replace(/"/g, '""')}","주관식","${ans.text.replace(/"/g, '""')}","${new Date(ans.createdAt).toLocaleString('ko-KR')}","-"\n`;
        });
      }
    });

    return csv;
  };

  // Generate HTML Report Content
  const generateHTML = () => {
    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${project.title} - 투표 결과 보고서</title>
  <style>
    body { font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; padding: 40px; background: #f8fafc; color: #0f172a; line-height: 1.6; }
    .card { background: white; padding: 30px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); max-width: 850px; margin: 0 auto; }
    h1 { color: #4f46e5; margin-bottom: 8px; font-size: 24px; }
    .meta { color: #64748b; font-size: 14px; margin-bottom: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; }
    .question { margin-top: 24px; padding: 20px; background: #f1f5f9; border-radius: 12px; }
    .question h3 { margin: 0 0 12px 0; color: #1e293b; font-size: 16px; }
    .option-row { display: flex; align-items: center; margin-bottom: 8px; font-size: 14px; }
    .option-text { flex: 1; font-weight: 500; }
    .bar-bg { width: 200px; height: 12px; background: #cbd5e1; border-radius: 6px; overflow: hidden; margin: 0 12px; }
    .bar-fill { height: 100%; background: #6366f1; border-radius: 6px; }
    .count { width: 80px; text-align: right; font-weight: bold; color: #4338ca; }
    .subjective-item { background: white; padding: 10px 14px; border-radius: 8px; margin-top: 6px; font-size: 13px; border: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>📊 ${project.title}</h1>
    <div class="meta">
      <strong>상태:</strong> ${project.status} | <strong>총 응답자 수:</strong> ${summary.totalResponses} 명 | <strong>보고서 시각:</strong> ${new Date().toLocaleString('ko-KR')}
    </div>
    ${summary.questionStats.map((q, idx) => `
      <div class="question">
        <h3>Q${idx + 1}. ${q.title}</h3>
        ${q.type === 'MULTIPLE_CHOICE' ? `
          ${q.optionCounts.map(opt => `
            <div class="option-row">
              <span class="option-text">${opt.text}</span>
              <div class="bar-bg"><div class="bar-fill" style="width: ${opt.percentage}%"></div></div>
              <span class="count">${opt.count}표 (${opt.percentage}%)</span>
            </div>
          `).join('')}
        ` : `
          ${q.subjectiveAnswers.map(ans => `
            <div class="subjective-item">💬 "${ans.text}" <span style="color:#94a3b8; font-size:11px;">(${new Date(ans.createdAt).toLocaleString('ko-KR')})</span></div>
          `).join('')}
        `}
      </div>
    `).join('')}
  </div>
</body>
</html>`;
  };

  // Download Trigger
  const handleExport = () => {
    setIsExporting(true);
    const sanitizedTitle = project.title.replace(/[^a-zA-Z0-9가-힣]/g, '_');
    const filename = `${sanitizedTitle}_투표결과_${new Date().toISOString().slice(0, 10)}`;

    try {
      if (selectedFormat === 'TXT') {
        const txtContent = generateTXT();
        const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.txt`;
        link.click();
        URL.revokeObjectURL(url);
      } else if (selectedFormat === 'CSV') {
        const csvContent = generateCSV();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      } else if (selectedFormat === 'HTML') {
        const htmlContent = generateHTML();
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.html`;
        link.click();
        URL.revokeObjectURL(url);
      } else if (selectedFormat === 'PDF') {
        // Generate PDF using jsPDF
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('OmniVote Survey Results Report', 14, 20);
        doc.setFontSize(10);
        doc.text(`Project Title: ${project.title}`, 14, 30);
        doc.text(`Status: ${project.status} | Total Responses: ${summary.totalResponses}`, 14, 37);
        doc.text(`Date: ${new Date().toLocaleString()}`, 14, 44);

        let yPos = 55;
        summary.questionStats.forEach((q, idx) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.setFontSize(12);
          doc.text(`Q${idx + 1}. ${q.title}`, 14, yPos);
          yPos += 7;

          if (q.type === 'MULTIPLE_CHOICE') {
            q.optionCounts.forEach(opt => {
              if (yPos > 270) {
                doc.addPage();
                yPos = 20;
              }
              doc.setFontSize(9);
              doc.text(`- ${opt.text}: ${opt.count} votes (${opt.percentage}%)`, 20, yPos);
              yPos += 6;
            });
          } else {
            q.subjectiveAnswers.forEach(ans => {
              if (yPos > 270) {
                doc.addPage();
                yPos = 20;
              }
              doc.setFontSize(9);
              doc.text(`* "${ans.text.slice(0, 70)}"`, 20, yPos);
              yPos += 6;
            });
          }
          yPos += 6;
        });

        doc.save(`${filename}.pdf`);
      }
      onClose();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">결과 내보내기 (Export)</h3>
            <p className="text-xs text-slate-400">원하는 파일 포맷을 선택하여 내보내세요.</p>
          </div>
        </div>

        {/* Format Selector Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { id: 'TXT', name: 'TXT 텍스트', desc: '간편한 메모장 텍스트 파일', icon: FileText, color: 'indigo' },
            { id: 'PDF', name: 'PDF 문서', desc: '공통 문서용 PDF 보고서', icon: FileType, color: 'rose' },
            { id: 'HTML', name: 'HTML 웹보고서', desc: '브라우저 시각화 리포트', icon: FileCode, color: 'emerald' },
            { id: 'CSV', name: 'CSV 엑셀', desc: '데이터 분석용 엑셀 호환', icon: FileSpreadsheet, color: 'amber' }
          ].map(fmt => {
            const IconComponent = fmt.icon;
            const isSelected = selectedFormat === fmt.id;
            return (
              <button
                key={fmt.id}
                onClick={() => setSelectedFormat(fmt.id as any)}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  isSelected
                    ? 'bg-indigo-600/15 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                )}
                <IconComponent
                  className={`w-5 h-5 mb-2 ${
                    isSelected
                      ? 'text-indigo-400'
                      : fmt.id === 'PDF'
                      ? 'text-rose-400'
                      : fmt.id === 'HTML'
                      ? 'text-emerald-400'
                      : fmt.id === 'CSV'
                      ? 'text-amber-400'
                      : 'text-indigo-400'
                  }`}
                />
                <div className="font-bold text-xs text-white">{fmt.name}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{fmt.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Info notice */}
        <div className="mb-6 p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400">
          * 생성된 파일은 사용자 기기의 <span className="text-indigo-400 font-semibold">다운로드(Downloads)</span>{' '}
          폴더에 자동 저장됩니다.
        </div>

        {/* Download Action Button */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
        >
          <Download className="w-4 h-4" />
          <span>{selectedFormat} 파일 다운로드 실행</span>
        </button>
      </div>
    </div>
  );
}
