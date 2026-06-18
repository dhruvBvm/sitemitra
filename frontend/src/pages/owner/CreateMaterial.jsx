import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ownerService } from '../../services/owner';
import Button from '../../components/common/Button';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

const createMaterialSchema = yup.object().shape({
  materialName: yup.string().required('Material Name is required'),
  category: yup.string().nullable().optional(),
  unit: yup.string().required('Unit is required')
});

export default function CreateMaterial() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(createMaterialSchema)
  });

  const onSubmit = async (data) => {
    try {
      await ownerService.createMaterial(data);
      toast.success('Material created successfully!');
      navigate(-1);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create material');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8faff] font-sans w-full max-w-[428px] mx-auto relative pb-24 px-4">
      {/* Fixed Header */}
      <div className="fixed top-14 left-0 right-0 max-w-[428px] mx-auto z-30 bg-white border-b border-[#E5E7EB] shadow-sm px-4 py-[12px] flex items-center">
        <button type="button" onClick={() => navigate(-1)} className="p-1 mr-3 -ml-1 rounded-full hover:bg-[#F3F4F6] transition-colors text-[#6B7280] shrink-0">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-[20px] font-bold tracking-tight text-[#1F2937]">Create Material</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 w-full pb-6 pt-[80px]">
        <div className="bg-white rounded-[20px] shadow-sm border border-transparent p-4 w-full flex flex-col gap-4">
          <div className="w-full">
            <label className="block text-sm font-bold text-[#1F2937] mb-1">Material Name *</label>
            <input
              type="text"
              {...register('materialName')}
              className="block w-full px-3 py-3 border border-transparent rounded-[16px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm"
              placeholder="e.g. Cement (ACC 43 Grade)"
            />
            {errors.materialName && <p className="mt-1 text-xs font-semibold text-red-500">{errors.materialName.message}</p>}
          </div>

          <div className="w-full">
            <label className="block text-sm font-bold text-[#1F2937] mb-1">Category</label>
            <input
              type="text"
              {...register('category')}
              className="block w-full px-3 py-3 border border-transparent rounded-[16px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm"
              placeholder="e.g. CIVIL WORKS"
            />
          </div>

          <div className="w-full">
            <label className="block text-sm font-bold text-[#1F2937] mb-1">Unit *</label>
            <input
              type="text"
              {...register('unit')}
              className="block w-full px-3 py-3 border border-transparent rounded-[16px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm"
              placeholder="e.g. Bags, Tons, Nos, Sqft"
            />
            {errors.unit && <p className="mt-1 text-xs font-semibold text-red-500">{errors.unit.message}</p>}
          </div>
        </div>

        <div className="fixed bottom-[64px] left-0 right-0 max-w-[428px] mx-auto bg-white border-t border-[#E5E7EB] p-4 z-40 shadow-[0_-8px_15px_-3px_rgba(0,0,0,0.1)]">
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="w-full bg-[#2563EB] hover:bg-[#2563EB] text-white font-bold py-[14px] text-base rounded-[8px]"
          >
            {isSubmitting ? 'Saving...' : 'Save Material'}
          </Button>
        </div>
      </form>
    </div>
  );
}
