import { useState, useEffect } from 'react';
import ImageCarouselModal from '../../components/common/ImageCarouselModal';
import { useParams, useNavigate } from 'react-router-dom';
import { staffService } from '../../services/staff';
import StatusBadge from '../../components/common/StatusBadge';
import { ArrowLeft, Loader, Calendar, User, AlignLeft, Check, X } from 'lucide-react';
import { formatDate } from '../../utils/helpers';
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
      <div className="w-full max-w-[428px] mx-auto  bg-[#f8faff] relative pb-24">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="flex items-center justify-center w-[44px] h-[44px] bg-blue-50 text-[#2563EB] rounded-full hover:bg-blue-100 transition-colors shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#1F2937]">Request Details</h1>
              <p className="text-sm text-[#6B7280]">Loading...</p>
            </div>
          </div>
        </div>
        <div className="animate-pulse space-y-4 mt-4">
          <div className="h-32 bg-[#F3F4F6] rounded-md"></div>
          <div className="h-48 bg-[#F3F4F6] rounded-md"></div>
          <div className="h-20 bg-[#F3F4F6] rounded-md"></div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="w-full max-w-[428px] mx-auto  bg-[#f8faff] relative pb-24">
        <div className="flex items-center mb-4">
          <button onClick={() => navigate(-1)} className="flex items-center justify-center w-[44px] h-[44px] bg-blue-50 text-[#2563EB] rounded-full hover:bg-blue-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="text-center py-20 text-[#6B7280]">Request not found.</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[428px] mx-auto  bg-[#f8faff] relative pb-24 font-sans min-h-[100dvh]">
      {/* Sticky Header */}
      <div className="sticky top-0 left-0 right-0 mx-auto max-w-[428px] z-40 bg-white border-b border-[#E5E7EB] overflow-x-hidden">
        <div className="max-w-[428px] mx-auto px-4 py-2 flex flex-col gap-1.5 justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-1.5 bg-[#f8faff] text-[#6B7280] rounded-full hover:bg-[#F3F4F6] transition-colors shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-[1.1rem] font-bold tracking-tight text-[#1F2937]">Request Details</h1>
              <p className="text-[13px] text-[#6B7280]">{request.requestNo || request.orderNo}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[428px] mx-auto px-4 space-y-4 pt-4">

        {/* Basic Info Card */}
        <div className="bg-white rounded-md shadow-sm border border-transparent p-5 space-y-4">
          <div className="flex justify-between items-start">
            <StatusBadge status={request.status} />
            {request.priority && (
              <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${request.priority.toLowerCase() === 'high' ? 'bg-red-100 text-[#EF4444]' :
                request.priority.toLowerCase() === 'medium' ? 'bg-orange-100 text-orange-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                {request.priority} Priority
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <div>
              <p className="text-xs font-bold text-[#1F2937] uppercase tracking-wider mb-1">Date</p>
              <p className="text-sm font-semibold text-[#1F2937] flex items-center gap-1">
                <Calendar className="w-4 h-4 text-slate-400" /> {formatDate(request.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-[#1F2937] uppercase tracking-wider mb-1">Site</p>
              <p className="text-sm font-semibold text-[#1F2937] flex items-center gap-1">
                {request.siteId?.siteName || '-'}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-[#1F2937] uppercase tracking-wider mb-1">Created By</p>
              <p className="text-sm font-semibold text-[#1F2937] flex items-center gap-1">
                {request.createdBy?.name || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-md shadow-sm border border-transparent p-5">
          <h2 className="text-sm font-bold text-green-800 uppercase tracking-wider mb-4">Notes</h2>
          {request.userNotes || request.notes ? (
            <div className="space-y-2">
              {request.userNotes && (
                <div>
                  <p className="text-xs font-bold text-[#1F2937] uppercase tracking-wider mb-1">Creator Notes</p>
                  <p className="text-sm text-[#1F2937] bg-[#f8faff] p-2 rounded-md flex items-start gap-2 border border-transparent">
                    <AlignLeft className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <span>{request.userNotes}</span>
                  </p>
                </div>
              )}
              {request.notes && (
                <div>
                  <p className="text-xs font-bold text-[#1F2937] uppercase tracking-wider mb-1">Additional Notes</p>
                  <p className="text-sm text-[#1F2937] bg-[#f8faff] p-2 rounded-md flex items-start gap-2 border border-transparent">
                    <AlignLeft className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <span>{request.notes}</span>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-[#6B7280] italic bg-[#f8faff] p-2 rounded-md border border-transparent text-center">No notes provided</p>
          )}
        </div>

        {/* Materials List */}
        <div className="bg-white rounded-md shadow-sm border border-transparent p-5">
          <h2 className="text-sm font-bold text-green-800 uppercase tracking-wider mb-4">Materials Requested</h2>
          <div className="space-y-4">
            {request.materials?.map((mat, i) => (
              <div key={i} className="flex flex-col p-3 rounded-lg border border-slate-100 bg-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="capitalize text-lg font-bold text-[#1F2937]">{mat.materialName || mat.name}</span>
                  <span className="text-sm font-bold text-white bg-green-700 px-2 py-0.5 rounded">{mat.quantity || mat.qty} <span className="text-xs text-green-100 font-medium">{mat.unit}</span></span>
                </div>

                <div className="mt-2">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Images</span>
                  {mat.imageUrls && mat.imageUrls.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {mat.imageUrls.map((img, idx) => (
                        <div key={idx} className="w-16 h-16 rounded border border-transparent overflow-hidden hover:scale-105 transition-transform block">
                          <img src={img} alt="material" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No images</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Documents */}
        {request.imageUrls && request.imageUrls.length > 0 && (
          <div className="bg-white rounded-md shadow-sm border border-transparent p-5">
            <h2 className="text-sm font-bold text-green-800 uppercase tracking-wider mb-4">Order Documents</h2>
            <div className="flex flex-wrap gap-2">
              {request.imageUrls.map((img, idx) => (
                <div key={idx} className="w-20 h-20 rounded-md border border-transparent overflow-hidden hover:scale-105 transition-transform block">
                  <img src={img} alt="attachment" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approval History */}
        <div className="bg-white rounded-md shadow-sm border border-transparent p-5">
          <h2 className="text-sm font-bold text-green-800 uppercase tracking-wider mb-4">Approval History</h2>
          {request.approvalHistory && request.approvalHistory.length > 0 ? (
            <div className="space-y-0">
              {request.approvalHistory.map((h, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex flex-col items-center mt-1.5 self-stretch">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#2563EB] ring-4 ring-blue-50 shrink-0"></div>
                    {i !== request.approvalHistory.length - 1 && <div className="w-px h-full bg-[#F3F4F6] mt-1.5 min-h-[20px]"></div>}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="bg-[#f8faff] border border-transparent rounded-md p-2 w-full">
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-bold text-[#1F2937] text-sm capitalize">{h.action?.replace(/_/g, ' ')}</div>
                        <time className="text-xs font-medium text-[#6B7280] shrink-0 ml-2">{formatDate(h.timestamp || h.date)}</time>
                      </div>
                      {h.comment && <div className="text-sm text-[#6B7280] my-1.5">{h.comment}</div>}
                      <div className="text-xs font-medium text-[#6B7280]">- {h.by?.name || h.author || 'System'} {h.by?.role && `(${h.by.role})`}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#6B7280] italic bg-[#f8faff] p-2 rounded-md border border-transparent text-center">Pending approvals</p>
          )}
        </div>

      </div>
    
      <ImageCarouselModal
        isOpen={carouselModal.isOpen}
        onClose={() => setCarouselModal({ isOpen: false, images: [], index: 0 })}
        images={carouselModal.images}
        initialIndex={carouselModal.index}
      />
</div>
  );
}
