"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  LinearProgress,
} from "@mui/material";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Store,
  CreditCard,
  AttachMoney,
  CalendarToday,
} from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import {
  fetchMonthlyCommission,
  fetchCommissionList,
  fetchRestaurantCommissions,
  fetchDailyCommissions,
  fetchPaymentMethodCommissions,
} from "@/redux/slices/comission";
import { PaymentMethod } from "@/types/commission";
import { useTranslations } from "next-intl";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const CommissionStatistics = () => {
  const t = useTranslations("commissionStatistics");
  const dispatch = useAppDispatch();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState(0);
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | "all">(
    "all"
  );

  const {
    monthlyCommission,
    commissionList,
    restaurantCommissions,
    dailyCommissions,
    paymentMethodCommissions,
    loading,
    error,
  } = useAppSelector((state) => state.commission);

  const loadAllData = useCallback(() => {
    const params = { month: selectedMonth, year: selectedYear };
    dispatch(fetchMonthlyCommission(params));
    dispatch(fetchCommissionList(params));
    dispatch(fetchRestaurantCommissions(params));
    dispatch(fetchDailyCommissions(params));
    dispatch(fetchPaymentMethodCommissions(params));
  }, [selectedMonth, selectedYear, dispatch]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  // Get restaurant name by ID
  const getRestaurantName = (restaurantId: number) => {
    const restaurant = restaurantCommissions.find(
      (r) => r.restaurantId === restaurantId
    );
    return (
      restaurant?.restaurantName ||
      t("restaurants.restaurant_id", { id: restaurantId })
    );
  };

  // Payment method name
  const getPaymentMethodName = (method: string | PaymentMethod) => {
    if (typeof method === "string") {
      return method.toLowerCase() === "vnpay"
        ? t("payment.vnpay")
        : t("payment.cash");
    }
    return method === PaymentMethod.VNPay
      ? t("payment.vnpay")
      : t("payment.cash");
  };

  // Prepare chart data for daily commissions
  const dailyChartData = dailyCommissions.map((item) => ({
    day: t("daily.day", { day: item.day }),
    commission: item.totalCommission,
  }));

  // Prepare chart data for restaurants
  const restaurantChartData = [...restaurantCommissions]
    .sort((a, b) => b.totalCommission - a.totalCommission)
    .slice(0, 10)
    .map((item) => ({
      name:
        item.restaurantName.length > 20
          ? item.restaurantName.substring(0, 20) + "..."
          : item.restaurantName,
      commission: item.totalCommission,
      orders: item.totalOrders,
      revenue: item.totalRevenue,
    }));

  // Prepare chart data for payment methods - merge duplicates
  const paymentMethodMap = new Map<
    string | PaymentMethod,
    { totalCommission: number; totalOrders: number }
  >();

  paymentMethodCommissions.forEach((item) => {
    const existing = paymentMethodMap.get(item.paymentMethod);
    if (existing) {
      existing.totalCommission += item.totalCommission;
      existing.totalOrders += item.totalOrders;
    } else {
      paymentMethodMap.set(item.paymentMethod, {
        totalCommission: item.totalCommission,
        totalOrders: item.totalOrders,
      });
    }
  });

  const mergedPaymentMethods = Array.from(paymentMethodMap.entries()).map(
    ([method, data]) => ({
      paymentMethod: method,
      totalCommission: data.totalCommission,
      totalOrders: data.totalOrders,
    })
  );

  const paymentChartData = mergedPaymentMethods.map((item) => ({
    name: getPaymentMethodName(item.paymentMethod),
    value: item.totalCommission,
    orders: item.totalOrders,
  }));

  // Filter commission list by selected restaurant
  const filteredCommissionList =
    selectedRestaurant === "all"
      ? commissionList
      : commissionList.filter(
          (commission) => commission.restaurantId === selectedRestaurant
        );

  // Calculate statistics
  const totalOrders = commissionList.length;
  const averageCommission =
    totalOrders > 0
      ? (monthlyCommission?.totalCommission || 0) / totalOrders
      : 0;
  const totalRestaurants = restaurantCommissions.length;

  if (loading && !monthlyCommission) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, pt: 0 }}>
      {/* Header with filters */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          mb: 3,
          gap: { xs: 2, sm: 0 },
        }}
      >
        <Typography
          variant="h4"
          fontWeight="bold"
          color="primary"
          sx={{ mb: { xs: 2, sm: 0 } }}
        >
          <AttachMoney sx={{ fontSize: 40, mr: 1, verticalAlign: "middle" }} />
          {t("title")}
        </Typography>

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <FormControl
            sx={{ minWidth: 120, width: { xs: "100%", sm: "auto" } }}
          >
            <InputLabel>{t("month")}</InputLabel>
            <Select
              value={selectedMonth}
              label={t("month")}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <MenuItem key={month} value={month}>
                  {t("month_label", { month })}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl
            sx={{ minWidth: 120, width: { xs: "100%", sm: "auto" } }}
          >
            <InputLabel>{t("year")}</InputLabel>
            <Select
              value={selectedYear}
              label={t("year")}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {Array.from(
                { length: 5 },
                (_, i) => new Date().getFullYear() - i
              ).map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Box
        sx={{
          display: "flex",
          gap: 3,
          mb: 4,
          flexWrap: "wrap",
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        <Card
          sx={{
            flex: { xs: "1 1 100%", sm: "1 1 calc(25% - 18px)" },
            minWidth: 250,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
          }}
        >
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <AttachMoney sx={{ fontSize: 40, mr: 1 }} />
              <Typography variant="h6">
                {t("summary.total_commission")}
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="bold">
              {formatCurrency(monthlyCommission?.totalCommission || 0)}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
              {t("summary.month_year", {
                month: selectedMonth,
                year: selectedYear,
              })}
            </Typography>
          </CardContent>
        </Card>

        <Card
          sx={{
            flex: { xs: "1 1 100%", sm: "1 1 calc(25% - 18px)" },
            minWidth: 250,
            background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            color: "white",
          }}
        >
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <CalendarToday sx={{ fontSize: 40, mr: 1 }} />
              <Typography variant="h6">{t("summary.total_orders")}</Typography>
            </Box>
            <Typography variant="h4" fontWeight="bold">
              {totalOrders.toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
              {t("summary.commission_orders")}
            </Typography>
          </CardContent>
        </Card>

        <Card
          sx={{
            flex: { xs: "1 1 100%", sm: "1 1 calc(25% - 18px)" },
            minWidth: 250,
            background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
            color: "white",
          }}
        >
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Store sx={{ fontSize: 40, mr: 1 }} />
              <Typography variant="h6">{t("summary.restaurants")}</Typography>
            </Box>
            <Typography variant="h4" fontWeight="bold">
              {totalRestaurants}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
              {t("summary.restaurants_with_orders")}
            </Typography>
          </CardContent>
        </Card>

        <Card
          sx={{
            flex: { xs: "1 1 100%", sm: "1 1 calc(25% - 18px)" },
            minWidth: 250,
            background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
            color: "white",
          }}
        >
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <TrendingUp sx={{ fontSize: 40, mr: 1 }} />
              <Typography variant="h6">
                {t("summary.average_per_order")}
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="bold">
              {formatCurrency(averageCommission)}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
              {t("summary.average_commission")}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Các tab để xem các chế độ khác nhau - Responsive */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ width: "100%", overflowX: { xs: "auto", sm: "visible" } }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            variant="scrollable"
            scrollButtons={true}
            allowScrollButtonsMobile
          >
            <Tab label={t("tabs.daily_chart")} />
            <Tab label={t("tabs.top_restaurants")} />
            <Tab label={t("tabs.payment_methods")} />
            <Tab label={t("tabs.order_details")} />
          </Tabs>
        </Box>
      </Paper>

      {/*Biểu đồ hoa hồng theo ngày */}
      {activeTab === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              {t("daily.title")}
            </Typography>
            {dailyCommissions.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="commission"
                    name={t("daily.commission")}
                    stroke="#8884d8"
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Alert severity="info">{t("daily.no_data")}</Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/*Bảng xếp hạng nhà hàng */}
      {activeTab === 1 && (
        <Box
          sx={{
            display: "flex",
            gap: 3,
            p: 1,
            flexDirection: { xs: "column", md: "row" },
            flexWrap: "wrap",
          }}
        >
          <Card sx={{ flex: "55%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                {t("restaurants.top_title")}
              </Typography>
              {restaurantChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={restaurantChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar
                      dataKey="commission"
                      name={t("restaurants.commission")}
                      fill="#8884d8"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Alert severity="info">{t("restaurants.no_data")}</Alert>
              )}
            </CardContent>
          </Card>

          <Card sx={{ flex: { xs: "1 1 100%", lg: "1 1 42%" } }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                {t("restaurants.ranking_title")}
              </Typography>
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>{t("restaurants.restaurant_name")}</TableCell>
                      <TableCell align="right">
                        {t("restaurants.commission")}
                      </TableCell>
                      <TableCell align="right">
                        {t("restaurants.orders")}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...restaurantCommissions]
                      .sort((a, b) => b.totalCommission - a.totalCommission)
                      .slice(0, 10)
                      .map((restaurant, index) => (
                        <TableRow key={restaurant.restaurantId} hover>
                          <TableCell>
                            <Chip
                              label={index + 1}
                              color={index < 3 ? "primary" : "default"}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{restaurant.restaurantName}</TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              fontWeight="bold"
                              color="primary"
                            >
                              {formatCurrency(restaurant.totalCommission)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            {restaurant.totalOrders}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {/*Phương thức thanh toán */}
      {activeTab === 2 && (
        <Box
          sx={{
            display: "flex",
            gap: 3,
            flexDirection: { xs: "column", md: "row" },
            flexWrap: "wrap",
          }}
        >
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                {t("payment.distribution_title")}
              </Typography>
              {paymentChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={paymentChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent = 0 }) =>
                        `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {paymentChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${entry.name}-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Alert severity="info">{t("payment.no_data")}</Alert>
              )}
            </CardContent>
          </Card>

          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                {t("payment.details_title")}
              </Typography>
              <Box sx={{ mt: 3 }}>
                {mergedPaymentMethods.map((payment, index) => (
                  <Box key={`payment-${payment.paymentMethod}`} sx={{ mb: 3 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <CreditCard
                          sx={{
                            mr: 1,
                            color: COLORS[index % COLORS.length],
                          }}
                        />
                        <Typography variant="body1" fontWeight="medium">
                          {getPaymentMethodName(payment.paymentMethod)}
                        </Typography>
                      </Box>
                      <Typography variant="body1" fontWeight="bold">
                        {formatCurrency(payment.totalCommission)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={
                        (payment.totalCommission /
                          (monthlyCommission?.totalCommission || 1)) *
                        100
                      }
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: COLORS[index % COLORS.length],
                        },
                      }}
                    />
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mt: 1,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {t("payment.orders_count", {
                          count: payment.totalOrders,
                        })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(
                          (payment.totalCommission /
                            (monthlyCommission?.totalCommission || 1)) *
                          100
                        ).toFixed(1)}
                        %
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/*Danh sách chi tiết đơn hàng */}
      {activeTab === 3 && (
        <Card>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "stretch", sm: "center" },
                mb: 3,
                gap: { xs: 2, sm: 0 },
              }}
            >
              <Typography variant="h6" fontWeight="bold">
                {t("orders.list_title")}
              </Typography>

              <FormControl sx={{ minWidth: 250 }}>
                <InputLabel>{t("orders.filter_by_restaurant")}</InputLabel>
                <Select
                  value={selectedRestaurant}
                  label={t("orders.filter_by_restaurant")}
                  onChange={(e) =>
                    setSelectedRestaurant(e.target.value as number | "all")
                  }
                >
                  <MenuItem value="all">{t("orders.all_restaurants")}</MenuItem>
                  {[...restaurantCommissions]
                    .sort((a, b) =>
                      a.restaurantName.localeCompare(b.restaurantName)
                    )
                    .map((restaurant) => (
                      <MenuItem
                        key={restaurant.restaurantId}
                        value={restaurant.restaurantId}
                      >
                        {restaurant.restaurantName}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Box>

            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>{t("orders.order_code")}</TableCell>
                    <TableCell>{t("orders.restaurant")}</TableCell>
                    <TableCell align="right">
                      {t("orders.order_value")}
                    </TableCell>
                    <TableCell align="right">{t("orders.rate")}</TableCell>
                    <TableCell align="right">
                      {t("orders.commission")}
                    </TableCell>
                    <TableCell>{t("orders.created_date")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCommissionList.length > 0 ? (
                    filteredCommissionList.map((commission) => (
                      <TableRow key={commission.orderId} hover>
                        <TableCell>
                          <Chip
                            label={`#${commission.orderId}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {getRestaurantName(commission.restaurantId)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(commission.finalPrice)}
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${commission.rate}%`}
                            size="small"
                            sx={{
                              backgroundColor:
                                commission.rate === 0.05
                                  ? "#0088FE"
                                  : "#00C49F",
                              color: "white",
                              fontWeight: "bold",
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            color="success.main"
                          >
                            {formatCurrency(commission.commissionAmount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {formatDate(commission.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Alert severity="info">{t("orders.no_orders")}</Alert>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default CommissionStatistics;
