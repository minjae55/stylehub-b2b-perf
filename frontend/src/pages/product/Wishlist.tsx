import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import api from "../../api/axios";
import { Heart, ShoppingCart, Search, Grid3x3, List, ChevronDown } from "lucide-react";

interface ProductSummary {
  productId: number;
  productName: string;
  productEngName: string;
  brandId: number;
  brandName: string;
  categoryId: number;
  categoryName: string;
  unitPrice: number;
  moq: number;
  oemAvailable: boolean;
  sampleAvailable: boolean;
  mainImageUrl: string | null;
  createdAt: string;
}

const categories = [
  { id: "all", name: "전체", subCategories: [] },
  { id: "tops", name: "상의", subCategories: ["티셔츠/탑", "블라우스/셔츠", "니트/스웨터", "후드/맨투맨", "재킷/블레이저"] },
  { id: "bottoms", name: "하의", subCategories: ["팬츠/슬랙스", "스커트", "진/데님", "레깅스", "반바지"] },
  { id: "dresses", name: "원피스/세트", subCategories: ["원피스", "점프수트", "투피스세트"] },
  { id: "outerwear", name: "아우터", subCategories: ["코트", "재킷/점퍼", "가디건", "패딩"] },
  { id: "innerwear", name: "이너/언더웨어", subCategories: ["이너웨어", "속옷", "잠옷/홈웨어"] },
  { id: "sports", name: "스포츠/애슬레저", subCategories: ["스포츠탑", "스포츠레깅스", "트레이닝복", "스포츠세트"] },
  { id: "accessories", name: "액세서리", subCategories: ["가방/백", "모자", "스카프/머플러", "벨트", "양말/타이즈"] },
  { id: "shoes", name: "신발", subCategories: ["스니커즈", "부츠/앵클부츠", "플랫/로퍼", "힐/펌프스"] },
];

const categoryIdMap: Record<string, string> = {
  tops: "상의", bottoms: "하의", dresses: "원피스/세트", outerwear: "아우터",
  innerwear: "이너/언더웨어", sports: "스포츠/애슬레저", accessories: "액세서리", shoes: "신발",
};

const searchDummyCategories = [
  { id: "tops", name: "상의", iconImg: "/images/top.png", alias: [], subCategories: ["티셔츠/탑", "블라우스/셔츠", "니트/스웨터", "후드/맨투맨", "재킷/블레이저"] },
  { id: "bottoms", name: "하의", iconImg: "/images/bottom.png", alias: ["치마", "바지"], subCategories: ["팬츠/슬랙스", "스커트", "진/데님", "레깅스", "반바지"] },
  { id: "dresses", name: "원피스/세트", iconImg: "/images/one_piece.png", alias: [], subCategories: ["원피스", "점프수트", "투피스세트"] },
  { id: "outerwear", name: "아우터", iconImg: "/images/outer.png", alias: ["겉옷", "잠바", "코트", "재킷", "가디건"], subCategories: ["코트", "재킷/점퍼", "가디건", "패딩"] },
  { id: "innerwear", name: "이너/언더웨어", iconImg: "/images/inner.png", alias: ["속옷", "잠옷"], subCategories: ["이너웨어", "속옷", "잠옷/홈웨어"] },
  { id: "sports", name: "스포츠/애슬레저", iconImg: "/images/sports.png", alias: ["스포츠", "운동복"], subCategories: ["스포츠탑", "스포츠레깅스", "트레이닝복", "스포츠세트"] },
  { id: "accessories", name: "액세서리", iconImg: "/images/accessory.png", alias: ["악세서리"], subCategories: ["가방/백", "모자", "스카프/머플러", "벨트", "양말/타이즈"] },
  { id: "shoes", name: "신발", iconImg: "/images/shoes.png", alias: ["구두", "운동화"], subCategories: ["스니커즈", "부츠/앵클부츠", "플랫/로퍼", "힐/펌프스"] },
];

const searchDummyBrands = [
  { name: "동대문패션", logo: "/images/brands/ddm.png" },
  { name: "스타일컴퍼니", logo: "/images/brands/style.png" },
  { name: "엘레강스모드", logo: "/images/brands/elegance.png" },
  { name: "트렌드하우스", logo: "/images/brands/trend.png" },
  { name: "페미닌스타일", logo: "/images/brands/feminine.png" },
  { name: "내추럴보이", logo: "/images/brands/natural.png" },
  { name: "세트스타일", logo: "/images/brands/set.png" },
  { name: "코지니트", logo: "/images/brands/cozy.png" },
  { name: "캐주얼하우스", logo: "/images/brands/casual.png" },
  { name: "진워크스", logo: "/images/brands/jean.png" },
  { name: "프리미엄어패럴", logo: "/images/brands/premium.png" },
  { name: "액티브웨어코리아", logo: "/images/brands/active.png" },
  { name: "스포츠라이프", logo: "/images/brands/sportslife.png" },
  { name: "베이직이너", logo: "/images/brands/basic.png" },
  { name: "코지홈", logo: "/images/brands/cozyhome.png" },
  { name: "패션액세서리몰", logo: "/images/brands/acc.png" },
  { name: "슈즈마켓", logo: "/images/brands/shoes.png" },
];

const CHOSUNG = ["전체", "ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
function getChosung(str: string): string {
  const code = str.charCodeAt(0) - 0xAC00;
  if (code < 0) return str[0];
  return ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"][Math.floor(code / (21 * 28))];
}

const brandPanelCategories = [
  { id: "all", name: "전체" }, { id: "tops", name: "상의" }, { id: "bottoms", name: "하의" },
  { id: "dresses", name: "원피스/세트" }, { id: "outerwear", name: "아우터" },
  { id: "innerwear", name: "이너/언더웨어" }, { id: "sports", name: "스포츠/애슬레저" },
  { id: "accessories", name: "액세서리" }, { id: "shoes", name: "신발" },
];

const brandsByCategory: Record<string, string[]> = {
  all: [], tops: ["동대문패션", "스타일컴퍼니", "캐주얼하우스", "엘레강스모드", "코지니트", "내추럴보이", "트렌드하우스"],
  bottoms: ["스타일컴퍼니", "트렌드하우스", "진워크스", "페미닌스타일"],
  dresses: ["트렌드하우스", "내추럴보이", "세트스타일"],
  outerwear: ["프리미엄어패럴", "진워크스", "코지니트"],
  innerwear: ["베이직이너", "코지홈"], sports: ["액티브웨어코리아", "스포츠라이프"],
  accessories: ["패션액세서리몰"], shoes: ["슈즈마켓"],
};

function BrandPanel({ allBrands, selectedBrand, onSelect, onClear }: {
  allBrands: { name: string; logo: string }[];
  selectedBrand: string;
  onSelect: (name: string) => void;
  onClear: () => void;
}) {
  const [chosung, setChosung] = useState("전체");
  const [panelCat, setPanelCat] = useState("all");
  const [visibleCount, setVisibleCount] = useState(10);
  const scrollRef = useRef<HTMLDivElement>(null);

  const catFiltered = panelCat === "all" ? allBrands : allBrands.filter(b => (brandsByCategory[panelCat] ?? []).includes(b.name));
  const chosungFiltered = chosung === "전체" ? catFiltered : catFiltered.filter(b => getChosung(b.name) === chosung);
  const visible = chosungFiltered.slice(0, visibleCount);

  return (
      <div className="absolute left-full top-0 ml-2 bg-white border border-border rounded-lg shadow-xl z-30 flex flex-col" style={{ width: "420px" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <span className="text-sm font-bold text-foreground">브랜드 선택</span>
          {selectedBrand && <button onClick={onClear} className="text-xs text-primary hover:underline">선택 해제</button>}
        </div>
        <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-border flex-shrink-0">
          {CHOSUNG.map((c) => (
              <button key={c} onClick={() => { setChosung(c); setVisibleCount(10); }}
                      className={`text-xs px-2 py-1 rounded transition-colors ${chosung === c ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-primary"}`}>
                {c}
              </button>
          ))}
        </div>
        <div className="flex flex-1 min-h-0" style={{ maxHeight: "360px" }}>
          <div className="w-28 border-r border-border flex-shrink-0 overflow-y-auto">
            {brandPanelCategories.map((cat) => (
                <button key={cat.id} onClick={() => { setPanelCat(cat.id); setVisibleCount(10); }}
                        className={`w-full text-left px-3 py-2.5 text-xs transition-colors border-b border-border ${panelCat === cat.id ? "bg-primary text-white font-semibold" : "text-foreground hover:bg-secondary"}`}>
                  {cat.name}
                </button>
            ))}
          </div>
          <div ref={scrollRef} onScroll={() => { const el = scrollRef.current; if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 10) setVisibleCount(v => v + 10); }} className="flex-1 overflow-y-auto">
            {visible.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">해당 브랜드가 없습니다</div>
            ) : visible.map((brand) => (
                <button key={brand.name} onClick={() => onSelect(selectedBrand === brand.name ? "" : brand.name)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 border-b border-border transition-colors text-left ${selectedBrand === brand.name ? "bg-primary/10 text-primary" : "hover:bg-secondary text-foreground"}`}>
                  <div className="w-8 h-8 rounded bg-white border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                  <span className="text-sm">{brand.name}</span>
                  {selectedBrand === brand.name && <span className="ml-auto text-primary font-bold text-xs">✓</span>}
                </button>
            ))}
          </div>
        </div>
      </div>
  );
}

export function Wishlist() {
  const [favorites, setFavorites] = useState<number[]>(() => {
    const saved = localStorage.getItem("wishlist");
    return saved ? JSON.parse(saved) : [];
  });
  const [allProducts, setAllProducts] = useState<ProductSummary[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [brandPanelOpen, setBrandPanelOpen] = useState(false);
  const brandPanelRef = useRef<HTMLDivElement>(null);
  const [searchTab, setSearchTab] = useState<"product" | "category" | "brand">("product");
  const [tabDropOpen, setTabDropOpen] = useState(false);
  const [resultDropOpen, setResultDropOpen] = useState(false);
  const tabDropRef = useRef<HTMLDivElement>(null);
  const resultDropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get("/products").then(res => setAllProducts(res)).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tabDropRef.current && !tabDropRef.current.contains(e.target as Node)) setTabDropOpen(false);
      if (resultDropRef.current && !resultDropRef.current.contains(e.target as Node)) setResultDropOpen(false);
      if (brandPanelRef.current && !brandPanelRef.current.contains(e.target as Node)) setBrandPanelOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const searchResults = searchQuery.trim().length < 1 ? [] : (() => {
    const q = searchQuery.trim().toLowerCase();
    if (searchTab === "product") return allProducts.filter(p => p.productName.toLowerCase().includes(q) || p.brandName.toLowerCase().includes(q)).slice(0, 6);
    if (searchTab === "category") return searchDummyCategories.filter(c => c.name.toLowerCase().includes(q) || c.subCategories.some(s => s.toLowerCase().includes(q)) || (c.alias ?? []).some(a => a.toLowerCase().includes(q))).slice(0, 6);
    if (searchTab === "brand") return searchDummyBrands.filter(b => b.name.toLowerCase().includes(q)).slice(0, 6);
    return [];
  })();

  const wishlistProducts = allProducts.filter((p) => {
    const isFav = favorites.includes(p.productId);
    const matchCategory = selectedCategory === "all" || p.categoryName === categoryIdMap[selectedCategory];
    const matchBrand = !selectedBrand || p.brandName === selectedBrand;
    const matchSearch = !searchQuery || p.productName.toLowerCase().includes(searchQuery.toLowerCase()) || p.brandName.toLowerCase().includes(searchQuery.toLowerCase());
    return isFav && matchCategory && matchBrand && matchSearch;
  });

  const removeFromWishlist = (productId: number) => {
    setFavorites((prev) => {
      const next = prev.filter((id) => id !== productId);
      localStorage.setItem("wishlist", JSON.stringify(next));
      return next;
    });
  };

  const handleCategoryChange = (catId: string) => {
    if (catId === "all") { setExpandedCategory(null); setSelectedSubCategory(""); setSelectedCategory("all"); return; }
    if (expandedCategory === catId) setExpandedCategory(null);
    else setExpandedCategory(catId);
    setSelectedCategory(catId);
    setSelectedSubCategory("");
  };

  return (
      <div className="max-w-[1480px] mx-auto px-4 py-8 font-[Inter,sans-serif]">
        <div className="mb-8 flex items-center gap-3">
          <Heart size={24} className="text-primary fill-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">찜 목록</h1>
            <p className="text-sm text-muted-foreground mt-0.5">총 <span className="font-bold text-foreground">{wishlistProducts.length}</span>개 상품</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white border border-border rounded-lg p-4 mb-6 flex items-center gap-4">
          <div className="flex-1 relative">
            <div className="flex border border-border rounded-lg">
              <div className="relative" ref={tabDropRef}>
                <button onClick={() => setTabDropOpen((v) => !v)}
                        className="flex items-center border-r border-border bg-muted px-3 gap-1 cursor-pointer hover:bg-muted/80 transition-colors text-sm text-foreground whitespace-nowrap h-full w-24 justify-between rounded-l-lg">
                  {searchTab === "product" ? "상품명" : searchTab === "category" ? "카테고리" : "브랜드"}
                  <ChevronDown size={14} />
                </button>
                {tabDropOpen && (
                    <div className="absolute left-0 top-full mt-1 bg-white border border-border rounded shadow-lg z-[100] w-28">
                      {(["product", "category", "brand"] as const).map((tab) => (
                          <button key={tab} onClick={() => { setSearchTab(tab); setTabDropOpen(false); setSearchQuery(""); setResultDropOpen(false); }}
                                  className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors ${searchTab === tab ? "text-primary font-semibold" : "text-foreground"}`}>
                            {tab === "product" ? "상품명" : tab === "category" ? "카테고리" : "브랜드"}
                          </button>
                      ))}
                    </div>
                )}
              </div>
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="text"
                       placeholder={searchTab === "product" ? "찜한 상품명으로 검색" : searchTab === "category" ? "카테고리명으로 검색" : "브랜드명으로 검색"}
                       value={searchQuery}
                       onChange={(e) => { setSearchQuery(e.target.value); setResultDropOpen(true); setTabDropOpen(false); }}
                       onFocus={() => { if (searchQuery.trim().length > 0) setResultDropOpen(true); }}
                       className="w-full pl-9 pr-4 py-2.5 text-sm outline-none bg-white rounded-r-lg"
                />
              </div>
            </div>
            {resultDropOpen && searchQuery.trim().length > 0 && (
                <div ref={resultDropRef} className="absolute left-0 right-0 mt-1 bg-white border border-border rounded shadow-xl z-[100] max-h-72 overflow-y-auto">
                  {searchResults.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-muted-foreground">검색 결과가 없습니다.</div>
                  ) : searchTab === "product" ? (
                      (searchResults as ProductSummary[]).map((p) => (
                          <Link key={p.productId} to={`/products/${p.productId}`} onClick={() => { setResultDropOpen(false); setSearchQuery(""); }}
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary transition-colors border-b border-border last:border-0">
                            <div className="w-9 h-9 rounded overflow-hidden bg-muted flex-shrink-0">
                              {p.mainImageUrl ? <img src={p.mainImageUrl} alt={p.productName} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-muted" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">{p.productName}</div>
                              <div className="text-xs text-muted-foreground">{p.brandName}</div>
                            </div>
                            <div className="text-primary text-sm font-bold flex-shrink-0">₩{p.unitPrice.toLocaleString()}</div>
                          </Link>
                      ))
                  ) : searchTab === "category" ? (
                      (searchResults as typeof searchDummyCategories).map((c) => (
                          <button key={c.id} onClick={() => { handleCategoryChange(c.id); setResultDropOpen(false); setSearchQuery(""); }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary transition-colors border-b border-border last:border-0 text-left">
                            <img src={c.iconImg} alt={c.name} className="w-7 h-7 object-contain flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-foreground">{c.name}</div>
                              <div className="text-xs text-muted-foreground truncate">{c.subCategories.join(" · ")}</div>
                            </div>
                          </button>
                      ))
                  ) : (
                      (searchResults as typeof searchDummyBrands).map((b) => (
                          <button key={b.name} onClick={() => { setResultDropOpen(false); setSearchQuery(""); }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary transition-colors border-b border-border last:border-0 text-left">
                            <div className="w-7 h-7 rounded bg-white border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                              <img src={b.logo} alt={b.name} className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            </div>
                            <span className="text-sm text-foreground">{b.name}</span>
                          </button>
                      ))
                  )}
                </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setViewMode("grid")} className={`p-2.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}><Grid3x3 size={18} /></button>
            <button onClick={() => setViewMode("list")} className={`p-2.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}><List size={18} /></button>
          </div>
        </div>

        <div className="grid grid-cols-[240px_1fr] gap-6">
          {/* Sidebar */}
          <div className="relative" ref={brandPanelRef}>
            <div className="flex gap-2 mb-4">
              <button onClick={() => { if (selectedCategory !== "all" || selectedSubCategory) { setSelectedCategory("all"); setSelectedSubCategory(""); setExpandedCategory(null); } else setBrandPanelOpen(false); }}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all border ${selectedCategory !== "all" || selectedSubCategory ? "bg-primary text-white border-primary" : "bg-white text-foreground border-border hover:border-primary hover:text-primary"}`}>
                카테고리
              </button>
              <button onClick={() => { if (selectedBrand) setSelectedBrand(""); else setBrandPanelOpen((v) => !v); }}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all border ${selectedBrand ? "bg-primary text-white border-primary" : "bg-white text-foreground border-border hover:border-primary hover:text-primary"}`}>
                {selectedBrand ? `${selectedBrand}` : "브랜드"}
              </button>
            </div>
            <div className="space-y-1">
              {categories.map((cat) => (
                  <div key={cat.id}>
                    <button onClick={() => handleCategoryChange(cat.id)}
                            className={`w-full text-left px-4 py-2.5 rounded-lg transition-all text-sm ${selectedCategory === cat.id && !selectedSubCategory ? "bg-primary text-white font-semibold shadow-sm" : selectedCategory === cat.id ? "bg-primary/10 text-primary font-semibold" : "bg-white border border-border text-foreground hover:border-primary hover:text-primary"}`}>
                      <div className="flex items-center justify-between">
                        <span>{cat.name}</span>
                        {cat.subCategories.length > 0 && <ChevronDown size={13} className={`transition-transform ${expandedCategory === cat.id ? "rotate-180" : ""} ${selectedCategory === cat.id && !selectedSubCategory ? "text-white/80" : "text-muted-foreground"}`} />}
                      </div>
                    </button>
                    {expandedCategory === cat.id && cat.subCategories.length > 0 && (
                        <div className="ml-3 mt-1 space-y-0.5 border-l-2 border-primary/20 pl-3">
                          {cat.subCategories.map((sub) => (
                              <button key={sub} onClick={() => setSelectedSubCategory(sub)}
                                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${selectedSubCategory === sub ? "bg-primary text-white font-semibold" : "text-muted-foreground hover:text-primary hover:bg-primary/5"}`}>
                                {sub}
                              </button>
                          ))}
                        </div>
                    )}
                  </div>
              ))}
            </div>
            {brandPanelOpen && (
                <BrandPanel allBrands={searchDummyBrands} selectedBrand={selectedBrand}
                            onSelect={(name) => { setSelectedBrand(name); setBrandPanelOpen(false); }}
                            onClear={() => setSelectedBrand("")} />
            )}
          </div>

          {/* Product Grid/List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                총 <span className="font-bold text-foreground">{wishlistProducts.length}</span>개 상품
                {selectedSubCategory && <span className="ml-2 text-primary font-medium">· {selectedSubCategory}</span>}
                {selectedBrand && <span className="ml-2 text-primary font-medium">· {selectedBrand}</span>}
              </p>
            </div>

            {wishlistProducts.length === 0 ? (
                <div className="text-center py-20">
                  <Heart size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">찜한 상품이 없습니다</h3>
                  <p className="text-sm text-muted-foreground mb-6">마음에 드는 상품을 찜해보세요</p>
                  <Link to="/products" className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors">상품 둘러보기</Link>
                </div>
            ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {wishlistProducts.map((product) => (
                      <div key={product.productId} className="bg-white border border-border rounded-lg overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all group">
                        <Link to={`/products/${product.productId}`} className="block relative">
                          <div className="aspect-square overflow-hidden bg-muted">
                            {product.mainImageUrl
                                ? <img src={product.mainImageUrl} alt={product.productName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                : <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs">이미지 없음</div>
                            }
                          </div>
                          <button onClick={(e) => { e.preventDefault(); removeFromWishlist(product.productId); }}
                                  className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm">
                            <Heart size={15} className="fill-red-500 text-red-500" />
                          </button>
                        </Link>
                        <div className="p-4">
                          <div className="text-xs text-muted-foreground mb-1">{product.brandName}</div>
                          <Link to={`/products/${product.productId}`} className="block">
                            <h3 className="font-semibold text-foreground mb-2 line-clamp-2 hover:text-primary transition-colors">{product.productName}</h3>
                          </Link>
                          <div className="flex items-baseline gap-1 mb-3">
                            <span className="text-xl font-bold text-primary">₩{product.unitPrice.toLocaleString()}</span>
                            <span className="text-xs text-muted-foreground">/벌</span>
                          </div>
                          <button className="w-full bg-primary hover:bg-primary/90 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                            <ShoppingCart size={16} /> 장바구니
                          </button>
                        </div>
                      </div>
                  ))}
                </div>
            ) : (
                <div className="space-y-3">
                  {wishlistProducts.map((product) => (
                      <div key={product.productId} className="bg-white border border-border rounded-lg p-4 hover:shadow-md hover:border-primary/50 transition-all">
                        <div className="flex gap-4">
                          <Link to={`/products/${product.productId}`} className="flex-shrink-0">
                            <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted">
                              {product.mainImageUrl
                                  ? <img src={product.mainImageUrl} alt={product.productName} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                                  : <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs">이미지 없음</div>
                              }
                            </div>
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div className="flex-1">
                                <div className="text-xs text-muted-foreground mb-1">{product.brandName} · {product.categoryName}</div>
                                <Link to={`/products/${product.productId}`}>
                                  <h3 className="font-semibold text-foreground text-lg mb-1 hover:text-primary transition-colors">{product.productName}</h3>
                                </Link>
                                <div className="flex items-baseline gap-1 mb-2">
                                  <span className="text-2xl font-bold text-primary">₩{product.unitPrice.toLocaleString()}</span>
                                  <span className="text-xs text-muted-foreground">/벌</span>
                                </div>
                              </div>
                              <button onClick={() => removeFromWishlist(product.productId)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors">
                                <Heart size={16} className="fill-red-500 text-red-500" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <button className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                                <ShoppingCart size={16} /> 장바구니
                              </button>
                              <Link to={`/products/${product.productId}`} className="border border-border text-foreground hover:border-primary hover:text-primary px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                                상세보기
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                  ))}
                </div>
            )}
          </div>
        </div>
      </div>
  );
}
