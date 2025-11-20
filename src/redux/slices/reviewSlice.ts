// src/redux/slices/reviewSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "@/lib/axios/axiosInstance";
import { ReviewRequest, ReviewResponse, ReviewData } from "@/types/review";
import { AxiosError } from "axios";

interface ReviewState {
  loading: boolean;
  error: string | null;
  success: boolean;
  review: ReviewData | null; // khi create
  reviews: ReviewData[]; // khi fetch list
}

const initialState: ReviewState = {
  loading: false,
  error: null,
  success: false,
  review: null,
  reviews: [],
};

// ✅ Utility để lấy message lỗi từ Axios mà không dùng any
const getErrorMessage = (error: unknown): string => {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  const axiosErr = error as AxiosError<{ errMessage?: string }>;
  return (
    axiosErr.response?.data?.errMessage ||
    axiosErr.message ||
    "Đã xảy ra lỗi không xác định"
  );
};

// Utility: normalize backend response to an array of ReviewData
const extractReviewItems = (payloadData: unknown): ReviewData[] => {
  if (!payloadData) return [];

  // Case 1: payloadData is already an array of ReviewData
  if (Array.isArray(payloadData)) return payloadData as ReviewData[];

  // Case 2: payloadData is a paginated wrapper with `.data` field (e.g. { data: [...], totalRecords, ... })
  if (typeof payloadData === "object" && payloadData !== null) {
    const wrapper = payloadData as { data?: unknown };
    if (Array.isArray(wrapper.data)) return wrapper.data as ReviewData[];
  }

  // Case 3: payloadData is a single ReviewData object
  return [payloadData as ReviewData];
};

// ✅ Async thunk: tạo review
export const createReview = createAsyncThunk<
  ReviewResponse,
  ReviewRequest,
  { rejectValue: string }
>("review/createReview", async (payload, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post<ReviewResponse>(
      "/api/Review",
      payload
    );
    return res.data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

// ✅ Async thunk: lấy danh sách review
export const getReviews = createAsyncThunk<
  ReviewResponse,
  void,
  { rejectValue: string }
>("review/getReviews", async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get<ReviewResponse>("/api/Review");
    return res.data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

// ✅ Async thunk: lấy review theo nhà hàng
export const getReviewsByRestaurant = createAsyncThunk<
  ReviewResponse,
  number,
  { rejectValue: string }
>(
  "review/getReviewsByRestaurant",
  async (restaurantId, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get<ReviewResponse>(
        `/api/Review/restaurant/${restaurantId}`
      );
      return res.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ✅ Async thunk: xóa review
export const deleteReview = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("review/deleteReview", async (id, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/api/Review/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

const reviewSlice = createSlice({
  name: "review",
  initialState,
  reducers: {
    resetReviewState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.review = null;
      state.reviews = [];
    },
  },
  extraReducers: (builder) => {
    // CREATE
    builder
      .addCase(createReview.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        createReview.fulfilled,
        (state, action: PayloadAction<ReviewResponse>) => {
          state.loading = false;
          state.success = true;

          const data = action.payload.data;
          const items = extractReviewItems(data);
          state.review = items[0] ?? null;
          if (items.length) state.reviews.push(items[0]);
        }
      )
      .addCase(createReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Không thể tạo review";
      });

    // GET LIST
    builder
      .addCase(getReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getReviews.fulfilled,
        (state, action: PayloadAction<ReviewResponse>) => {
          state.loading = false;
          const data = action.payload.data;
          state.reviews = extractReviewItems(data);
        }
      )
      .addCase(getReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Không thể lấy reviews";
      });

    // GET BY RESTAURANT
    builder
      .addCase(getReviewsByRestaurant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getReviewsByRestaurant.fulfilled,
        (state, action: PayloadAction<ReviewResponse>) => {
          state.loading = false;
          const data = action.payload.data;
          state.reviews = extractReviewItems(data);
        }
      )
      .addCase(getReviewsByRestaurant.rejected, (state, action) => {
        state.loading = false;
        const payloadMessage = action.payload ?? action.error?.message ?? "Không thể lấy review theo nhà hàng";

        // Nếu backend trả 404 (không có review cho nhà hàng) => coi như không có review
        // Một số môi trường axios trả message: 'Request failed with status code 404'
        if (typeof payloadMessage === "string" && payloadMessage.includes("404")) {
          state.reviews = [];
          state.error = null;
        } else {
          state.error = payloadMessage;
        }
      });

    // DELETE
    builder
      .addCase(deleteReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteReview.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.reviews = state.reviews.filter((r) => r.id !== action.payload);
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Không thể xóa review";
      });
  },
});

export const { resetReviewState } = reviewSlice.actions;
export default reviewSlice.reducer;
