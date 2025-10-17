/* -------------------------------------------------------------------------- */
/*                                ENUMS (FE)                                 */
/* -------------------------------------------------------------------------- */

export enum PaymentMethod {
  VNPay = "VNPay",
  ZaloPay = "ZaloPay",
  COD = "COD",
}

export enum PaymentStatus {
  Pending = "Pending",
  Completed = "Completed",
  Failed = "Failed",
  Refunded = "Refunded",
  Cancelled = "Cancelled",
}

/* -------------------------------------------------------------------------- */
/*                              RELATED ENTITIES                              */
/* -------------------------------------------------------------------------- */

export interface PaymentTransactionLog {
  id: number;
  paymentId: number;
  message: string;
  status: string;
  createdAt: string;
}

export interface VNPayPayment {
  id: number;
  paymentId: number;
  vnpTransactionNo: string;
  vnpResponseCode: string;
}

export interface ZaloPayPayment {
  id: number;
  paymentId: number;
  appTransId: string;
  zpTransId: string;
  returnCode: number;
}

export interface CODPayment {
  id: number;
  paymentId: number;
  isReceived: boolean;
  receivedAt?: string;
}

export interface Refund {
  id: number;
  paymentId: number;
  amount: number;
  reason: string;
  createdAt: string;
}

/* -------------------------------------------------------------------------- */
/*                                 MAIN MODEL                                 */
/* -------------------------------------------------------------------------- */

export interface Payment {
  id: number;
  orderId: number;

  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;

  transactionId?: string;
  paymentUrl?: string;
  paidAt?: string;

  createdAt: string;
  updatedAt?: string;

  transactionLogs: PaymentTransactionLog[];

  vnpayPayment?: VNPayPayment;
  zaloPayPayment?: ZaloPayPayment;
  codPayment?: CODPayment;
  refunds: Refund[];
}
