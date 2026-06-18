import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { staffService } from '../../services/staff';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import { Card, CardContent } from '../../components/common/Card';
import { ArrowLeft, Check, X, Truck } from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

export default function StaffRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const data = await staffService.getRequestById(id);
        setRequest(data);
      } catch (error) {
        toast.error('Failed to load request details');
        navigate('/staff/requests');
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f8faff] font-sans max-w-[428px] mx-auto relative pb-24">
        {/* Fixed Header */}
        <div className="fixed top-14 left-1/2 -translate-x-1/2 w-full max-w-[428px] z-40 bg-white border-b border-[#E5E7EB] shadow-sm px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 bg-[#F3F4F6] text-[#6B7280] rounded-full hover:bg-[#F3F4F6] transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-[1.1rem] font-bold tracking-tight text-[#1F2937]">Request Detail</h1>
          </div>
        </div>

        <div className="px-4 py-6 space-y-5 pt-[72px] animate-pulse">
          <div className="h-32 bg-[#F3F4F6] rounded-[20px]"></div>
          <div className="h-48 bg-[#F3F4F6] rounded-[20px]"></div>
          <div className="h-20 bg-[#F3F4F6] rounded-[20px]"></div>
        </div>
      </div>
    );
  }
  if (!request) return null;

  return (
    <div className="flex flex-col min-h-screen bg-[#f8faff] font-sans max-w-[428px] mx-auto relative pb-24">
      {/* Fixed Header */}
      <div className="fixed top-14 left-1/2 -translate-x-1/2 w-full max-w-[428px] z-40 bg-white border-b border-[#E5E7EB] shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 bg-[#F3F4F6] text-[#6B7280] rounded-full hover:bg-[#F3F4F6] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[1.1rem] font-bold tracking-tight text-[#1F2937]">Request Detail</h1>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <div className="px-4 py-6 space-y-5 pt-[72px]">
        {/* Basic Info Card */}
        <div className="bg-white rounded-[20px] shadow-sm border border-transparent p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Request No.</p>
              <p className="text-sm font-semibold text-[#1F2937]">{request.requestNo || request.orderNo}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date</p>
              <p className="text-sm font-semibold text-[#1F2937]">{formatDate(request.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Site</p>
              <p className="text-sm font-semibold text-[#1F2937]">{request.siteId?.siteName || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Priority</p>
              <p className={`text-sm font-bold capitalize ${request.priority === 'high' ? 'text-red-500' : 'text-[#1F2937]'}`}>
                {request.priority || 'Medium'}
              </p>
            </div>
          </div>
        </div>

        {/* Materials List */}
        <div>
          <h2 className="text-sm font-bold text-[#1F2937] mb-3 uppercase tracking-wider">Materials Requested</h2>
          <div className="flex flex-col space-y-3">
            {request.materials?.length > 0 ? request.materials.map((item, idx) => (
              <Card key={idx} className="overflow-hidden">
                <CardContent className="p-3 flex flex-col space-y-2 bg-white">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="font-bold text-[#1F2937]">{item.materialName || item.name}</span>
                    <span className="bg-blue-50 text-[#2563EB] px-2 py-0.5 rounded text-xs font-semibold">
                      {item.quantity || item.qty} {item.unit}
                    </span>
                  </div>
                  {item.imageUrls && item.imageUrls.length > 0 && (
                    <div className="pt-1">
                      <span className="text-xs text-[#6B7280] block mb-1">Images</span>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {item.imageUrls.map((img, i) => (
                          <a key={i} href={img} target="_blank" rel="noreferrer" className="w-10 h-10 shrink-0 rounded border border-transparent overflow-hidden inline-block hover:scale-105 transition-transform">
                            <img src={img} alt="mat preview" className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )) : (
              <div className="text-sm text-[#6B7280] italic text-center py-4 bg-[#f8faff] rounded-[16px] border border-dashed border-[#E5E7EB]">
                No materials specified
              </div>
            )}
          </div>
        </div>

        {/* Order Images Gallery */}
        {request.imageUrls && request.imageUrls.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-[#1F2937] mb-3 uppercase tracking-wider">Order Images</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
              {request.imageUrls.map((url, idx) => (
                <a key={idx} href={url} target="_blank" rel="noreferrer" className="shrink-0 snap-start w-24 h-24 rounded-[20px] border border-transparent overflow-hidden shadow-sm">
                  <img src={url} alt="Order Image" className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {(request.userNotes || request.notes) && (
          <div>
            <h2 className="text-sm font-bold text-[#1F2937] mb-3 uppercase tracking-wider">Notes</h2>
            <div className="bg-amber-50/50 p-4 rounded-[20px] border border-amber-100">
              <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">
                {request.userNotes || request.notes}
              </p>
            </div>
          </div>
        )}

        {/* Approval History */}
        {request.approvalHistory?.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-[#1F2937] mb-3 uppercase tracking-wider">Timeline</h2>
            <div className="space-y-4">
              {request.approvalHistory.map((h, idx) => {
                const isApprove = h.action.includes('approve') || h.action === 'closed';
                const isReject = h.action.includes('reject');
                const isDeliver = h.action.includes('deliver');
                
                let Icon = Check;
                let iconClass = "bg-green-100 text-[#10B981] border-green-200";
                
                if (isReject) { 
                  Icon = X; 
                  iconClass = "bg-red-100 text-[#EF4444] border-red-200"; 
                } else if (isDeliver) { 
                  Icon = Truck; 
                  iconClass = "bg-blue-100 text-[#2563EB] border-blue-200"; 
                }

                return (
                  <div key={idx} className="relative flex gap-4 pl-2">
                    {/* Vertical line connecting timeline items */}
                    {idx !== request.approvalHistory.length - 1 && (
                      <div className="absolute left-[1.35rem] top-8 bottom-[-1rem] w-0.5 bg-[#F3F4F6] z-0"></div>
                    )}
                    
                    <div className={`relative z-10 w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${iconClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1 bg-white p-3 rounded-[20px] border border-transparent shadow-sm">
                      <p className="text-sm font-bold text-[#1F2937] capitalize mb-0.5">
                        {h.action.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-[#6B7280] font-medium">
                        {h.by?.name || "System"} {h.by?.role ? `(${h.by.role})` : ''} • {formatDate(h.timestamp)}
                      </p>
                      {h.comment && (
                        <div className="mt-2 text-sm text-[#6B7280] bg-[#f8faff] p-2.5 rounded-[16px] border border-transparent">
                          {h.comment}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
