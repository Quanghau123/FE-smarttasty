"use client";

import {
  Typography,
  Button,
  TextField,
  Snackbar,
  Tabs,
  Tab,
  Box,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import ChangePasswordForm from "@/screens/ChangePassword";
import styles from "./styles.module.scss";

interface User {
  userId: number;
  userName: string;
  email: string;
  phone: string;
  address?: string;
  token?: string;
}

const AccountPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [editableUser, setEditableUser] = useState<Partial<User>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "password">("info");
  const [message, setMessage] = useState("");
  const [messageOpen, setMessageOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        const currentUser = parsed.user || parsed;
        setUser(currentUser);
        setEditableUser(currentUser);
      } catch (error) {
        console.error("Lỗi khi parse user:", error);
      }
    }
  }, []);

  const handleLogout = () => {
    document.cookie = "token=; path=/; max-age=0";
    localStorage.removeItem("user");
    router.push("/login");
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      const token = JSON.parse(localStorage.getItem("user") || "{}")?.token;

      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/User`,
        { userId: user.userId, ...editableUser },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const updatedUser = { ...user, ...editableUser };
      localStorage.setItem(
        "user",
        JSON.stringify({ user: updatedUser, token })
      );
      setUser(updatedUser);
      setIsEditing(false);
      setMessage("Cập nhật thành công!");
    } catch (error: any) {
      if (error?.response?.data?.message?.includes("email")) {
        setMessage("Email đã được sử dụng.");
      } else {
        setMessage("Cập nhật thất bại.");
      }
    } finally {
      setMessageOpen(true);
    }
  };

  const handleChange =
    (field: keyof User) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditableUser({ ...editableUser, [field]: e.target.value });
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
          {/* <Tab label="Đăng xuất" onClick={handleLogout} /> */}
        </Tabs>
      </div>

      <div className={styles.contentArea}>
        {activeTab === "info" && (
          <>
            <Typography variant="h6" gutterBottom>
              Thông tin tài khoản
            </Typography>

            {isEditing ? (
              <Box
                component="form"
                display="flex"
                flexDirection="column"
                gap={2}
              >
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
                  >
                    Lưu
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
            <ChangePasswordForm
              onSuccess={() => {
                setMessage("Đổi mật khẩu thành công");
                setMessageOpen(true);
                setActiveTab("info");
              }}
            />
          </>
        )}
      </div>

      <Snackbar
        open={messageOpen}
        autoHideDuration={4000}
        onClose={() => setMessageOpen(false)}
        message={message}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      />
    </div>
  );
};

export default AccountPage;
