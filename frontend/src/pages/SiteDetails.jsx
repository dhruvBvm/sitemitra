import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ownerService } from '../services/owner';
import { managerService } from '../services/manager';
import { staffService } from '../services/staff';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import ConfirmModal from '../components/common/ConfirmModal';
import StatusBadge from '../components/common/StatusBadge';
import { ArrowLeft, Plus, MapPin, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function SiteDetails() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isOwner = user?.role === 'owner';

  const [site, setSite] = useState(null);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [managerSites, setManagerSites] = useState([]);

  const [removingUserId, setRemovingUserId] = useState(null);
  const [userToRemove, setUserToRemove] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (user?.role === 'staff') {
        const data = await staffService.getSiteDetails(siteId);
        setSite(data.site);
        setAssignedUsers(data.assignedStaff || []);
        setLoading(false);
        return;
      }

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

      const usersArray = [...(usersData?.users || usersData || [])];

      const assigned = [];

      usersArray.forEach(u => {
        // Skip admins
        if (u.role === 'owner') return;

        // Determine if user is already assigned to this site
        const sitesArray = u.assignedSites || [];
        const isAssigned = sitesArray.some(s => (s._id || s) === currentSite._id || (s._id || s) === currentSite.siteId);

        if (isAssigned && u.role === 'staff') {
          assigned.push(u);
        }
      });
      setAssignedUsers(assigned);
    } catch (error) {
      toast.error('Failed to load site details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [siteId, isOwner]);

  const handleRemoveUser = async () => {
    if (!userToRemove) return;

    try {
      setRemovingUserId(userToRemove._id);
      const ownerCurrentAssigned = userToRemove.assignedSites.map(s => s._id || s);
      const newAssigned = ownerCurrentAssigned.filter(id => id !== (site._id || site.siteId));

      if (isOwner) {
        await ownerService.updateUser(userToRemove._id, { assignedSites: newAssigned });
      } else {
        const managerCurrentAssigned = userToRemove.assignedSites ? userToRemove.assignedSites.map(s => s._id || s) : [];
        const managerAssigned = managerCurrentAssigned.filter(id => managerSites.includes(id));
        const newManagerAssigned = managerAssigned.filter(id => id !== (site._id || site.siteId));
        await managerService.assignSitesToTeamStaff(userToRemove._id, newManagerAssigned);
      }
      toast.success(`${userToRemove.name} removed from site`);
      fetchData();
    } catch (error) {
      toast.error('Failed to remove user');
    } finally {
      setRemovingUserId(null);
      setUserToRemove(null);
    }
  };

  if (loading) return <Loader size="lg" className="mt-20" />;
  if (!site) return null;

  return (
    <>
      {/* Sticky Header & Site Info */}
      <div className="sticky top-0 left-0 right-0 z-40 bg-white   border-[#E5E7EB] overflow-x-hidden">
        <div className="max-w-[428px] mx-auto px-4 py-2 flex flex-col gap-1.5">
          {/* FULL-WIDTH STICKY HEADER – DO NOT REMOVE OR WRAP IN CONTAINER */}
          {/* Header Bar */}
          <div className="flex items-center gap-2 mb-2 w-full">
            <button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-[#F3F4F6] transition-colors text-[#6B7280]">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-[18px] font-bold tracking-tight text-[#1F2937]">Site Details</h1>
          </div>

          {/* Site Info Card */}
          <div className="bg-white rounded-lg p-2 shadow-sm border border-slate-200 w-full">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h2 className="text-2xl font-bold text-[#1F2937] tracking-tight">{site.siteName}</h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{site.siteCode}</p>
              </div>
              <StatusBadge status={site.status} />
            </div>
            <div className="flex items-start text-sm text-[#6B7280] mb-2 border-t border-slate-100 pt-3">
              <MapPin className="w-4 h-4 mr-1 mt-0.5 text-slate-400 shrink-0" />
              <span>{site.address}</span>
            </div>
            <div className="text-sm border-t border-slate-100 pt-3">
              <span className="font-medium text-[#6B7280]">Manager: </span>
              <span
                className={`font-bold capitalize ${site.managerId ? 'text-[#2563EB] cursor-pointer hover:underline' : 'text-[#1F2937]'}`}
                onClick={() => {
                  if (site.managerId) {
                    navigate(`/users/${site.managerId._id || site.managerId}`);
                  }
                }}
              >
                {site.managerId?.name || site.manager?.name || 'Unassigned'}
              </span>
            </div>
            {user?.role !== 'staff' && (
              <div className="pt-4 mt-1 border-t border-slate-100">
                <Button
                  className="w-full bg-white text-[#2563EB] border-[#2563EB] hover:bg-blue-50 border py-2.5 font-bold"
                  onClick={() => navigate(`/${user?.role === 'manager' ? 'manager/inventory' : user?.role === 'owner' ? 'owner/inventory' : 'staff/inventory'}/${site._id || site.siteId}`)}
                >
                  View Inventory
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col  space-y-4 max-w-[428px] mx-auto px-4 pb-4 pt-4">

        {/* Assigned Users Section */}
        <div>
          {/* Managers List */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-base font-bold text-[#1F2937]">Manager (site responsible)</h3>
            </div>
            <div className="space-y-2">
              {(site.managerId && typeof site.managerId === 'object') || site.manager ? (
                <div
                  className={`bg-white rounded-lg p-2 shadow-sm border border-slate-200 flex items-center justify-between gap-2 ${user?.role !== 'staff' ? 'cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]' : ''}`}
                  onClick={() => {
                    if (user?.role !== 'staff') {
                      navigate(`/users/${site.managerId?._id || site.managerId || site.manager?._id}`);
                    }
                  }}
                >
                  <div>
                    <h4 className="text-base font-bold text-[#1F2937] leading-tight capitalize">{site.managerId?.name || site.manager?.name || 'Unknown'}</h4>
                    {(site.managerId?.email || site.manager?.email) && (
                      <p className="text-sm font-medium text-[#6B7280] mt-0.5">{site.managerId?.email || site.manager?.email}</p>
                    )}
                    <div className="mt-1 flex items-center gap-2">
                      <span className="bg-[#F3F4F6] text-[#6B7280] text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                        {site.managerId?.role || site.manager?.role || 'Manager'}
                      </span>
                      {(site.managerId?.mobile || site.manager?.mobile) && (
                        <span className="text-xs text-slate-400">{site.managerId?.mobile || site.manager?.mobile}</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 bg-[#f8faff] rounded-lg border border-dashed border-[#E5E7EB]">
                  <p className="text-sm font-medium text-[#6B7280] mb-2">No manager assigned.</p>
                  {isOwner && (
                    <Button variant="outline" size="sm" onClick={() => navigate(`/owner/sites/edit/${site._id || site.siteId}`)}>
                      Assign Manager
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Staff List */}
          {user?.role !== 'staff' && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-base font-bold text-[#1F2937]">Staff (assigned workers) ({assignedUsers.filter(u => u.role === 'staff').length})</h3>
              </div>
              <div className="space-y-2">
                {assignedUsers.filter(u => u.role === 'staff').map(u => (
                  <div
                    key={u._id}
                    className={`bg-white rounded-lg p-2 shadow-sm border border-slate-200 flex items-center justify-between gap-2 ${user?.role !== 'staff' ? 'cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]' : ''}`}
                    onClick={() => {
                      if (user?.role !== 'staff') {
                        navigate(`/users/${u._id}`);
                      }
                    }}
                  >
                    <div>
                      <h4 className="text-base font-bold text-[#1F2937] leading-tight">{u.name}</h4>
                      <p className="text-sm font-medium text-[#6B7280] mt-0.5">{u.email}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="bg-[#F3F4F6] text-[#6B7280] text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                          {u.role}
                        </span>
                        <span className="text-xs text-slate-400">{u.mobile}</span>
                      </div>
                    </div>
                    {user?.role !== 'staff' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserToRemove(u);
                        }}
                        disabled={removingUserId === u._id}
                        className={`p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-100 ${removingUserId === u._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Remove from site"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                {assignedUsers.filter(u => u.role === 'staff').length === 0 && (
                  <div className="text-center py-6 bg-[#f8faff] rounded-lg border border-dashed border-[#E5E7EB]">
                    <p className="text-sm font-medium text-[#6B7280]">No staff members assigned.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {user?.role !== 'staff' && (
            <div className="flex gap-2 mt-4">
              <Button
                className="flex-1 flex items-center justify-center py-2 bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/20 border border-transparent"
                onClick={() => navigate(`/sites/${site._id || site.siteId}/add-staff`)}
              >
                <Plus className="w-5 h-5 mr-2" />
                Assign Staff
              </Button>
              <Button
                className="flex-1 flex items-center justify-center py-2 bg-[#2563EB] text-white hover:bg-[#2563EB] border border-transparent shadow-sm"
                onClick={() => navigate(`/sites/${site._id || site.siteId}/create-staff`)}
              >
                <Plus className="w-5 h-5 mr-2" />
                New Staff
              </Button>
            </div>
          )}

          {user?.role === 'staff' && (
            <div className="flex gap-2 mt-4">
              <Button
                className="w-full flex items-center justify-center py-2 bg-[#2563EB] text-white hover:bg-[#2563EB] border border-transparent shadow-sm rounded-md"
                onClick={() => navigate(`/staff/create-order`, { state: { siteId: site._id || site.siteId } })}
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Request
              </Button>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!userToRemove}
        onCancel={() => setUserToRemove(null)}
        onConfirm={handleRemoveUser}
        title="Remove from Site"
        message={`Remove ${userToRemove?.name} from this site?`}
        confirmText="Remove"
        confirmVariant="danger"
      />
    </>
  );
}
