import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router";
import api from "../../api/axios";
import { Search, Heart, ShoppingCart, Grid3x3, List, ChevronDown, X, FolderOpen, Check, Plus } from "lucide-react";

interface ProductSummary {
  productId: number;
  productName: string;
  productEngName: string;
  brandId: number;
  brandName: string;
  categoryId: number;
  categoryName: string;
  parentCategoryId: number | null;
  parentCategoryName: string | null;
  unitPrice: number;
  moq: number;
  oemAvailable: boolean;
  sampleAvailable: boolean;
  mainImageUrl: string | null;
  createdAt: string;
}

// 대분류 id 매핑
const mainCategoryIdMap: Record<string, number> = {
  tops: 1, bottoms: 2, dresses: 3, outerwear: 4,
  innerwear: 5, sports: 6, accessories: 7, shoes: 8,
};

// 대분류 이름 매핑
const mainCategoryNameMap: Record<number, string> = {
  1: "상의", 2: "하의", 3: "원피스/세트", 4: "아우터",
  5: "이너/언더웨어", 6: "스포츠/애슬레저", 7: "액세서리", 8: "신발",
};

const categories = [
  { id: "all", name: "전체", subCategories: [] as string[] },
  { id: "tops", name: "상의", subCategories: ["티셔츠/탑", "블라우스/셔츠", "니트/스웨터", "후드/맨투맨", "재킷/블레이저"] },
  { id: "bottoms", name: "하의", subCategories: ["팬츠/슬랙스", "스커트", "진/데님", "레깅스", "반바지"] },
  { id: "dresses", name: "원피스/세트", subCategories: ["원피스", "점프수트", "투피스세트"] },
  { id: "outerwear", name: "아우터", subCategories: ["코트", "재킷/점퍼", "가디건", "패딩"] },
  { id: "innerwear", name: "이너/언더웨어", subCategories: ["이너웨어", "속옷", "잠옷/홈웨어"] },
  { id: "sports", name: "스포츠/애슬레저", subCategories: ["스포츠탑", "스포츠레깅스", "트레이닝복", "스포츠세트"] },
  { id: "accessories", name: "액세서리", subCategories: ["가방/백", "모자", "스카프/머플러", "벨트", "양말/타이즈"] },
  { id: "shoes", name: "신발", subCategories: ["스니커즈", "부츠/앵클부츠", "플랫/로퍼", "힐/롬프스"] },
];

const allBrands = [
  { name: "내추럴보이", logo: "/images/brands/natural.png" },
  { name: "동대문패션", logo: "/images/brands/ddm.png" },
  { name: "베이직이너", logo: "/images/brands/basic.png" },
  { name: "세트스타일", logo: "/images/brands/set.png" },
  { name: "스타일컴퍼니", logo: "/images/brands/style.png" },
  { name: "스포츠라이프", logo: "/images/brands/sportslife.png" },
  { name: "슈즈마켓", logo: "/images/brands/shoes.png" },
  { name: "액티브웨어코리아", logo: "/images/brands/active.png" },
  { name: "엘레강스모드", logo: "/images/brands/elegance.png" },
  { name: "진워크스", logo: "/images/brands/jean.png" },
  { name: "캐주얼하우스", logo: "/images/brands/casual.png" },
  { name: "코지니트", logo: "/images/brands/cozy.png" },
  { name: "코지홈", logo: "/images/brands/cozyhome.png" },
  { name: "트렌드하우스", logo: "/images/brands/trend.png" },
  { name: "패션액세서리몰", logo: "/images/brands/acc.png" },
  { name: "페미닌스타일", logo: "/images/brands/feminine.png" },
  { name: "프리미엄어패럴", logo: "/images/brands/premium.png" },
];

const CHOSUNG = ["전체", "ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];

const searchCategories = [
  { id: "tops", name: "상의", iconImg: "/images/top.png", alias: [] as string[], subCategories: ["티셔츠/탑", "블라우스/셔츠", "니트/스웨터", "후드/맨투맨", "재킷/블레이저"] },
  { id: "bottoms", name: "하의", iconImg: "/images/bottom.png", alias: ["치마", "바지"], subCategories: ["팬츠/슬랙스", "스커트", "진/데님", "레깅스", "반바지"] },
  { id: "dresses", name: "원피스/세트", iconImg: "/images/one_piece.png", alias: [] as string[], subCategories: ["원피스", "점프수트", "투피스세트"] },
  { id: "outerwear", name: "아우터", iconImg: "/images/outer.png", alias: ["겉옷", "잠바", "코트", "재킷", "가디건"], subCategories: ["코트", "재킷/점퍼", "가디건", "패딩"] },
  { id: "innerwear", name: "이너/언더웨어", iconImg: "/images/inner.png", alias: ["속옷", "잠옷"], subCategories: ["이너웨어", "속옷", "잠옷/홈웨어"] },
  { id: "sports", name: "스포츠/애슬레저", iconImg: "/images/sports.png", alias: ["스포츠", "운동복"], subCategories: ["스포츠탑", "스포츠레깅스", "트레이닝복", "스포츠세트"] },
  { id: "accessories", name: "액세서리", iconImg: "/images/accessory.png", alias: ["악세서리"], subCategories: ["가방/백", "모자", "스카프/머플러", "벨트", "양말/타이즈"] },
  { id: "shoes", name: "신발", iconImg: "/images/shoes.png", alias: ["구두", "운동화"], subCategories: ["스니커즈", "부츠/앵클부츠", "플랫/로퍼", "힐/롬프스"] },
];

function getChosung(str: string): string {
  const code = str.charCodeAt(0) - 0xAC00;
  if (code < 0) return str[0];
  return ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"][Math.floor(code / (21 * 28))];
}

type Folder = { id: string; name: string; productIds: number[] };

function loadFolderData(): Folder[] {
  try {
    const raw = localStorage.getItem("wishlistFolders");
    if (raw) return JSON.parse(raw);
  } catch {}
  return [{ id: "default", name: "전체 찜", productIds: [] }];
}

function saveFolderData(folders: Folder[]) {
  localStorage.setItem("wishlistFolders", JSON.stringify(folders));
}

const PAGE_SIZE = 20;

export function AllProducts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [selectedSubCategory, setSelectedSubCategory] = useState(searchParams.get("sub") || "");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(searchParams.get("category") || null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [brandPanelOpen, setBrandPanelOpen] = useState(false);
  const [brandChosung, setBrandChosung] = useState("전체");
  const [brandVisibleCount, setBrandVisibleCount] = useState(10);
  const brandPanelRef = useRef<HTMLDivElement>(null);
  const brandScrollRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTab, setSearchTab] = useState<"product" | "category" | "brand">("product");
  const [tabDropOpen, setTabDropOpen] = useState(false);
  const [resultDropOpen, setResultDropOpen] = useState(false);
  const tabDropRef = useRef<HTMLDivElement>(null);
  const resultDropRef = useRef<HTMLDivElement>(null);
  const [folders, setFolders] = useState<Folder[]>(loadFolderData);
  const [folderModalProductId, setFolderModalProductId] = useState<number | null>(null);
  const [apiProducts, setApiProducts] = useState<ProductSummary[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const newFolderInputRef = useRef<HTMLInputElement>(null);

  const favorites = [...new Set(folders.flatMap(f => f.productIds))];

  useEffect(() => {
    api.get("/products").then(res => setApiProducts(res)).catch(() => {});
  }, []);

  useEffect(() => {
    const cat = searchParams.get("category") || "all";
    const sub = searchParams.get("sub") || "";
    setSelectedCategory(cat);
    setSelectedSubCategory(sub);
  }, [searchParams]);

  useEffect(() => {
    const mousedownHandler = (e: MouseEvent) => {
      if (tabDropRef.current && !tabDropRef.current.contains(e.target as Node)) setTabDropOpen(false);
      if (resultDropRef.current && !resultDropRef.current.contains(e.target as Node)) setResultDropOpen(false);
    };
    const clickHandler = (e: MouseEvent) => {
      if (brandPanelRef.current && !brandPanelRef.current.contains(e.target as Node)) setBrandPanelOpen(false);
    };
    document.addEventListener("mousedown", mousedownHandler);
    document.addEventListener("click", clickHandler);
    return () => {
      document.removeEventListener("mousedown", mousedownHandler);
      document.removeEventListener("click", clickHandler);
    };
  }, []);

  useEffect(() => {
    if (creatingFolder) {
      newFolderInputRef.current?.focus();
    }
  }, [creatingFolder]);

  const handleCategoryChange = (catId: string) => {
    if (catId === "all") {
      setExpandedCategory(null); setSelectedSubCategory(""); setSelectedCategory("all"); setSearchParams({});
      setCurrentPage(1);
      return;
    }
    if (expandedCategory === catId) setExpandedCategory(null);
    else setExpandedCategory(catId);
    setSelectedCategory(catId);
    setSelectedSubCategory("");
    setSearchParams({ category: catId });
    setCurrentPage(1);
  };

  const handleSubCategoryChange = (subCat: string) => {
    setSelectedSubCategory(subCat);
    setSearchParams({ category: selectedCategory, sub: subCat });
    setCurrentPage(1);
  };

  const handleHeartClick = (productId: number) => {
    if (favorites.includes(productId)) {
      const next = folders.map(f => ({ ...f, productIds: f.productIds.filter(id => id !== productId) }));
      setFolders(next);
      saveFolderData(next);
    } else {
      setFolderModalProductId(productId);
    }
  };

  const addToFolder = (folderId: string) => {
    const productId = folderModalProductId;
    if (productId === null) return;
    const next = folders.map(f =>
        f.id === folderId && !f.productIds.includes(productId)
            ? { ...f, productIds: [...f.productIds, productId] }
            : f
    );
    setFolders(next);
    saveFolderData(next);
    setFolderModalProductId(null);
  };

  const addFolder = () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) {
      setCreatingFolder(false);
      return;
    }
    const newFolder: Folder = {
      id: `folder_${Date.now()}`,
      name: trimmed,
      productIds: [],
    };
    const next = [...folders, newFolder];
    setFolders(next);
    saveFolderData(next);
    setNewFolderName("");
    setCreatingFolder(false);
  };

  const filteredProducts = apiProducts
      .filter((p) => {
        const mainCatId = mainCategoryIdMap[selectedCategory];

        // 대분류 필터
        // parentCategoryId가 있으면 중분류 상품 → parentCategoryId로 대분류 비교
        // parentCategoryId가 없으면 대분류 상품 → categoryId로 비교
        const matchMainCategory = selectedCategory === "all" || (
            p.parentCategoryId !== null
                ? p.parentCategoryId === mainCatId
                : p.categoryId === mainCatId
        );

        // 중분류 필터: categoryName이 선택된 중분류와 일치
        const matchSubCategory = !selectedSubCategory || p.categoryName === selectedSubCategory;

        const matchBrand = !selectedBrand || p.brandName === selectedBrand;
        const matchSearch = !searchQuery ||
            p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.brandName.toLowerCase().includes(searchQuery.toLowerCase());

        return matchMainCategory && matchSubCategory && matchBrand && matchSearch;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
  const pagedProducts = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const searchResults = searchQuery.trim().length < 1 ? [] : (() => {
    const q = searchQuery.trim().toLowerCase();
    if (searchTab === "product") return apiProducts.filter(p => p.productName.toLowerCase().includes(q) || p.brandName.toLowerCase().includes(q)).slice(0, 6);
    if (searchTab === "category") return searchCategories.filter(c => c.name.toLowerCase().includes(q) || c.subCategories.some(s => s.toLowerCase().includes(q)) || c.alias.some(a => a.toLowerCase().includes(q))).slice(0, 6);
    if (searchTab === "brand") return allBrands.filter(b => b.name.toLowerCase().includes(q)).slice(0, 6);
    return [];
  })();

  const brandFiltered = brandChosung === "전체" ? allBrands : allBrands.filter(b => getChosung(b.name) === brandChosung);
  const brandVisible = brandFiltered.slice(0, brandVisibleCount);

  // 상품의 카테고리 표시명 (대분류 or 중분류)
  const getCategoryDisplayName = (p: ProductSummary) => {
    if (p.parentCategoryId !== null) {
      return `${mainCategoryNameMap[p.parentCategoryId] ?? ""} > ${p.categoryName}`;
    }
    return p.categoryName;
  };

  const Pagination = () => {
    if (totalPages <= 1) return null;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
        .reduce<(number | "...")[]>((acc, p, idx, arr) => {
          if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
          acc.push(p);
          return acc;
        }, []);

    return (
        <div className="flex items-center justify-center gap-1 mt-8">
          <button
              onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-lg text-sm border border-border hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            이전
          </button>
          {pages.map((p, i) =>
              p === "..." ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">…</span>
              ) : (
                  <button
                      key={p}
                      onClick={() => { setCurrentPage(p as number); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${currentPage === p ? "bg-primary text-white" : "border border-border hover:border-primary hover:text-primary"}`}
                  >
                    {p}
                  </button>
              )
          )}
          <button
              onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              disabled={currentPage === totalPages}
              className="px-3 py-2 rounded-lg text-sm border border-border hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            다음
          </button>
        </div>
    );
  };

  return (
      <div className="max-w-[1480px] mx-auto px-4 py-8 font-[Inter,sans-serif]">

        {/* 폴더 선택 모달 */}
        {folderModalProductId !== null && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => { setFolderModalProductId(null); setCreatingFolder(false); setNewFolderName(""); }}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Heart size={20} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">폴더에 저장</h2>
                    <p className="text-xs text-muted-foreground">저장할 폴더를 선택하세요</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 max-h-72 overflow-y-auto mb-5">
                  {folders.map(folder => {
                    const isAdded = folder.productIds.includes(folderModalProductId);
                    const allFavIds = [...new Set(folders.flatMap(f => f.productIds))];
                    const ids = folder.id === "default" ? allFavIds : folder.productIds;
                    const needed = ids.length === 0 ? 0 : ids.length === 1 ? 1 : ids.length < 4 ? 2 : 4;
                    const thumbImgs = ids.slice(0, needed).map(id => apiProducts.find(p => p.productId === id)?.mainImageUrl ?? null);
                    return (
                        <button
                            key={folder.id}
                            onClick={() => !isAdded && addToFolder(folder.id)}
                            className={`flex flex-col rounded-xl border-2 overflow-hidden transition-all text-left ${isAdded ? "border-primary" : "border-border hover:border-primary"} ${isAdded ? "cursor-default" : "cursor-pointer"}`}
                        >
                          {/* 썸네일 */}
                          <div className="w-full aspect-square bg-muted relative overflow-hidden">
                            {thumbImgs.length === 0 ? (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Heart size={24} className="text-muted-foreground opacity-30" />
                                </div>
                            ) : thumbImgs.length === 1 ? (
                                <img src={thumbImgs[0]!} alt="" className="w-full h-full object-cover" />
                            ) : thumbImgs.length < 4 ? (
                                <div className="w-full h-full grid grid-cols-2 gap-0.5">
                                  {thumbImgs.slice(0, 2).map((img, i) =>
                                      img ? <img key={i} src={img} alt="" className="w-full h-full object-cover" />
                                          : <div key={i} className="w-full h-full bg-muted" />
                                  )}
                                </div>
                            ) : (
                                <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-0.5">
                                  {thumbImgs.slice(0, 4).map((img, i) =>
                                      img ? <img key={i} src={img} alt="" className="w-full h-full object-cover" />
                                          : <div key={i} className="w-full h-full bg-muted" />
                                  )}
                                </div>
                            )}
                            {isAdded && (
                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                  <Check size={24} className="text-primary" />
                                </div>
                            )}
                          </div>
                          {/* 폴더명 */}
                          <div className="px-2 py-1.5">
                            <p className={`text-xs font-medium truncate ${isAdded ? "text-primary" : "text-foreground"}`}>{folder.name}</p>
                            <p className="text-[10px] text-muted-foreground">{ids.length}개</p>
                          </div>
                        </button>
                    );
                  })}

                  {/* 새 폴더 만들기 타일 */}
                  {creatingFolder ? (
                      <div className="flex flex-col rounded-xl border-2 border-primary overflow-hidden">
                        <div className="w-full aspect-square bg-primary/5 flex items-center justify-center">
                          <FolderOpen size={24} className="text-primary opacity-50" />
                        </div>
                        <div className="px-2 py-1.5 flex items-center gap-1">
                          <input
                              ref={newFolderInputRef}
                              type="text"
                              value={newFolderName}
                              onChange={(e) => setNewFolderName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") { e.preventDefault(); addFolder(); }
                                if (e.key === "Escape") { setCreatingFolder(false); setNewFolderName(""); }
                              }}
                              placeholder="폴더명"
                              maxLength={20}
                              className="w-full min-w-0 text-xs outline-none border-b border-primary/40 focus:border-primary bg-transparent"
                          />
                          <button onClick={addFolder} className="text-primary flex-shrink-0" title="추가">
                            <Check size={14} />
                          </button>
                          <button onClick={() => { setCreatingFolder(false); setNewFolderName(""); }} className="text-muted-foreground flex-shrink-0" title="취소">
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                  ) : (
                      <button
                          onClick={() => setCreatingFolder(true)}
                          className="flex flex-col rounded-xl border-2 border-dashed border-border hover:border-primary transition-all text-left"
                      >
                        <div className="w-full aspect-square bg-muted/30 flex items-center justify-center">
                          <Plus size={24} className="text-muted-foreground" />
                        </div>
                        <div className="px-2 py-1.5">
                          <p className="text-xs font-medium text-muted-foreground">새 폴더</p>
                        </div>
                      </button>
                  )}
                </div>
                <button onClick={() => { setFolderModalProductId(null); setCreatingFolder(false); setNewFolderName(""); }} className="w-full py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors">닫기</button>
              </div>
            </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">전체 상품</h1>
          <p className="text-muted-foreground">국내 여성복 B2B 도매 상품을 탐색하세요</p>
        </div>

        {/* 검색바 */}
        <div className="bg-white border border-border rounded-lg p-4 mb-6 flex items-center gap-4">
          <div className="flex-1 relative">
            <div className="flex border border-border rounded-lg">
              <div className="relative" ref={tabDropRef}>
                <button
                    onClick={() => setTabDropOpen(v => !v)}
                    className="flex items-center border-r border-border bg-muted px-3 gap-1 cursor-pointer hover:bg-muted/80 transition-colors text-sm text-foreground whitespace-nowrap h-full w-24 justify-between rounded-l-lg"
                >
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
                <input
                    type="text"
                    placeholder={searchTab === "product" ? "상품명으로 검색" : searchTab === "category" ? "카테고리명으로 검색" : "브랜드명으로 검색"}
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setResultDropOpen(true); setTabDropOpen(false); setCurrentPage(1); }}
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
                      (searchResults as typeof searchCategories).map((c) => (
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
                      (searchResults as typeof allBrands).map((b) => (
                          <button key={b.name} onClick={() => { setSelectedBrand(b.name); setResultDropOpen(false); setSearchQuery(""); setCurrentPage(1); }}
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
            <button onClick={() => setViewMode("grid")} className={`p-2.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
              <Grid3x3 size={18} />
            </button>
            <button onClick={() => setViewMode("list")} className={`p-2.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
              <List size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[240px_1fr] gap-6">
          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 카테고리 */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">카테고리</p>
              <div className="space-y-1">
                {categories.map((cat) => (
                    <div key={cat.id}>
                      <button
                          onClick={() => handleCategoryChange(cat.id)}
                          className={`w-full text-left px-4 py-2.5 rounded-lg transition-all text-sm ${selectedCategory === cat.id && !selectedSubCategory ? "bg-primary text-white font-semibold shadow-sm" : selectedCategory === cat.id ? "bg-primary/10 text-primary font-semibold" : "bg-white border border-border text-foreground hover:border-primary hover:text-primary"}`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{cat.name}</span>
                          {cat.subCategories.length > 0 && (
                              <ChevronDown size={13} className={`transition-transform ${expandedCategory === cat.id ? "rotate-180" : ""} ${selectedCategory === cat.id && !selectedSubCategory ? "text-white/80" : "text-muted-foreground"}`} />
                          )}
                        </div>
                      </button>
                      {expandedCategory === cat.id && cat.subCategories.length > 0 && (
                          <div className="ml-3 mt-1 space-y-0.5 border-l-2 border-primary/20 pl-3">
                            {cat.subCategories.map((sub) => (
                                <button key={sub} onClick={() => handleSubCategoryChange(sub)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${selectedSubCategory === sub ? "bg-primary text-white font-semibold" : "text-muted-foreground hover:text-primary hover:bg-primary/5"}`}>
                                  {sub}
                                </button>
                            ))}
                          </div>
                      )}
                    </div>
                ))}
              </div>
            </div>

            {/* 브랜드 */}
            <div className="relative" ref={brandPanelRef}>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">브랜드</p>
              <button
                  onClick={() => { if (selectedBrand) { setSelectedBrand(""); setCurrentPage(1); } else setBrandPanelOpen(v => !v); }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-semibold transition-all border ${selectedBrand ? "bg-primary text-white border-primary" : "bg-white text-foreground border-border hover:border-primary hover:text-primary"}`}
              >
                <span>{selectedBrand || "브랜드 선택"}</span>
                {selectedBrand ? <X size={14} /> : <ChevronDown size={14} className={`transition-transform ${brandPanelOpen ? "rotate-180" : ""}`} />}
              </button>
              {brandPanelOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-xl z-30">
                    <div className="flex flex-wrap gap-1 p-2.5 border-b border-border">
                      {CHOSUNG.map((c) => (
                          <button key={c} onClick={() => { setBrandChosung(c); setBrandVisibleCount(10); }}
                                  className={`text-xs px-1.5 py-0.5 rounded transition-colors ${brandChosung === c ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-primary"}`}>
                            {c}
                          </button>
                      ))}
                    </div>
                    <div ref={brandScrollRef} onScroll={() => { const el = brandScrollRef.current; if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 10) setBrandVisibleCount(v => v + 10); }} className="max-h-56 overflow-y-auto">
                      {brandVisible.length === 0 ? (
                          <div className="text-center py-6 text-xs text-muted-foreground">해당 브랜드가 없습니다</div>
                      ) : brandVisible.map((brand) => (
                          <button key={brand.name} onClick={() => { setSelectedBrand(brand.name); setBrandPanelOpen(false); setCurrentPage(1); }}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2 border-b border-border last:border-0 transition-colors text-left ${selectedBrand === brand.name ? "bg-primary/10 text-primary" : "hover:bg-secondary text-foreground"}`}>
                            <div className="w-7 h-7 rounded bg-white border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                              <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            </div>
                            <span className="text-xs flex-1 truncate">{brand.name}</span>
                            {selectedBrand === brand.name && <span className="text-primary font-bold text-xs">✓</span>}
                          </button>
                      ))}
                    </div>
                  </div>
              )}
            </div>
          </div>

          {/* 상품 목록 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                총 <span className="font-bold text-foreground">{filteredProducts.length}</span>개 상품
                {selectedSubCategory && <span className="ml-2 text-primary font-medium">· {selectedSubCategory}</span>}
                {selectedBrand && <span className="ml-2 text-primary font-medium">· {selectedBrand}</span>}
              </p>
              {totalPages > 1 && (
                  <p className="text-xs text-muted-foreground">{currentPage} / {totalPages} 페이지</p>
              )}
            </div>

            {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {pagedProducts.map((product) => (
                      <div key={product.productId} className="bg-white border border-border rounded-lg overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all group">
                        <Link to={`/products/${product.productId}`} className="block relative">
                          <div className="aspect-square overflow-hidden bg-muted">
                            {product.mainImageUrl
                                ? <img src={product.mainImageUrl} alt={product.productName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                : <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs">이미지 없음</div>
                            }
                          </div>
                          <button onClick={(e) => { e.preventDefault(); handleHeartClick(product.productId); }}
                                  className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm">
                            <Heart size={16} className={favorites.includes(product.productId) ? "fill-red-500 text-red-500" : "text-gray-600"} />
                          </button>
                        </Link>
                        <div className="p-4">
                          <div className="text-xs text-muted-foreground mb-1">{product.brandName}</div>
                          <Link to={`/products/${product.productId}`} className="block">
                            <h3 className="font-semibold text-foreground mb-2 line-clamp-2 hover:text-primary transition-colors">{product.productName}</h3>
                          </Link>
                          <div className="flex items-baseline gap-1 mb-2">
                            <span className="text-xl font-bold text-primary">₩{product.unitPrice.toLocaleString()}</span>
                            <span className="text-xs text-muted-foreground">/벌</span>
                          </div>
                          <div className="space-y-1 text-xs text-muted-foreground mb-3">
                            <div className="flex justify-between">
                              <span>MOQ</span>
                              <span className="font-medium text-foreground">{product.moq}벌</span>
                            </div>
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
                  {pagedProducts.map((product) => (
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
                                <div className="text-xs text-muted-foreground mb-1">{product.brandName} · {getCategoryDisplayName(product)}</div>
                                <Link to={`/products/${product.productId}`}>
                                  <h3 className="font-semibold text-foreground text-lg mb-1 hover:text-primary transition-colors">{product.productName}</h3>
                                </Link>
                                <div className="flex items-baseline gap-1 mb-2">
                                  <span className="text-2xl font-bold text-primary">₩{product.unitPrice.toLocaleString()}</span>
                                  <span className="text-xs text-muted-foreground">/벌</span>
                                </div>
                              </div>
                              <button onClick={() => handleHeartClick(product.productId)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
                                <Heart size={18} className={favorites.includes(product.productId) ? "fill-red-500 text-red-500" : "text-gray-600"} />
                              </button>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                              <div>
                                <div className="text-xs text-muted-foreground mb-0.5">MOQ</div>
                                <div className="font-medium text-foreground">{product.moq}벌</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground mb-0.5">카테고리</div>
                                <div className="font-medium text-foreground">{getCategoryDisplayName(product)}</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground mb-0.5">OEM/ODM</div>
                                <div className="font-medium text-foreground">{product.oemAvailable ? "가능" : "불가"}</div>
                              </div>
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

            <Pagination />

            {filteredProducts.length === 0 && (
                <div className="text-center py-20">
                  <Search size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">상품이 없습니다</h3>
                  <p className="text-sm text-muted-foreground">다른 카테고리나 브랜드를 선택해보세요</p>
                </div>
            )}
          </div>
        </div>
      </div>
  );
}

export const products: never[] = [];
