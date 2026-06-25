import React, { useState, useEffect } from 'react';
import ImageCarouselModal from '../../components/common/ImageCarouselModal';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader, Calendar, AlignLeft, Truck } from 'lucide-react';
import { inventoryService } from '../../services/inventory';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/helpers';
import StatusBadge from '../../components/common/StatusBadge';

export default function ReceivedDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await inventoryService.getReceivedEntryById(id);
        setEntry(data);
      } catch (error) {
        toast.error('Failed to load received entry details');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetails();
  }, [id]);

  if (loading) {
    return (
    <>
      <div className="sticky top-0 left-0 right-0 mx-auto max-w-[428px] z-40 bg-white border-b border-[#E5E7EB] overflow-x-hidden">
        <div className="max-w-[428px] mx-auto px-4 py-2 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-1.5 bg-[#f8faff] text-[#6B7280] rounded-full hover:bg-[#F3F4F6] transition-colors shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-[1.1rem] font-bold tracking-tight text-[#1F2937]">Received Details</h1>
              <p className="text-[13px] text-[#6B7280]">Loading...</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col  space-y-4 max-w-[428px] mx-auto px-4 pb-24 pt-4 animate-pulse">
        <div className="h-32 bg-[#F3F4F6] rounded-lg"></div>
        <div className="h-48 bg-[#F3F4F6] rounded-lg"></div>
        <div className="h-20 bg-[#F3F4F6] rounded-lg"></div>
      </div>
    </>
    );
  }

  if (!entry) {
    return (
    <>
      <div className="sticky top-0 left-0 right-0 mx-auto max-w-[428px] z-40 bg-white border-b border-[#E5E7EB] overflow-x-hidden">
        <div className="max-w-[428px] mx-auto px-4 py-2 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-1.5 bg-[#f8faff] text-[#6B7280] rounded-full hover:bg-[#F3F4F6] transition-colors shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-[1.1rem] font-bold tracking-tight text-[#1F2937]">Received Details</h1>
              <p className="text-[13px] text-[#6B7280]">Not Found</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col  space-y-4 max-w-[428px] mx-auto px-4 pb-24 pt-4">
        <div className="text-center py-20 text-[#6B7280]">Entry not found.</div>
      </div>
    </>
    );
  }

  return (
    <>
      {/* Sticky Header */}
      <div className="sticky top-0 left-0 right-0 mx-auto max-w-[428px] z-40 bg-white border-b border-[#E5E7EB] overflow-x-hidden">
        <div className="max-w-[428px] mx-auto px-4 py-2 flex flex-col gap-1.5 justify-between">
          {/* FULL-WIDTH STICKY HEADER – DO NOT REMOVE OR WRAP IN CONTAINER */}
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-1.5 bg-[#f8faff] text-[#6B7280] rounded-full hover:bg-[#F3F4F6] transition-colors shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-[1.1rem] font-bold tracking-tight text-[#1F2937]">Received Details</h1>
              <p className="text-[13px] text-[#6B7280]">{entry.entryNo}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col  space-y-4 max-w-[428px] mx-auto px-4 pb-24 pt-4">

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs font-bold text-[#1F2937] uppercase tracking-wider mb-1">Date</p>
            <p className="text-sm font-semibold text-[#1F2937] flex items-center gap-1">
              <Calendar className="w-4 h-4 text-slate-400" /> {formatDate(entry.date || entry.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-[#1F2937] uppercase tracking-wider mb-1">Site</p>
            <p className="text-sm font-semibold text-[#1F2937] flex items-center gap-1">
              {entry.siteId?.siteName || '-'}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-[#1F2937] uppercase tracking-wider mb-1">Supplier</p>
            <p className="text-sm font-semibold text-[#1F2937] flex items-center gap-1">
              {entry.supplierName || '-'}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-[#1F2937] uppercase tracking-wider mb-1">Challan No</p>
            <p className="text-sm font-semibold text-[#1F2937] flex items-center gap-1">
              {entry.challanNo || '-'}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-[#1F2937] uppercase tracking-wider mb-1">Vehicle No</p>
            <p className="text-sm font-semibold text-[#1F2937] flex items-center gap-1">
              <Truck className="w-4 h-4 text-slate-400" /> {entry.vehicleNo || '-'}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-[#1F2937] uppercase tracking-wider mb-1">Created By</p>
            <p className="text-sm font-semibold text-[#1F2937] flex items-center gap-1">
              {entry.createdBy?.name || '-'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
        <h2 className="text-sm font-bold text-green-800 uppercase tracking-wider mb-4">Notes</h2>
        {entry.notes || entry.userNotes ? (
          <div className="space-y-2">
            {(entry.userNotes || entry.notes) && (
              <div>
                <p className="text-sm text-[#1F2937] bg-[#f8faff] p-2 rounded-lg flex items-start gap-2 border border-slate-100">
                  <AlignLeft className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <span>{entry.notes || entry.userNotes}</span>
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-[#6B7280] italic bg-[#f8faff] p-2 rounded-lg border border-slate-100 text-center">No notes provided</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
        <h2 className="text-sm font-bold text-green-800 uppercase tracking-wider mb-4">Materials Received</h2>
        <div className="space-y-4">
          {entry.materials?.map((mat, i) => (
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

      {entry.imageUrls && entry.imageUrls.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
          <h2 className="text-sm font-bold text-green-800 uppercase tracking-wider mb-4">Entry Documents</h2>
          <div className="flex flex-wrap gap-2">
            {entry.imageUrls.map((img, idx) => (
              <div key={idx} className="w-20 h-20 rounded-md border border-transparent overflow-hidden hover:scale-105 transition-transform block">
                <img src={img} alt="attachment" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    
      <ImageCarouselModal
        isOpen={carouselModal.isOpen}
        onClose={() => setCarouselModal({ isOpen: false, images: [], index: 0 })}
        images={carouselModal.images}
        initialIndex={carouselModal.index}
      />
</>
  );
}
