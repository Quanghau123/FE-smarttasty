"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Button,
  Alert,
  Paper,
  List,
  ListItem,
  Avatar,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
  Collapse,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { fetchMyStaffInfo } from "@/redux/slices/staffSlice";
import {
  fetchPaymentsByRestaurant,
  confirmCODPaymentByPaymentId,
} from "@/redux/slices/paymentSlice";
import { updateDeliveryStatus } from "@/redux/slices/orderSlice";
import { DeliveryStatus } from "@/types/order";
import { toast } from "react-toastify";
import { useTranslations } from "next-intl";

export default function StaffRestaurantOrders() {
  const dispatch = useAppDispatch();
  const currentStaff = useAppSelector((s) => s.staff.currentStaff);
  const t = useTranslations("staff.restaurantOrders");
  const paymentState = useAppSelector((s) => s.payment);
  const staffLoading = useAppSelector((s) => s.staff.loading);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<
    number | null
  >(null);
  const [noPermission, setNoPermission] = useState(false);

  // confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type?: "cod" | "delivered";
    paymentId?: number;
    orderId?: number;
    message?: string;
  }>({ open: false });

  // expanded orders for details view
  const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>(
    {}
  );

  // normalize restaurants: backend sometimes returns a JSON string in User.restaurants
  const restaurants = useMemo(() => {
    const raw = currentStaff?.restaurants ?? [];
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed))
          return parsed as { id: number; name: string }[];
      } catch {
        return [] as { id: number; name: string }[];
      }
    }
    return (raw as { id: number; name: string }[]) ?? [];
  }, [currentStaff]);

  useEffect(() => {
    if (!currentStaff) dispatch(fetchMyStaffInfo());
  }, [dispatch, currentStaff]);

  // pick default restaurant when available
  useEffect(() => {
    if (!selectedRestaurantId && restaurants.length > 0)
      setSelectedRestaurantId(restaurants[0].id);
  }, [restaurants, selectedRestaurantId]);

  useEffect(() => {
    if (!selectedRestaurantId) return;
    (async () => {
      try {
        setNoPermission(false);
        await dispatch(
          fetchPaymentsByRestaurant({ restaurantId: selectedRestaurantId })
        ).unwrap();
      } catch (e: unknown) {
        const msg = (e as Error)?.message || String(e ?? "");
        const low = msg.toLowerCase();
        if (
          low.includes("403") ||
          low.includes("forbidden") ||
          low.includes("permission")
        )
          setNoPermission(true);
        else toast.error(msg || t("errors.fetch_failed"));
      }
    })();
  }, [dispatch, selectedRestaurantId, t]);

  const loading = paymentState.loading || staffLoading;

  const handleChangeDelivery = async (
    orderId: number,
    value: DeliveryStatus
  ) => {
    const mapped =
      String(value).toLowerCase() === "shipping"
        ? ("Delivering" as unknown as typeof value)
        : value;

    // find associated payment/order to enforce sequential rules
    const paymentForOrder = (paymentState.restaurantPayments || []).find(
      (pp) => pp.order?.id === orderId
    );
    const currentOrder = paymentForOrder?.order;

    // Prevent setting Delivered unless order is in shipping/delivering and COD (if present) is collected
    if (
      mapped === DeliveryStatus.Delivered &&
      currentOrder // ensure we have the order
    ) {
      const isShippingState =
        String(currentOrder.deliveryStatus || "")
          .toLowerCase()
          .includes("ship") ||
        String(currentOrder.deliveryStatus || "")
          .toLowerCase()
          .includes("deliver");
      const codNotCollected =
        Boolean(paymentForOrder?.codPayment) &&
        !paymentForOrder?.codPayment?.isCollected;
      if (!isShippingState || codNotCollected) {
        toast.error(t("errors.cannot_mark_delivered"));
        return;
      }
    }
    try {
      await dispatch(
        updateDeliveryStatus({ id: orderId, deliveryStatus: mapped })
      ).unwrap();
      toast.success(t("success.update_delivery"));
      if (selectedRestaurantId && !noPermission)
        dispatch(
          fetchPaymentsByRestaurant({ restaurantId: selectedRestaurantId })
        );
    } catch (e: unknown) {
      toast.error((e as Error)?.message ?? t("errors.update_failed"));
    }
  };

  const toggleExpand = (orderId: number) =>
    setExpandedOrders((s) => ({ ...s, [orderId]: !s[orderId] }));

  const openConfirmDialog = (opts: {
    type: "cod" | "delivered";
    paymentId?: number;
    orderId?: number;
    message?: string;
  }) => setConfirmDialog({ open: true, ...opts });
  const closeConfirmDialog = () => setConfirmDialog({ open: false });

  const handleConfirmDialog = async () => {
    if (!confirmDialog.type) return closeConfirmDialog();
    try {
      if (confirmDialog.type === "cod" && confirmDialog.paymentId) {
        await dispatch(
          confirmCODPaymentByPaymentId({
            paymentId: confirmDialog.paymentId,
            restaurantId: selectedRestaurantId!,
          })
        ).unwrap();
        toast.success(t("success.confirm_cod"));
      }
      if (confirmDialog.type === "delivered" && confirmDialog.orderId) {
        await dispatch(
          updateDeliveryStatus({
            id: confirmDialog.orderId,
            deliveryStatus: DeliveryStatus.Delivered,
          })
        ).unwrap();
        toast.success(t("success.mark_delivered"));
      }
      if (selectedRestaurantId && !noPermission)
        dispatch(
          fetchPaymentsByRestaurant({ restaurantId: selectedRestaurantId })
        );
    } catch (e: unknown) {
      toast.error((e as Error)?.message ?? t("errors.action_failed"));
    } finally {
      closeConfirmDialog();
    }
  };

  const statusOptions: { label: string; value: DeliveryStatus }[] = [
    { label: t("status.delivery.preparing"), value: DeliveryStatus.Preparing },
    { label: t("status.delivery.delivering"), value: DeliveryStatus.Shipping },
    { label: t("status.delivery.delivered"), value: DeliveryStatus.Delivered },
    { label: t("status.delivery.failed"), value: DeliveryStatus.Failed },
  ];

  const labelOrderStatus = (s?: string) => {
    switch ((s || "").toLowerCase()) {
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
    switch ((s || "").toLowerCase()) {
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

  const chipColorForOrder = (s?: string) => {
    const st = String(s || "").toLowerCase();
    if (st === "paid" || st === "success") return "success" as const;
    if (st === "pending") return "warning" as const;
    if (st === "cancelled" || st === "canceled" || st === "failed")
      return "error" as const;
    return "default" as const;
  };

  const chipColorForDelivery = (s?: string) => {
    const d = String(s || "").toLowerCase();
    if (d === "delivered") return "success" as const;
    if (d === "preparing") return "warning" as const;
    if (d === "delivering" || d === "shipping") return "info" as const;
    if (d === "canceled" || d === "cancelled" || d === "failed")
      return "error" as const;
    return "default" as const;
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", p: 3 }}>
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 3,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          borderRadius: 2,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          {t("title")}
        </Typography>
        {currentStaff && restaurants.length > 0 && (
          <Typography variant="body1" sx={{ opacity: 0.95 }}>
            {restaurants[0].name}
          </Typography>
        )}
      </Paper>

      {!currentStaff && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {loading && currentStaff && (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          gap={2}
          py={4}
        >
          <CircularProgress size={24} />
          <Typography>{t("loading")}</Typography>
        </Box>
      )}

      {!loading && (
        <Box>
          {noPermission ? (
            <Alert severity="warning">{t("errors.no_permission")}</Alert>
          ) : (
            (() => {
              const payments = paymentState.restaurantPayments ?? [];
              if (payments.length === 0)
                return <Typography>{t("empty")}</Typography>;

              return (
                <List sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {payments.map((p) => {
                    const o = p.order;
                    const expanded = Boolean(o?.id && expandedOrders[o.id]);
                    return (
                      <Paper
                        key={p.id}
                        elevation={2}
                        sx={{
                          overflow: "hidden",
                          borderRadius: 2,
                          transition: "all 0.3s ease",
                          "&:hover": {
                            boxShadow: 4,
                            transform: "translateY(-2px)",
                          },
                        }}
                      >
                        <ListItem
                          disableGutters
                          sx={{
                            p: 2.5,
                            bgcolor: "background.paper",
                          }}
                        >
                          <Box sx={{ width: "100%" }}>
                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              justifyContent="space-between"
                              alignItems="center"
                              spacing={2}
                            >
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={2}
                                sx={{ minWidth: 0, flex: 1 }}
                              >
                                <Avatar
                                  sx={{
                                    width: 64,
                                    height: 64,
                                    bgcolor: "primary.main",
                                    fontSize: "1.5rem",
                                    fontWeight: 700,
                                  }}
                                >
                                  {String(
                                    o?.recipientName || o?.userId || ""
                                  ).charAt(0) || "#"}
                                </Avatar>
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                  <Typography
                                    variant="h6"
                                    sx={{ fontWeight: 700, mb: 0.5 }}
                                  >
                                    {t("labels.order")}#{o?.id}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mb: 0.5 }}
                                  >
                                    {t("labels.customer")}{" "}
                                    {o?.recipientName || `#${o?.userId}`}
                                  </Typography>
                                  <Stack direction="row" spacing={2}>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontWeight: 600,
                                        color: "primary.main",
                                      }}
                                    >
                                      {(
                                        o?.finalPrice ??
                                        p.amount ??
                                        0
                                      ).toLocaleString()}
                                      đ
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {o?.createdAt
                                        ? new Date(o.createdAt).toLocaleString(
                                            "vi-VN"
                                          )
                                        : "-"}
                                    </Typography>
                                  </Stack>
                                </Box>
                              </Stack>

                              <Stack
                                direction="row"
                                spacing={1.5}
                                alignItems="center"
                                flexWrap="wrap"
                              >
                                <Chip
                                  label={labelOrderStatus(o?.status)}
                                  color={chipColorForOrder(o?.status)}
                                  sx={{ fontWeight: 600 }}
                                />

                                <Chip
                                  label={labelDeliveryStatus(o?.deliveryStatus)}
                                  color={chipColorForDelivery(
                                    o?.deliveryStatus
                                  )}
                                  sx={{ fontWeight: 600 }}
                                />

                                <IconButton
                                  aria-label={
                                    expanded
                                      ? t("aria.collapse")
                                      : t("aria.expand")
                                  }
                                  onClick={() => toggleExpand(o?.id ?? 0)}
                                  sx={{
                                    bgcolor: "action.hover",
                                    "&:hover": { bgcolor: "action.selected" },
                                  }}
                                >
                                  <ExpandMoreIcon
                                    sx={{
                                      transform: expanded
                                        ? "rotate(180deg)"
                                        : "rotate(0deg)",
                                      transition: "transform 0.3s ease",
                                    }}
                                  />
                                </IconButton>
                              </Stack>
                            </Stack>

                            <Collapse
                              in={expanded}
                              timeout="auto"
                              unmountOnExit
                            >
                              <Divider sx={{ my: 2 }} />
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: { xs: "column", md: "row" },
                                  gap: 3,
                                  mt: 2,
                                }}
                              >
                                <Box sx={{ flex: 1 }}>
                                  <Typography
                                    variant="subtitle2"
                                    sx={{ fontWeight: 700, mb: 2 }}
                                  >
                                    {t("labels.items_detail")}
                                  </Typography>
                                  {(o?.items || []).map((it) => (
                                    <Box
                                      key={it.id}
                                      display="flex"
                                      alignItems="center"
                                      gap={2}
                                      sx={{
                                        py: 1.5,
                                        px: 2,
                                        mb: 1,
                                        bgcolor: "grey.50",
                                        borderRadius: 1,
                                      }}
                                    >
                                      <Avatar
                                        variant="rounded"
                                        src={it.image || undefined}
                                        alt={it.dishName}
                                        sx={{
                                          width: 72,
                                          height: 72,
                                          borderRadius: 2,
                                        }}
                                      >
                                        {it.dishName?.charAt(0) || "?"}
                                      </Avatar>
                                      <Box sx={{ minWidth: 0 }}>
                                        <Typography
                                          variant="body2"
                                          sx={{ fontWeight: 600 }}
                                          noWrap
                                        >
                                          {it.dishName}
                                        </Typography>
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          noWrap
                                        >
                                          x{it.quantity} •{" "}
                                          {(
                                            it.unitPrice ?? it.totalPrice
                                          ).toLocaleString()}
                                          đ
                                        </Typography>
                                      </Box>
                                      <Box sx={{ ml: "auto" }}>
                                        <Typography variant="body2">
                                          {(
                                            it.totalPrice ?? 0
                                          ).toLocaleString()}
                                          đ
                                        </Typography>
                                      </Box>
                                    </Box>
                                  ))}
                                </Box>

                                <Box
                                  sx={{
                                    width: { xs: "100%", md: 380 },
                                    p: 2.5,
                                    bgcolor: "grey.50",
                                    borderRadius: 2,
                                  }}
                                >
                                  <Typography
                                    variant="h6"
                                    sx={{ fontWeight: 700, mb: 2 }}
                                  >
                                    {t("labels.delivery_info")}
                                  </Typography>
                                  <Box sx={{ mb: 2 }}>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{ mb: 0.5 }}
                                    >
                                      {t("labels.recipient")}
                                    </Typography>
                                    <Typography
                                      variant="body1"
                                      sx={{ fontWeight: 600 }}
                                    >
                                      {o?.recipientName || "-"}
                                    </Typography>
                                    <Typography variant="body2">
                                      {o?.recipientPhone || "-"}
                                    </Typography>
                                  </Box>

                                  <Box sx={{ mb: 2 }}>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{ mb: 0.5 }}
                                    >
                                      {t("labels.delivery_address")}
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      sx={{ wordBreak: "break-word" }}
                                    >
                                      {o?.deliveryAddress ||
                                        o?.restaurant?.address ||
                                        "-"}
                                    </Typography>
                                  </Box>

                                  <Divider sx={{ my: 2 }} />

                                  <Stack direction="column" spacing={2}>
                                    <FormControl fullWidth>
                                      <InputLabel
                                        id={`delivery-select-${o?.id}`}
                                      >
                                        {t("labels.delivery_status_label")}
                                      </InputLabel>
                                      <Select
                                        labelId={`delivery-select-${o?.id}`}
                                        value={
                                          (o?.deliveryStatus as DeliveryStatus) ??
                                          DeliveryStatus.Preparing
                                        }
                                        label="Trạng thái giao hàng"
                                        onChange={(e) =>
                                          handleChangeDelivery(
                                            o?.id ?? 0,
                                            e.target.value as DeliveryStatus
                                          )
                                        }
                                      >
                                        {statusOptions.map((s) => {
                                          const attemptingDelivered =
                                            s.value ===
                                            DeliveryStatus.Delivered;
                                          const isShippingState =
                                            String(o?.deliveryStatus || "")
                                              .toLowerCase()
                                              .includes("ship") ||
                                            String(o?.deliveryStatus || "")
                                              .toLowerCase()
                                              .includes("deliver");
                                          const codNotCollected =
                                            Boolean(p.codPayment) &&
                                            !p.codPayment?.isCollected;

                                          // Disable selecting "Đã giao" unless order is in shipping/delivering
                                          // and COD (if present) has already been collected.
                                          const disableDeliveredOption =
                                            attemptingDelivered &&
                                            (codNotCollected ||
                                              !isShippingState);

                                          // Get current status index - normalize to lowercase for comparison
                                          const currentDeliveryStatusLower =
                                            String(
                                              o?.deliveryStatus || ""
                                            ).toLowerCase();
                                          const currentStatusIndex =
                                            statusOptions.findIndex((opt) => {
                                              const optValue = String(
                                                opt.value
                                              ).toLowerCase();
                                              // Handle "Delivering" mapping to "Shipping"
                                              if (
                                                currentDeliveryStatusLower.includes(
                                                  "deliver"
                                                ) ||
                                                currentDeliveryStatusLower.includes(
                                                  "ship"
                                                )
                                              ) {
                                                return optValue.includes(
                                                  "ship"
                                                );
                                              }
                                              return (
                                                optValue ===
                                                currentDeliveryStatusLower
                                              );
                                            });
                                          const thisStatusIndex =
                                            statusOptions.findIndex(
                                              (opt) => opt.value === s.value
                                            );

                                          // Disable previous statuses (don't allow going back)
                                          const isPreviousStatus =
                                            currentStatusIndex !== -1 &&
                                            thisStatusIndex <
                                              currentStatusIndex;

                                          return (
                                            <MenuItem
                                              key={s.value}
                                              value={s.value}
                                              disabled={
                                                disableDeliveredOption ||
                                                isPreviousStatus
                                              }
                                            >
                                              {s.label}
                                            </MenuItem>
                                          );
                                        })}
                                      </Select>
                                    </FormControl>

                                    {(() => {
                                      const isShippingState =
                                        String(o?.deliveryStatus || "")
                                          .toLowerCase()
                                          .includes("ship") ||
                                        String(o?.deliveryStatus || "")
                                          .toLowerCase()
                                          .includes("deliver");
                                      const codNotCollected =
                                        Boolean(p.codPayment) &&
                                        !p.codPayment?.isCollected;
                                      const canMarkDelivered =
                                        isShippingState && !codNotCollected;

                                      return (
                                        <Button
                                          variant="contained"
                                          fullWidth
                                          size="large"
                                          onClick={() =>
                                            openConfirmDialog({
                                              type: "delivered",
                                              orderId: o?.id,
                                            })
                                          }
                                          disabled={!canMarkDelivered}
                                          sx={{ py: 1.5 }}
                                        >
                                          {t("btn.mark_delivered")}
                                        </Button>
                                      );
                                    })()}

                                    {p.codPayment ? (
                                      p.codPayment.isCollected ? (
                                        <Paper
                                          variant="outlined"
                                          sx={{
                                            p: 2,
                                            bgcolor: "success.50",
                                            borderColor: "success.main",
                                          }}
                                        >
                                          <Typography
                                            variant="body2"
                                            color="success.dark"
                                            sx={{ fontWeight: 600 }}
                                          >
                                            {t("labels.collected")}
                                          </Typography>
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                          >
                                            {p.codPayment.collectedAt
                                              ? new Date(
                                                  p.codPayment.collectedAt
                                                ).toLocaleString("vi-VN")
                                              : "-"}
                                          </Typography>
                                        </Paper>
                                      ) : (
                                        <Button
                                          variant="outlined"
                                          fullWidth
                                          size="large"
                                          color="warning"
                                          onClick={() =>
                                            openConfirmDialog({
                                              type: "cod",
                                              paymentId: p.id,
                                            })
                                          }
                                          sx={{ py: 1.5 }}
                                        >
                                          {t("btn.confirm_cod")}
                                        </Button>
                                      )
                                    ) : null}
                                  </Stack>
                                </Box>
                              </Box>
                            </Collapse>
                          </Box>
                        </ListItem>
                      </Paper>
                    );
                  })}
                </List>
              );
            })()
          )}
        </Box>
      )}

      <Dialog open={confirmDialog.open} onClose={closeConfirmDialog}>
        <DialogTitle>{t("confirm.title")}</DialogTitle>
        <DialogContent>
          <Typography>
            {confirmDialog.type === "cod"
              ? t("confirm.cod")
              : t("confirm.delivered")}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmDialog}>{t("btn.cancel")}</Button>
          <Button variant="contained" onClick={handleConfirmDialog}>
            {t("btn.confirm")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast notifications handled globally via ToastContainer */}
    </Box>
  );
}
