// src/redux/slices/reviewSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "@/lib/axios/axiosInstance";
import { ReviewRequest, ReviewResponse } from "@/types/review";

interface ReviewState {
  loading: boolean;
  error: string | null;
  success: boolean;
  review: ReviewResponse["data"] | null; // khi create
  reviews: ReviewResponse["data"][]; // khi fetch list
}

const initialState: ReviewState = {
  loading: false,
  error: null,
  success: false,
  review: null,
  reviews: [],
};

// ✅ Async thunk: gọi API tạo review
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
  } catch (err: any) {
    const message =
      err.response?.data?.errMessage || err.message || "Lỗi khi tạo review";
    return rejectWithValue(message);
  }
});

// ✅ Async thunk: gọi API lấy list reviews
export const getReviews = createAsyncThunk<
  ReviewResponse,
  void,
  { rejectValue: string }
>("review/getReviews", async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get<ReviewResponse>("/api/Review");
    return res.data;
  } catch (err: any) {
    const message =
      err.response?.data?.errMessage || err.message || "Lỗi khi lấy reviews";
    return rejectWithValue(message);
  }
});

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
    } catch (err: any) {
      const message =
        err.response?.data?.errMessage ||
        err.message ||
        "Lỗi khi lấy review theo nhà hàng";
      return rejectWithValue(message);
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
          state.review = action.payload.data;
          state.reviews.push(action.payload.data);
        }
      )
      .addCase(createReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Không thể tạo review";
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
          state.reviews = action.payload.data; // data là mảng reviews
        }
      )
      .addCase(getReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Không thể lấy reviews";
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

          // Nếu API trả về 1 object thì normalize thành mảng
          if (Array.isArray(action.payload.data)) {
            state.reviews = action.payload.data;
          } else if (action.payload.data) {
            state.reviews = [action.payload.data];
          } else {
            state.reviews = [];
          }
        }
      )
      .addCase(getReviewsByRestaurant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Không thể lấy review theo nhà hàng";
      });
  },
});

export const { resetReviewState } = reviewSlice.actions;
export default reviewSlice.reducer;
