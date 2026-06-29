import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import api from "../../api/axios";
import {
  Heart, ShoppingCart, Search, Grid3x3, List, ChevronDown,
  FolderOpen, FolderPlus, Pencil, Trash2, Check, X, ChevronLeft
} from "lucide-react";

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

interface WishFolder {
  id: string;
  name: string;
  productIds: number[];
}

// ─── 폴더 미리보기 이미지 그리드 ───────────────────────────────────────────
function FolderPreview({ images }: { images: (string | null)[] }) {
  const count = images.length;

  if (count === 0) {
    return (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <Heart size={32} className="text-muted-foreground opacity-30" />
        </div>
    );
  }

  if (count === 1) {
    return (
        <img
            src={images[0]!}
            alt=""
            className="w-full h-full object-cover"
        />
    );
  }

  if (count < 4) {
    // 2개: 좌우 분할
    return (
        <div className="w-full h-full grid grid-cols-2 gap-0.5">
          {images.slice(0, 2).map((img, i) =>
              img ? (
                  <img key={i} src={img} alt="" className="w-full h-full object-cover" />
              ) : (
                  <div key={i} className="w-full h-full bg-muted" />
              )
          )}
        </div>
    );
  }

  // 4개: 2×2
  return (
      <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-0.5">
        {images.slice(0, 4).map((img, i) =>
            img ? (
                <img key={i} src={img} alt="" className="w-full h-full object-cover" />
            ) : (
                <div key={i} className="w-full h-full bg-muted" />
            )
        )}
      </div>
  );
}

// ─── 상수 ──────────────────────────────────────────────────────────────────
const DEFAULT_FOLDER_ID = "default";

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



// ─── localStorage 헬퍼 ──────────────────────────────────────────────────────
function loadFolders(): WishFolder[] {
  try {
    const raw = localStorage.getItem("wishlistFolders");
    if (raw) return JSON.parse(raw);
  } catch {}
  // 기존 wishlist 마이그레이션
  try {
    const old = localStorage.getItem("wishlist");
    if (old) {
      const ids: number[] = JSON.parse(old);
      const folders: WishFolder[] = [{ id: DEFAULT_FOLDER_ID, name: "전체 찜", productIds: ids }];
      localStorage.setItem("wishlistFolders", JSON.stringify(folders));
      localStorage.removeItem("wishlist");
      return folders;
    }
  } catch {}
  return [{ id: DEFAULT_FOLDER_ID, name: "전체 찜", productIds: [] }];
}

function saveFolders(folders: WishFolder[]) {
  localStorage.setItem("wishlistFolders", JSON.stringify(folders));
}

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────
export function Wishlist() {
  const [folders, setFolders] = useState<WishFolder[]>(loadFolders);
  const [allProducts, setAllProducts] = useState<ProductSummary[]>([]);

  // 뷰: "folder" | "products"
  const [viewType, setViewType] = useState<"folder" | "grid" | "list">("folder");
  // 현재 열려있는 폴더 id (null이면 폴더 목록)
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);

  // 폴더 이름 편집
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  // 새 폴더 생성 모드
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [brandChosung, setBrandChosung] = useState("전체");
  const [brandPanelOpen, setBrandPanelOpen] = useState(false);
  const brandScrollRef = useRef<HTMLDivElement>(null);
  const brandPanelRef = useRef<HTMLDivElement>(null);
  const [brandVisibleCount, setBrandVisibleCount] = useState(10);
  const [searchTab, setSearchTab] = useState<"product" | "category" | "brand">("product");
  const [tabDropOpen, setTabDropOpen] = useState(false);
  const [resultDropOpen, setResultDropOpen] = useState(false);
  const tabDropRef = useRef<HTMLDivElement>(null);
  const resultDropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get("/products").then(res => setAllProducts(res)).catch(() => {});
  }, []);

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

  // 폴더 저장 동기화
  useEffect(() => { saveFolders(folders); }, [folders]);

  // 전체 찜 상품 ID 목록 (모든 폴더 합산 중복제거)
  const allFavIds = [...new Set(folders.flatMap(f => f.productIds))];

  // 현재 열린 폴더의 상품 ID
  const currentFolderIds = openFolderId
      ? (folders.find(f => f.id === openFolderId)?.productIds ?? [])
      : allFavIds;

  const searchResults = searchQuery.trim().length < 1 ? [] : (() => {
    const q = searchQuery.trim().toLowerCase();
    if (searchTab === "product") return allProducts.filter(p => p.productName.toLowerCase().includes(q) || p.brandName.toLowerCase().includes(q)).slice(0, 6);
    if (searchTab === "category") return searchDummyCategories.filter(c => c.name.toLowerCase().includes(q) || c.subCategories.some(s => s.toLowerCase().includes(q)) || (c.alias ?? []).some(a => a.toLowerCase().includes(q))).slice(0, 6);
    if (searchTab === "brand") return searchDummyBrands.filter(b => b.name.toLowerCase().includes(q)).slice(0, 6);
    return [];
  })();

  const wishlistProducts = allProducts.filter((p) => {
    const inFolder = currentFolderIds.includes(p.productId);
    const matchCategory = selectedCategory === "all" || p.categoryName === categoryIdMap[selectedCategory];
    const matchBrand = !selectedBrand || p.brandName === selectedBrand;
    const matchSearch = !searchQuery || p.productName.toLowerCase().includes(searchQuery.toLowerCase()) || p.brandName.toLowerCase().includes(searchQuery.toLowerCase());
    return inFolder && matchCategory && matchBrand && matchSearch;
  });

  // 찜 해제 (모든 폴더에서 제거)
  const removeFromAll = (productId: number) => {
    setFolders(prev => prev.map(f => ({ ...f, productIds: f.productIds.filter(id => id !== productId) })));
  };

  // 폴더에서만 제거
  const removeFromFolder = (folderId: string, productId: number) => {
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, productIds: f.productIds.filter(id => id !== productId) } : f));
  };

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    if (viewType === "folder") { setViewType("grid"); setOpenFolderId(DEFAULT_FOLDER_ID); }
  };

  // 폴더 생성 모달 ref
  const newFolderInputRef = useRef<HTMLInputElement>(null);
  const editingInputRef = useRef<HTMLInputElement>(null);

  // 폴더 생성 (ref 방식)
  const createFolder = () => {
    const name = (newFolderInputRef.current?.value ?? "").trim();
    if (!name) return;
    const folder: WishFolder = { id: genId(), name, productIds: [] };
    setFolders(prev => [...prev, folder]);
    setCreatingFolder(false);
  };

  // 폴더 이름 수정 (ref 방식)
  const renameFolder = (id: string) => {
    const name = (editingInputRef.current?.value ?? "").trim();
    if (!name) return;
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f));
    setEditingFolderId(null);
  };

  // 폴더 삭제 (기본 폴더 불가)
  const deleteFolder = (id: string) => {
    if (id === DEFAULT_FOLDER_ID) return;
    setFolders(prev => prev.filter(f => f.id !== id));
    if (openFolderId === id) setOpenFolderId(null);
  };

  // 폴더 썸네일 이미지 추출
  const getFolderImages = (folder: WishFolder) => {
    const count = folder.productIds.length;
    if (count === 0) return [];
    const needed = count === 1 ? 1 : count < 4 ? 2 : 4;
    return folder.productIds.slice(0, needed).map(id => allProducts.find(p => p.productId === id)?.mainImageUrl ?? null);
  };

  // 현재 폴더 정보
  const currentFolder = openFolderId ? folders.find(f => f.id === openFolderId) : null;

  // ── 폴더 목록 뷰 ─────────────────────────────────────────────────────────
  const FolderListView = () => (
      <div>
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-muted-foreground">
            폴더 <span className="font-bold text-foreground">{folders.length}</span>개
          </p>
          <button
              onClick={() => setCreatingFolder(true)}
              className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            <FolderPlus size={16} /> 새 폴더
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {folders.map((folder) => {
            const images = getFolderImages(folder);
            const isEditing = editingFolderId === folder.id;
            return (
                <div key={folder.id} className="group bg-white border border-border rounded-xl overflow-hidden hover:shadow-md hover:border-primary/40 transition-all">
                  {/* 썸네일 */}
                  <button
                      onClick={() => { if (!isEditing) { setOpenFolderId(folder.id); setViewType("grid"); } }}
                      className="w-full aspect-square overflow-hidden bg-muted block relative"
                  >
                    <FolderPreview images={images} />
                    {/* 상품 수 뱃지 */}
                    <span className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
                  {folder.productIds.length}개
                </span>
                  </button>

                  {/* 폴더 이름 + 액션 */}
                  <div className="px-3 py-2.5 flex items-center gap-1.5">
                    {isEditing ? (
                        <>
                          <input
                              ref={editingInputRef}
                              autoFocus
                              defaultValue={editingName}
                              onKeyDown={e => { if (e.nativeEvent.isComposing) return; if (e.key === "Enter") renameFolder(folder.id); if (e.key === "Escape") setEditingFolderId(null); }}
                              className="flex-1 text-sm outline-none border-b border-primary text-foreground bg-transparent"
                          />
                          <button onClick={() => renameFolder(folder.id)} className="text-primary"><Check size={13} /></button>
                          <button onClick={() => setEditingFolderId(null)} className="text-muted-foreground"><X size={13} /></button>
                        </>
                    ) : (
                        <>
                    <span
                        onClick={() => { setOpenFolderId(folder.id); setViewType("grid"); }}
                        className="flex-1 text-sm font-medium text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                    >
                      {folder.name}
                    </span>
                          <button
                              onClick={() => { setEditingFolderId(folder.id); setEditingName(folder.name); }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                          >
                            <Pencil size={13} />
                          </button>
                          {folder.id !== DEFAULT_FOLDER_ID && (
                              <button
                                  onClick={() => deleteFolder(folder.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
                              >
                                <Trash2 size={13} />
                              </button>
                          )}
                        </>
                    )}
                  </div>
                </div>
            );
          })}
        </div>
      </div>
  );

  // ── 상품 목록 뷰 (그리드/리스트) ─────────────────────────────────────────
  const ProductListView = () => (
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            총 <span className="font-bold text-foreground">{wishlistProducts.length}</span>개 상품
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
        ) : viewType === "grid" ? (
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
                      <button
                          onClick={(e) => {
                            e.preventDefault();
                            openFolderId ? removeFromFolder(openFolderId, product.productId) : removeFromAll(product.productId);
                          }}
                          className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm"
                      >
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
                          <button
                              onClick={() => openFolderId ? removeFromFolder(openFolderId, product.productId) : removeFromAll(product.productId)}
                              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors"
                          >
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
  );

  const isProductView = viewType === "grid" || viewType === "list";

  return (
      <div className="max-w-[1480px] mx-auto px-4 py-8 font-[Inter,sans-serif]">

        {/* 새 폴더 생성 모달 */}
        {creatingFolder && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setCreatingFolder(false)}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <FolderOpen size={20} className="text-primary" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">새 폴더 만들기</h2>
                </div>
                <input
                    ref={newFolderInputRef}
                    autoFocus
                    placeholder="폴더 이름을 입력하세요"
                    onKeyDown={e => { if (e.nativeEvent.isComposing) return; if (e.key === "Enter") createFolder(); if (e.key === "Escape") setCreatingFolder(false); }}
                    className="w-full border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground mb-5"
                />
                <div className="flex gap-2">
                  <button onClick={() => setCreatingFolder(false)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors">취소</button>
                  <button onClick={createFolder} className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">만들기</button>
                </div>
              </div>
            </div>
        )}
        {/* 헤더 */}
        <div className="mb-8 flex items-center gap-3">
          {openFolderId && (
              <button
                  onClick={() => { setOpenFolderId(null); setViewType("folder"); }}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft size={20} />
              </button>
          )}
          <Heart size={24} className="text-primary fill-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {currentFolder ? currentFolder.name : "찜 목록"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isProductView
                  ? <>총 <span className="font-bold text-foreground">{wishlistProducts.length}</span>개 상품</>
                  : <>폴더 <span className="font-bold text-foreground">{folders.length}</span>개 · 찜 상품 <span className="font-bold text-foreground">{allFavIds.length}</span>개</>
              }
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white border border-border rounded-lg p-4 mb-6 flex items-center gap-4">
          <div className="flex-1 relative">
            <div className="flex border border-border rounded-lg">
              <div className="relative" ref={tabDropRef}>
                <button
                    onClick={() => setTabDropOpen((v) => !v)}
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

          {/* 뷰 전환 버튼 */}
          <div className="flex items-center gap-2">
            <button
                onClick={() => { setViewType("folder"); setOpenFolderId(null); }}
                className={`p-2.5 rounded-lg transition-colors ${viewType === "folder" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                title="폴더 보기"
            >
              <FolderOpen size={18} />
            </button>
            <button
                onClick={() => { setViewType("grid"); if (!openFolderId) setOpenFolderId(DEFAULT_FOLDER_ID); }}
                className={`p-2.5 rounded-lg transition-colors ${viewType === "grid" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                title="그리드 보기"
            >
              <Grid3x3 size={18} />
            </button>
            <button
                onClick={() => { setViewType("list"); if (!openFolderId) setOpenFolderId(DEFAULT_FOLDER_ID); }}
                className={`p-2.5 rounded-lg transition-colors ${viewType === "list" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                title="리스트 보기"
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* 본문 - 항상 사이드바 + 컨텐츠 2컬럼 */}
        <div className="grid grid-cols-[240px_1fr] gap-6">
          {/* Sidebar */}
          <div className="space-y-6">

            {/* ── 카테고리 섹션 ── */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">카테고리</p>
              <div className="space-y-1">
                {categories.map((cat) => (
                    <div key={cat.id}>
                      <button
                          onClick={() => handleCategoryChange(cat.id)}
                          className={`w-full text-left px-4 py-2.5 rounded-lg transition-all text-sm ${selectedCategory === cat.id ? "bg-primary text-white font-semibold shadow-sm" : "bg-white border border-border text-foreground hover:border-primary hover:text-primary"}`}
                      >
                        {cat.name}
                      </button>
                    </div>
                ))}
              </div>
            </div>

            {/* ── 브랜드 섹션 ── */}
            <div className="relative" ref={brandPanelRef}>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">브랜드</p>
              <button
                  onClick={() => { if (selectedBrand) { setSelectedBrand(""); } else { setBrandPanelOpen(v => !v); } }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-semibold transition-all border ${selectedBrand ? "bg-primary text-white border-primary" : "bg-white text-foreground border-border hover:border-primary hover:text-primary"}`}
              >
                <span>{selectedBrand || "브랜드 선택"}</span>
                {selectedBrand ? <X size={14} /> : <ChevronDown size={14} className={`transition-transform ${brandPanelOpen ? "rotate-180" : ""}`} />}
              </button>

              {/* 브랜드 드롭다운 패널 */}
              {brandPanelOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-xl z-30">
                    {/* 초성 필터 */}
                    <div className="flex flex-wrap gap-1 p-2.5 border-b border-border">
                      {CHOSUNG.map((c) => (
                          <button key={c} onClick={() => { setBrandChosung(c); setBrandVisibleCount(10); }}
                                  className={`text-xs px-1.5 py-0.5 rounded transition-colors ${brandChosung === c ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-primary"}`}>
                            {c}
                          </button>
                      ))}
                    </div>
                    {/* 브랜드 목록 */}
                    <div
                        ref={brandScrollRef}
                        onScroll={() => {
                          const el = brandScrollRef.current;
                          if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 10)
                            setBrandVisibleCount(v => v + 10);
                        }}
                        className="max-h-56 overflow-y-auto"
                    >
                      {(() => {
                        const filtered = brandChosung === "전체"
                            ? searchDummyBrands
                            : searchDummyBrands.filter(b => getChosung(b.name) === brandChosung);
                        const visible = filtered.slice(0, brandVisibleCount);
                        if (visible.length === 0)
                          return <div className="text-center py-6 text-xs text-muted-foreground">해당 브랜드가 없습니다</div>;
                        return visible.map((brand) => (
                            <button
                                key={brand.name}
                                onClick={() => { setSelectedBrand(brand.name); setBrandPanelOpen(false); if (viewType === "folder") { setViewType("grid"); setOpenFolderId(DEFAULT_FOLDER_ID); } }}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 border-b border-border last:border-0 transition-colors text-left ${selectedBrand === brand.name ? "bg-primary/10 text-primary" : "hover:bg-secondary text-foreground"}`}
                            >
                              <div className="w-7 h-7 rounded bg-white border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                                <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                              </div>
                              <span className="text-xs flex-1 truncate">{brand.name}</span>
                              {selectedBrand === brand.name && <span className="text-primary font-bold text-xs">✓</span>}
                            </button>
                        ));
                      })()}
                    </div>
                  </div>
              )}
            </div>

          </div>

          {/* 컨텐츠 영역 */}
          {viewType === "folder" ? <FolderListView /> : <ProductListView />}
        </div>
      </div>
  );
}
