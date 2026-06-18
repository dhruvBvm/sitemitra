import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Card, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Plus, Trash2, Upload, Camera, ArrowLeft, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { staffService } from '../../services/staff';
import { inventoryService } from '../../services/inventory';
import { uploadMaterialImages } from '../../services/upload';
import Loader from '../../components/common/Loader';
import { useAuthStore } from '../../store/authStore';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

const createReceivedSchema = yup.object().shape({
  siteId: yup.string().required('Site is required'),
  grnNumber: yup.string().optional(),
  receivedDate: yup.string().required('Date is required'),
  supplierName: yup.string().optional(),
  challanNo: yup.string().optional(),
  vehicleNo: yup.string().optional(),
  materials: yup.array().of(
    yup.object().shape({
      materialId: yup.string().optional(),
      name: yup.string().optional(),
      qty: yup.number().transform((value, originalValue) => originalValue === "" ? null : value).nullable().optional(),
      unit: yup.string().optional()
    })
  ).optional(),
  notes: yup.string().optional()
});

export default function CreateReceivedEntry() {
  const location = useLocation();
  const prefilledSiteId = location.state?.siteId || '';
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);

  const { register, handleSubmit, control, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(createReceivedSchema),
    defaultValues: {
      siteId: prefilledSiteId,
      grnNumber: `GRN-${Date.now().toString().slice(-6)}`,
      receivedDate: new Date().toISOString().split('T')[0],
      supplierName: '',
      challanNo: '',
      vehicleNo: '',
      materials: [{ materialId: '', name: '', qty: '', unit: '' }],
      notes: ''
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "materials"
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [materialImages, setMaterialImages] = useState({}); // {index: File[]}
  const [sites, setSites] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [materialUploadsLoading, setMaterialUploadsLoading] = useState({});

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [sitesData, materialsData] = await Promise.all([
          inventoryService.getSites(),
          staffService.getAvailableMaterials()
        ]);
        const finalSites = Array.isArray(sitesData) ? sitesData : (sitesData?.data || []);
        const finalMats = Array.isArray(materialsData) ? materialsData : (materialsData?.data || []);

        let filteredSites = finalSites;
        if (user?.role === 'manager' && Array.isArray(user.assignedSites)) {
          filteredSites = finalSites.filter(site => user.assignedSites.includes(site.siteId || site._id));
        }
        setSites(filteredSites);
        setMaterials(finalMats);
      } catch (error) {
        toast.error('Failed to load form data');
      } finally {
        setPageLoading(false);
      }
    };
    fetchDropdowns();
  }, [user]);

  const handleEntryImageChange = (e) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files).filter(f => f instanceof File && f.type.startsWith('image/'));
      if (imageFiles.length + selected.length > 5) {
        toast.error(`Max 5 images allowed.`);
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
          toast.success('Photos uploaded');
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
        if (!m.materialId || !m.qty) return null;
        const fieldId = fields[idx]?.id;
        return {
          materialId: m.materialId,
          materialName: m.name,
          quantity: Number(m.qty),
          unit: m.unit,
          imageUrls: materialImages[fieldId] || []
        };
      }).filter(Boolean);

      if (materialsPayload.length === 0) {
        toast.error('Please add at least one material.');
        return;
      }

      if (!data.siteId) {
        toast.error('Please select a site.');
        return;
      }

      // Just reuse the base logic or wait, upload via inventory service expects images separate? 
      // The current backend accepts `imageUrls` via `req.body` directly? Yes, but `uploadMaterialImages` handles files.
      // Wait, inventoryService.createReceivedEntry accepts JSON object with imageUrls. I need to upload them first.
      let uploadedUrls = [];
      if (imageFiles.length > 0) {
        const uploadData = new FormData();
        imageFiles.forEach(f => uploadData.append('images', f));
        const resp = await uploadMaterialImages(uploadData);
        if (resp?.success) {
          uploadedUrls = resp.urls;
        }
      }

      await inventoryService.createReceivedEntry({
        siteId: data.siteId,
        receivedDate: data.receivedDate,
        notes: data.notes || '',
        supplierName: data.supplierName || '',
        challanNo: data.challanNo || '',
        vehicleNo: data.vehicleNo || '',
        materials: materialsPayload,
        imageUrls: uploadedUrls
      });

      toast.success('Received entry created successfully!');
      navigate(-1);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create entry');
    }
  };

  if (pageLoading) return <Loader size="lg" className="mt-20" />;

  return (
    <div className="flex flex-col min-h-screen max-w-[428px] mx-auto overflow-x-hidden pb-28 bg-[#f8faff] relative">
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1">
        <div className="sticky top-0 z-40 bg-[#f8fafc] px-4 pt-4 pb-2">
          <div className="bg-green-50 shadow-sm border border-green-200 rounded-[20px] p-[14px]">
            <div className="flex items-center mb-3">
              <button type="button" onClick={() => navigate(-1)} className="p-2 mr-2 -ml-2 rounded-full hover:bg-green-100 transition-colors flex items-center justify-center shrink-0">
                <ArrowLeft className="w-6 h-6 text-[#1F2937]" />
              </button>
              <h1 className="text-xl font-bold text-[#1F2937] tracking-tight">Record Received</h1>
            </div>

            <div className="space-y-3">
              <input type="text" readOnly {...register('grnNumber')} className="w-full px-3 py-2 border border-green-200 rounded-[16px] bg-green-100/50 text-[#6B7280] font-medium text-sm outline-none cursor-not-allowed" />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1F2937] mb-1">Date</label>
                  <input
                    type="date"
                    {...register('receivedDate')}
                    className="w-full px-3 py-2 border border-transparent rounded-[16px] bg-white text-[#1F2937] focus:ring-2 focus:ring-[#2563EB] box-border text-sm"
                  />
                  {errors.receivedDate && <p className="text-red-500 text-[10px] mt-0.5 absolute -bottom-4">{errors.receivedDate.message}</p>}
                </div>
                <div className="relative">
                  <label className="block text-xs font-bold text-[#1F2937] mb-1">Site *</label>
                  <select
                    {...register('siteId', { required: 'Site is required' })}
                    className={`w-full px-3 py-2 border border-transparent rounded-[16px] bg-white text-[#1F2937] focus:ring-2 focus:ring-[#2563EB] box-border text-sm ${prefilledSiteId ? 'pointer-events-none opacity-80 bg-[#f8faff]' : ''}`}
                    tabIndex={prefilledSiteId ? -1 : 0}
                  >
                    <option value="">Select a site</option>
                    {sites.map(site => (
                      <option key={site.siteId || site._id} value={site.siteId || site._id}>{site.siteName}</option>
                    ))}
                  </select>
                  {errors.siteId && <p className="text-red-500 text-[10px] mt-0.5 absolute -bottom-4">{errors.siteId.message}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-4 pt-1 mt-2">

          <Card className="shadow-sm border-[#E5E7EB]">
            <CardContent className="p-3">
              <label className="block text-sm font-bold text-[#1F2937] mb-1">Supplier Name</label>
              <input
                type="text"
                placeholder="Enter supplier name"
                {...register('supplierName')}
                className="w-full px-3 py-3 border border-transparent rounded-[16px] focus:ring-2 focus:ring-[#10B981] box-border text-sm"
              />
            </CardContent>
          </Card>

          <div>
            <div className="flex justify-between items-center mb-2 px-1">
              <h3 className="text-lg font-bold text-[#1F2937] tracking-wide">Materials</h3>
            </div>

            <div className="flex flex-col space-y-3">
              {fields.map((field, index) => (
                <Card key={field.id} className="shadow-sm border-[#E5E7EB] relative overflow-visible rounded-[20px]">
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(index)} className="absolute -top-2 -right-2 z-10 text-red-500 bg-white border border-red-200 shadow-sm p-1.5 rounded-full hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <CardContent className="p-[14px]">
                    <div className="mb-2">
                      <span className="text-sm font-bold text-[#10B981]">Item {index + 1}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="w-full">
                        <select
                          {...register(`materials.${index}.materialId`, {
                            onChange: (e) => {
                              const selected = materials.find(m => m._id === e.target.value);
                              setValue(`materials.${index}.unit`, selected?.unit || '');
                              setValue(`materials.${index}.name`, selected?.materialName || '');
                            }
                          })}
                          className="w-full px-3 py-3 text-sm border border-transparent rounded-[16px] focus:ring-2 focus:ring-[#10B981] box-border"
                        >
                          <option value="">Select Material</option>
                          {materials.map(m => (
                            <option key={m._id} value={m._id}>{m.materialName}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-4 w-full">
                        <div className="w-full">
                          <input
                            type="number"
                            {...register(`materials.${index}.qty`)}
                            placeholder="Qty"
                            className="w-full px-3 py-3 text-sm border border-transparent rounded-[16px] focus:ring-2 focus:ring-[#10B981] box-border"
                            style={{ WebkitAppearance: 'none', margin: 0, MozAppearance: 'textfield' }}
                          />
                        </div>
                        <div className="w-full">
                          <input
                            type="text"
                            readOnly
                            placeholder="Unit"
                            {...register(`materials.${index}.unit`)}
                            className="w-full px-3 py-3 text-sm border border-transparent rounded-[16px] bg-[#F3F4F6] text-[#6B7280] outline-none box-border cursor-not-allowed"
                          />
                        </div>
                      </div>

                      {/* Photos */}
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
                          className="cursor-pointer flex items-center justify-center w-full text-sm font-bold text-[#10B981] hover:text-[#10B981] bg-green-50 px-3 py-3 rounded-[16px] border border-green-100 border-dashed"
                        >
                          <Camera className="w-5 h-5 mr-2" />
                          Add Photos {(materialImages[field.id]?.length || 0) > 0 && `(${materialImages[field.id].length})`}
                        </label>

                        {materialUploadsLoading[field.id] && (
                          <p className="text-xs text-[#6B7280] mt-2 animate-pulse text-center">Uploading...</p>
                        )}

                        {materialImages[field.id]?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3 w-full">
                            {materialImages[field.id].map((url, i) => (
                              <div key={i} className="relative w-[80px] h-[80px] rounded-[16px] border border-transparent shrink-0">
                                <img src={url} alt="spec" className="w-full h-full object-cover rounded-[16px]" />
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

            <Button type="button" variant="outline" className="w-full mt-3 border-dashed border-2 border-[#E5E7EB] text-[#6B7280] bg-white py-2.5 px-4 rounded-[16px]" onClick={() => append({ materialId: '', name: '', qty: '', unit: '' })}>
              <Plus className="w-5 h-5 mr-1" /> Add Material
            </Button>
          </div>

          <Card className="shadow-sm border-[#E5E7EB]">
            <CardContent className="p-3 space-y-4 w-full">
              <div className="flex flex-col gap-4 w-full">
                <div className="w-full">
                  <label className="block text-sm font-bold text-[#1F2937] mb-1">Challan No.</label>
                  <input
                    type="text"
                    {...register('challanNo')}
                    className="w-full px-3 py-3 border border-transparent rounded-[16px] focus:ring-2 focus:ring-[#10B981] box-border"
                  />
                </div>
                <div className="w-full">
                  <label className="block text-sm font-bold text-[#1F2937] mb-1">Vehicle No.</label>
                  <input
                    type="text"
                    {...register('vehicleNo')}
                    className="w-full px-3 py-3 border border-transparent rounded-[16px] focus:ring-2 focus:ring-[#10B981] box-border"
                  />
                </div>
              </div>

              <div className="w-full">
                <label className="block text-sm font-bold text-[#1F2937] mb-2">Challan / Bill Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  id="globalImages"
                  className="hidden"
                  onChange={handleEntryImageChange}
                />
                <label htmlFor="globalImages" className="cursor-pointer flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#E5E7EB] rounded-[16px] bg-[#f8faff] hover:bg-[#F3F4F6] transition-colors w-full box-border">
                  <Upload className="w-8 h-8 text-[#10B981] mb-2" />
                  <span className="text-sm font-bold text-[#6B7280] text-center">Upload Photos</span>
                </label>
                {imageFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 w-full">
                    {imageFiles.map((f, i) => (
                      <div key={i} className="relative w-[80px] h-[80px] bg-[#F3F4F6] rounded-[16px] border border-transparent shrink-0">
                        <img src={URL.createObjectURL(f)} alt="uploaded" className="w-full h-full object-cover rounded-[16px]" />
                        <button type="button" onClick={() => handleRemoveOrderImage(i)} className="absolute -top-1.5 -right-1.5 bg-[#EF4444] text-white rounded-full p-0.5 shadow">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-full">
                <label className="block text-sm font-bold text-[#1F2937] mb-1">Notes</label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="w-full px-3 py-3 border border-transparent rounded-[16px] focus:ring-2 focus:ring-[#10B981] box-border"
                  placeholder="Remarks..."
                />
              </div>
            </CardContent>
          </Card>

          <div className="fixed bottom-[64px] left-0 right-0 max-w-[428px] mx-auto bg-white border-t border-[#E5E7EB] p-4 z-40 shadow-[0_-8px_15px_-3px_rgba(0,0,0,0.1)]">
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="w-full bg-[#2563EB] hover:bg-[#2563EB] text-white font-bold py-[14px] text-base rounded-[8px] py-2.5 px-4"
            >
              Save Received Entry
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}