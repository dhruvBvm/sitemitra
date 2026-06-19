import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ownerService } from '../../services/owner';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import SiteMultiSelect from '../../components/common/SiteMultiSelect';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

const editUserSchema = yup.object().shape({
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

export default function EditUser() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(editUserSchema),
    defaultValues: { assignedSites: [] }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Note: Owner API doesn't have a single getUser endpoint documented in owner.controller.js 
        // wait, getUserById exists! `GET /api/owner/users/:userId` 
        // wait, looking at ownerService.js to see if it exists... 
        // ownerService.js has getUsers but not getUserById maybe?
        const usersData = await ownerService.getUsers({ limit: 1000 });
        const usersList = usersData.users || usersData || [];
        const user = usersList.find(u => u._id === id);

        if (user) {
          setUserRole(user.role);
          reset({
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            status: user.status,
            assignedSites: user.assignedSites?.map(s => s._id || s) || [],
            password: ''
          });
        } else {
          toast.error('User not found');
          navigate(-1);
        }
      } catch (error) {
        toast.error('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, reset, navigate]);

  const onSubmit = async (data) => {
    try {
      if (!data.password) {
        delete data.password;
      }

      // Ensure assignedSites is array
      if (!data.assignedSites) data.assignedSites = [];
      else if (!Array.isArray(data.assignedSites)) data.assignedSites = [data.assignedSites];

      await ownerService.updateUser(id, data);

      toast.success('User updated successfully!');
      navigate(-1);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  };

  if (loading) return <Loader size="lg" className="mt-20" />;

  return (
    <div className="w-full bg-[#f8faff] min-h-screen pb-[80px] font-sans">
      {/* Sticky Header */}
      <div className="sticky top-[56px] left-0 right-0 mx-auto max-w-[428px] z-30 bg-white border-b border-gray-200 overflow-x-hidden">
        <div className="w-full max-w-[428px] mx-auto px-3 py-2 max-w-[428px] mx-auto px-3 py-2 flex flex-col gap-1.5 justify-between">
          {/* FULL-WIDTH STICKY HEADER – DO NOT REMOVE OR WRAP IN CONTAINER */}
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-1.5 bg-[#f8faff] text-[#6B7280] rounded-full hover:bg-[#F3F4F6] transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-[1.1rem] font-bold tracking-tight text-[#1F2937]">Edit User</h1>
          </div>
        </div>
      </div>

      <div className="max-w-[428px] mx-auto px-4">
        <form onSubmit={handleSubmit(onSubmit)} className="py-6 space-y-5">
          <div className="bg-white rounded-md shadow-sm border border-transparent p-2 space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#1F2937] mb-1">Name *</label>
              <input
                type="text"
                {...register('name')}
                className="w-full px-2 py-2 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm box-border"
              />
              {errors.name && <p className="mt-1 text-xs font-semibold text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1F2937] mb-1">Email *</label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-2 py-2 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm box-border"
              />
              {errors.email && <p className="mt-1 text-xs font-semibold text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1F2937] mb-1">Mobile *</label>
              <input
                type="text"
                {...register('mobile')}
                className="w-full px-2 py-2 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm box-border"
              />
              {errors.mobile && <p className="mt-1 text-xs font-semibold text-red-500">{errors.mobile.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1F2937] mb-1">Password (Leave blank to keep unchanged)</label>
              <input
                type="password"
                {...register('password')}
                className="w-full px-2 py-2 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm box-border"
              />
              {errors.password && <p className="mt-1 text-xs font-semibold text-red-500">{errors.password.message}</p>}
            </div>

            <div className="pt-2">
              <SiteMultiSelect
                role="owner"
                register={register}
                error={errors.assignedSites}
                availableSites={null}
                disabled={false}
                required={userRole === 'staff'}
              />
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
              {isSubmitting ? 'Saving...' : 'Update User'}
            </Button>
          </div></form>
      </div>
    </div>
  );
}
