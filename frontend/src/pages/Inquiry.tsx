import { useState, useRef, useEffect, type JSX } from "react";
import {
  Plus, Search, Send, X, Lock,
  CheckCircle, Clock, XCircle, MessageCircle,
  ShieldCheck, Users, Package, CreditCard,
  ShoppingBag, HelpCircle, User
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type InquiryStatus   = "OPEN" | "WAITING" | "ANSWERED" | "CLOSED";
type InquiryCategory = "ACCOUNT" | "ORDER" | "PRODUCT" | "PAYMENT" | "ETC";
type ViewerRole      = "EMPLOYEE" | "PRESIDENT";

interface Inquiry {
  inquiryId: number;
  companyId: number;
  createdByUserId: number;
  createdByUserName: string;
  category: InquiryCategory;
  title: string;
  status: InquiryStatus;
  assignedAdminName: string | null;
  lastMessageAt: string;
  lastMessagePreview: string;
  createdAt: string;
  closedAt: string | null;
  unread: boolean;
}

interface Message {
  messageId: number;
  inquiryId: number;
  senderId: number;
  senderName: string;
  senderType: "USER" | "ADMIN";
  message: string;
  createdAt: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<InquiryCategory, {
  label: string; icon: JSX.Element; color: string; bg: string; border: string;
}> = {
  ACCOUNT: {
    label: "계정",   icon: <User size={11} />,
    color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200",
  },
  ORDER: {
    label: "주문",   icon: <ShoppingBag size={11} />,
    color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200",
  },
  PRODUCT: {
    label: "상품",   icon: <Package size={11} />,
    color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200",
  },
  PAYMENT: {
    label: "결제",   icon: <CreditCard size={11} />,
    color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200",
  },
  ETC: {
    label: "기타",   icon: <HelpCircle size={11} />,
    color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200",
  },
};

const STATUS_META: Record<InquiryStatus, {
  label: string; icon: JSX.Element; color: string; bg: string; border: string;
}> = {
  OPEN:     {
    label: "접수",    icon: <MessageCircle size={11} />,
    color: "text-primary", bg: "bg-primary/5", border: "border-primary/20",
  },
  WAITING:  {
    label: "답변 대기", icon: <Clock size={11} />,
    color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200",
  },
  ANSWERED: {
    label: "답변 완료", icon: <CheckCircle size={11} />,
    color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200",
  },
  CLOSED:   {
    label: "종료",    icon: <XCircle size={11} />,
    color: "text-gray-500", bg: "bg-gray-100", border: "border-gray-200",
  },
};

// ── Mock data ─────────────────────────────────────────────────────────────────

// 현재 로그인 유저
const CURRENT_USER_ID = 1; // 홍길동 (대표)

const MOCK_INQUIRIES: Inquiry[] = [
  {
    inquiryId: 1, companyId: 1,
    createdByUserId: 1, createdByUserName: "홍길동",
    category: "ORDER", title: "ORD-2024-0841 배송 지연 문의",
    status: "ANSWERED", assignedAdminName: "김관리",
    lastMessageAt: "방금 전", lastMessagePreview: "운송장 번호는 CJ대한통운 1234567890입니다.",
    createdAt: "2024.06.10", closedAt: null, unread: true,
  },
  {
    inquiryId: 2, companyId: 1,
    createdByUserId: 1, createdByUserName: "홍길동",
    category: "ACCOUNT", title: "사업자등록증 재제출 관련",
    status: "CLOSED", assignedAdminName: "박관리",
    lastMessageAt: "3일 전", lastMessagePreview: "서류 확인되었습니다. 감사합니다.",
    createdAt: "2024.06.07", closedAt: "2024.06.08", unread: false,
  },
  {
    inquiryId: 3, companyId: 1,
    createdByUserId: 2, createdByUserName: "이영희",
    category: "PAYMENT", title: "5월 정산 내역 오류",
    status: "WAITING", assignedAdminName: null,
    lastMessageAt: "1시간 전", lastMessagePreview: "담당자 배정 후 빠르게 안내드리겠습니다.",
    createdAt: "2024.06.09", closedAt: null, unread: false,
  },
  {
    inquiryId: 4, companyId: 1,
    createdByUserId: 3, createdByUserName: "김철수",
    category: "PRODUCT", title: "상품 이미지 업로드 오류",
    status: "OPEN", assignedAdminName: null,
    lastMessageAt: "어제", lastMessagePreview: "안녕하세요, 상품 등록 시 이미지가 업로드가 안 됩니다.",
    createdAt: "2024.06.09", closedAt: null, unread: false,
  },
];

const MOCK_MESSAGES: Record<number, Message[]> = {
  1: [
    { messageId: 1,  inquiryId: 1, senderId: 1, senderName: "홍길동", senderType: "USER",
      message: "안녕하세요. ORD-2024-0841 주문 건 관련해서 문의드립니다. 배송이 예정일보다 3일 이상 지연되고 있는데 어떻게 된 건가요?",
      createdAt: "2024.06.10 09:12" },
    { messageId: 2,  inquiryId: 1, senderId: 99, senderName: "김관리", senderType: "ADMIN",
      message: "안녕하세요, 홍길동님! 불편을 드려서 정말 죄송합니다. 해당 주문을 바로 확인해 보겠습니다. 잠시만 기다려 주세요.",
      createdAt: "2024.06.10 09:15" },
    { messageId: 3,  inquiryId: 1, senderId: 99, senderName: "김관리", senderType: "ADMIN",
      message: "확인 결과, 출발지 물류센터에서 검수 지연이 발생했습니다. 금일 오후 출고 예정이며, 내일 오전 중 도착하실 것으로 예상됩니다. 다시 한번 불편을 드려서 죄송합니다.",
      createdAt: "2024.06.10 09:21" },
    { messageId: 4,  inquiryId: 1, senderId: 1, senderName: "홍길동", senderType: "USER",
      message: "네, 알겠습니다. 혹시 정확한 배송 추적이 가능할까요?",
      createdAt: "2024.06.10 09:24" },
    { messageId: 5,  inquiryId: 1, senderId: 99, senderName: "김관리", senderType: "ADMIN",
      message: "운송장 번호는 CJ대한통운 1234567890입니다. CJ대한통운 홈페이지에서 실시간 추적 가능하십니다.",
      createdAt: "2024.06.10 09:26" },
  ],
  2: [
    { messageId: 10, inquiryId: 2, senderId: 1, senderName: "홍길동", senderType: "USER",
      message: "사업자등록증 갱신 건으로 새 파일 재제출 드립니다. 검토 부탁드립니다.",
      createdAt: "2024.06.07 14:00" },
    { messageId: 11, inquiryId: 2, senderId: 99, senderName: "박관리", senderType: "ADMIN",
      message: "서류 접수되었습니다. 1~2 영업일 내 검토 후 안내드리겠습니다.",
      createdAt: "2024.06.07 14:35" },
    { messageId: 12, inquiryId: 2, senderId: 99, senderName: "박관리", senderType: "ADMIN",
      message: "서류 확인되었습니다. 정상 처리 완료되었으니 이용에 불편 없으시길 바랍니다. 감사합니다.",
      createdAt: "2024.06.08 10:10" },
  ],
  3: [
    { messageId: 20, inquiryId: 3, senderId: 2, senderName: "이영희", senderType: "USER",
      message: "안녕하세요. 5월 정산 내역을 확인하니 제가 계산한 금액과 128,000원 차이가 납니다. 확인 부탁드립니다.",
      createdAt: "2024.06.09 11:00" },
    { messageId: 21, inquiryId: 3, senderId: 99, senderName: "시스템", senderType: "ADMIN",
      message: "문의 접수되었습니다. 담당자 배정 후 빠르게 안내드리겠습니다. 잠시만 기다려 주세요.",
      createdAt: "2024.06.09 11:00" },
  ],
  4: [
    { messageId: 30, inquiryId: 4, senderId: 3, senderName: "김철수", senderType: "USER",
      message: "안녕하세요, 상품 등록 시 이미지가 업로드가 안 됩니다. 파일을 선택해도 아무런 반응이 없고 저장 시에도 이미지가 빠진 채로 저장됩니다. PNG, JPG 모두 시도해봤는데 동일합니다.",
      createdAt: "2024.06.09 15:30" },
  ],
};

const MOCK_EMPLOYEES = [
  { userId: 2, name: "이영희" },
  { userId: 3, name: "김철수" },
];

const AUTO_REPLIES = [
  "확인했습니다. 관련 내용 검토 후 빠르게 답변 드리겠습니다.",
  "감사합니다. 내용 확인 중입니다. 잠시만 기다려 주세요.",
  "네, 말씀하신 내용 파악했습니다. 확인 후 안내드리겠습니다.",
];

// ── Helper ────────────────────────────────────────────────────────────────────

function Avatar({
  name, size = "md", isAdmin = false,
}: {
  name: string; size?: "sm" | "md"; isAdmin?: boolean;
}) {
  const dim  = size === "sm" ? "w-7 h-7 text-[10px]" : "w-9 h-9 text-xs";
  const bg   = isAdmin ? "bg-foreground/10 text-foreground" : "bg-primary/10 text-primary";
  return (
    <div className={`${dim} ${bg} rounded-full font-bold flex items-center justify-center shrink-0`}>
      {name.slice(0, 2)}
    </div>
  );
}

function CategoryBadge({ category }: { category: InquiryCategory }) {
  const m = CATEGORY_META[category];
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${m.color} ${m.bg} ${m.border}`}>
      {m.icon}{m.label}
    </span>
  );
}

function StatusBadge({ status }: { status: InquiryStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${m.color} ${m.bg} ${m.border}`}>
      {m.icon}{m.label}
    </span>
  );
}

// ── New Inquiry Modal ─────────────────────────────────────────────────────────

function NewInquiryModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (category: InquiryCategory, title: string) => void;
}) {
  const [category, setCategory] = useState<InquiryCategory | null>(null);
  const [title, setTitle]       = useState("");

  const categories: { key: InquiryCategory; label: string; icon: JSX.Element; desc: string }[] = [
    { key: "ACCOUNT", label: "계정",   icon: <User size={16} />,         desc: "로그인, 회원정보, 권한" },
    { key: "ORDER",   label: "주문",   icon: <ShoppingBag size={16} />,  desc: "주문 조회, 취소, 배송" },
    { key: "PRODUCT", label: "상품",   icon: <Package size={16} />,      desc: "상품 등록, 수정, 오류" },
    { key: "PAYMENT", label: "결제",   icon: <CreditCard size={16} />,   desc: "결제, 정산, 세금계산서" },
    { key: "ETC",     label: "기타",   icon: <HelpCircle size={16} />,   desc: "그 외 모든 문의" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-bold text-foreground">새 문의 시작</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Category */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              문의 분야 선택
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {categories.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all ${
                    category === c.key
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-muted/30"
                  }`}
                >
                  <span className={`p-1.5 rounded ${category === c.key ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {c.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground">{c.label}</span>
                    <span className="block text-xs text-muted-foreground">{c.desc}</span>
                  </span>
                  {category === c.key && (
                    <CheckCircle size={14} className="text-primary ml-auto shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              제목
            </p>
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

        {/* Actions */}
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

// ── Inquiry List Panel ────────────────────────────────────────────────────────

function InquiryListPanel({
  inquiries, selectedId, viewerRole,
  onSelect, onNew,
}: {
  inquiries: Inquiry[];
  selectedId: number | null;
  viewerRole: ViewerRole;
  onSelect: (id: number) => void;
  onNew: () => void;
}) {
  const [search, setSearch]           = useState("");
  const [employeeFilter, setEmployeeFilter] = useState<number | "all">("all");

  // President: show all; Employee: only own
  const visible = inquiries.filter((inq) => {
    if (viewerRole === "EMPLOYEE" && inq.createdByUserId !== CURRENT_USER_ID) return false;
    if (viewerRole === "PRESIDENT" && employeeFilter !== "all" && inq.createdByUserId !== employeeFilter) return false;
    const q = search.trim().toLowerCase();
    return !q || inq.title.toLowerCase().includes(q) || inq.createdByUserName.includes(q);
  });

  return (
    <div className="flex flex-col h-full border-r border-border">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">문의 내역</h2>
          {viewerRole === "EMPLOYEE" && (
            <button
              onClick={onNew}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus size={13} /> 새 문의
            </button>
          )}
        </div>

        {/* President: employee filter */}
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
              onClick={() => setEmployeeFilter(CURRENT_USER_ID)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                employeeFilter === CURRENT_USER_ID
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

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="문의 검색"
            className="w-full pl-8 pr-3 py-2 text-xs border border-border rounded-lg outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center px-4">
            <MessageCircle size={24} className="text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">문의 내역이 없습니다.</p>
          </div>
        ) : (
          visible.map((inq) => {
            const isOwn     = inq.createdByUserId === CURRENT_USER_ID;
            const isSelected = selectedId === inq.inquiryId;
            const cat = CATEGORY_META[inq.category];

            return (
              <button
                key={inq.inquiryId}
                onClick={() => onSelect(inq.inquiryId)}
                className={`w-full text-left px-4 py-3.5 border-b border-border/50 transition-colors ${
                  isSelected ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/30"
                }`}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <CategoryBadge category={inq.category} />
                    {/* President: show whose inquiry */}
                    {viewerRole === "PRESIDENT" && !isOwn && (
                      <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                        {inq.createdByUserName}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {inq.unread && (
                      <span className="w-2 h-2 rounded-full bg-primary" />
                    )}
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {inq.lastMessageAt}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <p className={`text-xs font-semibold mb-1 truncate ${isSelected ? "text-primary" : "text-foreground"}`}>
                  {inq.title}
                </p>

                {/* Preview */}
                <p className="text-[11px] text-muted-foreground truncate">{inq.lastMessagePreview}</p>

                {/* Status */}
                <div className="mt-2">
                  <StatusBadge status={inq.status} />
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Chat Panel ────────────────────────────────────────────────────────────────

function ChatPanel({
  inquiry, messages, viewerRole,
  onSend,
}: {
  inquiry: Inquiry | null;
  messages: Message[];
  viewerRole: ViewerRole;
  onSend: (text: string) => void;
}) {
  const [input, setInput]       = useState("");
  const [typing, setTyping]     = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  if (!inquiry) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center mb-4">
          <MessageCircle size={28} className="text-muted-foreground/40" />
        </div>
        <p className="text-sm font-semibold text-muted-foreground">문의를 선택해 주세요</p>
        <p className="text-xs text-muted-foreground mt-1">왼쪽 목록에서 문의를 선택하면 대화 내용을 볼 수 있습니다.</p>
      </div>
    );
  }

  const isOwn    = inquiry.createdByUserId === CURRENT_USER_ID;
  const isClosed = inquiry.status === "CLOSED";
  // President viewing someone else's chat = read-only
  const isReadOnly = viewerRole === "PRESIDENT" && !isOwn;

  const handleSend = () => {
    const text = input.trim();
    if (!text || isClosed || isReadOnly) return;
    setInput("");
    onSend(text);
    // Simulate admin typing
    setTimeout(() => setTyping(true), 800);
    setTimeout(() => {
      setTyping(false);
      onSend("__admin__" + AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)]);
    }, 2800);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Chat header */}
      <div className="px-5 py-3.5 border-b border-border bg-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <CategoryBadge category={inquiry.category} />
              <StatusBadge status={inquiry.status} />
              {/* President: whose chat */}
              {viewerRole === "PRESIDENT" && !isOwn && (
                <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                  <Users size={11} /> {inquiry.createdByUserName} 님의 문의
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-foreground truncate">{inquiry.title}</h3>
          </div>
          {inquiry.assignedAdminName && (
            <div className="flex items-center gap-1.5 shrink-0 text-xs text-muted-foreground bg-muted/40 rounded-lg px-2.5 py-1.5 border border-border">
              <ShieldCheck size={12} className="text-primary/60" />
              {inquiry.assignedAdminName} 담당
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-muted/[0.03]">
        {messages.map((msg, idx) => {
          const isFromThreadOwner = msg.senderType === "USER";
          const isFromMe = isFromThreadOwner && isOwn;
          // For president viewing others': user msg = right side, admin = left side
          const alignRight = isOwn ? isFromThreadOwner : (viewerRole === "PRESIDENT" && isFromThreadOwner);

          // Date divider
          const prevMsg = messages[idx - 1];
          const showDate = !prevMsg || msg.createdAt.split(" ")[0] !== prevMsg.createdAt.split(" ")[0];

          return (
            <div key={msg.messageId}>
              {showDate && (
                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {msg.createdAt.split(" ")[0]}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}
              <div className={`flex items-end gap-2 ${alignRight ? "flex-row-reverse" : "flex-row"}`}>
                {/* Avatar */}
                {!alignRight && (
                  <Avatar
                    name={msg.senderName}
                    size="sm"
                    isAdmin={msg.senderType === "ADMIN"}
                  />
                )}

                <div className={`flex flex-col gap-1 max-w-[72%] ${alignRight ? "items-end" : "items-start"}`}>
                  {/* Sender name (only for admin or when president views others) */}
                  {(!alignRight || (viewerRole === "PRESIDENT" && !isOwn)) && (
                    <span className="text-[10px] font-semibold text-muted-foreground px-1">
                      {msg.senderType === "ADMIN" ? `🛡 ${msg.senderName}` : msg.senderName}
                    </span>
                  )}

                  {/* Bubble */}
                  <div className={`flex items-end gap-1.5 ${alignRight ? "flex-row-reverse" : ""}`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      alignRight
                        ? "bg-primary text-white rounded-br-md"
                        : msg.senderType === "ADMIN"
                          ? "bg-white border border-border text-foreground rounded-bl-md shadow-sm"
                          : "bg-amber-50 border border-amber-200 text-foreground rounded-bl-md"
                    }`}>
                      {msg.message}
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mb-0.5">
                      {msg.createdAt.split(" ")[1]}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Admin typing indicator */}
        {typing && (
          <div className="flex items-end gap-2">
            <Avatar name="관리" size="sm" isAdmin />
            <div className="bg-white border border-border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground mb-1">관리자 입력 중...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border bg-white">
        {isReadOnly ? (
          <div className="flex items-center justify-center gap-2 px-5 py-3.5 text-xs text-muted-foreground">
            <Lock size={13} />
            <span>직원 문의에는 메시지를 보낼 수 없습니다. 열람만 가능합니다.</span>
          </div>
        ) : isClosed ? (
          <div className="flex items-center justify-center gap-2 px-5 py-3.5 text-xs text-muted-foreground">
            <XCircle size={13} />
            <span>종료된 문의입니다. 새 문의를 열어 주세요.</span>
          </div>
        ) : (
          <div className="flex items-end gap-2 px-4 py-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
              placeholder="메시지를 입력하세요... (Enter로 전송, Shift+Enter로 줄바꿈)"
              rows={1}
              className="flex-1 resize-none border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors max-h-[120px] leading-relaxed"
              style={{ height: "auto" }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 120) + "px";
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-10 h-10 flex items-center justify-center bg-primary hover:bg-primary/90 disabled:opacity-40 text-white rounded-xl transition-colors shrink-0"
            >
              <Send size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────

export function Inquiry() {
  const [inquiries, setInquiries]   = useState<Inquiry[]>(MOCK_INQUIRIES);
  const [allMessages, setAllMessages] = useState<Record<number, Message[]>>(MOCK_MESSAGES);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showModal, setShowModal]   = useState(false);

  // Demo: toggle viewerRole to test both modes
  const [viewerRole, setViewerRole] = useState<ViewerRole>("PRESIDENT");

  const selectedInquiry = inquiries.find((i) => i.inquiryId === selectedId) ?? null;
  const currentMessages = selectedId ? (allMessages[selectedId] ?? []) : [];

  const handleSelect = (id: number) => {
    setSelectedId(id);
    // Mark as read
    setInquiries((prev) =>
      prev.map((i) => (i.inquiryId === id ? { ...i, unread: false } : i)),
    );
  };

  const handleCreate = (category: InquiryCategory, title: string) => {
    const newId = Date.now();
    const newInquiry: Inquiry = {
      inquiryId: newId, companyId: 1,
      createdByUserId: CURRENT_USER_ID, createdByUserName: "홍길동",
      category, title, status: "OPEN",
      assignedAdminName: null,
      lastMessageAt: "방금 전",
      lastMessagePreview: "문의가 접수되었습니다.",
      createdAt: new Date().toLocaleDateString("ko-KR"),
      closedAt: null, unread: false,
    };
    const systemMsg: Message = {
      messageId: Date.now() + 1, inquiryId: newId,
      senderId: 99, senderName: "시스템", senderType: "ADMIN",
      message: "문의가 접수되었습니다. 담당자 배정 후 빠르게 답변 드리겠습니다.",
      createdAt: new Date().toLocaleString("ko-KR", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit",
      }).replace(/\. /g, ".").replace("오전 ", "").replace("오후 ", ""),
    };
    setInquiries((prev) => [newInquiry, ...prev]);
    setAllMessages((prev) => ({ ...prev, [newId]: [systemMsg] }));
    setSelectedId(newId);
    setShowModal(false);
  };

  const handleSend = (text: string) => {
    if (!selectedId) return;
    const now = new Date().toLocaleString("ko-KR", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    }).replace(/\. /g, ".").replace("오전 ", "").replace("오후 ", "");

    if (text.startsWith("__admin__")) {
      // Auto-reply from admin
      const adminMsg: Message = {
        messageId: Date.now(), inquiryId: selectedId,
        senderId: 99, senderName: "김관리", senderType: "ADMIN",
        message: text.replace("__admin__", ""),
        createdAt: now,
      };
      setAllMessages((prev) => ({
        ...prev,
        [selectedId]: [...(prev[selectedId] ?? []), adminMsg],
      }));
      setInquiries((prev) =>
        prev.map((i) =>
          i.inquiryId === selectedId
            ? { ...i, status: "ANSWERED", assignedAdminName: "김관리", lastMessageAt: "방금 전", lastMessagePreview: adminMsg.message }
            : i,
        ),
      );
    } else {
      const userMsg: Message = {
        messageId: Date.now(), inquiryId: selectedId,
        senderId: CURRENT_USER_ID, senderName: "홍길동", senderType: "USER",
        message: text, createdAt: now,
      };
      setAllMessages((prev) => ({
        ...prev,
        [selectedId]: [...(prev[selectedId] ?? []), userMsg],
      }));
      setInquiries((prev) =>
        prev.map((i) =>
          i.inquiryId === selectedId
            ? { ...i, status: "WAITING", lastMessageAt: "방금 전", lastMessagePreview: text }
            : i,
        ),
      );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">1:1 문의</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            관리자와 실시간으로 문의하고 답변을 받아보세요.
          </p>
        </div>

        {/* Demo role toggle */}
        <div className="flex items-center gap-2 bg-muted/40 border border-border rounded-lg p-1">
          <button
            onClick={() => { setViewerRole("EMPLOYEE"); setSelectedId(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              viewerRole === "EMPLOYEE"
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User size={12} /> 직원 보기
          </button>
          <button
            onClick={() => { setViewerRole("PRESIDENT"); setSelectedId(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              viewerRole === "PRESIDENT"
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users size={12} /> 대표 보기
          </button>
        </div>
      </div>

      {/* Two-panel chat layout */}
      <div className="flex border border-border rounded-xl overflow-hidden bg-white shadow-sm"
           style={{ height: "680px" }}>

        {/* Left: inquiry list */}
        <div className="w-[300px] flex flex-col shrink-0">
          <InquiryListPanel
            inquiries={inquiries}
            selectedId={selectedId}
            viewerRole={viewerRole}
            onSelect={handleSelect}
            onNew={() => setShowModal(true)}
          />
        </div>

        {/* Right: chat */}
        <ChatPanel
          inquiry={selectedInquiry}
          messages={currentMessages}
          viewerRole={viewerRole}
          onSend={handleSend}
        />
      </div>

      {/* New inquiry modal */}
      {showModal && (
        <NewInquiryModal onClose={() => setShowModal(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}
