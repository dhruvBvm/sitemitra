import { cn } from '../../utils/helpers';

export function Card({ className, children, ...props }) {
  return (
    <div 
      className={cn("bg-[var(--card-bg)] border-2 border-[var(--border-color)] hover:shadow-md transition-shadow duration-200", className)} 
      style={{ borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn("flex flex-col space-y-1.5 p-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3 className={cn("text-base font-bold leading-none tracking-tight text-[var(--text-main)]", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardContent({ className, children, ...props }) {
  // Use p-4 for 16px padding
  return (
    <div className={cn("p-4", className)} {...props}>
      {children}
    </div>
  );
}
