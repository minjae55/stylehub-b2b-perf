import { useState } from "react";
import { Link } from "react-router";
import {
  User, ShoppingBag, MessageSquare, MapPin, Settings, AlertTriangle,
  ChevronRight, Package, FileText, Send, Clock, CheckCircle, Star, Eye, Truck,
  Copy, X, Plane, Ship, Weight, Ruler, RefreshCw, XCircle, CreditCard,
  Download, Printer, FileCheck, AlertCircle, Filter, Search, Calendar,
} from "lucide-react";

type UserRole = "buyer" | "seller";
type Tab = "orders" | "sourcing" | "quotes" | "shipping" | "inquiry" | "profile" | "address" | "shipping-quotes";

const myOrders = [
  { id: "TKR-2024-0841", date: "2024.03.18", status: "배송 중", items: 1, total: 12000 },
  { id: "TKR-2024-0820", date: "2024.03.10", status: "결제 완료", items: 2, total: 20500 },
  { id: "TKR-2024-0807", date: "2024.02.28", status: "주문 확인", items: 1, total: 7500 },
];

// 결제 완료된 주문 (배송 대기 중)
const shippingOrders = [
  {
    id: "ORD-2024-KR-0524",
    date: "2024.03.21",
    buyer: "글로벌뷰티㈜",
    seller: "코스메틱랩",
    product: "비타민C 세럼 30mL",
    quantity: "2,000개",
    total: 23000,
    destination: "미국, 뉴욕",
    hasQuote: false,
  },
  {
    id: "ORD-2024-KR-0518",
    date: "2024.03.18",
    buyer: "KBeauty USA Inc",
    seller: "뷰티팩토리",
    product: "시트 마스크 세트",
    quantity: "10,000개",
    total: 25000,
    destination: "캐나다, 토론토",
    hasQuote: true,
  },
  {
    id: "ORD-2024-KR-0501",
    date: "2024.03.15",
    buyer: "뷰티월드",
    seller: "메이크업프로",
    product: "쿠션 파운데이션",
    quantity: "2,500개",
    total: 35000,
    destination: "일본, 도쿄",
    hasQuote: false,
  },
];

const myInquiries = [
  { id: 1, date: "2024.03.20", title: "배송 일정 문의", status: "답변완료", reply: "3월 23일 도착 예정입니다." },
  { id: 2, date: "2024.03.15", title: "견적서 관련 문의", status: "답변완료", reply: "견적서가 발송되었습니다." },
  { id: 3, date: "2024.03.10", title: "제품 상세 스펙 요청", status: "대기중", reply: null },
];

const myAddresses = [
  { id: 1, name: "회사 (기본)", recipient: "홍길동", phone: "010-1234-5678", address: "서울특별시 강남구 테헤란로 123", detail: "A동 5층", isDefault: true },
  { id: 2, name: "창고", recipient: "김철수", phone: "010-9876-5432", address: "인천광역시 중구 공항로 456", detail: "물류센터 B동", isDefault: false },
];

// 바이어 소싱 요청 내역
const buyerSourcingRequests = [
  {
    id: "SRC-2024-0124",
    date: "2024.03.21",
    product: "비타민C 세럼 30mL OEM",
    quantity: "2,000개",
    budget: "$15,000~$20,000",
    status: "신규" as const,
    quoteReceived: false,
  },
  {
    id: "SRC-2024-0118",
    date: "2024.03.18",
    product: "시트 마스크 (콜라겐/히알루론산)",
    quantity: "10,000개",
    budget: "$25,000",
    status: "견적발송" as const,
    quoteReceived: true,
    quote: {
      id: "QUO-2024-0048",
      supplier: "메디힐㈜",
      unitPrice: "$2.3",
      total: "$23,000",
      validUntil: "2024.04.10",
      notes: "FDA 등록 완료, 납기 3주 소요",
    },
  },
  {
    id: "SRC-2024-0112",
    date: "2024.03.15",
    product: "쿠션 파운데이션 5종 (색상별)",
    quantity: "2,500개",
    budget: "$30,000~$40,000",
    status: "검토중" as const,
    quoteReceived: false,
  },
];

// 셀러 수신 소싱 요청 + 내 견적서
const sellerSourcingRequests = [
  {
    id: "SRC-2024-0118",
    date: "2024.03.18",
    buyer: "KBeauty USA Inc",
    product: "시트 마스크 (콜라겐/히알루론산)",
    quantity: "10,000개",
    budget: "$25,000",
    status: "진행중",
    quoteSent: true,
    myQuote: { id: "QUO-2024-0048", unitPrice: "$2.3", total: "$23,000", sentAt: "2024.03.19", status: "검토중" },
  },
  {
    id: "SRC-2024-0112",
    date: "2024.03.15",
    buyer: "뷰티월드",
    product: "쿠션 파운데이션 5종 (색상별)",
    quantity: "2,500개",
    budget: "$30,000~$40,000",
    status: "신규",
    quoteSent: false,
    myQuote: null,
  },
];

const statusStyle: Record<string, string> = {
  "신규": "bg-blue-50 border-blue-200 text-blue-700",
  "검토중": "bg-purple-50 border-purple-200 text-purple-700",
  "견적발송": "bg-green-50 border-green-200 text-green-700",
  "완료": "bg-muted border-border text-muted-foreground",
  "취소": "bg-red-50 border-red-200 text-red-700",
  "진행중": "bg-blue-50 border-blue-200 text-blue-700",
};

const buyerShippingQuotesList = [
  {
    id: "SHQ-2024-0524",
    orderId: "ORD-2024-KR-0524",
    quoteNumber: "QT-20240322-001",
    issueDate: "2024.03.22",
    validUntil: "2024.04.22",
    seller: "코스메틱랩",
    product: "비타민C 세럼 30mL",
    quantity: "2,000개",
    destination: "미국, 뉴욕",
    receivedAt: "2024.03.22",
    status: "검토중" as const,
    warehouseCode: "WH-KR-001",
    actualWeight: "45.5",
    boxDimensions: { width: "60", height: "40", depth: "35" },
    volumeWeight: "16.8",
    incoterms: "FOB",
    origin: "인천항 (ICN)",
    remarks: "화장품 FDA 등록 완료, HS Code 3304.99 적용",
    options: [
      {
        type: "항공 배송",
        method: "Air Freight",
        time: "3–5일",
        carrier: "Korean Air Cargo",
        freightCost: 2100,
        customsCost: 180,
        insurance: 80,
        handling: 40,
        total: 2400,
        icon: "air",
        incoterms: "CIF",
      },
      {
        type: "해상 배송 (LCL)",
        method: "Sea Freight LCL",
        time: "18–25일",
        carrier: "Maersk Line",
        freightCost: 620,
        customsCost: 120,
        insurance: 50,
        handling: 30,
        total: 820,
        icon: "sea",
        incoterms: "FOB",
      },
      {
        type: "특송 (DHL)",
        method: "Express Courier",
        time: "2–3일",
        carrier: "DHL Express",
        freightCost: 3400,
        customsCost: 250,
        insurance: 100,
        handling: 50,
        total: 3800,
        icon: "express",
        incoterms: "DDP",
      },
    ],
  },
  {
    id: "SHQ-2024-0518",
    orderId: "ORD-2024-KR-0518",
    quoteNumber: "QT-20240320-002",
    issueDate: "2024.03.20",
    validUntil: "2024.04.20",
    seller: "뷰티팩토리",
    product: "시트 마스크 세트",
    quantity: "10,000개",
    destination: "캐나다, 토론토",
    receivedAt: "2024.03.20",
    status: "승인완료" as const,
    warehouseCode: "WH-KR-002",
    actualWeight: "125.0",
    boxDimensions: { width: "80", height: "60", depth: "50" },
    volumeWeight: "48.0",
    selectedOption: 1,
    confirmedAt: "2024.03.21",
    incoterms: "FOB",
    origin: "부산항 (PUS)",
    remarks: "컨테이너 혼적 가능, 온도 관리 필요 없음",
    options: [
      {
        type: "항공 배송",
        method: "Air Freight",
        time: "3–5일",
        carrier: "Asiana Cargo",
        freightCost: 7200,
        customsCost: 600,
        insurance: 300,
        handling: 100,
        total: 8200,
        icon: "air",
        incoterms: "CIF",
      },
      {
        type: "해상 배송 (FCL)",
        method: "Sea Freight FCL 20ft",
        time: "20–28일",
        carrier: "HMM",
        freightCost: 1600,
        customsCost: 280,
        insurance: 150,
        handling: 70,
        total: 2100,
        icon: "sea",
        incoterms: "FOB",
      },
      {
        type: "특송 (FedEx)",
        method: "Express Courier",
        time: "2–3일",
        carrier: "FedEx International",
        freightCost: 10800,
        customsCost: 800,
        insurance: 300,
        handling: 100,
        total: 12000,
        icon: "express",
        incoterms: "DDP",
      },
    ],
  },
];

export function MyPage() {
  const [role, setRole] = useState<UserRole>("buyer");
  const [activeTab, setActiveTab] = useState<Tab>("orders");
  const [inquiryText, setInquiryText] = useState("");
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [expandedSrc, setExpandedSrc] = useState<string | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const [selectedShippingOption, setSelectedShippingOption] = useState<Record<string, number>>({});
  const [confirmedShippingQuotes, setConfirmedShippingQuotes] = useState<Set<string>>(new Set());
  const [showRejectConfirm, setShowRejectConfirm] = useState<string | null>(null);
  const [expandedQuote, setExpandedQuote] = useState<string | null>(null);
  const [selectedQuotesForCompare, setSelectedQuotesForCompare] = useState<Set<string>>(new Set());
  const [quoteFilter, setQuoteFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const myDeliveryAddress = {
    recipient: "TradeKR 인천물류창고",
    address: "인천광역시 중구 공항로 123",
    detail: "TradeKR 3동 B-구역",
    code: "TKR-KR-20941",
    phone: "032-000-0000",
    zipcode: "22382",
  };
  const fullAddressText = `[수령인] ${myDeliveryAddress.recipient}\n[주소] ${myDeliveryAddress.address} ${myDeliveryAddress.detail}\n[우편번호] ${myDeliveryAddress.zipcode}\n[관리코드] ${myDeliveryAddress.code}\n[연락처] ${myDeliveryAddress.phone}`;
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(fullAddressText).then(() => {
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 2500);
    });
  };

  const buyerTabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "inquiry", label: "MY 활동", icon: <MessageSquare size={18} /> },
    { id: "profile", label: "MY 정보", icon: <Settings size={18} /> },
    { id: "address", label: "배송지·주소 발급", icon: <MapPin size={18} /> },
  ];

  const sellerTabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "inquiry", label: "MY 활동", icon: <MessageSquare size={18} /> },
    { id: "profile", label: "MY 정보", icon: <Settings size={18} /> },
    { id: "address", label: "배송지 관리", icon: <MapPin size={18} /> },
  ];

  const tabs = role === "buyer" ? buyerTabs : sellerTabs;

  const receivedQuotes = buyerSourcingRequests.filter(s => s.quoteReceived && s.quote);

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-8 font-[Inter,sans-serif]">
      <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
        <User size={24} className="text-primary" /> 마이페이지
      </h1>

      {/* Role Switch */}
      <div className="flex items-center gap-2 mb-6 bg-white border border-border rounded-lg p-2 w-fit">
        <button
          onClick={() => { setRole("buyer"); setActiveTab("orders"); }}
          className={`px-5 py-2 rounded text-sm font-semibold transition-colors flex items-center gap-2 ${role === "buyer" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
        >
          <ShoppingBag size={15} /> 바이어
        </button>
        <button
          onClick={() => { setRole("seller"); setActiveTab("orders"); }}
          className={`px-5 py-2 rounded text-sm font-semibold transition-colors flex items-center gap-2 ${role === "seller" ? "bg-[#2d4a35] text-white" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Star size={15} /> 셀러
        </button>
      </div>

      <div className="grid grid-cols-[240px_1fr] gap-6">
        {/* Sidebar */}
        <div className="space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded transition-colors ${
                activeTab === tab.id
                  ? role === "buyer" ? "bg-primary text-white" : "bg-[#2d4a35] text-white"
                  : "bg-white border border-border text-foreground hover:border-primary hover:text-primary"
              }`}
            >
              {tab.icon}
              <span className="font-medium">{tab.label}</span>
              {tab.id === "quotes" && role === "buyer" && receivedQuotes.length > 0 && (
                <span className="ml-auto bg-green-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{receivedQuotes.length}</span>
              )}
              {tab.id === "shipping-quotes" && role === "buyer" && (
                <span className="ml-auto bg-blue-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{buyerShippingQuotesList.filter(q => q.status !== "선택 완료").length}</span>
              )}
              {tab.id === "sourcing" && role === "seller" && sellerSourcingRequests.filter(r => !r.quoteSent).length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{sellerSourcingRequests.filter(r => !r.quoteSent).length}</span>
              )}
            </button>
          ))}

          <div className="pt-2 border-t border-border">
            {role === "buyer" ? (
              <Link to="/buyer" className="w-full bg-secondary border border-primary/20 text-primary hover:bg-primary hover:text-white py-2.5 rounded text-sm font-semibold transition-colors flex items-center justify-center gap-1.5">
                바이어 전용 페이지 →
              </Link>
            ) : (
              <Link to="/seller" className="w-full bg-[#f0f4f0] border border-[#2d4a35]/20 text-[#2d4a35] hover:bg-[#2d4a35] hover:text-white py-2.5 rounded text-sm font-semibold transition-colors flex items-center justify-center gap-1.5">
                셀러 전용 페이지 →
              </Link>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white border border-border rounded-lg p-6">

          {activeTab === "inquiry" && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-5 flex items-center gap-2">
                <MessageSquare size={20} className="text-primary" />
                문의하기 / 문의 내역
              </h2>
              <div className="bg-muted/30 border border-border rounded p-5 mb-6">
                <h3 className="font-semibold text-foreground mb-3">새 문의 작성</h3>
                <input type="text" placeholder="제목을 입력하세요" className="w-full border border-border rounded px-3 py-2 text-sm outline-none focus:border-primary transition-colors mb-3" />
                <textarea
                  value={inquiryText}
                  onChange={(e) => setInquiryText(e.target.value)}
                  placeholder="문의 내용을 입력하세요"
                  rows={4}
                  className="w-full border border-border rounded px-3 py-2 text-sm outline-none focus:border-primary transition-colors resize-none"
                />
                <button className="mt-3 bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded text-sm font-semibold transition-colors">
                  문의 제출
                </button>
              </div>
              <h3 className="font-semibold text-foreground mb-3">내 문의 내역</h3>
              <div className="space-y-3">
                {myInquiries.map((inquiry) => (
                  <div key={inquiry.id} className="border border-border rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-foreground">{inquiry.title}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded border ${
                        inquiry.status === "답변완료" ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {inquiry.status}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">{inquiry.date}</div>
                    {inquiry.reply && (
                      <div className="bg-secondary border border-primary/20 rounded p-3 mt-2">
                        <div className="text-xs text-primary font-semibold mb-1">답변</div>
                        <div className="text-sm text-foreground">{inquiry.reply}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-5 flex items-center gap-2">
                <User size={20} className="text-primary" />
                개인정보 확인 및 수정
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">이메일</label>
                  <input type="email" defaultValue="user@example.com" disabled className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none bg-muted text-muted-foreground" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">회사명</label>
                  <input type="text" defaultValue="글로벌뷰티㈜" className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">담당자명</label>
                  <input type="text" defaultValue="홍길동" className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">연락처</label>
                  <input type="tel" defaultValue="010-1234-5678" className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">사업자등록번호</label>
                  <input type="text" defaultValue="123-45-67890" className="w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors" />
                </div>
                <button className="bg-primary hover:bg-primary/90 text-white px-8 py-2.5 rounded font-semibold text-sm transition-colors">
                  정보 수정
                </button>
              </div>
              <div className="mt-8 pt-8 border-t border-border">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-red-600" />
                  회원 탈퇴
                </h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  회원 탈퇴 시 모든 주문 내역, 문의 내역, 개인정보가 삭제되며 복구할 수 없습니다.
                </p>
                {!showWithdrawConfirm ? (
                  <button onClick={() => setShowWithdrawConfirm(true)} className="border border-red-300 text-red-600 hover:bg-red-50 px-6 py-2 rounded text-sm font-medium transition-colors">
                    회원 탈퇴 신청
                  </button>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded p-4">
                    <p className="text-sm text-red-700 mb-3 font-semibold">정말로 탈퇴하시겠습니까?</p>
                    <div className="flex gap-2">
                      <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-semibold transition-colors">탈퇴 확인</button>
                      <button onClick={() => setShowWithdrawConfirm(false)} className="border border-border text-muted-foreground hover:border-primary hover:text-primary px-4 py-2 rounded text-sm font-medium transition-colors">취소</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "address" && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-5 flex items-center gap-2">
                <MapPin size={20} className="text-primary" />
                배송지 관리 · 배송대행지 주소 발급
              </h2>

              {/* 배송대행지 주소 발급 섹션 */}
              <div className="bg-secondary border border-primary/20 rounded-lg p-5 mb-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-foreground mb-1 flex items-center gap-2">
                      <MapPin size={16} className="text-primary" /> 내 배송대행지 주소
                    </h3>
                    <p className="text-xs text-muted-foreground">해외 쇼핑몰에서 이 주소로 구매하면 TradeKR 창고로 입고됩니다.</p>
                  </div>
                  <span className="text-xs bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded font-semibold">발급완료</span>
                </div>
                <div className="space-y-1.5 text-sm mb-4">
                  <div className="flex gap-2"><span className="text-muted-foreground w-16">수령인</span><span className="font-semibold">{myDeliveryAddress.recipient}</span></div>
                  <div className="flex gap-2"><span className="text-muted-foreground w-16">주소</span><span>{myDeliveryAddress.address}</span></div>
                  <div className="flex gap-2"><span className="text-muted-foreground w-16">상세</span><span>{myDeliveryAddress.detail}</span></div>
                  <div className="flex gap-2"><span className="text-muted-foreground w-16">관리코드</span><span className="font-mono font-bold text-primary">{myDeliveryAddress.code}</span></div>
                </div>
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="w-full bg-primary hover:bg-primary/90 text-white py-2.5 rounded font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Copy size={14} /> 배송대행지 주소 발급하기
                </button>
              </div>

              <h3 className="font-semibold text-foreground mb-3">배송지 목록</h3>
              <div className="space-y-3 mb-4">
                {myAddresses.map((addr) => (
                  <div key={addr.id} className="border border-border rounded p-4 relative">
                    {addr.isDefault && (
                      <span className="absolute top-3 right-3 text-xs bg-primary text-white px-2 py-0.5 rounded font-semibold">기본</span>
                    )}
                    <h4 className="font-semibold text-foreground mb-2">{addr.name}</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex gap-4">
                        <span className="font-medium text-foreground">{addr.recipient}</span>
                        <span>{addr.phone}</span>
                      </div>
                      <div>{addr.address}</div>
                      <div className="text-xs">{addr.detail}</div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button className="text-xs border border-border text-muted-foreground hover:border-primary hover:text-primary px-3 py-1.5 rounded transition-colors">수정</button>
                      {!addr.isDefault && (
                        <button className="text-xs border border-border text-muted-foreground hover:border-primary hover:text-primary px-3 py-1.5 rounded transition-colors">기본 배송지 설정</button>
                      )}
                      <button className="text-xs border border-red-300 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded transition-colors">삭제</button>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary py-3 rounded font-medium transition-colors">
                + 새 배송지 추가
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
