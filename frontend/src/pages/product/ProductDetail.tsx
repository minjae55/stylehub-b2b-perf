import api from "../../api/axios";
import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ArrowLeft, ShoppingCart, Truck, Shield, CheckCircle,
  Award, MapPin, Phone, Mail, Plus, Minus, Leaf, RefreshCw,
  Heart, Users, ShieldCheck, FileText, FolderOpen, Check, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
} from "lucide-react";

type CertKey = "KC" | "OEKO-TEX" | "GOTS" | "GRS" | "비건" | "Fair Trade" | "REACH" | "CPSIA" | "UKCA" | "어린이안전" | "환경마크" | "섬유품질";

const certConfig: Record<CertKey, { label: string; bg: string; border: string; color: string; iconBg: string; icon: React.ReactNode }> = {
  "KC":         { label: "KC 인증",         bg: "#EEF2FF", border: "#C7D2FE", color: "#3730A3", iconBg: "#4338CA", icon: <span style={{ fontSize: 9, fontWeight: 700 }}>KC</span> },
  "OEKO-TEX":  { label: "OEKO-TEX",        bg: "#ECFDF5", border: "#A7F3D0", color: "#065F46", iconBg: "#059669", icon: <CheckCircle size={11} /> },
  "GOTS":      { label: "GOTS",            bg: "#F0FDF4", border: "#BBF7D0", color: "#14532D", iconBg: "#16A34A", icon: <Leaf size={11} /> },
  "GRS":       { label: "GRS",             bg: "#FFFBEB", border: "#FDE68A", color: "#78350F", iconBg: "#D97706", icon: <RefreshCw size={11} /> },
  "비건":      { label: "비건 인증",        bg: "#F5F3FF", border: "#DDD6FE", color: "#4C1D95", iconBg: "#7C3AED", icon: <Heart size={11} /> },
  "Fair Trade":{ label: "Fair Trade",      bg: "#FFF7ED", border: "#FED7AA", color: "#7C2D12", iconBg: "#EA580C", icon: <Users size={11} /> },
  "REACH":     { label: "REACH (EU)",      bg: "#EFF6FF", border: "#BFDBFE", color: "#1E3A8A", iconBg: "#1D4ED8", icon: <span style={{ fontSize: 9, fontWeight: 700 }}>EU</span> },
  "CPSIA":     { label: "CPSIA",           bg: "#FDF2F8", border: "#FBCFE8", color: "#831843", iconBg: "#DB2777", icon: <ShieldCheck size={11} /> },
  "UKCA":      { label: "UKCA (영국)",     bg: "#F8F8FF", border: "#C7C7FE", color: "#1E1E8A", iconBg: "#1E1E8A", icon: <span style={{ fontSize: 9, fontWeight: 700 }}>UK</span> },
  "어린이안전": { label: "어린이 안전인증", bg: "#FFF1F2", border: "#FECDD3", color: "#881337", iconBg: "#E11D48", icon: <ShieldCheck size={11} /> },
  "환경마크":  { label: "환경마크",         bg: "#F0FDF4", border: "#BBF7D0", color: "#14532D", iconBg: "#15803D", icon: <Leaf size={11} /> },
  "섬유품질":  { label: "섬유품질 적합",    bg: "#EEF2FF", border: "#C7D2FE", color: "#3730A3", iconBg: "#4338CA", icon: <CheckCircle size={11} /> },
};

// 상품 등록 시 사용하는 인증서 이름(certName) → CertBadge 키 매핑
const certNameToKeyMap: Record<string, CertKey> = {
  "KC 인증": "KC",
  "어린이제품 안전인증": "어린이안전",
  "환경부 환경마크": "환경마크",
  "GR 우수재활용제품": "GRS",
  "섬유품질표시 적합": "섬유품질",
  "OEKO-TEX Standard 100": "OEKO-TEX",
  "GOTS (유기농 섬유)": "GOTS",
  "Recycled Content (GRS)": "GRS",
  "비건 인증": "비건",
  "Fair Trade": "Fair Trade",
};

function CertBadge({ certKey }: { certKey: CertKey }) {
  const c = certConfig[certKey];
  if (!c) return null;
  return (
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "5px 10px", borderRadius: 20,
        background: c.bg, border: `0.5px solid ${c.border}`, color: c.color,
        fontSize: 11, fontWeight: 500, whiteSpace: "nowrap",
      }}>
      <span style={{
        background: c.iconBg, color: "#fff", borderRadius: "50%",
        width: 18, height: 18,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {c.icon}
      </span>
        {c.label}
      </div>
  );
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

// 옵션 name/value 쌍 타입
interface OptionValue {
  optionName: string;
  optionValue: string;
  sortOrder: number;
}

interface ProductDetailData {
  productId: number;
  sellerId: number;
  companyId: number;
  categoryId: number;
  categoryName: string;
  brandId: number;
  brandName: string;
  productName: string;
  productEngName: string;
  returnPolicy: string;
  viewCount: number;
  season: string;
  moq: number;
  unitPrice: number;
  leadTimeDays: number;
  mainMaterial: string;
  materialCert: string;
  description: string;
  careInstruction: string;
  productUrl: string;
  oemAvailable: boolean;
  sampleAvailable: boolean;
  whiteLabel: boolean;
  createdAt: string;
  updatedAt: string;
  certifications?: { certName: string }[];
  isActive?: boolean;
  options: {
    productOptionId: number;
    optionLabel: string;
    sku: string;
    stockQuantity: number;
    additionalPrice: number;
    restockAlertQuantity: number;
    isActive: boolean;
    optionValues: OptionValue[];
    images: {
      productImageId: number;
      imageUrl: string;
      sortOrder: number;
      isMain: boolean;
    }[];
  }[];
}

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<ProductDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(0); // 레거시(옵션값 없는 상품) 폴백용
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({}); // 옵션 그룹별 선택값
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [folders, setFolders] = useState<Folder[]>(loadFolderData);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [allProducts, setAllProducts] = useState<{productId: number; mainImageUrl: string | null}[]>([]);
  const [pdfExpanded, setPdfExpanded] = useState(false);

  useEffect(() => {
    api.get("/products").then(res => setAllProducts(res)).catch(() => {});
  }, []);

  const favorites = [...new Set(folders.flatMap(f => f.productIds))];
  const productId = product?.productId ?? null;
  const isFavorite = productId !== null && favorites.includes(productId);

  // 자동 캐러셀 useEffect는 early return보다 반드시 위에 있어야 함 (Hook 개수/순서 일관성 유지)
  const allImagesForEffect = product?.options.flatMap(opt => opt.images).sort((a, b) => a.sortOrder - b.sortOrder) ?? [];
  useEffect(() => {
    if (allImagesForEffect.length <= 1) return;
    const timer = setInterval(() => {
      setSelectedImage(i => (i + 1) % allImagesForEffect.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [allImagesForEffect.length, selectedImage]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/products/${id}`)
        .then(res => {
          setProduct(res);
          setQuantity(res.moq ?? 1);
          // 옵션값이 구조화되어 있으면 첫 옵션 조합으로 초기 선택
          const first = res.options?.[0];
          if (first?.optionValues?.length > 0) {
            const initial: Record<string, string> = {};
            first.optionValues.forEach((v: OptionValue) => { initial[v.optionName] = v.optionValue; });
            setSelectedValues(initial);
          } else {
            setSelectedValues({});
          }
          setSelectedOptionIdx(0);
          setSelectedImage(0);
        })
        .catch(() => alert("상품 정보를 불러오지 못했습니다."))
        .finally(() => setLoading(false));
  }, [id]);

  const handleHeartClick = () => {
    if (!productId) return;
    if (isFavorite) {
      const next = folders.map(f => ({ ...f, productIds: f.productIds.filter(pid => pid !== productId) }));
      setFolders(next);
      saveFolderData(next);
    } else {
      setFolderModalOpen(true);
    }
  };

  const addToFolder = (folderId: string) => {
    if (!productId) return;
    const next = folders.map(f =>
        f.id === folderId && !f.productIds.includes(productId)
            ? { ...f, productIds: [...f.productIds, productId] }
            : f
    );
    setFolders(next);
    saveFolderData(next);
    setFolderModalOpen(false);
  };

  if (loading) {
    return (
        <div className="max-w-[1280px] mx-auto px-4 py-16 text-center text-muted-foreground text-sm">
          불러오는 중...
        </div>
    );
  }

  if (!product) {
    return (
        <div className="max-w-[1280px] mx-auto px-4 py-16 text-center text-muted-foreground text-sm">
          상품을 찾을 수 없습니다.
        </div>
    );
  }

  // [추가] 판매중지된 상품인지 (false일 때만 중지, undefined/true는 정상 판매중으로 취급)
  const isPaused = product.isActive === false;

  const allImages = product.options.flatMap(opt => opt.images).sort((a, b) => a.sortOrder - b.sortOrder);
  const mainImages = allImages.length > 0 ? allImages : [];

  // 모든 옵션이 구조화된 optionValues를 갖고 있으면 그룹 선택 UI 사용, 아니면 기존 플랫 버튼 방식 폴백
  const hasStructuredOptions = product.options.length > 0 && product.options.every(o => o.optionValues && o.optionValues.length > 0);

  // 옵션 그룹 이름 목록 (예: ["색상", "세트"]) — 등장 순서 유지
  const optionGroupNames: string[] = hasStructuredOptions
      ? Array.from(new Set(product.options.flatMap(o => o.optionValues.map(v => v.optionName))))
      : [];

  // 그룹별 선택 가능한 값 목록 (예: {색상: ["네이비","블랙"], 세트: ["상의만","세트","하의만"]})
  const optionGroupValues: Record<string, string[]> = {};
  optionGroupNames.forEach(name => {
    optionGroupValues[name] = Array.from(new Set(
        product.options.flatMap(o => o.optionValues.filter(v => v.optionName === name).map(v => v.optionValue))
    ));
  });

  // 현재 선택된 조합(selectedValues)과 정확히 일치하는 옵션(SKU) 찾기
  const matchedOptionIdx = hasStructuredOptions
      ? product.options.findIndex(o =>
          o.optionValues.length === Object.keys(selectedValues).length &&
          o.optionValues.every(v => selectedValues[v.optionName] === v.optionValue)
      )
      : selectedOptionIdx;

  const selectedOption = hasStructuredOptions
      ? (matchedOptionIdx >= 0 ? product.options[matchedOptionIdx] : null)
      : (product.options[selectedOptionIdx] ?? null);

  // [추가] 특정 그룹의 특정 값(name=value)을 골랐을 때, 현재 선택된 다른 그룹 값들과 합친 조합에 해당하는 옵션을 찾는 헬퍼
  // 버튼 옆 추가금액 표시 및 클릭 가능 여부(exists) 판단에 공용으로 사용
  const findOptionForCandidate = (name: string, value: string) => {
    const candidate = { ...selectedValues, [name]: value };
    return product.options.find(o =>
        o.optionValues.length === Object.keys(candidate).length &&
        o.optionValues.every(v => candidate[v.optionName] === v.optionValue)
    ) ?? null;
  };

  const total = (product.unitPrice + (selectedOption?.additionalPrice ?? 0)) * quantity;

  // 등록된 인증서 이름을 뱃지 키로 변환, 중복 제거
  const certBadgeKeys: CertKey[] = Array.from(new Set(
      (product.certifications ?? [])
          .map(c => certNameToKeyMap[c.certName])
          .filter((k): k is CertKey => !!k)
  ));

  const updateQuantity = (delta: number) => {
    const next = quantity + delta;
    if (next >= product.moq) setQuantity(next);
  };

  // 이미지 슬라이더 전용 이동 함수 — 수동 클릭 시에도 이 함수를 거치도록 통일 (자동 전환 타이머는 selectedImage 변경마다 재시작됨)
  const goToImage = (index: number) => {
    if (mainImages.length === 0) return;
    const next = ((index % mainImages.length) + mainImages.length) % mainImages.length;
    setSelectedImage(next);
  };

  const handleAddToCart = async () => {
    if (isPaused || isAddingToCart || !selectedOption) return;
    try {
      setIsAddingToCart(true);
      await api.post("/carts", {
        productOptionId: selectedOption.productOptionId,
        quantity,
        cartType: "NORMAL",
      });
      navigate("/cart");
    } catch (error) {
      console.error("장바구니 추가 실패", error);
      window.alert("장바구니에 담지 못했습니다. 로그인 상태와 상품 옵션을 확인해주세요.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
      <div className="max-w-[1280px] mx-auto px-4 py-8 font-[Inter,sans-serif]">

        {/* 폴더 선택 모달 */}
        {folderModalOpen && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setFolderModalOpen(false)}>
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
                    const isAdded = productId !== null && folder.productIds.includes(productId);
                    const allFavIds = [...new Set(folders.flatMap(f => f.productIds))];
                    const ids = folder.id === "default" ? allFavIds : folder.productIds;
                    const needed = ids.length === 0 ? 0 : ids.length === 1 ? 1 : ids.length < 4 ? 2 : 4;
                    const thumbImgs = ids.slice(0, needed).map(id => allProducts.find(p => p.productId === id)?.mainImageUrl ?? null);
                    return (
                        <button
                            key={folder.id}
                            onClick={() => !isAdded && addToFolder(folder.id)}
                            className={`flex flex-col rounded-xl border-2 overflow-hidden transition-all text-left ${isAdded ? "border-primary" : "border-border hover:border-primary"} ${isAdded ? "cursor-default" : "cursor-pointer"}`}
                        >
                          <div className="w-full aspect-square bg-muted relative overflow-hidden">
                            {thumbImgs.length === 0 ? (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Heart size={24} className="text-muted-foreground opacity-30" />
                                </div>
                            ) : thumbImgs.length === 1 ? (
                                thumbImgs[0] ? <img src={thumbImgs[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-muted" />
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
                          <div className="px-2 py-1.5">
                            <p className={`text-xs font-medium truncate ${isAdded ? "text-primary" : "text-foreground"}`}>{folder.name}</p>
                            <p className="text-[10px] text-muted-foreground">{ids.length}개</p>
                          </div>
                        </button>
                    );
                  })}
                </div>
                <button onClick={() => setFolderModalOpen(false)} className="w-full py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors">닫기</button>
              </div>
            </div>
        )}

        <Link to="/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft size={16} />
          상품 목록으로 돌아가기
        </Link>

        {/* [추가] 판매중지 안내 배너 */}
        {isPaused && (
            <div className="mb-6 bg-gray-100 border border-gray-300 rounded-lg px-5 py-3 text-sm text-gray-700 font-medium">
              판매자가 잠시 판매를 중지한 상품 입니다.
            </div>
        )}

        <div className="grid grid-cols-[500px_1fr] gap-8 mb-8">
          {/* Left: Images */}
          <div>
            <div className="bg-white border border-border rounded-lg overflow-hidden mb-3 relative group">
              {mainImages.length > 0 ? (
                  <img src={mainImages[selectedImage]?.imageUrl} alt={product.productName} className="w-full h-[500px] object-cover transition-opacity duration-300" />
              ) : (
                  <div className="w-full h-[500px] bg-muted flex items-center justify-center text-muted-foreground text-sm">이미지 없음</div>
              )}
              {mainImages.length > 1 && (
                  <>
                    <button
                        onClick={() => goToImage(selectedImage - 1)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                        onClick={() => goToImage(selectedImage + 1)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight size={18} />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {mainImages.map((_, i) => (
                          <button
                              key={i}
                              onClick={() => goToImage(i)}
                              className={`rounded-full transition-all ${i === selectedImage ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"}`}
                          />
                      ))}
                    </div>
                  </>
              )}
            </div>
            {mainImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {mainImages.map((img, i) => (
                      <button
                          key={img.productImageId}
                          onClick={() => goToImage(i)}
                          className={`border-2 rounded overflow-hidden transition-colors ${selectedImage === i ? "border-primary" : "border-border hover:border-primary/40"}`}
                      >
                        <img src={img.imageUrl} alt={`${product.productName} ${i + 1}`} className="w-full h-24 object-cover" />
                      </button>
                  ))}
                </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {isPaused && (
                      <span className="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded font-semibold">판매중지</span>
                  )}
                  {product.oemAvailable && (
                      <span className="inline-block bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded font-semibold">OEM/ODM · 자체 라벨 가능</span>
                  )}
                  {product.sampleAvailable && (
                      <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-semibold">샘플 제공 가능</span>
                  )}
                  {product.whiteLabel && (
                      <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded font-semibold">화이트라벨</span>
                  )}
                  {/* 보유 인증서 뱃지 */}
                  {certBadgeKeys.map(key => (
                      <CertBadge key={key} certKey={key} />
                  ))}
                </div>
                <h1 className="text-2xl font-bold text-foreground leading-tight mb-2">{product.productName}</h1>
                {product.productEngName && (
                    <p className="text-sm text-muted-foreground mb-1">{product.productEngName}</p>
                )}
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{product.brandName}</span>
                  <span>·</span>
                  <span>{product.categoryName}</span>
                  {product.season && <><span>·</span><span>{product.season}</span></>}
                </div>
              </div>
              {/* 하트 버튼 */}
              <button
                  onClick={handleHeartClick}
                  className="border border-border rounded p-2 hover:border-primary transition-colors"
              >
                <Heart size={20} className={isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"} />
              </button>
            </div>

            <div className="bg-muted/30 border border-border rounded-lg p-6 mb-6">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-bold text-primary">₩{product.unitPrice.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">/벌</span>
              </div>
              <div className="text-sm text-muted-foreground mb-5">최소 주문 수량: {product.moq.toLocaleString()}벌</div>

              <div className="space-y-4">
                {/* 옵션 선택 — 그룹(옵션명)별로 벨류 버튼을 보여주는 방식. 구조화된 값이 없는 레거시 상품은 기존 플랫 버튼으로 폴백 */}
                {hasStructuredOptions ? (
                    <div className="space-y-4">
                      {optionGroupNames.map(name => (
                          <div key={name}>
                            <label className="block text-sm font-medium text-foreground mb-2">{name}</label>
                            <div className="flex flex-wrap gap-2">
                              {optionGroupValues[name].map(value => {
                                const isSelected = selectedValues[name] === value;
                                // [수정] 이 값을 선택했을 때 현재 다른 그룹 선택값들과 합쳐지는 조합의 옵션을 찾음
                                // → 존재 여부(exists) 판단과 추가금액 표시 모두 여기서 가져옴
                                const candidateOption = findOptionForCandidate(name, value);
                                const exists = candidateOption !== null;
                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        disabled={!exists}
                                        onClick={() => setSelectedValues(prev => ({ ...prev, [name]: value }))}
                                        className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                                            isSelected
                                                ? "bg-primary text-white border-primary"
                                                : exists
                                                    ? "border-border text-foreground hover:border-primary hover:text-primary"
                                                    : "border-border text-muted-foreground opacity-40 cursor-not-allowed"
                                        }`}
                                    >
                                      {value}
                                      {/* [수정] 이 조합의 추가금액을 버튼 옆에 괄호로 표시 (0원이면 표시 안 함, 마이너스는 -₩ 로 표시) */}
                                      {exists && candidateOption!.additionalPrice !== 0 && (
                                          <span className="ml-1 opacity-70">
                                            ({candidateOption!.additionalPrice > 0 ? "+" : "-"}₩{Math.abs(candidateOption!.additionalPrice).toLocaleString()})
                                          </span>
                                      )}
                                    </button>
                                );
                              })}
                            </div>
                          </div>
                      ))}
                      {selectedOption ? (
                          <p className="text-xs text-muted-foreground">
                            재고: {selectedOption.stockQuantity.toLocaleString()}벌
                            {selectedOption.additionalPrice !== 0 && (
                                <> · 추가금 {selectedOption.additionalPrice > 0 ? "+" : "-"}₩{Math.abs(selectedOption.additionalPrice).toLocaleString()}</>
                            )}
                          </p>
                      ) : (
                          <p className="text-xs text-red-500">선택하신 조합은 현재 판매하지 않는 옵션입니다.</p>
                      )}
                    </div>
                ) : (
                    product.options.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">옵션 선택</label>
                          <div className="flex flex-wrap gap-2">
                            {product.options.map((opt, i) => (
                                <button
                                    key={opt.productOptionId}
                                    onClick={() => setSelectedOptionIdx(i)}
                                    className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                                        selectedOptionIdx === i
                                            ? "bg-primary text-white border-primary"
                                            : "border-border text-foreground hover:border-primary hover:text-primary"
                                    }`}
                                >
                                  {opt.optionLabel}
                                  {opt.additionalPrice !== 0 && (
                                      <span className="ml-1 opacity-70">
                                        ({opt.additionalPrice > 0 ? "+" : "-"}₩{Math.abs(opt.additionalPrice).toLocaleString()})
                                      </span>
                                  )}
                                </button>
                            ))}
                          </div>
                          {selectedOption && (
                              <p className="text-xs text-muted-foreground mt-1">재고: {selectedOption.stockQuantity.toLocaleString()}벌</p>
                          )}
                        </div>
                    )
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">주문 수량</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => updateQuantity(-100)} className="w-10 h-10 border border-border rounded flex items-center justify-center hover:border-primary hover:text-primary transition-colors">
                      <Minus size={16} />
                    </button>
                    <input
                        type="number"
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || product.moq;
                          if (val >= product.moq) setQuantity(val);
                        }}
                        className="flex-1 border border-border rounded px-4 py-2.5 text-center font-mono text-lg outline-none focus:border-primary transition-colors"
                    />
                    <button onClick={() => updateQuantity(100)} className="w-10 h-10 border border-border rounded flex items-center justify-center hover:border-primary hover:text-primary transition-colors">
                      <Plus size={16} />
                    </button>
                    <span className="text-sm text-muted-foreground">벌</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">합계 금액</span>
                  <span className="text-2xl font-bold text-foreground">₩{total.toLocaleString()}</span>
                </div>

                <div className="flex gap-3 pt-1">
                  {isPaused ? (
                      <button
                          type="button"
                          disabled
                          className="flex-1 bg-gray-100 border-2 border-gray-200 text-gray-400 py-3.5 rounded font-semibold cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        현재 판매중인 상품이 아닙니다.
                      </button>
                  ) : (
                      <>
                        <button
                            type="button"
                            onClick={handleAddToCart}
                            disabled={isAddingToCart || !selectedOption}
                            className="flex-1 bg-white border-2 border-primary text-primary hover:bg-secondary py-3.5 rounded font-semibold transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <ShoppingCart size={18} />
                          {isAddingToCart ? "담는 중..." : "장바구니 담기"}
                        </button>
                        <Link to="/checkout" className="flex-1 bg-primary hover:bg-primary/90 text-white py-3.5 rounded font-semibold transition-colors flex items-center justify-center">
                          바로 구매하기
                        </Link>
                      </>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <Shield size={18} />, label: "안전결제", desc: "에스크로 보호" },
                { icon: <Truck size={18} />, label: "빠른 배송", desc: "전국 당일출고" },
                { icon: <Award size={18} />, label: "품질 보증", desc: "출하 전 검수" },
              ].map((item, i) => (
                  <div key={i} className="bg-white border border-border rounded p-3 text-center">
                    <div className="text-primary mb-1 flex justify-center">{item.icon}</div>
                    <div className="text-xs font-semibold text-foreground">{item.label}</div>
                    <div className="text-[10px] text-muted-foreground">{item.desc}</div>
                  </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detail Section */}
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <div className="border-b border-border px-6 py-4">
            <h2 className="font-bold text-foreground">제품 상세 정보</h2>
          </div>
          <div className="p-6 space-y-8">

            {/* 1. 제품 설명 */}
            {product.description && (
                <div>
                  <h3 className="font-bold text-foreground mb-3">제품 설명</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{product.description}</p>
                </div>
            )}

            {/* 2. 상세 설명 자료 (PDF) */}
            {product.productUrl && (
                <div>
                  <button
                      onClick={() => setPdfExpanded(v => !v)}
                      className="w-full flex items-center justify-between mb-3 group"
                  >
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                      <FileText size={18} className="text-primary" />
                      상세 설명 자료
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                      {pdfExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>
                  <div className="rounded-lg overflow-hidden bg-white" style={{ height: pdfExpanded ? "800px" : "256px", transition: "height 0.3s" }}>
                    <iframe
                        src={`${product.productUrl}#toolbar=0&navpanes=0`}
                        className="w-full h-full"
                        style={{ border: "none" }}
                        title="상세 설명 PDF"
                    />
                  </div>
                  {!pdfExpanded && (
                      <button
                          onClick={() => setPdfExpanded(true)}
                          className="mt-2 w-full flex items-center justify-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors py-2 border border-dashed border-primary/40 rounded-lg hover:bg-primary/5"
                      >
                        <ChevronDown size={16} /> 전체 보기
                      </button>
                  )}
                  {pdfExpanded && (
                      <button
                          onClick={() => setPdfExpanded(false)}
                          className="mt-2 w-full flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors py-2 border border-dashed border-border rounded-lg hover:bg-muted/30"
                      >
                        <ChevronUp size={16} /> 접기
                      </button>
                  )}
                </div>
            )}

            {/* 3. 제품 사양 */}
            <div>
              <h3 className="font-bold text-foreground mb-3">제품 사양</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "주요 소재", value: product.mainMaterial },
                  { label: "시즌", value: product.season },
                  { label: "리드타임", value: product.leadTimeDays ? `${product.leadTimeDays}일` : null },
                  { label: "최소 발주량", value: `${product.moq.toLocaleString()}벌` },
                  { label: "소재 인증", value: product.materialCert },
                  { label: "카테고리", value: product.categoryName },
                ].filter(item => item.value).map(({ label, value }) => (
                    <div key={label} className="flex border-b border-border pb-2">
                      <span className="text-sm text-muted-foreground w-28 flex-shrink-0">{label}</span>
                      <span className="text-sm text-foreground font-medium">{value}</span>
                    </div>
                ))}
              </div>
            </div>

            {/* 4. 세탁/관리 방법 */}
            {product.careInstruction && (
                <div>
                  <h3 className="font-bold text-foreground mb-3">세탁 / 관리 방법</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{product.careInstruction}</p>
                </div>
            )}

            {/* 공급업체 정보 */}
            <div>
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Award size={18} className="text-primary" />
                공급업체 정보
              </h3>
              <div className="bg-muted/30 border border-border rounded-lg p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-foreground text-lg mb-1">{product.brandName}</h4>
                    <div className="text-sm text-muted-foreground">{product.categoryName}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-20 flex items-center gap-1"><MapPin size={12} />카테고리</span>
                    <span className="font-medium text-foreground">{product.categoryName}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-20 flex items-center gap-1"><Phone size={12} />OEM/ODM</span>
                    <span className="font-medium text-foreground">{product.oemAvailable ? "가능" : "불가"}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-20 flex items-center gap-1"><Mail size={12} />샘플</span>
                    <span className="font-medium text-foreground">{product.sampleAvailable ? "제공 가능" : "불가"}</span>
                  </div>
                </div>
                <Link
                    to="/suppliers"
                    className="mt-4 w-full border border-primary text-primary hover:bg-secondary py-2 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  공급업체 페이지 방문
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
