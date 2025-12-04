"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  Stack,
  Divider,
  CircularProgress,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import HomeIcon from "@mui/icons-material/Home";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

const OrderSuccessPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("orderSuccess");

  const [orderInfo, setOrderInfo] = useState<{
    orderId?: string;
    amount?: string;
    paymentMethod?: string;
  }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lấy thông tin từ URL params
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");
    const paymentMethod = searchParams.get("method");

    setOrderInfo({
      orderId: orderId || undefined,
      amount: amount || undefined,
      paymentMethod: paymentMethod || undefined,
    });

    // Clear localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("checkoutOrder");
    }

    setLoading(false);
  }, [searchParams]);

  const handleViewOrders = () => {
    router.push("/purchase");
  };

  const handleGoHome = () => {
    router.push("/");
  };

  if (loading) {
    return (
      <Box
        sx={(theme) => ({
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: theme.palette.background.default,
        })}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={(theme) => ({
        minHeight: "100vh",
        bgcolor: theme.palette.background.default,
        py: { xs: 4, md: 8 },
        px: { xs: 2, sm: 0 },
      })}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={(theme) => ({
            p: { xs: 3, sm: 4 },
            textAlign: "center",
            borderRadius: 3,
            boxShadow: theme.shadows[10],
            bgcolor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          })}
        >
          {/* Success Icon */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mb: 3,
            }}
          >
            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                bgcolor: "success.light",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: "scaleIn 0.5s ease-out",
                "@keyframes scaleIn": {
                  "0%": {
                    transform: "scale(0)",
                    opacity: 0,
                  },
                  "50%": {
                    transform: "scale(1.1)",
                  },
                  "100%": {
                    transform: "scale(1)",
                    opacity: 1,
                  },
                },
              }}
            >
              <CheckCircleIcon
                sx={{
                  fontSize: 60,
                  color: "success.main",
                }}
              />
            </Box>
          </Box>

          {/* Title */}
          <Typography
            variant="h4"
            fontWeight="700"
            color="success.main"
            gutterBottom
            sx={{
              fontSize: { xs: "1.75rem", sm: "2.125rem" },
            }}
          >
            {t("title")}
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              mb: 3,
              fontSize: { xs: "0.95rem", sm: "1rem" },
            }}
          >
            {orderInfo.paymentMethod === "COD"
              ? t("description_cod")
              : t("description_other")}
          </Typography>

          <Divider sx={{ my: 3 }} />

          {/* Order Info */}
          <Stack spacing={2} sx={{ mb: 4 }}>
            {orderInfo.orderId && (
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="body2" color="text.secondary">
                  {t("order_id")}:
                </Typography>
                <Typography variant="body1" fontWeight="600">
                  #{orderInfo.orderId}
                </Typography>
              </Box>
            )}

            {orderInfo.amount && (
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="body2" color="text.secondary">
                  {t("total_amount")}:
                </Typography>
                <Typography variant="body1" fontWeight="600" color="primary">
                  {Number(orderInfo.amount).toLocaleString()}₫
                </Typography>
              </Box>
            )}

            {orderInfo.paymentMethod && (
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="body2" color="text.secondary">
                  {t("payment_method")}:
                </Typography>
                <Typography variant="body1" fontWeight="600">
                  {orderInfo.paymentMethod === "COD"
                    ? t("payment_method_cod")
                    : orderInfo.paymentMethod}
                </Typography>
              </Box>
            )}
          </Stack>

          <Divider sx={{ mb: 4 }} />

          {/* Action Buttons */}
          <Stack spacing={2}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<ShoppingBagIcon />}
              onClick={handleViewOrders}
              sx={{
                py: 1.5,
                fontSize: "1rem",
                fontWeight: "600",
                textTransform: "none",
              }}
            >
              {t("btn_view_orders")}
            </Button>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<HomeIcon />}
              onClick={handleGoHome}
              sx={{
                py: 1.5,
                fontSize: "1rem",
                fontWeight: "600",
                textTransform: "none",
              }}
            >
              {t("btn_go_home")}
            </Button>
          </Stack>

          {/* Additional Info */}
          <Box
            sx={(theme) => ({
              mt: 4,
              p: 2,
              bgcolor: theme.palette.action.hover,
              borderRadius: 2,
            })}
          >
            <Typography variant="body2" color="text.secondary">
              {t("note")} <strong>{t("note_bold")}</strong>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default OrderSuccessPage;
