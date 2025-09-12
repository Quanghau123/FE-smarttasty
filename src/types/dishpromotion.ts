import { Dish } from "./dish";
import { Promotion } from "./promotion";

export interface DishPromotion {
  dishId: number;
  dish: Dish;
  promotionId: number;
  promotion: Promotion;
}
