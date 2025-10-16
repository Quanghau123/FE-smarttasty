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
  normalizeOrderResponse,
  OrderStatus,
  DeliveryStatus,
} from "@/types/order";

/* -------------------------------------------------------------------------- */
/*                                 STATE TYPE                                 */
/* -------------------------------------------------------------------------- */

interface OrderState {
  orders: OrderResponse[];
  selectedOrder: OrderResponse | null;
  loading: boolean;
  error: string | null;
  activeOrderByRestaurant: Record<number, number>;
}

const initialState: OrderState = {
  orders: [],
  selectedOrder: null,
  loading: false,
  error: null,
  activeOrderByRestaurant: {},
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

// Helper: if API returns only { data: { id: number } } or a single object,
// fetch the full order by id or normalize the provided object.
const fetchOrderByIdInternal = async (
  id: number
): Promise<OrderResponse | null> => {
  try {
    const token = getToken();
    const res = await axiosInstance.get(`/api/Order/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    const envelope = resolveApiData(res.data) as ApiEnvelope<unknown> | unknown;
    const items =
      isApiEnvelope(envelope) && Array.isArray(envelope.data)
        ? (envelope.data as unknown[])
        : Array.isArray(envelope)
        ? (envelope as unknown[])
        : null;

    if (Array.isArray(items) && items.length > 0)
      return normalizeOrderResponse(items[0]);

    // If the envelope contains a single object in data
    if (
      isApiEnvelope(envelope) &&
      envelope.data &&
      typeof envelope.data === "object"
    ) {
      const d = envelope.data as Record<string, unknown>;
      if (d && typeof d["id"] === "number") return normalizeOrderResponse(d);
    }

    // If the response itself is an object representing the order
    if (envelope && typeof envelope === "object") {
      const obj = envelope as Record<string, unknown>;
      if (typeof obj["id"] === "number") {
        return normalizeOrderResponse(obj);
      }
    }

    return null;
  } catch {
    return null;
  }
};

/* -------------------------------------------------------------------------- */
/*                                  THUNKS                                    */
/* -------------------------------------------------------------------------- */

// 1️⃣ POST /api/Order - Tạo đơn hàng mới
export const createOrder = createAsyncThunk<
  OrderResponse,
  OrderRequest,
  { rejectValue: string }
>("order/createOrder", async (payload, { rejectWithValue }) => {
  try {
    const token = getToken();
    const res = await axiosInstance.post("/api/Order", payload, {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        : { "Content-Type": "application/json" },
    });

    const envelope = resolveApiData(res.data);
    // Trường hợp BE trả về danh sách order trong data
    if (isApiEnvelope(envelope) && Array.isArray(envelope.data)) {
      const items = envelope.data as unknown[];
      if (items.length > 0) return normalizeOrderResponse(items[0]);
    }

    // Trường hợp BE trả về object data
    if (
      isApiEnvelope(envelope) &&
      envelope.data &&
      typeof envelope.data === "object"
    ) {
      const dataObj = envelope.data as Record<string, unknown>;
      // Nếu BE trả về full object order
      if ("items" in dataObj || "restaurant" in dataObj) {
        return normalizeOrderResponse(dataObj);
      }
      // Nếu chỉ có id -> thử fetch chi tiết đơn hàng rồi trả về
      const idVal = dataObj["id"];
      if (typeof idVal === "number") {
        try {
          const token2 = getToken();
          const detail = await axiosInstance.get(`/api/Order/${idVal}`, {
            headers: token2 ? { Authorization: `Bearer ${token2}` } : undefined,
          });
          const env2 = resolveApiData(detail.data) as
            | ApiEnvelope<unknown>
            | unknown;
          const items2 = Array.isArray((env2 as ApiEnvelope<unknown>)?.data)
            ? ((env2 as ApiEnvelope<unknown>).data as unknown[])
            : Array.isArray(env2)
            ? (env2 as unknown[])
            : null;
          if (Array.isArray(items2) && items2.length > 0)
            return normalizeOrderResponse(items2[0]);
        } catch {
          // ignore, fallback phía dưới
        }
        // Fallback: dựng object tối thiểu từ payload
        return normalizeOrderResponse({
          id: idVal,
          userId: payload.userId,
          restaurantId: payload.restaurantId,
          deliveryAddress: payload.deliveryAddress,
          recipientName: payload.recipientName,
          recipientPhone: payload.recipientPhone,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          items: payload.items ?? [],
          restaurant: {},
          totalPrice: 0,
          finalPrice: 0,
          status: OrderStatus.Pending,
          deliveryStatus: DeliveryStatus.Preparing,
        });
      }
    }

    // Trường hợp BE trả về mảng trực tiếp
    if (Array.isArray(envelope) && envelope.length > 0)
      return normalizeOrderResponse(envelope[0]);

    return rejectWithValue(
      isApiEnvelope(envelope) ? envelope.errMessage : "Không thể tạo đơn hàng"
    );
  } catch (e: unknown) {
    return rejectWithValue((e as Error)?.message ?? "Lỗi không xác định");
  }
});

// 2️⃣ POST /api/Order/{id}/items - thêm món vào đơn hàng
export const addItemToOrder = createAsyncThunk<
  OrderResponse,
  {
    orderId: number;
    item: { dishId: number; quantity: number; totalPrice: number };
  },
  { rejectValue: string }
>("order/addItemToOrder", async ({ orderId, item }, { rejectWithValue }) => {
  try {
    const token = getToken();
    const res = await axiosInstance.post(`/api/Order/${orderId}/items`, item, {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        : { "Content-Type": "application/json" },
    });

    const envelope = resolveApiData(res.data);
    // Nếu BE trả về mảng order trong data
    if (isApiEnvelope(envelope) && Array.isArray(envelope.data)) {
      const items = envelope.data as unknown[];
      if (items.length > 0) return normalizeOrderResponse(items[0]);
    }

    // Nếu BE trả về success nhưng data không phải mảng -> xem như thành công,
    // cố gắng lấy chi tiết đơn hàng; nếu thất bại thì trả về một order tối thiểu
    // để frontend coi là thành công (tránh hiển thị toast lỗi mặc dù BE trả success).
    if (isApiEnvelope(envelope) && envelope.errCode === "success") {
      try {
        const fetched = await fetchOrderByIdInternal(orderId);
        if (fetched) return fetched;
      } catch {
        // ignore
      }

      // Fallback: tạo một OrderResponse tối thiểu để coi là thành công
      const fallbackOrder = {
        id: orderId,
        userId: 0,
        restaurantId: 0,
        deliveryAddress: "",
        recipientName: "",
        recipientPhone: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [] as unknown[],
        restaurant: {} as Record<string, unknown>,
        totalPrice: 0,
        finalPrice: 0,
        status: OrderStatus.Pending,
        deliveryStatus: DeliveryStatus.Preparing,
      };
      return normalizeOrderResponse(fallbackOrder);
    }

    // Trường hợp trả về mảng trực tiếp
    if (Array.isArray(envelope) && envelope.length > 0)
      return normalizeOrderResponse(envelope[0]);

    return rejectWithValue(
      isApiEnvelope(envelope)
        ? envelope.errMessage
        : "Không thể thêm món vào đơn hàng"
    );
  } catch (e: unknown) {
    return rejectWithValue((e as Error)?.message ?? "Lỗi không xác định");
  }
});

// 3️⃣ GET /api/Order/{id}
export const fetchOrderById = createAsyncThunk<
  OrderResponse,
  number,
  { rejectValue: string }
>("order/fetchOrderById", async (id, { rejectWithValue }) => {
  try {
    const token = getToken();
    const res = await axiosInstance.get(`/api/Order/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    const envelope = resolveApiData(res.data) as ApiEnvelope<unknown> | unknown;
    const items = Array.isArray((envelope as ApiEnvelope<unknown>)?.data)
      ? ((envelope as ApiEnvelope<unknown>).data as unknown[])
      : Array.isArray(envelope)
      ? (envelope as unknown[])
      : null;

    if (Array.isArray(items) && items.length > 0)
      return normalizeOrderResponse(items[0]);

    return rejectWithValue(
      (envelope as ApiEnvelope<unknown>)?.errMessage ||
        "Không tìm thấy đơn hàng"
    );
  } catch (e: unknown) {
    return rejectWithValue((e as Error)?.message ?? "Lỗi không xác định");
  }
});

// 4️⃣ PUT /api/Order/{id} - Cập nhật đơn hàng
export const updateOrder = createAsyncThunk<
  OrderResponse,
  { id: number; payload: OrderRequest },
  { rejectValue: string }
>("order/updateOrder", async ({ id, payload }, { rejectWithValue }) => {
  try {
    const token = getToken();
    const res = await axiosInstance.put(`/api/Order/${id}`, payload, {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        : { "Content-Type": "application/json" },
    });

    const envelope = resolveApiData(res.data);
    const items =
      isApiEnvelope(envelope) && Array.isArray(envelope.data)
        ? (envelope.data as unknown[])
        : Array.isArray(envelope)
        ? (envelope as unknown[])
        : null;

    if (Array.isArray(items) && items.length > 0)
      return normalizeOrderResponse(items[0]);

    return rejectWithValue(
      (envelope as ApiEnvelope<unknown>)?.errMessage ||
        "Cập nhật đơn hàng thất bại"
    );
  } catch (e: unknown) {
    return rejectWithValue((e as Error)?.message ?? "Lỗi không xác định");
  }
});

// 5️⃣ DELETE /api/Order/{id}
export const deleteOrder = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("order/deleteOrder", async (id, { rejectWithValue }) => {
  try {
    const token = getToken();
    const res = await axiosInstance.delete(`/api/Order/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (res.data?.errCode === "success" || res.status === 200) return id;
    return rejectWithValue(res.data?.errMessage || "Xóa đơn hàng thất bại");
  } catch (e: unknown) {
    return rejectWithValue((e as Error)?.message ?? "Lỗi không xác định");
  }
});

// 6️⃣ DELETE /api/Order/{orderId}/items/{orderItemId}
export const deleteOrderItem = createAsyncThunk<
  OrderResponse,
  { orderId: number; orderItemId: number },
  { rejectValue: string }
>(
  "order/deleteOrderItem",
  async ({ orderId, orderItemId }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await axiosInstance.delete(
        `/api/Order/${orderId}/items/${orderItemId}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );

      const envelope = resolveApiData(res.data);
      const items =
        isApiEnvelope(envelope) && Array.isArray(envelope.data)
          ? (envelope.data as unknown[])
          : Array.isArray(envelope)
          ? (envelope as unknown[])
          : null;

      if (Array.isArray(items) && items.length > 0)
        return normalizeOrderResponse(items[0]);

      return rejectWithValue(
        (envelope as ApiEnvelope<unknown>)?.errMessage ||
          "Không thể xóa món khỏi đơn hàng"
      );
    } catch (e: unknown) {
      return rejectWithValue((e as Error)?.message ?? "Lỗi không xác định");
    }
  }
);

// 7️⃣ GET /api/Order/user/{userId}
export const fetchOrdersByUser = createAsyncThunk<
  OrderResponse[],
  number,
  { rejectValue: string }
>("order/fetchByUser", async (userId, { rejectWithValue }) => {
  try {
    const token = getToken();
    const res = await axiosInstance.get(`/api/Order/user/${userId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    const envelope = resolveApiData(res.data) as ApiEnvelope<unknown> | unknown;
    const items = Array.isArray((envelope as ApiEnvelope<unknown>)?.data)
      ? ((envelope as ApiEnvelope<unknown>).data as unknown[])
      : Array.isArray(envelope)
      ? (envelope as unknown[])
      : null;

    if (Array.isArray(items)) return items.map(normalizeOrderResponse);
    return rejectWithValue(
      (envelope as ApiEnvelope<unknown>)?.errMessage ||
        "Không thể lấy danh sách đơn hàng của người dùng"
    );
  } catch (e: unknown) {
    return rejectWithValue((e as Error)?.message ?? "Lỗi không xác định");
  }
});

// 8️⃣ GET /api/Order/status/{status}
export const fetchOrdersByStatus = createAsyncThunk<
  OrderResponse[],
  string,
  { rejectValue: string }
>("order/fetchByStatus", async (status, { rejectWithValue }) => {
  try {
    const token = getToken();
    const res = await axiosInstance.get(`/api/Order/status/${status}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    const envelope = resolveApiData(res.data);
    const items =
      isApiEnvelope(envelope) && Array.isArray(envelope.data)
        ? (envelope.data as unknown[])
        : Array.isArray(envelope)
        ? (envelope as unknown[])
        : null;

    if (Array.isArray(items)) return items.map(normalizeOrderResponse);
    return rejectWithValue(
      (envelope as ApiEnvelope<unknown>)?.errMessage ||
        "Không thể lấy danh sách đơn hàng theo trạng thái"
    );
  } catch (e: unknown) {
    return rejectWithValue((e as Error)?.message ?? "Lỗi không xác định");
  }
});

// 9️⃣ PATCH /api/Order/{id}/status
export const updateOrderStatus = createAsyncThunk<
  OrderResponse,
  { id: number; status: OrderStatus },
  { rejectValue: string }
>("order/updateStatus", async ({ id, status }, { rejectWithValue }) => {
  try {
    const token = getToken();
    const res = await axiosInstance.patch(
      `/api/Order/${id}/status`,
      { status },
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
    const items =
      isApiEnvelope(envelope) && Array.isArray(envelope.data)
        ? (envelope.data as unknown[])
        : Array.isArray(envelope)
        ? (envelope as unknown[])
        : null;

    if (Array.isArray(items) && items.length > 0)
      return normalizeOrderResponse(items[0]);

    return rejectWithValue(
      (envelope as ApiEnvelope<unknown>)?.errMessage ||
        "Cập nhật trạng thái đơn hàng thất bại"
    );
  } catch (e: unknown) {
    return rejectWithValue((e as Error)?.message ?? "Lỗi không xác định");
  }
});

// 🔟 PATCH /api/Order/{id}/delivery-status
export const updateDeliveryStatus = createAsyncThunk<
  OrderResponse,
  { id: number; deliveryStatus: DeliveryStatus },
  { rejectValue: string }
>(
  "order/updateDelivery",
  async ({ id, deliveryStatus }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await axiosInstance.patch(
        `/api/Order/${id}/delivery-status`,
        { deliveryStatus },
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
      const items =
        isApiEnvelope(envelope) && Array.isArray(envelope.data)
          ? (envelope.data as unknown[])
          : Array.isArray(envelope)
          ? (envelope as unknown[])
          : null;

      if (Array.isArray(items) && items.length > 0)
        return normalizeOrderResponse(items[0]);

      return rejectWithValue(
        (envelope as ApiEnvelope<unknown>)?.errMessage ||
          "Cập nhật trạng thái giao hàng thất bại"
      );
    } catch (e: unknown) {
      return rejectWithValue((e as Error)?.message ?? "Lỗi không xác định");
    }
  }
);

/* -------------------------------------------------------------------------- */
/*                                   SLICE                                    */
/* -------------------------------------------------------------------------- */

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
