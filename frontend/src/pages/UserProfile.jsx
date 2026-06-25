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
  const [siteToRemove, setSiteToRemove] = useState(null);

  useEffect(() => {
    if (userId === currentUser?._id) {
      navigate('/profile', { replace: true });
    }
  }, [userId, currentUser, navigate]);

  const fetchData = async () => {
    if (userId === currentUser?._id) return; // Prevent fetch if redirecting to /profile

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

      if (isOwner) {
        await ownerService.assignUserSites(profileUser._id, newAssigned);
      } else {
        // Find which sites the manager has access to
        const managerSitesData = await managerService.getSites();
        const managerSiteIds = managerSitesData.map(s => s._id || s.siteId);

        // Ensure the manager only affects sites they actually manage
        const managerCurrentAssigned = profileUser.assignedSites ? profileUser.assignedSites.map(s => s._id || s.siteId) : [];
        const managerAssigned = managerCurrentAssigned.filter(id => managerSiteIds.includes(id));
        const newManagerAssigned = managerAssigned.filter(id => id !== siteToRemoveId);

        await managerService.assignSitesToTeamStaff(profileUser._id, newManagerAssigned);
      }
      toast.success('Removed from site');
      fetchData();
    } catch (error) {
      toast.error('Failed to remove from site');
    }
  };

  if (loading) return <Loader size="lg" className="mt-20" />;
  if (!profileUser) return null;

  const currentAssignedSiteIds = profileUser.assignedSites?.map(s => s._id || s.siteId) || [];

  return (
    <>
      {/* ===== FULL-WIDTH STICKY HEADER ===== */}
      <div className="sticky top-0 left-0 right-0 z-40 bg-white border-b border-[#E5E7EB] overflow-x-hidden">
        <div className="max-w-[428px] mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-1.5 bg-[#F3F4F6] text-[#6B7280] rounded-full hover:bg-[#F3F4F6] transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-[1.1rem] font-bold tracking-tight text-[#1F2937]">User Profile</h1>
          </div>
          <StatusBadge status={profileUser.status} />
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex flex-col space-y-4 max-w-[428px] mx-auto px-4 pb-4 pt-3">
        {/* User Info Card */}
        <div className="bg-white rounded-lg p-2 shadow-sm border border-slate-200">
          <div className="mb-2">
            <h2 className="text-2xl font-bold text-[#1F2937] tracking-tight">{profileUser.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-[#F3F4F6] text-[#6B7280] text-xs uppercase font-bold px-2 py-0.5 rounded">
                {profileUser.role}
              </span>
              <p className="text-sm font-medium text-[#6B7280]">{profileUser.email}</p>
            </div>
          </div>
          <div className="text-sm font-medium text-[#6B7280] border-t border-slate-100 pt-1.5 mt-0.5 flex flex-col gap-1">
            <div><span className="font-medium">Mobile:</span> {profileUser.mobile}</div>
          </div>
        </div>

        {/* Assigned Sites Section */}
        <div>
          {(isOwner || currentUser?.role === 'manager') && profileUser.role !== 'manager' && (
            <Button
              className="w-full mb-6 flex items-center justify-center py-2 bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/20 border border-transparent rounded-md"
              onClick={() => navigate(`/users/${profileUser._id}/assign-sites`)}
            >
              <Settings className="w-5 h-5 mr-2" />
              Assign Sites
            </Button>
          )}

          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base font-bold text-[#1F2937]">Assigned Sites ({profileUser.assignedSites?.length || 0})</h3>
          </div>

          <div className="space-y-2">
            {profileUser.assignedSites?.map(s => {
              const siteId = s._id || s.siteId;
              const managerSiteIds = currentUser?.assignedSites?.map(ms => ms._id || ms.siteId || ms) || [];
              const canDelete = isOwner || (currentUser?.role === 'manager' && managerSiteIds.includes(siteId));

              return (
                <div key={siteId} className="bg-white rounded-lg p-2 shadow-sm border border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold text-[#1F2937] leading-tight">{s.siteName || 'Unknown Site'}</h4>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{s.siteCode || ''}</p>
                  </div>
                  {canDelete && profileUser.role !== 'manager' && (
                    <button
                      onClick={() => setSiteToRemove(siteId)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              );
            })}

            {(!profileUser.assignedSites || profileUser.assignedSites.length === 0) && (
              <div className="text-center py-6 bg-[#f8faff] rounded-lg border border-dashed border-[#E5E7EB]">
                <Building className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                <p className="text-sm font-medium text-[#6B7280]">No sites assigned.</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={!!siteToRemove}
        onCancel={() => setSiteToRemove(null)}
        onConfirm={handleRemoveFromSite}
        title="Remove from Site"
        message={`Remove ${profileUser.name} from this site?`}
        confirmText="Remove"
        confirmVariant="danger"
      />


    </>
  );
}
