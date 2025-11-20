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
  Snackbar,
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

export default function StaffRestaurantOrders() {
  const dispatch = useAppDispatch();
  const currentStaff = useAppSelector((s) => s.staff.currentStaff);
  const paymentState = useAppSelector((s) => s.payment);
  const staffLoading = useAppSelector((s) => s.staff.loading);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<
    number | null
  >(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });
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
        else
          setSnackbar({
            open: true,
            message: msg || "Lỗi khi lấy đơn hàng",
            severity: "error",
          });
      }
    })();
  }, [dispatch, selectedRestaurantId]);

  const loading = paymentState.loading || staffLoading;

  const handleChangeRestaurant = (id: number) => setSelectedRestaurantId(id);

  const handleChangeDelivery = async (
    orderId: number,
    value: DeliveryStatus
  ) => {
    const mapped =
      String(value).toLowerCase() === "shipping"
        ? ("Delivering" as unknown as typeof value)
        : value;
    try {
      await dispatch(
        updateDeliveryStatus({ id: orderId, deliveryStatus: mapped })
      ).unwrap();
      setSnackbar({
        open: true,
        message: "Cập nhật trạng thái giao hàng thành công",
        severity: "success",
      });
      if (selectedRestaurantId && !noPermission)
        dispatch(
          fetchPaymentsByRestaurant({ restaurantId: selectedRestaurantId })
        );
    } catch (e: unknown) {
      setSnackbar({
        open: true,
        message: (e as Error)?.message ?? "Cập nhật thất bại",
        severity: "error",
      });
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
        setSnackbar({
          open: true,
          message: "Xác nhận thu COD thành công",
          severity: "success",
        });
      }
      if (confirmDialog.type === "delivered" && confirmDialog.orderId) {
        await dispatch(
          updateDeliveryStatus({
            id: confirmDialog.orderId,
            deliveryStatus: DeliveryStatus.Delivered,
          })
        ).unwrap();
        setSnackbar({
          open: true,
          message: "Đã đánh dấu Đã giao",
          severity: "success",
        });
      }
      if (selectedRestaurantId && !noPermission)
        dispatch(
          fetchPaymentsByRestaurant({ restaurantId: selectedRestaurantId })
        );
    } catch (e: unknown) {
      setSnackbar({
        open: true,
        message: (e as Error)?.message ?? "Thao tác thất bại",
        severity: "error",
      });
    } finally {
      closeConfirmDialog();
    }
  };

  const statusOptions: { label: string; value: DeliveryStatus }[] = [
    { label: "Đang chuẩn bị", value: DeliveryStatus.Preparing },
    { label: "Đang giao", value: DeliveryStatus.Shipping },
    { label: "Đã giao", value: DeliveryStatus.Delivered },
    { label: "Thất bại", value: DeliveryStatus.Failed },
  ];

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
    <Box>
      <Typography variant="h6" mb={2}>
        Đơn hàng (dành cho nhân viên giao hàng)
      </Typography>

      {!currentStaff && (
        <Typography>Đang lấy thông tin nhân viên...</Typography>
      )}

      {currentStaff && (
        <Box mb={2} display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="restaurant-select-label">Nhà hàng</InputLabel>
            <Select
              labelId="restaurant-select-label"
              value={selectedRestaurantId ?? ""}
              label="Nhà hàng"
              onChange={(e) => handleChangeRestaurant(Number(e.target.value))}
            >
              {restaurants.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {loading && (
        <Box display="flex" alignItems="center" gap={1}>
          <CircularProgress size={20} />{" "}
          <Typography>Đang tải đơn hàng...</Typography>
        </Box>
      )}

      {!loading && (
        <Box>
          {noPermission ? (
            <Alert severity="warning">
              Bạn không có quyền xem thông tin thanh toán; chỉ hiển thị đơn hàng
              sẽ bị tắt.
            </Alert>
          ) : (
            (() => {
              const payments = paymentState.restaurantPayments ?? [];
              if (payments.length === 0)
                return <Typography>Không có đơn hàng</Typography>;

              return (
                <List>
                  {payments.map((p) => {
                    const o = p.order;
                    const expanded = Boolean(o?.id && expandedOrders[o.id]);
                    return (
                      <Paper
                        key={p.id}
                        sx={{ mb: 2, p: 1.25 }}
                        variant="outlined"
                      >
                        <ListItem disableGutters>
                          <Box sx={{ width: "100%" }}>
                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              justifyContent="space-between"
                              alignItems="center"
                              spacing={1}
                            >
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={2}
                                sx={{ minWidth: 0 }}
                              >
                                <Avatar
                                  sx={{
                                    width: 56,
                                    height: 56,
                                    bgcolor: "background.paper",
                                  }}
                                >
                                  {String(
                                    o?.recipientName || o?.userId || ""
                                  ).charAt(0) || "#"}
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography
                                    variant="subtitle1"
                                    noWrap
                                    sx={{ fontWeight: 700 }}
                                  >
                                    {`Đơn #${o?.id} — ${
                                      o?.recipientName || `#${o?.userId}`
                                    }`}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    noWrap
                                  >
                                    {`Tổng: ${(
                                      o?.finalPrice ??
                                      p.amount ??
                                      0
                                    ).toLocaleString()}đ — Tạo: ${
                                      o?.createdAt
                                        ? new Date(o.createdAt).toLocaleString()
                                        : "-"
                                    }`}
                                  </Typography>
                                </Box>
                              </Stack>

                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                              >
                                <Chip
                                  size="small"
                                  label={labelOrderStatus(o?.status)}
                                  color={chipColorForOrder(o?.status)}
                                />

                                <Chip
                                  size="small"
                                  label={labelDeliveryStatus(o?.deliveryStatus)}
                                  color={chipColorForDelivery(
                                    o?.deliveryStatus
                                  )}
                                />

                                <IconButton
                                  aria-label={expanded ? "collapse" : "expand"}
                                  onClick={() => toggleExpand(o?.id ?? 0)}
                                  size="small"
                                >
                                  <ExpandMoreIcon
                                    sx={{
                                      transform: expanded
                                        ? "rotate(180deg)"
                                        : "rotate(0deg)",
                                      transition: "transform 0.2s",
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
                              <Divider sx={{ my: 1 }} />
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: { xs: "column", md: "row" },
                                  gap: 2,
                                }}
                              >
                                <Box sx={{ flex: 1 }}>
                                  {/* Items */}
                                  {(o?.items || []).map((it) => (
                                    <Box
                                      key={it.id}
                                      display="flex"
                                      alignItems="center"
                                      gap={2}
                                      sx={{ py: 0.75 }}
                                    >
                                      <Avatar
                                        variant="rounded"
                                        src={it.image || undefined}
                                        alt={it.dishName}
                                        sx={{ width: 56, height: 40 }}
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

                                <Box sx={{ width: { xs: "100%", md: 320 } }}>
                                  <Typography
                                    variant="subtitle2"
                                    sx={{ fontWeight: 700 }}
                                  >
                                    Thông tin giao hàng
                                  </Typography>
                                  <Typography variant="body2">
                                    {o?.recipientName} •{" "}
                                    {o?.recipientPhone || "-"}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    sx={{ wordBreak: "break-word" }}
                                  >
                                    {o?.deliveryAddress ||
                                      o?.restaurant?.address ||
                                      "-"}
                                  </Typography>

                                  <Divider sx={{ my: 1 }} />

                                  <Stack direction="column" spacing={1}>
                                    <FormControl size="small">
                                      <InputLabel
                                        id={`delivery-select-${o?.id}`}
                                      >
                                        Trạng thái giao
                                      </InputLabel>
                                      <Select
                                        labelId={`delivery-select-${o?.id}`}
                                        value={
                                          (o?.deliveryStatus as DeliveryStatus) ??
                                          DeliveryStatus.Preparing
                                        }
                                        label="Trạng thái giao"
                                        onChange={(e) =>
                                          handleChangeDelivery(
                                            o?.id ?? 0,
                                            e.target.value as DeliveryStatus
                                          )
                                        }
                                      >
                                        {statusOptions.map((s) => (
                                          <MenuItem
                                            key={s.value}
                                            value={s.value}
                                          >
                                            {s.label}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>

                                    <Button
                                      variant="contained"
                                      size="small"
                                      onClick={() =>
                                        openConfirmDialog({
                                          type: "delivered",
                                          orderId: o?.id,
                                        })
                                      }
                                    >
                                      Đánh dấu Đã giao
                                    </Button>

                                    {p.codPayment ? (
                                      p.codPayment.isCollected ? (
                                        <Typography variant="body2">
                                          Đã thu COD:{" "}
                                          {p.codPayment.collectedAt
                                            ? new Date(
                                                p.codPayment.collectedAt
                                              ).toLocaleString()
                                            : "-"}
                                        </Typography>
                                      ) : (
                                        <Button
                                          variant="outlined"
                                          size="small"
                                          onClick={() =>
                                            openConfirmDialog({
                                              type: "cod",
                                              paymentId: p.id,
                                            })
                                          }
                                        >
                                          Xác nhận thu COD
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
        <DialogTitle>Xác nhận</DialogTitle>
        <DialogContent>
          <Typography>
            {confirmDialog.type === "cod"
              ? "Bạn có chắc chắn muốn xác nhận thu COD?"
              : "Bạn muốn đánh dấu đơn đã giao?"}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmDialog}>Hủy</Button>
          <Button variant="contained" onClick={handleConfirmDialog}>
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
