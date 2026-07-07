import { useState, useEffect } from "react";
import { Link } from "react-router";
import api from "../../api/axios";
import { AlertModal } from "../../components/common/Modal";
import {
  Heart, ShoppingCart, Search, Grid3x3, List,
  FolderOpen, FolderPlus, ChevronLeft
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

// [수정] 백엔드 WishlistDto.FolderResponse 그대로 매핑
interface BackendFolder {
  wishlistFolderId: number;
  folderName: string;
  isDefault: boolean;
  sortOrder: number;
  itemCount: number;
}

// [수정] 백엔드 WishlistDto.ItemResponse 그대로 매핑
interface BackendItem {
  wishlistId: number;
  productId: number;
  productName: string;
  thumbnailUrl: string | null; // 백엔드에서 항상 null (임시처리 상태) - /products 목록과 매칭해서 채움
  price: number;
  brandName: string | null;
  folderName: string; // 폴더 id가 아니라 이름으로 내려옴 (유저별 폴더명은 유니크)
}

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
    return <img src={images[0]!} alt="" className="w-full h-full object-cover" />;
  }

  if (count < 4) {
    return (
        <div className="w-full h-full grid grid-cols-2 gap-0.5">
          {images.slice(0, 2).map((img, i) =>
              img ? <img key={i} src={img} alt="" className="w-full h-full object-cover" />
                  : <div key={i} className="w-full h-full bg-muted" />
          )}
        </div>
    );
  }

  return (
      <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-0.5">
        {images.slice(0, 4).map((img, i) =>
            img ? <img key={i} src={img} alt="" className="w-full h-full object-cover" />
                : <div key={i} className="w-full h-full bg-muted" />
        )}
      </div>
  );
}

export function Wishlist() {
  const [folders, setFolders] = useState<BackendFolder[]>([]);
  const [wishItems, setWishItems] = useState<BackendItem[]>([]); // 내 찜 전체 (모든 폴더 합산)
  const [allProducts, setAllProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const [viewType, setViewType] = useState<"folder" | "grid" | "list">("folder");
  const [openFolderId, setOpenFolderId] = useState<number | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchWishlistData = async () => {
    try {
      const [folderData, itemData] = await Promise.all([
        api.get<BackendFolder[]>("/wishlist/folders"),
        api.get<BackendItem[]>("/wishlist"),
      ]);
      setFolders(folderData);
      setWishItems(itemData);
    } catch (err) {
      console.error(err);
      setAlertMessage("찜 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlistData();
    api.get("/products").then(res => setAllProducts(res)).catch(() => {});
  }, []);

  // 찜 항목 하나에 /products 목록의 이미지 등을 매칭해서 합친 표시용 타입
  const enrichedItems = wishItems.map((item) => {
    const full = allProducts.find((p) => p.productId === item.productId);
    return {
      ...item,
      mainImageUrl: full?.mainImageUrl ?? item.thumbnailUrl,
      brandName: item.brandName ?? full?.brandName ?? "",
    };
  });

  const currentFolder = openFolderId != null ? folders.find(f => f.wishlistFolderId === openFolderId) : null;

  const currentItems = currentFolder
      ? enrichedItems.filter((it) => it.folderName === currentFolder.folderName)
      : enrichedItems;

  // 표시용 상품 목록 ("전체" 뷰에서는 같은 상품이 여러 폴더에 있어도 productId 기준 중복 제거)
  const dedupedCurrentItems = currentFolder
      ? currentItems
      : Array.from(new Map(currentItems.map((it) => [it.productId, it])).values());

  const wishlistProducts = dedupedCurrentItems.filter((p) =>
      !searchQuery ||
      p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.brandName ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 찜 삭제 - 폴더 안에서 뺄 땐 그 폴더의 항목 하나만, "전체" 뷰에서 뺄 땐 그 상품이 들어간 모든 폴더에서 다 삭제
  const removeWishlistItem = async (productId: number, wishlistIdInThisView: number) => {
    const targetIds = currentFolder
        ? [wishlistIdInThisView]
        : wishItems.filter((it) => it.productId === productId).map((it) => it.wishlistId);

    try {
      await Promise.all(targetIds.map((id) => api.delete(`/wishlist/${id}`)));
      await fetchWishlistData();
    } catch (err: any) {
      console.error(err);
      setAlertMessage(err?.message || "찜 삭제 중 오류가 발생했습니다.");
    }
  };

  const createFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    try {
      await api.post("/wishlist/folders", { folderName: name });
      setCreatingFolder(false);
      setNewFolderName("");
      await fetchWishlistData();
    } catch (err: any) {
      console.error(err);
      setAlertMessage(err?.message || "폴더 생성 중 오류가 발생했습니다.");
    }
  };

  const getFolderImages = (folder: BackendFolder) => {
    const idsInFolder = enrichedItems.filter((it) => it.folderName === folder.folderName);
    const count = idsInFolder.length;
    if (count === 0) return [];
    const needed = count === 1 ? 1 : count < 4 ? 2 : 4;
    return idsInFolder.slice(0, needed).map((it) => it.mainImageUrl ?? null);
  };

  if (loading) {
    return (
        <div className="max-w-[1280px] mx-auto px-4 py-16 text-center text-sm text-muted-foreground">
          불러오는 중...
        </div>
    );
  }

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
            return (
                <div key={folder.wishlistFolderId} className="group bg-white border border-border rounded-xl overflow-hidden hover:shadow-md hover:border-primary/40 transition-all">
                  <button
                      onClick={() => { setOpenFolderId(folder.wishlistFolderId); setViewType("grid"); }}
                      className="w-full aspect-square overflow-hidden bg-muted block relative"
                  >
                    <FolderPreview images={images} />
                    <span className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
                      {folder.itemCount}개
                    </span>
                  </button>
                  <div className="px-3 py-2.5 flex items-center gap-1.5">
                    <span
                        onClick={() => { setOpenFolderId(folder.wishlistFolderId); setViewType("grid"); }}
                        className="flex-1 text-sm font-medium text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                    >
                      {folder.folderName}
                    </span>
                    {/* 폴더 이름변경/삭제는 백엔드에 아직 해당 API가 없어서 뺐어요 */}
                  </div>
                </div>
            );
          })}
        </div>
      </div>
  );

  const ProductListView = () => (
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            총 <span className="font-bold text-foreground">{wishlistProducts.length}</span>개 상품
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
                  <div key={`${product.wishlistId}`} className="bg-white border border-border rounded-lg overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all group">
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
                            removeWishlistItem(product.productId, product.wishlistId);
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
                        <span className="text-xl font-bold text-primary">₩{product.price.toLocaleString()}</span>
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
                  <div key={`${product.wishlistId}`} className="bg-white border border-border rounded-lg p-4 hover:shadow-md hover:border-primary/50 transition-all">
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
                            <div className="text-xs text-muted-foreground mb-1">{product.brandName}</div>
                            <Link to={`/products/${product.productId}`}>
                              <h3 className="font-semibold text-foreground text-lg mb-1 hover:text-primary transition-colors">{product.productName}</h3>
                            </Link>
                            <div className="flex items-baseline gap-1 mb-2">
                              <span className="text-2xl font-bold text-primary">₩{product.price.toLocaleString()}</span>
                              <span className="text-xs text-muted-foreground">/벌</span>
                            </div>
                          </div>
                          <button
                              onClick={() => removeWishlistItem(product.productId, product.wishlistId)}
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
  const totalFavCount = new Set(wishItems.map((it) => it.productId)).size;

  return (
      <div className="max-w-[1280px] mx-auto px-4 py-8 font-[Inter,sans-serif]">

        {alertMessage && (
            <AlertModal message={alertMessage} onClose={() => setAlertMessage(null)} />
        )}

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
                    autoFocus
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
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
          {openFolderId != null && (
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
              {currentFolder ? currentFolder.folderName : "찜 목록"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isProductView
                  ? <>총 <span className="font-bold text-foreground">{wishlistProducts.length}</span>개 상품</>
                  : <>폴더 <span className="font-bold text-foreground">{folders.length}</span>개 · 찜 상품 <span className="font-bold text-foreground">{totalFavCount}</span>개</>
              }
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white border border-border rounded-lg p-4 mb-6 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
                type="text"
                placeholder="찜한 상품명으로 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
                onClick={() => { setViewType("folder"); setOpenFolderId(null); }}
                className={`p-2.5 rounded-lg transition-colors ${viewType === "folder" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                title="폴더 보기"
            >
              <FolderOpen size={18} />
            </button>
            <button
                onClick={() => { setViewType("grid"); setOpenFolderId(null); }}
                className={`p-2.5 rounded-lg transition-colors ${viewType === "grid" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                title="그리드 보기"
            >
              <Grid3x3 size={18} />
            </button>
            <button
                onClick={() => { setViewType("list"); setOpenFolderId(null); }}
                className={`p-2.5 rounded-lg transition-colors ${viewType === "list" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                title="리스트 보기"
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* 컨텐츠 */}
        {viewType === "folder" ? <FolderListView /> : <ProductListView />}
      </div>
  );
}
