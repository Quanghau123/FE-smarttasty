"use client";

import { Fragment, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
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
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
} from "@mui/material";
import { toast } from "react-toastify";
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

// Translation-based label helpers
const createLabelHelpers = (t: ReturnType<typeof useTranslations>) => {
  const labelOrderStatus = (s?: string) => {
    const k = (s || "").toLowerCase();
    switch (k) {
      case "pending":
        return t("status.order.pending");
      case "processing":
        return t("status.order.processing");
      case "paid":
        return t("status.order.paid");
      case "cancelled":
      case "canceled":
        return t("status.order.cancelled");
      case "failed":
        return t("status.order.failed");
      default:
        return s || t("status.order.unknown");
    }
  };
  const labelDeliveryStatus = (s?: string) => {
    const k = (s || "").toLowerCase();
    switch (k) {
      case "preparing":
        return t("status.delivery.preparing");
      case "delivering":
      case "shipping":
        return t("status.delivery.delivering");
      case "delivered":
        return t("status.delivery.delivered");
      case "canceled":
      case "cancelled":
        return t("status.delivery.canceled");
      case "failed":
        return t("status.delivery.failed");
      default:
        return s || t("status.delivery.unknown");
    }
  };
  const paymentLabel = (s?: string) => {
    const k = (s || "").toLowerCase();
    switch (k) {
      case "pending":
        return t("status.payment.pending");
      case "success":
        return t("status.payment.success");
      case "failed":
        return t("status.payment.failed");
      case "cancelled":
      case "canceled":
        return t("status.payment.cancelled");
      case "refunded":
        return t("status.payment.refunded");
      default:
        return s || t("status.payment.unknown");
    }
  };
  return { labelOrderStatus, labelDeliveryStatus, paymentLabel };
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
  const t = useTranslations("adminRestaurant.orders");
  const { labelOrderStatus, labelDeliveryStatus, paymentLabel } =
    createLabelHelpers(t);

  const { current: restaurant, loading: restLoading } = useAppSelector(
    (s) => s.restaurant
  );
  const { items: dishes = [] } = useAppSelector((s) => s.dishes);
  const {
    restaurantPayments,
    loading: paymentLoading,
    error,
  } = useAppSelector((s) => s.payment);

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

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const rows = useMemo(() => restaurantPayments || [], [restaurantPayments]);

  const handleChangeOrderStatus = async (orderId: number, status: string) => {
    // Guard: prevent reverting to a previous status
    const current = rows.find((p) => p.order?.id === orderId)?.order?.status as
      | string
      | undefined;
    if (isBackwardOrderTransition(current, status)) {
      toast.error(t("errors.backward_order"));
      return;
    }
    try {
      await dispatch(
        updateOrderStatus({ id: orderId, status: status as OrderStatus })
      ).unwrap();
      toast.success(t("success.update_order"));
      if (restaurant?.id)
        dispatch(fetchPaymentsByRestaurant({ restaurantId: restaurant.id }));
    } catch (e: unknown) {
      const msg =
        (e as { message?: string })?.message || t("errors.update_order_failed");
      toast.error(msg);
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
      toast.error(t("errors.delivery_requires_payment"));
      return;
    }
    if (isBackwardDeliveryTransition(current, mapped)) {
      toast.error(t("errors.backward_delivery"));
      return;
    }
    try {
      await dispatch(
        updateDeliveryStatus({
          id: orderId,
          deliveryStatus: mapped as unknown as DeliveryStatus,
        })
      ).unwrap();
      toast.success(t("success.update_delivery"));
      if (restaurant?.id)
        dispatch(fetchPaymentsByRestaurant({ restaurantId: restaurant.id }));
    } catch (e: unknown) {
      const msg =
        (e as { message?: string })?.message ||
        t("errors.update_delivery_failed");
      toast.error(msg);
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
        throw new Error(t("errors.missing_restaurant_cod"));
      }
      toast.success(t("success.confirm_cod"));
      if (restaurant?.id)
        dispatch(fetchPaymentsByRestaurant({ restaurantId: restaurant.id }));
    } catch (e: unknown) {
      const msg =
        (e as { message?: string })?.message || t("errors.confirm_cod_failed");
      toast.error(msg);
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
    <Container maxWidth="lg" sx={{ py: 2, pt: 0 }}>
      <Typography variant="h5" fontWeight={700} mb={2}>
        {t("title", { name: restaurant?.name || t("unknown_restaurant") })}
      </Typography>

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
                  {t("labels.order")}#{p.order?.id}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {p.order?.createdAt
                    ? new Date(p.order.createdAt).toLocaleString()
                    : "-"}
                </Typography>
                <Typography variant="body2">
                  {t("labels.customer")}{" "}
                  {p.order?.recipientName || `#${p.order?.userId}`}{" "}
                  {p.order?.recipientPhone ? `(${p.order.recipientPhone})` : ""}
                </Typography>
                <Typography variant="body2">
                  {t("labels.total")}{" "}
                  {(p.order?.finalPrice ?? p.amount).toLocaleString()}đ
                </Typography>
                {p.order?.deliveryAddress && (
                  <Typography variant="body2" color="text.secondary">
                    {t("labels.address")} {p.order.deliveryAddress}
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
                    label={`${t("labels.payment_prefix")} ${paymentLabel(
                      p.status
                    )}`}
                    color={paymentChipColor(p.status)}
                    size="small"
                  />
                </Box>
              </Box>

              {/* Danh sách món đã đặt */}
              <Box flex={1} minWidth={320}>
                <Typography fontWeight={600} mb={1}>
                  {t("labels.items_title")}
                </Typography>
                <Paper variant="outlined" sx={{ p: 0 }}>
                  <List dense disablePadding>
                    {(p.order?.items || []).map((it) => (
                      <Fragment key={it.id}>
                        <ListItem sx={{ py: 1, px: 1.5 }}>
                          <ListItemAvatar>
                            <Avatar
                              variant="rounded"
                              src={
                                it.image ??
                                dishes.find((d) => d.id === it.dishId)?.image ??
                                undefined
                              }
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
                        <ListItemText primary={t("labels.no_items")} />
                      </ListItem>
                    )}
                  </List>
                </Paper>
              </Box>

              <Box minWidth={280} display="flex" flexDirection="column" gap={1}>
                <FormControl size="small">
                  <InputLabel>{t("labels.order_status_label")}</InputLabel>
                  <Select
                    label={t("labels.order_status_label")}
                    value={(p.order?.status as string) || "Pending"}
                    onChange={(e) =>
                      p.order?.id &&
                      handleChangeOrderStatus(p.order.id, e.target.value)
                    }
                    renderValue={(selected) => (
                      <Box
                        sx={{
                          fontWeight: 600,
                          color: "primary.main",
                        }}
                      >
                        {labelOrderStatus(selected)}
                      </Box>
                    )}
                  >
                    {(
                      [
                        { v: "Pending", l: t("status.order.pending") },
                        { v: "Processing", l: t("status.order.processing") },
                        { v: "Paid", l: t("status.order.paid") },
                        { v: "Cancelled", l: t("status.order.cancelled") },
                        { v: "Failed", l: t("status.order.failed") },
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
                  <InputLabel>{t("labels.delivery_status_label")}</InputLabel>
                  <Select
                    label={t("labels.delivery_status_label")}
                    value={(p.order?.deliveryStatus as string) || "Preparing"}
                    onChange={(e) =>
                      p.order?.id &&
                      handleChangeDeliveryStatus(p.order.id, e.target.value)
                    }
                    renderValue={(selected) => (
                      <Box
                        sx={{
                          fontWeight: 600,
                          color: "success.main",
                        }}
                      >
                        {labelDeliveryStatus(selected)}
                      </Box>
                    )}
                  >
                    {(
                      [
                        { v: "Preparing", l: t("status.delivery.preparing") },
                        { v: "Delivering", l: t("status.delivery.delivering") },
                        { v: "Delivered", l: t("status.delivery.delivered") },
                        { v: "Canceled", l: t("status.delivery.canceled") },
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
                        {t("labels.confirm_cod")}
                      </Button>
                    )}
                </Box>
              </Box>
            </Box>
          </Paper>
        ))}

        {rows.length === 0 && (
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography color="text.secondary">
              {t("labels.no_orders")}
            </Typography>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}
