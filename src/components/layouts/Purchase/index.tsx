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
  Collapse,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from "@mui/material";
import { toast } from "react-toastify";
import { useTranslations } from "next-intl";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { useRouter } from "next/navigation";
import { InfoPayment } from "@/types/payment";
import type { OrderResponse, OrderItem } from "@/types/order";
import {
  fetchPaymentHistoryByUser,
  cancelOrder,
} from "@/redux/slices/paymentSlice";

const PurchaseHistoryPage = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const t = useTranslations("purchase");

  const paymentState = useAppSelector((s) => s.payment);
  const history = paymentState.history;

  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    orderId?: number;
    orderStatus?: string;
  }>({ open: false });
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // order status filter labels — use translations
  const ORDER_STATUSES: { key: string; label: string }[] = [
    { key: "all", label: t("statuses.all") },
    { key: "preparing", label: t("statuses.preparing") },
    { key: "delivering", label: t("statuses.delivering") },
    { key: "delivered", label: t("statuses.delivered") },
    { key: "canceled", label: t("statuses.canceled") },
  ];

  const normalize = (s?: string | null) => (s ? String(s).toLowerCase() : "");

  const paymentLabel = (status?: string) => {
    switch (normalize(status)) {
      case "success":
      case "paid":
        return t("payment.paid");
      case "pending":
        return t("payment.pending");
      case "failed":
        return t("payment.failed");
      case "cancelled":
      case "canceled":
        return t("payment.canceled");
      case "refunded":
        return t("payment.refunded");
      default:
        return status ?? t("unknown");
    }
  };

  const paymentChipColor = (status?: string) => {
    switch (normalize(status)) {
      case "success":
      case "paid":
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

  const orderStatusLabel = (status?: string) => {
    switch (normalize(status)) {
      case "pending":
        return t("order.pending");
      case "paid":
        return t("order.paid");
      case "processing":
        return t("order.processing");
      case "cancelled":
      case "canceled":
        return t("order.canceled");
      case "failed":
        return t("order.failed");
      default:
        return status ?? t("unknown");
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

  const deliveryStatusLabel = (status?: string) => {
    switch (normalize(status)) {
      case "preparing":
        return t("delivery.preparing");
      case "delivering":
        return t("delivery.delivering");
      case "delivered":
        return t("delivery.delivered");
      case "canceled":
      case "cancelled":
        return t("delivery.canceled");
      default:
        return status ?? t("unknown");
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

  const canCancelOrder = (orderStatus?: string) =>
    normalize(orderStatus) !== "paid";

  useEffect(() => {
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

  useEffect(() => {
    // re-render when history updates
  }, [history]);

  const handleCancelOrder = (orderId: number, orderStatus?: string) => {
    if (!canCancelOrder(orderStatus)) {
      toast.error("Không thể hủy đơn hàng đã thanh toán");
      return;
    }
    setConfirmDialog({ open: true, orderId, orderStatus });
  };

  const handleConfirmCancel = async () => {
    const { orderId } = confirmDialog;
    if (!orderId) return;

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
      toast.success("Hủy đơn hàng thành công");
      setConfirmDialog({ open: false });
      // Fetch lại danh sách để cập nhật UI
      if (uid) {
        await dispatch(fetchPaymentHistoryByUser({ userId: uid }));
      }
    } catch (error: unknown) {
      toast.error(
        (error as { message?: string })?.message || "Không thể hủy đơn hàng"
      );
      setConfirmDialog({ open: false });
    }
  };

  // unify history type to support both InfoPayment (old) and OrderResponse (new API)
  const historyList = history as unknown as Array<InfoPayment | OrderResponse>;

  const isInfoPayment = (h: InfoPayment | OrderResponse): h is InfoPayment =>
    (h as InfoPayment).order !== undefined;

  const getOrderFrom = (h: InfoPayment | OrderResponse): OrderResponse =>
    isInfoPayment(h) ? (h as InfoPayment).order : (h as OrderResponse);

  const getPaymentStatus = (
    h: InfoPayment | OrderResponse,
    ord: OrderResponse
  ): string =>
    isInfoPayment(h) ? (h as InfoPayment).status : String(ord.status ?? "");

  const getDisplayAmount = (
    h: InfoPayment | OrderResponse,
    ord: OrderResponse
  ): number =>
    (typeof ord.finalPrice === "number" ? ord.finalPrice : undefined) ??
    (isInfoPayment(h) ? (h as InfoPayment).amount : 0);

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
          {t("title")}
        </Typography>

        <Box mb={2}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {ORDER_STATUSES.map((s) => {
              const count = historyList.filter((h) => {
                if (s.key === "all") return true;
                const ord = getOrderFrom(h);
                const st = normalize(ord?.deliveryStatus);
                if (s.key === "canceled")
                  return st === "cancelled" || st === "canceled";
                return st === s.key;
              }).length;
              return (
                <Button
                  key={s.key}
                  size="small"
                  variant={selectedStatus === s.key ? "contained" : "outlined"}
                  onClick={() => setSelectedStatus(s.key)}
                  sx={{ textTransform: "none" }}
                >
                  {s.label} ({count})
                </Button>
              );
            })}
          </Stack>
        </Box>

        {paymentState.error ? (
          <Typography color="error">{paymentState.error}</Typography>
        ) : history.length === 0 ? (
          <Box textAlign="center" py={4}>
            <ShoppingCartOutlinedIcon
              sx={{ fontSize: 56, color: "text.disabled", mb: 1 }}
            />
            <Typography color="text.secondary">{t("empty")}</Typography>
          </Box>
        ) : (
          <Stack spacing={1}>
            {historyList
              .filter((h) => {
                if (selectedStatus === "all") return true;
                const ord = getOrderFrom(h);
                const st = normalize(ord?.deliveryStatus);
                if (selectedStatus === "canceled")
                  return st === "cancelled" || st === "canceled";
                return st === selectedStatus;
              })
              .map((h) => {
                const ord = getOrderFrom(h);
                const orderId = ord?.id ?? -1;
                return (
                  <Paper
                    key={ord?.id ?? (isInfoPayment(h) ? h.id : Math.random())}
                    variant="outlined"
                    sx={{ p: 1.5 }}
                  >
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      flexWrap="wrap"
                      gap={1}
                    >
                      <Box>
                        <Typography fontWeight={600}>
                          {t("order_prefix")}#{ord?.id ?? "-"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {ord?.createdAt
                            ? new Date(ord.createdAt).toLocaleString()
                            : "-"}
                        </Typography>
                        <Typography variant="body2">
                          {t("labels.restaurant")}{" "}
                          {ord?.restaurant?.name ||
                            `#${ord?.restaurantId ?? "-"}`}
                        </Typography>
                        <Box
                          mt={0.5}
                          display="flex"
                          gap={1}
                          alignItems="center"
                        >
                          <Chip
                            label={orderStatusLabel(ord?.status)}
                            color={orderStatusColor(ord?.status)}
                            size="small"
                          />
                          <Chip
                            label={deliveryStatusLabel(ord?.deliveryStatus)}
                            color={deliveryStatusColor(ord?.deliveryStatus)}
                            size="small"
                          />
                        </Box>
                        {ord?.items && ord.items.length > 0 && (
                          <>
                            <Box
                              mt={0.5}
                              display="flex"
                              alignItems="center"
                              gap={1}
                            >
                              <Typography variant="body2">
                                {ord.items[0].dishName}
                                {ord.items[0].quantity
                                  ? ` x${ord.items[0].quantity}`
                                  : ""}
                              </Typography>
                              {ord.items.length > 1 && (
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
                                  {t("btn.more_items", {
                                    count: ord.items.length - 1,
                                  })}
                                </Button>
                              )}
                            </Box>
                            <Collapse in={!!expanded[orderId]}>
                              <List dense>
                                {ord.items.map((it: OrderItem) => (
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
                          label={paymentLabel(getPaymentStatus(h, ord))}
                          color={paymentChipColor(getPaymentStatus(h, ord))}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        {typeof ord?.totalPrice === "number" &&
                          typeof ord?.finalPrice === "number" &&
                          ord.totalPrice > ord.finalPrice && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ textDecoration: "line-through" }}
                            >
                              {Number(ord.totalPrice).toLocaleString()}đ
                            </Typography>
                          )}
                        <Typography fontWeight={700}>
                          {Number(getDisplayAmount(h, ord)).toLocaleString()}đ
                        </Typography>
                        <Box mt={0.5}>
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            sx={{ mr: 1 }}
                            disabled={!canCancelOrder(ord?.status)}
                            onClick={() => {
                              if (ord?.id) {
                                void handleCancelOrder(ord.id, ord.status);
                              }
                            }}
                          >
                            {t("btn.cancel_order")}
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              const rid =
                                ord?.restaurant?.id ?? ord?.restaurantId;
                              if (rid) router.push(`/RestaurantDetails/${rid}`);
                            }}
                          >
                            {t("btn.view_restaurant")}
                          </Button>
                        </Box>
                        <Typography
                          variant="caption"
                          display="block"
                          mt={0.5}
                          color="text.secondary"
                        >
                          {ord?.items?.length ?? 0} {t("labels.items")} •
                          {typeof ord?.totalPrice === "number" && (
                            <>
                              {" "}
                              {t("labels.original_price")}{" "}
                              {Number(ord.totalPrice).toLocaleString()}đ •
                            </>
                          )}{" "}
                          {t("labels.total")}{" "}
                          {Number(getDisplayAmount(h, ord)).toLocaleString()}đ
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
          </Stack>
        )}
      </Paper>

      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t("dialog.title")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("dialog.confirm_text", { id: confirmDialog.orderId ?? "" })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false })}>
            {t("btn.no")}
          </Button>
          <Button
            onClick={handleConfirmCancel}
            color="error"
            variant="contained"
            autoFocus
          >
            {t("btn.confirm_cancel")}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PurchaseHistoryPage;
