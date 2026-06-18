import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ownerService } from '../services/owner';
import { managerService } from '../services/manager';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import ConfirmModal from '../components/common/ConfirmModal';
import { ArrowLeft, MapPin, Building, Settings, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const isOwner = currentUser?.role === 'owner';

  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAssignSitesModalOpen, setIsAssignSitesModalOpen] = useState(false);
  const [availableSites, setAvailableSites] = useState([]);
  const [selectedSiteIds, setSelectedSiteIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [siteToRemove, setSiteToRemove] = useState(null);

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
    } catch (error) {
      toast.error('Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId, isOwner]);

  const handleRemoveFromSite = async () => {
    if (!siteToRemove) return;
    const siteToRemoveId = siteToRemove;
    setSiteToRemove(null);
    
    try {
      const currentAssigned = profileUser.assignedSites.map(s => s._id || s.siteId);
      const newAssigned = currentAssigned.filter(id => id !== siteToRemoveId);

      await ownerService.assignUserSites(profileUser._id, newAssigned);
      toast.success('Removed from site');
      fetchData();
    } catch (error) {
      toast.error('Failed to remove from site');
    }
  };

  const handleAssignSitesSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      const availableSiteIds = availableSites.map(s => s._id || s.siteId);
      
      let idsToSubmit = selectedSiteIds;
      if (!isOwner) {
        // Only send sites that the manager actually manages
        idsToSubmit = selectedSiteIds.filter(id => availableSiteIds.includes(id));
      }

      if (isOwner) {
        await ownerService.assignUserSites(profileUser._id, idsToSubmit);
      } else {
        await managerService.assignSitesToTeamStaff(profileUser._id, idsToSubmit);
      }
      
      toast.success('Sites assigned successfully');
      setIsAssignSitesModalOpen(false);
      fetchData();
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

  const currentAssignedSiteIds = profileUser.assignedSites?.map(s => s._id || s.siteId) || [];
  const availableSiteIds = availableSites.map(s => s._id || s.siteId);
  const sitesAssignedByOthers = isOwner ? [] : (profileUser.assignedSites || []).filter(
    s => !availableSiteIds.includes(s._id || s.siteId)
  );
  const displaySites = [...availableSites, ...sitesAssignedByOthers];

  return (
    <div className="flex flex-col min-h-screen bg-[#f8faff] font-sans max-w-[428px] mx-auto relative pb-24">
      {/* Header */}
      <div className="fixed top-14 left-1/2 -translate-x-1/2 w-full max-w-[428px] z-40 bg-white border-b border-[#E5E7EB] shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 bg-[#F3F4F6] text-[#6B7280] rounded-full hover:bg-[#F3F4F6] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[1.1rem] font-bold tracking-tight text-[#1F2937]">User Profile</h1>
        </div>
        <StatusBadge status={profileUser.status} />
      </div>

      <div className="p-4 space-y-6 pt-[72px]">
        {/* User Info Card */}
        <div className="bg-white rounded-[20px] shadow-sm border border-transparent p-[14px]">
          <div className="mb-2">
            <h2 className="text-xl font-extrabold text-[#1F2937]">{profileUser.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-[#F3F4F6] text-[#6B7280] text-xs uppercase font-bold px-2 py-0.5 rounded">
                {profileUser.role}
              </span>
              <p className="text-sm font-medium text-[#6B7280]">{profileUser.email}</p>
            </div>
          </div>
          <div className="text-sm text-[#6B7280] mb-3 border-t border-slate-100 pt-3 flex flex-col gap-2">
            <div><span className="font-medium text-[#6B7280]">Mobile:</span> {profileUser.mobile}</div>

          </div>
        </div>

        {/* Assigned Sites Section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-bold text-[#1F2937]">Assigned Sites ({profileUser.assignedSites?.length || 0})</h3>
          </div>

          <div className="space-y-3">
            {profileUser.assignedSites?.map(s => (
              <div key={s._id || s.siteId} className="bg-white rounded-[20px] border border-transparent p-3 shadow-sm flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-[#1F2937]">{s.siteName || 'Unknown Site'}</h4>
                  <p className="text-xs text-[#6B7280] font-medium">{s.siteCode || ''}</p>
                </div>
                {isOwner && (
                  <button
                    onClick={() => setSiteToRemove(s._id || s.siteId)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-[16px] transition-colors border border-transparent hover:border-red-100"
                    title="Remove from site"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}

            {(!profileUser.assignedSites || profileUser.assignedSites.length === 0) && (
              <div className="text-center py-6 bg-[#f8faff] rounded-[20px] border border-dashed border-[#E5E7EB]">
                <Building className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                <p className="text-sm font-medium text-[#6B7280]">No sites assigned.</p>
              </div>
            )}
          </div>

          <Button 
            className="w-full mt-4 flex items-center justify-center py-3 bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/20 border border-transparent"
            onClick={() => {
              setSelectedSiteIds(profileUser.assignedSites?.map(s => s._id || s.siteId) || []);
              setIsAssignSitesModalOpen(true);
            }}
          >
            <Settings className="w-4 h-4 mr-2" />
            Assign Sites
          </Button>
        </div>
      </div>

      {/* Assign Sites Modal */}
      <ConfirmModal
        isOpen={!!siteToRemove}
        onCancel={() => setSiteToRemove(null)}
        onConfirm={handleRemoveFromSite}
        title="Remove from Site"
        message={`Remove ${profileUser.name} from this site?`}
        confirmText="Remove"
        confirmVariant="danger"
      />
      <Modal
        isOpen={isAssignSitesModalOpen}
        onClose={() => {
          setIsAssignSitesModalOpen(false);
          setSelectedSiteIds([]);
        }}
        title="Assign Sites"
      >
        <form onSubmit={handleAssignSitesSubmit} className="space-y-4">
          <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1 hide-scrollbar">
            {displaySites.length === 0 ? (
              <p className="text-sm text-center text-[#6B7280] py-4">No available sites to assign.</p>
            ) : (
              displaySites.map(s => {
                const siteId = s._id || s.siteId;
                const isManagedByOther = sitesAssignedByOthers.some(otherSite => (otherSite._id || otherSite.siteId) === siteId);
                const isSelected = selectedSiteIds.includes(siteId);

                return (
                <label key={siteId} className={`flex items-center gap-3 p-3 rounded-[16px] border transition-colors ${isManagedByOther ? 'bg-[#F3F4F6] border-[#E5E7EB] opacity-70 cursor-not-allowed' : isSelected ? 'border-[#2563EB] bg-blue-50 cursor-pointer' : 'border-[#E5E7EB] bg-white hover:bg-[#f8faff] cursor-pointer'}`}>
                  <input 
                    type="checkbox" 
                    checked={isSelected || isManagedByOther}
                    disabled={isManagedByOther}
                    onChange={() => !isManagedByOther && toggleSiteSelection(siteId)}
                    className="w-4 h-4 text-[#2563EB] rounded border-[#E5E7EB] focus:ring-[#2563EB] disabled:opacity-50"
                  />
                  <div>
                    <h4 className="font-bold text-[#1F2937] text-sm">{s.siteName}</h4>
                    <span className="text-xs text-[#6B7280]">{s.siteCode}</span>
                    {isManagedByOther && <span className="ml-2 text-[10px] bg-[#F3F4F6] text-[#6B7280] px-1.5 py-0.5 rounded font-bold uppercase">Managed by Others</span>}
                  </div>
                </label>
              )})
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsAssignSitesModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || selectedSiteIds.length === 0} className="px-6">
              {isSubmitting ? 'Assigning...' : 'Assign'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
