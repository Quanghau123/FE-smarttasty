"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Divider,
  Stack,
  Chip,
  IconButton,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
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

  const handleCopy = async (text?: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Đã sao chép vào clipboard");
    } catch {
      toast.error("Không thể sao chép");
    }
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
        maxWidth: 920,
        mx: "auto",
        mt: { xs: 4, md: 8 },
        px: { xs: 2, md: 4 },
        py: { xs: 3, md: 5 },
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
          <ErrorOutlineIcon color="error" sx={{ fontSize: 48 }} />
          <Typography variant="h6" color="error" sx={{ mt: 1 }}>
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
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              {String(payment.status).toLowerCase().includes("success") ||
              String(payment.status) === "1" ? (
                <CheckCircleOutlineIcon color="success" sx={{ fontSize: 40 }} />
              ) : (
                <ErrorOutlineIcon color="warning" sx={{ fontSize: 40 }} />
              )}
              <Typography variant="h5">
                {String(payment.status).toLowerCase().includes("success") ||
                String(payment.status) === "1"
                  ? "Thanh toán thành công"
                  : "Kết quả thanh toán"}
              </Typography>
            </Stack>

            <Chip
              label={String(payment.status)}
              color={
                String(payment.status).toLowerCase().includes("success") ||
                String(payment.status) === "1"
                  ? "success"
                  : "warning"
              }
            />
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 2,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ mb: 1 }}>
                <strong>Mã đơn hàng:</strong>
              </Typography>
              <Typography variant="body1" sx={{ wordBreak: "break-all" }}>
                {payment.orderId}
              </Typography>

              <Typography sx={{ mt: 2, mb: 1 }}>
                <strong>Số tiền:</strong>
              </Typography>
              <Typography variant="body1">
                {formatCurrency(payment.amount)}
              </Typography>

              <Typography sx={{ mt: 2, mb: 1 }}>
                <strong>Phương thức:</strong>
              </Typography>
              <Typography variant="body1">{payment.method ?? "-"}</Typography>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography sx={{ mb: 1 }}>
                <strong>Mã giao dịch:</strong>
              </Typography>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ wordBreak: "break-all" }}
              >
                <Typography variant="body1">
                  {payment.transactionId ??
                    payment.vnpPayPayment?.vnpTxnRef ??
                    "-"}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() =>
                    handleCopy(
                      payment.transactionId ?? payment.vnpPayPayment?.vnpTxnRef
                    )
                  }
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Stack>

              {payment.vnpPayPayment && (
                <Box sx={{ mt: 2 }}>
                  <Typography sx={{ mb: 1 }}>
                    <strong>VNPAY TxnRef:</strong>
                  </Typography>
                  <Typography variant="body1" sx={{ wordBreak: "break-all" }}>
                    {payment.vnpPayPayment.vnpTxnRef}
                  </Typography>

                  <Typography sx={{ mt: 2, mb: 1 }}>
                    <strong>Ngân hàng:</strong>
                  </Typography>
                  <Typography variant="body1">
                    {payment.vnpPayPayment.bankCode ?? "-"}
                  </Typography>

                  <Typography sx={{ mt: 2, mb: 1 }}>
                    <strong>Mã phản hồi:</strong>
                  </Typography>
                  <Typography variant="body1">
                    {payment.vnpPayPayment.responseCode ?? "-"}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ mt: 4 }}
            justifyContent={{ xs: "center", sm: "flex-start" }}
          >
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
          </Stack>
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
