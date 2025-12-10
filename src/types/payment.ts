export enum PaymentMethod {
  VNPay = "VNPay",
  ZaloPay = "ZaloPay",
  COD = "COD",
}

export enum PaymentStatus {
  Pending = "Pending",    // backend: Pending = 0
  Success = "Success",    // backend: Success = 1
  Failed = "Failed",      // backend: Failed = 2
  Cancelled = "Cancelled",// backend: Cancelled = 3
  Refunded = "Refunded",  // backend: Refunded = 4
}

export interface PaymentTransactionLog {
  id: number;
  paymentId: number;
  provider: PaymentMethod;
  status: PaymentStatus;
  rawData?: string | null;
  errorMessage?: string | null;
  createdAt: string;
}

export interface VNPayPayment {
  id: number;
  paymentId: number;
  vnpTxnRef: string;
  bankCode?: string | null;
  cardType?: string | null;
  responseCode?: string | null;
}

export interface ZaloPayPayment {
  id: number;
  paymentId: number;
  appTransId: string;
  zpTransId?: string | null;
  responseMessage?: string | null;
}

export interface CODPayment {
  id: number;
  paymentId: number;
  isCollected: boolean; 
  collectedAt?: string | null;
}

export interface Refund {
  id: number;
  paymentId: number;
  amount: number;
  reason?: string | null;
  status: string; 
  transactionId?: string | null;
  createdAt: string;
  processedAt?: string | null;
}

export interface Payment {
  id: number;
  orderId: number;

  method: PaymentMethod;
  status: PaymentStatus | string; 
  amount: number;

  transactionId?: string | null;
  paymentUrl?: string | null;
  paidAt?: string | null;

  createdAt: string;
  updatedAt?: string | null;

  transactionLogs: PaymentTransactionLog[];

  vnpPayPayment?: VNPayPayment | null;
  zaloPayPayment?: ZaloPayPayment | null;
  codPayment?: CODPayment | null;
  refunds: Refund[];
}

import type { OrderResponse } from "@/types/order";

export interface InfoPayment {
  id: number;
  amount: number;
  status: string; 
  order: OrderResponse;
  codPayment?: CODPayment | null;
}
