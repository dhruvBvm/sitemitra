import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import Loader from '../../components/common/Loader';
import { managerService } from '../../services/manager';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import { Plus } from 'lucide-react';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useForm } from 'react-hook-form';
import SiteMultiSelect from '../../components/common/SiteMultiSelect';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

const createStaffSchema = yup.object().shape({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email format').required('Email is required'),
  mobile: yup.string().matches(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits').required('Mobile is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  assignedSites: yup.array().of(yup.string()).transform((value, originalValue) => {
    if (typeof originalValue === 'string') {
      return originalValue ? [originalValue] : [];
    }
    return value;
  }).min(1, 'At least one site must be assigned').required('At least one site must be assigned')
});

export default function Team() {
  const user = useAuthStore(state => state.user);
  const [team, setTeam] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffToDeactivate, setStaffToDeactivate] = useState(null);
  const { register: registerCreate, handleSubmit: handleCreateSubmit, reset: resetCreate, formState: { errors: errorsCreate, isSubmitting: isCreateSubmitting } } = useForm({
    resolver: yupResolver(createStaffSchema),
    defaultValues: { assignedSites: [] }
  });

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const data = await managerService.getTeam();
      setTeam(data.team || data);
    } catch (error) {
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSites = async () => {
    try {
      const data = await managerService.getSites();
      const managedSites = data.filter(s => s.managerId && (s.managerId._id || s.managerId) === user?._id);
      setSites(managedSites);
    } catch (error) {
      toast.error('Failed to load sites');
    }
  };

  useEffect(() => {
    fetchTeam();
    fetchSites();
  }, []);



  const onCreateSubmit = async (data) => {
    try {
      // Ensure assignedSites is array
      if (!data.assignedSites) data.assignedSites = [];
      else if (!Array.isArray(data.assignedSites)) data.assignedSites = [data.assignedSites];

      await managerService.createStaff(data);
      toast.success('Staff created successfully!');
      setIsCreateModalOpen(false);
      resetCreate();
      fetchTeam();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create staff');
    }
  };


  const handleDeactivate = async () => {
    if (!staffToDeactivate) return;
    try {
      await managerService.deleteTeamMember(staffToDeactivate._id);
      toast.success('Staff deactivated');
      fetchTeam();
    } catch (error) {
      toast.error('Failed to deactivate staff');
    } finally {
      setStaffToDeactivate(null);
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { 
      header: 'Assigned Sites', 
      cell: (row) => row.assignedSites?.map(s => s.siteName).join(', ') || 'None'
    },
    { 
      header: 'Status', 
      accessor: 'status',
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={() => {
            window.location.href = `/manager/team/edit/${row._id}`;
          }}>Edit</Button>
          <Button variant="ghost" size="sm" className="text-[#EF4444] hover:text-[#EF4444] hover:bg-red-50 py-2.5 px-4 rounded-[16px]" onClick={async () => {
            setStaffToDeactivate(row);
          }}>Delete</Button>
        </div>
      )
    }
  ];

  if (loading) return <Loader size="lg" className="mt-20" />;

  return (
    <div className="space-y-6 p-4 pb-24">
      <div className="flex justify-between items-center mt-2 mb-4">
        <h1 className="text-2xl font-bold text-[#1F2937]">My Team</h1>
        <Button className="flex items-center py-2.5 px-4 rounded-[16px]" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Staff
        </Button>
      </div>

      <div className="space-y-4">
        {team.length === 0 ? (
          <div className="text-center py-10 bg-[#f8faff] rounded-[20px] border border-dashed border-[#E5E7EB]">
            <p className="text-sm font-medium text-[#6B7280]">No team members found.</p>
          </div>
        ) : (
          <div className="flex flex-col space-y-3">
            {team.map((member) => (
              <div key={member._id} className="bg-white shadow-sm border border-transparent rounded-[20px] p-[14px]">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-base font-bold text-[#1F2937]">{member.name}</h3>
                    <p className="text-sm font-medium text-[#6B7280]">{member.email}</p>
                  </div>
                  <StatusBadge status={member.status} />
                </div>
                <div className="text-sm text-[#6B7280] mb-3">
                  <span className="font-medium text-[#6B7280]">Mobile:</span> {member.mobile}
                </div>
                <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                  <div className="text-sm">
                    <span className="font-medium text-[#6B7280]">Sites:</span> <span className="text-[#1F2937] font-medium">{member.assignedSites?.length || 0}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-[#6B7280] border-[#E5E7EB] hover:bg-[#f8faff] px-3 py-2 rounded-[16px] font-medium"
                      onClick={() => window.location.href = `/manager/team/edit/${member._id}`}
                    >
                      Assign Sites
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-[#2563EB] border-[#2563EB] hover:bg-blue-50 px-3 py-2 rounded-[16px] font-medium"
                      onClick={() => window.location.href = `/users/${member._id}`}
                    >
                      View Profile
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-[#2563EB] border-[#2563EB] hover:bg-blue-50 px-3 py-2 rounded-[16px] font-medium"
                      onClick={() => {
                        window.location.href = `/manager/team/edit/${member._id}`;
                      }}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-[#EF4444] border-[#EF4444] hover:bg-red-50 px-3 py-2 rounded-[16px] font-medium" 
                      onClick={async () => {
                        setStaffToDeactivate(member);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>



      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Staff Member"
      >
        <form onSubmit={handleCreateSubmit(onCreateSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1F2937]">Name *</label>
            <input
              type="text"
              {...registerCreate('name')}
              className="mt-1 block w-full rounded-md border-[#E5E7EB] shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] sm:text-sm p-2 border"
            />
            {errorsCreate.name && <p className="mt-1 text-sm text-[#EF4444] font-medium">{errorsCreate.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1F2937]">Email *</label>
            <input
              type="email"
              {...registerCreate('email')}
              className="mt-1 block w-full rounded-md border-[#E5E7EB] shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] sm:text-sm p-2 border"
            />
            {errorsCreate.email && <p className="mt-1 text-sm text-[#EF4444] font-medium">{errorsCreate.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1F2937]">Mobile *</label>
            <input
              type="text"
              {...registerCreate('mobile')}
              className="mt-1 block w-full rounded-md border-[#E5E7EB] shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] sm:text-sm p-2 border"
            />
            {errorsCreate.mobile && <p className="mt-1 text-sm text-[#EF4444] font-medium">{errorsCreate.mobile.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1F2937]">Password *</label>
            <input
              type="password"
              {...registerCreate('password')}
              className="mt-1 block w-full rounded-md border-[#E5E7EB] shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] sm:text-sm p-2 border"
            />
            {errorsCreate.password && <p className="mt-1 text-sm text-[#EF4444] font-medium">{errorsCreate.password.message}</p>}
          </div>

          <SiteMultiSelect role="manager" register={registerCreate} error={errorsCreate.assignedSites} availableSites={sites} />

          <div className="pt-4 flex justify-end space-x-3">
            <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreateSubmitting}>
              {isCreateSubmitting ? 'Creating...' : 'Create Staff'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!staffToDeactivate}
        onCancel={() => setStaffToDeactivate(null)}
        onConfirm={handleDeactivate}
        title="Deactivate Staff"
        message="Are you sure you want to deactivate this staff member?"
        confirmText="Deactivate"
        confirmVariant="danger"
      />
    </div>
  );
}
