"use client";

import { useEffect, useState } from "react";
import { Box, Typography, Paper, Divider, Button } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { fetchOrderById, fetchOrdersByUser } from "@/redux/slices/orderSlice";
import { useRouter, useSearchParams } from "next/navigation";
import { OrderResponse } from "@/types/order";
import { Payment as PaymentType } from "@/types/payment";

const OrdersPage = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const params = useSearchParams();

  const selectedOrder = useAppSelector((s) => s.order.selectedOrder);
  const userData =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(false);

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
          const res = await dispatch(fetchOrderById(id));
          if ((res as any).payload)
            setOrder((res as any).payload as OrderResponse);
          setLoading(false);
          return;
        }
      }

      // 2) If checkoutOrder in LS exists (created right before payment), use it
      if (checkoutStored) {
        try {
          const parsed = JSON.parse(checkoutStored) as Partial<OrderResponse>;
          if (parsed && parsed.id) {
            const res = await dispatch(fetchOrderById(parsed.id));
            if ((res as any).payload)
              setOrder((res as any).payload as OrderResponse);
            setLoading(false);
            return;
          }
        } catch (e) {
          // ignore and fallback
        }
      }

      // 3) Fallback: try to fetch orders by user and show the most recent one
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData as string) as { id?: number };
          if (parsedUser?.id) {
            const res = await dispatch(fetchOrdersByUser(parsedUser.id));
            const payload = (res as any).payload as OrderResponse[] | undefined;
            if (payload && payload.length > 0) setOrder(payload[0]);
            setLoading(false);
            return;
          }
        } catch (e) {
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

  if (loading) return <Typography>PLease wait...</Typography>;
  if (!order)
    return (
      <Box p={3}>
        <Typography variant="h6">Không tìm thấy đơn hàng</Typography>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => router.push("/")}
        >
          Về trang chủ
        </Button>
      </Box>
    );

  return (
    <Box p={3}>
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
          } catch (e) {
            /* ignore */
          }
          return <Typography>Không có thông tin thanh toán</Typography>;
        })()}
      </Paper>

      <Box mt={2}>
        <Button variant="contained" onClick={() => router.push("/")}>
          Quay về trang chủ
        </Button>
      </Box>
    </Box>
  );
};

export default OrdersPage;
