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
  file: File | null;
  imageUrl?: string;
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
  imagePublicId?: string;
  ownerId: number;
  distanceKm?: number; // để hiển thị khoảng cách
  // BE hiện trả về AverageRating (double). Một số nơi FE trước đây dùng "rating".
  // Để tương thích ngược, giữ cả hai field và ưu tiên averageRating khi hiển thị.
  averageRating?: number;
  rating?: number;
  // Optional total reviews count (some API endpoints return this alongside restaurant)
  totalReviews?: number;
  createdAt: string;
  updatedAt?: string;
}

// State trong Redux store
export interface RestaurantState {
  restaurants: Restaurant[];
  allRestaurants: Restaurant[]; // Tất cả nhà hàng để filter cho phần đề xuất
  current: Restaurant | null;
  // Lưu tổng số reviews từ API detail (data.totalReviews)
  currentTotalReviews?: number | null;
  nearby: Restaurant[];
  // Gợi ý tìm kiếm (autocomplete)
  suggestions?: string[];
  loadingSuggestions?: boolean;
  loading: boolean;
  loadingNearby: boolean;
  error: string | null;
  // Pagination metadata for server-side listing
  totalRecords?: number;
  pageNumber?: number;
  pageSize?: number;
}
