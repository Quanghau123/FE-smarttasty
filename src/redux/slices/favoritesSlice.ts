
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import axiosInstance from "@/lib/axios/axiosInstance";
import { Favorite, CreateFavoriteRequest } from "@/types/favorite";

interface FavoritesState {
  favorites: Favorite[];
  loading: boolean;
  error: string | null;
}

const initialState: FavoritesState = {
  favorites: [],
  loading: false,
  error: null,
};

const getErrorMessage = (err: unknown, fallback = "Lỗi") => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string; errMessage?: string } | undefined;
    return data?.message ?? data?.errMessage ?? fallback;
  }
  return fallback;
};

export const addFavorite = createAsyncThunk<Favorite, CreateFavoriteRequest, { rejectValue: string }>(
  "favorites/add",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/Favorite", payload);
      return res.data?.data ?? res.data;
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, "Không thể thêm yêu thích"));
    }
  }
);

export const removeFavorite = createAsyncThunk<number, number, { rejectValue: string }>(
  "favorites/remove",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/api/Favorite/${id}`);
      return id;
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, "Không thể xoá yêu thích"));
    }
  }
);

export const fetchFavoritesByRestaurant = createAsyncThunk<
  Favorite[],
  number,
  { rejectValue: string }
>(
  "favorites/fetchByRestaurant",
  async (restaurantId, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/api/Favorite/restaurant/${restaurantId}`);
      return res.data?.data ?? res.data;
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, "Không thể tải danh sách yêu thích"));
    }
  }
);

const favoritesSlice = createSlice({
  name: "favorites",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(addFavorite.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addFavorite.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) state.favorites.push(action.payload);
      })
      .addCase(addFavorite.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi";
      })

      .addCase(removeFavorite.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFavorite.fulfilled, (state, action) => {
        state.loading = false;
        state.favorites = state.favorites.filter((f) => f.id !== action.payload);
      })
      .addCase(removeFavorite.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi";
      });

    builder
      .addCase(fetchFavoritesByRestaurant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFavoritesByRestaurant.fulfilled, (state, action) => {
        state.loading = false;
        state.favorites = action.payload ?? [];
      })
      .addCase(fetchFavoritesByRestaurant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi";
      });
  },
});

export default favoritesSlice.reducer;
