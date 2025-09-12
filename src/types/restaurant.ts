// src/types/restaurant.ts

// Form để create/update restaurant
export interface RestaurantForm {
  name: string;
  category: string;
  address: string;
  description: string;
  openTime: string;
  closeTime: string;
  latitude: number;
  longitude: number;
  file: File;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Entity restaurant trong hệ thống
export interface Restaurant {
  id: number;
  name: string;
  category: string;
  address: string;
  description: string;
  openTime: string;
  closeTime: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
  ownerId: number;
  distanceKm?: number; // để hiển thị khoảng cách
}

// State trong Redux store
export interface RestaurantState {
  restaurants: Restaurant[];
  current: Restaurant | null;
  nearby: Restaurant[];
  loading: boolean;
  loadingNearby: boolean;
  error: string | null;
}
