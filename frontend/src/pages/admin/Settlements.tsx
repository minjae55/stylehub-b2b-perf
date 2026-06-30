import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  Search,
  Calendar,
  Download,
  CheckCircle2,
  RefreshCcw
} from 'lucide-react';
import { settlementApi } from './Settlement'; // 💡 SettlementResponse 대신 바뀐 구조에 맞춤

// 1. 백엔드 DTO 사양에 맞춘 타입 인터페이스 정의
interface Summary {
  totalGMV: number;
  totalFee: number;
  pendingAmount: number;
  refundRequestAmount: number;
}

interface SettlementRow {
  settlement_id: number;
  order_no: string;
  created_at: string;
  buyer_id: string;
  seller_id: string;
  total_amount: number;
  platform_fee: number;
  final_amount: number;
  status: string;
}

interface MonthlyStat {
  month: string;
  total: number;
  count: number;
  avgOrder: number;
}

interface UserStats {
  buyers: { total: number; thisMonth: number; active: number; growth: number};
  sellers: { total: number; thisMonth: number; verified: number; growth: number};
}

export default function Settlements() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState<boolean>(true);

  // 2. 백엔드 JSON 분리 구조에 맞춘 상태(State) 설계
  const [summary, setSummary] = useState<Summary>({
    totalGMV: 0,
    totalFee: 0,
    pendingAmount: 0,
    refundRequestAmount: 0
  });
  const [rows, setRows] = useState<SettlementRow[]>([]);
  const [paymentStats, setPaymentStats] = useState<MonthlyStat[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    buyers: { total: 0, thisMonth: 0, active: 0, growth: 0},
    sellers: { total: 0, thisMonth: 0, verified: 0, growth: 0}
  });

  const loadSettlementData = async () => {
    try {
      setLoading(true);

      // 3. orderApi 제거 후, 단일 API 응답을 그대로 파싱
      const response = await settlementApi.getSettlements();

      if (response) {
        if (response.summary) setSummary(response.summary);
        if (Array.isArray(response.rows)) setRows(response.rows);
        if (Array.isArray(response.paymentStats)) setPaymentStats(response.paymentStats);
        if (response.userStats) setUserStats(response.userStats);
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettlementData();
  }, []);

  const handleApprove = async (settlement_id: number) => {
    if (window.confirm('해당 건의 정산 지급을 승인하시겠습니까?')) {
      try {
        await settlementApi.updateSettlementStatus(settlement_id.toString(), '완료');
        alert('정산 승인이 완료되었습니다.');
        loadSettlementData();
      } catch (error) {
        alert('정산 승인 처리 중 오류가 발생했습니다.');
      }
    }
  };

  const handleRefund = async (settlement_id: number) => {
    if (window.confirm('포트원을 통해 결제 취소(환불)를 진행하시겠습니까?')) {
      try {
        await settlementApi.updateSettlementStatus(settlement_id.toString(), '환불완료');
        alert('환불 처리가 완료되었습니다.');
        loadSettlementData();
      } catch (error) {
        alert('환불 처리 중 오류가 발생했습니다.');
      }
    }
  };

  // 안전장치 변수
  const safeRows = Array.isArray(rows) ? rows : [];

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">정산 데이터를 로딩 중입니다...</div>;
  }

  return (
      <div className="p-6 bg-slate-50 min-h-screen text-foreground">
        {/* 페이지 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">결제 및 정산 관리</h1>
            <p className="text-sm text-muted-foreground mt-1">플랫폼 내 대금 결제 현황 및 공급사 정산 내역을 관리합니다.</p>
          </div>
          <button className="flex items-center gap-2 bg-white border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
            <Download size={16} />
            엑셀 다운로드
          </button>
        </div>

        {/* 4. 연산(Filter/Reduce) 없이 백엔드 summary 매핑으로 깔끔해진 메트릭 카드 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl border border-border shadow-sm">
            <div className="flex justify-between items-start text-muted-foreground mb-2">
              <span className="text-sm font-medium">총 거래액 (GMV)</span>
              <TrendingUp size={18} className="text-blue-500" />
            </div>
            <div className="text-2xl font-bold">{summary.totalGMV.toLocaleString()}원</div>
            <span className="text-xs text-green-600 font-medium">전월 대비 +12.4%</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-border shadow-sm">
            <div className="flex justify-between items-start text-muted-foreground mb-2">
              <span className="text-sm font-medium">플랫폼 수수료 수익</span>
              <DollarSign size={18} className="text-green-500" />
            </div>
            <div className="text-2xl font-bold">{(summary.totalGMV/10).toLocaleString()}원</div>
            <span className="text-xs text-muted-foreground">평균 수수료율 10%</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-border shadow-sm">
            <div className="flex justify-between items-start text-muted-foreground mb-2">
              <span className="text-sm font-medium">정산 대기 금액</span>
              <Clock size={18} className="text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-orange-600">{summary.pendingAmount.toLocaleString()}원</div>
            <span className="text-xs text-orange-600 font-medium">지급 승인 대기</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-border shadow-sm">
            <div className="flex justify-between items-start text-muted-foreground mb-2">
              <span className="text-sm font-medium">환불 / 취소 요청</span>
              <AlertCircle size={18} className="text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-600">{summary.refundRequestAmount.toLocaleString()}원</div>
            <span className="text-xs text-red-600 font-medium">빠른 처리가 필요합니다.</span>
          </div>
        </div>

        {/* 중단 필터 및 검색 바 */}
        <div className="bg-white rounded-xl border border-border shadow-sm p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-lg w-full md:w-auto">
            {[
              { id: 'all', label: '전체' },
              { id: 'PENDING', label: '정산 대기' },
              { id: 'COMPLETED', label: '정산 완료' },
              { id: 'REFUNDED', label: '환불 요청' }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex-1 md:flex-none ${
                        activeTab === tab.id
                            ? 'bg-white text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {tab.label}
                </button>
            ))}
          </div>

          <div className="flex gap-2 w-full md:w-auto justify-end">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
              <input
                  type="text"
                  placeholder="주문번호 또는 ID 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-border rounded-lg text-sm w-full focus:outline-none focus:border-primary"
              />
            </div>
            <button className="p-2 border border-border rounded-lg hover:bg-slate-50 text-muted-foreground">
              <Calendar size={18} />
            </button>
          </div>
        </div>

        {/* 하단 메인 데이터 테이블 */}
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
              <tr className="bg-slate-50/75 border-b border-border text-muted-foreground font-medium">
                <th className="p-4">주문번호 / 일시</th>
                <th className="p-4">바이어(수요자)</th>
                <th className="p-4">공급사(파트너)</th>
                <th className="p-4 text-right">결제 금액</th>
                <th className="p-4 text-right">플랫폼 수수료</th>
                <th className="p-4 text-right">정산 예정액</th>
                <th className="p-4 text-center">상태</th>
                <th className="p-4 text-center">관리 액션</th>
              </tr>
              </thead>
              <tbody className="divide-y divide-border">
              {safeRows
                  .filter(item => activeTab === 'all' || item?.status === activeTab)
                  .filter(item =>
                      !searchTerm ||
                      item?.order_no?.includes(searchTerm) ||
                      String(item?.buyer_id)?.includes(searchTerm) ||
                      String(item?.seller_id)?.includes(searchTerm)
                  )
                  .map((row) => (
                      <tr key={row.settlement_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-mono text-xs">
                          <span className="font-semibold text-foreground block">{row.order_no}</span>
                          <span className="text-muted-foreground">
                        {row.created_at ? new Date(row.created_at).toLocaleDateString() : '-'}
                      </span>
                        </td>
                        <td className="p-4 font-medium">ID: {row.buyer_id}</td>
                        <td className="p-4 text-muted-foreground">ID: {row.seller_id}</td>
                        <td className="p-4 text-right font-medium">{row.total_amount?.toLocaleString()}원</td>
                        <td className="p-4 text-right text-slate-500">{row.platform_fee?.toLocaleString()}원</td>
                        <td className="p-4 text-right font-semibold text-primary">{row.final_amount?.toLocaleString()}원</td>
                        <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          row.status === 'COMPLETED' ? 'bg-green-50 text-green-700' :
                              row.status === 'PENDING' ? 'bg-orange-50 text-orange-700' :
                                  'bg-red-50 text-red-700'
                      }`}>
                        {row.status === 'COMPLETED' && <CheckCircle2 size={12} />}
                        {row.status === 'PENDING' && <Clock size={12} />}
                        {row.status === 'REFUNDED' && <AlertCircle size={12} />}
                        정산 {row.status}
                      </span>
                        </td>
                        <td className="p-4 text-center">
                          {row.status === 'PENDING' && (
                              <button
                                  onClick={() => handleApprove(row.settlement_id)}
                                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1.5 rounded-md font-medium shadow-sm transition-colors"
                              >
                                정산 승인
                              </button>
                          )}
                          {row.status === 'COMPLETED' && (
                              <span className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                          <CheckCircle2 size={12} className="text-green-500" /> 지급 완료
                        </span>
                          )}
                          {row.status === 'REFUNDED' && (
                              <button
                                  onClick={() => handleRefund(row.settlement_id)}
                                  className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-md font-medium shadow-sm transition-colors flex items-center gap-1 mx-auto"
                              >
                                <RefreshCcw size={12} /> 환불 승인
                              </button>
                          )}
                        </td>
                      </tr>
                  ))}
              {safeRows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      표시할 정산 데이터가 없습니다. (백엔드 API 주소 및 서버 구동 여부를 확인해 주세요.)
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-border flex justify-between items-center text-xs text-muted-foreground bg-slate-50/50">
            <span>총 {safeRows.length}건 중 1-{safeRows.length}건 표시 중</span>
            <div className="flex gap-1">
              <button className="px-2 py-1 border border-border rounded bg-white disabled:opacity-50" disabled>이전</button>
              <button className="px-2 py-1 border border-primary rounded bg-blue-50 text-primary font-medium">1</button>
              <button className="px-2 py-1 border border-border rounded bg-white disabled:opacity-50" disabled>다음</button>
            </div>
          </div>
        </div>
      </div>
  );
}