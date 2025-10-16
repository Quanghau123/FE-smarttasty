// redux/slices/reservationSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "@/lib/axios/axiosInstance";
import axios, { AxiosError } from "axios";
import {
  ReservationRequest,
  ReservationEntity,
  UpdateReservationStatusRequest,
  UpdateReservationStatusResponse,
} from "@/types/reservation";

/* -------------------------------------------------------------------------- */
/*                                   STATE                                    */
/* -------------------------------------------------------------------------- */
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

/* -------------------------------------------------------------------------- */
/*                                API RESPONSE                                */
/* -------------------------------------------------------------------------- */
interface ApiResponse<T> {
  errCode: string;
  errMessage: string;
  data: T;
  timestamp: string;
  status: string;
}

/* -------------------------------------------------------------------------- */
/*                            HELPER: ERROR HANDLER                           */
/* -------------------------------------------------------------------------- */
const handleAxiosError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ errMessage?: string }>;
    return axiosError.response?.data?.errMessage || "Unexpected API error";
  }
  return "Unexpected error";
};

/* -------------------------------------------------------------------------- */
/*                           CREATE RESERVATION API                           */
/* -------------------------------------------------------------------------- */
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

/* -------------------------------------------------------------------------- */
/*                        UPDATE RESERVATION STATUS API                       */
/* -------------------------------------------------------------------------- */
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
    } catch (error: unknown) {
      return rejectWithValue(handleAxiosError(error));
    }
  }
);

/* -------------------------------------------------------------------------- */
/*                                 SLICE SETUP                                */
/* -------------------------------------------------------------------------- */
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
      /* ------------------------------ CREATE ------------------------------ */
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

      /* ------------------------------- UPDATE ----------------------------- */
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
        state.error = action.payload ?? "Failed to update reservation status";
      });
  },
});

export const { clearReservation } = reservationSlice.actions;
export default reservationSlice.reducer;
