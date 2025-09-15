import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
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

// Helper type-safe fetch token
const getToken = () => JSON.parse(localStorage.getItem("user") || "{}")?.token;

// ======================= THUNKS =======================
export const fetchPromotions = createAsyncThunk<
  Promotion[],
  string,
  { rejectValue: string }
>("promotion/fetchPromotions", async (restaurantId, { rejectWithValue }) => {
  try {
    const token = getToken();
    const { data } = await axiosInstance.get(
      `/api/Promotions/restaurant/${restaurantId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data;
  } catch (err: unknown) {
    if (err instanceof Error) return rejectWithValue(err.message);
    return rejectWithValue("Lỗi không xác định");
  }
});

export const addPromotion = createAsyncThunk<
  Promotion,
  Omit<Promotion, "id" | "isActive">, // không cần id & isActive khi tạo
  { rejectValue: string }
>("promotion/addPromotion", async (promo, { rejectWithValue }) => {
  try {
    const token = getToken();
    const { data } = await axiosInstance.post(`/api/Promotions`, promo, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (err: unknown) {
    if (err instanceof Error) return rejectWithValue(err.message);
    return rejectWithValue("Lỗi không xác định");
  }
});

export const updatePromotion = createAsyncThunk<
  Promotion,
  { id: number; data: Partial<Promotion> },
  { rejectValue: string }
>("promotion/updatePromotion", async ({ id, data }, { rejectWithValue }) => {
  try {
    const token = getToken();
    const { data: updated } = await axiosInstance.put(
      `/api/Promotions/${id}`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return updated;
  } catch (err: unknown) {
    if (err instanceof Error) return rejectWithValue(err.message);
    return rejectWithValue("Lỗi không xác định");
  }
});

export const deletePromotion = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("promotion/deletePromotion", async (id, { rejectWithValue }) => {
  try {
    const token = getToken();
    await axiosInstance.delete(`/api/Promotions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return id;
  } catch (err: unknown) {
    if (err instanceof Error) return rejectWithValue(err.message);
    return rejectWithValue("Lỗi không xác định");
  }
});

// ======================= SLICE =======================
const promotionSlice = createSlice({
  name: "promotion",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchPromotions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPromotions.fulfilled,
        (state, action: PayloadAction<Promotion[]>) => {
          state.loading = false;
          state.promotions = action.payload;
        }
      )
      .addCase(fetchPromotions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Thao tác thất bại";
      })
      // Add
      .addCase(
        addPromotion.fulfilled,
        (state, action: PayloadAction<Promotion>) => {
          state.promotions.push(action.payload);
        }
      )
      // Update
      .addCase(
        updatePromotion.fulfilled,
        (state, action: PayloadAction<Promotion>) => {
          state.promotions = state.promotions.map((promo) =>
            promo.id === action.payload.id ? action.payload : promo
          );
        }
      )
      // Delete
      .addCase(
        deletePromotion.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.promotions = state.promotions.filter(
            (promo) => promo.id !== action.payload
          );
        }
      );
  },
});

export default promotionSlice.reducer;
