import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Box, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';
import { inventoryService } from '../../services/inventory';
import { formatDate } from '../../utils/helpers';
import { useAuthStore } from '../../store/authStore';

export default function MaterialHistory() {
  const { siteId, materialId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, IN, OUT

  const getRolePrefix = () => user ? `/${user.role}` : '';

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await inventoryService.getMaterialHistory(siteId, materialId);
        setData(response);
      } catch (error) {
        toast.error('Failed to load material history');
      } finally {
        setLoading(false);
      }
    };
    if (siteId && materialId) fetchHistory();
  }, [siteId, materialId]);

  if (loading) return <Loader size="lg" className="mt-20" />;

  if (!data) {
    return (
      <div className="p-6 text-center bg-white min-h-screen">
        <p className="text-[#6B7280]">Failed to load data.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-[#2563EB] hover:underline">Go Back</button>
      </div>
    );
  }

  // Duplicate block removed

  // Filter entries based on active tab
  const filteredHistory = data.history ? data.history.filter(item => {
  }) : [];

  return (
    <>

      {/* STICKY TOP SECTION */}
      <div className="sticky top-[56px] left-0 right-0 z-40 bg-white  border-b border-[#E5E7EB] overflow-x-hidden">
        <div className="max-w-[428px] mx-auto px-4 py-2 flex flex-col gap-1.5">
          {/* FULL-WIDTH STICKY HEADER – DO NOT REMOVE OR WRAP IN CONTAINER */}
          {/* Top Navigation */}
          <div className="flex items-center w-full mb-2">
            <button onClick={() => navigate(-1)} className="p-1 mr-2 rounded-full hover:bg-[#F3F4F6] transition-colors text-[#6B7280]">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-[18px] font-bold tracking-tight text-[#1F2937] capitalize">Material History</h1>
          </div>

          {/* Header Area */}
          <div className="mb-2 bg-white rounded-lg shadow-sm border border-slate-200 p-2 text-center">
            <h2 className="capitalize text-lg font-bold text-[#1F2937] mb-1">{data.materialName}</h2>
            <p className="text-xs text-[#6B7280] mb-2">{data.costCode}</p>
            <div className="py-2 bg-[#f8faff] rounded-md border border-transparent flex flex-col items-center justify-center">
              <div className="flex items-baseline justify-center">
                <span className="text-2xl font-bold text-[#2563EB]">{data.currentStock}</span>
                <span className="text-base font-bold text-[#1F2937] ml-1">{data.unit}</span>
              </div>
              <p className="text-xs font-medium text-[#6B7280] mt-1">remaining at site</p>
            </div>
          </div>

          {/* Summary Row */}
          <div className="mb-2">
            <div className="flex gap-2 w-full">
              <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 p-2.5 flex flex-col justify-center items-center">
                <span className="text-xl font-bold text-[#1F2937]">{data.estimatedQuantity || 0}</span>
                <span className="text-[10px] sm:text-xs font-semibold text-[#6B7280] uppercase text-center mt-1">Est. Qty</span>
              </div>
              <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 p-2.5 flex flex-col justify-center items-center">
                <span className="text-xl font-bold text-[#10B981]">{data.totalStockIn || 0}</span>
                <span className="text-[10px] sm:text-xs font-semibold text-[#6B7280] uppercase text-center mt-1">Stock In</span>
              </div>
              <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 p-2.5 flex flex-col justify-center items-center">
                <span className="text-xl font-bold text-[#EF4444]">{data.totalStockOut || 0}</span>
                <span className="text-[10px] sm:text-xs font-semibold text-[#6B7280] uppercase text-center mt-1">Stock Out</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 w-full">
            <button
              className={`flex-1 py-[6px] px-2 text-[11px] sm:text-xs font-bold rounded-md transition-colors whitespace-nowrap ${activeTab === 'ALL' ? 'bg-[#2563EB] text-white' : 'bg-[#F3F4F6] text-[#1F2937] hover:bg-[#F3F4F6]'}`}
              onClick={() => setActiveTab('ALL')}
            >
              ALL ENTRIES
            </button>
            <button
              className={`flex-1 py-[6px] px-2 text-[11px] sm:text-xs font-bold rounded-md transition-colors whitespace-nowrap ${activeTab === 'IN' ? 'bg-[#2563EB] text-white' : 'bg-[#F3F4F6] text-[#1F2937] hover:bg-[#F3F4F6]'}`}
              onClick={() => setActiveTab('IN')}
            >
              STOCK IN
            </button>
            <button
              className={`flex-1 py-[6px] px-2 text-[11px] sm:text-xs font-bold rounded-md transition-colors whitespace-nowrap ${activeTab === 'OUT' ? 'bg-[#2563EB] text-white' : 'bg-[#F3F4F6] text-[#1F2937] hover:bg-[#F3F4F6]'}`}
              onClick={() => setActiveTab('OUT')}
            >
              STOCK OUT
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col min-h-screen space-y-4 max-w-[428px] mx-auto px-4 pb-24 pt-4">

        {/* Entries List */}
        <div className="space-y-2 pb-6">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((item, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-slate-200 p-2 flex flex-col active:scale-[0.99] transition-transform cursor-default">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-bold text-[#1F2937]">{formatDate(item.date)}</span>
                  <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${item.type === 'Received' ? 'bg-green-50 text-[#10B981]' : 'bg-red-50 text-[#EF4444]'}`}>
                    {item.type}
                  </span>
                </div>

                {item.party && (
                  <p className="text-sm font-medium text-[#6B7280] mb-2">Party: {item.party}</p>
                )}

                <div className="flex justify-between items-end mt-1">
                  <div className={`text-2xl font-bold ${item.type === 'Received' ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                    {item.type === 'Received' ? '+' : '-'} {item.quantity} <span className="text-sm font-semibold">{item.unit}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 font-medium">Running Bal.</p>
                    <p className="text-sm font-bold text-[#1F2937]">{item.runningBalance} {item.unit}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 bg-[#f8faff] rounded-lg border border-dashed border-[#E5E7EB]">
              <p className="text-sm font-medium text-[#6B7280]">No entries found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Action Buttons */}
      <div className="fixed bottom-[64px] left-0 right-0 mx-auto max-w-[428px] bg-white border-t border-[#E5E7EB] p-2 z-40 shadow-sm flex gap-2">
        <button
          className="flex-1 bg-blue-50 text-[#2563EB] border border-blue-200 hover:bg-blue-100 font-bold py-[8px] px-[12px] rounded-md transition-colors flex justify-center items-center text-[12px] sm:text-[14px] whitespace-nowrap"
          onClick={() => navigate(`${getRolePrefix()}/inventory/received/create`, { state: { siteId, preselectedMaterial: { _id: materialId, name: data.materialName, unit: data.unit } } })}
        >
          + RECEIVED
        </button>

        {(user?.role === 'owner' || user?.role === 'manager') && (
          <button
            className="w-[40px] h-[40px] rounded-full bg-[#2563EB] flex items-center justify-center text-white shadow-sm hover:bg-[#2563EB] transition-colors shrink-0"
            onClick={() => navigate(`${getRolePrefix()}/create-order`, { state: { siteId, preselectedMaterial: { _id: materialId, name: data.materialName, unit: data.unit } } })}
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        )}

        <button
          className="flex-1 bg-red-50 text-[#EF4444] border border-red-200 hover:bg-red-100 font-bold py-[8px] px-[12px] rounded-md transition-colors flex justify-center items-center text-[12px] sm:text-[14px] whitespace-nowrap"
          onClick={() => navigate(`${getRolePrefix()}/inventory/used/create`, { state: { siteId, preselectedMaterial: { _id: materialId, name: data.materialName, unit: data.unit } } })}
        >
          - USED
        </button>
      </div>
    </>

  );
}
