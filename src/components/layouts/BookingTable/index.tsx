"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Stack,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import dayjs from "dayjs";
import { useTranslations } from "next-intl";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import {
  fetchReservationsByUser,
  deleteReservation,
  createReservation,
} from "@/redux/slices/reservationSlice";
import axiosInstance from "@/lib/axios/axiosInstance";
import { getAccessToken } from "@/lib/utils/tokenHelper";
import { toast } from "react-toastify";

type UserLocal = {
  userId?: number;
  userName?: string;
  email?: string;
  phone?: string;
};

// Shape returned by GET /api/Reservation/user/{userId}
type UserReservationRow = {
  id: number;
  restaurantId: number;
  restaurantName?: string | null;
  adultCount: number;
  childCount: number;
  arrivalDate: string;
  reservationTime: string; // HH:mm:ss
  note?: string | null;
  status: string | number;
  createdAt: string;
};

const getUserFromLocalStorage = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = getAccessToken();
    return { user: user as UserLocal, token };
  } catch {
    return { user: {} as UserLocal, token: null as string | null };
  }
};

const toDisplayStatus = (status: string | number) => {
  const raw = typeof status === "string" ? status : String(status);
  const norm = raw.toLowerCase();
  if (norm.includes("pending")) return "Pending";
  if (norm.includes("confirmed")) return "Confirmed";
  if (norm.includes("checkedin")) return "CheckedIn";
  if (norm.includes("completed")) return "Completed";
  if (norm.includes("cancel")) return "Cancelled";
  return raw;
};

const canUserEdit = (status: string | number) =>
  toDisplayStatus(status) === "Pending";

const HHmm = (hhmmss?: string) => {
  if (!hhmmss) return "";
  const [h, m] = hhmmss.split(":");
  return h && m ? `${h}:${m}` : hhmmss;
};

const BookingTablePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { reservations, loading, error } = useAppSelector((s) => s.reservation);

  const t = useTranslations("tableBooking");

  const { user, token } = useMemo(getUserFromLocalStorage, []);
  const userId = user.userId ?? 0;

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<{
    id: number;
    restaurantId: number;
    adultCount: number;
    childCount: number;
    arrivalDate: string; // YYYY-MM-DD
    reservationTime: string; // HH:mm
    note?: string;
    contactName: string;
    phone: string;
    email: string;
  } | null>(null);

  // Init auth header and fetch list
  useEffect(() => {
    if (token) {
      axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
    }
    if (userId) {
      dispatch(fetchReservationsByUser(userId));
    }
  }, [dispatch, token, userId]);

  const onRefresh = useCallback(async () => {
    if (userId) await dispatch(fetchReservationsByUser(userId));
  }, [dispatch, userId]);

  const handleOpenEdit = useCallback(
    (row: UserReservationRow) => {
      if (!canUserEdit(row.status)) return;

      setEditing({
        id: row.id,
        restaurantId: row.restaurantId,
        adultCount: row.adultCount,
        childCount: row.childCount,
        arrivalDate: dayjs(row.arrivalDate).isValid()
          ? dayjs(row.arrivalDate).format("YYYY-MM-DD")
          : "",
        reservationTime: HHmm(row.reservationTime),
        note: row.note ?? "",
        contactName: user.userName || "",
        phone: user.phone || "",
        email: user.email || "",
      });
      setEditOpen(true);
    },
    [user.email, user.phone, user.userName]
  );

  const handleCancel = useCallback(
    async (row: UserReservationRow) => {
      if (!canUserEdit(row.status))
        return toast.info(t("warnings.cannot_cancel_pending"));
      try {
        await dispatch(
          deleteReservation({ reservationId: row.id, userId: userId })
        ).unwrap();
        toast.success(t("success.cancel"));
        await onRefresh();
      } catch (e: unknown) {
        const err = e as { message?: string };
        toast.error(err?.message || t("errors.cancel_failed"));
      }
    },
    [dispatch, onRefresh, userId, t]
  );

  const handleSaveEdit = async () => {
    if (!editing) return;
    // Strategy: cancel old (must be Pending), then create new with edited values
    try {
      await dispatch(
        deleteReservation({ reservationId: editing.id, userId })
      ).unwrap();

      const arrivalISO = dayjs(editing.arrivalDate).toDate().toISOString();
      // reservationTime as HH:mm to HH:mm:00 for BE TimeSpan
      const timeStr = `${editing.reservationTime}:00`;
      await dispatch(
        createReservation({
          userId,
          restaurantId: editing.restaurantId,
          adultCount: editing.adultCount,
          childCount: editing.childCount,
          arrivalDate: arrivalISO,
          reservationTime: timeStr,
          contactName: editing.contactName,
          phone: editing.phone,
          email: editing.email,
          note: editing.note || "",
        })
      ).unwrap();

      toast.success(t("success.update"));
      setEditOpen(false);
      setEditing(null);
      await onRefresh();
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.error(err?.message || "Cập nhật thất bại");
    }
  };

  const content = useMemo(() => {
    if (loading)
      return (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      );
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!reservations.length)
      return <Typography>{t("no_reservations")}</Typography>;

    return (
      <Grid container spacing={2}>
        {reservations.map((r: UserReservationRow) => {
          const status = toDisplayStatus(r.status);
          const canEdit = canUserEdit(r.status);
          const restaurantName = r.restaurantName ?? `#${r.restaurantId}`;
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
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    noWrap
                    title={restaurantName}
                  >
                    {restaurantName}
                  </Typography>
                  <Chip
                    label={status}
                    color={
                      status === "Pending"
                        ? "default"
                        : status === "Confirmed"
                        ? "info"
                        : status === "CheckedIn"
                        ? "warning"
                        : status === "Completed"
                        ? "success"
                        : "error"
                    }
                  />
                </Stack>

                <Stack spacing={0.5} mb={1}>
                  <Typography variant="body2">
                    {t("booking_number", { id: r.id })}
                  </Typography>
                  <Typography variant="body2">
                    <b>{t("label.adults")}</b> {r.adultCount} ·{" "}
                    <b>{t("label.children")}</b> {r.childCount}
                  </Typography>
                  <Typography variant="body2">
                    <b>{t("label.arrival_date")}</b>{" "}
                    {dayjs(r.arrivalDate).isValid()
                      ? dayjs(r.arrivalDate).format("DD/MM/YYYY")
                      : r.arrivalDate}{" "}
                    · <b>{t("label.time")}</b> {HHmm(r.reservationTime)}
                  </Typography>
                  {r.note && (
                    <Typography variant="body2">
                      <b>{t("label.note")}</b> {r.note}
                    </Typography>
                  )}
                </Stack>

                <Stack direction="row" spacing={1}>
                  {canEdit ? (
                    <>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleOpenEdit(r)}
                      >
                        {t("btn.edit")}
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="contained"
                        onClick={() => handleCancel(r)}
                      >
                        {t("btn.cancel_booking")}
                      </Button>
                    </>
                  ) : (
                    <Chip size="small" label={t("errors.cannot_edit")} />
                  )}
                </Stack>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    );
  }, [reservations, loading, error, handleOpenEdit, handleCancel, t]);

  return (
    <Box p={{ xs: 1, sm: 2, md: 3 }} sx={{ maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h5" fontWeight={700} mb={2}>
        {t("page_title")}
      </Typography>
      {content}

      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{t("dialog.edit_title")}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                fullWidth
                type="number"
                label={t("label.adults")}
                value={editing?.adultCount ?? 0}
                onChange={(e) =>
                  setEditing((s) =>
                    s ? { ...s, adultCount: Number(e.target.value) } : s
                  )
                }
                inputProps={{ min: 0 }}
              />
              <TextField
                fullWidth
                type="number"
                label={t("label.children")}
                value={editing?.childCount ?? 0}
                onChange={(e) =>
                  setEditing((s) =>
                    s ? { ...s, childCount: Number(e.target.value) } : s
                  )
                }
                inputProps={{ min: 0 }}
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                fullWidth
                type="date"
                label={t("label.arrival_date")}
                value={editing?.arrivalDate ?? ""}
                onChange={(e) =>
                  setEditing((s) =>
                    s ? { ...s, arrivalDate: e.target.value } : s
                  )
                }
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                type="time"
                label={t("label.time")}
                value={editing?.reservationTime ?? ""}
                onChange={(e) =>
                  setEditing((s) =>
                    s ? { ...s, reservationTime: e.target.value } : s
                  )
                }
                InputLabelProps={{ shrink: true }}
              />
            </Stack>

            <TextField
              fullWidth
              label={t("label.note")}
              value={editing?.note ?? ""}
              onChange={(e) =>
                setEditing((s) => (s ? { ...s, note: e.target.value } : s))
              }
              multiline
              rows={3}
            />

            <Typography variant="subtitle2">
              {t("customer_info_title")}
            </Typography>
            <TextField
              fullWidth
              label={t("label.name")}
              value={editing?.contactName ?? ""}
              onChange={(e) =>
                setEditing((s) =>
                  s ? { ...s, contactName: e.target.value } : s
                )
              }
            />
            <TextField
              fullWidth
              label={t("label.phone")}
              value={editing?.phone ?? ""}
              onChange={(e) =>
                setEditing((s) => (s ? { ...s, phone: e.target.value } : s))
              }
            />
            <TextField
              fullWidth
              type="email"
              label={t("label.email")}
              value={editing?.email ?? ""}
              onChange={(e) =>
                setEditing((s) => (s ? { ...s, email: e.target.value } : s))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>
            {t("dialog.cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveEdit}
            disabled={!editing}
          >
            {t("dialog.save")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookingTablePage;
