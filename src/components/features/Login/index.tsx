"use client";

import {
  Box,
  Button,
  Card,
  Checkbox,
  CircularProgress,
  TextField,
  Typography,
  FormControlLabel,
  Link,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./styles.module.scss";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { loginUser } from "@/redux/slices/userSlice";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const { loading, error, user } = useSelector(
    (state: RootState) => state.user
  );

  // Lấy thông tin đã lưu nếu chọn nhớ đăng nhập
  useEffect(() => {
    const savedLogin = localStorage.getItem("rememberedLogin");
    if (savedLogin) {
      const { email, userPassword } = JSON.parse(savedLogin);
      setEmail(email);
      setUserPassword(userPassword);
      setRemember(true);
    }
  }, []);

  // Chuyển hướng khi đăng nhập thành công
  useEffect(() => {
    if (user) {
      toast.success("Đăng nhập thành công!");
      switch (user.role) {
        case "admin":
          router.push("/admin");
          break;
        case "business":
          router.push("/restaurant");
          break;
        default:
          router.push("/");
      }
    }
  }, [user, router]);

  // Hiển thị lỗi nếu có
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(loginUser({ email, userPassword, remember }));
  };

  return (
    <div className={styles.loginContainer}>
      <Card className={styles.loginCard} sx={{ padding: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Đăng nhập
        </Typography>

        <Box
          component="form"
          onSubmit={handleLogin}
          display="flex"
          flexDirection="column"
          gap={2}
        >
          {/* Email */}
          <TextField
            label="Email"
            variant="outlined"
            fullWidth
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Mật khẩu với icon mắt */}
          <TextField
            label="Mật khẩu"
            variant="outlined"
            fullWidth
            required
            type={showPassword ? "text" : "password"}
            value={userPassword}
            onChange={(e) => setUserPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Nhớ đăng nhập & quên mật khẩu */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  color="primary"
                />
              }
              label="Lưu đăng nhập"
            />
            <Link
              underline="hover"
              sx={{ cursor: "pointer" }}
              onClick={() => router.push("/forgotPassword")}
            >
              Quên mật khẩu?
            </Link>
          </Box>

          {/* Nút đăng nhập */}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Đăng nhập"
            )}
          </Button>
        </Box>

        {/* Link đăng ký */}
        <Box className={styles.loginBottom} mt={2} textAlign="center">
          Bạn mới biết đến Smarttasty?{" "}
          <Link
            underline="hover"
            onClick={() => router.push("/register")}
            sx={{ cursor: "pointer" }}
          >
            Đăng ký
          </Link>
        </Box>
      </Card>
    </div>
  );
};

export default LoginPage;
