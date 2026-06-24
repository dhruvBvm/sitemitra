import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ownerService } from '../../services/owner';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

const editSiteSchema = yup.object().shape({
  siteName: yup.string().required('Site Name is required'),
  siteCode: yup.string().required('Site Code is required'),
  address: yup.string().required('Address is required'),
  managerId: yup.string().nullable().optional(),
  status: yup.string().oneOf(['active', 'inactive']).default('active')
});

export default function EditSite() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(editSiteSchema)
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [sitesData, usersData] = await Promise.all([
          ownerService.getSites({ limit: 1000 }),
          ownerService.getUsers({ role: 'manager', limit: 100 })
        ]);

        const sitesList = sitesData.sites || sitesData || [];
        const site = sitesList.find(s => s._id === id);

        if (site) {
          reset({
            siteName: site.siteName,
            siteCode: site.siteCode,
            address: site.address,
            managerId: site.managerId?._id || site.managerId || '',
            status: site.status
          });
        } else {
          toast.error('Site not found');
          navigate(-1);
        }

        setManagers(usersData.users || usersData || []);
      } catch (error) {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, reset, navigate]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        managerId: data.managerId || null
      };
      await ownerService.updateSite(id, payload);
      await ownerService.assignSiteManager(id, data.managerId || null);

      toast.success('Site updated successfully!');
      navigate(-1);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update site');
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
          <h1 className="text-[20px] font-bold tracking-tight text-[#1F2937]">Edit Site</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-4 flex-1 overflow-y-auto pt-3 pb-24">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[#1F2937] mb-1">Site Name *</label>
            <input
              type="text"
              {...register('siteName')}
              className="mt-1 block w-full rounded-md border-[#E5E7EB] shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] sm:text-sm p-2 border"
              placeholder="e.g. Downtown Highrise"
            />
            {errors.siteName && <p className="mt-1 text-xs font-semibold text-red-500">{errors.siteName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-[#1F2937] mb-1">Site Code *</label>
            <input
              type="text"
              {...register('siteCode')}
              className="mt-1 block w-full rounded-md border-[#E5E7EB] shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] sm:text-sm p-2 border"
              placeholder="e.g. DT-001"
            />
            {errors.siteCode && <p className="mt-1 text-xs font-semibold text-red-500">{errors.siteCode.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-[#1F2937] mb-1">Address *</label>
            <textarea
              {...register('address')}
              rows={3}
              className="mt-1 block w-full rounded-md border-[#E5E7EB] shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] sm:text-sm p-2 border resize-none"
              placeholder="Full site address..."
            />
            {errors.address && <p className="mt-1 text-xs font-semibold text-red-500">{errors.address.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-[#1F2937] mb-1">Assign Manager</label>
            <select
              {...register('managerId')}
              className="mt-1 block w-full rounded-md border-[#E5E7EB] shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] sm:text-sm p-2 border"
            >
              <option value="">None</option>
              {managers.map(m => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#1F2937] mb-1">Status</label>
            <select
              {...register('status')}
              className="mt-1 block w-full rounded-md border-[#E5E7EB] shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] sm:text-sm p-2 border"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Fixed Submit Button */}
        <div className="fixed bottom-[56px] left-0 right-0 z-30 flex justify-center pointer-events-none">
          <div className="w-full bg-white border-t border-[#E5E7EB] p-3 pointer-events-auto" style={{ maxWidth: '428px' }}>
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="w-full bg-[#2563EB] text-white font-medium py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Update Site'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
