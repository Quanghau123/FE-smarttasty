// Types for promotion-related data. These are based on the backend C# model:
// Promotion { Id, RestaurantId, Restaurant, Title, Description, StartDate, EndDate,
// DiscountType, DiscountValue, TargetType, DishPromotions, OrderPromotions, Vouchers }
// Keep shapes friendly to the frontend and avoid circular imports (don't import DishPromotion here).

// Must match backend enums exactly (lowercase)
export type DiscountType = "percent" | "fixed_amount";
export type TargetType = "dish" | "order" | "category";

// Minimal shape for related restaurant object returned from server.
export interface RelatedRestaurant {
  id: number;
  name?: string;
  imageUrl?: string;
}

// Lightweight shapes for related collections to avoid importing other type files (prevents circular refs).
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
  id: number; // maps to backend Id
  restaurantId: number;

  // optional populated relation (may be null or absent depending on the API call)
  restaurant?: RelatedRestaurant | null;

  title: string;
  description?: string;

  // dates are represented as ISO strings in the frontend
  startDate: string;
  endDate: string;

  discountType: DiscountType;
  discountValue: number;

  targetType: TargetType;

  // related collections (may be empty or omitted in some API responses)
  dishPromotions?: DishPromotionRef[];
  orderPromotions?: OrderPromotionRef[];
  vouchers?: VoucherRef[];

  // convenience fields used by the frontend (optional).
  isActive?: boolean;

  // optional metadata
  createdAt?: string;
  updatedAt?: string;

  // image fields from backend
  image?: string | null; // public id/key stored in DB
  imageUrl?: string | null; // full URL for display
}
