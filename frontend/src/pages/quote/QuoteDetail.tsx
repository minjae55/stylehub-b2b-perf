import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Download,
  Eye,
  FileSignature,
  FileText,
  FlaskConical,
  LoaderCircle,
  MessageSquareText,
  Package,
  ShieldCheck,
  Truck,
  XCircle,
} from "lucide-react";
import api from "@/api/axios";

type QuoteStatus =
  | "SUBMITTED"
  | "REVIEWING"
  | "APPROVED"
  | "REJECTED"
  | "NOT_SELECTED"
  | "NEGOTIATING"
  | "SAMPLE_REQUESTED"
  | "EXPIRED"
  | "SUPERSEDED";

type QuoteItemData = {
  quoteItemId: number;
  optionSummary: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isSample: boolean;
};

type QuoteData = {
  quoteId: number;
  quoteNo: string;
  sourcingRequestId: number;
  brandName: string;
  productName: string;
  categoryName: string;
  material: string;
  leadTimeDays: number;
  deliveryCompany: string;
  shippingFee: number;
  validUntil: string;
  sampleAvailable: boolean;
  sellerMemo: string;
  subtotalAmount: number;
  totalAmount: number;
  status: QuoteStatus;
  buyerName: string;
  sellerName: string;
  companyName: string;
  submittedAt: string;
  version: number;
  parentQuoteId: number | null;
  previousTotalAmount: number | null;
  previousSubtotalAmount: number | null;
  previousLeadTimeDays: number | null;
  previousShippingFee: number | null;
  items: QuoteItemData[];
};

const statusConfig: Record<
  QuoteStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  SUBMITTED: {
    label: "바이어 검토 대기",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    icon: <Clock3 size={13} />,
  },
  REVIEWING: {
    label: "검토 중",
    className: "border-blue-200 bg-blue-50 text-blue-700",
    icon: <Eye size={13} />,
  },
  APPROVED: {
    label: "채택 완료",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: <CheckCircle2 size={13} />,
  },
  REJECTED: {
    label: "거절됨",
    className: "border-rose-200 bg-rose-50 text-rose-700",
    icon: <XCircle size={13} />,
  },
  NOT_SELECTED: {
    label: "미채택",
    className: "border-slate-200 bg-slate-100 text-slate-600",
    icon: <XCircle size={13} />,
  },
  NEGOTIATING: {
    label: "협의 중",
    className: "border-violet-200 bg-violet-50 text-violet-700",
    icon: <MessageSquareText size={13} />,
  },
  SAMPLE_REQUESTED: {
    label: "샘플 진행",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    icon: <FlaskConical size={13} />,
  },
  EXPIRED: {
    label: "기간 만료",
    className: "border-slate-200 bg-slate-100 text-slate-500",
    icon: <Clock3 size={13} />,
  },
  SUPERSEDED: {
    label: "재견적으로 대체됨",
    className: "border-slate-200 bg-slate-100 text-slate-500",
    icon: <Clock3 size={13} />,
  },
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function formatPrice(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

// 협의로 새로 받은 견적(재견적)이 이전 조건 대비 얼마나 바뀌었는지 보여준다.
function DeltaBadge({
  before,
  after,
  unit,
}: {
  before: number;
  after: number;
  unit: string;
}) {
  const diff = after - before;

  if (diff === 0) {
    return (
      <span className="ml-1.5 text-xs font-bold text-slate-400">
        (변동 없음)
      </span>
    );
  }

  const decreased = diff < 0;

  return (
    <span
      className={`ml-1.5 text-xs font-black ${
        decreased ? "text-blue-600" : "text-rose-600"
      }`}
    >
      ({decreased ? "▼" : "▲"}
      {Math.abs(diff).toLocaleString("ko-KR")}
      {unit})
    </span>
  );
}

async function fetchQuote(quoteId: string) {
  return api.get<QuoteData>(`/quotes/${quoteId}`);
}

export function QuoteDetail({
  role = "buyer",
}: {
  role?: "buyer" | "seller";
}) {
  const { quoteId } = useParams<{ quoteId: string }>();
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");

  // 바이어의 견적 채택/거절 (셀러는 이 액션을 사용하지 않는다)
  const [pendingAction, setPendingAction] = useState<
    "APPROVED" | "REJECTED" | null
  >(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusActionError, setStatusActionError] = useState("");

  useEffect(() => {
    if (!quoteId) {
      setLoadError("유효하지 않은 견적서입니다.");
      setPageLoading(false);
      return;
    }

    fetchQuote(quoteId)
      .then(setQuote)
      .catch((error) => {
        setLoadError(
          error instanceof Error
            ? error.message
            : "견적 조회에 실패했습니다.",
        );
      })
      .finally(() => setPageLoading(false));
  }, [quoteId]);

  const handlePdf = async (download: boolean) => {
    if (!quote || isPdfLoading) return;

    const previewWindow = download
      ? null
      : window.open("about:blank", "_blank");

    if (!download && !previewWindow) {
      setPdfError("팝업이 차단되어 PDF 미리보기를 열 수 없습니다.");
      return;
    }

    if (previewWindow) previewWindow.opener = null;

    try {
      setIsPdfLoading(true);
      setPdfError("");
      const response = await fetch(`/api/quotes/${quote.quoteId}/pdf`, {
        credentials: "include",
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(
          errorBody?.message || "견적서 PDF를 생성하지 못했습니다.",
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      if (download) {
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${quote.quoteNo}.pdf`;
        anchor.click();
      } else if (previewWindow) {
        previewWindow.location.href = url;
      }

      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      previewWindow?.close();
      setPdfError(
        error instanceof Error
          ? error.message
          : "견적서 PDF를 생성하지 못했습니다.",
      );
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!pendingAction || !quote || isUpdatingStatus) return;

    try {
      setIsUpdatingStatus(true);
      setStatusActionError("");
      await api.patch(`/quotes/${quote.quoteId}/status`, {
        status: pendingAction,
      });
      setQuote({ ...quote, status: pendingAction });
      setPendingAction(null);
    } catch (error) {
      console.error("견적 상태 변경 실패", error);
      setStatusActionError(
        error instanceof Error
          ? error.message
          : "견적 상태를 변경하지 못했습니다.",
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const backPath = role === "buyer" ? "/buyer/quotes" : "/seller/quotes";

  if (pageLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoaderCircle size={26} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <Package size={44} className="mx-auto text-slate-300" />
        <h1 className="mt-4 text-xl font-black text-slate-950">
          견적서를 불러올 수 없습니다
        </h1>
        <p className="mt-2 text-sm text-slate-500">{loadError}</p>
        <Link
          to={backPath}
          className="mt-6 inline-flex rounded-md bg-slate-950 px-5 py-2.5 text-sm font-bold text-white"
        >
          목록으로
        </Link>
      </div>
    );
  }

  const regularItems = quote.items.filter((item) => !item.isSample);
  const sampleItems = quote.items.filter((item) => item.isSample);
  const totalQuantity = regularItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const averageUnitPrice =
    totalQuantity > 0
      ? Math.round(
        regularItems.reduce((sum, item) => sum + item.totalPrice, 0)
          / totalQuantity,
      )
      : 0;
  const status = statusConfig[quote.status] ?? statusConfig.SUBMITTED;

  const canRespond =
    role === "buyer"
    && (
      quote.status === "SUBMITTED"
      || quote.status === "SAMPLE_REQUESTED"
      || quote.status === "NEGOTIATING"
    );
  const canOpenNegotiation =
    role === "buyer"
    && (quote.status === "SUBMITTED" || quote.status === "NEGOTIATING");

  // 바이어 견적 목록에서 소싱 요청별로 접혀있던 견적 그룹을 펼친 채 이 견적서로 들어왔을 텐데,
  // "견적 목록"으로 돌아갔을 때 그 그룹이 다시 접혀서 안 보이지 않도록 어느 소싱 요청 그룹이었는지
  // 쿼리 파라미터로 같이 넘겨준다.
  const backPathWithGroup =
    role === "buyer"
      ? `/buyer/quotes?expandedGroup=${quote.sourcingRequestId}`
      : backPath;

  return (
    <div className="min-h-screen bg-[#f7f9fb] px-4 py-8 sm:px-6">
      <main className="mx-auto w-full max-w-[1280px]">
        <Link
          to={backPathWithGroup}
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-950"
        >
          <ChevronLeft size={16} />
          견적 목록
        </Link>

        <header className="mb-7 flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">
                {quote.productName}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold ${status.className}`}
              >
                {status.icon}
                {status.label}
              </span>
              {quote.parentQuoteId !== null && (
                <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">
                  재견적 v{quote.version}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              제출일 {formatDate(quote.submittedAt)} · 견적번호{" "}
              <span className="font-mono font-bold text-slate-700">
                {quote.quoteNo}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handlePdf(false)}
              disabled={isPdfLoading}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {isPdfLoading ? (
                <LoaderCircle size={15} className="animate-spin" />
              ) : (
                <Eye size={15} />
              )}
              PDF 미리보기
            </button>
            <button
              type="button"
              onClick={() => void handlePdf(true)}
              disabled={isPdfLoading}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Download size={15} />
              PDF 저장
            </button>
          </div>
        </header>

        {pdfError && (
          <div className="mb-5 flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            <AlertCircle size={16} />
            {pdfError}
          </div>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            {quote.parentQuoteId !== null && (
              <section className="rounded-lg border border-violet-200 bg-violet-50/40 p-5 shadow-sm">
                <SectionHeading
                  icon={<MessageSquareText size={17} />}
                  title="협의로 새로 받은 견적입니다"
                />
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  이전 견적 대비 조건이 아래와 같이 변경되었습니다.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-400">
                      예상 출고
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      {quote.leadTimeDays}일
                      {quote.previousLeadTimeDays !== null && (
                        <DeltaBadge
                          before={quote.previousLeadTimeDays}
                          after={quote.leadTimeDays}
                          unit="일"
                        />
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400">
                      배송비
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      {formatPrice(quote.shippingFee)}
                      {quote.previousShippingFee !== null && (
                        <DeltaBadge
                          before={quote.previousShippingFee}
                          after={quote.shippingFee}
                          unit="원"
                        />
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400">
                      최종 견적 금액
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      {formatPrice(quote.totalAmount)}
                      {quote.previousTotalAmount !== null && (
                        <DeltaBadge
                          before={quote.previousTotalAmount}
                          after={quote.totalAmount}
                          unit="원"
                        />
                      )}
                    </p>
                  </div>
                </div>
              </section>
            )}

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <SectionHeading icon={<FileText size={17} />} title="견적 개요" />
              <div className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                <Info label="상품명" value={quote.productName} />
                <Info label="브랜드" value={quote.brandName} />
                <Info label="카테고리" value={quote.categoryName} />
                <Info label="소재" value={quote.material} />
                <Info
                  label="예상 출고"
                  value={`${quote.leadTimeDays}일`}
                />
                <Info
                  label="견적 유효일"
                  value={formatDate(quote.validUntil)}
                  emphasized
                />
              </div>
            </section>

            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                <SectionHeading
                  icon={<Package size={17} />}
                  title="품목별 견적"
                  compact
                />
                <span className="text-xs font-bold text-slate-500">
                  {regularItems.length}개 옵션 · {totalQuantity.toLocaleString()}벌
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left">
                  <thead className="border-b border-slate-200 text-xs font-bold text-slate-500">
                    <tr>
                      <th className="px-5 py-3">옵션</th>
                      <th className="px-4 py-3 text-right">수량</th>
                      <th className="px-4 py-3 text-right">단가</th>
                      <th className="px-5 py-3 text-right">금액</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {regularItems.map((item) => (
                      <tr key={item.quoteItemId} className="hover:bg-blue-50/60">
                        <td className="px-5 py-4">
                          <p className="text-sm font-black text-slate-900">
                            {item.optionSummary || "옵션 지정 없음"}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {quote.productName}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-right text-sm font-bold">
                          {item.quantity.toLocaleString()}벌
                        </td>
                        <td className="px-4 py-4 text-right text-sm">
                          {formatPrice(item.unitPrice)}
                        </td>
                        <td className="px-5 py-4 text-right text-sm font-black text-blue-700">
                          {formatPrice(item.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="grid gap-6 md:grid-cols-2">
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <SectionHeading icon={<Truck size={17} />} title="배송 조건" />
                <dl className="mt-5 space-y-4">
                  <DetailRow
                    label="배송사"
                    value={quote.deliveryCompany || "협의 배송"}
                  />
                  <DetailRow
                    label="배송비"
                    value={
                      quote.shippingFee === 0
                        ? "무료"
                        : formatPrice(quote.shippingFee)
                    }
                  />
                  <DetailRow
                    label="예상 출고"
                    value={`${quote.leadTimeDays}일`}
                  />
                </dl>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <SectionHeading
                  icon={<FlaskConical size={17} />}
                  title="샘플 제공"
                />
                <div className="mt-5 flex items-center justify-between">
                  <span className="text-sm text-slate-500">제공 상태</span>
                  <span
                    className={`rounded-md px-2 py-1 text-xs font-bold ${
                      quote.sampleAvailable
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {quote.sampleAvailable ? "제공 가능" : "제공 불가"}
                  </span>
                </div>
                <div className="mt-4 border-t border-slate-100 pt-4">
                  {sampleItems.length > 0 ? (
                    <div className="space-y-3">
                      {sampleItems.map((item) => (
                        <div
                          key={item.quoteItemId}
                          className="flex items-start justify-between gap-3 text-sm"
                        >
                          <div>
                            <p className="font-bold text-slate-800">
                              {item.optionSummary || "샘플"}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-400">
                              {item.quantity}벌
                            </p>
                          </div>
                          <p className="font-black">
                            {formatPrice(item.totalPrice)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">
                      별도 샘플 품목이 없습니다.
                    </p>
                  )}
                </div>
              </section>
            </div>

            {quote.sellerMemo && (
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <SectionHeading
                  icon={<MessageSquareText size={17} />}
                  title="셀러 메모"
                />
                <p className="mt-4 whitespace-pre-wrap border-l-4 border-blue-600 bg-blue-50 px-4 py-3 text-sm leading-6 text-slate-700">
                  {quote.sellerMemo}
                </p>
              </section>
            )}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-6 lg:col-span-4">
            <section className="overflow-hidden rounded-lg border border-blue-200 bg-blue-50 p-6 text-slate-900 shadow-sm">
              <p className="text-xs font-black text-blue-700">
                FINANCIAL SUMMARY
              </p>
              <p className="mt-3 text-sm text-slate-500">최종 견적 금액</p>
              <p className="mt-1 text-3xl font-black text-slate-950">
                {formatPrice(quote.totalAmount)}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-blue-200 pt-5">
                <Metric
                  label="총 수량"
                  value={`${totalQuantity.toLocaleString()}벌`}
                />
                <Metric
                  label="평균 단가"
                  value={formatPrice(averageUnitPrice)}
                />
              </div>

              <dl className="mt-5 space-y-3 border-t border-blue-200 pt-5 text-sm">
                <DarkRow
                  label="상품 금액"
                  value={formatPrice(quote.subtotalAmount)}
                />
                <DarkRow
                  label="배송비"
                  value={formatPrice(quote.shippingFee)}
                />
              </dl>


            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <SectionHeading
                icon={<Building2 size={17} />}
                title={role === "seller" ? "바이어 정보" : "공급 정보"}
              />
              <div className="mt-5 flex items-center gap-3">
                <span className="flex size-13 items-center justify-center rounded-full bg-blue-50 text-sm font-black text-blue-700">
                  {role === "seller" ? "Buyer" : "Seller"}
                </span>
                <div>
                  <p className="text-sm font-black text-slate-900">
                    {role === "seller"
                      ?  "바이어 담당자"
                      : "익명 공급사"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {role === "seller"
                      ? `소싱 요청 #${quote.sourcingRequestId}`
                      : "계약 체결 전까지 공급사 정보가 보호됩니다."}
                  </p>
                </div>
              </div>
            </section>

            <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <ShieldCheck size={20} className="shrink-0 text-blue-700" />
              <div>
                <p className="text-sm font-black text-slate-900">
                  거래 보호 안내
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  계약과 결제 과정은 플랫폼 거래 기록으로 안전하게
                  관리됩니다.
                </p>
              </div>
            </div>

            {role === "seller" && quote.status === "APPROVED" && (
              <Link
                to={`/seller/contracts/new/${quote.quoteId}`}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950 text-sm font-black text-white hover:bg-slate-800"
              >
                <FileSignature size={16} />
                계약서 작성
              </Link>
            )}

            {canRespond && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setPendingAction("APPROVED")}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950 text-sm font-black text-white hover:bg-slate-800"
                >
                  <CheckCircle2 size={16} />이 견적 채택하기
                </button>
                <div className="flex gap-2">
                  {canOpenNegotiation && (
                    <Link
                      to="/negotiations"
                      state={{ quoteId: quote.quoteId }}
                      className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      <MessageSquareText size={14} />
                      협의 요청
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => setPendingAction("REJECTED")}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <XCircle size={14} />
                    거절
                  </button>
                </div>
                <p className="text-center text-[11px] leading-5 text-slate-400">
                  채택하면 같은 소싱 요청의 다른 견적은 자동으로 미채택
                  처리됩니다.
                </p>
              </div>
            )}
          </aside>
        </div>
      </main>

      {pendingAction && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="quote-status-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
        >
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                pendingAction === "APPROVED"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              {pendingAction === "APPROVED" ? (
                <CheckCircle2 size={20} />
              ) : (
                <XCircle size={20} />
              )}
            </div>

            <h2
              id="quote-status-modal-title"
              className="mt-4 text-lg font-black text-slate-950"
            >
              {pendingAction === "APPROVED"
                ? "이 견적을 채택하시겠습니까?"
                : "이 견적을 거절하시겠습니까?"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {pendingAction === "APPROVED"
                ? "채택하면 같은 소싱 요청의 다른 견적은 자동으로 미채택 처리되며, 셀러가 확인 후 계약서를 작성해 전달합니다."
                : "거절한 견적은 다시 채택할 수 없습니다."}
            </p>

            {statusActionError && (
              <p className="mt-3 flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                {statusActionError}
              </p>
            )}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => {
                  setPendingAction(null);
                  setStatusActionError("");
                }}
                className="h-10 flex-1 rounded-md border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => void handleStatusUpdate()}
                className={`h-10 flex-1 rounded-md text-sm font-bold text-white disabled:opacity-50 ${
                  pendingAction === "APPROVED" ? "bg-primary" : "bg-rose-600"
                }`}
              >
                {isUpdatingStatus
                  ? "처리 중..."
                  : pendingAction === "APPROVED"
                    ? "견적 채택"
                    : "견적 거절"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeading({
  icon,
  title,
  compact = false,
}: {
  icon: React.ReactNode;
  title: string;
  compact?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 ${compact ? "" : "border-b border-slate-100 pb-3"}`}>
      <span className="text-blue-700">{icon}</span>
      <h2 className="text-sm font-black text-slate-950">{title}</h2>
    </div>
  );
}

function Info({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value?: string | null;
  emphasized?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p
        className={`mt-1 text-sm font-bold ${
          emphasized ? "text-rose-600" : "text-slate-900"
        }`}
      >
        {value || "-"}
      </p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-black text-slate-900">{value}</dd>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black text-slate-900">{value}</p>
    </div>
  );
}

function DarkRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-bold text-slate-900">{value}</dd>
    </div>
  );
}
