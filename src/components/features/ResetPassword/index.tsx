"use client";

import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
} from "@mui/material";
import { useSearchParams, useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios/axiosInstance";
import { toast } from "react-toastify";
import { useState } from "react";

const ResetPasswordPage = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;

    if (!password) {
      newErrors.password = "Vui lòng nhập mật khẩu!";
    } else if (!pattern.test(password)) {
      newErrors.password =
        "Mật khẩu phải chứa chữ hoa, chữ thường, số, ký tự đặc biệt và dài hơn 5 ký tự.";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Vui lòng nhập lại mật khẩu!";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await axiosInstance.post("/api/User/reset-password", {
        token,
        newPassword: password,
      });

      if (res.data.errCode === 0) {
        toast.success("Đặt lại mật khẩu thành công!");
        router.push("/login");
      } else {
        toast.error(
          res.data.errMessage || "Token không hợp lệ hoặc đã hết hạn."
        );
      }
    } catch (err) {
      toast.error("Lỗi trong quá trình đặt lại mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Typography variant="h6" align="center">
        Liên kết không hợp lệ.
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        maxWidth: 400,
        mx: "auto",
        mt: 8,
        px: 3,
        py: 4,
        borderRadius: 2,
        boxShadow: 3,
        backgroundColor: "#fff",
      }}
    >
      <Typography variant="h5" gutterBottom>
        Đặt lại mật khẩu
      </Typography>

      <TextField
        label="Mật khẩu mới"
        type="password"
        fullWidth
        margin="normal"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={!!errors.password}
        helperText={errors.password}
      />

      <TextField
        label="Xác nhận mật khẩu"
        type="password"
        fullWidth
        margin="normal"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={!!errors.confirmPassword}
        helperText={errors.confirmPassword}
      />

      <Button
        variant="contained"
        color="primary"
        fullWidth
        onClick={onSubmit}
        disabled={loading}
        sx={{ mt: 2 }}
      >
        {loading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          "Đặt lại mật khẩu"
        )}
      </Button>
    </Box>
  );
};

export default ResetPasswordPage;
