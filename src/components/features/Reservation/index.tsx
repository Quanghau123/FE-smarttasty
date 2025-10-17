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
import styles from "./styles.module.scss";

interface Props {
  restaurantId: number;
}

const ReservationForm = ({ restaurantId }: Props) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const reservationState = useAppSelector((state) => state.reservation);

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
    if (!user) {
      toast.error("Bạn cần đăng nhập để đặt chỗ!");
      return;
    }

    const payload = {
      userId: user.userId,
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
      toast.success("🎉 Đặt chỗ thành công!");
    }
  }, [reservationState.error, reservationState.reservation]);

  return (
    <Box
      className={styles.reservationForm}
      sx={{
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      }}
    >
      <Typography variant="h5" gutterBottom>
        Đặt chỗ (Để có chỗ trước khi đến)
      </Typography>

      {/* Người lớn & Trẻ em */}
      <Box className={styles.formRow}>
        <TextField
          select
          label="Người lớn"
          value={adultCount}
          onChange={(e) => setAdultCount(Number(e.target.value))}
          sx={{ flex: 1 }}
        >
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <MenuItem key={num} value={num}>
              {num}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Trẻ em"
          value={childCount}
          onChange={(e) => setChildCount(Number(e.target.value))}
          sx={{ flex: 1 }}
        >
          {[0, 1, 2, 3, 4].map((num) => (
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
          label="Ngày đến"
          value={arrivalDate}
          onChange={(e) => setArrivalDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ flex: 1 }}
        />
        <TextField
          type="time"
          label="Giờ đến"
          value={reservationTime}
          onChange={(e) => setReservationTime(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ flex: 1 }}
        />
      </Box>

      {/* Thông tin liên hệ */}
      <TextField
        label="Tên liên hệ"
        value={contactName}
        onChange={(e) => setContactName(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Số điện thoại"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Ghi chú"
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
        {reservationState.loading ? "Đang đặt chỗ..." : "Đặt chỗ ngay"}
      </Button>
    </Box>
  );
};

export default ReservationForm;
