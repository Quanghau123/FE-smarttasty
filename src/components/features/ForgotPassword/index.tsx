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
import { useTranslations } from "next-intl";
import { useAppDispatch } from "@/redux/hook";
import { forgotPassword as forgotPasswordThunk } from "@/redux/slices/userSlice";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const t = useTranslations("forgotPassword");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error(t("errors.empty_email"));
      return;
    }

    setLoading(true);
    try {
      await dispatch(forgotPasswordThunk(email)).unwrap();
      toast.success(t("success.sent"));
    } catch (err) {
      const message = typeof err === "string" ? err : t("errors.generic");
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
          {t("title")}
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label={t("form.email")}
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
              t("btn.send")
            )}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default ForgotPasswordPage;
