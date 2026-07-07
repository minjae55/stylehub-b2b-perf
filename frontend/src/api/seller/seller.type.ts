import {OrderStatus} from "../buyer/buyer.type";

export interface SellerSourcingRequest {
    sourcingRequestId: number;
    productName: string;
    buyerCompanyName: string;
    qty: string;
    category: string;
    totalBudget: number;
    requestedAt: string;
    expiresAt: string;
    isNew: boolean;
}

export interface QuoteDraft {
    quoteId: number;
    productName: string;
    buyerName: string;
    qty: string;
    totalAmount: number;
    deadline: string;
    daysUntilDeadline: number; // 양수: 남은 일수, 0/음수: 마감 초과
    isOverdue: boolean;
}

export interface SellerNegotiation {
    negotiationId: number;
    title: string;
    productName: string;
    buyerName: string;
    qty: string;
    lastMessage: string;
    lastMessageAt: string;
    hasNewMessage: boolean;
}

export interface SellerShipment {
    orderId: number;
    orderNo: string;
    productName: string;
    buyerName: string;
    qty: string;
    subtotalAmount: number;
    paidAt: string;
    shipByDate: string;
    isDue: boolean;     // 기한 임박
    isOverdue: boolean; // 기한 초과
}

export interface SellerTransit {
    orderId: number;
    productName: string;
    buyerName: string;
    status: OrderStatus;
}

export interface SellerDispute {
    disputeId: number;
    title: string;
    productName: string;
    buyerName: string;
    buyerClaim: string;
    createdAt: string;
    status: "RECEIVED" | "UNDER_REVIEW" | "RESOLVED";
}

export interface SellerSettlement {
    settlementId: number;
    orderNo: string;
    productName: string;
    buyerName: string;
    qty: string;
    grossAmount: number;
    platformFee: number;
    finalAmount: number;
    confirmedAt: string;
}