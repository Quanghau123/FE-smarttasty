/* -------------------------------------------------------------------------- */
/*                                ENUMS (FE)                                 */
/* -------------------------------------------------------------------------- */

// NOTE: these enums mirror backend `backend.Domain.Enums.PaymentMethod` and `PaymentStatus`.
// Keep the string values stable to match API responses which may return either names or numeric values.
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

/* -------------------------------------------------------------------------- */
/*                              RELATED ENTITIES                              */
/* -------------------------------------------------------------------------- */

export interface PaymentTransactionLog {
  id: number;
  paymentId: number;
  // provider corresponds to backend PaymentTransactionLog.Provider (enum PaymentMethod)
  provider: PaymentMethod;
  // status corresponds to backend PaymentTransactionLog.Status (enum PaymentStatus)
  status: PaymentStatus;
  rawData?: string | null;
  errorMessage?: string | null;
  createdAt: string;
}

export interface VNPayPayment {
  id: number;
  paymentId: number;
  // VnpTxnRef on backend
  vnpTxnRef: string;
  bankCode?: string | null;
  cardType?: string | null;
  responseCode?: string | null;
}

export interface ZaloPayPayment {
  id: number;
  paymentId: number;
  // AppTransId on backend
  appTransId: string;
  zpTransId?: string | null;
  responseMessage?: string | null;
}

export interface CODPayment {
  id: number;
  paymentId: number;
  isCollected: boolean; // backend: IsCollected
  collectedAt?: string | null;
}

export interface Refund {
  id: number;
  paymentId: number;
  amount: number;
  // backend: Refund.Reason nullable
  reason?: string | null;
  status: string; // RefundStatus on backend (as string here)
  transactionId?: string | null;
  createdAt: string;
  processedAt?: string | null;
}

/* -------------------------------------------------------------------------- */
/*                                 MAIN MODEL                                 */
/* -------------------------------------------------------------------------- */

export interface Payment {
  id: number;
  orderId: number;

  method: PaymentMethod;
  status: PaymentStatus | string; // backend PaymentDto.Status can be a string message
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

/* -------------------------------------------------------------------------- */
/*                         INFO PAYMENT (History Item)                        */
/* -------------------------------------------------------------------------- */

import type { OrderResponse } from "@/types/order";

// Mirrors backend Application.DTOs.Payment.InfoPaymentDto
export interface InfoPayment {
  id: number;
  amount: number;
  status: string; // BE returns string status in InfoPaymentDto
  order: OrderResponse;
}
