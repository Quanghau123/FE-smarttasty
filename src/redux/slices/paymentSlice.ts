
import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  AnyAction,
} from "@reduxjs/toolkit";
import axiosInstance from "@/lib/axios/axiosInstance";
import { Payment, CODPayment, InfoPayment } from "@/types/payment";
import { ApiEnvelope } from "@/types/order"; 
import type { AppDispatch } from "@/redux/store";
import { getAccessToken } from "@/lib/utils/tokenHelper";

export interface VNPayIPNResponse {
  RspCode: string;  
  Message: string;
}

interface PaymentState {
  payments: Payment[];
  selectedPayment: Payment | null;
  history: InfoPayment[];
  restaurantPayments: InfoPayment[];
  loading: boolean;
  error: string | null;
}

const initialState: PaymentState = {
  payments: [],
  selectedPayment: null,
  history: [],
  restaurantPayments: [],
  loading: false,
  error: null,
};


const getToken = getAccessToken;

const resolveApiData = <T>(body: unknown): ApiEnvelope<T> | null => {
  if (!body || typeof body !== "object") return null;
  return body as ApiEnvelope<T>;
};

export const createVNPayPayment = createAsyncThunk<
  Payment,
  { orderId: number; amount: number },
  { rejectValue: string }
>("payment/createVNPayPayment", async (payload, { rejectWithValue }) => {
  try {
    const token = getToken();
    const res = await axiosInstance.post("/api/Payment/vnpay/create", payload, {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        : { "Content-Type": "application/json" },
    });
    const envelope = resolveApiData<Payment>(res.data);
    if (envelope && envelope.data) {
      return envelope.data as Payment;
    }

    return rejectWithValue(envelope?.errMessage ?? "Không thể tạo thanh toán VNPay");
  } catch (e: unknown) {
    return rejectWithValue((e as Error)?.message ?? "Lỗi không xác định");
  }
});

export const createCODPayment = createAsyncThunk<
  CODPayment,
  { orderId: number; amount: number; shippingAddress?: string; receiverPhone?: string },
  { rejectValue: string; dispatch: AppDispatch }
>("payment/createCODPayment", async (payload, { rejectWithValue, dispatch }) => {
  try {
    const token = getToken();
    const res = await axiosInstance.post("/api/Payment/cod/create", payload, {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        : { "Content-Type": "application/json" },
    });
    const envelope = resolveApiData<CODPayment>(res.data);
    if (envelope && envelope.data) {
      dispatch(fetchPendingPayments());
      return envelope.data as CODPayment;
    }

    return rejectWithValue(envelope?.errMessage ?? "Không thể tạo thanh toán COD");
  } catch (e: unknown) {
    return rejectWithValue((e as Error)?.message ?? "Lỗi không xác định");
  }
});

export const confirmCODPayment = createAsyncThunk<
  CODPayment,
  { codPaymentId: number },
  { rejectValue: string; dispatch: AppDispatch }
>("payment/confirmCODPayment", async ({ codPaymentId }, { rejectWithValue, dispatch }) => {
  try {
    const token = getToken();
    const url = `/api/Payment/cod/confirm?codPaymentId=${codPaymentId}`;
    const res = await axiosInstance.post(url, null, {
      headers: token
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : { "Content-Type": "application/json" },
    });

    const envelope = resolveApiData<CODPayment>(res.data);
    if (envelope && envelope.data) {
      dispatch(fetchPendingPayments());
      return envelope.data as CODPayment;
    }

    return rejectWithValue(envelope?.errMessage ?? "Không thể xác nhận thanh toán COD");
  } catch (e: unknown) {
    return rejectWithValue((e as Error)?.message ?? "Lỗi không xác định");
  }
});

export const confirmCODPaymentByPaymentId = createAsyncThunk<
  CODPayment,
  { paymentId: number; restaurantId: number },
  { rejectValue: string }
>(
  "payment/confirmCODPaymentByPaymentId",
  async ({ paymentId, restaurantId }, { rejectWithValue }) => {
    try {
      const token = getToken();

      const pendingRes = await axiosInstance.get(
        `/api/Payment/restaurant/pending/${restaurantId}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      const pendingEnvelope = resolveApiData<InfoPayment[]>(pendingRes.data);
      const matching = pendingEnvelope?.data?.find((p) => p.id === paymentId);

      const codPaymentId = matching?.codPayment?.id;
      if (!codPaymentId) {
        return rejectWithValue(
          "Không tìm thấy COD payment đang chờ hoặc không phải đơn COD"
        );
      }

      const url = `/api/Payment/cod/confirm?codPaymentId=${codPaymentId}`;
      const res = await axiosInstance.post(url, null, {
        headers: token
          ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
          : { "Content-Type": "application/json" },
      });

      const envelope = resolveApiData<CODPayment>(res.data);
      if (envelope && envelope.data) {
        return envelope.data as CODPayment;
      }
      return rejectWithValue(
        (envelope as unknown as { errMessage?: string })?.errMessage ??
          "Không thể xác nhận thanh toán COD"
      );
    } catch (e: unknown) {
      return rejectWithValue((e as Error)?.message ?? "Lỗi không xác định");
    }
  }
);

export const handleVNPayReturn = createAsyncThunk<
  Payment,
  { query: string },
  { rejectValue: string }
>("payment/handleVNPayReturn", async ({ query }, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(`/api/Payment/vnpay-return?${query}`);
    const envelope = resolveApiData<Payment>(res.data);
    if (envelope && envelope.data) {
      return envelope.data as Payment;
    }
    return rejectWithValue("Không thể xử lý kết quả VNPay return");
  } catch (e: unknown) {
    return rejectWithValue((e as Error)?.message ?? "Lỗi không xác định");
  }
});


export const handleVNPayIPN = createAsyncThunk<VNPayIPNResponse, { query: string }, { rejectValue: string }>(
  "payment/handleVNPayIPN",
  async ({ query }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/api/Payment/vnpay-ipn?${query}`);
      return res.data as VNPayIPNResponse;
    } catch (e: unknown) {
      return rejectWithValue((e as Error)?.message ?? "Lỗi không xác định");
    }
  }
);

export const fetchPendingPayments = createAsyncThunk<
  Payment[],
  void,
  { rejectValue: string }
>("payment/fetchPendingPayments", async (_, { rejectWithValue }) => {
  try {
    const token = getToken();
    const res = await axiosInstance.get("/api/Payment/pending", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    const envelope = resolveApiData<Payment[]>(res.data);
    if (envelope && Array.isArray(envelope.data)) {
      return envelope.data as Payment[];
    }

    return rejectWithValue(envelope?.errMessage ?? "Không thể lấy danh sách thanh toán pending");
  } catch (e: unknown) {
    return rejectWithValue((e as Error)?.message ?? "Lỗi không xác định");
  }
});

export const fetchPaymentHistoryByUser = createAsyncThunk<
  InfoPayment[],
  { userId: number },
  { rejectValue: string }
>("payment/fetchPaymentHistoryByUser", async ({ userId }, { rejectWithValue }) => {
  try {
    const token = getToken();
    const res = await axiosInstance.get(`/api/Order/user/paid/${userId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    const envelope = resolveApiData<InfoPayment[]>(res.data);
    if (envelope && Array.isArray(envelope.data)) {
      return envelope.data as InfoPayment[];
    }
    return rejectWithValue(envelope?.errMessage ?? "Không thể lấy lịch sử thanh toán");
  } catch (e: unknown) {
    return rejectWithValue((e as Error)?.message ?? "Lỗi không xác định");
  }
});

export const cancelOrder = createAsyncThunk<
  { success: boolean; orderId: number },
  { orderId: number; userId?: number },
  { rejectValue: string; dispatch: AppDispatch }
>("payment/cancelOrder", async ({ orderId, userId }, { rejectWithValue, dispatch }) => {
  try {
    const token = getToken();
    const res = await axiosInstance.delete(`/api/Payment/cancel/${orderId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (res.status === 200 || res.status === 204) {
      if (typeof userId === "number") {
        dispatch(fetchPaymentHistoryByUser({ userId }));
      } else {
        dispatch(fetchPendingPayments());
      }
      return { success: true, orderId };
    }
    
    const envelope = resolveApiData<Record<string, unknown>>(res.data);
    const errObj = envelope as unknown as { errMessage?: string };
    return rejectWithValue(errObj?.errMessage ?? "Không thể hủy đơn");
  } catch (e: unknown) {
    return rejectWithValue((e as Error)?.message ?? "Lỗi không xác định");
  }
});

export const fetchPaymentsByRestaurant = createAsyncThunk<
  InfoPayment[],
  { restaurantId: number },
  { rejectValue: string }
>("payment/fetchPaymentsByRestaurant", async ({ restaurantId }, { rejectWithValue }) => {
  try {
    const token = getToken();
    const res = await axiosInstance.get(`/api/Payment/restaurant/${restaurantId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    const envelope = resolveApiData<InfoPayment[]>(res.data);
    if (envelope && envelope.data && Array.isArray(envelope.data)) {
      return envelope.data as InfoPayment[];
    }
    const errObj = (envelope as unknown) as { errMessage?: string };
    return rejectWithValue(errObj?.errMessage ?? "Không thể lấy danh sách thanh toán theo nhà hàng");
  } catch (e: unknown) {
    return rejectWithValue((e as Error)?.message ?? "Lỗi không xác định");
  }
});


const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {
    setPayments: (state, action: PayloadAction<Payment[]>) => {
      state.payments = action.payload;
    },
    setSelectedPayment: (state, action: PayloadAction<Payment | null>) => {
      state.selectedPayment = action.payload;
    },
    clearPayments: (state) => {
      state.payments = [];
      state.selectedPayment = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createVNPayPayment.fulfilled, (state, action) => {
        // backend returns a PaymentDto; push it into payments list
        state.payments.push(action.payload as Payment);
      })
      .addCase(createCODPayment.fulfilled, () => {
        // createCODPayment dispatches fetchPendingPayments internally; no immediate mutation here
      })
      .addCase(confirmCODPayment.fulfilled, () => {
        // confirmCODPayment dispatches fetchPendingPayments internally
      })
      .addCase(confirmCODPaymentByPaymentId.fulfilled, () => {
        // Admin view should refresh restaurant payments in component after calling this
      })
      .addCase(handleVNPayReturn.fulfilled, (state, action) => {
        state.selectedPayment = action.payload;
      })
      .addCase(fetchPendingPayments.fulfilled, (state, action) => {
        state.payments = action.payload;
      })
      .addCase(fetchPaymentHistoryByUser.fulfilled, (state, action) => {
        state.history = action.payload;
      })
      .addCase(fetchPaymentsByRestaurant.fulfilled, (state, action) => {
        state.restaurantPayments = action.payload;
      })
      .addMatcher(
        (a) => a.type.startsWith("payment/") && a.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (a) => a.type.startsWith("payment/") && a.type.endsWith("/fulfilled"),
        (state) => {
          state.loading = false;
        }
      )
      .addMatcher(
        (a) => a.type.startsWith("payment/") && a.type.endsWith("/rejected"),
        (state, action: AnyAction) => {
          state.loading = false;
          state.error =
            action.payload ?? action.error?.message ?? "Thao tác thất bại";
        }
      );
  },
});

export const { setPayments, setSelectedPayment, clearPayments } =
  paymentSlice.actions;

export default paymentSlice.reducer;
