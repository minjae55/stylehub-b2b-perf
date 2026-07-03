/**
 * Inquiry.tsx
 * 1:1 문의 채팅 페이지
 *
 * 권한별 접근 범위
 *   ADMIN     → 전체 회사의 모든 문의 조회 + 답변 가능
 *   PRESIDENT → 자기 회사 소속 전체 문의 조회 (본인 + 직원) + 본인 문의만 메시지 전송
 *   EMPLOYEE  → 본인이 생성한 문의만 조회 + 메시지 전송
 *
 * 웹소켓 연동
 *   useInquirySocket 훅으로 분리 — 백엔드 구현 완료 시 TODO 주석 교체
 *   현재는 mock 자동답변으로 동작
 *
 * 백엔드 엔티티 매핑
 *   Inquiry          → inquiries 테이블
 *   InquiryMessage   → inquiry_messages 테이블 (senderType 없음 — role로 판단)
 *   InquiryMessageRead → inquiry_message_reads 테이블 (unread 계산 기준)
 */

import {type JSX, useEffect, useRef, useState} from "react";
import {
  CheckCircle,
  Clock,
  CreditCard,
  HelpCircle,
  Lock,
  MessageCircle,
  Package,
  Plus,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  User,
  Users,
  X,
  XCircle,
} from "lucide-react";

// ── 타입 ──────────────────────────────────────────────────────────────────────
// 백엔드 UserRole enum과 1:1 매핑

type UserRole = "ADMIN" | "PRESIDENT" | "EMPLOYEE";
type InquiryStatus = "OPEN" | "WAITING" | "ANSWERED" | "CLOSED";

// 백엔드 Inquiry 엔티티 기반 (DTO 응답 형태)
interface Inquiry {
    inquiryId: number;
    companyId: number;
    createdByUserId: number;
    createdByUserName: string;
    createdByUserRole: UserRole;        // 버블 방향 판단용
    category: string;          // 엔티티가 String — "ACCOUNT" | "ORDER" | "PRODUCT" | "PAYMENT" | "ETC"
    title: string;
    status: InquiryStatus;
    assignedAdminName: string | null;
    lastMessageAt: string | null;   // ISO string, DTO에서 포맷
    lastMessagePreview: string | null;   // DTO에서 추가 (엔티티에 없음 — 별도 쿼리)
    createdAt: string;
    closedAt: string | null;
    unreadCount: number;          // InquiryMessageRead 기준으로 백엔드가 계산
}

// 백엔드 InquiryMessage 엔티티 기반
interface InquiryMessage {
    messageId: number;
    inquiryId: number;
    senderId: number;
    senderName: string;
    senderRole: UserRole;    // ADMIN이면 관리자 버블, 아니면 유저 버블
    message: string;
    createdAt: string;
}

// ── 카테고리/상태 메타데이터 ──────────────────────────────────────────────────

type CategoryKey = "ACCOUNT" | "ORDER" | "PRODUCT" | "PAYMENT" | "ETC";

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
// 백엔드 웹소켓 구현 완료 시 아래 TODO 주석 교체

function useInquirySocket(
    inquiryId: number | null,
    onMessage: (msg: InquiryMessage) => void,
) {
    useEffect(() => {
        if (!inquiryId) return;

        // TODO: 웹소켓 연결
        // const client = new Client({
        //     brokerURL: "ws://localhost:8080/ws",           // TODO: 백엔드 웹소켓 엔드포인트
        //     onConnect: () => {
        //         // TODO: 구독 경로 확정 후 교체
        //         client.subscribe(`/topic/inquiry/${inquiryId}`, (frame) => {
        //             const msg: InquiryMessage = JSON.parse(frame.body);
        //             onMessage(msg);
        //         });
        //     },
        // });
        // client.activate();
        // return () => { client.deactivate(); };
    }, [inquiryId]);

    const sendMessage = (text: string) => {
        // TODO: 웹소켓 발행
        // client.publish({
        //     destination: `/app/inquiry/${inquiryId}/message`,  // TODO: 발행 경로 확정 후 교체
        //     body: JSON.stringify({ message: text }),
        // });
    };

    return {sendMessage};
}

// ── Mock 데이터 ───────────────────────────────────────────────────────────────

const MOCK_CURRENT_USER = {userId: 1, name: "홍길동", role: "PRESIDENT" as UserRole, companyId: 1};

const MOCK_INQUIRIES: Inquiry[] = [
    {
        inquiryId: 1, companyId: 1,
        createdByUserId: 1, createdByUserName: "홍길동", createdByUserRole: "PRESIDENT",
        category: "ORDER", title: "ORD-2024-0841 배송 지연 문의",
        status: "ANSWERED", assignedAdminName: "김관리",
        lastMessageAt: "방금 전", lastMessagePreview: "운송장 번호는 CJ대한통운 1234567890입니다.",
        createdAt: "2024.06.10", closedAt: null, unreadCount: 1,
    },
    {
        inquiryId: 2, companyId: 1,
        createdByUserId: 1, createdByUserName: "홍길동", createdByUserRole: "PRESIDENT",
        category: "ACCOUNT", title: "사업자등록증 재제출 관련",
        status: "CLOSED", assignedAdminName: "박관리",
        lastMessageAt: "3일 전", lastMessagePreview: "서류 확인되었습니다. 감사합니다.",
        createdAt: "2024.06.07", closedAt: "2024.06.08", unreadCount: 0,
    },
    {
        inquiryId: 3, companyId: 1,
        createdByUserId: 2, createdByUserName: "이영희", createdByUserRole: "EMPLOYEE",
        category: "PAYMENT", title: "5월 정산 내역 오류",
        status: "WAITING", assignedAdminName: null,
        lastMessageAt: "1시간 전", lastMessagePreview: "담당자 배정 후 빠르게 안내드리겠습니다.",
        createdAt: "2024.06.09", closedAt: null, unreadCount: 0,
    },
    {
        inquiryId: 4, companyId: 1,
        createdByUserId: 3, createdByUserName: "김철수", createdByUserRole: "EMPLOYEE",
        category: "PRODUCT", title: "상품 이미지 업로드 오류",
        status: "OPEN", assignedAdminName: null,
        lastMessageAt: "어제", lastMessagePreview: "안녕하세요, 이미지 업로드가 안 됩니다.",
        createdAt: "2024.06.09", closedAt: null, unreadCount: 0,
    },
];

const MOCK_MESSAGES: Record<number, InquiryMessage[]> = {
    1: [
        {
            messageId: 1, inquiryId: 1, senderId: 1, senderName: "홍길동", senderRole: "PRESIDENT",
            message: "안녕하세요. ORD-2024-0841 주문 건 배송이 3일 이상 지연되고 있는데 어떻게 된 건가요?",
            createdAt: "2024.06.10 09:12"
        },
        {
            messageId: 2, inquiryId: 1, senderId: 99, senderName: "김관리", senderRole: "ADMIN",
            message: "불편을 드려서 죄송합니다. 해당 주문 바로 확인해 보겠습니다.",
            createdAt: "2024.06.10 09:15"
        },
        {
            messageId: 3, inquiryId: 1, senderId: 99, senderName: "김관리", senderRole: "ADMIN",
            message: "확인 결과 출발지 물류센터에서 검수 지연이 발생했습니다. 금일 오후 출고 예정입니다.",
            createdAt: "2024.06.10 09:21"
        },
        {
            messageId: 4, inquiryId: 1, senderId: 1, senderName: "홍길동", senderRole: "PRESIDENT",
            message: "혹시 정확한 배송 추적이 가능할까요?",
            createdAt: "2024.06.10 09:24"
        },
        {
            messageId: 5, inquiryId: 1, senderId: 99, senderName: "김관리", senderRole: "ADMIN",
            message: "운송장 번호는 CJ대한통운 1234567890입니다. 홈페이지에서 실시간 추적 가능하십니다.",
            createdAt: "2024.06.10 09:26"
        },
    ],
    2: [
        {
            messageId: 10, inquiryId: 2, senderId: 1, senderName: "홍길동", senderRole: "PRESIDENT",
            message: "사업자등록증 갱신 건으로 새 파일 재제출 드립니다.",
            createdAt: "2024.06.07 14:00"
        },
        {
            messageId: 11, inquiryId: 2, senderId: 99, senderName: "박관리", senderRole: "ADMIN",
            message: "서류 접수되었습니다. 1~2 영업일 내 검토 후 안내드리겠습니다.",
            createdAt: "2024.06.07 14:35"
        },
        {
            messageId: 12, inquiryId: 2, senderId: 99, senderName: "박관리", senderRole: "ADMIN",
            message: "서류 확인되었습니다. 정상 처리 완료되었습니다. 감사합니다.",
            createdAt: "2024.06.08 10:10"
        },
    ],
    3: [
        {
            messageId: 20, inquiryId: 3, senderId: 2, senderName: "이영희", senderRole: "EMPLOYEE",
            message: "5월 정산 내역을 확인하니 계산한 금액과 128,000원 차이가 납니다.",
            createdAt: "2024.06.09 11:00"
        },
        {
            messageId: 21, inquiryId: 3, senderId: 99, senderName: "시스템", senderRole: "ADMIN",
            message: "문의 접수되었습니다. 담당자 배정 후 빠르게 안내드리겠습니다.",
            createdAt: "2024.06.09 11:00"
        },
    ],
    4: [
        {
            messageId: 30, inquiryId: 4, senderId: 3, senderName: "김철수", senderRole: "EMPLOYEE",
            message: "상품 등록 시 이미지가 업로드가 안 됩니다. PNG, JPG 모두 시도해봤는데 동일합니다.",
            createdAt: "2024.06.09 15:30"
        },
    ],
};

const AUTO_REPLIES = [
    "확인했습니다. 관련 내용 검토 후 빠르게 답변드리겠습니다.",
    "감사합니다. 내용 파악했습니다. 확인 후 안내드리겠습니다.",
    "네, 말씀하신 내용 확인 중입니다. 잠시만 기다려 주세요.",
];

const MOCK_EMPLOYEES = [
    {userId: 2, name: "이영희"},
    {userId: 3, name: "김철수"},
];

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

// ── 새 문의 모달 ──────────────────────────────────────────────────────────────

function NewInquiryModal({onClose, onCreate}: {
    onClose: () => void;
    onCreate: (category: string, title: string) => void;
}) {
    const [category, setCategory] = useState<CategoryKey | null>(null);
    const [title, setTitle] = useState("");

    const options: { key: CategoryKey; label: string; icon: JSX.Element; desc: string }[] = [
        {key: "ACCOUNT", label: "계정", icon: <User size={16}/>, desc: "로그인, 회원정보, 권한"},
        {key: "ORDER", label: "주문", icon: <ShoppingBag size={16}/>, desc: "주문 조회, 취소, 배송"},
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
                        className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={() => category && title.trim() && onCreate(category, title.trim())}
                        disabled={!category || !title.trim()}
                        className="flex-1 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-40 text-white rounded-lg text-sm font-semibold transition-colors"
                    >
                        문의 시작
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── 문의 목록 패널 ────────────────────────────────────────────────────────────

function InquiryListPanel({inquiries, selectedId, viewerRole, currentUserId, onSelect, onNew}: {
    inquiries: Inquiry[];
    selectedId: number | null;
    viewerRole: UserRole;
    currentUserId: number;
    onSelect: (id: number) => void;
    onNew: () => void;
}) {
    const [search, setSearch] = useState("");
    const [employeeFilter, setEmployeeFilter] = useState<number | "all">("all");

    // 권한별 필터링
    const visible = inquiries.filter((inq) => {
        // EMPLOYEE: 본인 것만
        if (viewerRole === "EMPLOYEE" && inq.createdByUserId !== currentUserId) return false;
        // PRESIDENT: 직원 필터 적용
        if (viewerRole === "PRESIDENT" && employeeFilter !== "all" && inq.createdByUserId !== employeeFilter) return false;
        // 검색
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
                        {MOCK_EMPLOYEES.map((emp) => (
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

                {/* ADMIN: 회사별 필터 자리 (TODO) */}
                {viewerRole === "ADMIN" && (
                    <div className="text-[11px] text-muted-foreground bg-muted/40 rounded-lg px-3 py-1.5">
                        {/* TODO: 회사 필터 드롭다운 */}
                        전체 회사 문의 조회 중
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
                {visible.length === 0 ? (
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
                                        {/* PRESIDENT/ADMIN: 작성자 표시 */}
                                        {(viewerRole === "PRESIDENT" || viewerRole === "ADMIN") && !isOwn && (
                                            <span
                                                className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                                {inq.createdByUserName}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {/* 읽지 않은 메시지 — InquiryMessageRead 기반 */}
                                        {inq.unreadCount > 0 && (
                                            <span
                                                className="min-w-[18px] h-[18px] rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center px-1">
                                                {inq.unreadCount > 9 ? "9+" : inq.unreadCount}
                                            </span>
                                        )}
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                            {inq.lastMessageAt ?? inq.createdAt}
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

function ChatPanel({inquiry, messages, viewerRole, currentUserId, onSend}: {
    inquiry: Inquiry | null;
    messages: InquiryMessage[];
    viewerRole: UserRole;
    currentUserId: number;
    onSend: (text: string) => void;
}) {
    const [input, setInput] = useState("");
    const [typing, setTyping] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({behavior: "smooth"});
    }, [messages, typing]);

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
    const isReadOnly = !isClosed && !canSend; // 읽기 전용 상태

    const handleSend = () => {
        const text = input.trim();
        if (!text || !canSend) return;
        setInput("");
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
        onSend(text);
        // mock: 관리자 자동 답변 (웹소켓 연동 후 제거)
        if (viewerRole !== "ADMIN") {
            setTimeout(() => setTyping(true), 800);
            setTimeout(() => {
                setTyping(false);
                onSend("__admin__" + AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)]);
            }, 2800);
        }
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
                            {/* PRESIDENT/ADMIN: 작성자가 다른 사람이면 표시 */}
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
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-muted/[0.03]">
                {messages.map((msg, idx) => {
                    const isAdminMsg = msg.senderRole === "ADMIN";
                    const isMineMsg = msg.senderId === currentUserId;

                    // 버블 방향 결정
                    // - ADMIN이 보는 경우: 유저 메시지=왼쪽, 관리자(본인)=오른쪽
                    // - PRESIDENT/EMPLOYEE: 본인=오른쪽, 관리자=왼쪽, 다른 유저=왼쪽(amber)
                    const alignRight = viewerRole === "ADMIN" ? isAdminMsg : isMineMsg;

                    // 날짜 구분선
                    const prevMsg = messages[idx - 1];
                    const showDate = !prevMsg || msg.createdAt.split(" ")[0] !== prevMsg.createdAt.split(" ")[0];

                    return (
                        <div key={msg.messageId}>
                            {showDate && (
                                <div className="flex items-center gap-3 my-2">
                                    <div className="flex-1 h-px bg-border"/>
                                    <span className="text-[11px] text-muted-foreground font-medium">
                                        {msg.createdAt.split(" ")[0]}
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
                                    {/* 발신자 이름 — 오른쪽 버블엔 표시 안 함 */}
                                    {!alignRight && (
                                        <span className="text-[10px] font-semibold text-muted-foreground px-1">
                                            {isAdminMsg ? `🛡 ${msg.senderName}` : msg.senderName}
                                        </span>
                                    )}

                                    <div className={`flex items-end gap-1.5 ${alignRight ? "flex-row-reverse" : ""}`}>
                                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                            alignRight
                                                ? "bg-primary text-white rounded-br-md"
                                                : isAdminMsg
                                                    ? "bg-white border border-border text-foreground rounded-bl-md shadow-sm"
                                                    : "bg-amber-50 border border-amber-200 text-foreground rounded-bl-md"
                                        }`}>
                                            {msg.message}
                                        </div>
                                        <span
                                            className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mb-0.5">
                                            {msg.createdAt.split(" ")[1]}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* 관리자 입력 중 표시 (mock — 웹소켓 연동 후 실제 타이핑 이벤트로 교체) */}
                {typing && (
                    <div className="flex items-end gap-2">
                        <Avatar name="관리" isAdmin size="sm"/>
                        <div className="bg-white border border-border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                            <div className="flex gap-1 items-center">
                                {[0, 150, 300].map((delay) => (
                                    <div key={delay}
                                         className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce"
                                         style={{animationDelay: `${delay}ms`}}/>
                                ))}
                            </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground mb-1">관리자 입력 중...</span>
                    </div>
                )}
                <div ref={bottomRef}/>
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
                            className="flex-1 resize-none border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors max-h-[120px] leading-relaxed"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="w-10 h-10 flex items-center justify-center bg-primary hover:bg-primary/90 disabled:opacity-40 text-white rounded-xl transition-colors shrink-0"
                        >
                            <Send size={15}/>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export function Inquiry() {
    // TODO: useAuthStore에서 실제 유저 정보로 교체
    // const { user } = useAuthStore();
    // const currentUser = { userId: user.userId, name: user.name, role: user.role as UserRole, companyId: user.companyId };
    const currentUser = MOCK_CURRENT_USER;

    const [inquiries, setInquiries] = useState<Inquiry[]>(MOCK_INQUIRIES);
    const [allMessages, setAllMessages] = useState<Record<number, InquiryMessage[]>>(MOCK_MESSAGES);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);

    // 데모용 role 토글 (실제에선 제거)
    const [demoRole, setDemoRole] = useState<UserRole>(currentUser.role);

    const selectedInquiry = inquiries.find((i) => i.inquiryId === selectedId) ?? null;
    const currentMessages = selectedId ? (allMessages[selectedId] ?? []) : [];

    // 웹소켓 훅 — 연결 후 서버에서 오는 메시지를 allMessages에 추가
    useInquirySocket(selectedId, (msg) => {
        setAllMessages((prev) => ({
            ...prev,
            [msg.inquiryId]: [...(prev[msg.inquiryId] ?? []), msg],
        }));
    });

    const handleSelect = (id: number) => {
        setSelectedId(id);
        // 읽음 처리 — TODO: POST /api/inquiries/{id}/read
        setInquiries((prev) =>
            prev.map((i) => i.inquiryId === id ? {...i, unreadCount: 0} : i),
        );
    };

    const handleCreate = (category: string, title: string) => {
        // TODO: POST /api/inquiries { category, title }
        const newId = Date.now();
        const newInquiry: Inquiry = {
            inquiryId: newId, companyId: currentUser.companyId,
            createdByUserId: currentUser.userId,
            createdByUserName: currentUser.name,
            createdByUserRole: demoRole,
            category, title,
            status: "OPEN", assignedAdminName: null,
            lastMessageAt: "방금 전",
            lastMessagePreview: "문의가 접수되었습니다.",
            createdAt: new Date().toLocaleDateString("ko-KR"),
            closedAt: null, unreadCount: 0,
        };
        const systemMsg: InquiryMessage = {
            messageId: Date.now() + 1, inquiryId: newId,
            senderId: 99, senderName: "시스템", senderRole: "ADMIN",
            message: "문의가 접수되었습니다. 담당자 배정 후 빠르게 답변드리겠습니다.",
            createdAt: new Date().toLocaleString("ko-KR"),
        };
        setInquiries((prev) => [newInquiry, ...prev]);
        setAllMessages((prev) => ({...prev, [newId]: [systemMsg]}));
        setSelectedId(newId);
        setShowModal(false);
    };

    const handleSend = (text: string) => {
        if (!selectedId) return;
        const now = new Date().toLocaleString("ko-KR");

        if (text.startsWith("__admin__")) {
            // mock 자동답변 (웹소켓 연동 후 제거)
            const adminMsg: InquiryMessage = {
                messageId: Date.now(), inquiryId: selectedId,
                senderId: 99, senderName: "김관리", senderRole: "ADMIN",
                message: text.replace("__admin__", ""),
                createdAt: now,
            };
            setAllMessages((prev) => ({
                ...prev,
                [selectedId]: [...(prev[selectedId] ?? []), adminMsg],
            }));
            setInquiries((prev) => prev.map((i) =>
                i.inquiryId === selectedId
                    ? {
                        ...i,
                        status: "ANSWERED",
                        assignedAdminName: "김관리",
                        lastMessageAt: "방금 전",
                        lastMessagePreview: adminMsg.message
                    }
                    : i,
            ));
        } else {
            // TODO: 웹소켓 연동 시 POST가 아닌 소켓 발행으로 교체
            // TODO: POST /api/inquiries/{selectedId}/messages { message: text }
            const userMsg: InquiryMessage = {
                messageId: Date.now(), inquiryId: selectedId,
                senderId: currentUser.userId, senderName: currentUser.name,
                senderRole: demoRole,
                message: text, createdAt: now,
            };
            setAllMessages((prev) => ({
                ...prev,
                [selectedId]: [...(prev[selectedId] ?? []), userMsg],
            }));
            setInquiries((prev) => prev.map((i) =>
                i.inquiryId === selectedId
                    ? {...i, status: "WAITING", lastMessageAt: "방금 전", lastMessagePreview: text}
                    : i,
            ));
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* 페이지 헤더 */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">1:1 문의</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        관리자와 실시간으로 문의하고 답변을 받아보세요.
                    </p>
                </div>

                {/* 데모용 role 토글 — 실제 배포 시 제거 */}
                <div className="flex items-center gap-2 bg-muted/40 border border-border rounded-lg p-1">
                    {(["EMPLOYEE", "PRESIDENT", "ADMIN"] as UserRole[]).map((r) => (
                        <button
                            key={r}
                            onClick={() => {
                                setDemoRole(r);
                                setSelectedId(null);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                                demoRole === r
                                    ? "bg-white shadow-sm text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {r === "ADMIN" ? <ShieldCheck size={12}/> : r === "PRESIDENT" ? <Users size={12}/> :
                                <User size={12}/>}
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            {/* 2패널 레이아웃 */}
            <div className="flex border border-border rounded-xl overflow-hidden bg-white shadow-sm"
                 style={{height: 680}}>
                <div className="w-[300px] flex flex-col shrink-0">
                    <InquiryListPanel
                        inquiries={inquiries}
                        selectedId={selectedId}
                        viewerRole={demoRole}
                        currentUserId={currentUser.userId}
                        onSelect={handleSelect}
                        onNew={() => setShowModal(true)}
                    />
                </div>
                <ChatPanel
                    inquiry={selectedInquiry}
                    messages={currentMessages}
                    viewerRole={demoRole}
                    currentUserId={currentUser.userId}
                    onSend={handleSend}
                />
            </div>

            {showModal && (
                <NewInquiryModal onClose={() => setShowModal(false)} onCreate={handleCreate}/>
            )}
        </div>
    );
}