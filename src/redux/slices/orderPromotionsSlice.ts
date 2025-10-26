import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from '../../lib/axios/axiosInstance';
import { OrderPromotion, CreateOrderPromotionRequest, ApiResponse } from '../../types/orderpromotion';

type State = {
  items: OrderPromotion[];
  loading: boolean;
  error?: string | null;
};

const initialState: State = {
  items: [],
  loading: false,
  error: null,
};

export const createOrderPromotion = createAsyncThunk(
  'orderPromotions/create',
  async (dto: CreateOrderPromotionRequest, { rejectWithValue }) => {
    try {
      const res = await axios.post<ApiResponse<OrderPromotion>>('/api/OrderPromotions', dto);
      return res.data.data as OrderPromotion;
    } catch (err: unknown) {
      let message = String(err);
      if (err && typeof err === 'object') {
        const maybe = err as Record<string, unknown>;
        if (typeof maybe.message === 'string') message = maybe.message;
      }
      return rejectWithValue((message) as string);
    }
  }
);

export const getOrderPromotionByPromotionId = createAsyncThunk(
  'orderPromotions/getByPromotionId',
  async (promotionId: number, { rejectWithValue }) => {
    try {
      const res = await axios.get<ApiResponse<OrderPromotion>>(`/api/OrderPromotions/promotion/${promotionId}`);
      return res.data.data as OrderPromotion;
    } catch (err: unknown) {
      let message = String(err);
      if (err && typeof err === 'object') {
        const maybe = err as Record<string, unknown>;
        if (typeof maybe.message === 'string') message = maybe.message;
      }
      return rejectWithValue(message);
    }
  }
);

export const deleteOrderPromotion = createAsyncThunk(
  'orderPromotions/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      const res = await axios.delete<ApiResponse<null>>(`/api/OrderPromotions/${id}`);
      return { id, message: res.data.errMessage };
    } catch (err: unknown) {
      let message = String(err);
      if (err && typeof err === 'object') {
        const maybe = err as Record<string, unknown>;
        if (typeof maybe.message === 'string') message = maybe.message;
      }
      return rejectWithValue(message);
    }
  }
);

export const applyPromotion = createAsyncThunk(
  'orderPromotions/apply',
  async (
    payload: { orderId: number; voucherCode?: string | null },
    { rejectWithValue }
  ) => {
    try {
      const { orderId, voucherCode } = payload;
      const query = voucherCode ? `?voucherCode=${encodeURIComponent(voucherCode)}` : '';
      const res = await axios.post(`/api/ApplyPromotion/${orderId}${query}`);
      // backend returns { OrderId, OriginalTotal, FinalTotal, VoucherCode }
      return res.data as { orderId: number; originalTotal: number; finalTotal: number; voucherCode?: string | null };
    } catch (err: unknown) {
      let message = String(err);
      if (err && typeof err === 'object') {
        const maybe = err as Record<string, unknown>;
        if (typeof maybe.message === 'string') message = maybe.message;
      }
      return rejectWithValue(message);
    }
  }
);

const slice = createSlice({
  name: 'orderPromotions',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrderPromotion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrderPromotion.fulfilled, (state, action: PayloadAction<OrderPromotion>) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(createOrderPromotion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(getOrderPromotionByPromotionId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrderPromotionByPromotionId.fulfilled, (state, action: PayloadAction<OrderPromotion>) => {
        state.loading = false;
        // replace or insert
        const idx = state.items.findIndex(i => i.id === action.payload.id);
        if (idx >= 0) state.items[idx] = action.payload;
        else state.items.push(action.payload);
      })
      .addCase(getOrderPromotionByPromotionId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(deleteOrderPromotion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteOrderPromotion.fulfilled, (state, action: PayloadAction<{ id: number; message?: string }>) => {
        state.loading = false;
        state.items = state.items.filter(i => i.id !== action.payload.id);
      })
      .addCase(deleteOrderPromotion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearError } = slice.actions;

export default slice.reducer;
