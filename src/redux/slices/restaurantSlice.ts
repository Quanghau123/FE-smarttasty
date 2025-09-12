// src/redux/slices/restaurantSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "@/lib/axios/axiosInstance";
import {
  Restaurant,
  RestaurantForm,
  RestaurantState,
} from "@/types/restaurant";

//INITIAL STATE 
const initialState: RestaurantState = {
  restaurants: [],
  current: null,
  nearby: [],
  loading: false,
  loadingNearby: false,
  error: null,
   
};

//ASYNC THUNKS

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
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Lỗi không xác định");
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
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.errMessage || "Không tìm được nhà hàng theo danh mục"
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
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Lỗi không xác định");
  }
});

// Fetch all
export const fetchRestaurants = createAsyncThunk<
  Restaurant[],
  void,
  { rejectValue: string }
>("restaurant/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get("/api/Restaurant");
    return res.data?.data?.items ?? [];
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Lỗi không xác định");
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
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.errMessage || "Không lấy được nhà hàng gần bạn"
    );
  }
});

// Fetch by id
export const fetchRestaurantById = createAsyncThunk<
  Restaurant | null,
  number,
  { rejectValue: string }
>("restaurant/fetchById", async (id, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get(`/api/Restaurant/${id}`);
    return response.data?.data ?? null;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Không tìm thấy nhà hàng"
    );
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
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.errMessage || "Cập nhật thất bại");
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
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Lỗi không xác định");
  }
});

/* -------------------- SLICE -------------------- */
const restaurantSlice = createSlice({
  name: "restaurant",
  initialState,
  reducers: {
    clearCurrentRestaurant(state) {
      state.current = null;
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

      // fetchAll
      .addCase(fetchRestaurants.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRestaurants.fulfilled, (state, action) => {
        state.loading = false;
        state.restaurants = action.payload;
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
        state.current = action.payload;
      })
      .addCase(fetchRestaurantById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi không xác định";
        state.current = null;
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
        if (state.current?.id === action.payload) state.current = null;
      })
      .addCase(deleteRestaurant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi không xác định";
      });
  },
});

export const { clearCurrentRestaurant } = restaurantSlice.actions;
export default restaurantSlice.reducer;
