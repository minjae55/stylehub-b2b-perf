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
import { settlementApi, SettlementResponse } from './Settlement'; // 백엔드와 주고받을 정산 데이터 타입 정의

export default function Settlements() {
  // 상태 관리 (필터 탭 및 검색어)
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 가상 정산 데이터 샘플 (포트원 연동 및 정산 프로세스 반영)
  const [settlement, setSettlement] = useState<SettlementResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadSettlementData = async () => {
    try {
      setLoading(true);
      const data = await settlementApi.getSettlements();
      setSettlement(data);
    } catch (error) {
      console.error('정산 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettlementData();
  }, []);
  // 정산 승인 액션 함수
  const handleApprove = async (settlement_id: number) => {
    if (window.confirm('해당 건의 정산 지급을 승인하시겠습니까?')) {
      try {
        await settlementApi.updateSettlementStatus(settlement_id.toString(), '완료');
        alert('정산 승인이 완료되었습니다.');
        loadSettlementData(); // 변경사항을 반영하기 위해 서버 데이터 재조회
      } catch (error) {
        alert('정산 승인 처리 중 오류가 발생했습니다.');
      }
    }
  };

  // 환불 처리 액션 함수 (포트원 연동 시 환불 API 호출부)
  const handleRefund = async (settlement_id: number) => {
    if (window.confirm('포트원을 통해 결제 취소(환불)를 진행하시겠습니까?')) {
      try {
        await settlementApi.updateSettlementStatus(settlement_id.toString(), '환불완료'); // 혹은 상태에 맞춰 전송
        alert('환불 처리가 완료되었습니다.');
        loadSettlementData(); // 서버 데이터 재조회
      } catch (error) {
        alert('환불 처리 중 오류가 발생했습니다.');
      }
    }
  };

  const totalGMV = settlement.reduce((acc, cur) => acc + cur.total_amount, 0);
  const totalFee = settlement.reduce((acc, cur) => acc + cur.platform_fee, 0);
  const pendingAmount = settlement.filter(item => item.status === '대기').reduce((acc, cur) => acc + cur.total_amount, 0);
  const refundRequestAmount = settlement.filter(item => item.status === '환불요청').reduce((acc, cur) => acc + cur.total_amount, 0);

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

      {/* 1. 상단 요약 메트릭 카드 영역 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border border-border shadow-sm">
          <div className="flex justify-between items-start text-muted-foreground mb-2">
            <span className="text-sm font-medium">총 거래액 (GMV)</span>
            <TrendingUp size={18} className="text-blue-500" />
          </div>
          <div className="text-2xl font-bold">{totalGMV.toLocaleString()}원</div>
          <span className="text-xs text-green-600 font-medium">전월 대비 +12.4%</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-border shadow-sm">
          <div className="flex justify-between items-start text-muted-foreground mb-2">
            <span className="text-sm font-medium">플랫폼 수수료 수익</span>
            <DollarSign size={18} className="text-green-500" />
          </div>
          <div className="text-2xl font-bold">{totalFee.toLocaleString()}원</div>
          <span className="text-xs text-muted-foreground">평균 수수료율 10%</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-border shadow-sm">
          <div className="flex justify-between items-start text-muted-foreground mb-2">
            <span className="text-sm font-medium">정산 대기 금액</span>
            <Clock size={18} className="text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-orange-600">{pendingAmount.toLocaleString()}원</div>
          <span className="text-xs text-orange-600 font-medium">지급 승인 대기 1건</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-border shadow-sm">
          <div className="flex justify-between items-start text-muted-foreground mb-2">
            <span className="text-sm font-medium">환불 / 취소 요청</span>
            <AlertCircle size={18} className="text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600">{refundRequestAmount.toLocaleString()}원</div>
          <span className="text-xs text-red-600 font-medium">빠른 처리가 필요합니다.</span>
        </div>
      </div>

      {/* 2. 중단 필터 및 검색 바 */}
      <div className="bg-white rounded-xl border border-border shadow-sm p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* 상태 필터 탭 */}
        <div className="flex bg-slate-100 p-1 rounded-lg w-full md:w-auto">
          {[
            { id: 'all', label: '전체' },
            { id: '대기', label: '정산 대기' },
            { id: '완료', label: '정산 완료' },
            { id: '환불요청', label: '환불 요청' }
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

        {/* 검색 및 기간 설정 */}
        <div className="flex gap-2 w-full md:w-auto justify-end">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
            <input 
              type="text" 
              placeholder="바이어 또는 공급사 검색" 
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

      {/* 3. 하단 메인 데이터 테이블 */}
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
              {settlement
                .filter(item => activeTab === 'all' || item.status === activeTab)
                .filter(item => 
                        item.order_no.includes(searchTerm) || 
                        String(item.buyer_id).includes(searchTerm) || 
                        String(item.seller_id).includes(searchTerm)
                      )
                .map((row) => (
    <tr key={row.settlement_id} className="hover:bg-slate-50/50 transition-colors">
      {/* 주문번호 / 일시 */}
      <td className="p-4 font-mono text-xs">
        <span className="font-semibold text-foreground block">{row.order_no}</span>
        <span className="text-muted-foreground">
          {/* Date 객체 포맷팅 (예: 2026-06-17 형태로 변환하여 출력) */}
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      </td>
      
      {/* 바이어(수요자) ID */}
      <td className="p-4 font-medium">ID: {row.buyer_id}</td>
      
      {/* 공급사(판매자) ID */}
      <td className="p-4 text-muted-foreground">ID: {row.seller_id}</td>
      
      {/* 결제 금액 */}
      <td className="p-4 text-right font-medium">
        {row.total_amount.toLocaleString()}원
      </td>
      
      {/* 플랫폼 수수료 */}
      <td className="p-4 text-right text-slate-500">
        {row.platform_fee.toLocaleString()}원
      </td>
      
      {/* 정산 예정액 (백엔드의 final_amount 직결) */}
      <td className="p-4 text-right font-semibold text-primary">
        {row.final_amount.toLocaleString()}원
      </td>
      
      {/* 상태 뱃지 */}
      <td className="p-4 text-center">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
          row.status === '완료' ? 'bg-green-50 text-green-700' :
          row.status === '대기' ? 'bg-orange-50 text-orange-700' :
          'bg-red-50 text-red-700'
        }`}>
          {row.status === '완료' && <CheckCircle2 size={12} />}
          {row.status === '대기' && <Clock size={12} />}
          {row.status === '환불요청' && <AlertCircle size={12} />}
          정산 {row.status}
        </span>
      </td>
      
      {/* 관리 액션 버튼들 */}
      <td className="p-4 text-center">
        {row.status === '대기' && (
          <button 
            onClick={() => handleApprove(row.settlement_id)} // 기존 id -> settlement_id
            className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1.5 rounded-md font-medium shadow-sm transition-colors"
          >
            정산 승인
          </button>
        )}
        {row.status === '완료' && (
          <span className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <CheckCircle2 size={12} className="text-green-500" /> 지급 완료
          </span>
        )}
        {row.status === '환불요청' && (
          <button 
            onClick={() => handleRefund(row.settlement_id)} // 기존 id -> settlement_id
            className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-md font-medium shadow-sm transition-colors flex items-center gap-1 mx-auto"
          >
            <RefreshCcw size={12} /> 환불 승인
          </button>
        )}
      </td>
    </tr>
))}
            </tbody>
          </table>
        </div>
        
        {/* 테이블 하단 페이지네이션 영역 */}
        <div className="p-4 border-t border-border flex justify-between items-center text-xs text-muted-foreground bg-slate-50/50">
          <span>총 {settlement.length}건 중 1-{settlement.length}건 표시 중</span>
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