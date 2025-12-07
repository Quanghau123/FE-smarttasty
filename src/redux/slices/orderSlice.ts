import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  AnyAction,
} from "@reduxjs/toolkit";
import axiosInstance from "@/lib/axios/axiosInstance";
import {
  OrderRequest,
  OrderResponse,
  ApiEnvelope,
  RawOrderResponse,
  normalizeOrderResponse,
  OrderStatus,
  DeliveryStatus,
} from "@/types/order";
import { RestaurantRevenue } from "@/types/order";


interface OrderState {
  orders: OrderResponse[];
  selectedOrder: OrderResponse | null;
  loading: boolean;
  error: string | null;
  activeOrderByRestaurant: Record<number, number>;
  revenueByRestaurant: Record<number, RestaurantRevenue | null>;
}

const initialState: OrderState = {
  orders: [],
  selectedOrder: null,
  loading: false,
  error: null,
  activeOrderByRestaurant: {},
  revenueByRestaurant: {},
};

const resolveApiData = (body: unknown): unknown => body as unknown;

const isApiEnvelope = (v: unknown): v is ApiEnvelope<unknown> => {
  if (typeof v !== "object" || v === null) return false;
  const obj = v as Record<string, unknown>;
  return "errCode" in obj && "errMessage" in obj;
};

const extractItemsArray = (payload: unknown): unknown[] | null => {
  if (!payload) return null;
  if (Array.isArray(payload)) return payload as unknown[];
  if (isApiEnvelope(payload)) {
    const data = (payload as ApiEnvelope<unknown>).data as unknown;
    if (Array.isArray(data)) return data as unknown[];
    if (data && typeof data === "object") return [data as unknown];
    return null;
  }
  if (typeof payload === "object") return [payload as unknown];
  return null;
};

const fetchOrderByIdInternal = async (
  id: number
): Promise<OrderResponse | null> => {
  try {
    const res = await axiosInstance.get(`/api/Order/${id}`);
    const envelope = resolveApiData(res.data);
    const items = extractItemsArray(envelope);
    if (Array.isArray(items) && items.length > 0) {
      return normalizeOrderResponse(items[0] as RawOrderResponse);
    }
    return null;
  } catch {
    return null;
  }
};


export const createOrder = createAsyncThunk<
  OrderResponse,
  OrderRequest,
  { rejectValue: string }
>("order/createOrder", async (payload, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post("/api/Order", payload);

    const envelope = resolveApiData(res.data);
    const items = extractItemsArray(envelope);
    if (Array.isArray(items) && items.length > 0)
      return normalizeOrderResponse(items[0] as RawOrderResponse);
    if (
      isApiEnvelope(envelope) &&
      envelope.data &&
      typeof envelope.data === "object"
    ) {
      const dataObj = envelope.data as Record<string, unknown>;
      if ("items" in dataObj || "restaurant" in dataObj) {
        return normalizeOrderResponse(dataObj as unknown as RawOrderResponse);
      }
      const idVal = dataObj["id"];
      if (typeof idVal === "number") {
        try {
          const detail = await axiosInstance.get(`/api/Order/${idVal}`);
          const env2 = resolveApiData(detail.data) as
            | ApiEnvelope<unknown>
            | unknown;
          const items2 = extractItemsArray(env2);
          if (Array.isArray(items2) && items2.length > 0)
            return normalizeOrderResponse(items2[0] as RawOrderResponse);
        } catch {
        }
        return normalizeOrderResponse({
          id: idVal,
          userId: payload.userId,
          restaurantId: payload.restaurantId,
          deliveryAddress: payload.deliveryAddress,
          recipientName: payload.recipientName,
          recipientPhone: payload.recipientPhone,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          items: (payload.items ?? []).map((i) => ({
            id: 0,
            dishId: i.dishId,
            dishName: "",
            quantity: i.quantity,
            totalPrice: 0,
          })),
          restaurant: {},
          totalPrice: 0,
          finalPrice: 0,
          status: OrderStatus.Pending,
          deliveryStatus: DeliveryStatus.Preparing,
        } as RawOrderResponse);
      }
    }
    if (Array.isArray(envelope) && envelope.length > 0)
      return normalizeOrderResponse(envelope[0] as RawOrderResponse);

    return rejectWithValue(
      isApiEnvelope(envelope) ? envelope.errMessage : "Không thể tạo đơn hàng"
    );
  } catch (e: unknown) {
    return rejectWithValue((e as Error)?.message ?? "Lỗi không xác định");
  }
});

export const addItemToOrder = createAsyncThunk<
  OrderResponse,
  {
    orderId: number;
    item: { dishId: number; quantity: number; totalPrice: number };
  },
  { rejectValue: string }
>("order/addItemToOrder", async ({ orderId, item }, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post(`/api/Order/${orderId}/items`, item);

    const envelope = resolveApiData(res.data);
    const items = extractItemsArray(envelope);
    if (Array.isArray(items) && items.length > 0)
      return normalizeOrderResponse(items[0] as RawOrderResponse);
    if (isApiEnvelope(envelope) && envelope.errCode === "success") {
      try {
        const fetched = await fetchOrderByIdInternal(orderId);
        if (fetched) return fetched;
      } catch {
      }


      const fallbackOrder: RawOrderResponse = {
        id: orderId,
        userId: 0,
        restaurantId: 0,
        deliveryAddress: "",
        recipientName: "",
        recipientPhone: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [],
        restaurant: {},
        totalPrice: 0,
        finalPrice: 0,
        status: OrderStatus.Pending,
        deliveryStatus: DeliveryStatus.Preparing,
      };
      return normalizeOrderResponse(fallbackOrder);
    }

    if (Array.isArray(envelope) && envelope.length > 0)
      return normalizeOrderResponse(envelope[0] as RawOrderResponse);

    return rejectWithValue(
      isApiEnvelope(envelope)
        ? envelope.errMessage
        : "Không thể thêm món vào đơn hàng"
    );
  } catch (e: unknown) {
    return rejectWithValue((e as Error)?.message ?? "Lỗi không xác định");
  }
});

export const fetchOrderById = createAsyncThunk<
  OrderResponse,
  number,
  { rejectValue: string }
>("order/fetchOrderById", async (id, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(`/api/Order/${id}`);

    const envelope = resolveApiData(res.data);
    const items = extractItemsArray(envelope);
    if (Array.isArray(items) && items.length > 0)
      return normalizeOrderResponse(items[0] as RawOrderResponse);

    return rejectWithValue(
      (isApiEnvelope(envelope) && envelope.errMessage) ||
        "Không tìm thấy đơn hàng"
    );
  } catch (e: unknown) {
    return rejectWithValue((e as Error)?.message ?? "Lỗi không xác định");
  }
});

export const updateOrder = createAsyncThunk<
  OrderResponse,
  { id: number; payload: OrderRequest },
  { rejectValue: string }
>("order/updateOrder", async ({ id, payload }, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.put(`/api/Order/${id}`, payload);

    const envelope = resolveApiData(res.data);
    const items = extractItemsArray(envelope);
    if (Array.isArray(items) && items.length > 0)
      return normalizeOrderResponse(items[0] as RawOrderResponse);

    return rejectWithValue(
      (isApiEnvelope(envelope) && envelope.errMessage) ||
        "Cập nhật đơn hàng thất bại"
    );
  } catch (e: unknown) {
    return rejectWithValue((e as Error)?.message ?? "Lỗi không xác định");
  }
});

export const deleteOrder = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("order/deleteOrder", async (id, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.delete(`/api/Order/${id}`);
    if (res.data?.errCode === "success" || res.status === 200) return id;
    return rejectWithValue(res.data?.errMessage || "Xóa đơn hàng thất bại");
  } catch (e: unknown) {
    return rejectWithValue((e as Error)?.message ?? "Lỗi không xác định");
  }
});

export const deleteOrderItem = createAsyncThunk<
  OrderResponse,
  { orderId: number; orderItemId: number },
  { rejectValue: string }
>(
  "order/deleteOrderItem",
  async ({ orderId, orderItemId }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(
        `/api/Order/${orderId}/items/${orderItemId}`
      );

      const envelope = resolveApiData(res.data);
      const items = extractItemsArray(envelope);
      if (Array.isArray(items) && items.length > 0)
        return normalizeOrderResponse(items[0] as RawOrderResponse);

      return rejectWithValue(
        (isApiEnvelope(envelope) && envelope.errMessage) ||
          "Không thể xóa món khỏi đơn hàng"
      );
    } catch (e: unknown) {
      return rejectWithValue((e as Error)?.message ?? "Lỗi không xác định");
    }
  }
);
export const fetchOrdersByUser = createAsyncThunk<
  OrderResponse[],
  number,
  { rejectValue: string }
>("order/fetchByUser", async (userId, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(`/api/Order/user/${userId}`);

    const envelope = resolveApiData(res.data);
    const items = extractItemsArray(envelope);
    if (Array.isArray(items))
      return (items as RawOrderResponse[]).map((it) =>
        normalizeOrderResponse(it)
      );
    return rejectWithValue(
      (isApiEnvelope(envelope) && envelope.errMessage) ||
        "Không thể lấy danh sách đơn hàng của người dùng"
    );
  } catch (e: unknown) {
    return rejectWithValue((e as Error)?.message ?? "Lỗi không xác định");
  }
});

export const fetchOrdersByStatus = createAsyncThunk<
  OrderResponse[],
  string,
  { rejectValue: string }
>("order/fetchByStatus", async (status, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(`/api/Order/status/${status}`);

    const envelope = resolveApiData(res.data);
    const items = extractItemsArray(envelope);
    if (Array.isArray(items))
      return (items as RawOrderResponse[]).map((it) =>
        normalizeOrderResponse(it)
      );
    return rejectWithValue(
      (isApiEnvelope(envelope) && envelope.errMessage) ||
        "Không thể lấy danh sách đơn hàng theo trạng thái"
    );
  } catch (e: unknown) {
    return rejectWithValue((e as Error)?.message ?? "Lỗi không xác định");
  }
});

export const updateOrderStatus = createAsyncThunk<
  OrderResponse,
  { id: number; status: OrderStatus },
  { rejectValue: string }
>("order/updateStatus", async ({ id, status }, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.patch(`/api/Order/${id}/status`, undefined, {
      params: { newStatus: status },
    });

    const envelope = resolveApiData(res.data);
    const items = extractItemsArray(envelope);
    if (Array.isArray(items) && items.length > 0)
      return normalizeOrderResponse(items[0] as RawOrderResponse);

    return rejectWithValue(
      (isApiEnvelope(envelope) && envelope.errMessage) ||
        "Cập nhật trạng thái đơn hàng thất bại"
    );
  } catch (e: unknown) {
    return rejectWithValue((e as Error)?.message ?? "Lỗi không xác định");
  }
});

export const updateDeliveryStatus = createAsyncThunk<
  OrderResponse,
  { id: number; deliveryStatus: DeliveryStatus },
  { rejectValue: string }
>(
  "order/updateDelivery",
  async ({ id, deliveryStatus }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.patch(
        `/api/Order/${id}/delivery-status`,
        undefined,
        { params: { newStatus: deliveryStatus } }
      );

      const envelope = resolveApiData(res.data);
      const items = extractItemsArray(envelope);
      if (Array.isArray(items) && items.length > 0)
        return normalizeOrderResponse(items[0] as RawOrderResponse);

      return rejectWithValue(
        (isApiEnvelope(envelope) && envelope.errMessage) ||
          "Cập nhật trạng thái giao hàng thất bại"
      );
    } catch (e: unknown) {
      return rejectWithValue((e as Error)?.message ?? "Lỗi không xác định");
    }
  }
);

export const fetchRestaurantRevenue = createAsyncThunk<
  RestaurantRevenue | null,
  { restaurantId: number; year?: number; month?: number },
  { rejectValue: string }
>(
  "order/fetchRestaurantRevenue",
  async ({ restaurantId, year, month }, { rejectWithValue }) => {
    try {
      const params: Record<string, unknown> = {};
      if (year) params.year = year;
      if (month) params.month = month;
      const res = await axiosInstance.get(
        `/api/Order/restaurant/${restaurantId}/revenue`,
        { params }
      );
      return res.data?.data ?? res.data ?? null;
    } catch (e: unknown) {
      return rejectWithValue((e as Error)?.message ?? "Lỗi không xác định");
    }
  }
);


const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    setOrders: (state, action: PayloadAction<OrderResponse[]>) => {
      state.orders = action.payload;
    },
    setSelectedOrder: (state, action: PayloadAction<OrderResponse | null>) => {
      state.selectedOrder = action.payload;
    },
    clearOrders: (state) => {
      state.orders = [];
      state.selectedOrder = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.fulfilled, (state, action) => {
        state.orders.push(action.payload);
      })
      .addCase(addItemToOrder.fulfilled, (state, action) => {
        const idx = state.orders.findIndex((o) => o.id === action.payload.id);
        if (idx !== -1) state.orders[idx] = action.payload;
        else state.orders.push(action.payload);
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.selectedOrder = action.payload;
      })
      .addCase(updateOrder.fulfilled, (state, action) => {
        const idx = state.orders.findIndex((o) => o.id === action.payload.id);
        if (idx !== -1) state.orders[idx] = action.payload;
      })
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.orders = state.orders.filter((o) => o.id !== action.payload);
      })
      .addCase(deleteOrderItem.fulfilled, (state, action) => {
        const idx = state.orders.findIndex((o) => o.id === action.payload.id);
        if (idx !== -1) state.orders[idx] = action.payload;
      })
      .addCase(fetchOrdersByUser.fulfilled, (state, action) => {
        state.orders = action.payload;
      })
      .addCase(fetchOrdersByStatus.fulfilled, (state, action) => {
        state.orders = action.payload;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const idx = state.orders.findIndex((o) => o.id === action.payload.id);
        if (idx !== -1) state.orders[idx] = action.payload;
      })
      .addCase(updateDeliveryStatus.fulfilled, (state, action) => {
        const idx = state.orders.findIndex((o) => o.id === action.payload.id);
        if (idx !== -1) state.orders[idx] = action.payload;
      })
      .addCase(fetchRestaurantRevenue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchRestaurantRevenue.fulfilled,
        (
          state,
          action: PayloadAction<
            RestaurantRevenue | null,
            string,
            { arg: { restaurantId: number; year?: number; month?: number } }
          >
        ) => {
          state.loading = false;
          const argRestaurantId = action.meta?.arg?.restaurantId;

          const payload = action.payload;
          if (payload) {
            const key = (payload.restaurantId ?? argRestaurantId) as number;
            if (typeof key === "number") {

              state.revenueByRestaurant[key] = {
                ...(payload as RestaurantRevenue),
                restaurantId: (payload as RestaurantRevenue).restaurantId ?? key,
              };
            }
          }
        }
      )
      .addCase(fetchRestaurantRevenue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Không lấy được doanh thu";
      })
      .addMatcher(
        (a) => a.type.startsWith("order/") && a.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (a) => a.type.startsWith("order/") && a.type.endsWith("/fulfilled"),
        (state) => {
          state.loading = false;
        }
      )
      .addMatcher(
        (a) => a.type.startsWith("order/") && a.type.endsWith("/rejected"),
        (state, action: AnyAction) => {
          state.loading = false;
          state.error =
            action.payload ?? action.error?.message ?? "Thao tác thất bại";
        }
      );
  },
});

export const { setOrders, setSelectedOrder, clearOrders } = orderSlice.actions;
export default orderSlice.reducer;