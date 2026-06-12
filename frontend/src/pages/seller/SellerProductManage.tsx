import { useState } from "react";
import { Link } from "react-router";
import { products } from "../prodect/AllProducts";
import {
  Package, Search, Filter, Edit2, Trash2, AlertTriangle,
  ChevronDown, ShieldAlert, Plus
} from "lucide-react";

type ProductStatus = "판매중" | "품절" | "검토중" | "숨김";

type ManagedProduct = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  moq: string;
  stock: number;
  stockAlert: number;
  status: ProductStatus;
  registeredAt: string;
  certExpiry?: string;
};

const dummyProducts: ManagedProduct[] = [
  {
    id: "F001",
    name: "오버사이즈 린넨 셔츠 블라우스",
    brand: "MUMU STUDIO",
    category: "블라우스/셔츠",
    price: 18000,
    moq: "100",
    stock: 42,
    stockAlert: 50,
    status: "판매중",
    registeredAt: "2024.03.01",
    certExpiry: "2024.06.20",
  },
  {
    id: "F002",
    name: "와이드 슬랙스 스트레이트",
    brand: "MUMU STUDIO",
    category: "팬츠/슬랙스",
    price: 22000,
    moq: "50",
    stock: 120,
    stockAlert: 30,
    status: "판매중",
    registeredAt: "2024.03.05",
  },
  {
    id: "F003",
    name: "크롭 가디건 (8컬러)",
    brand: "MUMU STUDIO",
    category: "니트/스웨터",
    price: 19800,
    moq: "80",
    stock: 0,
    stockAlert: 20,
    status: "품절",
    registeredAt: "2024.02.15",
  },
  {
    id: "F004",
    name: "플로럴 랩 원피스",
    brand: "MUMU STUDIO",
    category: "원피스",
    price: 25000,
    moq: "40",
    stock: 85,
    stockAlert: 30,
    status: "검토중",
    registeredAt: "2024.03.10",
  },
];

const statusColors: Record<ProductStatus, string> = {
  "판매중": "bg-green-100 text-green-700",
  "품절": "bg-red-100 text-red-600",
  "검토중": "bg-yellow-100 text-yellow-700",
  "숨김": "bg-gray-100 text-gray-500",
};

export function SellerProductManage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "전체">("전체");

  const filtered = dummyProducts.filter((p) => {
    const matchSearch = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "전체" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-white rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package size={24} />
            <div>
              <h1 className="text-2xl font-bold">상품 관리</h1>
              <p className="text-white/70 text-sm mt-0.5">등록된 상품을 관리하세요</p>
            </div>
          </div>
          <Link
            to="/seller/products/new"
            className="bg-white text-[#1a1a2e] hover:bg-white/90 px-4 py-2 rounded text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <Plus size={15} />
            새 상품 등록
          </Link>
        </div>
      </div>

      {/* 검색 & 필터 */}
      <div className="bg-white border border-border rounded-lg p-4 mb-5 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="상품명, 카테고리 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-border rounded text-sm outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          {(["전체", "판매중", "품절", "검토중", "숨김"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-primary text-white"
                  : "border border-border text-foreground hover:border-primary hover:text-primary"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* 상품 목록 */}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        {/* 테이블 헤더 */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3 bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <span>상품</span>
          <span>단가 / MOQ</span>
          <span>재고</span>
          <span>인증서</span>
          <span>상태</span>
          <span>관리</span>
        </div>

        {/* 상품 행 */}
        <div className="divide-y divide-border">
          {filtered.map((p) => {
            const isLowStock = p.stock <= p.stockAlert;
            const today = new Date();
            const expiry = p.certExpiry ? new Date(p.certExpiry.replace(/\./g, "-")) : null;
            const daysLeft = expiry ? Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;

            return (
              <div key={p.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-4 items-center hover:bg-muted/20 transition-colors">
                {/* 상품명 */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={products.find((pr) => pr.id === p.id)?.image}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground line-clamp-1">{p.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.brand} · {p.category}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">등록일 {p.registeredAt}</p>
                  </div>
                </div>
                {/* 단가 / MOQ */}
                <div>
                  <p className="text-sm font-semibold text-primary">₩{p.price.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">MOQ {p.moq}벌</p>
                </div>

                {/* 재고 */}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-bold ${isLowStock ? "text-red-500" : "text-foreground"}`}>
                      {p.stock}개
                    </span>
                    {isLowStock && <AlertTriangle size={13} className="text-red-500" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">알림 기준 {p.stockAlert}개</p>
                </div>

                {/* 인증서 */}
                <div>
                  {daysLeft !== null ? (
                    <div className="flex items-center gap-1.5">
                      <ShieldAlert size={13} className={daysLeft <= 3 ? "text-red-500" : "text-yellow-500"} />
                      <span className={`text-xs font-medium ${daysLeft <= 3 ? "text-red-500" : "text-yellow-600"}`}>
                        {daysLeft}일 남음
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </div>

                {/* 상태 */}
                <div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[p.status]}`}>
                    {p.status}
                  </span>
                </div>

                {/* 관리 버튼 */}
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1 text-xs border border-border text-foreground hover:border-primary hover:text-primary px-3 py-1.5 rounded transition-colors">
                    <Edit2 size={11} />
                    수정
                  </button>
                  <button className="flex items-center gap-1 text-xs border border-border text-foreground hover:border-red-400 hover:text-red-400 px-3 py-1.5 rounded transition-colors">
                    <Trash2 size={11} />
                    삭제
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Package size={36} className="mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground">검색 결과가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}