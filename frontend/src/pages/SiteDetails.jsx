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
  const [unassignedUsers, setUnassignedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [managerSites, setManagerSites] = useState([]);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingUserId, setRemovingUserId] = useState(null);
  const [userToRemove, setUserToRemove] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setLoading(true);
      if (user?.role === 'staff') {
        const data = await staffService.getSiteDetails(siteId);
        setSite(data.site);
        setAssignedUsers(data.assignedStaff || []);
        setUnassignedUsers([]);
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

      const allUsers = [...(usersData?.users || usersData || [])];
      
      const assigned = [];
      const unassigned = [];

      allUsers.forEach(u => {
        // Skip admins
        if (u.role === 'owner') return;

        // Determine if user is already assigned to this site
        const sitesArray = u.assignedSites || [];
        const isAssigned = sitesArray.some(s => (s._id || s) === currentSite._id || (s._id || s) === currentSite.siteId);

        if (isAssigned && u.role === 'staff') {
          assigned.push(u);
        } else if (u.role === 'staff') {
          // Only staff can be added via the Add Staff modal
          unassigned.push(u);
        }
      });
      setAssignedUsers(assigned);
      setUnassignedUsers(unassigned);
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
      const currentAssigned = userToRemove.assignedSites.map(s => s._id || s);
      const newAssigned = currentAssigned.filter(id => id !== (site._id || site.siteId));

      if (isOwner) {
        await ownerService.updateUser(userToRemove._id, { assignedSites: newAssigned });
      } else {
        const currentAssigned = userToRemove.assignedSites ? userToRemove.assignedSites.map(s => s._id || s) : [];
        const managerAssigned = currentAssigned.filter(id => managerSites.includes(id));
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

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (selectedUserIds.length === 0) {
      toast.error('Please select at least one user');
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
      toast.success('Users successfully added to site');
      setIsAddModalOpen(false);
      setSelectedUserIds([]);
      fetchData();
    } catch (error) {
      toast.error('Failed to add users to site');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUserSelection = (id) => {
    setSelectedUserIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  if (loading) return <Loader size="lg" className="mt-20" />;
  if (!site) return null;

  return (
    <div className="flex flex-col min-h-screen bg-[#f8faff] font-sans w-full max-w-[428px] mx-auto pb-24 px-4">
      {/* Sticky Header & Site Info */}
      <div className="sticky top-14 z-30 bg-[#f8faff] -mx-4 px-4 pb-4 border-b border-[#E5E7EB]/60 shadow-sm mb-4 w-[calc(100%+32px)]">
        {/* Header Bar */}
        <div className="bg-white border-b border-[#E5E7EB] shadow-sm px-4 py-3 flex items-center justify-between -mx-4 px-8 w-[calc(100%+32px)] mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 bg-[#F3F4F6] text-[#6B7280] rounded-full hover:bg-[#F3F4F6] transition-colors -ml-4">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-[1.1rem] font-bold tracking-tight text-[#1F2937]">Site Details</h1>
          </div>
        </div>

        {/* Site Info Card */}
        <div className="Card w-full bg-white rounded-[20px] shadow-sm border border-transparent p-[14px]">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h2 className="text-xl font-extrabold text-[#1F2937]">{site.siteName}</h2>
              <p className="text-sm font-semibold text-[#6B7280]">{site.siteCode}</p>
            </div>
            <StatusBadge status={site.status} />
          </div>
          <div className="flex items-start text-sm text-[#6B7280] mb-3 border-t border-slate-100 pt-3">
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

      <div className="space-y-6 w-full">

        {/* Assigned Users Section */}
        <div>
          {/* Managers List */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold text-[#1F2937]">Manager (site responsible)</h3>
            </div>
            <div className="space-y-3">
              {(site.managerId && typeof site.managerId === 'object') || site.manager ? (
                <div 
                  className={`bg-white rounded-[20px] border border-transparent p-3 shadow-sm flex items-center justify-between ${user?.role !== 'staff' ? 'cursor-pointer hover:border-blue-300 transition-colors' : ''}`}
                  onClick={() => {
                    if (user?.role !== 'staff') {
                      navigate(`/users/${site.managerId?._id || site.managerId || site.manager?._id}`);
                    }
                  }}
                >
                  <div>
                    <h4 className="font-bold text-[#1F2937] capitalize">{site.managerId?.name || site.manager?.name || 'Unknown'}</h4>
                    {(site.managerId?.email || site.manager?.email) && (
                      <p className="text-xs text-[#6B7280] font-medium">{site.managerId?.email || site.manager?.email}</p>
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
                <div className="text-center py-4 bg-[#f8faff] rounded-[20px] border border-dashed border-[#E5E7EB]">
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
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold text-[#1F2937]">Staff (assigned workers) ({assignedUsers.filter(u => u.role === 'staff').length})</h3>
            </div>
            <div className="space-y-3">
              {assignedUsers.filter(u => u.role === 'staff').map(u => (
                <div 
                  key={u._id} 
                  className={`bg-white rounded-[20px] border border-transparent p-3 shadow-sm flex items-center justify-between ${user?.role !== 'staff' ? 'cursor-pointer hover:border-blue-300 transition-colors' : ''}`}
                  onClick={() => {
                    if (user?.role !== 'staff') {
                      navigate(`/users/${u._id}`);
                    }
                  }}
                >
                  <div>
                    <h4 className="font-bold text-[#1F2937]">{u.name}</h4>
                    <p className="text-xs text-[#6B7280] font-medium">{u.email}</p>
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
                      className={`p-2 text-red-500 hover:bg-red-50 rounded-[16px] transition-colors border border-transparent hover:border-red-100 ${removingUserId === u._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="Remove from site"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              {assignedUsers.filter(u => u.role === 'staff').length === 0 && (
                <div className="text-center py-6 bg-[#f8faff] rounded-[20px] border border-dashed border-[#E5E7EB]">
                  <p className="text-sm font-medium text-[#6B7280]">No staff members assigned.</p>
                </div>
              )}
            </div>
          </div>
          )}

          {user?.role !== 'staff' && (
            <div className="flex gap-2 mt-4">
              <Button 
                className="flex-1 flex items-center justify-center py-3 bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/20 border border-transparent"
                onClick={() => setIsAddModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Assign Staff
              </Button>
              <Button 
                className="flex-1 flex items-center justify-center py-3 bg-[#2563EB] text-white hover:bg-[#2563EB] border border-transparent shadow-sm"
                onClick={() => navigate(`/sites/${site._id || site.siteId}/create-staff`)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Staff
              </Button>
            </div>
          )}
          
          {user?.role === 'staff' && (
            <div className="flex gap-2 mt-4">
              <Button 
                className="w-full flex items-center justify-center py-3 bg-[#2563EB] text-white hover:bg-[#2563EB] border border-transparent shadow-sm rounded-[16px]"
                onClick={() => navigate(`/staff/create-order`, { state: { siteId: site._id || site.siteId } })}
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Request
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedUserIds([]);
        }}
        title="Add Team to Site"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1 hide-scrollbar">
            {unassignedUsers.length === 0 ? (
              <p className="text-sm text-center text-[#6B7280] py-4">No available users to add.</p>
            ) : (
              unassignedUsers.map(u => (
                <label key={u._id} className={`flex items-center gap-3 p-3 rounded-[16px] border cursor-pointer transition-colors ${selectedUserIds.includes(u._id) ? 'border-[#2563EB] bg-blue-50' : 'border-[#E5E7EB] bg-white hover:bg-[#f8faff]'}`}>
                  <input 
                    type="checkbox" 
                    checked={selectedUserIds.includes(u._id)}
                    onChange={() => toggleUserSelection(u._id)}
                    className="w-4 h-4 text-[#2563EB] rounded border-[#E5E7EB] focus:ring-[#2563EB]"
                  />
                  <div>
                    <h4 className="font-bold text-[#1F2937] text-sm">{u.name}</h4>
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

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || selectedUserIds.length === 0} className="px-6">
              {isSubmitting ? 'Adding...' : 'Add to Site'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!userToRemove}
        onCancel={() => setUserToRemove(null)}
        onConfirm={handleRemoveUser}
        title="Remove from Site"
        message={`Remove ${userToRemove?.name} from this site?`}
        confirmText="Remove"
        confirmVariant="danger"
      />


    </div>
  );
}
