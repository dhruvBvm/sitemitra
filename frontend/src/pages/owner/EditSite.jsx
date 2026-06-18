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
    <div className="flex flex-col min-h-screen bg-[#f8faff] font-sans max-w-[428px] mx-auto relative pb-24">
      {/* Sticky Header */}
      <div className="fixed top-14 left-1/2 -translate-x-1/2 w-full max-w-[428px] z-40 bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 bg-[#f8faff] text-[#6B7280] rounded-full hover:bg-[#F3F4F6] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[1.1rem] font-bold tracking-tight text-[#1F2937]">Edit Site</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-4 py-6 space-y-5 pt-[72px]">
        <div className="bg-white rounded-[20px] shadow-sm border border-transparent p-4 space-y-4">
          <div>
            <label className="block text-sm font-bold text-[#1F2937] mb-1">Site Name *</label>
            <input
              type="text"
              {...register('siteName')}
              className="w-full px-3 py-3 border border-transparent rounded-[16px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm box-border"
              placeholder="e.g. Downtown Highrise"
            />
            {errors.siteName && <p className="mt-1 text-xs font-semibold text-red-500">{errors.siteName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-[#1F2937] mb-1">Site Code *</label>
            <input
              type="text"
              {...register('siteCode')}
              className="w-full px-3 py-3 border border-transparent rounded-[16px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm box-border"
              placeholder="e.g. DT-001"
            />
            {errors.siteCode && <p className="mt-1 text-xs font-semibold text-red-500">{errors.siteCode.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-[#1F2937] mb-1">Address *</label>
            <textarea
              {...register('address')}
              rows={3}
              className="w-full px-3 py-3 border border-transparent rounded-[16px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm box-border resize-none"
              placeholder="Full site address..."
            />
            {errors.address && <p className="mt-1 text-xs font-semibold text-red-500">{errors.address.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-[#1F2937] mb-1">Assign Manager</label>
            <select
              {...register('managerId')}
              className="w-full px-3 py-3 border border-transparent rounded-[16px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm box-border bg-white"
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
              className="w-full px-3 py-3 border border-transparent rounded-[16px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm box-border bg-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Sticky Submit Button */}
        <div className="fixed bottom-[64px] left-0 right-0 bg-white border-t border-[#E5E7EB] p-3 flex justify-center z-40 max-w-[428px] mx-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="w-full text-base font-bold shadow-sm"
          >
            {isSubmitting ? 'Saving...' : 'Update Site'}
          </Button>
        </div>
      </form>
    </div>
  );
}
