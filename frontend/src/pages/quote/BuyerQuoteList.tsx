import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  FileText,
  FlaskConical,
  MessageSquareText,
  Search,
  X,
  XCircle,
} from "lucide-react";
import api from "@/api/axios";

type QuoteStatus =
  | "SUBMITTED"
  | "NEGOTIATING"
  | "SAMPLE_REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "NOT_SELECTED"
  | "EXPIRED";

type SampleOrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "DISPUTE"
  | "CANCELED"
  | "REFUNDED";

type ContractStatus =
  | "DRAFT"
  | "SELLER_SIGNED"
  | "BUYER_SIGNED"
  | "COMPLETED"
  | "CANCELED"
  | "EXPIRED";

type BuyerQuote = {
  quoteId: number;
  quoteNo: string;
  sourcingRequestId: number;
  productName: string;
  totalAmount: number;
  leadTimeDays: number;
  validUntil: string;
  sampleAvailable: boolean;
  status: QuoteStatus;
  submittedAt: string;
  viewedAt?: string | null;
  sampleOrderId: number | null;
  sampleOrderStatus: SampleOrderStatus | null;
  contractId: number | null;
  contractName: string | null;
  contractStatus: ContractStatus | null;
  // 계약 완료(양측 서명)와 결제 완료는 별개라서, 실제 본주문(샘플 아님) 존재 여부를
  // 별도로 받아 "결제하러 가기" 버튼을 계속 보여줄지 판단한다.
  orderId: number | null;
  orderStatus: SampleOrderStatus | null;
  version: number;
  parentQuoteId: number | null;
  previousTotalAmount: number | null;
  previousLeadTimeDays: number | null;
};

type QuoteFilter = "ALL" | "REVIEW" | "APPROVED" | "CLOSED";

type PendingAction = {
  quote: BuyerQuote;
  status: "APPROVED" | "REJECTED" | "NEGOTIATING";
};

const filters: Array<{ value: QuoteFilter; label: string }> = [
  { value: "ALL", label: "전체" },
  { value: "REVIEW", label: "검토 중" },
  { value: "APPROVED", label: "채택 완료" },
  { value: "CLOSED", label: "종료" },
];


function formatPrice(value: number) {
  return `${value.toLocaleString()}원`;
}

// 이전 견적(협의 이전 버전) 대비 금액/납기가 얼마나 바뀌었는지 보여준다.
function PriceDelta({
  before,
  after,
  unit = "원",
}: {
  before: number;
  after: number;
  unit?: string;
}) {
  const diff = after - before;

  if (diff === 0) {
    return (
      <span className="text-[11px] font-bold text-slate-400">
        (변동 없음)
      </span>
    );
  }

  const decreased = diff < 0;

  return (
    <span
      className={`text-[11px] font-black ${
        decreased ? "text-blue-600" : "text-rose-600"
      }`}
    >
      {decreased ? "▼" : "▲"}
      {Math.abs(diff).toLocaleString()}
      {unit}
    </span>
  );
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
  const end = new Date(value);

  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  return Math.ceil(
    (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function getSampleOrderDisplay(status: SampleOrderStatus | null) {
  switch (status) {
    case "PENDING":
      return {
        label: "샘플 결제 대기",
        className: "border-amber-200 bg-amber-50 text-amber-700",
      };
    case "CONFIRMED":
    case "PREPARING":
      return {
        label: "샘플 결제 완료",
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    case "SHIPPED":
      return {
        label: "샘플 배송 중",
        className: "border-blue-200 bg-blue-50 text-blue-700",
      };
    case "DELIVERED":
    case "COMPLETED":
      return {
        label: "샘플 수령 완료",
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    case "DISPUTE":
      return {
        label: "샘플 확인 필요",
        className: "border-rose-200 bg-rose-50 text-rose-700",
      };
    default:
      return null;
  }
}

function getQuoteResultDisplay(
  status: QuoteStatus,
  contractStatus: ContractStatus | null,
) {
  switch (status) {
    case "APPROVED":
      if (
        contractStatus === "BUYER_SIGNED"
        || contractStatus === "COMPLETED"
      ) {
        return {
          label: "계약 체결 완료",
          className: "border-emerald-200 bg-emerald-50 text-emerald-700",
          icon: <CheckCircle2 size={13} />,
        };
      }

      if (
        contractStatus === "CANCELED"
        || contractStatus === "EXPIRED"
      ) {
        return {
          label: "계약 종료",
          className: "border-slate-200 bg-slate-100 text-slate-600",
          icon: <X size={13} />,
        };
      }

      return {
        label: "계약서 수신 대기",
        className: "border-blue-200 bg-blue-50 text-blue-700",
        icon: <Clock3 size={13} />,
      };
    case "REJECTED":
      return {
        label: "거절 완료",
        className: "border-rose-200 bg-rose-50 text-rose-700",
        icon: <X size={13} />,
      };
    case "NOT_SELECTED":
      return {
        label: "미채택",
        className: "border-slate-200 bg-slate-100 text-slate-600",
        icon: <X size={13} />,
      };
    case "EXPIRED":
      return {
        label: "기간 만료",
        className: "border-slate-200 bg-slate-100 text-slate-500",
        icon: <Clock3 size={13} />,
      };
    default:
      return null;
  }
}

function matchesFilter(status: QuoteStatus, filter: QuoteFilter) {
  if (filter === "ALL") return true;
  if (filter === "REVIEW") {
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

export default function BuyerQuoteList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [quotes, setQuotes] = useState<BuyerQuote[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [negotiationContent, setNegotiationContent] = useState("");
  const [negotiationType, setNegotiationType] = useState("");
  // 소싱 요청별 견적 그룹은 기본적으로 접혀 있고, 헤더를 눌러야 펼쳐진다.
  // 다만 견적서 상세 페이지에서 "견적 목록"으로 돌아온 경우엔, 방금 보고 온 견적서가 속한
  // 소싱 요청 그룹은 접히지 않고 계속 펼쳐진 채로 보여야 하므로 URL의 expandedGroup 값으로
  // 초기 상태를 잡는다 (QuoteDetail.tsx에서 뒤로가기 링크에 이 값을 실어서 넘겨줌).
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<number>>(() => {
    const initialGroup = searchParams.get("expandedGroup");
    return initialGroup ? new Set([Number(initialGroup)]) : new Set();
  });

  const toggleGroup = (sourcingRequestId: number) => {
    setExpandedGroupIds((current) => {
      const next = new Set(current);
      if (next.has(sourcingRequestId)) {
        next.delete(sourcingRequestId);
      } else {
        next.add(sourcingRequestId);
      }
      return next;
    });
  };


  const requestedFilter = searchParams.get("status") as QuoteFilter | null;
  const activeFilter = filters.some(
    (filter) => filter.value === requestedFilter
  )
    ? requestedFilter!
    : "ALL";

  useEffect(() => {
    const loadQuotes = async () => {
      try {
        setIsLoading(true);
        setLoadError("");
        const response =
          await api.get<BuyerQuote[]>("/buyer/quotes");
        setQuotes(response);
      } catch (error) {
        console.error("바이어 견적 목록 조회 실패", error);
        setLoadError("견적 목록을 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadQuotes();
  }, []);

  // expandedGroup 쿼리 파라미터는 초기 펼침 상태를 잡는 용도로만 한 번 쓰고,
  // 이후엔 주소창에 남아있지 않도록 정리한다 (계속 남아있으면 새로고침할 때마다
  // 그 그룹이 강제로 다시 펼쳐짐).
  useEffect(() => {
    if (!searchParams.has("expandedGroup")) return;

    const next = new URLSearchParams(searchParams);
    next.delete("expandedGroup");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const quoteGroups = useMemo(() => {
    const groups = new Map<number, BuyerQuote[]>();

    visibleQuotes.forEach((quote) => {
      const current = groups.get(quote.sourcingRequestId) ?? [];
      current.push(quote);
      groups.set(quote.sourcingRequestId, current);
    });

    // 채택된 견적이 있으면 그 그룹 안에서 맨 위로 올라오고, 그 다음은
    // 1순위 최저 견적 금액, 2순위 최단 납기일 순으로 정렬한다.
    groups.forEach((groupQuotes) => {
      groupQuotes.sort((a, b) => {
        const aRank = a.status === "APPROVED" ? 0 : 1;
        const bRank = b.status === "APPROVED" ? 0 : 1;
        if (aRank !== bRank) return aRank - bRank;

        if (a.totalAmount !== b.totalAmount) {
          return a.totalAmount - b.totalAmount;
        }

        return a.leadTimeDays - b.leadTimeDays;
      });
    });

    return Array.from(groups.entries());
  }, [visibleQuotes]);

  const supplierAliases = useMemo(() => {
    const aliases = new Map<number, string>();
    const groups = new Map<number, BuyerQuote[]>();

    quotes.forEach((quote) => {
      const group = groups.get(quote.sourcingRequestId) ?? [];
      group.push(quote);
      groups.set(quote.sourcingRequestId, group);
    });

    groups.forEach((group) => {
      group
        .sort((left, right) => left.quoteId - right.quoteId)
        .forEach((quote, index) => {
          aliases.set(quote.quoteId, String.fromCharCode(65 + index));
        });
    });

    return aliases;
  }, [quotes]);

  const counts = {
    sourcing: new Set(quotes.map((quote) => quote.sourcingRequestId)).size,
    all: quotes.length,
    review: quotes.filter((quote) =>
      matchesFilter(quote.status, "REVIEW")
    ).length,
    approved: quotes.filter((quote) => quote.status === "APPROVED").length,
  };

  const handleFilter = (filter: QuoteFilter) => {
    const next = new URLSearchParams(searchParams);
    if (filter === "ALL") next.delete("status");
    else next.set("status", filter);
    setSearchParams(next);
  };

  const handleStatusUpdate = async () => {
    if (!pendingAction) return;

    const { quote, status } = pendingAction;

    try {
      setIsUpdating(true);
      setActionError("");

      if (status === "NEGOTIATING" && negotiationContent.trim().length === 0) {
        setActionError("협의 요청 내용을 입력해 주세요.");
        return;
      }

      if (status === "NEGOTIATING") {
        await api.post("/negotiations", {
          quoteId: quote.quoteId,
          sourcingRequestId: quote.sourcingRequestId,
          content: negotiationContent.trim(),
          negotiationType: "QUOTE"
        });
      } else {
              await api.patch(`/quotes/${quote.quoteId}/status`, {
                  status,
                });
            }

      setQuotes((currentQuotes) =>
        currentQuotes.map((currentQuote) => {
          if (currentQuote.quoteId === quote.quoteId) {
            return { ...currentQuote, status };
          }

          const shouldMarkNotSelected =
            status === "APPROVED" &&
            currentQuote.sourcingRequestId === quote.sourcingRequestId &&
            (
              currentQuote.status === "SUBMITTED" ||
              currentQuote.status === "NEGOTIATING" ||
              currentQuote.status === "SAMPLE_REQUESTED"
            );

          return shouldMarkNotSelected
            ? { ...currentQuote, status: "NOT_SELECTED" }
            : currentQuote;
        })
      );

      setActionMessage(
        status === "APPROVED"
          ? "견적을 확정했습니다. 셀러가 계약서를 작성한 후 전달할 예정입니다."
          : status === "NEGOTIATING"
            ? "협의 요청 내용을 전달했습니다."
            : "견적을 거절했습니다."
      );

      setPendingAction(null);
      setNegotiationContent("");
    } catch (error) {
      console.error("견적 상태 변경 실패", error);
      setActionError(
        error instanceof Error
          ? error.message
          : "견적 상태를 변경하지 못했습니다."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSamplePayment = async (quote: BuyerQuote) => {
    try {
      setIsUpdating(true);
      setActionError("");

      if (quote.status !== "SAMPLE_REQUESTED") {
        await api.patch(`/quotes/${quote.quoteId}/status`, {
          status: "SAMPLE_REQUESTED",
        });

        setQuotes((currentQuotes) =>
          currentQuotes.map((currentQuote) =>
            currentQuote.quoteId === quote.quoteId
              ? { ...currentQuote, status: "SAMPLE_REQUESTED" }
              : currentQuote
          )
        );
      }

      navigate(`/checkout?type=sample&quoteId=${quote.quoteId}`);
    } catch (error) {
      console.error("샘플 결제 요청 실패", error);
      setActionError(
        error instanceof Error
          ? error.message
          : "샘플 결제를 시작하지 못했습니다."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <main className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-6 lg:px-10">
        <header className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-950">받은 견적</h1>
            <p className="mt-2 text-sm text-slate-500">
              진행 중인 소싱 요청에 도착한 견적의 금액과 납기 조건을
              비교합니다.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate("/buyer/contracts")}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-500 hover:text-blue-700"
            >
              <FileText size={15} />
              계약 관리
            </button>
            <button
              type="button"
              onClick={() => navigate("/buyer/my-sourcing")}
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-primary hover:text-primary"
            >
              소싱 요청 목록
            </button>
          </div>
        </header>

        <section className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
          {[
            {
              label: "소싱 요청",
              value: counts.sourcing,
              icon: <FileText size={17} />,
              tone: "bg-slate-100 text-slate-700",
            },
            {
              label: "접수 견적",
              value: counts.all,
              icon: <FileText size={17} />,
              tone: "bg-blue-50 text-blue-700",
            },
            {
              label: "검토 중",
              value: counts.review,
              icon: <Clock3 size={17} />,
              tone: "bg-amber-50 text-amber-700",
            },
            {
              label: "채택 완료",
              value: counts.approved,
              icon: <CheckCircle2 size={17} />,
              tone: "bg-emerald-50 text-emerald-700",
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

        <section className="mb-5 border-b border-slate-300">
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
                      : filter.value === "REVIEW"
                        ? counts.review
                        : filter.value === "APPROVED"
                          ? counts.approved
                          : quotes.filter((quote) =>
                              matchesFilter(quote.status, "CLOSED")
                            ).length}
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
        </section>

        {actionMessage && (
          <div className="mb-4 flex items-center justify-between border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            <span>{actionMessage}</span>
            <button
              type="button"
              aria-label="알림 닫기"
              onClick={() => setActionMessage("")}
              className="text-emerald-700"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {actionError && (
          <div className="mb-4 flex items-center justify-between border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            <span>{actionError}</span>
            <button
              type="button"
              aria-label="오류 알림 닫기"
              onClick={() => setActionError("")}
              className="text-rose-700"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {isLoading && (
          <div className="border border-slate-200 bg-white px-6 py-20 text-center text-sm font-semibold text-slate-500">
            견적 목록을 불러오는 중입니다.
          </div>
        )}

        {!isLoading && loadError && (
          <div className="border border-rose-200 bg-white px-6 py-20 text-center text-sm font-semibold text-rose-600">
            {loadError}
          </div>
        )}

        {!isLoading && !loadError && quoteGroups.length === 0 && (
          <div className="flex min-h-72 flex-col items-center justify-center border border-slate-200 bg-white px-6 py-12 text-center">
            <FileText size={38} className="text-slate-300" />
            <p className="mt-3 text-base font-black text-slate-800">
              조건에 맞는 견적이 없습니다.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              검색어 또는 견적 상태를 다시 확인해 주세요.
            </p>
          </div>
        )}

        {!isLoading && !loadError && (
          <div className="space-y-4">
            {quoteGroups.map(([sourcingRequestId, groupQuotes]) => {
              const lowestAmount = Math.min(
                ...groupQuotes.map((quote) => quote.totalAmount)
              );
              const shortestLeadTime = Math.min(
                ...groupQuotes.map((quote) => quote.leadTimeDays)
              );
              const representativeProduct = groupQuotes[0]?.productName ?? "-";
              const groupHasApprovedQuote = quotes.some(
                (quote) =>
                  quote.sourcingRequestId === sourcingRequestId &&
                  quote.status === "APPROVED"
              );

              const isExpanded = expandedGroupIds.has(sourcingRequestId);

              return (
                <section
                  key={sourcingRequestId}
                  className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm"
                >
                  <header
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleGroup(sourcingRequestId)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggleGroup(sourcingRequestId);
                      }
                    }}
                    className="flex cursor-pointer flex-col gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 transition hover:bg-slate-100 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <ChevronDown
                        size={16}
                        className={`shrink-0 text-slate-400 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                      <span
                        className={`shrink-0 rounded px-2 py-1 text-[11px] font-black ${
                          groupHasApprovedQuote
                            ? "bg-slate-600 text-white"
                            : "bg-slate-950 text-white"
                        }`}
                      >
                        {groupHasApprovedQuote ? "선정 완료" : "진행 중"}
                      </span>
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-black text-slate-950">
                          소싱 요청 #{sourcingRequestId} ·{" "}
                          {representativeProduct}
                        </h2>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          수신 견적 {groupQuotes.length}건
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/buyer/sourcing-detail/${sourcingRequestId}`);
                      }}
                      className="shrink-0 text-left text-xs font-bold text-blue-700 transition hover:text-blue-900 sm:text-right"
                    >
                      요청 상세 보기
                    </button>
                  </header>

                  {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1360px] table-fixed text-left">
                      <thead className="border-b border-slate-200 bg-white text-xs font-bold text-slate-500">
                        <tr>
                          <th className="w-[14%] px-4 py-4">견적번호</th>
                          <th className="w-[14%] px-4 py-4">공급업체</th>
                          <th className="w-[9%] px-4 py-4">열람 상태</th>
                          <th className="w-[12%] px-4 py-4 text-right">총 견적 금액</th>
                          <th className="w-[7%] px-4 py-4">납기</th>
                          <th className="w-[7%] px-4 py-4">샘플</th>
                          <th className="w-[9%] px-4 py-4">유효기간</th>
                          <th className="w-[28%] px-4 py-4 text-right">관리</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {groupQuotes.map((quote) => {
                          const remainingDays =
                            getRemainingDays(quote.validUntil);
                          const isLowest = quote.totalAmount === lowestAmount;
                          const isFastest =
                            quote.leadTimeDays === shortestLeadTime;
                          const sampleOrderDisplay =
                            getSampleOrderDisplay(quote.sampleOrderStatus);
                          const quoteResultDisplay =
                            getQuoteResultDisplay(
                              quote.status,
                              quote.contractStatus,
                            );
                          const canReviewContract =
                            quote.contractId !== null
                            && quote.contractStatus === "SELLER_SIGNED";
                          const isContractCompleted =
                            quote.contractId !== null
                            && quote.contractStatus === "COMPLETED";
                          // quote.orderId !== null만 쓰면, 백엔드가 아직 재배포되지 않아
                          // 응답에 orderId 키 자체가 없는 경우(undefined) "undefined !== null"이
                          // true가 되어 버튼이 잘못 "결제 완료"로 뜨고 /buyer/orders/undefined로
                          // 연결되는 버그가 생긴다. != null로 null/undefined를 모두 걸러낸다.
                          const hasActiveOrder =
                            quote.orderId != null
                            && quote.orderStatus !== "CANCELED"
                            && quote.orderStatus !== "REFUNDED";
                          const canCreateSampleOrder =
                            quote.sampleOrderStatus === null ||
                            quote.sampleOrderStatus === "CANCELED" ||
                            quote.sampleOrderStatus === "REFUNDED";
                          const canRespond =
                            (
                              quote.status === "SUBMITTED" ||
                              quote.status === "SAMPLE_REQUESTED"
                            ) &&
                            !groupHasApprovedQuote;
                          const canStartSamplePayment =
                            quote.sampleAvailable &&
                            quote.status === "SUBMITTED" &&
                            canCreateSampleOrder &&
                            !groupHasApprovedQuote;
                          const canContinueSamplePayment =
                            quote.status === "SAMPLE_REQUESTED" &&
                            canCreateSampleOrder &&
                            !groupHasApprovedQuote;
                          const canOpenNegotiation =
                            (
                              quote.status === "SUBMITTED" ||
                              quote.status === "NEGOTIATING" ||
                              quote.status === "SAMPLE_REQUESTED"
                            ) &&
                            !groupHasApprovedQuote;

                          return (
                            <tr
                              key={quote.quoteId}
                              role="link"
                              tabIndex={0}
                              aria-label={`${quote.quoteNo} 견적 상세 보기`}
                              onClick={() =>
                                navigate(`/buyer/quotes/${quote.quoteId}`)
                              }
                              onKeyDown={(event) => {
                                if (
                                  event.target === event.currentTarget &&
                                  event.key === "Enter"
                                ) {
                                  navigate(
                                    `/buyer/quotes/${quote.quoteId}`
                                  );
                                }
                              }}
                              className={`cursor-pointer align-middle outline-none transition-colors focus-visible:bg-blue-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
                                quote.status === "APPROVED"
                                  ? "bg-emerald-50/60 hover:bg-emerald-50"
                                  : "hover:bg-blue-50/50"
                              }`}
                            >
                              <td className="px-4 py-5">
                                {quote.status === "APPROVED" && (
                                  <span className="mb-1.5 inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[11px] font-black text-white">
                                    <CheckCircle2 size={11} />
                                    채택된 견적
                                  </span>
                                )}
                                <p className="truncate font-mono text-sm font-black text-slate-950">
                                  {quote.quoteNo}
                                </p>
                                {quote.parentQuoteId !== null && (
                                  <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-violet-50 px-2 py-0.5 text-[11px] font-bold text-violet-700">
                                    {quote.version}차 견적
                                  </span>
                                )}
                                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-700">
                                  <Check size={11} />
                                  수신 완료
                                  <span className="font-normal text-slate-400">
                                    · {formatDate(quote.submittedAt)}
                                  </span>
                                </p>
                              </td>
                              <td className="px-4 py-5">
                                <p className="text-sm font-bold text-slate-900">
                                  공급업체 ({supplierAliases.get(quote.quoteId)})
                                </p>
                                <p className="mt-1 text-[11px] leading-4 text-slate-400">
                                  계약 단계 전까지 정보가 숨겨집니다.
                                </p>
                              </td>
                              <td className="px-4 py-5">
                                <div>
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-bold ${
                                      quote.viewedAt
                                        ? "border-slate-200 bg-slate-100 text-slate-600"
                                        : "border-blue-200 bg-blue-50 text-blue-700"
                                    }`}
                                  >
                                    {quote.viewedAt ? (
                                      <Check size={12} />
                                    ) : (
                                      <Clock3 size={12} />
                                    )}
                                    {quote.viewedAt ? "열람" : "미열람"}
                                  </span>
                                  {quote.viewedAt && (
                                    <p className="mt-1 whitespace-nowrap text-[11px] text-slate-400">
                                      {formatDate(quote.viewedAt)}
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-5 text-right">
                                <p className="text-sm font-black text-slate-950">
                                  {formatPrice(quote.totalAmount)}
                                </p>
                                {quote.previousTotalAmount !== null && (
                                  <p className="mt-0.5">
                                    <PriceDelta
                                      before={quote.previousTotalAmount}
                                      after={quote.totalAmount}
                                    />
                                  </p>
                                )}
                                {isLowest && groupQuotes.length > 1 && (
                                  <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                                    최저 견적
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-5">
                                <p className="text-sm font-bold text-slate-700">
                                  {quote.leadTimeDays}일
                                </p>
                                {quote.previousLeadTimeDays !== null && (
                                  <p className="mt-0.5">
                                    <PriceDelta
                                      before={quote.previousLeadTimeDays}
                                      after={quote.leadTimeDays}
                                      unit="일"
                                    />
                                  </p>
                                )}
                                {isFastest && groupQuotes.length > 1 && (
                                  <p className="mt-1 text-[11px] font-bold text-blue-700">
                                    최단 납기
                                  </p>
                                )}
                              </td>
                              <td className="px-4 py-5">
                                <span
                                  className={`inline-flex items-center gap-1 text-xs font-bold ${
                                    quote.sampleAvailable
                                      ? "text-emerald-700"
                                      : "text-slate-400"
                                  }`}
                                >
                                  {quote.sampleAvailable ? (
                                    <Check size={14} />
                                  ) : (
                                    <X size={14} />
                                  )}
                                  {quote.sampleAvailable ? "가능" : "불가"}
                                </span>
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
                              <td className="px-4 py-5 text-right">
                                <div className="flex min-h-9 items-center justify-end gap-2">
                                  {sampleOrderDisplay && (
                                    <span
                                      className={`inline-flex h-9 shrink-0 items-center rounded-md border px-3 text-xs font-bold ${sampleOrderDisplay.className}`}
                                    >
                                      {sampleOrderDisplay.label}
                                    </span>
                                  )}
                                  {canOpenNegotiation && (
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();

                                          setPendingAction({
                                            quote,
                                            status: "NEGOTIATING",
                                          });
                                      }}
                                      className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950 active:translate-y-0"
                                    >
                                      <MessageSquareText size={14} />
                                      {quote.status === "NEGOTIATING"
                                        ? "협의 계속"
                                        : "협의"}
                                    </button>
                                  )}
                                  {canRespond && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          setPendingAction({
                                            quote,
                                            status: "REJECTED",
                                          });
                                        }}
                                        className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-500 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 active:translate-y-0"
                                      >
                                        <X size={14} />
                                        거절
                                      </button>
                                      {(canStartSamplePayment ||
                                        canContinueSamplePayment) && (
                                        <button
                                          type="button"
                                          disabled={isUpdating}
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            void handleSamplePayment(quote);
                                          }}
                                          className="inline-flex h-9 min-w-[94px] shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-amber-200 bg-amber-50 px-3 text-xs font-bold text-amber-800 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-100 active:translate-y-0 disabled:translate-y-0 disabled:opacity-50"
                                        >
                                          <FlaskConical size={14} />
                                          샘플 결제
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          setPendingAction({
                                            quote,
                                            status: "APPROVED",
                                          });
                                        }}
                                        className="inline-flex h-9 min-w-[100px] shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-slate-950 bg-slate-950 px-3 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0"
                                      >
                                        <CheckCircle2 size={14} />
                                        최종 확정
                                      </button>
                                    </>
                                  )}
                                  {!canRespond &&
                                    !canOpenNegotiation &&
                                    isContractCompleted && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          navigate(
                                            `/buyer/contracts/${quote.contractId}/sign`,
                                          );
                                        }}
                                        className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
                                      >
                                        <FileText size={14} />
                                        계약서 보기
                                      </button>
                                      {hasActiveOrder ? (
                                        <button
                                          type="button"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            navigate(
                                              `/buyer/orders/${quote.orderId}`,
                                            );
                                          }}
                                          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                                        >
                                          <CheckCircle2 size={14} />
                                          결제 완료 · 주문 보기
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            navigate(
                                              `/checkout?contractId=${quote.contractId}`,
                                            );
                                          }}
                                          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700"
                                        >
                                          <CreditCard size={14} />
                                          결제하러 가기
                                        </button>
                                      )}
                                    </>
                                  )}
                                  {!canRespond &&
                                    !canOpenNegotiation &&
                                    canReviewContract && (
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        navigate(
                                          `/buyer/contracts/${quote.contractId}/sign`,
                                        );
                                      }}
                                      className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-blue-600 bg-blue-600 px-3 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0"
                                    >
                                      <FileText size={14} />
                                      계약서 확인 및 서명
                                    </button>
                                  )}
                                  {!canRespond &&
                                    !canOpenNegotiation &&
                                    !canReviewContract &&
                                    !isContractCompleted &&
                                    quoteResultDisplay && (
                                    <span
                                      className={`inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-3 text-xs font-bold ${quoteResultDisplay.className}`}
                                    >
                                      {quoteResultDisplay.icon}
                                      {quoteResultDisplay.label}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  )}
                </section>
              );
            })}
          </div>
        )}

        {pendingAction && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="quote-action-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4"
          >
            <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  pendingAction.status === "APPROVED"
                    ? "bg-emerald-50 text-emerald-700"
                    : pendingAction.status === "NEGOTIATING"
                      ? "bg-violet-50 text-violet-700"
                      : "bg-rose-50 text-rose-600"
                }`}
              >
                {pendingAction.status === "APPROVED" ? (
                  <CheckCircle2 size={20} />
                ) : pendingAction.status === "NEGOTIATING" ? (
                  <Clock3 size={20} />
                ) : (
                  <XCircle size={20} />
                )}
              </div>

              <h2
                id="quote-action-title"
                className="mt-4 text-lg font-black text-slate-950"
              >
                {pendingAction.status === "APPROVED"
                  ? "이 견적을 확정하시겠습니까?"
                  : pendingAction.status === "NEGOTIATING"
                    ? "이 견적의 협의를 요청하시겠습니까?"
                    : "이 견적을 거절하시겠습니까?"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {pendingAction.status === "APPROVED"
                  ? "확정하면 나머지 견적은 미채택 처리되며, 셀러가 확인 후 계약서를 작성해 전달합니다."
                  : pendingAction.status === "NEGOTIATING"
                    ? "견적 상태가 협의 중으로 변경되며, 상세 조건은 협의 내역에서 이어갈 수 있습니다."
                    : "거절한 견적은 다시 확정할 수 없습니다."}
              </p>

              <div className="mt-4 border-y border-slate-100 py-3">
                <p className="text-sm font-bold text-slate-900">
                  {pendingAction.quote.productName}
                </p>
                <p className="mt-1 font-mono text-xs text-slate-500">
                  {pendingAction.quote.quoteNo}
                </p>
                <p className="mt-2 text-sm font-black text-primary">
                  {formatPrice(pendingAction.quote.totalAmount)}
                </p>
              </div>

              {pendingAction.status === "NEGOTIATING" && (
                <textarea
                  value={negotiationContent}
                  onChange={(event) => setNegotiationContent(event.target.value)}
                  placeholder={"협의 요청 내용을 입력하세요.\n예) 단가 조정 가능 여부, 납기 단축 가능 여부 등"}
                  className="mt-4 h-32 w-full resize-none rounded-md border border-slate-300 p-3 text-sm outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
                />
              )}

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => setPendingAction(null)}
                  className="h-10 flex-1 border border-slate-200 text-sm font-bold text-slate-600 disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={handleStatusUpdate}
                  className={`h-10 flex-1 text-sm font-bold text-white disabled:opacity-50 ${
                    pendingAction.status === "APPROVED"
                      ? "bg-primary"
                      : pendingAction.status === "NEGOTIATING"
                        ? "bg-violet-600"
                        : "bg-rose-600"
                  }`}
                >
                  {isUpdating
                    ? "처리 중..."
                    : pendingAction.status === "APPROVED"
                      ? "견적 확정"
                      : pendingAction.status === "NEGOTIATING"
                        ? "협의 요청"
                        : "견적 거절"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}