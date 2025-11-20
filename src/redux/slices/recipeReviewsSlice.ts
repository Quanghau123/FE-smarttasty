import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "@/lib/axios/axiosInstance";
import { RecipeReview, RecipeReviewRequest } from "@/types/recipes";
import { AxiosError } from "axios";

interface RecipeReviewState {
  loading: boolean;
  error: string | null;
  success: boolean;
  review: RecipeReview | null;
  reviews: RecipeReview[];
}

const initialState: RecipeReviewState = {
  loading: false,
  error: null,
  success: false,
  review: null,
  reviews: [],
};

const getErrorMessage = (error: unknown): string => {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  const axiosErr = error as AxiosError<{ errMessage?: string }>;
  return (
    axiosErr.response?.data?.errMessage || axiosErr.message || "Đã xảy ra lỗi không xác định"
  );
};

// POST /api/RecipeReview
export const createRecipeReview = createAsyncThunk<
  RecipeReview,
  RecipeReviewRequest,
  { rejectValue: string }
>("recipeReviews/create", async (payload, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post("/api/RecipeReview", payload);
    const body = res.data ?? {};
    const data = (body.data ?? body.Data ?? body) as unknown;
    if (Array.isArray(data)) return data[0] as RecipeReview;
    return (data as RecipeReview) || (res.data as RecipeReview);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

// GET /api/RecipeReview
export const fetchRecipeReviews = createAsyncThunk<
  RecipeReview[],
  void,
  { rejectValue: string }
>("recipeReviews/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get("/api/RecipeReview");
    const body = res.data ?? {};
    const payload = (body.data ?? body.Data ?? body) as unknown;
    const list = Array.isArray(payload) ? (payload as RecipeReview[]) : [];
    return list;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

// GET /api/RecipeReview/{id}
export const fetchRecipeReviewById = createAsyncThunk<
  RecipeReview,
  number,
  { rejectValue: string }
>("recipeReviews/fetchById", async (id, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(`/api/RecipeReview/${id}`);
    const body = res.data ?? {};
    const payload = (body.data ?? body.Data ?? body) as unknown;
    if (Array.isArray(payload)) return payload[0] as RecipeReview;
    return (payload as RecipeReview) || (res.data as RecipeReview);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

// DELETE /api/RecipeReview/{id}
export const deleteRecipeReview = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("recipeReviews/delete", async (id, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/api/RecipeReview/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

// GET /api/RecipeReview/search?keyword=
export const searchRecipeReviews = createAsyncThunk<
  RecipeReview[],
  string,
  { rejectValue: string }
>("recipeReviews/search", async (keyword, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(`/api/RecipeReview/search?keyword=${encodeURIComponent(keyword)}`);
    const body = res.data ?? {};
    const payload = (body.data ?? body.Data ?? body) as unknown;
    const list = Array.isArray(payload) ? (payload as RecipeReview[]) : [];
    return list;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

const recipeReviewsSlice = createSlice({
  name: "recipeReviews",
  initialState,
  reducers: {
    resetRecipeReviewState: (state) => {
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
      .addCase(createRecipeReview.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createRecipeReview.fulfilled, (state, action: PayloadAction<RecipeReview>) => {
        state.loading = false;
        state.success = true;
        const dto = action.payload;
        if (dto) {
          state.review = dto;
          state.reviews.push(dto);
        }
      })
      .addCase(createRecipeReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Không thể tạo review";
      });

    // FETCH ALL
    builder
      .addCase(fetchRecipeReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecipeReviews.fulfilled, (state, action: PayloadAction<RecipeReview[]>) => {
        state.loading = false;
        state.reviews = action.payload;
      })
      .addCase(fetchRecipeReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Không thể lấy recipe reviews";
      });

    // FETCH BY ID
    builder
      .addCase(fetchRecipeReviewById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecipeReviewById.fulfilled, (state, action: PayloadAction<RecipeReview>) => {
        state.loading = false;
        state.review = action.payload;
      })
      .addCase(fetchRecipeReviewById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Không thể lấy review";
      });

    // DELETE
    builder
      .addCase(deleteRecipeReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteRecipeReview.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.reviews = state.reviews.filter((r) => r.id !== action.payload);
      })
      .addCase(deleteRecipeReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Không thể xóa review";
      });

    // SEARCH
    builder
      .addCase(searchRecipeReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchRecipeReviews.fulfilled, (state, action: PayloadAction<RecipeReview[]>) => {
        state.loading = false;
        state.reviews = action.payload;
      })
      .addCase(searchRecipeReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Không thể tìm kiếm reviews";
      });
  },
});

export const { resetRecipeReviewState } = recipeReviewsSlice.actions;
export default recipeReviewsSlice.reducer;
