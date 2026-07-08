export type SourcingStatus =
    | "PENDING"
    | "QUOTED"
    | "NEGOTIATING"
    | "TRADING"
    | "COMPLETED"
    | "CANCELLED"
    | "WITHDRAWN"
    | "EXPIRED";

export type OrderStatus =
    | "PENDING"
    | "CONFIRMED"
    | "PREPARING"
    | "SHIPPED"
    | "DELIVERED"
    | "COMPLETED"
    | "DISPUTE"
    | "CANCELED"
    | "REFUNDED";

export type DisputeStatus = "RECEIVED" | "UNDER_REVIEW" | "RESOLVED";

// 1. 소싱 요청 타입
export interface BuyerSourcing {
    sourcingRequestId: number;
    sourcingNo: string;
    productName: string;
    status: SourcingStatus;
    category: string;         // 추가됨 (r.category)
    qty: string | number;     // 추가됨 (r.qty)
    budget: string | number;  // 추가됨 (r.budget)
    daysUntilExpiry: number;  // 추가됨 (StatCards 및 만료 계산용)
    bidCount: number;         // 추가됨 (r.bidCount 견적 건수)
    expiresAt: string;        // 추가됨 (r.expiresAt 마감일 표기용)
}

// 2. 견적 수신 타입
export interface BuyerQuote {
    quoteId: number;
    quoteNo: string;
    productName: string;
    companyName: string;
    qty: string | number;     // 추가됨 (q.qty)
    unitPrice: number;        // 추가됨 (q.unitPrice 단가)
    totalAmount: number;
    status: string;
    isUrgent: boolean;        // 만료 임박 여부
    expiresAt: string;        // 추가됨 (q.expiresAt 만료일 표기용)
}

// 3. 협의 진행 타입
export interface BuyerNegotiation {
    negotiationId: number;
    productName: string;      // 추가됨 (n.productName)
    sellerCompanyName: string;// 추가됨 (n.sellerCompanyName)
    qty: string | number;     // 추가됨 (n.qty)
    title: string;
    status: string;
    lastMessage: string;      // 추가됨 (n.lastMessage 마지막 대화내용)
    updatedAt: string;
    hasUnread?: boolean;      // 미확인 메시지 여부
}

// 4. 주문 정보 타입 (결제대기 / 배송중 공통 사용)
export interface BuyerOrder {
    orderId: number;
    orderNo: string;
    productName: string;
    sellerCompanyName: string;// 추가됨 (p.sellerCompanyName)
    qty: string | number;     // 추가됨 (p.qty)
    totalAmount: number;
    status: OrderStatus;
    confirmedAt?: string;     // 추가됨 (p.confirmedAt 결제 확인일)
    isDelayed?: boolean;      // 추가됨 (s.isDelayed 배송지연 여부)
    carrier?: string;         // 추가됨 (s.carrier 택배사)
    trackingNo?: string;      // 추가됨 (s.trackingNo 송장번호)
}

// 5. 수령 확인 임박 (긴급) 타입
export interface UrgentReceipt {
    orderId: number;
    orderNo: string;
    productName: string;
    sellerCompanyName: string;
    qty: string | number;     // 추가됨 (r.qty)
    daysElapsed: number;      // 수정됨 (D+일수 계산 및 r.daysElapsed >= 5 필터링용으로 number 타입이 적합)
}

// 6. 이의제기(클레임) 타입
export interface BuyerDispute {
    disputeId: number;
    productName: string;      // 추가됨 (d.productName)
    sellerCompanyName: string;// 추가됨 (d.sellerCompanyName)
    title: string;
    disputeType: string;
    reason: string;           // 추가됨 (d.reason 사유)
    status: DisputeStatus;    // 매핑 레이블을 위한 엄격한 타입 지정
    createdAt: string;        // 추가됨 (d.createdAt)
}

// 백엔드 ApiResponse 공통 포맷 (프로젝트 규격이 있다면 그걸 쓰셔도 됩니다)
export interface DashboardListResponse<T> {
    totalCount: number;
    list: T[];
}

// 명확한 매핑을 위해 각각 선언해 두면 관리하기 좋습니다.
export type BuyerSourcingResponse = DashboardListResponse<BuyerSourcing>;
export type BuyerQuoteResponse = DashboardListResponse<BuyerQuote>;
export type BuyerNegotiationResponse = DashboardListResponse<BuyerNegotiation>;
export type BuyerOrderResponse = DashboardListResponse<BuyerOrder>;