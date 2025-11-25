import React from 'react';
import { ComparisonStatus } from '../types';

interface StatusBadgeProps {
  status: ComparisonStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case ComparisonStatus.MATCH:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          ตรงกัน
        </span>
      );
    case ComparisonStatus.MISMATCH:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-200">
          ไม่ตรงกัน
        </span>
      );
    case ComparisonStatus.MISSING_IN_CHECK:
      // Changed to Orange to stand out against Yellow background
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
          ขาด
        </span>
      );
    case ComparisonStatus.EXTRA_IN_CHECK:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
          เกิน
        </span>
      );
    case ComparisonStatus.EMPTY_BOTH:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-400">
          -
        </span>
      );
    default:
      return null;
  }
};