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
  Check,
  Printer
} from 'lucide-react';

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
    const questionsList = Array.isArray(project?.questions) ? project.questions : [];
    const answersList = Array.isArray(resp?.answers) ? resp.answers : [];

    return questionsList.map((q, qIndex) => {
      const ans = answersList.find(a => a.questionId === q.id) || answersList[qIndex];
      if (!ans) return { qTitle: q.title || '', answer: '-' };

      const optionsList = Array.isArray(q?.options) ? q.options : [];
      if (q.type === 'MULTIPLE_CHOICE') {
        const selectedOptions = Array.isArray(ans.selectedOptions) ? ans.selectedOptions : [];
        const texts = selectedOptions.map(optIdOrText => {
          const found = optionsList.find(o => o.id === optIdOrText || o.text === optIdOrText);
          return found ? found.text : optIdOrText;
        });
        let answerText = texts.length > 0 ? texts.join(', ') : '';
        if (!answerText && ans.textAnswer && ans.textAnswer.trim()) {
          answerText = ans.textAnswer;
        }
        return { qTitle: q.title || '', answer: answerText || '-' };
      } else {
        return { qTitle: q.title || '', answer: ans.textAnswer && ans.textAnswer.trim() ? ans.textAnswer : '-' };
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
    body { font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif; padding: 40px; background: #f8fafc; color: #0f172a; line-height: 1.6; }
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

  // Generate Print-Ready PDF Window (Fixes Korean encoding broken fonts natively)
  const openKoreanPDFPrintWindow = () => {
    const rawRows = (summary.rawResponses || []).map((resp, rIdx) => {
      const items = getFormattedAnswers(resp);
      return `
        <tr>
          <td style="padding:8px; font-weight:bold; color:#4338ca; text-align:center;">#${rIdx + 1}</td>
          <td style="padding:8px; font-weight:bold; color:#0f172a;">${resp.voterName || '익명 투표자'}</td>
          <td style="padding:8px; color:#64748b; font-size:11px;">${new Date(resp.createdAt).toLocaleString('ko-KR')}</td>
          ${items.map(item => `<td style="padding:8px; font-weight:600; color:#334155;">${item.answer}</td>`).join('')}
        </tr>
      `;
    }).join('');

    const statsHtml = summary.questionStats.map((q, idx) => `
      <div style="margin-top:16px; padding:16px; background:#f8fafc; border-radius:10px; border:1px solid #e2e8f0;">
        <h3 style="margin:0 0 10px 0; color:#1e293b; font-size:14px;">Q${idx + 1}. ${q.title}</h3>
        ${q.type === 'MULTIPLE_CHOICE' ? `
          <table style="width:100%; border-collapse:collapse; font-size:12px;">
            <thead>
              <tr style="background:#e2e8f0; color:#475569;">
                <th style="padding:6px; text-align:left;">선택 항목</th>
                <th style="padding:6px; text-align:right; width:100px;">득표 수</th>
                <th style="padding:6px; text-align:right; width:80px;">득표율</th>
              </tr>
            </thead>
            <tbody>
              ${q.optionCounts.map(opt => `
                <tr style="border-bottom:1px solid #e2e8f0;">
                  <td style="padding:6px; font-weight:600;">${opt.text}</td>
                  <td style="padding:6px; text-align:right; font-weight:bold; color:#4f46e5;">${opt.count}표</td>
                  <td style="padding:6px; text-align:right; font-weight:bold; color:#059669;">${opt.percentage}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : `
          <div style="space-y:6px;">
            ${q.subjectiveAnswers.map(ans => `
              <div style="background:white; padding:8px 12px; border-radius:6px; border:1px solid #e2e8f0; font-size:12px; margin-top:4px;">
                <strong style="color:#4f46e5;">👤 ${ans.voterName || '익명'}:</strong> "${ans.text}"
                <span style="color:#94a3b8; font-size:10px; float:right;">${new Date(ans.createdAt).toLocaleString('ko-KR')}</span>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `).join('');

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('팝업 차단이 설정되어 있습니다. 팝업을 허용해주세요.');
      return;
    }

    printWindow.document.write(`
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${project.title} - PDF 보고서</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700;800&display=swap');
    body { font-family: 'Noto Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; padding: 24px; color: #0f172a; background: #f1f5f9; }
    .print-card { background: white; max-width: 900px; margin: 0 auto; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
    h1 { color: #4f46e5; font-size: 22px; margin-bottom: 6px; font-weight: 800; }
    h2 { color: #1e293b; font-size: 16px; margin-top: 28px; margin-bottom: 10px; border-left: 4px solid #4f46e5; padding-left: 10px; font-weight: 700; }
    .meta { color: #64748b; font-size: 12px; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; font-weight: 600; }
    table.pdf-raw-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    table.pdf-raw-table th { background: #f1f5f9; padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e1; color: #475569; font-weight: 700; }
    table.pdf-raw-table td { border-bottom: 1px solid #e2e8f0; }
    @media print {
      body { padding: 0; background: white; }
      .print-card { border: none; padding: 0; shadow: none; max-width: 100%; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width:900px; margin:0 auto 16px auto; display:flex; justify-content:space-between; align-items:center; background:#e0e7ff; padding:12px 20px; border-radius:12px; border:1px solid #c7d2fe;">
    <span style="font-weight:bold; color:#3730a3; font-size:13px;">💡 PDF 저장을 위해 인쇄 창에서 대상을 'PDF로 저장'으로 선택하세요.</span>
    <button onclick="window.print()" style="background:#4f46e5; color:white; border:none; padding:8px 16px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:12px;">🖨️ PDF 바로 인쇄 / 저장</button>
  </div>

  <div class="print-card">
    <h1>📊 ${project.title}</h1>
    <div class="meta">
      <strong>투표 상태:</strong> ${project.status} | <strong>총 응답자 수:</strong> ${summary.totalResponses} 명 | <strong>출력 일시:</strong> ${new Date().toLocaleString('ko-KR')}
    </div>

    <h2>1. 개별 응답자 Raw Data 상세 표</h2>
    <table class="pdf-raw-table">
      <thead>
        <tr>
          <th style="width:50px; text-align:center;">순번</th>
          <th style="width:120px;">투표자 성명</th>
          <th style="width:140px;">투표 일시</th>
          ${project.questions.map((q, idx) => `<th>Q${idx + 1}. ${q.title}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rawRows || '<tr><td colspan="100" style="padding:20px; text-align:center; color:#94a3b8;">응답 데이터가 없습니다.</td></tr>'}
      </tbody>
    </table>

    <h2>2. 문항별 세부 통계 집계 요약</h2>
    ${statsHtml}
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
    `);
    printWindow.document.close();
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
        onClose();
      } else if (selectedFormat === 'CSV') {
        const csvContent = generateCSV();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        onClose();
      } else if (selectedFormat === 'HTML') {
        const htmlContent = generateHTML();
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.html`;
        link.click();
        URL.revokeObjectURL(url);
        onClose();
      } else if (selectedFormat === 'PDF') {
        // Open Korean-compatible PDF print/save window
        openKoreanPDFPrintWindow();
        onClose();
      }
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
            { id: 'PDF', name: 'PDF 문서 (한글 완벽지원)', desc: '한글 깨짐 없는 고품질 PDF', icon: Printer },
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
          {selectedFormat === 'PDF' ? (
            <span className="text-indigo-700 font-bold">
              * PDF 선택 시 한글 폰트 깨짐 없는 벡터 PDF 저장 창이 생성됩니다.
            </span>
          ) : (
            <span>
              * 투표자 성명 및 선택 항목이 포함된 <span className="text-indigo-600 font-bold">Raw Data 표</span>가 파일에 내보내집니다.
            </span>
          )}
        </div>

        {/* Download Action Button */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
        >
          <Download className="w-4 h-4" />
          <span>{selectedFormat === 'PDF' ? '한글 PDF 생성 / 저장 실행' : `${selectedFormat} 파일 다운로드 실행`}</span>
        </button>
      </div>
    </div>
  );
}
