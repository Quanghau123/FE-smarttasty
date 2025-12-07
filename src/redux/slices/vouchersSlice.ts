import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import axiosInstance from "@/lib/axios/axiosInstance";
import { Voucher } from "@/types/voucher";

interface VouchersState {
  vouchers: Voucher[];
  loading: boolean;
  error: string | null;
}

const initialState: VouchersState = {
  vouchers: [],
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

export const fetchUserVouchers = createAsyncThunk<Voucher[], number, { rejectValue: string }>(
  "vouchers/fetchUserVouchers",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/api/Vouchers/user/${userId}`);
      return res.data?.data ?? res.data ?? [];
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, "Không lấy được voucher"));
    }
  }
);

export const markVoucherAsUsed = createAsyncThunk<number, number, { rejectValue: string }>(
  "vouchers/markAsUsed",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.put(`/api/Vouchers/${id}/use`);
      return id;
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, "Không thể sử dụng voucher"));
    }
  }
);

const vouchersSlice = createSlice({
  name: "vouchers",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserVouchers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserVouchers.fulfilled, (state, action) => {
        state.loading = false;
        state.vouchers = action.payload;
      })
      .addCase(fetchUserVouchers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi";
      })

      .addCase(markVoucherAsUsed.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markVoucherAsUsed.fulfilled, (state, action) => {
        state.loading = false;
        state.vouchers = state.vouchers.map((v) =>
          v.id === action.payload ? { ...v, isUsed: true } : v
        );
      })
      .addCase(markVoucherAsUsed.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi";
      });
  },
});

export default vouchersSlice.reducer;
