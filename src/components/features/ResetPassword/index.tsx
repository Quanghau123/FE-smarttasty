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
import { useTranslations } from "next-intl";

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
  const t = useTranslations("resetPassword");

  const validate = () => {
    const newErrors: typeof errors = {};
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;

    if (!password) {
      newErrors.password = t("validation.required_password");
    } else if (!pattern.test(password)) {
      newErrors.password = t("validation.pattern");
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = t("validation.required_confirm");
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = t("validation.mismatch");
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

      if (res.data.errCode === 0 || res.data.errCode === "success") {
        toast.success(t("success.reset"));
        router.push("/login");
      } else {
        toast.error(res.data.errMessage || t("errors.invalid_or_expired"));
      }
    } catch {
      toast.error(t("errors.failed"));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Typography variant="h6" align="center">
        {t("errors.invalid_link")}
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
        {t("title")}
      </Typography>

      <TextField
        label={t("form.new_password")}
        type="password"
        fullWidth
        margin="normal"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={!!errors.password}
        helperText={errors.password}
      />

      <TextField
        label={t("form.confirm_password")}
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
          t("btn.reset")
        )}
      </Button>
    </Box>
  );
};

export default ResetPasswordPage;
