import { useState } from "react";
import { Link } from "react-router";
import { Search, CheckCircle, Star, Filter, MapPin, Plus, Leaf, RefreshCw, Heart, Users, ShieldCheck, FileText } from "lucide-react";

type CertKey = "KC" | "OEKO-TEX" | "GOTS" | "GRS" | "비건" | "Fair Trade" | "REACH" | "CPSIA" | "UKCA" | "어린이안전" | "환경마크" | "섬유품질";

const certConfig: Record<CertKey, { label: string; bg: string; border: string; color: string; iconBg: string; icon: React.ReactNode }> = {
  "KC":        { label: "KC 인증",          bg: "#EEF2FF", border: "#C7D2FE", color: "#3730A3", iconBg: "#4338CA", icon: <span style={{ fontSize: 9, fontWeight: 700 }}>KC</span> },
  "OEKO-TEX": { label: "OEKO-TEX",         bg: "#ECFDF5", border: "#A7F3D0", color: "#065F46", iconBg: "#059669", icon: <CheckCircle size={11} /> },
  "GOTS":      { label: "GOTS",             bg: "#F0FDF4", border: "#BBF7D0", color: "#14532D", iconBg: "#16A34A", icon: <Leaf size={11} /> },
  "GRS":       { label: "GRS",              bg: "#FFFBEB", border: "#FDE68A", color: "#78350F", iconBg: "#D97706", icon: <RefreshCw size={11} /> },
  "비건":      { label: "비건 인증",         bg: "#F5F3FF", border: "#DDD6FE", color: "#4C1D95", iconBg: "#7C3AED", icon: <Heart size={11} /> },
  "Fair Trade":{ label: "Fair Trade",       bg: "#FFF7ED", border: "#FED7AA", color: "#7C2D12", iconBg: "#EA580C", icon: <Users size={11} /> },
  "REACH":     { label: "REACH (EU)",       bg: "#EFF6FF", border: "#BFDBFE", color: "#1E3A8A", iconBg: "#1D4ED8", icon: <span style={{ fontSize: 9, fontWeight: 700 }}>EU</span> },
  "CPSIA":     { label: "CPSIA",            bg: "#FDF2F8", border: "#FBCFE8", color: "#831843", iconBg: "#DB2777", icon: <ShieldCheck size={11} /> },
  "UKCA":      { label: "UKCA (영국)",      bg: "#F8F8FF", border: "#C7C7FE", color: "#1E1E8A", iconBg: "#1E1E8A", icon: <span style={{ fontSize: 9, fontWeight: 700 }}>UK</span> },
  "어린이안전": { label: "어린이 안전인증",  bg: "#FFF1F2", border: "#FECDD3", color: "#881337", iconBg: "#E11D48", icon: <ShieldCheck size={11} /> },
  "환경마크":  { label: "환경마크",          bg: "#F0FDF4", border: "#BBF7D0", color: "#14532D", iconBg: "#15803D", icon: <Leaf size={11} /> },
  "섬유품질":  { label: "섬유품질 적합",     bg: "#EEF2FF", border: "#C7D2FE", color: "#3730A3", iconBg: "#4338CA", icon: <CheckCircle size={11} /> },
};

function CertBadge({ certKey, mini = false }: { certKey: CertKey; mini?: boolean }) {
  const c = certConfig[certKey];
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
  { name: "스타일컴퍼니", location: "서울 동대문", category: "캐주얼/티셔츠", products: 320, years: 12, verified: true, rating: 4.9, moq: "100벌", certs: ["KC", "OEKO-TEX", "GRS"] as CertKey[], desc: "여성 캐주얼 의류 전문 도매업체. 티셔츠·블라우스·니트 라인 강점. OEKO-TEX 인증 소재 사용." },
  { name: "동대문패션", location: "서울 동대문", category: "블라우스/셔츠", products: 580, years: 20, verified: true, rating: 4.9, moq: "50벌", certs: ["KC", "섬유품질", "REACH"] as CertKey[], desc: "린넨·시폰 블라우스 전문 제조도매. 다양한 컬러 구성과 빠른 납기로 바이어 만족도 1위." },
  { name: "코지니트", location: "서울 동대문", category: "니트/스웨터", products: 210, years: 8, verified: true, rating: 4.8, moq: "40벌", certs: ["KC", "GOTS", "비건"] as CertKey[], desc: "니트·가디건·스웨터 전문. 자체 디자인팀 운영. 시즌별 트렌드 반영 빠른 신상 출시." },
  { name: "트렌드하우스", location: "서울 동대문", category: "원피스/세트", products: 430, years: 15, verified: true, rating: 4.8, moq: "30벌", certs: ["KC", "OEKO-TEX", "Fair Trade"] as CertKey[], desc: "원피스·투피스 세트 전문 도매. 플로럴·체크 패턴 강점. 국내외 50개 브랜드 납품 이력." },
  { name: "진워크스", location: "부산 범일동", category: "팬츠/데님", products: 180, years: 18, verified: true, rating: 4.7, moq: "30벌", certs: ["KC", "섬유품질"] as CertKey[], desc: "데님·슬랙스 전문 제조업체. 자체 공장 운영으로 가격 경쟁력 보유. OEM/ODM 가능." },
  { name: "페미닌스타일", location: "서울 동대문", category: "스커트", products: 150, years: 6, verified: true, rating: 4.7, moq: "50벌", certs: ["KC", "OEKO-TEX"] as CertKey[], desc: "미디·플리츠 스커트 전문. 매 시즌 200종 이상 신상 출시. 소량 다품종 대응 가능." },
  { name: "프리미엄어패럴", location: "서울 성수동", category: "아우터/코트", products: 120, years: 22, verified: true, rating: 4.8, moq: "20벌", certs: ["KC", "OEKO-TEX", "REACH", "UKCA"] as CertKey[], desc: "고급 울 코트·트렌치 코트 전문. 백화점 납품 경력 다수. 소재 품질 최상위 등급." },
  { name: "액티브웨어코리아", location: "경기 안양", category: "스포츠/애슬레저", products: 260, years: 10, verified: true, rating: 4.6, moq: "50벌", certs: ["KC", "GRS", "비건"] as CertKey[], desc: "요가·필라테스·러닝 애슬레저 전문. 기능성 원단 자체 개발. 글로벌 스포츠 브랜드 OEM 경험." },
  { name: "세트스타일", location: "서울 동대문", category: "투피스/세트", products: 95, years: 5, verified: false, rating: 4.4, moq: "20세트", certs: ["KC"] as CertKey[], desc: "상하의 코디 세트 전문 신생 업체. 트렌디한 디자인과 합리적인 가격으로 빠르게 성장 중." },
  { name: "영캐주얼하우스", location: "서울 동대문", category: "캐주얼/티셔츠", products: 74, years: 3, verified: false, rating: 4.2, moq: "200벌", certs: [] as CertKey[], desc: "20대 타겟 여성 캐주얼 전문 신생 업체. 트렌드 반응 속도 빠름. 인증 준비 중." },
  { name: "미도패션", location: "서울 동대문", category: "스커트", products: 110, years: 7, verified: false, rating: 4.3, moq: "100벌", certs: [] as CertKey[], desc: "플리츠·랩 스커트 중심 소량 다품종 업체. 빠른 신상 회전율. 현재 인증 미보유." },
  { name: "부산어패럴", location: "부산 범일동", category: "팬츠/데님", products: 88, years: 4, verified: false, rating: 4.1, moq: "50벌", certs: [] as CertKey[], desc: "데님 팬츠 전문 소규모 제조업체. 가격 경쟁력 강점. 인증 절차 진행 예정." },
  { name: "루시패션", location: "경기 안양", category: "블라우스/셔츠", products: 55, years: 2, verified: false, rating: 3.9, moq: "150벌", certs: [] as CertKey[], desc: "시폰·레이스 블라우스 전문 창업 초기 업체. 합리적 단가. 아직 인증 없음." },
];

const categories = ["전체", "캐주얼/티셔츠", "블라우스/셔츠", "니트/스웨터", "원피스/세트", "팬츠/데님", "스커트", "아우터/코트", "스포츠/애슬레저", "투피스/세트"];
const locations = ["전체 지역", "서울 동대문", "서울 성수동", "부산 범일동", "경기 안양"];

export function Suppliers() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("전체");
  const [activeLocation, setActiveLocation] = useState("전체 지역");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

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
            <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
              <div onClick={() => setVerifiedOnly(!verifiedOnly)} className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${verifiedOnly ? "bg-primary" : "bg-[#ddd]"}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${verifiedOnly ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
              인증 업체만
            </label>
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
                  {s.verified && (
                    <div className="flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-green-200">
                      <CheckCircle size={10} /> 인증
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed mb-4">{s.desc}</p>

                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                  <div className="bg-muted rounded p-2">
                    <div className="font-mono font-bold text-sm text-foreground">{s.products.toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground">상품수</div>
                  </div>
                  <div className="bg-muted rounded p-2">
                    <div className="font-mono font-bold text-sm text-foreground">{s.years}년</div>
                    <div className="text-[10px] text-muted-foreground">업력</div>
                  </div>
                  <div className="bg-muted rounded p-2">
                    <div className="font-mono font-bold text-sm text-primary flex items-center justify-center gap-0.5">
                      <Star size={11} fill="currentColor" className="text-accent" />{s.rating}
                    </div>
                    <div className="text-[10px] text-muted-foreground">평점</div>
                  </div>
                </div>

                {/* 인증 배지 */}
                <div className="mb-4">
                  <div className="text-[10px] text-muted-foreground mb-2">보유 인증</div>
                  <div className="flex flex-wrap gap-1.5">
                    {s.certs.map((cert) => (
                      <CertBadge key={cert} certKey={cert} mini />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs bg-secondary text-primary px-2 py-0.5 rounded">{s.category}</span>
                  <span className="text-xs text-muted-foreground">최소 {s.moq}</span>
                </div>

                <Link to="/products" className="w-full border border-primary text-primary hover:bg-primary hover:text-white text-sm py-2 rounded font-medium transition-colors block text-center">
                  업체 상세보기
                </Link>
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
