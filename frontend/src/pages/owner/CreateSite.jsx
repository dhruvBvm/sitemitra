import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ownerService } from '../../services/owner';
import Button from '../../components/common/Button';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

const createSiteSchema = yup.object().shape({
  siteName: yup.string().required('Site Name is required'),
  siteCode: yup.string().required('Site Code is required'),
  address: yup.string().required('Address is required'),
  managerId: yup.string().nullable().optional(),
  status: yup.string().oneOf(['active', 'inactive']).default('active')
});

export default function CreateSite() {
  const navigate = useNavigate();
  const [managers, setManagers] = useState([]);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(createSiteSchema)
  });

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const data = await ownerService.getUsers({ role: 'manager', limit: 100 });
        setManagers(data.users || data || []);
      } catch (error) {
        toast.error('Failed to load managers');
      }
    };
    fetchManagers();
  }, []);

  const onSubmit = async (data) => {
    try {
      await ownerService.createSite(data);
      toast.success('Site created successfully!');
      navigate(-1);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create site');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8faff] font-sans max-w-[428px] mx-auto relative pb-[80px]">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3">
          {/* FULL-WIDTH STICKY HEADER – DO NOT REMOVE OR WRAP IN CONTAINER */}
          <button type="button" onClick={() => navigate(-1)} className="p-1 mr-3 -ml-1 rounded-full hover:bg-[#F3F4F6] transition-colors text-[#6B7280] shrink-0">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-[20px] font-bold tracking-tight text-[#1F2937]">Create Site</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-2 py-6 space-y-5 pt-[72px]">
        <div className="bg-white rounded-md shadow-sm border border-transparent p-2 space-y-4">
          <div>
            <label className="block text-sm font-bold text-[#1F2937] mb-1">Site Name *</label>
            <input
              type="text"
              {...register('siteName')}
              className="w-full px-2 py-2 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm box-border"
              placeholder="e.g. Downtown Highrise"
            />
            {errors.siteName && <p className="mt-1 text-xs font-semibold text-red-500">{errors.siteName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-[#1F2937] mb-1">Site Code *</label>
            <input
              type="text"
              {...register('siteCode')}
              className="w-full px-2 py-2 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm box-border"
              placeholder="e.g. DT-001"
            />
            {errors.siteCode && <p className="mt-1 text-xs font-semibold text-red-500">{errors.siteCode.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-[#1F2937] mb-1">Address *</label>
            <textarea
              {...register('address')}
              rows={3}
              className="w-full px-2 py-2 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm box-border resize-none"
              placeholder="Full site address..."
            />
            {errors.address && <p className="mt-1 text-xs font-semibold text-red-500">{errors.address.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-[#1F2937] mb-1">Assign Manager</label>
            <select
              {...register('managerId')}
              className="w-full px-2 py-2 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm box-border bg-white"
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
              className="w-full px-2 py-2 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm box-border bg-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Sticky Submit Button */}
        <div className="mt-4 w-full px-2">
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="w-full text-base font-bold shadow-sm"
          >
            {isSubmitting ? 'Creating...' : 'Create Site'}
          </Button>
        </div></form>
    </div>
  );
}
