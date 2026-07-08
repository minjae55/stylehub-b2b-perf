import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router";
import api from "../../api/axios";
import { AlertModal, ConfirmModal } from "../../components/common/Modal";
import {
  Shirt, Tag, LayoutGrid, Store, Settings, Palette,
  Award, FileText, Image, ChevronLeft, X, AlertCircle,
  CheckCircle, CloudUpload, Upload, Plus, Trash2, Star, RotateCcw, Lock
} from "lucide-react";

// 중분류 id 매핑 (DB categories 테이블 기준)
const subCategoryMap: Record<string, { name: string; id: number }[]> = {
  "상의":           [{ name: "티셔츠/탑", id: 9 }, { name: "블라우스/셔츠", id: 10 }, { name: "니트/스웨터", id: 11 }, { name: "후드/맨투맨", id: 12 }, { name: "재킷/블레이저", id: 13 }],
  "하의":           [{ name: "팬츠/슬랙스", id: 14 }, { name: "스커트", id: 15 }, { name: "진/데님", id: 16 }, { name: "레깅스", id: 17 }, { name: "반바지", id: 18 }],
  "원피스/세트":    [{ name: "원피스", id: 19 }, { name: "점프수트", id: 20 }, { name: "투피스세트", id: 21 }],
  "아우터":         [{ name: "코트", id: 22 }, { name: "재킷/점퍼", id: 23 }, { name: "가디건", id: 24 }, { name: "패딩", id: 25 }],
  "이너/언더웨어":  [{ name: "이너웨어", id: 26 }, { name: "속옷", id: 27 }, { name: "잠옷/홈웨어", id: 28 }],
  "스포츠/애슬레저":[{ name: "스포츠탑", id: 29 }, { name: "스포츠레깅스", id: 30 }, { name: "트레이닝복", id: 31 }, { name: "스포츠세트", id: 32 }],
  "액세서리":       [{ name: "가방/백", id: 33 }, { name: "모자", id: 34 }, { name: "스카프/머플러", id: 35 }, { name: "벨트", id: 36 }, { name: "양말/타이즈", id: 37 }],
  "신발":           [{ name: "스니커즈", id: 38 }, { name: "부츠/앵클부츠", id: 39 }, { name: "플랫/로퍼", id: 40 }, { name: "힐/롬프스", id: 41 }],
};

// 세부유형 (소분류 - 하드코딩)
const subTypes: Record<string, string[]> = {
  "티셔츠/탑": ["반팔티", "긴팔티", "나시"],
  "블라우스/셔츠": ["셔츠", "레이스 블라우스"],
  "니트/스웨터": ["가디건", "풀오버", "조끼"],
  "후드/맨투맨": ["후드집업", "크루넥"],
  "재킷/블레이저": ["테일러드", "숏재킷"],
  "팬츠/슬랙스": ["슬랙스", "청바지", "와이드팬츠"],
  "스커트": ["미니", "미디", "롱", "플리츠"],
  "진/데님": ["스키니", "와이드", "부츠컷"],
  "레깅스": ["기본", "패턴"],
  "반바지": ["숏팬츠", "버뮤다"],
  "원피스": ["미니", "미디", "맥시"],
  "점프수트": ["오버올", "롬퍼"],
  "투피스세트": ["상하의 세트", "수트 세트"],
  "코트": ["롱코트", "하프코트", "트렌치"],
  "재킷/점퍼": ["야상", "항공점퍼"],
  "가디건": ["기본", "롱"],
  "패딩": ["롱패딩", "숏패딩", "조끼패딩"],
  "이너웨어": ["민소매", "반팔 이너"],
  "속옷": ["브라", "팬티 세트"],
  "잠옷/홈웨어": ["파자마", "잠옷 세트"],
  "스포츠탑": ["스포츠브라", "래쉬가드"],
  "스포츠레깅스": ["요가팬츠", "트레이닝팬츠"],
  "트레이닝복": ["트레이닝세트", "조거팬츠"],
  "스포츠세트": ["상하의 세트"],
  "가방/백": ["토트백", "크로스백", "클러치"],
  "모자": ["볼캡", "버킷햇", "베레모"],
  "스카프/머플러": ["실크스카프", "울머플러"],
  "벨트": ["가죽벨트", "체인벨트"],
  "양말/타이즈": ["기본양말", "패턴타이즈"],
  "스니커즈": ["캐주얼", "러닝화"],
  "부츠/앵클부츠": ["앵클부츠", "롱부츠"],
  "플랫/로퍼": ["발레리나", "옥스퍼드"],
  "힐/롬프스": ["스틸레토", "블록힐"],
};

const sizeSystems = ["한국 사이즈 (XS–3XL)", "US 사이즈", "EU 사이즈", "프리사이즈", "넘버 사이즈 (23–29)"];

const sizeOptionsBySystem: Record<string, string[]> = {
  "한국 사이즈 (XS–3XL)": ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
  "US 사이즈": ["XS", "S", "M", "L", "XL", "XXL"],
  "EU 사이즈": ["34", "36", "38", "40", "42", "44", "46"],
  "프리사이즈": ["프리"],
  "넘버 사이즈 (23–29)": ["23", "24", "25", "26", "27", "28", "29"],
};

const sizeSystemGroupNameMap: Record<string, string> = {
  "한국 사이즈 (XS–3XL)": "KR사이즈",
  "US 사이즈": "US사이즈",
  "EU 사이즈": "EU사이즈",
  "프리사이즈": "프리사이즈",
  "넘버 사이즈 (23–29)": "사이즈",
};

const colorPresets = ["블랙", "화이트", "그레이", "네이비", "베이지", "브라운", "카키", "레드", "핑크", "옐로우", "그린", "블루"];

const seasonOptions = ["봄", "여름", "가을", "겨울", "SS", "FW", "상시"];

const certGroups = [
  { label: "국내 인증", items: ["KC 인증", "어린이제품 안전인증", "환경부 환경마크", "GR 우수재활용제품", "섬유품질표시 적합"] },
  { label: "소재 / 환경 인증", items: ["OEKO-TEX Standard 100", "GOTS (유기농 섬유)", "Recycled Content (GRS)", "비건 인증", "Fair Trade"] },
];

interface LabelOptionGroup {
  id: string;
  name: string;
  values: string[];
}

interface ComboValue {
  name: string;
  value: string;
}

interface CombinationInput {
  sku: string;
  stockQuantity: string;
  additionalPrice: string;
  restockAlertQuantity: string;
}

const defaultCombinationInput = (): CombinationInput => ({
  sku: "",
  stockQuantity: "",
  additionalPrice: "0",
  restockAlertQuantity: "",
});

interface ProductImage {
  file: File | null;
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

// 수정 모드 데이터 로딩용 타입
type FetchedImage = { productImageId: number; imageUrl: string; sortOrder: number; isMain: boolean };
type FetchedOptionValue = { optionName: string; optionValue: string; sortOrder: number };
type FetchedOption = {
  productOptionId: number; optionLabel: string; sku: string | null;
  stockQuantity: number; additionalPrice: number; restockAlertQuantity: number | null;
  isActive: boolean; images: FetchedImage[]; optionValues: FetchedOptionValue[];
  hasOrders?: boolean;
};
type FetchedCertification = { certName: string; fileUrl: string; expiryYear: number | null; expiryMonth: number | null };
type FetchedDetail = {
  productId: number; categoryId: number; categoryName: string; brandId: number; brandName: string;
  productName: string; productEngName: string | null; returnPolicy: string | null; season: string | null;
  moq: number; unitPrice: number; leadTimeDays: number | null; mainMaterial: string | null;
  description: string | null; careInstruction: string | null; productUrl: string | null;
  oemAvailable: boolean; sampleAvailable: boolean; whiteLabel: boolean;
  options: FetchedOption[]; certifications: FetchedCertification[];
};

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

const labelOptionExamples = [
  { name: "색상", value: "블랙" },
  { name: "사이즈", value: "M" },
  { name: "패턴", value: "스트라이프" },
  { name: "핏", value: "오버사이즈" },
];

function LabelOptionBuilder({
                              groups,
                              onChange,
                              lockedKeys,
                            }: {
  groups: LabelOptionGroup[];
  onChange: (groups: LabelOptionGroup[]) => void;
  lockedKeys?: Set<string>; // [추가] "그룹명:값" 형태. 주문/장바구니 이력이 있어 삭제 불가한 값들
}) {
  const isLocked = (groupName: string, value: string) =>
      !!lockedKeys?.has(`${groupName}:${value}`);

  const updateGroupName = (id: string, name: string) =>
      onChange(groups.map((g) => (g.id === id ? { ...g, name } : g)));

  const updateGroupValue = (id: string, idx: number, value: string) =>
      onChange(
          groups.map((g) =>
              g.id === id ? { ...g, values: g.values.map((v, i) => (i === idx ? value : v)) } : g
          )
      );

  const addValueInput = (id: string) =>
      onChange(groups.map((g) => (g.id === id ? { ...g, values: [...g.values, ""] } : g)));

  const removeValueInput = (id: string, idx: number) =>
      onChange(
          groups.map((g) =>
              g.id === id ? { ...g, values: g.values.filter((_, i) => i !== idx) } : g
          )
      );

  const addGroup = () =>
      onChange([
        ...groups,
        { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: "", values: [""] },
      ]);

  const removeGroup = (id: string) => onChange(groups.filter((g) => g.id !== id));

  return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-medium text-foreground">
            옵션 라벨 <span className="text-red-500">*</span>
          </label>
          <button
              type="button"
              onClick={addGroup}
              className="flex items-center gap-1 text-xs text-primary border border-primary rounded px-2.5 py-1 hover:bg-primary hover:text-white transition-colors"
          >
            <Plus size={12} /> 라벨옵션 추가
          </button>
        </div>

        <div className="space-y-2">
          {groups.map((g, groupIdx) => {
            const example = labelOptionExamples[groupIdx % labelOptionExamples.length];
            const groupHasLockedValue = g.values.some((v) => isLocked(g.name, v));
            return (
                <div key={g.id} className="flex items-center gap-2 flex-wrap">
                  <input
                      type="text"
                      value={g.name}
                      onChange={(e) => updateGroupName(g.id, e.target.value)}
                      placeholder={`예) ${example.name}`}
                      disabled={groupHasLockedValue}
                      title={groupHasLockedValue ? "주문/장바구니 이력이 있어 라벨명을 변경할 수 없습니다" : undefined}
                      className="border border-border rounded px-3 py-2 text-sm outline-none focus:border-primary transition-colors w-28 disabled:bg-muted/50 disabled:text-muted-foreground disabled:cursor-not-allowed"
                  />
                  {g.values.map((val, idx) => {
                    const locked = isLocked(g.name, val);
                    return (
                        <div key={idx} className="flex items-center gap-1">
                          <input
                              type="text"
                              value={val}
                              onChange={(e) => updateGroupValue(g.id, idx, e.target.value)}
                              placeholder={`예) ${example.value}`}
                              disabled={locked}
                              title={locked ? "주문/장바구니 이력이 있어 삭제/변경할 수 없습니다" : undefined}
                              className={`border rounded px-3 py-2 text-sm outline-none transition-colors w-28 ${
                                  locked
                                      ? "bg-muted/60 text-muted-foreground border-border cursor-not-allowed"
                                      : "border-border focus:border-primary"
                              }`}
                          />
                          {locked ? (
                              <Lock size={13} className="text-muted-foreground flex-shrink-0" />
                          ) : (
                              g.values.length > 1 && (
                                  <button
                                      type="button"
                                      onClick={() => removeValueInput(g.id, idx)}
                                      className="text-muted-foreground hover:text-red-500 transition-colors"
                                  >
                                    <X size={13} />
                                  </button>
                              )
                          )}
                        </div>
                    );
                  })}
                  <button
                      type="button"
                      onClick={() => addValueInput(g.id)}
                      className="flex items-center gap-1 text-xs text-primary border border-primary rounded px-2.5 py-2 hover:bg-primary hover:text-white transition-colors whitespace-nowrap"
                  >
                    <Plus size={12} /> 항목 추가
                  </button>
                  {groups.length > 1 && (
                      groupHasLockedValue ? (
                          <span title="주문/장바구니 이력이 있는 값이 포함되어 있어 라벨옵션 자체를 삭제할 수 없습니다" className="text-muted-foreground/50 ml-1 cursor-not-allowed">
                            <Trash2 size={13} />
                          </span>
                      ) : (
                          <button
                              type="button"
                              onClick={() => removeGroup(g.id)}
                              className="text-muted-foreground hover:text-red-500 transition-colors ml-1"
                              title="라벨옵션 삭제"
                          >
                            <Trash2 size={13} />
                          </button>
                      )
                  )}
                </div>
            );
          })}
        </div>
      </div>
  );
}

const initialForm = {
  productName: "", engName: "", mainCategory: "", subCategory: "",
  moq: "", unitPrice: "", leadTime: "", mainMaterial: "",
  description: "", careInstruction: "", returnPolicy: "", oemAvailable: false, sampleAvailable: false, whiteLabel: false,
};

const newLabelOptionGroup = (): LabelOptionGroup => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: "", values: [""],
});

const mergeLabelOptionGroups = (groups: LabelOptionGroup[]): LabelOptionGroup[] => {
  const merged: LabelOptionGroup[] = [];
  const indexByName = new Map<string, number>();

  for (const g of groups) {
    const key = g.name.trim();
    if (key && indexByName.has(key)) {
      const targetIdx = indexByName.get(key)!;
      const combined = [...merged[targetIdx].values, ...g.values];
      const seen = new Set<string>();
      const uniqueValues = combined.filter(v => {
        const trimmed = v.trim();
        if (!trimmed || seen.has(trimmed)) return false;
        seen.add(trimmed);
        return true;
      });
      merged[targetIdx] = { ...merged[targetIdx], values: uniqueValues.length > 0 ? uniqueValues : [""] };
    } else {
      merged.push(g);
      if (key) indexByName.set(key, merged.length - 1);
    }
  }
  return merged;
};

const buildCombinations = (groups: LabelOptionGroup[]): ComboValue[][] => {
  const validGroups = groups
      .map((g) => ({
        name: g.name.trim(),
        values: Array.from(new Set(g.values.map((v) => v.trim()).filter(Boolean))),
      }))
      .filter((g) => g.name && g.values.length > 0);

  if (validGroups.length === 0) return [];

  let combos: ComboValue[][] = [[]];
  for (const g of validGroups) {
    const next: ComboValue[][] = [];
    for (const combo of combos) {
      for (const val of g.values) {
        next.push([...combo, { name: g.name, value: val }]);
      }
    }
    combos = next;
  }
  return combos;
};

const comboKey = (combo: ComboValue[]) => combo.map((c) => `${c.name}:${c.value}`).join("|");
const comboLabel = (combo: ComboValue[]) => combo.map((c) => `${c.name}: ${c.value}`).join(" / ");

export function SellerProductRegister() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [submitted, setSubmitted] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(isEdit);
  const [brands, setBrands] = useState<{ brandId: number; brandName: string }[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [form, setForm] = useState(initialForm);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [selectedSubTypes, setSelectedSubTypes] = useState<string[]>([]);
  const [selectedSizeSystem, setSelectedSizeSystem] = useState<string>("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [customSizeInput, setCustomSizeInput] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [customColorInput, setCustomColorInput] = useState("");
  const [leadTimeOption, setLeadTimeOption] = useState<"range1" | "range2" | "custom" | "">("");
  const [leadTimeCustomInput, setLeadTimeCustomInput] = useState("");
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);
  const [certFiles, setCertFiles] = useState<Record<string, CertFile>>({});
  const [certModalTarget, setCertModalTarget] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null); // [추가] alert() 대체용

  const [labelGroups, setLabelGroups] = useState<LabelOptionGroup[]>([newLabelOptionGroup()]);
  const [combinationInputs, setCombinationInputs] = useState<Record<string, CombinationInput>>({});
  const [lockedValueKeys, setLockedValueKeys] = useState<Set<string>>(new Set()); // [추가] "그룹명:값" 형태 - 주문/장바구니 이력으로 삭제 불가한 값들

  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [detailPdfUrl, setDetailPdfUrl] = useState<string | null>(null);
  const [detailPdfName, setDetailPdfName] = useState<string>("");
  const [detailPdfUploading, setDetailPdfUploading] = useState(false);
  const detailPdfInputRef = useRef<HTMLInputElement>(null);

  const [dragSrcIdx, setDragSrcIdx] = useState<number | null>(null);
  const [dragOverIdxState, setDragOverIdxState] = useState<number | null>(null);

  useEffect(() => {
    api.get("/company/brands").then(res => setBrands(res));
  }, []);

  // 수정 모드일 때 기존 상품 데이터 불러와서 폼에 채워넣기
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const detail = await api.get<FetchedDetail>(`/products/${id}`);

        setForm({
          productName: detail.productName ?? "",
          engName: detail.productEngName ?? "",
          mainCategory: "",
          subCategory: "",
          moq: detail.moq != null ? String(detail.moq) : "",
          unitPrice: detail.unitPrice != null ? String(detail.unitPrice) : "",
          leadTime: detail.leadTimeDays != null ? String(detail.leadTimeDays) : "",
          mainMaterial: detail.mainMaterial ?? "",
          description: detail.description ?? "",
          careInstruction: detail.careInstruction ?? "",
          returnPolicy: detail.returnPolicy ?? "",
          oemAvailable: !!detail.oemAvailable,
          sampleAvailable: !!detail.sampleAvailable,
          whiteLabel: !!detail.whiteLabel,
        });

        for (const [main, subs] of Object.entries(subCategoryMap)) {
          const match = subs.find((s) => s.id === detail.categoryId);
          if (match) {
            setForm((p) => ({ ...p, mainCategory: main, subCategory: match.name }));
            break;
          }
        }
        setSelectedCategoryId(detail.categoryId);
        setSelectedBrandId(detail.brandId);

        setSelectedSeasons(detail.season ? detail.season.split(",").map((s) => s.trim()).filter(Boolean) : []);

        if (detail.leadTimeDays === 5) setLeadTimeOption("range1");
        else if (detail.leadTimeDays === 15) setLeadTimeOption("range2");
        else if (detail.leadTimeDays != null) setLeadTimeOption("custom");

        const groupOrder: string[] = [];
        const groupValuesMap: Record<string, Set<string>> = {};
        detail.options.forEach((opt) => {
          opt.optionValues.forEach((ov) => {
            if (!groupValuesMap[ov.optionName]) {
              groupValuesMap[ov.optionName] = new Set();
              groupOrder.push(ov.optionName);
            }
            groupValuesMap[ov.optionName].add(ov.optionValue);
          });
        });
        const restoredGroups: LabelOptionGroup[] = groupOrder.map((name) => ({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name,
          values: Array.from(groupValuesMap[name]),
        }));
        setLabelGroups(restoredGroups.length > 0 ? restoredGroups : [newLabelOptionGroup()]);

        // [추가] 주문/장바구니 이력이 있는 옵션(hasOrders)의 값들을 잠금 목록에 추가
        const locked = new Set<string>();
        detail.options.forEach((opt) => {
          if (opt.hasOrders) {
            opt.optionValues.forEach((ov) => locked.add(`${ov.optionName}:${ov.optionValue}`));
          }
        });
        setLockedValueKeys(locked);

        const restoredInputs: Record<string, CombinationInput> = {};
        detail.options.forEach((opt) => {
          const combo: ComboValue[] = groupOrder.map((name) => {
            const found = opt.optionValues.find((ov) => ov.optionName === name);
            return { name, value: found ? found.optionValue : "" };
          });
          restoredInputs[comboKey(combo)] = {
            sku: opt.sku ?? "",
            stockQuantity: String(opt.stockQuantity ?? 0),
            additionalPrice: String(opt.additionalPrice ?? 0),
            restockAlertQuantity: opt.restockAlertQuantity != null ? String(opt.restockAlertQuantity) : "",
          };
        });
        setCombinationInputs(restoredInputs);

        const allImages = detail.options.flatMap((o) => o.images);
        const uniqueImages = Array.from(new Map(allImages.map((img) => [img.imageUrl, img])).values())
            .sort((a, b) => a.sortOrder - b.sortOrder);
        setProductImages(
            uniqueImages.map((img) => ({
              file: null,
              previewUrl: img.imageUrl,
              uploadedUrl: img.imageUrl,
              isMain: img.isMain,
            }))
        );

        const restoredCerts: Record<string, CertFile> = {};
        detail.certifications.forEach((c) => {
          if (!restoredCerts[c.certName]) {
            restoredCerts[c.certName] = {
              certName: c.certName,
              files: [],
              uploadedUrls: [],
              expiryYear: c.expiryYear ? String(c.expiryYear) : "",
              expiryMonth: c.expiryMonth ? String(c.expiryMonth).padStart(2, "0") : "",
            };
          }
          restoredCerts[c.certName].uploadedUrls.push(c.fileUrl);
        });
        setCertFiles(restoredCerts);
        setSelectedCerts(Object.keys(restoredCerts));

        if (detail.productUrl) {
          setDetailPdfUrl(detail.productUrl);
          setDetailPdfName(detail.productUrl.split("/").pop() ?? "기존 파일");
        }
      } catch (err) {
        console.error(err);
        setAlertMessage("상품 정보를 불러오지 못했습니다.");
      } finally {
        setLoadingDetail(false);
      }
    })();
  }, [id]);

  const combinations = useMemo(() => buildCombinations(labelGroups), [labelGroups]);

  useEffect(() => {
    setLabelGroups((prev) => {
      const others = prev.filter((g) => g.id !== "color-group" && g.id !== "size-group");

      const autoGroups: LabelOptionGroup[] = [];
      if (selectedColors.length > 0) {
        autoGroups.push({ id: "color-group", name: "색상", values: [...selectedColors] });
      }
      if (selectedSizes.length > 0) {
        const sizeGroupName = sizeSystemGroupNameMap[selectedSizeSystem] ?? "사이즈";
        autoGroups.push({ id: "size-group", name: sizeGroupName, values: [...selectedSizes] });
      }

      if (autoGroups.length === 0) {
        return others.length > 0 ? others : [newLabelOptionGroup()];
      }

      const filteredOthers = others.filter((g) => g.name.trim() !== "" || g.values.some((v) => v.trim() !== ""));
      return [...autoGroups, ...filteredOthers];
    });
  }, [selectedSizes, selectedColors, selectedSizeSystem]);

  const update = (field: string, value: string | boolean) => setForm((p) => ({ ...p, [field]: value }));
  const toggleItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) =>
      setList((p) => (p.includes(item) ? p.filter((x) => x !== item) : [...p, item]));

  const handleMainCategoryChange = (val: string) => {
    update("mainCategory", val);
    update("subCategory", "");
    setSelectedCategoryId(null);
    setSelectedSubTypes([]);
  };

  const handleSubCategoryChange = (val: string) => {
    update("subCategory", val);
    setSelectedSubTypes([]);
    const found = subCategoryMap[form.mainCategory]?.find(c => c.name === val);
    setSelectedCategoryId(found?.id ?? null);
  };

  const currentSubList = form.mainCategory ? (subCategoryMap[form.mainCategory] ?? []) : [];
  const currentSubTypes = form.subCategory ? (subTypes[form.subCategory] ?? []) : [];

  const addCustomSize = () => {
    const trimmed = customSizeInput.trim();
    if (!trimmed) return;
    if (!selectedSizes.includes(trimmed)) {
      setSelectedSizes((prev) => [...prev, trimmed]);
    }
    setCustomSizeInput("");
  };

  const addCustomColor = () => {
    const trimmed = customColorInput.trim();
    if (!trimmed) return;
    if (!selectedColors.includes(trimmed)) {
      setSelectedColors((prev) => [...prev, trimmed]);
    }
    setCustomColorInput("");
  };

  const addCustomLeadTime = () => {
    const trimmed = leadTimeCustomInput.trim();
    if (!trimmed) return;
    setLeadTimeOption("custom");
    update("leadTime", trimmed);
    setLeadTimeCustomInput("");
  };

  const handleLabelGroupsChange = (groups: LabelOptionGroup[]) => {
    setLabelGroups(mergeLabelOptionGroups(groups));
  };

  const updateCombinationField = (key: string, field: keyof CombinationInput, value: string) => {
    setCombinationInputs((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? defaultCombinationInput()), [field]: value },
    }));
  };

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
      if (prev[idx].file) URL.revokeObjectURL(prev[idx].previewUrl);
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

  const handleDragStart = (idx: number) => setDragSrcIdx(idx);
  const handleDragEnter = (idx: number) => setDragOverIdxState(idx);
  const handleDragEnd = () => {
    if (dragSrcIdx === null || dragOverIdxState === null || dragSrcIdx === dragOverIdxState) {
      setDragSrcIdx(null);
      setDragOverIdxState(null);
      return;
    }
    setProductImages(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(dragSrcIdx, 1);
      updated.splice(dragOverIdxState, 0, moved);
      return updated;
    });
    setDragSrcIdx(null);
    setDragOverIdxState(null);
  };

  const handleCertSave = async (data: { files: File[]; expiryYear: string; expiryMonth: string }) => {
    if (!certModalTarget) return;
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
      setAlertMessage("인증서 업로드 중 오류가 발생했습니다.");
    }
    setCertModalTarget(null);
  };

  const handleDetailPdfUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.type !== "application/pdf") { setAlertMessage("PDF 파일만 업로드 가능합니다."); return; }
    setDetailPdfUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/upload/pdf?folder=product_detail", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setDetailPdfUrl(res as string);
      setDetailPdfName(file.name);
    } catch {
      setAlertMessage("PDF 업로드 중 오류가 발생했습니다.");
    }
    setDetailPdfUploading(false);
  };

  const resetAll = () => {
    setForm(initialForm);
    setSelectedSeasons([]);
    setSelectedCategoryId(null);
    setSelectedBrandId(null);
    setSelectedSubTypes([]);
    setSelectedSizeSystem("");
    setSelectedSizes([]);
    setCustomSizeInput("");
    setSelectedColors([]);
    setCustomColorInput("");
    setLeadTimeOption("");
    setLeadTimeCustomInput("");
    setSelectedCerts([]);
    setCertFiles({});
    setLabelGroups([newLabelOptionGroup()]);
    setCombinationInputs({});
    setProductImages([]);
    setDetailPdfUrl(null);
    setDetailPdfName("");
  };

  // [추가] 폼 위에서부터 순서대로 검사해서 걸리는 첫 번째 항목만 반환 (string이면 실패 메시지, null이면 통과)
  const validateForm = (): string | null => {
    // 1. 제품 이미지 업로드
    if (productImages.length === 0) {
      return "제품 이미지를 최소 1장 이상 업로드해 주세요.";
    }

    // 2. 카테고리
    if (!form.mainCategory) {
      return "카테고리 대분류를 선택해 주세요.";
    }
    if (!form.subCategory || !selectedCategoryId) {
      return "카테고리 중분류를 선택해 주세요.";
    }

    // 3. 기본 제품 정보
    if (!form.productName.trim()) {
      return "제품명(한국어)을 입력해 주세요.";
    }
    if (!selectedBrandId) {
      return "브랜드를 선택해 주세요.";
    }

    // 4. 상품 옵션 - 라벨/값
    if (combinations.length === 0) {
      return "옵션(예: 색상, 사이즈 등) 라벨과 값을 최소 1개 이상 입력해 주세요.";
    }

    // 5. 상품 옵션 - 각 조합별 재고 수량 (첫 번째로 비어있는 조합만 짚어줌)
    const missingStockCombo = combinations.find((combo) => {
      const input = combinationInputs[comboKey(combo)];
      return !input || input.stockQuantity.trim() === "" || isNaN(parseInt(input.stockQuantity, 10));
    });
    if (missingStockCombo) {
      return `"${comboLabel(missingStockCombo)}" 옵션 조합의 재고 수량을 입력해 주세요.`;
    }

    // 6. 제품 상세 설명
    if (!form.mainMaterial.trim()) {
      return "주요 소재를 입력해 주세요.";
    }
    if (!form.description.trim()) {
      return "제품 특징 및 스타일링 포인트를 입력해 주세요.";
    }

    // 7. 거래 조건
    if (!form.moq.trim()) {
      return "최소 발주량(MOQ)을 입력해 주세요.";
    }
    if (!form.unitPrice.trim()) {
      return "단가를 입력해 주세요.";
    }

    // 8. 반품 정책
    if (!form.returnPolicy.trim()) {
      return "반품 정책을 입력해 주세요.";
    }

    return null;
  };

  const handleRegisterSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setAlertMessage(validationError);
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
      season: selectedSeasons.length > 0 ? selectedSeasons.join(", ") : null,
      moq: form.moq ? parseInt(form.moq) : null,
      unitPrice: form.unitPrice ? parseInt(form.unitPrice) : null,
      leadTimeDays: form.leadTime ? parseInt(form.leadTime) : null,
      mainMaterial: form.mainMaterial,
      description: form.description,
      careInstruction: form.careInstruction,
      returnPolicy: form.returnPolicy || null,
      productUrl: detailPdfUrl ?? null,
      oemAvailable: form.oemAvailable,
      sampleAvailable: form.sampleAvailable,
      whiteLabel: form.whiteLabel,
      imageUrls: orderedImgs.map(img => img.uploadedUrl).filter(Boolean),
      options: combinations.map((combo) => {
        const key = comboKey(combo);
        const input = combinationInputs[key] ?? defaultCombinationInput();
        return {
          optionLabel: comboLabel(combo),
          sku: input.sku.trim() || null,
          stockQuantity: input.stockQuantity ? parseInt(input.stockQuantity, 10) : 0,
          additionalPrice: input.additionalPrice ? parseInt(input.additionalPrice, 10) : 0,
          restockAlertQuantity: input.restockAlertQuantity ? parseInt(input.restockAlertQuantity, 10) : null,
          optionValues: combo.map((c) => ({ optionName: c.name, optionValue: c.value })),
        };
      }),
      certifications: Object.values(certFiles).map((c) => ({
        certName: c.certName,
        fileUrls: c.uploadedUrls,
        expiryYear: c.expiryYear,
        expiryMonth: c.expiryMonth,
      })),
    };

    try {
      if (isEdit) {
        await api.patch(`/products/${id}`, payload);
      } else {
        await api.post("/products", payload);
      }
      setSubmitted(true);
    } catch (error: any) {
      console.error("제품 등록/수정 실패:", error);
      // axios 인터셉터가 error.message에 서버 메시지를 세팅해주므로 그대로 노출
      setAlertMessage(error?.message || "처리 중 문제가 발생했습니다. 관리자에게 문의하세요.");
    }
  };

  if (loadingDetail) {
    return (
        <div className="max-w-[900px] mx-auto px-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">상품 정보를 불러오는 중...</p>
        </div>
    );
  }

  if (submitted) {
    return (
        <div className="max-w-[580px] mx-auto px-4 py-16 text-center">
          <div className="bg-white border border-border rounded-lg p-10">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={36} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              {isEdit ? "제품이 수정되었습니다" : "제품이 등록되었습니다"}
            </h2>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              {isEdit ? (
                  <>변경 사항이 저장되었습니다.<br />셀러 페이지에서 확인하실 수 있습니다.</>
              ) : (
                  <>등록한 제품은 즉시 플랫폼에 게시되며.<br />셀러 페이지에서 등록 제품을 확인하실 수 있습니다.</>
              )}
            </p>
            <div className="flex justify-center gap-3">
              <Link to="/seller/products" className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded font-semibold text-sm transition-colors">상품 관리로</Link>
              {!isEdit && (
                  <button onClick={() => { resetAll(); setSubmitted(false); }} className="border border-border text-foreground hover:border-primary hover:text-primary px-6 py-2.5 rounded text-sm font-medium transition-colors">추가 등록</button>
              )}
            </div>
          </div>
        </div>
    );
  }

  return (
      <div className="max-w-[900px] mx-auto px-4 py-8">
        {alertMessage && (
            <AlertModal message={alertMessage} onClose={() => setAlertMessage(null)} />
        )}
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
                confirmLabel="삭제"
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
            <h1 className="text-2xl font-bold">{isEdit ? "제품 수정" : "제품 등록"}</h1>
          </div>
          <p className="text-white/75 text-sm">TradeKR 플랫폼에 K-Fashion 제품을 {isEdit ? "수정하세요." : "등록하세요. 전 세계 바이어에게 노출됩니다."}</p>
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
                            className={`relative group aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing ${dragOverIdxState === idx && dragSrcIdx !== idx ? "scale-105 border-primary" : ""}`}
                            style={{ borderColor: img.isMain ? "var(--primary)" : "var(--border)", opacity: dragSrcIdx === idx ? 0.4 : 1 }}
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
                  {Object.keys(subCategoryMap).map(name => (
                      <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">중분류 <span className="text-red-500">*</span></label>
                <select value={form.subCategory} onChange={(e) => handleSubCategoryChange(e.target.value)} disabled={!form.mainCategory} className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors disabled:opacity-50">
                  <option value="">{form.mainCategory ? "선택하세요" : "대분류를 먼저 선택하세요"}</option>
                  {currentSubList.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
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
                <label className="block text-sm font-medium text-foreground mb-1.5">브랜드 <span className="text-red-500">*</span></label>
                <select value={selectedBrandId ?? ""} onChange={(e) => setSelectedBrandId(e.target.value ? Number(e.target.value) : null)} className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors">
                  <option value="">선택하세요</option>
                  {brands.map(b => (<option key={b.brandId} value={b.brandId}>{b.brandName}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">시즌</label>
                <div className="flex flex-wrap gap-2">
                  {seasonOptions.map((item) => (
                      <ToggleChip
                          key={item}
                          label={item}
                          selected={selectedSeasons.includes(item)}
                          onToggle={() => toggleItem(selectedSeasons, setSelectedSeasons, item)}
                      />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 6. 상품 옵션 */}
          <div className="bg-white border border-border rounded-lg p-6">
            <SectionTitle icon={<Palette size={17} />}>상품 옵션</SectionTitle>
            <p className="text-xs text-muted-foreground mb-4">
              색상, 패턴 등 옵션 라벨과 값을 입력하면 가능한 모든 조합이 아래에 자동으로 생성됩니다. 각 조합마다 재고를 개별로 입력해야 상세페이지에서 해당 조합이 판매 가능으로 표시됩니다.
            </p>

            <div className="mb-5 pb-5 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">색상</p>
              <div className="flex flex-wrap gap-2 items-center">
                {colorPresets.map((item) => (
                    <ToggleChip key={item} label={item} selected={selectedColors.includes(item)}
                                onToggle={() => toggleItem(selectedColors, setSelectedColors, item)} />
                ))}
                {selectedColors
                    .filter((c) => !colorPresets.includes(c))
                    .map((custom) => (
                        <span key={custom} className="flex items-center gap-1 py-1.5 px-3 text-xs rounded border border-primary bg-primary text-white">
                          {custom}
                          <button type="button" onClick={() => toggleItem(selectedColors, setSelectedColors, custom)} className="hover:opacity-70">
                            <X size={11} />
                          </button>
                        </span>
                    ))}
                <div className="flex items-center gap-1.5 ml-1">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">기타</span>
                  <input
                      type="text"
                      value={customColorInput}
                      onChange={(e) => setCustomColorInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomColor();
                        }
                      }}
                      placeholder="직접작성"
                      className="border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary transition-colors w-24"
                  />
                  <button type="button" onClick={addCustomColor} className="text-xs text-primary border border-primary rounded px-2 py-1.5 hover:bg-primary hover:text-white transition-colors">
                    추가
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                선택한 색상은 아래 &ldquo;옵션 라벨&rdquo;에 &ldquo;색상&rdquo; 그룹으로 자동 반영됩니다.
              </p>
            </div>

            <div className="mb-5 pb-5 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">사이즈 시스템</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {sizeSystems.map((item) => (
                    <ToggleChip key={item} label={item} selected={selectedSizeSystem === item}
                                onToggle={() => { setSelectedSizeSystem(prev => prev === item ? "" : item); setSelectedSizes([]); setCustomSizeInput(""); }} />
                ))}
              </div>
              {selectedSizeSystem && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">제공 사이즈</p>
                    <div className="flex flex-wrap gap-2 items-center">
                      {(sizeOptionsBySystem[selectedSizeSystem] ?? []).map((item) => (
                          <ToggleChip key={item} label={item} selected={selectedSizes.includes(item)}
                                      onToggle={() => toggleItem(selectedSizes, setSelectedSizes, item)} />
                      ))}
                      {selectedSizes
                          .filter((s) => !(sizeOptionsBySystem[selectedSizeSystem] ?? []).includes(s))
                          .map((custom) => (
                              <span key={custom} className="flex items-center gap-1 py-1.5 px-3 text-xs rounded border border-primary bg-primary text-white">
                                {custom}
                                <button type="button" onClick={() => toggleItem(selectedSizes, setSelectedSizes, custom)} className="hover:opacity-70">
                                  <X size={11} />
                                </button>
                              </span>
                          ))}
                      <div className="flex items-center gap-1.5 ml-1">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">기타</span>
                        <input
                            type="text"
                            value={customSizeInput}
                            onChange={(e) => setCustomSizeInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addCustomSize();
                              }
                            }}
                            placeholder="직접작성"
                            className="border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary transition-colors w-24"
                        />
                        <button type="button" onClick={addCustomSize} className="text-xs text-primary border border-primary rounded px-2 py-1.5 hover:bg-primary hover:text-white transition-colors">
                          추가
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      선택한 사이즈는 아래 &ldquo;옵션 라벨&rdquo;에 &ldquo;사이즈&rdquo; 그룹으로 자동 반영됩니다.
                    </p>
                  </div>
              )}
            </div>

            <LabelOptionBuilder groups={labelGroups} onChange={handleLabelGroupsChange} lockedKeys={lockedValueKeys} />
            {lockedValueKeys.size > 0 && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Lock size={11} /> 자물쇠 표시된 값은 주문/장바구니 이력이 있어 삭제·수정할 수 없어요.
                </p>
            )}

            <div className="mt-5">
              {combinations.length === 0 ? (
                  <div className="text-xs text-muted-foreground border border-dashed border-border rounded p-4 text-center">
                    옵션 라벨과 값을 입력하면 조합이 여기 나타납니다.
                  </div>
              ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      총 {combinations.length}개 조합
                    </p>
                    {combinations.map((combo) => {
                      const key = comboKey(combo);
                      const input = combinationInputs[key] ?? defaultCombinationInput();
                      return (
                          <div key={key} className="border border-border rounded-lg p-4">
                            <div className="text-xs font-semibold text-foreground mb-3">
                              {comboLabel(combo)}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">재고 수량 <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    value={input.stockQuantity}
                                    onChange={(e) => updateCombinationField(key, "stockQuantity", e.target.value)}
                                    placeholder="예: 100"
                                    className="w-full border border-border rounded px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">추가 금액</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={input.additionalPrice ? `${Number(input.additionalPrice).toLocaleString()} ₩` : ""}
                                    onChange={(e) => {
                                      const raw = e.target.value.replace(/[^0-9-]/g, "");
                                      const cleaned = raw.replace(/(?!^)-/g, "");
                                      updateCombinationField(key, "additionalPrice", cleaned);
                                    }}
                                    placeholder="예: 0"
                                    className="w-full border border-border rounded px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">SKU</label>
                                <input
                                    type="text"
                                    value={input.sku}
                                    onChange={(e) => updateCombinationField(key, "sku", e.target.value)}
                                    placeholder="예: BLK-M-001"
                                    className="w-full border border-border rounded px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">재고 알림 수량</label>
                                <input
                                    type="number"
                                    value={input.restockAlertQuantity}
                                    onChange={(e) => updateCombinationField(key, "restockAlertQuantity", e.target.value)}
                                    placeholder="예: 10"
                                    className="w-full border border-border rounded px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                                />
                              </div>
                            </div>
                          </div>
                      );
                    })}
                  </div>
              )}
            </div>
          </div>

          {/* 7. 제품 상세 설명 */}
          <div className="bg-white border border-border rounded-lg p-6">
            <SectionTitle icon={<FileText size={17} />}>제품 상세 설명</SectionTitle>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">주요 소재 <span className="text-red-500">*</span></label>
                <input type="text" value={form.mainMaterial} onChange={(e) => update("mainMaterial", e.target.value)} placeholder="예: 면 100%, 폴리에스터 60% + 레이온 40%" className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">제품 특징 및 스타일링 포인트 <span className="text-red-500">*</span></label>
                <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={4} placeholder="제품의 주요 특징, 핏, 디자인 포인트, 타겟 고객층 등을 기재하세요." className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary resize-none transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">세탁 / 관리 방법</label>
                <textarea value={form.careInstruction} onChange={(e) => update("careInstruction", e.target.value)} rows={2} placeholder="예: 손세탁 권장, 30°C 이하 세탁, 드라이클리닝 가능" className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary resize-none transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">상세 설명 PDF</label>
                <input ref={detailPdfInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleDetailPdfUpload(e.target.files)} />
                <div
                    onClick={() => detailPdfInputRef.current?.click()}
                    className="border-2 border-dashed border-border hover:border-primary hover:bg-muted/20 rounded-lg px-4 py-5 text-center cursor-pointer transition-colors"
                >
                  <CloudUpload size={22} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium text-foreground mb-0.5">PDF 파일을 클릭하여 업로드</p>
                  <p className="text-xs text-muted-foreground">PDF · 최대 20MB</p>
                </div>
                {detailPdfUploading && (
                    <p className="text-xs text-primary mt-2 animate-pulse">업로드 중...</p>
                )}
                {detailPdfUrl && (
                    <div className="flex items-center justify-between mt-2 px-3 py-2 bg-muted/30 border border-border rounded">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={14} className="text-primary flex-shrink-0" />
                        <span className="text-xs text-foreground truncate">{detailPdfName}</span>
                      </div>
                      <button type="button" onClick={() => { setDetailPdfUrl(null); setDetailPdfName(""); }} className="text-muted-foreground hover:text-red-500 transition-colors ml-2 flex-shrink-0">
                        <X size={13} />
                      </button>
                    </div>
                )}
              </div>
            </div>
          </div>

          {/* 7-1. 보유 인증 */}
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
            {Object.keys(certFiles).length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-2">업로드된 인증서</p>
                  <ul className="space-y-2">
                    {Object.values(certFiles).map((cert) => (
                        <li key={cert.certName} className="flex items-center justify-between bg-muted/30 border border-border rounded px-3 py-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText size={13} className="text-primary flex-shrink-0" />
                            <span className="text-xs font-medium text-foreground">{cert.certName}</span>
                            <span className="text-xs text-muted-foreground">파일 {cert.files.length > 0 ? cert.files.length : cert.uploadedUrls.length}개</span>
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
                <input
                    type="text"
                    inputMode="numeric"
                    value={form.unitPrice ? `${Number(form.unitPrice).toLocaleString()} ₩` : ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      update("unitPrice", raw);
                    }}
                    placeholder="예: 10,000"
                    className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">제작/배송 소요일</label>
                <div className="flex flex-wrap items-center gap-2">
                  <ToggleChip
                      label="3~5일 이내"
                      selected={leadTimeOption === "range1"}
                      onToggle={() => { setLeadTimeOption("range1"); update("leadTime", "5"); }}
                  />
                  <ToggleChip
                      label="15일 이내"
                      selected={leadTimeOption === "range2"}
                      onToggle={() => { setLeadTimeOption("range2"); update("leadTime", "15"); }}
                  />
                  {leadTimeOption === "custom" && form.leadTime && (
                      <span className="flex items-center gap-1 py-1.5 px-3 text-xs rounded border border-primary bg-primary text-white">
                        {form.leadTime}일 이내
                        <button type="button" onClick={() => { setLeadTimeOption(""); update("leadTime", ""); }} className="hover:opacity-70">
                          <X size={11} />
                        </button>
                      </span>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">기타</span>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={leadTimeCustomInput}
                        onChange={(e) => setLeadTimeCustomInput(e.target.value.replace(/[^0-9]/g, ""))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addCustomLeadTime();
                          }
                        }}
                        placeholder="직접작성"
                        className="border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary transition-colors w-24"
                    />
                    <button type="button" onClick={addCustomLeadTime} className="text-xs text-primary border border-primary rounded px-2 py-1.5 hover:bg-primary hover:text-white transition-colors">
                      추가
                    </button>
                  </div>
                </div>
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

          {/* 10. 반품 정책 */}
          <div className="bg-white border border-border rounded-lg p-6">
            <SectionTitle icon={<RotateCcw size={17} />}>반품 정책 <span className="text-red-500">*</span></SectionTitle>
            <textarea
                value={form.returnPolicy}
                onChange={(e) => update("returnPolicy", e.target.value)}
                rows={3}
                placeholder="예: 단순 변심에 의한 반품은 상품 수령 후 7일 이내 가능하며, 왕복 배송비는 바이어 부담입니다. 불량/오배송의 경우 전액 셀러 부담으로 처리합니다."
                className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary resize-none transition-colors"
            />
          </div>

          {/* 하단 버튼 */}
          <div className="flex items-center justify-between pb-4">
            <Link to="/seller" className="border border-border text-foreground hover:border-primary hover:text-primary px-8 py-3 rounded text-sm font-medium transition-colors">취소</Link>
            <div className="flex gap-3">
              <button type="button" className="border border-primary text-primary hover:bg-secondary px-6 py-3 rounded text-sm font-semibold transition-colors">임시저장
              </button>
              <button type="button" onClick={handleRegisterSubmit} className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded text-sm font-semibold transition-colors flex items-center gap-2">
                <Shirt size={16} /> {isEdit ? "수정 완료" : "제품 등록 신청"}
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}
