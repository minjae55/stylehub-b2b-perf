import { useState, useRef } from "react";
import { Link } from "react-router";
import {
  Shirt, Tag, LayoutGrid, Store, Settings, Ruler, Palette,
  Award, FileText, Image, ChevronLeft, Plus, X, AlertCircle, 
  CheckCircle, CloudUpload, Upload
} from "lucide-react";

const subCategories: Record<string, Record<string, string[]>> = {
  top: {
    "티셔츠": ["반팔티", "긴팔티", "나시"],
    "블라우스/셔츠": ["셔츠", "레이스 블라우스"],
    "니트/스웨터": ["가디건", "풀오버", "조끼"],
    "후드/맨투맨": ["후드집업", "크루넥"],
    "재킷/블레이저": ["테일러드", "숏재킷"],
  },
  bottom: {
    "스커트": ["미니", "미디", "롱", "플리츠"],
    "팬츠": ["슬랙스", "청바지", "와이드팬츠"],
    "레깅스": ["기본", "패턴"],
    "반바지": ["숏팬츠", "버뮤다"],
  },
  dress: {
    "원피스": ["미니", "미디", "맥시"],
    "점프수트": ["오버올", "롬퍼"],
    "투피스/세트": ["상하의 세트", "수트 세트"],
  },
  outer: {
    "코트": ["롱코트", "하프코트", "트렌치"],
    "패딩": ["롱패딩", "숏패딩", "조끼패딩"],
    "점퍼/바람막이": ["야상", "항공점퍼"],
    "가죽/인조가죽": ["라이더재킷"],
  },
  inner: {
    "이너티": ["민소매", "반팔 이너"],
    "속옷": ["브라", "팬티 세트"],
    "홈웨어": ["파자마", "잠옷 세트"],
  },
  sports: {
    "스포츠 상의": ["스포츠브라", "래쉬가드"],
    "스포츠 하의": ["요가팬츠", "트레이닝팬츠"],
    "스포츠 세트": ["상하의 세트"],
  },
  acc: {
    "가방": ["토트백", "크로스백", "클러치"],
    "모자": ["볼캡", "버킷햇", "베레모"],
    "스카프/머플러": ["실크스카프", "울머플러"],
    "벨트": ["가죽벨트", "체인벨트"],
    "양말/타이즈": ["기본양말", "패턴타이즈"],
  },
  shoes: {
    "힐/펌프스": ["스틸레토", "블록힐"],
    "플랫/로퍼": ["발레리나", "옥스퍼드"],
    "부츠": ["앵클부츠", "롱부츠"],
    "스니커즈": ["캐주얼", "러닝화"],
  },
};

const mainCategoryLabels: Record<string, string> = {
  top: "상의 (Top)",
  bottom: "하의 (Bottom)",
  dress: "원피스/세트 (Dress & Set)",
  outer: "아우터 (Outer)",
  inner: "이너/언더웨어 (Inner)",
  sports: "스포츠/애슬레저 (Sports)",
  acc: "액세서리 (Accessory)",
  shoes: "신발 (Shoes)",
};

const sizeSystems = ["한국 사이즈 (XS–3XL)", "US 사이즈", "EU 사이즈", "프리사이즈", "넘버 사이즈 (23–29)"];
const sizeOptions = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "프리"];
const colorOptions = ["블랙", "화이트", "아이보리", "네이비", "베이지", "그레이", "카키", "브라운", "핑크", "레드", "블루", "기타"];
const patternOptions = ["솔리드", "스트라이프", "체크", "플로럴", "도트", "애니멀", "타이다이", "그래픽"];

const certGroups = [
  {
    label: "국내 인증",
    items: ["KC 인증", "어린이제품 안전인증", "환경부 환경마크", "GR 우수재활용제품", "섬유품질표시 적합"],
  },
  {
    label: "소재 / 환경 인증",
    items: ["OEKO-TEX Standard 100", "GOTS (유기농 섬유)", "Recycled Content (GRS)", "비건 인증", "Fair Trade"],
  },
];

function ToggleChip({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`py-1.5 px-3 text-xs rounded border transition-colors ${
        selected
          ? "bg-primary text-white border-primary"
          : "border-border text-foreground hover:border-primary hover:text-primary"
      }`}
    >
      {label}
    </button>
  );
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
      <span className="text-primary">{icon}</span>
      {children}
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
function ConfirmModal({ //삭제확인 모달
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-foreground font-medium mb-6 text-center leading-relaxed">
          {message}
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={onCancel}
            className="border border-border text-foreground hover:border-primary hover:text-primary px-6 py-2 rounded text-sm font-medium transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded text-sm font-semibold transition-colors"          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
// 인증서 업로드 모달 추가
function CertUploadModal({
  certName,
  onSave,
  onCancel,
}: {
  certName: string;
  onSave: () => void;
  onCancel: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);

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

  const removeFile = (name: string) =>
    setFiles((p) => p.filter((f) => f.name !== name));

  return (
    <div
       className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel} //모달버튼
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">인증서 업로드</p>
            <h3 className="text-base font-bold text-foreground">{certName}</h3>
          </div>
          <button
            onClick={onCancel} //모달닫기
            className="text-muted-foreground hover:text-foreground transition-colors mt-0.5"
          >
            <X size={18} />
          </button>
        </div>

        {/* 드래그 앤 드롭 영역 */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-7 text-center cursor-pointer transition-colors mb-4 ${
            dragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary hover:bg-muted/20"
          }`}
        >
          <CloudUpload size={26} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-medium text-foreground mb-1">
            파일을 드래그하거나 클릭하여 업로드
          </p>
          <p className="text-xs text-muted-foreground">PDF, JPG, PNG · 최대 10MB</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        {/* 업로드된 파일 목록 */}
        {files.length > 0 && (
          <ul className="space-y-2 mb-4">
            {files.map((f) => (
              <li
                key={f.name}
                className="flex items-center justify-between bg-muted/30 border border-border rounded px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={14} className="text-primary flex-shrink-0" />
                  <span className="text-xs text-foreground truncate">{f.name}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {(f.size / 1024 / 1024).toFixed(1)}MB
                  </span>
                </div>
                <button
                  onClick={() => removeFile(f.name)}
                  className="text-muted-foreground hover:text-red-500 transition-colors ml-2 flex-shrink-0"
                >
                  <X size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* 하단 버튼 */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel} //모달닫기
            className="border border-border text-foreground hover:border-primary hover:text-primary px-5 py-2 rounded text-sm font-medium transition-colors"
          >
            취소
          </button>
          <button
            onClick={onSave} 
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
  productName: "",
  engName: "",
  brand: "",
  season: "",
  mainCategory: "",
  subCategory: "",
  moq: "",
  unitPrice: "",
  leadTime: "",
  stock: "",
  stockAlert: "", //재입고알림
  mainMaterial: "",
  materialCert: "",
  description: "",
  careInstruction: "",
  oemAvailable: false,
  sampleAvailable: false,
  whiteLabel: false,
};

export function SellerProductRegister() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState(initialForm);

  const [selectedSubTypes, setSelectedSubTypes] = useState<string[]>([]);
  const [selectedSizeSystems, setSelectedSizeSystems] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([]);
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);
  const [certModalTarget, setCertModalTarget] = useState<string | null>(null); //모달추가
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null); //삭제확인 모달 타겟


  const update = (field: string, value: string | boolean) =>
    setForm((p) => ({ ...p, [field]: value }));

  const toggleItem = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    item: string
  ) => setList((p) => (p.includes(item) ? p.filter((x) => x !== item) : [...p, item]));


  
  const currentSubGroups = form.mainCategory ? subCategories[form.mainCategory] : {};
  const currentSubTypes = form.subCategory ? currentSubGroups[form.subCategory] ?? [] : [];

  const handleMainCategoryChange = (val: string) => {
    update("mainCategory", val);
    update("subCategory", "");
    setSelectedSubTypes([]);
  };

  const handleSubCategoryChange = (val: string) => {
    update("subCategory", val);
    setSelectedSubTypes([]);
  };

  const resetAll = () => {
    setForm(initialForm);
    setSelectedSubTypes([]);
    setSelectedSizeSystems([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedPatterns([]);
    setSelectedCerts([]);
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
            <Link
              to="/seller"
              className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded font-semibold text-sm transition-colors"
            >
              셀러 페이지로
            </Link>
            <button
              onClick={() => { resetAll(); setSubmitted(false); }}
              className="border border-border text-foreground hover:border-primary hover:text-primary px-6 py-2.5 rounded text-sm font-medium transition-colors"
            >
              추가 등록
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto px-4 py-8">
       {/* 인증서 모달 */}
      {certModalTarget && (
        <CertUploadModal
          certName={certModalTarget}
          onSave={() => setCertModalTarget(null)}
          onCancel={() => {
            toggleItem(selectedCerts, setSelectedCerts, certModalTarget);
            setCertModalTarget(null);
          }}
        />
      )}
      {confirmTarget && (
  <ConfirmModal
    message="등록된 인증서를 삭제하시겠습니까?"
    onConfirm={() => {
      toggleItem(selectedCerts, setSelectedCerts, confirmTarget);
      setConfirmTarget(null);
    }}
    onCancel={() => setConfirmTarget(null)}
  />
)}
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-white rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Shirt size={26} />
          <h1 className="text-2xl font-bold">제품 등록</h1>
        </div>
        <p className="text-white/75 text-sm">
          TradeKR 플랫폼에 K-Fashion 제품을 등록하세요. 전 세계 바이어에게 노출됩니다.
        </p>
      </div>

      <Link
        to="/seller"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-5"
      >
        <ChevronLeft size={14} /> 셀러 페이지로
      </Link>

      <div className="space-y-5">
        {/* 기본 제품 정보 */}
        <div className="bg-white border border-border rounded-lg p-6">
          <SectionTitle icon={<Tag size={17} />}>기본 제품 정보</SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1.5">
                제품명 (한국어) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.productName}
                onChange={(e) => update("productName", e.target.value)}
                placeholder="예: 오버사이즈 린넨 셔츠 블라우스"
                className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">제품명 (영어)</label>
              <input
                type="text"
                value={form.engName}
                onChange={(e) => update("engName", e.target.value)}
                placeholder="Oversized Linen Shirt Blouse"
                className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">브랜드명</label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => update("brand", e.target.value)}
                placeholder="예: MUMU STUDIO"
                className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">시즌</label>
              <select
                value={form.season}
                onChange={(e) => update("season", e.target.value)}
                className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors"
              >
                <option value="">선택하세요</option>
                <option>SS (봄/여름)</option>
                <option>FW (가을/겨울)</option>
                <option>상시</option>
              </select>
            </div>
          </div>
        </div>

        {/* 카테고리 */}
        <div className="bg-white border border-border rounded-lg p-6">
          <SectionTitle icon={<LayoutGrid size={17} />}>카테고리</SectionTitle>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                대분류 <span className="text-red-500">*</span>
              </label>
              <select
                value={form.mainCategory}
                onChange={(e) => handleMainCategoryChange(e.target.value)}
                className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors"
              >
                <option value="">선택하세요</option>
                {Object.entries(mainCategoryLabels).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                중분류 <span className="text-red-500">*</span>
              </label>
              <select
                value={form.subCategory}
                onChange={(e) => handleSubCategoryChange(e.target.value)}
                disabled={!form.mainCategory}
                className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors disabled:opacity-50"
              >
                <option value="">{form.mainCategory ? "선택하세요" : "대분류를 먼저 선택하세요"}</option>
                {Object.keys(currentSubGroups).map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>
          {currentSubTypes.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">세부 유형 (복수 선택 가능)</p>
              <div className="flex flex-wrap gap-2">
                {currentSubTypes.map((item) => (
                  <ToggleChip
                    key={item}
                    label={item}
                    selected={selectedSubTypes.includes(item)}
                    onToggle={() => toggleItem(selectedSubTypes, setSelectedSubTypes, item)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 거래 조건 */}
        <div className="bg-white border border-border rounded-lg p-6">
          <SectionTitle icon={<Store size={17} />}>거래 조건 및 재고 관리</SectionTitle>  
          {/* [수정] 거래 조건 섹션명 변경 및 재고 알림 기준 수량 입력 필드 추가 */}
 
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                최소 발주량 (MOQ) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.moq}
                onChange={(e) => update("moq", e.target.value)}
                placeholder="예: 100벌"
                className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                단가 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.unitPrice}
                onChange={(e) => update("unitPrice", e.target.value)}
                placeholder="예: 10.000￦"
                className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">재고 수량</label>
              <input
                type="text"
                value={form.stock}
                onChange={(e) => update("stock", e.target.value)}
                placeholder="예: 500벌 (즉시 출고 가능)"
                className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
            <div> {/*재입고알림 추가*/}
              <label className="block text-sm font-medium text-foreground mb-1.5">
                재고 알림 기준 수량
              </label>
              <input
                type="text"
                value={form.stockAlert}
                onChange={(e) => update("stockAlert", e.target.value)}
                placeholder="예: 50벌"
                className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors"
              />
              <p className="text-xs text-muted-foreground mt-1">
                재고가 입력한 수량 이하로 떨어지면 알림을 보내드립니다.
              </p>
            </div>
          </div>
        </div>

        {/* 공급 옵션 */}
        <div className="bg-white border border-border rounded-lg p-6">
          <SectionTitle icon={<Settings size={17} />}>공급 옵션</SectionTitle>
          <div className="flex gap-4">
            {[
              { field: "oemAvailable", label: "OEM/ODM 가능", desc: "바이어 브랜드로 생산 가능" },
              { field: "sampleAvailable", label: "샘플 제공 가능", desc: "본오더 전 샘플 발송" },
              { field: "whiteLabel", label: "화이트라벨 가능", desc: "라벨 커스터마이징" },
            ].map((opt) => (
              <label
                key={opt.field}
                className="flex items-start gap-3 cursor-pointer p-4 border border-border rounded hover:border-primary transition-colors flex-1"
              >
                <input
                  type="checkbox"
                  checked={form[opt.field as keyof typeof form] as boolean}
                  onChange={(e) => update(opt.field, e.target.checked)}
                  className="mt-0.5 accent-primary"
                />
                <div>
                  <div className="text-sm font-medium text-foreground">{opt.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 사이즈 & 소재 */}
        <div className="bg-white border border-border rounded-lg p-6">
          <SectionTitle icon={<Ruler size={17} />}>사이즈 & 소재</SectionTitle>
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">사이즈 시스템</p>
            <div className="flex flex-wrap gap-2">
              {sizeSystems.map((item) => (
                <ToggleChip
                  key={item}
                  label={item}
                  selected={selectedSizeSystems.includes(item)}
                  onToggle={() => toggleItem(selectedSizeSystems, setSelectedSizeSystems, item)}
                />
              ))}
            </div>
          </div>
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">제공 사이즈</p>
            <div className="flex flex-wrap gap-2">
              {sizeOptions.map((item) => (
                <ToggleChip
                  key={item}
                  label={item}
                  selected={selectedSizes.includes(item)}
                  onToggle={() => toggleItem(selectedSizes, setSelectedSizes, item)}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                주요 소재 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.mainMaterial}
                onChange={(e) => update("mainMaterial", e.target.value)}
                placeholder="예: 면 100%, 폴리에스터 60% + 레이온 40%"
                className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">소재 인증</label>
              <input
                type="text"
                value={form.materialCert}
                onChange={(e) => update("materialCert", e.target.value)}
                placeholder="예: OEKO-TEX Standard 100"
                className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        </div>

        {/* 색상 & 패턴 */}
        <div className="bg-white border border-border rounded-lg p-6">
          <SectionTitle icon={<Palette size={17} />}>색상 & 패턴</SectionTitle>
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">주요 색상</p>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((item) => (   //모달 추가
                <ToggleChip
                  key={item}
                  label={item}
                  selected={selectedColors.includes(item)}
                  onToggle={() => toggleItem(selectedColors, setSelectedColors, item)}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">패턴</p>
            <div className="flex flex-wrap gap-2">
              {patternOptions.map((item) => (
                <ToggleChip
                  key={item}
                  label={item}
                  selected={selectedPatterns.includes(item)}
                  onToggle={() => toggleItem(selectedPatterns, setSelectedPatterns, item)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 보유 인증 */}
        <div className="bg-white border border-border rounded-lg p-6">
          <SectionTitle icon={<Award size={17} />}>보유 인증 / 컴플라이언스</SectionTitle>
          <div className="space-y-4">
            {certGroups.map((group) => (
              <div key={group.label}>
                <CertGroupLabel>{group.label}</CertGroupLabel>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => {
                  const isSelected = selectedCerts.includes(item);
  return (
    <div key={item} className="flex items-center"> 
      <button //인증서 버튼누르면 모달뜨게
        type="button"
      onClick={() => {
      if (isSelected) {
      setConfirmTarget(item);
  } else {
    toggleItem(selectedCerts, setSelectedCerts, item);
    setCertModalTarget(item);
  }
}}
        className={`py-1.5 px-3 text-xs border transition-colors rounded ${
          isSelected
            ? "bg-primary text-white border-primary"
            : "border-border text-foreground hover:border-primary hover:text-primary"
        }`}
      >
        {item}
      </button>
    </div>
  );
})}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 제품 상세 설명 */}
        <div className="bg-white border border-border rounded-lg p-6">
          <SectionTitle icon={<FileText size={17} />}>제품 상세 설명</SectionTitle>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                제품 특징 및 스타일링 포인트 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={4}
                placeholder="제품의 주요 특징, 핏, 디자인 포인트, 타겟 고객층 등을 기재하세요."
                className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary resize-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">세탁 / 관리 방법</label>
              <textarea
                value={form.careInstruction}
                onChange={(e) => update("careInstruction", e.target.value)}
                rows={2}
                placeholder="예: 손세탁 권장, 30°C 이하 세탁, 드라이클리닝 가능"
                className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary resize-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* 이미지 업로드 */}
        <div className="bg-white border border-border rounded-lg p-6">
          <SectionTitle icon={<Image size={17} />}>제품 이미지 업로드</SectionTitle>
          <div className="bg-muted/30 border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
            <CloudUpload size={28} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-foreground font-medium mb-1">이미지를 드래그하거나 클릭하여 업로드</p>
            <p className="text-xs text-muted-foreground">JPG, PNG, WEBP 지원 · 최대 10MB · 최대 8장</p>
          </div>
          <div className="flex items-start gap-2 mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            첫 번째 이미지가 대표 이미지로 설정됩니다. 착장 컷 + 플랫레이 컷 혼용 권장 (1000×1000px 이상)
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex items-center justify-between pb-4">
          <Link
            to="/seller"
            className="border border-border text-foreground hover:border-primary hover:text-primary px-8 py-3 rounded text-sm font-medium transition-colors"
          >
            취소
          </Link>
          <div className="flex gap-3">
            <button className="border border-primary text-primary hover:bg-secondary px-6 py-3 rounded text-sm font-semibold transition-colors">
              임시저장
            </button>
            <button
              onClick={() => setSubmitted(true)}
              className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <Shirt size={16} /> 제품 등록 신청
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
