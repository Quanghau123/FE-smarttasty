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
          if (Array.isArray(data)) {
            state.review = data[0] ?? null;
            if (data.length) state.reviews.push(data[0]);
          } else if (data) {
            state.review = data;
            state.reviews.push(data);
          }
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
          if (Array.isArray(data)) {
            state.reviews = data;
          } else if (data) {
            state.reviews = [data];
          } else {
            state.reviews = [];
          }
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
          if (Array.isArray(data)) {
            state.reviews = data;
          } else if (data) {
            state.reviews = [data];
          } else {
            state.reviews = [];
          }
        }
      )
      .addCase(getReviewsByRestaurant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Không thể lấy review theo nhà hàng";
      });
  },
});

export const { resetReviewState } = reviewSlice.actions;
export default reviewSlice.reducer;
