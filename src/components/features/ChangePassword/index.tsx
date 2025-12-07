"use client";

import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  CircularProgress,
  useMediaQuery,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useTranslations } from "next-intl";
import styles from "./styles.module.scss";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import {
  changePassword,
  resetChangePasswordState,
  clearUser,
} from "@/redux/slices/userSlice";
import { clearTokens } from "@/lib/utils/tokenHelper";
import { useState, useEffect } from "react";

type ChangePasswordFormProps = {
  onSuccess?: () => void;
  embedded?: boolean;
};

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
  onSuccess,
  embedded = false,
}) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { changePasswordLoading, changePasswordError, changePasswordSuccess } =
    useAppSelector((state) => state.user);
  const isMobile = useMediaQuery("(max-width:768px)");
  const t = useTranslations("changePassword");

  const [formValues, setFormValues] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const validate = (): boolean => {
    const { newPassword, confirmNewPassword } = formValues;
    if (newPassword !== confirmNewPassword) {
      toast.error(t("validation.mismatch"));
      return false;
    }

    if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{6,}$/.test(newPassword)
    ) {
      toast.error(t("validation.pattern"));
      return false;
    }
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    dispatch(changePassword(formValues));
  };

  useEffect(() => {
    if (changePasswordSuccess) {
      toast.success(t("success.reset"));

      clearTokens();
      dispatch(clearUser());

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/login");
      }

      dispatch(resetChangePasswordState());
    }

    if (changePasswordError) {
      const msg = changePasswordError || t("errors.generic");
      toast.error(msg);
      dispatch(resetChangePasswordState());
    }
  }, [
    changePasswordSuccess,
    changePasswordError,
    dispatch,
    router,
    onSuccess,
    t,
  ]);

  const formContent = (
    <Box component="form" onSubmit={handleSubmit}>
      <TextField
        label={t("form.current_password")}
        name="currentPassword"
        type="password"
        fullWidth
        margin="normal"
        required
        value={formValues.currentPassword}
        onChange={handleChange}
      />
      <TextField
        label={t("form.new_password")}
        name="newPassword"
        type="password"
        fullWidth
        margin="normal"
        required
        value={formValues.newPassword}
        onChange={handleChange}
      />
      <TextField
        label={t("form.confirm_password")}
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
        disabled={changePasswordLoading}
        sx={{ marginTop: 2 }}
      >
        {changePasswordLoading ? (
          <CircularProgress size={24} />
        ) : (
          t("btn.change")
        )}
      </Button>
    </Box>
  );

  if (embedded) {
    return <Box sx={{ maxWidth: isMobile ? "100%" : 600 }}>{formContent}</Box>;
  }

  return (
    <Box className={styles.loginContainer}>
      <Card className={styles.loginCard}>
        <CardContent>
          <Typography variant="h4" textAlign="center" gutterBottom>
            Đổi mật khẩu
          </Typography>
          {formContent}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ChangePasswordForm;
