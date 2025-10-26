"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Tabs,
  Tab,
  TextField,
  CircularProgress,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { updateUser } from "@/redux/slices/userSlice";
import { clearTokens } from "@/lib/utils/tokenHelper";
import ChangePasswordForm from "@/components/features/ChangePassword";
import { toast } from "react-toastify";
import styles from "./styles.module.scss";
import { User } from "@/types/user";

const AccountPage = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.user);
  const loading = useAppSelector((state) => state.user.loading);
  const error = useAppSelector((state) => state.user.error);

  const [editableUser, setEditableUser] = useState<Partial<User>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "password">("info");

  const router = useRouter();

  useEffect(() => {
    if (user) setEditableUser(user);
  }, [user]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleSave = async () => {
    if (!user) return;

    // updateUser cần ít nhất userId
    const payload = { ...editableUser, userId: user.userId };

    try {
      await dispatch(updateUser(payload)).unwrap();
      toast.success("Cập nhật thành công!");
      setIsEditing(false);
    } catch (err: unknown) {
      if (typeof err === "string" && err.includes("email")) {
        toast.error("Email đã được sử dụng.");
      } else {
        toast.error("Cập nhật thất bại.");
      }
    }
  };

  const handleChange =
    (field: keyof User) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditableUser({ ...editableUser, [field]: e.target.value });
    };

  // Callback khi đổi mật khẩu thành công
  const handlePasswordChanged = () => {
    // ✅ Xóa tokens từ cookie và localStorage
    clearTokens();
    
    // Điều hướng login sau 1.5s để toast hiển thị
    setTimeout(() => router.push("/login"), 1500);
  };

  if (!user) {
    return (
      <div className={styles.accountContainer}>
        <div className={styles.contentArea}>
          <Typography variant="h5">Bạn chưa đăng nhập</Typography>
          <Button variant="contained" onClick={() => router.push("/login")}>
            Đăng nhập
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.accountContainer}>
      <div className={styles.sidebar}>
        <Tabs
          orientation="vertical"
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
        >
          <Tab label="Thông tin tài khoản" value="info" />
          <Tab label="Đổi mật khẩu" value="password" />
        </Tabs>
      </div>

      <div className={styles.contentArea}>
        {activeTab === "info" && (
          <>
            <Typography variant="h6" gutterBottom>
              Thông tin tài khoản
            </Typography>

            {isEditing ? (
              <Box display="flex" flexDirection="column" gap={2}>
                <TextField
                  label="Tên người dùng"
                  value={editableUser.userName || ""}
                  onChange={handleChange("userName")}
                  required
                />
                <TextField
                  label="Email"
                  type="email"
                  value={editableUser.email || ""}
                  onChange={handleChange("email")}
                  required
                />
                <TextField
                  label="Số điện thoại"
                  value={editableUser.phone || ""}
                  onChange={handleChange("phone")}
                  required
                />
                <TextField
                  label="Địa chỉ"
                  value={editableUser.address || ""}
                  onChange={handleChange("address")}
                />
                <Box display="flex" gap={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSave}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : "Lưu"}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setIsEditing(false)}
                  >
                    Hủy
                  </Button>
                </Box>
              </Box>
            ) : (
              <>
                <div className={styles.infoRow}>
                  <span>Tên người dùng:</span>
                  <strong>{user.userName || "Chưa cập nhật"}</strong>
                </div>
                <div className={styles.infoRow}>
                  <span>Email:</span>
                  <strong>{user.email || "Chưa cập nhật"}</strong>
                </div>
                <div className={styles.infoRow}>
                  <span>Số điện thoại:</span>
                  <strong>{user.phone || "Chưa cập nhật"}</strong>
                </div>
                <div className={styles.infoRow}>
                  <span>Địa chỉ:</span>
                  <strong>{user.address || "Chưa cập nhật"}</strong>
                </div>

                <Button
                  variant="contained"
                  onClick={() => setIsEditing(true)}
                  sx={{ mt: 2 }}
                >
                  Sửa thông tin
                </Button>
              </>
            )}
          </>
        )}

        {activeTab === "password" && (
          <>
            <Typography variant="h6" gutterBottom>
              Đổi mật khẩu
            </Typography>
            <ChangePasswordForm onSuccess={handlePasswordChanged} />
          </>
        )}
      </div>
    </div>
  );
};

export default AccountPage;
