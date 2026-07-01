import axios from 'axios';

// 백엔드와 주고받을 정산 데이터 타입 정의
export interface Summary {
  totalGMV: number;
  totalFee: number;
  pendingAmount: number;
  refundRequestAmound: number;
}

export interface MomthlyStat{
  month: string;
  total: number;
  count: number;
  avgOrder: number;
}

export interface  SettlementRow {
  settlementId: number;
  orderNo?: string;
  createdAt?: string;
  buyerName?: string;
  sellerCompanyName?: string;
  totalAmount: number;
  status: string;
}

export interface UserStats {
  buyers: { total: number; thisMonth: number; active: number; growth: number};
  sellers: { total: number; thisMonth: number; verified: number; growth: number};
}

export interface DashboardDataResponse {
  summary: Summary;
  paymentStats: MomthlyStat[];
  rows: SettlementRow[];
  userStats: UserStats;
}

export interface SettlementResponse {
  settlement_id: number;
  seller_id: number;
  buyer_id: number;
  admin_id: number;
  order_no: string;
  total_amount: number;
  platform_fee: number;
  final_amount: number;
  settled_at: Date;
  created_at: Date;
  status: 'CANCELED'|'COMPLETED'|'CONFIRMED'|'DELIVERED'|'DISPUTE'|'PENDING'|'PREPARING'|'REFUNDED'|'SHIPPED'; // 백엔드 코드값에 맞춰 매핑
}

const API_BASE_URL = 'http://localhost:5173/api/settlements';

export const settlementApi = {
  // 1. 정산 데이터 목록 조회
    getSettlements: async () => {
      const response = await axios.get('/api/settlements');
      return response.data; // { summary: {...}, rows: [...] } 형태로 반환됨
    },

  // 2. 정산 상태 변경 (승인 또는 환불 등)
  // 백엔드 구현에 따라 PATCH /api/settlements/{id}/status 형태를 주로 사용합니다.
  updateSettlementStatus: async (id: string, status: string): Promise<void> => {
    await axios.patch(`${API_BASE_URL}/${id}/status`, { status });
  }
};