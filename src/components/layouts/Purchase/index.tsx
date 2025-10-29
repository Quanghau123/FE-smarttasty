"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  Chip,
  Stack,
  CircularProgress,
  Container,
} from "@mui/material";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { fetchOrderById, fetchOrdersByUser } from "@/redux/slices/orderSlice";
import { useRouter, useSearchParams } from "next/navigation";
import { OrderResponse } from "@/types/order";
import { Payment as PaymentType, InfoPayment } from "@/types/payment";
import { fetchPaymentHistoryByUser } from "@/redux/slices/paymentSlice";

const OrdersPage = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const params = useSearchParams();

  const selectedOrder = useAppSelector((s) => s.order.selectedOrder);
  const userData =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const paymentState = useAppSelector((s) => s.payment);
  const history = paymentState.history;

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      // 1) Try to read order id from query ?id=
      const idParam = params?.get("id");
      const checkoutStored =
        typeof window !== "undefined"
          ? localStorage.getItem("checkoutOrder")
          : null;

      if (idParam) {
        const id = Number(idParam);
        if (!Number.isNaN(id) && id > 0) {
          const res = await dispatch(fetchOrderById(id)).unwrap();
          if (res) setOrder(res);
          setLoading(false);
          return;
        }
      }

      // 2) If checkoutOrder in LS exists (created right before payment), use it
      if (checkoutStored) {
        try {
          const parsed = JSON.parse(checkoutStored) as Partial<OrderResponse>;
          if (parsed && parsed.id) {
            const res = await dispatch(fetchOrderById(parsed.id)).unwrap();
            if (res) setOrder(res);
            setLoading(false);
            return;
          }
        } catch {
          // ignore and fallback
        }
      }

      // 3) Fallback: try to fetch orders by user and show the most recent one
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData as string) as {
            id?: number;
            userId?: number;
          };
          const uid = parsedUser.userId ?? parsedUser.id;
          if (uid) {
            // fetch latest order
            const orders = await dispatch(fetchOrdersByUser(uid)).unwrap();
            if (orders && orders.length > 0) setOrder(orders[0]);
            // fetch payment history for this user as well
            void dispatch(fetchPaymentHistoryByUser({ userId: uid }));
            setLoading(false);
            return;
          }
        } catch {
          // ignore
        }
      }

      // 4) If nothing found, use selectedOrder from store
      if (selectedOrder) setOrder(selectedOrder);
      setLoading(false);
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  if (loading)
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  if (!order)
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 6, textAlign: "center" }}>
          <ShoppingCartOutlinedIcon
            sx={{ fontSize: 80, color: "text.disabled", mb: 2 }}
          />
          <Typography variant="h6" color="text.secondary" mb={2}>
            Bạn chưa có đơn hàng nào
          </Typography>
        </Paper>
      </Container>
    );

  return (
    <Box p={3}>
      {/* Lịch sử đơn hàng của tôi */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" mb={1}>
          Lịch sử đặt hàng
        </Typography>
        {paymentState.loading && history.length === 0 ? (
          <Typography>Đang tải lịch sử...</Typography>
        ) : paymentState.error ? (
          <Typography color="error">{paymentState.error}</Typography>
        ) : history.length === 0 ? (
          <Box textAlign="center" py={2}>
            <ShoppingCartOutlinedIcon
              sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
            />
            <Typography color="text.secondary">
              Chưa có đơn hàng nào.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1}>
            {history.map((h: InfoPayment) => (
              <Paper key={h.id} variant="outlined" sx={{ p: 1.5 }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  flexWrap="wrap"
                  gap={1}
                >
                  <Box>
                    <Typography fontWeight={600}>ĐH #{h.order.id}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(h.order.createdAt).toLocaleString()}
                    </Typography>
                    <Typography variant="body2">
                      Nhà hàng:{" "}
                      {h.order.restaurant?.name || `#${h.order.restaurantId}`}
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Chip
                      label={`TT: ${h.status}`}
                      color={
                        h.status === "Success"
                          ? "success"
                          : h.status === "Pending"
                          ? "warning"
                          : "default"
                      }
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Typography fontWeight={700}>
                      {Number(h.amount).toLocaleString()}đ
                    </Typography>
                    <Button
                      size="small"
                      sx={{ mt: 0.5 }}
                      variant="text"
                      onClick={() =>
                        router.push(`/vi/purchase?id=${h.order.id}`)
                      }
                    >
                      Xem chi tiết
                    </Button>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>

      <Typography variant="h5" fontWeight="bold" mb={2}>
        Đơn hàng #{order.id}
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1">Nhà hàng</Typography>
        <Typography>
          {order.restaurant?.name || `Nhà hàng #${order.restaurantId}`}
        </Typography>
        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle1">Thông tin người nhận</Typography>
        <Typography>
          {order.recipientName} • {order.recipientPhone}
        </Typography>
        <Typography>{order.deliveryAddress}</Typography>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1">Món đã đặt</Typography>
        {order.items.map((it) => (
          <Box key={it.id} display="flex" justifyContent="space-between" mt={1}>
            <Typography>
              {it.dishName} × {it.quantity}
            </Typography>
            <Typography>{it.totalPrice?.toLocaleString()}đ</Typography>
          </Box>
        ))}

        <Divider sx={{ my: 1 }} />
        <Typography fontWeight="bold">
          Tổng: {order.finalPrice?.toLocaleString()}đ
        </Typography>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1">Trạng thái</Typography>
        <Typography>{order.status}</Typography>

        {/* If payment info exists in selectedPayment slice we can render it */}
        {/* Try to read payment from window.localStorage 'lastPayment' if backend doesn't return payment object */}
        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle1">Thanh toán</Typography>
        {/* payment info: try to read from localStorage.payment or window.selectedPayment (best-effort) */}
        {(() => {
          try {
            const raw =
              typeof window !== "undefined"
                ? localStorage.getItem("lastPayment")
                : null;
            if (raw) {
              const p = JSON.parse(raw) as PaymentType;
              return (
                <Box>
                  <Typography>Phương thức: {p.method}</Typography>
                  <Typography>Trạng thái: {p.status}</Typography>
                  {p.paymentUrl && (
                    <Typography>
                      URL: <a href={p.paymentUrl}>{p.paymentUrl}</a>
                    </Typography>
                  )}
                </Box>
              );
            }
          } catch {
            /* ignore */
          }
          return <Typography>Không có thông tin thanh toán</Typography>;
        })()}
      </Paper>
    </Box>
  );
};

export default OrdersPage;
