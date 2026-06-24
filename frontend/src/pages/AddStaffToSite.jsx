import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { ownerService } from '../services/owner';
import { managerService } from '../services/manager';
import { useAuthStore } from '../store/authStore';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';

export default function AddStaffToSite() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isOwner = user?.role === 'owner';
  
  const [unassignedUsers, setUnassignedUsers] = useState([]);
  const [managerSites, setManagerSites] = useState([]);
  const [site, setSite] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let sitesData;
        let usersData;

        if (isOwner) {
          sitesData = await ownerService.getSites({ limit: 1000 });
          usersData = await ownerService.getUsers({ limit: 1000 });
        } else {
          sitesData = await managerService.getSites();
          setManagerSites(sitesData.map(s => s._id || s.siteId));
          usersData = await managerService.getAllStaff();
        }

        const sitesList = sitesData?.sites || sitesData || [];
        const currentSite = sitesList.find(s => (s.siteId === siteId) || (s._id === siteId));

        if (!currentSite) {
          toast.error('Site not found');
          navigate(-1);
          return;
        }
        setSite(currentSite);

        const unassigned = [];
        const usersArray = usersData?.users || usersData?.data || usersData || [];

        usersArray.forEach(u => {
          if (u.role === 'owner') return;

          const sitesArray = u.assignedSites || [];
          const isAssigned = sitesArray.some(s => (s._id || s) === currentSite._id || (s._id || s) === currentSite.siteId);

          if (!isAssigned && u.role === 'staff') {
            unassigned.push(u);
          }
        });
        
        setUnassignedUsers(unassigned);
      } catch (error) {
        toast.error('Failed to load available staff');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [siteId, isOwner, navigate]);

  const toggleUserSelection = (id) => {
    setSelectedUserIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (selectedUserIds.length === 0) {
      toast.error('Please select at least one staff member');
      return;
    }

    try {
      setIsSubmitting(true);
      const updatePromises = selectedUserIds.map(userId => {
        const u = unassignedUsers.find(x => x._id === userId);
        const currentAssigned = u.assignedSites ? u.assignedSites.map(s => s._id || s) : [];
        const newAssigned = [...currentAssigned, site._id || site.siteId];

        if (isOwner) {
          return ownerService.updateUser(userId, { assignedSites: newAssigned });
        } else {
          const managerAssigned = currentAssigned.filter(id => managerSites.includes(id));
          const newManagerAssigned = [...managerAssigned, site._id || site.siteId];
          return managerService.assignSitesToTeamStaff(userId, newManagerAssigned);
        }
      });

      await Promise.all(updatePromises);
      toast.success('Staff successfully added to site');
      navigate(-1);
    } catch (error) {
      toast.error('Failed to add staff to site');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Loader size="lg" className="mt-20" />;

  return (
    <div className="flex flex-col h-full bg-[#f8faff] font-sans max-w-[428px] mx-auto relative min-h-0">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-1.5 bg-[#F3F4F6] text-[#6B7280] rounded-full hover:bg-[#F3F4F6] transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[20px] font-bold tracking-tight text-[#1F2937]">Add Staff to Site</h1>
        </div>
      </div>

      <form onSubmit={handleAddSubmit} className="px-4 flex-1 overflow-y-auto pt-3 pb-24">
        <div className="space-y-4">
            {unassignedUsers.length === 0 ? (
              <p className="text-sm text-center text-[#6B7280] py-4 bg-white rounded-md border border-[#E5E7EB] p-4 shadow-sm">
                No available staff to add. They might already be assigned or none exist.
              </p>
            ) : (
              unassignedUsers.map(u => (
                <label key={u._id} className={`flex items-center gap-2 p-2 rounded-lg border shadow-sm transition-colors text-sm ${selectedUserIds.includes(u._id) ? 'border-[#2563EB] bg-blue-50 cursor-pointer' : 'border-[#E5E7EB] bg-white hover:bg-[#f8faff] cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(u._id)}
                    onChange={() => toggleUserSelection(u._id)}
                    className="w-4 h-4 text-[#2563EB] rounded border-[#E5E7EB] focus:ring-[#2563EB]"
                  />
                  <div>
                    <h4 className="font-bold text-[#1F2937] text-base">{u.name}</h4>
                    <div className="flex gap-2 items-center mt-0.5">
                      <span className="text-xs text-[#6B7280]">{u.email}</span>
                      <span className="bg-[#F3F4F6] text-[#6B7280] text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">
                        {u.role}
                      </span>
                    </div>
                  </div>
                </label>
              ))
            )}
        </div>

        {unassignedUsers.length > 0 && (
          <div className="fixed bottom-[56px] left-0 right-0 z-30 flex justify-center pointer-events-none">
            <div className="w-full bg-white border-t border-[#E5E7EB] p-3 pointer-events-auto" style={{ maxWidth: '428px' }}>
              <Button 
                type="submit" 
                disabled={isSubmitting || selectedUserIds.length === 0} 
                className="w-full bg-[#2563EB] text-white font-medium py-3 rounded-md hover:bg-blue-700 transition-colors"
              >
                {isSubmitting ? 'Adding...' : 'Add to Site'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
