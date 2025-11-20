// src/types/favorite.ts
export interface Favorite {
  id: number;
  userId: number;
  restaurantId: number;
}

export interface CreateFavoriteRequest {
  userId: number;
  restaurantId: number;
}
