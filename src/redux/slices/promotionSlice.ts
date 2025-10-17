import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  AnyAction,
} from "@reduxjs/toolkit";
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

const getToken = (): string | null => localStorage.getItem("token");

export const fetchPromotions = createAsyncThunk<
  Promotion[],
  number | string,
  { rejectValue: string }
>("promotion/fetchPromotions", async (restaurantId, { rejectWithValue }) => {
  try {
    const token = getToken();
    const res = await axiosInstance.get(
      `/api/Promotions/restaurant/${restaurantId}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );

    const body = res.data;
    if (body?.errCode === "success" && Array.isArray(body.data))
      return body.data as Promotion[];
    return rejectWithValue(
      body?.errMessage || "Không thể lấy danh sách khuyến mãi"
    );
  } catch (err: unknown) {
    if (err instanceof Error) return rejectWithValue(err.message);
    return rejectWithValue("Lỗi không xác định");
  }
});

export const addPromotion = createAsyncThunk<
  Promotion,
  Omit<Promotion, "id" | "isActive">,
  { rejectValue: string }
>("promotion/addPromotion", async (payload, { rejectWithValue }) => {
  try {
    const token = getToken();
    const res = await axiosInstance.post("/api/Promotions", payload, {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        : { "Content-Type": "application/json" },
    });

    const body = res.data;
    if (body?.errCode === "success") return body.data as Promotion;
    return rejectWithValue(body?.errMessage || "Tạo khuyến mãi thất bại");
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
    const res = await axiosInstance.put(`/api/Promotions/${id}`, data, {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        : { "Content-Type": "application/json" },
    });

    const body = res.data;
    if (body?.errCode === "success") return body.data as Promotion;
    return rejectWithValue(body?.errMessage || "Cập nhật khuyến mãi thất bại");
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
    const res = await axiosInstance.delete(`/api/Promotions/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    const body = res.data;
    if (body?.errCode === "success" || res.status === 200) return id;
    return rejectWithValue(body?.errMessage || "Xóa khuyến mãi thất bại");
  } catch (err: unknown) {
    if (err instanceof Error) return rejectWithValue(err.message);
    return rejectWithValue("Lỗi không xác định");
  }
});

const promotionSlice = createSlice({
  name: "promotion",
  initialState,
  reducers: {
    setPromotions: (state, action: PayloadAction<Promotion[]>) => {
      state.promotions = action.payload;
    },
    clearPromotions: (state) => {
      state.promotions = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(
        fetchPromotions.fulfilled,
        (state, action: PayloadAction<Promotion[]>) => {
          state.promotions = action.payload;
        }
      )
      .addCase(
        addPromotion.fulfilled,
        (state, action: PayloadAction<Promotion>) => {
          state.promotions.push(action.payload);
        }
      )
      .addCase(
        updatePromotion.fulfilled,
        (state, action: PayloadAction<Promotion>) => {
          state.promotions = state.promotions.map((p) =>
            p.id === action.payload.id ? action.payload : p
          );
        }
      )
      .addCase(
        deletePromotion.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.promotions = state.promotions.filter(
            (p) => p.id !== action.payload
          );
        }
      );

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
        state.error =
          action.payload ?? action.error?.message ?? "Thao tác thất bại";
      }
    );
  },
});

export const { setPromotions, clearPromotions } = promotionSlice.actions;
export default promotionSlice.reducer;
