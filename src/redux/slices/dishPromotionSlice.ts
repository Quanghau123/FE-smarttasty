import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  AnyAction,
} from "@reduxjs/toolkit";
import axiosInstance from "@/lib/axios/axiosInstance";
import { DishPromotion } from "@/types/dishpromotion";
import { getAccessToken } from "@/lib/utils/tokenHelper";

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

const getToken = getAccessToken;

const parseResponse = <T>(res: unknown): T => {
  if (typeof res === "object" && res !== null && "errCode" in res) {
    const r = res as { data?: T };
    return (r.data ?? null) as T;
  }
  return res as T;
};

export const fetchDishPromotions = createAsyncThunk<
  DishPromotion[],
  void,
  { rejectValue: string }
>("dishPromotion/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const token = getToken();
    const res = await axiosInstance.get("/api/DishPromotions", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return parseResponse<DishPromotion[]>(res.data);
  } catch (err: unknown) {
    if (err instanceof Error) return rejectWithValue(err.message);
    return rejectWithValue("Không thể tải danh sách khuyến mãi món ăn");
  }
});

export const fetchDishPromotionsByRestaurant = createAsyncThunk<
  DishPromotion[],
  number,
  { rejectValue: string }
>("dishPromotion/fetchByRestaurant", async (restaurantId, { rejectWithValue }) => {
  try {
    const token = getToken();
    const res = await axiosInstance.get(`/api/DishPromotions/restaurant/${restaurantId}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );
    return parseResponse<DishPromotion[]>(res.data);
  } catch (err: unknown) {
    if (err instanceof Error) return rejectWithValue(err.message);
    return rejectWithValue("Không thể tải danh sách món khuyến mãi của nhà hàng");
  }
});
export const fetchDishPromotionById = createAsyncThunk<
  DishPromotion,
  number,
  { rejectValue: string }
>("dishPromotion/fetchById", async (id, { rejectWithValue }) => {
  try {
    const token = getToken();
    const res = await axiosInstance.get(`/api/DishPromotions/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return parseResponse<DishPromotion>(res.data);
  } catch (err: unknown) {
    if (err instanceof Error) return rejectWithValue(err.message);
    return rejectWithValue("Không thể tải thông tin khuyến mãi");
  }
});

export const createDishPromotion = createAsyncThunk<
  DishPromotion,
  { dishId: number; promotionId: number },
  { rejectValue: string }
>("dishPromotion/create", async (payload, { rejectWithValue }) => {
  try {
    const token = getToken();
    const res = await axiosInstance.post("/api/DishPromotions/apply", payload, {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        : { "Content-Type": "application/json" },
    });
    return parseResponse<DishPromotion>(res.data);
  } catch (err: unknown) {
    if (err instanceof Error) return rejectWithValue(err.message);
    return rejectWithValue("Không thể tạo khuyến mãi món ăn");
  }
});

export const updateDishPromotion = createAsyncThunk<
  DishPromotion,
  DishPromotion,
  { rejectValue: string }
>("dishPromotion/update", async (payload, { rejectWithValue }) => {
  try {
    const token = getToken();
    const res = await axiosInstance.put(
      `/api/DishPromotions/${payload.id}`,
      payload,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            }
          : { "Content-Type": "application/json" },
      }
    );
    return parseResponse<DishPromotion>(res.data);
  } catch (err: unknown) {
    if (err instanceof Error) return rejectWithValue(err.message);
    return rejectWithValue("Không thể cập nhật khuyến mãi món ăn");
  }
});

export const deleteDishPromotion = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("dishPromotion/delete", async (id, { rejectWithValue }) => {
  try {
    const token = getToken();
    await axiosInstance.delete(`/api/DishPromotions/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return id;
  } catch (err: unknown) {
    if (err instanceof Error) return rejectWithValue(err.message);
    return rejectWithValue("Không thể xóa khuyến mãi món ăn");
  }
});

const dishPromotionSlice = createSlice({
  name: "dishPromotion",
  initialState,
  reducers: {
    setItems: (state, action: PayloadAction<DishPromotion[]>) => {
      state.items = action.payload;
    },
    clearItems: (state) => {
      state.items = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchDishPromotions.fulfilled, (state, action) => {
      state.items = action.payload;
    });

    builder.addCase(createDishPromotion.fulfilled, (state, action) => {
      state.items.push(action.payload);
    });

    builder.addCase(updateDishPromotion.fulfilled, (state, action) => {
      const idx = state.items.findIndex((it) => it.id === action.payload.id);
      if (idx !== -1) state.items[idx] = action.payload;
    });

    builder.addCase(deleteDishPromotion.fulfilled, (state, action) => {
      state.items = state.items.filter((it) => it.id !== action.payload);
    });

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

export const { setItems, clearItems } = dishPromotionSlice.actions;
export default dishPromotionSlice.reducer;
