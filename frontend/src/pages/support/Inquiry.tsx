/**
 * Inquiry.tsx
 * 1:1 문의 채팅 페이지
 *
 * 권한별 접근 범위
 *   ADMIN     → 전체 회사의 모든 문의 조회 + 답변 가능
 *   PRESIDENT → 자기 회사 소속 전체 문의 조회 (본인 + 직원) + 본인 문의만 메시지 전송
 *   EMPLOYEE  → 본인이 생성한 문의만 조회 + 메시지 전송
 *
 * API 연동
 *   inquiry.service.ts (getInquiries / getInquiryMessages / readInquiryMessages /
 *   createInquiry / sendInquiryMessage) 를 통해 백엔드와 통신합니다.
 *   axios 인터셉터가 ApiResponse<T>를 언랩하여 T를 바로 리턴하므로,
 *   이 컴포넌트에서는 항상 실제 데이터 타입만 다룹니다.
 *   에러는 axios 인터셉터가 error.message를 백엔드 ErrorResponse.message(한국어)로
 *   덮어써서 던지므로, catch 블록에서 e.message를 바로 사용하면 됩니다.
 *
 * 웹소켓 연동
 *   useInquirySocket 훅(STOMP)으로 실시간 메시지 수신 — /topic/support/inquiry/{id} 구독,
 *   /app/support/inquiry/{id}/message 로 발행. 소켓 미연결 시에만 sendInquiryMessage(HTTP)로
 *   폴백합니다.
 */

import {type JSX, useCallback, useEffect, useRef, useState} from "react";
import {
    CheckCircle,
    Clock,
    CreditCard,
    HelpCircle,
    Loader2,
    Lock,
    MessageCircle,
    Package,
    Plus,
    Search,
    Send,
    ShieldCheck,
    ShoppingBag,
    Truck,
    User,
    Users,
    X,
    XCircle,
} from "lucide-react";

import {
    createInquiry,
    getCompanies,
    getCompanyEmployees,
    getInquiries,
    getInquiryDetail,
    getInquiryMessages,
    readInquiryMessages,
    sendInquiryMessage,
} from "@/api/support/inquiry.service";
import type {
    CategoryKey,
    CompanyResponse,
    EmployeeResponse,
    InquiryMessageResponse as InquiryMessage,
    InquiryResponse as Inquiry,
    InquiryStatus,
    UserRole,
} from "@/api/support/inquiry.types";
import {useAuthStore} from "@/store/useAuthStore";
import {Client} from "@stomp/stompjs";

// ── 카테고리/상태 메타데이터 ──────────────────────────────────────────────────
// inquiry.types.ts의 CategoryKey ("ACCOUNT" | "ORDER" | "PAYMENT" | "DELIVERY" | "PRODUCT" | "ETC") 기준

interface InquiryProps {
    embedded?: boolean;
}

const CATEGORY_META: Record<CategoryKey, {
    label: string; icon: JSX.Element; color: string; bg: string; border: string;
}> = {
    ACCOUNT: {
        label: "계정",
        icon: <User size={11}/>,
        color: "text-violet-700",
        bg: "bg-violet-50",
        border: "border-violet-200"
    },
    ORDER: {
        label: "주문",
        icon: <ShoppingBag size={11}/>,
        color: "text-blue-700",
        bg: "bg-blue-50",
        border: "border-blue-200"
    },
    DELIVERY: {
        label: "배송",
        icon: <Truck size={11}/>,
        color: "text-cyan-700",
        bg: "bg-cyan-50",
        border: "border-cyan-200"
    },
    PRODUCT: {
        label: "상품",
        icon: <Package size={11}/>,
        color: "text-emerald-700",
        bg: "bg-emerald-50",
        border: "border-emerald-200"
    },
    PAYMENT: {
        label: "결제",
        icon: <CreditCard size={11}/>,
        color: "text-orange-700",
        bg: "bg-orange-50",
        border: "border-orange-200"
    },
    ETC: {
        label: "기타",
        icon: <HelpCircle size={11}/>,
        color: "text-gray-600",
        bg: "bg-gray-50",
        border: "border-gray-200"
    },
};

const STATUS_META: Record<InquiryStatus, {
    label: string; icon: JSX.Element; color: string; bg: string; border: string;
}> = {
    OPEN: {
        label: "접수",
        icon: <MessageCircle size={11}/>,
        color: "text-primary",
        bg: "bg-primary/5",
        border: "border-primary/20"
    },
    WAITING: {
        label: "답변 대기",
        icon: <Clock size={11}/>,
        color: "text-amber-700",
        bg: "bg-amber-50",
        border: "border-amber-200"
    },
    ANSWERED: {
        label: "답변 완료",
        icon: <CheckCircle size={11}/>,
        color: "text-emerald-700",
        bg: "bg-emerald-50",
        border: "border-emerald-200"
    },
    CLOSED: {
        label: "종료",
        icon: <XCircle size={11}/>,
        color: "text-gray-500",
        bg: "bg-gray-100",
        border: "border-gray-200"
    },
};

// ── 웹소켓 훅 ─────────────────────────────────────────────────────────────────
function useInquirySocket(
    inquiryId: number | null,
    onMessage: (msg: InquiryMessage) => void,
) {
    const stompClientRef = useRef<Client | null>(null);

    useEffect(() => {
        if (!inquiryId) return;

        // 1. STOMP 클라이언트 생성 및 설정
        const client = new Client({
            brokerURL: "ws://localhost:8080/ws",
            // webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
            debug: (str) => console.log("[STOMP Debug]", str),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,

            onConnect: () => {
                // 2. 백엔드 매핑 경로 구독: /topic/support/inquiry/{inquiryId}
                client.subscribe(`/topic/support/inquiry/${inquiryId}`, (frame) => {
                    try {
                        const msg: InquiryMessage = JSON.parse(frame.body);
                        onMessage(msg);
                    } catch (err) {
                        console.error("웹소켓 메시지 파싱 에러:", err);
                    }
                });
            },
            onStompError: (frame) => {
                console.error("STOMP 프로토콜 에러:", frame.headers["message"]);
            }
        });

        client.activate();
        stompClientRef.current = client;

        // 3. 컴포넌트 언마운트 또는 다른 채팅방 이동 시 연결 해제
        return () => {
            client.deactivate();
            stompClientRef.current = null;
        };
    }, [inquiryId, onMessage]);

    const sendSocketMessage = useCallback((text: string) => {
        const client = stompClientRef.current;
        if (client && client.connected && inquiryId) {
            client.publish({
                destination: `/app/support/inquiry/${inquiryId}/message`,
                body: JSON.stringify({message: text}), // Payload 매핑
            });
            return true;
        }
        return false;
    }, [inquiryId]);

    return {sendSocketMessage};
}

// ── 현재 로그인 유저 ──────────────────────────────────────────────────────────
// useAuthStore(zustand)의 user를 그대로 사용합니다. (아래 컴포넌트 내부에서 구독)

// ── 공통 UI ───────────────────────────────────────────────────────────────────

function Avatar({name, isAdmin = false, size = "md"}: {
    name: string; isAdmin?: boolean; size?: "sm" | "md";
}) {
    const dim = size === "sm" ? "w-7 h-7 text-[10px]" : "w-9 h-9 text-xs";
    const cls = isAdmin
        ? "bg-foreground/10 text-foreground"
        : "bg-primary/10 text-primary";
    return (
        <div className={`${dim} ${cls} rounded-full font-bold flex items-center justify-center shrink-0`}>
            {name.slice(0, 2)}
        </div>
    );
}

function CategoryBadge({category}: { category: string }) {
    const m = CATEGORY_META[category as CategoryKey] ?? CATEGORY_META.ETC;
    return (
        <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${m.color} ${m.bg} ${m.border}`}>
            {m.icon}{m.label}
        </span>
    );
}

function StatusBadge({status}: { status: InquiryStatus }) {
    const m = STATUS_META[status];
    return (
        <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${m.color} ${m.bg} ${m.border}`}>
            {m.icon}{m.label}
        </span>
    );
}

function ErrorBanner({message, onRetry}: { message: string; onRetry?: () => void }) {
    return (
        <div
            className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg m-3">
            <span>{message}</span>
            {onRetry && (
                <button onClick={onRetry} className="font-semibold underline shrink-0">
                    다시 시도
                </button>
            )}
        </div>
    );
}

// axios 응답 인터셉터가 에러 발생 시 error.message를 백엔드 ErrorResponse.message(한국어)로
// 덮어써서 넘겨주므로, 여기서는 e.message를 그대로 사용하면 됩니다.
// 필드별 검증 에러가 필요하면 (e as AxiosError<ErrorResponse>).response?.data?.data 를 참고하세요.
function resolveErrorMessage(e: unknown, fallback: string): string {
    if (e instanceof Error && e.message) {
        return e.message;
    }
    return fallback;
}

// ── 날짜/시간 포맷 유틸 ──────────────────────────────────────────────────────
// 백엔드가 LocalDateTime을 ISO 문자열(예: "2026-07-04T20:44:57.542693")로 내려주므로
// Date로 파싱해서 사람이 보기 좋은 형태로 변환합니다.

function parseDate(iso: string): Date {
    return new Date(iso);
}

function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function isSameMinute(a: Date, b: Date): boolean {
    return isSameDay(a, b) && a.getHours() === b.getHours() && a.getMinutes() === b.getMinutes();
}

// 채팅 내 날짜 구분선 — "오늘" / "어제" / "2026년 7월 3일"
function formatDateDivider(date: Date): string {
    const now = new Date();
    if (isSameDay(date, now)) return "오늘";

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (isSameDay(date, yesterday)) return "어제";

    return date.toLocaleDateString("ko-KR", {year: "numeric", month: "long", day: "numeric"});
}

// 메시지 버블 옆 시각 — "오후 8:44"
function formatTime(date: Date): string {
    return date.toLocaleTimeString("ko-KR", {hour: "numeric", minute: "2-digit", hour12: true});
}

// 문의 목록의 마지막 메시지 시각 — 오늘이면 시간만, 어제면 "어제", 그 외엔 날짜
function formatListTimestamp(iso: string | null): string {
    if (!iso) return "";
    const date = parseDate(iso);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    if (isSameDay(date, now)) return formatTime(date);

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (isSameDay(date, yesterday)) return "어제";

    if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString("ko-KR", {month: "long", day: "numeric"});
    }
    return date.toLocaleDateString("ko-KR", {year: "numeric", month: "2-digit", day: "2-digit"});
}

// ── 새 문의 모달 ──────────────────────────────────────────────────────────────

function NewInquiryModal({onClose, onCreate, submitting}: {
    onClose: () => void;
    onCreate: (category: CategoryKey, title: string) => void;
    submitting: boolean;
}) {
    const [category, setCategory] = useState<CategoryKey | null>(null);
    const [title, setTitle] = useState("");

    const options: { key: CategoryKey; label: string; icon: JSX.Element; desc: string }[] = [
        {key: "ACCOUNT", label: "계정", icon: <User size={16}/>, desc: "로그인, 회원정보, 권한"},
        {key: "ORDER", label: "주문", icon: <ShoppingBag size={16}/>, desc: "주문 조회, 취소, 배송"},
        {key: "DELIVERY", label: "배송", icon: <Truck size={16}/>, desc: "배송 조회, 지연, 반품"},
        {key: "PRODUCT", label: "상품", icon: <Package size={16}/>, desc: "상품 등록, 수정, 오류"},
        {key: "PAYMENT", label: "결제", icon: <CreditCard size={16}/>, desc: "결제, 정산, 세금계산서"},
        {key: "ETC", label: "기타", icon: <HelpCircle size={16}/>, desc: "그 외 모든 문의"},
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <h2 className="text-sm font-bold text-foreground">새 문의 시작</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X size={16}/>
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            문의 분야
                        </p>
                        <div className="grid grid-cols-1 gap-1.5">
                            {options.map((o) => (
                                <button
                                    key={o.key}
                                    onClick={() => setCategory(o.key)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all ${
                                        category === o.key
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/30"
                                    }`}
                                >
                                    <span
                                        className={`p-1.5 rounded ${category === o.key ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                                        {o.icon}
                                    </span>
                                    <span>
                                        <span className="block text-sm font-semibold text-foreground">{o.label}</span>
                                        <span className="block text-xs text-muted-foreground">{o.desc}</span>
                                    </span>
                                    {category === o.key &&
                                        <CheckCircle size={14} className="text-primary ml-auto shrink-0"/>}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">제목</p>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="문의 내용을 요약해서 입력해 주세요."
                            maxLength={100}
                            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-right">{title.length}/100</p>
                    </div>
                </div>

                <div className="flex gap-2 px-5 pb-5">
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    >
                        취소
                    </button>
                    <button
                        onClick={() => category && title.trim() && onCreate(category, title.trim())}
                        disabled={!category || !title.trim() || submitting}
                        className="flex-1 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-40 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                        {submitting && <Loader2 size={14} className="animate-spin"/>}
                        문의 시작
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── 문의 목록 패널 ────────────────────────────────────────────────────────────

function InquiryListPanel({
                              inquiries, selectedId, viewerRole, currentUserId, isLoading, error,
                              employees, companies, companyFilter, onCompanyFilterChange,
                              onSelect, onNew, onRetry,
                          }: {
    inquiries: Inquiry[];
    selectedId: number | null;
    viewerRole: UserRole;
    currentUserId: number;
    isLoading: boolean;
    error: string | null;
    employees: EmployeeResponse[];
    companies: CompanyResponse[];
    companyFilter: number | "all";
    onCompanyFilterChange: (id: number | "all") => void;
    onSelect: (id: number) => void;
    onNew: () => void;
    onRetry: () => void;
}) {
    const [search, setSearch] = useState("");
    const [employeeFilter, setEmployeeFilter] = useState<number | "all">("all");

    // 회사(companyFilter)가 바뀌면 그 전 직원 필터는 의미가 없으므로 초기화
    useEffect(() => {
        setEmployeeFilter("all");
    }, [companyFilter]);

    // 백엔드가 이미 권한별 목록을 필터링해서 내려주지만,
    // PRESIDENT/ADMIN의 직원별 필터·검색은 프론트에서 한 번 더 좁혀줍니다.
    const visible = inquiries.filter((inq) => {
        if (viewerRole === "PRESIDENT" && employeeFilter !== "all" && inq.createdByUserId !== employeeFilter) return false;
        if (viewerRole === "ADMIN") {
            if (companyFilter !== "all" && inq.companyId !== companyFilter) return false;
            if (companyFilter !== "all" && employeeFilter !== "all" && inq.createdByUserId !== employeeFilter) return false;
        }
        const q = search.trim().toLowerCase();
        return !q || inq.title.toLowerCase().includes(q) || inq.createdByUserName.includes(q);
    });

    // 새 문의 버튼: ADMIN은 유저 문의를 생성하지 않음
    const canCreate = viewerRole !== "ADMIN";

    return (
        <div className="flex flex-col h-full border-r border-border">
            {/* 헤더 */}
            <div className="px-4 pt-4 pb-3 border-b border-border space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-foreground">문의 내역</h2>
                    {canCreate && (
                        <button
                            onClick={onNew}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            <Plus size={13}/> 새 문의
                        </button>
                    )}
                </div>

                {/* PRESIDENT: 직원별 필터 */}
                {viewerRole === "PRESIDENT" && (
                    <div className="flex flex-wrap gap-1.5">
                        <button
                            onClick={() => setEmployeeFilter("all")}
                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                                employeeFilter === "all"
                                    ? "bg-foreground text-background border-foreground"
                                    : "border-border text-muted-foreground hover:border-foreground/30"
                            }`}
                        >
                            전체
                        </button>
                        <button
                            onClick={() => setEmployeeFilter(currentUserId)}
                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                                employeeFilter === currentUserId
                                    ? "bg-primary text-white border-primary"
                                    : "border-border text-muted-foreground hover:border-primary/40"
                            }`}
                        >
                            내 문의
                        </button>
                        {employees.map((emp) => (
                            <button
                                key={emp.userId}
                                onClick={() => setEmployeeFilter(emp.userId)}
                                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                                    employeeFilter === emp.userId
                                        ? "bg-amber-500 text-white border-amber-500"
                                        : "border-border text-muted-foreground hover:border-amber-400"
                                }`}
                            >
                                {emp.name}
                            </button>
                        ))}
                    </div>
                )}

                {viewerRole === "ADMIN" && (
                    <div className="space-y-2">
                        <select
                            value={companyFilter}
                            onChange={(e) => onCompanyFilterChange(e.target.value === "all" ? "all" : Number(e.target.value))}
                            className="w-full text-[11px] border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-primary transition-colors bg-white"
                        >
                            <option value="all">전체 회사</option>
                            {companies.map((c) => (
                                <option key={c.companyId} value={c.companyId}>{c.companyName}</option>
                            ))}
                        </select>

                        {/* 회사를 선택하면 그 회사 소속 직원별로 한 번 더 좁힐 수 있음 */}
                        {companyFilter !== "all" && (
                            <div className="flex flex-wrap gap-1.5">
                                <button
                                    onClick={() => setEmployeeFilter("all")}
                                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                                        employeeFilter === "all"
                                            ? "bg-foreground text-background border-foreground"
                                            : "border-border text-muted-foreground hover:border-foreground/30"
                                    }`}
                                >
                                    전체 직원
                                </button>
                                {employees.map((emp) => (
                                    <button
                                        key={emp.userId}
                                        onClick={() => setEmployeeFilter(emp.userId)}
                                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                                            employeeFilter === emp.userId
                                                ? "bg-amber-500 text-white border-amber-500"
                                                : "border-border text-muted-foreground hover:border-amber-400"
                                        }`}
                                    >
                                        {emp.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="문의 검색"
                        className="w-full pl-8 pr-3 py-2 text-xs border border-border rounded-lg outline-none focus:border-primary transition-colors"
                    />
                </div>
            </div>

            {/* 목록 */}
            <div className="flex-1 overflow-y-auto">
                {error && <ErrorBanner message={error} onRetry={onRetry}/>}

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-2">
                        <Loader2 size={20} className="animate-spin text-muted-foreground/50"/>
                        <p className="text-xs text-muted-foreground">문의 내역을 불러오는 중...</p>
                    </div>
                ) : visible.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                        <MessageCircle size={24} className="text-muted-foreground/30 mb-2"/>
                        <p className="text-xs text-muted-foreground">문의 내역이 없습니다.</p>
                    </div>
                ) : (
                    visible.map((inq) => {
                        const isSelected = selectedId === inq.inquiryId;
                        const isOwn = inq.createdByUserId === currentUserId;

                        return (
                            <button
                                key={inq.inquiryId}
                                onClick={() => onSelect(inq.inquiryId)}
                                className={`w-full text-left px-4 py-3.5 border-b border-border/50 transition-colors ${
                                    isSelected
                                        ? "bg-primary/5 border-l-2 border-l-primary"
                                        : "hover:bg-muted/30"
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                        <CategoryBadge category={inq.category}/>
                                        {(viewerRole === "PRESIDENT" || viewerRole === "ADMIN") && !isOwn && (
                                            <span
                                                className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                                {inq.createdByUserName}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {inq.unreadCount > 0 && (
                                            <span
                                                className="min-w-[18px] h-[18px] rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center px-1">
                                                {inq.unreadCount > 9 ? "9+" : inq.unreadCount}
                                            </span>
                                        )}
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                            {formatListTimestamp(inq.lastMessageAt ?? inq.createdAt)}
                                        </span>
                                    </div>
                                </div>

                                <p className={`text-xs font-semibold mb-1 truncate ${isSelected ? "text-primary" : "text-foreground"}`}>
                                    {inq.title}
                                </p>
                                <p className="text-[11px] text-muted-foreground truncate">
                                    {inq.lastMessagePreview ?? "메시지가 없습니다."}
                                </p>
                                <div className="mt-2">
                                    <StatusBadge status={inq.status}/>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}

// ── 채팅 패널 ─────────────────────────────────────────────────────────────────

function ChatPanel({inquiry, messages, viewerRole, currentUserId, isLoading, error, sending, onSend, onRetry}: {
    inquiry: Inquiry | null;
    messages: InquiryMessage[];
    viewerRole: UserRole;
    currentUserId: number;
    isLoading: boolean;
    error: string | null;
    sending: boolean;
    onSend: (text: string) => void;
    onRetry: () => void;
}) {
    const [input, setInput] = useState("");
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (el) {
            el.scrollTop = el.scrollHeight;
        }
    }, [messages]);

    if (!inquiry) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center mb-4">
                    <MessageCircle size={28} className="text-muted-foreground/40"/>
                </div>
                <p className="text-sm font-semibold text-muted-foreground">문의를 선택해 주세요</p>
                <p className="text-xs text-muted-foreground mt-1">왼쪽 목록에서 문의를 선택하면 대화 내용을 볼 수 있습니다.</p>
            </div>
        );
    }

    const isClosed = inquiry.status === "CLOSED";
    const isOwn = inquiry.createdByUserId === currentUserId;

    // 메시지 전송 가능 여부
    // ADMIN: 항상 전송 가능 (답변)
    // PRESIDENT: 본인 문의만 전송 (직원 문의는 읽기 전용)
    // EMPLOYEE: 본인 문의만 전송
    const canSend = !isClosed && (viewerRole === "ADMIN" || isOwn);
    const isReadOnly = !isClosed && !canSend;

    const handleSend = () => {
        const text = input.trim();
        if (!text || !canSend || sending) return;
        setInput("");
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
        onSend(text);
    };

    return (
        <div className="flex-1 flex flex-col min-w-0">
            {/* 채팅 헤더 */}
            <div className="px-5 py-3.5 border-b border-border bg-white">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <CategoryBadge category={inquiry.category}/>
                            <StatusBadge status={inquiry.status}/>
                            {(viewerRole === "PRESIDENT" || viewerRole === "ADMIN") && !isOwn && (
                                <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                                    <Users size={11}/> {inquiry.createdByUserName} 님의 문의
                                </span>
                            )}
                        </div>
                        <h3 className="text-sm font-bold text-foreground truncate">{inquiry.title}</h3>
                    </div>
                    {inquiry.assignedAdminName && (
                        <div
                            className="flex items-center gap-1.5 shrink-0 text-xs text-muted-foreground bg-muted/40 rounded-lg px-2.5 py-1.5 border border-border">
                            <ShieldCheck size={12} className="text-primary/60"/>
                            {inquiry.assignedAdminName} 담당
                        </div>
                    )}
                </div>
            </div>

            {/* 메시지 목록 */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-muted/[0.03]">
                {error && <ErrorBanner message={error} onRetry={onRetry}/>}

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                        <Loader2 size={20} className="animate-spin text-muted-foreground/50"/>
                        <p className="text-xs text-muted-foreground">대화 내용을 불러오는 중...</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isAdminMsg = msg.senderRole === "ADMIN";
                        const isMineMsg = msg.senderId === currentUserId;

                        // 버블 방향 결정
                        // - ADMIN이 보는 경우: 유저 메시지=왼쪽, 관리자(본인)=오른쪽
                        // - PRESIDENT/EMPLOYEE: 본인=오른쪽, 관리자=왼쪽, 다른 유저=왼쪽(amber)
                        const alignRight = viewerRole === "ADMIN" ? isAdminMsg : isMineMsg;

                        const prevMsg = messages[idx - 1];
                        const msgDate = parseDate(msg.createdAt);
                        const showDate = !prevMsg || !isSameDay(msgDate, parseDate(prevMsg.createdAt));

                        // 같은 발신자 + 같은 분(minute)으로 이어지는 메시지는 시간을 숨기고
                        // 그 묶음의 마지막 메시지에만 시간을 표시합니다.
                        const nextMsg = messages[idx + 1];
                        const showTime = !nextMsg
                            || nextMsg.senderId !== msg.senderId
                            || !isSameMinute(msgDate, parseDate(nextMsg.createdAt));

                        return (
                            <div key={msg.messageId}>
                                {showDate && (
                                    <div className="flex items-center gap-3 my-2">
                                        <div className="flex-1 h-px bg-border"/>
                                        <span className="text-[11px] text-muted-foreground font-medium">
                                            {formatDateDivider(msgDate)}
                                        </span>
                                        <div className="flex-1 h-px bg-border"/>
                                    </div>
                                )}

                                <div className={`flex items-end gap-2 ${alignRight ? "flex-row-reverse" : "flex-row"}`}>
                                    {!alignRight && (
                                        <Avatar name={msg.senderName} isAdmin={isAdminMsg} size="sm"/>
                                    )}

                                    <div
                                        className={`flex flex-col gap-1 max-w-[72%] ${alignRight ? "items-end" : "items-start"}`}>
                                        {!alignRight && (
                                            <span className="text-[10px] font-semibold text-muted-foreground px-1">
                                                {isAdminMsg ? `🛡 ${msg.senderName}` : msg.senderName}
                                            </span>
                                        )}

                                        <div
                                            className={`flex items-end gap-1.5 ${alignRight ? "flex-row-reverse" : ""}`}>
                                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                                alignRight
                                                    ? "bg-primary text-white rounded-br-md"
                                                    : isAdminMsg
                                                        ? "bg-white border border-border text-foreground rounded-bl-md shadow-sm"
                                                        : "bg-amber-50 border border-amber-200 text-foreground rounded-bl-md"
                                            }`}>
                                                {msg.message}
                                            </div>
                                            {showTime && (
                                                <span
                                                    className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mb-0.5">
                                                    {formatTime(msgDate)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* 입력 영역 */}
            <div className="border-t border-border bg-white">
                {isClosed ? (
                    <div className="flex items-center justify-center gap-2 px-5 py-3.5 text-xs text-muted-foreground">
                        <XCircle size={13}/> 종료된 문의입니다. 새 문의를 열어 주세요.
                    </div>
                ) : isReadOnly ? (
                    <div className="flex items-center justify-center gap-2 px-5 py-3.5 text-xs text-muted-foreground">
                        <Lock size={13}/> 다른 직원의 문의는 열람만 가능합니다.
                    </div>
                ) : (
                    <div className="flex items-end gap-2 px-4 py-3">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            disabled={sending}
                            onChange={(e) => {
                                setInput(e.target.value);
                                e.currentTarget.style.height = "auto";
                                e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 120) + "px";
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="메시지를 입력하세요... (Enter 전송 / Shift+Enter 줄바꿈)"
                            rows={1}
                            className="flex-1 resize-none border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors max-h-[120px] leading-relaxed disabled:opacity-60"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || sending}
                            className="w-10 h-10 flex items-center justify-center bg-primary hover:bg-primary/90 disabled:opacity-40 text-white rounded-xl transition-colors shrink-0"
                        >
                            {sending ? <Loader2 size={15} className="animate-spin"/> : <Send size={15}/>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export function Inquiry({ embedded = false }: InquiryProps) {
    // 로그인한 유저 정보 — zustand auth store에서 구독
    const user = useAuthStore((state) => state.user);
    const isAuthLoading = useAuthStore((state) => state.isLoading);

    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [allMessages, setAllMessages] = useState<Record<number, InquiryMessage[]>>({});
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);

    const [isLoadingList, setIsLoadingList] = useState(false);
    const [listError, setListError] = useState<string | null>(null);

    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [messagesError, setMessagesError] = useState<string | null>(null);

    const [isCreating, setIsCreating] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
    const [companies, setCompanies] = useState<CompanyResponse[]>([]);
    const [companyFilter, setCompanyFilter] = useState<number | "all">("all");

    const selectedInquiry = inquiries.find((i) => i.inquiryId === selectedId) ?? null;
    const currentMessages = selectedId ? (allMessages[selectedId] ?? []) : [];

    // ── 문의 목록 조회: GET /support/inquiries ──────────────────────────────
    const loadInquiries = useCallback(async () => {
        setIsLoadingList(true);
        setListError(null);
        try {
            const data = await getInquiries();
            setInquiries(data);
        } catch (e) {
            setListError(resolveErrorMessage(e, "문의 내역을 불러오지 못했습니다."));
        } finally {
            setIsLoadingList(false);
        }
    }, []);

    // PRESIDENT: 직원 목록 조회
    useEffect(() => {
        if (!user || user.role !== "PRESIDENT") return;
        getCompanyEmployees(user.companyId)
            .then(setEmployees)
            .catch((e) => console.error("직원 목록 조회 실패:", e));
    }, [user]);

    // ADMIN: 회사 목록 조회
    useEffect(() => {
        if (!user || user.role !== "ADMIN") return;
        getCompanies()
            .then(setCompanies)
            .catch((e) => console.error("회사 목록 조회 실패:", e));
    }, [user]);

    // ADMIN: 회사를 선택하면 그 회사 소속 직원 목록 조회 (드릴다운)
    useEffect(() => {
        if (!user || user.role !== "ADMIN") return;
        if (companyFilter === "all") {
            setEmployees([]);
            return;
        }
        getCompanyEmployees(companyFilter)
            .then(setEmployees)
            .catch((e) => console.error("직원 목록 조회 실패:", e));
    }, [user, companyFilter]);
    useEffect(() => {
        if (user) {
            loadInquiries();
        }
    }, [user, loadInquiries]);

    // ── 대화 메시지 조회: GET /support/inquiries/{id}/messages + 읽음 처리 ──
    const loadMessages = useCallback(async (inquiryId: number) => {
        setIsLoadingMessages(true);
        setMessagesError(null);
        try {
            const data = await getInquiryMessages(inquiryId);
            setAllMessages((prev) => ({...prev, [inquiryId]: data}));

            // 읽음 처리 — POST /support/inquiries/{id}/read
            setInquiries((prev) => {
                const targetInquiry = prev.find((i) => i.inquiryId === inquiryId);

                // 안 읽은 메시지가 있을 때만 백엔드에 호출
                if (targetInquiry && targetInquiry.unreadCount > 0) {
                    // 비동기로 호출하되 상태 업데이트 흐름을 방해하지 않음
                    readInquiryMessages(inquiryId).catch(console.error);
                }

                // 화면의 unreadCount를 0으로 카운트 초기화하여 반영
                return prev.map((i) =>
                    i.inquiryId === inquiryId ? {...i, unreadCount: 0} : i
                );
            });
        } catch (e) {
            setMessagesError(resolveErrorMessage(e, "대화 내용을 불러오지 못했습니다."));
        } finally {
            setIsLoadingMessages(false);
        }
    }, []);

    const handleSelect = (id: number) => {
        setSelectedId(id);
        loadMessages(id);
    };

    // 웹소켓 훅 — 서버에서 소켓으로 오는 메시지를 allMessages에 실시간 반영
    const handleSocketMessage = useCallback((msg: InquiryMessage) => {
        setAllMessages((prev) => {
            const currentRoomMessages = prev[msg.inquiryId] ?? [];
            const isDuplicate = currentRoomMessages.some(m => m.messageId === msg.messageId);
            if (isDuplicate) return prev;
            return {...prev, [msg.inquiryId]: [...currentRoomMessages, msg]};
        });
        setInquiries((prev) =>
            prev.map((i) => i.inquiryId === msg.inquiryId
                ? {...i, lastMessagePreview: msg.message, lastMessageAt: msg.createdAt}
                : i
            )
        );
    }, []);

    // ── 새 문의 생성: POST /support/inquiries ───────────────────────────────
    const handleCreate = async (category: CategoryKey, title: string) => {
        setIsCreating(true);
        try {
            const newInquiry = await createInquiry({category, title});
            setInquiries((prev) => [newInquiry, ...prev]);
            setSelectedId(newInquiry.inquiryId);
            setShowModal(false);
            // 생성 직후 시스템 메시지 등을 서버가 내려줄 수 있으므로 바로 조회
            await loadMessages(newInquiry.inquiryId);
        } catch (e) {
            setListError(resolveErrorMessage(e, "문의 생성에 실패했습니다."));
        } finally {
            setIsCreating(false);
        }
    };

    const {sendSocketMessage} = useInquirySocket(selectedId, handleSocketMessage);

    // ── 메시지 전송: POST /support/inquiries/{id}/messages ──────────────────
    // (웹소켓 연동 완료 시 이 부분을 socket publish로 교체)
    const handleSend = async (text: string) => {
        if (!selectedId) return;
        setIsSending(true);
        setMessagesError(null);
        try {
            // 1. 먼저 웹소켓 발행을 시도합니다.
            const isSentViaSocket = sendSocketMessage(text);

            // 2. 소켓 연결 실패 시에만 기존 HTTP API를 fallback으로 사용합니다.
            if (!isSentViaSocket) {
                const newMessage = await sendInquiryMessage(selectedId, text);
                setAllMessages((prev) => ({
                    ...prev,
                    [selectedId]: [...(prev[selectedId] ?? []), newMessage],
                }));
            }

            // 3. 메시지 전송 후 방 정보(상태, 담당자 등) 갱신을 위해 상세 데이터 동기화
            const refreshed = await getInquiryDetail(selectedId);
            setInquiries((prev) => prev.map((i) => i.inquiryId === selectedId ? refreshed : i));
        } catch (e) {
            setMessagesError(resolveErrorMessage(e, "메시지 전송에 실패했습니다."));
        } finally {
            setIsSending(false);
        }
    };

    // 앱 첫 로드 시 서버 인증 확인 중
    if (isAuthLoading) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-8 flex items-center justify-center" style={{height: 680}}>
                <Loader2 size={20} className="animate-spin text-muted-foreground/50"/>
            </div>
        );
    }

    // 비로그인 상태 — ProtectedLayout에서 대부분 걸러지지만 방어적으로 처리
    if (!user) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
                로그인이 필요한 페이지입니다.
            </div>
        );
    }

    // ⚠️ UserResponse의 실제 필드명이 다르면 여기만 맞춰주면 됩니다.
    const currentUser = {
        userId: user.userId,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* 2패널 레이아웃 */}
            <div className={ embedded
            ? "flex h-full w-full overflow-hidden"
            : "flex border border-border rounded-xl overflow-hidden bg-white shadow-sm"
            }
                 style={embedded ? undefined : { height: 680 }}>
                <div className="w-[300px] flex flex-col shrink-0">
                    <InquiryListPanel
                        inquiries={inquiries}
                        selectedId={selectedId}
                        viewerRole={currentUser.role}
                        currentUserId={currentUser.userId}
                        isLoading={isLoadingList}
                        error={listError}
                        employees={employees}
                        companies={companies}
                        companyFilter={companyFilter}
                        onCompanyFilterChange={setCompanyFilter}
                        onSelect={handleSelect}
                        onNew={() => setShowModal(true)}
                        onRetry={loadInquiries}
                    />
                </div>
                <ChatPanel
                    inquiry={selectedInquiry}
                    messages={currentMessages}
                    viewerRole={currentUser.role}
                    currentUserId={currentUser.userId}
                    isLoading={isLoadingMessages}
                    error={messagesError}
                    sending={isSending}
                    onSend={handleSend}
                    onRetry={() => selectedId && loadMessages(selectedId)}
                />
            </div>

            {showModal && (
                <NewInquiryModal
                    onClose={() => setShowModal(false)}
                    onCreate={handleCreate}
                    submitting={isCreating}
                />
            )}
        </div>
    );
}