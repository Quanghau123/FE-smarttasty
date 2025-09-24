// redux/slices/reservationSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "@/lib/axios/axiosInstance";
import {
  ReservationRequest,
  ReservationEntity,
  UpdateReservationStatusRequest,
  UpdateReservationStatusResponse,
} from "@/types/reservation";

interface ReservationState {
  reservation: ReservationEntity | null;
  loading: boolean;
  error: string | null;
}

const initialState: ReservationState = {
  reservation: null,
  loading: false,
  error: null,
};

// Generic API response
interface ApiResponse<T> {
  errCode: string;
  errMessage: string;
  data: T;
  timestamp: string;
  status: string;
}

// POST reservation
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
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.errMessage || "Something went wrong"
    );
  }
});

// PUT update reservation status
export const updateReservationStatus = createAsyncThunk<
  UpdateReservationStatusResponse,
  { id: number; data: UpdateReservationStatusRequest },
  { rejectValue: string }
>(
  "reservation/updateReservationStatus",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put<
        ApiResponse<UpdateReservationStatusResponse>
      >(`/api/Reservation/${id}/status`, data);
      return response.data.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.errMessage || "Failed to update status"
      );
    }
  }
);

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
      // POST
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
        state.error = action.payload || "Failed to create reservation";
      })
      // PUT
      .addCase(updateReservationStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateReservationStatus.fulfilled,
        (state, action: PayloadAction<UpdateReservationStatusResponse>) => {
          state.loading = false;
          if (state.reservation && state.reservation.id === action.payload.id) {
            state.reservation.status = action.payload.status;
            state.reservation.updatedAt = action.payload.updatedAt;
          }
        }
      )
      .addCase(updateReservationStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update reservation status";
      });
  },
});

export const { clearReservation } = reservationSlice.actions;
export default reservationSlice.reducer;
