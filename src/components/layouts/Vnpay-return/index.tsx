"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Divider,
} from "@mui/material";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppDispatch } from "@/redux/hook";
import { handleVNPayReturn } from "@/redux/slices/paymentSlice";
import { toast } from "react-toastify";

import type { Payment } from "@/types/payment";

const VNPayReturnPage: React.FC = () => {
  const searchParams = useSearchParams();
  const query = searchParams?.toString() || "";
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) return;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await dispatch(handleVNPayReturn({ query })).unwrap();
        setPayment(result);

        // show toast for success/failure depending on returned status
        const statusStr = (result?.status || "").toString().toLowerCase();
        if (statusStr.includes("success") || statusStr === "1") {
          toast.success("Thanh toán VNPay thành công");
        } else {
          toast.info("Kết quả thanh toán: " + (result?.status ?? "Không rõ"));
        }
      } catch (e: unknown) {
        const msg = (e as Error)?.message ?? "Lỗi khi xử lý kết quả VNPay";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const formatCurrency = (value?: number) => {
    if (typeof value !== "number") return "-";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  if (!query) {
    return (
      <Box sx={{ mt: 8, textAlign: "center" }}>
        <Typography variant="h6">Liên kết VNPay không hợp lệ.</Typography>
        <Button
          sx={{ mt: 2 }}
          variant="contained"
          onClick={() => router.push("/")}
        >
          Về trang chủ
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxWidth: 720,
        mx: "auto",
        mt: 6,
        px: 3,
        py: 4,
        bgcolor: "background.paper",
        borderRadius: 2,
        boxShadow: 3,
      }}
    >
      {loading ? (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>
            Đang xử lý kết quả thanh toán...
          </Typography>
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="h6" color="error">
            Không thể xử lý kết quả VNPay
          </Typography>
          <Typography sx={{ mt: 1 }}>{error}</Typography>
          <Button
            sx={{ mt: 3 }}
            variant="contained"
            onClick={() => router.push("/")}
          >
            Về trang chủ
          </Button>
        </Box>
      ) : payment ? (
        <Box>
          <Typography variant="h5" gutterBottom>
            {String(payment.status).toLowerCase().includes("success")
              ? "Thanh toán thành công"
              : "Kết quả thanh toán"}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography>
            <strong>Mã đơn hàng:</strong> {payment.orderId}
          </Typography>
          <Typography>
            <strong>Số tiền:</strong> {formatCurrency(payment.amount)}
          </Typography>
          <Typography>
            <strong>Phương thức:</strong> {payment.method}
          </Typography>
          <Typography>
            <strong>Trạng thái:</strong> {payment.status}
          </Typography>
          <Typography>
            <strong>Mã giao dịch:</strong>{" "}
            {payment.transactionId ?? payment.vnpPayPayment?.vnpTxnRef ?? "-"}
          </Typography>
          {payment.vnpPayPayment && (
            <Box sx={{ mt: 1 }}>
              <Typography>
                <strong>VNPAY TxnRef:</strong> {payment.vnpPayPayment.vnpTxnRef}
              </Typography>
              <Typography>
                <strong>Ngân hàng:</strong>{" "}
                {payment.vnpPayPayment.bankCode ?? "-"}
              </Typography>
              <Typography>
                <strong>Mã phản hồi:</strong>{" "}
                {payment.vnpPayPayment.responseCode ?? "-"}
              </Typography>
            </Box>
          )}

          <Box sx={{ mt: 4, display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => router.push("/purchase")}
            >
              Xem đơn hàng
            </Button>
            <Button variant="outlined" onClick={() => router.push("/")}>
              Về trang chủ
            </Button>
          </Box>
        </Box>
      ) : (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography>Không có kết quả để hiển thị.</Typography>
          <Button
            sx={{ mt: 2 }}
            variant="contained"
            onClick={() => router.push("/")}
          >
            Về trang chủ
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default VNPayReturnPage;
