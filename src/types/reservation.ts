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

export interface ReservationRequest {
  userId: number;
  restaurantId: number;
  adultCount: number;
  childCount: number;
  arrivalDate: string; 
  reservationTime: string; 
  contactName: string;
  phone: string;
  email: string;
  note?: string;
}

export interface ReservationEntity {
  id: number;
  userId: number;
  restaurantId: number;
  adultCount: number;
  childCount: number;
  arrivalDate: string; 
  reservationTime: string;
  contactName: string;
  phone: string;
  email: string;
  note?: string;
  status: ReservationStatus | ReservationStatusName;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateReservationStatusParams {
  status: ReservationStatusName; 
  changedBy: number;
  note?: string;
}

export interface UpdateReservationStatusResponse {
  id: number;
  status: ReservationStatusName;
}

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
