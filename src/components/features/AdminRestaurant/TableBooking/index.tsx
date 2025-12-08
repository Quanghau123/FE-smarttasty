"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
  Paper,
  Alert,
  Stack,
  Fade,
  Grow,
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
  const t = useTranslations("tableBooking");
  const STATUS_LABELS = useMemo(
    () => ({
      All: t("status.all"),
      Pending: t("status.pending"),
      Confirmed: t("status.confirmed"),
      CheckedIn: t("status.checkedIn"),
      Completed: t("status.completed"),
      Cancelled: t("status.cancelled"),
    }),
    [t]
  );
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
  const [filterStatus, setFilterStatus] = useState<string>("All");

  useEffect(() => {
    const { token } = getUserFromLocalStorage();
    if (token) {
      axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
      dispatch(fetchRestaurantByOwner({ token }));
    }
  }, [dispatch]);

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
    if (!selectedStatus) return toast.warning(t("warnings.select_new_status"));
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
      toast.success(t("success.update_status"));
      setUpdateDialog({ open: false });
      await refresh();
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.error(err?.message || t("errors.update_failed"));
    }
  };

  const handleCancelByBusiness = React.useCallback(
    async (reservationId: number) => {
      const confirm = window.confirm(t("confirm.cancel_by_business"));
      if (!confirm) return;
      const { user } = getUserFromLocalStorage();
      const userId = user.userId ?? 0;
      try {
        await dispatch(
          deleteReservationForBusiness({ reservationId, userId })
        ).unwrap();
        toast.success(t("success.cancelled_by_business"));
        await refresh();
      } catch (e: unknown) {
        const err = e as { message?: string };
        toast.error(err?.message || t("errors.cancel_failed"));
      }
    },
    [dispatch, refresh, t]
  );

  const [mounted, setMounted] = useState(false);

  useEffect(() => {

    const id = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(id);
  }, []);

  const content = useMemo(() => {
    if (loading)
      return (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      );
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!rows.length)
      return (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <Typography variant="body1" color="text.secondary">
            {t("no_reservations")}
          </Typography>
        </Box>
      );

    const filteredRows =
      filterStatus === "All"
        ? rows
        : rows.filter((r) => toDisplayStatus(r.status) === filterStatus);

    if (filteredRows.length === 0) {
      return (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <Typography variant="body1" color="text.secondary">
            {t("no_reservations_with_status", {
              status: t(`status.${filterStatus.toLowerCase()}`),
            })}
          </Typography>
        </Box>
      );
    }

    return (
      <Fade in={mounted} timeout={400}>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: { xs: 2, sm: 2.5, md: 3 },
          }}
        >
          {filteredRows.map((r, idx) => {
            const displayStatus = toDisplayStatus(r.status);
            const actions = nextStatusOptions(displayStatus);
            const customer = r.customers?.[0];
            return (
              <Grow
                in={mounted}
                timeout={300 + idx * 100}
                style={{ transformOrigin: "0 0 0" }}
                key={r.id}
              >
                <Box
                  key={r.id}
                  sx={{
                    flex: {
                      xs: "1 1 100%",
                      sm: "1 1 calc(50% - 10px)",
                      md: "1 1 calc(33.333% - 16px)",
                      lg: "1 1 calc(25% - 19px)",
                    },
                    minWidth: { xs: "100%", sm: "280px" },
                    maxWidth: {
                      xs: "100%",
                      sm: "calc(50% - 10px)",
                      md: "calc(33.333% - 16px)",
                      lg: "calc(25% - 19px)",
                    },
                  }}
                >
                  <Paper
                    elevation={2}
                    sx={{
                      p: { xs: 2, sm: 2.5, md: 3 },
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      bgcolor: "background.paper",
                      borderRadius: 2,
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      border: "1px solid",
                      borderColor: "divider",
                      "&:hover": {
                        transform: "translateY(-6px)",
                        boxShadow: 6,
                        borderColor: "primary.light",
                      },
                    }}
                  >
                    {/* Header */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                        pb: 2,
                        borderBottom: "2px solid",
                        borderColor: "divider",
                        flexWrap: "wrap",
                        gap: 1,
                      }}
                    >
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        sx={{
                          fontSize: { xs: "1.125rem", sm: "1.25rem" },
                          color: "primary.main",
                        }}
                      >
                        {t("booking_number", { id: r.id })}
                      </Typography>
                      <Chip
                        label={
                          (STATUS_LABELS as Record<string, string>)[
                            displayStatus
                          ] ?? displayStatus
                        }
                        size="medium"
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
                        sx={{
                          fontWeight: 600,
                          fontSize: { xs: "0.813rem", sm: "0.875rem" },
                        }}
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="overline"
                        sx={{
                          color: "text.secondary",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          letterSpacing: "1px",
                        }}
                      >
                        {t("customer_info_title")}
                      </Typography>
                      <Box
                        sx={{
                          mt: 1,
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.75,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: { xs: "0.875rem", sm: "0.938rem" },
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <Box
                            component="span"
                            sx={{
                              fontWeight: 700,
                              minWidth: "80px",
                              color: "text.secondary",
                            }}
                          >
                            {t("label.name")}
                          </Box>
                          {customer?.contactName ||
                            r.userName ||
                            `#${r.userId}`}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: { xs: "0.875rem", sm: "0.938rem" },
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <Box
                            component="span"
                            sx={{
                              fontWeight: 700,
                              minWidth: "80px",
                              color: "text.secondary",
                            }}
                          >
                            {t("label.phone")}
                          </Box>
                          {customer?.phone || "-"}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: { xs: "0.875rem", sm: "0.938rem" },
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            wordBreak: "break-word",
                          }}
                        >
                          <Box
                            component="span"
                            sx={{
                              fontWeight: 700,
                              minWidth: "80px",
                              color: "text.secondary",
                            }}
                          >
                            {t("label.email")}
                          </Box>
                          {customer?.email || "-"}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Reservation Details */}
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="overline"
                        sx={{
                          color: "text.secondary",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          letterSpacing: "1px",
                        }}
                      >
                        {t("reservation_details_title")}
                      </Typography>
                      <Box
                        sx={{
                          mt: 1,
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.75,
                        }}
                      >
                        <Box sx={{ display: "flex", gap: 2 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: { xs: "0.875rem", sm: "0.938rem" },
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <Box
                              component="span"
                              sx={{ fontWeight: 700, color: "text.secondary" }}
                            >
                              {t("label.adults")}
                            </Box>
                            {r.adultCount}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: { xs: "0.875rem", sm: "0.938rem" },
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <Box
                              component="span"
                              sx={{ fontWeight: 700, color: "text.secondary" }}
                            >
                              {t("label.children")}
                            </Box>
                            {r.childCount}
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: { xs: "0.875rem", sm: "0.938rem" },
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <Box
                            component="span"
                            sx={{
                              fontWeight: 700,
                              minWidth: "80px",
                              color: "text.secondary",
                            }}
                          >
                            {t("label.arrival_date")}
                          </Box>
                          {dayjs(r.arrivalDate).isValid()
                            ? dayjs(r.arrivalDate).format("DD/MM/YYYY")
                            : r.arrivalDate}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: { xs: "0.875rem", sm: "0.938rem" },
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <Box
                            component="span"
                            sx={{
                              fontWeight: 700,
                              minWidth: "80px",
                              color: "text.secondary",
                            }}
                          >
                            {t("label.time")}
                          </Box>
                          {formatTime(r.reservationTime)}
                        </Typography>
                        {r.note && (
                          <Box
                            sx={{
                              mt: 1,
                              p: 1.5,
                              bgcolor: "background.default",
                              borderRadius: 1,
                              border: "1px solid",
                              borderColor: "divider",
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: { xs: "0.813rem", sm: "0.875rem" },
                                fontStyle: "italic",
                                color: "text.secondary",
                                wordBreak: "break-word",
                              }}
                            >
                              <Box
                                component="span"
                                sx={{ fontWeight: 700, color: "text.primary" }}
                              >
                                {t("label.note")}:{" "}
                              </Box>
                              {r.note}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={t("created_at", {
                          time: dayjs(r.createdAt).format("DD/MM/YYYY HH:mm"),
                        })}
                        sx={{
                          fontSize: { xs: "0.75rem", sm: "0.813rem" },
                          borderColor: "divider",
                        }}
                      />
                    </Box>

                    {/* Action Buttons */}
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        gap: 1.5,
                        mt: "auto",
                        pt: 2,
                        borderTop: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      {actions.length > 0 ? (
                        <Button
                          variant="contained"
                          size="medium"
                          fullWidth
                          onClick={() => handleOpenUpdate(r.id, displayStatus)}
                          sx={{
                            fontSize: { xs: "0.875rem", sm: "0.938rem" },
                            py: 1,
                            fontWeight: 600,
                            textTransform: "none",
                            boxShadow: 2,
                            "&:hover": {
                              boxShadow: 4,
                            },
                          }}
                        >
                          {t("btn.update_status")}
                        </Button>
                      ) : null}
                      <Button
                        variant="outlined"
                        color="error"
                        size="medium"
                        fullWidth
                        onClick={() => handleCancelByBusiness(r.id)}
                        sx={{
                          fontSize: { xs: "0.875rem", sm: "0.938rem" },
                          py: 1,
                          fontWeight: 600,
                          textTransform: "none",
                          borderWidth: 2,
                          "&:hover": {
                            borderWidth: 2,
                            boxShadow: 2,
                          },
                        }}
                      >
                        {t("btn.cancel_booking")}
                      </Button>
                    </Box>
                  </Paper>
                </Box>
              </Grow>
            );
          })}
        </Box>
      </Fade>
    );
  }, [
    rows,
    loading,
    error,
    filterStatus,
    handleCancelByBusiness,
    handleOpenUpdate,
    t,
    STATUS_LABELS,
    mounted,
  ]);

  const stats = useMemo(() => {
    const pending = rows.filter(
      (r) => toDisplayStatus(r.status) === "Pending"
    ).length;
    const confirmed = rows.filter(
      (r) => toDisplayStatus(r.status) === "Confirmed"
    ).length;
    const checkedIn = rows.filter(
      (r) => toDisplayStatus(r.status) === "CheckedIn"
    ).length;
    const completed = rows.filter(
      (r) => toDisplayStatus(r.status) === "Completed"
    ).length;
    const cancelled = rows.filter(
      (r) => toDisplayStatus(r.status) === "Cancelled"
    ).length;
    return {
      pending,
      confirmed,
      checkedIn,
      completed,
      cancelled,
      total: rows.length,
    };
  }, [rows]);

  const statusCards = [
    {
      label: t("statusCards.all"),
      value: stats.total,
      status: "All",
      color: "primary.main",
    },
    {
      label: t("statusCards.pending"),
      value: stats.pending,
      status: "Pending",
      color: "warning.main",
    },
    {
      label: t("statusCards.confirmed"),
      value: stats.confirmed,
      status: "Confirmed",
      color: "info.main",
    },
    {
      label: t("statusCards.checkedIn"),
      value: stats.checkedIn,
      status: "CheckedIn",
      color: "secondary.main",
    },
    {
      label: t("statusCards.completed"),
      value: stats.completed,
      status: "Completed",
      color: "success.main",
    },
    {
      label: t("statusCards.cancelled"),
      value: stats.cancelled,
      status: "Cancelled",
      color: "error.main",
    },
  ];

  return (
    <Box
      sx={{
        px: { xs: 2, sm: 3, md: 4 },
        pb: { xs: 2, sm: 3, md: 4 },
        pt: 0,
        maxWidth: "1600px",
        mx: "auto",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <Fade in={mounted} timeout={400}>
        <Box
          sx={{
            mb: { xs: 3, sm: 4 },
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 2,
          }}
        >
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2.125rem" },
              color: "text.primary",
            }}
          >
            {t("page_title")}
          </Typography>
          {restaurant?.name && (
            <Chip
              label={restaurant.name}
              color="primary"
              sx={{
                fontSize: { xs: "0.875rem", sm: "0.938rem" },
                px: 1,
                height: { xs: 32, sm: 36 },
              }}
            />
          )}
        </Box>
      </Fade>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: { xs: 1.5, sm: 2, md: 2.5 },
          mb: { xs: 3, sm: 4 },
        }}
      >
        {statusCards.map((card, idx) => (
          <Grow
            in={mounted}
            timeout={300 + idx * 80}
            style={{ transformOrigin: "0 0 0" }}
            key={card.status}
          >
            <Box
              onClick={() => setFilterStatus(card.status)}
              sx={{
                flex: {
                  xs: "calc(50% - 6px)",
                  sm: "calc(33.333% - 11px)",
                  md: "calc(16.666% - 17px)",
                },
                minWidth: { xs: "140px", sm: "160px" },
                p: { xs: 2, sm: 2.5 },
                bgcolor:
                  filterStatus === card.status
                    ? card.color
                    : "background.paper",
                color: filterStatus === card.status ? "white" : "text.primary",
                borderRadius: 2,
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                border: "2px solid",
                borderColor:
                  filterStatus === card.status ? card.color : "divider",
                boxShadow: filterStatus === card.status ? 3 : 0,
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 4,
                  borderColor: card.color,
                },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontSize: { xs: "0.75rem", sm: "0.813rem" },
                  opacity: filterStatus === card.status ? 0.95 : 0.7,
                  mb: { xs: 0.5, sm: 1 },
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {card.label}
              </Typography>
              <Typography
                variant="h4"
                fontWeight={700}
                sx={{
                  fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
                  lineHeight: 1,
                }}
              >
                {card.value}
              </Typography>
            </Box>
          </Grow>
        ))}
      </Box>

      {content}

      <Dialog
        open={updateDialog.open}
        onClose={() => setUpdateDialog({ open: false })}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            m: { xs: 2, sm: 3 },
            maxHeight: { xs: "calc(100% - 32px)", sm: "calc(100% - 64px)" },
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 2,
            fontSize: { xs: "1.125rem", sm: "1.25rem" },
          }}
        >
          {t("dialog.title")}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={{ xs: 2, sm: 2.5 }}>
            <TextField
              label={t("dialog.current_status")}
              value={updateDialog.current || ""}
              InputProps={{ readOnly: true }}
              fullWidth
              size="medium"
            />
            <TextField
              select
              label={t("dialog.select_new_status")}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              fullWidth
              size="medium"
            >
              {nextStatusOptions(updateDialog.current || "").map((s) => (
                <MenuItem key={s} value={s}>
                  {(STATUS_LABELS as Record<string, string>)[s] ?? s}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={t("label.note")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              multiline
              rows={3}
              fullWidth
              size="medium"
            />
          </Stack>
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            pb: 2.5,
            gap: 1,
            flexDirection: { xs: "column-reverse", sm: "row" },
          }}
        >
          <Button
            onClick={() => setUpdateDialog({ open: false })}
            sx={{ width: { xs: "100%", sm: "auto" } }}
            size="large"
          >
            {t("dialog.cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateStatus}
            disabled={!selectedStatus}
            sx={{ width: { xs: "100%", sm: "auto" } }}
            size="large"
          >
            {t("dialog.save")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TableBooking;
