import { useState } from "react";
import { Link } from "react-router";
import { DollarSign, Users, ShoppingBag, TrendingUp, Shield, Calendar, ArrowUp, ArrowDown, FileText, Truck, LayoutDashboard, ChevronRight, CreditCard, MessageCircleQuestion } from "lucide-react";
import AdminHeader from "./AdminHeader";
import { Outlet } from "react-router";
import { CashReceiptType } from "@portone/browser-sdk/v2";

const paymentStats = [
  { month: "2024-03", total: 142500, count: 32, avgOrder: 4453 },
  { month: "2024-02", total: 128300, count: 29, avgOrder: 4424 },
  { month: "2024-01", total: 156800, count: 38, avgOrder: 4126 },
  { month: "2023-12", total: 134200, count: 31, avgOrder: 4329 },
];

const recentPayments = [
  { id: "TKR-2024-0841", date: "2024.03.21", buyer: "글로벌뷰티㈜", seller: "코스맥스㈜", amount: 12000, status: "완료" },
  { id: "TKR-2024-0838", date: "2024.03.20", buyer: "KBeauty USA Inc", seller: "메디힐㈜", amount: 20500, status: "완료" },
  { id: "TKR-2024-0820", date: "2024.03.18", buyer: "뷰티월드", seller: "한국콜마㈜", amount: 18000, status: "완료" },
  { id: "TKR-2024-0807", date: "2024.03.15", buyer: "코스메틱홀딩스", seller: "에스트라㈜", amount: 7500, status: "대기" },
  { id: "TKR-2024-0791", date: "2024.03.12", buyer: "아시아뷰티", seller: "토니모리㈜", amount: 5000, status: "취소" },
];

const userStats = {
  buyers: { total: 284, thisMonth: 18, active: 156, growth: 12 },
  sellers: { total: 142, thisMonth: 4, verified: 98, growth: -3 },
};

const topBuyers = [
  { name: "글로벌뷰티㈜", country: "🇺🇸 미국", orders: 48, total: 284000 },
  { name: "KBeauty USA Inc", country: "🇺🇸 미국", orders: 36, total: 198000 },
  { name: "뷰티월드", country: "🇯🇵 일본", orders: 32, total: 156000 },
  { name: "코스메틱홀딩스", country: "🇦🇺 호주", orders: 28, total: 142000 },
];

const topSellers = [
  { name: "코스맥스㈜", category: "OEM/ODM", orders: 128, total: 842000 },
  { name: "한국콜마㈜", category: "기능성화장품", orders: 98, total: 624000 },
  { name: "메디힐㈜", category: "마스크팩", orders: 84, total: 512000 },
  { name: "에스트라㈜", category: "메이크업", orders: 62, total: 384000 },
];

export function AdminLayout() {
  return (
    <>
      <AdminHeader
        /*brandName="KBeauty Admin"*/
        logo={
          <div className="text-2xl font-bold tracking-tight">
            <span className="text-primary">Style</span>
            <span className="text-foreground">Hub</span>
          </div>
        }
        user={{ name: "Admin", initials: "AM", role: "관리자" }}
        notificationCount={3}
        onSearch={(query) => console.log("검색:", query)}
        onNotificationClick={() => console.log("알림 열기")}
        onSettingsClick={() => console.log("설정 열기")}
        onUserMenuClick={() => console.log("유저 메뉴 열기")}
      />
      <Outlet/>
      </>
  );
}

export function Admin() {
  const [selectedPeriod, setSelectedPeriod] = useState("3months");

  const totalRevenue = paymentStats.reduce((a, s) => a + s.total, 0);
  const totalOrders = paymentStats.reduce((a, s) => a + s.count, 0);
  const avgOrderValue = totalRevenue / totalOrders;

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-8 font-[Inter,sans-serif]">
      {/* Admin Header */}
      
      <div className="grid grid-cols-3 gap-4 mb-6"/>


      {/* Quick Nav */}
      <div>
    {/* 첫 번째 줄 */}
    <div className="grid grid-cols-3 gap-4 mb-6">
      {/* 1. 대시보드 */}
      {/* <Link to="/admin/dashboard" className="bg-white border border-border rounded-lg p-4 flex items-center gap-4 hover:border-primary hover:shadow-md transition-all group">
        <div className="bg-blue-50 p-3 rounded-lg group-hover:bg-blue-100 transition-colors">
          <LayoutDashboard size={22} className="text-blue-600" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-foreground">대시보드</div>
          <div className="text-xs text-muted-foreground">통계 및 현황 분석</div>
        </div>
        <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
      </Link> */}

      {/* 2. 소싱 요청서 관리 */}
      <Link to="/admin/sourcing-requests" className="bg-white border border-border rounded-lg p-4 flex items-center gap-4 hover:border-primary hover:shadow-md transition-all group">
        <div className="bg-green-50 p-3 rounded-lg group-hover:bg-green-100 transition-colors">
          <FileText size={22} className="text-green-600" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-foreground">소싱 요청서 관리</div>
          <div className="text-xs text-muted-foreground">바이어 소싱 요청 처리</div>
        </div>
        <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
      </Link>

      {/* 3. 결제 및 정산 관리 */}
      <Link to="/admin/settlements" className="bg-white border border-border rounded-lg p-4 flex items-center gap-4 hover:border-primary hover:shadow-md transition-all group">
        <div className="bg-orange-50 p-3 rounded-lg group-hover:bg-orange-100 transition-colors">
          <CreditCard size={22} className="text-orange-600" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-foreground">결제 및 정산 관리</div>
          <div className="text-xs text-muted-foreground">대금 및 수수료 처리</div>
        </div>
        <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
      </Link>
      
      {/* 4. 회원 / 업체 관리 */}
      <Link to="/admin/users" className="bg-white border border-border rounded-lg p-4 flex items-center gap-4 hover:border-primary hover:shadow-md transition-all group">
        <div className="bg-purple-50 p-3 rounded-lg group-hover:bg-purple-100 transition-colors">
          <Users size={22} className="text-purple-600" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-foreground">회원 / 업체 관리</div>
          <div className="text-xs text-muted-foreground">전체 회원 조회 및 관리</div>
        </div>
        <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
      </Link>
    </div>

      {/* 두 번째 줄 */}
    <div className="grid grid-cols-3 gap-4 mb-6">

      {/* 5. 필요한 경우 여기에 카드 추가 */}
      <Link to="/admin/adminsupport" className="bg-white border border-border rounded-lg p-4 flex items-center gap-4 hover:border-primary hover:shadow-md transition-all group">
        <div className="bg-pink-50 p-3 rounded-lg group-hover:bg-pink-100 transition-colors">
          <MessageCircleQuestion size={22} className="text-pink-600" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-foreground">고객 지원</div>
          <div className="text-xs text-muted-foreground">고객 지원 센터 및 문의 접수</div>
        </div>
        <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
      </Link>
      {/* 6. 필요한 경우 여기에 카드 추가 */}
      <Link to="/admin/analytics" className="bg-white border border-border rounded-lg p-4 flex items-center gap-4 hover:border-primary hover:shadow-md transition-all group">
        <div className="bg-blue-50 p-3 rounded-lg group-hover:bg-blue-100 transition-colors">
          <Calendar size={22} className="text-blue-600" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-foreground">통계 관리</div>
          <div className="text-xs text-muted-foreground">월별 고객사 통계 관리</div>
        </div>
        <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
      </Link>
    </div>
  </div>


      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-border rounded-lg p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-green-50 p-2.5 rounded">
              <DollarSign size={20} className="text-green-600" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">총 결제액 (3개월)</div>
              <div className="text-2xl font-bold text-foreground font-mono">${totalRevenue.toLocaleString()}</div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-green-600">
            <ArrowUp size={12} /> +8.2% vs 이전 3개월
          </div>
        </div>

        <div className="bg-white border border-border rounded-lg p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-50 p-2.5 rounded">
              <ShoppingBag size={20} className="text-blue-600" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">총 주문 건수</div>
              <div className="text-2xl font-bold text-foreground font-mono">{totalOrders}</div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-blue-600">
            <ArrowUp size={12} /> +5.4% vs 이전 3개월
          </div>
        </div>

        <div className="bg-white border border-border rounded-lg p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-purple-50 p-2.5 rounded">
              <Users size={20} className="text-purple-600" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">총 바이어</div>
              <div className="text-2xl font-bold text-foreground font-mono">{userStats.buyers.total}</div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-purple-600">
            <ArrowUp size={12} /> +{userStats.buyers.growth}명 (이번 달)
          </div>
        </div>

        <div className="bg-white border border-border rounded-lg p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-orange-50 p-2.5 rounded">
              <TrendingUp size={20} className="text-orange-600" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">평균 주문액</div>
              <div className="text-2xl font-bold text-foreground font-mono">${avgOrderValue.toFixed(0)}</div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-green-600">
            <ArrowUp size={12} /> +2.8% vs 이전 3개월
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_400px] gap-6 mb-6">
        {/* Payment History */}
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <DollarSign size={18} className="text-primary" />
              최근 결제 내역
            </h2>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="text-xs border border-border rounded px-2 py-1 outline-none"
            >
              <option value="3months">최근 3개월</option>
              <option value="6months">최근 6개월</option>
              <option value="1year">최근 1년</option>
            </select>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
                <th className="px-5 py-3 text-left font-medium">주문번호</th>
                <th className="px-3 py-3 text-left font-medium">날짜</th>
                <th className="px-3 py-3 text-left font-medium">바이어</th>
                <th className="px-3 py-3 text-left font-medium">셀러</th>
                <th className="px-3 py-3 text-right font-medium">금액</th>
                <th className="px-3 py-3 text-center font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-foreground">{p.id}</td>
                  <td className="px-3 py-3 text-muted-foreground text-xs font-mono">{p.date}</td>
                  <td className="px-3 py-3 text-foreground">{p.buyer}</td>
                  <td className="px-3 py-3 text-foreground">{p.seller}</td>
                  <td className="px-3 py-3 text-right font-mono font-bold text-foreground">${p.amount.toLocaleString()}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      p.status === "완료" ? "bg-green-50 text-green-700 border border-green-200" :
                      p.status === "대기" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                      "bg-red-50 text-red-700 border border-red-200"
                    }`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Monthly Stats */}
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <Calendar size={18} className="text-primary" />
              월별 결제 통계
            </h2>
          </div>
          <div className="p-5 space-y-4">
            {paymentStats.map((stat) => (
              <div key={stat.month}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono text-muted-foreground">{stat.month}</span>
                  <span className="text-sm font-bold font-mono text-foreground">${stat.total.toLocaleString()}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{ width: `${(stat.total / 160000) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                  <span>{stat.count}건</span>
                  <span>평균 ${stat.avgOrder.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Buyer Stats */}
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <Users size={18} className="text-purple-600" />
              바이어 현황
            </h2>
            <div className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-200">
              총 {userStats.buyers.total}명
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">이번 달 신규</div>
                <div className="text-2xl font-bold text-purple-600 font-mono">+{userStats.buyers.thisMonth}</div>
              </div>
              <div className="text-center border-x border-border">
                <div className="text-xs text-muted-foreground mb-1">활성 바이어</div>
                <div className="text-2xl font-bold text-foreground font-mono">{userStats.buyers.active}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">증감률</div>
                <div className="text-2xl font-bold text-green-600 font-mono flex items-center justify-center gap-1">
                  <ArrowUp size={18} />+{userStats.buyers.growth}%
                </div>
              </div>
            </div>
            {/* <div className="border-t border-border pt-4">
              <h3 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">TOP 바이어</h3>
              <div className="space-y-2">
                {topBuyers.map((buyer, i) => (
                  <div key={buyer.name} className="flex items-center gap-3 text-sm">
                    <div className="w-6 h-6 rounded bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">{buyer.name}</div>
                      <div className="text-xs text-muted-foreground">{buyer.country}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-mono text-xs text-muted-foreground">{buyer.orders}건</div>
                      <div className="font-mono text-xs font-bold text-foreground">${(buyer.total / 1000).toFixed(0)}K</div>
                    </div>
                  </div>
                ))}
              </div>
            </div> */}
          </div>
        </div>

        {/* Seller Stats */}
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <ShoppingBag size={18} className="text-orange-600" />
              셀러 현황
            </h2>
            <div className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-200">
              총 {userStats.sellers.total}개사
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">이번 달 신규</div>
                <div className="text-2xl font-bold text-orange-600 font-mono">+{userStats.sellers.thisMonth}</div>
              </div>
              <div className="text-center border-x border-border">
                <div className="text-xs text-muted-foreground mb-1">인증 셀러</div>
                <div className="text-2xl font-bold text-foreground font-mono">{userStats.sellers.verified}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">증감률</div>
                <div className="text-2xl font-bold text-red-600 font-mono flex items-center justify-center gap-1">
                  <ArrowDown size={18} />{userStats.sellers.growth}%
                </div>
              </div>
            </div>
            {/* <div className="border-t border-border pt-4">
              <h3 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">TOP 셀러</h3>
              <div className="space-y-2">
                {topSellers.map((seller, i) => (
                  <div key={seller.name} className="flex items-center gap-3 text-sm">
                    <div className="w-6 h-6 rounded bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">{seller.name}</div>
                      <div className="text-xs text-muted-foreground">{seller.category}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-mono text-xs text-muted-foreground">{seller.orders}건</div>
                      <div className="font-mono text-xs font-bold text-foreground">${(seller.total / 1000).toFixed(0)}K</div>
                    </div>
                  </div>
                ))}
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}
