"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Avatar,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Stack,
  Button,
  SxProps,
  Theme,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PieChartIcon from "@mui/icons-material/PieChart";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { fetchDishes } from "@/redux/slices/dishSlide";
import { fetchPromotions } from "@/redux/slices/promotionSlice";
import { fetchRestaurantByOwner } from "@/redux/slices/restaurantSlice";
import { fetchRestaurantRevenue } from "@/redux/slices/orderSlice";
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
  const { revenueByRestaurant, loading: loadingRevenue } = useAppSelector(
    (state) => state.order
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
      // fetch revenue for the restaurant (month/year optional)
      dispatch(fetchRestaurantRevenue({ restaurantId: restaurant.id }));
    }
  }, [dispatch, restaurant]);

  // Month/Year selectors to filter revenue
  const [selectedMonth, setSelectedMonth] = useState<number | "all">(
    new Date().getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );

  // Fetch revenue when selection changes
  useEffect(() => {
    if (!restaurant?.id) return;
    const args: { restaurantId: number; month?: number; year?: number } = {
      restaurantId: restaurant.id,
    };
    if (selectedMonth !== "all") args.month = selectedMonth as number;
    if (selectedYear) args.year = selectedYear;
    dispatch(fetchRestaurantRevenue(args));
  }, [dispatch, restaurant, selectedMonth, selectedYear]);

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

  // Small reusable KPI card used in the dashboard
  const KPICard: React.FC<{
    title: string;
    value: string | number;
    delta?: string;
    positive?: boolean;
    icon?: React.ReactNode;
    sx?: SxProps<Theme>;
  }> = ({ title, value, delta, positive, icon, sx }) => (
    <Paper
      sx={{ p: 2, display: "flex", alignItems: "center", gap: 2, ...sx }}
      elevation={3}
    >
      <Avatar
        sx={{
          bgcolor: "background.paper",
          color: "primary.main",
          width: 56,
          height: 56,
        }}
      >
        {icon}
      </Avatar>
      <Box flex={1}>
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h6" fontWeight={700}>
          {value}
        </Typography>
      </Box>
      {delta ? (
        <Box textAlign="right">
          <Typography
            variant="body2"
            color={positive ? "success.main" : "error.main"}
          >
            {positive ? (
              <ArrowUpwardIcon fontSize="small" />
            ) : (
              <ArrowDownwardIcon fontSize="small" />
            )}{" "}
            {delta}
          </Typography>
        </Box>
      ) : null}
    </Paper>
  );

  if (loadingRestaurant) return <CircularProgress />;

  if (!restaurant) return <Typography>Chưa có nhà hàng để thống kê</Typography>;

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight={600} mb={3}>
        Báo cáo doanh thu
      </Typography>

      <Box sx={{ mb: 3, display: "grid", gap: 3 }}>
        <Box>
          <Paper elevation={3} sx={{ p: 2 }}>
            {loadingRevenue ? (
              <Box display="flex" justifyContent="center" py={6}>
                <CircularProgress />
              </Box>
            ) : (
              (() => {
                const rev = revenueByRestaurant?.[restaurant.id] as unknown;

                type MonthBlock = {
                  revenue?: number | string;
                  Revenue?: number | string;
                  prevRevenue?: number | string;
                  PrevRevenue?: number | string;
                  totalRevenue?: number | string;
                  prevTotal?: number | string;
                  paidOrders?: number | string;
                  PaidOrders?: number | string;
                  ordersCount?: number | string;
                };

                const toNumber = (v: unknown): number | undefined => {
                  if (typeof v === "number") return v;
                  if (typeof v === "string") {
                    const n = Number(v);
                    return Number.isNaN(n) ? undefined : n;
                  }
                  return undefined;
                };

                const normalize = (r: unknown): MonthBlock | null => {
                  if (!r || typeof r !== "object") return null;
                  const o = r as Record<string, unknown>;
                  const month = (o["Month"] ?? o["month"]) as
                    | Record<string, unknown>
                    | undefined;
                  if (month && typeof month === "object")
                    return month as MonthBlock;
                  return o as MonthBlock;
                };

                const monthBlock = normalize(rev);

                const monthRevenue =
                  toNumber(
                    monthBlock?.revenue ??
                      monthBlock?.Revenue ??
                      monthBlock?.totalRevenue
                  ) ?? 0;
                const prevMonthRevenue =
                  toNumber(
                    monthBlock?.prevRevenue ??
                      monthBlock?.PrevRevenue ??
                      monthBlock?.prevTotal
                  ) ?? 0;
                const paidOrders =
                  toNumber(
                    monthBlock?.paidOrders ??
                      monthBlock?.PaidOrders ??
                      monthBlock?.ordersCount
                  ) ?? 0;
                const avgOrder = paidOrders ? monthRevenue / paidOrders : 0;

                const fmt = new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                  maximumFractionDigits: 0,
                });

                const series = [
                  { name: "Tháng trước", data: [prevMonthRevenue] },
                  { name: "Tháng này", data: [monthRevenue] },
                ];

                const options = {
                  chart: { id: "revenue-compare" },
                  xaxis: { categories: ["So sánh"] },
                  colors: ["#9e9e9e", "#4caf50"],
                  tooltip: {
                    y: { formatter: (val: number) => fmt.format(val) },
                  },
                };

                return (
                  <Box>
                    <Box
                      mb={2}
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <FormControl size="small">
                          <InputLabel id="month-select-label">Tháng</InputLabel>
                          <Select
                            labelId="month-select-label"
                            value={selectedMonth}
                            label="Tháng"
                            onChange={(e) => {
                              const v = e.target.value as string | number;
                              setSelectedMonth(v === "all" ? "all" : Number(v));
                            }}
                            sx={{ minWidth: 120 }}
                          >
                            <MenuItem value={"all"}>Tất cả</MenuItem>
                            {[...Array(12)].map((_, i) => (
                              <MenuItem key={i + 1} value={i + 1}>
                                Tháng {i + 1}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <FormControl size="small">
                          <InputLabel id="year-select-label">Năm</InputLabel>
                          <Select
                            labelId="year-select-label"
                            value={selectedYear}
                            label="Năm"
                            onChange={(e) =>
                              setSelectedYear(Number(e.target.value))
                            }
                            sx={{ minWidth: 120 }}
                          >
                            {Array.from({ length: 6 }).map((_, idx) => {
                              const y = new Date().getFullYear() - idx;
                              return (
                                <MenuItem key={y} value={y}>
                                  {y}
                                </MenuItem>
                              );
                            })}
                          </Select>
                        </FormControl>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setSelectedMonth(new Date().getMonth() + 1);
                            setSelectedYear(new Date().getFullYear());
                          }}
                        >
                          Reset
                        </Button>
                      </Stack>
                    </Box>
                    <Box
                      sx={{
                        display: "grid",
                        gap: 2,
                        gridTemplateColumns: {
                          xs: "1fr",
                          md: "repeat(4, 1fr)",
                        },
                      }}
                    >
                      <Box>
                        <KPICard
                          title="Doanh thu (tháng)"
                          value={fmt.format(monthRevenue)}
                          delta={
                            prevMonthRevenue
                              ? `${(
                                  ((monthRevenue - prevMonthRevenue) /
                                    Math.max(prevMonthRevenue, 1)) *
                                  100
                                ).toFixed(1)}%`
                              : undefined
                          }
                          positive={monthRevenue >= prevMonthRevenue}
                          icon={<MonetizationOnIcon />}
                        />
                      </Box>

                      <Box>
                        <KPICard
                          title="So sánh"
                          value={
                            prevMonthRevenue
                              ? `${fmt.format(prevMonthRevenue)} → ${fmt.format(
                                  monthRevenue
                                )}`
                              : "-"
                          }
                          delta={
                            prevMonthRevenue
                              ? `${(
                                  ((monthRevenue - prevMonthRevenue) /
                                    Math.max(prevMonthRevenue, 1)) *
                                  100
                                ).toFixed(1)}%`
                              : undefined
                          }
                          positive={monthRevenue >= prevMonthRevenue}
                          icon={<PieChartIcon />}
                        />
                      </Box>

                      <Box>
                        <KPICard
                          title="Đơn đã thanh toán"
                          value={paidOrders}
                          icon={<ShoppingCartIcon />}
                        />
                      </Box>

                      <Box>
                        <KPICard
                          title="Giá trị TB / đơn"
                          value={fmt.format(avgOrder)}
                          icon={<MonetizationOnIcon />}
                        />
                      </Box>
                    </Box>

                    <Box
                      mt={2}
                      sx={{
                        p: 2,
                        bgcolor: "background.paper",
                        borderRadius: 1,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        mb={1}
                        color="text.secondary"
                      >
                        Biểu đồ so sánh doanh thu
                      </Typography>
                      <Chart
                        options={options}
                        series={series}
                        type="bar"
                        height={240}
                      />
                    </Box>
                  </Box>
                );
              })()
            )}
          </Paper>
        </Box>
      </Box>

      <Typography variant="h5" fontWeight={600} mb={3}>
        Thống kê món ăn & khuyến mãi
      </Typography>

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
        }}
      >
        <Box>
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
        </Box>

        <Box>
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
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardChart;
