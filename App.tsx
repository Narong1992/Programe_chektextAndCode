import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import { ComparisonRow } from './components/ComparisonRow';
import { analyzeDiscrepancies } from './services/geminiService';
import { RowResult, ComparisonStatus } from './types';

function App() {
  // Input states
  const [sourceInput, setSourceInput] = useState<string>('');
  const [checkInput, setCheckInput] = useState<string>('');
  
  // Processing states
  const [results, setResults] = useState<RowResult[]>([]);
  const [stats, setStats] = useState({ match: 0, mismatch: 0, missing: 0, extra: 0 });
  
  // AI states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{ summary: string; suggestions: string[], patternDetected?: string } | null>(null);

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

      // Logic: 
      // 1. Both empty lines -> EMPTY_BOTH
      // 2. Content matches -> MATCH
      // 3. Source has content, Check empty -> MISSING
      // 4. Source empty, Check has content -> EXTRA
      // 5. Both have content but differ -> MISMATCH

      if (src === '' && chk === '') {
        status = ComparisonStatus.EMPTY_BOTH;
      } else if (src === chk) {
        status = ComparisonStatus.MATCH;
        newStats.match++;
      } else if (src !== '' && chk === '') {
        status = ComparisonStatus.MISSING_IN_CHECK;
        newStats.missing++;
      } else if (src === '' && chk !== '') {
        status = ComparisonStatus.EXTRA_IN_CHECK;
        newStats.extra++;
      } else {
        status = ComparisonStatus.MISMATCH;
        newStats.mismatch++;
      }

      newResults.push({
        id: i,
        sourceValue: srcRaw, 
        checkValue: chkRaw,
        status
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

    // Prepare data for Excel
    // Mapping variable names to Excel columns carefully
    const dataToExport = results.map(row => {
      let statusText = '';
      // Ensure text matches StatusBadge.tsx exactly
      switch(row.status) {
        case ComparisonStatus.MATCH: 
          statusText = 'ตรงกัน (Match)'; 
          break;
        case ComparisonStatus.MISMATCH: 
          statusText = 'ไม่ตรงกัน (Mismatch)'; 
          break;
        case ComparisonStatus.MISSING_IN_CHECK: 
          statusText = 'ขาด (Missing)'; 
          break;
        case ComparisonStatus.EXTRA_IN_CHECK: 
          statusText = 'เกิน (Extra)'; 
          break;
        case ComparisonStatus.EMPTY_BOTH: 
          statusText = '-'; 
          break;
      }

      return {
        'No.': row.id + 1,
        'Source (ต้นฉบับ)': row.sourceValue,
        'Check (ตรวจสอบ)': row.checkValue,
        'Status (สถานะ)': statusText
      };
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataToExport);

    // Set column widths
    const wscols = [
      { wch: 6 },  // No.
      { wch: 30 }, // Source
      { wch: 30 }, // Check
      { wch: 20 }  // Status
    ];
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, "Comparison Results");

    // Generate filename with timestamp
    const date = new Date();
    const timestamp = `${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}`;
    
    XLSX.writeFile(wb, `Comparison_Result_${timestamp}.xlsx`);
  };

  const handlePaste = (e: React.ClipboardEvent, setter: React.Dispatch<React.SetStateAction<string>>) => {
     // Textarea default paste behavior is usually sufficient
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col xl:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 self-start xl:self-center">
            <div className="bg-green-600 p-2 rounded-lg shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Excel AI Comparator</h1>
              <p className="text-xs text-gray-500">เปรียบเทียบข้อมูลด้วย AI ผู้เชี่ยวชาญ</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-4 self-end xl:self-center w-full md:w-auto">
             <div className="flex gap-2 text-xs font-medium overflow-x-auto max-w-full pb-1 md:pb-0">
                <div className="px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded whitespace-nowrap">ตรงกัน: {stats.match}</div>
                <div className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded whitespace-nowrap">ไม่ตรง: {stats.mismatch}</div>
                <div className="px-2 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded whitespace-nowrap">ขาด: {stats.missing}</div>
                <div className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded whitespace-nowrap">เกิน: {stats.extra}</div>
             </div>
             
             <div className="flex items-center gap-2 w-full md:w-auto">
                <button 
                  onClick={handleExportExcel}
                  disabled={results.length === 0}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md font-semibold text-white text-sm transition-all shadow-sm
                    ${results.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 hover:shadow-md'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export Excel
                </button>

                <button 
                  onClick={handleAiAnalysis}
                  disabled={isAnalyzing || (!sourceInput && !checkInput)}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md font-semibold text-white text-sm transition-all shadow-sm
                    ${isAnalyzing || (!sourceInput && !checkInput) ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md'}`}
                >
                  {isAnalyzing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      กำลังวิเคราะห์...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      AI Expert Analysis
                    </>
                  )}
                </button>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)] lg:h-[calc(100vh-80px)] overflow-hidden">
        
        {/* Column 1: Source */}
        <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden order-1">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <label className="font-semibold text-gray-700 flex items-center gap-2 text-sm">
              <span className="w-5 h-5 rounded-full bg-gray-700 text-white flex items-center justify-center text-xs font-bold">1</span>
              ต้นฉบับ (Source)
            </label>
            <span className="text-xs text-gray-400">Column A</span>
          </div>
          <textarea
            className="flex-1 p-4 resize-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500 font-mono text-sm leading-6 whitespace-pre"
            placeholder="วางข้อมูลต้นฉบับที่นี่..."
            value={sourceInput}
            onChange={(e) => setSourceInput(e.target.value)}
            onPaste={(e) => handlePaste(e, setSourceInput)}
            spellCheck={false}
          />
        </div>

        {/* Column 2: Check */}
        <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden order-2">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <label className="font-semibold text-gray-700 flex items-center gap-2 text-sm">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</span>
              ตรวจสอบ (Check)
            </label>
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Column B</span>
                 {checkInput && (
                     <button 
                        className="text-xs text-red-500 hover:text-red-700 hover:underline"
                        onClick={() => setCheckInput('')}
                     >
                       Clear
                     </button>
                 )}
            </div>
          </div>
          <textarea
            className="flex-1 p-4 resize-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 font-mono text-sm leading-6 whitespace-pre"
            placeholder="วางข้อมูลที่จะตรวจสอบที่นี่..."
            value={checkInput}
            onChange={(e) => setCheckInput(e.target.value)}
             onPaste={(e) => handlePaste(e, setCheckInput)}
            spellCheck={false}
          />
        </div>

        {/* Column 3: Results */}
        <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative order-3">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center z-10">
            <label className="font-semibold text-gray-700 flex items-center gap-2 text-sm">
              <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">3</span>
              ผลลัพธ์ (Results)
            </label>
            <span className="text-xs text-gray-400">Comparison Status</span>
          </div>

          {/* AI Analysis Result Panel (Overlay or top section) */}
          {aiAnalysis && (
            <div className="bg-indigo-50 border-b border-indigo-100 p-4 animate-fadeIn">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-bold text-indigo-900 mb-1">AI Expert Analysis</h3>
                        <p className="text-sm text-indigo-800 mb-2">{aiAnalysis.summary}</p>
                        
                        {aiAnalysis.patternDetected && (
                            <div className="text-xs bg-white/50 p-2 rounded mb-2 border border-indigo-100">
                                <strong>Pattern:</strong> {aiAnalysis.patternDetected}
                            </div>
                        )}

                        {aiAnalysis.suggestions && aiAnalysis.suggestions.length > 0 && (
                            <div className="mt-2">
                                <span className="text-xs font-semibold text-indigo-900 uppercase tracking-wide">ข้อแนะนำ:</span>
                                <ul className="list-disc list-inside text-xs text-indigo-800 mt-1 space-y-1">
                                    {aiAnalysis.suggestions.map((s, idx) => (
                                        <li key={idx}>{s}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                     <button onClick={() => setAiAnalysis(null)} className="text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
          )}

          {/* Results List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
            <div className="sticky top-0 bg-gray-50 border-b border-gray-200 grid grid-cols-12 gap-2 py-2 px-4 text-xs font-semibold text-gray-500 z-0">
                <div className="col-span-1">#</div>
                <div className="col-span-4">Source</div>
                <div className="col-span-4">Check</div>
                <div className="col-span-3">Status</div>
            </div>
            
            {results.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p>วางข้อมูลเพื่อเริ่มการเปรียบเทียบ</p>
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