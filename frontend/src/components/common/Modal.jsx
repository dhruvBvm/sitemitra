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
    <div 
      className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 w-full z-50 flex items-center justify-center bg-black/40" 
      style={{ maxWidth: '428px' }}
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "bg-white rounded-[12px] w-[92%] max-w-sm max-h-[80vh] flex flex-col mx-auto overflow-hidden shadow-xl animate-in zoom-in-95 duration-200",
          className
        )}
      >
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[#E5E7EB] sticky top-0 bg-white z-10 shrink-0">
            <h2 className="text-lg font-bold text-[#1F2937] break-words">{title}</h2>
            <button 
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition-colors focus-visible:outline-none shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 overflow-y-auto break-words [&_img]:max-w-full [&_img]:h-auto flex-1 text-[13px]">
            {children}
          </div>
      </div>
    </div>
  );
}
