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
import { useTranslations } from "next-intl";

import type { Payment } from "@/types/payment";

interface VNPayParams {
  vnp_Amount?: string;
  vnp_BankCode?: string;
  vnp_BankTranNo?: string;
  vnp_CardType?: string;
  vnp_OrderInfo?: string;
  vnp_PayDate?: string;
  vnp_ResponseCode?: string;
  vnp_TmnCode?: string;
  vnp_TransactionNo?: string;
  vnp_TransactionStatus?: string;
  vnp_TxnRef?: string;
  vnp_SecureHash?: string;
}

const VNPayReturnPage: React.FC = () => {
  const searchParams = useSearchParams();
  const query = searchParams?.toString() || "";
  const router = useRouter();
  const dispatch = useAppDispatch();
  const t = useTranslations("vnpayReturn");

  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [vnpayParams, setVnpayParams] = useState<VNPayParams>({});

  useEffect(() => {
    if (!query) return;

    // Extract VNPay parameters from URL
    const params: VNPayParams = {};
    searchParams?.forEach((value, key) => {
      params[key as keyof VNPayParams] = value;
    });
    setVnpayParams(params);

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        // Gọi API ngay lập tức
        const result = await dispatch(handleVNPayReturn({ query })).unwrap();
        setPayment(result);

        // Đợi 5 giây
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Reload trang
        window.location.reload();
      } catch (e: unknown) {
        const msg = (e as Error)?.message ?? t("error_processing");
        setError(msg);
        toast.error(msg);
        setLoading(false);
      }
    };

    run();
  }, [query, dispatch, searchParams, t]);

  const formatCurrency = (value?: number) => {
    if (typeof value !== "number") return "-";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr || dateStr.length !== 14) return dateStr || "-";
    // Format: YYYYMMDDHHmmss -> DD/MM/YYYY HH:mm:ss
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hour = dateStr.substring(8, 10);
    const minute = dateStr.substring(10, 12);
    const second = dateStr.substring(12, 14);
    return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
  };

  const handleCopy = async (text?: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copy_failed"));
    }
  };

  if (!query) {
    return (
      <Box sx={{ mt: 8, textAlign: "center" }}>
        <Typography variant="h6">{t("invalid_link")}</Typography>
        <Button
          sx={{ mt: 2 }}
          variant="contained"
          onClick={() => router.push("/")}
        >
          {t("back_home")}
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
          <Typography sx={{ mt: 2 }}>{t("processing")}</Typography>
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <ErrorOutlineIcon color="error" sx={{ fontSize: 48 }} />
          <Typography variant="h6" color="error" sx={{ mt: 1 }}>
            {t("cannot_process")}
          </Typography>
          <Typography sx={{ mt: 1 }}>{error}</Typography>
          <Button
            sx={{ mt: 3 }}
            variant="contained"
            onClick={() => router.push("/")}
          >
            {t("back_home")}
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
                  ? t("payment_success")
                  : t("payment_result")}
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
              gap: 3,
            }}
          >
            {/* Payment Information */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>
                {t("payment_info")}
              </Typography>

              <Typography sx={{ mb: 0.5 }}>
                <strong>{t("order_id")}:</strong>
              </Typography>
              <Typography
                variant="body1"
                sx={{ mb: 2, wordBreak: "break-all" }}
              >
                {payment.orderId}
              </Typography>

              <Typography sx={{ mb: 0.5 }}>
                <strong>{t("amount")}:</strong>
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {vnpayParams.vnp_Amount
                  ? formatCurrency(parseInt(vnpayParams.vnp_Amount) / 100)
                  : formatCurrency(payment.amount)}
              </Typography>

              <Typography sx={{ mb: 0.5 }}>
                <strong>{t("order_info")}:</strong>
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {vnpayParams.vnp_OrderInfo
                  ? decodeURIComponent(
                      vnpayParams.vnp_OrderInfo.replace(/\+/g, " ")
                    )
                  : "-"}
              </Typography>

              <Typography sx={{ mb: 0.5 }}>
                <strong>{t("pay_date")}:</strong>
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {formatDate(vnpayParams.vnp_PayDate)}
              </Typography>
            </Box>

            {/* Transaction Information */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>
                {t("transaction_info")}
              </Typography>

              <Typography sx={{ mb: 0.5 }}>
                <strong>{t("vnpay_txnref")}:</strong>
              </Typography>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 2 }}
              >
                <Typography variant="body1">
                  {vnpayParams.vnp_TxnRef ?? "-"}
                </Typography>
                {vnpayParams.vnp_TxnRef && (
                  <IconButton
                    size="small"
                    onClick={() => handleCopy(vnpayParams.vnp_TxnRef)}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                )}
              </Stack>

              <Typography sx={{ mb: 0.5 }}>
                <strong>{t("transaction_no")}:</strong>
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {vnpayParams.vnp_TransactionNo ?? "-"}
              </Typography>

              <Typography sx={{ mb: 0.5 }}>
                <strong>{t("bank_code")}:</strong>
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {vnpayParams.vnp_BankCode ?? "-"}
              </Typography>

              <Typography sx={{ mb: 0.5 }}>
                <strong>{t("bank_tran_no")}:</strong>
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {vnpayParams.vnp_BankTranNo ?? "-"}
              </Typography>

              <Typography sx={{ mb: 0.5 }}>
                <strong>{t("card_type")}:</strong>
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {vnpayParams.vnp_CardType ?? "-"}
              </Typography>

              <Typography sx={{ mb: 0.5 }}>
                <strong>{t("response_code")}:</strong>
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {vnpayParams.vnp_ResponseCode ?? "-"}
              </Typography>

              <Typography sx={{ mb: 0.5 }}>
                <strong>{t("transaction_status")}:</strong>
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {vnpayParams.vnp_TransactionStatus ?? "-"}
              </Typography>

              <Typography sx={{ mb: 0.5 }}>
                <strong>{t("tmn_code")}:</strong>
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {vnpayParams.vnp_TmnCode ?? "-"}
              </Typography>
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
              {t("view_orders")}
            </Button>
            <Button variant="outlined" onClick={() => router.push("/")}>
              {t("back_home")}
            </Button>
          </Stack>
        </Box>
      ) : (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography>{t("no_result")}</Typography>
          <Button
            sx={{ mt: 2 }}
            variant="contained"
            onClick={() => router.push("/")}
          >
            {t("back_home")}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default VNPayReturnPage;
