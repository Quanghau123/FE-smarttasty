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
  embedded?: boolean; // true when used inside Account page
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

  const [formValues, setFormValues] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const validate = (): boolean => {
    const { newPassword, confirmNewPassword } = formValues;
    if (newPassword !== confirmNewPassword) {
      toast.error("Mật khẩu mới và xác nhận không khớp!");
      return false;
    }

    if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{6,}$/.test(newPassword)
    ) {
      toast.error(
        "Mật khẩu phải chứa chữ hoa, chữ thường, số, ký tự đặc biệt và dài hơn 5 ký tự."
      );
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
      toast.success("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");

      // ✅ Xóa tokens từ cookie và Redux user
      clearTokens();
      dispatch(clearUser());

      // Nếu có callback từ cha, gọi trước
      if (onSuccess) {
        onSuccess();
      } else {
        // Push login page sau khi chắc chắn user đã được xóa
        router.push("/login");
      }

      dispatch(resetChangePasswordState());
    }

    if (changePasswordError) {
      toast.error(changePasswordError);
      dispatch(resetChangePasswordState());
    }
  }, [changePasswordSuccess, changePasswordError, dispatch, router, onSuccess]);

  const formContent = (
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
        disabled={changePasswordLoading}
        sx={{ marginTop: 2 }}
      >
        {changePasswordLoading ? (
          <CircularProgress size={24} />
        ) : (
          "Đổi mật khẩu"
        )}
      </Button>
    </Box>
  );

  // If embedded (used in Account page), return form without Card wrapper
  if (embedded) {
    return <Box sx={{ maxWidth: isMobile ? "100%" : 600 }}>{formContent}</Box>;
  }

  // Standalone page: use Card wrapper
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
