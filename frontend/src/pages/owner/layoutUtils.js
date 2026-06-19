import React from 'react';
import { ArrowLeft } from 'lucide-react';

export const FullWidthContainer = ({ children, className = '' }) => (
  <div className={`flex flex-col min-h-screen space-y-4 max-w-[428px] mx-auto ${className}`}>{children}</div>
);

export const StickyHeader = ({ title, onBack }) => (
  <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
    <div className="flex items-center gap-3 px-4 py-3">
      <button type="button" onClick={onBack} className="p-1 -ml-1 rounded-full hover:bg-[#F3F4F6] transition-colors text-[#6B7280] shrink-0">
        <ArrowLeft className="w-6 h-6" />
      </button>
      <h1 className="text-[20px] font-bold tracking-tight text-[#1F2937]">{title}</h1>
    </div>
  </div>
);

export const FormSection = ({ children }) => (
  <div className="bg-white rounded-md border border-transparent p-2 w-full flex flex-col gap-2">
    {children}
  </div>
);
