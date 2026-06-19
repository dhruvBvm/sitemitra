import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Card, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Plus, Trash2, Upload, Camera, ArrowLeft, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { staffService } from '../../services/staff';
import { uploadMaterialImages } from '../../services/upload';
import Loader from '../../components/common/Loader';
import { useAuthStore } from '../../store/authStore';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

const createOrderSchema = yup.object().shape({
  siteId: yup.string().required('Site is required'),
  orderDate: yup.string().required('Date is required'),
  materials: yup.array().of(
    yup.object().shape({
      materialId: yup.string().optional(),
      name: yup.string().optional().trim(),
      qty: yup.number()
        .transform((value, originalValue) => originalValue === "" ? null : value)
        .nullable()
        .optional()
        .test('qty-required', 'Quantity is required if material is selected', function (value) {
          const { name } = this.parent;
          if (name && name.trim() !== '') {
            return value !== null && value !== undefined && !isNaN(value) && value > 0;
          }
          return true;
        }),
      unit: yup.string().optional().trim()
        .test('unit-required', 'Unit is required if material is selected', function (value) {
          const { name } = this.parent;
          if (name && name.trim() !== '') {
            return value && value.trim() !== '';
          }
          return true;
        })
    })
  ).optional(),
  notes: yup.string().optional().trim()
});

export default function CreateOrder() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefilledSiteId = location.state?.siteId || '';
  const preselectedMaterial = location.state?.preselectedMaterial || null;
  const user = useAuthStore(state => state.user);

  const { register, handleSubmit, control, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(createOrderSchema),
    defaultValues: {
      siteId: prefilledSiteId,
      orderDate: new Date().toISOString().split('T')[0],
      materials: preselectedMaterial ? [{
        materialId: preselectedMaterial._id,
        name: preselectedMaterial.materialName || preselectedMaterial.name,
        qty: '',
        unit: preselectedMaterial.unit
      }] : [{ materialId: '', name: '', qty: '', unit: '' }],
      notes: ''
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "materials"
  });

  const [requestNo, setRequestNo] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [materialImages, setMaterialImages] = useState({}); // {index: File[]}
  const [sites, setSites] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [materialUploadsLoading, setMaterialUploadsLoading] = useState({});

  useEffect(() => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSeq = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    setRequestNo(`REQ-${dateStr}-${randomSeq}`);
  }, []);

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [sitesData, materialsData] = await Promise.all([
          staffService.getSites(),
          staffService.getAvailableMaterials()
        ]);
        setSites(Array.isArray(sitesData) ? sitesData : []);
        setMaterials(Array.isArray(materialsData) ? materialsData : []);
      } catch (error) {
        toast.error('Failed to load form data');
      } finally {
        setPageLoading(false);
      }
    };
    fetchDropdowns();
  }, []);

  const handleOrderImageChange = (e) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files).filter(f => f instanceof File && f.type.startsWith('image/'));
      const total = imageFiles.length + selected.length;
      if (total > 5) {
        toast.error(`Max 5 images allowed. You have ${imageFiles.length}.`);
        return;
      }
      setImageFiles(prev => [...prev, ...selected]);
      e.target.value = '';
    }
  };

  const handleMaterialImageChange = async (e, fieldId) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      const existing = materialImages[fieldId] || [];
      if (existing.length + selected.length > 5) {
        toast.error('Max 5 images per material allowed.');
        return;
      }

      setMaterialUploadsLoading(prev => ({ ...prev, [fieldId]: true }));
      try {
        const formData = new FormData();
        selected.forEach(file => formData.append('images', file));
        const resp = await uploadMaterialImages(formData);
        if (resp?.success && Array.isArray(resp.urls)) {
          setMaterialImages(prev => ({ ...prev, [fieldId]: [...existing, ...resp.urls] }));
          toast.success('Specifications/Photos uploaded');
        } else {
          toast.error('Upload failed');
        }
      } catch (err) {
        toast.error('Upload failed');
      } finally {
        setMaterialUploadsLoading(prev => ({ ...prev, [fieldId]: false }));
      }
      e.target.value = '';
    }
  };

  const handleRemoveMaterialImage = (fieldId, indexToRemove) => {
    setMaterialImages(prev => ({
      ...prev,
      [fieldId]: prev[fieldId].filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleRemoveOrderImage = (indexToRemove) => {
    setImageFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const onSubmit = async (data) => {
    try {
      const materialsPayload = data.materials.map((m, idx) => {
        if (!m.name || !m.qty) return null;
        const fieldId = fields[idx]?.id;
        return {
          materialId: m.materialId,
          materialName: m.name,
          quantity: Number(m.qty),
          unit: m.unit,
          imageUrls: materialImages[fieldId] || []
        };
      }).filter(Boolean);

      if (materialsPayload.length === 0 && imageFiles.length === 0) {
        toast.error('Please add materials or attach order photos.');
        return;
      }

      const formData = new FormData();
      formData.append('requestNo', requestNo);
      formData.append('siteId', data.siteId);
      formData.append('requestDate', data.orderDate);
      formData.append('notes', data.notes || '');

      imageFiles.forEach(file => formData.append('orderImages', file));

      if (materialsPayload.length > 0) {
        formData.append('materials', JSON.stringify(materialsPayload));
      }

      // Submit unified photo order endpoint which accepts materials + general images
      await staffService.createPhotoOrder(formData);

      toast.success('Request submitted successfully!');
      const rolePath = user?.role === 'owner' ? '/owner/transactions' : user?.role === 'manager' ? '/manager/transactions' : '/staff/requests';
      navigate(rolePath);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submission failed');
    }
  };

  if (pageLoading) return <Loader size="lg" className="mt-20" />;

  return (
    <div className="w-full bg-[#f8faff] min-h-screen pb-28 font-sans pb-[80px]">
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 w-full flex flex-col">
        <div className="sticky top-[56px] left-0 right-0 mx-auto max-w-[428px] z-30 bg-white border-b border-gray-200 overflow-x-hidden">
          <div className="max-w-[428px] mx-auto px-3 py-2 flex flex-col gap-1.5">
            {/* FULL-WIDTH STICKY HEADER – DO NOT REMOVE OR WRAP IN CONTAINER */}
            <div className="flex items-center mb-2">
              <button type="button" onClick={() => navigate(-1)} className="p-1 mr-2 rounded-full hover:bg-blue-100 transition-colors flex items-center justify-center shrink-0">
                <ArrowLeft className="w-5 h-5 text-[#1F2937]" />
              </button>
              <h1 className="text-[18px] font-bold text-[#1F2937] tracking-tight">Create Request</h1>
            </div>

            <div className="space-y-2">
              <input type="text" readOnly value={requestNo} className="w-full px-2 py-2 border border-blue-200 rounded-md bg-blue-100/50 text-[#6B7280] font-medium text-sm outline-none cursor-not-allowed" />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[12px] font-bold text-[#1F2937] mb-1">Date</label>
                  <input
                    type="date"
                    {...register('orderDate')}
                    className="w-full px-2 py-2 border border-transparent rounded-md bg-[#f8faff] text-[#1F2937] focus:ring-2 focus:ring-[#2563EB] box-border text-[13px]"
                  />
                  {errors.orderDate && <p className="text-red-500 text-[10px] mt-0.5 absolute -bottom-4">{errors.orderDate.message}</p>}
                </div>
                <div className="relative">
                  <label className="block text-[12px] font-bold text-[#1F2937] mb-1">Site *</label>
                  <select
                    {...register('siteId')}
                    className={`w-full px-2 py-2 border border-transparent rounded-md bg-[#f8faff] text-[#1F2937] focus:ring-2 focus:ring-[#2563EB] box-border text-[13px] ${prefilledSiteId ? 'pointer-events-none opacity-80' : ''}`}
                    tabIndex={prefilledSiteId ? -1 : 0}
                  >
                    <option value="">Select a site</option>
                    {sites.map(site => (
                      <option key={site._id} value={site._id}>{site.siteName}</option>
                    ))}
                  </select>
                  {errors.siteId && <p className="text-red-500 text-[10px] mt-0.5 absolute -bottom-4">{errors.siteId.message}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 max-w-[428px] w-full mx-auto px-2 pt-3">

          {/* Materials List */}
          <div>
            <div className="flex justify-between items-center mb-2 px-1">
              <h3 className="text-lg font-bold text-[#1F2937] tracking-wide">Materials</h3>
            </div>

            <div className="flex flex-col space-y-2">
              {fields.map((field, index) => (
                <Card key={field.id} className="shadow-sm border-[#E5E7EB] relative overflow-visible rounded-md">
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(index)} className="absolute -top-2 -right-2 z-10 text-red-500 bg-white border border-red-200 shadow-sm p-1.5 rounded-full hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <CardContent className="p-2">
                    <div className="mb-2">
                      <span className="text-sm font-bold text-[#2563EB]">Item {index + 1}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      <div className="w-full">
                        <select
                          {...register(`materials.${index}.name`)}
                          onChange={(e) => {
                            const selected = materials.find(m => m.materialName === e.target.value);
                            setValue(`materials.${index}.unit`, selected?.unit || '');
                            setValue(`materials.${index}.materialId`, selected?._id || '');
                          }}
                          className="w-full px-2 py-2 text-sm border border-transparent rounded-md focus:ring-2 focus:ring-[#2563EB] box-border"
                        >
                          <option value="">Select Material</option>
                          {materials.map(m => {
                            const name = m.materialName || '';
                            const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
                            return (
                              <option key={m._id} value={m.materialName} className="capitalize">
                                {capitalized}
                              </option>
                            );
                          })}
                        </select>
                        {errors.materials?.[index]?.name && (
                          <p className="text-red-500 text-xs mt-1 font-semibold pl-1">{errors.materials[index].name.message}</p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 w-full">
                        <div className="w-full">
                          <input
                            type="number"
                            {...register(`materials.${index}.qty`)}
                            placeholder="Qty"
                            className="w-full px-2 py-2 text-sm border border-transparent rounded-md focus:ring-2 focus:ring-[#2563EB] box-border"
                            style={{ WebkitAppearance: 'none', margin: 0, MozAppearance: 'textfield' }}
                          />
                          {errors.materials?.[index]?.qty && (
                            <p className="text-red-500 text-xs mt-1 font-semibold pl-1">{errors.materials[index].qty.message}</p>
                          )}
                        </div>
                        <div className="w-full">
                          <input
                            type="text"
                            readOnly
                            placeholder="Unit"
                            {...register(`materials.${index}.unit`)}
                            className="w-full px-2 py-2 text-sm border border-transparent rounded-md bg-[#F3F4F6] text-[#6B7280] outline-none box-border cursor-not-allowed"
                          />
                          {errors.materials?.[index]?.unit && (
                            <p className="text-red-500 text-xs mt-1 font-semibold pl-1">{errors.materials[index].unit.message}</p>
                          )}
                        </div>
                      </div>

                      {/* Specs & Photos */}
                      <div className="pt-2 border-t border-slate-100 mt-1 w-full">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          id={`matImg${field.id}`}
                          className="hidden"
                          onChange={(e) => handleMaterialImageChange(e, field.id)}
                        />
                        <label
                          htmlFor={`matImg${field.id}`}
                          className="cursor-pointer flex items-center justify-center w-full text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8] bg-blue-50 px-2 py-2 rounded-md border border-blue-100 border-dashed"
                        >
                          <Camera className="w-5 h-5 mr-2" />
                          Add Specifications & Photo {(materialImages[field.id]?.length || 0) > 0 && `(${materialImages[field.id].length})`}
                        </label>

                        {materialUploadsLoading[field.id] && (
                          <p className="text-xs text-[#6B7280] mt-2 animate-pulse text-center">Uploading...</p>
                        )}

                        {materialImages[field.id]?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3 w-full">
                            {materialImages[field.id].map((url, i) => (
                              <div key={i} className="relative w-[80px] h-[80px] rounded-md border border-transparent shrink-0">
                                <img src={url} alt="spec" className="w-full h-full object-cover rounded-md" />
                                <button type="button" onClick={() => handleRemoveMaterialImage(field.id, i)} className="absolute -top-1.5 -right-1.5 bg-[#EF4444] text-white rounded-full p-0.5 shadow">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button type="button" variant="outline" className="w-full mt-3 border-dashed border-2 border-[#E5E7EB] text-[#6B7280] bg-white py-2.5 px-2 rounded-md" onClick={() => append({ materialId: '', name: '', qty: '', unit: '' })}>
              <Plus className="w-5 h-5 mr-1" /> Add Material
            </Button>
          </div>

          {/* Global Images */}
          <Card className="shadow-sm border-[#E5E7EB]">
            <CardContent className="p-2 w-full">
              <h3 className="text-sm font-bold text-[#1F2937] mb-2">Order Images (Optional)</h3>
              <input
                type="file"
                accept="image/*"
                multiple
                id="globalImages"
                className="hidden"
                onChange={handleOrderImageChange}
              />
              <label htmlFor="globalImages" className="cursor-pointer flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#E5E7EB] rounded-md bg-[#f8faff] hover:bg-[#F3F4F6] transition-colors w-full box-border">
                <Upload className="w-8 h-8 text-[#2563EB] mb-2" />
                <span className="text-sm font-bold text-[#6B7280] text-center">Upload Handwritten List or Bill</span>
              </label>
              {imageFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 w-full">
                  {imageFiles.map((f, i) => (
                    <div key={i} className="relative w-[80px] h-[80px] bg-[#F3F4F6] rounded-md border border-transparent shrink-0">
                      <img src={URL.createObjectURL(f)} alt="order" className="w-full h-full object-cover rounded-md" />
                      <button type="button" onClick={() => handleRemoveOrderImage(i)} className="absolute -top-1.5 -right-1.5 bg-[#EF4444] text-white rounded-full p-0.5 shadow">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-[#E5E7EB]">
            <CardContent className="p-2 w-full">
              <div className="w-full">
                <label className="block text-sm font-bold text-[#1F2937] mb-1">Notes</label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="w-full px-2 py-2 border border-transparent rounded-md focus:ring-2 focus:ring-[#2563EB] box-border"
                  placeholder="Any additional details..."
                />
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 w-full px-2">
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="w-full bg-[#2563EB] hover:bg-[#2563EB] text-white font-bold py-[14px] text-base rounded-[8px] py-2.5 px-2"
            >
              Create Request
            </Button>
          </div>
        </div></form>
    </div>
  );
}
