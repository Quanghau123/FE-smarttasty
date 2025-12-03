"use client";

import { useState, useEffect } from "react";
import {
  Box,
  TextField,
  MenuItem,
  Button,
  Typography,
  useTheme,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { createReservation } from "@/redux/slices/reservationSlice";
import { toast } from "react-toastify";
import { useTranslations } from "next-intl";
import styles from "./styles.module.scss";
import { getAccessToken, getUser } from "@/lib/utils/tokenHelper";

interface Props {
  restaurantId: number;
}

const ReservationForm = ({ restaurantId }: Props) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const reservationState = useAppSelector((state) => state.reservation);
  const t = useTranslations("reservation");

  // ✅ Lấy user từ Redux (sau login đã có trong state)
  const user = useAppSelector((state) => state.user.user);

  const [adultCount, setAdultCount] = useState(2);
  const [childCount, setChildCount] = useState(0);
  const [arrivalDate, setArrivalDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [reservationTime, setReservationTime] = useState("18:00");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");

  const formatTime = (time: string) => {
    return time.length === 5 ? `${time}:00` : time;
  };

  const handleReservation = () => {
    // Only block when there is no access token (user not logged in)
    const token = getAccessToken();
    if (!token) {
      toast.error(t("login_required"));
      return;
    }

    // Prefer Redux user, fall back to user stored in localStorage
    const localUser = user ?? getUser();
    if (!localUser?.userId) {
      // If token exists but we can't determine userId, prompt to re-login
      toast.error(t("login_required"));
      return;
    }

    const payload = {
      userId: localUser.userId,
      restaurantId,
      adultCount,
      childCount,
      arrivalDate: new Date(`${arrivalDate}T${reservationTime}`).toISOString(),
      reservationTime: formatTime(reservationTime),
      contactName,
      phone,
      email,
      note,
    };

    dispatch(createReservation(payload));
  };

  // 🔔 Lắng nghe trạng thái để show toast
  useEffect(() => {
    if (reservationState.error) {
      toast.error(reservationState.error);
    }
    if (reservationState.reservation) {
      toast.success(t("success_message"));
    }
  }, [reservationState.error, reservationState.reservation, t]);

  return (
    <Box
      className={styles.reservationForm}
      sx={{
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      }}
    >
      <Typography variant="h5" gutterBottom>
        {t("title")}
      </Typography>

      {/* Người lớn & Trẻ em */}
      <Box className={styles.formRow}>
        <TextField
          select
          label={t("adults_label")}
          value={adultCount}
          onChange={(e) => setAdultCount(Number(e.target.value))}
          sx={{ flex: 1 }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <MenuItem key={num} value={num}>
              {num}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label={t("children_label")}
          value={childCount}
          onChange={(e) => setChildCount(Number(e.target.value))}
          sx={{ flex: 1 }}
        >
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <MenuItem key={num} value={num}>
              {num}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {/* Ngày & Giờ */}
      <Box className={styles.formRow}>
        <TextField
          type="date"
          label={t("arrival_date")}
          value={arrivalDate}
          onChange={(e) => setArrivalDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ flex: 1 }}
        />
        <TextField
          type="time"
          label={t("arrival_time")}
          value={reservationTime}
          onChange={(e) => setReservationTime(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ flex: 1 }}
        />
      </Box>

      {/* Thông tin liên hệ */}
      <TextField
        label={t("contact_name")}
        value={contactName}
        onChange={(e) => setContactName(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label={t("phone")}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label={t("email")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label={t("note")}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        multiline
        rows={3}
        fullWidth
        margin="normal"
      />

      <Button
        variant="contained"
        color="primary"
        fullWidth
        className={styles.submitBtn}
        onClick={handleReservation}
        disabled={reservationState.loading}
      >
        {reservationState.loading ? t("loading") : t("reserve_button")}
      </Button>
    </Box>
  );
};

export default ReservationForm;
