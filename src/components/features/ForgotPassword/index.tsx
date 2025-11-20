"use client";

import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
  Paper,
} from "@mui/material";
import { toast } from "react-toastify";
import { useState } from "react";
import { useAppDispatch } from "@/redux/hook";
import { forgotPassword as forgotPasswordThunk } from "@/redux/slices/userSlice";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Vui lòng nhập email!");
      return;
    }

    setLoading(true);
    try {
      await dispatch(forgotPasswordThunk(email)).unwrap();
      toast.success("Liên kết đặt lại mật khẩu đã được gửi đến email của bạn.");
    } catch (err) {
      const message =
        typeof err === "string" ? err : "Đã có lỗi xảy ra. Vui lòng thử lại.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      minHeight="100vh"
      display="flex"
      justifyContent="center"
      alignItems="center"
      sx={{ backgroundColor: "#f5f5f5" }}
    >
      <Paper elevation={3} sx={{ padding: 4, width: 400 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Quên mật khẩu
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            variant="outlined"
            fullWidth
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Gửi liên kết đặt lại mật khẩu"
            )}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default ForgotPasswordPage;
