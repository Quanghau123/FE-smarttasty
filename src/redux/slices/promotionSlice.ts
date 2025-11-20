import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  AnyAction,
} from "@reduxjs/toolkit";
import axiosInstance from "@/lib/axios/axiosInstance";
import { Promotion, DiscountType, TargetType } from "@/types/promotion";
import { getAccessToken } from "@/lib/utils/tokenHelper";

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

const getToken = getAccessToken;

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

// Lấy toàn bộ promotions (GET /api/Promotions/all)
export const fetchAllPromotions = createAsyncThunk<
  Promotion[],
  void,
  { rejectValue: string }
>("promotion/fetchAllPromotions", async (_, { rejectWithValue }) => {
  try {
    const token = getToken();
    const res = await axiosInstance.get(`/api/Promotions/all`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    const body = res.data;
    if (body?.errCode === "success" && Array.isArray(body.data)) {
      return body.data as Promotion[];
    }
    return rejectWithValue(
      body?.errMessage || "Không thể lấy danh sách khuyến mãi"
    );
  } catch (err: unknown) {
    if (err instanceof Error) return rejectWithValue(err.message);
    return rejectWithValue("Lỗi không xác định");
  }
});

// Payload types for create/update (align to BE [FromForm])
type CreatePromotionInput = {
  restaurantId: number;
  title: string;
  description?: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  discountType: DiscountType;
  discountValue: number;
  targetType: TargetType;
  voucherCode?: string;
};

export const addPromotion = createAsyncThunk<
  Promotion,
  { data: CreatePromotionInput; file?: File | null },
  { rejectValue: string }
>("promotion/addPromotion", async ({ data, file }, { rejectWithValue }) => {
  try {
    const form = new FormData();
    form.append("RestaurantId", String(data.restaurantId));
    form.append("Title", data.title);
    form.append("Description", data.description ?? "");
    form.append("StartDate", data.startDate);
    form.append("EndDate", data.endDate);
    form.append("DiscountType", data.discountType);
    form.append("DiscountValue", String(data.discountValue));
    form.append("TargetType", data.targetType);
    if (data.voucherCode) form.append("VoucherCode", data.voucherCode);
    if (file) form.append("file", file);

    const res = await axiosInstance.post("/api/Promotions", form);
    const body = res.data;
    if (body?.errCode === "success") return body.data as Promotion;
    return rejectWithValue(body?.errMessage || "Tạo khuyến mãi thất bại");
  } catch (err: unknown) {
    if (err instanceof Error) return rejectWithValue(err.message);
    return rejectWithValue("Lỗi không xác định");
  }
});

type UpdatePromotionInput = CreatePromotionInput; // same required fields on BE

export const updatePromotion = createAsyncThunk<
  Promotion,
  { id: number; data: UpdatePromotionInput; file?: File | null },
  { rejectValue: string }
>(
  "promotion/updatePromotion",
  async ({ id, data, file }, { rejectWithValue }) => {
    try {
      const form = new FormData();
      // BE expects [FromForm] Promotion, include RestaurantId as well
      form.append("RestaurantId", String(data.restaurantId));
      form.append("Title", data.title);
      form.append("Description", data.description ?? "");
      form.append("StartDate", data.startDate);
      form.append("EndDate", data.endDate);
      form.append("DiscountType", data.discountType);
      form.append("DiscountValue", String(data.discountValue));
      form.append("TargetType", data.targetType);
        if (data.voucherCode) form.append("VoucherCode", data.voucherCode);
      if (file) form.append("file", file);

      const res = await axiosInstance.put(`/api/Promotions/${id}`, form);
      const body = res.data;
      if (body?.errCode === "success") return body.data as Promotion;
      return rejectWithValue(
        body?.errMessage || "Cập nhật khuyến mãi thất bại"
      );
    } catch (err: unknown) {
      if (err instanceof Error) return rejectWithValue(err.message);
      return rejectWithValue("Lỗi không xác định");
    }
  }
);

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
        fetchAllPromotions.fulfilled,
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
