// types/reservation.ts

// Trạng thái đặt chỗ (lowercase - legacy in some places)
export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "checkedIn"
  | "completed"
  | "cancelled";

// Trạng thái đặt chỗ (BE enum names)
export type ReservationStatusName =
  | "Pending"
  | "Confirmed"
  | "CheckedIn"
  | "Completed"
  | "Cancelled";

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
  status: ReservationStatus | ReservationStatusName;
  createdAt: string;
  updatedAt: string;
}

// Request update status
export interface UpdateReservationStatusParams {
  status: ReservationStatusName; // must match BE enum name
  changedBy: number;
  note?: string;
}

// Response update status
export interface UpdateReservationStatusResponse {
  id: number;
  status: ReservationStatusName;
}

// Row shape returned by GET /api/Reservation/restaurant/{restaurantId}
export interface RestaurantReservationRow {
  id: number;
  userId: number;
  userName?: string | null;
  restaurantId: number;
  adultCount: number;
  childCount: number;
  arrivalDate: string;
  reservationTime: string; // HH:mm:ss
  note?: string | null;
  status: ReservationStatusName | string | number;
  createdAt: string;
  customers?: { contactName?: string | null; phone?: string | null; email?: string | null }[];
  latestHistory?: { status: string; note?: string | null; changedAt: string } | null;
}
