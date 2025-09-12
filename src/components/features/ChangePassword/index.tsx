"use client";

import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  CircularProgress,
} from "@mui/material";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios/axiosInstance";
import { toast } from "react-toastify";
import styles from "./styles.module.scss";

const ChangePasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [formValues, setFormValues] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmNewPassword } = formValues;

    if (newPassword !== confirmNewPassword) {
      toast.error("Mật khẩu mới và xác nhận không khớp!");
      return;
    }

    if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{6,}$/.test(newPassword)
    ) {
      toast.error(
        "Mật khẩu phải chứa chữ hoa, chữ thường, số, ký tự đặc biệt và dài hơn 5 ký tự."
      );
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post("/api/User/change-password", {
        currentPassword,
        newPassword,
        confirmNewPassword,
      });

      const { errCode, errMessage } = response.data;

      if (errCode === 0) {
        toast.success("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
        localStorage.removeItem("token");
        router.push("/login");
      } else {
        toast.error(errMessage || "Đổi mật khẩu thất bại!");
      }
    } catch (error: any) {
      toast.error("Đổi mật khẩu thất bại!");
      console.error("Change password error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className={styles.loginContainer}>
      <Card className={styles.loginCard}>
        <CardContent>
          <Typography variant="h4" textAlign="center" gutterBottom>
            Đổi mật khẩu
          </Typography>
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label="Mật khẩu hiện tại"
              name="currentPassword"
              type="password"
              fullWidth
              margin="normal"
              required
              value={formValues.currentPassword}
              onChange={handleChange}
            />
            <TextField
              label="Mật khẩu mới"
              name="newPassword"
              type="password"
              fullWidth
              margin="normal"
              required
              value={formValues.newPassword}
              onChange={handleChange}
            />
            <TextField
              label="Xác nhận mật khẩu mới"
              name="confirmNewPassword"
              type="password"
              fullWidth
              margin="normal"
              required
              value={formValues.confirmNewPassword}
              onChange={handleChange}
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
              sx={{ marginTop: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : "Đổi mật khẩu"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ChangePasswordPage;
