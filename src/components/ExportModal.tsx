'use client';

import React, { useState } from 'react';
import { ProjectItem, DashboardSummary, ResponseItem } from '@/lib/types';
import {
  Download,
  FileText,
  FileCode,
  FileSpreadsheet,
  FileType,
  X,
  Check
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

  // Helper to format a single response's answers
  const getFormattedAnswers = (resp: ResponseItem) => {
    return project.questions.map(q => {
      const ans = resp.answers.find(a => a.questionId === q.id);
      if (!ans) return { qTitle: q.title, answer: '-' };

      if (q.type === 'MULTIPLE_CHOICE') {
        const texts = (ans.selectedOptions || []).map(optIdOrText => {
          const found = q.options.find(o => o.id === optIdOrText || o.text === optIdOrText);
          return found ? found.text : optIdOrText;
        });
        return { qTitle: q.title, answer: texts.length > 0 ? texts.join(', ') : '-' };
      } else {
        return { qTitle: q.title, answer: ans.textAnswer && ans.textAnswer.trim() ? ans.textAnswer : '-' };
      }
    });
  };

  // Generate TXT Content (Includes Raw Data Table)
  const generateTXT = () => {
    let txt = `=====================================================\n`;
    txt += `  OMNIVOTE 투표 결과 & Raw Data 종합 보고서\n`;
    txt += `=====================================================\n\n`;
    txt += `프로젝트 제목: ${project.title}\n`;
    txt += `투표 상태: ${project.status}\n`;
    txt += `총 참여 인원: ${summary.totalResponses} 명\n`;
    txt += `생성 일시: ${new Date(project.createdAt).toLocaleString('ko-KR')}\n`;
    txt += `보고서 출력 시각: ${new Date().toLocaleString('ko-KR')}\n\n`;

    txt += `-----------------------------------------------------\n`;
    txt += ` 1. 문항별 세부 투표 집계 요약\n`;
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
          txt += `    (${aIdx + 1}) [${ans.voterName || '익명'}] "${ans.text}" [${new Date(ans.createdAt).toLocaleString('ko-KR')}]\n`;
        });
      }
      txt += `\n`;
    });

    txt += `-----------------------------------------------------\n`;
    txt += ` 2. 개별 응답자 Raw Data 상세 내역 표\n`;
    txt += `-----------------------------------------------------\n\n`;

    if (!summary.rawResponses || summary.rawResponses.length === 0) {
      txt += `(기록된 Raw Data 응답이 없습니다)\n`;
    } else {
      summary.rawResponses.forEach((resp, rIdx) => {
        txt += `[응답 #${rIdx + 1}] 투표자: ${resp.voterName || '익명 투표자'} | 작성시각: ${new Date(resp.createdAt).toLocaleString('ko-KR')}\n`;
        const items = getFormattedAnswers(resp);
        items.forEach((item, qIdx) => {
          txt += `  - Q${qIdx + 1} (${item.qTitle}): ${item.answer}\n`;
        });
        txt += `\n`;
      });
    }

    return txt;
  };

  // Generate CSV Content (Raw Data Table Included)
  const generateCSV = () => {
    // UTF-8 BOM for Excel compatibility
    let csv = `\uFEFF"=== 개별 응답자 Raw Data 상세 표 ==="\n`;
    
    // Headers: 번호, 투표자 성명, 작성 일시, Question 1, Question 2 ...
    const qHeaders = project.questions.map((q, idx) => `"Q${idx + 1}: ${q.title.replace(/"/g, '""')}"`).join(',');
    csv += `"순번","투표자 성명","작성 일시",${qHeaders}\n`;

    if (summary.rawResponses && summary.rawResponses.length > 0) {
      summary.rawResponses.forEach((resp, rIdx) => {
        const vName = `"${(resp.voterName || '익명 투표자').replace(/"/g, '""')}"`;
        const timeStr = `"${new Date(resp.createdAt).toLocaleString('ko-KR')}"`;
        const answersStr = getFormattedAnswers(resp)
          .map(item => `"${item.answer.replace(/"/g, '""')}"`)
          .join(',');
        csv += `"${rIdx + 1}",${vName},${timeStr},${answersStr}\n`;
      });
    } else {
      csv += `"1","응답 데이터 없음","-","-"\n`;
    }

    csv += `\n"=== 문항별 집계 요약 ==="\n`;
    csv += `"문항 번호","질문 제목","질문 유형","선택 항목 / 응답","득표 수 / 응답 시각","득표율 (%)"\n`;

    summary.questionStats.forEach((q, idx) => {
      if (q.type === 'MULTIPLE_CHOICE') {
        q.optionCounts.forEach(opt => {
          csv += `"Q${idx + 1}","${q.title.replace(/"/g, '""')}","다지선다","${opt.text.replace(/"/g, '""')}","${opt.count}","${opt.percentage}%"\n`;
        });
      } else {
        q.subjectiveAnswers.forEach(ans => {
          csv += `"Q${idx + 1}","${q.title.replace(/"/g, '""')}","주관식","[${(ans.voterName || '익명').replace(/"/g, '""')}] ${ans.text.replace(/"/g, '""')}","${new Date(ans.createdAt).toLocaleString('ko-KR')}","-"\n`;
        });
      }
    });

    return csv;
  };

  // Generate HTML Report Content (Raw Data Table Included)
  const generateHTML = () => {
    const rawRows = (summary.rawResponses || []).map((resp, rIdx) => {
      const items = getFormattedAnswers(resp);
      return `
        <tr>
          <td style="padding:10px; font-weight:bold; color:#4338ca;">#${rIdx + 1}</td>
          <td style="padding:10px; font-weight:bold;">${resp.voterName || '익명 투표자'}</td>
          <td style="padding:10px; color:#64748b; font-size:12px;">${new Date(resp.createdAt).toLocaleString('ko-KR')}</td>
          ${items.map(item => `<td style="padding:10px;">${item.answer}</td>`).join('')}
        </tr>
      `;
    }).join('');

    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${project.title} - 투표 결과 & Raw Data 보고서</title>
  <style>
    body { font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; padding: 40px; background: #f8fafc; color: #0f172a; line-height: 1.6; }
    .card { background: white; padding: 32px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.06); max-width: 1000px; margin: 0 auto; border: 1px solid #e2e8f0; }
    h1 { color: #4f46e5; margin-bottom: 8px; font-size: 24px; }
    h2 { color: #1e293b; font-size: 18px; margin-top: 32px; border-left: 4px solid #4f46e5; padding-left: 10px; }
    .meta { color: #64748b; font-size: 14px; margin-bottom: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; }
    .question { margin-top: 20px; padding: 20px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }
    .question h3 { margin: 0 0 12px 0; color: #1e293b; font-size: 15px; }
    .option-row { display: flex; align-items: center; margin-bottom: 8px; font-size: 14px; }
    .option-text { flex: 1; font-weight: 500; }
    .bar-bg { width: 200px; height: 12px; background: #cbd5e1; border-radius: 6px; overflow: hidden; margin: 0 12px; }
    .bar-fill { height: 100%; background: #4f46e5; border-radius: 6px; }
    .count { width: 90px; text-align: right; font-weight: bold; color: #4338ca; }
    table.raw-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
    table.raw-table th { background: #f1f5f9; padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e1; color: #475569; }
    table.raw-table td { border-bottom: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>📊 ${project.title}</h1>
    <div class="meta">
      <strong>투표 상태:</strong> ${project.status} | <strong>총 응답자 수:</strong> ${summary.totalResponses} 명 | <strong>보고서 출력 시각:</strong> ${new Date().toLocaleString('ko-KR')}
    </div>

    <h2>1. 개별 응답자 Raw Data 표 (Raw Responses Table)</h2>
    <table class="raw-table">
      <thead>
        <tr>
          <th>순번</th>
          <th>투표자 성명</th>
          <th>작성 일시</th>
          ${project.questions.map((q, idx) => `<th>Q${idx + 1}. ${q.title}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rawRows || '<tr><td colspan="100" style="padding:20px; text-align:center; color:#94a3b8;">응답 데이터가 없습니다.</td></tr>'}
      </tbody>
    </table>

    <h2>2. 문항별 세부 통계 집계 요약</h2>
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
            <div style="background:white; padding:10px 14px; border-radius:8px; margin-top:6px; font-size:13px; border:1px solid #e2e8f0;">
              <strong>👤 ${ans.voterName || '익명'}:</strong> "${ans.text}" <span style="color:#94a3b8; font-size:11px;">(${new Date(ans.createdAt).toLocaleString('ko-KR')})</span>
            </div>
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
    const filename = `${sanitizedTitle}_투표결과_RawData_${new Date().toISOString().slice(0, 10)}`;

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
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('OmniVote Survey & Raw Data Report', 14, 20);
        doc.setFontSize(10);
        doc.text(`Project Title: ${project.title}`, 14, 28);
        doc.text(`Status: ${project.status} | Total Responses: ${summary.totalResponses}`, 14, 35);
        doc.text(`Date: ${new Date().toLocaleString()}`, 14, 42);

        let yPos = 52;
        doc.setFontSize(12);
        doc.text('1. Raw Responses List', 14, yPos);
        yPos += 8;

        if (summary.rawResponses && summary.rawResponses.length > 0) {
          summary.rawResponses.forEach((resp, rIdx) => {
            if (yPos > 270) {
              doc.addPage();
              yPos = 20;
            }
            doc.setFontSize(9);
            const voterName = resp.voterName || 'Anonymous';
            const timeStr = new Date(resp.createdAt).toLocaleString();
            doc.text(`#${rIdx + 1} Voter: ${voterName} (${timeStr})`, 16, yPos);
            yPos += 5;

            const items = getFormattedAnswers(resp);
            items.forEach((item, qIdx) => {
              if (yPos > 270) {
                doc.addPage();
                yPos = 20;
              }
              doc.text(`   Q${qIdx + 1}: ${item.answer.slice(0, 75)}`, 16, yPos);
              yPos += 5;
            });
            yPos += 3;
          });
        }

        yPos += 5;
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(12);
        doc.text('2. Question Summary', 14, yPos);
        yPos += 8;

        summary.questionStats.forEach((q, idx) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.setFontSize(11);
          doc.text(`Q${idx + 1}. ${q.title}`, 14, yPos);
          yPos += 6;

          if (q.type === 'MULTIPLE_CHOICE') {
            q.optionCounts.forEach(opt => {
              if (yPos > 270) {
                doc.addPage();
                yPos = 20;
              }
              doc.setFontSize(9);
              doc.text(`- ${opt.text}: ${opt.count} votes (${opt.percentage}%)`, 20, yPos);
              yPos += 5;
            });
          } else {
            q.subjectiveAnswers.forEach(ans => {
              if (yPos > 270) {
                doc.addPage();
                yPos = 20;
              }
              doc.setFontSize(9);
              doc.text(`* [${ans.voterName || 'Anon'}] "${ans.text.slice(0, 65)}"`, 20, yPos);
              yPos += 5;
            });
          }
          yPos += 4;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 relative text-slate-900">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">결과 & Raw Data 내보내기 (Export)</h3>
            <p className="text-xs text-slate-500 font-medium">원하는 파일 포맷을 선택하여 내보내세요.</p>
          </div>
        </div>

        {/* Format Selector Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { id: 'TXT', name: 'TXT 텍스트', desc: 'Raw Data 표 포함 텍스트 보고서', icon: FileText },
            { id: 'PDF', name: 'PDF 문서', desc: 'Raw Data 포함 PDF 문서', icon: FileType },
            { id: 'HTML', name: 'HTML 웹보고서', desc: 'Raw Data 표 포함 웹 리포트', icon: FileCode },
            { id: 'CSV', name: 'CSV 엑셀', desc: 'Raw Data 표 포함 엑셀 파일', icon: FileSpreadsheet }
          ].map(fmt => {
            const IconComponent = fmt.icon;
            const isSelected = selectedFormat === fmt.id;
            return (
              <button
                key={fmt.id}
                onClick={() => setSelectedFormat(fmt.id as any)}
                className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                  isSelected
                    ? 'bg-indigo-50/80 border-indigo-600 shadow-sm ring-1 ring-indigo-500/30'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                )}
                <IconComponent
                  className={`w-5 h-5 mb-2 ${
                    isSelected
                      ? 'text-indigo-600'
                      : fmt.id === 'PDF'
                      ? 'text-rose-500'
                      : fmt.id === 'HTML'
                      ? 'text-emerald-600'
                      : fmt.id === 'CSV'
                      ? 'text-amber-600'
                      : 'text-indigo-600'
                  }`}
                />
                <div className="font-bold text-xs text-slate-900">{fmt.name}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-medium">{fmt.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Info notice */}
        <div className="mb-6 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-medium">
          * 투표자 성명 및 선택 항목이 포함된 <span className="text-indigo-600 font-bold">Raw Data 표</span>가 파일에 함께 내보내집니다.
        </div>

        {/* Download Action Button */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
        >
          <Download className="w-4 h-4" />
          <span>{selectedFormat} Raw Data 표 포함 파일 내보내기</span>
        </button>
      </div>
    </div>
  );
}
