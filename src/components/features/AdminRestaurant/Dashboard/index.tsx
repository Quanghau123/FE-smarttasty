"use client";

import React, { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { Box, Typography, Grid, Paper, CircularProgress } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { fetchDishes } from "@/redux/slices/dishSlide";
import { fetchPromotions } from "@/redux/slices/promotionSlice";
import { fetchRestaurantByOwner } from "@/redux/slices/restaurantSlice";
import { getAccessToken } from "@/lib/utils/tokenHelper";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const getTokenFromLocalStorage = () => {
  return getAccessToken() || "";
};

const DashboardChart = () => {
  const dispatch = useAppDispatch();

  const { current: restaurant, loading: loadingRestaurant } = useAppSelector(
    (state) => state.restaurant
  );
  const { items: dishes, loading: loadingDishes } = useAppSelector(
    (state) => state.dishes
  );
  const { promotions, loading: loadingPromotions } = useAppSelector(
    (state) => state.promotion
  );

  const token = getTokenFromLocalStorage();

  // Lấy nhà hàng của owner
  useEffect(() => {
    if (token) {
      dispatch(fetchRestaurantByOwner({ token }));
    }
  }, [dispatch, token]);

  // Lấy món ăn & khuyến mãi khi có nhà hàng
  useEffect(() => {
    if (restaurant?.id) {
      dispatch(fetchDishes(restaurant.id));
      dispatch(fetchPromotions(restaurant.id.toString()));
    }
  }, [dispatch, restaurant]);

  const countByCategory = useMemo(() => {
    const counts: Record<string, number> = {
      ThucAn: 0,
      NuocUong: 0,
      ThucAnThem: 0,
    };

    dishes.forEach((dish) => {
      if (counts[dish.category] !== undefined) counts[dish.category]++;
    });

    return counts;
  }, [dishes]);

  const chartOptions = {
    chart: { id: "bar-chart" },
    xaxis: { categories: ["Thức ăn", "Nước uống", "Thức ăn thêm"] },
    colors: ["#4caf50", "#2196f3", "#ff9800"],
  };

  const promotionChartOptions = {
    chart: { id: "promotion-chart" },
    xaxis: { categories: ["Khuyến mãi hiện có"] },
    colors: ["#9c27b0"],
  };

  const chartSeries = [
    {
      name: "Số lượng món",
      data: [
        countByCategory.ThucAn,
        countByCategory.NuocUong,
        countByCategory.ThucAnThem,
      ],
    },
  ];

  const promotionSeries = [
    {
      name: "Số lượng khuyến mãi",
      data: [promotions.length],
    },
  ];

  if (loadingRestaurant) return <CircularProgress />;

  if (!restaurant) return <Typography>Chưa có nhà hàng để thống kê</Typography>;

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight={600} mb={3}>
        Thống kê món ăn & khuyến mãi
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6} component={"div" as React.ElementType}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>
              Số lượng món ăn theo danh mục
            </Typography>
            {loadingDishes ? (
              <CircularProgress />
            ) : (
              <Chart
                options={chartOptions}
                series={chartSeries}
                type="bar"
                height={300}
              />
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6} component={"div" as React.ElementType}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>
              Tổng số khuyến mãi
            </Typography>
            {loadingPromotions ? (
              <CircularProgress />
            ) : (
              <Chart
                options={promotionChartOptions}
                series={promotionSeries}
                type="bar"
                height={300}
              />
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardChart;
