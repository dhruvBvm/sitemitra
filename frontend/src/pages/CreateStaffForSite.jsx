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
    <div className="flex flex-col min-h-screen bg-[#f8faff] font-sans max-w-[428px] mx-auto relative pb-24">
      {/* Sticky Header */}
      <div className="fixed top-14 left-1/2 -translate-x-1/2 w-full max-w-[428px] z-40 bg-white shadow-sm px-4 py-3 flex items-center justify-between border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 bg-[#F3F4F6] text-[#6B7280] rounded-full hover:bg-[#F3F4F6] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[1.1rem] font-bold tracking-tight text-[#1F2937]">Create New Staff</h1>
        </div>
      </div>

      <div className="p-4 space-y-4 pt-[72px]">
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-[20px] shadow-sm border border-transparent p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1F2937] mb-1">Name</label>
            <input
              type="text"
              {...register('name')}
              className="w-full px-3 py-2 border border-transparent rounded-[16px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              placeholder="Full Name"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1F2937] mb-1">Email</label>
            <input
              type="email"
              {...register('email')}
              className="w-full px-3 py-2 border border-transparent rounded-[16px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              placeholder="email@example.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1F2937] mb-1">Mobile</label>
            <input
              type="tel"
              {...register('mobile')}
              className="w-full px-3 py-2 border border-transparent rounded-[16px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              placeholder="Mobile Number"
            />
            {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1F2937] mb-1">Password</label>
            <input
              type="password"
              {...register('password')}
              className="w-full px-3 py-2 border border-transparent rounded-[16px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              placeholder="Password"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          
          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full mt-4 py-3 font-bold"
          >
            {isSubmitting ? 'Creating...' : 'Create and Add to Site'}
          </Button>
        </form>
      </div>
    </div>
  );
}
