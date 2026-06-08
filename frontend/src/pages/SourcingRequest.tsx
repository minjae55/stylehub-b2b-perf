import { useState, useRef } from "react";
import { Link } from "react-router";
import {
  ArrowLeft, CheckCircle, Upload, Package, Plus,
  Trash2, FileText, ChevronRight, X, Link as LinkIcon,
} from "lucide-react";

// ── 더미 바이어 정보 ──────────────────────────────────────────────────
const DUMMY_BUYER = {
  buyerId: "BUYER-0042",
  businessNumber: "123-45-67890",
};

// ── 카테고리 ──────────────────────────────────────────────────────────
const CATEGORY_MAP: Record<string, string[]> = {
  "상의":           ["티셔츠", "블라우스", "니트", "셔츠", "후드/맨투맨", "기타 상의"],
  "하의":           ["팬츠", "스커트", "데님", "레깅스", "기타 하의"],
  "원피스/세트":    ["원피스", "투피스 세트", "점프수트", "기타"],
  "아우터":         ["코트", "자켓", "가디건", "패딩", "기타 아우터"],
  "이너/언더웨어":  ["이너웨어", "브라탑", "속옷 세트", "기타"],
  "스포츠/애슬레저":["요가복", "러닝복", "트레이닝", "기타"],
  "액세서리":       ["가방", "모자", "스카프", "기타 액세서리"],
  "OEM/자체제작":   ["OEM", "ODM", "자체 브랜드", "기타"],
};
const MAIN_CATS = Object.keys(CATEGORY_MAP);

type SourcingType = "READY" | "CUSTOM";

// ── 타입 ──────────────────────────────────────────────────────────────
interface SourcingItem {
  id: string;
  type: SourcingType;
  // 공통
  productName: string;
  quantity: string;
  deliveryDate: string;
  detail: string;
  // READY 전용
  unitPrice: string;
  refUrl: string;
  refImageFile: File | null;
  // CUSTOM 전용
  mainCategory: string;
  subCategory: string;
  totalBudget: string;
  workFiles: File[];
  needSample: "Y" | "N" | "";
}

const makeItem = (): SourcingItem => ({
  id: crypto.randomUUID(),
  type: "READY",
  productName: "",
  quantity: "",
  deliveryDate: "",
  detail: "",
  unitPrice: "",
  refUrl: "",
  refImageFile: null,
  mainCategory: "",
  subCategory: "",
  totalBudget: "",
  workFiles: [],
  needSample: "",
});

// ── 카드 컴포넌트 ─────────────────────────────────────────────────────
function SourcingCard({
  item, index, total, onChange, onRemove,
}: {
  item: SourcingItem;
  index: number;
  total: number;
  onChange: (id: string, key: keyof SourcingItem, value: unknown) => void;
  onRemove: (id: string) => void;
}) {
  const imageRef = useRef<HTMLInputElement>(null);
  const workRef = useRef<HTMLInputElement>(null);
  const subCats = item.mainCategory ? CATEGORY_MAP[item.mainCategory] : [];

  const inputCls = "w-full border border-border rounded px-3 py-2 text-sm outline-none focus:border-primary transition-colors bg-white";

  const field = (label: string, required: boolean, children: React.ReactNode) => (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      {children}
    </div>
  );

  const handleWorkFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files ?? []);
    onChange(item.id, "workFiles", [...(item.workFiles ?? []), ...newFiles]);
    e.target.value = "";
  };

  const removeWorkFile = (idx: number) => {
    onChange(item.id, "workFiles", (item.workFiles ?? []).filter((_, i) => i !== idx));
  };

  return (
    <div className="bg-white border border-border rounded-lg overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/40">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
            {index + 1}
          </span>
          <span className="text-sm font-semibold text-foreground">소싱 요청서</span>
          {item.productName && (
            <span className="text-xs text-muted-foreground ml-1">— {item.productName}</span>
          )}
        </div>
        {total > 1 && (
          <button onClick={() => onRemove(item.id)} className="text-muted-foreground hover:text-red-500 transition-colors p-1 rounded">
            <Trash2 size={15} />
          </button>
        )}
      </div>

      <div className="p-5 space-y-4">

        {/* 타입 라디오 */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">소싱 유형 <span className="text-primary">*</span></label>
          <div className="flex gap-3">
            {(["READY", "CUSTOM"] as SourcingType[]).map((t) => (
              <label
                key={t}
                className={`flex-1 flex items-center justify-center gap-2 border rounded py-2.5 cursor-pointer text-sm font-medium transition-colors ${
                  item.type === t
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                <input
                  type="radio"
                  name={`type-${item.id}`}
                  value={t}
                  checked={item.type === t}
                  onChange={() => onChange(item.id, "type", t)}
                  className="accent-primary"
                />
                {t === "READY" ? "사입 (READY)" : "주문제작 (CUSTOM)"}
              </label>
            ))}
          </div>
        </div>

        {/* ── 공통 필드 ── */}
        {field("상품명", true,
          <input
            value={item.productName}
            onChange={(e) => onChange(item.id, "productName", e.target.value)}
            placeholder="예: 여성 린넨 와이드 팬츠"
            className={inputCls}
          />
        )}

        {field("세부 요구사항", false,
          <textarea
            value={item.detail}
            onChange={(e) => onChange(item.id, "detail", e.target.value)}
            rows={3}
            placeholder={item.type === "READY"
              ? "색상, 사이즈, 참고 URL 등 자유롭게 입력하세요."
              : "사이즈, 색상, 재질, 디자인 특이사항 등 자유롭게 입력하세요."}
            className={`${inputCls} resize-none`}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          {field("희망 수량", true,
            <div className="relative">
              <input
                value={item.quantity}
                onChange={(e) => onChange(item.id, "quantity", e.target.value)}
                placeholder="예: 200"
                type="number"
                min="1"
                className={`${inputCls} pr-8`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">벌</span>
            </div>
          )}
          {field("희망 납기일", false,
            <input
              value={item.deliveryDate}
              onChange={(e) => onChange(item.id, "deliveryDate", e.target.value)}
              type="date"
              className={inputCls}
            />
          )}
        </div>

        {/* ── READY 전용 필드 ── */}
        {item.type === "READY" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              {field("대카테고리", true,
                <select
                  value={item.mainCategory}
                  onChange={(e) => {
                    onChange(item.id, "mainCategory", e.target.value);
                    onChange(item.id, "subCategory", "");
                  }}
                  className={inputCls}
                >
                  <option value="">선택하세요</option>
                  {MAIN_CATS.map((c) => <option key={c}>{c}</option>)}
                </select>
              )}
              {field("중카테고리", true,
                <select
                  value={item.subCategory}
                  onChange={(e) => onChange(item.id, "subCategory", e.target.value)}
                  className={inputCls}
                  disabled={!item.mainCategory}
                >
                  <option value="">선택하세요</option>
                  {(item.mainCategory ? CATEGORY_MAP[item.mainCategory] : []).map((c) => <option key={c}>{c}</option>)}
                </select>
              )}
            </div>

            {field("희망 단가", true,
              <div className="relative">
                <input
                  value={item.unitPrice}
                  onChange={(e) => onChange(item.id, "unitPrice", e.target.value)}
                  placeholder="예: 15,000"
                  className={`${inputCls} pr-8`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">원</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                참고 이미지 <span className="text-muted-foreground font-normal text-xs">(선택 · PDF/이미지)</span>
              </label>
              <input
                ref={imageRef}
                type="file"
                accept=".pdf,image/*"
                className="hidden"
                onChange={(e) => onChange(item.id, "refImageFile", e.target.files?.[0] ?? null)}
              />
              {item.refImageFile ? (
                <div className="flex items-center gap-3 border border-primary/40 bg-primary/5 rounded px-3 py-2">
                  <FileText size={16} className="text-primary flex-shrink-0" />
                  <span className="text-sm flex-1 truncate">{item.refImageFile.name}</span>
                  <button onClick={() => onChange(item.id, "refImageFile", null)} className="text-muted-foreground hover:text-red-500 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => imageRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer group"
                >
                  <Upload size={18} className="mx-auto text-muted-foreground mb-1 group-hover:text-primary transition-colors" />
                  <div className="text-xs text-muted-foreground">클릭하여 파일 첨부 <span className="text-primary font-medium">파일 선택</span></div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── CUSTOM 전용 필드 ── */}
        {item.type === "CUSTOM" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              {field("대카테고리", true,
                <select
                  value={item.mainCategory}
                  onChange={(e) => {
                    onChange(item.id, "mainCategory", e.target.value);
                    onChange(item.id, "subCategory", "");
                  }}
                  className={inputCls}
                >
                  <option value="">선택하세요</option>
                  {MAIN_CATS.map((c) => <option key={c}>{c}</option>)}
                </select>
              )}
              {field("중카테고리", true,
                <select
                  value={item.subCategory}
                  onChange={(e) => onChange(item.id, "subCategory", e.target.value)}
                  className={inputCls}
                  disabled={!item.mainCategory}
                >
                  <option value="">선택하세요</option>
                  {subCats.map((c) => <option key={c}>{c}</option>)}
                </select>
              )}
            </div>

            {field("전체 예산", true,
              <div className="relative">
                <input
                  value={item.totalBudget}
                  onChange={(e) => onChange(item.id, "totalBudget", e.target.value)}
                  placeholder="예: 3,000,000"
                  className={`${inputCls} pr-8`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">원</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                작업지시서 및 참고 파일 <span className="text-muted-foreground font-normal text-xs">(선택 · PDF/이미지 · 다중 첨부 가능)</span>
              </label>
              <input
                ref={workRef}
                type="file"
                accept=".pdf,image/*"
                multiple
                className="hidden"
                onChange={handleWorkFiles}
              />
              {item.workFiles.length > 0 && (
                <div className="space-y-1.5 mb-2">
                  {item.workFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 border border-primary/40 bg-primary/5 rounded px-3 py-2">
                      <FileText size={14} className="text-primary flex-shrink-0" />
                      <span className="text-sm flex-1 truncate">{f.name}</span>
                      <button onClick={() => removeWorkFile(i)} className="text-muted-foreground hover:text-red-500 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div
                onClick={() => workRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer group"
              >
                <Upload size={18} className="mx-auto text-muted-foreground mb-1 group-hover:text-primary transition-colors" />
                <div className="text-xs text-muted-foreground">클릭하여 파일 추가 <span className="text-primary font-medium">파일 선택</span></div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                샘플 제작 필요 여부 <span className="text-primary">*</span>
              </label>
              <div className="flex gap-3">
                {(["Y", "N"] as const).map((v) => (
                  <label
                    key={v}
                    className={`flex-1 flex items-center justify-center gap-2 border rounded py-2.5 cursor-pointer text-sm font-medium transition-colors ${
                      item.needSample === v
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`sample-${item.id}`}
                      value={v}
                      checked={item.needSample === v}
                      onChange={() => onChange(item.id, "needSample", v)}
                      className="accent-primary"
                    />
                    {v === "Y" ? "필요" : "불필요"}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── 유효성 검사 ───────────────────────────────────────────────────────
const isItemValid = (item: SourcingItem): boolean => {
  const commonOk = !!(item.productName && item.quantity);
  if (item.type === "READY") return commonOk && !!(item.unitPrice && item.mainCategory && item.subCategory);
  if (item.type === "CUSTOM") return commonOk && !!(item.mainCategory && item.subCategory && item.totalBudget && item.needSample);
  return false;
};

// ── 메인 페이지 ───────────────────────────────────────────────────────
export function SourcingRequest() {
  const [items, setItems] = useState<SourcingItem[]>([makeItem()]);
  const [submitted, setSubmitted] = useState(false);

  const updateItem = (id: string, key: keyof SourcingItem, value: unknown) =>
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, [key]: value } : item));

  const addItem = () => setItems((prev) => [...prev, makeItem()]);
  const removeItem = (id: string) => setItems((prev) => prev.filter((item) => item.id !== id));

  const canSubmit = items.every(isItemValid);

  const handleSubmit = () => {
    const payload = {
      sourcingRequestId: null,
      buyerId: DUMMY_BUYER.buyerId,
      businessNumber: DUMMY_BUYER.businessNumber,
      items: items.map(({ id: _id, refImageFile: _r, workFiles: _w, ...rest }) => rest),
    };
    console.log("제출 payload:", payload);
    setSubmitted(true);
  };

  // 완료 화면
  if (submitted) {
    return (
      <div className="max-w-[600px] mx-auto px-4 py-20 text-center font-[Inter,sans-serif]">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={32} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">소싱 요청 완료!</h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
          총 <strong className="text-foreground">{items.length}건</strong>의 소싱 요청서가 접수되었습니다.<br />
          스타일허브 소싱팀이 검토 후 영업일 <strong className="text-foreground">2~3일</strong> 이내로 연락드립니다.
        </p>
        <div className="bg-secondary border border-primary/20 rounded-lg p-5 text-left text-sm mb-8 space-y-2">
          <div className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Package size={15} className="text-primary" /> 요청 내역
          </div>
          {items.map((item, i) => (
            <div key={item.id} className="flex gap-3 text-muted-foreground">
              <span className="text-primary font-mono">{i + 1}.</span>
              <span>
                {item.productName} · {item.type === "READY" ? "사입" : "주문제작"} · {Number(item.quantity).toLocaleString()}벌
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-center">
          <Link to="/suppliers" className="px-6 py-2.5 border border-border rounded font-medium text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
            공급업체 목록
          </Link>
          <Link to="/" className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded font-semibold text-sm transition-colors">
            홈으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[760px] mx-auto px-4 py-8 font-[Inter,sans-serif]">
      <Link to="/suppliers" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft size={16} /> 공급업체 목록으로
      </Link>

      <div className="flex items-center gap-2 mb-1">
        <Package size={22} className="text-primary" />
        <h1 className="text-2xl font-bold text-foreground">소싱 요청서</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-8">
        원하는 상품을 상세히 입력하면 스타일허브 소싱팀이 최적의 공급업체를 매칭해 드립니다.
      </p>

      {/* hidden 필드 안내 (dev 확인용) */}
      <div className="bg-secondary border border-border rounded px-4 py-3 text-xs text-muted-foreground mb-6 flex gap-6">
        <span>바이어 ID: <strong className="text-foreground font-mono">{DUMMY_BUYER.buyerId}</strong></span>
        <span>사업자번호: <strong className="text-foreground font-mono">{DUMMY_BUYER.businessNumber}</strong></span>
        <span className="ml-auto text-primary/60">※ 제출 시 자동 포함 (hidden)</span>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <SourcingCard
            key={item.id}
            item={item}
            index={index}
            total={items.length}
            onChange={updateItem}
            onRemove={removeItem}
          />
        ))}
      </div>

      <button
        onClick={addItem}
        className="w-full mt-4 border-2 border-dashed border-border hover:border-primary text-muted-foreground hover:text-primary rounded-lg py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
      >
        <Plus size={16} /> 소싱 요청서 추가하기
      </button>

      <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
        <span className="text-xs text-muted-foreground">
          총 <strong className="text-foreground">{items.length}</strong>건 작성 중
        </span>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`flex items-center gap-2 px-6 py-2.5 rounded font-semibold text-sm transition-colors ${
            canSubmit ? "bg-primary hover:bg-primary/90 text-white" : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          제출하기 <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
