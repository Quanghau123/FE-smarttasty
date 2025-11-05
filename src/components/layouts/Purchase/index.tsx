"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Stack,
  CircularProgress,
  Container,
  Alert,
  Snackbar,
  Collapse,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { useRouter } from "next/navigation";
import { InfoPayment } from "@/types/payment";
import {
  fetchPaymentHistoryByUser,
  cancelOrder,
} from "@/redux/slices/paymentSlice";

const PurchaseHistoryPage = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const paymentState = useAppSelector((s) => s.payment);
  const history = paymentState.history;

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  // track which order's items list is expanded (keyed by order id)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const normalize = (s?: string | null) => (s ? String(s).toLowerCase() : "");

  // Payment status mapping (backend: Pending, Success, Failed, Cancelled, Refunded)
  const paymentLabel = (status?: string) => {
    switch (normalize(status)) {
      case "success":
        return "Đã thanh toán";
      case "pending":
        return "Chờ thanh toán";
      case "failed":
        return "Thanh toán thất bại";
      case "cancelled":
      case "canceled":
        return "Đã hủy";
      case "refunded":
        return "Đã hoàn tiền";
      default:
        return status ?? "Không rõ";
    }
  };

  const paymentChipColor = (status?: string) => {
    switch (normalize(status)) {
      case "success":
        return "success" as const;
      case "pending":
        return "warning" as const;
      case "failed":
      case "cancelled":
      case "canceled":
        return "error" as const;
      case "refunded":
        return "info" as const;
      default:
        return "default" as const;
    }
  };

  // Order status mapping (backend: Pending, Paid, Cancelled, Failed, Processing)
  const orderStatusLabel = (status?: string) => {
    switch (normalize(status)) {
      case "pending":
        return "Chờ xử lý";
      case "paid":
        return "Đã thanh toán";
      case "processing":
        return "Đang xử lý";
      case "cancelled":
      case "canceled":
        return "Đã hủy";
      case "failed":
        return "Thất bại";
      default:
        return status ?? "Không rõ";
    }
  };

  const orderStatusColor = (status?: string) => {
    switch (normalize(status)) {
      case "pending":
        return "warning" as const;
      case "paid":
      case "processing":
        return "success" as const;
      case "cancelled":
      case "canceled":
      case "failed":
        return "error" as const;
      default:
        return "default" as const;
    }
  };

  // Delivery status mapping (backend: Preparing, Delivering, Delivered, Canceled)
  const deliveryStatusLabel = (status?: string) => {
    switch (normalize(status)) {
      case "preparing":
        return "Đang chuẩn bị";
      case "delivering":
        return "Đang giao hàng";
      case "delivered":
        return "Đã giao hàng";
      case "canceled":
      case "cancelled":
        return "Đã hủy";
      default:
        return status ?? "Không rõ";
    }
  };

  const deliveryStatusColor = (status?: string) => {
    switch (normalize(status)) {
      case "preparing":
        return "info" as const;
      case "delivering":
        return "warning" as const;
      case "delivered":
        return "success" as const;
      case "canceled":
      case "cancelled":
        return "error" as const;
      default:
        return "default" as const;
    }
  };

  // Check if order can be cancelled (backend logic: cannot cancel if status is Paid)
  const canCancelOrder = (orderStatus?: string) => {
    return normalize(orderStatus) !== "paid";
  };

  useEffect(() => {
    // Read user id from localStorage and fetch payment history only
    const userRaw =
      typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (!userRaw) return;
    try {
      const parsed = JSON.parse(userRaw) as { id?: number; userId?: number };
      const uid = parsed.userId ?? parsed.id;
      if (uid) void dispatch(fetchPaymentHistoryByUser({ userId: uid }));
    } catch {
      // ignore
    }
  }, [dispatch]);

  // Auto-refresh when history changes (to reflect updates from cancel or other operations)
  useEffect(() => {
    // This effect will re-render when history state updates
  }, [history]);

  const handleCancelOrder = async (orderId: number, orderStatus?: string) => {
    if (!canCancelOrder(orderStatus)) {
      setSnackbar({
        open: true,
        message: "Không thể hủy đơn hàng đã thanh toán",
        severity: "error",
      });
      return;
    }

    const ok = confirm("Bạn có chắc muốn hủy đơn hàng này?");
    if (!ok) return;

    const userRaw =
      typeof window !== "undefined" ? localStorage.getItem("user") : null;
    let uid: number | undefined;
    if (userRaw) {
      try {
        const parsed = JSON.parse(userRaw);
        uid = parsed.userId ?? parsed.id;
      } catch {
        // ignore
      }
    }

    try {
      await dispatch(cancelOrder({ orderId, userId: uid })).unwrap();
      setSnackbar({
        open: true,
        message: "Hủy đơn hàng thành công",
        severity: "success",
      });
    } catch (error: unknown) {
      setSnackbar({
        open: true,
        message:
          (error as { message?: string })?.message || "Không thể hủy đơn hàng",
        severity: "error",
      });
    }
  };

  if (paymentState.loading)
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" mb={1}>
          Lịch sử thanh toán
        </Typography>

        {paymentState.error ? (
          <Typography color="error">{paymentState.error}</Typography>
        ) : history.length === 0 ? (
          <Box textAlign="center" py={4}>
            <ShoppingCartOutlinedIcon
              sx={{ fontSize: 56, color: "text.disabled", mb: 1 }}
            />
            <Typography color="text.secondary">
              Chưa có lịch sử thanh toán
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1}>
            {history.map((h: InfoPayment) => {
              const orderId = h.order?.id ?? -1;
              return (
                <Paper key={h.id} variant="outlined" sx={{ p: 1.5 }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    flexWrap="wrap"
                    gap={1}
                  >
                    <Box>
                      <Typography fontWeight={600}>
                        Đơn hàng #{h.order?.id ?? "-"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {h.order?.createdAt
                          ? new Date(h.order.createdAt).toLocaleString()
                          : "-"}
                      </Typography>
                      <Typography variant="body2">
                        Nhà hàng:{" "}
                        {h.order?.restaurant?.name ||
                          `#${h.order?.restaurantId ?? "-"}`}
                      </Typography>

                      {/* Order status + delivery status */}
                      <Box mt={0.5} display="flex" gap={1} alignItems="center">
                        <Chip
                          label={orderStatusLabel(h.order?.status)}
                          color={orderStatusColor(h.order?.status)}
                          size="small"
                        />
                        <Chip
                          label={deliveryStatusLabel(h.order?.deliveryStatus)}
                          color={deliveryStatusColor(h.order?.deliveryStatus)}
                          size="small"
                        />
                      </Box>

                      {/* Items preview: show first item, collapse rest */}
                      {h.order?.items && h.order.items.length > 0 && (
                        <>
                          <Box
                            mt={0.5}
                            display="flex"
                            alignItems="center"
                            gap={1}
                          >
                            <Typography variant="body2">
                              {h.order.items[0].dishName}
                              {h.order.items[0].quantity
                                ? ` x${h.order.items[0].quantity}`
                                : ""}
                            </Typography>
                            {h.order.items.length > 1 && (
                              <Button
                                size="small"
                                variant="text"
                                onClick={() =>
                                  setExpanded((prev) => ({
                                    ...prev,
                                    [orderId]: !prev[orderId],
                                  }))
                                }
                                sx={{ textTransform: "none" }}
                              >
                                +{h.order.items.length - 1} món khác
                              </Button>
                            )}
                          </Box>

                          <Collapse in={!!expanded[orderId]}>
                            <List dense>
                              {h.order.items.map((it) => (
                                <ListItem key={it.id} sx={{ py: 0.4 }}>
                                  <ListItemText
                                    primary={`${it.dishName} x${it.quantity}`}
                                    secondary={`${Number(
                                      it.totalPrice
                                    ).toLocaleString()}đ`}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Collapse>
                        </>
                      )}
                    </Box>
                    <Box textAlign="right">
                      <Chip
                        label={paymentLabel(h.status)}
                        color={paymentChipColor(h.status)}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Typography fontWeight={700}>
                        {Number(h.amount).toLocaleString()}đ
                      </Typography>
                      <Box mt={0.5}>
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          sx={{ mr: 1 }}
                          disabled={!canCancelOrder(h.order?.status)}
                          onClick={() => {
                            if (h.order?.id) {
                              void handleCancelOrder(
                                h.order.id,
                                h.order.status
                              );
                            }
                          }}
                        >
                          Hủy đơn
                        </Button>

                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            // jump to restaurant page
                            const rid =
                              h.order?.restaurant?.id ?? h.order?.restaurantId;
                            if (rid) router.push(`/RestaurantDetails/${rid}`);
                          }}
                        >
                          Xem nhà hàng
                        </Button>
                      </Box>
                      {/* show small summary of items */}
                      <Typography
                        variant="caption"
                        display="block"
                        mt={0.5}
                        color="text.secondary"
                      >
                        {h.order?.items?.length ?? 0} món • Tổng:{" "}
                        {Number(
                          h.order?.finalPrice ?? h.amount
                        ).toLocaleString()}
                        đ
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PurchaseHistoryPage;
