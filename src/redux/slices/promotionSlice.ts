import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/lib/axios/axiosInstance";
import { Promotion } from "@/types/promotion";

interface PromotionState {
  promotions: Promotion[];
  loading: boolean;
  error: string | null;
}

const initialState: PromotionState = {
  promotions: [],
  loading: false,
  error: null,
};

export const fetchPromotions = createAsyncThunk(
  "promotion/fetchPromotions",
  async (restaurantId: string, { rejectWithValue }) => {
    try {
      const token = JSON.parse(localStorage.getItem("user") || "{}").token;
      const res = await axiosInstance.get(
        `/api/Promotions/restaurant/${restaurantId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const addPromotion = createAsyncThunk(
  "promotion/addPromotion",
  async (data: Promotion, { rejectWithValue }) => {
    try {
      const token = JSON.parse(localStorage.getItem("user") || "{}").token;
      const res = await axiosInstance.post(`/api/Promotions`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updatePromotion = createAsyncThunk(
  "promotion/updatePromotion",
  async (
    { id, data }: { id: number; data: Promotion },
    { rejectWithValue }
  ) => {
    try {
      const token = JSON.parse(localStorage.getItem("user") || "{}").token;
      const res = await axiosInstance.put(`/api/Promotions/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const deletePromotion = createAsyncThunk(
  "promotion/deletePromotion",
  async (id: number, { rejectWithValue }) => {
    try {
      const token = JSON.parse(localStorage.getItem("user") || "{}").token;
      await axiosInstance.delete(`/api/Promotions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const promotionSlice = createSlice({
  name: "promotion",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPromotions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPromotions.fulfilled, (state, action) => {
        state.loading = false;
        state.promotions = action.payload;
      })
      .addCase(fetchPromotions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addPromotion.fulfilled, (state, action) => {
        state.promotions.push(action.payload);
      })
      .addCase(updatePromotion.fulfilled, (state, action) => {
        state.promotions = state.promotions.map((promo) =>
          promo.id === action.payload.id ? action.payload : promo
        );
      })
      .addCase(deletePromotion.fulfilled, (state, action) => {
        state.promotions = state.promotions.filter(
          (promo) => promo.id !== action.payload
        );
      });
  },
});

export default promotionSlice.reducer;
