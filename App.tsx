import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { ComparisonRow } from './components/ComparisonRow';
import { AnalysisResult } from './components/AnalysisResult';
import { InputPanel } from './components/InputPanel';
import { analyzeDiscrepancies } from './services/geminiService';
import { RowResult, ComparisonStatus, AiAnalysisResult } from './types';

function App() {
  // Input states
  const [sourceInput, setSourceInput] = useState<string>('');
  const [checkInput, setCheckInput] = useState<string>('');
  
  // Processing states
  const [results, setResults] = useState<RowResult[]>([]);
  const [stats, setStats] = useState({ match: 0, mismatch: 0, missing: 0, extra: 0 });
  
  // AI states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysisResult | null>(null);

  // Core Comparison Logic
  const compareData = useCallback(() => {
    const sourceLines = sourceInput.split(/\r?\n/);
    const checkLines = checkInput.split(/\r?\n/);
    
    // Determine max length, ensuring at least one row if both are empty strings
    const maxLines = Math.max(sourceLines.length, checkLines.length);
    
    const newResults: RowResult[] = [];
    const newStats = { match: 0, mismatch: 0, missing: 0, extra: 0 };

    // If inputs are totally empty, don't generate rows
    if (sourceInput === '' && checkInput === '') {
        setResults([]);
        setStats(newStats);
        setAiAnalysis(null);
        return;
    }

    for (let i = 0; i < maxLines; i++) {
      const srcRaw = sourceLines[i] || '';
      const chkRaw = checkLines[i] || '';
      
      const src = srcRaw.trim();
      const chk = chkRaw.trim();

      let status = ComparisonStatus.EMPTY_BOTH;
      let explanation = '';

      if (src === '' && chk === '') {
        status = ComparisonStatus.EMPTY_BOTH;
      } else if (src === chk) {
        status = ComparisonStatus.MATCH;
        newStats.match++;
      } else if (src !== '' && chk === '') {
        status = ComparisonStatus.MISSING_IN_CHECK;
        newStats.missing++;
        explanation = 'ไม่มีในข้อมูลตรวจสอบ';
      } else if (src === '' && chk !== '') {
        status = ComparisonStatus.EXTRA_IN_CHECK;
        newStats.extra++;
        explanation = 'ข้อมูลเกินมา';
      } else {
        status = ComparisonStatus.MISMATCH;
        newStats.mismatch++;
        
        // Detailed Mismatch Analysis
        if (src.toLowerCase() === chk.toLowerCase()) {
            explanation = 'ตัวพิมพ์ต่างกัน'; // Case sensitive
        } else if (src.replace(/\s+/g, '') === chk.replace(/\s+/g, '')) {
            explanation = 'เว้นวรรคต่างกัน'; // Whitespace
        } else if (!isNaN(Number(src)) && !isNaN(Number(chk))) {
            explanation = 'ตัวเลขไม่ตรงกัน'; // Numeric
        } else {
            explanation = 'เนื้อหาต่างกัน'; // Content differs
        }
      }

      newResults.push({
        id: i,
        sourceValue: srcRaw, 
        checkValue: chkRaw,
        status,
        explanation
      });
    }

    setResults(newResults);
    setStats(newStats);
    setAiAnalysis(null); // Reset AI analysis on data change
  }, [sourceInput, checkInput]);

  // Auto-compare when input changes
  useEffect(() => {
    const timer = setTimeout(() => {
      compareData();
    }, 300);
    return () => clearTimeout(timer);
  }, [compareData]);

  const handleAiAnalysis = async () => {
    if (!sourceInput && !checkInput) return;
    
    setIsAnalyzing(true);
    try {
      const result = await analyzeDiscrepancies(sourceInput, checkInput);
      setAiAnalysis(result);
    } catch (error) {
      alert("ไม่สามารถวิเคราะห์ข้อมูลได้ กรุณาตรวจสอบ API Key หรือลองใหม่อีกครั้ง");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportExcel = () => {
    if (results.length === 0) {
      alert("ไม่มีข้อมูลสำหรับ Export");
      return;
    }

    const dataToExport = results.map(row => {
      let statusText = '';
      switch(row.status) {
        case ComparisonStatus.MATCH: statusText = 'ตรงกัน'; break;
        case ComparisonStatus.MISMATCH: statusText = 'ไม่ตรงกัน'; break;
        case ComparisonStatus.MISSING_IN_CHECK: statusText = 'ขาด'; break;
        case ComparisonStatus.EXTRA_IN_CHECK: statusText = 'เกิน'; break;
        case ComparisonStatus.EMPTY_BOTH: statusText = '-'; break;
      }

      return {
        'ลำดับ': row.id + 1,
        'ต้นฉบับ': row.sourceValue,
        'ตรวจสอบ': row.checkValue,
        'สถานะ': statusText,
        'หมายเหตุ': row.explanation || ''
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    
    // Set column widths
    ws['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 30 }, { wch: 15 }, { wch: 20 }];

    XLSX.utils.book_append_sheet(wb, ws, "Diff Report");
    const date = new Date();
    const timestamp = `${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
    XLSX.writeFile(wb, `Diff_Report_${timestamp}.xlsx`);
  };

  const handlePaste = (e: React.ClipboardEvent, setter: React.Dispatch<React.SetStateAction<string>>) => {
     // Default paste behavior handled by textarea usually, 
     // but explicit handling can be added here if we want to pre-process paste data.
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col xl:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-3 self-start xl:self-center">
            <div className="bg-gray-800 p-2 rounded-lg shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">โปรแกรมเปรียบเทียบข้อมูล Excel AI</h1>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-4 self-end xl:self-center w-full md:w-auto">
             <div className="flex gap-2 text-xs font-medium bg-gray-50 p-1 rounded-md border border-gray-200">
                <div className="px-2 py-1 bg-green-100 text-green-700 rounded shadow-sm">ตรงกัน: {stats.match}</div>
                <div className="px-2 py-1 bg-red-100 text-red-700 rounded shadow-sm">ต่างกัน: {stats.mismatch}</div>
                <div className="px-2 py-1 bg-orange-100 text-orange-700 rounded">ขาด: {stats.missing}</div>
                <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded">เกิน: {stats.extra}</div>
             </div>
             
             <div className="flex items-center gap-2 w-full md:w-auto">
                <button 
                  onClick={handleExportExcel}
                  disabled={results.length === 0}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md font-semibold text-white text-xs transition-all shadow-sm
                    ${results.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                >
                  ส่งออก Excel
                </button>

                <button 
                  onClick={handleAiAnalysis}
                  disabled={isAnalyzing || (!sourceInput && !checkInput)}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md font-semibold text-white text-xs transition-all shadow-sm
                    ${isAnalyzing || (!sourceInput && !checkInput) ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                  {isAnalyzing ? 'กำลังวิเคราะห์...' : 'วิเคราะห์ AI'}
                </button>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-80px)] overflow-hidden">
        
        {/* Column 1: Source */}
        <InputPanel 
          label="ข้อมูลต้นฉบับ"
          subLabel="คอลัมน์ A"
          value={sourceInput}
          onChange={setSourceInput}
          onPaste={handlePaste}
          number={1}
        />

        {/* Column 2: Check */}
        <InputPanel 
          label="ข้อมูลตรวจสอบ"
          subLabel="คอลัมน์ B"
          value={checkInput}
          onChange={setCheckInput}
          onPaste={handlePaste}
          onClear={() => setCheckInput('')}
          number={2}
        />

        {/* Column 3: Results */}
        <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative order-3">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center z-10">
            <label className="font-semibold text-gray-700 flex items-center gap-2 text-sm">
              <span className="w-5 h-5 rounded-full bg-gray-600 text-white flex items-center justify-center text-xs font-bold">3</span>
              ผลการเปรียบเทียบ
            </label>
            <span className="text-xs text-gray-400">ตัวอย่าง</span>
          </div>

          <AnalysisResult analysis={aiAnalysis} onClose={() => setAiAnalysis(null)} />

          {/* Results List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
            <div className="sticky top-0 bg-gray-50 border-b border-gray-200 grid grid-cols-12 gap-0 py-2 px-2 text-[10px] uppercase tracking-wider font-semibold text-gray-500 z-10">
                <div className="col-span-1 text-center">ลำดับ</div>
                <div className="col-span-4 px-2">ต้นฉบับ</div>
                <div className="col-span-4 px-2">ตรวจสอบ</div>
                <div className="col-span-3 px-2">สถานะ</div>
            </div>
            
            {results.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-300 text-sm">
                    <p>ไม่มีข้อมูลเปรียบเทียบ</p>
                </div>
            ) : (
                <div className="divide-y divide-gray-100">
                    {results.map((row, index) => (
                        <ComparisonRow key={row.id} row={row} index={index} />
                    ))}
                </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}

export default App;