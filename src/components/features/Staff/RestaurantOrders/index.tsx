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
  ListItemText,
  Avatar,
  Divider,
  Chip,
} from "@mui/material";
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
  }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [noPermission, setNoPermission] = useState(false);

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
    if (!selectedRestaurantId && restaurants.length > 0) {
      setSelectedRestaurantId(restaurants[0].id);
    }
  }, [restaurants, selectedRestaurantId]);

  useEffect(() => {
    if (!selectedRestaurantId) return;

    // attempt to fetch restaurant payments and detect 403 / forbidden
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
        ) {
          setNoPermission(true);
        } else {
          // other errors: show brief snackbar
          setSnackbar({
            open: true,
            message: msg || "Lỗi khi lấy đơn hàng",
            severity: "error",
          });
        }
      }
    })();
  }, [dispatch, selectedRestaurantId]);

  const loading = paymentState.loading || staffLoading;

  const handleChangeRestaurant = (id: number) => {
    setSelectedRestaurantId(id);
  };

  const handleChangeDelivery = async (
    orderId: number,
    value: DeliveryStatus
  ) => {
    // map FE alias "Shipping" -> BE expects "Delivering"
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
      // refresh payments for the selected restaurant
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

              const handleConfirmCOD = async (paymentId: number) => {
                if (!selectedRestaurantId) return;
                try {
                  await dispatch(
                    confirmCODPaymentByPaymentId({
                      paymentId,
                      restaurantId: selectedRestaurantId,
                    })
                  ).unwrap();
                  setSnackbar({
                    open: true,
                    message: "Xác nhận thu COD thành công",
                    severity: "success",
                  });
                  // refresh
                  dispatch(
                    fetchPaymentsByRestaurant({
                      restaurantId: selectedRestaurantId,
                    })
                  );
                } catch (e: unknown) {
                  setSnackbar({
                    open: true,
                    message: (e as Error)?.message ?? "Xác nhận thất bại",
                    severity: "error",
                  });
                }
              };

              return (
                <List>
                  {payments.map((p) => {
                    const o = p.order;
                    return (
                      <Paper key={p.id} sx={{ mb: 1, p: 1 }} variant="outlined">
                        <ListItem>
                          <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                            width="100%"
                          >
                            <ListItemText
                              primary={`Đơn #${o?.id} — ${
                                o?.recipientName || `#${o?.userId}`
                              }`}
                              secondary={`Tổng: ${(
                                o?.finalPrice ??
                                p.amount ??
                                0
                              ).toLocaleString()}đ — Tạo: ${
                                o?.createdAt
                                  ? new Date(o.createdAt).toLocaleString()
                                  : "-"
                              }`}
                            />

                            <Box display="flex" gap={1} alignItems="center">
                              <Chip
                                size="small"
                                label={labelOrderStatus(o?.status)}
                                color={(():
                                  | "default"
                                  | "primary"
                                  | "secondary"
                                  | "error"
                                  | "info"
                                  | "success"
                                  | "warning" => {
                                  const s = String(
                                    o?.status || ""
                                  ).toLowerCase();
                                  if (s === "paid" || s === "success")
                                    return "success";
                                  if (s === "pending") return "warning";
                                  if (
                                    s === "cancelled" ||
                                    s === "canceled" ||
                                    s === "failed"
                                  )
                                    return "error";
                                  return "default";
                                })()}
                              />

                              <Chip
                                size="small"
                                label={labelDeliveryStatus(o?.deliveryStatus)}
                                color={(():
                                  | "default"
                                  | "primary"
                                  | "secondary"
                                  | "error"
                                  | "info"
                                  | "success"
                                  | "warning" => {
                                  const d = String(
                                    o?.deliveryStatus || ""
                                  ).toLowerCase();
                                  if (d === "delivered") return "success";
                                  if (d === "preparing") return "warning";
                                  if (d === "delivering" || d === "shipping")
                                    return "info";
                                  if (
                                    d === "canceled" ||
                                    d === "cancelled" ||
                                    d === "failed"
                                  )
                                    return "error";
                                  return "default";
                                })()}
                              />
                            </Box>
                          </Box>

                          <Box display="flex" gap={1} alignItems="center">
                            <Box
                              display="flex"
                              flexDirection="column"
                              gap={1}
                              alignItems="flex-end"
                            >
                              <FormControl size="small">
                                <Select
                                  value={
                                    (o?.deliveryStatus as DeliveryStatus) ??
                                    DeliveryStatus.Preparing
                                  }
                                  onChange={(e) =>
                                    handleChangeDelivery(
                                      o?.id ?? 0,
                                      e.target.value as DeliveryStatus
                                    )
                                  }
                                >
                                  {statusOptions.map((s) => (
                                    <MenuItem key={s.value} value={s.value}>
                                      {s.label}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>

                              <Button
                                variant="contained"
                                size="small"
                                onClick={() =>
                                  handleChangeDelivery(
                                    o?.id ?? 0,
                                    DeliveryStatus.Delivered
                                  )
                                }
                              >
                                Đánh dấu Đã giao
                              </Button>
                            </Box>
                          </Box>
                        </ListItem>

                        <Divider sx={{ my: 1 }} />

                        {/* Items */}
                        <Box sx={{ px: 1, pb: 1 }}>
                          {(o?.items || []).map((it) => (
                            <Box
                              key={it.id}
                              display="flex"
                              alignItems="center"
                              gap={2}
                              sx={{ py: 0.5 }}
                            >
                              <Avatar
                                variant="rounded"
                                src={it.image || undefined}
                                alt={it.dishName}
                                sx={{ width: 56, height: 40 }}
                              >
                                {it.dishName?.charAt(0) || "?"}
                              </Avatar>
                              <Box flex={1}>
                                <Typography variant="body2" fontWeight={600}>
                                  {it.dishName}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  x{it.quantity} •{" "}
                                  {(
                                    it.unitPrice ?? it.totalPrice
                                  ).toLocaleString()}
                                  đ
                                </Typography>
                              </Box>
                              <Typography variant="body2">
                                {it.totalPrice.toLocaleString()}đ
                              </Typography>
                            </Box>
                          ))}
                        </Box>

                        {/* Payment & restaurant info */}
                        <Box
                          sx={{
                            px: 1,
                            pb: 1,
                            display: "flex",
                            gap: 2,
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Box>
                            <Typography variant="body2">
                              Nhà hàng: {o?.restaurant?.name}
                            </Typography>
                            <Typography variant="body2">
                              Địa chỉ:{" "}
                              {o?.deliveryAddress || o?.restaurant?.address}
                            </Typography>
                          </Box>

                          <Box textAlign="right">
                            <Typography variant="body2">
                              Thanh toán: {p.status}
                            </Typography>
                            <Typography variant="body2">
                              Số tiền: {(p.amount ?? 0).toLocaleString()}đ
                            </Typography>
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
                                  onClick={() => handleConfirmCOD(p.id)}
                                >
                                  Xác nhận thu COD
                                </Button>
                              )
                            ) : null}
                          </Box>
                        </Box>
                      </Paper>
                    );
                  })}
                </List>
              );
            })()
          )}
        </Box>
      )}

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
