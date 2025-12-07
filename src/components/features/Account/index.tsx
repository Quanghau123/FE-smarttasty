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
import { useTranslations } from "next-intl";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { updateUser, setUser, fetchUserById } from "@/redux/slices/userSlice";
import {
  clearTokens,
  getAccessToken,
  getUser as getUserLocal,
} from "@/lib/utils/tokenHelper";
import ChangePasswordForm from "@/components/features/ChangePassword";
import { toast } from "react-toastify";
import styles from "./styles.module.scss";
import { User } from "@/types/user";

const AccountPage = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.user);
  const loading = useAppSelector((state) => state.user.loading);
  const error = useAppSelector((state) => state.user.error);
  const t = useTranslations("accountPage");

  const [editableUser, setEditableUser] = useState<Partial<User>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "password">("info");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isMobile = useMediaQuery("(max-width:768px)");
  const router = useRouter();

  useEffect(() => {
    const token = getAccessToken();

    const local = getUserLocal();
    const userId = user?.userId ?? local?.userId;

    if (token && userId) {
      if (!user || !user.email || !user.phone || !user.address) {
        dispatch(fetchUserById(userId));
      }
    } else if (!user && token) {
      const storedUser =
        typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser?.userId) {
            dispatch(setUser(parsedUser));
            dispatch(fetchUserById(parsedUser.userId));
          }
        } catch {
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

    const payload = {
      userId: user.userId,
      userName: editableUser.userName ?? user.userName,
      email: user.email, 
      phone: editableUser.phone ?? user.phone,
      address: editableUser.address ?? user.address,
    };

    try {
      await dispatch(updateUser(payload)).unwrap();
      toast.success(t("messages.update_success"));
      setIsEditing(false);
    } catch (err: unknown) {
      if (typeof err === "string" && err.includes("email")) {
        toast.error(t("errors.email_in_use"));
      } else {
        toast.error(t("errors.update_failed"));
      }
    }
  };

  const handleChange =
    (field: keyof User) => (e: React.ChangeEvent<HTMLInputElement>) => {
      if (field === "email") return; 
      setEditableUser({ ...editableUser, [field]: e.target.value });
    };

  const handlePasswordChanged = () => {
    clearTokens();

    setTimeout(() => router.push("/login"), 1500);
  };

  if (!user) {
    return (
      <div className={styles.accountContainer}>
        <div className={styles.contentArea}>
          <Typography variant="h5">{t("not_logged_in")}</Typography>
          <Button variant="contained" onClick={() => router.push("/login")}>
            {t("btn.login")}
          </Button>
        </div>
      </div>
    );
  }

  const tabItems = [
    { label: t("tabs.info"), value: "info" },
    { label: t("tabs.password"), value: "password" },
  ];

  return (
    <div className={styles.accountContainer}>
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

      {!isMobile && (
        <div className={styles.sidebar}>
          <Tabs
            orientation="vertical"
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
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
              {t("tabs.info")}
            </Typography>

            {isEditing ? (
              <Box display="flex" flexDirection="column" gap={2}>
                <TextField
                  label={t("form.name")}
                  value={editableUser.userName || ""}
                  onChange={handleChange("userName")}
                  required
                  fullWidth
                />
                <TextField
                  label={t("form.email")}
                  type="email"
                  value={editableUser.email || ""}
                  onChange={handleChange("email")}
                  required
                  fullWidth
                  disabled
                  InputProps={{ readOnly: true }}
                  helperText={t("form.email_helper")}
                />
                <TextField
                  label={t("form.phone")}
                  value={editableUser.phone || ""}
                  onChange={handleChange("phone")}
                  required
                  fullWidth
                />
                <TextField
                  label={t("form.address")}
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
                    {loading ? <CircularProgress size={24} /> : t("btn.save")}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setIsEditing(false)}
                    fullWidth={isMobile}
                  >
                    {t("btn.cancel")}
                  </Button>
                </Box>
              </Box>
            ) : (
              <>
                <div className={styles.infoRow}>
                  <span>{t("labels.username")}</span>
                  <strong>{user.userName || t("labels.not_updated")}</strong>
                </div>
                <div className={styles.infoRow}>
                  <span>{t("labels.email")}</span>
                  <strong>{user.email || t("labels.not_updated")}</strong>
                </div>
                <div className={styles.infoRow}>
                  <span>{t("labels.phone")}</span>
                  <strong>{user.phone || t("labels.not_updated")}</strong>
                </div>
                <div className={styles.infoRow}>
                  <span>{t("labels.address")}</span>
                  <strong>{user.address || t("labels.not_updated")}</strong>
                </div>

                <Button
                  variant="contained"
                  onClick={() => setIsEditing(true)}
                  sx={{ mt: 2 }}
                  fullWidth={isMobile}
                >
                  {t("btn.edit")}
                </Button>
              </>
            )}
          </>
        )}

        {activeTab === "password" && (
          <>
            <Typography variant={isMobile ? "h6" : "h5"} gutterBottom>
              {t("tabs.password")}
            </Typography>
            <ChangePasswordForm embedded onSuccess={handlePasswordChanged} />
          </>
        )}
      </div>
    </div>
  );
};

export default AccountPage;
