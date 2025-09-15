import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import axiosInstance from "@/lib/axios/axiosInstance";
import { Dish } from "@/types/dish";

const CLOUDINARY_PREFIX = "https://res.cloudinary.com/djcur1ymq/image/upload/";

const normalizeDish = (dish: Dish): Dish => ({
  ...dish,
  imageUrl:
    dish.imageUrl || (dish.image ? `${CLOUDINARY_PREFIX}${dish.image}` : ""),
});

interface DishState {
  items: Dish[];
  loading: boolean;
  error: string | null;
}

const initialState: DishState = {
  items: [],
  loading: false,
  error: null,
};

// Helper lấy message từ error
const getErrorMessage = (err: unknown, fallback = "Lỗi không xác định"): string => {
  if (axios.isAxiosError(err)) {
    const responseData = err.response?.data as { message?: string; errMessage?: string } | undefined;
    return responseData?.message ?? responseData?.errMessage ?? fallback;
  }
  return fallback;
};

// ================== ASYNC ACTIONS ==================

export const fetchDishes = createAsyncThunk<
  Dish[],
  number,
  { rejectValue: string }
>("dishes/fetch", async (restaurantId, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(`/api/Dishes/restaurant/${restaurantId}`);
    return (res.data?.data || []).map(normalizeDish);
  } catch (err: unknown) {
    return rejectWithValue(getErrorMessage(err, "Lỗi khi tải danh sách món ăn"));
  }
});

export const addDish = createAsyncThunk<
  Dish,
  FormData,
  { rejectValue: string }
>("dishes/add", async (data, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post(`/api/Dishes`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return normalizeDish(res.data?.data || res.data);
  } catch (err: unknown) {
    return rejectWithValue(getErrorMessage(err, "Lỗi khi thêm món ăn"));
  }
});

export const updateDish = createAsyncThunk<
  Dish,
  { id: number; data: FormData },
  { rejectValue: string }
>("dishes/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.put(`/api/Dishes/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return normalizeDish(res.data?.data || res.data);
  } catch (err: unknown) {
    return rejectWithValue(getErrorMessage(err, "Lỗi khi cập nhật món ăn"));
  }
});

export const deleteDish = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("dishes/delete", async (id, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/api/Dishes/${id}`);
    return id;
  } catch (err: unknown) {
    return rejectWithValue(getErrorMessage(err, "Lỗi khi xóa món ăn"));
  }
});

// ================== SLICE ==================

const dishSlice = createSlice({
  name: "dishes",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // FETCH
      .addCase(fetchDishes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDishes.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(fetchDishes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Lỗi tải món ăn";
      })
      // ADD
      .addCase(addDish.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(addDish.rejected, (state, action) => {
        state.error = action.payload ?? "Lỗi thêm món ăn";
      })
      // UPDATE
      .addCase(updateDish.fulfilled, (state, action) => {
        const idx = state.items.findIndex((d) => d.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(updateDish.rejected, (state, action) => {
        state.error = action.payload ?? "Lỗi cập nhật món ăn";
      })
      // DELETE
      .addCase(deleteDish.fulfilled, (state, action) => {
        state.items = state.items.filter((d) => d.id !== action.payload);
      })
      .addCase(deleteDish.rejected, (state, action) => {
        state.error = action.payload ?? "Lỗi xóa món ăn";
      });
  },
});

export default dishSlice.reducer;
