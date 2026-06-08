import { useState } from "react";
import { Link } from "react-router";
import { Search, CheckCircle, Star, Filter, MapPin, Plus, Layers, Leaf, RefreshCw, Heart, Users, ShieldCheck, FileText, TrendingUp, Award, Zap, Clock, Factory} from "lucide-react";

type BadgeKey = "검증업체" | "OEM" | "ODM" | "소량생산" | "자체공장" | "10년+업력" | "재주문율높음" | "빠른출고";

const badgeConfig: Record<BadgeKey, { label: string; bg: string; border: string; color: string; iconBg: string; icon: React.ReactNode }> = {
  "검증업체":   { label: "검증업체",    bg: "#EEF2FF", border: "#C7D2FE", color: "#3730A3", iconBg: "#4338CA", icon: <CheckCircle size={11} /> },
  "OEM":        { label: "OEM",         bg: "#ECFDF5", border: "#A7F3D0", color: "#065F46", iconBg: "#059669", icon: <Layers size={11} /> },
  "ODM":        { label: "ODM",         bg: "#F0FDF4", border: "#BBF7D0", color: "#14532D", iconBg: "#16A34A", icon: <Layers size={11} /> },
  "소량생산":   { label: "소량생산",    bg: "#FFFBEB", border: "#FDE68A", color: "#78350F", iconBg: "#D97706", icon: <Zap size={11} /> },
  "자체공장":   { label: "자체공장",    bg: "#FFF7ED", border: "#FED7AA", color: "#7C2D12", iconBg: "#EA580C", icon: <Factory size={11} /> },
  "10년+업력":  { label: "10년+ 업력",  bg: "#F5F3FF", border: "#DDD6FE", color: "#4C1D95", iconBg: "#7C3AED", icon: <Award size={11} /> },
  "재주문율높음":{ label: "재주문율 높음", bg: "#EFF6FF", border: "#BFDBFE", color: "#1E3A8A", iconBg: "#1D4ED8", icon: <TrendingUp size={11} /> },
  "빠른출고":   { label: "빠른출고",    bg: "#FDF2F8", border: "#FBCFE8", color: "#831843", iconBg: "#DB2777", icon: <Clock size={11} /> },
};

function SupplierBadge({ badgeKey, mini = false }: { badgeKey: BadgeKey; mini?: boolean }) {
  const c = badgeConfig[badgeKey];
  if (!c) return null;
  const pad = mini ? "3px 7px" : "5px 10px";
  const fontSize = mini ? 10 : 11;
  const iconSize = mini ? 16 : 18;
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: pad, borderRadius: 20,
      background: c.bg, border: `0.5px solid ${c.border}`, color: c.color,
      fontSize, fontWeight: 500, whiteSpace: "nowrap",
    }}>
      <span style={{
        background: c.iconBg, color: "#fff", borderRadius: "50%",
        width: iconSize, height: iconSize,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {c.icon}
      </span>
      {c.label}
    </div>
  );
}

const allSuppliers = [
  { name: "스타일컴퍼니",    location: "서울 동대문", category: "캐주얼/티셔츠",   products: 320, years: 12, verified: true,  rating: 4.9, moq: "100벌",  badges: ["검증업체", "OEM", "재주문율높음", "빠른출고"] as BadgeKey[],        desc: "여성 캐주얼 의류 전문 도매업체. 티셔츠·블라우스·니트 라인 강점. 빠른 납기와 높은 재주문율로 신뢰 확보." },
  { name: "동대문패션",       location: "서울 동대문", category: "블라우스/셔츠",   products: 580, years: 20, verified: true,  rating: 4.9, moq: "50벌",   badges: ["검증업체", "10년+업력", "소량생산", "빠른출고"] as BadgeKey[],      desc: "린넨·시폰 블라우스 전문 제조도매. 소량부터 대량까지 유연한 대응. 20년 업력." },
  { name: "코지니트",         location: "서울 동대문", category: "니트/스웨터",     products: 210, years: 8,  verified: true,  rating: 4.8, moq: "40벌",   badges: ["검증업체", "ODM", "소량생산", "재주문율높음"] as BadgeKey[],         desc: "니트·가디건·스웨터 전문. 자체 디자인팀 운영으로 ODM 강점. 시즌별 트렌드 반영." },
  { name: "트렌드하우스",     location: "서울 동대문", category: "원피스/세트",     products: 430, years: 15, verified: true,  rating: 4.8, moq: "30벌",   badges: ["검증업체", "OEM", "ODM", "10년+업력", "재주문율높음"] as BadgeKey[], desc: "원피스·투피스 세트 전문 도매. 국내외 50개 브랜드 납품 이력. OEM/ODM 모두 가능." },
  { name: "진워크스",         location: "부산 범일동", category: "팬츠/데님",       products: 180, years: 18, verified: true,  rating: 4.7, moq: "30벌",   badges: ["검증업체", "자체공장", "OEM", "10년+업력"] as BadgeKey[],            desc: "데님·슬랙스 전문. 자체 공장 운영으로 가격 경쟁력 보유. OEM 생산 가능." },
  { name: "페미닌스타일",     location: "서울 동대문", category: "스커트",          products: 150, years: 6,  verified: true,  rating: 4.7, moq: "50벌",   badges: ["검증업체", "소량생산", "빠른출고"] as BadgeKey[],                    desc: "미디·플리츠 스커트 전문. 매 시즌 200종 이상 신상 출시. 소량 다품종 대응 가능." },
  { name: "프리미엄어패럴",   location: "서울 성수동", category: "아우터/코트",     products: 120, years: 22, verified: true,  rating: 4.8, moq: "20벌",   badges: ["검증업체", "자체공장", "ODM", "10년+업력", "재주문율높음"] as BadgeKey[], desc: "고급 울 코트·트렌치 코트 전문. 자체 공장 보유. 백화점 납품 경력 다수." },
  { name: "액티브웨어코리아", location: "경기 안양",   category: "스포츠/애슬레저", products: 260, years: 10, verified: true,  rating: 4.6, moq: "50벌",   badges: ["검증업체", "OEM", "자체공장", "10년+업력"] as BadgeKey[],            desc: "요가·필라테스·러닝 애슬레저 전문. 기능성 원단 자체 개발. 글로벌 브랜드 OEM 경험." },
  { name: "세트스타일",       location: "서울 동대문", category: "투피스/세트",     products: 95,  years: 5,  verified: false, rating: 4.4, moq: "20세트", badges: ["소량생산", "빠른출고"] as BadgeKey[],                                desc: "상하의 코디 세트 전문 신생 업체. 트렌디한 디자인과 합리적인 가격으로 빠르게 성장 중." },
  { name: "영캐주얼하우스",   location: "서울 동대문", category: "캐주얼/티셔츠",   products: 74,  years: 3,  verified: false, rating: 4.2, moq: "200벌",  badges: ["빠른출고"] as BadgeKey[],                                            desc: "20대 타겟 여성 캐주얼 전문 신생 업체. 트렌드 반응 속도 빠름." },
  { name: "미도패션",         location: "서울 동대문", category: "스커트",          products: 110, years: 7,  verified: false, rating: 4.3, moq: "100벌",  badges: ["소량생산"] as BadgeKey[],                                            desc: "플리츠·랩 스커트 중심 소량 다품종 업체. 빠른 신상 회전율." },
  { name: "부산어패럴",       location: "부산 범일동", category: "팬츠/데님",       products: 88,  years: 4,  verified: false, rating: 4.1, moq: "50벌",   badges: [] as BadgeKey[],                                                      desc: "데님 팬츠 전문 소규모 제조업체. 가격 경쟁력 강점." },
  { name: "루시패션",         location: "경기 안양",   category: "블라우스/셔츠",   products: 55,  years: 2,  verified: false, rating: 3.9, moq: "150벌",  badges: [] as BadgeKey[],                                                      desc: "시폰·레이스 블라우스 전문 창업 초기 업체. 합리적 단가." },
];

const categories = ["전체", "캐주얼/티셔츠", "블라우스/셔츠", "니트/스웨터", "원피스/세트", "팬츠/데님", "스커트", "아우터/코트", "스포츠/애슬레저", "투피스/세트"];
const locations = ["전체 지역", "서울 동대문", "서울 성수동", "부산 범일동", "경기 안양"];

export function Suppliers() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("전체");
  const [activeLocation, setActiveLocation] = useState("전체 지역");
  const [verifiedOnly] = useState(false);

  const filtered = allSuppliers.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.desc.includes(search);
    const matchCat = activeCategory === "전체" || s.category === activeCategory;
    const matchLocation = activeLocation === "전체 지역" || s.location === activeLocation;
    const matchVerified = !verifiedOnly || s.verified;
    return matchSearch && matchCat && matchLocation && matchVerified;
  });

  return (
    <div className="font-[Inter,sans-serif]">
      {/* Hero */}
      <div className="bg-gradient-to-r from-[#1a1a2e] to-[#0f3460] text-white py-12">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="inline-block bg-primary text-xs font-mono px-2 py-1 rounded mb-4 tracking-wider uppercase">공급업체 디렉토리</div>
          <h1 className="text-4xl font-bold mb-3">K-Fashion 인증 공급업체 <span className="text-accent">2,400+</span></h1>
          <p className="text-white/70 mb-6">현장 실사 및 서류 검증을 완료한 신뢰할 수 있는 국내 의류 공급업체를 직접 탐색하세요.</p>
          <div className="flex items-center gap-3">
            <Link to="/supplier-register" className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded font-semibold text-sm transition-colors">
              <Plus size={16} /> 공급업체 등록 신청
            </Link>
            <Link to="/sourcing-request" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white px-5 py-2.5 rounded font-semibold text-sm transition-colors">
              <FileText size={16} /> 소싱 요청
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white border border-border rounded p-5 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center border border-border rounded px-3 py-2 gap-2 flex-1 min-w-[240px]">
              <Search size={15} className="text-muted-foreground" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="업체명, 제품 키워드 검색..." className="text-sm outline-none flex-1" />
            </div>
            <select value={activeLocation} onChange={(e) => setActiveLocation(e.target.value)} className="border border-border rounded px-3 py-2 text-sm outline-none bg-white focus:border-primary">
              {locations.map((l) => <option key={l}>{l}</option>)}
            </select>

            <div className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
              <Filter size={12} /> {filtered.length}개 업체
            </div>
          </div>
          <div className="flex gap-2 mt-4 flex-wrap">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1.5 text-xs rounded border transition-colors ${activeCategory === cat ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Supplier Cards */}
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((s) => (
            <div key={s.name} className="bg-white border border-border rounded overflow-hidden hover:border-primary hover:shadow-md transition-all cursor-pointer group">
              <div className="h-2 bg-gradient-to-r from-primary to-accent" />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{s.name}</h3>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <MapPin size={11} />{s.location}
                    </div>
                  </div>

                </div>

                <p className="text-xs text-muted-foreground leading-relaxed mb-4">{s.desc}</p>

                <div className="grid grid-cols-2 gap-2 text-center mb-4">
                  <div className="bg-muted rounded p-2">
                    <div className="font-mono font-bold text-sm text-foreground">{s.products.toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground">상품수</div>
                  </div>
                  <div className="bg-muted rounded p-2">
                    <div className="font-mono font-bold text-sm text-foreground">{s.years}년</div>
                    <div className="text-[10px] text-muted-foreground">업력</div>
                  </div>
                </div>

                {/* 역량 배지 */}
                {s.badges.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {s.badges.map((badge) => (
                      <SupplierBadge key={badge} badgeKey={badge} mini />
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs bg-secondary text-primary px-2 py-0.5 rounded">{s.category}</span>
                  <span className="text-xs text-muted-foreground">최소 {s.moq}</span>
                </div>


              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <div className="text-4xl mb-3">🔍</div>
            <div className="font-medium">검색 결과가 없습니다</div>
            <div className="text-sm mt-1">다른 키워드나 필터를 사용해보세요</div>
          </div>
        )}
      </div>
    </div>
  );
}
