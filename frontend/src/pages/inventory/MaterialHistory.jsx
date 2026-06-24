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
      <div className="p-6 text-center bg-white ">
        <p className="text-[#6B7280]">Failed to load data.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-[#2563EB] hover:underline">Go Back</button>
      </div>
    );
  }

  // Duplicate block removed

  // Filter entries based on active tab
  const filteredHistory = data.history ? data.history.filter(item => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'IN') return item.type === 'Received';
    if (activeTab === 'OUT') return item.type === 'Used';
    return true;
  }) : [];

  return (
    <>

      {/* STICKY TOP SECTION */}
      <div className="sticky top-0 left-0 right-0 z-40 bg-white  border-b border-[#E5E7EB] overflow-x-hidden">
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
            <div className="capitalize text-xl font-bold text-[#1F2937] mb-1">{data.materialName}</div>
            <p className="text-xs text-[#6B7280] mb-2">{data.costCode}</p>
            <div className="flex gap-2 w-full mt-2">
              <div className="flex-[1.2] py-2 px-1 bg-[#F3F4F6] rounded-md border border-slate-100 flex flex-col items-center justify-center">
                <div className="flex items-baseline justify-center">
                  <span className="text-[20px] font-bold text-[#2563EB]">{data.currentStock}</span>
                  <span className="text-[11px] font-bold text-[#1F2937] ml-1">{data.unit}</span>
                </div>
                <p className="text-[10px] font-medium text-[#6B7280] mt-1 text-center">remaining at site</p>
              </div>
              <div className="flex-[2] flex gap-2">
                <div className="flex-1 bg-[#F3F4F6] rounded-md p-2 flex flex-col justify-center items-center border border-slate-100">
                  <span className="text-[16px] font-bold text-[#10B981]">{data.totalStockIn || 0}</span>
                  <span className="text-[10px] font-semibold text-[#6B7280] uppercase text-center mt-1">Stock In</span>
                </div>
                <div className="flex-1 bg-[#F3F4F6] rounded-md p-2 flex flex-col justify-center items-center border border-slate-100">
                  <span className="text-[16px] font-bold text-[#EF4444]">{data.totalStockOut || 0}</span>
                  <span className="text-[10px] font-semibold text-[#6B7280] uppercase text-center mt-1">Stock Out</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 w-full">
            <button
              className={`flex-1 py-[6px] px-2 font-bold rounded-md transition-colors whitespace-nowrap flex items-center justify-center ${activeTab === 'ALL' ? 'bg-[#2563EB] text-white' : 'bg-[#F3F4F6] text-[#1F2937] hover:bg-[#F3F4F6]'}`}
              onClick={() => setActiveTab('ALL')}
            >
              <span className="text-[11px]">ALL ENTRIES</span>
            </button>
            <button
              className={`flex-1 py-[6px] px-2 font-bold rounded-md transition-colors whitespace-nowrap flex items-center justify-center ${activeTab === 'IN' ? 'bg-[#2563EB] text-white' : 'bg-[#F3F4F6] text-[#1F2937] hover:bg-[#F3F4F6]'}`}
              onClick={() => setActiveTab('IN')}
            >
              <span className="text-[11px]">STOCK IN</span>
            </button>
            <button
              className={`flex-1 py-[6px] px-2 font-bold rounded-md transition-colors whitespace-nowrap flex items-center justify-center ${activeTab === 'OUT' ? 'bg-[#2563EB] text-white' : 'bg-[#F3F4F6] text-[#1F2937] hover:bg-[#F3F4F6]'}`}
              onClick={() => setActiveTab('OUT')}
            >
              <span className="text-[11px]">STOCK OUT</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col  space-y-4 max-w-[428px] mx-auto px-4 pb-24 pt-4">

        {/* Entries List */}
        <div className="space-y-2 pb-6">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((item, index) => (
              <div 
                key={index} 
                className="bg-white rounded-lg shadow-sm border border-slate-200 p-2.5 flex flex-col justify-center active:scale-[0.99] transition-transform cursor-pointer"
                onClick={() => {
                  if (item.type === 'Received') {
                    navigate(`/received/${item.entryId}`);
                  } else if (item.type === 'Used') {
                    navigate(`/used/${item.entryId}`);
                  }
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  {/* Left: Date and Party */}
                  <div className="flex flex-col justify-center min-w-[100px]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#1F2937]">{formatDate(item.date)}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded text-white ${item.type === 'Received' ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`}>
                        {item.type}
                      </span>
                    </div>
                    {item.party && <p className="text-xs font-medium text-[#6B7280] mt-0.5 truncate max-w-[130px]">{item.party}</p>}
                  </div>

                  {/* Right: Quantity and Balance */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className={`text-base font-bold whitespace-nowrap ${item.type === 'Received' ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                      {item.type === 'Received' ? '+' : '-'} {item.quantity} <span className="text-[10px] font-medium">{item.unit}</span>
                    </div>
                    <div className="w-px h-8 bg-slate-200"></div>
                    <div className="text-right flex flex-col justify-center min-w-[55px]">
                      <p className="text-[9px] text-slate-400 font-medium leading-tight uppercase">Run. Bal</p>
                      <p className="text-sm font-bold text-[#1F2937] leading-tight whitespace-nowrap">{item.runningBalance} <span className="text-[10px] font-medium text-[#6B7280]">{item.unit}</span></p>
                    </div>
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
      <div className="fixed bottom-[56px] left-0 right-0 z-40 flex justify-center pointer-events-none">
        <div className="w-full bg-white border-t border-[#E5E7EB] p-2 pointer-events-auto flex gap-2" style={{ maxWidth: '428px' }}>
          {(user?.role === 'owner' || user?.role === 'manager') && (
            <button
              className="flex-1 bg-[#10B981] text-white font-bold py-3 px-1 rounded-md hover:bg-emerald-600 transition-colors flex justify-center items-center whitespace-nowrap border border-[#10B981]"
              onClick={() => navigate(`${getRolePrefix()}/create-order`, { state: { siteId, preselectedMaterial: { _id: materialId, name: data.materialName, unit: data.unit } } })}
            >
              <span className="text-[12px] tracking-wider">REQUEST</span>
            </button>
          )}
          <button
            className="flex-1 bg-[#2563EB] text-white font-bold py-3 px-1 rounded-md hover:bg-blue-700 transition-colors flex justify-center items-center whitespace-nowrap"
            onClick={() => navigate(`${getRolePrefix()}/inventory/received/create`, { state: { siteId, preselectedMaterial: { _id: materialId, name: data.materialName, unit: data.unit } } })}
          >
            <span className="text-[12px] tracking-wider">RECEIVED</span>
          </button>
          <button
            className="flex-1 bg-[#EF4444] text-white font-bold py-3 px-1 rounded-md hover:bg-red-700 transition-colors flex justify-center items-center whitespace-nowrap"
            onClick={() => navigate(`${getRolePrefix()}/inventory/used/create`, { state: { siteId, preselectedMaterial: { _id: materialId, name: data.materialName, unit: data.unit } } })}
          >
            <span className="text-[12px] tracking-wider">USED</span>
          </button>
        </div>
      </div>
    </>

  );
}
