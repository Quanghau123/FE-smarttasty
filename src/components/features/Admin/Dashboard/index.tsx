"use client";

import { useEffect, useMemo } from "react";
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
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { fetchRestaurants } from "@/redux/slices/restaurantSlice";
import { fetchUsers } from "@/redux/slices/userSlice";
import moment from "moment";
import styles from "./styles.module.scss";
import { useTheme } from "@mui/material/styles";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const Dashboard = () => {
  const dispatch = useAppDispatch();

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

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchRestaurants());
  }, [dispatch]);

  const businessUsers = useMemo(
    () => users.filter((u) => u.role === "business"),
    [users]
  );
  const normalUsers = useMemo(
    () => users.filter((u) => u.role === "user"),
    [users]
  );

  const getChartData = (list: { createdAt?: string }[] | undefined | null) => {
    if (!Array.isArray(list)) return {};
    return list.reduce((acc: Record<string, number>, item) => {
      const date = item?.createdAt
        ? moment(item.createdAt).format("MM/YYYY")
        : "Chưa có";
      acc[date] = acc[date] ? acc[date] + 1 : 1;
      return acc;
    }, {});
  };

  const userChartData = useMemo(() => getChartData(normalUsers), [normalUsers]);
  const businessChartData = useMemo(
    () => getChartData(businessUsers),
    [businessUsers]
  );
  const restaurantChartData = useMemo(
    () => getChartData(restaurants),
    [restaurants]
  );

  const chartOptions = (categories: string[]) => ({
    chart: { id: "chart" },
    xaxis: { categories },
  });

  const loading = userLoading || restaurantLoading;
  const error = userError || restaurantError;

  const lastUpdated = useMemo(() => {
    const userDates = users
      .map((u) => u.updatedAt || u.createdAt)
      .filter(Boolean) as string[];
    const restDates = restaurants
      .map((r) => r.updatedAt || r.createdAt)
      .filter(Boolean) as string[];

    const dates = [...userDates, ...restDates].map((d) =>
      new Date(d).getTime()
    );
    if (!dates.length) return null;
    return moment(Math.max(...dates)).fromNow();
  }, [users, restaurants]);

  const theme = useTheme();
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
    <Box className={styles.dashboard}>
      <Typography variant="h4" fontWeight={600} mb={3}>
        Tổng quan người dùng & nhà hàng
      </Typography>
      <Typography color="text.secondary" mb={3}>
        Báo cáo tóm tắt — số liệu cập nhật {lastUpdated ?? "chưa có"}
      </Typography>

      {/* Thống kê tổng quan */}
      <Grid container spacing={3} className={styles.cards}>
        <Grid item xs={12} md={4} component={"div" as React.ElementType}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              background: gradients.blue,
              color: "common.white",
              borderRadius: 2,
            }}
          >
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: "rgba(255,255,255,0.12)", mr: 2 }}>
                  {/* icon */}
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography sx={{ color: "white" }}>
                    Tổng User thường
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ color: "white", fontWeight: 700 }}
                  >
                    {normalUsers.length}
                  </Typography>
                </Box>
              </Box>
              <Box textAlign="right">
                <Chip label="+3%" size="small" color="success" />
                <Typography
                  variant="caption"
                  display="block"
                  sx={{ color: "rgba(255,255,255,0.85)" }}
                >
                  so với tháng trước
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4} component={"div" as React.ElementType}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              background: gradients.red,
              color: "common.white",
              borderRadius: 2,
            }}
          >
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: "rgba(255,255,255,0.12)", mr: 2 }}>
                  <BusinessIcon />
                </Avatar>
                <Box>
                  <Typography sx={{ color: "white" }}>
                    Tổng User Business
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ color: "white", fontWeight: 700 }}
                  >
                    {businessUsers.length}
                  </Typography>
                </Box>
              </Box>
              <Box textAlign="right">
                <Chip label="-1%" size="small" color="warning" />
                <Typography
                  variant="caption"
                  display="block"
                  sx={{ color: "rgba(255,255,255,0.85)" }}
                >
                  so với tháng trước
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4} component={"div" as React.ElementType}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              background: gradients.green,
              color: "common.white",
              borderRadius: 2,
            }}
          >
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: "rgba(255,255,255,0.12)", mr: 2 }}>
                  <BusinessIcon />
                </Avatar>
                <Box>
                  <Typography sx={{ color: "white" }}>Tổng nhà hàng</Typography>
                  <Typography
                    variant="h5"
                    sx={{ color: "white", fontWeight: 700 }}
                  >
                    {restaurants.length}
                  </Typography>
                </Box>
              </Box>
              <Box textAlign="right">
                <Chip label="+8%" size="small" color="success" />
                <Typography
                  variant="caption"
                  display="block"
                  sx={{ color: "rgba(255,255,255,0.85)" }}
                >
                  so với tháng trước
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Biểu đồ */}
      <Grid container spacing={3} mt={3} className={styles.charts}>
        <Grid item xs={12} md={6} component={"div" as React.ElementType}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>
              User thường theo tháng
            </Typography>
            {Object.keys(userChartData).length ? (
              <Chart
                options={chartOptions(Object.keys(userChartData))}
                series={[{ name: "Users", data: Object.values(userChartData) }]}
                type="bar"
                width="100%"
                height={300}
              />
            ) : (
              <Typography>Chưa có dữ liệu</Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6} component={"div" as React.ElementType}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>
              User Business theo tháng
            </Typography>
            {Object.keys(businessChartData).length ? (
              <Chart
                options={chartOptions(Object.keys(businessChartData))}
                series={[
                  { name: "Business", data: Object.values(businessChartData) },
                ]}
                type="bar"
                width="100%"
                height={300}
              />
            ) : (
              <Typography>Chưa có dữ liệu</Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} component={"div" as React.ElementType}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>
              Nhà hàng theo tháng
            </Typography>
            <Divider sx={{ my: 1 }} />
            {Object.keys(restaurantChartData).length ? (
              <Chart
                options={chartOptions(Object.keys(restaurantChartData))}
                series={[
                  {
                    name: "Nhà hàng",
                    data: Object.values(restaurantChartData),
                  },
                ]}
                type="bar"
                width="100%"
                height={300}
              />
            ) : (
              <Typography>Chưa có dữ liệu</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
