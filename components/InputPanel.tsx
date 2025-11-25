import React from 'react';

interface InputPanelProps {
  label: string;
  subLabel: string;
  value: string;
  onChange: (val: string) => void;
  onPaste: (e: React.ClipboardEvent, setter: React.Dispatch<React.SetStateAction<string>>) => void;
  onClear?: () => void;
  number: number;
}

export const InputPanel: React.FC<InputPanelProps> = ({ 
  label, subLabel, value, onChange, onPaste, onClear, number 
}) => {
  // Define styles based on panel number to make them distinct and comfortable
  // Box 1 (Source): Cool tone (Slate/Blue) - Represents stability/reference
  // Box 2 (Check): Warm tone (Orange/Amber) - Represents active checking/comparison
  
  const theme = number === 1 ? {
      bg: "bg-slate-50",       // Very light cool gray
      headerBg: "bg-slate-100", 
      border: "border-slate-200",
      badge: "bg-slate-600",
      ring: "focus:ring-slate-400"
  } : {
      bg: "bg-orange-50",      // Very light warm orange
      headerBg: "bg-orange-100",
      border: "border-orange-200",
      badge: "bg-orange-500",
      ring: "focus:ring-orange-300"
  };

  return (
    <div className={`flex flex-col h-full rounded-xl shadow-sm border overflow-hidden transition-colors duration-300 ${theme.bg} ${theme.border}`}>
      <div className={`px-4 py-3 border-b flex justify-between items-center ${theme.headerBg} ${theme.border}`}>
        <label className="font-semibold text-gray-700 flex items-center gap-2 text-sm">
          <span className={`w-5 h-5 rounded-full text-white flex items-center justify-center text-xs font-bold ${theme.badge}`}>
            {number}
          </span>
          {label}
        </label>
        <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-mono">{subLabel}</span>
             {onClear && value && (
                 <button 
                    className="text-xs text-red-500 hover:text-red-700 hover:underline"
                    onClick={onClear}
                 >
                   ล้างข้อมูล
                 </button>
             )}
        </div>
      </div>
      <textarea
        className={`flex-1 p-4 resize-none focus:outline-none focus:ring-2 focus:ring-inset font-mono text-sm leading-6 whitespace-pre text-gray-800 placeholder-gray-400 bg-transparent ${theme.ring}`}
        placeholder="วางข้อมูลที่นี่..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={(e) => {
            const dummySetter = (val: string | ((prev: string) => string)) => {
                 if (typeof val === 'string') onChange(val);
            };
            onPaste(e, dummySetter as any);
        }}
        spellCheck={false}
      />
    </div>
  );
};