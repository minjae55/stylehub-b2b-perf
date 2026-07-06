export type SourcingStatus =
    "PENDING"
    | "QUOTED"
    | "NEGOTIATING"
    | "TRADING"
    | "COMPLETED"
    | "CANCELLED"
    | "WITHDRAWN"
    | "EXPIRED";
export type OrderStatus =
    "PENDING"
    | "CONFIRMED"
    | "PREPARING"
    | "SHIPPED"
    | "DELIVERED"
    | "COMPLETED"
    | "DISPUTE"
    | "CANCELED"
    | "REFUNDED";

export interface BuyerSourcing {
    sourcingRequestId: number;
    sourcingNo: string;
    productName: string;
    status: SourcingStatus;
    isUrgent: boolean;
}

export interface BuyerQuote {
    quoteId: number;
    quoteNo: string;
    productName: string;
    companyName: string;
    totalAmount: number;
    status: string;
    isUrgent: boolean;
}

export interface BuyerNegotiation {
    negotiationId: number;
    title: string;
    status: string;
    updatedAt: string;
    hasUnread?: boolean;
}

export interface BuyerOrder {
    orderId: number;
    orderNo: string;
    productName: string;
    totalAmount: number;
    status: OrderStatus;
}

export interface UrgentReceipt {
    orderId: number;
    orderNo: string;
    productName: string;
    sellerCompanyName: string;
    dDay: string;
}

export interface BuyerDispute {
    disputeId: number;
    title: string;
    disputeType: string;
    status: string;
}