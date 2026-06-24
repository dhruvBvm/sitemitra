import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import Loader from '../../components/common/Loader';
import { managerService } from '../../services/manager';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import { Plus, Pencil, Ban, CheckCircle } from 'lucide-react';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useForm } from 'react-hook-form';
import SiteMultiSelect from '../../components/common/SiteMultiSelect';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
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
          <Button variant="ghost" size="sm" className="text-[#EF4444] hover:text-[#EF4444] hover:bg-red-50 py-2.5 px-2 rounded-md" onClick={async () => {
            setStaffToDeactivate(row);
          }}>Delete</Button>
        </div>
      )
    }
  ];

  if (loading) return <Loader size="lg" className="mt-20" />;

  return (
    <div className="flex flex-col h-full max-w-[428px] mx-auto min-h-0">
      <div className="px-4 pt-3 flex-shrink-0">
        <div className="flex justify-between items-center mb-4 mt-2">
          <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight">My Team</h1>
          <Button className="flex items-center py-2.5 px-2 rounded-md" onClick={() => navigate('/manager/team/create-staff')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Staff
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-4">
        {team.length === 0 ? (
          <div className="text-center py-10 bg-[#f8faff] rounded-lg border border-dashed border-[#E5E7EB]">
            <p className="text-sm font-medium text-[#6B7280]">No team members found.</p>
          </div>
        ) : (
          <div className="flex flex-col space-y-2">
            {team.map((member) => (
              <div key={member._id} onClick={() => navigate(`/users/${member._id}`)} className="bg-white rounded-lg p-2 shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98] relative flex flex-col gap-1.5">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="text-base font-bold text-[#1F2937] leading-tight">{member.name}</h3>
                    <p className="text-sm font-medium text-[#6B7280]">{member.email}</p>
                    <p className="text-sm font-medium text-[#6B7280]">Mobile: {member.mobile}</p>
                  </div>
                  
                  {/* Top Right Controls */}
                  <div className="flex flex-col items-end gap-[8px] py-1 shrink-0">
                    <StatusBadge status={member.status} />
                    <div className="flex gap-[6px]">
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/manager/team/edit/${member._id}`); }} className="p-2 rounded-[6px] flex items-center justify-center bg-[#f8faff] text-[#2563EB] hover:bg-blue-100 transition-colors border border-[#E5E7EB]">
                      <Pencil className="w-[18px] h-[18px]" />
                    </button>
                    {member.status !== 'inactive' ? (
                      <button onClick={(e) => { e.stopPropagation(); setStaffToDeactivate(member); }} className="p-2 rounded-[6px] flex items-center justify-center bg-[#f8faff] text-[#EF4444] hover:bg-red-50 transition-colors border border-[#E5E7EB]">
                        <Ban className="w-[18px] h-[18px]" />
                      </button>
                    ) : (
                      <button onClick={async (e) => { 
                        e.stopPropagation(); 
                        try {
                          await managerService.updateStaffStatus(member._id, 'active');
                          toast.success('Staff activated');
                          fetchTeam();
                        } catch(err) {
                          toast.error('Failed to activate staff');
                        }
                      }} className="p-2 rounded-[6px] flex items-center justify-center bg-[#f8faff] text-[#10B981] hover:bg-green-50 transition-colors border border-[#E5E7EB]">
                        <CheckCircle className="w-[18px] h-[18px]" />
                      </button>
                    )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>



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
