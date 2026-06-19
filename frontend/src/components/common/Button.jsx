import { forwardRef } from 'react';
import { cn } from '../../utils/helpers';
import { Loader2 } from 'lucide-react';

const Button = forwardRef(({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  isLoading = false, 
  children, 
  disabled, 
  ...props 
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-white';
  
  const variants = {
    primary: 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] focus-visible:ring-[#2563EB]',
    secondary: 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#F3F4F6] focus-visible:ring-gray-500',
    danger: 'bg-[#EF4444] text-white hover:bg-[#EF4444] focus-visible:ring-[#EF4444]',
    outline: 'border border-transparent hover:bg-[#F3F4F6] focus-visible:ring-slate-500 text-[#1F2937]',
    ghost: 'hover:bg-[#F3F4F6] hover:text-[#1F2937] text-[#1F2937]',
    success: 'bg-[#10B981] text-white hover:bg-[#10B981] focus-visible:ring-[#10B981]',
  };

  const sizes = {
    sm: 'py-1 px-2.5 h-7 text-xs',
    md: 'py-1.5 px-3 h-8 text-[13px]',
    lg: 'py-2 px-4 h-9 text-sm',
    icon: 'h-8 w-8 p-1.5',
  };

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
