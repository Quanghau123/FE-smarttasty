"use client";

import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
  Paper,
} from "@mui/material";
import axiosInstance from "@/lib/axios/axiosInstance";
import { toast } from "react-toastify";
import { useState } from "react";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Vui lòng nhập email!");
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post("/api/User/forgot-password", {
        email,
      });

      if (res.data.errCode === 0 || res.data.errCode === "success") {
        toast.success(
          "Liên kết đặt lại mật khẩu đã được gửi đến email của bạn."
        );
      } else {
        toast.error(
          res.data.errMessage || "Email không tồn tại trong hệ thống."
        );
      }
    } catch {
      toast.error("Đã có lỗi xảy ra. Vui lòng thử lại.");
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
