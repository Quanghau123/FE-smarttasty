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
  useMediaQuery,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { updateUser, setUser } from "@/redux/slices/userSlice";
import { clearTokens, getAccessToken } from "@/lib/utils/tokenHelper";
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
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isMobile = useMediaQuery("(max-width:768px)");
  const router = useRouter();

  // ✅ Load user from localStorage if not in Redux (fixes login redirect issue)
  useEffect(() => {
    if (!user) {
      const token = getAccessToken();
      const storedUser = localStorage.getItem("user");

      if (token && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          dispatch(setUser(parsedUser));
        } catch (e) {
          console.error("Error parsing stored user:", e);
        }
      }
    }
  }, [user, dispatch]);

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

  const tabItems = [
    { label: "Thông tin tài khoản", value: "info" },
    { label: "Đổi mật khẩu", value: "password" },
  ];

  return (
    <div className={styles.accountContainer}>
      {/* Mobile Menu Button */}
      {isMobile && (
        <IconButton
          onClick={() => setDrawerOpen(true)}
          sx={{
            position: "fixed",
            top: 90,
            left: 16,
            zIndex: 1100,
            bgcolor: "white",
            boxShadow: 2,
            "&:hover": { bgcolor: "grey.100" },
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        >
          <Box sx={{ width: 250, pt: 2 }}>
            <List>
              {tabItems.map((item) => (
                <ListItem
                  key={item.value}
                  onClick={() => {
                    setActiveTab(item.value as "info" | "password");
                    setDrawerOpen(false);
                  }}
                  sx={{
                    cursor: "pointer",
                    bgcolor:
                      activeTab === item.value
                        ? "primary.light"
                        : "transparent",
                    "&:hover": { bgcolor: "grey.100" },
                  }}
                >
                  <ListItemText
                    primary={item.label}
                    sx={{
                      "& .MuiListItemText-primary": {
                        fontWeight: activeTab === item.value ? 600 : 400,
                      },
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className={styles.sidebar}>
          <Tabs
            orientation="vertical"
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
          >
            {tabItems.map((item) => (
              <Tab key={item.value} label={item.label} value={item.value} />
            ))}
          </Tabs>
        </div>
      )}

      <div className={styles.contentArea}>
        {activeTab === "info" && (
          <>
            <Typography variant={isMobile ? "h6" : "h5"} gutterBottom>
              Thông tin tài khoản
            </Typography>

            {isEditing ? (
              <Box display="flex" flexDirection="column" gap={2}>
                <TextField
                  label="Tên người dùng"
                  value={editableUser.userName || ""}
                  onChange={handleChange("userName")}
                  required
                  fullWidth
                />
                <TextField
                  label="Email"
                  type="email"
                  value={editableUser.email || ""}
                  onChange={handleChange("email")}
                  required
                  fullWidth
                />
                <TextField
                  label="Số điện thoại"
                  value={editableUser.phone || ""}
                  onChange={handleChange("phone")}
                  required
                  fullWidth
                />
                <TextField
                  label="Địa chỉ"
                  value={editableUser.address || ""}
                  onChange={handleChange("address")}
                  fullWidth
                />
                <Box
                  display="flex"
                  gap={2}
                  flexDirection={isMobile ? "column" : "row"}
                >
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSave}
                    disabled={loading}
                    fullWidth={isMobile}
                  >
                    {loading ? <CircularProgress size={24} /> : "Lưu"}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setIsEditing(false)}
                    fullWidth={isMobile}
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
                  fullWidth={isMobile}
                >
                  Sửa thông tin
                </Button>
              </>
            )}
          </>
        )}

        {activeTab === "password" && (
          <>
            <Typography variant={isMobile ? "h6" : "h5"} gutterBottom>
              Đổi mật khẩu
            </Typography>
            <ChangePasswordForm embedded onSuccess={handlePasswordChanged} />
          </>
        )}
      </div>
    </div>
  );
};

export default AccountPage;
