import { useEffect, useState } from "react";
import { Link } from "react-router";
import api from "../../api/axios";
import {
  Package, Search, Edit2, Trash2, AlertTriangle,
  ShieldAlert, Plus, Loader2, PauseCircle, PlayCircle,
} from "lucide-react";

type ManageProduct = {
  productId: number;
  productName: string;
  brandName: string;
  categoryName: string;
  unitPrice: number;
  moq: number;
  totalStock: number;
  stockAlertThreshold: number | null;
  isLowStock: boolean;
  mainImageUrl: string | null;
  createdAt: string;
  certExpiryYear: number | null;
  certExpiryMonth: number | null;
  isActive: boolean;
};

type StatusFilter = "전체" | "판매중" | "품절" | "판매중지";

// 판매중지 상태가 재고 유무보다 우선
function getStatus(stock: number, isActive: boolean): "판매중" | "품절" | "판매중지" {
  if (!isActive) return "판매중지";
  return stock > 0 ? "판매중" : "품절";
}

const statusColors: Record<"판매중" | "품절" | "판매중지", string> = {
  "판매중": "bg-green-100 text-green-700",
  "품절": "bg-red-100 text-red-600",
  "판매중지": "bg-gray-200 text-gray-600",
};

// 인증서 만료가 2개월 이내로 임박했는지 (연/월 단위)
function isCertExpiringSoon(year: number | null, month: number | null): boolean {
  if (!year || !month) return false;
  const now = new Date();
  const diffMonths = (year - now.getFullYear()) * 12 + (month - (now.getMonth() + 1));
  return diffMonths <= 2;
}

export function SellerProductManage() {
  const [products, setProducts] = useState<ManageProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("전체");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<ManageProduct[]>("/products/my/manage");
      setProducts(data);
    } catch (err) {
      console.error(err);
      setError("상품 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: number, productName: string) => {
    if (!window.confirm(`"${productName}" 상품을 삭제하시겠습니까?`)) return;
    setDeletingId(productId);
    try {
      await api.delete(`/products/${productId}`);
      setProducts((prev) => prev.filter((p) => p.productId !== productId));
    } catch (err: any) {
      console.error(err);
      // axios 인터셉터가 error.message에 서버 메시지를 세팅해주므로 그대로 노출
      alert(err?.message || "삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (productId: number, currentActive: boolean) => {
    const nextActive = !currentActive;
    const confirmMsg = nextActive
        ? "이 상품을 다시 판매하시겠습니까?"
        : "이 상품을 판매 중지(숨김) 처리하시겠습니까? 실제로 삭제되지는 않아요.";
    if (!window.confirm(confirmMsg)) return;
    setTogglingId(productId);
    try {
      await api.patch(`/products/${productId}/active`, { isActive: nextActive });
      setProducts((prev) =>
          prev.map((p) => (p.productId === productId ? { ...p, isActive: nextActive } : p))
      );
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "처리 중 오류가 발생했습니다.");
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = products.filter((p) => {
    const matchSearch = !searchQuery ||
        p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
    const status = getStatus(p.totalStock, p.isActive);
    const matchStatus = statusFilter === "전체" || status === statusFilter;
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
            {(["전체", "판매중", "품절", "판매중지"] as const).map((s) => (
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

        {/* 로딩 */}
        {loading && (
            <div className="text-center py-16">
              <Loader2 size={28} className="mx-auto mb-3 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">불러오는 중...</p>
            </div>
        )}

        {/* 에러 */}
        {!loading && error && (
            <div className="text-center py-16">
              <p className="text-sm text-red-500 mb-3">{error}</p>
              <button
                  onClick={fetchProducts}
                  className="text-xs border border-border px-3 py-1.5 rounded hover:border-primary hover:text-primary"
              >
                다시 시도
              </button>
            </div>
        )}

        {/* 상품 목록 */}
        {!loading && !error && (
            <div className="bg-white border border-border rounded-lg overflow-hidden">
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3 bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <span>상품</span>
                <span>단가 / MOQ</span>
                <span>재고</span>
                <span>인증서</span>
                <span>상태</span>
                <span>관리</span>
              </div>

              <div className="divide-y divide-border">
                {filtered.map((p) => {
                  const status = getStatus(p.totalStock, p.isActive);
                  const certSoon = isCertExpiringSoon(p.certExpiryYear, p.certExpiryMonth);

                  return (
                      <div key={p.productId} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-4 items-center hover:bg-muted/20 transition-colors">
                        {/* 상품명 */}
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {p.mainImageUrl && (
                                <img src={p.mainImageUrl} alt={p.productName} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground line-clamp-1">{p.productName}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{p.brandName} · {p.categoryName}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              등록일 {new Date(p.createdAt).toLocaleDateString("ko-KR")}
                            </p>
                          </div>
                        </div>

                        {/* 단가 / MOQ */}
                        <div>
                          <p className="text-sm font-semibold text-primary">₩{p.unitPrice.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">MOQ {p.moq}벌</p>
                        </div>

                        {/* 재고 */}
                        <div>
                          <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-bold ${p.isLowStock ? "text-red-500" : "text-foreground"}`}>
                        {p.totalStock}개
                      </span>
                            {p.isLowStock && <AlertTriangle size={13} className="text-red-500" />}
                          </div>
                          {p.stockAlertThreshold !== null && (
                              <p className="text-xs text-muted-foreground mt-0.5">알림 기준 {p.stockAlertThreshold}개</p>
                          )}
                        </div>

                        {/* 인증서 */}
                        <div>
                          {p.certExpiryYear && p.certExpiryMonth ? (
                              <div className="flex items-center gap-1.5">
                                <ShieldAlert size={13} className={certSoon ? "text-red-500" : "text-yellow-500"} />
                                <span className={`text-xs font-medium ${certSoon ? "text-red-500" : "text-yellow-600"}`}>
                          {p.certExpiryYear}.{String(p.certExpiryMonth).padStart(2, "0")} 만료
                        </span>
                              </div>
                          ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>

                        {/* 상태 */}
                        <div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[status]}`}>
                      {status}
                    </span>
                        </div>

                        {/* 관리 버튼 */}
                        <div className="flex items-center gap-2">
                          <Link
                              to={`/seller/products/edit/${p.productId}`}
                              className="flex items-center gap-1 text-xs border border-border text-foreground hover:border-primary hover:text-primary px-3 py-1.5 rounded transition-colors"
                          >
                            <Edit2 size={11} />
                            수정
                          </Link>
                          <button
                              onClick={() => handleToggleActive(p.productId, p.isActive)}
                              disabled={togglingId === p.productId}
                              className="flex items-center gap-1 text-xs border border-border text-foreground hover:border-yellow-500 hover:text-yellow-600 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                          >
                            {p.isActive ? <PauseCircle size={11} /> : <PlayCircle size={11} />}
                            {togglingId === p.productId ? "처리 중" : p.isActive ? "판매중지" : "판매재개"}
                          </button>
                          <button
                              onClick={() => handleDelete(p.productId, p.productName)}
                              disabled={deletingId === p.productId}
                              className="flex items-center gap-1 text-xs border border-border text-foreground hover:border-red-400 hover:text-red-400 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                          >
                            <Trash2 size={11} />
                            {deletingId === p.productId ? "삭제 중" : "삭제"}
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
        )}
      </div>
  );
}
