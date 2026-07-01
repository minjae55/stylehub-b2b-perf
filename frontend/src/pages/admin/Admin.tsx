import { useState, useEffect } from "react"; // 💡 useEffect 추가
import { Link } from "react-router";
import { DollarSign, Users, ShoppingBag, TrendingUp, Calendar, ArrowUp, ArrowDown, FileText, ChevronRight, CreditCard, MessageCircleQuestion } from "lucide-react";
import AdminHeader from "./AdminHeader";
import { Outlet } from "react-router";
import { settlementApi} from "@/pages/admin/Settlement";

// ==========================================================
// 💡 [타입 정의] 백엔드 SettlementDashboard DTO 사양과 일치화
// ==========================================================
interface Summary {
  totalGMV: number;
  totalFee: number;
  pendingAmount: number;
  refundRequestAmount: number;
}

interface MonthlyStat {
  month: string;
  total: number;
  count: number;
  avgOrder: number;
}

interface UserStats {
  buyers: { total: number; thisMonth: number; active: number; growth: number };
  sellers: { total: number; thisMonth: number; verified: number; growth: number };
}

interface SettlementRow {
  settlementId?: number;
  orderNo?: string;
  createdAt?: string;
  buyerName?: string;
  sellerCompanyName?: string;
  totalAmount: number;
  status: string;
}

export function AdminLayout() {
  return (
      <div className="min-h-screen bg-slate-50/50">
        <AdminHeader
            logo={
              <div className="text-xl font-bold tracking-tight flex items-center gap-1">
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Style</span>
                <span className="text-slate-900">Hub</span>
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
  const [loading, setLoading] = useState<boolean>(true);

  // ==========================================================
  // 💡 [상태 정의] 기존 하드코딩 더미 변수들을 실시간 State로 전환
  // ==========================================================
  const [summary, setSummary] = useState<Summary>({ totalGMV: 0, totalFee: 0, pendingAmount: 0, refundRequestAmount: 0 });
  const [paymentStats, setPaymentStats] = useState<MonthlyStat[]>([]);
  const [recentPayments, setRecentPayments] = useState<SettlementRow[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    buyers: { total: 0, thisMonth: 0, active: 0, growth: 0 },
    sellers: { total: 0, thisMonth: 0, verified: 0, growth: 0 }
  });

  // ==========================================================
  // 💡 [데이터 페칭] 백엔드 공통 API(GET /api/settlements) 단일 연동
  // ==========================================================
  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const data = await settlementApi.getSettlements();

      if (data) {
        if (data.summary) setSummary(data.summary);
        if (Array.isArray(data.paymentStats)) setPaymentStats(data.paymentStats);
        if (Array.isArray(data.rows)) setRecentPayments(data.rows);
        if (data.userStats) {
          setUserStats({
            buyers: { ...data.userStats.buyers, growth: 0 },
            sellers: { ...data.userStats.sellers, growth: 0 }
          });
        }
      }
    } catch (error) {
      console.error("대시보드 데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // 상단 요약 계산 연산 로직 보정
  const totalOrders = paymentStats.reduce((a, s) => a + s.count, 0);
  const avgOrderValue = totalOrders > 0 ? summary.totalGMV / totalOrders : 0;
  const lastMonthBuyers = userStats.buyers.total - userStats.buyers.thisMonth;
  const buyerGrowth = lastMonthBuyers > 0
    ? Math.floor((userStats.buyers.thisMonth / lastMonthBuyers) * 100 * 10) / 10
    : (userStats.buyers.thisMonth > 0 ? 100 : 0);

  const quickLinks = [
    { to: "/admin/sourcing-requests", title: "소싱 요청서 관리", desc: "바이어 소싱 요청 처리", icon: FileText, color: "text-emerald-600", bg: "bg-emerald-50 group-hover:bg-emerald-100" },
    { to: "/admin/settlements", title: "결제 및 정산 관리", desc: "대금 및 수수료 처리", icon: CreditCard, color: "text-amber-600", bg: "bg-amber-50 group-hover:bg-amber-100" },
    { to: "/admin/users", title: "회원 / 업체 관리", desc: "전체 회원 조회 및 관리", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50 group-hover:bg-indigo-100" },
    { to: "/admin/adminsupport", title: "고객 지원", desc: "고객 지원 센터 및 문의 접수", icon: MessageCircleQuestion, color: "text-rose-600", bg: "bg-rose-50 group-hover:bg-rose-100" },
    { to: "/admin/analytics", title: "통계 관리", desc: "월별 고객사 통계 분석", icon: Calendar, color: "text-blue-600", bg: "bg-blue-50 group-hover:bg-blue-100" },
  ];

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-sm font-medium text-slate-500 animate-pulse">실시간 지표 동기화 중...</div>
        </div>
    );
  }

  return (
      <div className="max-w-[1280px] mx-auto px-6 py-10 space-y-10 font-sans antialiased selection:bg-indigo-100">

        <div className="flex flex-col gap-1"></div>

        {/* 2. 모던 Quick Nav */}
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

        {/* 3. Key Metrics (실시간 계산값 바인딩) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { title: "총 결제액 (GMV)", value: `₩${summary.totalGMV.toLocaleString()}`, trend: "실시간 연동 데이터", up: true, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
            { title: "총 주문 건수", value: `${totalOrders}건`, trend: "주문 테이블 기준", up: true, icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
            { title: "총 바이어", value: `${userStats.buyers.total}명`, trend: `+${userStats.buyers.thisMonth}명 (이번 달)`, up: true, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
            { title: "평균 주문액", value: `₩${avgOrderValue ? Math.floor(avgOrderValue).toLocaleString('ko-KR') : 0}`, trend: "총액 / 총건수", up: true, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
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

        {/* 4. 이원화 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 최근 결제 내역 (실제 DB Entity 구조 필드 매핑) */}
          <div className="lg:col-span-2 bg-white border border-slate-200/70 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
            <div>
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="font-bold text-slate-800 flex items-center gap-2 tracking-tight">
                  <DollarSign size={18} className="text-blue-600" />
                  최근 정산 내역
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                  <tr className="bg-slate-50/30 text-slate-400 text-xs font-semibold border-b border-slate-100">
                    <th className="px-5 py-3.5 text-left">정산ID</th>
                    <th className="px-3 py-3.5 text-left">날짜</th>
                    <th className="px-3 py-3.5 text-left">대상 업체</th>
                    <th className="px-3 py-3.5 text-right">정산 금액</th>
                    <th className="px-5 py-3.5 text-center">상태</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                  {recentPayments.map((p, index) => (
                      <tr key={p.settlementId || index} className="hover:bg-slate-50/40 transition-colors group">
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-500 font-medium">{p.settlementId || "000"}</td>
                        <td className="px-3 py-3.5 text-slate-400 text-xs font-mono">{p.createdAt ? p.createdAt.substring(0, 10) : "-"}</td>
                        <td className="px-3 py-3.5">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800 text-[13px]">{p.sellerCompanyName || "파트너사"}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-right font-mono font-bold text-slate-800">₩{p.totalAmount.toLocaleString()}</td>
                        <td className="px-5 py-3.5 text-center">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md inline-block ${
                            p.status === "COMPLETED" || p.status === "완료" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                p.status === "PENDING" || p.status === "대기" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                                    "bg-teal-50 text-teal-700 border border-teal-100"
                        }`}>
                          정산 완료
                        </span>
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 월별 결제 통계 */}
          <div className="bg-white border border-slate-200/70 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2 tracking-tight">
                <Calendar size={18} className="text-blue-600" />
                월별 매출 통계
              </h2>
            </div>
            <div className="p-5 space-y-5.5">
              {paymentStats.map((stat) => (
                  <div key={stat.month} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold font-mono text-slate-400 group-hover:text-slate-600 transition-colors">{stat.month}</span>
                      <span className="text-sm font-bold font-mono text-slate-800">₩{stat.total.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500 shadow-sm"
                          style={{ width: `${Math.min((stat.total / (summary.totalGMV || 1)) * 100 * 2, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1.5 text-xs text-slate-400 font-medium">
                      <span>{stat.count}건의 주문</span>
                      <span className="text-xs">건당 ₩{Math.floor(stat.avgOrder).toLocaleString()}</span>
                    </div>
                  </div>
              ))}
            </div>
          </div>
        </div>

        {/* 5. User Statistics */}
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
                    <ArrowUp size={14} />{buyerGrowth}%
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