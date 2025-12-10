import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
} from "@reduxjs/toolkit";
import axiosInstance from "@/lib/axios/axiosInstance";
import {
  CommissionResponse,
  RestaurantCommissionResponse,
  DailyCommissionResponse,
  PaymentCommissionResponse,
  MonthlyCommissionResponse,
} from "@/types/commission";
import { getAccessToken } from "@/lib/utils/tokenHelper";

interface CommissionState {
  monthlyCommission: MonthlyCommissionResponse | null;
  commissionList: CommissionResponse[];
  restaurantCommissions: RestaurantCommissionResponse[];
  dailyCommissions: DailyCommissionResponse[];
  paymentMethodCommissions: PaymentCommissionResponse[];
  commissionDetail: CommissionResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: CommissionState = {
  monthlyCommission: null,
  commissionList: [],
  restaurantCommissions: [],
  dailyCommissions: [],
  paymentMethodCommissions: [],
  commissionDetail: null,
  loading: false,
  error: null,
};

const getToken = getAccessToken;

interface MonthYearParams {
  month: number;
  year: number;
}

// 1. GET /api/commission/monthly - Lấy tổng hoa hồng tháng
export const fetchMonthlyCommission = createAsyncThunk<
  MonthlyCommissionResponse,
  MonthYearParams,
  { rejectValue: string }
>(
  "commission/fetchMonthly",
  async ({ month, year }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await axiosInstance.get(
        `/api/commission/monthly?month=${month}&year=${year}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );
      return res.data;
    } catch (err: unknown) {
      if (err instanceof Error) return rejectWithValue(err.message);
      return rejectWithValue("Không thể tải tổng hoa hồng tháng");
    }
  }
);

// 2. GET /api/commission/list - Lấy danh sách hoa hồng
export const fetchCommissionList = createAsyncThunk<
  CommissionResponse[],
  MonthYearParams,
  { rejectValue: string }
>(
  "commission/fetchList",
  async ({ month, year }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await axiosInstance.get(
        `/api/commission/list?month=${month}&year=${year}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );
      return res.data;
    } catch (err: unknown) {
      if (err instanceof Error) return rejectWithValue(err.message);
      return rejectWithValue("Không thể tải danh sách hoa hồng");
    }
  }
);

// 3. GET /api/commission/restaurant - Lấy hoa hồng theo nhà hàng
export const fetchRestaurantCommissions = createAsyncThunk<
  RestaurantCommissionResponse[],
  MonthYearParams,
  { rejectValue: string }
>(
  "commission/fetchByRestaurant",
  async ({ month, year }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await axiosInstance.get(
        `/api/commission/restaurant?month=${month}&year=${year}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );
      return res.data;
    } catch (err: unknown) {
      if (err instanceof Error) return rejectWithValue(err.message);
      return rejectWithValue("Không thể tải hoa hồng theo nhà hàng");
    }
  }
);

// 4. GET /api/commission/daily - Lấy hoa hồng theo ngày
export const fetchDailyCommissions = createAsyncThunk<
  DailyCommissionResponse[],
  MonthYearParams,
  { rejectValue: string }
>(
  "commission/fetchDaily",
  async ({ month, year }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await axiosInstance.get(
        `/api/commission/daily?month=${month}&year=${year}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );
      return res.data;
    } catch (err: unknown) {
      if (err instanceof Error) return rejectWithValue(err.message);
      return rejectWithValue("Không thể tải hoa hồng theo ngày");
    }
  }
);

// 5. GET /api/commission/payment-method - Lấy hoa hồng theo phương thức thanh toán
export const fetchPaymentMethodCommissions = createAsyncThunk<
  PaymentCommissionResponse[],
  MonthYearParams,
  { rejectValue: string }
>(
  "commission/fetchByPaymentMethod",
  async ({ month, year }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await axiosInstance.get(
        `/api/commission/payment-method?month=${month}&year=${year}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );
      return res.data;
    } catch (err: unknown) {
      if (err instanceof Error) return rejectWithValue(err.message);
      return rejectWithValue("Không thể tải hoa hồng theo phương thức thanh toán");
    }
  }
);

// 6. GET /api/commission/{orderId} - Lấy chi tiết hoa hồng của đơn hàng
export const fetchCommissionDetail = createAsyncThunk<
  CommissionResponse,
  number,
  { rejectValue: string }
>(
  "commission/fetchDetail",
  async (orderId, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await axiosInstance.get(`/api/commission/${orderId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      return res.data;
    } catch (err: unknown) {
      if (err instanceof Error) return rejectWithValue(err.message);
      return rejectWithValue("Không thể tải chi tiết hoa hồng");
    }
  }
);

const commissionSlice = createSlice({
  name: "commission",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCommissionDetail: (state) => {
      state.commissionDetail = null;
    },
    resetCommissionState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMonthlyCommission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchMonthlyCommission.fulfilled,
        (state, action: PayloadAction<MonthlyCommissionResponse>) => {
          state.loading = false;
          state.monthlyCommission = action.payload;
        }
      )
      .addCase(fetchMonthlyCommission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi khi tải tổng hoa hồng tháng";
      })

      .addCase(fetchCommissionList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchCommissionList.fulfilled,
        (state, action: PayloadAction<CommissionResponse[]>) => {
          state.loading = false;
          state.commissionList = action.payload;
        }
      )
      .addCase(fetchCommissionList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi khi tải danh sách hoa hồng";
      })

      .addCase(fetchRestaurantCommissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchRestaurantCommissions.fulfilled,
        (state, action: PayloadAction<RestaurantCommissionResponse[]>) => {
          state.loading = false;
          state.restaurantCommissions = action.payload;
        }
      )
      .addCase(fetchRestaurantCommissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi khi tải hoa hồng theo nhà hàng";
      })

      .addCase(fetchDailyCommissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchDailyCommissions.fulfilled,
        (state, action: PayloadAction<DailyCommissionResponse[]>) => {
          state.loading = false;
          state.dailyCommissions = action.payload;
        }
      )
      .addCase(fetchDailyCommissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi khi tải hoa hồng theo ngày";
      })

      .addCase(fetchPaymentMethodCommissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPaymentMethodCommissions.fulfilled,
        (state, action: PayloadAction<PaymentCommissionResponse[]>) => {
          state.loading = false;
          state.paymentMethodCommissions = action.payload;
        }
      )
      .addCase(fetchPaymentMethodCommissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi khi tải hoa hồng theo phương thức thanh toán";
      })

      .addCase(fetchCommissionDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchCommissionDetail.fulfilled,
        (state, action: PayloadAction<CommissionResponse>) => {
          state.loading = false;
          state.commissionDetail = action.payload;
        }
      )
      .addCase(fetchCommissionDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi khi tải chi tiết hoa hồng";
      });
  },
});

export const { clearError, clearCommissionDetail, resetCommissionState } =
  commissionSlice.actions;
export default commissionSlice.reducer;
