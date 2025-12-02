"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Divider,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Card,
  CardContent,
  Stack,
  Alert,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EditIcon from "@mui/icons-material/Edit";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import SavingsIcon from "@mui/icons-material/Savings";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import DiscountIcon from "@mui/icons-material/Discount";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import PaymentIcon from "@mui/icons-material/Payment";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import MoneyIcon from "@mui/icons-material/Money";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import {
  createVNPayPayment,
  createCODPayment,
} from "@/redux/slices/paymentSlice";
import {
  createOrderPromotion,
  applyPromotion,
  removePromotion,
} from "@/redux/slices/orderPromotionsSlice";
import { Payment } from "@/types/payment";
import type { OrderResponse } from "@/types/order";
import { useRouter } from "next/navigation";
import { fetchPromotions } from "@/redux/slices/promotionSlice";
import axiosInstance from "@/lib/axios/axiosInstance";
import { getAccessToken } from "@/lib/utils/tokenHelper";
import type { OrderPromotion } from "@/types/orderpromotion";

/* -------------------------------------------------------------------------- */
/*                               TYPE DEFINITIONS                             */
/* -------------------------------------------------------------------------- */

type DeliveryOption = {
  id: "priority" | "fast" | "economy";
  name: string;
  description: string;
  price: number;
  estimatedTime: string;
  icon: React.ReactNode;
};

type ShippingAddress = {
  name: string;
  phone: string;
  address: string;
  addressDetail?: string;
};

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */
const PaymentPage = () => {
  const router = useRouter();
  const t = useTranslations("payment");
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "VNPAY">("COD");
  const [loading, setLoading] = useState(false);
  const [voucherCode, setVoucherCode] = useState<string>("");
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  const [finalTotal, setFinalTotal] = useState<number | null>(null);
  const [originalTotal, setOriginalTotal] = useState<number | null>(null);
  const [voucherDiscount, setVoucherDiscount] = useState<number | null>(null);
  const [orderPromotions, setOrderPromotions] = useState<OrderPromotion[]>([]);
  const dispatch = useAppDispatch();

  // Get user data from Redux store
  const currentUser = useAppSelector((state) => state.user.user);

  // New state for delivery and address
  const [selectedDelivery, setSelectedDelivery] = useState<string>("fast");
  const [openAddressDialog, setOpenAddressDialog] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: currentUser?.userName || "",
    phone: currentUser?.phone || "",
    address: currentUser?.address || "",
    addressDetail: "",
  });
  const [tempAddress, setTempAddress] =
    useState<ShippingAddress>(shippingAddress);
  const [openVoucherDialog, setOpenVoucherDialog] = useState(false);

  // Delivery options
  const deliveryOptions: DeliveryOption[] = [
    {
      id: "priority",
      name: t("delivery.priority.name"),
      description: t("delivery.priority.description"),
      price: 25000,
      estimatedTime: t("delivery.priority.estimatedTime", { min: 15, max: 25 }),
      icon: <FlashOnIcon sx={{ color: "warning.main" }} />,
    },
    {
      id: "fast",
      name: t("delivery.fast.name"),
      description: t("delivery.fast.description"),
      price: 15000,
      estimatedTime: t("delivery.fast.estimatedTime", { min: 25, max: 40 }),
      icon: <LocalShippingIcon sx={{ color: "primary.main" }} />,
    },
    {
      id: "economy",
      name: t("delivery.economy.name"),
      description: t("delivery.economy.description"),
      price: 10000,
      estimatedTime: t("delivery.economy.estimatedTime", { min: 40, max: 60 }),
      icon: <SavingsIcon sx={{ color: "success.main" }} />,
    },
  ];

  /* --------------------------- LOAD ORDER FROM LS -------------------------- */
  useEffect(() => {
    const stored = localStorage.getItem("checkoutOrder");
    if (stored) {
      try {
        const parsed: OrderResponse = JSON.parse(stored);
        setOrder(parsed);
      } catch {
        // invalid checkoutOrder format -> redirect to cart
        router.push("/cart");
      }
    } else {
      router.push("/cart");
    }
  }, [router]);

  // Update shipping address when user data is available
  useEffect(() => {
    if (currentUser) {
      const updatedAddress: ShippingAddress = {
        name: currentUser.userName || "",
        phone: currentUser.phone || "",
        address: currentUser.address || "",
        addressDetail: "",
      };
      setShippingAddress(updatedAddress);
      setTempAddress(updatedAddress);
    }
  }, [currentUser]);

  // Ensure axios has current access token set so interceptor/requests send it.
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      try {
        axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
      } catch {
        // ignore
      }
    }
  }, [currentUser]);

  // fetch promotions for this restaurant (when order is loaded)
  const promotions = useAppSelector((s) => s.promotion?.promotions ?? []);
  useEffect(() => {
    if (order?.restaurantId) {
      dispatch(fetchPromotions(order.restaurantId));
    }
  }, [order?.restaurantId, dispatch]);

  // Fetch order promotions with minValue from API
  useEffect(() => {
    const fetchOrderPromotions = async () => {
      if (!order?.restaurantId) return;

      try {
        const response = await axiosInstance.get<{
          errCode: string | number;
          errMessage: string;
          data: OrderPromotion[];
        }>(`/api/OrderPromotions/user?restaurantId=${order.restaurantId}`);

        // API response received

        // Backend returns errCode as 'success' string, not number 0
        if (
          (response.data.errCode === 0 ||
            response.data.errCode === "success") &&
          response.data.data
        ) {
          // Normalize backend PascalCase to camelCase
          const normalized = response.data.data.map(
            (item: Record<string, unknown>) => ({
              id: (item.id || item.Id) as number,
              promotionId: (item.promotionId || item.PromotionId) as number,
              minOrderValue: (item.minOrderValue ||
                item.MinOrderValue) as number,
              promotionTitle: (item.promotionTitle || item.PromotionTitle) as
                | string
                | undefined,
              discountType: (item.discountType || item.DiscountType) as
                | string
                | undefined,
              discountValue: (item.discountValue || item.DiscountValue) as
                | number
                | undefined,
              restaurantId: (item.restaurantId || item.RestaurantId) as
                | number
                | undefined,
              restaurantName: (item.restaurantName || item.RestaurantName) as
                | string
                | undefined,
              targetUserId: (item.targetUserId || item.TargetUserId) as
                | number
                | undefined,
              isGlobal: (item.isGlobal || item.IsGlobal) as boolean | undefined,
            })
          );

          // Order promotions normalized
          setOrderPromotions(normalized);
        } else {
          // No order promotions or non-success errCode
        }
      } catch {
        // Failed to fetch order promotions (silently ignore or handle elsewhere)
      }
    };

    fetchOrderPromotions();
  }, [order?.restaurantId]);

  /* ------------------------------ TOTAL PRICE ------------------------------ */
  const total = order?.items?.reduce(
    (sum, item) => sum + (item.totalPrice || 0),
    0
  );

  // collect vouchers from promotions that target order
  // Use useMemo to rebuild orderOptions when orderPromotions or promotions change
  const orderOptions = useMemo(() => {
    const now = new Date();
    // Build a combined list of selectable order promotions:
    // - vouchers (code present)
    // - promotion-only entries (no voucher) so user can choose to apply order-level promotions
    return promotions
      .filter((p) => p.targetType === "order")
      .filter((p) => {
        try {
          const start = p.startDate ? new Date(p.startDate) : null;
          const end = p.endDate ? new Date(p.endDate) : null;
          if (start && now < start) return false;
          if (end && now > end) return false;
        } catch {
          // if parse fails, include by default
        }
        return true;
      })
      .flatMap((p) => {
        const list: Array<{
          kind: "voucher" | "promotion";
          value: string; // voucher code or promotion id string
          label: string;
          discountType?: string;
          discountValue?: number;
          minOrderValue?: number;
          promotionId?: number;
        }> = [];

        // Find matching orderPromotion with minValue
        const matchingOrderPromotion = orderPromotions.find(
          (op) => op.promotionId === p.id
        );
        const minOrderValue = matchingOrderPromotion?.minOrderValue;

        // Promotion debug info (removed)

        // Backend may expose a single voucher code on the promotion as `voucherCode`
        // or a `vouchers` array. Support both shapes.
        const voucherCode = (p as { voucherCode?: string }).voucherCode;
        if (voucherCode && String(voucherCode).trim() !== "") {
          list.push({
            kind: "voucher",
            value: String(voucherCode),
            label: `${voucherCode} — ${p.title}`,
            discountType: p.discountType,
            discountValue: p.discountValue,
            minOrderValue: minOrderValue,
            promotionId: p.id,
          });
        } else if (p.vouchers && p.vouchers.length > 0) {
          for (const v of p.vouchers) {
            // vouchers may have `code` or `voucherCode` depending on backend mapping
            const code = String(
              (v as unknown as { code?: string; voucherCode?: string }).code ??
                (v as unknown as { code?: string; voucherCode?: string })
                  .voucherCode ??
                ""
            );
            list.push({
              kind: "voucher",
              value: code,
              label: `${code} — ${p.title}`,
              discountType: p.discountType,
              discountValue: p.discountValue,
              minOrderValue: minOrderValue,
              promotionId: p.id,
            });
          }
        } else {
          // promotion without voucher: allow user to select it (server will apply order promotions when called without voucherCode)
          list.push({
            kind: "promotion",
            value: String(p.id),
            label: `${p.title}`,
            discountType: p.discountType,
            discountValue: p.discountValue,
            minOrderValue: minOrderValue,
            promotionId: p.id,
          });
        }

        return list;
      });
    // Don't filter out ineligible vouchers - just disable them in UI
  }, [promotions, orderPromotions]); // Rebuild when these dependencies change

  // finalTotal and originalTotal are updated from server when applyPromotion is called

  /* ---------------------------- HANDLE PAYMENT ----------------------------- */
  const handleConfirmPayment = async () => {
    if (!order) return;

    // Validate shipping address
    if (
      !shippingAddress.name ||
      !shippingAddress.phone ||
      !shippingAddress.address
    ) {
      toast.warning(t("errors.address_missing"));
      setOpenAddressDialog(true);
      return;
    }

    setLoading(true);
    try {
      // Calculate delivery fee based on selected option
      const selectedDeliveryOption = deliveryOptions.find(
        (opt) => opt.id === selectedDelivery
      );
      const deliveryFee = selectedDeliveryOption?.price || 0;

      // Calculate final amount including delivery fee
      const orderAmount =
        typeof finalTotal === "number"
          ? finalTotal
          : order.items?.reduce(
              (sum, item) => sum + (item.totalPrice || 0),
              0
            ) || 0;

      const amount = orderAmount + deliveryFee;

      if (paymentMethod === "VNPAY") {
        // create VNPay payment and redirect user to the returned paymentUrl
        const action = await dispatch(
          createVNPayPayment({ orderId: order.id, amount })
        ).unwrap();

        // backend PaymentDto contains paymentUrl
        const paymentAction = action as unknown as Payment;
        const paymentUrl = paymentAction?.paymentUrl;
        if (paymentUrl) {
          // redirect browser to VNPay gateway
          window.location.href = paymentUrl;
          return;
        }

        // fallback: if no URL, treat as success and navigate to orders
        localStorage.removeItem("checkoutOrder");
        router.push("/purchase");
        return;
      }

      if (paymentMethod === "COD") {
        // create COD payment (server will set method/status)
        await dispatch(
          createCODPayment({ orderId: order.id, amount })
        ).unwrap();

        toast.success(
          "Đặt hàng thành công! Vui lòng chuẩn bị tiền khi nhận hàng."
        );
        localStorage.removeItem("checkoutOrder");
        router.push("/purchase");
        return;
      }
    } catch (error: unknown) {
      // payment error (logged silently)
      const msg =
        typeof error === "string"
          ? error
          : error instanceof Error
          ? error.message
          : "Thanh toán thất bại";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

  // (login check removed) rely on refresh-token / interceptor to handle unauthenticated flows

  const selectedDeliveryOption = deliveryOptions.find(
    (opt) => opt.id === selectedDelivery
  );
  const deliveryFee = selectedDeliveryOption?.price || 0;
  const grandTotal = (finalTotal ?? total ?? 0) + deliveryFee;

  /* ------------------------------- RENDER UI ------------------------------- */
  return (
    <Box
      sx={(theme) => ({
        minHeight: "100vh",
        bgcolor: theme.palette.background.default,
        pb: 4,
      })}
    >
      {/* Header */}
      <Box
        sx={(theme) => ({
          bgcolor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
          position: "sticky",
          top: 0,
          zIndex: 10,
          boxShadow: theme.shadows[1],
        })}
      >
        <Box
          sx={{
            maxWidth: "1200px",
            margin: "0 auto",
            p: 2,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <PaymentIcon sx={{ fontSize: 32, color: "primary.main" }} />
          <Box>
            <Typography variant="h5" fontWeight="700">
              {t("header.title")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("header.subtitle")}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          maxWidth: "1200px",
          margin: "0 auto",
          p: { xs: 2, md: 3 },
        }}
      >
        {/* Delivery Address Section */}
        <Card
          sx={(theme) => ({
            mb: 2,
            boxShadow: theme.shadows[1],
            "&:hover": {
              boxShadow: theme.shadows[3],
            },
            transition: "all 0.3s ease",
          })}
        >
          <CardContent>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="flex-start"
              mb={2}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <LocationOnIcon sx={{ color: "error.main", fontSize: 28 }} />
                <Typography variant="h6" fontWeight="600">
                  {t("address.title")}
                </Typography>
              </Box>
              <Button
                size="small"
                startIcon={<EditIcon />}
                onClick={() => {
                  setTempAddress(shippingAddress);
                  setOpenAddressDialog(true);
                }}
                sx={{ textTransform: "none" }}
              >
                {t("btn.change")}
              </Button>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {!shippingAddress.name ||
            !shippingAddress.phone ||
            !shippingAddress.address ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="600" mb={0.5}>
                  {t("address.no_info.title")}
                </Typography>
                <Typography variant="body2">
                  {t("address.no_info.content")}
                </Typography>
              </Alert>
            ) : null}

            <Stack spacing={1.5}>
              <Box display="flex" alignItems="center" gap={1}>
                <PersonIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                <Typography fontWeight="600">
                  {shippingAddress.name || t("address.no_name")}
                </Typography>
                <Divider orientation="vertical" flexItem />
                <PhoneIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                <Typography>
                  {shippingAddress.phone || t("address.no_phone")}
                </Typography>
              </Box>

              <Box display="flex" gap={1}>
                <LocationOnIcon
                  sx={{ color: "text.secondary", fontSize: 20, mt: 0.3 }}
                />
                <Box>
                  <Typography color="text.primary">
                    {shippingAddress.address || t("address.no_address")}
                  </Typography>
                  {shippingAddress.addressDetail && (
                    <Typography variant="body2" color="text.secondary">
                      {shippingAddress.addressDetail}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Restaurant & Order Items Section */}
        <Card
          sx={(theme) => ({
            mb: 2,
            boxShadow: theme.shadows[1],
          })}
        >
          <CardContent>
            <Box display="flex" alignItems="center" gap={1.5} mb={2}>
              <RestaurantIcon sx={{ color: "primary.main", fontSize: 28 }} />
              <Box>
                <Typography variant="h6" fontWeight="600">
                  {order.restaurant?.name || `Nhà hàng #${order.restaurantId}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {order.restaurant?.address || "Chưa có địa chỉ"}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Order Items */}
            <Stack spacing={1.5}>
              {order.items?.map((item) => (
                <Box
                  key={item.id}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={(theme) => ({
                    p: 1.5,
                    bgcolor: theme.palette.action.hover,
                    borderRadius: 1,
                  })}
                >
                  <Box display="flex" alignItems="center" gap={1.5} flex={1}>
                    <Box
                      sx={(theme) => ({
                        width: 48,
                        height: 48,
                        bgcolor: theme.palette.action.selected,
                        borderRadius: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      })}
                    >
                      {item.image ? (
                        <Box
                          component="img"
                          src={item.image}
                          alt={item.dishName || t("item.no_image_alt")}
                          sx={{ width: 48, height: 48, objectFit: "cover" }}
                          onError={(e) => {
                            // hide broken image so fallback icon shows
                            (
                              e.currentTarget as HTMLImageElement
                            ).style.display = "none";
                          }}
                        />
                      ) : (
                        <RestaurantIcon sx={{ color: "primary.main" }} />
                      )}
                    </Box>
                    <Box flex={1}>
                      <Typography fontWeight="500">{item.dishName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Số lượng: {item.quantity}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography fontWeight="600" color="primary.main">
                    {item.totalPrice.toLocaleString()}₫
                  </Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>

        {/* Delivery Options Section */}
        <Card
          sx={(theme) => ({
            mb: 2,
            boxShadow: theme.shadows[1],
          })}
        >
          <CardContent>
            <Box display="flex" alignItems="center" gap={1.5} mb={2}>
              <LocalShippingIcon sx={{ color: "success.main", fontSize: 28 }} />
              <Typography variant="h6" fontWeight="600">
                Phương thức giao hàng
              </Typography>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <RadioGroup
              value={selectedDelivery}
              onChange={(e) => setSelectedDelivery(e.target.value)}
            >
              <Stack spacing={1.5}>
                {deliveryOptions.map((option) => (
                  <Box
                    key={option.id}
                    sx={(theme) => ({
                      border: "2px solid",
                      borderColor:
                        selectedDelivery === option.id
                          ? "primary.main"
                          : theme.palette.divider,
                      borderRadius: 2,
                      p: 2,
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      bgcolor:
                        selectedDelivery === option.id
                          ? theme.palette.action.selected
                          : theme.palette.background.paper,
                      "&:hover": {
                        borderColor: "primary.main",
                        bgcolor: theme.palette.action.hover,
                      },
                    })}
                    onClick={() => setSelectedDelivery(option.id)}
                  >
                    <FormControlLabel
                      value={option.id}
                      control={<Radio />}
                      sx={{ width: "100%", margin: 0 }}
                      label={
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                          width="100%"
                          ml={1}
                        >
                          <Box display="flex" alignItems="center" gap={1.5}>
                            {option.icon}
                            <Box>
                              <Typography fontWeight="600">
                                {option.name}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {option.description}
                              </Typography>
                              <Box
                                display="flex"
                                alignItems="center"
                                gap={0.5}
                                mt={0.5}
                              >
                                <AccessTimeIcon
                                  sx={{ fontSize: 16, color: "text.secondary" }}
                                />
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {option.estimatedTime}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                          <Typography fontWeight="600" color="primary.main">
                            +{option.price.toLocaleString()}₫
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                ))}
              </Stack>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Voucher Section */}
        <Card
          sx={(theme) => ({
            mb: 2,
            boxShadow: theme.shadows[1],
          })}
        >
          <CardContent>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Box display="flex" alignItems="center" gap={1.5}>
                <DiscountIcon sx={{ color: "warning.main", fontSize: 28 }} />
                <Typography variant="h6" fontWeight="600">
                  {t("voucher.title")}
                </Typography>
              </Box>
              {typeof finalTotal === "number" && (
                <Chip
                  icon={<CheckCircleIcon />}
                  label={t("voucher.applied")}
                  color="success"
                  size="small"
                />
              )}
            </Box>

            <Divider sx={{ mb: 2 }} />

            {orderOptions && orderOptions.length > 0 ? (
              <Box>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={
                    applyingVoucher ? (
                      <CircularProgress size={16} />
                    ) : (
                      <DiscountIcon />
                    )
                  }
                  onClick={() => setOpenVoucherDialog(true)}
                  disabled={applyingVoucher}
                  sx={(theme) => ({
                    textTransform: "none",
                    justifyContent: "space-between",
                    p: 1.5,
                    borderColor: voucherCode
                      ? "success.main"
                      : theme.palette.divider,
                    color: voucherCode ? "success.main" : "text.primary",
                    "&:hover": {
                      borderColor: "primary.main",
                      bgcolor: theme.palette.action.hover,
                    },
                  })}
                >
                  <Typography>
                    {voucherCode
                      ? `${t("voucher.code_prefix")} ${voucherCode}`
                      : t("voucher.placeholder")}
                  </Typography>
                  <Typography variant="body2" color="primary.main">
                    {orderOptions.length} {t("voucher.available_count")}
                  </Typography>
                </Button>
              </Box>
            ) : (
              <Alert severity="info" icon={<DiscountIcon />}>
                {t("voucher.no_vouchers")}
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Payment Method Section */}
        <Card
          sx={(theme) => ({
            mb: 2,
            boxShadow: theme.shadows[1],
          })}
        >
          <CardContent>
            <Box display="flex" alignItems="center" gap={1.5} mb={2}>
              <AccountBalanceWalletIcon
                sx={{ color: "info.main", fontSize: 28 }}
              />
              <Typography variant="h6" fontWeight="600">
                {t("paymentMethod.title")}
              </Typography>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <RadioGroup
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value as "COD" | "VNPAY")
              }
            >
              <Stack spacing={1.5}>
                <Box
                  sx={(theme) => ({
                    border: "2px solid",
                    borderColor:
                      paymentMethod === "COD"
                        ? "primary.main"
                        : theme.palette.divider,
                    borderRadius: 2,
                    p: 2,
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    bgcolor:
                      paymentMethod === "COD"
                        ? theme.palette.action.selected
                        : theme.palette.background.paper,
                    "&:hover": {
                      borderColor: "primary.main",
                      bgcolor: theme.palette.action.hover,
                    },
                  })}
                  onClick={() => setPaymentMethod("COD")}
                >
                  <FormControlLabel
                    value="COD"
                    control={<Radio />}
                    sx={{ width: "100%", margin: 0 }}
                    label={
                      <Box display="flex" alignItems="center" gap={1.5} ml={1}>
                        <MoneyIcon sx={{ color: "success.main" }} />
                        <Box>
                          <Typography fontWeight="600">
                            {t("paymentMethod.cod.title")}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {t("paymentMethod.cod.description")}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </Box>

                <Box
                  sx={(theme) => ({
                    border: "2px solid",
                    borderColor:
                      paymentMethod === "VNPAY"
                        ? "primary.main"
                        : theme.palette.divider,
                    borderRadius: 2,
                    p: 2,
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    bgcolor:
                      paymentMethod === "VNPAY"
                        ? theme.palette.action.selected
                        : theme.palette.background.paper,
                    "&:hover": {
                      borderColor: "primary.main",
                      bgcolor: theme.palette.action.hover,
                    },
                  })}
                  onClick={() => setPaymentMethod("VNPAY")}
                >
                  <FormControlLabel
                    value="VNPAY"
                    control={<Radio />}
                    sx={{ width: "100%", margin: 0 }}
                    label={
                      <Box display="flex" alignItems="center" gap={1.5} ml={1}>
                        <PaymentIcon sx={{ color: "primary.main" }} />
                        <Box>
                          <Typography fontWeight="600">
                            {t("paymentMethod.vnpay.title")}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {t("paymentMethod.vnpay.description")}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </Box>
              </Stack>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Payment Summary Section */}
        <Card
          sx={(theme) => ({
            mb: 2,
            boxShadow: theme.shadows[1],
          })}
        >
          <CardContent>
            <Typography variant="h6" fontWeight="600" mb={2}>
              {t("summary.title")}
            </Typography>

            <Divider sx={{ mb: 2 }} />

            <Stack spacing={1.5}>
              <Box display="flex" justifyContent="space-between">
                <Typography color="text.secondary">
                  {t("summary.subtotal")}
                </Typography>
                <Typography>
                  {Number(originalTotal ?? total ?? 0).toLocaleString()}₫
                </Typography>
              </Box>

              {(originalTotal ?? total ?? 0) - (finalTotal ?? total ?? 0) >
                0 && (
                <Box display="flex" justifyContent="space-between">
                  <Typography color="text.secondary">
                    {t("summary.discount")}
                  </Typography>
                  <Typography color="success.main" fontWeight="600">
                    -
                    {Number(
                      (originalTotal ?? total ?? 0) - (finalTotal ?? total ?? 0)
                    ).toLocaleString()}
                    ₫
                  </Typography>
                </Box>
              )}

              {voucherDiscount && voucherDiscount > 0 && (
                <Box display="flex" justifyContent="space-between">
                  <Typography color="text.secondary">
                    {t("summary.discount_by_code")}
                  </Typography>
                  <Typography color="success.main" fontWeight="600">
                    -{Number(voucherDiscount).toLocaleString()}₫
                  </Typography>
                </Box>
              )}

              <Box display="flex" justifyContent="space-between">
                <Typography color="text.secondary">
                  {t("summary.shipping_fee")}
                </Typography>
                <Typography>+{deliveryFee.toLocaleString()}₫</Typography>
              </Box>

              <Divider />

              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="h6" fontWeight="700">
                  {t("summary.total")}
                </Typography>
                <Typography variant="h5" fontWeight="700" color="primary.main">
                  {grandTotal.toLocaleString()}₫
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Confirm Button */}
        <Button
          fullWidth
          variant="contained"
          size="large"
          disabled={loading}
          onClick={handleConfirmPayment}
          sx={(theme) => ({
            py: 2,
            fontSize: "1.1rem",
            fontWeight: "700",
            textTransform: "none",
            boxShadow: theme.shadows[4],
            "&:hover": {
              boxShadow: theme.shadows[6],
            },
          })}
        >
          {loading ? (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={24} color="inherit" />
              <Typography component="span">{t("btn.processing")}</Typography>
            </Box>
          ) : (
            `${t("btn.place_order")} • ${grandTotal.toLocaleString()}₫`
          )}
        </Button>
      </Box>

      {/* Address Edit Dialog */}
      <Dialog
        open={openAddressDialog}
        onClose={() => setOpenAddressDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6" fontWeight="600">
              {t("address.edit_title")}
            </Typography>
            <IconButton
              size="small"
              onClick={() => setOpenAddressDialog(false)}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              required
              label={t("address.form.name")}
              value={tempAddress.name}
              onChange={(e) =>
                setTempAddress({ ...tempAddress, name: e.target.value })
              }
              variant="outlined"
              helperText={t("address.form.name_helper")}
            />
            <TextField
              fullWidth
              required
              label={t("address.form.phone")}
              value={tempAddress.phone}
              onChange={(e) =>
                setTempAddress({ ...tempAddress, phone: e.target.value })
              }
              variant="outlined"
              helperText={t("address.form.phone_helper")}
            />
            <TextField
              fullWidth
              required
              label={t("address.form.address")}
              value={tempAddress.address}
              onChange={(e) =>
                setTempAddress({ ...tempAddress, address: e.target.value })
              }
              variant="outlined"
              multiline
              rows={2}
              helperText={t("address.form.address_helper")}
            />
            <TextField
              fullWidth
              label={t("address.form.address_detail_label")}
              value={tempAddress.addressDetail || ""}
              onChange={(e) =>
                setTempAddress({
                  ...tempAddress,
                  addressDetail: e.target.value,
                })
              }
              variant="outlined"
              placeholder={t("address.form.address_detail_placeholder")}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setTempAddress(shippingAddress);
              setOpenAddressDialog(false);
            }}
            sx={{ textTransform: "none" }}
          >
            {t("btn.cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              // Validate before saving
              if (!tempAddress.name.trim()) {
                toast.warning(t("errors.enter_name"));
                return;
              }
              if (!tempAddress.phone.trim()) {
                toast.warning(t("errors.enter_phone"));
                return;
              }
              if (!tempAddress.address.trim()) {
                toast.warning(t("errors.enter_address"));
                return;
              }

              // Validate phone number format (basic)
              const phoneRegex = /^[0-9]{10,11}$/;
              if (!phoneRegex.test(tempAddress.phone.replace(/\s/g, ""))) {
                toast.warning(t("errors.invalid_phone"));
                return;
              }

              setShippingAddress(tempAddress);
              setOpenAddressDialog(false);
            }}
            sx={{ textTransform: "none" }}
          >
            Lưu địa chỉ
          </Button>
        </DialogActions>
      </Dialog>

      {/* Voucher Selection Dialog */}
      <Dialog
        open={openVoucherDialog}
        onClose={() => setOpenVoucherDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6" fontWeight="600">
              {t("voucher.select_title")}
            </Typography>
            <IconButton
              size="small"
              onClick={() => setOpenVoucherDialog(false)}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* No voucher option */}
            <Box
              sx={(theme) => ({
                border: "2px solid",
                borderColor: !voucherCode
                  ? "primary.main"
                  : theme.palette.divider,
                borderRadius: 2,
                p: 2,
                cursor: "pointer",
                bgcolor: !voucherCode
                  ? theme.palette.action.selected
                  : theme.palette.background.paper,
                "&:hover": {
                  borderColor: "primary.main",
                  bgcolor: theme.palette.action.hover,
                },
              })}
              onClick={async () => {
                if (!order) return;
                setApplyingVoucher(true);
                try {
                  // Call backend to remove any applied promotion on this order
                  const res = await dispatch(
                    removePromotion(order.id)
                  ).unwrap();

                  const orig = total ?? 0;
                  const final =
                    (res && (res.finalTotal ?? res.originalTotal)) ?? orig;

                  setOriginalTotal(orig);
                  setFinalTotal(final);
                  setVoucherCode("");
                  setVoucherDiscount(Math.max(0, Number(orig) - Number(final)));
                  setOpenVoucherDialog(false);
                } catch (err: unknown) {
                  // remove promotion error (handled below)
                  let msg = t("errors.remove_voucher_failed_default");
                  try {
                    const e = err as Record<string, unknown> | string;
                    if (typeof e === "string") msg = e;
                    else if (e && typeof e === "object") {
                      const errObj = e as {
                        message?: unknown;
                        response?: unknown;
                      };
                      if (typeof errObj.message === "string")
                        msg = errObj.message;
                      else if (
                        errObj.response &&
                        typeof errObj.response === "object"
                      ) {
                        const resp = errObj.response as Record<string, unknown>;
                        const d = resp.data as
                          | Record<string, unknown>
                          | undefined;
                        if (d) {
                          if (typeof d.errMessage === "string")
                            msg = d.errMessage;
                          else if (typeof d.message === "string")
                            msg = d.message;
                        }
                      }
                    }
                  } catch {}

                  toast.error(msg);
                } finally {
                  setApplyingVoucher(false);
                }
              }}
            >
              <Typography fontWeight="600">{t("voucher.no_use")}</Typography>
            </Box>

            {/* Voucher options */}
            {orderOptions.map((opt, i) => {
              const currentTotal = total ?? 0;
              const isEligible =
                !opt.minOrderValue || currentTotal >= opt.minOrderValue;
              const missingAmount = opt.minOrderValue
                ? Math.max(0, opt.minOrderValue - currentTotal)
                : 0;

              // Voucher debug info (removed)

              return (
                <Box
                  key={i}
                  sx={(theme) => ({
                    border: "2px solid",
                    borderColor:
                      voucherCode === opt.value
                        ? "primary.main"
                        : !isEligible
                        ? theme.palette.error.main
                        : theme.palette.divider,
                    borderRadius: 2,
                    p: 2,
                    cursor: isEligible ? "pointer" : "not-allowed",
                    bgcolor:
                      voucherCode === opt.value
                        ? theme.palette.action.selected
                        : !isEligible
                        ? theme.palette.action.disabledBackground
                        : theme.palette.background.paper,
                    opacity: isEligible ? 1 : 0.6,
                    position: "relative",
                    "&:hover": isEligible
                      ? {
                          borderColor: "primary.main",
                          bgcolor: theme.palette.action.hover,
                        }
                      : {},
                  })}
                  onClick={async (e) => {
                    // Block action if not eligible
                    if (!isEligible) {
                      e.preventDefault();
                      e.stopPropagation();
                      toast.warning(
                        `⚠️ Đơn hàng cần thêm ${missingAmount.toLocaleString()}₫ để sử dụng voucher này!`
                      );
                      return;
                    }

                    const val = `${opt.kind}:${opt.value}`;
                    const [kind, payload] = val.split(":");
                    if (!order) return;

                    setApplyingVoucher(true);
                    try {
                      if (kind === "voucher") {
                        // Backend requires voucherCode in query; it returns the final total.
                        // Don't call applyPromotion without voucher (server throws 400).
                        // Use local order total as baseline and call server only with voucherCode.
                        const orig = total ?? 0;

                        const resWith = await dispatch(
                          applyPromotion({
                            orderId: order.id,
                            voucherCode: payload,
                          })
                        ).unwrap();

                        const finalW =
                          (resWith &&
                            (resWith.finalTotal ?? resWith.originalTotal)) ??
                          orig;

                        setOriginalTotal(orig);
                        setFinalTotal(finalW);
                        setVoucherCode(resWith?.voucherCode ?? payload);
                        setVoucherDiscount(
                          Math.max(0, Number(orig) - Number(finalW))
                        );
                      } else {
                        // For promotion (no voucher code) - create an OrderPromotion entry tied to this user & restaurant
                        const promotionId = parseInt(payload, 10);
                        await dispatch(
                          createOrderPromotion({
                            promotionId: promotionId,
                            minOrderValue: total ?? 0,
                            restaurantId: order.restaurantId,
                            targetUserId: order.userId,
                          })
                        ).unwrap();

                        const orig = total ?? 0;
                        let final = orig;
                        if (opt.discountType === "percent") {
                          final =
                            orig - (orig * (opt.discountValue ?? 0)) / 100;
                        } else {
                          final = orig - (opt.discountValue ?? 0);
                        }
                        final = Math.max(0, final);

                        setOriginalTotal(orig);
                        setFinalTotal(final);
                        setVoucherCode("");
                        setVoucherDiscount(
                          Math.max(0, Number(orig) - Number(final))
                        );
                      }

                      setOpenVoucherDialog(false);
                    } catch (err: unknown) {
                      // apply promotion error (handled below)
                      let msg = t("errors.apply_voucher_failed_default");
                      try {
                        const e = err as unknown as
                          | Record<string, unknown>
                          | string;
                        if (typeof e === "string") msg = e;
                        else if (e && typeof e === "object") {
                          const obj = e as Record<string, unknown>;
                          if (typeof obj.message === "string")
                            msg = obj.message as string;
                          else if (
                            obj.response &&
                            typeof obj.response === "object"
                          ) {
                            const resp = obj.response as Record<
                              string,
                              unknown
                            >;
                            const d = resp.data as
                              | Record<string, unknown>
                              | undefined;
                            if (d) {
                              if (typeof d.errMessage === "string")
                                msg = d.errMessage as string;
                              else if (typeof d.message === "string")
                                msg = d.message as string;
                            }
                          } else if (typeof obj.payload === "string")
                            msg = obj.payload as string;
                        }
                      } catch {}

                      toast.error(msg);
                    } finally {
                      setApplyingVoucher(false);
                    }
                  }}
                >
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <DiscountIcon sx={{ color: "warning.main" }} />
                      <Typography fontWeight="600">{opt.label}</Typography>
                    </Box>
                    {opt.discountType && (
                      <Chip
                        label={
                          opt.discountType === "percent"
                            ? `${opt.discountValue}%`
                            : `${Number(opt.discountValue).toLocaleString()}₫`
                        }
                        color="primary"
                        size="small"
                      />
                    )}
                  </Box>

                  {/* Show minimum order requirement */}
                  {opt.minOrderValue && (
                    <Box mt={1}>
                      <Typography variant="body2" color="text.secondary">
                        {t("voucher.min_order_label", {
                          amount: opt.minOrderValue.toLocaleString(),
                        })}
                      </Typography>
                      {!isEligible && (
                        <Alert severity="warning" sx={{ mt: 1, py: 0.5 }}>
                          <Typography variant="caption">
                            {t("errors.voucher_still_missing", {
                              amount: missingAmount.toLocaleString(),
                            })}
                          </Typography>
                        </Alert>
                      )}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default PaymentPage;
