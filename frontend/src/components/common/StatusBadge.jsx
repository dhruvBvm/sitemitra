import { cn } from '../../utils/helpers';

export default function StatusBadge({ status, className }) {
  const normalized = (status || '').toLowerCase();
  
  let styles = 'bg-[#F3F4F6] text-[#1F2937] border-[#E5E7EB]';
  let label = status;

  if (normalized.includes('pending') || normalized === 'ordered') {
    styles = 'bg-[#F59E0B] text-amber-900 border-transparent';
    if (normalized.includes('manager')) label = 'Pending Manager';
    else if (normalized.includes('owner')) label = 'Pending Owner';
    else if (normalized === 'ordered') label = 'Ordered';
    else label = 'Pending';
  } else if (normalized === 'approved' || normalized === 'active' || normalized === 'completed' || normalized === 'delivered' || normalized === 'closed') {
    styles = 'bg-[#10B981] text-white border-transparent';
    label = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  } else if (normalized.includes('reject') || normalized === 'inactive') {
    styles = 'bg-[#EF4444] text-white border-transparent';
    label = normalized === 'inactive' ? 'Inactive' : 'Rejected';
  }

  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border", styles, className)}>
      {label}
    </span>
  );
}
