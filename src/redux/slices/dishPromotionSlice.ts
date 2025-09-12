import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "@/lib/axios/axiosInstance";
import { DishPromotion } from "@/types/dishpromotion";

// ======================= CRUD API =======================

// Create
export const createDishPromotion = createAsyncThunk(
  "dishPromotion/create",
  async (data: Omit<DishPromotion, "dish" | "promotion">) => {
    const response = await axiosInstance.post("/api/DishPromotion", data);
    return response.data as DishPromotion;
  }
);

// Read by DishId
export const fetchDishPromotionsByDishId = createAsyncThunk(
  "dishPromotion/fetchByDishId",
  async (dishId: number) => {
    const response = await axiosInstance.get(`/api/DishPromotion/${dishId}`);
    return response.data as DishPromotion[];
  }
);

// Read by PromotionId
export const fetchDishPromotionsByPromotionId = createAsyncThunk(
  "dishPromotion/fetchByPromotionId",
  async (promotionId: number) => {
    const response = await axiosInstance.get(
      `/api/DishPromotion/promotion/${promotionId}`
    );
    return response.data as DishPromotion[];
  }
);

// Update
export const updateDishPromotion = createAsyncThunk(
  "dishPromotion/update",
  async (data: Omit<DishPromotion, "dish" | "promotion">) => {
    const response = await axiosInstance.put("/api/DishPromotion", data);
    return response.data as DishPromotion;
  }
);

// Delete
export const deleteDishPromotion = createAsyncThunk(
  "dishPromotion/delete",
  async (data: { dishId: number; promotionId: number }) => {
    const response = await axiosInstance.delete("/api/DishPromotion", {
      data,
    });
    return data; // trả lại id để xoá trong store
  }
);

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
    builder.addCase(createDishPromotion.fulfilled, (state, action) => {
      state.items.push(action.payload);
    });

    // Fetch by DishId
    builder.addCase(fetchDishPromotionsByDishId.fulfilled, (state, action) => {
      state.items = action.payload;
    });

    // Fetch by PromotionId
    builder.addCase(fetchDishPromotionsByPromotionId.fulfilled, (state, action) => {
      state.items = action.payload;
    });

    // Update
    builder.addCase(updateDishPromotion.fulfilled, (state, action) => {
      const index = state.items.findIndex(
        (dp) =>
          dp.dishId === action.payload.dishId &&
          dp.promotionId === action.payload.promotionId
      );
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    });

    // Delete
    builder.addCase(deleteDishPromotion.fulfilled, (state, action) => {
      state.items = state.items.filter(
        (dp) =>
          !(
            dp.dishId === action.payload.dishId &&
            dp.promotionId === action.payload.promotionId
          )
      );
    });

    // Loading + Error states
    builder.addMatcher((action) => action.type.endsWith("/pending"), (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addMatcher(
      (action) => action.type.endsWith("/fulfilled"),
      (state) => {
        state.loading = false;
      }
    );
    builder.addMatcher((action) => action.type.endsWith("/rejected"), (state, action: any) => {
      state.loading = false;
      state.error = action.error.message;
    });
  },
});

export default dishPromotionSlice.reducer;
