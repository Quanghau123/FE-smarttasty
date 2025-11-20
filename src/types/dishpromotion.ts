// Types for DishPromotion entity. Based on backend model:
// DishPromotion { Id, DishId, PromotionId, Dish, Promotion, OriginalPrice, DiscountedPrice }

export interface DishPromotion {
  id: number; // maps to backend Id
  dishId: number; // maps to backend DishId
  promotionId: number; // maps to backend PromotionId

  // ✅ BE đã tính toán sẵn giá gốc và giá sau giảm
  originalPrice: number; // Giá gốc của món (từ BE: OriginalPrice)
  discountedPrice: number; // Giá đã giảm (từ BE: DiscountedPrice) - BE đã tính sẵn!

  // Thông tin tên món và khuyến mãi
  dishName?: string; // Tên món (từ BE: DishName)
  promotionTitle?: string; // Tên khuyến mãi (từ BE: PromotionTitle)

  // Thông tin chi tiết về discount (từ BE)
  discountType: "percent" | "fixed_amount"; // Loại giảm giá (từ BE: DiscountType)
  discountValue: number; // Giá trị giảm giá (từ BE: DiscountValue)

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
