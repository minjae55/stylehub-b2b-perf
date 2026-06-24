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
    X
} from "lucide-react";
import {useEffect, useRef, useState} from "react";
import {useAuthStore} from "@/store/useAuthStore";
import {logout as apiLogout} from "@/api/auth";
import logoSvg from "@/assets/style_hub_logo.svg";

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
        id: 4,
        icon: Bell,
        color: "text-primary",
        title: "재입고 알림",
        desc: "저장하신 '잉어킹 티셔츠'이(가) 재입고 되었습니다.[바이어]",
        time: "방금 전",
        unread: true,
    },

    {
        id: 5,
        icon: Bell,
        color: "text-primary",
        title: "수량 알림",
        desc: "'피카츄 후드집업'의 재고가 일정 수량 이하로 떨어졌습니다.[셀러]",
        time: "방금 전",
        unread: true,
    },

    {
        id: 5,
        icon: ShieldAlert,
        color: "text-yellow-500",
        title: " 인증서 갱신 필요 ",
        desc: "'고라파덕 후드티' KC인증서 유효기간이 14일 남았습니다.",
        time: "방금 전",
        unread: true,
    },
    {
        id: 6,
        icon: ShieldAlert,
        color: "text-red-500",
        title: " 인증서 갱신 필요 ",
        desc: "'치코리타 백팩' GOTS인증서 유효기간이 7일 남았습니다.",
        time: "방금 전",
        unread: true,
    },

];

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
    const [readIds, setReadIds] = useState<number[]>([]);
    const [, setDismissedIds] = useState<number[]>([]);
    const notifRef = useRef<HTMLDivElement>(null);
    // [추가] 탭 드롭다운과 검색결과 드롭다운 state 분리
    const [searchTab, setSearchTab] = useState<"product" | "category" | "brand">("product");
    const [tabDropOpen, setTabDropOpen] = useState(false);
    const [resultDropOpen, setResultDropOpen] = useState(false);
    const tabDropRef = useRef<HTMLDivElement>(null);
    const resultDropRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const user = useAuthStore((state) => state.user);
    const clearUser = useAuthStore((state) => state.clearUser);

    // 💡 유저의 비즈니스 권한에 따라 대시보드 경로를 동적으로 결정
    // 기본값은 '/' 또는 메인으로 잡고, 권한별 분기 처리
    let dashboardPath = "/";

    if (user?.businessRole === "BUYER") {
        dashboardPath = "/buyer";
    } else if (user?.businessRole === "SELLER") {
        dashboardPath = "/seller";
    } else if (user?.businessRole === "BOTH") {
        // BOTH(통합 관리자)일 경우, 기본적으로 어디를 먼저 보여줄지 기획에 따라 결정하시면 됩니다.
        // 여기서는 기본값을 '/buyer'로 가되, 필요하면 판매자 대시보드로 전환하는 버튼을 화면에 따로 주는 게 정석입니다.
        dashboardPath = "/buyer";
    }

    // 유저가 존재하고, 역할이 PRESIDENT이면서, BusinessRole이 BUYER인 경우에만 true
    const isBuyerPresident = user?.role === "PRESIDENT" && user?.businessRole === "BUYER";
    const handleLogout = async () => {
        try {
            // 1. 백엔드 호출해서 토큰 쿠키 만료시키기
            await apiLogout();
        } catch (error) {
            console.error("로그아웃 API 요청 실패:", error);
        } finally {
            // 2. 💡 쿠키 삭제가 성공하든 에러가 나든 프론트엔드 상태와 로컬스토리지는 무조건 청소!
            clearUser();

            // 3. 로그인 페이지로 튕구기
            navigate("/auth/login");
        }
    };

    const unreadCount = notifications.filter(
        (n) => n.unread && !readIds.includes(n.id)
    ).length;

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

    // [추가] 검색 결과 계산
    const searchResults = searchQuery.trim().length < 1 ? [] : (() => {
        const q = searchQuery.trim().toLowerCase();
        if (searchTab === "product") {
            return searchDummyProducts.filter(p => p.name.toLowerCase().includes(q)).slice(0, 6);
        }
        // [수정] alias 포함 필터링
        if (searchTab === "category") {
            return searchDummyCategories.filter(c =>
                c.name.toLowerCase().includes(q) ||
                c.sub.some(s => s.toLowerCase().includes(q)) ||
                (c.alias ?? []).some(a => a.toLowerCase().includes(q))
            ).slice(0, 6);
        }
        // [수정] 객체 배열로 변경된 브랜드 필터링
        if (searchTab === "brand") {
            return searchDummyBrands.filter(b => b.name.toLowerCase().includes(q)).slice(0, 6);
        }
        return [];
    })();

    return ( //폰트변경
        <div className="min-h-screen bg-background font-[Pretendard,sans-serif] flex flex-col">
            {/* [추가] 셀러 등록 상단 바 */}
            {isBuyerPresident && (<div
                className="bg-primary/10 border-b border-primary/20 py-1.5 text-center text-xs text-primary flex items-center justify-center gap-3">
                <span>🏷️ {user?.name}님! 셀러로 등록하고 전국 바이어와 연결되세요!</span>
                <Link to="/auth?tab=signup&role=seller"
                      className="bg-primary text-white text-[11px] font-semibold px-3 py-0.5 rounded-full hover:bg-primary/80 transition-colors">
                    셀러 등록하기 →
                </Link>
            </div>
            )}
            {/* Main Header */}
            <header className="bg-white shadow-sm sticky top-0 z-50 flex-shrink-0 py-2">
                <div className="max-w-[1280px] mx-auto px-4 py-3 flex justify-between items-center">
                    {/* Logo */}
                    <Link to="/">
                        <img
                            src={logoSvg}
                            alt="StyleHub 로고"
                            className="h-18 w-auto object-contain transform translate-y-[5px]"
                        />
                    </Link>
                    {/* Search Bar */}
                    <div className="flex-1 max-w-[700px] transform translate-y-[8px]">
                        {/* [수정] overflow-hidden 제거 (드롭다운 잘림 방지) */}
                        <div className="flex border-2 border-primary rounded">
                            {/* [수정] 탭 드롭다운 - 별도 ref로 분리 */}
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

                        {/* [추가] 검색 결과 드롭다운 */}
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
                                    // [수정] 이모지 → iconImg로 교체
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
                                    // [수정] 이모지 → 빈 박스 + 로고 이미지로 교체 (이미지 없으면 빈 박스)
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

                    {/* Right Actions */}
                    <div className="flex items-center gap-5.5 flex-shrink-0 text-sm">
                        {/* 알림 */}
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => setNotifOpen((v) => !v)}
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
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={() => setReadIds(notifications.map((n) => n.id))}
                                                    className="text-xs text-primary hover:underline"
                                                >
                                                    모두 읽음
                                                </button>
                                            )}
                                            <button onClick={() => setNotifOpen(false)}
                                                    className="text-muted-foreground hover:text-foreground">
                                                <X size={14}/>
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
                                                        <Icon size={16}/>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2">
                              <span
                                  className={`text-sm font-medium ${isUnread ? "text-foreground" : "text-muted-foreground"}`}>
                                {n.title}
                              </span>
                                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                                {isUnread && <span
                                                                    className="w-1.5 h-1.5 rounded-full bg-primary"/>}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setDismissedIds((prev) => [...prev, n.id]);
                                                                    }}
                                                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                                                >
                                                                    <X size={12}/>
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{n.desc}</p>
                                                        <span
                                                            className="text-[11px] text-muted-foreground mt-1 block">{n.time}</span>
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

                        {/* 즐겨찾기 */}
                        <Link to="/products/wishlist"
                              className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors relative">
                            <Star size={25}/>
                            <span className="text-[11px]">즐겨찾기</span>
                        </Link>

                        {/* 장바구니 */}
                        <Link to="/cart"
                              className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors relative">
                            <ShoppingCart size={25}/>
                            <span className="text-[11px]">장바구니</span>
                            <span
                                className="absolute -top-1 -right-1 bg-primary text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                3
              </span>
                        </Link>

                        {/* 대시보드 */}
                        <Link
                            to={dashboardPath}
                            className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors"
                        >
                            <ClipboardList size={25}/>
                            <span className="text-[11px]">대시보드</span>
                        </Link>

                        {/* 마이 페이지 */}
                        <Link to="/mypage"
                              className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors">
                            <User size={25}/>
                            <span className="text-[11px]">{user?.name}</span>
                        </Link>

                        {/* 마이 페이지 */}
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

            {/* Page Content */}
            <main className="flex-1">
                <Outlet/>
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
