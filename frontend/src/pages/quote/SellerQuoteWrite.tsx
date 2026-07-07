import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { isAxiosError } from "axios";
import {
  AlertCircle,
  ChevronLeft,
  Clock,
  FileText,
  Info,
  Package,
  Plus,
  Send,
  Truck,
  X,
} from "lucide-react";
import api from "@/api/axios";

const CATEGORIES = ["상의", "하의", "원피스/세트", "아우터", "이너웨어", "액세서리"];
const SHIPPING_COMPANIES = ["CJ대한통운", "롯데택배", "한진택배", "로젠택배", "자체 배송"];

// ─── 타입 ───────────────────────────────────────────────────────────────────

type QuoteInitItem = {
  optionSummary: string | null;
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
    option_summary: string | null;
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
    optionValues: parseOptionSummary(item.optionSummary),
    quantity: item.quantity ? String(item.quantity) : "",
    unitPrice: "",
  }));
}

function buildInitialSampleItems(data: QuoteInitData): SampleItemRow[] {
  if (data.needSample !== "Y") return [makeDefaultSampleItem()];

  return data.items.map((item) => ({
    sampleName: item.optionSummary || data.productName,
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

function parseOptionSummary(summary: string | null): QuoteOptionValueRow[] {
  if (!summary?.trim()) {
    return DEFAULT_OPTION_VALUES.map((option) => ({ ...option }));
  }

  return summary
      .split(/\s*\/\s*|\s*,\s*/)
      .filter(Boolean)
      .map((part, index) => {
        const separatorIndex = part.search(/[:：]/);

        if (separatorIndex >= 0) {
          return {
            optionName: part.slice(0, separatorIndex).trim(),
            optionValue: part.slice(separatorIndex + 1).trim(),
          };
        }

        return {
          optionName:
              DEFAULT_OPTION_VALUES[index]?.optionName ?? `옵션 ${index + 1}`,
          optionValue: part.trim(),
        };
      });
}

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
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-3 focus:ring-blue-100";

const mutedInputClass =
    "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900";

function SectionTitle({ icon, title, compact }: { icon: React.ReactNode; title: string; compact?: boolean }) {
  return (
      <div className={compact ? "" : "mb-4"}>
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-950">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          {icon}
        </span>
          {title}
        </h2>
      </div>
  );
}

function RequestMetric({ label, value }: { label: string; value: string }) {
  return (
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <p className="text-xs font-bold text-slate-500">{label}</p>
        <p className="mt-1 text-base font-black text-slate-900">{value}</p>
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

      navigate(`/seller/quotes`);
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
        <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <Link
                to="/seller/sourcing-requests"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-blue-700"
            >
              <ChevronLeft size={16} />
              소싱 요청 목록
            </Link>
          </div>

          <header className="mb-6">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="mt-1 text-2xl font-black text-slate-950">
                  견적서 작성
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  바이어 요청 조건을 확인하고 옵션별 공급 단가와 납품 조건을 입력합니다.
                </p>
              </div>
              <div className="text-left lg:text-right">
                <p className="text-xs font-semibold text-slate-400">요청 번호</p>
                <p className="mt-1 font-mono text-sm font-black text-slate-900">
                  {initData?.sourcingNo ?? requestId}
                </p>
              </div>
            </div>

            <section className="overflow-hidden rounded-lg border border-blue-200 bg-blue-50 text-slate-900 shadow-sm">
              <div className="bg-blue-50 px-5 py-6 sm:px-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-blue-100 px-2 py-1 text-[11px] font-black text-blue-700">
                        BUYER REQUEST
                      </span>
                      {initData?.needSample === "Y" && (
                        <span className="rounded border border-blue-200 bg-white px-2 py-1 text-[11px] font-bold text-blue-700">
                          샘플 요청 포함
                        </span>
                      )}
                    </div>
                    <h2 className="mt-4 text-xl font-black sm:text-2xl">
                      {initData?.productName ?? "-"}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      {initData?.brandName
                        ? `브랜드 ${initData.brandName}`
                        : "브랜드 정보 없음"}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 border-t border-blue-200 pt-5 md:grid-cols-4">
                  <RequestMetric
                    label="총 요청 수량"
                    value={
                      initData && initData.items.length > 0
                        ? `${initData.items.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()}벌`
                        : "-"
                    }
                  />
                  <RequestMetric
                    label="희망 납기"
                    value={initData?.deliveryDate ?? "-"}
                  />
                  <RequestMetric
                    label="요청 소재"
                    value={initData?.material ?? "-"}
                  />
                  <RequestMetric
                    label="옵션 조합"
                    value={`${initData?.items.length ?? 0}개`}
                  />
                </div>
              </div>

              <div className="border-t border-blue-200 bg-slate-50/70 px-5 py-5 text-slate-900 sm:px-7">
                <div className="flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white">
                      <Package size={17} />
                    </span>
                    <div>
                    <h3 className="text-sm font-black text-blue-950">바이어 요청 옵션</h3>
                    <p className="mt-1 text-xs text-blue-700">
                      요청 옵션과 수량이 아래 견적 품목에 자동 입력됩니다.
                    </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-md bg-white px-2.5 py-1.5 text-xs font-bold text-blue-700 shadow-sm">
                    총 {initData?.items.length ?? 0}개 조합
                  </span>
                </div>

                <div className="mt-3 divide-y divide-blue-100 overflow-hidden rounded-lg border border-blue-200 bg-white shadow-sm">
                  {initData?.items.map((item, index) => (
                    <div
                      key={`${item.optionSummary}-${index}`}
                      className="grid gap-3 px-4 py-3.5 transition hover:bg-blue-50/60 sm:grid-cols-[40px_minmax(0,1fr)_120px_120px] sm:items-center"
                    >
                      <span className="flex size-7 items-center justify-center rounded-md bg-blue-100 text-xs font-black text-blue-700">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {item.optionSummary || "옵션 지정 없음"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-slate-500">본 주문</p>
                        <p className="mt-0.5 text-sm font-black text-slate-950">
                          {item.quantity.toLocaleString()}벌
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-slate-500">샘플</p>
                        <p className="mt-0.5 text-sm font-black text-slate-950">
                          {item.sampleQuantity
                            ? `${item.sampleQuantity.toLocaleString()}벌`
                            : "요청 없음"}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!initData || initData.items.length === 0) && (
                    <p className="px-4 py-5 text-center text-sm text-slate-400">
                      등록된 요청 옵션이 없습니다.
                    </p>
                  )}
                </div>
              </div>
            </section>
          </header>

          <div className="grid items-start gap-6 lg:grid-cols-12">
            <main className="space-y-6 lg:col-span-8">
              {/* 상품 기본 정보 */}
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
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
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <SectionTitle icon={<FileText size={16} />} title="견적 품목" compact />
                  <button
                      type="button"
                      onClick={addQuoteItem}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
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
                        <div key={itemIndex} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                          <div className="mb-4 flex items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
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

                          <div className="mb-4 space-y-2 px-4">
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
                                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition hover:text-blue-700"
                            >
                              <Plus size={13} />
                              옵션 추가
                            </button>
                          </div>

                          <div className="grid grid-cols-1 gap-3 px-4 pb-4 md:grid-cols-3">
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
                              <div className="mx-4 mb-4 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                                <span className="font-bold text-blue-700">옵션 요약</span>{" "}
                                <span className="ml-2 font-semibold text-slate-800">{optionSummary}</span>
                              </div>
                          )}
                        </div>
                    );
                  })}
                </div>
              </section>

              {/* 납품 및 견적 조건 */}
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <SectionTitle icon={<Truck size={16} />} title="납품 및 견적 조건" />
                <p className="-mt-2 mb-5 text-xs text-slate-500">
                  견적 유효기간과 출고·배송 조건을 한 곳에서 설정합니다.
                </p>
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
                              className="w-28 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                          />
                          <span className="text-sm text-slate-500">일</span>
                        </div>
                    )}
                  </div>
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
                  {initData?.needSample === "Y" && (
                      <div className="md:col-span-2">
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
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
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
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
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
                            <div key={sampleIndex} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
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

              {/* 셀러 메모 */}
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <SectionTitle icon={<FileText size={16} />} title="셀러 메모" />
                <textarea
                    value={form.sellerMemo}
                    onChange={(event) => updateForm("sellerMemo", event.target.value)}
                    placeholder="재고 확보 여부, 주문 조건, 추가 할인 가능 여부 등을 입력하세요."
                    rows={4}
                    className={`${inputClass} resize-none`}
                />
              </section>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
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
            <aside className="space-y-4 lg:sticky lg:top-6 lg:col-span-4">
              <section className="overflow-hidden rounded-lg border border-slate-200 bg-white p-6 text-slate-900 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-blue-700">
                    QUOTATION SUMMARY
                  </p>
                </div>

                <p className="mt-6 text-sm text-slate-500">총 견적 금액</p>
                <p className="mt-1 text-3xl font-black text-slate-950">
                  {formatPrice(totalAmount)}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  일반 상품과 샘플, 배송비를 포함한 금액입니다.
                </p>

                <div className="mt-6 grid grid-cols-3 gap-3 border-t border-slate-100 pt-5">
                  <div>
                    <p className="text-[11px] text-slate-500">총 수량</p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      {totalQuantity.toLocaleString()}벌
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500">출고</p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      {form.leadTimeDays || 0}일
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500">유효기간</p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      {validDaysForDisplay || 0}일
                    </p>
                  </div>
                </div>

                <dl className="mt-5 space-y-3 border-t border-slate-100 pt-5 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">일반 상품 금액</dt>
                    <dd className="font-bold text-slate-900">
                      {formatPrice(regularSubtotalAmount)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">샘플 금액</dt>
                    <dd className="font-bold text-slate-900">
                      {formatPrice(sampleSubtotalAmount)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">배송비</dt>
                    <dd className="font-bold text-slate-900">{formatPrice(shippingFee)}</dd>
                  </div>
                  <div className="flex items-end justify-between gap-3 border-t border-slate-200 pt-4">
                    <dt className="font-black text-slate-900">합계</dt>
                    <dd className="text-lg font-black text-blue-700">
                      {formatPrice(totalAmount)}
                    </dd>
                  </div>
                </dl>

                {submitErrors.length > 0 && (
                  <div
                    role="alert"
                    className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-4"
                  >
                    <div className="flex gap-3 text-sm leading-5 text-rose-700">
                      <AlertCircle size={17} className="mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-black">제출할 수 없는 항목이 있습니다.</p>
                        <ul className="mt-2 space-y-1.5 text-xs">
                          {submitErrors.map((error) => (
                            <li key={error} className="flex gap-1.5">
                              <span aria-hidden="true">•</span>
                              <span>{error}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={16} />
                  {submitting ? "제출 중..." : "견적서 제출"}
                </button>
              </section>

              <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <Info size={17} className="mt-0.5 shrink-0 text-blue-700" />
                <p className="text-xs leading-5 text-slate-700">
                  제출 전 옵션별 단가와 배송비를 확인하세요. 플랫폼 이용
                  수수료는 결제 단계에서 별도로 계산됩니다.
                </p>
              </div>

              <Link
                to="/seller/sourcing-requests"
                className="inline-flex h-11 w-full items-center justify-center rounded-md border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                작성 취소
              </Link>
            </aside>
          </div>
        </div>
      </div>
  );
}
