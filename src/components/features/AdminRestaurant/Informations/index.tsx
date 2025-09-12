"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Box, Typography, Grid, Paper, CircularProgress } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { fetchDishes } from "@/redux/slices/dishSlide";
import { fetchPromotions } from "@/redux/slices/promotionSlice";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const getUserFromLocalStorage = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const DashboardChart = () => {
  const dispatch = useAppDispatch();
  const { items: dishes, loading: loadingDishes } = useAppSelector(
    (state) => state.dishes
  );
  const { promotions, loading: loadingPromotions } = useAppSelector(
    (state) => state.promotion
  );
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRestaurant = async () => {
      const { token, user } = getUserFromLocalStorage();
      const userId = user?.userId;
      if (!token || !userId) return;

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Restaurant`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        const myRestaurant = data?.data?.find((r: any) => r.ownerId === userId);
        if (!myRestaurant?.id) return alert("Tài khoản chưa có nhà hàng!");
        setRestaurantId(myRestaurant.id);
      } catch {
        alert("Không thể lấy thông tin nhà hàng");
      }
    };

    fetchRestaurant();
  }, []);

  useEffect(() => {
    if (restaurantId) {
      dispatch(fetchDishes(restaurantId));
      dispatch(fetchPromotions(restaurantId));
    }
  }, [restaurantId, dispatch]);

  const countByCategory = useMemo(() => {
    const counts = {
      ThucAn: 0,
      NuocUong: 0,
      ThucAnThem: 0,
    };

    dishes.forEach((dish) => {
      if (counts[dish.category] !== undefined) {
        counts[dish.category]++;
      }
    });

    return counts;
  }, [dishes]);

  const chartOptions = {
    chart: { id: "bar-chart" },
    xaxis: {
      categories: ["Thức ăn", "Nước uống", "Thức ăn thêm"],
    },
    colors: ["#4caf50", "#2196f3", "#ff9800"],
  };

  const promotionChartOptions = {
    chart: { id: "promotion-chart" },
    xaxis: {
      categories: ["Khuyến mãi hiện có"],
    },
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

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight={600} mb={3}>
        Thống kê món ăn & khuyến mãi
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
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

        <Grid item xs={12} md={6}>
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
