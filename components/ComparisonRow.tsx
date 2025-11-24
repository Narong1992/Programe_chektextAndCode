import React from 'react';
import { RowResult, ComparisonStatus } from '../types';
import { StatusBadge } from './StatusBadge';

interface ComparisonRowProps {
  row: RowResult;
  index: number;
}

export const ComparisonRow: React.FC<ComparisonRowProps> = ({ row, index }) => {
  const getRowBg = () => {
    if (row.status === ComparisonStatus.MISMATCH) return 'bg-red-50';
    // Using Orange-50 for Missing to differentiate from the base Yellow-50 theme
    if (row.status === ComparisonStatus.MISSING_IN_CHECK) return 'bg-orange-50';
    if (row.status === ComparisonStatus.EXTRA_IN_CHECK) return 'bg-blue-50';
    
    // Alternating Yellow theme
    return index % 2 === 0 ? 'bg-yellow-50' : 'bg-[#fffdf0]'; // very light yellow for alternate
  };

  return (
    <div className={`grid grid-cols-12 gap-2 border-b border-yellow-200 py-2 px-4 text-sm ${getRowBg()} hover:bg-yellow-100 transition-colors`}>
      <div className="col-span-1 text-gray-400 font-mono text-xs flex items-start mt-1">
        {index + 1}
      </div>
      <div className="col-span-4 break-all text-gray-800">
        {row.sourceValue || <span className="text-gray-300 italic">(ว่าง)</span>}
      </div>
      <div className="col-span-4 break-all text-gray-800">
        {row.checkValue || <span className="text-gray-300 italic">(ว่าง)</span>}
      </div>
      <div className="col-span-3 flex flex-col items-start gap-1">
        <div className="flex items-center justify-between w-full">
           <StatusBadge status={row.status} />
        </div>
        {row.explanation && (
          <span className="text-[10px] text-gray-500 font-medium bg-white/50 px-1 rounded">
            {row.explanation}
          </span>
        )}
      </div>
    </div>
  );
};