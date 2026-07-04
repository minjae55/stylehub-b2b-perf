import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import api from "@/api/axios";
import {
  ChevronLeft, FileText, CheckCircle, Package,
  AlertCircle, Clock, FlaskConical, Building2,
  Download, MessageCircle, XCircle,
  RotateCcw, Loader2, FileSignature,
} from "lucide-react";

type QuoteStatus = "SUBMITTED" | "REVIEWING" | "APPROVED" | "REJECTED" | "NOT_SELECTED" | "NEGOTIATING" | "SAMPLE_REQUESTED" | "EXPIRED";

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
  items: QuoteItemData[];
};

const statusConfig: Record<QuoteStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  SUBMITTED:         { label: "제출됨",        color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",     icon: <FileText size={13} />    },
  REVIEWING:         { label: "검토 중",       color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",     icon: <Clock size={13} />       },
  APPROVED:          { label: "채택 완료",     color: "text-green-700",  bg: "bg-green-50 border-green-200",   icon: <CheckCircle size={13} /> },
  REJECTED:          { label: "거절됨",        color: "text-red-700",    bg: "bg-red-50 border-red-200",       icon: <XCircle size={13} />     },
  NOT_SELECTED:      { label: "미채택",        color: "text-slate-600",  bg: "bg-slate-100 border-slate-200",  icon: <XCircle size={13} />     },
  NEGOTIATING:       { label: "협의 중",       color: "text-purple-700", bg: "bg-purple-50 border-purple-200", icon: <MessageCircle size={13}/> },
  SAMPLE_REQUESTED:  { label: "샘플 결제 진행", color: "text-amber-700",  bg: "bg-amber-50 border-amber-200",   icon: <FlaskConical size={13} /> },
  EXPIRED:           { label: "기간 만료",     color: "text-slate-500",  bg: "bg-slate-100 border-slate-200",  icon: <RotateCcw size={13} />   },
};

function formatDate(isoStr: string) {
  try {
    return new Date(isoStr).toLocaleDateString("ko-KR", {
      year: "numeric", month: "2-digit", day: "2-digit",
    });
  } catch {
    return isoStr;
  }
}

function formatPrice(value: number) {
  return `₩${value.toLocaleString()}`;
}

async function fetchQuote(quoteId: string): Promise<QuoteData> {
  return api.get<QuoteData>(`/quotes/${quoteId}`);
}

export function QuoteDetail({ role = "buyer" }: { role?: "buyer" | "seller" }) {
  const { quoteId } = useParams<{ quoteId: string }>();
  const [quote, setQuote] = useState<QuoteData>();
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!quoteId) return;
    fetchQuote(quoteId)
        .then(setQuote)
        .catch((e) => {
          setLoadError(e instanceof Error ? e.message : "견적 조회에 실패했습니다.");
        })
        .finally(() => setPageLoading(false));
  }, [quoteId]);

  const backPath = role === "buyer"
      ? "/buyer/quotes"
      : "/seller/sourcing-requests";

  if (pageLoading) {
    return (
        <div className="max-w-[900px] mx-auto px-4 py-20 flex items-center justify-center">
          <Loader2 size={22} className="animate-spin text-primary mr-2" />
          <span className="text-sm text-slate-500">불러오는 중...</span>
        </div>
    );
  }

  if (!quote) {
    return (
        <div className="max-w-[900px] mx-auto px-4 py-16 text-center">
          <Package size={48} className="mx-auto mb-4 opacity-30 text-slate-400" />
          <h2 className="text-xl font-bold mb-2 text-slate-900">견적서 정보를 불러올 수 없습니다</h2>
          <p className="text-sm text-slate-500 mb-6">
            {loadError ?? "견적서 목록에서 다시 접근해 주세요."}<br />
            (quoteId: {quoteId})
          </p>
          <Link to="/buyer/my-sourcing" className="bg-primary text-white px-6 py-2.5 rounded-lg font-semibold text-sm">
            목록으로
          </Link>
        </div>
    );
  }

  const regularItems = quote.items.filter((item) => !item.isSample);
  const sampleItems  = quote.items.filter((item) => item.isSample);
  const totalQty     = regularItems.reduce((sum, item) => sum + item.quantity, 0);
  const status       = statusConfig[quote.status] ?? statusConfig["SUBMITTED"];

  return (
      <div className="max-w-[900px] mx-auto px-4 py-8">

        <div className="mb-6">
          <Link to={backPath} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-4">
            <ChevronLeft size={16} /> 소싱 요청 목록으로
          </Link>

          <div className="bg-gradient-to-r from-[#1C1C1C] to-[#2a2a2a] text-white rounded-xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <FileText size={22} className="text-primary" />
                  <h1 className="text-xl font-bold">견적서 상세</h1>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${status.bg} ${status.color}`}>
                  {status.icon} {status.label}
                </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                  <span className="font-mono">{quote.quoteNo}</span>
                  <span>소싱 요청 <span className="text-white font-medium">#{quote.sourcingRequestId}</span></span>
                  <span>제출일 {formatDate(quote.submittedAt)}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-gray-400 mb-0.5">견적 유효기간</div>
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <Clock size={14} className="text-primary" />
                  <span className="text-white">{formatDate(quote.validUntil)}까지</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">

          {/* 거래 당사자 정보 */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
              <Building2 size={15} className="text-primary" />
              <h2 className="text-sm font-semibold text-slate-900">
                {role === "buyer" ? "공급 정보" : "공급사 정보"}
              </h2>
            </div>
            <div className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 size={22} className="text-primary" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  {role === "buyer"
                    ? "익명 공급 견적"
                    : quote.companyName || "-"}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {role === "buyer"
                    ? "계약 체결 전까지 공급사 정보는 공개되지 않습니다."
                    : quote.sellerName || "-"}
                </p>
              </div>
            </div>
          </section>

          {/* 상품 정보 */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
              <Package size={15} className="text-primary" />
              <h2 className="text-sm font-semibold text-slate-900">상품 정보</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {[
                  { label: "브랜드명",    value: quote.brandName },
                  { label: "상품명",      value: quote.productName },
                  { label: "카테고리",    value: quote.categoryName },
                  { label: "소재",        value: quote.material },
                  { label: "출고 소요일", value: quote.leadTimeDays ? `${quote.leadTimeDays}일` : "-", highlight: true },
                ].map((row) => (
                    <div key={row.label}>
                      <div className="text-xs text-slate-500 mb-0.5">{row.label}</div>
                      <div className={`font-medium ${row.highlight ? "text-primary" : "text-slate-900"}`}>
                        {row.value || "—"}
                      </div>
                    </div>
                ))}
              </div>
            </div>
          </section>

          {/* 견적 품목 */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-primary" />
                <h2 className="text-sm font-semibold text-slate-900">견적 품목</h2>
              </div>
              <span className="text-xs text-slate-500">총 {totalQty.toLocaleString()}장</span>
            </div>
            <div className="divide-y divide-slate-100">
              {regularItems.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-slate-400">등록된 품목이 없습니다.</p>
              ) : (
                  regularItems.map((item) => (
                      <div key={item.quoteItemId} className="px-5 py-4 flex items-center justify-between gap-4 text-sm">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{item.optionSummary || "-"}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            수량 {item.quantity.toLocaleString()}장 · 단가 {formatPrice(item.unitPrice)}
                          </p>
                        </div>
                        <p className="font-bold text-slate-900 font-mono">{formatPrice(item.totalPrice)}</p>
                      </div>
                  ))
              )}
            </div>
          </section>

          {/* 샘플 품목 */}
          {sampleItems.length > 0 && (
              <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
                  <FlaskConical size={15} className="text-primary" />
                  <h2 className="text-sm font-semibold text-slate-900">샘플 품목</h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {sampleItems.map((item) => (
                      <div key={item.quoteItemId} className="px-5 py-4 flex items-center justify-between gap-4 text-sm">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{item.optionSummary || "-"}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            수량 {item.quantity.toLocaleString()}장 · 단가 {formatPrice(item.unitPrice)}
                          </p>
                        </div>
                        <p className="font-bold text-slate-900 font-mono">{formatPrice(item.totalPrice)}</p>
                      </div>
                  ))}
                </div>
              </section>
          )}

          {/* 배송 정보 */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
              <Building2 size={15} className="text-primary" />
              <h2 className="text-sm font-semibold text-slate-900">배송 정보</h2>
            </div>
            <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-xs text-slate-500 mb-0.5">택배사</div>
                <div className="font-medium text-slate-900">{quote.deliveryCompany || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-0.5">배송비</div>
                <div className="font-medium text-slate-900">{formatPrice(quote.shippingFee)}</div>
              </div>
            </div>
          </section>

          {/* 견적 조건 */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
              <Clock size={15} className="text-primary" />
              <h2 className="text-sm font-semibold text-slate-900">견적 조건</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${
                  quote.sampleAvailable
                      ? "bg-amber-50 border-amber-200 text-amber-700"
                      : "bg-slate-100 border-slate-200 text-slate-500"
              }`}>
                <FlaskConical size={14} />
                {quote.sampleAvailable ? "샘플 제공 가능" : "샘플 제공 불가"}
              </div>
              {quote.sellerMemo && (
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1.5">공급사 메모</div>
                    <div className="text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 leading-relaxed whitespace-pre-line">
                      {quote.sellerMemo}
                    </div>
                  </div>
              )}
            </div>
          </section>

          {/* 견적 금액 요약 */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
              <Clock size={15} className="text-primary" />
              <h2 className="text-sm font-semibold text-slate-900">견적 금액 요약</h2>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>상품 금액 ({totalQty.toLocaleString()}장)</span>
                <span className="font-mono">{formatPrice(quote.subtotalAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>배송비</span>
                <span className="font-mono">{formatPrice(quote.shippingFee)}</span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between font-bold text-slate-900">
                <span>견적 총액</span>
                <span className="font-mono text-xl text-primary">{formatPrice(quote.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>출고 소요일</span>
                <span>{quote.leadTimeDays}일</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>견적 유효기간</span>
                <span>{formatDate(quote.validUntil)}까지</span>
              </div>
            </div>
          </section>

          {/* 주의사항 */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-700 leading-relaxed">
              <span className="font-semibold">채택 전 확인하세요 — </span>
              견적 채택 후에는 단가·배송비 등의 내용을 수정하기 어렵습니다.
            </div>
          </div>

          {role === "buyer" && (
              <div className="flex justify-end pb-4">
                <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary"
                >
                  <Download size={15} />
                  PDF 저장
                </button>
              </div>
          )}

          {role === "seller" && quote.status === "APPROVED" && (
              <div className="flex justify-end pb-4">
                <Link
                    to={`/seller/contracts/new/${quote.quoteId}`}
                    className="inline-flex items-center gap-2 bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
                >
                  <FileSignature size={15} />
                  계약서 작성
                </Link>
              </div>
          )}

        </div>
      </div>
  );
}
