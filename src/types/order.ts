export enum OrderStatus {
  Pending = "Pending",
  Paid = "Paid",
  Cancelled = "Cancelled",
  Failed = "Failed",
}

export enum DeliveryStatus {
  Preparing = "Preparing",
  Shipping = "Shipping",
  Delivered = "Delivered",
  Failed = "Failed",
}

export enum RestaurantCategory {
  Buffet = "buffet",
  NhaHang = "nhaHang",
  AnVatViaHe = "anVatViaHe",
  AnChay = "anChay",
  CafeNuocUong = "cafeNuocUong",
  QuanAn = "quanAn",
  Bar = "bar",
  QuanNhau = "quanNhau",
}

export enum RestaurantStatus {
  Pending = "pending",
  Approved = "approved",
  Rejected = "rejected",
}

export interface Restaurant {
  id: number;
  ownerId: number;
  ownerEmail: string | null;
  ownerName: string | null;
  ownerPhone: string | null;
  name: string;
  category: RestaurantCategory | string;
  address: string;
  imagePublicId: string;
  imageUrl?: string;
  latitude: number;
  longitude: number;
  description: string;
  openTime: string;
  closeTime: string;
  status: RestaurantStatus | string;
  isHidden: boolean;
  createdAt: string;
  distanceKm?: number | null;
}

export interface OrderItem {
  id: number;
  dishId: number;
  dishName: string;
  quantity: number;
  totalPrice: number;
  unitPrice?: number;
  originalPrice?: number;
  image?: string; // URL hình ảnh món ăn
}


export interface OrderResponse {
  id: number;
  userId: number;
  restaurantId: number;
  deliveryAddress: string;
  recipientName: string;
  recipientPhone: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  restaurant: Restaurant;
  totalPrice?: number;
  finalPrice?: number;
  status?: OrderStatus;
  deliveryStatus?: DeliveryStatus;
  deliveredAt?: string;
}


export interface OrderRequest {
  userId: number;
  restaurantId: number;
  deliveryAddress: string;
  recipientName: string;
  recipientPhone: string;
  items: {
    dishId: number;
    quantity: number;
  }[];
}


export interface ApiEnvelope<T> {
  errCode: "success" | "error";
  errMessage: string;
  data?: T;
  timestamp?: string;
  traceId?: string | null;
  status?: string;
}


export interface RestaurantRevenue {
  restaurantId: number;
  year: number;
  month: number;
  totalRevenue: number;
  ordersCount: number;
  // optional breakdown by day or category
  breakdown?: Record<string, number> | null;
}


export interface RawOrderResponse {
  id: number;
  userId: number;
  restaurantId: number;
  deliveryAddress?: string | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  items?: {
    id: number;
    dishId: number;
    dishName?: string | null;
    quantity: number;
    totalPrice: number;
    unitPrice?: number;
    originalPrice?: number;
    image?: string | null; // URL hình ảnh món ăn từ backend
  }[];
  restaurant?: Partial<Restaurant>;
  totalPrice?: number | null;
  finalPrice?: number | null;
  status?: OrderStatus | null;
  deliveryStatus?: DeliveryStatus | null;
  deliveredAt?: string | null;
}

export const normalizeOrderResponse = (
  raw: RawOrderResponse
): OrderResponse => {
  if (!raw) throw new Error("Invalid order data");

  return {
    id: raw.id,
    userId: raw.userId,
    restaurantId: raw.restaurantId,
    deliveryAddress: raw.deliveryAddress ?? "",
    recipientName: raw.recipientName ?? "",
    recipientPhone: raw.recipientPhone ?? "",
    createdAt: raw.createdAt ?? "",
    updatedAt: raw.updatedAt ?? "",
    items:
      raw.items?.map((it) => ({
        id: it.id,
        dishId: it.dishId,
        dishName: it.dishName ?? "",
        quantity: it.quantity,
        totalPrice: it.totalPrice,
        unitPrice: it.unitPrice ?? (it.quantity ? it.totalPrice / it.quantity : 0),
        originalPrice: it.originalPrice ?? undefined,
        image: it.image ?? undefined, // Chuyển null thành undefined
      })) ?? [],
    restaurant: {
      id: raw.restaurant?.id ?? 0,
      ownerId: raw.restaurant?.ownerId ?? 0,
      ownerEmail: raw.restaurant?.ownerEmail ?? "",
      ownerName: raw.restaurant?.ownerName ?? "",
      ownerPhone: raw.restaurant?.ownerPhone ?? "",
      name: raw.restaurant?.name ?? "",
      category: raw.restaurant?.category ?? "buffet",
      address: raw.restaurant?.address ?? "",
      imagePublicId: raw.restaurant?.imagePublicId ?? "",
      imageUrl: raw.restaurant?.imageUrl ?? "",
      latitude: raw.restaurant?.latitude ?? 0,
      longitude: raw.restaurant?.longitude ?? 0,
      description: raw.restaurant?.description ?? "",
      openTime: raw.restaurant?.openTime ?? "",
      closeTime: raw.restaurant?.closeTime ?? "",
      status: raw.restaurant?.status ?? "pending",
      isHidden: raw.restaurant?.isHidden ?? false,
      createdAt: raw.restaurant?.createdAt ?? "",
      distanceKm: raw.restaurant?.distanceKm ?? null,
    },
    // If backend doesn't include order.totalPrice/finalPrice, compute from items
    totalPrice:
      raw.totalPrice ??
      (Array.isArray(raw.items) ? raw.items.reduce((s, it) => s + (it?.totalPrice ?? 0), 0) : 0),
    finalPrice:
      raw.finalPrice ??
      raw.totalPrice ??
      (Array.isArray(raw.items) ? raw.items.reduce((s, it) => s + (it?.totalPrice ?? 0), 0) : 0),
    status: raw.status ?? OrderStatus.Pending,
    deliveryStatus: raw.deliveryStatus ?? DeliveryStatus.Preparing,
    deliveredAt: raw.deliveredAt ?? undefined,
  };
};
