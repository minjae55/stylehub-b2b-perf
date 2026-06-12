import { useState } from "react";
import { Link } from "react-router";
import { Heart, ShoppingCart, Trash2, Search, Filter, Grid3x3, List, ChevronDown } from "lucide-react";
import { products } from "./AllProducts";

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

export function Wishlist() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem("wishlist");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const wishlistProducts = products.filter((p) => {
    const isFav = favorites.includes(p.id);
    const matchCategory = selectedCategory === "all" || p.category === selectedCategory;
    const matchSub = !selectedSubCategory || p.subCategory === selectedSubCategory;
    const matchSearch = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return isFav && matchCategory && matchSub && matchSearch;
  });

  const removeFromWishlist = (productId: string) => {
    setFavorites((prev) => {
      const next = prev.filter((id) => id !== productId);
      localStorage.setItem("wishlist", JSON.stringify(next));
      return next;
    });
  };

  const handleCategoryChange = (catId: string) => {
    if (catId === "all") {
      setExpandedCategory(null);
      setSelectedSubCategory("");
      setSelectedCategory("all");
      return;
    }
    if (expandedCategory === catId) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(catId);
    }
    setSelectedCategory(catId);
    setSelectedSubCategory("");
  };

  return (
    <div className="max-w-[1480px] mx-auto px-4 py-8 font-[Inter,sans-serif]">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <Heart size={24} className="text-primary fill-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">찜 목록</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            총 <span className="font-bold text-foreground">{wishlistProducts.length}</span>개 상품
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-border rounded-lg p-4 mb-6 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="상품명, 브랜드 검색..."
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
              {expandedCategory === cat.id && cat.subCategories.length > 0 && (
                <div className="ml-3 mt-1 space-y-0.5 border-l-2 border-primary/20 pl-3">
                  {cat.subCategories.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => setSelectedSubCategory(sub)}
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
              총 <span className="font-bold text-foreground">{wishlistProducts.length}</span>개 상품
              {selectedSubCategory && <span className="ml-2 text-primary font-medium">· {selectedSubCategory}</span>}
            </p>
          </div>

          {wishlistProducts.length === 0 ? (
            <div className="text-center py-20">
              <Heart size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
              <h3 className="text-lg font-semibold text-foreground mb-2">찜한 상품이 없습니다</h3>
              <p className="text-sm text-muted-foreground mb-6">마음에 드는 상품을 찜해보세요</p>
              <Link to="/products" className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                상품 둘러보기
              </Link>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {wishlistProducts.map((product) => (
                <div key={product.id} className="bg-white border border-border rounded-lg overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all group">
                <Link to={`/product/${product.id}`} className="block relative">
                    <div className="aspect-square overflow-hidden bg-muted">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <button
                    onClick={(e) => { e.preventDefault(); removeFromWishlist(product.id); }}
                    className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm"
                    >
<Heart size={15} className="fill-red-500 text-red-500" />
                    </button>
                </Link>
                <div className="p-4">
                    <div className="text-xs text-muted-foreground mb-1">{product.brand}</div>
                    <Link to={`/product/${product.id}`} className="block">
                    <h3 className="font-semibold text-foreground mb-2 line-clamp-2 hover:text-primary transition-colors">{product.name}</h3>
                    </Link>
                    <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-xl font-bold text-primary">₩{product.price.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">/벌</span>
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
            {wishlistProducts.map((product) => (
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
                        <button
                        onClick={() => removeFromWishlist(product.id)}
                        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors"
                        >
                        <Heart size={16} className="fill-red-500 text-red-500" />
                        </button>
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
        </div>
      </div>
    </div>
  );
}