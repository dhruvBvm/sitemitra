import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { managerService } from '../../services/manager';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

const editStaffSchema = yup.object().shape({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email format').required('Email is required'),
  mobile: yup.string().matches(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits').required('Mobile is required'),
  password: yup.string().optional().test('len', 'Password must be at least 6 characters', val => !val || val.length >= 6),
  assignedSites: yup.array().of(yup.string()).transform((value, originalValue) => {
    if (typeof originalValue === 'string') {
      return originalValue ? [originalValue] : [];
    }
    return value;
  }).optional(),
  status: yup.string().oneOf(['active', 'inactive'])
});

export default function EditTeamMember() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState([]);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(editStaffSchema),
    defaultValues: { assignedSites: [] }
  });
  const [staffSites, setStaffSites] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [staffData, sitesData] = await Promise.all([
          managerService.getTeamMemberById(id),
          managerService.getSites()
        ]);
        
        const staff = staffData;
        
        const allSites = sitesData.sites || sitesData || [];
        const managedSites = allSites.filter(s => s.managerId && (s.managerId._id || s.managerId) === user?._id);
        setSites(managedSites);

        if (staff) {
          setStaffSites(staff.assignedSites || []);
          reset({
            name: staff.name,
            email: staff.email,
            mobile: staff.mobile,
            status: staff.status,
            assignedSites: staff.assignedSites?.filter(s => managedSites.some(ms => ms._id === (s._id || s))).map(s => s._id || s) || [],
            password: ''
          });
        } else {
          toast.error('Staff member not found');
          navigate(-1);
        }
      } catch (error) {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, reset, navigate, user?._id]);

  const onSubmit = async (data) => {
    try {
      if (!data.password) {
        delete data.password;
      }
      
      if (!data.assignedSites) data.assignedSites = [];
      else if (!Array.isArray(data.assignedSites)) data.assignedSites = [data.assignedSites];

      await managerService.updateTeamMember(id, data);
      
      toast.success('Staff member updated successfully!');
      navigate(-1);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update staff member');
    }
  };

  if (loading) return <Loader size="lg" className="mt-20" />;

  return (
    <div className="flex flex-col h-full bg-[#f8faff] font-sans max-w-[428px] mx-auto relative min-h-0">
      <div className="sticky top-0 z-30 bg-white border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3 px-4 py-3">
          <button type="button" onClick={() => navigate(-1)} className="p-1.5 bg-[#F3F4F6] text-[#6B7280] rounded-full hover:bg-[#F3F4F6] transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[20px] font-bold tracking-tight text-[#1F2937]">Edit Team Member</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-4 flex-1 overflow-y-auto pt-3 pb-24">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[#1F2937] mb-1">Name *</label>
            <input
              type="text"
              {...register('name')}
              className="mt-1 block w-full rounded-md border-[#E5E7EB] shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] sm:text-sm p-2 border"
            />
            {errors.name && <p className="mt-1 text-sm text-[#EF4444]">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-[#1F2937] mb-1">Email *</label>
            <input
              type="email"
              {...register('email')}
              className="mt-1 block w-full rounded-md border-[#E5E7EB] shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] sm:text-sm p-2 border"
            />
            {errors.email && <p className="mt-1 text-sm text-[#EF4444]">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-[#1F2937] mb-1">Mobile *</label>
            <input
              type="text"
              {...register('mobile')}
              className="mt-1 block w-full rounded-md border-[#E5E7EB] shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] sm:text-sm p-2 border"
            />
            {errors.mobile && <p className="mt-1 text-sm text-[#EF4444]">{errors.mobile.message}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-bold text-[#1F2937] mb-1">Password (Leave blank to keep unchanged)</label>
            <input
              type="password"
              {...register('password')}
              className="mt-1 block w-full rounded-md border-[#E5E7EB] shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] sm:text-sm p-2 border"
            />
            {errors.password && <p className="mt-1 text-sm text-[#EF4444]">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-[#1F2937] mb-1">Assigned Sites</label>
            <div className="mt-1 block w-full rounded-md border-[#E5E7EB] shadow-sm sm:text-sm p-2 border bg-white max-h-60 overflow-y-auto">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Sites you can manage</p>
                {sites.map(site => (
                  <label key={site._id} className="flex items-center gap-2 text-sm text-[#1F2937] cursor-pointer hover:bg-[#f8faff] p-1 -mx-1 rounded">
                    <input
                      type="checkbox"
                      value={site._id}
                      {...register('assignedSites')}
                      className="rounded border-[#E5E7EB] text-[#2563EB] focus:ring-[#2563EB] w-4 h-4"
                    />
                    <span className="font-medium">{site.siteName}</span> <span className="text-[#6B7280]">({site.siteCode})</span>
                  </label>
                ))}
                {sites.length === 0 && <p className="text-xs text-[#6B7280] italic">No sites available</p>}
              </div>

              {staffSites.filter(s => !sites.some(ms => ms._id === (s._id || s))).length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#E5E7EB] space-y-2">
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Sites managed by others (read-only)</p>
                  {staffSites
                    .filter(s => !sites.some(ms => ms._id === (s._id || s)))
                    .map(site => (
                      <div key={site._id || site} className="flex items-center gap-2 text-sm text-[#6B7280] p-1 -mx-1">
                        <span className="text-[#6B7280]">{'✅'}</span>
                        <span className="line-through">{site.siteName || 'Unknown Site'}</span>
                        <span className="text-[10px] bg-[#F3F4F6] text-[#6B7280] px-2 py-0.5 rounded-full ml-auto uppercase font-bold">
                          Managed by {site.managerId?.name || 'Unknown'}
                        </span>
                      </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#1F2937] mb-1">Status</label>
            <select
              {...register('status')}
              className="mt-1 block w-full rounded-md border-[#E5E7EB] shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] sm:text-sm p-2 border bg-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="fixed bottom-[56px] left-0 right-0 z-30 flex justify-center pointer-events-none">
          <div className="w-full bg-white border-t border-[#E5E7EB] p-3 pointer-events-auto" style={{ maxWidth: '428px' }}>
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="w-full bg-[#2563EB] text-white font-medium py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Update Team Member'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
