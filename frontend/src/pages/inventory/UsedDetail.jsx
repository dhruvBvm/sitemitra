import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader, Calendar, AlignLeft } from 'lucide-react';
import { inventoryService } from '../../services/inventory';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/helpers';

export default function UsedDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await inventoryService.getUsedEntryById(id);
        setEntry(data);
      } catch (error) {
        toast.error('Failed to load used entry details');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen space-y-4 max-w-3xl mx-auto p-4 pb-20">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate(-1)} className="flex items-center justify-center w-[44px] h-[44px] bg-blue-50 text-[#2563EB] rounded-full hover:bg-blue-100 transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#1F2937]">Used Details</h1>
            <p className="text-sm text-[#6B7280]">Loading...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4 mt-4">
          <div className="h-32 bg-[#F3F4F6] rounded-[20px]"></div>
          <div className="h-48 bg-[#F3F4F6] rounded-[20px]"></div>
          <div className="h-20 bg-[#F3F4F6] rounded-[20px]"></div>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="flex flex-col min-h-screen space-y-4 max-w-3xl mx-auto p-4">
        <div className="flex items-center mb-4">
          <button onClick={() => navigate(-1)} className="flex items-center justify-center w-[44px] h-[44px] bg-blue-50 text-[#2563EB] rounded-full hover:bg-blue-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="text-center py-20 text-[#6B7280]">Entry not found.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen space-y-4 max-w-3xl mx-auto p-4 overflow-y-auto pb-20">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate(-1)} className="flex items-center justify-center w-[44px] h-[44px] bg-blue-50 text-[#2563EB] rounded-full hover:bg-blue-100 transition-colors shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Consumption Details</h1>
          <p className="text-sm text-[#6B7280]">{entry.entryNo}</p>
        </div>
      </div>

      <div className="bg-white rounded-[20px] shadow-sm border border-transparent p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date</p>
            <p className="text-sm font-semibold text-[#1F2937] flex items-center gap-1">
              <Calendar className="w-4 h-4 text-slate-400" /> {formatDate(entry.date || entry.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Site</p>
            <p className="text-sm font-semibold text-[#1F2937] flex items-center gap-1">
              {entry.siteId?.siteName || '-'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[20px] shadow-sm border border-transparent p-5">
        <h2 className="text-sm font-bold text-[#1F2937] uppercase tracking-wider mb-4">Notes</h2>
        {entry.notes || entry.userNotes ? (
          <div className="space-y-3">
            {(entry.userNotes || entry.notes) && (
              <div>
                <p className="text-sm text-[#1F2937] bg-[#f8faff] p-3 rounded-[16px] flex items-start gap-2 border border-transparent">
                  <AlignLeft className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <span>{entry.notes || entry.userNotes}</span>
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-[#6B7280] italic bg-[#f8faff] p-4 rounded-[16px] border border-transparent text-center">No notes provided</p>
        )}
      </div>

      <div className="bg-white rounded-[20px] shadow-sm border border-transparent p-5">
        <h2 className="text-sm font-bold text-[#1F2937] uppercase tracking-wider mb-4">Materials Used</h2>
        <div className="space-y-4">
          {entry.materials?.map((mat, i) => (
            <div key={i} className="flex flex-col p-4 bg-[#f8faff] rounded-[16px] border border-transparent">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-[#1F2937]">{mat.materialName || mat.name}</span>
                <span className="text-sm font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded">{mat.quantity || mat.qty} <span className="text-xs text-[#2563EB] font-medium">{mat.unit}</span></span>
              </div>
              
              <div className="mt-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Images</span>
                {mat.imageUrls && mat.imageUrls.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {mat.imageUrls.map((img, idx) => (
                      <a key={idx} href={img} target="_blank" rel="noreferrer" className="w-16 h-16 rounded border border-transparent overflow-hidden hover:scale-105 transition-transform block">
                        <img src={img} alt="material" className="w-full h-full object-cover" />
                      </a>
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
        <div className="bg-white rounded-[20px] shadow-sm border border-transparent p-5">
          <h2 className="text-sm font-bold text-[#1F2937] uppercase tracking-wider mb-4">Attached Documents</h2>
          <div className="flex flex-wrap gap-3">
            {entry.imageUrls.map((img, idx) => (
              <a key={idx} href={img} target="_blank" rel="noreferrer" className="w-20 h-20 rounded-[16px] border border-transparent overflow-hidden hover:scale-105 transition-transform block">
                <img src={img} alt="attachment" className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
