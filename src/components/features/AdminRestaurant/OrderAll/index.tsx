"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Box,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { fetchRestaurantByOwner } from "@/redux/slices/restaurantSlice";
import {
  fetchPaymentsByRestaurant,
  confirmCODPaymentByPaymentId,
  confirmCODPayment,
} from "@/redux/slices/paymentSlice";
import {
  updateOrderStatus,
  updateDeliveryStatus,
} from "@/redux/slices/orderSlice";
import { getAccessToken } from "@/lib/utils/tokenHelper";
import { InfoPayment } from "@/types/payment";
import { DeliveryStatus, OrderStatus } from "@/types/order";

// ---------- Transition guards: prevent reverting to earlier statuses ----------
const ORDER_STATUS_RANK: Record<string, number> = {
  pending: 0,
  processing: 1,
  paid: 2,
  // terminal/branch states
  cancelled: 100,
  canceled: 100,
  failed: 100,
};

const DELIVERY_STATUS_RANK: Record<string, number> = {
  preparing: 0,
  delivering: 1,
  shipping: 1, // FE alias for delivering
  delivered: 2,
  canceled: 100,
  cancelled: 100,
  failed: 100,
};

function isBackwardOrderTransition(current?: string, target?: string) {
  if (!current || !target) return false;
  const c = (current || "").toLowerCase();
  const t = (target || "").toLowerCase();
  const rc = ORDER_STATUS_RANK[c] ?? 0;
  const rt = ORDER_STATUS_RANK[t] ?? 0;
  return rt < rc; // target is before current => backward
}

function isBackwardDeliveryTransition(current?: string, target?: string) {
  if (!current || !target) return false;
  const c = (current || "").toLowerCase();
  const t = (target || "").toLowerCase();
  const rc = DELIVERY_STATUS_RANK[c] ?? 0;
  const rt = DELIVERY_STATUS_RANK[t] ?? 0;
  return rt < rc; // target is before current => backward
}

const labelOrderStatus = (s?: string) => {
  switch ((s || "").toLowerCase()) {
    case "pending":
      return "Chờ xử lý";
    case "processing":
      return "Đang xử lý";
    case "paid":
      return "Đã thanh toán";
    case "cancelled":
    case "canceled":
      return "Đã hủy";
    case "failed":
      return "Thất bại";
    default:
      return s || "Không rõ";
  }
};

const labelDeliveryStatus = (s?: string) => {
  switch ((s || "").toLowerCase()) {
    case "preparing":
      return "Đang chuẩn bị";
    case "delivering":
    case "shipping":
      return "Đang giao";
    case "delivered":
      return "Đã giao";
    case "canceled":
    case "cancelled":
      return "Đã hủy";
    case "failed":
      return "Thất bại";
    default:
      return s || "Không rõ";
  }
};

// Payment status mapping (Pending, Success, Failed, Cancelled/Canceled, Refunded)
const paymentLabel = (s?: string) => {
  switch ((s || "").toLowerCase()) {
    case "pending":
      return "Chờ thanh toán";
    case "success":
      return "Đã thanh toán";
    case "failed":
      return "Thanh toán thất bại";
    case "cancelled":
    case "canceled":
      return "Đã hủy";
    case "refunded":
      return "Đã hoàn tiền";
    default:
      return s || "Không rõ";
  }
};

const paymentChipColor = (s?: string) => {
  switch ((s || "").toLowerCase()) {
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

export default function AdminRestaurantOrdersPage() {
  const dispatch = useAppDispatch();

  const { current: restaurant, loading: restLoading } = useAppSelector(
    (s) => s.restaurant
  );
  const {
    restaurantPayments,
    loading: paymentLoading,
    error,
  } = useAppSelector((s) => s.payment);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  useEffect(() => {
    const token = getAccessToken();
    if (!restaurant && token) {
      dispatch(fetchRestaurantByOwner({ token }));
    }
  }, [dispatch, restaurant]);

  useEffect(() => {
    if (restaurant?.id) {
      dispatch(fetchPaymentsByRestaurant({ restaurantId: restaurant.id }));
    }
  }, [dispatch, restaurant?.id]);

  const rows = useMemo(() => restaurantPayments || [], [restaurantPayments]);

  const handleChangeOrderStatus = async (orderId: number, status: string) => {
    // Guard: prevent reverting to a previous status
    const current = rows.find((p) => p.order?.id === orderId)?.order?.status as
      | string
      | undefined;
    if (isBackwardOrderTransition(current, status)) {
      setSnackbar({
        open: true,
        message: "Không thể quay về trạng thái trước đó",
        severity: "error",
      });
      return;
    }
    try {
      await dispatch(
        updateOrderStatus({ id: orderId, status: status as OrderStatus })
      ).unwrap();
      setSnackbar({
        open: true,
        message: "Cập nhật trạng thái đơn hàng thành công",
        severity: "success",
      });
      if (restaurant?.id)
        dispatch(fetchPaymentsByRestaurant({ restaurantId: restaurant.id }));
    } catch (e: unknown) {
      const msg =
        (e as { message?: string })?.message || "Cập nhật trạng thái thất bại";
      setSnackbar({ open: true, message: msg, severity: "error" });
    }
  };

  const handleChangeDeliveryStatus = async (orderId: number, deliv: string) => {
    // Map FE "Shipping" -> BE "Delivering"
    const mapped = deliv.toLowerCase() === "shipping" ? "Delivering" : deliv;
    // Guard: prevent reverting to a previous delivery status
    const current = rows.find((p) => p.order?.id === orderId)?.order
      ?.deliveryStatus as string | undefined;
    // Guard: BE requires payment.Status === Success before marking Delivered (for any method)
    const paymentStatus = String(
      rows.find((p) => p.order?.id === orderId)?.status || ""
    ).toLowerCase();
    if (mapped.toLowerCase() === "delivered" && paymentStatus !== "success") {
      setSnackbar({
        open: true,
        message:
          "Không thể chuyển sang Đã giao khi thanh toán chưa thành công. Vui lòng hoàn tất/ xác nhận thanh toán trước.",
        severity: "error",
      });
      return;
    }
    if (isBackwardDeliveryTransition(current, mapped)) {
      setSnackbar({
        open: true,
        message: "Không thể quay về trạng thái giao trước đó",
        severity: "error",
      });
      return;
    }
    try {
      await dispatch(
        updateDeliveryStatus({
          id: orderId,
          deliveryStatus: mapped as unknown as DeliveryStatus,
        })
      ).unwrap();
      setSnackbar({
        open: true,
        message: "Cập nhật trạng thái giao hàng thành công",
        severity: "success",
      });
      if (restaurant?.id)
        dispatch(fetchPaymentsByRestaurant({ restaurantId: restaurant.id }));
    } catch (e: unknown) {
      const msg =
        (e as { message?: string })?.message || "Cập nhật giao hàng thất bại";
      setSnackbar({ open: true, message: msg, severity: "error" });
    }
  };

  const handleConfirmCOD = async (paymentId: number, codPaymentId?: number) => {
    try {
      if (codPaymentId) {
        await dispatch(confirmCODPayment({ codPaymentId })).unwrap();
      } else if (restaurant?.id) {
        await dispatch(
          confirmCODPaymentByPaymentId({
            paymentId,
            restaurantId: restaurant.id,
          })
        ).unwrap();
      } else {
        throw new Error("Thiếu thông tin nhà hàng để xác nhận COD");
      }
      setSnackbar({
        open: true,
        message: "Xác nhận COD thành công",
        severity: "success",
      });
      if (restaurant?.id)
        dispatch(fetchPaymentsByRestaurant({ restaurantId: restaurant.id }));
    } catch (e: unknown) {
      const msg =
        (e as { message?: string })?.message || "Xác nhận COD thất bại";
      setSnackbar({ open: true, message: msg, severity: "error" });
    }
  };

  if (restLoading || paymentLoading) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="50vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h5" fontWeight={700} mb={2}>
        Đơn hàng của nhà hàng {restaurant?.name || "(không xác định)"}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={1}>
        {rows.map((p: InfoPayment) => (
          <Paper key={p.id} variant="outlined" sx={{ p: 2 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              gap={2}
              flexWrap="wrap"
            >
              <Box>
                <Typography fontWeight={600}>
                  Đơn hàng #{p.order?.id}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {p.order?.createdAt
                    ? new Date(p.order.createdAt).toLocaleString()
                    : "-"}
                </Typography>
                <Typography variant="body2">
                  Khách hàng: {p.order?.recipientName || `#${p.order?.userId}`}{" "}
                  {p.order?.recipientPhone ? `(${p.order.recipientPhone})` : ""}
                </Typography>
                <Typography variant="body2">
                  Tổng: {(p.order?.finalPrice ?? p.amount).toLocaleString()}đ
                </Typography>
                {p.order?.deliveryAddress && (
                  <Typography variant="body2" color="text.secondary">
                    Địa chỉ: {p.order.deliveryAddress}
                  </Typography>
                )}

                <Box mt={1} display="flex" alignItems="center" gap={1}>
                  <Chip
                    label={labelOrderStatus(p.order?.status)}
                    size="small"
                  />
                  <Chip
                    label={labelDeliveryStatus(p.order?.deliveryStatus)}
                    size="small"
                  />
                  <Chip
                    label={`Thanh toán: ${paymentLabel(p.status)}`}
                    color={paymentChipColor(p.status)}
                    size="small"
                  />
                </Box>
              </Box>

              {/* Danh sách món đã đặt */}
              <Box flex={1} minWidth={320}>
                <Typography fontWeight={600} mb={1}>
                  Món đã đặt
                </Typography>
                <Paper variant="outlined" sx={{ p: 0 }}>
                  <List dense disablePadding>
                    {(p.order?.items || []).map((it) => (
                      <Fragment key={it.id}>
                        <ListItem sx={{ py: 1, px: 1.5 }}>
                          <ListItemAvatar>
                            <Avatar
                              variant="rounded"
                              src={it.image || undefined}
                              alt={it.dishName}
                              sx={{ width: 40, height: 40 }}
                            >
                              {it.dishName?.charAt(0) || "?"}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box
                                display="flex"
                                justifyContent="space-between"
                                gap={2}
                              >
                                <Typography>{it.dishName}</Typography>
                                <Typography color="text.secondary">
                                  x{it.quantity}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {(it.totalPrice || 0).toLocaleString()}đ
                              </Typography>
                            }
                          />
                        </ListItem>
                        <Divider component="li" />
                      </Fragment>
                    ))}
                    {(!p.order?.items || p.order.items.length === 0) && (
                      <ListItem sx={{ py: 1, px: 1.5 }}>
                        <ListItemText primary="Không có món nào" />
                      </ListItem>
                    )}
                  </List>
                </Paper>
              </Box>

              <Box minWidth={280} display="flex" flexDirection="column" gap={1}>
                <FormControl size="small">
                  <InputLabel>Trạng thái đơn</InputLabel>
                  <Select
                    label="Trạng thái đơn"
                    value={(p.order?.status as string) || "Pending"}
                    onChange={(e) =>
                      p.order?.id &&
                      handleChangeOrderStatus(p.order.id, e.target.value)
                    }
                  >
                    {(
                      [
                        { v: "Pending", l: "Chờ xử lý" },
                        { v: "Processing", l: "Đang xử lý" },
                        { v: "Paid", l: "Đã thanh toán" },
                        { v: "Cancelled", l: "Đã hủy" },
                        { v: "Failed", l: "Thất bại" },
                      ] as const
                    ).map((opt) => (
                      <MenuItem
                        key={opt.v}
                        value={opt.v}
                        disabled={isBackwardOrderTransition(
                          p.order?.status as string,
                          opt.v
                        )}
                      >
                        {opt.l}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small">
                  <InputLabel>Trạng thái giao</InputLabel>
                  <Select
                    label="Trạng thái giao"
                    value={(p.order?.deliveryStatus as string) || "Preparing"}
                    onChange={(e) =>
                      p.order?.id &&
                      handleChangeDeliveryStatus(p.order.id, e.target.value)
                    }
                  >
                    {(
                      [
                        { v: "Preparing", l: "Đang chuẩn bị" },
                        { v: "Delivering", l: "Đang giao" },
                        { v: "Delivered", l: "Đã giao" },
                        { v: "Canceled", l: "Đã hủy" },
                      ] as const
                    ).map((opt) => (
                      <MenuItem
                        key={opt.v}
                        value={opt.v}
                        disabled={
                          isBackwardDeliveryTransition(
                            (p.order?.deliveryStatus as string) || undefined,
                            opt.v
                          ) ||
                          (opt.v === "Delivered" &&
                            String(p.status).toLowerCase() !== "success")
                        }
                      >
                        {opt.l}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {/* Confirm COD button: shown for pending payments so admin can mark COD as collected */}
                <Box>
                  {String(p.status).toLowerCase() === "pending" &&
                    p.codPayment && (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() =>
                          p.id && handleConfirmCOD(p.id, p.codPayment?.id)
                        }
                      >
                        Xác nhận thu COD
                      </Button>
                    )}
                </Box>
              </Box>
            </Box>
          </Paper>
        ))}

        {rows.length === 0 && (
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography color="text.secondary">Chưa có đơn hàng</Typography>
          </Paper>
        )}
      </Stack>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
