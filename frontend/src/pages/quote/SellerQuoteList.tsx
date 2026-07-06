import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  CheckCircle2,
  Clock3,
  FileText,
  FileSignature,
  MessageSquareText,
  Search,
  Send,
  XCircle,
} from "lucide-react";
import api from "@/api/axios";
import { useAuthStore } from "@/store/useAuthStore";

type QuoteStatus =
  | "SUBMITTED"
  | "NEGOTIATING"
  | "SAMPLE_REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "NOT_SELECTED"
  | "EXPIRED";

type ContractStatus =
  | "DRAFT"
  | "SELLER_SIGNED"
  | "BUYER_SIGNED"
  | "COMPLETED"
  | "CANCELED"
  | "EXPIRED";

type SellerQuote = {
  quoteId: number;
  quoteNo: string;
  sourcingRequestId: number;
  productName: string;
  totalAmount: number;
  leadTimeDays: number;
  validUntil: string;
  status: QuoteStatus;
  submittedAt: string;
  contractStatus: ContractStatus | null;
};

type QuoteFilter = "ALL" | "ACTIVE" | "APPROVED" | "CLOSED";

const statusConfig: Record<
  QuoteStatus,
  { label: string; className: string; icon: ReactNode }
> = {
  SUBMITTED: {
    label: "바이어 검토 중",
    className: "border-blue-200 bg-blue-50 text-blue-700",
    icon: <Send size={12} />,
  },
  NEGOTIATING: {
    label: "협의 중",
    className: "border-violet-200 bg-violet-50 text-violet-700",
    icon: <MessageSquareText size={12} />,
  },
  SAMPLE_REQUESTED: {
    label: "샘플 요청",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    icon: <Clock3 size={12} />,
  },
  APPROVED: {
    label: "견적 채택",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: <CheckCircle2 size={12} />,
  },
  REJECTED: {
    label: "바이어 거절",
    className: "border-slate-200 bg-slate-100 text-slate-600",
    icon: <XCircle size={12} />,
  },
  NOT_SELECTED: {
    label: "미채택",
    className: "border-slate-200 bg-slate-100 text-slate-600",
    icon: <XCircle size={12} />,
  },
  EXPIRED: {
    label: "기간 만료",
    className: "border-rose-200 bg-rose-50 text-rose-700",
    icon: <Clock3 size={12} />,
  },
};

const filters: Array<{ value: QuoteFilter; label: string }> = [
  { value: "ALL", label: "전체" },
  { value: "ACTIVE", label: "진행 중" },
  { value: "APPROVED", label: "채택 완료" },
  { value: "CLOSED", label: "종료" },
];

function formatPrice(value: number) {
  return `${value.toLocaleString()}원`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getRemainingDays(value: string) {
  const today = new Date();
  const validUntil = new Date(value);

  today.setHours(0, 0, 0, 0);
  validUntil.setHours(0, 0, 0, 0);

  return Math.ceil(
    (validUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function matchesFilter(status: QuoteStatus, filter: QuoteFilter) {
  if (filter === "ALL") return true;
  if (filter === "ACTIVE") {
    return (
      status === "SUBMITTED" ||
      status === "NEGOTIATING" ||
      status === "SAMPLE_REQUESTED"
    );
  }
  if (filter === "APPROVED") return status === "APPROVED";
  return (
    status === "REJECTED" ||
    status === "NOT_SELECTED" ||
    status === "EXPIRED"
  );
}

function getSellerProcessDisplay(status: QuoteStatus) {
  switch (status) {
    case "SUBMITTED":
      return {
        label: "바이어 검토 대기",
        className: "border-blue-200 bg-blue-50 text-blue-700",
      };
    case "SAMPLE_REQUESTED":
      return {
        label: "주문 관리에서 확인",
        className: "border-amber-200 bg-amber-50 text-amber-700",
      };
    case "REJECTED":
      return {
        label: "거절 완료",
        className: "border-rose-200 bg-rose-50 text-rose-700",
      };
    case "NOT_SELECTED":
      return {
        label: "미채택",
        className: "border-slate-200 bg-slate-100 text-slate-600",
      };
    case "EXPIRED":
      return {
        label: "기간 만료",
        className: "border-slate-200 bg-slate-100 text-slate-500",
      };
    default:
      return null;
  }
}

export function SellerQuoteList() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const [quotes, setQuotes] = useState<SellerQuote[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const requestedFilter = searchParams.get("status") as QuoteFilter | null;
  const activeFilter = filters.some(
    (filter) => filter.value === requestedFilter
  )
    ? requestedFilter!
    : "ALL";

  const isPresident = user?.role === "PRESIDENT" || user?.role === "ADMIN";

  useEffect(() => {
    const loadQuotes = async () => {
      try {
        setIsLoading(true);
        setLoadError("");
        const response =
          await api.get<SellerQuote[]>("/seller/quotes");
        setQuotes(response);
      } catch (error) {
        console.error("셀러 견적 목록 조회 실패", error);
        setLoadError("견적 목록을 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadQuotes();
  }, []);

  const visibleQuotes = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    return quotes.filter((quote) => {
      const matchesSearch =
        keyword.length === 0 ||
        quote.quoteNo.toLowerCase().includes(keyword) ||
        quote.productName.toLowerCase().includes(keyword) ||
        String(quote.sourcingRequestId).includes(keyword);

      return matchesSearch && matchesFilter(quote.status, activeFilter);
    });
  }, [activeFilter, quotes, searchQuery]);

  const counts = {
    all: quotes.length,
    active: quotes.filter((quote) =>
      matchesFilter(quote.status, "ACTIVE")
    ).length,
    approved: quotes.filter((quote) => quote.status === "APPROVED").length,
    closed: quotes.filter((quote) =>
      matchesFilter(quote.status, "CLOSED")
    ).length,
  };

  const handleFilter = (filter: QuoteFilter) => {
    const next = new URLSearchParams(searchParams);
    if (filter === "ALL") next.delete("status");
    else next.set("status", filter);
    setSearchParams(next);
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <main className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-6 lg:px-10">
        <header className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-950">견적 관리</h1>
            <p className="mt-2 text-sm text-slate-500">
              제출한 견적의 채택 여부와 협의 진행 상태를 확인합니다.
            </p>
          </div>
          <div className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm">
            {isPresident ? "회사 전체 견적" : "내가 작성한 견적"}
          </div>
        </header>

        <section className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
          {[
            {
              label: "전체 견적",
              value: counts.all,
              icon: <FileText size={17} />,
              tone: "bg-slate-100 text-slate-700",
            },
            {
              label: "진행 중",
              value: counts.active,
              icon: <Clock3 size={17} />,
              tone: "bg-blue-50 text-blue-700",
            },
            {
              label: "채택 완료",
              value: counts.approved,
              icon: <CheckCircle2 size={17} />,
              tone: "bg-emerald-50 text-emerald-700",
            },
            {
              label: "종료",
              value: counts.closed,
              icon: <XCircle size={17} />,
              tone: "bg-slate-100 text-slate-500",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-md ${item.tone}`}
                >
                  {item.icon}
                </span>
                <span className="text-xs font-bold text-slate-400">현재</span>
              </div>
              <p className="mt-4 text-sm font-bold text-slate-500">
                {item.label}
              </p>
              <p className="mt-1 text-2xl font-black text-slate-950">
                {item.value}
                <span className="ml-1 text-sm font-bold text-slate-400">
                  건
                </span>
              </p>
            </div>
          ))}
        </section>

        <section>
          <div className="mb-5 border-b border-slate-300">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex gap-3 overflow-x-auto">
                {filters.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => handleFilter(filter.value)}
                    className={`h-11 shrink-0 border-b-2 px-2 text-sm font-bold transition-colors ${
                      activeFilter === filter.value
                        ? "border-blue-600 text-blue-700"
                        : "border-transparent text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {filter.label}
                    <span className="ml-1 text-xs text-slate-400">
                      {filter.value === "ALL"
                        ? counts.all
                        : filter.value === "ACTIVE"
                          ? counts.active
                          : filter.value === "APPROVED"
                            ? counts.approved
                            : counts.closed}
                    </span>
                  </button>
                ))}
              </div>

              <label className="relative mb-3 block w-full lg:w-80">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="견적번호, 상품명, 요청번호 검색"
                  className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[1220px] table-fixed text-left">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-500">
                <tr>
                  <th className="w-[14%] px-4 py-4">견적번호</th>
                  <th className="w-[20%] px-4 py-4">상품</th>
                  <th className="w-[12%] px-4 py-4">진행 상태</th>
                  <th className="w-[11%] px-4 py-4">제출일</th>
                  <th className="w-[13%] px-4 py-4">유효기간</th>
                  <th className="w-[7%] px-4 py-4">납기</th>
                  <th className="w-[11%] px-4 py-4 text-right">총 견적 금액</th>
                  <th className="w-[12%] px-4 py-4 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-16 text-center text-sm font-semibold text-slate-500"
                    >
                      견적 목록을 불러오는 중입니다.
                    </td>
                  </tr>
                )}

                {!isLoading && loadError && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-16 text-center text-sm font-semibold text-rose-600"
                    >
                      {loadError}
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  !loadError &&
                  visibleQuotes.map((quote) => {
                    const status =
                      statusConfig[quote.status] ?? statusConfig.SUBMITTED;
                    const remainingDays = getRemainingDays(quote.validUntil);
                    const processDisplay =
                      getSellerProcessDisplay(quote.status);

                    return (
                      <tr
                        key={quote.quoteId}
                        role="link"
                        tabIndex={0}
                        onClick={() =>
                          navigate(`/seller/quotes/${quote.quoteId}`)
                        }
                        onKeyDown={(event) => {
                          if (
                            event.target === event.currentTarget &&
                            event.key === "Enter"
                          ) {
                            navigate(`/seller/quotes/${quote.quoteId}`);
                          }
                        }}
                        className="cursor-pointer align-middle outline-none transition-colors hover:bg-blue-50/50 focus-visible:bg-blue-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
                      >
                        <td className="px-4 py-5">
                          <p className="truncate font-mono text-sm font-black text-slate-950">
                            {quote.quoteNo}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            소싱 요청 #{quote.sourcingRequestId}
                          </p>
                        </td>
                        <td className="px-4 py-5">
                          <p className="truncate text-sm font-bold text-slate-900">
                            {quote.productName}
                          </p>
                        </td>
                        <td className="px-4 py-5">
                          <span
                            className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-1 text-xs font-bold ${status.className}`}
                          >
                            {status.icon}
                            {status.label}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-5 text-sm font-semibold text-slate-600">
                          {formatDate(quote.submittedAt)}
                        </td>
                        <td className="px-4 py-5">
                          <p
                            className={`whitespace-nowrap text-sm font-bold ${
                              remainingDays < 0
                                ? "text-rose-600"
                                : remainingDays <= 3
                                  ? "text-amber-700"
                                  : "text-slate-700"
                            }`}
                          >
                            {formatDate(quote.validUntil)}
                          </p>
                          <p className="mt-1 whitespace-nowrap text-xs font-semibold text-slate-400">
                            {remainingDays < 0
                              ? "기간 만료"
                              : remainingDays === 0
                                ? "오늘 만료"
                                : `D-${remainingDays}`}
                          </p>
                        </td>
                        <td className="px-4 py-5 text-sm font-bold text-slate-700">
                          {quote.leadTimeDays}일
                        </td>
                        <td className="whitespace-nowrap px-4 py-5 text-right text-sm font-black text-slate-950">
                          {formatPrice(quote.totalAmount)}
                        </td>
                        <td className="px-4 py-5 text-right">
                          {quote.status === "APPROVED" && !quote.contractStatus ? (
                            <Link
                              to={`/seller/contracts/new/${quote.quoteId}`}
                              onClick={(event) => event.stopPropagation()}
                              className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-950 bg-slate-950 px-3 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0"
                            >
                              <FileSignature size={14} />
                              계약서 작성
                            </Link>
                          ) : quote.status === "APPROVED" &&
                            quote.contractStatus === "DRAFT" ? (
                            <Link
                              to={`/seller/contracts/new/${quote.quoteId}`}
                              onClick={(event) => event.stopPropagation()}
                              className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-blue-200 bg-blue-50 px-3 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                            >
                              <FileSignature size={14} />
                              계약서 작성 계속
                            </Link>
                          ) : quote.status === "APPROVED" &&
                            quote.contractStatus === "SELLER_SIGNED" ? (
                            <span className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-blue-200 bg-blue-50 px-3 text-xs font-bold text-blue-700">
                              <Send size={14} />
                              계약서 발송 완료
                            </span>
                          ) : quote.status === "APPROVED" &&
                            (quote.contractStatus === "BUYER_SIGNED" ||
                              quote.contractStatus === "COMPLETED") ? (
                            <span className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700">
                              <CheckCircle2 size={14} />
                              계약 체결 완료
                            </span>
                          ) : quote.status === "APPROVED" &&
                            (quote.contractStatus === "CANCELED" ||
                              quote.contractStatus === "EXPIRED") ? (
                            <span className="inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-md border border-slate-200 bg-slate-100 px-3 text-xs font-bold text-slate-600">
                              계약 종료
                            </span>
                          ) : quote.status === "NEGOTIATING" ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                navigate("/negotiations", {
                                  state: {
                                    quoteId: quote.quoteId,
                                    requestId: quote.sourcingRequestId,
                                  },
                                });
                              }}
                              className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-violet-200 bg-white px-3 text-xs font-bold text-violet-700 shadow-sm transition hover:bg-violet-50"
                            >
                              <MessageSquareText size={14} />
                              협의 확인
                            </button>
                          ) : processDisplay ? (
                            <span
                              className={`inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-md border px-3 text-xs font-bold ${processDisplay.className}`}
                            >
                              {processDisplay.label}
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-slate-400">
                              -
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            </div>

          {!isLoading &&
            !loadError &&
            visibleQuotes.length === 0 && (
              <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
                <FileText size={36} className="text-slate-300" />
                <p className="mt-3 text-base font-black text-slate-800">
                  조건에 맞는 견적이 없습니다.
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  검색어 또는 견적 상태를 다시 확인해 주세요.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
