import { useState } from "react";
import { Link } from "react-router";
import { DollarSign, Shield, ArrowUp, ArrowDown, Download, Search, ChevronLeft, TrendingUp, Calendar } from "lucide-react";

const allPayments = [
  { id: "TKR-2024-0841", date: "2024.03.21", buyer: "글로벌뷰티㈜", seller: "코스맥스㈜", product: "히알루론산 에센스", amount: 12000, fee: 360, net: 11640, status: "완료", method: "에스크로" },
  { id: "TKR-2024-0838", date: "2024.03.20", buyer: "KBeauty USA Inc", seller: "메디힐㈜", product: "콜라겐 시트 마스크", amount: 20500, fee: 615, net: 19885, status: "완료", method: "에스크로" },
  { id: "TKR-2024-0820", date: "2024.03.18", buyer: "뷰티월드", seller: "한국콜마㈜", product: "쿠션 파운데이션", amount: 18000, fee: 540, net: 17460, status: "완료", method: "에스크로" },
  { id: "TKR-2024-0807", date: "2024.03.15", buyer: "코스메틱홀딩스", seller: "에스트라㈜", product: "기능성 크림", amount: 7500, fee: 225, net: 7275, status: "대기", method: "에스크로" },
  { id: "TKR-2024-0791", date: "2024.03.12", buyer: "아시아뷰티", seller: "토니모리㈜", product: "헤어 에센스", amount: 5000, fee: 150, net: 4850, status: "취소", method: "에스크로" },
  { id: "TKR-2024-0780", date: "2024.03.10", buyer: "코스메틱홀딩스", seller: "코스맥스㈜", product: "비타민C 세럼", amount: 16000, fee: 480, net: 15520, status: "완료", method: "에스크로" },
  { id: "TKR-2024-0765", date: "2024.03.07", buyer: "글로벌뷰티㈜", seller: "메디힐㈜", product: "슬리핑 마스크", amount: 9200, fee: 276, net: 8924, status: "완료", method: "에스크로" },
  { id: "TKR-2024-0750", date: "2024.03.05", buyer: "KBeauty USA Inc", seller: "JMsolution㈜", product: "아르간 샴푸", amount: 11000, fee: 330, net: 10670, status: "완료", method: "에스크로" },
];

const paymentStats = [
  { month: "2024-03", total: 142500, count: 32, fee: 4275 },
  { month: "2024-02", total: 128300, count: 29, fee: 3849 },
  { month: "2024-01", total: 156800, count: 38, fee: 4704 },
  { month: "2023-12", total: 134200, count: 31, fee: 4026 },
];

export function AdminAnalytics() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체");
  const [selectedPeriod, setSelectedPeriod] = useState("3months");

  const filtered = allPayments.filter((p) => {
    const matchStatus = statusFilter === "전체" || p.status === statusFilter;
    const matchSearch = p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.buyer.includes(search) || p.seller.includes(search) || p.product.includes(search);
    return matchStatus && matchSearch;
  });

  const totalRevenue = filtered.filter(p => p.status === "완료").reduce((a, p) => a + p.amount, 0);
  const totalFee = filtered.filter(p => p.status === "완료").reduce((a, p) => a + p.fee, 0);
  const totalCount = filtered.filter(p => p.status === "완료").length;

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-8 font-[Inter,sans-serif]">
      {/* Admin Header */}
      

      {/* Back Link */}
      <Link to="/admin/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-5">
        <ChevronLeft size={14} /> 관리자 대시보드로
      </Link>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-border rounded-lg p-5">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">총 거래액 (필터)</div>
          <div className="text-2xl font-bold text-foreground font-mono">${totalRevenue.toLocaleString()}</div>
          <div className="flex items-center gap-1 text-xs text-green-600 mt-1"><ArrowUp size={11} />완료 건 기준</div>
        </div>
        <div className="bg-white border border-border rounded-lg p-5">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">수수료 수익 (3%)</div>
          <div className="text-2xl font-bold text-foreground font-mono">${totalFee.toLocaleString()}</div>
          <div className="flex items-center gap-1 text-xs text-green-600 mt-1"><TrendingUp size={11} />순 수수료</div>
        </div>
        <div className="bg-white border border-border rounded-lg p-5">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">완료 거래 건수</div>
          <div className="text-2xl font-bold text-foreground font-mono">{totalCount}</div>
          <div className="text-xs text-muted-foreground mt-1">/{filtered.length}건 중</div>
        </div>
        <div className="bg-white border border-border rounded-lg p-5">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">평균 거래액</div>
          <div className="text-2xl font-bold text-foreground font-mono">${totalCount > 0 ? (totalRevenue / totalCount).toFixed(0) : "—"}</div>
          <div className="text-xs text-muted-foreground mt-1">완료 건 기준</div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-6 mb-6">
        {/* Payment Table */}
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-4 flex-wrap">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <DollarSign size={18} className="text-primary" /> 거래 내역
            </h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-border rounded px-3 py-1.5 gap-2">
                <Search size={13} className="text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="검색..."
                  className="text-xs outline-none w-32"
                />
              </div>
              <div className="flex gap-1">
                {["전체", "완료", "대기", "취소"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                      statusFilter === s ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button className="border border-border text-muted-foreground hover:border-primary hover:text-primary px-3 py-1.5 rounded text-xs flex items-center gap-1 transition-colors">
                <Download size={12} /> 내보내기
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left font-medium">주문번호</th>
                  <th className="px-3 py-3 text-left font-medium">날짜</th>
                  <th className="px-3 py-3 text-left font-medium">바이어</th>
                  <th className="px-3 py-3 text-left font-medium">셀러</th>
                  <th className="px-3 py-3 text-right font-medium">거래액</th>
                  <th className="px-3 py-3 text-right font-medium">수수료</th>
                  <th className="px-3 py-3 text-center font-medium">상태</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-foreground">{p.id}</td>
                    <td className="px-3 py-3 text-muted-foreground text-xs font-mono">{p.date}</td>
                    <td className="px-3 py-3 text-foreground text-xs">{p.buyer}</td>
                    <td className="px-3 py-3 text-foreground text-xs">{p.seller}</td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-foreground">${p.amount.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right font-mono text-xs text-green-600">${p.fee.toLocaleString()}</td>
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
          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <DollarSign size={32} className="mx-auto mb-2 opacity-30" />
              해당 조건의 거래 내역이 없습니다.
            </div>
          )}
        </div>

        {/* Monthly Stats */}
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <Calendar size={18} className="text-primary" /> 월별 거래 통계
              </h2>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="text-xs border border-border rounded px-2 py-1 outline-none"
              >
                <option value="3months">최근 3개월</option>
                <option value="6months">최근 6개월</option>
              </select>
            </div>
            <div className="p-5 space-y-4">
              {paymentStats.map((stat) => (
                <div key={stat.month}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono text-muted-foreground">{stat.month}</span>
                    <span className="text-sm font-bold font-mono text-foreground">${stat.total.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${(stat.total / 160000) * 100}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                    <span>{stat.count}건</span>
                    <span className="text-green-600">수수료 ${stat.fee.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-border rounded-lg p-5">
            <h3 className="font-semibold text-foreground mb-4 text-sm">결제 수단 현황</h3>
            <div className="space-y-3">
              {[
                { method: "에스크로 결제", count: 125, pct: 88, color: "bg-primary" },
                { method: "신용장 (LC)", count: 12, pct: 8, color: "bg-blue-400" },
                { method: "T/T 송금", count: 5, pct: 4, color: "bg-muted-foreground" },
              ].map((m) => (
                <div key={m.method}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground">{m.method}</span>
                    <span className="text-muted-foreground font-mono">{m.count}건 ({m.pct}%)</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div className={`${m.color} h-full rounded-full`} style={{ width: `${m.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
