"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios/axiosInstance";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import {
  Box,
  Typography,
  Divider,
  CircularProgress,
  Paper,
  Button,
  TextField,
} from "@mui/material";
import {
  fetchOrdersByUser,
  setSelectedOrder,
  deleteOrder,
} from "@/redux/slices/orderSlice";
import { addItemToOrder } from "@/redux/slices/orderSlice";

// Order types are available in the redux state; no direct import required here
const CartPage = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { orders, selectedOrder, loading, error } = useAppSelector(
    (state) => state.order
  );

  const [updatingItem, setUpdatingItem] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!token) {
      console.warn("⚠️ Không có token => chưa đăng nhập");
      return;
    }

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const userId = parsedUser.id || parsedUser.userId;
        if (userId) dispatch(fetchOrdersByUser(userId));
      } catch (e) {
        console.error("Lỗi parse user từ localStorage:", e);
      }
    }
  }, [dispatch]);

  useEffect(() => {
    if (orders.length > 0 && !selectedOrder) {
      const pendingOrder =
        orders.find(
          (o) => (o.status ?? "").toString().toLowerCase() === "pending"
        ) || orders[0];
      dispatch(setSelectedOrder(pendingOrder));
    }
  }, [orders, selectedOrder, dispatch]);

  // 🗑️ Xoá đơn hàng
  const handleDeleteOrder = async (orderId: number) => {
    if (confirm("Bạn có chắc muốn xoá đơn hàng này?")) {
      await dispatch(deleteOrder(orderId));
    }
  };

  // 🗑️ Xoá món khỏi đơn hàng
  const handleRemoveItem = async (orderId: number, orderItemId: number) => {
    if (!confirm("Bạn có chắc muốn xoá món này khỏi đơn hàng?")) return;
    try {
      await axiosInstance.delete(`/api/Order/${orderId}/items/${orderItemId}`);
      alert("✅ Xoá món thành công");
      if (selectedOrder?.userId)
        dispatch(fetchOrdersByUser(selectedOrder.userId));
    } catch (err) {
      console.error("Lỗi xoá món:", err);
      alert("❌ Không thể xoá món");
    }
  };

  // (thêm món hiện handled bởi thunks in orderSlice; component doesn't call handleAddItem directly)

  // ✏️ Cập nhật số lượng món
  const handleUpdateItemQuantity = async (
    orderId: number,
    itemId: number,
    newQuantity: number
  ) => {
    if (newQuantity <= 0) {
      alert("Số lượng phải lớn hơn 0!");
      return;
    }
    setUpdatingItem(true);
    try {
      // Use POST /api/Order/{orderId}/items to update or add item quantity
      const order = orders.find((o) => o.id === orderId);
      const orderItem = order?.items?.find((it) => it.id === itemId);
      const dishId = orderItem?.dishId;
      if (!dishId) throw new Error("Không tìm thấy dishId của món");

      await dispatch(
        addItemToOrder({
          orderId,
          item: { dishId, quantity: newQuantity, totalPrice: 0 },
        })
      );

      alert("✅ Cập nhật số lượng thành công!");
      if (selectedOrder?.userId)
        dispatch(fetchOrdersByUser(selectedOrder.userId));
    } catch (error) {
      console.error("Lỗi cập nhật số lượng:", error);
      alert("❌ Không thể cập nhật số lượng món!");
    } finally {
      setUpdatingItem(false);
    }
  };

  // 💳 Thanh toán đơn hàng
  const handleCheckout = (orderId: number) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      alert("Không tìm thấy đơn hàng để thanh toán!");
      return;
    }

    // 🔹 Lưu thông tin đơn hàng vào localStorage (để PaymentPage đọc lại)
    localStorage.setItem("checkoutOrder", JSON.stringify(order));

    // 🔹 Chuyển sang trang thanh toán
    router.push("/payment");
  };

  // ➕ Mở trang thêm món
  const handleAddMore = (restaurantId: number) => {
    router.push(`/RestaurantDetails/${restaurantId}`);
  };

  if (loading)
    return (
      <Box p={4} display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Box p={3}>
        <Typography color="error">Lỗi khi tải đơn hàng: {error}</Typography>
      </Box>
    );

  if (orders.length === 0)
    return (
      <Box p={3}>
        <Typography>Không có đơn hàng nào.</Typography>
      </Box>
    );

  return (
    <Box p={3}>
      <Typography variant="h5" mb={2}>
        🛍️ Giỏ hàng của bạn
      </Typography>

      {orders.map((order) => {
        const maybeRestaurant = order as unknown as Record<string, unknown>;
        const restObj =
          maybeRestaurant?.restaurant &&
          typeof maybeRestaurant.restaurant === "object"
            ? (maybeRestaurant.restaurant as Record<string, unknown>)
            : null;
        const restaurantName =
          (restObj && typeof restObj["name"] === "string"
            ? (restObj["name"] as string)
            : null) ||
          `Nhà hàng #${order.restaurantId}` ||
          "Nhà hàng không xác định";
        const restaurantAddress =
          (restObj && typeof restObj["address"] === "string"
            ? (restObj["address"] as string)
            : null) || "Chưa có địa chỉ";

        return (
          <Paper key={order.id} sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" color="primary">
              🍽️ {restaurantName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Địa chỉ: {restaurantAddress}
            </Typography>
            <Divider sx={{ my: 1 }} />

            {order.items?.length > 0 ? (
              order.items.map((item) => {
                const qty = Number(item.quantity ?? 0);
                const unitPrice =
                  typeof item.totalPrice === "number" && qty > 0
                    ? Math.round(item.totalPrice / qty)
                    : 0;
                const total =
                  typeof item.totalPrice === "number"
                    ? item.totalPrice
                    : unitPrice * qty;

                return (
                  <Box
                    key={item.id}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mt={1}
                  >
                    <Box>
                      <Typography fontWeight="bold">{item.dishName}</Typography>
                      <Typography variant="body2">
                        SL: {qty} × {unitPrice.toLocaleString()}đ ={" "}
                        {total.toLocaleString()}đ
                      </Typography>

                      <Box mt={1}>
                        <TextField
                          size="small"
                          type="number"
                          label="Số lượng"
                          defaultValue={qty}
                          onBlur={(e) =>
                            handleUpdateItemQuantity(
                              order.id,
                              item.id,
                              parseInt(e.target.value)
                            )
                          }
                          disabled={updatingItem}
                          sx={{ width: "100px" }}
                        />
                      </Box>
                    </Box>

                    <Box>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleRemoveItem(order.id, item.id)}
                      >
                        Xoá
                      </Button>
                    </Box>
                  </Box>
                );
              })
            ) : (
              <Typography variant="body2" color="text.secondary">
                Không có món ăn nào trong đơn này.
              </Typography>
            )}

            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle1" fontWeight="bold">
              Tổng cộng:{" "}
              {(
                order.items?.reduce(
                  (sum, i) =>
                    sum + (typeof i.totalPrice === "number" ? i.totalPrice : 0),
                  0
                ) || 0
              ).toLocaleString()}
              đ
            </Typography>

            <Button
              sx={{ mt: 1, mr: 2 }}
              variant="contained"
              color="primary"
              onClick={() => handleAddMore(order.restaurantId)}
            >
              ➕ Thêm món
            </Button>

            <Button
              sx={{ mt: 1, mr: 2 }}
              variant="outlined"
              color="success"
              onClick={() => handleCheckout(order.id)}
            >
              💳 Thanh toán
            </Button>

            <Button
              sx={{ mt: 1 }}
              variant="outlined"
              color="error"
              onClick={() => handleDeleteOrder(order.id)}
            >
              Xoá đơn
            </Button>
          </Paper>
        );
      })}
    </Box>
  );
};

export default CartPage;
