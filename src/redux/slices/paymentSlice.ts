// src/redux/slices/paymentSlice.ts
import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  AnyAction,
} from "@reduxjs/toolkit";
import axiosInstance from "@/lib/axios/axiosInstance";
import { Payment, CODPayment, InfoPayment } from "@/types/payment";
import { ApiEnvelope } from "@/types/order"; // reused API envelope type
import type { AppDispatch } from "@/redux/store";
import { getAccessToken } from "@/lib/utils/tokenHelper";

// VNPay IPN response type (backend returns { RspCode, Message })
export interface VNPayIPNResponse {
  RspCode: string;
  Message: string;
}

/* -------------------------------------------------------------------------- */
/*                                 STATE TYPE                                 */
/* -------------------------------------------------------------------------- */

interface PaymentState {
  payments: Payment[];
  selectedPayment: Payment | null;
  history: InfoPayment[];
  loading: boolean;
  error: string | null;
}

const initialState: PaymentState = {
  payments: [],
  selectedPayment: null,
  history: [],
  loading: false,
  error: null,
};

/* -------------------------------------------------------------------------- */
/*                                   UTILS                                    */
/* -------------------------------------------------------------------------- */

const getToken = getAccessToken;

const resolveApiData = <T>(body: unknown): ApiEnvelope<T> | null => {
  if (!body || typeof body !== "object") return null;
  return body as ApiEnvelope<T>;
};

// helper is kept inline as resolveApiData return checks are sufficient

/* -------------------------------------------------------------------------- */
/*                                  THUNKS                                    */
/* -------------------------------------------------------------------------- */

// 1️⃣ POST /api/Payment/vnpay/create
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

// 2️⃣ POST /api/Payment/cod/create
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
      // refresh pending payments list to get the created Payment object
      dispatch(fetchPendingPayments());
      return envelope.data as CODPayment;
    }

    return rejectWithValue(envelope?.errMessage ?? "Không thể tạo thanh toán COD");
  } catch (e: unknown) {
    return rejectWithValue((e as Error)?.message ?? "Lỗi không xác định");
  }
});

// 3️⃣ POST /api/Payment/cod/confirm
export const confirmCODPayment = createAsyncThunk<
  CODPayment,
  { codPaymentId: number },
  { rejectValue: string; dispatch: AppDispatch }
>("payment/confirmCODPayment", async ({ codPaymentId }, { rejectWithValue, dispatch }) => {
  try {
    const token = getToken();
    // backend expects codPaymentId as query parameter
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

// 4️⃣ GET /api/Payment/vnpay-return
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

// 5️⃣ GET /api/Payment/vnpay-ipn
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

// 6️⃣ GET /api/Payment/pending
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

// 7️⃣ GET /api/Payment/history/{userId}
export const fetchPaymentHistoryByUser = createAsyncThunk<
  InfoPayment[],
  { userId: number },
  { rejectValue: string }
>("payment/fetchPaymentHistoryByUser", async ({ userId }, { rejectWithValue }) => {
  try {
    const token = getToken();
    const res = await axiosInstance.get(`/api/Payment/history/${userId}`, {
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

/* -------------------------------------------------------------------------- */
/*                                   SLICE                                    */
/* -------------------------------------------------------------------------- */

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
      .addCase(handleVNPayReturn.fulfilled, (state, action) => {
        state.selectedPayment = action.payload;
      })
      .addCase(fetchPendingPayments.fulfilled, (state, action) => {
        state.payments = action.payload;
      })
      .addCase(fetchPaymentHistoryByUser.fulfilled, (state, action) => {
        state.history = action.payload;
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
