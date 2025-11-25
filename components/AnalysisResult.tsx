import React from 'react';
import { AiAnalysisResult } from '../types';

interface AnalysisResultProps {
  analysis: AiAnalysisResult | null;
  onClose: () => void;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ analysis, onClose }) => {
  if (!analysis) return null;

  return (
    <div className="bg-indigo-50 border-b border-indigo-100 p-4 animate-fadeIn relative">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-indigo-100 rounded-lg shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-indigo-900 mb-1">ผลการวิเคราะห์ด้วย AI</h3>
          <p className="text-sm text-indigo-800 mb-2 leading-relaxed">{analysis.summary}</p>
          
          {analysis.patternDetected && (
            <div className="text-xs bg-white/60 p-2 rounded mb-2 border border-indigo-100 text-indigo-900">
              <span className="font-semibold text-indigo-700">รูปแบบที่พบ:</span> {analysis.patternDetected}
            </div>
          )}

          {analysis.suggestions && analysis.suggestions.length > 0 && (
            <div className="mt-2">
              <span className="text-xs font-semibold text-indigo-900 uppercase tracking-wide">คำแนะนำ:</span>
              <ul className="list-disc list-inside text-xs text-indigo-800 mt-1 space-y-1">
                {analysis.suggestions.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};