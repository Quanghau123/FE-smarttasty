// types/reservation.ts

// Trạng thái đặt chỗ
export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "checkedIn"
  | "completed"
  | "cancelled";

// Request khi tạo đặt chỗ
export interface ReservationRequest {
  userId: number;
  restaurantId: number;
  adultCount: number;
  childCount: number;
  arrivalDate: string; // ISO string (ví dụ: 2025-09-23T18:00:00Z)
  reservationTime: string; // chỉ giờ (HH:mm)
  contactName: string;
  phone: string;
  email: string;
  note?: string;
}

// Entity trả về từ BE (chi tiết 1 reservation)
export interface ReservationEntity {
  id: number;
  userId: number;
  restaurantId: number;
  adultCount: number;
  childCount: number;
  arrivalDate: string; // ISO string
  reservationTime: string;
  contactName: string;
  phone: string;
  email: string;
  note?: string;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
}

// Request update status
export interface UpdateReservationStatusRequest {
  status: ReservationStatus;
  changedBy: number;
  note?: string;
}

// Response update status
export interface UpdateReservationStatusResponse {
  id: number;
  status: ReservationStatus;
  changedBy: number;
  note?: string;
  updatedAt: string;
}
