import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { Card, CardContent } from '../../components/common/Card';
import { Plus, Pencil, Ban, CheckCircle, Box, Search } from 'lucide-react';
import { ownerService } from '../../services/owner';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Loader from '../../components/common/Loader';

export default function Materials() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState(null);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const data = await ownerService.getMaterials({ limit: 1000 });
      const mats = data.materials || data;
      setMaterials(mats);
      setFilteredMaterials(mats);
    } catch (error) {
      toast.error('Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMaterials(materials);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredMaterials(materials.filter(m =>
        (m.materialName || '').toLowerCase().includes(q) ||
        (m.category || '').toLowerCase().includes(q)
      ));
    }
  }, [searchQuery, materials]);



  const toggleStatus = async (mat) => {
    try {
      const newStatus = mat.status === 'active' ? 'inactive' : 'active';
      if (newStatus === 'active') {
        await ownerService.updateMaterial(mat._id, { status: 'active' });
      } else {
        await ownerService.deleteMaterial(mat._id); // Deletes are soft deletes
      }
      toast.success('Material status updated');
      fetchMaterials();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const isOwnerOrManager = user?.role === 'owner' || user?.role === 'manager';
  const isOwner = user?.role === 'owner';

  const groupedMaterials = useMemo(() => {
    const groups = {};
    filteredMaterials.forEach(m => {
      let cat = m.category || 'Other';
      cat = cat.trim();
      if (cat === '') cat = 'Other';
      // Normalize category capitalization
      cat = cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(m);
    });
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === 'Other' || a === 'Uncategorized') return 1;
      if (b === 'Other' || b === 'Uncategorized') return -1;
      return a.localeCompare(b);
    });
    const sortedGroups = {};
    sortedKeys.forEach(k => {
      sortedGroups[k] = groups[k];
    });
    return sortedGroups;
  }, [filteredMaterials]);

  if (loading) return <Loader size="lg" className="mt-20" />;

  return (
    <div className="flex flex-col h-full max-w-[428px] mx-auto min-h-0">
      <div className="flex-shrink-0 z-40 bg-white border-b border-[#E5E7EB] overflow-x-hidden">
        <div className="px-4 pt-3 pb-2 flex flex-col gap-1.5">
          {/* FULL-WIDTH STICKY HEADER */}
          <div className="flex justify-between items-center mb-2 w-full mt-2">
            <div>
              <h1 className="text-[18px] font-bold tracking-tight text-[#1F2937]">Materials</h1>
              <p className="text-[13px] font-medium text-[#6B7280]">{materials.length} total</p>
            </div>
            {isOwnerOrManager && (
              <button
                onClick={() => navigate('/materials/create')}
                className="flex items-center justify-center bg-[#2563EB] text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4 mr-1" />
                New Material
              </button>
            )}
          </div>

          <div className="w-full">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5E7EB] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-3">
        <div className="flex flex-col space-y-4">
          {filteredMaterials.length === 0 ? (
            <div className="text-center py-10 bg-[#f8faff] rounded-lg border border-dashed border-[#E5E7EB]">
              <p className="text-sm font-medium text-[#6B7280]">No materials found.</p>
            </div>
          ) : (
            Object.keys(groupedMaterials).map(category => (
              <div key={category} className="flex flex-col space-y-1">
                <h2 className="text-xs font-bold text-[#1F2937] tracking-tight">{category}</h2>
                <div className="flex flex-col space-y-2">
                  {groupedMaterials[category].map(mat => {
                    const isActive = mat.status !== 'inactive';
                    if (isActive) {
                      return (
                        <div key={mat._id} className="bg-white rounded-lg p-2 shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex items-center justify-between gap-2">
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-sm font-bold text-[#1F2937] leading-tight truncate capitalize">{mat.materialName || mat.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold text-white bg-[#10B981] rounded px-1.5 py-0.5 uppercase tracking-wider">{mat.unit}</span>
                            {isOwnerOrManager && (
                              <div className="flex items-center gap-[6px]">
                                <button
                                  onClick={() => navigate(`/materials/edit/${mat._id}`)}
                                  className="p-2 flex items-center justify-center bg-[#f8faff] text-[#2563EB] rounded-[6px] hover:bg-blue-100 transition-colors border border-[#E5E7EB]"
                                  title="Edit"
                                >
                                  <Pencil className="w-[18px] h-[18px]" />
                                </button>
                                <button
                                  onClick={() => toggleStatus(mat)}
                                  className="p-2 flex items-center justify-center bg-[#f8faff] text-[#EF4444] rounded-[6px] hover:bg-red-50 transition-colors border border-[#E5E7EB]"
                                  title="Deactivate"
                                >
                                  <Ban className="w-[18px] h-[18px]" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div key={mat._id} className="bg-white rounded-lg p-2 shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex items-center justify-between gap-2 opacity-75">
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-sm font-bold text-[#1F2937] leading-tight truncate capitalize">{mat.materialName || mat.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold text-white bg-[#10B981] rounded px-1.5 py-0.5 uppercase tracking-wider">{mat.unit}</span>
                            {isOwnerOrManager && (
                              <div className="flex items-center gap-[6px]">
                                <button
                                  onClick={() => toggleStatus(mat)}
                                  className="p-2 flex items-center justify-center bg-[#f8faff] text-[#10B981] rounded-[6px] hover:bg-green-50 transition-colors border border-[#E5E7EB]"
                                  title="Activate"
                                >
                                  <CheckCircle className="w-[18px] h-[18px]" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
