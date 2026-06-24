import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Search, ArrowLeft, Plus, Minus } from "lucide-react";
import { inventoryService } from "../../services/inventory";
import { ownerService } from "../../services/owner";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";
import Loader from "../../components/common/Loader";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";

export default function Inventory() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [siteDetails, setSiteDetails] = useState(null);
  const [materialsMaster, setMaterialsMaster] = useState([]);
  const [inventoryMap, setInventoryMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [adjustModal, setAdjustModal] = useState({
    isOpen: false,
    type: "",
    material: null,
    quantity: "",
  });
  const [isAdjusting, setIsAdjusting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const masterData = await ownerService.getMaterials({ limit: 1000 });
      const allMaterials = masterData.materials || masterData;
      setMaterialsMaster(allMaterials);

      const invData = await inventoryService.getSiteInventory(siteId);

      setSiteDetails({
        siteName:
          invData?.siteId?.siteName || invData?.siteName || "Unknown Site",
        siteCode: invData?.siteId?.siteCode || invData?.siteCode || "N/A",
      });

      const invMap = {};
      if (invData?.items) {
        invData.items.forEach((item) => {
          invMap[item.materialId._id || item.materialId] = {
            quantity: item.quantity,
            minStockLevel: item.minStockLevel || 10,
          };
        });
      }
      setInventoryMap(invMap);
    } catch (error) {
      toast.error("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (siteId) fetchData();
  }, [siteId]);

  const groupedMaterials = useMemo(() => {
    const groups = {};

    materialsMaster.forEach((mat) => {
      const q = searchQuery.toLowerCase();
      const name = (mat.materialName || mat.name || "").toLowerCase();
      if (q && !name.includes(q)) return;

      const stockInfo = inventoryMap[mat._id];
      if (!stockInfo) return;

      let cat = mat.category || "Other";
      cat = cat.trim();
      if (cat === "") cat = "Other";
      cat = cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();

      if (!groups[cat]) {
        groups[cat] = [];
      }

      groups[cat].push({
        ...mat,
        quantity: stockInfo.quantity,
        minStockLevel: stockInfo.minStockLevel,
      });
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === "Other" || a === "Uncategorized") return 1;
      if (b === "Other" || b === "Uncategorized") return -1;
      return a.localeCompare(b);
    });

    const sortedGroups = {};
    sortedKeys.forEach((k) => {
      sortedGroups[k] = groups[k];
    });

    return sortedGroups;
  }, [materialsMaster, inventoryMap, searchQuery]);

  const getRolePrefix = () => (user ? `/${user.role}` : "");

  const handleMaterialClick = (materialId) => {
    navigate(
      `${getRolePrefix()}/inventory/${siteId}/material/${materialId}/history`,
    );
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustModal.quantity || adjustModal.quantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }
    try {
      setIsAdjusting(true);
      const payload = {
        siteId,
        materials: [
          {
            materialId: adjustModal.material._id,
            materialName:
              adjustModal.material.materialName || adjustModal.material.name,
            quantity: Number(adjustModal.quantity),
            unit: adjustModal.material.unit,
          },
        ],
        notes: "",
      };

      if (adjustModal.type === "received") {
        payload.receivedDate = new Date().toISOString();
        payload.entryNo = `RCV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
        await inventoryService.createReceivedEntry(payload);
      } else {
        payload.usedDate = new Date().toISOString();
        payload.entryNo = `USE-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
        const currentStock = adjustModal.material.quantity || 0;
        if (Number(adjustModal.quantity) > currentStock) {
          toast.error(`Only ${currentStock} available at this site.`);
          setIsAdjusting(false);
          return;
        }
        await inventoryService.createUsedEntry(payload);
      }

      toast.success(
        `${adjustModal.type === "received" ? "Received" : "Used"} entry created!`,
      );
      setAdjustModal({ isOpen: false, type: "", material: null, quantity: "" });
      fetchData();
    } catch (error) {
      toast.error("Failed to create entry");
    } finally {
      setIsAdjusting(false);
    }
  };

  if (loading) return <Loader size="lg" className="mt-20" />;

  return (
    <>
      {/* ===== FULL-WIDTH STICKY HEADER ===== */}
      <header className="fixed-div sticky top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-[#E5E7EB] overflow-x-hidden">
        <div className="px-4 pt-3 pb-2 flex flex-col gap-1.5">
          <div className="flex items-center w-full">
            <button
              onClick={() => navigate(-1)}
              className="p-1 mr-2 rounded-full hover:bg-[#F3F4F6] transition-colors text-[#6B7280]"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-[#1F2937]">
              {siteDetails?.siteName || "Unknown Site"}
            </h1>
          </div>

          <div className="w-full mb-1.5">
            <div className="flex overflow-x-auto hide-scrollbar gap-2">
              <button className="flex-1 bg-[#2563EB] text-white font-medium text-xs whitespace-nowrap py-2 px-2 rounded-md shrink-0 text-center">
                Inventory
              </button>
              <button
                className="flex-1 bg-[#F3F4F6] text-[#1F2937] font-medium text-xs whitespace-nowrap py-2 px-2 rounded-md shrink-0 hover:bg-[#E5E7EB] transition-colors text-center"
                onClick={() =>
                  navigate(`${getRolePrefix()}/create-order`, {
                    state: { siteId },
                  })
                }
              >
                Request
              </button>
              <button
                className="flex-1 bg-[#F3F4F6] text-[#1F2937] font-medium text-xs whitespace-nowrap py-2 px-2 rounded-md shrink-0 hover:bg-[#E5E7EB] transition-colors text-center"
                onClick={() =>
                  navigate(`${getRolePrefix()}/inventory/received/create`, {
                    state: { siteId },
                  })
                }
              >
                Received
              </button>
              <button
                className="flex-1 bg-[#F3F4F6] text-[#1F2937] font-medium text-xs whitespace-nowrap py-2 px-2 rounded-md shrink-0 hover:bg-[#E5E7EB] transition-colors text-center"
                onClick={() =>
                  navigate(`${getRolePrefix()}/inventory/used/create`, {
                    state: { siteId },
                  })
                }
              >
                Used
              </button>
            </div>
          </div>

          <div className="flex gap-2 items-center w-full">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
            {(user?.role === "owner" || user?.role === "manager") && (
              <button
                onClick={() => navigate(`${getRolePrefix()}/materials`)}
                className="shrink-0 bg-[#2563EB] text-white px-3 py-2 rounded-md font-medium text-sm flex items-center justify-center hover:bg-[#1D4ED8] transition-colors"
                style={{ minHeight: "36px" }}
              >
                + Add
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT – EXACTLY MATCHES DASHBOARD ===== */}
      <div className="flex flex-col  space-y-4 max-w-[428px] mx-auto px-4 pb-4 pt-3">
        <div className="pt-0">
          {Object.keys(groupedMaterials).length === 0 ? (
            <div className="text-center py-10 bg-[#f8faff] rounded-lg border border-dashed border-[#E5E7EB]">
              <p className="text-sm font-medium text-[#6B7280]">
                No materials found.
              </p>
            </div>
          ) : (
            <div className="flex flex-col space-y-2">
              {Object.keys(groupedMaterials).map((category, index) => (
                <div key={index} className="flex flex-col space-y-1">
                  <h2 className="text-xs font-bold text-[#1F2937] tracking-tight">
                    {category === "Other" ? "Materials" : category}
                  </h2>
                  <div className="flex flex-col space-y-2.5">
                    {groupedMaterials[category].map((mat) => (
                      <div
                        key={mat._id}
                        className="bg-slate-50 rounded-lg px-2 py-1 shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer group active:scale-[0.98]"
                        onClick={() => handleMaterialClick(mat._id)}
                      >
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-sm text-[#1F2937] leading-tight group-hover:text-[#2563EB] transition-colors">{mat.materialName || mat.name}</h3>
                          <span className="text-sm font-bold text-[#1F2937]">
                            {mat.quantity}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-[8px] font-medium bg-[#10B981] text-white px-1 py-0.5 rounded shadow-sm">
                            {mat.unit}
                          </p>
                          <div className="flex gap-2.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setAdjustModal({
                                  isOpen: true,
                                  type: "received",
                                  material: mat,
                                  quantity: ""
                                });
                              }}
                              className="p-1 bg-[#2563EB] text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                              <Plus className="w-3 h-3 stroke-[3]" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setAdjustModal({
                                  isOpen: true,
                                  type: "used",
                                  material: mat,
                                  quantity: ""
                                });
                              }}
                              className="p-1 bg-[#EF4444] text-white rounded-md hover:bg-red-600 transition-colors"
                            >
                              <Minus className="w-3 h-3 stroke-[3]" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== FIXED ACTION BUTTONS ===== */}
      <div className="fixed bottom-[56px] left-0 right-0 z-40 flex justify-center pointer-events-none">
        <div className="w-full bg-white border-t border-[#E5E7EB] px-3 pt-3 pb-3 flex justify-between gap-2 pointer-events-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]" style={{ maxWidth: '428px' }}>
          <button
            className="flex-1 bg-[#10B981] text-white font-bold py-3 px-1 rounded-md hover:bg-emerald-600 transition-colors flex justify-center items-center whitespace-nowrap border border-[#10B981]"
            onClick={() =>
              navigate(`${getRolePrefix()}/create-order`, { state: { siteId } })
            }
          >
            <span className="text-[12px] tracking-wider">REQUEST</span>
          </button>
          <button
            className="flex-1 bg-[#2563EB] text-white font-bold py-3 px-1 rounded-md hover:bg-blue-700 transition-colors flex justify-center items-center whitespace-nowrap"
            onClick={() =>
              navigate(`${getRolePrefix()}/inventory/received/create`, {
                state: { siteId },
              })
            }
          >
            <span className="text-[12px] tracking-wider">RECEIVED</span>
          </button>
          <button
            className="flex-1 bg-[#EF4444] text-white font-bold py-3 px-1 rounded-md hover:bg-red-700 transition-colors flex justify-center items-center whitespace-nowrap"
            onClick={() =>
              navigate(`${getRolePrefix()}/inventory/used/create`, {
                state: { siteId },
              })
            }
          >
            <span className="text-[12px] tracking-wider">USED</span>
          </button>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={adjustModal.isOpen}
        onClose={() =>
          setAdjustModal({
            isOpen: false,
            type: "",
            material: null,
            quantity: "",
          })
        }
        title={`${adjustModal.type === "received" ? "Add Received" : "Deduct Used"} Stock`}
      >
        <form onSubmit={handleAdjustSubmit} className="pt-2">
          <p className="capitalize text-[#6B7280] mb-4 font-medium">
            {adjustModal.material?.materialName || adjustModal.material?.name}
          </p>
          <div className="mb-4">
            <label className="block text-sm font-bold text-[#1F2937] mb-1">
              Quantity ({adjustModal.material?.unit})
            </label>
            <input
              type="number"
              step="any"
              value={adjustModal.quantity}
              onChange={(e) =>
                setAdjustModal({ ...adjustModal, quantity: e.target.value })
              }
              className="w-full px-2 py-2 border border-transparent rounded-md focus:ring-2 focus:ring-[#2563EB] shadow-sm"
              placeholder="Enter quantity"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setAdjustModal({
                  isOpen: false,
                  type: "",
                  material: null,
                  quantity: "",
                })
              }
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isAdjusting}
              className={`${adjustModal.type === "received" ? "bg-[#10B981] hover:bg-[#10B981]" : "bg-[#EF4444] hover:bg-[#EF4444]"} text-white py-2.5 px-2 rounded-md`}
            >
              {adjustModal.type === "received" ? "Add Stock" : "Deduct Stock"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
