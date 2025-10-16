// src/redux/slices/paymentSlice.ts
import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  AnyAction,
} from "@reduxjs/toolkit";
import axiosInstance from "@/lib/axios/axiosInstance";
import {
  Payment,
} from "@/types/payment";
import { ApiEnvelope } from "@/types/order"; // dùng lại kiểu chuẩn hóa từ order

/* -------------------------------------------------------------------------- */
/*                                 STATE TYPE                                 */
/* -------------------------------------------------------------------------- */

interface PaymentState {
  payments: Payment[];
  selectedPayment: Payment | null;
  loading: boolean;
  error: string | null;
}

const initialState: PaymentState = {
  payments: [],
  selectedPayment: null,
  loading: false,
  error: null,
};

/* -------------------------------------------------------------------------- */
/*                                   UTILS                                    */
/* -------------------------------------------------------------------------- */

const getToken = (): string | null => localStorage.getItem("token");

const resolveApiData = (body: unknown): unknown => {
  try {
    return body as unknown;
  } catch {
    return undefined;
  }
};

const isApiEnvelope = (v: unknown): v is ApiEnvelope<unknown> => {
  if (typeof v !== "object" || v === null) return false;
  const obj = v as Record<string, unknown>;
  return "errCode" in obj && "errMessage" in obj;
};

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

    const envelope = resolveApiData(res.data);
    if (isApiEnvelope(envelope) && envelope.data) {
      return envelope.data as Payment;
    }

    return rejectWithValue(
      isApiEnvelope(envelope)
        ? envelope.errMessage
        : "Không thể tạo thanh toán VNPay"
    );
  } catch (e: unknown) {
    return rejectWithValue((e as Error)?.message ?? "Lỗi không xác định");
  }
});

// 2️⃣ POST /api/Payment/cod/create
export const createCODPayment = createAsyncThunk<
  Payment,
  { orderId: number; amount: number },
  { rejectValue: string }
>("payment/createCODPayment", async (payload, { rejectWithValue }) => {
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

    const envelope = resolveApiData(res.data);
    if (isApiEnvelope(envelope) && envelope.data) {
      return envelope.data as Payment;
    }

    return rejectWithValue(
      isApiEnvelope(envelope)
        ? envelope.errMessage
        : "Không thể tạo thanh toán COD"
    );
  } catch (e: unknown) {
    return rejectWithValue((e as Error)?.message ?? "Lỗi không xác định");
  }
});

// 3️⃣ POST /api/Payment/cod/confirm
export const confirmCODPayment = createAsyncThunk<
  Payment,
  { paymentId: number },
  { rejectValue: string }
>("payment/confirmCODPayment", async ({ paymentId }, { rejectWithValue }) => {
  try {
    const token = getToken();
    const res = await axiosInstance.post(
      "/api/Payment/cod/confirm",
      { paymentId },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            }
          : { "Content-Type": "application/json" },
      }
    );

    const envelope = resolveApiData(res.data);
    if (isApiEnvelope(envelope) && envelope.data) {
      return envelope.data as Payment;
    }

    return rejectWithValue(
      isApiEnvelope(envelope)
        ? envelope.errMessage
        : "Không thể xác nhận thanh toán COD"
    );
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
    const envelope = resolveApiData(res.data);
    if (isApiEnvelope(envelope) && envelope.data) {
      return envelope.data as Payment;
    }
    return rejectWithValue("Không thể xử lý kết quả VNPay return");
  } catch (e: unknown) {
    return rejectWithValue((e as Error)?.message ?? "Lỗi không xác định");
  }
});

// 5️⃣ GET /api/Payment/vnpay-ipn
export const handleVNPayIPN = createAsyncThunk<
  Payment,
  { query: string },
  { rejectValue: string }
>("payment/handleVNPayIPN", async ({ query }, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(`/api/Payment/vnpay-ipn?${query}`);
    const envelope = resolveApiData(res.data);
    if (isApiEnvelope(envelope) && envelope.data) {
      return envelope.data as Payment;
    }
    return rejectWithValue("Không thể xử lý IPN VNPay");
  } catch (e: unknown) {
    return rejectWithValue((e as Error)?.message ?? "Lỗi không xác định");
  }
});

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

    const envelope = resolveApiData(res.data);
    if (isApiEnvelope(envelope) && Array.isArray(envelope.data)) {
      return envelope.data as Payment[];
    }

    return rejectWithValue("Không thể lấy danh sách thanh toán pending");
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
        state.payments.push(action.payload);
      })
      .addCase(createCODPayment.fulfilled, (state, action) => {
        state.payments.push(action.payload);
      })
      .addCase(confirmCODPayment.fulfilled, (state, action) => {
        const idx = state.payments.findIndex((p) => p.id === action.payload.id);
        if (idx !== -1) state.payments[idx] = action.payload;
      })
      .addCase(handleVNPayReturn.fulfilled, (state, action) => {
        state.selectedPayment = action.payload;
      })
      .addCase(fetchPendingPayments.fulfilled, (state, action) => {
        state.payments = action.payload;
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
