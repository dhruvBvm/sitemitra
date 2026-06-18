import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/helpers';

export default function Modal({ isOpen, onClose, title, children, className }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "bg-white rounded-[16px] w-[90%] max-w-[400px] max-h-[80vh] flex flex-col mx-auto overflow-hidden shadow-xl animate-in zoom-in-95 duration-200",
          className
        )}
      >
        <div className="flex items-center justify-between p-[16px] border-b border-[#eee] sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-[#1F2937] break-words">{title}</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[#F3F4F6] text-[#6B7280] transition-colors focus-visible:outline-none py-2.5 px-4"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-[16px] overflow-y-auto break-words [&_img]:max-w-full [&_img]:h-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
