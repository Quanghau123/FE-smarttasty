export enum PaymentMethod {
  VNPay = 1,
  COD = 3,
}

export interface CommissionResponse {
  orderId: number;
  restaurantId: number;
  commissionAmount: number;
  rate: number;
  finalPrice: number;
  createdAt: string;
}

export interface RestaurantCommissionResponse {
  restaurantId: number;
  restaurantName: string;
  totalCommission: number;
  totalOrders: number;
  totalRevenue: number;
}

export interface DailyCommissionResponse {
  day: number;
  totalCommission: number;
}

export interface PaymentCommissionResponse {
  paymentMethod: string | PaymentMethod;
  totalCommission: number;
  totalOrders: number;
}

export interface MonthlyCommissionResponse {
  month: number;
  year: number;
  totalCommission: number;
}

