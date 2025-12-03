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
import Image from "next/image";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./styles.module.scss";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { loginUser, fetchUserById } from "@/redux/slices/userSlice";
import { getImageUrl } from "@/constants/config/imageBaseUrl";
import { useTranslations } from "next-intl"; // ✅ import i18n

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasShownSuccessToast, setHasShownSuccessToast] = useState(false);

  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const t = useTranslations("login"); // dùng namespace "login"

  const { loading, error, user } = useSelector(
    (state: RootState) => state.user
  );

  useEffect(() => {
    const savedLogin = localStorage.getItem("rememberedLogin");
    if (savedLogin) {
      const { email, userPassword } = JSON.parse(savedLogin);
      setEmail(email);
      setUserPassword(userPassword);
      setRemember(true);
    }
  }, []);

  useEffect(() => {
    if (user && !hasShownSuccessToast) {
      setHasShownSuccessToast(true);
      toast.success(t("login_success")); // thêm key login_success trong file dịch
      switch (user.role) {
        case "admin":
          router.push("/admin");
          break;
        case "business":
          router.push("/restaurant");
          break;
        case "staff":
          router.push("/staff");
          break;
        default:
          router.push("/");
      }
    }
  }, [user, router, t, hasShownSuccessToast]);

  useEffect(() => {
    if (error) {
      // Chuẩn hoá các thông báo lỗi 400 / sai tài khoản mật khẩu
      const raw = typeof error === "string" ? error : String(error);
      const lower = raw.toLowerCase();
      const isCredentialError =
        lower.includes("status code 400") ||
        lower.includes("400") ||
        lower.includes("unauthorized") ||
        (lower.includes("invalid") &&
          (lower.includes("password") || lower.includes("email"))) ||
        (lower.includes("password") && lower.includes("incorrect"));

      // Nếu muốn đa ngôn ngữ: thêm key vào file messages: login.invalid_credentials
      const friendly = isCredentialError ? t("invalid_credentials") : raw;
      toast.error(friendly);
    }
  }, [error, t]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(loginUser({ email, userPassword, remember }));

    // Nếu login thành công, gọi fetchUserById để lấy đầy đủ thông tin user
    if (loginUser.fulfilled.match(result) && result.payload.user.userId) {
      await dispatch(fetchUserById(result.payload.user.userId));
    }
  };

  return (
    <div className={styles.loginContainer}>
      <Card className={styles.loginCard} sx={{ padding: 4 }}>
        {/* Header logo */}
        <Box display="flex" justifyContent="center" mb={3}>
          <Link href="/">
            <Image
              src={getImageUrl("Logo/anhdaidienmoi.png")}
              alt="Logo"
              width={100}
              height={80}
              priority
            />
          </Link>
        </Box>

        <Typography variant="h5" align="center" gutterBottom>
          SmartTasty {t("welcome_text")}
        </Typography>

        <Box
          component="form"
          onSubmit={handleLogin}
          display="flex"
          flexDirection="column"
          gap={2}
        >
          <TextField
            label={t("email_placeholder")}
            variant="outlined"
            fullWidth
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <TextField
            label={t("password_placeholder")}
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
              label={t("remember_me_checkbox")}
            />
            <Link
              underline="hover"
              sx={{ cursor: "pointer" }}
              onClick={() => router.push("/forgotPassword")}
            >
              {t("forgot_password_btn_title")}
            </Link>
          </Box>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : t("login_btn_title")}
          </Button>
        </Box>

        <Box className={styles.loginBottom} mt={2} textAlign="center">
          {t("new_to_smartasty_text")}{" "}
          <Link
            underline="hover"
            onClick={() => router.push("/register")}
            sx={{ cursor: "pointer" }}
          >
            {t("register_btn_title")}
          </Link>
        </Box>
      </Card>
    </div>
  );
};

export default LoginPage;
