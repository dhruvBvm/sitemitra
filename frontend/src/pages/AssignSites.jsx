import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ownerService } from '../services/owner';
import { managerService } from '../services/manager';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AssignSites() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const isOwner = currentUser?.role === 'owner';

  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableSites, setAvailableSites] = useState([]);
  const [selectedSiteIds, setSelectedSiteIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let userData;
        let sitesData;

        if (isOwner) {
          userData = await ownerService.getUser(userId);
          sitesData = await ownerService.getSites({ limit: 1000 });
        } else {
          const teamData = await managerService.getAllStaff();
          const teamArray = teamData.users || teamData.team || teamData || [];
          userData = teamArray.find(u => u._id === userId);
          sitesData = await managerService.getSites();
        }

        if (!userData) {
          toast.error('User not found');
          navigate(-1);
          return;
        }
        setProfileUser(userData);

        const allSites = sitesData?.sites || sitesData || [];
        setAvailableSites(allSites);
        
        // Initialize selected sites based on current user assignment
        setSelectedSiteIds(userData.assignedSites?.map(s => s._id || s.siteId) || []);
      } catch (error) {
        toast.error('Failed to load user details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, isOwner, navigate]);

  const handleAssignSitesSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      const availableSiteIds = availableSites.map(s => s._id || s.siteId);

      let idsToSubmit = selectedSiteIds;
      if (!isOwner) {
        idsToSubmit = selectedSiteIds.filter(id => availableSiteIds.includes(id));
      }

      if (isOwner) {
        await ownerService.assignUserSites(profileUser._id, idsToSubmit);
      } else {
        await managerService.assignSitesToTeamStaff(profileUser._id, idsToSubmit);
      }

      toast.success('Sites assigned successfully');
      navigate(-1);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign sites');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSiteSelection = (id) => {
    setSelectedSiteIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  if (loading) return <Loader size="lg" className="mt-20" />;
  if (!profileUser) return null;

  const availableSiteIds = availableSites.map(s => s._id || s.siteId);
  const sitesAssignedByOthers = isOwner ? [] : (profileUser.assignedSites || []).filter(
    s => !availableSiteIds.includes(s._id || s.siteId)
  );
  const displaySites = [...availableSites, ...sitesAssignedByOthers];

  return (
    <div className="flex flex-col h-full bg-[#f8faff] font-sans max-w-[428px] mx-auto relative min-h-0">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#E5E7EB]">
  <div className="flex items-center gap-3 px-4 py-3">
    <button onClick={() => navigate(-1)} className="p-1.5 bg-[#F3F4F6] text-[#6B7280] rounded-full hover:bg-[#F3F4F6] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[20px] font-bold tracking-tight text-[#1F2937]">Assign Sites to {profileUser.name}</h1>
  </div>
</div>

      <form onSubmit={handleAssignSitesSubmit} className="px-4 flex-1 overflow-y-auto pt-3 pb-24">
        <div className="space-y-4">
          {displaySites.length === 0 ? (
            <p className="text-sm text-center text-[#6B7280] py-4 bg-white rounded-md border border-gray-100 p-4">
              No available sites to assign.
            </p>
          ) : (
            displaySites.map(s => {
              const siteId = s._id || s.siteId;
              const isManagedByOther = sitesAssignedByOthers.some(otherSite => (otherSite._id || otherSite.siteId) === siteId);
              const isSelected = selectedSiteIds.includes(siteId);

              return (
                <label key={siteId} className={`flex items-center gap-2 p-2 rounded-lg border shadow-sm transition-colors text-sm ${isManagedByOther ? 'bg-[#F3F4F6] border-[#E5E7EB] opacity-70 cursor-not-allowed' : isSelected ? 'border-[#2563EB] bg-blue-50 cursor-pointer' : 'border-[#E5E7EB] bg-white hover:bg-[#f8faff] cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    checked={isSelected || isManagedByOther}
                    disabled={isManagedByOther}
                    onChange={() => !isManagedByOther && toggleSiteSelection(siteId)}
                    className="w-4 h-4 text-[#2563EB] rounded border-[#E5E7EB] focus:ring-[#2563EB] disabled:opacity-50"
                  />
                  <div>
                    <h4 className="font-bold text-[#1F2937] text-xs">{s.siteName}</h4>
                    <span className="text-xs text-[#6B7280]">{s.siteCode}</span>
                    {isManagedByOther && <span className="ml-2 text-[10px] bg-[#F3F4F6] text-[#6B7280] px-1.5 py-0.5 rounded font-bold uppercase">Managed by Others</span>}
                  </div>
                </label>
              );
            })
          )}
        </div>

        <div className="fixed bottom-[56px] left-0 right-0 z-30 flex justify-center pointer-events-none">
  <div className="w-full bg-white border-t border-[#E5E7EB] p-3 pointer-events-auto" style={{ maxWidth: '428px' }}>
    <Button 
            type="submit" 
            disabled={isSubmitting || selectedSiteIds.length === 0} 
            className="w-full bg-[#2563EB] text-white font-medium py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            {isSubmitting ? 'Assigning...' : 'Assign Sites'}
          </Button>
  </div>
</div>
      </form>
    </div>
  );
}
