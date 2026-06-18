import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { Card, CardContent } from '../../components/common/Card';
import { Plus, Edit2, Trash2, Box, Search } from 'lucide-react';
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

  const activeMaterials = filteredMaterials.filter(m => m.status !== 'inactive');
  const inactiveMaterials = filteredMaterials.filter(m => m.status === 'inactive');

  if (loading) return <Loader size="lg" className="mt-20" />;

  return (
    <div className="flex flex-col min-h-screen w-full max-w-[428px] mx-auto px-4 pb-20 space-y-4">
      <div className="sticky z-10 bg-[#f8faff] -mx-4 px-4 pt-4 pb-3 border-b border-[#E5E7EB]/60 shadow-sm mb-2" style={{ top: '56px' }}>
        <div className="flex justify-between items-center pb-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1F2937]">Materials</h1>
            <p className="text-sm font-medium text-[#6B7280]">{materials.length} total</p>
          </div>
          {isOwnerOrManager && (
            <Button
              onClick={() => navigate('/materials/create')}
              className="bg-[#2563EB] text-white hover:bg-[#2563EB] py-3 px-4 text-sm rounded-[16px] flex items-center shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1 stroke-[2.5]" />
              New Material
            </Button>
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
              className="w-full pl-9 pr-3 py-2 bg-white border border-transparent rounded-[16px] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col space-y-6 mt-2">
        {/* Active Materials */}
        <div className="space-y-3">
          {activeMaterials.length > 0 && <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider px-1">Active Materials</h3>}
          {activeMaterials.length === 0 && filteredMaterials.length === 0 && (
            <div className="text-center py-10 bg-white rounded-[20px] border border-dashed border-[#E5E7EB]">
              <Box className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-[#6B7280] font-medium">No materials found.</p>
            </div>
          )}
          {activeMaterials.map(mat => (
            <Card key={mat._id} className="shadow-sm border-[#E5E7EB] hover:border-[#2563EB] transition-colors rounded-[20px]">
              <CardContent className="p-[14px] flex flex-col justify-between h-full">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-[#1F2937] leading-tight">{mat.materialName || mat.name}</h3>
                    <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mt-1">{mat.category || 'Uncategorized'}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="bg-blue-50 text-[#2563EB] px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                      {mat.unit}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`${user?.role === 'owner' ? '/owner' : user?.role === 'manager' ? '/manager' : '/staff'}/create-order`, { state: { preselectedMaterial: mat } });
                      }}
                      className="w-[40px] h-[40px] rounded-full bg-[#2563EB] flex items-center justify-center text-white shadow-sm hover:bg-[#2563EB] transition-colors shrink-0"
                    >
                      <Plus className="w-6 h-6 stroke-[2.5]" />
                    </button>
                  </div>
                </div>

                {isOwnerOrManager && (
                  <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => navigate(`/materials/edit/${mat._id}`)}
                      className="bg-[#F3F4F6] text-[#2563EB] hover:bg-[#F3F4F6] px-3 py-2 rounded-[16px] font-medium flex items-center gap-1 text-sm transition-colors"
                    >
                      <Edit2 className="w-4 h-4" /> Edit
                    </button>
                    {isOwnerOrManager && (
                      <button
                        onClick={() => toggleStatus(mat)}
                        className="bg-[#F3F4F6] text-[#EF4444] hover:text-[#EF4444] hover:bg-red-100 px-3 py-2 rounded-[16px] font-medium flex items-center gap-1 text-sm transition-colors"
                      >
                        <Trash2 className="w-4 h-4" /> Deactivate
                      </button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Inactive Materials */}
        <div className="space-y-3">
          {inactiveMaterials.length > 0 && <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider px-1">Inactive Materials</h3>}
          {inactiveMaterials.map(mat => (
            <Card key={mat._id} className="shadow-sm border-[#E5E7EB] hover:border-[#2563EB] transition-colors rounded-[20px] opacity-75">
              <CardContent className="p-[14px] flex flex-col justify-between h-full">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-[#1F2937] leading-tight">{mat.materialName || mat.name}</h3>
                    <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mt-1">{mat.category || 'Uncategorized'}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="bg-blue-50 text-[#2563EB] px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                      {mat.unit}
                    </span>
                  </div>
                </div>

                {isOwnerOrManager && (
                  <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => toggleStatus(mat)}
                      className="bg-[#F3F4F6] text-[#10B981] hover:text-[#10B981] hover:bg-green-100 px-3 py-2 rounded-[16px] font-medium flex items-center gap-1 text-sm transition-colors"
                    >
                      Activate
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>


    </div>
  );
}
