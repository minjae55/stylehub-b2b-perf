import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router";
import api from "../api/axios";
import {
  Truck,
  Shield,
  ChevronRight,
  ArrowRight,
  TrendingUp,
  Award,
  CheckCircle,
  ShoppingCart,
  Tag,
  Heart,
  FolderOpen,
  Check,
  Plus,
  X,
} from "lucide-react";

const categories = [
  { name: "상의", id: "tops", icon: "👕", iconImg: "/images/top.png" },
  { name: "하의", id: "bottoms", icon: "👖", iconImg: "/images/bottom.png" },
  { name: "원피스/세트", id: "dresses", icon: "👗", iconImg: "/images/one_piece.png" },
  { name: "아우터", id: "outerwear", icon: "🧥", iconImg: "/images/outer.png" },
  { name: "이너/언더웨어", id: "innerwear", icon: "🩱", iconImg: "/images/inner.png" },
  { name: "스포츠/애슬레저", id: "sports", icon: "🏃", iconImg: "/images/sports.png" },
  { name: "액세서리", id: "accessories", icon: "👜", iconImg: "/images/accessory.png" },
  { name: "신발", id: "shoes", icon: "👠", iconImg: "/images/shoes.png" },
];

const suppliers = [
  { name: "동대문패션(주)", category: "상의/하의", products: 842, years: 18, verified: true },
  { name: "트렌드하우스", category: "원피스/세트", products: 560, years: 12, verified: true },
  { name: "프리미엄어패럴", category: "아우터", products: 320, years: 22, verified: true },
  { name: "액티브웨어코리아", category: "스포츠/애슬레저", products: 215, years: 8, verified: true },
];

const heroSlides = [
  { image: "/images/banner1.png", label: "내추럴 무드" },
  { image: "/images/banner2.png", label: "국내 패션 B2B 도매" },
  { image: "/images/banner3.png", label: "시즌 컬렉션" },
  { image: "/images/banner4.png", label: "스트리트 무드" },
];

const popularBrands = [
  { name: "동대문패션(주)", logo: "/images/brands/ddm.png" },
  { name: "트렌드하우스", logo: "/images/brands/trend.png" },
  { name: "프리미엄어패럴", logo: "/images/brands/premium.png" },
  { name: "액티브웨어코리아", logo: "/images/brands/active.png" },
  { name: "패션액세서리몰", logo: "/images/brands/acc.png" },
];

interface ProductSummary {
  productId: number;
  productName: string;
  productEngName: string;
  brandId: number;
  brandName: string;
  categoryId: number;
  unitPrice: number;
  moq: number;
  oemAvailable: boolean;
  sampleAvailable: boolean;
  mainImageUrl: string | null;
  createdAt: string;
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

export function Home() {
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [newProducts, setNewProducts] = useState<ProductSummary[]>([]);
  const [popularProducts, setPopularProducts] = useState<ProductSummary[]>([]);

  const [folders, setFolders] = useState<Folder[]>(loadFolderData);
  const [folderModalProductId, setFolderModalProductId] = useState<number | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const newFolderInputRef = useRef<HTMLInputElement>(null);

  const favorites = [...new Set(folders.flatMap(f => f.productIds))];
  const allKnownProducts = [...newProducts, ...popularProducts];

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  }, []);
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  useEffect(() => {
    api.get("/products/new").then(res => setNewProducts(res)).catch(() => {});
    api.get("/products/popular").then(res => setPopularProducts(res)).catch(() => {});
  }, []);

  useEffect(() => {
    if (creatingFolder) {
      newFolderInputRef.current?.focus();
    }
  }, [creatingFolder]);

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

  const formatPrice = (price: number) => `₩${price.toLocaleString()}`;

  return (
      <div className="max-w-[1280px] mx-auto px-4 py-5">

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
                    const thumbImgs = ids.slice(0, needed).map(id => allKnownProducts.find(p => p.productId === id)?.mainImageUrl ?? null);
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

        {/* Hero + Quick Links */}
        <div className="grid grid-cols-[1fr_200px] gap-4 mb-6">
          <div className="relative rounded overflow-hidden min-h-[400px] flex flex-col justify-end">
            {heroSlides.map((slide, i) => (
                <img key={slide.image} src={slide.image} alt={slide.label}
                     className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === currentSlide ? "opacity-100" : "opacity-0"}`}
                />
            ))}
            <button onClick={prevSlide} className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors">
              <ChevronRight size={18} className="rotate-180" />
            </button>
            <button onClick={nextSlide} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors">
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-[72px] left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
              {heroSlides.map((_, i) => (
                  <button key={i} onClick={() => setCurrentSlide(i)} className={`rounded-full transition-all ${i === currentSlide ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"}`} />
              ))}
            </div>
            <div className="relative z-10 border-t border-white/10 bg-black/60 backdrop-blur-sm grid grid-cols-3 divide-x divide-white/10">
              {[{ label: "등록 셀러", value: "1,200+" }, { label: "취급 아이템", value: "8만+" }, { label: "월 거래액", value: "₩85억+" }].map((stat) => (
                  <div key={stat.label} className="py-3 text-center">
                    <div className="text-primary font-bold text-lg font-mono">{stat.value}</div>
                    <div className="text-white/70 text-xs">{stat.label}</div>
                  </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 self-start">
            <div className="bg-secondary rounded border border-primary/20 p-4">
              <div className="text-xs font-semibold text-primary tracking-wider mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1"><TrendingUp size={12} /> 실시간 인기 상품 🔥</span>
                <Link to="/products" className="text-muted-foreground hover:text-primary font-normal text-[11px]"></Link>
              </div>
              {popularProducts.length > 0 ? popularProducts.map((item, i) => (
                  <Link to={`/products/${item.productId}`} key={item.productId} className="flex items-center gap-2 py-1 border-b border-primary/20 last:border-0">
                    <span className={`font-mono text-[11px] font-bold w-4 flex-shrink-0 ${i < 3 ? "text-primary" : "text-muted-foreground"}`}>{i + 1}</span>
                    <div className="w-7 h-7 rounded overflow-hidden flex-shrink-0 bg-muted">
                      {item.mainImageUrl ? <img src={item.mainImageUrl} alt={item.productName} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-muted" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs hover:text-primary transition-colors line-clamp-1">{item.productName}</p>
                      <p className="text-[10px] text-primary font-semibold">{formatPrice(item.unitPrice)}</p>
                    </div>
                  </Link>
              )) : (
                  <p className="text-xs text-muted-foreground text-center py-4">인기 상품이 없습니다</p>
              )}
            </div>

            <div className="bg-secondary rounded border border-primary/20 p-4">
              <div className="text-xs font-semibold text-primary tracking-wider mb-3 flex items-center justify-between">
                <span>🏆 이번주 인기 브랜드</span>
                <Link to="/suppliers" className="text-muted-foreground hover:text-primary font-normal text-[11px]"></Link>
              </div>
              {popularBrands.map((brand, i) => (
                  <div key={brand.name} className="flex items-center gap-2 py-1 border-b border-primary/20 last:border-0">
                    <span className={`font-mono text-[11px] font-bold w-4 flex-shrink-0 ${i < 3 ? "text-primary" : "text-muted-foreground"}`}>{i + 1}</span>
                    <div className="w-7 h-7 rounded bg-white border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                    <span className="text-xs text-foreground truncate">{brand.name}</span>
                  </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Circles */}
        <div className="flex justify-center gap-6 mb-6">
          {categories.map((cat) => (
              <Link key={cat.id} to={`/products?category=${cat.id}`} className="flex flex-col items-center gap-2 group transition-transform hover:scale-105">
                <div className="w-20 h-20 rounded-full border-2 border-border bg-white flex items-center justify-center text-3xl group-hover:border-primary group-hover:bg-primary/5 transition-all overflow-hidden">
                  {cat.iconImg ? <img src={cat.iconImg} alt={cat.name} className="w-15 h-15 object-contain" /> : cat.icon}
                </div>
                <span className="text-sm text-foreground group-hover:text-primary transition-colors font-medium">{cat.name}</span>
              </Link>
          ))}
          <Link to="/products" className="flex flex-col items-center gap-2 group transition-transform hover:scale-105">
            <div className="w-20 h-20 rounded-full border-2 border-border bg-white flex items-center justify-center text-2xl group-hover:border-primary group-hover:bg-primary/5 transition-all overflow-hidden">
              <img src="/images/all.png" alt="전체보기" className="w-12 h-12 object-contain" />
            </div>
            <span className="text-sm text-foreground group-hover:text-primary transition-colors font-medium">전체보기</span>
          </Link>
          <Link to="/suppliers" className="flex flex-col items-center gap-2 group transition-transform hover:scale-105">
            <div className="w-20 h-20 rounded-full border-2 border-border bg-white flex items-center justify-center text-2xl group-hover:border-primary group-hover:bg-primary/5 transition-all overflow-hidden">
              <img src="/images/brand.png" alt="브랜드" className="w-18 h-18 object-contain" />
            </div>
            <span className="text-sm text-foreground group-hover:text-primary transition-colors font-medium">브랜드</span>
          </Link>
          <Link to="/products" className="flex flex-col items-center gap-2 group transition-transform hover:scale-105">
            <div className="w-20 h-20 rounded-full border-2 border-border bg-white flex items-center justify-center text-2xl group-hover:border-primary group-hover:bg-primary/5 transition-all overflow-hidden">
              <img src="/images/discount.png" alt="시즌할인" className="w-18 h-18 object-contain" />
            </div>
            <span className="text-sm text-foreground group-hover:text-primary transition-colors font-medium">시즌할인</span>
          </Link>
        </div>

        {/* 신규 상품 */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">신규 상품</h2>
            <Link to="/products" className="text-sm text-primary hover:underline flex items-center gap-1">전체보기 <ArrowRight size={14} /></Link>
          </div>
          {newProducts.length > 0 ? (
              <div className="grid grid-cols-6 gap-4">
                {newProducts.map((product) => (
                    <div key={product.productId} onMouseEnter={() => setHoveredProduct(product.productId)} onMouseLeave={() => setHoveredProduct(null)}
                         className="bg-white rounded border border-border overflow-hidden hover:shadow-lg hover:border-primary/40 transition-all">
                      <Link to={`/products/${product.productId}`} className="block">
                        <div className="relative overflow-hidden bg-muted aspect-square">
                          {product.mainImageUrl
                              ? <img src={product.mainImageUrl} alt={product.productName} className={`w-full h-full object-cover transition-transform duration-300 ${hoveredProduct === product.productId ? "scale-105" : ""}`} />
                              : <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs">이미지 없음</div>
                          }
                          <div className="absolute top-2 right-2 bg-[#6B21A8] text-white text-[10px] px-1.5 py-0.5 rounded font-semibold">NEW</div>
                        </div>
                        <div className="p-3">
                          <div className="text-xs text-muted-foreground mb-1 truncate">{product.brandName}</div>
                          <h4 className="text-sm font-medium text-foreground mb-2 line-clamp-2 leading-snug">{product.productName}</h4>
                          <div className="text-primary font-bold text-base">{formatPrice(product.unitPrice)}<span className="text-xs font-normal text-muted-foreground">/벌</span></div>
                          <div className="mt-2 text-xs text-muted-foreground">최소 {product.moq}벌</div>
                        </div>
                      </Link>
                      <div className="px-3 pb-3 flex items-center justify-between">
                        <button onClick={() => handleHeartClick(product.productId)} className="text-muted-foreground hover:text-primary transition-colors">
                          <Heart size={14} className={favorites.includes(product.productId) ? "fill-red-500 text-red-500" : ""} />
                        </button>
                        <Link to="/cart" className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors text-xs">
                          <ShoppingCart size={12} /> 담기
                        </Link>
                      </div>
                    </div>
                ))}
              </div>
          ) : (
              <div className="text-center text-muted-foreground text-sm py-10">등록된 신규 상품이 없습니다</div>
          )}
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

      </div>
  );
}
