import React from 'react';
import { RowResult, ComparisonStatus } from '../types';
import { StatusBadge } from './StatusBadge';

interface ComparisonRowProps {
  row: RowResult;
  index: number;
}

export const ComparisonRow: React.FC<ComparisonRowProps> = ({ row, index }) => {
  // Base hover effect
  const hoverClass = "hover:bg-gray-50 transition-colors";
  
  const getTextClass = (status: ComparisonStatus) => {
      if (status === ComparisonStatus.MISMATCH || status === ComparisonStatus.MISSING_IN_CHECK || status === ComparisonStatus.EXTRA_IN_CHECK) {
          return "text-gray-900 font-medium";
      }
      return "text-gray-600";
  };

  // Determine background color based on status
  let rowBg = "bg-white";
  let cellBg = "bg-white";
  
  if (row.status === ComparisonStatus.MISMATCH) {
      rowBg = "bg-yellow-50";
      cellBg = "bg-yellow-50";
  }

  return (
    <div className={`grid grid-cols-12 gap-0 border-b border-gray-100 text-sm ${rowBg} ${hoverClass}`}>
      {/* Index */}
      <div className={`col-span-1 py-2 px-2 text-gray-400 font-mono text-xs flex items-start justify-center select-none border-r border-gray-100 ${cellBg}`}>
        {index + 1}
      </div>
      
      {/* Source Column (Left) */}
      <div className={`col-span-4 py-2 px-4 break-all font-mono border-r border-gray-100 ${getTextClass(row.status)}`}>
        {row.sourceValue ? (
            row.sourceValue
        ) : (
            <span className="text-gray-300 italic text-xs select-none">(ว่าง)</span>
        )}
      </div>
      
      {/* Check Column (Right) */}
      <div className={`col-span-4 py-2 px-4 break-all font-mono border-r border-gray-100 ${getTextClass(row.status)}`}>
        {row.checkValue ? (
            row.checkValue
        ) : (
             <span className="text-gray-300 italic text-xs select-none">(ว่าง)</span>
        )}
      </div>
      
      {/* Status Column */}
      <div className={`col-span-3 py-2 px-4 flex flex-col items-start gap-1 ${cellBg}`}>
        <div className="flex items-center justify-between w-full">
           <StatusBadge status={row.status} />
        </div>
        {row.explanation && (
          <span className="text-[10px] text-gray-500 font-medium border border-gray-100 bg-white/50 px-1 rounded">
            {row.explanation}
          </span>
        )}
      </div>
    </div>
  );
};