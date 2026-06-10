import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { Search, Filter, Heart, ShoppingCart, Grid3x3, List, ChevronDown } from "lucide-react";

export type Product = {
  id: string;
  name: string;
  brand: string;
  price: number;
  category: string;
  subCategory: string;
  image: string;
  moq: string;
  moqUnit: string;
  sizes: string[];
  isFavorite?: boolean;
};

const categories = [
  {
    id: "all", name: "전체", count: 56, subCategories: [],
  },
  {
    id: "tops", name: "상의", count: 14,
    subCategories: ["티셔츠/탑", "블라우스/셔츠", "니트/스웨터", "후드/맨투맨", "재킷/블레이저"],
  },
  {
    id: "bottoms", name: "하의", count: 10,
    subCategories: ["팬츠/슬랙스", "스커트", "진/데님", "레깅스", "반바지"],
  },
  {
    id: "dresses", name: "원피스/세트", count: 8,
    subCategories: ["원피스", "점프수트", "투피스세트"],
  },
  {
    id: "outerwear", name: "아우터", count: 7,
    subCategories: ["코트", "재킷/점퍼", "가디건", "패딩"],
  },
  {
    id: "innerwear", name: "이너/언더웨어", count: 5,
    subCategories: ["이너웨어", "속옷", "잠옷/홈웨어"],
  },
  {
    id: "sports", name: "스포츠/애슬레저", count: 6,
    subCategories: ["스포츠탑", "스포츠레깅스", "트레이닝복", "스포츠세트"],
  },
  {
    id: "accessories", name: "액세서리", count: 4,
    subCategories: ["가방/백", "모자", "스카프/머플러", "벨트", "양말/타이즈"],
  },
  {
    id: "shoes", name: "신발", count: 4,
    subCategories: ["스니커즈", "부츠/앵클부츠", "플랫/로퍼", "힐/펌프스"],
  },
];

export const products: Product[] = [
  { id: "F001", name: "여성 린넨 블라우스 (7컬러)", brand: "동대문패션", price: 8900, category: "tops", subCategory: "블라우스/셔츠", image: "https://images.unsplash.com/photo-1594938298603-c8148c4b2e8e?w=400", moq: "50", moqUnit: "벌", sizes: ["S", "M", "L", "XL"] },
  { id: "F002", name: "크롭 반팔 티셔츠 (10컬러)", brand: "스타일컴퍼니", price: 5500, category: "tops", subCategory: "티셔츠/탑", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400", moq: "100", moqUnit: "벌", sizes: ["S", "M", "L", "XL", "XXL"] },
  { id: "F003", name: "오버핏 줄무늬 티셔츠", brand: "캐주얼하우스", price: 7200, category: "tops", subCategory: "티셔츠/탑", image: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=400", moq: "60", moqUnit: "벌", sizes: ["FREE"] },
  { id: "F004", name: "실크 새틴 블라우스", brand: "엘레강스모드", price: 14500, category: "tops", subCategory: "블라우스/셔츠", image: "https://images.unsplash.com/photo-1562572159-4efc207f5aff?w=400", moq: "30", moqUnit: "벌", sizes: ["S", "M", "L"] },
  { id: "F005", name: "루즈핏 크루넥 니트", brand: "코지니트", price: 19800, category: "tops", subCategory: "니트/스웨터", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400", moq: "40", moqUnit: "벌", sizes: ["S", "M", "L", "XL"] },
  { id: "F006", name: "와이드 슬랙스 스트레이트", brand: "스타일컴퍼니", price: 15800, category: "bottoms", subCategory: "팬츠/슬랙스", image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400", moq: "40", moqUnit: "벌", sizes: ["S", "M", "L", "XL"] },
  { id: "F007", name: "하이웨이스트 미니스커트", brand: "트렌드하우스", price: 9500, category: "bottoms", subCategory: "스커트", image: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400", moq: "80", moqUnit: "벌", sizes: ["S", "M", "L"] },
  { id: "F008", name: "스트레이트 데님 팬츠", brand: "진워크스", price: 18000, category: "bottoms", subCategory: "진/데님", image: "https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=400", moq: "30", moqUnit: "벌", sizes: ["25", "26", "27", "28", "29", "30"] },
  { id: "F009", name: "플리츠 미디 스커트", brand: "페미닌스타일", price: 12000, category: "bottoms", subCategory: "스커트", image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400", moq: "50", moqUnit: "벌", sizes: ["S", "M", "L"] },
  { id: "F010", name: "플로럴 랩 원피스 (5컬러)", brand: "트렌드하우스", price: 22000, category: "dresses", subCategory: "원피스", image: "https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=400", moq: "30", moqUnit: "벌", sizes: ["S", "M", "L"] },
  { id: "F011", name: "린넨 셔츠 원피스", brand: "내추럴보이", price: 18500, category: "dresses", subCategory: "원피스", image: "https://images.unsplash.com/photo-1490481703813-8a8d0912db7e?w=400", moq: "40", moqUnit: "벌", sizes: ["S", "M", "L", "XL"] },
  { id: "F012", name: "체크 투피스 세트", brand: "세트스타일", price: 28000, category: "dresses", subCategory: "투피스세트", image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400", moq: "20", moqUnit: "세트", sizes: ["S", "M", "L"] },
  { id: "F013", name: "울 혼방 오버핏 롱코트", brand: "프리미엄어패럴", price: 58000, category: "outerwear", subCategory: "코트", image: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400", moq: "20", moqUnit: "벌", sizes: ["S", "M", "L"] },
  { id: "F014", name: "오버핏 데님 자켓", brand: "진워크스", price: 32000, category: "outerwear", subCategory: "재킷/점퍼", image: "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=400", moq: "30", moqUnit: "벌", sizes: ["S", "M", "L", "XL"] },
  { id: "F015", name: "크롭 가디건 (8컬러)", brand: "코지니트", price: 18000, category: "outerwear", subCategory: "가디건", image: "https://images.unsplash.com/photo-1609873814058-a8928924184a?w=400", moq: "50", moqUnit: "벌", sizes: ["FREE"] },
  { id: "F016", name: "하이웨이스트 요가 레깅스", brand: "액티브웨어코리아", price: 22000, category: "sports", subCategory: "스포츠레깅스", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400", moq: "50", moqUnit: "벌", sizes: ["S", "M", "L", "XL"] },
  { id: "F017", name: "스포츠 브라탑 (5컬러)", brand: "액티브웨어코리아", price: 14500, category: "sports", subCategory: "스포츠탑", image: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400", moq: "80", moqUnit: "벌", sizes: ["S", "M", "L"] },
  { id: "F018", name: "집업 기능성 자켓", brand: "스포츠라이프", price: 32000, category: "sports", subCategory: "트레이닝복", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400", moq: "25", moqUnit: "벌", sizes: ["S", "M", "L", "XL"] },
  { id: "F019", name: "면 이너 민소매 (3팩)", brand: "베이직이너", price: 9900, category: "innerwear", subCategory: "이너웨어", image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400", moq: "100", moqUnit: "세트", sizes: ["S", "M", "L", "XL"] },
  { id: "F020", name: "홈웨어 루즈핏 세트", brand: "코지홈", price: 19500, category: "innerwear", subCategory: "잠옷/홈웨어", image: "https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=400", moq: "40", moqUnit: "세트", sizes: ["FREE"] },
  { id: "F021", name: "에코백 캔버스 토트", brand: "패션액세서리몰", price: 12000, category: "accessories", subCategory: "가방/백", image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=400", moq: "100", moqUnit: "개", sizes: [] },
  { id: "F022", name: "체인 미니 숄더백 (4컬러)", brand: "패션액세서리몰", price: 35000, category: "accessories", subCategory: "가방/백", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400", moq: "30", moqUnit: "개", sizes: [] },
  { id: "F023", name: "플랫폼 스니커즈 (3컬러)", brand: "슈즈마켓", price: 38000, category: "shoes", subCategory: "스니커즈", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400", moq: "30", moqUnit: "켤레", sizes: ["230", "235", "240", "245", "250", "255"] },
  { id: "F024", name: "앵클 첼시 부츠", brand: "슈즈마켓", price: 65000, category: "shoes", subCategory: "부츠/앵클부츠", image: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400", moq: "20", moqUnit: "켤레", sizes: ["230", "235", "240", "245", "250"] },
];

export function AllProducts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [selectedSubCategory, setSelectedSubCategory] = useState(searchParams.get("sub") || "");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(searchParams.get("category") || null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [favorites, setFavorites] = useState<string[]>(() => { 
  const saved = localStorage.getItem("wishlist"); //좋아요 페이지 추가용
  return saved ? JSON.parse(saved) : [];
}); 
  useEffect(() => {
    const cat = searchParams.get("category") || "all";
    const sub = searchParams.get("sub") || "";
    const q = searchParams.get("q") || "";
    setSelectedCategory(cat);
    setSelectedSubCategory(sub);
    setSearchQuery(q);
  }, [searchParams]);

  const handleCategoryChange = (catId: string) => {
    if (catId === "all") {
      setExpandedCategory(null);
      setSelectedSubCategory("");
      setSelectedCategory("all");
      setSearchParams({});
      return;
    }
    // 이미 선택된 카테고리 클릭 시 접기
    if (expandedCategory === catId) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(catId);
    }
    setSelectedCategory(catId);
    setSelectedSubCategory("");
    const params: Record<string, string> = { category: catId };
    if (searchQuery) params.q = searchQuery;
    setSearchParams(params);
  };

  const handleSubCategoryChange = (subCat: string) => {
    setSelectedSubCategory(subCat);
    const params: Record<string, string> = { category: selectedCategory, sub: subCat };
    if (searchQuery) params.q = searchQuery;
    setSearchParams(params);
  };

  const filteredProducts = products.filter((p) => {
    const matchCategory = selectedCategory === "all" || p.category === selectedCategory;
    const matchSub = !selectedSubCategory || p.subCategory === selectedSubCategory;
    const matchSearch = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subCategory.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSub && matchSearch;
  });

  const toggleFavorite = (productId: string) => { //좋아요 페이지 추가용
  setFavorites((prev) => {
    const next = prev.includes(productId)
      ? prev.filter((id) => id !== productId)
      : [...prev, productId];
    localStorage.setItem("wishlist", JSON.stringify(next));
    return next;
  });
};

  return (
    <div className="max-w-[1480px] mx-auto px-4 py-8 font-[Inter,sans-serif]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">전체 상품</h1>
        <p className="text-muted-foreground">국내 여성복 B2B 도매 상품을 탐색하세요</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-border rounded-lg p-4 mb-6 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="상품명, 브랜드, 카테고리 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            <Grid3x3 size={18} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            <List size={18} />
          </button>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors">
          <Filter size={16} />
          필터
        </button>
      </div>

      <div className="grid grid-cols-[240px_1fr] gap-6">
        {/* Category Sidebar */}
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wide">카테고리</h3>
          {categories.map((cat) => (
            <div key={cat.id}>
              {/* 대분류 버튼 */}
              <button
                onClick={() => handleCategoryChange(cat.id)}
                className={`w-full text-left px-4 py-2.5 rounded-lg transition-all text-sm ${
                  selectedCategory === cat.id && !selectedSubCategory
                    ? "bg-primary text-white font-semibold shadow-sm"
                    : selectedCategory === cat.id
                    ? "bg-primary/10 text-primary font-semibold"
                    : "bg-white border border-border text-foreground hover:border-primary hover:text-primary"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{cat.name}</span>
                  {cat.subCategories.length > 0 && (
                    <ChevronDown
                      size={13}
                      className={`transition-transform ${expandedCategory === cat.id ? "rotate-180" : ""} ${selectedCategory === cat.id && !selectedSubCategory ? "text-white/80" : "text-muted-foreground"}`}
                    />
                  )}
                </div>
              </button>

              {/* 하위 카테고리 */}
              {expandedCategory === cat.id && cat.subCategories.length > 0 && (
                <div className="ml-3 mt-1 space-y-0.5 border-l-2 border-primary/20 pl-3">
                  {cat.subCategories.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => handleSubCategoryChange(sub)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                        selectedSubCategory === sub
                          ? "bg-primary text-white font-semibold"
                          : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Product Grid/List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              총 <span className="font-bold text-foreground">{filteredProducts.length}</span>개 상품
              {selectedSubCategory && (
                <span className="ml-2 text-primary font-medium">· {selectedSubCategory}</span>
              )}
            </p>
          </div>

          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white border border-border rounded-lg overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all group">
                  <Link to={`/product/${product.id}`} className="block relative">
                    <div className="aspect-square overflow-hidden bg-muted">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); toggleFavorite(product.id); }}
                      className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm"
                    >
                      <Heart size={16} className={favorites.includes(product.id) ? "fill-red-500 text-red-500" : "text-gray-600"} />
                    </button>
                  </Link>
                  <div className="p-4">
                    <div className="text-xs text-muted-foreground mb-1">{product.brand}</div>
                    <Link to={`/product/${product.id}`} className="block">
                      <h3 className="font-semibold text-foreground mb-2 line-clamp-2 hover:text-primary transition-colors">{product.name}</h3>
                    </Link>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-xl font-bold text-primary">₩{product.price.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">/벌</span>
                    </div>
                    {product.sizes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {product.sizes.map((s) => (
                          <span key={s} className="text-[10px] border border-border rounded px-1.5 py-0.5 text-muted-foreground">{s}</span>
                        ))}
                      </div>
                    )}
                    <div className="space-y-1 text-xs text-muted-foreground mb-3">
                      <div className="flex justify-between">
                        <span>MOQ</span>
                        <span className="font-medium text-foreground">{product.moq}{product.moqUnit}</span>
                      </div>
                    </div>
                    <button className="w-full bg-primary hover:bg-primary/90 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                      <ShoppingCart size={16} />
                      장바구니
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white border border-border rounded-lg p-4 hover:shadow-md hover:border-primary/50 transition-all">
                  <div className="flex gap-4">
                    <Link to={`/product/${product.id}`} className="flex-shrink-0">
                      <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <div className="text-xs text-muted-foreground mb-1">{product.brand} · {product.subCategory}</div>
                          <Link to={`/product/${product.id}`}>
                            <h3 className="font-semibold text-foreground text-lg mb-1 hover:text-primary transition-colors">{product.name}</h3>
                          </Link>
                          <div className="flex items-baseline gap-1 mb-2">
                            <span className="text-2xl font-bold text-primary">₩{product.price.toLocaleString()}</span>
                            <span className="text-xs text-muted-foreground">/벌</span>
                          </div>
                        </div>
                        <button onClick={() => toggleFavorite(product.id)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
                          <Heart size={18} className={favorites.includes(product.id) ? "fill-red-500 text-red-500" : "text-gray-600"} />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <div className="text-xs text-muted-foreground mb-0.5">MOQ</div>
                          <div className="font-medium text-foreground">{product.moq}{product.moqUnit}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-0.5">카테고리</div>
                          <div className="font-medium text-foreground">{product.subCategory}</div>
                        </div>
                        {product.sizes.length > 0 && (
                          <div>
                            <div className="text-xs text-muted-foreground mb-0.5">사이즈</div>
                            <div className="font-medium text-foreground text-xs">{product.sizes.join(" / ")}</div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                          <ShoppingCart size={16} />
                          장바구니
                        </button>
                        <Link to={`/product/${product.id}`} className="border border-border text-foreground hover:border-primary hover:text-primary px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                          상세보기
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredProducts.length === 0 && (
            <div className="text-center py-20">
              <Search size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
              <h3 className="text-lg font-semibold text-foreground mb-2">검색 결과가 없습니다</h3>
              <p className="text-sm text-muted-foreground">다른 검색어나 카테고리를 선택해보세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
