import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import api from "../../api/axios";
import {
  Shirt, Tag, LayoutGrid, Store, Settings, Ruler, Palette,
  Award, FileText, Image, ChevronLeft, X, AlertCircle,
  CheckCircle, CloudUpload, Upload, Plus, Trash2, Star
} from "lucide-react";

const subCategories: Record<string, Record<string, string[]>> = {
  "상의": {
    "티셔츠": ["반팔티", "긴팔티", "나시"],
    "블라우스/셔츠": ["셔츠", "레이스 블라우스"],
    "니트/스웨터": ["가디건", "풀오버", "조끼"],
    "후드/맨투맨": ["후드집업", "크루넥"],
    "재킷/블레이저": ["테일러드", "숏재킷"],
  },
  "하의": {
    "스커트": ["미니", "미디", "롱", "플리츠"],
    "팬츠": ["슬랙스", "청바지", "와이드팬츠"],
    "레깅스": ["기본", "패턴"],
    "반바지": ["숏팬츠", "버뮤다"],
  },
  "원피스/세트": {
    "원피스": ["미니", "미디", "맥시"],
    "점프수트": ["오버올", "롬퍼"],
    "투피스/세트": ["상하의 세트", "수트 세트"],
  },
  "아우터": {
    "코트": ["롱코트", "하프코트", "트렌치"],
    "패딩": ["롱패딩", "숏패딩", "조끼패딩"],
    "점퍼/바람막이": ["야상", "항공점퍼"],
    "가죽/인조가죽": ["라이더재킷"],
  },
  "이너/언더웨어": {
    "이너티": ["민소매", "반팔 이너"],
    "속옷": ["브라", "팬티 세트"],
    "홈웨어": ["파자마", "잠옷 세트"],
  },
  "스포츠/애슬레저": {
    "스포츠 상의": ["스포츠브라", "래쉬가드"],
    "스포츠 하의": ["요가팬츠", "트레이닝팬츠"],
    "스포츠 세트": ["상하의 세트"],
  },
  "액세서리": {
    "가방": ["토트백", "크로스백", "클러치"],
    "모자": ["볼캡", "버킷햇", "베레모"],
    "스카프/머플러": ["실크스카프", "울머플러"],
    "벨트": ["가죽벨트", "체인벨트"],
    "양말/타이즈": ["기본양말", "패턴타이즈"],
  },
  "신발": {
    "힐/펌프스": ["스틸레토", "블록힐"],
    "플랫/로퍼": ["발레리나", "옥스퍼드"],
    "부츠": ["앵클부츠", "롱부츠"],
    "스니커즈": ["캐주얼", "러닝화"],
  },
};

const sizeSystems = ["한국 사이즈 (XS–3XL)", "US 사이즈", "EU 사이즈", "프리사이즈", "넘버 사이즈 (23–29)"];

const sizeOptionsBySystem: Record<string, string[]> = {
  "한국 사이즈 (XS–3XL)": ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
  "US 사이즈": ["XS", "S", "M", "L", "XL", "XXL"],
  "EU 사이즈": ["34", "36", "38", "40", "42", "44", "46"],
  "프리사이즈": ["프리"],
  "넘버 사이즈 (23–29)": ["23", "24", "25", "26", "27", "28", "29"],
};

const certGroups = [
  { label: "국내 인증", items: ["KC 인증", "어린이제품 안전인증", "환경부 환경마크", "GR 우수재활용제품", "섬유품질표시 적합"] },
  { label: "소재 / 환경 인증", items: ["OEKO-TEX Standard 100", "GOTS (유기농 섬유)", "Recycled Content (GRS)", "비건 인증", "Fair Trade"] },
];

interface OptionValue {
  optionName: string;
  optionValue: string;
  sortOrder: number;
}

interface ProductOption {
  optionLabel: string;
  sku: string;
  stockQuantity: string;
  additionalPrice: string;
  restockAlertQuantity: string;
  optionValues: OptionValue[];
}

interface ProductImage {
  file: File;
  previewUrl: string;
  uploadedUrl: string | null;
  isMain: boolean;
}

interface CertFile {
  certName: string;
  files: File[];
  uploadedUrls: string[];
  expiryYear: string;
  expiryMonth: string;
}

function ToggleChip({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void }) {
  return (
      <button type="button" onClick={onToggle}
              className={`py-1.5 px-3 text-xs rounded border transition-colors ${selected ? "bg-primary text-white border-primary" : "border-border text-foreground hover:border-primary hover:text-primary"}`}>
        {label}
      </button>
  );
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
      <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <span className="text-primary">{icon}</span>{children}
      </h2>
  );
}

function CertGroupLabel({ children }: { children: React.ReactNode }) {
  return (
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{children}</span>
        <div className="flex-1 h-px bg-border" />
      </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onCancel}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
          <p className="text-sm text-foreground font-medium mb-6 text-center leading-relaxed">{message}</p>
          <div className="flex gap-2 justify-center">
            <button onClick={onCancel} className="border border-border text-foreground hover:border-primary hover:text-primary px-6 py-2 rounded text-sm font-medium transition-colors">취소</button>
            <button onClick={onConfirm} className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded text-sm font-semibold transition-colors">삭제</button>
          </div>
        </div>
      </div>
  );
}

function CertUploadModal({
                           certName,
                           onSave,
                           onCancel,
                         }: {
  certName: string;
  onSave: (data: { files: File[]; expiryYear: string; expiryMonth: string }) => void;
  onCancel: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [expiryYear, setExpiryYear] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const valid = Array.from(incoming).filter((f) =>
        ["application/pdf", "image/jpeg", "image/png"].includes(f.type)
    );
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...valid.filter((f) => !names.has(f.name))];
    });
  };

  const removeFile = (name: string) => setFiles((p) => p.filter((f) => f.name !== name));

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onCancel}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">인증서 업로드</p>
              <h3 className="text-base font-bold text-foreground">{certName}</h3>
            </div>
            <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors mt-0.5"><X size={18} /></button>
          </div>
          <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-7 text-center cursor-pointer transition-colors mb-4 ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary hover:bg-muted/20"}`}
          >
            <CloudUpload size={26} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-foreground mb-1">파일을 드래그하거나 클릭하여 업로드</p>
            <p className="text-xs text-muted-foreground">PDF, JPG, PNG · 최대 10MB</p>
            <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => addFiles(e.target.files)} />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-1.5">인증서 유효기간</label>
            <div className="flex items-center gap-2">
              <select value={expiryYear} onChange={(e) => setExpiryYear(e.target.value)} className="border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors flex-1">
                <option value="">년도</option>
                {Array.from({ length: 10 }, (_, i) => (
                    <option key={i} value={String(2025 + i)}>{2025 + i}년</option>
                ))}
              </select>
              <select value={expiryMonth} onChange={(e) => setExpiryMonth(e.target.value)} className="border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors flex-1">
                <option value="">월</option>
                {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1).padStart(2, "0")}>{String(i + 1).padStart(2, "0")}월</option>
                ))}
              </select>
            </div>
          </div>
          {files.length > 0 && (
              <ul className="space-y-2 mb-4">
                {files.map((f) => (
                    <li key={f.name} className="flex items-center justify-between bg-muted/30 border border-border rounded px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={14} className="text-primary flex-shrink-0" />
                        <span className="text-xs text-foreground truncate">{f.name}</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                      </div>
                      <button onClick={() => removeFile(f.name)} className="text-muted-foreground hover:text-red-500 transition-colors ml-2 flex-shrink-0"><X size={13} /></button>
                    </li>
                ))}
              </ul>
          )}
          <div className="flex gap-2 justify-end">
            <button onClick={onCancel} className="border border-border text-foreground hover:border-primary hover:text-primary px-5 py-2 rounded text-sm font-medium transition-colors">취소</button>
            <button
                onClick={() => onSave({ files, expiryYear, expiryMonth })}
                disabled={files.length === 0}
                className="bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded text-sm font-semibold transition-colors flex items-center gap-1.5"
            >
              <Upload size={14} /> 저장
            </button>
          </div>
        </div>
      </div>
  );
}

const initialForm = {
  productName: "", engName: "", season: "", mainCategory: "", subCategory: "",
  moq: "", unitPrice: "", leadTime: "", mainMaterial: "",
  description: "", careInstruction: "", oemAvailable: false, sampleAvailable: false, whiteLabel: false,
};

const newOption = (): ProductOption => ({
  optionLabel: "", sku: "", stockQuantity: "", additionalPrice: "0", restockAlertQuantity: "",
  optionValues: [
    { optionName: "색상", optionValue: "", sortOrder: 1 },
    { optionName: "패턴", optionValue: "", sortOrder: 2 },
  ],
});

export function SellerProductRegister() {
  const [submitted, setSubmitted] = useState(false);
  const [categories, setCategories] = useState<{ id: number; name: string; group: string }[]>([]);
  const [brands, setBrands] = useState<{ brandId: number; brandName: string }[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [form, setForm] = useState(initialForm);
  const [selectedSubTypes, setSelectedSubTypes] = useState<string[]>([]);
  const [selectedSizeSystem, setSelectedSizeSystem] = useState<string>("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);
  const [certFiles, setCertFiles] = useState<Record<string, CertFile>>({});
  const [certModalTarget, setCertModalTarget] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);
  const [options, setOptions] = useState<ProductOption[]>([newOption()]);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const dragIdx = useRef<number | null>(null);
  const dragOverIdx = useRef<number | null>(null);

  useEffect(() => {
    api.get("/categories/main").then(res => setCategories(res));
    api.get("/company/brands").then(res => setBrands(res));
  }, []);

  const update = (field: string, value: string | boolean) => setForm((p) => ({ ...p, [field]: value }));
  const toggleItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) =>
      setList((p) => (p.includes(item) ? p.filter((x) => x !== item) : [...p, item]));

  const currentSubGroups = form.mainCategory ? (subCategories[form.mainCategory] ?? {}) : {};
  const currentSubTypes = form.subCategory ? currentSubGroups[form.subCategory] ?? [] : [];

  const handleMainCategoryChange = (val: string) => {
    update("mainCategory", val);
    const selected = categories.find(c => c.name === val);
    setSelectedCategoryId(selected?.id ?? null);
    update("subCategory", "");
    setSelectedSubTypes([]);
  };

  const handleSubCategoryChange = (val: string) => {
    update("subCategory", val);
    setSelectedSubTypes([]);
  };

  const updateOption = (idx: number, field: keyof ProductOption, value: string) =>
      setOptions(prev => prev.map((o, i) => i === idx ? { ...o, [field]: value } : o));

  const addOption = () => setOptions(prev => [...prev, newOption()]);
  const removeOption = (idx: number) => setOptions(prev => prev.filter((_, i) => i !== idx));

  const handleImageFiles = async (files: FileList | null) => {
    if (!files) return;
    const valid = Array.from(files).filter(f =>
        ["image/jpeg", "image/png", "image/webp"].includes(f.type)
    );
    const remaining = 8 - productImages.length;
    const toAdd = valid.slice(0, remaining);
    if (toAdd.length === 0) return;

    setImageUploading(true);
    const results = await Promise.all(
        toAdd.map(async (file) => {
          const previewUrl = URL.createObjectURL(file);
          try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await api.post("/upload/image", formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            return { file, previewUrl, uploadedUrl: res as string, isMain: false };
          } catch {
            return { file, previewUrl, uploadedUrl: null, isMain: false };
          }
        })
    );
    setProductImages(prev => {
      const updated = [...prev, ...results];
      if (updated.length > 0 && !updated.some(img => img.isMain)) {
        updated[0] = { ...updated[0], isMain: true };
      }
      return updated;
    });
    setImageUploading(false);
  };

  const removeImage = (idx: number) => {
    setProductImages(prev => {
      URL.revokeObjectURL(prev[idx].previewUrl);
      const updated = prev.filter((_, i) => i !== idx);
      if (prev[idx].isMain && updated.length > 0) {
        updated[0] = { ...updated[0], isMain: true };
      }
      return updated;
    });
  };

  const setMainImage = (idx: number) => {
    setProductImages(prev => prev.map((img, i) => ({ ...img, isMain: i === idx })));
  };

  const handleDragStart = (idx: number) => { dragIdx.current = idx; };
  const handleDragEnter = (idx: number) => { dragOverIdx.current = idx; };
  const handleDragEnd = () => {
    if (dragIdx.current === null || dragOverIdx.current === null) return;
    if (dragIdx.current === dragOverIdx.current) return;
    setProductImages(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(dragIdx.current!, 1);
      updated.splice(dragOverIdx.current!, 0, moved);
      return updated;
    });
    dragIdx.current = null;
    dragOverIdx.current = null;
  };

  const handleCertSave = async (data: { files: File[]; expiryYear: string; expiryMonth: string }) => {
    if (!certModalTarget) return;
    console.log("인증서 저장 시작:", certModalTarget, data.files);  // 여기
    try {
      const uploadedUrls = await Promise.all(
          data.files.map(async (file) => {
            const formData = new FormData();
            formData.append("file", file);
            const res = await api.post("/upload/pdf", formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            return res as string;
          })
      );
      console.log("업로드된 URLs:", uploadedUrls);

      setCertFiles((prev) => ({
        ...prev,
        [certModalTarget]: {
          certName: certModalTarget,
          files: data.files,
          uploadedUrls,
          expiryYear: data.expiryYear,
          expiryMonth: data.expiryMonth,
        },
      }));
    } catch {
      alert("인증서 업로드 중 오류가 발생했습니다.");
    }
    setCertModalTarget(null);
  };

  const resetAll = () => {
    setForm(initialForm);
    setSelectedSubTypes([]);
    setSelectedSizeSystem("");
    setSelectedSizes([]);
    setSelectedCerts([]);
    setCertFiles({});
    setOptions([newOption()]);
    setProductImages([]);
  };

  const handleRegisterSubmit = async () => {
    if (!form.productName || !form.mainCategory || !form.subCategory || !form.moq || !form.unitPrice || !form.mainMaterial || !form.description) {
      alert("필수 입력 사항(*)을 모두 기재해 주세요.");
      return;
    }
    const mainImg = productImages.find(img => img.isMain);
    const otherImgs = productImages.filter(img => !img.isMain);
    const orderedImgs = mainImg ? [mainImg, ...otherImgs] : productImages;

    const payload = {
      categoryId: selectedCategoryId,
      brandId: selectedBrandId,
      productName: form.productName,
      productEngName: form.engName,
      season: form.season,
      moq: form.moq ? parseInt(form.moq) : null,
      unitPrice: form.unitPrice ? parseInt(form.unitPrice) : null,
      mainMaterial: form.mainMaterial,
      description: form.description,
      careInstruction: form.careInstruction,
      oemAvailable: form.oemAvailable,
      sampleAvailable: form.sampleAvailable,
      whiteLabel: form.whiteLabel,
      imageUrls: orderedImgs.map(img => img.uploadedUrl).filter(Boolean),
      options: options.map(o => ({
        optionLabel: o.optionLabel,
        sku: o.sku || null,
        stockQuantity: o.stockQuantity ? parseInt(o.stockQuantity) : 0,
        additionalPrice: o.additionalPrice ? parseInt(o.additionalPrice) : 0,
        restockAlertQuantity: o.restockAlertQuantity ? parseInt(o.restockAlertQuantity) : null,
        optionValues: o.optionValues.filter(v => v.optionValue),
      })),
      certifications: Object.values(certFiles).map((c) => ({
        certName: c.certName,
        fileUrls: c.uploadedUrls,
        expiryYear: c.expiryYear,
        expiryMonth: c.expiryMonth,
      })),
    };

    try {
      await api.post("/products", payload);
      setSubmitted(true);
    } catch (error) {
      console.error("제품 등록 실패:", error);
      alert("제품 등록 처리 중 문제가 발생했습니다. 관리자에게 문의하세요.");
    }
  };

  if (submitted) {
    return (
        <div className="max-w-[580px] mx-auto px-4 py-16 text-center">
          <div className="bg-white border border-border rounded-lg p-10">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={36} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">제품이 등록되었습니다</h2>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              관리자 검토 후 <strong>1~2 영업일 이내</strong>에 제품이 플랫폼에 게시됩니다.<br />
              셀러 페이지에서 등록 제품을 확인하실 수 있습니다.
            </p>
            <div className="flex justify-center gap-3">
              <Link to="/seller" className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded font-semibold text-sm transition-colors">셀러 페이지로</Link>
              <button onClick={() => { resetAll(); setSubmitted(false); }} className="border border-border text-foreground hover:border-primary hover:text-primary px-6 py-2.5 rounded text-sm font-medium transition-colors">추가 등록</button>
            </div>
          </div>
        </div>
    );
  }

  return (
      <div className="max-w-[900px] mx-auto px-4 py-8">
        {certModalTarget && (
            <CertUploadModal
                certName={certModalTarget}
                onSave={handleCertSave}
                onCancel={() => { toggleItem(selectedCerts, setSelectedCerts, certModalTarget); setCertModalTarget(null); }}
            />
        )}
        {confirmTarget && (
            <ConfirmModal
                message="등록된 인증서를 삭제하시겠습니까?"
                onConfirm={() => {
                  toggleItem(selectedCerts, setSelectedCerts, confirmTarget);
                  setCertFiles(prev => {
                    const updated = { ...prev };
                    delete updated[confirmTarget];
                    return updated;
                  });
                  setConfirmTarget(null);
                }}
                onCancel={() => setConfirmTarget(null)}
            />
        )}

        <div className="bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-white rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Shirt size={26} />
            <h1 className="text-2xl font-bold">제품 등록</h1>
          </div>
          <p className="text-white/75 text-sm">TradeKR 플랫폼에 K-Fashion 제품을 등록하세요. 전 세계 바이어에게 노출됩니다.</p>
        </div>

        <Link to="/seller" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-5">
          <ChevronLeft size={14} /> 셀러 페이지로
        </Link>

        <div className="space-y-5">

          {/* 1. 이미지 업로드 */}
          <div className="bg-white border border-border rounded-lg p-6">
            <SectionTitle icon={<Image size={17} />}>제품 이미지 업로드</SectionTitle>
            <input ref={imageInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleImageFiles(e.target.files)} />
            <div
                className={`bg-muted/30 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${productImages.length < 8 ? "hover:border-primary cursor-pointer" : "opacity-50 cursor-not-allowed"} border-border`}
                onClick={() => productImages.length < 8 && imageInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleImageFiles(e.dataTransfer.files); }}
            >
              {imageUploading ? (
                  <p className="text-sm text-primary font-medium animate-pulse">업로드 중...</p>
              ) : (
                  <>
                    <CloudUpload size={28} className="mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-foreground font-medium mb-1">
                      {productImages.length >= 8 ? "최대 8장 업로드 완료" : "이미지를 드래그하거나 클릭하여 업로드"}
                    </p>
                    <p className="text-xs text-muted-foreground">JPG, PNG, WEBP 지원 · 최대 10MB · {productImages.length}/8장</p>
                  </>
              )}
            </div>

            {productImages.length > 0 && (
                <>
                  <p className="text-xs text-muted-foreground mt-4 mb-2">드래그로 순서 변경 · ★ 클릭으로 대표 이미지 설정</p>
                  <div className="grid grid-cols-4 gap-3">
                    {productImages.map((img, idx) => (
                        <div
                            key={idx}
                            draggable
                            onDragStart={() => handleDragStart(idx)}
                            onDragEnter={() => handleDragEnter(idx)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                            className="relative group aspect-square rounded-lg overflow-hidden border-2 transition-colors cursor-grab active:cursor-grabbing"
                            style={{ borderColor: img.isMain ? "var(--primary)" : "var(--border)" }}
                        >
                          <img src={img.previewUrl} alt={`product-${idx}`} className="w-full h-full object-cover" />
                          {img.isMain && (
                              <span className="absolute top-1 left-1 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded font-medium">대표</span>
                          )}
                          {img.uploadedUrl === null && (
                              <span className="absolute bottom-1 left-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded">실패</span>
                          )}
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                            <button type="button" onClick={() => setMainImage(idx)}
                                    className={`p-1.5 rounded-full transition-colors ${img.isMain ? "bg-primary text-white" : "bg-white/90 text-foreground hover:bg-primary hover:text-white"}`}
                                    title="대표 이미지로 설정">
                              <Star size={12} fill={img.isMain ? "currentColor" : "none"} />
                            </button>
                            <button type="button" onClick={() => removeImage(idx)}
                                    className="bg-white/90 hover:bg-red-500 hover:text-white text-foreground rounded-full p-1.5 transition-colors"
                                    title="삭제">
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                    ))}
                  </div>
                </>
            )}

            <div className="flex items-start gap-2 mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              ★ 버튼으로 대표 이미지를 직접 선택할 수 있습니다. 착장 컷 + 플랫레이 컷 혼용 권장 (1000×1000px 이상)
            </div>
          </div>

          {/* 2. 카테고리 */}
          <div className="bg-white border border-border rounded-lg p-6">
            <SectionTitle icon={<LayoutGrid size={17} />}>카테고리</SectionTitle>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">대분류 <span className="text-red-500">*</span></label>
                <select value={form.mainCategory} onChange={(e) => handleMainCategoryChange(e.target.value)} className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors">
                  <option value="">선택하세요</option>
                  {categories.map(c => (<option key={c.id} value={c.name}>{c.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">중분류 <span className="text-red-500">*</span></label>
                <select value={form.subCategory} onChange={(e) => handleSubCategoryChange(e.target.value)} disabled={!form.mainCategory} className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors disabled:opacity-50">
                  <option value="">{form.mainCategory ? "선택하세요" : "대분류를 먼저 선택하세요"}</option>
                  {Object.keys(currentSubGroups).map((g) => (<option key={g} value={g}>{g}</option>))}
                </select>
              </div>
            </div>
            {currentSubTypes.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">세부 유형 (복수 선택 가능)</p>
                  <div className="flex flex-wrap gap-2">
                    {currentSubTypes.map((item) => (
                        <ToggleChip key={item} label={item} selected={selectedSubTypes.includes(item)} onToggle={() => toggleItem(selectedSubTypes, setSelectedSubTypes, item)} />
                    ))}
                  </div>
                </div>
            )}
          </div>

          {/* 3. 기본 제품 정보 */}
          <div className="bg-white border border-border rounded-lg p-6">
            <SectionTitle icon={<Tag size={17} />}>기본 제품 정보</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1.5">제품명 (한국어) <span className="text-red-500">*</span></label>
                <input type="text" value={form.productName} onChange={(e) => update("productName", e.target.value)} placeholder="예: 오버사이즈 린넨 셔츠 블라우스" className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">제품명 (영어)</label>
                <input type="text" value={form.engName} onChange={(e) => update("engName", e.target.value)} placeholder="Oversized Linen Shirt Blouse" className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">브랜드</label>
                <select value={selectedBrandId ?? ""} onChange={(e) => setSelectedBrandId(e.target.value ? Number(e.target.value) : null)} className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors">
                  <option value="">선택하세요</option>
                  {brands.map(b => (<option key={b.brandId} value={b.brandId}>{b.brandName}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">시즌</label>
                <select value={form.season} onChange={(e) => update("season", e.target.value)} className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors">
                  <option value="">선택하세요</option>
                  <option>SS (봄/여름)</option>
                  <option>FW (가을/겨울)</option>
                  <option>상시</option>
                </select>
              </div>
            </div>
          </div>

          {/* 4. 사이즈 & 소재 */}
          <div className="bg-white border border-border rounded-lg p-6">
            <SectionTitle icon={<Ruler size={17} />}>사이즈 & 소재</SectionTitle>
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">사이즈 시스템</p>
              <div className="flex flex-wrap gap-2">
                {sizeSystems.map((item) => (
                    <ToggleChip key={item} label={item} selected={selectedSizeSystem === item}
                                onToggle={() => { setSelectedSizeSystem(prev => prev === item ? "" : item); setSelectedSizes([]); }} />
                ))}
              </div>
            </div>
            {selectedSizeSystem && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">제공 사이즈</p>
                  <div className="flex flex-wrap gap-2">
                    {(sizeOptionsBySystem[selectedSizeSystem] ?? []).map((item) => (
                        <ToggleChip key={item} label={item} selected={selectedSizes.includes(item)}
                                    onToggle={() => toggleItem(selectedSizes, setSelectedSizes, item)} />
                    ))}
                  </div>
                </div>
            )}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">주요 소재 <span className="text-red-500">*</span></label>
              <input type="text" value={form.mainMaterial} onChange={(e) => update("mainMaterial", e.target.value)} placeholder="예: 면 100%, 폴리에스터 60% + 레이온 40%" className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors" />
            </div>
          </div>

          {/* 5. 보유 인증 */}
          <div className="bg-white border border-border rounded-lg p-6">
            <SectionTitle icon={<Award size={17} />}>보유 인증 / 컴플라이언스</SectionTitle>
            <div className="space-y-4">
              {certGroups.map((group) => (
                  <div key={group.label}>
                    <CertGroupLabel>{group.label}</CertGroupLabel>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map((item) => {
                        const isSelected = selectedCerts.includes(item);
                        const hasCert = !!certFiles[item];
                        return (
                            <div key={item} className="flex items-center gap-1">
                              <button
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) {
                                      setConfirmTarget(item);
                                    } else {
                                      toggleItem(selectedCerts, setSelectedCerts, item);
                                      setCertModalTarget(item);
                                    }
                                  }}
                                  className={`py-1.5 px-3 text-xs border transition-colors rounded flex items-center gap-1 ${isSelected ? "bg-primary text-white border-primary" : "border-border text-foreground hover:border-primary hover:text-primary"}`}
                              >
                                {item}
                                {hasCert && <CheckCircle size={11} className={isSelected ? "text-white" : "text-primary"} />}
                              </button>
                            </div>
                        );
                      })}
                    </div>
                  </div>
              ))}
            </div>
            {/* 업로드된 인증서 목록 */}
            {Object.keys(certFiles).length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-2">업로드된 인증서</p>
                  <ul className="space-y-2">
                    {Object.values(certFiles).map((cert) => (
                        <li key={cert.certName} className="flex items-center justify-between bg-muted/30 border border-border rounded px-3 py-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText size={13} className="text-primary flex-shrink-0" />
                            <span className="text-xs font-medium text-foreground">{cert.certName}</span>
                            <span className="text-xs text-muted-foreground">파일 {cert.files.length}개</span>
                            {cert.expiryYear && cert.expiryMonth && (
                                <span className="text-xs text-muted-foreground">· 유효기간 {cert.expiryYear}.{cert.expiryMonth}</span>
                            )}
                          </div>
                        </li>
                    ))}
                  </ul>
                </div>
            )}
          </div>

          {/* 6. 상품 옵션 */}
          <div className="bg-white border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle icon={<Palette size={17} />}>상품 옵션</SectionTitle>
              <button type="button" onClick={addOption} className="flex items-center gap-1.5 text-xs text-primary border border-primary rounded px-3 py-1.5 hover:bg-primary hover:text-white transition-colors">
                <Plus size={13} /> 옵션 추가
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">옵션 라벨은 조합명(예: 블랙/M), 색상과 패턴은 각각 입력하세요.</p>
            <div className="space-y-4">
              {options.map((opt, optIdx) => (
                  <div key={optIdx} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-foreground">옵션 {optIdx + 1}</span>
                      {options.length > 1 && (
                          <button type="button" onClick={() => removeOption(optIdx)} className="text-muted-foreground hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-foreground mb-1">옵션 라벨 <span className="text-red-500">*</span></label>
                        <input type="text" value={opt.optionLabel} onChange={(e) => updateOption(optIdx, "optionLabel", e.target.value)} placeholder="예: 블랙/M" className="w-full border border-border rounded px-3 py-2 text-sm outline-none focus:border-primary transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">재고 수량 <span className="text-red-500">*</span></label>
                        <input type="number" value={opt.stockQuantity} onChange={(e) => updateOption(optIdx, "stockQuantity", e.target.value)} placeholder="예: 100" className="w-full border border-border rounded px-3 py-2 text-sm outline-none focus:border-primary transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">추가 금액</label>
                        <input type="number" value={opt.additionalPrice} onChange={(e) => updateOption(optIdx, "additionalPrice", e.target.value)} placeholder="예: 0" className="w-full border border-border rounded px-3 py-2 text-sm outline-none focus:border-primary transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">SKU</label>
                        <input type="text" value={opt.sku} onChange={(e) => updateOption(optIdx, "sku", e.target.value)} placeholder="예: BLK-M-001" className="w-full border border-border rounded px-3 py-2 text-sm outline-none focus:border-primary transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">재고 알림 수량</label>
                        <input type="number" value={opt.restockAlertQuantity} onChange={(e) => updateOption(optIdx, "restockAlertQuantity", e.target.value)} placeholder="예: 10" className="w-full border border-border rounded px-3 py-2 text-sm outline-none focus:border-primary transition-colors" />
                      </div>
                    </div>
                    <div className="border-t border-border pt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">옵션 속성값</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs text-muted-foreground">색상</label>
                            <button type="button" onClick={() => setOptions(prev => prev.map((o, i) => i === optIdx
                                ? { ...o, optionValues: [...o.optionValues, { optionName: "색상", optionValue: "", sortOrder: o.optionValues.length + 1 }] }
                                : o
                            ))} className="text-xs text-primary flex items-center gap-0.5 hover:underline">
                              <Plus size={10} /> 추가
                            </button>
                          </div>
                          <div className="space-y-1">
                            {opt.optionValues.filter(v => v.optionName === "색상").map((v, vi) => {
                              const realIdx = opt.optionValues.indexOf(v);
                              return (
                                  <div key={vi} className="flex gap-1 items-center">
                                    <input type="text" value={v.optionValue}
                                           onChange={(e) => setOptions(prev => prev.map((o, i) => i === optIdx
                                               ? { ...o, optionValues: o.optionValues.map((ov, j) => j === realIdx ? { ...ov, optionValue: e.target.value } : ov) }
                                               : o
                                           ))}
                                           placeholder="예: 블랙"
                                           className="flex-1 border border-border rounded px-2 py-1 text-xs outline-none focus:border-primary transition-colors"
                                    />
                                    {opt.optionValues.filter(v => v.optionName === "색상").length > 1 && (
                                        <button type="button" onClick={() => setOptions(prev => prev.map((o, i) => i === optIdx
                                            ? { ...o, optionValues: o.optionValues.filter((_, j) => j !== realIdx) }
                                            : o
                                        ))} className="text-muted-foreground hover:text-red-500 transition-colors">
                                          <X size={11} />
                                        </button>
                                    )}
                                  </div>
                              );
                            })}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs text-muted-foreground">패턴</label>
                            <button type="button" onClick={() => setOptions(prev => prev.map((o, i) => i === optIdx
                                ? { ...o, optionValues: [...o.optionValues, { optionName: "패턴", optionValue: "", sortOrder: o.optionValues.length + 1 }] }
                                : o
                            ))} className="text-xs text-primary flex items-center gap-0.5 hover:underline">
                              <Plus size={10} /> 추가
                            </button>
                          </div>
                          <div className="space-y-1">
                            {opt.optionValues.filter(v => v.optionName === "패턴").map((v, vi) => {
                              const realIdx = opt.optionValues.indexOf(v);
                              return (
                                  <div key={vi} className="flex gap-1 items-center">
                                    <input type="text" value={v.optionValue}
                                           onChange={(e) => setOptions(prev => prev.map((o, i) => i === optIdx
                                               ? { ...o, optionValues: o.optionValues.map((ov, j) => j === realIdx ? { ...ov, optionValue: e.target.value } : ov) }
                                               : o
                                           ))}
                                           placeholder="예: 솔리드"
                                           className="flex-1 border border-border rounded px-2 py-1 text-xs outline-none focus:border-primary transition-colors"
                                    />
                                    {opt.optionValues.filter(v => v.optionName === "패턴").length > 1 && (
                                        <button type="button" onClick={() => setOptions(prev => prev.map((o, i) => i === optIdx
                                            ? { ...o, optionValues: o.optionValues.filter((_, j) => j !== realIdx) }
                                            : o
                                        ))} className="text-muted-foreground hover:text-red-500 transition-colors">
                                          <X size={11} />
                                        </button>
                                    )}
                                  </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
              ))}
            </div>
          </div>

          {/* 7. 제품 상세 설명 */}
          <div className="bg-white border border-border rounded-lg p-6">
            <SectionTitle icon={<FileText size={17} />}>제품 상세 설명</SectionTitle>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">제품 특징 및 스타일링 포인트 <span className="text-red-500">*</span></label>
                <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={4} placeholder="제품의 주요 특징, 핏, 디자인 포인트, 타겟 고객층 등을 기재하세요." className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary resize-none transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">세탁 / 관리 방법</label>
                <textarea value={form.careInstruction} onChange={(e) => update("careInstruction", e.target.value)} rows={2} placeholder="예: 손세탁 권장, 30°C 이하 세탁, 드라이클리닝 가능" className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary resize-none transition-colors" />
              </div>
            </div>
          </div>

          {/* 8. 거래 조건 */}
          <div className="bg-white border border-border rounded-lg p-6">
            <SectionTitle icon={<Store size={17} />}>거래 조건 및 재고 관리</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">최소 발주량 (MOQ) <span className="text-red-500">*</span></label>
                <input type="text" value={form.moq} onChange={(e) => update("moq", e.target.value)} placeholder="예: 100" className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">단가 <span className="text-red-500">*</span></label>
                <input type="text" value={form.unitPrice} onChange={(e) => update("unitPrice", e.target.value)} placeholder="예: 10000" className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">리드타임 (일)</label>
                <input type="text" value={form.leadTime} onChange={(e) => update("leadTime", e.target.value)} placeholder="예: 7" className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors" />
              </div>
            </div>
          </div>

          {/* 9. 공급 옵션 */}
          <div className="bg-white border border-border rounded-lg p-6">
            <SectionTitle icon={<Settings size={17} />}>공급 옵션</SectionTitle>
            <div className="flex gap-4">
              {[
                { field: "oemAvailable", label: "OEM/ODM 가능", desc: "바이어 브랜드로 생산 가능" },
                { field: "sampleAvailable", label: "샘플 제공 가능", desc: "본오더 전 샘플 발송" },
                { field: "whiteLabel", label: "화이트라벨 가능", desc: "라벨 커스터마이징" },
              ].map((opt) => (
                  <label key={opt.field} className="flex items-start gap-3 cursor-pointer p-4 border border-border rounded hover:border-primary transition-colors flex-1">
                    <input type="checkbox" checked={form[opt.field as keyof typeof form] as boolean} onChange={(e) => update(opt.field, e.target.checked)} className="mt-0.5 accent-primary" />
                    <div>
                      <div className="text-sm font-medium text-foreground">{opt.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                    </div>
                  </label>
              ))}
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="flex items-center justify-between pb-4">
            <Link to="/seller" className="border border-border text-foreground hover:border-primary hover:text-primary px-8 py-3 rounded text-sm font-medium transition-colors">취소</Link>
            <div className="flex gap-3">
              <button type="button" className="border border-primary text-primary hover:bg-secondary px-6 py-3 rounded text-sm font-semibold transition-colors">임시저장</button>
              <button type="button" onClick={handleRegisterSubmit} className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded text-sm font-semibold transition-colors flex items-center gap-2">
                <Shirt size={16} /> 제품 등록 신청
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}
