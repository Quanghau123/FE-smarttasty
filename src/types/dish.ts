// export interface DishCategory {
//   id: number;
//   name: string;
// }

// export interface Restaurant {
//   id: number;
//   name: string;
//   address?: string;
// }

// export interface Dish {
//   id: number;
//   name: string;
//   category: DishCategory;
//   description?: string;
//   price: number;
//   image?: string;
//   isActive: boolean;
//   restaurantId: number;
//   restaurant?: Restaurant;
//   dishPromotions?: DishPromotion[]; // quan hệ ngược
// }

export interface Dish {
  id: number;
  name: string;
  price: number;
  image?: string;
  imageUrl: string; // dùng cái này thôi
  description?: string;
  isActive: boolean;
  category: string;
 // description?: string;
  restaurant: {
    id: number;
    name: string;
    address: string;
  };
}
