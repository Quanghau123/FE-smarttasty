
export type DiscountType = "percent" | "fixed_amount";
export type TargetType = "dish" | "order";

// Minimal shape for related restaurant object returned from server.
export interface RelatedRestaurant {
  id: number;
  name?: string;
  imageUrl?: string;
}

export interface DishPromotionRef {
  dishId: number;
  promotionId: number;
}

export interface OrderPromotionRef {
  orderId: number;
  promotionId: number;
}

export interface VoucherRef {
  id: number;
  code?: string;
  discountValue?: number;
}

export interface Promotion {
  id: number;
  restaurantId: number;

  restaurant?: RelatedRestaurant | null;

  title: string;
  description?: string;

  startDate: string;
  endDate: string;

  discountType: DiscountType;
  discountValue: number;

  targetType: TargetType;

  dishPromotions?: DishPromotionRef[];
  orderPromotions?: OrderPromotionRef[];
  vouchers?: VoucherRef[];

  isActive?: boolean;

  createdAt?: string;
  updatedAt?: string;

  image?: string | null; 
  imageUrl?: string | null; 
}
