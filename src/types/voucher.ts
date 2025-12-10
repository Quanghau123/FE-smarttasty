export interface Voucher {
  id: number;
  code: string;
  promotionId: number;
  userId?: number | null;
  isUsed: boolean;
  createdAt: string; // ISO date string
  expiredAt: string; // ISO date string

  discountType?: string | number;
  discountValue?: number;
  startDate?: string;
  endDate?: string;
}
