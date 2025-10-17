// Types for DishPromotion entity. Based on backend model:
// DishPromotion { Id, DishId, PromotionId, Dish, Promotion }

export interface DishPromotion {
  id: number; // maps to backend Id
  dishId: number; // maps to backend DishId
  promotionId: number; // maps to backend PromotionId

  // optional populated relations (may be null or not returned in all API responses)
  dish?: {
    id: number;
    name?: string;
    imageUrl?: string;
    price?: number;
  } | null;

  promotion?: {
    id: number;
    title?: string;
    discountType?: "percent" | "fixed_amount";
    discountValue?: number;
  } | null;
}
