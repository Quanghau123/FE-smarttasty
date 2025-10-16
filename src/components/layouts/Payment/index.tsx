"use client";

import { useEffect, useState } from "react";
import { Box, Typography, Divider, Paper, Button, RadioGroup, FormControlLabel, Radio } from "@mui/material";
import axiosInstance from "@/lib/axios/axiosInstance";
import { useRouter } from "next/navigation";

const PaymentPage = () => {
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("checkoutOrder");
    if (stored) {
      setOrder(JSON.parse(stored));
    } else {
      router.push("/cart"); // Nếu chưa có dữ liệu, quay về giỏ hàng
    }
  }, [router]);

  const total = order?.items?.reduce(
    (sum: number, item: any) =>
      sum + (typeof item.totalPrice === "number" ? item.totalPrice : 0),
    0
  );

  const handleConfirmPayment = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.post(`/api/Payment/create`, {
        orderId: order.id,
        method: paymentMethod,
      });

      alert("✅ Thanh toán thành công!");
      console.log("Payment result:", res.data);

      localStorage.removeItem("checkoutOrder");
      router.push("/orders"); // Chuyển sang trang lịch sử đơn hàng
    } catch (error) {
      console.error("❌ Lỗi thanh toán:", error);
      alert("Thanh toán thất bại!");
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

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

        {order.items?.map((item: any) => (
          <Box
            key={item.id}
            display="flex"
            justifyContent="space-between"
            mt={1}
          >
            <Typography>
              {item.dishName} × {item.quantity}
            </Typography>
            <Typography>
              {item.totalPrice?.toLocaleString()}đ
            </Typography>
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
          onChange={(e) => setPaymentMethod(e.target.value)}
        >
          <FormControlLabel value="COD" control={<Radio />} label="Thanh toán khi nhận hàng" />
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
