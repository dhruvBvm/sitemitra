import React from 'react';
import { Check, X, Truck } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

/**
 * NotesTimeline renders the approval history timeline for an order.
 * @param {{ history: Array<{ action: string, comment?: string, timestamp: string|Date, by?: { name?: string, role?: string } }> }} props
 */
export default function NotesTimeline({ history }) {
  if (!history || history.length === 0) return null;

  return (
    <div className="space-y-3">
      {history.map((h, idx) => {
        const isApprove = h.action.includes('approve') || h.action === 'approved' || h.action === 'closed';
        const isReject = h.action.includes('reject');
        const isDeliver = h.action.includes('deliver');
        let Icon = Check;
        let iconClass = 'bg-green-100 text-[#10B981]';
        if (isReject) {
          Icon = X;
          iconClass = 'bg-red-100 text-[#EF4444]';
        } else if (isDeliver) {
          Icon = Truck;
          iconClass = 'bg-blue-100 text-[#2563EB]';
        }
        return (
          <div key={idx} className="flex space-x-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
            <div className={`mt-0.5 p-1.5 rounded-full h-fit flex-shrink-0 ${iconClass}`}> 
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#1F2937] capitalize">
                {h.action.replace(/_/g, ' ')}
              </p>
              <p className="text-xs text-[#6B7280] mt-0.5">
                By {h.by?.name || 'System'}{h.by?.role ? ` (${h.by.role})` : ''} • {formatDate(h.timestamp)}
              </p>
              {h.comment && (
                <p className="text-sm text-[#6B7280] mt-2 bg-[#f8faff] p-2 rounded border border-transparent">
                  {h.comment}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
