"use client";

import {
  Box,
  Button,
  Card,
  TextField,
  Typography,
  CircularProgress,
  Link as MuiLink,
} from "@mui/material";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./styles.module.scss";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { createUser } from "@/redux/slices/userSlice";
import Link from "next/link";
import Image from "next/image";
import { getImageUrl } from "@/constants/config/imageBaseUrl";
import { useTranslations } from "next-intl";

const RegisterBusiness = () => {
  const t = useTranslations("registerBusiness");
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading } = useAppSelector((state) => state.user);

  const [formValues, setFormValues] = useState({
    userName: "",
    userPassword: "",
    email: "",
    phone: "",
    address: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formValues.userName)
      newErrors.userName = `${t("username_placeholder")} is required`;
    if (!formValues.userPassword) {
      newErrors.userPassword = `${t("password_placeholder")} is required`;
    } else if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/.test(
        formValues.userPassword
      )
    ) {
      newErrors.userPassword =
        "Password must contain uppercase, lowercase, number, special character and be longer than 5 characters.";
    }

    if (!formValues.email) {
      newErrors.email = `${t("email_placeholder")} is required`;
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formValues.email)) {
      newErrors.email = "Invalid email format.";
    }

    if (!formValues.phone) {
      newErrors.phone = `${t("phone_placeholder")} is required`;
    } else if (!/^(03|05|07|08|09)\d{8}$/.test(formValues.phone)) {
      newErrors.phone = "Invalid phone number.";
    }

    if (!formValues.address)
      newErrors.address = `${t("address_placeholder")} is required`;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const resultAction = await dispatch(
        createUser({
          ...formValues,
          role: "business",
        })
      );

      if (createUser.fulfilled.match(resultAction)) {
        toast.success("✅ " + t("register_btn_title") + " thành công!");
        router.push("/login");
      } else {
        toast.error(resultAction.payload as string);
      }
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại!");
    }
  };

  return (
    <div className={styles.loginContainer}>
      <Card className={styles.loginCard} sx={{ p: 4 }}>
        {/* Logo */}
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
          {t("title")}
        </Typography>

        <Box
          component="form"
          onSubmit={handleRegister}
          display="flex"
          flexDirection="column"
          gap={2}
        >
          <TextField
            label={t("username_placeholder")}
            name="userName"
            value={formValues.userName}
            onChange={handleChange}
            error={!!errors.userName}
            helperText={errors.userName}
            fullWidth
          />

          <TextField
            label={t("password_placeholder")}
            type="password"
            name="userPassword"
            value={formValues.userPassword}
            onChange={handleChange}
            error={!!errors.userPassword}
            helperText={errors.userPassword}
            fullWidth
          />

          <TextField
            label={t("email_placeholder")}
            name="email"
            value={formValues.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
            fullWidth
          />

          <TextField
            label={t("phone_placeholder")}
            name="phone"
            value={formValues.phone}
            onChange={handleChange}
            error={!!errors.phone}
            helperText={errors.phone}
            fullWidth
          />

          <TextField
            label={t("address_placeholder")}
            name="address"
            value={formValues.address}
            onChange={handleChange}
            error={!!errors.address}
            helperText={errors.address}
            fullWidth
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : t("register_btn_title")}
          </Button>
        </Box>

        {/* Bottom */}
        <Box className={styles.loginBottom} mt={2} textAlign="center">
          {t("have_account_text")}{" "}
          <MuiLink
            underline="hover"
            onClick={() => router.push("/login")}
            sx={{ cursor: "pointer" }}
          >
            {t("login_btn_title")}
          </MuiLink>
        </Box>
      </Card>
    </div>
  );
};

export default RegisterBusiness;
