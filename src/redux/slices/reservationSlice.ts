
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "@/lib/axios/axiosInstance";
import axios, { AxiosError } from "axios";
import {
  ReservationRequest,
  ReservationEntity,
  UpdateReservationStatusParams,
  UpdateReservationStatusResponse,
  RestaurantReservationRow,
} from "@/types/reservation";

interface ReservationState {
  reservation: ReservationEntity | null;
  reservations: RestaurantReservationRow[];
  loading: boolean;
  error: string | null;
}

const initialState: ReservationState = {
  reservation: null,
  reservations: [],
  loading: false,
  error: null,
};

interface ApiResponse<T> {
  errCode: string;
  errMessage: string;
  data: T;
  timestamp: string;
  status: string;
}

const handleAxiosError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ errMessage?: string }>;
    return axiosError.response?.data?.errMessage || "Unexpected API error";
  }
  return "Unexpected error";
};

export const createReservation = createAsyncThunk<
  ReservationEntity,
  ReservationRequest,
  { rejectValue: string }
>("reservation/createReservation", async (data, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post<ApiResponse<ReservationEntity>>(
      "/api/Reservation",
      data
    );
    return response.data.data;
  } catch (error: unknown) {
    return rejectWithValue(handleAxiosError(error));
  }
});

export const updateReservationStatus = createAsyncThunk<
  UpdateReservationStatusResponse,
  { id: number; data: UpdateReservationStatusParams },
  { rejectValue: string }
>(
  "reservation/updateReservationStatus",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put<
        ApiResponse<UpdateReservationStatusResponse>
      >(`/api/Reservation/${id}/status`, null, {
        params: {
          status: data.status,
          changedBy: data.changedBy,
          note: data.note,
        },
      });
      return response.data.data;
    } catch (error: unknown) {
      return rejectWithValue(handleAxiosError(error));
    }
  }
);

export const fetchReservationsByRestaurant = createAsyncThunk<
  RestaurantReservationRow[],
  number,
  { rejectValue: string }
>("reservation/fetchByRestaurant", async (restaurantId, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get<ApiResponse<RestaurantReservationRow[]>>(
      `/api/Reservation/restaurant/${restaurantId}`
    );
    return response.data.data as RestaurantReservationRow[];
  } catch (error: unknown) {
    return rejectWithValue(handleAxiosError(error));
  }
});

export const fetchReservationsByUser = createAsyncThunk<
  ReservationEntity[],
  number,
  { rejectValue: string }
>("reservation/fetchByUser", async (userId, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get<ApiResponse<ReservationEntity[]>>(
      `/api/Reservation/user/${userId}`
    );
    return response.data.data as ReservationEntity[];
  } catch (error: unknown) {
    return rejectWithValue(handleAxiosError(error));
  }
});

export const deleteReservation = createAsyncThunk<
  { id: number; status: ReservationEntity['status'] },
  { reservationId: number; userId: number },
  { rejectValue: string }
>("reservation/deleteReservation", async ({ reservationId, userId }, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.delete<ApiResponse<{ id: number; status: ReservationEntity['status'] }>>(
      `/api/Reservation/${reservationId}`,
      { params: { userId } }
    );
    return response.data.data;
  } catch (error: unknown) {
    return rejectWithValue(handleAxiosError(error));
  }
});

export const deleteReservationForBusiness = createAsyncThunk<
  { id: number; status: ReservationEntity['status'] },
  { reservationId: number; userId: number },
  { rejectValue: string }
>("reservation/deleteReservationForBusiness", async ({ reservationId, userId }, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.delete<ApiResponse<{ id: number; status: ReservationEntity['status'] }>>(
      `/api/Reservation/business/${reservationId}`,
      { params: { userId } }
    );
    return response.data.data;
  } catch (error: unknown) {
    return rejectWithValue(handleAxiosError(error));
  }
});

const reservationSlice = createSlice({
  name: "reservation",
  initialState,
  reducers: {
    clearReservation(state) {
      state.reservation = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createReservation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createReservation.fulfilled,
        (state, action: PayloadAction<ReservationEntity>) => {
          state.loading = false;
          state.reservation = action.payload;
        }
      )
      .addCase(createReservation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to create reservation";
      })

      .addCase(updateReservationStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateReservationStatus.fulfilled,
        (state, action: PayloadAction<UpdateReservationStatusResponse>) => {
          state.loading = false;
          if (state.reservation && state.reservation.id === action.payload.id) {
            (state.reservation.status as unknown as string) = action.payload.status;
            state.reservation.updatedAt = new Date().toISOString();
          }
          state.reservations = state.reservations.map((r) =>
            r.id === action.payload.id ? { ...r, status: action.payload.status } : r
          );
        }
      )
      .addCase(updateReservationStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to update reservation status";
      });
    builder
      .addCase(fetchReservationsByRestaurant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchReservationsByRestaurant.fulfilled,
        (state, action: PayloadAction<RestaurantReservationRow[]>) => {
          state.loading = false;
          state.reservations = action.payload;
        }
      )
      .addCase(fetchReservationsByRestaurant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to fetch reservations by restaurant";
      })

      .addCase(fetchReservationsByUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchReservationsByUser.fulfilled,
        (state, action: PayloadAction<RestaurantReservationRow[]>) => {
          state.loading = false;
          state.reservations = action.payload;
        }
      )
      .addCase(fetchReservationsByUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to fetch reservations by user";
      })
      .addCase(deleteReservation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deleteReservation.fulfilled,
        (state, action: PayloadAction<{ id: number; status: ReservationEntity['status'] }>) => {
          state.loading = false;
          state.reservations = state.reservations.map((r) =>
            r.id === action.payload.id ? { ...r, status: action.payload.status } : r
          );
          if (state.reservation && state.reservation.id === action.payload.id) {
            state.reservation.status = action.payload.status;
            state.reservation.updatedAt = new Date().toISOString();
          }
        }
      )
      .addCase(deleteReservation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to delete reservation";
      });
    builder
      .addCase(deleteReservationForBusiness.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deleteReservationForBusiness.fulfilled,
        (state, action: PayloadAction<{ id: number; status: ReservationEntity['status'] }>) => {
          state.loading = false;
          state.reservations = state.reservations.map((r) =>
            r.id === action.payload.id ? { ...r, status: action.payload.status } : r
          );
          if (state.reservation && state.reservation.id === action.payload.id) {
            state.reservation.status = action.payload.status;
            state.reservation.updatedAt = new Date().toISOString();
          }
        }
      )
      .addCase(deleteReservationForBusiness.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to delete reservation by business";
      });
  },
});

export const { clearReservation } = reservationSlice.actions;
export default reservationSlice.reducer;
