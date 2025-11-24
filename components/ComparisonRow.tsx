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
    if (row.status === ComparisonStatus.MISSING_IN_CHECK) return 'bg-yellow-50';
    if (row.status === ComparisonStatus.EXTRA_IN_CHECK) return 'bg-blue-50';
    return index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
  };

  return (
    <div className={`grid grid-cols-12 gap-2 border-b border-gray-200 py-2 px-4 text-sm ${getRowBg()} hover:bg-gray-100 transition-colors`}>
      <div className="col-span-1 text-gray-400 font-mono text-xs flex items-center">
        {index + 1}
      </div>
      <div className="col-span-4 break-all text-gray-800">
        {row.sourceValue || <span className="text-gray-300 italic">(ว่าง)</span>}
      </div>
      <div className="col-span-4 break-all text-gray-800">
        {row.checkValue || <span className="text-gray-300 italic">(ว่าง)</span>}
      </div>
      <div className="col-span-3 flex items-center justify-between">
        <StatusBadge status={row.status} />
      </div>
    </div>
  );
};