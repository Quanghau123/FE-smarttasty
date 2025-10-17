"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Divider,
  Paper,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import axiosInstance from "@/lib/axios/axiosInstance";
import { useRouter } from "next/navigation";

/* -------------------------------------------------------------------------- */
/*                               TYPE DEFINITIONS                             */
/* -------------------------------------------------------------------------- */
interface OrderItem {
  id: number;
  dishId: number;
  dishName: string;
  quantity: number;
  totalPrice: number;
}

interface Restaurant {
  id: number;
  name: string;
  address: string;
}

interface Order {
  id: number;
  restaurantId: number;
  restaurant?: Restaurant;
  items: OrderItem[];
}

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */
const PaymentPage = () => {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "VNPAY">("COD");
  const [loading, setLoading] = useState(false);

  /* --------------------------- LOAD ORDER FROM LS -------------------------- */
  useEffect(() => {
    const stored = localStorage.getItem("checkoutOrder");
    if (stored) {
      try {
        const parsed: Order = JSON.parse(stored);
        setOrder(parsed);
      } catch (error) {
        console.error("Invalid checkoutOrder format:", error);
        router.push("/cart");
      }
    } else {
      router.push("/cart");
    }
  }, [router]);

  /* ------------------------------ TOTAL PRICE ------------------------------ */
  const total = order?.items?.reduce(
    (sum, item) => sum + (item.totalPrice || 0),
    0
  );

  /* ---------------------------- HANDLE PAYMENT ----------------------------- */
  const handleConfirmPayment = async () => {
    if (!order) return;

    setLoading(true);
    try {
      const res = await axiosInstance.post<{ message: string }>(
        `/api/Payment/create`,
        {
          orderId: order.id,
          method: paymentMethod,
        }
      );

      alert("✅ Thanh toán thành công!");
      console.log("Payment result:", res.data);

      localStorage.removeItem("checkoutOrder");
      router.push("/orders");
    } catch (error) {
      console.error("❌ Lỗi thanh toán:", error);
      alert("Thanh toán thất bại!");
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

  /* ------------------------------- RENDER UI ------------------------------- */
  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        💳 Thanh toán đơn hàng
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" color="primary">
          🍽️ {order.restaurant?.name || `Nhà hàng #${order.restaurantId}`}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Địa chỉ: {order.restaurant?.address || "Chưa có địa chỉ"}
        </Typography>
        <Divider sx={{ my: 1 }} />

        {order.items?.map((item) => (
          <Box
            key={item.id}
            display="flex"
            justifyContent="space-between"
            mt={1}
          >
            <Typography>
              {item.dishName} × {item.quantity}
            </Typography>
            <Typography>{item.totalPrice.toLocaleString()}đ</Typography>
          </Box>
        ))}

        <Divider sx={{ my: 1 }} />
        <Typography fontWeight="bold">
          Tổng cộng: {total?.toLocaleString()}đ
        </Typography>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">Phương thức thanh toán</Typography>
        <RadioGroup
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as "COD" | "VNPAY")}
        >
          <FormControlLabel
            value="COD"
            control={<Radio />}
            label="Thanh toán khi nhận hàng"
          />
          <FormControlLabel value="VNPAY" control={<Radio />} label="VNPay" />
        </RadioGroup>
      </Paper>

      <Button
        fullWidth
        variant="contained"
        color="success"
        disabled={loading}
        onClick={handleConfirmPayment}
      >
        {loading ? "Đang xử lý..." : "Xác nhận thanh toán"}
      </Button>
    </Box>
  );
};

export default PaymentPage;
