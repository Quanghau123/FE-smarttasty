// src/redux/slices/restaurantSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import axiosInstance from "@/lib/axios/axiosInstance";
import {
  Restaurant,
  RestaurantForm,
  RestaurantState,
} from "@/types/restaurant";

// INITIAL STATE
const initialState: RestaurantState = {
  restaurants: [],
  current: null,
  currentTotalReviews: null,
  nearby: [],
  suggestions: [],
  loadingSuggestions: false,
  loading: false,
  loadingNearby: false,
  error: null,
};

// Helper: Lấy message từ error
const getErrorMessage = (err: unknown, fallback = "Lỗi không xác định"): string => {
  if (axios.isAxiosError(err)) {
    const responseData = err.response?.data as { message?: string; errMessage?: string } | undefined;
    return responseData?.message ?? responseData?.errMessage ?? fallback;
  }
  return fallback;
};

// ================== ASYNC THUNKS ==================

// Fetch by owner
export const fetchRestaurantByOwner = createAsyncThunk<
  Restaurant | null,
  { token: string },
  { rejectValue: string }
>("restaurant/fetchByOwner", async ({ token }, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get("/api/Restaurant/owner", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const apiData = response.data?.data;
    return Array.isArray(apiData) && apiData.length > 0 ? apiData[0] : null;
  } catch (err: unknown) {
    return rejectWithValue(getErrorMessage(err));
  }
});

// Fetch by category      
export const fetchRestaurantsByCategory = createAsyncThunk<
  Restaurant[],
  string,
  { rejectValue: string }
>("restaurant/fetchByCategory", async (category, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(`/api/Restaurant/category/${category}`);
    return res.data?.data ?? [];
  } catch (err: unknown) {
    return rejectWithValue(
      getErrorMessage(err, "Không tìm được nhà hàng theo danh mục")
    );
  }
});

// Create
export const createRestaurant = createAsyncThunk<
  Restaurant | null,
  { token: string; data: RestaurantForm },
  { rejectValue: string }
>("restaurant/create", async ({ token, data }, { rejectWithValue }) => {
  try {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("category", data.category);
    formData.append("address", data.address);
    formData.append("latitude", data.latitude.toString());
    formData.append("longitude", data.longitude.toString());
    formData.append("description", data.description);
    formData.append("openTime", data.openTime);
    formData.append("closeTime", data.closeTime);
    if (data.file) formData.append("ImageFile", data.file);

    const res = await axiosInstance.post("/api/Restaurant", formData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return res.data?.data ?? null;
  } catch (err: unknown) {
    return rejectWithValue(getErrorMessage(err));
  }
});

// Fetch all
export type FetchRestaurantsResult = {
  items: Restaurant[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
};

export const fetchRestaurants = createAsyncThunk<
  FetchRestaurantsResult,
  { pageNumber?: number; pageSize?: number } | undefined,
  { rejectValue: string }
>("restaurant/fetchAll", async (params, { rejectWithValue }) => {
  try {
    const pageNumber = params?.pageNumber ?? 1;
    const pageSize = params?.pageSize ?? 12;
    const res = await axiosInstance.get("/api/Restaurant", {
      params: { PageNumber: pageNumber, PageSize: pageSize },
    });

    const data = res.data?.data;
    return {
      items: data?.items ?? [],
      totalRecords: data?.totalRecords ?? 0,
      pageNumber: data?.pageNumber ?? pageNumber,
      pageSize: data?.pageSize ?? pageSize,
    } as FetchRestaurantsResult;
  } catch (err: unknown) {
    return rejectWithValue(getErrorMessage(err));
  }
});

// Fetch nearby
export const fetchNearbyRestaurants = createAsyncThunk<
  Restaurant[],
  { lat: number; lng: number },
  { rejectValue: string }
>("restaurant/fetchNearby", async ({ lat, lng }, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(
      `/api/Restaurant/nearby?lat=${lat}&lng=${lng}`
    );
    return res.data?.data ?? [];
  } catch (err: unknown) {
    return rejectWithValue(
      getErrorMessage(err, "Không lấy được nhà hàng gần bạn")
    );
  }
});

// Search restaurants (full search)
export const searchRestaurants = createAsyncThunk<
  Restaurant[],
  string,
  { rejectValue: string }
>("restaurant/search", async (q, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(`/api/Restaurant/search?q=${encodeURIComponent(q)}`);
    // BE may return data envelope or plain array
    return res.data?.data ?? res.data ?? [];
  } catch (err: unknown) {
    return rejectWithValue(getErrorMessage(err, "Tìm kiếm thất bại"));
  }
});

// Search suggestions (autocomplete)
export const fetchRestaurantSearchSuggestions = createAsyncThunk<
  string[],
  string,
  { rejectValue: string }
>("restaurant/searchSuggestions", async (q, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(`/api/Restaurant/search/suggestions?q=${encodeURIComponent(q)}`);
    return res.data?.data ?? res.data ?? [];
  } catch (err: unknown) {
    return rejectWithValue(getErrorMessage(err, "Lấy gợi ý tìm kiếm thất bại"));
  }
});

// Fetch by id
export const fetchRestaurantById = createAsyncThunk<
  { restaurant: Restaurant | null; totalReviews?: number },
  number,
  { rejectValue: string }
>("restaurant/fetchById", async (id, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get(`/api/Restaurant/${id}`);
    const data = response.data?.data as
      | { restaurant?: Restaurant; totalReviews?: number; [k: string]: unknown }
      | Restaurant
      | null
      | undefined;
    // BE mới: data = { restaurant: {...}, totalReviews }
    // Cũ: data = Restaurant
    if (data && typeof data === "object" && "restaurant" in data) {
      const obj = data as { restaurant?: Restaurant; totalReviews?: number };
      return { restaurant: obj.restaurant ?? null, totalReviews: obj.totalReviews };
    }
    return { restaurant: (data as Restaurant | null | undefined) ?? null };
  } catch (err: unknown) {
    return rejectWithValue(getErrorMessage(err, "Không tìm thấy nhà hàng"));
  }
});

// Update
export const updateRestaurant = createAsyncThunk<
  Restaurant | null,
  { token: string; id: number; data: RestaurantForm },
  { rejectValue: string }
>("restaurant/update", async ({ token, id, data }, { rejectWithValue }) => {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());
    formData.append("name", data.name);
    formData.append("category", data.category);
    formData.append("address", data.address);
    formData.append("latitude", data.latitude.toString());
    formData.append("longitude", data.longitude.toString());
    formData.append("description", data.description);
    formData.append("openTime", data.openTime);
    formData.append("closeTime", data.closeTime);
    formData.append("isHidden", "false");
    if (data.file instanceof File) formData.append("ImageFile", data.file);

    const response = await axiosInstance.put(`/api/Restaurant`, formData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data?.data ?? null;
  } catch (err: unknown) {
    return rejectWithValue(getErrorMessage(err, "Cập nhật thất bại"));
  }
});

// Delete
export const deleteRestaurant = createAsyncThunk<
  number,
  { token: string; id: number },
  { rejectValue: string }
>("restaurant/delete", async ({ token, id }, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/api/Restaurant/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return id;
  } catch (err: unknown) {
    return rejectWithValue(getErrorMessage(err));
  }
});

// ================== SLICE ==================
const restaurantSlice = createSlice({
  name: "restaurant",
  initialState,
  reducers: {
    clearCurrentRestaurant(state) {
      state.current = null;
      state.currentTotalReviews = null;
    },
  applyRealtimeRating(
  state,
  action: PayloadAction<{ restaurantId: number; averageRating: number; totalReviews: number }>
) {
  const { restaurantId, averageRating, totalReviews } = action.payload;

  // Cập nhật restaurant đang xem
  if (state.current && state.current.id === restaurantId) {
    state.current.averageRating = averageRating;
    state.currentTotalReviews = totalReviews;
  }

  // Cập nhật trong danh sách (nếu có)
  const found = state.restaurants.find(r => r.id === restaurantId);
  if (found) {
    found.averageRating = averageRating;
    // BE có thể không trả totalReviews trong object => cập nhật nếu có
    found.totalReviews = totalReviews;
  }
},
  },
  extraReducers: (builder) => {
    builder
      // fetchByOwner
      .addCase(fetchRestaurantByOwner.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRestaurantByOwner.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchRestaurantByOwner.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi không xác định";
        state.current = null;
      })

      // create
      .addCase(createRestaurant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRestaurant.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.restaurants.push(action.payload);
          state.current = action.payload;
        }
      })
      .addCase(createRestaurant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi không xác định";
      })

      // fetchAll (server-side paged)
      .addCase(fetchRestaurants.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRestaurants.fulfilled, (state, action) => {
        state.loading = false;
        state.restaurants = action.payload.items ?? [];
        state.totalRecords = action.payload.totalRecords ?? 0;
        state.pageNumber = action.payload.pageNumber ?? 1;
        state.pageSize = action.payload.pageSize ?? 12;
      })
      .addCase(fetchRestaurants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi không xác định";
      })

      // nearby
      .addCase(fetchNearbyRestaurants.pending, (state) => {
        state.loadingNearby = true;
        state.error = null;
      })
      .addCase(fetchNearbyRestaurants.fulfilled, (state, action) => {
        state.loadingNearby = false;
        state.nearby = action.payload;
      })
      .addCase(fetchNearbyRestaurants.rejected, (state, action) => {
        state.loadingNearby = false;
        state.error = action.payload || "Không lấy được nhà hàng gần bạn";
      })

      // search
      .addCase(searchRestaurants.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchRestaurants.fulfilled, (state, action) => {
        state.loading = false;
        // populate restaurants with search results (UI expects restaurants list)
        state.restaurants = action.payload;
      })
      .addCase(searchRestaurants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi tìm kiếm";
      })

      // search suggestions
      .addCase(fetchRestaurantSearchSuggestions.pending, (state) => {
        state.loadingSuggestions = true;
        state.error = null;
      })
      .addCase(fetchRestaurantSearchSuggestions.fulfilled, (state, action) => {
        state.loadingSuggestions = false;
        state.suggestions = action.payload;
      })
      .addCase(fetchRestaurantSearchSuggestions.rejected, (state, action) => {
        state.loadingSuggestions = false;
        state.error = action.payload || "Lấy gợi ý thất bại";
      })

      // fetchByCategory
      .addCase(fetchRestaurantsByCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRestaurantsByCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.restaurants = action.payload;
      })
      .addCase(fetchRestaurantsByCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Không tìm được nhà hàng theo danh mục";
      })

      // fetchById
      .addCase(fetchRestaurantById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRestaurantById.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload.restaurant;
        state.currentTotalReviews = action.payload.totalReviews ?? null;
      })
      .addCase(fetchRestaurantById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi không xác định";
        state.current = null;
        state.currentTotalReviews = null;
      })

      // update
      .addCase(updateRestaurant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRestaurant.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.current = action.payload;
          const index = state.restaurants.findIndex(
            (r) => r.id === action.payload!.id
          );
          if (index !== -1) state.restaurants[index] = action.payload;
        }
      })
      .addCase(updateRestaurant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi không xác định";
      })

      // delete
      .addCase(deleteRestaurant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteRestaurant.fulfilled, (state, action) => {
        state.loading = false;
        state.restaurants = state.restaurants.filter(
          (r) => r.id !== action.payload
        );
        if (state.current?.id === action.payload) {
          state.current = null;
          state.currentTotalReviews = null;
        }
      })
      .addCase(deleteRestaurant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi không xác định";
      });
  },
});

export const { clearCurrentRestaurant, applyRealtimeRating } = restaurantSlice.actions;
export default restaurantSlice.reducer;
