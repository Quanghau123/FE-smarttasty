"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "@mui/material/styles";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
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
import { motion, useReducedMotion } from "framer-motion";
import dayjs from "dayjs";
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
import { fetchReservationsByRestaurant } from "@/redux/slices/reservationSlice";
import { fetchStaffsByBusiness } from "@/redux/slices/staffSlice";
import { getAccessToken } from "@/lib/utils/tokenHelper";
import axiosInstance from "@/lib/axios/axiosInstance";
import type { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const fadeInUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
} as const;

const BOOKING_STATUS_CATEGORIES = [
  "Pending",
  "Confirmed",
  "CheckedIn",
  "Completed",
  "Cancelled",
] as const;

const getTokenFromLocalStorage = () => {
  return getAccessToken() || "";
};

const DashboardChart = () => {
  const dispatch = useAppDispatch();
  const t = useTranslations("dashboard");
  const theme = useTheme();
  const chartTextColor =
    theme.palette.mode === "dark"
      ? theme.palette.common.white
      : theme.palette.text.secondary;
  const tooltipTheme = theme.palette.mode === "dark" ? "dark" : "light";
  const prefersReducedMotion = useReducedMotion();

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
  const { reservations, loading: loadingReservations } = useAppSelector(
    (state) => state.reservation
  );
  const { staffs, loading: loadingStaffs } = useAppSelector(
    (state) => state.staff
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
      dispatch(
        fetchDishes({
          restaurantId: restaurant.id,
          pageNumber: 1,
          pageSize: 9999,
        })
      );
      dispatch(fetchPromotions(restaurant.id.toString()));
      dispatch(fetchRestaurantRevenue({ restaurantId: restaurant.id }));
      dispatch(fetchReservationsByRestaurant(restaurant.id));
    }
  }, [dispatch, restaurant]);
  useEffect(() => {
    if (!token) return;
    try {
      axiosInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;
    } catch {}
    dispatch(fetchStaffsByBusiness());
  }, [dispatch, token]);

  const [selectedMonth, setSelectedMonth] = useState<number | "all">(
    new Date().getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );

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

  const dishesDonutSeries = useMemo(
    () => [
      countByCategory.ThucAn,
      countByCategory.NuocUong,
      countByCategory.ThucAnThem,
    ],
    [countByCategory]
  );

  const dishesDonutOptions = useMemo(
    () =>
      ({
        chart: {
          id: "dishes-donut",
          foreColor: chartTextColor,
          animations: { enabled: false },
          toolbar: { show: false },
        },
        labels: [
          t("category.food"),
          t("category.drink"),
          t("category.extraFood"),
        ],
        legend: {
          position: "bottom" as const,
          labels: { colors: [chartTextColor] },
        },
        dataLabels: { enabled: false },
        colors: ["#4caf50", "#2196f3", "#ff9800"],
        plotOptions: {
          pie: {
            donut: {
              size: "65%",
              labels: {
                show: true,
                name: { show: true, color: chartTextColor },
                value: {
                  show: true,
                  formatter: (val: string) => `${val}`,
                  color: chartTextColor,
                },
                total: {
                  show: true,
                  label: "Tổng",
                  color: chartTextColor,
                  formatter: (w: { globals?: { seriesTotals?: number[] } }) => {
                    const totals = w?.globals?.seriesTotals;
                    const sum = (totals || []).reduce((a, b) => a + b, 0);
                    return `${sum}`;
                  },
                },
              },
            },
          },
        },
      } as unknown as ApexOptions),
    [t, chartTextColor]
  );

  const promotionCounts = useMemo(() => {
    const dishCount = promotions.filter((p) => p.targetType === "dish").length;
    const orderCount = promotions.filter(
      (p) => p.targetType === "order"
    ).length;
    return { dish: dishCount, order: orderCount };
  }, [promotions]);

  const promotionDonutSeries = useMemo(
    () => [promotionCounts.dish, promotionCounts.order],
    [promotionCounts]
  );

  const promotionDonutOptions = useMemo(
    () =>
      ({
        chart: {
          id: "promotion-donut",
          foreColor: chartTextColor,
          animations: { enabled: false },
          toolbar: { show: false },
        },
        labels: [t("promotion.dish"), t("promotion.order")],
        legend: {
          position: "bottom" as const,
          labels: { colors: [chartTextColor] },
        },
        dataLabels: { enabled: false },
        colors: ["#7b61ff", "#ff6b6b"],
        fill: {
          type: "gradient",
          gradient: {
            shadeIntensity: 0.3,
            opacityFrom: 0.9,
            opacityTo: 0.9,
            stops: [0, 85, 100],
          },
        },
        plotOptions: {
          pie: {
            donut: {
              size: "68%",
              labels: {
                show: true,
                name: { show: true, color: chartTextColor },
                value: {
                  show: true,
                  formatter: (val: string) => `${val}`,
                  color: chartTextColor,
                },
                total: {
                  show: true,
                  label: "Tổng",
                  color: chartTextColor,
                  formatter: (w: { globals?: { seriesTotals?: number[] } }) => {
                    const totals = w?.globals?.seriesTotals;
                    const sum = (totals || []).reduce((a, b) => a + b, 0);
                    return `${sum}`;
                  },
                },
              },
            },
          },
        },
      } as unknown as ApexOptions),
    [t, chartTextColor]
  );

  const statusCounts = useMemo(() => {
    const counts: Record<(typeof BOOKING_STATUS_CATEGORIES)[number], number> = {
      Pending: 0,
      Confirmed: 0,
      CheckedIn: 0,
      Completed: 0,
      Cancelled: 0,
    };
    reservations.forEach((r) => {
      const raw = typeof r.status === "string" ? r.status : String(r.status);
      const norm = raw.toLowerCase();
      let key: (typeof BOOKING_STATUS_CATEGORIES)[number] | null = null;
      if (norm.includes("pending")) key = "Pending";
      else if (norm.includes("confirmed")) key = "Confirmed";
      else if (norm.includes("checkedin")) key = "CheckedIn";
      else if (norm.includes("completed")) key = "Completed";
      else if (norm.includes("cancel")) key = "Cancelled";
      if (key) counts[key] += 1;
    });
    return counts;
  }, [reservations]);

  const bookingStatusBarSeries = useMemo(
    () => [
      {
        name: t("series_count"),
        data: Array.from(BOOKING_STATUS_CATEGORIES).map(
          (k) => statusCounts[k] || 0
        ),
      },
    ],
    [statusCounts, t]
  );

  const bookingStatusBarOptions = useMemo(() => {
    const STATUS_LABELS: Record<
      (typeof BOOKING_STATUS_CATEGORIES)[number],
      string
    > = {
      Pending: t("status.pending"),
      Confirmed: t("status.confirmed"),
      CheckedIn: t("status.checkedIn"),
      Completed: t("status.completed"),
      Cancelled: t("status.cancelled"),
    };
    return {
      chart: {
        id: "reservation-status-bar",
        foreColor: chartTextColor,
        animations: { enabled: false },
        toolbar: { show: false },
      },
      xaxis: {
        categories: Array.from(BOOKING_STATUS_CATEGORIES).map(
          (k) => STATUS_LABELS[k]
        ),
        labels: { style: { colors: [chartTextColor], fontSize: "14px" } },
      },
      dataLabels: {
        enabled: true,
        style: { fontSize: "14px", colors: [chartTextColor] },
      },
      grid: { strokeDashArray: 3 },
      colors: ["#42a5f5"],
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: "60%",
          dataLabels: { position: "right" },
        },
      },
      tooltip: {
        y: {
          formatter: (val: number) => `${val} lượt đặt bàn`,
        },
      },
    };
  }, [t, chartTextColor]);

  //nhan viên được tạo trong 6 tháng gần đây
  const staffTrend = useMemo(() => {
    const months: { label: string; key: string }[] = [];
    const now = dayjs();
    for (let i = 5; i >= 0; i--) {
      const m = now.subtract(i, "month");
      months.push({ label: m.format("MM/YYYY"), key: m.format("YYYY-MM") });
    }
    const counts: Record<string, number> = Object.fromEntries(
      months.map((m) => [m.key, 0])
    );
    staffs.forEach((s) => {
      const key = dayjs(s.createdAt).isValid()
        ? dayjs(s.createdAt).format("YYYY-MM")
        : "";
      if (key in counts) counts[key]++;
    });
    return {
      labels: months.map((m) => m.label),
      data: months.map((m) => counts[m.key] || 0),
    };
  }, [staffs]);

  const staffChartOptions = useMemo(
    () => ({
      chart: {
        id: "staff-trend",
        foreColor: chartTextColor,
        animations: { enabled: false },
        toolbar: { show: false },
      },
      xaxis: {
        categories: staffTrend.labels,
        labels: { style: { colors: [chartTextColor] } },
      },
      dataLabels: { enabled: false },
      grid: { strokeDashArray: 3 },
      colors: ["#ff9800"],
    }),
    [staffTrend.labels, chartTextColor]
  );

  const staffSeries = useMemo(
    () => [{ name: t("series_created"), data: staffTrend.data }],
    [staffTrend.data, t]
  );

  const KPICard = React.memo<{
    title: string;
    value: string | number;
    delta?: string;
    positive?: boolean;
    icon?: React.ReactNode;
    sx?: SxProps<Theme>;
  }>(function KPICard({ title, value, delta, positive, icon, sx }) {
    return (
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
  });

  if (loadingRestaurant || !restaurant) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="50vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ px: 3, pt: 0, pb: 3 }}>
      <motion.div
        initial={prefersReducedMotion ? undefined : "hidden"}
        animate={"visible"}
        variants={fadeInUpVariants}
      >
        <Typography variant="h5" fontWeight={600} mb={3}>
          {t("revenue_title")}
        </Typography>
      </motion.div>

      <Box sx={{ mb: 3, display: "grid", gap: 3 }}>
        <Paper elevation={3} sx={{ p: 2 }}>
          {loadingRevenue ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : (
            (() => {
              const rev = revenueByRestaurant?.[restaurant.id] as unknown;

              type RevenueBlock = {
                revenue?: number | string;
                Revenue?: number | string;
                prevRevenue?: number | string;
                PrevRevenue?: number | string;
                totalRevenue?: number | string;
                prevTotal?: number | string;
                PrevTotal?: number | string;
                paidOrders?: number | string;
                PaidOrders?: number | string;
                ordersCount?: number | string;
                TotalOrders?: number | string;
              };

              const toNumber = (v: unknown): number | undefined => {
                if (typeof v === "number") return v;
                if (typeof v === "string") {
                  const n = Number(v);
                  return Number.isNaN(n) ? undefined : n;
                }
                return undefined;
              };

              const pickBlock = (
                r: unknown,
                key?: "Month" | "Year"
              ): RevenueBlock | null => {
                if (!r || typeof r !== "object") return null;
                const o = r as Record<string, unknown>;
                if (key) {
                  const found =
                    o[key] ?? o[key.toLowerCase()] ?? o[key.toUpperCase()];
                  if (found && typeof found === "object")
                    return found as RevenueBlock;
                }
                return o as RevenueBlock;
              };

              const monthBlock = pickBlock(rev, "Month");
              const yearBlock = pickBlock(rev, "Year");
              const isYearView = selectedMonth === "all";
              const activeBlock =
                (isYearView ? yearBlock : monthBlock) ??
                monthBlock ??
                yearBlock ??
                pickBlock(rev);

              const currentRevenue =
                toNumber(
                  activeBlock?.revenue ??
                    activeBlock?.Revenue ??
                    activeBlock?.totalRevenue
                ) ?? 0;
              const prevRevenue =
                toNumber(
                  activeBlock?.prevRevenue ??
                    activeBlock?.PrevRevenue ??
                    activeBlock?.prevTotal ??
                    activeBlock?.PrevTotal
                ) ?? 0;
              const paidOrders =
                toNumber(
                  activeBlock?.paidOrders ??
                    activeBlock?.PaidOrders ??
                    activeBlock?.ordersCount ??
                    activeBlock?.TotalOrders
                ) ?? 0;
              const avgOrder = paidOrders ? currentRevenue / paidOrders : 0;

              const fmt = new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
                maximumFractionDigits: 0,
              });

              const prevLabel = isYearView
                ? `${t("year_label")} ${selectedYear - 1}`
                : t("previous_month");
              const currentLabel = isYearView
                ? `${t("year_label")} ${selectedYear}`
                : t("current_month");
              const compareLabel = isYearView
                ? `${t("year_label")} ${selectedYear}`
                : t("compare_label");

              const series = [
                { name: prevLabel, data: [prevRevenue] },
                { name: currentLabel, data: [currentRevenue] },
              ];

              const options = {
                chart: { id: "revenue-compare", foreColor: chartTextColor },
                xaxis: {
                  categories: [compareLabel],
                  labels: { style: { colors: [chartTextColor] } },
                },
                colors: ["#9e9e9e", "#4caf50"],
                tooltip: {
                  theme: tooltipTheme,
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
                        <InputLabel id="month-select-label">
                          {t("month_label")}
                        </InputLabel>
                        <Select
                          labelId="month-select-label"
                          value={selectedMonth}
                          label={t("month_label")}
                          onChange={(e) => {
                            const v = e.target.value as string | number;
                            setSelectedMonth(v === "all" ? "all" : Number(v));
                          }}
                          sx={{ minWidth: 120 }}
                        >
                          <MenuItem value={"all"}>{t("all_label")}</MenuItem>
                          {[...Array(12)].map((_, i) => (
                            <MenuItem key={i + 1} value={i + 1}>
                              {`${t("month")} ${i + 1}`}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl size="small">
                        <InputLabel id="year-select-label">
                          {t("year_label")}
                        </InputLabel>
                        <Select
                          labelId="year-select-label"
                          value={selectedYear}
                          label={t("year_label")}
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
                        {t("reset_btn")}
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
                    <KPICard
                      title={t("kpi_revenue_month")}
                      value={fmt.format(currentRevenue)}
                      delta={
                        prevRevenue
                          ? `${(
                              ((currentRevenue - prevRevenue) /
                                Math.max(prevRevenue, 1)) *
                              100
                            ).toFixed(1)}%`
                          : undefined
                      }
                      positive={currentRevenue >= prevRevenue}
                      icon={<MonetizationOnIcon />}
                    />

                    <KPICard
                      title={t("kpi_compare")}
                      value={
                        prevRevenue
                          ? `${fmt.format(prevRevenue)} → ${fmt.format(
                              currentRevenue
                            )}`
                          : "-"
                      }
                      delta={
                        prevRevenue
                          ? `${(
                              ((currentRevenue - prevRevenue) /
                                Math.max(prevRevenue, 1)) *
                              100
                            ).toFixed(1)}%`
                          : undefined
                      }
                      positive={currentRevenue >= prevRevenue}
                      icon={<PieChartIcon />}
                    />

                    <KPICard
                      title={t("kpi_paid_orders")}
                      value={paidOrders}
                      icon={<ShoppingCartIcon />}
                    />

                    <KPICard
                      title={t("kpi_avg_order")}
                      value={fmt.format(avgOrder)}
                      icon={<MonetizationOnIcon />}
                    />
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
                      sx={{ color: chartTextColor }}
                    >
                      {t("revenue_compare_chart")}
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

      <motion.div
        initial={prefersReducedMotion ? undefined : "hidden"}
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={fadeInUpVariants}
      >
        <Typography variant="h5" fontWeight={600} mb={3}>
          {t("dishes_promotions_title")}
        </Typography>
      </motion.div>

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
              {t("dishes_by_category_title")}
            </Typography>
            {loadingDishes ? (
              <CircularProgress />
            ) : (
              <Chart
                options={{
                  ...dishesDonutOptions,
                  tooltip: { theme: tooltipTheme },
                }}
                series={dishesDonutSeries}
                type="donut"
                height={300}
              />
            )}
          </Paper>
        </Box>

        <Box>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>
              {t("promotions_by_type_title")}
            </Typography>
            {loadingPromotions ? (
              <CircularProgress />
            ) : (
              <Chart
                options={{
                  ...promotionDonutOptions,
                  tooltip: { theme: tooltipTheme },
                }}
                series={promotionDonutSeries}
                type="donut"
                height={300}
              />
            )}
          </Paper>
        </Box>
      </Box>

      <motion.div
        initial={prefersReducedMotion ? undefined : "hidden"}
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={fadeInUpVariants}
      >
        <Typography variant="h5" fontWeight={600} my={3}>
          {t("bookings_and_staff_title")}
        </Typography>
      </motion.div>

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
        }}
      >
        <Box sx={{ height: { xs: 360, md: 360 } }}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Typography variant="h6" mb={2} color="text.primary">
              {t("reservations_by_status_title")}
            </Typography>
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              {loadingReservations ? (
                <CircularProgress />
              ) : (
                <>
                  <Chart
                    type="bar"
                    height={220}
                    options={{
                      ...bookingStatusBarOptions,
                      xaxis: {
                        ...bookingStatusBarOptions.xaxis,
                        labels: {
                          ...bookingStatusBarOptions.xaxis.labels,
                          style: {
                            colors: [chartTextColor],
                            fontSize: "14px",
                          },
                        },
                      },
                      dataLabels: {
                        ...bookingStatusBarOptions.dataLabels,
                        style: {
                          colors: [chartTextColor],
                          fontSize: "14px",
                        },
                      },
                      tooltip: {
                        y: (bookingStatusBarOptions as ApexOptions).tooltip?.y,
                        theme: tooltipTheme,
                      },
                    }}
                    series={bookingStatusBarSeries}
                  />
                  <Box mt={2} textAlign="right">
                    <Typography variant="subtitle2" color="text.secondary">
                      Tổng lượt đặt bàn:{" "}
                      {bookingStatusBarSeries[0].data.reduce(
                        (a, b) => a + b,
                        0
                      )}
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          </Paper>
        </Box>

        <Box sx={{ height: { xs: 360, md: 360 } }}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Typography variant="h6" mb={2} sx={{ color: chartTextColor }}>
              {t("staff_accounts_title")}
            </Typography>
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              {loadingStaffs ? (
                <CircularProgress />
              ) : (
                <Chart
                  type="bar"
                  height={220}
                  series={staffSeries}
                  options={{
                    ...staffChartOptions,
                    xaxis: {
                      ...staffChartOptions.xaxis,
                      labels: {
                        style: {
                          colors: [chartTextColor],
                          fontSize: "14px",
                        },
                      },
                    },
                    dataLabels: {
                      ...staffChartOptions.dataLabels,
                      style: { fontSize: "14px" },
                    },
                    tooltip: { theme: tooltipTheme },
                  }}
                />
              )}
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardChart;
