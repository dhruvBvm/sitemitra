import { useState, useEffect } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { Plus } from 'lucide-react';
import { ownerService } from '../../services/owner';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';
import SiteMultiSelect from '../../components/common/SiteMultiSelect';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

const userSchema = yup.object().shape({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email format').required('Email is required'),
  mobile: yup.string().matches(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits').required('Mobile is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  role: yup.string().oneOf(['manager', 'staff']).required(),
  assignedSites: yup.array().of(yup.string()).transform((value, originalValue) => {
    if (typeof originalValue === 'string') {
      return originalValue ? [originalValue] : [];
    }
    return value;
  }).optional()
});

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('managers'); // 'managers' or 'staff'
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { 
    register: registerCreate, 
    handleSubmit: handleCreateSubmit, 
    watch: watchCreate, 
    reset: resetCreate, 
    setValue: setValueCreate, 
    formState: { errors: errorsCreate, isSubmitting: isSubmittingCreate } 
  } = useForm({
    resolver: yupResolver(userSchema),
    defaultValues: { role: 'manager', assignedSites: [] }
  });
  
  const selectedRole = watchCreate('role', 'manager');
  const allManagers = users.filter(u => u.role === 'manager');
  const activeManagers = allManagers.filter(u => u.status !== 'inactive');
  const inactiveManagers = allManagers.filter(u => u.status === 'inactive');

  const staffList = users.filter(u => u.role === 'staff');
  const activeStaff = staffList.filter(u => u.status !== 'inactive');
  const inactiveStaff = staffList.filter(u => u.status === 'inactive');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await ownerService.getUsers({ limit: 100 });
      let usersArray = [];
      if (Array.isArray(data)) {
        usersArray = data;
      } else if (data && Array.isArray(data.users)) {
        usersArray = data.users;
      } else if (data && Array.isArray(data.data)) {
        usersArray = data.data;
      }
      setUsers(usersArray);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onSubmit = async (data) => {
    try {
      if (data.role === 'manager') {
        await ownerService.createManager(data);
      } else if (data.role === 'staff') {
        await ownerService.createStaff(data);
      }
      toast.success(`${data.role} created successfully!`);
      resetCreate();
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    }
  };

  const toggleStatus = async (user) => {
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      await ownerService.updateUserStatus(user._id, newStatus);
      toast.success('Status updated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) return <Loader size="lg" className="mt-20" />;

  return (
    <div className="space-y-6 p-4 pb-24">
      <div className="flex justify-between items-center mt-2 mb-4">
        <h1 className="text-2xl font-bold text-[#1F2937]">User Management</h1>
      </div>

      <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
        <button 
          onClick={() => setActiveTab('managers')} 
          className={activeTab === 'managers' ? "bg-[#2563EB] text-white font-bold text-[14px] whitespace-nowrap py-2 px-4 rounded-full shrink-0 shadow-sm" : "bg-[#F3F4F6] text-[#1F2937] font-medium text-[14px] whitespace-nowrap py-2 px-4 rounded-full shrink-0 hover:bg-[#F3F4F6] transition-colors"}
        >
          Managers
        </button>
        <button 
          onClick={() => setActiveTab('staff')} 
          className={activeTab === 'staff' ? "bg-[#2563EB] text-white font-bold text-[14px] whitespace-nowrap py-2 px-4 rounded-full shrink-0 shadow-sm" : "bg-[#F3F4F6] text-[#1F2937] font-medium text-[14px] whitespace-nowrap py-2 px-4 rounded-full shrink-0 hover:bg-[#F3F4F6] transition-colors"}
        >
          Staff
        </button>
      </div>

      {activeTab === 'managers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-[#1F2937]">Managers ({allManagers.length})</h2>
            <Button className="flex items-center py-2.5 px-4 rounded-[16px]" onClick={() => { setValueCreate('role', 'manager'); setIsModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Manager
            </Button>
          </div>
          
          {allManagers.length === 0 ? (
            <div className="text-center py-10 bg-[#f8faff] rounded-[20px] border border-dashed border-[#E5E7EB]">
              <p className="text-sm font-medium text-[#6B7280]">No managers found.</p>
            </div>
          ) : (
            <div className="flex flex-col space-y-6">
              {/* Active Managers */}
              <div className="space-y-3">
                {activeManagers.length > 0 && <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider px-1">Active Managers</h3>}
                {activeManagers.map((manager) => (
                  <div key={manager._id} className="bg-white shadow-sm border border-transparent rounded-[20px] p-[14px]">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-base font-bold text-[#1F2937]">{manager.name}</h3>
                        <p className="text-sm font-medium text-[#6B7280]">{manager.email}</p>
                      </div>
                      <StatusBadge status={manager.status} />
                    </div>
                    <div className="text-sm text-[#6B7280] mb-3">
                      <span className="font-medium text-[#6B7280]">Mobile:</span> {manager.mobile}
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                      <div className="text-sm">
                        <span className="font-medium text-[#6B7280]">Assigned Sites:</span> <span className="text-[#1F2937] font-medium">{manager.assignedSites?.length || 0}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Button variant="outline" size="sm" className="text-[#6B7280] border-[#E5E7EB] hover:bg-[#f8faff] px-3 py-2 rounded-[16px] font-medium" onClick={() => window.location.href = `/users/${manager._id}`}>
                          Assign Sites
                        </Button>
                        <Button variant="outline" size="sm" className="text-[#2563EB] border-[#2563EB] hover:bg-blue-50 px-3 py-2 rounded-[16px] font-medium" onClick={() => window.location.href = `/owner/users/edit/${manager._id}`}>
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="text-[#EF4444] border-[#EF4444] hover:bg-red-50 px-3 py-2 rounded-[16px] font-medium" onClick={() => toggleStatus(manager)}>
                          Deactivate
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Inactive Managers */}
              <div className="space-y-3">
                {inactiveManagers.length > 0 && <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider px-1">Inactive Managers</h3>}
                {inactiveManagers.map((manager) => (
                  <div key={manager._id} className="bg-white shadow-sm border border-transparent rounded-[20px] p-[14px] opacity-75">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-base font-bold text-[#1F2937]">{manager.name}</h3>
                        <p className="text-sm font-medium text-[#6B7280]">{manager.email}</p>
                      </div>
                      <StatusBadge status={manager.status} />
                    </div>
                    <div className="text-sm text-[#6B7280] mb-3">
                      <span className="font-medium text-[#6B7280]">Mobile:</span> {manager.mobile}
                    </div>
                    <div className="flex justify-end border-t border-slate-100 pt-3">
                      <Button variant="outline" size="sm" className="text-[#10B981] border-[#10B981] hover:bg-green-50 px-3 py-2 rounded-[16px] font-medium" onClick={() => toggleStatus(manager)}>
                        Activate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-[#1F2937]">Staff ({staffList.length})</h2>
            <Button className="flex items-center py-2.5 px-4 rounded-[16px]" onClick={() => { setValueCreate('role', 'staff'); setIsModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Staff
            </Button>
          </div>
          
          {staffList.length === 0 ? (
            <div className="text-center py-10 bg-[#f8faff] rounded-[20px] border border-dashed border-[#E5E7EB]">
              <p className="text-sm font-medium text-[#6B7280]">No staff found.</p>
            </div>
          ) : (
            <div className="flex flex-col space-y-6">
              {/* Active Staff */}
              <div className="space-y-3">
                {activeStaff.length > 0 && <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider px-1">Active Staff</h3>}
                {activeStaff.map((staff) => (
                  <div key={staff._id} className="bg-white shadow-sm border border-transparent rounded-[20px] p-[14px]">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-base font-bold text-[#1F2937]">{staff.name}</h3>
                        <p className="text-sm font-medium text-[#6B7280]">{staff.email}</p>
                      </div>
                      <StatusBadge status={staff.status} />
                    </div>
                    <div className="text-sm text-[#6B7280] mb-3 flex justify-between">
                      <div><span className="font-medium text-[#6B7280]">Mobile:</span> {staff.mobile}</div>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                      <div className="text-sm">
                        <span className="font-medium text-[#6B7280]">Assigned Sites:</span> <span className="text-[#1F2937] font-medium">{staff.assignedSites?.length || 0}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Button variant="outline" size="sm" className="text-[#6B7280] border-[#E5E7EB] hover:bg-[#f8faff] px-3 py-2 rounded-[16px] font-medium" onClick={() => window.location.href = `/users/${staff._id}`}>
                          Assign Sites
                        </Button>
                        <Button variant="outline" size="sm" className="text-[#2563EB] border-[#2563EB] hover:bg-blue-50 px-3 py-2 rounded-[16px] font-medium" onClick={() => window.location.href = `/owner/users/edit/${staff._id}`}>
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="text-[#EF4444] border-[#EF4444] hover:bg-red-50 px-3 py-2 rounded-[16px] font-medium" onClick={() => toggleStatus(staff)}>
                          Deactivate
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Inactive Staff */}
              <div className="space-y-3">
                {inactiveStaff.length > 0 && <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider px-1">Inactive Staff</h3>}
                {inactiveStaff.map((staff) => (
                  <div key={staff._id} className="bg-white shadow-sm border border-transparent rounded-[20px] p-[14px] opacity-75">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-base font-bold text-[#1F2937]">{staff.name}</h3>
                        <p className="text-sm font-medium text-[#6B7280]">{staff.email}</p>
                      </div>
                      <StatusBadge status={staff.status} />
                    </div>
                    <div className="text-sm text-[#6B7280] mb-3 flex justify-between">
                      <div><span className="font-medium text-[#6B7280]">Mobile:</span> {staff.mobile}</div>
                    </div>
                    <div className="flex justify-end border-t border-slate-100 pt-3">
                      <Button variant="outline" size="sm" className="text-[#10B981] border-[#10B981] hover:bg-green-50 px-3 py-2 rounded-[16px] font-medium" onClick={() => toggleStatus(staff)}>
                        Activate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetCreate(); }}
        title={`Create New ${selectedRole === 'manager' ? 'Manager' : 'Staff'}`}
      >
        <form onSubmit={handleCreateSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...registerCreate('role')} />
          <div>
            <label className="block text-sm font-medium text-[#1F2937]">Name</label>
            <input
              type="text"
              {...registerCreate('name')}
              className="mt-1 block w-full rounded-md border-[#E5E7EB] shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] sm:text-sm p-2 border"
            />
            {errorsCreate.name && <p className="mt-1 text-sm text-[#EF4444]">{errorsCreate.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1F2937]">Email</label>
            <input
              type="email"
              {...registerCreate('email')}
              className="mt-1 block w-full rounded-md border-[#E5E7EB] shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] sm:text-sm p-2 border"
            />
            {errorsCreate.email && <p className="mt-1 text-sm text-[#EF4444]">{errorsCreate.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1F2937]">Mobile</label>
            <input
              type="text"
              {...registerCreate('mobile')}
              className="mt-1 block w-full rounded-md border-[#E5E7EB] shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] sm:text-sm p-2 border"
            />
            {errorsCreate.mobile && <p className="mt-1 text-sm text-[#EF4444]">{errorsCreate.mobile.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1F2937]">Password</label>
            <input
              type="password"
              {...registerCreate('password')}
              className="mt-1 block w-full rounded-md border-[#E5E7EB] shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] sm:text-sm p-2 border"
            />
            {errorsCreate.password && <p className="mt-1 text-sm text-[#EF4444]">{errorsCreate.password.message}</p>}
          </div>

          {selectedRole === 'staff' && (
            <SiteMultiSelect 
              role="owner" 
              register={registerCreate} 
              error={errorsCreate.assignedSites} 
              availableSites={null}
              disabled={false}
              required={true}
            />
          )}

          <div className="pt-4 flex justify-end space-x-3">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmittingCreate}>
              {isSubmittingCreate ? 'Creating...' : `Create ${selectedRole === 'manager' ? 'Manager' : 'Staff'}`}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
