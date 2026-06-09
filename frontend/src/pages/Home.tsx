import { useState } from "react";
import { Link } from "react-router";
import {
  Package,
  Truck,
  Shield,
  Bookmark,
  ChevronRight,
  ArrowRight,
  TrendingUp,
  Award,
  CheckCircle,
  ShoppingCart,
  Tag,
} from "lucide-react";

const categories = [
  {
    name: "상의",
    id: "tops",
    icon: "👕",
    sub: ["티셔츠/탑", "블라우스/셔츠", "니트/스웨터", "후드/맨투맨"],
    products: [
      { id: 101, name: "여성 린넨 블라우스", price: "₩8,900", moq: "50벌", image: "https://images.unsplash.com/photo-1594938298603-c8148c4b2e8e?w=200&h=150&fit=crop" },
      { id: 102, name: "크롭 반팔 티셔츠", price: "₩5,500", moq: "100벌", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&h=150&fit=crop" },
      { id: 103, name: "오버핏 줄무늬 티", price: "₩7,200", moq: "60벌", image: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=200&h=150&fit=crop" },
      { id: 104, name: "실크 새틴 블라우스", price: "₩14,500", moq: "30벌", image: "https://images.unsplash.com/photo-1562572159-4efc207f5aff?w=200&h=150&fit=crop" },
    ]
  },
  {
    name: "하의",
    id: "bottoms",
    icon: "👖",
    sub: ["팬츠/슬랙스", "스커트", "진/데님", "레깅스"],
    products: [
      { id: 201, name: "와이드 슬랙스", price: "₩15,800", moq: "40벌", image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=200&h=150&fit=crop" },
      { id: 202, name: "하이웨이스트 미니스커트", price: "₩9,500", moq: "80벌", image: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=200&h=150&fit=crop" },
      { id: 203, name: "스트레이트 데님 팬츠", price: "₩18,000", moq: "30벌", image: "https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=200&h=150&fit=crop" },
      { id: 204, name: "플리츠 롱스커트", price: "₩12,000", moq: "50벌", image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=200&h=150&fit=crop" },
    ]
  },
  {
    name: "원피스/세트",
    id: "dresses",
    icon: "👗",
    sub: ["원피스", "투피스세트", "점프수트", "코디세트"],
    products: [
      { id: 301, name: "플로럴 랩 원피스", price: "₩22,000", moq: "30벌", image: "https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=200&h=150&fit=crop" },
      { id: 302, name: "린넨 셔츠원피스", price: "₩18,500", moq: "40벌", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&h=150&fit=crop" },
      { id: 303, name: "체크 투피스 세트", price: "₩28,000", moq: "20세트", image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=200&h=150&fit=crop" },
      { id: 304, name: "점프수트 와이드", price: "₩25,000", moq: "25벌", image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=200&h=150&fit=crop" },
    ]
  },
  {
    name: "아우터",
    id: "outerwear",
    icon: "🧥",
    sub: ["코트", "재킷/점퍼", "가디건", "패딩/베스트"],
    products: [
      { id: 401, name: "울 혼방 롱코트", price: "₩58,000", moq: "20벌", image: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=200&h=150&fit=crop" },
      { id: 402, name: "오버핏 데님 자켓", price: "₩32,000", moq: "30벌", image: "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=200&h=150&fit=crop" },
      { id: 403, name: "크롭 가디건", price: "₩18,000", moq: "50벌", image: "https://images.unsplash.com/photo-1609873814058-a8928924184a?w=200&h=150&fit=crop" },
      { id: 404, name: "경량 패딩 조끼", price: "₩24,000", moq: "40벌", image: "https://images.unsplash.com/photo-1547638375-ebf04735d792?w=200&h=150&fit=crop" },
    ]
  },
  {
    name: "이너/언더웨어",
    id: "innerwear",
    icon: "🩱",
    sub: ["이너웨어", "브라/속옷", "잠옷/홈웨어", "수영복"],
    products: [
      { id: 501, name: "면 이너 민소매 (3팩)", price: "₩9,900", moq: "100세트", image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=200&h=150&fit=crop" },
      { id: 502, name: "파자마 세트 (상하의)", price: "₩24,000", moq: "30세트", image: "https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=200&h=150&fit=crop" },
      { id: 503, name: "홈웨어 루즈핏 세트", price: "₩19,500", moq: "40세트", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&h=150&fit=crop" },
      { id: 504, name: "원피스 수영복", price: "₩28,000", moq: "20벌", image: "https://images.unsplash.com/photo-1520975667082-a38a5ca4e50c?w=200&h=150&fit=crop" },
    ]
  },
  {
    name: "스포츠/애슬레저",
    id: "sports",
    icon: "🏃",
    sub: ["스포츠탑", "스포츠레깅스", "트레이닝복", "요가복"],
    products: [
      { id: 601, name: "하이웨이스트 요가 레깅스", price: "₩22,000", moq: "50벌", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&h=150&fit=crop" },
      { id: 602, name: "스포츠 브라탑", price: "₩14,500", moq: "80벌", image: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=200&h=150&fit=crop" },
      { id: 603, name: "트레이닝 세트 (상하의)", price: "₩38,000", moq: "30세트", image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&h=150&fit=crop" },
      { id: 604, name: "집업 자켓 (기능성)", price: "₩32,000", moq: "25벌", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=150&fit=crop" },
    ]
  },
  {
    name: "액세서리",
    id: "accessories",
    icon: "👜",
    sub: ["가방/백", "스카프/모자", "벨트/양말", "쥬얼리"],
    products: [
      { id: 701, name: "에코백 캔버스 토트", price: "₩12,000", moq: "100개", image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=200&h=150&fit=crop" },
      { id: 702, name: "버킷햇 (여름용)", price: "₩8,500", moq: "80개", image: "https://images.unsplash.com/photo-1520975861611-9272f9c2a78c?w=200&h=150&fit=crop" },
      { id: 703, name: "체인 숄더백", price: "₩35,000", moq: "30개", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200&h=150&fit=crop" },
      { id: 704, name: "실크 스카프", price: "₩15,000", moq: "50개", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200&h=150&fit=crop" },
    ]
  },
  {
    name: "신발",
    id: "shoes",
    icon: "👠",
    sub: ["스니커즈", "힐/구두", "부츠/앵클부츠", "샌들/슬리퍼"],
    products: [
      { id: 801, name: "플랫폼 스니커즈", price: "₩38,000", moq: "30켤레", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=150&fit=crop" },
      { id: 802, name: "블록힐 뮬", price: "₩42,000", moq: "25켤레", image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=200&h=150&fit=crop" },
      { id: 803, name: "앵클 첼시 부츠", price: "₩65,000", moq: "20켤레", image: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=200&h=150&fit=crop" },
      { id: 804, name: "스트랩 샌들 (여름)", price: "₩28,000", moq: "40켤레", image: "https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=200&h=150&fit=crop" },
    ]
  },
];

const featuredProducts = [
  { id: 1, name: "여성 린넨 블라우스 (7컬러)", supplier: "동대문패션(주)", price: "₩8,900", unit: "/벌", moq: "50벌", image: "https://images.unsplash.com/photo-1594938298603-c8148c4b2e8e?w=320&h=240&fit=crop&auto=format", verified: true, bookmarked: false },
  { id: 2, name: "와이드 슬랙스 스트레이트", supplier: "스타일컴퍼니", price: "₩15,800", unit: "/벌", moq: "40벌", image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=320&h=240&fit=crop&auto=format", verified: true, bookmarked: true },
  { id: 3, name: "플로럴 랩 원피스 (5컬러)", supplier: "트렌드하우스", price: "₩22,000", unit: "/벌", moq: "30벌", image: "https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=320&h=240&fit=crop&auto=format", verified: true, bookmarked: false },
  { id: 4, name: "울 혼방 오버핏 롱코트", supplier: "프리미엄어패럴", price: "₩58,000", unit: "/벌", moq: "20벌", image: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=320&h=240&fit=crop&auto=format", verified: true, bookmarked: false },
  { id: 5, name: "하이웨이스트 요가 레깅스", supplier: "액티브웨어코리아", price: "₩22,000", unit: "/벌", moq: "50벌", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=320&h=240&fit=crop&auto=format", verified: true, bookmarked: true },
  { id: 6, name: "체인 미니 숄더백 (4컬러)", supplier: "패션액세서리몰", price: "₩35,000", unit: "/개", moq: "30개", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=320&h=240&fit=crop&auto=format", verified: false, bookmarked: false },
];

const suppliers = [
  { name: "동대문패션(주)", category: "상의/하의", products: 842, years: 18, verified: true },
  { name: "트렌드하우스", category: "원피스/세트", products: 560, years: 12, verified: true },
  { name: "프리미엄어패럴", category: "아우터", products: 320, years: 22, verified: true },
  { name: "액티브웨어코리아", category: "스포츠/애슬레저", products: 215, years: 8, verified: true },
];

const fashionServices = [
  { icon: <Package size={32} />, title: "도매 직거래", desc: "동대문 셀러와 전국 바이어 직접 연결", detail: "중간 유통 마진 없음", path: "/products" },
  { icon: <Truck size={32} />, title: "빠른 배송", desc: "주문 확정 후 2~3일 이내 전국 배송", detail: "당일·익일 발송 가능 업체 표시", path: "/suppliers" },
  { icon: <Shield size={32} />, title: "안전 결제", desc: "에스크로 기반 구매 안전 보장", detail: "100% 환불 보증 시스템", path: "/support" },
  { icon: <Tag size={32} />, title: "시즌 할인", desc: "대량 주문 시 추가 할인 협의 가능", detail: "MOQ 조건부 특가 제공", path: "/products" },
];

export function Home() {
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);
  const [bookmarks, setBookmarks] = useState<number[]>(featuredProducts.filter(p => p.bookmarked).map(p => p.id));
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const toggleBookmark = (id: number) => {
    setBookmarks(prev =>
      prev.includes(id) ? prev.filter(bid => bid !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-5">
      {/* Hero + Category Grid */}
      <div className="grid grid-cols-[220px_1fr_200px] gap-4 mb-6">
        {/* Left: Category Menu */}
        <div className="bg-white rounded border border-border overflow-hidden relative">
          <div className="bg-primary text-white px-4 py-2.5 text-sm font-semibold">전체 카테고리</div>
          {categories.map((cat) => (
            <div key={cat.name} className="relative border-b border-muted last:border-0">
              <div className={`flex items-center gap-2.5 transition-colors ${activeCat === cat.name ? "bg-secondary text-primary" : "hover:bg-secondary hover:text-primary"}`}>
                <Link
                  to={`/products?category=${cat.id}`}
                  className="flex-1 flex items-center gap-2.5 px-4 py-2.5 text-sm text-left"
                >
                  <span className="text-base">{cat.icon}</span>
                  <span className="flex-1 font-medium">{cat.name}</span>
                </Link>
                <button
                  onClick={() => setActiveCat(activeCat === cat.name ? null : cat.name)}
                  className="px-3 py-2.5"
                >
                  <ChevronRight size={13} className={`transition-transform ${activeCat === cat.name ? "rotate-90 text-primary" : "text-muted-foreground"}`} />
                </button>
              </div>
              {activeCat === cat.name && (
              <div className="flex absolute left-full top-0 bg-white border border-border shadow-lg z-30 min-w-[720px] p-5 gap-5">
                {/* Sub Categories */}
                <div className="w-[180px] flex-shrink-0 border-r border-border pr-5">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">세부 카테고리</div>
                  <div className="space-y-1">
                    {cat.sub.map((s) => (
                      <Link
                        key={s}
                        to={`/products?category=${cat.id}&q=${encodeURIComponent(s)}`}
                        onClick={() => setActiveCat(null)}
                        className="block px-3 py-2 text-sm rounded hover:bg-secondary hover:text-primary transition-colors"
                      >{s}</Link>
                    ))}
                    <Link
                      to={`/products?category=${cat.id}`}
                      onClick={() => setActiveCat(null)}
                      className="block px-3 py-2 text-sm rounded text-primary font-semibold hover:bg-secondary transition-colors mt-1"
                    >전체 보기 →</Link>
                  </div>
                </div>

                {/* Product List */}
                <div className="flex-1">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">인기 상품</div>
                  <div className="grid grid-cols-2 gap-3">
                    {cat.products.map((product) => (
                      <Link
                        key={product.id}
                        to={`/product/${product.id}`}
                        onClick={() => setActiveCat(null)}
                        className="flex gap-3 p-2 rounded border border-transparent hover:border-primary hover:bg-secondary/50 transition-all group/item"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-foreground line-clamp-2 leading-snug mb-1 group-hover/item:text-primary">{product.name}</h4>
                          <div className="text-primary font-bold text-sm">{product.price}</div>
                          <div className="text-xs text-muted-foreground">MOQ {product.moq}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              )}
            </div>
          ))}
        </div>

        {/* Center: Hero Banner */}
        <div className="relative rounded overflow-hidden bg-gradient-to-br from-[#1a0e2e] to-[#2d1a4e] min-h-[400px] flex flex-col justify-end">
          <img
            src="https://images.unsplash.com/photo-1490481703813-8a8d0912db7e?w=800&h=420&fit=crop&auto=format"
            alt="StyleHub 국내 여성복 B2B 도매 플랫폼"
            className="absolute inset-0 w-full h-full object-cover opacity-35"
          />
          <div className="relative z-10 p-8">
            <div className="inline-block bg-primary text-white text-xs font-mono px-2 py-1 rounded mb-3 tracking-wider uppercase">국내 패션 B2B 도매</div>
            <h1 className="text-white text-3xl font-bold leading-tight mb-3">
              국내 여성복 도매,<br />
              <span className="text-accent">스타일허브에서 한 번에</span>
            </h1>
            <p className="text-[#ccc] text-sm mb-5 max-w-md">
              동대문 패션 셀러와 전국 바이어를 직접 연결합니다. 중간 유통 없이 합리적인 가격으로 최신 트렌드 의류를 도매로 구매하세요.
            </p>
            <div className="flex gap-3">
              <Link to="/products" className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded text-sm font-semibold transition-colors">
                전체 상품 보기
              </Link>
            </div>
          </div>
          <div className="relative z-10 border-t border-white/10 bg-black/30 backdrop-blur-sm grid grid-cols-3 divide-x divide-white/10">
            {[
              { label: "등록 셀러", value: "1,200+" },
              { label: "취급 아이템", value: "8만+" },
              { label: "월 거래액", value: "₩85억+" },
            ].map((stat) => (
              <div key={stat.label} className="py-3 text-center">
                <div className="text-accent font-bold text-lg font-mono">{stat.value}</div>
                <div className="text-[#aaa] text-xs">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Quick Links */}
        <div className="flex flex-col gap-3">
          <div className="bg-white rounded border border-border p-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">내 계정</div>
            <Link to="/auth" className="w-full bg-primary text-white text-sm font-semibold py-2 rounded hover:bg-primary/90 transition-colors mb-2 block text-center">파트너십 등록</Link>
            <Link to="/auth?tab=signup&role=seller" className="block w-full text-center bg-accent hover:bg-accent/90 text-white text-xs font-semibold py-2 rounded transition-colors">셀러 등록하기</Link>
         
          </div>
          <div className="bg-secondary rounded border border-primary/20 p-4">
            <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-1">
              <TrendingUp size={12} /> 이번 주 인기
            </div>
            {["여성 린넨 블라우스", "와이드 슬랙스", "플로럴 원피스", "오버핏 코트", "요가 레깅스", "카와이다케쟈다메데스까", "비기 제1장 집 가버리기", "블랙 패턴 셔츠"].map((item, i) => (
              <div key={item} className="flex items-center gap-2 py-1.5 border-b border-primary/20 last:border-0 text-sm">
                <span className={`font-mono text-[11px] font-bold w-4 ${i < 3 ? "text-primary" : "text-muted-foreground"}`}>{i + 1}</span>
                <a href="#" className="hover:text-primary transition-colors">{item}</a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fashion Services */}
      <section className="mb-6">
        <div className="grid grid-cols-4 gap-4">
          {fashionServices.map((svc) => (
            <Link key={svc.title} to={svc.path} className="bg-white rounded border border-border p-5 hover:border-primary hover:shadow-md transition-all group cursor-pointer">
              <div className="text-primary mb-3 group-hover:scale-110 transition-transform inline-block">{svc.icon}</div>
              <h3 className="font-semibold text-foreground mb-1">{svc.title}</h3>
              <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{svc.desc}</p>
              <p className="text-xs text-primary font-mono">{svc.detail}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">추천 상품</h2>
          <Link to="/products" className="text-sm text-primary hover:underline flex items-center gap-1">전체보기 <ArrowRight size={14} /></Link>
        </div>
        <div className="grid grid-cols-6 gap-4">
          {featuredProducts.map((product) => (
            <div
              key={product.id}
              onMouseEnter={() => setHoveredProduct(product.id)}
              onMouseLeave={() => setHoveredProduct(null)}
              className="bg-white rounded border border-border overflow-hidden hover:shadow-lg hover:border-primary/40 transition-all"
            >
              <Link to={`/product/${product.id}`} className="block">
                <div className="relative overflow-hidden bg-muted">
                  <img src={product.image} alt={product.name} className={`w-full h-40 object-cover transition-transform duration-300 ${hoveredProduct === product.id ? "scale-105" : ""}`} />
                  {product.verified && (
                    <div className="absolute top-2 left-2 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded font-semibold">인증</div>
                  )}
                </div>
                <div className="p-3">
                  <div className="text-xs text-muted-foreground mb-1 truncate">{product.supplier}</div>
                  <h4 className="text-sm font-medium text-foreground mb-2 line-clamp-2 leading-snug">{product.name}</h4>
                  <div className="text-primary font-bold text-base">{product.price}<span className="text-xs font-normal text-muted-foreground">{product.unit}</span></div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-muted-foreground">최소 {product.moq}</span>
                  </div>
                </div>
              </Link>
              <div className="px-3 pb-3 flex items-center justify-between">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleBookmark(product.id); }}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Bookmark size={14} className={bookmarks.includes(product.id) ? "fill-primary text-primary" : ""} />
                </button>
                <Link to="/cart" className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors text-xs">
                  <ShoppingCart size={12} /> 담기
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Suppliers + Why Us */}
      <div className="grid grid-cols-[1fr_340px] gap-4 mb-6">
        <section className="bg-white rounded border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <h2 className="font-bold text-foreground flex items-center gap-2"><Award size={16} className="text-primary" />인증 셀러</h2>
            <Link to="/suppliers" className="text-xs text-primary hover:underline">더보기</Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
                <th className="px-5 py-2.5 text-left font-medium">업체명</th>
                <th className="px-3 py-2.5 text-left font-medium">카테고리</th>
                <th className="px-3 py-2.5 text-right font-mono font-medium">상품수</th>
                <th className="px-3 py-2.5 text-right font-mono font-medium">업력</th>
                <th className="px-5 py-2.5 text-center font-medium">인증</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s, i) => (
                <tr key={s.name} className={`border-t border-border hover:bg-secondary transition-colors ${i % 2 === 0 ? "" : "bg-muted/30"}`}>
                  <td className="px-5 py-3 font-medium text-foreground hover:text-primary cursor-pointer">{s.name}</td>
                  <td className="px-3 py-3"><span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded">{s.category}</span></td>
                  <td className="px-3 py-3 text-right font-mono text-muted-foreground">{s.products.toLocaleString()}</td>
                  <td className="px-3 py-3 text-right font-mono text-muted-foreground">{s.years}년</td>
                  <td className="px-5 py-3 text-center">{s.verified && <CheckCircle size={16} className="text-green-500 mx-auto" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="bg-white rounded border border-border p-5">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2"><Shield size={16} className="text-primary" />스타일허브를 선택하는 이유</h2>
          <div className="space-y-4">
            {[
              { icon: <Shield size={18} />, title: "안전 결제 보장", desc: "에스크로 기반 결제로 사기 위험 Zero" },
              { icon: <CheckCircle size={18} />, title: "인증 셀러만 입점", desc: "사업자등록 확인 완료된 신뢰 업체만 등록" },
              { icon: <Truck size={18} />, title: "빠른 국내 배송", desc: "주문 확정 후 2~3일 이내 전국 배송" },
              { icon: <Tag size={18} />, title: "도매 최저가", desc: "중간 유통 단계 없는 합리적인 도매가" },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 group">
                <div className="text-primary mt-0.5 flex-shrink-0">{item.icon}</div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{item.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Banner Strip */}
    </div>
  );
}
