import {Link, Outlet, useNavigate} from "react-router";
import {
    Bell,
    CheckCircle,
    ChevronDown,
    ClipboardList,
    Info,
    LogOut,
    MapPin,
    Package,
    Search,
    ShieldAlert,
    ShoppingCart,
    Star,
    Truck,
    User,
    X,
    MessageCircle,
    FlaskConical,
    XCircle,
    FileSignature,
    FileText,
    UserPlus,
    Building2,
    AlertTriangle,
} from "lucide-react";
import {useCallback, useEffect, useRef, useState} from "react";
import {useAuthStore} from "@/store/useAuthStore";
import {logout as apiLogout} from "@/api/auth/auth.service";
import logoSvg from "@/assets/style_hub_logo.svg";
import {useNotification} from "@/api/notification/useNotification";
import {
    getNotifications,
    getUnreadCount,
    markAsRead as apiMarkAsRead,
    markAllAsRead as apiMarkAllAsRead,
    type NotificationResponse,
} from "@/api/notification/notification.service";

const hotKeywords = ["여성 린넨 블라우스", "와이드 슬랙스", "플로럴 원피스", "오버핏 자켓", "스포츠 레깅스"];

// 백엔드 NotificationType 기준 아이콘/라벨/색상 매핑
const NOTIFICATION_TYPE_META: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    SOURCING_ASSIGNED:          { icon: Package,        color: "text-primary",     label: "소싱 요청 배정" },
    QUOTE_RECEIVED:             { icon: FileText,       color: "text-blue-500",    label: "새 견적 도착" },
    QUOTE_APPROVED:             { icon: CheckCircle,    color: "text-green-500",   label: "견적 채택" },
    QUOTE_REJECTED:             { icon: XCircle,        color: "text-red-500",     label: "견적 거절" },
    QUOTE_NEGOTIATING:          { icon: MessageCircle,  color: "text-purple-500",  label: "협의 요청" },
    SAMPLE_REQUESTED:           { icon: FlaskConical,   color: "text-amber-500",   label: "샘플 결제 요청" },
    ORDER_CONFIRMED:            { icon: ShoppingCart,   color: "text-blue-500",    label: "주문 확정" },
    ORDER_SHIPPED:              { icon: Truck,          color: "text-blue-500",    label: "배송 출발" },
    ORDER_DELIVERED:            { icon: Package,        color: "text-green-500",   label: "배송 완료" },
    CONTRACT_CREATED:           { icon: FileSignature,  color: "text-primary",     label: "계약서 도착" },
    CONTRACT_SIGNED:            { icon: FileSignature,  color: "text-green-500",   label: "계약서 서명 완료" },
    USER_JOINED:                { icon: UserPlus,       color: "text-primary",     label: "신규 회원 가입" },
    COMPANY_APPROVAL_REQUESTED: { icon: Building2,      color: "text-amber-500",   label: "업체 승인 요청" },
    SOURCING_CREATED:           { icon: FileText,       color: "text-primary",     label: "새 소싱 요청" },
    DISPUTE_RAISED:             { icon: ShieldAlert,    color: "text-red-500",     label: "이의제기 접수" },
};

function getNotificationMeta(type: string) {
    return NOTIFICATION_TYPE_META[type] ?? { icon: Bell, color: "text-primary", label: "알림" };
}

function formatRelativeTime(isoStr: string): string {
    try {
        const diffMs = Date.now() - new Date(isoStr).getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return "방금 전";
        if (diffMin < 60) return `${diffMin}분 전`;
        const diffHour = Math.floor(diffMin / 60);
        if (diffHour < 24) return `${diffHour}시간 전`;
        return new Date(isoStr).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" });
    } catch {
        return isoStr;
    }
}

// [추가] 검색용 더미데이터
const searchDummyProducts = [
    {
        id: 1,
        name: "여성 린넨 블라우스 (7컬러)",
        supplier: "동대문패션(주)",
        price: "₩8,900",
        image: "https://images.unsplash.com/photo-1594938298603-c8148c4b2e8e?w=40&h=40&fit=crop"
    },
    {
        id: 2,
        name: "와이드 슬랙스 스트레이트",
        supplier: "스타일컴퍼니",
        price: "₩15,800",
        image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=40&h=40&fit=crop"
    },
    {
        id: 3,
        name: "플로럴 랩 원피스 (5컬러)",
        supplier: "트렌드하우스",
        price: "₩22,000",
        image: "https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=40&h=40&fit=crop"
    },
    {
        id: 4,
        name: "울 혼방 오버핏 롱코트",
        supplier: "프리미엄어패럴",
        price: "₩58,000",
        image: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=40&h=40&fit=crop"
    },
    {
        id: 5,
        name: "하이웨이스트 요가 레깅스",
        supplier: "액티브웨어코리아",
        price: "₩22,000",
        image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=40&h=40&fit=crop"
    },
    {
        id: 6,
        name: "체인 미니 숄더백 (4컬러)",
        supplier: "패션액세서리몰",
        price: "₩35,000",
        image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=40&h=40&fit=crop"
    },
    {
        id: 11,
        name: "루즈핏 린넨 셔츠 (3컬러)",
        supplier: "내추럴보이",
        price: "₩12,000",
        image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=40&h=40&fit=crop"
    },
    {
        id: 12,
        name: "스트라이프 니트 가디건",
        supplier: "코지니트",
        price: "₩19,500",
        image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=40&h=40&fit=crop"
    },
    {
        id: 13,
        name: "플리츠 미디 스커트 (5컬러)",
        supplier: "엘레강스모드",
        price: "₩14,000",
        image: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=40&h=40&fit=crop"
    },
    {
        id: 14,
        name: "오버핏 크롭 후드집업",
        supplier: "캐주얼하우스",
        price: "₩22,000",
        image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=40&h=40&fit=crop"
    },
    {
        id: 15,
        name: "실크 새틴 슬립 드레스",
        supplier: "페미닌스타일",
        price: "₩28,000",
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=40&h=40&fit=crop"
    },
    {
        id: 16,
        name: "버킷햇 코튼 (4컬러)",
        supplier: "패션액세서리몰",
        price: "₩8,500",
        image: "https://images.unsplash.com/photo-1520975861611-9272f9c2a78c?w=40&h=40&fit=crop"
    },
];

// [수정] iconImg, alias 추가
const searchDummyCategories = [
    {id: "tops", name: "상의", icon: "👕", iconImg: "/images/top.png", sub: ["티셔츠/탑", "블라우스/셔츠", "니트/스웨터", "후드/맨투맨"]},
    {
        id: "bottoms",
        name: "하의",
        icon: "👖",
        iconImg: "/images/bottom.png",
        alias: ["치마", "바지"],
        sub: ["팬츠/슬랙스", "스커트", "진/데님", "레깅스"]
    },
    {id: "dresses", name: "원피스/세트", icon: "👗", iconImg: "/images/one_piece.png", sub: ["원피스", "투피스세트", "점프수트", "코디세트"]},
    {
        id: "outerwear",
        name: "아우터",
        icon: "🧥",
        iconImg: "/images/outer.png",
        alias: ["겉옷", "잠바", "코트", "재킷", "가디건"],
        sub: ["코트", "재킷/점퍼", "가디건", "패딩/베스트"]
    },
    {
        id: "innerwear",
        name: "이너/언더웨어",
        icon: "🩱",
        iconImg: "/images/inner.png",
        alias: ["속옷", "잠옷"],
        sub: ["이너웨어", "브라/속옷", "잠옷/홈웨어"]
    },
    {
        id: "sports",
        name: "스포츠/애슬레저",
        icon: "🏃",
        iconImg: "/images/sports.png",
        alias: ["스포츠", "운동복", "수영복", "요가복", "필라테스"],
        sub: ["스포츠탑", "스포츠레깅스", "트레이닝복", "요가복", "수영복"]
    },
    {
        id: "accessories",
        name: "액세서리",
        icon: "👜",
        iconImg: "/images/accessory.png",
        alias: ["악세서리", "악세사리"],
        sub: ["가방/백", "스카프/모자", "벨트/양말", "쥬얼리"]
    },
    {
        id: "shoes",
        name: "신발",
        icon: "👠",
        iconImg: "/images/shoes.png",
        alias: ["구두", "운동화"],
        sub: ["스니커즈", "힐/구두", "부츠/앵클부츠", "샌들/슬리퍼"]
    },
];

// [수정] string 배열 → 객체 배열로 변경 (logo 추가, 이미지 없어도 빈 박스로 표시)
const searchDummyBrands = [
    {name: "동대문패션", logo: "/images/brands/ddm.png"},
    {name: "스타일컴퍼니", logo: "/images/brands/style.png"},
    {name: "엘레강스모드", logo: "/images/brands/elegance.png"},
    {name: "트렌드하우스", logo: "/images/brands/trend.png"},
    {name: "페미닌스타일", logo: "/images/brands/feminine.png"},
    {name: "내추럴보이", logo: "/images/brands/natural.png"},
    {name: "세트스타일", logo: "/images/brands/set.png"},
    {name: "코지니트", logo: "/images/brands/cozy.png"},
    {name: "캐주얼하우스", logo: "/images/brands/casual.png"},
    {name: "진워크스", logo: "/images/brands/jean.png"},
    {name: "프리미엄어패럴", logo: "/images/brands/premium.png"},
    {name: "액티브웨어코리아", logo: "/images/brands/active.png"},
    {name: "스포츠라이프", logo: "/images/brands/sportslife.png"},
    {name: "베이직이너", logo: "/images/brands/basic.png"},
    {name: "코지홈", logo: "/images/brands/cozyhome.png"},
    {name: "패션액세서리몰", logo: "/images/brands/acc.png"},
    {name: "슈즈마켓", logo: "/images/brands/shoes.png"},
];

export function Root() {
    const [searchQuery, setSearchQuery] = useState("");
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // 무한 스크롤용 커서 페이지네이션 상태
    const [notifCursor, setNotifCursor] = useState<number | null>(null);
    const [notifHasNext, setNotifHasNext] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const notifRef = useRef<HTMLDivElement>(null);
    const [searchTab, setSearchTab] = useState<"product" | "category" | "brand">("product");
    const [tabDropOpen, setTabDropOpen] = useState(false);
    const [resultDropOpen, setResultDropOpen] = useState(false);
    const tabDropRef = useRef<HTMLDivElement>(null);
    const resultDropRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const user = useAuthStore((state) => state.user);
    const clearUser = useAuthStore((state) => state.clearUser);

    useNotification(!!user);  // 로그인 상태일 때만 SSE 연결

    // 마운트 시 알림 첫 페이지 + 안읽음 개수 조회
    useEffect(() => {
        if (!user) return;
        getUnreadCount()
            .then(setUnreadCount)
            .catch((e) => console.error("안읽음 개수 조회 실패:", e));
        getNotifications()
            .then((page) => {
                setNotifications(page.items);
                setNotifCursor(page.nextCursor);
                setNotifHasNext(page.hasNext);
            })
            .catch((e) => console.error("알림 목록 조회 실패:", e));
    }, [user]);

    let dashboardPath = "/";

    if (user?.businessRole === "BUYER") {
        dashboardPath = "/buyer";
    } else if (user?.businessRole === "SELLER") {
        dashboardPath = "/seller";
    } else if (user?.businessRole === "BOTH") {
        dashboardPath = "/buyer";
    }

    const isBuyerPresident = user?.role === "PRESIDENT" && user?.businessRole === "BUYER";
    const handleLogout = async () => {
        try {
            await apiLogout();
        } catch (error) {
            console.error("로그아웃 API 요청 실패:", error);
        } finally {
            clearUser();
            navigate("/auth/login");
        }
    };

    // 알림 벨 클릭 → 드롭다운 열기/닫기만 수행 (읽음 처리는 별도 버튼)
    const handleBellClick = () => {
        setNotifOpen((prev) => !prev);
    };

    // 전체 읽음 버튼 클릭 → 화면 즉시 반영 + 서버 반영
    const handleMarkAllRead = async () => {
        if (unreadCount === 0) return;
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        try {
            await apiMarkAllAsRead();
        } catch (e) {
            console.error("알림 읽음 처리 실패:", e);
        }
    };

    // 개별 알림 클릭 → 그 알림만 읽음 처리
    const handleNotificationItemClick = async (n: NotificationResponse) => {
        if (n.isRead) return;
        setNotifications((prev) =>
            prev.map((item) => item.notificationId === n.notificationId ? { ...item, isRead: true } : item)
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        try {
            await apiMarkAsRead(n.notificationId);
        } catch (e) {
            console.error("알림 읽음 처리 실패:", e);
        }
    };

    // 다음 페이지 알림 로드 (무한 스크롤)
    const loadMoreNotifications = useCallback(async () => {
        if (!notifHasNext || isLoadingMore || notifCursor == null) return;
        setIsLoadingMore(true);
        try {
            const page = await getNotifications(notifCursor);
            setNotifications((prev) => [...prev, ...page.items]);
            setNotifCursor(page.nextCursor);
            setNotifHasNext(page.hasNext);
        } catch (e) {
            console.error("추가 알림 조회 실패:", e);
        } finally {
            setIsLoadingMore(false);
        }
    }, [notifCursor, notifHasNext, isLoadingMore]);

    // 알림 드롭다운 스크롤이 바닥 근처에 닿으면 다음 페이지 로드
    const handleNotifScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
            loadMoreNotifications();
        }
    };

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setNotifOpen(false);
            }
            if (tabDropRef.current && !tabDropRef.current.contains(e.target as Node)) {
                setTabDropOpen(false);
            }
            if (resultDropRef.current && !resultDropRef.current.contains(e.target as Node)) {
                setResultDropOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const searchResults = searchQuery.trim().length < 1 ? [] : (() => {
        const q = searchQuery.trim().toLowerCase();
        if (searchTab === "product") {
            return searchDummyProducts.filter(p => p.name.toLowerCase().includes(q)).slice(0, 6);
        }
        if (searchTab === "category") {
            return searchDummyCategories.filter(c =>
                c.name.toLowerCase().includes(q) ||
                c.sub.some(s => s.toLowerCase().includes(q)) ||
                (c.alias ?? []).some(a => a.toLowerCase().includes(q))
            ).slice(0, 6);
        }
        if (searchTab === "brand") {
            return searchDummyBrands.filter(b => b.name.toLowerCase().includes(q)).slice(0, 6);
        }
        return [];
    })();

    return (
        <div className="min-h-screen bg-background font-[Pretendard,sans-serif] flex flex-col">
            {isBuyerPresident && (<div
                    className="bg-primary/10 border-b border-primary/20 py-1.5 text-center text-xs text-primary flex items-center justify-center gap-3">
                    <span>🏷️ {user?.name}님! 셀러로 등록하고 전국 바이어와 연결되세요!</span>
                    <Link to="/auth?tab=signup&role=seller"
                          className="bg-primary text-white text-[11px] font-semibold px-3 py-0.5 rounded-full hover:bg-primary/80 transition-colors">
                        셀러 등록하기 →
                    </Link>
                </div>
            )}
            <header className="bg-white shadow-sm sticky top-0 z-50 flex-shrink-0 py-2">
                <div className="max-w-[1280px] mx-auto px-4 py-3 flex justify-between items-center">
                    <Link to="/">
                        <img
                            src={logoSvg}
                            alt="StyleHub 로고"
                            className="h-18 w-auto object-contain transform translate-y-[5px]"
                        />
                    </Link>
                    <div className="flex-1 max-w-[700px] transform translate-y-[8px]">
                        <div className="flex border-2 border-primary rounded">
                            <div className="relative" ref={tabDropRef}>
                                <button
                                    onClick={() => setTabDropOpen((v) => !v)}
                                    className="flex items-center border-r border-border bg-muted px-3 gap-1 cursor-pointer hover:bg-muted/80 transition-colors text-sm text-foreground whitespace-nowrap h-full w-24 justify-between"
                                >
                                    {searchTab === "product" ? "상품명" : searchTab === "category" ? "카테고리" : "브랜드"}
                                    <ChevronDown size={14}/>
                                </button>
                                {tabDropOpen && (
                                    <div
                                        className="absolute left-0 top-full mt-1 bg-white border border-border rounded shadow-lg z-[100] w-28">
                                        {(["product", "category", "brand"] as const).map((tab) => (
                                            <button
                                                key={tab}
                                                onClick={() => {
                                                    setSearchTab(tab);
                                                    setTabDropOpen(false);
                                                    setSearchQuery("");
                                                    setResultDropOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors ${searchTab === tab ? "text-primary font-semibold" : "text-foreground"}`}
                                            >
                                                {tab === "product" ? "상품명" : tab === "category" ? "카테고리" : "브랜드"}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setResultDropOpen(true);
                                    setTabDropOpen(false);
                                }}
                                onFocus={() => {
                                    if (searchQuery.trim().length > 0) setResultDropOpen(true);
                                }}
                                placeholder={
                                    searchTab === "product" ? "상품명으로 검색" :
                                        searchTab === "category" ? "카테고리명으로 검색" : "브랜드명으로 검색"
                                }
                                className="flex-1 px-4 py-2.5 text-sm outline-none bg-white"
                            />
                            <button
                                className="bg-primary hover:bg-primary/90 transition-colors px-6 flex items-center gap-2 text-white font-medium text-sm">
                                <Search size={16}/>
                                검색
                            </button>
                        </div>

                        {resultDropOpen && searchQuery.trim().length > 0 && (
                            <div ref={resultDropRef}
                                 className="absolute mt-1 bg-white border border-border rounded shadow-xl z-[100] w-full max-w-[700px] max-h-72 overflow-y-auto">
                                {searchResults.length === 0 ? (
                                    <div className="px-4 py-3 text-sm text-muted-foreground">검색 결과가 없습니다.</div>
                                ) : searchTab === "product" ? (
                                    (searchResults as typeof searchDummyProducts).map((p) => (
                                        <Link
                                            key={p.id}
                                            to={`/product/${p.id}`}
                                            onClick={() => {
                                                setResultDropOpen(false);
                                                setSearchQuery("");
                                            }}
                                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary transition-colors border-b border-border last:border-0"
                                        >
                                            <img src={p.image} alt={p.name}
                                                 className="w-9 h-9 rounded object-cover flex-shrink-0"/>
                                            <div className="flex-1 min-w-0">
                                                <div
                                                    className="text-sm font-medium text-foreground truncate">{p.name}</div>
                                                <div className="text-xs text-muted-foreground">{p.supplier}</div>
                                            </div>
                                            <div
                                                className="text-primary text-sm font-bold flex-shrink-0">{p.price}</div>
                                        </Link>
                                    ))
                                ) : searchTab === "category" ? (
                                    (searchResults as typeof searchDummyCategories).map((c) => (
                                        <Link
                                            key={c.id}
                                            to={`/products?category=${c.id}`}
                                            onClick={() => {
                                                setResultDropOpen(false);
                                                setSearchQuery("");
                                            }}
                                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary transition-colors border-b border-border last:border-0"
                                        >
                                            <img src={c.iconImg} alt={c.name}
                                                 className="w-7 h-7 object-contain flex-shrink-0"/>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-foreground">{c.name}</div>
                                                <div
                                                    className="text-xs text-muted-foreground truncate">{c.sub.join(" · ")}</div>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    (searchResults as typeof searchDummyBrands).map((b) => (
                                        <Link
                                            key={b.name}
                                            to="/suppliers"
                                            onClick={() => {
                                                setResultDropOpen(false);
                                                setSearchQuery("");
                                            }}
                                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary transition-colors border-b border-border last:border-0"
                                        >
                                            <div
                                                className="w-7 h-7 rounded bg-white border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                <img
                                                    src={b.logo}
                                                    alt={b.name}
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = "none";
                                                    }}
                                                />
                                            </div>
                                            <span className="text-sm text-foreground">{b.name}</span>
                                        </Link>
                                    ))
                                )}
                            </div>
                        )}

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

                    <div className="flex items-center gap-5.5 flex-shrink-0 text-sm">
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={handleBellClick}
                                className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors relative"
                            >
                                <Bell size={25}/>
                                <span className="text-[11px]">알림</span>
                                {unreadCount > 0 && (
                                    <span
                                        className="absolute -top-1 -right-1 bg-primary text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount}
                  </span>
                                )}
                            </button>

                            {notifOpen && (
                                <div
                                    className="absolute right-0 top-full mt-2 w-80 bg-white border border-border rounded-lg shadow-xl z-50">
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                                        <span className="font-semibold text-foreground text-sm">알림</span>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={handleMarkAllRead}
                                                disabled={unreadCount === 0}
                                                className="text-xs font-medium text-primary hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-default"
                                            >
                                                전체 읽음
                                            </button>
                                            <button onClick={() => setNotifOpen(false)}
                                                    className="text-muted-foreground hover:text-foreground">
                                                <X size={14}/>
                                            </button>
                                        </div>
                                    </div>
                                    <div
                                        className="divide-y divide-border max-h-96 overflow-y-auto"
                                        onScroll={handleNotifScroll}
                                    >
                                        {notifications.length === 0 ? (
                                            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                                알림이 없습니다.
                                            </div>
                                        ) : (
                                            <>
                                                {notifications.map((n) => {
                                                    const meta = getNotificationMeta(n.type);
                                                    const Icon = meta.icon;
                                                    const isUnread = !n.isRead;
                                                    return (
                                                        <div
                                                            key={n.notificationId}
                                                            onClick={() => handleNotificationItemClick(n)}
                                                            className={`w-full text-left flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors ${isUnread ? "bg-primary/5" : ""}`}
                                                        >
                                                            <div className={`mt-0.5 flex-shrink-0 ${meta.color}`}>
                                                                <Icon size={16}/>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span
                                                                        className={`text-sm font-medium ${isUnread ? "text-foreground" : "text-muted-foreground"}`}>
                                                                        {meta.label}
                                                                    </span>
                                                                    {isUnread && <span
                                                                        className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"/>}
                                                                </div>
                                                                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{n.message}</p>
                                                                <span
                                                                    className="text-[11px] text-muted-foreground mt-1 block">{formatRelativeTime(n.createdAt)}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {isLoadingMore && (
                                                    <div className="px-4 py-3 text-center text-xs text-muted-foreground">
                                                        불러오는 중...
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <Link to="/products/wishlist"
                              className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors relative">
                            <Star size={25}/>
                            <span className="text-[11px]">즐겨찾기</span>
                        </Link>

                        <Link to="/cart"
                              className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors relative">
                            <ShoppingCart size={25}/>
                            <span className="text-[11px]">장바구니</span>
                            <span
                                className="absolute -top-1 -right-1 bg-primary text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                3
              </span>
                        </Link>

                        <Link
                            to={dashboardPath}
                            className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors"
                        >
                            <ClipboardList size={25}/>
                            <span className="text-[11px]">대시보드</span>
                        </Link>

                        <Link to="/mypage"
                              className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors">
                            <User size={25}/>
                            <span className="text-[11px]">{user?.name}</span>
                        </Link>

                        <Link to="/support"
                              className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors">
                            <Info size={25}/>
                            <span className="text-[11px]">고객센터</span>
                        </Link>

                        <button
                            onClick={handleLogout}
                            className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors"
                        >
                            <LogOut size={25}/>
                            <span className="text-[11px]">로그아웃</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                <Outlet/>
            </main>

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
                                    {label: "전체상품", path: "/products"},
                                    {label: "공급업체", path: "/suppliers"},
                                    {label: "셀러 등록", path: "/supplier-register"},
                                    {label: "가입 불가 업태/업종", path: "/restricted-businesses"},
                                ],
                            },
                            {
                                title: "고객 지원",
                                links: [
                                    {label: "공지사항", path: "/support"},
                                    {label: "자주 묻는 질문", path: "/support"},
                                    {label: "1:1 문의", path: "/support"},
                                    {label: "이용 가이드", path: "/support"},
                                ],
                            },
                            {
                                title: "회사 정보",
                                links: [
                                    {label: "회사 소개", path: "/"},
                                    {label: "파트너십", path: "/partner"},
                                    {label: "셀러 파트너 등록", path: "/auth?tab=signup&role=seller"},
                                    {label: "채용 공고", path: "/"},
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
                <MapPin size={11}/>
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