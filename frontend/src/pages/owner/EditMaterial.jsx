import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ownerService } from '../../services/owner';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

const editMaterialSchema = yup.object().shape({
  materialName: yup.string().required('Material Name is required'),
  category: yup.string().nullable().optional(),
  unit: yup.string().required('Unit is required')
});

export default function EditMaterial() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(editMaterialSchema)
  });

  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        const data = await ownerService.getMaterial(id);
        const mat = data.material || data;
        setValue('materialName', mat.materialName || mat.name);
        setValue('category', mat.category || '');
        setValue('unit', mat.unit || '');
      } catch (error) {
        toast.error('Failed to load material details');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterial();
  }, [id, setValue, navigate]);

  const onSubmit = async (data) => {
    try {
      await ownerService.updateMaterial(id, data);
      toast.success('Material updated successfully!');
      navigate(-1);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update material');
    }
  };

  if (loading) {
    return <Loader size="lg" className="mt-20" />;
  }

  return (
    <div className="flex flex-col h-full bg-[#f8faff] font-sans max-w-[428px] mx-auto relative min-h-0">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3 px-4 py-3">
          <button type="button" onClick={() => navigate(-1)} className="p-1.5 bg-[#F3F4F6] text-[#6B7280] rounded-full hover:bg-[#F3F4F6] transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[20px] font-bold tracking-tight text-[#1F2937]">Edit Material</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-4 flex-1 overflow-y-auto pt-3 space-y-4 pb-24">
        <div>
          <label className="block text-sm font-bold text-[#1F2937] mb-1">Material Name *</label>
          <input
            type="text"
            {...register('materialName')}
            className="mt-1 block w-full rounded-md border-[#E5E7EB] shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] sm:text-sm p-2 border"
            placeholder="e.g. Cement (ACC 43 Grade)"
          />
          {errors.materialName && <p className="mt-1 text-xs font-semibold text-red-500">{errors.materialName.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-[#1F2937] mb-1">Category</label>
          <input
            type="text"
            {...register('category')}
            className="mt-1 block w-full rounded-md border-[#E5E7EB] shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] sm:text-sm p-2 border"
            placeholder="e.g. CIVIL WORKS"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-[#1F2937] mb-1">Unit *</label>
          <input
            type="text"
            {...register('unit')}
            className="mt-1 block w-full rounded-md border-[#E5E7EB] shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] sm:text-sm p-2 border"
            placeholder="e.g. Bags, Tons, Nos, Sqft"
          />
          {errors.unit && <p className="mt-1 text-xs font-semibold text-red-500">{errors.unit.message}</p>}
        </div>

        {/* Fixed Submit Button */}
        <div className="fixed bottom-[56px] left-0 right-0 z-30 flex justify-center pointer-events-none">
          <div className="w-full bg-white border-t border-[#E5E7EB] p-3 pointer-events-auto" style={{ maxWidth: '428px' }}>
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="w-full bg-[#2563EB] text-white font-medium py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Update Material'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
