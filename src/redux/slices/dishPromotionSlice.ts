import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  AnyAction,
} from "@reduxjs/toolkit";
import axiosInstance from "@/lib/axios/axiosInstance";
import { DishPromotion } from "@/types/dishpromotion";

// ======================= CRUD API =======================

// Create
export const createDishPromotion = createAsyncThunk<
  DishPromotion,
  Omit<DishPromotion, "dish" | "promotion">
>("dishPromotion/create", async (data) => {
  const { data: created } = await axiosInstance.post(
    "/api/DishPromotion",
    data
  );
  return created;
});

// Read by DishId
export const fetchDishPromotionsByDishId = createAsyncThunk<
  DishPromotion[],
  number
>("dishPromotion/fetchByDishId", async (dishId) => {
  const { data } = await axiosInstance.get(`/api/DishPromotion/${dishId}`);
  return data;
});

// Read by PromotionId
export const fetchDishPromotionsByPromotionId = createAsyncThunk<
  DishPromotion[],
  number
>("dishPromotion/fetchByPromotionId", async (promotionId) => {
  const { data } = await axiosInstance.get(
    `/api/DishPromotion/promotion/${promotionId}`
  );
  return data;
});

// Update
export const updateDishPromotion = createAsyncThunk<
  DishPromotion,
  Omit<DishPromotion, "dish" | "promotion">
>("dishPromotion/update", async (data) => {
  const { data: updated } = await axiosInstance.put("/api/DishPromotion", data);
  return updated;
});

// Delete
export const deleteDishPromotion = createAsyncThunk<
  { dishId: number; promotionId: number },
  { dishId: number; promotionId: number }
>("dishPromotion/delete", async (data) => {
  await axiosInstance.delete("/api/DishPromotion", { data });
  return data; // trả lại để xoá trong store
});

// ======================= SLICE =======================
interface DishPromotionState {
  items: DishPromotion[];
  loading: boolean;
  error: string | null;
}

const initialState: DishPromotionState = {
  items: [],
  loading: false,
  error: null,
};

const dishPromotionSlice = createSlice({
  name: "dishPromotion",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Create
    builder.addCase(
      createDishPromotion.fulfilled,
      (state, action: PayloadAction<DishPromotion>) => {
        state.items.push(action.payload);
      }
    );

    // Fetch by DishId
    builder.addCase(
      fetchDishPromotionsByDishId.fulfilled,
      (state, action: PayloadAction<DishPromotion[]>) => {
        state.items = action.payload;
      }
    );

    // Fetch by PromotionId
    builder.addCase(
      fetchDishPromotionsByPromotionId.fulfilled,
      (state, action: PayloadAction<DishPromotion[]>) => {
        state.items = action.payload;
      }
    );

    // Update
    builder.addCase(
      updateDishPromotion.fulfilled,
      (state, action: PayloadAction<DishPromotion>) => {
        const index = state.items.findIndex(
          (dp) =>
            dp.dishId === action.payload.dishId &&
            dp.promotionId === action.payload.promotionId
        );
        if (index !== -1) state.items[index] = action.payload;
      }
    );

    // Delete
    builder.addCase(
      deleteDishPromotion.fulfilled,
      (
        state,
        action: PayloadAction<{ dishId: number; promotionId: number }>
      ) => {
        state.items = state.items.filter(
          (dp) =>
            !(
              dp.dishId === action.payload.dishId &&
              dp.promotionId === action.payload.promotionId
            )
        );
      }
    );

    // Loading + Error
    builder.addMatcher(
      (action) => action.type.endsWith("/pending"),
      (state) => {
        state.loading = true;
        state.error = null;
      }
    );
    builder.addMatcher(
      (action) => action.type.endsWith("/fulfilled"),
      (state) => {
        state.loading = false;
      }
    );
    builder.addMatcher(
      (action) => action.type.endsWith("/rejected"),
      (state, action: AnyAction) => {
        state.loading = false;
        state.error = action.error?.message || "Thao tác thất bại";
      }
    );
  },
});

export default dishPromotionSlice.reducer;
