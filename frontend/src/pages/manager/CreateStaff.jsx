import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { managerService } from '../../services/manager';
import Button from '../../components/common/Button';
import SiteMultiSelect from '../../components/common/SiteMultiSelect';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

const staffSchema = yup.object().shape({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email format').required('Email is required'),
  mobile: yup.string().matches(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits').required('Mobile is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  assignedSites: yup.array().of(yup.string()).transform((value, originalValue) => {
    if (typeof originalValue === 'string') {
      return originalValue ? [originalValue] : [];
    }
    return value;
  }).nullable()
});

export default function CreateStaff() {
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(staffSchema),
    defaultValues: { assignedSites: [] }
  });

  const onSubmit = async (data) => {
    try {
      if (!data.assignedSites) data.assignedSites = [];
      await managerService.createStaff(data);
      toast.success('Staff created successfully!');
      navigate(-1);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create staff');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8faff] font-sans max-w-[428px] mx-auto relative min-h-0">
      <div className="sticky top-0 z-30 bg-white border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3 px-4 py-3">
          <button type="button" onClick={() => navigate(-1)} className="p-1.5 bg-[#F3F4F6] text-[#6B7280] rounded-full hover:bg-[#F3F4F6] transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[20px] font-bold tracking-tight text-[#1F2937]">Create Staff</h1>
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
            <label className="block text-sm font-bold text-[#1F2937] mb-1">Password *</label>
            <input
              type="password"
              {...register('password')}
              className="mt-1 block w-full rounded-md border-[#E5E7EB] shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] sm:text-sm p-2 border"
            />
            {errors.password && <p className="mt-1 text-sm text-[#EF4444]">{errors.password.message}</p>}
          </div>

          <SiteMultiSelect 
            role="manager" 
            register={register} 
            error={errors.assignedSites} 
            availableSites={null}
            disabled={false}
            required={true}
          />
        </div>

        <div className="fixed bottom-[56px] left-0 right-0 z-30 flex justify-center pointer-events-none">
          <div className="w-full bg-white border-t border-[#E5E7EB] p-3 pointer-events-auto" style={{ maxWidth: '428px' }}>
            <Button type="submit" className="w-full bg-[#2563EB] text-white font-medium py-3 rounded-md hover:bg-blue-700 transition-colors" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Staff'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
