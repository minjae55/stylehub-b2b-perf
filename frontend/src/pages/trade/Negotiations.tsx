import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  Handshake,
  LoaderCircle,
  MessageSquareText,
  Search,
  Send,
  UserRound,
  X,
} from "lucide-react";
import api from "@/api/axios";
import { useAuthStore } from "@/store/useAuthStore";

type NegotiationStatus = "OPEN" | "AGREED" | "CLOSED";
type NegotiationFilter = "ALL" | NegotiationStatus;
type NegotiationRequestStatus =
  | "REQUESTED"
  | "RESPONDED"
  | "ACCEPTED"
  | "CANCELED";

type NegotiationResponse = {
  negotiationId: number;
  negotiationType: "QUOTE" | "CONTRACT";
  buyerId: number;
  sellerId: number;
  quoteId: number | null;
  contractId: number | null;
  quoteNo: string | null;
  productName: string | null;
  buyerName: string | null;
  sellerName: string | null;
  adminName: string | null;
  status: NegotiationStatus;
  title: string;
  latestRequest: string | null;
  latestRequestId: number | null;
  latestRequestStatus: NegotiationRequestStatus | null;
  openedAt: string;
  updatedAt: string;
  agreedAt: string | null;
  closedAt: string | null;
  // 같은 딜의 다른 타입(QUOTE<->CONTRACT) 협의가 있으면 그 negotiationId.
  linkedNegotiationId: number | null;
};

type NegotiationLocationState = {
  quoteId?: number;
  requestId?: number;
};

type QuoteItemSummary = {
  optionSummary: string | null;
  quantity: number;
  unitPrice: number;
  sample: boolean;
};

type QuoteSummary = {
  quoteId: number;
  version: number;
  leadTimeDays: number;
  shippingFee: number;
  validUntil: string;
  sellerMemo: string | null;
  totalAmount: number;
  items: QuoteItemSummary[];
};

type ContractSummary = {
  contractId: number;
  version: number;
  contractName: string | null;
  deliveryDate: string;
  paymentTerms: string;
  returnPolicy: string;
  specialTerms: string | null;
  contractAmount: number;
};

type NegotiationRequestDetail = {
  negotiationRequestId: number;
  status: NegotiationRequestStatus;
  buyerRequest: string;
  sellerMemo: string | null;
  requestedAt: string;
  respondedAt: string | null;
  acceptedAt: string | null;
  canceledAt: string | null;
  requestedQuote: QuoteSummary | null;
  revisedQuote: QuoteSummary | null;
  requestedContract: ContractSummary | null;
  revisedContract: ContractSummary | null;
};

type RequestModalTarget = {
  quoteId: number | null;
  contractId: number | null;
  negotiationType: "QUOTE" | "CONTRACT";
};

type RespondTarget = {
  negotiationRequestId: number;
  negotiationType: "QUOTE" | "CONTRACT";
};

type RespondItemForm = {
  optionSummary: string;
  quantity: string;
  unitPrice: string;
  sample: boolean;
};

const filters: Array<{ value: NegotiationFilter; label: string }> = [
  { value: "ALL", label: "전체" },
  { value: "OPEN", label: "협의 중" },
  { value: "AGREED", label: "합의 완료" },
  { value: "CLOSED", label: "종료" },
];

const statusConfig: Record<
  NegotiationStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  OPEN: {
    label: "협의 중",
    className: "border-blue-200 bg-blue-50 text-blue-700",
    icon: <Clock3 size={13} />,
  },
  AGREED: {
    label: "합의 완료",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: <CheckCircle2 size={13} />,
  },
  CLOSED: {
    label: "종료",
    className: "border-slate-200 bg-slate-100 text-slate-600",
    icon: <X size={13} />,
  },
};

const requestStatusLabel: Record<NegotiationRequestStatus, string> = {
  REQUESTED: "응답 대기",
  RESPONDED: "응답 완료",
  ACCEPTED: "수락됨",
  CANCELED: "거절됨",
};

function formatDateTime(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatPrice(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

// 목록 행에 보여줄 단일 액션 버튼의 문구/강조 여부를 역할과 최신 요청 상태에 따라 결정한다

function getRowAction(
  item: NegotiationResponse,
  currentUserId: number | undefined,
): { label: string; emphasize: boolean } {
  if (item.status !== "OPEN") {
    return { label: "내역 보기", emphasize: false };
  }

  const isSeller = currentUserId === item.sellerId;

  if (isSeller) {
    return item.latestRequestStatus === "REQUESTED"
      ? { label: "응답하기", emphasize: true }
      : { label: "바이어 확인 대기", emphasize: false };
  }

  return item.latestRequestStatus === "RESPONDED"
    ? { label: "응답 확인", emphasize: true }
    : { label: "셀러 응답 대기", emphasize: false };
}

// 견적 협의(QUOTE)와 그 뒤에 이어지는 계약 협의(CONTRACT)는 백엔드에서 서로 다른 행으로
// 남지만, 같은 딜이면 화면에는 하나의 연속된 대화로만 보여준다. 계약 협의가 더 나중 단계라
// 대표로 남기고, 짝이 되는 견적 협의 행은 목록에서 숨긴다. (이력 조회 시 백엔드가 두 협의의
// 요청 내역을 알아서 합쳐서 내려주므로, 여기서는 중복 카드만 걸러내면 된다)
function dedupeLinkedNegotiations(
  list: NegotiationResponse[],
): NegotiationResponse[] {
  const idsInList = new Set(list.map((item) => item.negotiationId));

  return list.filter((item) => {
    if (
      item.negotiationType === "QUOTE"
      && item.linkedNegotiationId !== null
      && idsInList.has(item.linkedNegotiationId)
    ) {
      return false;
    }

    return true;
  });
}

export function Negotiations() {
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as NegotiationLocationState | null;
  const currentUser = useAuthStore((state) => state.user);

  const [negotiations, setNegotiations] = useState<NegotiationResponse[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const detailSectionRef = useRef<HTMLElement | null>(null);
  const [activeFilter, setActiveFilter] =
    useState<NegotiationFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // 협의 요청 작성/추가 협의 모달 (바이어 전용)
  const [requestModalTarget, setRequestModalTarget] =
    useState<RequestModalTarget | null>(null);
  const [buyerRequest, setBuyerRequest] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // 라운드별 이력
  const [requests, setRequests] = useState<NegotiationRequestDetail[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [requestsError, setRequestsError] = useState("");

  // 수락/거절 (바이어 전용)
  const [isDeciding, setIsDeciding] = useState(false);
  const [decideError, setDecideError] = useState("");

  // 응답 모달 (셀러 전용)
  const [respondTarget, setRespondTarget] = useState<RespondTarget | null>(
    null,
  );
  const [respondBaselineQuote, setRespondBaselineQuote] =
    useState<QuoteSummary | null>(null);
  const [respondBaselineContract, setRespondBaselineContract] =
    useState<ContractSummary | null>(null);
  const [respondSellerMemo, setRespondSellerMemo] = useState("");
  const [respondLeadTimeDays, setRespondLeadTimeDays] = useState("");
  const [respondShippingFee, setRespondShippingFee] = useState("");
  const [respondValidUntil, setRespondValidUntil] = useState("");
  const [respondItems, setRespondItems] = useState<RespondItemForm[]>([]);
  const [respondContractName, setRespondContractName] = useState("");
  const [respondDeliveryDate, setRespondDeliveryDate] = useState("");
  const [respondPaymentTerms, setRespondPaymentTerms] = useState("");
  const [respondReturnPolicy, setRespondReturnPolicy] = useState("");
  const [respondSpecialTerms, setRespondSpecialTerms] = useState("");
  const [respondContractAmount, setRespondContractAmount] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [respondError, setRespondError] = useState("");

  const [reviewRequest, setReviewRequest] =
    useState<NegotiationRequestDetail | null>(null);

  const loadNegotiations = async () => {
    try {
      setIsLoading(true);
      setLoadError("");
      const response =
        await api.get<NegotiationResponse[]>("/negotiations");
      const deduped = dedupeLinkedNegotiations(response);

      setNegotiations(deduped);
      setSelectedId((current) => {
        if (
          current !== null
          && deduped.some((item) => item.negotiationId === current)
        ) {
          return current;
        }

        return deduped[0]?.negotiationId ?? null;
      });
    } catch (error) {
      console.error("협의 목록 조회 실패", error);
      setLoadError(
        error instanceof Error
          ? error.message
          : "협의 목록을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadRequests = async (negotiationId: number | null) => {
    if (negotiationId === null) {
      setRequests([]);
      return [];
    }

    try {
      setIsLoadingRequests(true);
      setRequestsError("");
      const response = await api.get<NegotiationRequestDetail[]>(
        `/negotiations/${negotiationId}/requests`,
      );
      setRequests(response);
      return response;
    } catch (error) {
      console.error("협의 이력 조회 실패", error);
      setRequestsError(
        error instanceof Error
          ? error.message
          : "협의 이력을 불러오지 못했습니다.",
      );
      return [];
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    void loadNegotiations();
  }, []);

  useEffect(() => {
    void loadRequests(selectedId);
  }, [selectedId]);

  useEffect(() => {
    if (!locationState?.quoteId) return;

    setRequestModalTarget({
      quoteId: locationState.quoteId,
      contractId: null,
      negotiationType: "QUOTE",
    });
    setBuyerRequest("");
    setSubmitError("");

    navigate(location.pathname, {
      replace: true,
      state: null,
    });
  }, [location.pathname, locationState?.quoteId, navigate]);

  const visibleNegotiations = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    return negotiations.filter((item) => {
      const matchesFilter =
        activeFilter === "ALL" || item.status === activeFilter;

      const matchesSearch =
        keyword.length === 0
        || item.title.toLowerCase().includes(keyword)
        || (item.quoteNo?.toLowerCase().includes(keyword) ?? false)
        || (item.productName?.toLowerCase().includes(keyword) ?? false);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, negotiations, searchQuery]);

  const selected =
    negotiations.find((item) => item.negotiationId === selectedId) ?? null;

  const viewerRole: "BUYER" | "SELLER" | null = selected
    ? currentUser?.userId === selected.buyerId
      ? "BUYER"
      : currentUser?.userId === selected.sellerId
        ? "SELLER"
        : null
    : null;

  const latestRequestDetail =
    requests.length > 0 ? requests[requests.length - 1] : null;

  // 응답 폼에서 셀러가 입력 중인 값 기준으로 실시간 합계를 계산해 이전 견적과 비교한다.
  const respondCurrentSubtotal = respondItems.reduce(
    (sum, item) =>
      sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0,
  );
  const respondCurrentTotal =
    respondCurrentSubtotal + (Number(respondShippingFee) || 0);

  const counts = {
    all: negotiations.length,
    open: negotiations.filter((item) => item.status === "OPEN").length,
    agreed: negotiations.filter((item) => item.status === "AGREED").length,
    closed: negotiations.filter((item) => item.status === "CLOSED").length,
  };

  // 행 클릭 시 이미 선택돼 있어 상태 변화가 없는 경우에도 상세 패널로 스크롤해서
  // 클릭이 아무 반응 없는 것처럼 보이지 않도록 한다.
  const selectNegotiation = (negotiationId: number) => {
    setSelectedId(negotiationId);
    requestAnimationFrame(() => {
      detailSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  // 합의 완료/종료된 협의의 "내역 보기"는 바이어/셀러 구분 없이
  // 마지막 라운드의 이전-신규 조건 비교 모달을 바로 띄운다.
  const openHistoryModal = async (negotiationId: number) => {
    setSelectedId(negotiationId);
    const fetched = await loadRequests(negotiationId);
    const latest = fetched.length > 0 ? fetched[fetched.length - 1] : null;

    if (latest && (latest.revisedQuote || latest.revisedContract)) {
      setDecideError("");
      setReviewRequest(latest);
    } else {
      requestAnimationFrame(() => {
        detailSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  };

  const handleRowAction = (item: NegotiationResponse) => {
    if (item.status === "OPEN") {
      selectNegotiation(item.negotiationId);
    } else {
      void openHistoryModal(item.negotiationId);
    }
  };

  const openFollowUpModal = (item: NegotiationResponse) => {
    setRequestModalTarget({
      quoteId: item.negotiationType === "QUOTE" ? item.quoteId : null,
      contractId: item.negotiationType === "CONTRACT" ? item.contractId : null,
      negotiationType: item.negotiationType,
    });
    setBuyerRequest("");
    setSubmitError("");
  };

  const closeRequestModal = () => {
    if (isSubmitting) return;
    setRequestModalTarget(null);
    setBuyerRequest("");
    setSubmitError("");
  };

  const handleSubmit = async () => {
    if (!requestModalTarget || !buyerRequest.trim() || isSubmitting) return;

    const targetId =
      requestModalTarget.negotiationType === "QUOTE"
        ? requestModalTarget.quoteId
        : requestModalTarget.contractId;

    if (!targetId) return;

    try {
      setIsSubmitting(true);
      setSubmitError("");

      await api.post(`/negotiations`, {
        quoteId:
          requestModalTarget.negotiationType === "QUOTE" ? targetId : undefined,
        contractId:
          requestModalTarget.negotiationType === "CONTRACT"
            ? targetId
            : undefined,
        content: buyerRequest.trim(),
        negotiationType: requestModalTarget.negotiationType,
      });

      setRequestModalTarget(null);
      setBuyerRequest("");
      setSubmitError("");
      setSuccessMessage("협의 요청을 등록했습니다.");
      await loadNegotiations();
      await loadRequests(selectedId);
    } catch (error) {
      console.error("협의 요청 등록 실패", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "협의 요청을 등록하지 못했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccept = async (negotiationRequestId: number) => {
    if (isDeciding) return;

    try {
      setIsDeciding(true);
      setDecideError("");
      await api.post(`/negotiations/requests/${negotiationRequestId}/accept`);
      setSuccessMessage("협의 내용을 수락했습니다.");
      await loadNegotiations();
      await loadRequests(selectedId);
    } catch (error) {
      console.error("협의 수락 실패", error);
      setDecideError(
        error instanceof Error ? error.message : "수락 처리에 실패했습니다.",
      );
    } finally {
      setIsDeciding(false);
    }
  };

  const handleReject = async (negotiationRequestId: number) => {
    if (isDeciding) return;
    if (!window.confirm("이 응답을 거절하면 협의가 종료됩니다. 계속할까요?")) {
      return;
    }

    try {
      setIsDeciding(true);
      setDecideError("");
      await api.post(`/negotiations/requests/${negotiationRequestId}/reject`);
      setSuccessMessage("협의를 거절 처리했습니다.");
      await loadNegotiations();
      await loadRequests(selectedId);
    } catch (error) {
      console.error("협의 거절 실패", error);
      setDecideError(
        error instanceof Error ? error.message : "거절 처리에 실패했습니다.",
      );
    } finally {
      setIsDeciding(false);
    }
  };

  const openRespondModal = (
    latest: NegotiationRequestDetail,
    negotiationType: "QUOTE" | "CONTRACT",
  ) => {
    setRespondTarget({
      negotiationRequestId: latest.negotiationRequestId,
      negotiationType,
    });
    setRespondSellerMemo("");
    setRespondError("");
    setRespondBaselineQuote(null);
    setRespondBaselineContract(null);

    if (negotiationType === "QUOTE" && latest.requestedQuote) {
      const quote = latest.requestedQuote;
      setRespondBaselineQuote(quote);
      setRespondLeadTimeDays(String(quote.leadTimeDays));
      setRespondShippingFee(String(quote.shippingFee));
      setRespondValidUntil(quote.validUntil.slice(0, 16));
      setRespondItems(
        quote.items.map((item) => ({
          optionSummary: item.optionSummary ?? "",
          quantity: String(item.quantity),
          unitPrice: String(item.unitPrice),
          sample: item.sample,
        })),
      );
    } else if (negotiationType === "CONTRACT" && latest.requestedContract) {
      const contract = latest.requestedContract;
      setRespondBaselineContract(contract);
      setRespondContractName(contract.contractName ?? "");
      setRespondDeliveryDate(contract.deliveryDate);
      setRespondPaymentTerms(contract.paymentTerms);
      setRespondReturnPolicy(contract.returnPolicy);
      setRespondSpecialTerms(contract.specialTerms ?? "");
      setRespondContractAmount(String(contract.contractAmount));
    }
  };

  const closeRespondModal = () => {
    if (isResponding) return;
    setRespondTarget(null);
  };

  const openReviewModal = (request: NegotiationRequestDetail) => {
    setDecideError("");
    setReviewRequest(request);
  };

  const closeReviewModal = () => {
    if (isDeciding) return;
    setReviewRequest(null);
  };

  const updateRespondItem = (
    index: number,
    patch: Partial<RespondItemForm>,
  ) => {
    setRespondItems((current) =>
      current.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const addRespondItem = () => {
    setRespondItems((current) => [
      ...current,
      { optionSummary: "", quantity: "", unitPrice: "", sample: false },
    ]);
  };

  const removeRespondItem = (index: number) => {
    setRespondItems((current) => current.filter((_, i) => i !== index));
  };

  const canSubmitRespond =
    respondTarget?.negotiationType === "QUOTE"
      ? respondLeadTimeDays.trim().length > 0
        && respondShippingFee.trim().length > 0
        && respondValidUntil.trim().length > 0
        && respondItems.length > 0
        && respondItems.every(
          (item) =>
            item.optionSummary.trim().length > 0
            && item.quantity.trim().length > 0
            && item.unitPrice.trim().length > 0,
        )
      : respondContractName.trim().length > 0
        && respondDeliveryDate.trim().length > 0
        && respondPaymentTerms.trim().length > 0
        && respondReturnPolicy.trim().length > 0;

  const handleRespond = async () => {
    if (!respondTarget || !canSubmitRespond || isResponding) return;

    try {
      setIsResponding(true);
      setRespondError("");

      if (respondTarget.negotiationType === "QUOTE") {
        const items = respondItems.map((item) => ({
          optionSummary: item.optionSummary.trim(),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          sample: item.sample,
        }));

        const validUntil =
          respondValidUntil.length === 16
            ? `${respondValidUntil}:00`
            : respondValidUntil;

        await api.post(
          `/negotiations/requests/${respondTarget.negotiationRequestId}/respond`,
          {
            sellerMemo: respondSellerMemo.trim() || null,
            leadTimeDays: Number(respondLeadTimeDays),
            shippingFee: Number(respondShippingFee),
            validUntil,
            items,
          },
        );
      } else {
        await api.post(
          `/negotiations/requests/${respondTarget.negotiationRequestId}/respond`,
          {
            sellerMemo: respondSellerMemo.trim() || null,
            contractName: respondContractName.trim(),
            deliveryDate: respondDeliveryDate,
            paymentTerms: respondPaymentTerms.trim(),
            returnPolicy: respondReturnPolicy.trim(),
            specialTerms: respondSpecialTerms.trim() || null,
            contractAmount: respondContractAmount.trim()
              ? Number(respondContractAmount)
              : null,
          },
        );
      }

      setRespondTarget(null);
      setSuccessMessage("응답을 등록했습니다.");
      await loadNegotiations();
      await loadRequests(selectedId);
    } catch (error) {
      console.error("협의 응답 등록 실패", error);
      setRespondError(
        error instanceof Error ? error.message : "응답 등록에 실패했습니다.",
      );
    } finally {
      setIsResponding(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <main className="mx-auto w-full max-w-[1380px] px-4 py-8 sm:px-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-blue-700">
              Trade Communication
            </p>
            <h1 className="mt-1 text-2xl font-black text-slate-950">
              협의 관리
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              견적 조건에 대한 요청과 합의 진행 상태를 확인합니다.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="견적번호 또는 상품명 검색"
              className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </header>

        {successMessage && (
          <div className="mt-5 flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              {successMessage}
            </span>
            <button
              type="button"
              title="알림 닫기"
              onClick={() => setSuccessMessage("")}
              className="inline-flex size-7 items-center justify-center rounded-md hover:bg-emerald-100"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="전체 협의"
            value={counts.all}
            icon={<MessageSquareText size={18} />}
            iconClassName="bg-slate-100 text-slate-600"
          />
          <StatCard
            label="진행 중"
            value={counts.open}
            icon={<Handshake size={18} />}
            iconClassName="bg-blue-50 text-blue-700"
          />
          <StatCard
            label="합의 완료"
            value={counts.agreed}
            icon={<CheckCircle2 size={18} />}
            iconClassName="bg-emerald-50 text-emerald-700"
          />
          <StatCard
            label="종료"
            value={counts.closed}
            icon={<X size={18} />}
            iconClassName="bg-slate-100 text-slate-500"
          />
        </section>

        <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setActiveFilter(filter.value)}
                  className={`h-8 rounded-md border px-3 text-xs font-bold transition ${
                    activeFilter === filter.value
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <p className="text-xs font-semibold text-slate-500">
              {visibleNegotiations.length}건
            </p>
          </div>

          {isLoading ? (
            <div className="flex min-h-72 items-center justify-center text-sm font-semibold text-slate-500">
              <LoaderCircle size={18} className="mr-2 animate-spin" />
              협의 목록을 불러오는 중입니다.
            </div>
          ) : loadError ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-4 text-center">
              <AlertCircle size={30} className="text-rose-500" />
              <p className="mt-3 text-sm font-bold text-slate-900">
                협의 목록을 불러오지 못했습니다.
              </p>
              <p className="mt-1 text-xs text-slate-500">{loadError}</p>
            </div>
          ) : visibleNegotiations.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-4 text-center">
              <MessageSquareText size={32} className="text-slate-300" />
              <p className="mt-3 text-sm font-bold text-slate-900">
                표시할 협의가 없습니다.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                견적 목록에서 협의를 요청하면 이곳에서 확인할 수 있습니다.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] text-left">
                <thead className="border-b border-slate-200 text-xs font-bold text-slate-500">
                  <tr>
                    <th className="px-5 py-3">협의 대상</th>
                    <th className="px-4 py-3">참여자</th>
                    <th className="px-4 py-3">상태</th>
                    <th className="px-4 py-3">최근 요청</th>
                    <th className="px-4 py-3">최근 수정</th>
                    <th className="px-5 py-3 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleNegotiations.map((item) => {
                    const status =
                      statusConfig[item.status] ?? statusConfig.OPEN;
                    const isSelected =
                      selectedId === item.negotiationId;
                    const rowAction = getRowAction(
                      item,
                      currentUser?.userId,
                    );

                    return (
                      <tr
                        key={item.negotiationId}
                        className={`transition ${
                          isSelected ? "bg-blue-50/60" : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => handleRowAction(item)}
                            className="text-left"
                          >
                            <p className="text-sm font-black text-slate-950">
                              {item.productName || item.title}
                            </p>
                            <p className="mt-1 font-mono text-xs text-slate-400">
                              {item.quoteNo || `협의 #${item.negotiationId}`}
                            </p>
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                            <UserRound size={14} className="text-slate-400" />
                            {item.buyerName || "바이어"}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            상대 {item.sellerName || "셀러"}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-bold ${status.className}`}
                          >
                            {status.icon}
                            {status.label}
                          </span>
                        </td>
                        <td className="max-w-[300px] px-4 py-4">
                          <p className="truncate text-sm text-slate-700">
                            {item.latestRequest || "등록된 요청 내용 없음"}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-xs font-semibold text-slate-500">
                          {formatDateTime(item.updatedAt)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleRowAction(item)}
                            className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-bold transition ${
                              rowAction.emphasize
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "border border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-900"
                            }`}
                          >
                            <MessageSquareText size={14} />
                            {rowAction.label}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {selected && (
          <section
            ref={detailSectionRef}
            className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                  <FileText size={13} />
                  {selected.negotiationType === "QUOTE"
                    ? "견적 협의"
                    : "계약 협의"}
                </span>
                <span className="font-mono text-xs text-slate-400">
                  {selected.quoteNo || `#${selected.negotiationId}`}
                </span>
                {selected.linkedNegotiationId !== null && (
                  <span className="rounded-md bg-violet-50 px-2 py-1 text-xs font-bold text-violet-700">
                    견적 협의부터 이어짐
                  </span>
                )}
                {viewerRole && (
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">
                    내 역할 {viewerRole === "BUYER" ? "바이어" : "셀러"}
                  </span>
                )}
              </div>
              <h2 className="text-sm font-black text-slate-950">
                {selected.title}
              </h2>
            </div>

            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="p-5 sm:p-6">
                {isLoadingRequests ? (
                  <div className="flex items-center justify-center py-10 text-sm font-semibold text-slate-500">
                    <LoaderCircle size={16} className="mr-2 animate-spin" />
                    이력을 불러오는 중입니다.
                  </div>
                ) : requestsError ? (
                  <p className="text-sm font-semibold text-rose-600">
                    {requestsError}
                  </p>
                ) : requests.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    등록된 요청이 없습니다.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request, index) => (
                      <RoundCard
                        key={request.negotiationRequestId}
                        round={index + 1}
                        request={request}
                        negotiationType={
                          // 견적 협의 + 계약 협의가 합쳐진 대화일 수 있으므로, 각 라운드
                          // 자체의 요청 내용(requestedQuote/requestedContract)을 보고
                          // 타입을 판단한다 (selected.negotiationType은 대표 협의 하나의
                          // 타입이라 병합된 스레드에서는 라운드마다 다를 수 있다).
                          request.requestedContract ? "CONTRACT" : "QUOTE"
                        }
                      />
                    ))}
                  </div>
                )}

                {selected.status === "OPEN" && latestRequestDetail && (
                  <div className="mt-5 border-t border-slate-200 pt-5">
                    {/* 병합된 스레드에서는 마지막 라운드가 어떤 타입인지가
                       selected.negotiationType(대표 협의)과 다를 수 있으므로
                       latestRequestDetail 자체의 내용으로 타입을 판단한다. */}
                    {viewerRole === "SELLER"
                    && latestRequestDetail.status === "REQUESTED" ? (
                      <button
                        type="button"
                        onClick={() =>
                          openRespondModal(
                            latestRequestDetail,
                            latestRequestDetail.requestedContract
                              ? "CONTRACT"
                              : "QUOTE",
                          )
                        }
                        className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-black text-white transition hover:bg-blue-700"
                      >
                        <Send size={15} />
                        {latestRequestDetail.requestedContract
                          ? "새 계약 조건으로 응답하기"
                          : "새 견적으로 응답하기"}
                      </button>
                    ) : viewerRole === "BUYER"
                    && latestRequestDetail.status === "RESPONDED" ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openReviewModal(latestRequestDetail)}
                          className="inline-flex h-10 items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-4 text-sm font-black text-blue-700 transition hover:bg-blue-100"
                        >
                          <FileText size={15} />
                          {latestRequestDetail.requestedContract
                            ? "계약 비교"
                            : "견적 비교"}
                        </button>
                        <button
                          type="button"
                          disabled={isDeciding}
                          onClick={() =>
                            void handleAccept(
                              latestRequestDetail.negotiationRequestId,
                            )
                          }
                          className="inline-flex h-10 items-center gap-1.5 rounded-md bg-emerald-600 px-4 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <CheckCircle2 size={15} />
                          수락
                        </button>
                        <button
                          type="button"
                          disabled={isDeciding}
                          onClick={() =>
                            void handleReject(
                              latestRequestDetail.negotiationRequestId,
                            )
                          }
                          className="inline-flex h-10 items-center gap-1.5 rounded-md bg-rose-600 px-4 text-sm font-black text-white transition hover:bg-rose-700 disabled:opacity-50"
                        >
                          <X size={15} />
                          거절
                        </button>
                        <button
                          type="button"
                          disabled={isDeciding}
                          onClick={() => openFollowUpModal(selected)}
                          className="inline-flex h-10 items-center gap-1.5 rounded-md border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                          <MessageSquareText size={15} />
                          추가 협의 요청
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs font-semibold text-slate-400">
                        {viewerRole === "SELLER"
                          ? "바이어 확인을 기다리고 있습니다."
                          : "셀러 응답을 기다리고 있습니다."}
                      </p>
                    )}
                    {decideError && (
                      <p className="mt-3 text-xs font-semibold text-rose-600">
                        {decideError}
                      </p>
                    )}
                  </div>
                )}

                {selected.status === "AGREED"
                && viewerRole === "SELLER"
                && selected.negotiationType === "QUOTE"
                && selected.quoteId && (
                  <div className="mt-5 border-t border-slate-200 pt-5">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/seller/contracts/new/${selected.quoteId}`)
                      }
                      className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-black text-white transition hover:bg-blue-700"
                    >
                      <FileText size={15} />
                      계약서 작성하러 가기
                    </button>
                  </div>
                )}
              </div>

              <dl className="border-t border-slate-200 bg-slate-50 p-5 text-sm lg:border-l lg:border-t-0">
                <DetailRow
                  label="협의 시작"
                  value={formatDateTime(selected.openedAt)}
                />
                <DetailRow
                  label="최근 수정"
                  value={formatDateTime(selected.updatedAt)}
                />
                <DetailRow
                  label="합의 일시"
                  value={formatDateTime(selected.agreedAt)}
                />
                <DetailRow
                  label="종료 일시"
                  value={formatDateTime(selected.closedAt)}
                />
              </dl>
            </div>
          </section>
        )}
      </main>

      {requestModalTarget !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="negotiation-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
        >
          <div className="w-full max-w-[560px] overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-black text-blue-700">
                  {requestModalTarget.negotiationType === "QUOTE"
                    ? `견적 #${requestModalTarget.quoteId}`
                    : `계약 #${requestModalTarget.contractId}`}
                </p>
                <h2
                  id="negotiation-modal-title"
                  className="mt-1 text-lg font-black text-slate-950"
                >
                  협의 요청 작성
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  조정이 필요한 수량, 단가, 납기 또는 상품 조건을 구체적으로
                  작성해 주세요.
                </p>
              </div>
              <button
                type="button"
                title="모달 닫기"
                onClick={closeRequestModal}
                className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={17} />
              </button>
            </div>

            <div className="px-6 py-5">
              <label htmlFor="buyer-request" className="block">
                <span className="text-sm font-black text-slate-800">
                  협의 요청 내용
                </span>
                <textarea
                  id="buyer-request"
                  rows={7}
                  maxLength={2000}
                  value={buyerRequest}
                  onChange={(event) => setBuyerRequest(event.target.value)}
                  placeholder="예: 최소 주문 수량을 300개에서 200개로 조정할 수 있는지 확인 부탁드립니다."
                  className="mt-2 w-full resize-none rounded-md border border-slate-200 px-3 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <div className="mt-2 flex items-start justify-between gap-3">
                <p className="text-xs leading-5 text-slate-500">
                  연락처, 계좌번호 등 직접 거래를 유도하는 정보는 입력하지
                  마세요.
                </p>
                <span className="shrink-0 text-xs font-semibold text-slate-400">
                  {buyerRequest.length}/2000
                </span>
              </div>

              {submitError && (
                <p className="mt-4 flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  {submitError}
                </p>
              )}
            </div>

            <div className="flex gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={closeRequestModal}
                className="h-10 flex-1 rounded-md border border-slate-200 bg-white text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                disabled={!buyerRequest.trim() || isSubmitting}
                onClick={() => void handleSubmit()}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-blue-600 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSubmitting ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
                {isSubmitting ? "등록 중..." : "협의 요청 보내기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {respondTarget !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="respond-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
        >
          <div className="max-h-[90vh] w-full max-w-[960px] overflow-y-auto rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2
                  id="respond-modal-title"
                  className="text-lg font-black text-slate-950"
                >
                  {respondTarget.negotiationType === "QUOTE"
                    ? "새 견적으로 응답"
                    : "새 계약 조건으로 응답"}
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  바이어의 요청을 반영해 조건을 조정한 뒤 전달하세요. 기존
                  조건에서 값이 미리 채워져 있습니다.
                </p>
              </div>
              <button
                type="button"
                title="모달 닫기"
                onClick={closeRespondModal}
                className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={17} />
              </button>
            </div>

            <div className="grid gap-5 px-6 py-5 lg:grid-cols-[260px_minmax(0,1fr)]">
              {respondTarget.negotiationType === "QUOTE" ? (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black text-slate-500">
                    이전 견적 (이번 라운드 기준)
                  </p>
                  <ul className="mt-2.5 space-y-1.5 text-xs text-slate-600">
                    <li>
                      리드타임 {respondBaselineQuote?.leadTimeDays ?? "-"}일
                    </li>
                    <li>
                      배송비{" "}
                      {respondBaselineQuote
                        ? formatPrice(respondBaselineQuote.shippingFee)
                        : "-"}
                    </li>
                    <li>
                      유효기간{" "}
                      {respondBaselineQuote
                        ? formatDateTime(respondBaselineQuote.validUntil)
                        : "-"}
                    </li>
                    <li className="border-t border-slate-200 pt-1.5 font-black text-slate-800">
                      합계{" "}
                      {respondBaselineQuote
                        ? formatPrice(respondBaselineQuote.totalAmount)
                        : "-"}
                    </li>
                  </ul>
                  <div className="mt-3 border-t border-slate-200 pt-3">
                    <p className="text-xs font-black text-slate-500">품목</p>
                    <ul className="mt-1.5 space-y-1 text-xs text-slate-600">
                      {respondBaselineQuote?.items.map((item, index) => (
                        <li key={index}>
                          {item.optionSummary} · {item.quantity}개 ·{" "}
                          {formatPrice(item.unitPrice)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black text-slate-500">
                    이전 계약 조건 (이번 라운드 기준)
                  </p>
                  <ul className="mt-2.5 space-y-1.5 text-xs text-slate-600">
                    <li>계약명 {respondBaselineContract?.contractName ?? "-"}</li>
                    <li>
                      납품 예정일 {respondBaselineContract?.deliveryDate ?? "-"}
                    </li>
                    <li>
                      결제 조건 {respondBaselineContract?.paymentTerms ?? "-"}
                    </li>
                    <li>
                      반품·교환 조건{" "}
                      {respondBaselineContract?.returnPolicy ?? "-"}
                    </li>
                    {respondBaselineContract?.specialTerms && (
                      <li>특약사항 {respondBaselineContract.specialTerms}</li>
                    )}
                    <li className="border-t border-slate-200 pt-1.5 font-black text-slate-800">
                      계약 금액{" "}
                      {respondBaselineContract
                        ? formatPrice(respondBaselineContract.contractAmount)
                        : "-"}
                    </li>
                  </ul>
                </div>
              )}

              <div className="space-y-4">
              {respondTarget.negotiationType === "QUOTE" ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-xs font-black text-slate-700">
                        리드타임(일)
                      </span>
                      <input
                        type="number"
                        min={1}
                        value={respondLeadTimeDays}
                        onChange={(event) =>
                          setRespondLeadTimeDays(event.target.value)
                        }
                        className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                      {respondBaselineQuote && respondLeadTimeDays.trim() && (
                        <DeltaText
                          before={respondBaselineQuote.leadTimeDays}
                          after={Number(respondLeadTimeDays) || 0}
                          unit="일"
                        />
                      )}
                    </label>
                    <label className="block">
                      <span className="text-xs font-black text-slate-700">
                        배송비(원)
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={respondShippingFee}
                        onChange={(event) =>
                          setRespondShippingFee(event.target.value)
                        }
                        className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                      {respondBaselineQuote && respondShippingFee.trim() && (
                        <DeltaText
                          before={respondBaselineQuote.shippingFee}
                          after={Number(respondShippingFee) || 0}
                          unit="원"
                        />
                      )}
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-xs font-black text-slate-700">
                      견적 유효기간
                    </span>
                    <input
                      type="datetime-local"
                      value={respondValidUntil}
                      onChange={(event) =>
                        setRespondValidUntil(event.target.value)
                      }
                      className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-700">
                        품목
                      </span>
                      <button
                        type="button"
                        onClick={addRespondItem}
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        + 품목 추가
                      </button>
                    </div>
                    <div className="mt-2 space-y-2">
                      {respondItems.map((item, index) => {
                        const baselineItem = respondBaselineQuote?.items[index];
                        const currentQuantity = Number(item.quantity) || 0;
                        const currentUnitPrice = Number(item.unitPrice) || 0;
                        const currentItemTotal =
                          currentQuantity * currentUnitPrice;
                        const baselineItemTotal = baselineItem
                          ? baselineItem.quantity * baselineItem.unitPrice
                          : null;

                        return (
                          <div
                            key={index}
                            className="rounded-md border border-slate-200 p-3"
                          >
                            <div className="flex items-start gap-2">
                              <input
                                value={item.optionSummary}
                                onChange={(event) =>
                                  updateRespondItem(index, {
                                    optionSummary: event.target.value,
                                  })
                                }
                                placeholder="옵션 정보"
                                className="h-9 flex-1 rounded-md border border-slate-200 px-2.5 text-xs outline-none focus:border-blue-500"
                              />
                              <button
                                type="button"
                                title="품목 삭제"
                                onClick={() => removeRespondItem(index)}
                                className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                              >
                                <X size={14} />
                              </button>
                            </div>

                            <div className="mt-2 grid grid-cols-2 gap-2">
                              <label className="block">
                                <input
                                  type="number"
                                  min={1}
                                  value={item.quantity}
                                  onChange={(event) =>
                                    updateRespondItem(index, {
                                      quantity: event.target.value,
                                    })
                                  }
                                  placeholder="수량"
                                  className="h-9 w-full rounded-md border border-slate-200 px-2.5 text-xs outline-none focus:border-blue-500"
                                />
                                {baselineItem && item.quantity.trim() && (
                                  <DeltaText
                                    before={baselineItem.quantity}
                                    after={currentQuantity}
                                    unit="개"
                                  />
                                )}
                              </label>

                              <label className="block">
                                <input
                                  type="number"
                                  min={0}
                                  value={item.unitPrice}
                                  onChange={(event) =>
                                    updateRespondItem(index, {
                                      unitPrice: event.target.value,
                                    })
                                  }
                                  placeholder="단가"
                                  className="h-9 w-full rounded-md border border-slate-200 px-2.5 text-xs outline-none focus:border-blue-500"
                                />
                                {baselineItem && item.unitPrice.trim() && (
                                  <DeltaText
                                    before={baselineItem.unitPrice}
                                    after={currentUnitPrice}
                                    unit="원"
                                  />
                                )}
                              </label>
                            </div>

                            <div className="mt-2 flex items-center justify-between rounded-md bg-slate-50 px-2.5 py-2">
                              <span className="text-[11px] font-bold text-slate-500">
                                품목 소계
                              </span>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-xs font-black text-slate-800">
                                  {formatPrice(currentItemTotal)}
                                </span>
                                {baselineItemTotal !== null && (
                                  <DeltaText
                                    before={baselineItemTotal}
                                    after={currentItemTotal}
                                    unit="원"
                                  />
                                )}
                              </div>
                            </div>

                            <label className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                              <input
                                type="checkbox"
                                checked={item.sample}
                                onChange={(event) =>
                                  updateRespondItem(index, {
                                    sample: event.target.checked,
                                  })
                                }
                              />
                              샘플 품목
                            </label>
                          </div>
                        );
                      })}

                    </div>
                  </div>

                  <div className="flex items-baseline justify-between gap-3 rounded-md border border-blue-100 bg-blue-50/60 px-3 py-3">
                    <span className="text-sm font-black text-blue-700">
                      새 합계
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-black text-blue-800">
                        {formatPrice(respondCurrentTotal)}
                      </span>
                      {respondBaselineQuote && (
                        <DeltaText
                          before={respondBaselineQuote.totalAmount}
                          after={respondCurrentTotal}
                          unit="원"
                        />
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <label className="block">
                    <span className="text-xs font-black text-slate-700">
                      계약명
                    </span>
                    <input
                      value={respondContractName}
                      onChange={(event) =>
                        setRespondContractName(event.target.value)
                      }
                      className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-xs font-black text-slate-700">
                        납품 예정일
                      </span>
                      <input
                        type="date"
                        value={respondDeliveryDate}
                        onChange={(event) =>
                          setRespondDeliveryDate(event.target.value)
                        }
                        className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-black text-slate-700">
                        계약 금액(원)
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={respondContractAmount}
                        onChange={(event) =>
                          setRespondContractAmount(event.target.value)
                        }
                        className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                      {respondBaselineContract
                      && respondContractAmount.trim() && (
                        <DeltaText
                          before={respondBaselineContract.contractAmount}
                          after={Number(respondContractAmount) || 0}
                          unit="원"
                        />
                      )}
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-xs font-black text-slate-700">
                      결제 조건
                    </span>
                    <textarea
                      rows={2}
                      value={respondPaymentTerms}
                      onChange={(event) =>
                        setRespondPaymentTerms(event.target.value)
                      }
                      className="mt-1.5 w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-black text-slate-700">
                      반품·교환 조건
                    </span>
                    <textarea
                      rows={3}
                      value={respondReturnPolicy}
                      onChange={(event) =>
                        setRespondReturnPolicy(event.target.value)
                      }
                      className="mt-1.5 w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-black text-slate-700">
                      특약사항
                    </span>
                    <textarea
                      rows={2}
                      value={respondSpecialTerms}
                      onChange={(event) =>
                        setRespondSpecialTerms(event.target.value)
                      }
                      className="mt-1.5 w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                </>
              )}

              <label className="block">
                <span className="text-xs font-black text-slate-700">
                  셀러 메모
                </span>
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={respondSellerMemo}
                  onChange={(event) =>
                    setRespondSellerMemo(event.target.value)
                  }
                  placeholder={
                    respondTarget.negotiationType === "QUOTE"
                      ? "예: 요청하신 대로 최소 주문 수량을 200개로 조정했습니다. 다만 납기가 3일 늘어납니다."
                      : "예: 요청하신 납품일을 반영해 계약 조건을 수정했습니다."
                  }
                  className="mt-1.5 w-full resize-none rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              {respondError && (
                <p className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  {respondError}
                </p>
              )}
              </div>
            </div>

            <div className="flex gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                disabled={isResponding}
                onClick={closeRespondModal}
                className="h-10 flex-1 rounded-md border border-slate-200 bg-white text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                disabled={!canSubmitRespond || isResponding}
                onClick={() => void handleRespond()}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-blue-600 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isResponding ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
                {isResponding ? "전송 중..." : "응답 보내기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {reviewRequest !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
        >
          <div className="max-h-[90vh] w-full max-w-[960px] overflow-y-auto rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2
                  id="review-modal-title"
                  className="text-lg font-black text-slate-950"
                >
                  {reviewRequest.requestedContract
                    ? "이전 계약 조건 vs 새 계약 조건 비교"
                    : "이전 견적 vs 새 견적 비교"}
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  셀러가 응답한 새 조건과 이전 조건을 비교해서 확인하세요.
                </p>
              </div>
              <button
                type="button"
                title="모달 닫기"
                onClick={closeReviewModal}
                className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={17} />
              </button>
            </div>

            <div className="px-6 py-5">
              {reviewRequest.sellerMemo && (
                <div className="mb-4 rounded-md border border-blue-100 bg-blue-50/60 p-3">
                  <p className="text-xs font-black text-blue-700">셀러 메모</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {reviewRequest.sellerMemo}
                  </p>
                </div>
              )}

              {!reviewRequest.requestedContract ? (
                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-black text-slate-500">
                      이전 견적
                    </p>
                    <ul className="mt-2.5 space-y-1.5 text-xs text-slate-600">
                      <li>
                        리드타임{" "}
                        {reviewRequest.requestedQuote?.leadTimeDays ?? "-"}일
                      </li>
                      <li>
                        배송비{" "}
                        {reviewRequest.requestedQuote
                          ? formatPrice(reviewRequest.requestedQuote.shippingFee)
                          : "-"}
                      </li>
                      <li>
                        유효기간{" "}
                        {reviewRequest.requestedQuote
                          ? formatDateTime(
                            reviewRequest.requestedQuote.validUntil,
                          )
                          : "-"}
                      </li>
                      <li className="border-t border-slate-200 pt-1.5 font-black text-slate-800">
                        합계{" "}
                        {reviewRequest.requestedQuote
                          ? formatPrice(reviewRequest.requestedQuote.totalAmount)
                          : "-"}
                      </li>
                    </ul>
                    <div className="mt-3 border-t border-slate-200 pt-3">
                      <p className="text-xs font-black text-slate-500">품목</p>
                      <ul className="mt-1.5 space-y-1 text-xs text-slate-600">
                        {reviewRequest.requestedQuote?.items.map(
                          (item, index) => (
                            <li key={index}>
                              {item.optionSummary} · {item.quantity}개 ·{" "}
                              {formatPrice(item.unitPrice)}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="rounded-md border border-blue-200 bg-blue-50/40 p-4">
                    <p className="text-xs font-black text-blue-700">
                      새 견적
                    </p>
                    {reviewRequest.revisedQuote && (
                      <>
                        <ul className="mt-2.5 space-y-1.5 text-xs text-slate-700">
                          <li>
                            리드타임 {reviewRequest.revisedQuote.leadTimeDays}일
                            {reviewRequest.requestedQuote && (
                              <DeltaText
                                before={
                                  reviewRequest.requestedQuote.leadTimeDays
                                }
                                after={reviewRequest.revisedQuote.leadTimeDays}
                                unit="일"
                              />
                            )}
                          </li>
                          <li>
                            배송비{" "}
                            {formatPrice(reviewRequest.revisedQuote.shippingFee)}
                            {reviewRequest.requestedQuote && (
                              <DeltaText
                                before={
                                  reviewRequest.requestedQuote.shippingFee
                                }
                                after={reviewRequest.revisedQuote.shippingFee}
                                unit="원"
                              />
                            )}
                          </li>
                          <li>
                            유효기간{" "}
                            {formatDateTime(
                              reviewRequest.revisedQuote.validUntil,
                            )}
                          </li>
                          <li className="border-t border-blue-200 pt-1.5 font-black text-blue-800">
                            합계{" "}
                            {formatPrice(reviewRequest.revisedQuote.totalAmount)}
                            {reviewRequest.requestedQuote && (
                              <DeltaText
                                before={
                                  reviewRequest.requestedQuote.totalAmount
                                }
                                after={reviewRequest.revisedQuote.totalAmount}
                                unit="원"
                              />
                            )}
                          </li>
                        </ul>
                        <div className="mt-3 border-t border-blue-200 pt-3">
                          <p className="text-xs font-black text-blue-700">
                            품목
                          </p>
                          <ul className="mt-1.5 space-y-1 text-xs text-slate-700">
                            {reviewRequest.revisedQuote.items.map(
                              (item, index) => (
                                <li key={index}>
                                  {item.optionSummary} · {item.quantity}개 ·{" "}
                                  {formatPrice(item.unitPrice)}
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-black text-slate-500">
                      이전 계약 조건
                    </p>
                    <ul className="mt-2.5 space-y-1.5 text-xs text-slate-600">
                      <li>
                        계약명 {reviewRequest.requestedContract?.contractName ?? "-"}
                      </li>
                      <li>
                        납품 예정일{" "}
                        {reviewRequest.requestedContract?.deliveryDate ?? "-"}
                      </li>
                      <li>
                        결제 조건{" "}
                        {reviewRequest.requestedContract?.paymentTerms ?? "-"}
                      </li>
                      <li>
                        반품·교환 조건{" "}
                        {reviewRequest.requestedContract?.returnPolicy ?? "-"}
                      </li>
                      {reviewRequest.requestedContract?.specialTerms && (
                        <li>
                          특약사항 {reviewRequest.requestedContract.specialTerms}
                        </li>
                      )}
                      <li className="border-t border-slate-200 pt-1.5 font-black text-slate-800">
                        계약 금액{" "}
                        {reviewRequest.requestedContract
                          ? formatPrice(
                            reviewRequest.requestedContract.contractAmount,
                          )
                          : "-"}
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-md border border-blue-200 bg-blue-50/40 p-4">
                    <p className="text-xs font-black text-blue-700">
                      새 계약 조건
                    </p>
                    {reviewRequest.revisedContract && (
                      <ul className="mt-2.5 space-y-1.5 text-xs text-slate-700">
                        <li>
                          계약명{" "}
                          {reviewRequest.revisedContract.contractName ?? "-"}
                        </li>
                        <li>
                          납품 예정일{" "}
                          {reviewRequest.revisedContract.deliveryDate}
                        </li>
                        <li>
                          결제 조건 {reviewRequest.revisedContract.paymentTerms}
                        </li>
                        <li>
                          반품·교환 조건{" "}
                          {reviewRequest.revisedContract.returnPolicy}
                        </li>
                        {reviewRequest.revisedContract.specialTerms && (
                          <li>
                            특약사항{" "}
                            {reviewRequest.revisedContract.specialTerms}
                          </li>
                        )}
                        <li className="border-t border-blue-200 pt-1.5 font-black text-blue-800">
                          계약 금액{" "}
                          {formatPrice(
                            reviewRequest.revisedContract.contractAmount,
                          )}
                          {reviewRequest.requestedContract && (
                            <DeltaText
                              before={
                                reviewRequest.requestedContract.contractAmount
                              }
                              after={
                                reviewRequest.revisedContract.contractAmount
                              }
                              unit="원"
                            />
                          )}
                        </li>
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {decideError && (
                <p className="mt-4 flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  {decideError}
                </p>
              )}
            </div>

            <div className="flex gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                disabled={isDeciding}
                onClick={closeReviewModal}
                className="h-10 flex-1 rounded-md border border-slate-200 bg-white text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
              >
                닫기
              </button>
              {reviewRequest.status === "RESPONDED"
              && selected?.status === "OPEN"
              && viewerRole === "BUYER" && (
                <>
                  <button
                    type="button"
                    disabled={isDeciding}
                    onClick={async () => {
                      await handleReject(reviewRequest.negotiationRequestId);
                      setReviewRequest(null);
                    }}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md bg-rose-600 text-sm font-black text-white transition hover:bg-rose-700 disabled:opacity-50"
                  >
                    <X size={15} />
                    거절
                  </button>
                  <button
                    type="button"
                    disabled={isDeciding}
                    onClick={async () => {
                      await handleAccept(reviewRequest.negotiationRequestId);
                      setReviewRequest(null);
                    }}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md bg-emerald-600 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircle2 size={15} />
                    수락
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  iconClassName,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconClassName: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-sm font-bold text-slate-500">{label}</p>
        <span
          className={`inline-flex size-9 items-center justify-center rounded-md ${iconClassName}`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-4 text-3xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-4 last:mb-0">
      <dt className="text-xs font-bold text-slate-400">{label}</dt>
      <dd className="mt-1 font-semibold text-slate-700">{value}</dd>
    </div>
  );
}

function RoundCard({
  round,
  request,
  negotiationType,
}: {
  round: number;
  request: NegotiationRequestDetail;
  negotiationType: "QUOTE" | "CONTRACT";
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <span className="text-xs font-black text-slate-600">
          {round}라운드
        </span>
        <span className="text-xs font-bold text-slate-500">
          {requestStatusLabel[request.status]}
        </span>
      </div>
      <div className="p-4">
        <p className="text-xs font-bold text-slate-400">바이어 요청</p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {request.buyerRequest}
        </p>

        {(request.revisedQuote || request.revisedContract) && (
          <div className="mt-3 rounded-md border border-blue-100 bg-blue-50/60 p-3">
            <p className="text-xs font-bold text-blue-700">셀러 응답</p>
            {request.sellerMemo && (
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {request.sellerMemo}
              </p>
            )}

            {negotiationType === "QUOTE" && request.revisedQuote && (
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="font-black text-slate-500">이전 조건</p>
                  <ul className="mt-1 space-y-1 text-slate-600">
                    <li>
                      리드타임 {request.requestedQuote?.leadTimeDays ?? "-"}일
                    </li>
                    <li>
                      배송비{" "}
                      {request.requestedQuote
                        ? formatPrice(request.requestedQuote.shippingFee)
                        : "-"}
                    </li>
                    <li>
                      합계{" "}
                      {request.requestedQuote
                        ? formatPrice(request.requestedQuote.totalAmount)
                        : "-"}
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="font-black text-blue-700">변경된 조건</p>
                  <ul className="mt-1 space-y-1 text-slate-700">
                    <li>
                      리드타임 {request.revisedQuote.leadTimeDays}일
                      {request.requestedQuote && (
                        <DeltaText
                          before={request.requestedQuote.leadTimeDays}
                          after={request.revisedQuote.leadTimeDays}
                          unit="일"
                        />
                      )}
                    </li>
                    <li>
                      배송비 {formatPrice(request.revisedQuote.shippingFee)}
                      {request.requestedQuote && (
                        <DeltaText
                          before={request.requestedQuote.shippingFee}
                          after={request.revisedQuote.shippingFee}
                          unit="원"
                        />
                      )}
                    </li>
                    <li>
                      합계 {formatPrice(request.revisedQuote.totalAmount)}
                      {request.requestedQuote && (
                        <DeltaText
                          before={request.requestedQuote.totalAmount}
                          after={request.revisedQuote.totalAmount}
                          unit="원"
                        />
                      )}
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {negotiationType === "CONTRACT" && request.revisedContract && (
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="font-black text-slate-500">이전 조건</p>
                  <ul className="mt-1 space-y-1 text-slate-600">
                    <li>
                      납품 예정일{" "}
                      {request.requestedContract?.deliveryDate ?? "-"}
                    </li>
                    <li>
                      계약 금액{" "}
                      {request.requestedContract
                        ? formatPrice(
                          request.requestedContract.contractAmount,
                        )
                        : "-"}
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="font-black text-blue-700">변경된 조건</p>
                  <ul className="mt-1 space-y-1 text-slate-700">
                    <li>납품 예정일 {request.revisedContract.deliveryDate}</li>
                    <li>결제 조건 {request.revisedContract.paymentTerms}</li>
                    <li>
                      계약 금액{" "}
                      {formatPrice(request.revisedContract.contractAmount)}
                      {request.requestedContract && (
                        <DeltaText
                          before={request.requestedContract.contractAmount}
                          after={request.revisedContract.contractAmount}
                          unit="원"
                        />
                      )}
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DeltaText({
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
      <span className="ml-1 text-[11px] font-bold text-slate-400">
        (변동 없음)
      </span>
    );
  }

  const decreased = diff < 0;

  return (
    <span
      className={`ml-1 text-[11px] font-black leading-none ${
        decreased ? "text-blue-600" : "text-rose-600"
      }`}
    >
      ({decreased ? "▼" : "▲"}
      {Math.abs(diff).toLocaleString("ko-KR")}
      {unit})
    </span>
  );
}
