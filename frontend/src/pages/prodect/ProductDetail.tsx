import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Bookmark, ShoppingCart, Truck, Shield, CheckCircle, Award, MapPin, Phone, Mail, Plus, Minus, Leaf, RefreshCw, Heart, Users, ShieldCheck } from "lucide-react";

type CertKey = "KC" | "OEKO-TEX" | "GOTS" | "GRS" | "비건" | "Fair Trade" | "REACH" | "CPSIA" | "UKCA" | "어린이안전" | "환경마크" | "섬유품질";

const certConfig: Record<CertKey, { label: string; bg: string; border: string; color: string; iconBg: string; icon: React.ReactNode; expiry?: string }> = 
{  "KC":        { label: "KC 인증",         bg: "#EEF2FF", border: "#C7D2FE", color: "#3730A3", iconBg: "#4338CA", icon: <span style={{ fontSize: 9, fontWeight: 700 }}>KC</span> },
  "OEKO-TEX": { label: "OEKO-TEX",        bg: "#ECFDF5", border: "#A7F3D0", color: "#065F46", iconBg: "#059669", icon: <CheckCircle size={11} /> },
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

export function ProductDetail() {
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(100);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const product = {
    id: "F002",
    name: "크롭 반팔 티셔츠 (10컬러)",
    brand: "스타일컴퍼니",
    category: "상의 · 티셔츠/탑",
    price: 5500,
    unit: "/벌",
    moq: 100,
    verified: true,

    productType: "OEM/ODM" as "기성품" | "OEM/ODM", // 제품 유형 추가

    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=600&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1594938298603-c8148c4b2e8e?w=600&h=600&fit=crop&auto=format",
    ],
    colors: ["블랙", "화이트", "아이보리", "네이비", "베이지", "그레이", "핑크", "레드", "블루", "카키"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "데일리로 활용하기 좋은 크롭 반팔 티셔츠입니다. 부드러운 면 혼방 소재로 착용감이 우수하며, 다양한 컬러로 폭넓은 고객층을 공략할 수 있습니다.",
    features: [
      "면 95% + 스판덱스 5% 혼방 소재",
      "크롭 기장으로 트렌디한 실루엣",
      "10가지 컬러 구성으로 다양한 수요 대응",
      "OEM/ODM 자체 라벨 부착 가능",
      "OEKO-TEX Standard 100 인증 소재",
    ],
    specs: {
      소재: "면 95%, 스판덱스 5%",
      기장: "크롭 (약 45cm)",
      사이즈: "S / M / L / XL / XXL",
      컬러수: "10컬러",
      세탁: "30°C 이하 세탁, 뒤집어서 세탁 권장",
      원산지: "대한민국",
      시즌: "SS (봄/여름)",
      인증: "OEKO-TEX Standard 100",
    },
    supplierInfo: {
      name: "스타일컴퍼니",
      established: 2012,
      category: "여성 캐주얼 의류 제조/도매",
      products: 320,
      address: "서울특별시 중구 을지로 123 동대문패션타운",
      phone: "02-1234-5678",
      email: "biz@stylecompany.co.kr",
      certifications: ["KC", "OEKO-TEX", "섬유품질"] as CertKey[],
    },
  };

  const updateQuantity = (delta: number) => {
    const next = quantity + delta;
    if (next >= product.moq) setQuantity(next);
  };

  const total = product.price * quantity;

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-8 font-[Inter,sans-serif]">
      <Link to="/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft size={16} />
        상품 목록으로 돌아가기
      </Link>

      <div className="grid grid-cols-[500px_1fr] gap-8 mb-8">
        {/* Left: Images */}
        <div>
          <div className="bg-white border border-border rounded-lg overflow-hidden mb-3">
            <img src={product.images[selectedImage]} alt={product.name} className="w-full h-[500px] object-cover" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`border-2 rounded overflow-hidden transition-colors ${selectedImage === i ? "border-primary" : "border-border hover:border-primary/40"}`}
              >
                <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-32 object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Product Info */}
        <div>
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
  {product.verified && (
    <span className="inline-block bg-primary text-white text-xs px-2 py-1 rounded font-semibold">인증 공급업체</span>
  )}
  <span className={`inline-block text-xs px-2 py-1 rounded font-semibold ${
    product.productType === "OEM/ODM"
      ? "bg-purple-100 text-purple-700"
      : "bg-blue-100 text-blue-700"
  }`}>
    {product.productType}
    {product.productType === "OEM/ODM" && " · 자체 라벨 가능"}
  </span>
</div>
              <h1 className="text-2xl font-bold text-foreground leading-tight mb-2">{product.name}</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{product.brand}</span>
                <span>·</span>
                <span>{product.category}</span>
              </div>
            </div>
            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              className="border border-border rounded p-2 hover:border-primary transition-colors"
            >
              <Bookmark size={20} className={isBookmarked ? "fill-primary text-primary" : "text-muted-foreground"} />
            </button>
          </div>

          <div className="bg-muted/30 border border-border rounded-lg p-6 mb-6">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold text-primary">₩{product.price.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">{product.unit}</span>
            </div>
            <div className="text-sm text-muted-foreground mb-5">최소 주문 수량: {product.moq.toLocaleString()}벌</div>

            <div className="space-y-4">
              {/* 컬러 선택 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  컬러 {selectedColor && <span className="text-primary font-semibold">· {selectedColor}</span>}
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                        selectedColor === color
                          ? "bg-primary text-white border-primary"
                          : "border-border text-foreground hover:border-primary hover:text-primary"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* 사이즈 선택 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  사이즈 {selectedSize && <span className="text-primary font-semibold">· {selectedSize}</span>}
                </label>
                <div className="flex gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 py-2 text-sm rounded border transition-colors font-medium ${
                        selectedSize === size
                          ? "bg-primary text-white border-primary"
                          : "border-border text-foreground hover:border-primary hover:text-primary"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* 수량 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">주문 수량</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(-100)}
                    className="w-10 h-10 border border-border rounded flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
                  >
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
                  <button
                    onClick={() => updateQuantity(100)}
                    className="w-10 h-10 border border-border rounded flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
                  >
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
                <Link to="/cart" className="flex-1 bg-white border-2 border-primary text-primary hover:bg-secondary py-3.5 rounded font-semibold transition-colors flex items-center justify-center gap-2">
                  <ShoppingCart size={18} />
                  장바구니 담기
                </Link>
                <Link to="/checkout" className="flex-1 bg-primary hover:bg-primary/90 text-white py-3.5 rounded font-semibold transition-colors flex items-center justify-center">
                  바로 구매하기
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Benefits */}
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

      {/* Detail Tabs */}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="border-b border-border flex">
          {["제품 설명", "제품 사양", "공급업체 정보"].map((tab) => (
            <button key={tab} className="px-6 py-3 text-sm font-medium text-foreground border-b-2 border-primary">
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Description */}
          <div className="mb-8">
            <h3 className="font-bold text-foreground mb-3">제품 설명</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{product.description}</p>
            <h4 className="font-semibold text-foreground mb-2 text-sm">주요 특징</h4>
            <ul className="space-y-2">
              {product.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Specs */}
          <div className="mb-8">
            <h3 className="font-bold text-foreground mb-3">제품 사양</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(product.specs).map(([key, value]) => (
                <div key={key} className="flex border-b border-border pb-2">
                  <span className="text-sm text-muted-foreground w-28 flex-shrink-0">{key}</span>
                  <span className="text-sm text-foreground font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Supplier Info */}
          <div>
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Award size={18} className="text-primary" />
              공급업체 정보
            </h3>
            <div className="bg-muted/30 border border-border rounded-lg p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-bold text-foreground text-lg mb-1">{product.supplierInfo.name}</h4>
                  <div className="text-sm text-muted-foreground">{product.supplierInfo.category}</div>
                </div>
                <span className="bg-primary text-white text-xs px-2 py-1 rounded font-semibold">인증 업체</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-20">설립연도</span>
                    <span className="font-medium text-foreground">{product.supplierInfo.established}년</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-20">등록 상품</span>
                    <span className="font-medium text-foreground">{product.supplierInfo.products.toLocaleString()}개</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-20 flex items-center gap-1"><MapPin size={12} />주소</span>
                    <span className="font-medium text-foreground">{product.supplierInfo.address}</span>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-20 flex items-center gap-1"><Phone size={12} />전화</span>
                    <span className="font-medium text-foreground">{product.supplierInfo.phone}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-20 flex items-center gap-1"><Mail size={12} />이메일</span>
                    <span className="font-medium text-foreground text-xs">{product.supplierInfo.email}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-2">보유 인증</div>
                <div className="flex gap-2 flex-wrap">
                  {product.supplierInfo.certifications.map((cert) => (
                    <CertBadge key={cert} certKey={cert} />
                  ))}
                </div>
              </div>

              <Link
                to="/suppliers"
                className="mt-4 w-full border border-primary text-primary hover:bg-secondary py-2 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 block text-center"
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
