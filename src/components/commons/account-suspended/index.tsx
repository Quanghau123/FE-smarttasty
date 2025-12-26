"use client";

import { Box, Button, Card, Typography } from "@mui/material";
import { LockOutlined } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useDispatch } from "react-redux";
import { clearAuthError, clearUser } from "@/redux/slices/userSlice";
import styles from "./styles.module.scss";

const AccountSuspendedPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const t = useTranslations("accountSuspended");

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <Box className={styles.iconContainer}>
          <LockOutlined className={styles.icon} />
        </Box>

        <Typography variant="h4" className={styles.title}>
          {t("title")}
        </Typography>

        <Typography variant="body1" className={styles.message}>
          {t("message")}
        </Typography>

        <Typography variant="body2" className={styles.description}>
          {t("description")}
        </Typography>

        <Box className={styles.buttonGroup}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => router.push("/contact")}
            className={styles.contactButton}
          >
            {t("contact_admin")}
          </Button>

          <Button
            variant="outlined"
            onClick={() => {
              dispatch(clearAuthError());
              dispatch(clearUser());
              router.push("/login");
            }}
            className={styles.backButton}
          >
            {t("back_to_login")}
          </Button>
        </Box>
      </Card>
    </div>
  );
};

export default AccountSuspendedPage;
