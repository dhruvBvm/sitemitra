import { useForm } from 'react-hook-form';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { Briefcase, Lock, User } from 'lucide-react';
import Button from '../components/common/Button';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

const loginSchema = yup.object().shape({
  email: yup.string().required('Email/Mobile is required'),
  password: yup.string().required('Password is required'),
});

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(loginSchema)
  });
  const { login, isLoading, user } = useAuthStore();
  const navigate = useNavigate();

  // If already logged in, redirect
  if (user) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  const onSubmit = async (data) => {
    try {
      const loggedInUser = await login(data);
      toast.success('Login successful!');
      // Directly navigate to dashboard
      window.location.href = `/${loggedInUser.role}/dashboard`;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    }
  };

  return (
    <div className="flex-1 min-h-screen flex items-center justify-center bg-[#f8faff] p-4 w-full">
      <div className="w-full bg-white p-6 rounded-2xl shadow-md border border-transparent">
        <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Briefcase className="h-8 w-8 text-[#2563EB]" />
          </div>
          <h2 className="text-2xl font-bold text-[#1F2937] tracking-tight">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-[#6B7280] font-medium">
            Sign in to access your ERP dashboard
          </p>
        </div>
        
        <form className="mt-8 space-y-6 animate-in fade-in duration-1000 delay-150" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-1">
                Email or Mobile
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  {...register('email')}
                  className="appearance-none block w-full pl-10 px-2 py-2 border border-transparent rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[#2563EB] focus:border-[#2563EB] text-sm transition-colors"
                  placeholder="owner@example.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  {...register('password')}
                  className="appearance-none block w-full pl-10 px-2 py-2 border border-transparent rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[#2563EB] focus:border-[#2563EB] text-sm transition-colors"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full py-2 text-base px-2 rounded-md"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </div>
          
          <div className="text-center text-xs text-[#6B7280] mt-4">
            <p>Demo accounts: owner@ / manager@ / staff@ (any password)</p>
          </div>
        </form>
      </div>
    </div>
  );
}
