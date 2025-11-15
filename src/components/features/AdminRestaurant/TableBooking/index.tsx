"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
  Typography,
  Paper,
  Alert,
  Stack,
} from "@mui/material";
import dayjs from "dayjs";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { fetchRestaurantByOwner } from "@/redux/slices/restaurantSlice";
import axiosInstance from "@/lib/axios/axiosInstance";
import {
  fetchReservationsByRestaurant,
  updateReservationStatus,
  deleteReservationForBusiness,
} from "@/redux/slices/reservationSlice";
import { getAccessToken } from "@/lib/utils/tokenHelper";
import { toast } from "react-toastify";
import type { ReservationStatusName } from "@/types/reservation";

// Use typed rows from slice/types

const getUserFromLocalStorage = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = getAccessToken();
    return { user, token } as {
      user: { userId?: number };
      token: string | null;
    };
  } catch {
    return { user: {}, token: null } as {
      user: { userId?: number };
      token: string | null;
    };
  }
};

const toDisplayStatus = (status: string | number) => {
  const raw = typeof status === "string" ? status : String(status);
  // Backend enum names: Pending, Confirmed, CheckedIn, Completed, Cancelled
  const norm = raw.toLowerCase();
  if (norm.includes("pending")) return "Pending";
  if (norm.includes("confirmed")) return "Confirmed";
  if (norm.includes("checkedin")) return "CheckedIn";
  if (norm.includes("completed")) return "Completed";
  if (norm.includes("cancel")) return "Cancelled";
  return raw;
};

const nextStatusOptions = (status: string) => {
  switch (status) {
    case "Pending":
      return ["Confirmed", "Cancelled"] as const;
    case "Confirmed":
      return ["CheckedIn", "Cancelled"] as const;
    case "CheckedIn":
      return ["Completed"] as const;
    default:
      return [] as const; // Completed/Cancelled: no actions
  }
};

const formatTime = (hhmmss?: string) => {
  if (!hhmmss) return "";
  const [h, m] = hhmmss.split(":");
  if (!h || !m) return hhmmss;
  return `${h}:${m}`;
};

const TableBooking: React.FC = () => {
  const dispatch = useAppDispatch();
  const { current: restaurant } = useAppSelector((s) => s.restaurant);
  const {
    reservations: rows,
    loading,
    error,
  } = useAppSelector((s) => s.reservation);

  const [updateDialog, setUpdateDialog] = useState<{
    open: boolean;
    id?: number;
    current?: string;
  }>({ open: false });
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [note, setNote] = useState<string>("");

  // init: set token header and load restaurant owned by user
  useEffect(() => {
    const { token } = getUserFromLocalStorage();
    if (token) {
      axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
      dispatch(fetchRestaurantByOwner({ token }));
    }
  }, [dispatch]);

  // fetch reservations when restaurant is ready
  useEffect(() => {
    if (!restaurant?.id) return;
    dispatch(fetchReservationsByRestaurant(restaurant.id));
  }, [restaurant?.id, dispatch]);

  const refresh = React.useCallback(async () => {
    if (!restaurant?.id) return;
    await dispatch(fetchReservationsByRestaurant(restaurant.id));
  }, [restaurant?.id, dispatch]);

  const handleOpenUpdate = React.useCallback((id: number, current: string) => {
    setSelectedStatus("");
    setNote("");
    setUpdateDialog({ open: true, id, current });
  }, []);

  const handleUpdateStatus = async () => {
    if (!updateDialog.id) return;
    const { user } = getUserFromLocalStorage();
    const changedBy = user.userId ?? 0;
    if (!selectedStatus) return toast.warning("Chọn trạng thái mới");
    try {
      await dispatch(
        updateReservationStatus({
          id: updateDialog.id,
          data: {
            status: selectedStatus as ReservationStatusName,
            changedBy,
            note: note || undefined,
          },
        })
      ).unwrap();
      toast.success("Cập nhật trạng thái thành công");
      setUpdateDialog({ open: false });
      await refresh();
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.error(err?.message || "Cập nhật thất bại");
    }
  };

  const handleCancelByBusiness = React.useCallback(
    async (reservationId: number) => {
      const confirm = window.confirm(
        "Bạn có chắc muốn hủy đặt bàn này (hủy bởi nhà hàng)?"
      );
      if (!confirm) return;
      const { user } = getUserFromLocalStorage();
      const userId = user.userId ?? 0;
      try {
        await dispatch(
          deleteReservationForBusiness({ reservationId, userId })
        ).unwrap();
        toast.success("Đã hủy đặt bàn (bởi nhà hàng)");
        await refresh();
      } catch (e: unknown) {
        const err = e as { message?: string };
        toast.error(err?.message || "Hủy thất bại");
      }
    },
    [dispatch, refresh]
  );

  const content = useMemo(() => {
    if (loading)
      return (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      );
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!rows.length) return <Typography>Chưa có đặt bàn nào.</Typography>;

    return (
      <Grid container spacing={2}>
        {rows.map((r) => {
          const displayStatus = toDisplayStatus(r.status);
          const actions = nextStatusOptions(displayStatus);
          const customer = r.customers?.[0];
          return (
            <Grid
              item
              xs={12}
              md={6}
              lg={4}
              key={r.id}
              component={"div" as React.ElementType}
            >
              <Paper sx={{ p: 2, height: "100%" }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography variant="h6" fontWeight={700}>
                    Đặt bàn #{r.id}
                  </Typography>
                  <Chip
                    label={displayStatus}
                    color={
                      displayStatus === "Pending"
                        ? "default"
                        : displayStatus === "Confirmed"
                        ? "info"
                        : displayStatus === "CheckedIn"
                        ? "warning"
                        : displayStatus === "Completed"
                        ? "success"
                        : "error"
                    }
                  />
                </Stack>

                <Stack spacing={0.5} mb={1}>
                  <Typography variant="body2">
                    <b>Khách:</b>{" "}
                    {customer?.contactName || r.userName || `#${r.userId}`}
                  </Typography>
                  <Typography variant="body2">
                    <b>Liên hệ:</b> {customer?.phone || "-"} ·{" "}
                    {customer?.email || "-"}
                  </Typography>
                </Stack>

                <Stack spacing={0.5} mb={1}>
                  <Typography variant="body2">
                    <b>Người lớn:</b> {r.adultCount} · <b>Trẻ em:</b>{" "}
                    {r.childCount}
                  </Typography>
                  <Typography variant="body2">
                    <b>Ngày đến:</b>{" "}
                    {dayjs(r.arrivalDate).isValid()
                      ? dayjs(r.arrivalDate).format("DD/MM/YYYY")
                      : r.arrivalDate}{" "}
                    · <b>Giờ:</b> {formatTime(r.reservationTime)}
                  </Typography>
                  {r.note && (
                    <Typography variant="body2">
                      <b>Ghi chú:</b> {r.note}
                    </Typography>
                  )}
                </Stack>

                <Stack direction="row" spacing={1}>
                  {actions.length > 0 ? (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleOpenUpdate(r.id, displayStatus)}
                    >
                      Cập nhật trạng thái
                    </Button>
                  ) : (
                    <Chip size="small" label="Không có hành động" />
                  )}
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => handleCancelByBusiness(r.id)}
                  >
                    Hủy (Nhà hàng)
                  </Button>
                  <Chip
                    size="small"
                    variant="outlined"
                    label={dayjs(r.createdAt).format("DD/MM/YYYY HH:mm")}
                  />
                </Stack>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    );
  }, [rows, loading, error, handleCancelByBusiness, handleOpenUpdate]);

  return (
    <Box p={2}>
      <Typography variant="h5" fontWeight={700} mb={2}>
        Danh sách đặt bàn
      </Typography>
      {content}

      <Dialog
        open={updateDialog.open}
        onClose={() => setUpdateDialog({ open: false })}
      >
        <DialogTitle>Cập nhật trạng thái</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} minWidth={{ xs: 260, sm: 360 }}>
            <TextField
              label="Trạng thái hiện tại"
              value={updateDialog.current || ""}
              InputProps={{ readOnly: true }}
            />
            <TextField
              select
              label="Chọn trạng thái mới"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {nextStatusOptions(updateDialog.current || "").map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Ghi chú (tuỳ chọn)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialog({ open: false })}>Huỷ</Button>
          <Button
            variant="contained"
            onClick={handleUpdateStatus}
            disabled={!selectedStatus}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TableBooking;
