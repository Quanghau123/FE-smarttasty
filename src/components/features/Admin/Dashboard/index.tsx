"use client";

import { useEffect, useMemo, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import {
  Box,
  Typography,
  Avatar,
  Paper,
  CircularProgress,
  Chip,
  Divider,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import useMediaQuery from "@mui/material/useMediaQuery";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { fetchAllRestaurants } from "@/redux/slices/restaurantSlice";
import { fetchUsers } from "@/redux/slices/userSlice";
import moment from "moment";
import styles from "./styles.module.scss";
import { useTheme } from "@mui/material/styles";
import { useTranslations } from "next-intl";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const Dashboard = () => {
  const dispatch = useAppDispatch();
  const isMobile = useMediaQuery("(max-width:768px)");

  const {
    users,
    loading: userLoading,
    error: userError,
  } = useAppSelector((state) => state.user);
  const {
    restaurants,
    loading: restaurantLoading,
    error: restaurantError,
  } = useAppSelector((state) => state.restaurant);
  const { allRestaurants } = useAppSelector((state) => state.restaurant);

  useEffect(() => {
    dispatch(fetchUsers());
    // Load all restaurants (no pagination) for admin overview
    dispatch(fetchAllRestaurants());
  }, [dispatch]);

  const t = useTranslations("dashboard");

  const businessUsers = useMemo(
    () => users.filter((u) => u.role === "business"),
    [users]
  );
  const normalUsers = useMemo(
    () => users.filter((u) => u.role === "user"),
    [users]
  );

  const getChartData = useCallback(
    (list: { createdAt?: string }[] | undefined | null) => {
      if (!Array.isArray(list)) return {};
      return list.reduce((acc: Record<string, number>, item) => {
        const date = item?.createdAt
          ? moment(item.createdAt).format("MM/YYYY")
          : t("no_date");
        acc[date] = acc[date] ? acc[date] + 1 : 1;
        return acc;
      }, {});
    },
    [t]
  );

  const userChartData = useMemo(
    () => getChartData(normalUsers),
    [normalUsers, getChartData]
  );
  const businessChartData = useMemo(
    () => getChartData(businessUsers),
    [businessUsers, getChartData]
  );
  // Prefer `allRestaurants` when present (fetchAllRestaurants populates it);
  // fall back to paged `restaurants` if needed.
  const restaurantsListMemo = useMemo(() => {
    const a = allRestaurants ?? [];
    const p = restaurants ?? [];
    return Array.isArray(a) && a.length > 0 ? a : p;
  }, [allRestaurants, restaurants]);

  const restaurantChartData = useMemo(
    () => getChartData(restaurantsListMemo),
    [restaurantsListMemo, getChartData]
  );

  const chartOptions = (categories: string[]) => ({
    chart: { id: "chart", foreColor: chartTextColor },
    xaxis: { categories, labels: { style: { colors: [chartTextColor] } } },
  });

  const loading = userLoading || restaurantLoading;
  const error = userError || restaurantError;

  const lastUpdated = useMemo(() => {
    const userDates = users
      .map((u) => u.updatedAt || u.createdAt)
      .filter(Boolean) as string[];
    const restDates = restaurantsListMemo
      .map((r) => r.updatedAt || r.createdAt)
      .filter(Boolean) as string[];

    const dates = [...userDates, ...restDates].map((d) =>
      new Date(d).getTime()
    );
    if (!dates.length) return null;
    return moment(Math.max(...dates)).fromNow();
  }, [users, restaurantsListMemo]);

  const theme = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const chartTextColor =
    theme.palette.mode === "dark"
      ? theme.palette.common.white
      : theme.palette.text.secondary;
  const gradients = {
    blue:
      theme.palette.mode === "dark"
        ? "linear-gradient(135deg, #0f4c81 0%, #1976d2 100%)"
        : "linear-gradient(135deg, #1976d2 0%, #63a4ff 100%)",
    red:
      theme.palette.mode === "dark"
        ? "linear-gradient(135deg, #6b1f1f 0%, #d32f2f 100%)"
        : "linear-gradient(135deg, #d32f2f 0%, #ff7b7b 100%)",
    green:
      theme.palette.mode === "dark"
        ? "linear-gradient(135deg, #1f4f2a 0%, #2e7d32 100%)"
        : "linear-gradient(135deg, #388e3c 0%, #6fcf97 100%)",
  };

  if (loading) {
    return (
      <Box
        className={styles.dashboard}
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="70vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className={styles.dashboard} textAlign="center" mt={5}>
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <motion.div
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
    >
      <Box className={styles.dashboard} sx={{ pt: 0 }}>
        <Typography variant={isMobile ? "h5" : "h4"} fontWeight={600} mb={2}>
          {t("title")}
        </Typography>
        <Typography
          color="text.secondary"
          mb={3}
          sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
        >
          {t("summary", { lastUpdated: lastUpdated ?? t("no_data") })}
        </Typography>

        {/* Thống kê tổng quan */}
        <Grid container spacing={{ xs: 2, sm: 3 }} className={styles.cards}>
          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            component={"div" as React.ElementType}
          >
            <Paper
              elevation={3}
              sx={{
                p: { xs: 2, sm: 2.5 },
                background: gradients.blue,
                color: "common.white",
                borderRadius: 2,
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                flexDirection={{ xs: "column", sm: "row" }}
                gap={{ xs: 1.5, sm: 0 }}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  width={{ xs: "100%", sm: "auto" }}
                >
                  <Avatar sx={{ bgcolor: "rgba(255,255,255,0.12)", mr: 2 }}>
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography
                      sx={{
                        color: "white",
                        fontSize: { xs: "0.875rem", sm: "1rem" },
                      }}
                    >
                      {t("total_normal_users")}
                    </Typography>
                    <Typography
                      variant={isMobile ? "h6" : "h5"}
                      sx={{ color: "white", fontWeight: 700 }}
                    >
                      {normalUsers.length}
                    </Typography>
                  </Box>
                </Box>
                <Box
                  textAlign={{ xs: "center", sm: "right" }}
                  width={{ xs: "100%", sm: "auto" }}
                >
                  <Chip label="+3%" size="small" color="success" />
                  <Typography
                    variant="caption"
                    display="block"
                    sx={{ color: "rgba(255,255,255,0.85)", mt: 0.5 }}
                  >
                    {t("compare_label")}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            component={"div" as React.ElementType}
          >
            <Paper
              elevation={3}
              sx={{
                p: { xs: 2, sm: 2.5 },
                background: gradients.red,
                color: "common.white",
                borderRadius: 2,
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                flexDirection={{ xs: "column", sm: "row" }}
                gap={{ xs: 1.5, sm: 0 }}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  width={{ xs: "100%", sm: "auto" }}
                >
                  <Avatar sx={{ bgcolor: "rgba(255,255,255,0.12)", mr: 2 }}>
                    <BusinessIcon />
                  </Avatar>
                  <Box>
                    <Typography
                      sx={{
                        color: "white",
                        fontSize: { xs: "0.875rem", sm: "1rem" },
                      }}
                    >
                      {t("total_business_users")}
                    </Typography>
                    <Typography
                      variant={isMobile ? "h6" : "h5"}
                      sx={{ color: "white", fontWeight: 700 }}
                    >
                      {businessUsers.length}
                    </Typography>
                  </Box>
                </Box>
                <Box
                  textAlign={{ xs: "center", sm: "right" }}
                  width={{ xs: "100%", sm: "auto" }}
                >
                  <Chip label="-1%" size="small" color="warning" />
                  <Typography
                    variant="caption"
                    display="block"
                    sx={{ color: "rgba(255,255,255,0.85)", mt: 0.5 }}
                  >
                    {t("compare_label")}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            component={"div" as React.ElementType}
          >
            <Paper
              elevation={3}
              sx={{
                p: { xs: 2, sm: 2.5 },
                background: gradients.green,
                color: "common.white",
                borderRadius: 2,
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                flexDirection={{ xs: "column", sm: "row" }}
                gap={{ xs: 1.5, sm: 0 }}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  width={{ xs: "100%", sm: "auto" }}
                >
                  <Avatar sx={{ bgcolor: "rgba(255,255,255,0.12)", mr: 2 }}>
                    <BusinessIcon />
                  </Avatar>
                  <Box>
                    <Typography
                      sx={{
                        color: "white",
                        fontSize: { xs: "0.875rem", sm: "1rem" },
                      }}
                    >
                      {t("total_restaurants")}
                    </Typography>
                    <Typography
                      variant={isMobile ? "h6" : "h5"}
                      sx={{ color: "white", fontWeight: 700 }}
                    >
                      {restaurantsListMemo.length}
                    </Typography>
                  </Box>
                </Box>
                <Box
                  textAlign={{ xs: "center", sm: "right" }}
                  width={{ xs: "100%", sm: "auto" }}
                >
                  <Chip label="+8%" size="small" color="success" />
                  <Typography
                    variant="caption"
                    display="block"
                    sx={{ color: "rgba(255,255,255,0.85)", mt: 0.5 }}
                  >
                    {t("compare_label")}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Biểu đồ */}
        <Grid
          container
          spacing={{ xs: 2, sm: 3 }}
          mt={{ xs: 2, sm: 3 }}
          className={styles.charts}
        >
          <Grid item xs={12} md={6} component={"div" as React.ElementType}>
            <Paper elevation={3} sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography
                variant={isMobile ? "subtitle1" : "h6"}
                mb={2}
                fontWeight={600}
              >
                {t("users_by_month")}
              </Typography>
              {Object.keys(userChartData).length ? (
                <Chart
                  options={chartOptions(Object.keys(userChartData))}
                  series={[
                    {
                      name: t("series_users"),
                      data: Object.values(userChartData),
                    },
                  ]}
                  type="bar"
                  width="100%"
                  height={isMobile ? 250 : 300}
                />
              ) : (
                <Typography>{t("no_chart_data")}</Typography>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6} component={"div" as React.ElementType}>
            <Paper elevation={3} sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography
                variant={isMobile ? "subtitle1" : "h6"}
                mb={2}
                fontWeight={600}
              >
                {t("business_by_month")}
              </Typography>
              {Object.keys(businessChartData).length ? (
                <Chart
                  options={chartOptions(Object.keys(businessChartData))}
                  series={[
                    {
                      name: t("series_business"),
                      data: Object.values(businessChartData),
                    },
                  ]}
                  type="bar"
                  width="100%"
                  height={isMobile ? 250 : 300}
                />
              ) : (
                <Typography>{t("no_chart_data")}</Typography>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} component={"div" as React.ElementType}>
            <Paper elevation={3} sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography
                variant={isMobile ? "subtitle1" : "h6"}
                mb={2}
                fontWeight={600}
              >
                {t("restaurants_by_month")}
              </Typography>
              <Divider sx={{ my: 1 }} />
              {Object.keys(restaurantChartData).length ? (
                <Chart
                  options={chartOptions(Object.keys(restaurantChartData))}
                  series={[
                    {
                      name: t("series_restaurants"),
                      data: Object.values(restaurantChartData),
                    },
                  ]}
                  type="bar"
                  width="100%"
                  height={isMobile ? 250 : 300}
                />
              ) : (
                <Typography>{t("no_chart_data")}</Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </motion.div>
  );
};

export default Dashboard;
