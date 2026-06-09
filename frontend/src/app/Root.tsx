import { Outlet, Link, useLocation } from "react-router";
import {
  Search,
  User,
  ShoppingCart,
  Bell,
  Phone,
  Mail,
  Clock,
  MapPin,
  ChevronDown,
  ClipboardList,
  Package,
  Truck,
  CheckCircle,
  X,
  Settings,
  ShieldAlert,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

const navLinks = [
  { label: "홈", path: "/" },
  { label: "전체상품", path: "/products" },
  { label: "공급업체", path: "/suppliers" },
  { label: "주문관리", path: "/orders" },
  { label: "고객센터", path: "/support" },
  { label: "🔒 관리자", path: "/admin" },
];

const hotKeywords = ["여성 린넨 블라우스", "와이드 슬랙스", "플로럴 원피스", "오버핏 자켓", "스포츠 레깅스"];

const notifications = [
  {
    id: 1,
    icon: CheckCircle,
    color: "text-green-500",
    title: "주문 승인 완료",
    desc: "'여성 갸라도스 블라우스' 300벌 주문이 승인되었습니다.",
    time: "방금 전",
    unread: true,
  },
  {
    id: 2,
    icon: Truck,
    color: "text-blue-500",
    title: "배송 출발",
    desc: "'스이쿤 패턴 슬랙스' 200벌 주문이 동대문 창고를 출발했습니다.",
    time: "1시간 전",
    unread: true,
  },
  {
    id: 3,
    icon: Package,
    color: "text-primary",
    title: "신규 상품 등록",
    desc: "'고급 극세사 메타퐁 담요 망토' 신규 시즌 상품이 등록되었습니다.",
    time: "어제",
    unread: false,
  },
    {
    id: 4, //(바이어용)재입고 알림 추가
    icon: Bell,
    color: "text-primary",
    title: "재입고 알림",
    desc: "저장하신 '잉어킹 티셔츠'이(가) 재입고 되었습니다.[바이어]",
    time: "방금 전",
    unread: true,
  },

  {
    id: 5, //(셀러용)일정수량 이하 알림 추가
    icon: Bell,
    color: "text-primary",
    title: "수량 알림",
    desc: "'피카츄 후드집업'의 재고가 일정 수량 이하로 떨어졌습니다.[셀러]",
    time: "방금 전",
    unread: true,
  },

  {
    id: 5, //인증서 유효기간
    icon: ShieldAlert ,
    color: "text-yellow-500",
    title: " 인증서 갱신 필요 ",
    desc: "'고라파덕 후드티' KC인증서 유효기간이 14일 남았습니다.",
    time: "방금 전",
    unread: true,
  },
  {
    id: 6, //7일 이하로 떨어지면 붉은색
    icon: ShieldAlert ,
    color: "text-red-500",
    title: " 인증서 갱신 필요 ",
    desc: "'치코리타 백팩' GOTS인증서 유효기간이 7일 남았습니다.",
    time: "방금 전",
    unread: true,
  },

];

export function Root() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [readIds, setReadIds] = useState<number[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(
    (n) => n.unread && !readIds.includes(n.id)
  ).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="min-h-screen bg-background font-[Inter,sans-serif] flex flex-col">
      {/* Top Utility Bar */}
      <div className="bg-[#1a1a1a] text-white text-xs py-1.5 flex-shrink-0">
        <div className="max-w-[1280px] mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[#aaaaaa]">
            <span className="flex items-center gap-1">
              <Phone size={11} />
              1588-0000
            </span>
            <span className="flex items-center gap-1">
              <Mail size={11} />
              support@stylehub.co.kr
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              평일 09:00–18:00
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/supplier-register" className="hover:text-accent transition-colors">셀러 등록</Link>
            <span className="text-[#444]">|</span>
            <Link to="/restricted-businesses" className="hover:text-accent transition-colors">가입 불가 업태/업종</Link>
            <span className="text-[#444]">|</span>
            <Link to="/auth?tab=signup" className="hover:text-accent transition-colors">회원가입</Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50 flex-shrink-0">
        <div className="max-w-[1280px] mx-auto px-4 py-3 flex items-center gap-6">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <div className="text-2xl font-bold tracking-tight">
              <span className="text-primary">Style</span>
              <span className="text-foreground">Hub</span>
              <div className="text-[9px] font-normal text-muted-foreground tracking-widest uppercase -mt-1">
                국내 패션 B2B 도매 플랫폼
              </div>
            </div>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-[700px]">
            <div className="flex border-2 border-primary rounded overflow-hidden">
              <div className="flex items-center border-r border-border bg-muted px-3 gap-1 cursor-pointer hover:bg-muted/80 transition-colors text-sm text-foreground whitespace-nowrap">
                전체
                <ChevronDown size={14} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="상품명, 카테고리, 브랜드, 셀러 검색..."
                className="flex-1 px-4 py-2.5 text-sm outline-none bg-white"
              />
              <button className="bg-primary hover:bg-primary/90 transition-colors px-6 flex items-center gap-2 text-white font-medium text-sm">
                <Search size={16} />
                검색
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
              <span>인기:</span>
              {hotKeywords.map((kw) => (
                <button
                  key={kw}
                  onClick={() => setSearchQuery(kw)}
                  className="hover:text-primary transition-colors"
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-5 flex-shrink-0 text-sm">
            <Link to="/auth/login" className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors">
              <User size={20} />
              <span className="text-[11px]">로그인/가입</span>
            </Link>
            <Link to="/mypage" className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors">
              <Settings size={20} />
              <span className="text-[11px]">마이페이지</span>
            </Link>
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors relative"
              >
                <Bell size={20} />
                <span className="text-[11px]">알림</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-border rounded-lg shadow-xl z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="font-semibold text-foreground text-sm">알림</span>
                    <div className="flex items-center gap-3">
                      {unreadCount > 0 && (
                        <button
                          onClick={() => setReadIds(notifications.map((n) => n.id))}
                          className="text-xs text-primary hover:underline"
                        >
                          모두 읽음
                        </button>
                      )}
                      <button onClick={() => setNotifOpen(false)} className="text-muted-foreground hover:text-foreground">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-border">
                    {notifications.map((n) => {
                      const Icon = n.icon;
                      const isUnread = n.unread && !readIds.includes(n.id);
                      return (
                        <button
                          key={n.id}
                          onClick={() => setReadIds((prev) => [...new Set([...prev, n.id])])}
                          className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors ${isUnread ? "bg-primary/5" : ""}`}
                        >
                          <div className={`mt-0.5 flex-shrink-0 ${n.color}`}>
                            <Icon size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-sm font-medium ${isUnread ? "text-foreground" : "text-muted-foreground"}`}>
                                {n.title}
                              </span>
                              {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{n.desc}</p>
                            <span className="text-[11px] text-muted-foreground mt-1 block">{n.time}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="px-4 py-2.5 border-t border-border">
                    <Link
                      to="/orders"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      주문내역에서 전체 보기 →
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <Link to="/orders" className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors">
              <ClipboardList size={20} />
              <span className="text-[11px]">주문내역</span>
            </Link>
            <Link to="/cart" className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors relative">
              <ShoppingCart size={20} />
              <span className="text-[11px]">장바구니</span>
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                3
              </span>
            </Link>
          </div>
        </div>

        {/* Category Nav */}
        <div className="border-t border-border bg-white">
          <div className="max-w-[1280px] mx-auto px-4 flex items-center">
            {navLinks.map((link) => {
              const isActive =
                link.path === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? "text-primary border-b-2 border-primary"
                      : "text-foreground hover:text-primary"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-[#aaa] mt-4 flex-shrink-0">
        <div className="max-w-[1280px] mx-auto px-4 py-10">
          <div className="grid grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold mb-3">
                <span className="text-primary">Style</span>
                <span className="text-white">Hub</span>
              </div>
              <p className="text-sm leading-relaxed mb-4">
                국내 여성복 B2B 도매 플랫폼. 동대문 패션 셀러와 전국 바이어를 직접 연결합니다.
              </p>
            </div>
            {[
              {
                title: "서비스",
                links: [
                  { label: "전체상품", path: "/products" },
                  { label: "공급업체", path: "/suppliers" },
                  { label: "셀러 등록", path: "/supplier-register" },
                  { label: "가입 불가 업태/업종", path: "/restricted-businesses" },
                ],
              },
              {
                title: "고객 지원",
                links: [
                  { label: "공지사항", path: "/support" },
                  { label: "자주 묻는 질문", path: "/support" },
                  { label: "1:1 문의", path: "/support" },
                  { label: "이용 가이드", path: "/support" },
                ],
              },
              {
                title: "회사 정보",
                links: [
                  { label: "회사 소개", path: "/" },
                  { label: "파트너십", path: "/partner" },
                  { label: "셀러 파트너 등록", path: "/auth?tab=signup&role=seller" },
                  { label: "채용 공고", path: "/" },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-white font-semibold text-sm mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.path}
                        className="text-sm hover:text-primary transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-[#333] pt-6 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span>© 2025 StyleHub Corp. All rights reserved.</span>
              <span className="flex items-center gap-1">
                <MapPin size={11} />
                서울특별시 중구 동대문로 123 스타일허브빌딩
              </span>
            </div>
            <div className="font-mono text-muted-foreground">
              사업자등록번호 123-45-67890 · SSL Secured
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
