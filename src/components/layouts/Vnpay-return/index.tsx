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

const VNPayReturnPage: React.FC = () => {
  const searchParams = useSearchParams();
  const query = searchParams?.toString() || "";
  const router = useRouter();
  const dispatch = useAppDispatch();
  const t = useTranslations("vnpayReturn");

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
          toast.success(t("success_toast"));
        } else {
          toast.info(
            t("result_toast") + ": " + (result?.status ?? t("unknown"))
          );
        }
      } catch (e: unknown) {
        const msg = (e as Error)?.message ?? t("error_processing");
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
              gap: 2,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ mb: 1 }}>
                <strong>{t("order_id")}:</strong>
              </Typography>
              <Typography variant="body1" sx={{ wordBreak: "break-all" }}>
                {payment.orderId}
              </Typography>

              <Typography sx={{ mt: 2, mb: 1 }}>
                <strong>{t("amount")}:</strong>
              </Typography>
              <Typography variant="body1">
                {formatCurrency(payment.amount)}
              </Typography>

              <Typography sx={{ mt: 2, mb: 1 }}>
                <strong>{t("method")}:</strong>
              </Typography>
              <Typography variant="body1">{payment.method ?? "-"}</Typography>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography sx={{ mb: 1 }}>
                <strong>{t("transaction_id")}:</strong>
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
                    <strong>{t("vnpay_txnref")}:</strong>
                  </Typography>
                  <Typography variant="body1" sx={{ wordBreak: "break-all" }}>
                    {payment.vnpPayPayment.vnpTxnRef}
                  </Typography>

                  <Typography sx={{ mt: 2, mb: 1 }}>
                    <strong>{t("bank")}:</strong>
                  </Typography>
                  <Typography variant="body1">
                    {payment.vnpPayPayment.bankCode ?? "-"}
                  </Typography>

                  <Typography sx={{ mt: 2, mb: 1 }}>
                    <strong>{t("response_code")}:</strong>
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
