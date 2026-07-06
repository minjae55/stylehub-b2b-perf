import {OrderStatus} from "../buyer/buyer.type";

export interface SellerSourcingRequest {
    sourcingRequestId: number;
    productName: string;
    buyerCompanyName: string;
    totalBudget: number;
    isNew: boolean;
}

export interface QuoteDraft {
    quoteId: number;
    productName: string;
    buyerName: string;
    totalAmount: number;
    isOverdue: boolean;
}

export interface SellerNegotiation {
    negotiationId: number;
    title: string;
    productName: string;
    lastMessage: string;
}

export interface SellerShipment {
    orderId: number;
    orderNo: string;
    productName: string;
    buyerName: string;
    subtotalAmount: number;
    isOverdue: boolean;
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
    buyerClaim: string;
    status: "RECEIVED" | "UNDER_REVIEW" | "RESOLVED";
}

export interface SellerSettlement {
    settlementId: number;
    orderNo: string;
    productName: string;
    buyerName: string;
    finalAmount: number;
}