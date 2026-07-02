import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { isAxiosError } from "axios";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Clock,
  FileText,
  Info,
  Package,
  Plus,
  Send,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import api from "@/api/axios";

const CATEGORIES = ["상의", "하의", "원피스/세트", "아우터", "이너웨어", "액세서리"];
const SHIPPING_COMPANIES = ["CJ대한통운", "롯데택배", "한진택배", "로젠택배", "자체 배송", "직접 배송"];

// ─── 타입 ───────────────────────────────────────────────────────────────────

type QuoteInitItem = {
  optionSummary: string;
  quantity: number;
  sampleQuantity: number | null;
};

type QuoteInitData = {
  sourcingNo: string;
  productName: string;
  brandName: string | null;
  material: string | null;
  deliveryDate: string | null;
  needSample: "Y" | "N";
  items: QuoteInitItem[];
};

type SourcingDetailResponse = {
  sourcing_no: string;
  product_name: string;
  brand_name: string | null;
  main_material: string | null;
  delivery_date: string | null;
  need_sample: "Y" | "N";
  items: {
    option_summary: string;
    quantity: number;
    sample_quantity: number | null;
  }[];
};

type QuoteOptionValueRow = {
  optionName: string;
  optionValue: string;
};

type QuoteItemRow = {
  optionValues: QuoteOptionValueRow[];
  quantity: string;
  unitPrice: string;
};

type SampleItemRow = {
  sampleName: string;
  quantity: string;
  unitPrice: string;
  memo: string;
};

type QuoteForm = {
  brandName: string;
  productName: string;
  categoryName: string;
  material: string;
  leadTimeDays: string;
  deliveryCompany: string;
  shippingFee: string;
  validDays: string;
  customValidDays: string;
  sampleAvailable: "AVAILABLE" | "UNAVAILABLE";
  sellerMemo: string;
};

type QuoteCreateResponse = {
  quoteId: number;
  quoteNo: string;
  status: string;
};

type QuoteErrorResponse = {
  message?: string;
  data?: Record<string, string>;
};

// ─── 파싱 유틸 ──────────────────────────────────────────────────────────────

function buildInitialForm(data: QuoteInitData): QuoteForm {
  return {
    brandName: data.brandName ?? "",
    productName: data.productName ?? "",
    categoryName: "",
    material: data.material ?? "",
    leadTimeDays: "7",
    deliveryCompany: "",
    shippingFee: "0",
    validDays: "7",
    customValidDays: "",
    sampleAvailable: data.needSample === "Y" ? "AVAILABLE" : "UNAVAILABLE",
    sellerMemo: "",
  };
}

function buildInitialQuoteItems(data: QuoteInitData): QuoteItemRow[] {
  if (data.items.length === 0) return [makeDefaultQuoteItem()];

  return data.items.map((item) => ({
    optionValues: DEFAULT_OPTION_VALUES.map((option) => ({ ...option })),
    quantity: item.quantity ? String(item.quantity) : "",
    unitPrice: "",
  }));
}

function buildInitialSampleItems(data: QuoteInitData): SampleItemRow[] {
  if (data.needSample !== "Y") return [makeDefaultSampleItem()];

  return data.items.map((item) => ({
    sampleName: data.productName,
    quantity: item.sampleQuantity ? String(item.sampleQuantity) : "1",
    unitPrice: "",
    memo: "",
  }));
}

// ─── 기본값 ─────────────────────────────────────────────────────────────────

const DEFAULT_OPTION_VALUES: QuoteOptionValueRow[] = [
  { optionName: "색상", optionValue: "" },
  { optionName: "사이즈", optionValue: "" },
];

function makeDefaultQuoteItem(): QuoteItemRow {
  return {
    optionValues: DEFAULT_OPTION_VALUES.map((option) => ({ ...option })),
    quantity: "",
    unitPrice: "",
  };
}

function makeDefaultSampleItem(): SampleItemRow {
  return { sampleName: "", quantity: "1", unitPrice: "", memo: "" };
}

const DEFAULT_FORM: QuoteForm = {
  brandName: "",
  productName: "",
  categoryName: "",
  material: "",
  leadTimeDays: "7",
  deliveryCompany: "",
  shippingFee: "0",
  validDays: "7",
  customValidDays: "",
  sampleAvailable: "AVAILABLE",
  sellerMemo: "",
};

// ─── 계산 유틸 ──────────────────────────────────────────────────────────────

function toNumber(value: string) {
  return Number(value.replaceAll(",", "")) || 0;
}

function formatPrice(value: number) {
  return `${value.toLocaleString()}원`;
}

function buildOptionSummary(optionValues: QuoteOptionValueRow[]) {
  return optionValues
      .filter((option) => option.optionName.trim() || option.optionValue.trim())
      .map((option) => `${option.optionName.trim()}: ${option.optionValue.trim()}`)
      .join(" / ");
}

function buildSampleSummary(sampleItems: SampleItemRow[]) {
  const validSampleItems = sampleItems.filter(
      (sample) =>
          sample.sampleName.trim() ||
          toNumber(sample.quantity) > 0 ||
          toNumber(sample.unitPrice) > 0 ||
          sample.memo.trim()
  );

  if (validSampleItems.length === 0) return "";

  return validSampleItems
      .map((sample, index) => {
        const quantity = toNumber(sample.quantity);
        const unitPrice = toNumber(sample.unitPrice);
        const totalPrice = quantity * unitPrice;

        return [
          `샘플 ${index + 1}`,
          sample.sampleName.trim() && `샘플명: ${sample.sampleName.trim()}`,
          `수량: ${quantity}`,
          `단가: ${formatPrice(unitPrice)}`,
          `금액: ${formatPrice(totalPrice)}`,
          sample.memo.trim() && `메모: ${sample.memo.trim()}`,
        ]
            .filter(Boolean)
            .join(" / ");
      })
      .join("\n");
}

function getValidUntil(validDays: string, customValidDays: string) {
  const selectedDays = validDays === "custom" ? customValidDays : validDays;
  const days = toNumber(selectedDays) || 7;
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + days);
  return validUntil.toISOString();
}

function preventInvalidNumberKey(event: KeyboardEvent<HTMLInputElement>) {
  if (["-", "+", "e", "E"].includes(event.key)) {
    event.preventDefault();
  }
}

function validateQuoteForm(
    requestId: string | undefined,
    form: QuoteForm,
    quoteItems: QuoteItemRow[],
    sampleItems: SampleItemRow[]
) {
  const errors: string[] = [];

  if (!requestId || !Number.isInteger(Number(requestId))) {
    errors.push("소싱 요청 정보가 올바르지 않습니다.");
  }
  if (!form.productName.trim()) {
    errors.push("상품명을 입력해주세요.");
  }
  if (toNumber(form.leadTimeDays) < 1) {
    errors.push("예상 출고 소요일은 1일 이상이어야 합니다.");
  }
  if (form.shippingFee.trim() === "" || toNumber(form.shippingFee) < 0) {
    errors.push("배송비는 0원 이상으로 입력해주세요.");
  }
  if (form.validDays === "custom" && toNumber(form.customValidDays) < 1) {
    errors.push("견적 유효 기간은 1일 이상이어야 합니다.");
  }

  quoteItems.forEach((item, index) => {
    const itemLabel = `품목 ${index + 1}`;

    if (!buildOptionSummary(item.optionValues)) {
      errors.push(`${itemLabel}의 옵션 정보를 입력해주세요.`);
    }
    if (toNumber(item.quantity) < 1) {
      errors.push(`${itemLabel}의 수량은 1개 이상이어야 합니다.`);
    }
    if (item.unitPrice.trim() === "" || toNumber(item.unitPrice) < 0) {
      errors.push(`${itemLabel}의 단가는 0원 이상으로 입력해주세요.`);
    }
  });

  if (form.sampleAvailable === "AVAILABLE") {
    sampleItems.forEach((sample, index) => {
      const itemLabel = `샘플 ${index + 1}`;

      if (!sample.sampleName.trim()) {
        errors.push(`${itemLabel}의 샘플명을 입력해주세요.`);
      }
      if (toNumber(sample.quantity) < 1) {
        errors.push(`${itemLabel}의 수량은 1개 이상이어야 합니다.`);
      }
      if (sample.unitPrice.trim() === "" || toNumber(sample.unitPrice) < 0) {
        errors.push(`${itemLabel}의 단가는 0원 이상으로 입력해주세요.`);
      }
    });
  }

  return errors;
}

// ─── 서브 컴포넌트 ───────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
        {children}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
  );
}

const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-3 focus:ring-primary/10";

const mutedInputClass =
    "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900";

function SectionTitle({ icon, title, compact }: { icon: React.ReactNode; title: string; compact?: boolean }) {
  return (
      <div className={compact ? "" : "mb-4"}>
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-950">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-primary">
          {icon}
        </span>
          {title}
        </h2>
      </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
      <div className="flex items-center justify-between gap-3">
        <span className="text-slate-500">{label}</span>
        <span className="font-semibold text-slate-900">{value}</span>
      </div>
  );
}

function RequestMetric({ label, value }: { label: string; value: string }) {
  return (
      <div className="rounded-lg border border-primary/15 bg-[#fff7f8] px-4 py-3">
        <p className="text-xs font-bold text-primary/80">{label}</p>
        <p className="mt-1 text-base font-black text-slate-950">{value}</p>
      </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
      <div className="rounded-lg bg-slate-50 px-2 py-3">
        <p className="text-[11px] font-semibold text-slate-400">{label}</p>
        <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
      </div>
  );
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────

export function SellerQuoteWrite() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [initData, setInitData] = useState<QuoteInitData | null>(null);

  const [form, setForm] = useState<QuoteForm>(DEFAULT_FORM);
  const [quoteItems, setQuoteItems] = useState<QuoteItemRow[]>([makeDefaultQuoteItem()]);
  const [sampleItems, setSampleItems] = useState<SampleItemRow[]>([makeDefaultSampleItem()]);

  // ── API 호출 & 초기값 주입 ──────────────────────────────────────────────
  useEffect(() => {
    if (!requestId) return;

    const loadQuoteInit = async () => {
      try {
        setLoading(true);
        setSubmitErrors([]);

        const response =
            await api.get<SourcingDetailResponse>(
                `/quotes/init/${requestId}`
            );

        const quoteInitData: QuoteInitData = {
          sourcingNo: response.sourcing_no,
          productName: response.product_name,
          brandName: response.brand_name,
          material: response.main_material,
          deliveryDate: response.delivery_date,
          needSample: response.need_sample,
          items: response.items.map((item) => ({
            optionSummary: item.option_summary,
            quantity: item.quantity,
            sampleQuantity: item.sample_quantity,
          })),
        };

        setInitData(quoteInitData);
        setForm(buildInitialForm(quoteInitData));
        setQuoteItems(buildInitialQuoteItems(quoteInitData));
        setSampleItems(buildInitialSampleItems(quoteInitData));
      } catch (error) {
        console.error("견적 작성 초기 정보 조회 실패", error);
        setSubmitErrors(["소싱 요청 정보를 불러오지 못했습니다."]);
      } finally {
        setLoading(false);
      }
    };

    void loadQuoteInit();
  }, [requestId]);

  // ── form 업데이트 ────────────────────────────────────────────────────────
  const updateForm = (field: keyof QuoteForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // ── quoteItems 업데이트 ──────────────────────────────────────────────────
  const addQuoteItem = () => setQuoteItems((prev) => [...prev, makeDefaultQuoteItem()]);
  const removeQuoteItem = (itemIndex: number) => {
    setQuoteItems((prev) => prev.filter((_, index) => index !== itemIndex));
  };
  const updateQuoteItem = (itemIndex: number, field: "quantity" | "unitPrice", value: string) => {
    setQuoteItems((prev) =>
        prev.map((item, index) => (index === itemIndex ? { ...item, [field]: value } : item))
    );
  };
  const addOptionValue = (itemIndex: number) => {
    setQuoteItems((prev) =>
        prev.map((item, index) =>
            index === itemIndex
                ? { ...item, optionValues: [...item.optionValues, { optionName: "", optionValue: "" }] }
                : item
        )
    );
  };
  const removeOptionValue = (itemIndex: number, optionIndex: number) => {
    setQuoteItems((prev) =>
        prev.map((item, index) =>
            index === itemIndex
                ? { ...item, optionValues: item.optionValues.filter((_, i) => i !== optionIndex) }
                : item
        )
    );
  };
  const updateOptionValue = (
      itemIndex: number,
      optionIndex: number,
      field: keyof QuoteOptionValueRow,
      value: string
  ) => {
    setQuoteItems((prev) =>
        prev.map((item, index) =>
            index === itemIndex
                ? {
                  ...item,
                  optionValues: item.optionValues.map((option, i) =>
                      i === optionIndex ? { ...option, [field]: value } : option
                  ),
                }
                : item
        )
    );
  };

  // ── sampleItems 업데이트 ─────────────────────────────────────────────────
  const addSampleItem = () => setSampleItems((prev) => [...prev, makeDefaultSampleItem()]);
  const removeSampleItem = (sampleIndex: number) => {
    setSampleItems((prev) => prev.filter((_, index) => index !== sampleIndex));
  };
  const updateSampleItem = (sampleIndex: number, field: keyof SampleItemRow, value: string) => {
    setSampleItems((prev) =>
        prev.map((sample, index) => (index === sampleIndex ? { ...sample, [field]: value } : sample))
    );
  };

  // ── 계산 ─────────────────────────────────────────────────────────────────
  const quoteItemSnapshots = useMemo(
      () =>
          quoteItems.map((item) => {
            const quantity = toNumber(item.quantity);
            const unitPrice = toNumber(item.unitPrice);
            return {
              optionSummary: buildOptionSummary(item.optionValues),
              quantity,
              unitPrice,
              sample: false,
            };
          }),
      [quoteItems]
  );

  const sampleItemSnapshots = useMemo(
      () =>
          sampleItems.map((sample) => {
            const quantity = toNumber(sample.quantity);
            const unitPrice = toNumber(sample.unitPrice);
            return {
              optionSummary: sample.sampleName.trim(),
              quantity,
              unitPrice,
              sample: true,
            };
          }),
      [sampleItems]
  );

  const totalQuantity = quoteItemSnapshots.reduce((sum, item) => sum + item.quantity, 0);
  const regularSubtotalAmount = quoteItemSnapshots.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
  );
  const sampleSubtotalAmount =
      form.sampleAvailable === "AVAILABLE"
          ? sampleItemSnapshots.reduce(
              (sum, item) => sum + item.quantity * item.unitPrice,
              0
          )
          : 0;
  const subtotalAmount = regularSubtotalAmount + sampleSubtotalAmount;
  const shippingFee = toNumber(form.shippingFee);
  const totalAmount = subtotalAmount + shippingFee;
  const validDaysForDisplay =
      form.validDays === "custom" ? toNumber(form.customValidDays) || 0 : toNumber(form.validDays);

  const sampleSummary = form.sampleAvailable === "AVAILABLE" ? buildSampleSummary(sampleItems) : "";
  const sellerMemoWithSample =
      sampleSummary.trim().length > 0
          ? `${form.sellerMemo}${form.sellerMemo.trim() ? "\n\n" : ""}[샘플 제공 조건]\n${sampleSummary}`
          : form.sellerMemo;

  // ── 제출 ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const validationErrors = validateQuoteForm(
        requestId,
        form,
        quoteItems,
        sampleItems
    );

    if (validationErrors.length > 0) {
      setSubmitErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setSubmitErrors([]);

    const items = [
      ...quoteItemSnapshots,
      ...(form.sampleAvailable === "AVAILABLE"
          ? sampleItemSnapshots.filter(
              (item) => item.optionSummary.length > 0
          )
          : []),
    ];

    const payload = {
      sourcingRequestId: requestId ? Number(requestId) : undefined,
      brandName: form.brandName,
      productName: form.productName,
      categoryName: form.categoryName,
      material: form.material,
      leadTimeDays: toNumber(form.leadTimeDays),
      deliveryCompany: form.deliveryCompany,
      shippingFee,
      validUntil: getValidUntil(form.validDays, form.customValidDays),
      sampleAvailable: form.sampleAvailable === "AVAILABLE",
      sellerMemo: sellerMemoWithSample,
      items,
    };

    try {
      const quoteData =
          await api.post<QuoteCreateResponse>("/quotes", payload);

      navigate(`/seller/quotes/${quoteData.quoteId}`);
    } catch (err) {
      if (isAxiosError<QuoteErrorResponse>(err)) {
        const fieldErrors = Object.values(err.response?.data?.data ?? {});
        setSubmitErrors(
            fieldErrors.length > 0
                ? [...new Set(fieldErrors)]
                : [err.message || "견적서를 제출하지 못했습니다."]
        );
      } else {
        setSubmitErrors([
          err instanceof Error ? err.message : "견적서를 제출하지 못했습니다.",
        ]);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── 로딩 ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <p className="text-sm text-slate-500">소싱 요청 정보를 불러오는 중...</p>
        </div>
    );
  }

  // ── 메인 렌더 ─────────────────────────────────────────────────────────────
  return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1180px] px-4 py-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <Link
                to="/seller/sourcing-requests"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-primary"
            >
              <ChevronLeft size={16} />
              소싱 요청 목록
            </Link>
          </div>

          <header className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
                  <Sparkles size={13} />
                  셀러 견적 작성
                </div>
                <h1 className="text-2xl font-bold text-slate-950">바이어 요청 조건 확인</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  아래 요청 조건을 기준으로 옵션별 견적, 샘플 조건, 출고 정보를 작성합니다.
                </p>
              </div>
              <div className="shrink-0 rounded-lg border border-primary/25 bg-white px-4 py-3 text-sm shadow-sm">
                <p className="text-xs font-semibold text-primary">요청 번호</p>
                <p className="mt-1 font-bold text-slate-950">{initData?.sourcingNo ?? requestId}</p>
              </div>
            </div>

            <div className="rounded-xl border border-primary/25 bg-white shadow-sm ring-1 ring-primary/5">
              <div className="flex flex-col gap-4 border-b border-primary/15 bg-[#fff7f8] px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="mb-2 h-1 w-14 rounded-full bg-primary" />
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">Buyer Request Summary</p>
                  <h2 className="mt-1 text-lg font-bold text-slate-950">
                    {initData?.productName ?? "-"}
                  </h2>
                </div>
                <span className="w-fit rounded-full border border-primary/20 bg-white px-3 py-1 text-xs font-bold text-primary shadow-sm">
                {initData?.needSample === "Y" ? "샘플 확인 후 본 주문 희망" : "샘플 불필요"}
              </span>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-white p-4 md:grid-cols-4">
                <RequestMetric label="카테고리" value="-" />
                <RequestMetric
                    label="희망 수량"
                    value={
                      initData && initData.items.length > 0
                          ? `${initData.items.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()}벌`
                          : "-"
                    }
                />
                <RequestMetric label="희망 납기" value={initData?.deliveryDate ?? "-"} />
                <RequestMetric label="소재" value={initData?.material ?? "-"} />
              </div>

              {initData?.brandName && (
                  <div className="border-t border-slate-200 bg-slate-50/70 px-5 py-4">
                    <p className="text-xs font-bold text-slate-600">브랜드명</p>
                    <p className="mt-1 text-sm leading-6 text-slate-900">{initData.brandName}</p>
                  </div>
              )}
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <main className="space-y-5">
              {/* 상품 기본 정보 */}
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <SectionTitle icon={<Package size={16} />} title="상품 기본 정보" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <FieldLabel>브랜드명</FieldLabel>
                    <input
                        type="text"
                        value={form.brandName}
                        onChange={(event) => updateForm("brandName", event.target.value)}
                        placeholder="예: 루블랑"
                        className={inputClass}
                    />
                  </div>
                  <div>
                    <FieldLabel required>상품명</FieldLabel>
                    <input
                        type="text"
                        value={form.productName}
                        onChange={(event) => updateForm("productName", event.target.value)}
                        placeholder="예: 여성 린넨 오버핏 블라우스"
                        className={inputClass}
                    />
                  </div>
                  <div>
                    <FieldLabel>카테고리</FieldLabel>
                    <select
                        value={form.categoryName}
                        onChange={(event) => updateForm("categoryName", event.target.value)}
                        className={inputClass}
                    >
                      <option value="">선택</option>
                      {CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>소재</FieldLabel>
                    <input
                        type="text"
                        value={form.material}
                        onChange={(event) => updateForm("material", event.target.value)}
                        placeholder="예: 린넨 100%, 면 80% 폴리 20%"
                        className={inputClass}
                    />
                  </div>
                </div>
              </section>

              {/* 견적 품목 */}
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <SectionTitle icon={<FileText size={16} />} title="견적 품목" compact />
                  <button
                      type="button"
                      onClick={addQuoteItem}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-secondary"
                  >
                    <Plus size={14} />
                    품목 추가
                  </button>
                </div>

                <div className="space-y-4">
                  {quoteItems.map((item, itemIndex) => {
                    const quantity = toNumber(item.quantity);
                    const unitPrice = toNumber(item.unitPrice);
                    const totalPrice = quantity * unitPrice;
                    const optionSummary = buildOptionSummary(item.optionValues);

                    return (
                        <div key={itemIndex} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-slate-900">품목 {itemIndex + 1}</p>
                              <p className="mt-0.5 text-xs text-slate-500">
                                바이어가 비교하기 쉽도록 옵션별 수량과 단가를 나눠 입력하세요.
                              </p>
                            </div>
                            {quoteItems.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeQuoteItem(itemIndex)}
                                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                                >
                                  <X size={16} />
                                </button>
                            )}
                          </div>

                          <div className="mb-4 space-y-2">
                            {item.optionValues.map((option, optionIndex) => (
                                <div key={optionIndex} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                                  <input
                                      type="text"
                                      value={option.optionName}
                                      onChange={(event) =>
                                          updateOptionValue(itemIndex, optionIndex, "optionName", event.target.value)
                                      }
                                      placeholder="옵션명 예: 색상"
                                      className={inputClass}
                                  />
                                  <input
                                      type="text"
                                      value={option.optionValue}
                                      onChange={(event) =>
                                          updateOptionValue(itemIndex, optionIndex, "optionValue", event.target.value)
                                      }
                                      placeholder="옵션값 예: 블랙"
                                      className={inputClass}
                                  />
                                  {item.optionValues.length > 1 ? (
                                      <button
                                          type="button"
                                          onClick={() => removeOptionValue(itemIndex, optionIndex)}
                                          className="rounded-lg border border-slate-200 bg-white px-2 text-slate-400 transition hover:border-red-200 hover:text-red-500"
                                      >
                                        <X size={15} />
                                      </button>
                                  ) : (
                                      <div className="w-9" />
                                  )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => addOptionValue(itemIndex)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition hover:text-primary"
                            >
                              <Plus size={13} />
                              옵션 추가
                            </button>
                          </div>

                          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            <div>
                              <FieldLabel required>수량</FieldLabel>
                              <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(event) => {
                                    const value = event.target.value;
                                    if (value === "" || Number(value) >= 1) {
                                      updateQuoteItem(itemIndex, "quantity", value);
                                    }
                                  }}
                                  onKeyDown={preventInvalidNumberKey}
                                  min="1"
                                  placeholder="1"
                                  className={inputClass}
                              />
                            </div>
                            <div>
                              <FieldLabel required>단가</FieldLabel>
                              <input
                                  type="number"
                                  value={item.unitPrice}
                                  onChange={(event) => {
                                    const value = event.target.value;
                                    if (value === "" || Number(value) >= 0) {
                                      updateQuoteItem(itemIndex, "unitPrice", value);
                                    }
                                  }}
                                  onKeyDown={preventInvalidNumberKey}
                                  min="0"
                                  placeholder="0"
                                  className={inputClass}
                              />
                            </div>
                            <div>
                              <FieldLabel>품목 금액</FieldLabel>
                              <div className={mutedInputClass}>{formatPrice(totalPrice)}</div>
                            </div>
                          </div>

                          {optionSummary && (
                              <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                                옵션 요약{" "}
                                <span className="ml-2 font-semibold text-slate-800">{optionSummary}</span>
                              </div>
                          )}
                        </div>
                    );
                  })}
                </div>
              </section>

              {/* 견적 조건 */}
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <SectionTitle icon={<Calendar size={16} />} title="견적 조건" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <FieldLabel>견적 유효 기간</FieldLabel>
                    <select
                        value={form.validDays}
                        onChange={(event) => updateForm("validDays", event.target.value)}
                        className={inputClass}
                    >
                      <option value="3">3일</option>
                      <option value="5">5일</option>
                      <option value="7">7일</option>
                      <option value="14">14일</option>
                      <option value="30">30일</option>
                      <option value="custom">직접 입력</option>
                    </select>
                    {form.validDays === "custom" && (
                        <div className="mt-2 flex items-center gap-2">
                          <input
                              type="number"
                              min="1"
                              value={form.customValidDays}
                              onChange={(event) => {
                                const value = event.target.value;
                                if (value === "" || Number(value) >= 1) {
                                  updateForm("customValidDays", value);
                                }
                              }}
                              onKeyDown={preventInvalidNumberKey}
                              placeholder="45"
                              className="w-28 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                          />
                          <span className="text-sm text-slate-500">일</span>
                        </div>
                    )}
                  </div>
                  {initData?.needSample === "Y" && (
                      <div>
                        <FieldLabel>샘플 제공 여부</FieldLabel>
                        <select
                            value={form.sampleAvailable}
                            onChange={(event) =>
                                updateForm("sampleAvailable", event.target.value as "AVAILABLE" | "UNAVAILABLE")
                            }
                            className={inputClass}
                        >
                          <option value="AVAILABLE">샘플 제공 가능</option>
                          <option value="UNAVAILABLE">샘플 제공 불가</option>
                        </select>
                      </div>
                  )}
                </div>
              </section>

              {/* 샘플 제공 조건 */}
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <SectionTitle icon={<Package size={16} />} title="샘플 제공 조건" compact />
                  {initData?.needSample === "N" ? (
                      <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                    바이어 샘플 불필요
                  </span>
                  ) : form.sampleAvailable === "AVAILABLE" ? (
                      <button
                          type="button"
                          onClick={addSampleItem}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-secondary"
                      >
                        <Plus size={14} />
                        샘플 추가
                      </button>
                  ) : null}
                </div>

                {initData?.needSample === "N" ? (
                    <p className="text-sm text-slate-400">바이어가 샘플을 요청하지 않은 소싱입니다.</p>
                ) : form.sampleAvailable === "UNAVAILABLE" ? (
                    <p className="text-sm text-slate-400">
                      샘플 제공 가능 여부를 ‘샘플 제공 가능’으로 변경하면 조건을 입력할 수 있습니다.
                    </p>
                ) : (
                    <div className="space-y-3">
                      {sampleItems.map((sample, sampleIndex) => {
                        const quantity = toNumber(sample.quantity);
                        const unitPrice = toNumber(sample.unitPrice);
                        const totalPrice = quantity * unitPrice;

                        return (
                            <div key={sampleIndex} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                              <div className="mb-3 flex items-center justify-between">
                                <p className="text-sm font-bold text-slate-900">샘플 {sampleIndex + 1}</p>
                                {sampleItems.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeSampleItem(sampleIndex)}
                                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                                    >
                                      <X size={16} />
                                    </button>
                                )}
                              </div>
                              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                                <div>
                                  <FieldLabel>샘플명</FieldLabel>
                                  <input
                                      type="text"
                                      value={sample.sampleName}
                                      onChange={(event) =>
                                          updateSampleItem(sampleIndex, "sampleName", event.target.value)
                                      }
                                      placeholder="린넨 블라우스 샘플"
                                      className={inputClass}
                                  />
                                </div>
                                <div>
                                  <FieldLabel>수량</FieldLabel>
                                  <input
                                      type="number"
                                      value={sample.quantity}
                                      onChange={(event) => {
                                        const value = event.target.value;
                                        if (value === "" || Number(value) >= 1) {
                                          updateSampleItem(sampleIndex, "quantity", value);
                                        }
                                      }}
                                      onKeyDown={preventInvalidNumberKey}
                                      min="1"
                                      className={inputClass}
                                  />
                                </div>
                                <div>
                                  <FieldLabel>단가</FieldLabel>
                                  <input
                                      type="number"
                                      value={sample.unitPrice}
                                      onChange={(event) => {
                                        const value = event.target.value;
                                        if (value === "" || Number(value) >= 0) {
                                          updateSampleItem(sampleIndex, "unitPrice", value);
                                        }
                                      }}
                                      onKeyDown={preventInvalidNumberKey}
                                      min="0"
                                      placeholder="0"
                                      className={inputClass}
                                  />
                                </div>
                                <div>
                                  <FieldLabel>샘플 금액</FieldLabel>
                                  <div className={mutedInputClass}>{formatPrice(totalPrice)}</div>
                                </div>
                              </div>
                              <textarea
                                  value={sample.memo}
                                  onChange={(event) =>
                                      updateSampleItem(sampleIndex, "memo", event.target.value)
                                  }
                                  placeholder="샘플비 차감 조건, 제작 기간 등"
                                  rows={2}
                                  className={`${inputClass} mt-3 resize-none`}
                              />
                            </div>
                        );
                      })}
                    </div>
                )}
              </section>

              {/* 출고 및 배송 정보 */}
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <SectionTitle icon={<Truck size={16} />} title="출고 및 배송 정보" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <FieldLabel required>예상 출고 소요일</FieldLabel>
                    <input
                        type="number"
                        value={form.leadTimeDays}
                        onChange={(event) => {
                          const value = event.target.value;
                          if (value === "" || Number(value) >= 1) {
                            updateForm("leadTimeDays", value);
                          }
                        }}
                        onKeyDown={preventInvalidNumberKey}
                        min="1"
                        className={inputClass}
                    />
                  </div>
                  <div>
                    <FieldLabel>배송사</FieldLabel>
                    <select
                        value={form.deliveryCompany}
                        onChange={(event) => updateForm("deliveryCompany", event.target.value)}
                        className={inputClass}
                    >
                      <option value="">선택</option>
                      {SHIPPING_COMPANIES.map((company) => (
                          <option key={company} value={company}>
                            {company}
                          </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>배송비</FieldLabel>
                    <input
                        type="number"
                        value={form.shippingFee}
                        onChange={(event) => {
                          const value = event.target.value;
                          if (value === "" || Number(value) >= 0) {
                            updateForm("shippingFee", value);
                          }
                        }}
                        onKeyDown={preventInvalidNumberKey}
                        min="0"
                        className={inputClass}
                    />
                  </div>
                </div>
              </section>

              {/* 셀러 메모 */}
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <SectionTitle icon={<FileText size={16} />} title="셀러 메모" />
                <textarea
                    value={form.sellerMemo}
                    onChange={(event) => updateForm("sellerMemo", event.target.value)}
                    placeholder="재고 확보 여부, 주문 조건, 추가 할인 가능 여부 등을 입력하세요."
                    rows={4}
                    className={`${inputClass} resize-none`}
                />
              </section>

              {/* 에러 메시지 */}
              {submitErrors.length > 0 && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <div className="flex gap-3 text-sm leading-5 text-red-700">
                      <AlertCircle size={15} className="mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold">입력 내용을 확인해주세요.</p>
                        <ul className="mt-2 space-y-1">
                          {submitErrors.map((error) => (
                              <li key={error}>- {error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
              )}

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-3 text-xs leading-5 text-amber-800">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold">제출 전 확인</p>
                    <p>견적 채택 전까지 바이어 협의 요청에 따라 수정 견적서를 다시 제출할 수 있습니다.</p>
                  </div>
                </div>
              </div>
            </main>

            {/* 사이드바 */}
            <aside className="lg:sticky lg:top-6 lg:self-start">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-950">견적 요약</h2>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                  SUBMITTED
                </span>
                </div>

                <div className="space-y-3 border-b border-slate-100 pb-4 text-sm">
                  <SummaryRow label="상품 금액" value={formatPrice(subtotalAmount)} />
                  <SummaryRow label="배송비" value={formatPrice(shippingFee)} />
                </div>

                <div className="flex items-end justify-between border-b border-slate-100 py-5">
                  <div>
                    <p className="text-xs text-slate-500">최종 견적 금액</p>
                    <p className="mt-1 text-xs text-slate-400">샘플 금액은 메모성 조건으로 별도 표시</p>
                  </div>
                  <p className="text-2xl font-black text-primary">{formatPrice(totalAmount)}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 py-4 text-center">
                  <Metric label="수량" value={`${totalQuantity.toLocaleString()}벌`} />
                  <Metric label="출고" value={`${form.leadTimeDays || 0}일`} />
                  <Metric label="유효" value={`${validDaysForDisplay || 0}일`} />
                </div>

                <div className="mb-4 flex gap-2 rounded-lg border border-primary/15 bg-secondary/60 px-3 py-2.5 text-xs leading-5 text-slate-700">
                  <Info size={14} className="mt-0.5 shrink-0 text-primary" />
                  <span>플랫폼 이용 수수료는 결제 단계에서 별도 계산됩니다.</span>
                </div>

                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                  {submitting ? "제출 중..." : "견적서 제출"}
                </button>

                <Link
                    to="/seller/sourcing-requests"
                    className="mt-2 inline-flex w-full items-center justify-center rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary"
                >
                  취소
                </Link>

                <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-500">
                  <div className="mb-1 flex items-center gap-1.5 font-semibold text-slate-700">
                    <Clock size={13} />
                    저장될 주요 값
                  </div>
                  제출 전 품목 금액, 배송비, 샘플 조건을 한 번 더 확인하세요.
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
  );
}
