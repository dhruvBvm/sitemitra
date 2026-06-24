import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { managerService } from '../services/manager';
import { ownerService } from '../services/owner';
import { useAuthStore } from '../store/authStore';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

const createStaffSchema = yup.object().shape({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  mobile: yup.string().matches(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits').required('Mobile is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  role: yup.string().default('staff')
});
import Button from '../components/common/Button';

export default function CreateStaffForSite() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isOwner = user?.role === 'owner';
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(createStaffSchema),
    defaultValues: { role: 'staff' }
  });

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      const payload = { ...data, assignedSites: [siteId], siteId };
      
      if (isOwner) {
        await ownerService.createStaff(payload);
      } else {
        await managerService.createStaff(payload);
      }
      
      toast.success('Staff created and added to site');
      navigate(`/sites/${siteId}`);
    } catch (error) {
      const serverErrorMsg = error.response?.data?.message;
      const validationErrors = error.response?.data?.errors;
      if (validationErrors && Array.isArray(validationErrors)) {
        toast.error(validationErrors.map(e => e.msg || e.message || 'Invalid value').join(', '));
      } else if (serverErrorMsg) {
        toast.error(serverErrorMsg);
      } else {
        toast.error('Failed to create user');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8faff] font-sans max-w-[428px] mx-auto relative min-h-0">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-1.5 bg-[#F3F4F6] text-[#6B7280] rounded-full hover:bg-[#F3F4F6] transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[20px] font-bold tracking-tight text-[#1F2937]">Create New Staff</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-4 flex-1 overflow-y-auto pt-3 pb-24">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[#1F2937] mb-1">Name</label>
            <input
              type="text"
              {...register('name')}
              className="mt-1 block w-full rounded-md border-[#E5E7EB] shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] sm:text-sm p-2 border"
              placeholder="Full Name"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-[#1F2937] mb-1">Email</label>
            <input
              type="email"
              {...register('email')}
              className="mt-1 block w-full rounded-md border-[#E5E7EB] shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] sm:text-sm p-2 border"
              placeholder="email@example.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-[#1F2937] mb-1">Mobile</label>
            <input
              type="tel"
              {...register('mobile')}
              className="w-full px-2 py-2 border border-[#E5E7EB] shadow-sm rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] sm:text-sm"
              placeholder="Mobile Number"
            />
            {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-[#1F2937] mb-1">Password</label>
            <input
              type="password"
              {...register('password')}
              className="mt-1 block w-full rounded-md border-[#E5E7EB] shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] sm:text-sm p-2 border"
              placeholder="Password"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
        </div>
        
        <div className="fixed bottom-[56px] left-0 right-0 z-30 flex justify-center pointer-events-none">
          <div className="w-full bg-white border-t border-[#E5E7EB] p-3 pointer-events-auto" style={{ maxWidth: '428px' }}>
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full bg-[#2563EB] text-white font-medium py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create and Add to Site'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
