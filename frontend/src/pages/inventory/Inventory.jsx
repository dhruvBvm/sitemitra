import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Minus, Search, ArrowLeft } from 'lucide-react';
import { inventoryService } from '../../services/inventory';
import { ownerService } from '../../services/owner';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export default function Inventory() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [siteDetails, setSiteDetails] = useState(null);
  const [materialsMaster, setMaterialsMaster] = useState([]);
  const [inventoryMap, setInventoryMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [adjustModal, setAdjustModal] = useState({ isOpen: false, type: '', material: null, quantity: '' });
  const [isAdjusting, setIsAdjusting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const masterData = await ownerService.getMaterials({ limit: 1000 });
      const allMaterials = masterData.materials || masterData;
      setMaterialsMaster(allMaterials);

      const invData = await inventoryService.getSiteInventory(siteId);
      
      setSiteDetails({
        siteName: invData?.siteId?.siteName || invData?.siteName || 'Unknown Site',
        siteCode: invData?.siteId?.siteCode || invData?.siteCode || 'N/A'
      });

      const invMap = {};
      if (invData?.items) {
        invData.items.forEach(item => {
          invMap[item.materialId._id || item.materialId] = {
            quantity: item.quantity,
            minStockLevel: item.minStockLevel || 10
          };
        });
      }
      setInventoryMap(invMap);
    } catch (error) {
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (siteId) fetchData();
  }, [siteId]);

  const groupedMaterials = useMemo(() => {
    const groups = {
      'Home': [],
      'Electrical': [],
      'Water': [],
      'Indirect': [],
      'Other': []
    };

    materialsMaster.forEach(mat => {
      const q = searchQuery.toLowerCase();
      const name = (mat.materialName || mat.name || '').toLowerCase();
      if (q && !name.includes(q)) return;

      let cat = 'Home';
      if (mat.category) {
        const c = mat.category.toUpperCase();
        if (c.includes('CIVIL')) cat = 'Home';
        else if (c.includes('ELEC')) cat = 'Electrical';
        else if (c.includes('PLUMB')) cat = 'Water';
        else if (c.includes('INDIRECT')) cat = 'Indirect';
        else cat = 'Other';
      } else {
        const uName = name.toUpperCase();
        if (uName.match(/(WIRE|CABLE|SWITCH|SOCKET|BULB|LIGHT|CONDUIT|MCB)/)) cat = 'Electrical';
        else if (uName.match(/(PIPE|VALVE|TAP|FITTING|PVC|CPVC|TANK|ALUMINUM)/)) cat = 'Water';
        else if (uName.match(/(DIESEL|LABOR|LABOUR|PETROL|WATER|ELECTRICITY)/)) cat = 'Indirect';
        else if (uName.match(/(BRICK|CEMENT|AGGREGATE|SAND|STEEL|CONCRETE|GRAVEL)/)) cat = 'Home';
        else cat = 'Other';
      }
      
      if (!groups[cat]) {
        groups[cat] = [];
      }
      
      const stockInfo = inventoryMap[mat._id] || { quantity: 0, minStockLevel: 10 };
      
      groups[cat].push({
        ...mat,
        quantity: stockInfo.quantity,
        minStockLevel: stockInfo.minStockLevel
      });
    });

    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) delete groups[key];
    });

    return groups;
  }, [materialsMaster, inventoryMap, searchQuery]);

  const getRolePrefix = () => user ? `/${user.role}` : '';

  const handleMaterialClick = (materialId) => {
    navigate(`${getRolePrefix()}/inventory/${siteId}/material/${materialId}/history`);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustModal.quantity || adjustModal.quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    try {
      setIsAdjusting(true);
      const payload = {
        siteId,
        materials: [{
          materialId: adjustModal.material._id,
          materialName: adjustModal.material.materialName || adjustModal.material.name,
          quantity: Number(adjustModal.quantity),
          unit: adjustModal.material.unit,
        }],
        notes: ''
      };

      if (adjustModal.type === 'received') {
        payload.receivedDate = new Date().toISOString();
        await inventoryService.createReceivedEntry(payload);
      } else {
        payload.usedDate = new Date().toISOString();
        const currentStock = adjustModal.material.quantity || 0;
        if (Number(adjustModal.quantity) > currentStock) {
           toast.error(`Only ${currentStock} available at this site.`);
           setIsAdjusting(false);
           return;
        }
        await inventoryService.createUsedEntry(payload);
      }
      
      toast.success(`${adjustModal.type === 'received' ? 'Received' : 'Used'} entry created!`);
      setAdjustModal({ isOpen: false, type: '', material: null, quantity: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to create entry');
    } finally {
      setIsAdjusting(false);
    }
  };

  if (loading) return <Loader size="lg" className="mt-20" />;

  return (
    <div className="flex flex-col min-h-screen bg-white w-full pb-32">
      
      {/* Sticky Top Section (Site Header, Tabs, Search) */}
      <div className="sticky z-10 flex flex-col -mx-4 bg-white shadow-sm" style={{ top: '56px' }}>
        {/* Site Header */}
        <div className="bg-white border-b border-[#E5E7EB] px-4 py-[12px] flex items-center w-full">
          <button onClick={() => navigate(-1)} className="p-1 mr-2 rounded-full hover:bg-[#F3F4F6] transition-colors text-[#6B7280]">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-[20px] font-bold tracking-tight text-[#1F2937] capitalize">{siteDetails?.siteName || 'Unknown Site'}</h1>
        </div>

        {/* Button Tabs */}
        <div className="bg-white px-4 py-3 border-b border-[#E5E7EB]">
          <div className="flex overflow-x-auto hide-scrollbar gap-2">
            <button className="bg-[#2563EB] text-white font-bold text-[14px] whitespace-nowrap py-2 px-4 rounded-[20px] shrink-0">
              Inventory
            </button>
            <button 
              className="bg-[#F3F4F6] text-[#1F2937] font-medium text-[14px] whitespace-nowrap py-2 px-4 rounded-[20px] shrink-0 hover:bg-[#F3F4F6] transition-colors"
              onClick={() => navigate(`${getRolePrefix()}/create-order`, { state: { siteId } })}
            >
              Request
            </button>
            <button 
              className="bg-[#F3F4F6] text-[#1F2937] font-medium text-[14px] whitespace-nowrap py-2 px-4 rounded-[20px] shrink-0 hover:bg-[#F3F4F6] transition-colors"
              onClick={() => navigate(`${getRolePrefix()}/inventory/received/create`, { state: { siteId } })}
            >
              Received
            </button>
            <button 
              className="bg-[#F3F4F6] text-[#1F2937] font-medium text-[14px] whitespace-nowrap py-2 px-4 rounded-[20px] shrink-0 hover:bg-[#F3F4F6] transition-colors"
              onClick={() => navigate(`${getRolePrefix()}/inventory/used/create`, { state: { siteId } })}
            >
              Used
            </button>
          </div>
        </div>

        {/* Search & Add Material */}
        <div className="bg-white px-4 py-3 border-b border-[#E5E7EB] shadow-sm flex gap-3 items-center">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-transparent rounded-[16px] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] shadow-sm"
            />
          </div>
          {(user?.role === 'owner' || user?.role === 'manager') && (
            <button 
              onClick={() => navigate(`${getRolePrefix()}/materials`)}
              className="shrink-0 bg-blue-50 text-[#2563EB] px-3 py-2 rounded-[16px] font-bold text-sm h-[44px] flex items-center justify-center hover:bg-blue-100 transition-colors"
            >
              + Add
            </button>
          )}
        </div>
      </div>

      <div className="pt-4">
        {/* Material List */}
        <div className="space-y-6">
          {Object.keys(groupedMaterials).map((category, index) => (
            <div key={index} className="flex flex-col">
              {/* Category Header */}
              <div className="pb-2 px-4">
                <h2 className="text-lg font-bold text-[#1F2937] tracking-wide">
                  {category === 'Other' ? 'Materials' : category}
                </h2>
              </div>
              
              {/* Category Materials */}
              <div className="flex flex-col">
                {groupedMaterials[category].map((mat) => (
                  <div 
                    key={mat._id} 
                    className="bg-white p-[12px] flex flex-col justify-between cursor-pointer active:scale-[0.99] transition-transform border border-[#e0e0e0] mb-2 rounded-[20px]"
                    onClick={() => handleMaterialClick(mat._id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-base font-bold text-[#1F2937] leading-tight">
                        {mat.materialName || mat.name}
                      </h3>
                      <span className="text-lg font-bold leading-none text-[#1F2937]">
                        {mat.quantity}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-[#6B7280] font-medium capitalize">
                        {mat.unit}
                      </p>
                      <div className="flex items-center space-x-2">
                        {/* Minus Button (Used) */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); setAdjustModal({ isOpen: true, type: 'used', material: mat, quantity: '' }); }}
                          className="w-9 h-9 rounded-md bg-[#F3F4F6] flex items-center justify-center text-[#EF4444] hover:bg-[#F3F4F6] transition-colors"
                        >
                          <Minus className="w-5 h-5 stroke-[2.5]" />
                        </button>
                        
                        {/* Plus Button (Received) */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); setAdjustModal({ isOpen: true, type: 'received', material: mat, quantity: '' }); }}
                          className="w-9 h-9 rounded-md bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB] hover:bg-[#2563EB]/20 transition-colors"
                        >
                          <Plus className="w-5 h-5 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {Object.keys(groupedMaterials).length === 0 && (
            <div className="text-center py-12 bg-white rounded-[12px] border border-dashed border-[#E5E7EB]">
              <p className="text-[#6B7280] font-medium">No materials found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Action Buttons (bottom) */}
      <div className="fixed bottom-[64px] left-0 right-0 max-w-[428px] mx-auto bg-white border-t border-[#E5E7EB] p-2 z-40 shadow-sm flex gap-2">
        <button 
          className="flex-1 bg-[#f8faff] text-[#1F2937] border border-transparent hover:bg-[#F3F4F6] font-bold py-[8px] px-[12px] rounded-[16px] transition-colors flex justify-center items-center text-[13px] whitespace-nowrap"
          onClick={() => navigate(`${getRolePrefix()}/create-order`, { state: { siteId } })}
        >
          + REQUEST
        </button>
        <button 
          className="flex-1 bg-blue-50 text-[#2563EB] border border-blue-200 hover:bg-blue-100 font-bold py-[8px] px-[12px] rounded-[16px] transition-colors flex justify-center items-center text-[13px] whitespace-nowrap"
          onClick={() => navigate(`${getRolePrefix()}/inventory/received/create`, { state: { siteId } })}
        >
          + RECEIVED
        </button>
        <button 
          className="flex-1 bg-red-50 text-[#EF4444] border border-red-200 hover:bg-red-100 font-bold py-[8px] px-[12px] rounded-[16px] transition-colors flex justify-center items-center text-[13px] whitespace-nowrap"
          onClick={() => navigate(`${getRolePrefix()}/inventory/used/create`, { state: { siteId } })}
        >
          - USED
        </button>
      </div>

      <Modal isOpen={adjustModal.isOpen} onClose={() => setAdjustModal({ isOpen: false, type: '', material: null, quantity: '' })} title={`${adjustModal.type === 'received' ? 'Add Received' : 'Deduct Used'} Stock`}>
        <form onSubmit={handleAdjustSubmit} className="pt-2">
          <p className="text-[#6B7280] mb-4 font-medium">{adjustModal.material?.materialName || adjustModal.material?.name}</p>
          <div className="mb-4">
            <label className="block text-sm font-bold text-[#1F2937] mb-1">Quantity ({adjustModal.material?.unit})</label>
            <input 
              type="number" 
              step="any"
              value={adjustModal.quantity}
              onChange={(e) => setAdjustModal({ ...adjustModal, quantity: e.target.value })}
              className="w-full px-3 py-2 border border-transparent rounded-[16px] focus:ring-2 focus:ring-[#2563EB] shadow-sm"
              placeholder="Enter quantity"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => setAdjustModal({ isOpen: false, type: '', material: null, quantity: '' })}>Cancel</Button>
            <Button type="submit" isLoading={isAdjusting} className={`${adjustModal.type === 'received' ? 'bg-[#10B981] hover:bg-[#10B981]' : 'bg-[#EF4444] hover:bg-[#EF4444]'} text-white py-2.5 px-4 rounded-[16px]`}>
              {adjustModal.type === 'received' ? 'Add Stock' : 'Deduct Stock'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
