"use client";

import { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Box,
  Typography,
  Avatar,
  Paper,
  CircularProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { fetchRestaurants } from "@/redux/slices/restaurantSlice";
import { fetchUsers } from "@/redux/slices/userSlice";
import moment from "moment";
import styles from "./styles.module.scss";

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

      {/* Thống kê tổng quan */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4} component={"div" as React.ElementType}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ bgcolor: "#1976d2", mr: 2 }}>
                <PersonIcon />
              </Avatar>
              <Box>
                <Typography>Tổng User thường</Typography>
                <Typography variant="h5">{normalUsers.length}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4} component={"div" as React.ElementType}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ bgcolor: "#d32f2f", mr: 2 }}>
                <BusinessIcon />
              </Avatar>
              <Box>
                <Typography>Tổng User Business</Typography>
                <Typography variant="h5">{businessUsers.length}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4} component={"div" as React.ElementType}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ bgcolor: "#388e3c", mr: 2 }}>
                <BusinessIcon />
              </Avatar>
              <Box>
                <Typography>Tổng nhà hàng</Typography>
                <Typography variant="h5">{restaurants.length}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Biểu đồ */}
      <Grid container spacing={3} mt={3}>
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
