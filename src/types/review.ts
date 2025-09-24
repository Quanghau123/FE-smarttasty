// types/review.ts

// Request body khi gọi POST /api/Review
export interface ReviewRequest {
  userId: number;        // ID người dùng
  restaurantId: number;  // ID nhà hàng
  rating: number;        // Điểm đánh giá (ví dụ: 1-5)
  comment: string;       // Nội dung bình luận
}

// Review data mà BE trả về trong field "data"
export interface ReviewData {
  id: number;
  userId: number;
  userName: string;
  restaurantId: number;
  restaurantName: string;
  rating: number;
  comment: string;
  createdAt: string;     // ISO datetime
}

// Response chung của API
export interface ReviewResponse {
  errCode: string;       // ví dụ: "success"
  errMessage: string;    // thông báo từ BE
  data: ReviewData;      // chi tiết review
  timestamp: string;     // thời điểm response
  traceId: string | null;
  status: string;        // ví dụ: "success"
}
