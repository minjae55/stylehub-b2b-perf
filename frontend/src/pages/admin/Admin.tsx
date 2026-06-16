import { useState } from "react";
import { Link } from "react-router";
import { DollarSign, Users, ShoppingBag, TrendingUp, Calendar, ArrowUp, ArrowDown, FileText, ChevronRight, CreditCard, MessageCircleQuestion } from "lucide-react";
import AdminHeader from "./AdminHeader";
import { Outlet } from "react-router";

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

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-50/50">
      <AdminHeader
        logo={
          <div className="text-xl font-bold tracking-tight flex items-center gap-1">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Style</span>
            <span className="text-slate-900">Hub</span>
            <span></span>
            {/* <span className="text-xs font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded ml-1.5">Admin</span> */}
          </div>
        }
        user={{ name: "Admin", initials: "AM", role: "관리자" }}
        notificationCount={3}
        onSearch={(query) => console.log("검색:", query)}
        onNotificationClick={() => console.log("알림 열기")}
        onSettingsClick={() => console.log("설정 열기")}
        onUserMenuClick={() => console.log("유저 메뉴 열기")}
      />
      <main className="animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
}

export function Admin() {
  const [selectedPeriod, setSelectedPeriod] = useState("3months");

  const totalRevenue = paymentStats.reduce((a, s) => a + s.total, 0);
  const totalOrders = paymentStats.reduce((a, s) => a + s.count, 0);
  const avgOrderValue = totalRevenue / totalOrders;

  // 퀵 링크 아이템 데이터화 (유지보수 용이)
  const quickLinks = [
    { to: "/admin/sourcing-requests", title: "소싱 요청서 관리", desc: "바이어 소싱 요청 처리", icon: FileText, color: "text-emerald-600", bg: "bg-emerald-50 group-hover:bg-emerald-100" },
    { to: "/admin/settlements", title: "결제 및 정산 관리", desc: "대금 및 수수료 처리", icon: CreditCard, color: "text-amber-600", bg: "bg-amber-50 group-hover:bg-amber-100" },
    { to: "/admin/users", title: "회원 / 업체 관리", desc: "전체 회원 조회 및 관리", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50 group-hover:bg-indigo-100" },
    { to: "/admin/adminsupport", title: "고객 지원", desc: "고객 지원 센터 및 문의 접수", icon: MessageCircleQuestion, color: "text-rose-600", bg: "bg-rose-50 group-hover:bg-rose-100" },
    { to: "/admin/analytics", title: "통계 관리", desc: "월별 고객사 통계 분석", icon: Calendar, color: "text-blue-600", bg: "bg-blue-50 group-hover:bg-blue-100" },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-10 space-y-10 font-sans antialiased selection:bg-indigo-100">
      
      {/* 1. 타이틀 섹션 */}
      <div className="flex flex-col gap-1">
        {/* <h1 className="text-2xl font-bold tracking-tight text-slate-900">종합 현황 대시보드</h1>
        <p className="text-sm text-slate-500">StyleHub 플랫폼의 실시간 핵심 지표 및 관리 메뉴입니다.</p> */}
      </div>

      {/* 2. 모던 Quick Nav (그리드 최적화) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link 
              key={link.to} 
              to={link.to} 
              className="bg-white border border-slate-200/80 rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`${link.bg} p-2.5 rounded-lg transition-colors duration-200 flex-shrink-0`}>
                  <Icon size={20} className={link.color} />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-slate-800 tracking-tight">{link.title}</div>
                  <div className="text-xs text-slate-400 truncate mt-0.5">{link.desc}</div>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0" />
            </Link>
          );
        })}
      </div>

      {/* 3. Key Metrics (트렌디한 카드 디자인) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { title: "총 결제액 (3개월)", value: `$${totalRevenue.toLocaleString()}`, trend: "+8.2% vs 이전 3개월", up: true, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
          { title: "총 주문 건수", value: `${totalOrders}건`, trend: "+5.4% vs 이전 3개월", up: true, icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
          { title: "총 바이어", value: `${userStats.buyers.total}명`, trend: `+${userStats.buyers.growth}명 (이번 달)`, up: true, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
          { title: "평균 주문액", value: `$${avgOrderValue.toFixed(0)}`, trend: "+2.8% vs 이전 3개월", up: true, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((metric, i) => {
          const Icon = metric.icon;
          return (
            <div key={i} className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{metric.title}</span>
                  <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{metric.value}</div>
                </div>
                <div className={`${metric.bg} p-2 rounded-lg`}>
                  <Icon size={20} className={metric.color} />
                </div>
              </div>
              <div className="mt-4 pt-3.5 border-t border-slate-50 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                <ArrowUp size={14} /> <span>{metric.trend}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. 이원화 레이아웃 (테이블 & 진행 바) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 최근 결제 내역 */}
        <div className="lg:col-span-2 bg-white border border-slate-200/70 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2 tracking-tight">
                <DollarSign size={18} className="text-blue-600" />
                최근 결제 내역
              </h2>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="text-xs bg-white font-medium border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 outline-none hover:border-slate-300 transition-colors cursor-pointer shadow-sm"
              >
                <option value="3months">최근 3개월</option>
                <option value="6months">최근 6개월</option>
                <option value="1year">최근 1년</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/30 text-slate-400 text-xs font-semibold border-b border-slate-100">
                    <th className="px-5 py-3.5 text-left">주문번호</th>
                    <th className="px-3 py-3.5 text-left">날짜</th>
                    <th className="px-3 py-3.5 text-left">바이어 / 셀러</th>
                    <th className="px-3 py-3.5 text-right">금액</th>
                    <th className="px-5 py-3.5 text-center">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/40 transition-colors group">
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500 font-medium">{p.id}</td>
                      <td className="px-3 py-3.5 text-slate-400 text-xs font-mono">{p.date}</td>
                      <td className="px-3 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800 text-[13px]">{p.buyer}</span>
                          <span className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-slate-300"/>{p.seller}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono font-bold text-slate-800">${p.amount.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md inline-block ${
                          p.status === "완료" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                          p.status === "대기" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                          "bg-rose-50 text-rose-700 border border-rose-100"
                        }`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/20 text-center">
            <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">전체 내역 보기</button>
          </div>
        </div>

        {/* 월별 결제 통계 */}
        <div className="bg-white border border-slate-200/70 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 tracking-tight">
              <Calendar size={18} className="text-blue-600" />
              월별 결제 통계
            </h2>
          </div>
          <div className="p-5 space-y-5.5">
            {paymentStats.map((stat) => (
              <div key={stat.month} className="group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold font-mono text-slate-400 group-hover:text-slate-600 transition-colors">{stat.month}</span>
                  <span className="text-sm font-bold font-mono text-slate-800">${stat.total.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${(stat.total / 160000) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5 text-xs text-slate-400 font-medium">
                  <span>{stat.count}건의 주문</span>
                  <span className="text-xs">건당 평균 ${stat.avgOrder.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. User Statistics (바이어/셀러 현황 사이드바 대체 및 카드 통합) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 바이어 현황 */}
        <div className="bg-white border border-slate-200/70 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-indigo-50/10">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 tracking-tight">
              <Users size={18} className="text-indigo-600" />
              바이어 현황
            </h2>
            <div className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-100 shadow-sm">
              총 {userStats.buyers.total}명 누적
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-3 gap-2 bg-slate-50/60 p-3.5 rounded-xl border border-slate-100 text-center">
              <div>
                <div className="text-[11px] font-medium text-slate-400 mb-1">이번 달 신규</div>
                <div className="text-xl font-bold text-indigo-600 font-mono">+{userStats.buyers.thisMonth}</div>
              </div>
              <div className="border-x border-slate-200/60">
                <div className="text-[11px] font-medium text-slate-400 mb-1">활성 바이어</div>
                <div className="text-xl font-bold text-slate-800 font-mono">{userStats.buyers.active}</div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-400 mb-1">전월비 증감</div>
                <div className="text-xl font-bold text-emerald-600 font-mono flex items-center justify-center gap-0.5">
                  <ArrowUp size={14} />{userStats.buyers.growth}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 셀러 현황 */}
        <div className="bg-white border border-slate-200/70 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/10">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 tracking-tight">
              <ShoppingBag size={18} className="text-amber-600" />
              셀러 파트너 현황
            </h2>
            <div className="text-xs font-bold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg border border-amber-100 shadow-sm">
              총 {userStats.sellers.total}개사 입점
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-3 gap-2 bg-slate-50/60 p-3.5 rounded-xl border border-slate-100 text-center">
              <div>
                <div className="text-[11px] font-medium text-slate-400 mb-1">이번 달 신규</div>
                <div className="text-xl font-bold text-amber-600 font-mono">+{userStats.sellers.thisMonth}</div>
              </div>
              <div className="border-x border-slate-200/60">
                <div className="text-[11px] font-medium text-slate-400 mb-1">인증 파트너</div>
                <div className="text-xl font-bold text-slate-800 font-mono">{userStats.sellers.verified}</div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-400 mb-1">전월비 증감</div>
                <div className="text-xl font-bold text-rose-600 font-mono flex items-center justify-center gap-0.5">
                  <ArrowDown size={14} />{userStats.sellers.growth}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}