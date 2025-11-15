// src/types/voucher.ts
// Matches backend VoucherDto shape (some fields optional depending on BE)
export interface Voucher {
  id: number;
  code: string;
  promotionId: number;
  userId?: number | null;
  isUsed: boolean;
  createdAt: string; // ISO date string
  expiredAt: string; // ISO date string

  // Promotion-related fields
  discountType?: string | number;
  discountValue?: number;
  startDate?: string;
  endDate?: string;
}
