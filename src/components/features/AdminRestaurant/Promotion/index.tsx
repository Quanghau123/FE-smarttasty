"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Typography,
  DialogContentText,
  Chip,
  Stack,
  Divider,
  alpha,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalOffer as OfferIcon,
  EventAvailable as EventIcon,
  Percent as PercentIcon,
  AttachMoney as MoneyIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import {
  fetchPromotions,
  addPromotion,
  updatePromotion,
  deletePromotion,
} from "@/redux/slices/promotionSlice";
import {
  createOrderPromotion,
  getOrderPromotionsForUser,
  deleteOrderPromotion,
} from "@/redux/slices/orderPromotionsSlice";
import { fetchRestaurantByOwner } from "@/redux/slices/restaurantSlice";
import { Promotion, DiscountType, TargetType } from "@/types/promotion";
import { OrderPromotion } from "@/types/orderpromotion";
import axiosInstance from "@/lib/axios/axiosInstance";
import { getAccessToken } from "@/lib/utils/tokenHelper";

const getUserFromLocalStorage = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = getAccessToken();
    return { user, token };
  } catch {
    return { user: {}, token: null };
  }
};

const toISO = (date: string) =>
  date ? new Date(date + "T00:00:00").toISOString() : "";
const fromISO = (iso?: string) =>
  iso ? new Date(iso).toISOString().split("T")[0] : "";

const PromotionPage = () => {
  const dispatch = useAppDispatch();
  const t = useTranslations("adminRestaurant.promotion");
  const {
    promotions,
    loading,
    error: promotionError,
  } = useAppSelector((state) => state.promotion);
  const { current: restaurant } = useAppSelector((state) => state.restaurant);
  const { items: orderPromotions = [] } = useAppSelector(
    (state) => state.orderPromotion
  );

  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedPromoId, setSelectedPromoId] = useState<number | null>(null);

  // State cho dialog gán số tiền tối thiểu
  const [openMinOrderDialog, setOpenMinOrderDialog] = useState(false);
  const [selectedPromoForMinOrder, setSelectedPromoForMinOrder] =
    useState<Promotion | null>(null);
  const [minOrderValue, setMinOrderValue] = useState("");

  // filter: all | dish | order
  const [filterTarget, setFilterTarget] = useState<"all" | TargetType>("all");
  const filteredPromotions = React.useMemo(() => {
    if (!promotions) return [] as Promotion[];
    if (filterTarget === "all") return promotions;
    return promotions.filter((p) => p.targetType === filterTarget);
  }, [promotions, filterTarget]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    discountType: "percent" as DiscountType,
    // keep as string to control formatting (leading zeros) in the input
    discountValue: "0",
    targetType: "dish" as TargetType,
    voucherCode: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // ===== INIT =====
  useEffect(() => {
    const { token } = getUserFromLocalStorage();
    if (token) {
      axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
      dispatch(fetchRestaurantByOwner({ token }));
    }
  }, [dispatch]);

  useEffect(() => {
    // show errors from promotion slice
    if (promotionError) {
      toast.error(promotionError);
    }
    if (restaurant?.id) {
      setRestaurantId(restaurant.id);
      dispatch(fetchPromotions(restaurant.id));
      // Load order-promotions for this restaurant so we can show minOrderValue and allow cancel
      dispatch(getOrderPromotionsForUser({ restaurantId: restaurant.id }));
    } else if (restaurant) {
      toast.warning(t("errors.no_restaurant_account"));
    }
  }, [restaurant, dispatch, promotionError, t]);

  // ===== HANDLERS =====
  const handleOpenModal = (promo: Promotion | null = null) => {
    if (promo) {
      // Nếu đang chỉnh sửa cùng 1 khuyến mãi, không cần reset lại form
      if (!editingPromo || editingPromo.id !== promo.id) {
        setEditingPromo(promo);
        setFormData({
          title: promo.title,
          description: promo.description || "",
          startDate: fromISO(promo.startDate),
          endDate: fromISO(promo.endDate),
          discountType: promo.discountType as DiscountType,
          // store as string so input preserves user formatting until submit
          discountValue: String(promo.discountValue ?? 0),
          targetType: promo.targetType as TargetType,
          // promotion may expose a top-level voucherCode or a vouchers array
          voucherCode: (() => {
            const p = promo as unknown as Record<string, unknown>;
            if (
              typeof p.voucherCode === "string" &&
              p.voucherCode.trim() !== ""
            ) {
              return p.voucherCode as string;
            }
            if (promo.vouchers && promo.vouchers.length > 0) {
              return String(promo.vouchers[0].code ?? "");
            }
            return "";
          })(),
        });
        setPreviewUrl(promo.imageUrl ?? null);
        setFile(null);
      }
    } else {
      setEditingPromo(null);
      setFormData({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        discountType: "percent",
        discountValue: "0",
        targetType: "dish",
        voucherCode: "",
      });
      setFile(null);
      setPreviewUrl(null);
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);

    // Nếu đang tạo mới thì reset form
    if (!editingPromo) {
      setFormData({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        discountType: "percent",
        discountValue: "0",
        targetType: "dish",
        voucherCode: "",
      });
      setFile(null);
      setPreviewUrl(null);
    }

    // Giữ editingPromo để modal mở lại vẫn giữ data
  };

  const handleSubmit = async () => {
    if (!restaurantId) return toast.error(t("errors.missing_restaurant"));
    if (!formData.title.trim()) return toast.warning(t("errors.missing_title"));
    if (!formData.startDate || !formData.endDate)
      return toast.warning(t("errors.missing_dates"));

    const payload = {
      restaurantId,
      title: formData.title.trim(),
      description: formData.description?.trim() || "",
      startDate: toISO(formData.startDate),
      endDate: toISO(formData.endDate),
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue),
      voucherCode: formData.voucherCode?.trim() || undefined,
      targetType: formData.targetType,
    };

    try {
      if (editingPromo) {
        await dispatch(
          updatePromotion({ id: editingPromo.id, data: payload, file })
        ).unwrap();
        toast.success(t("success.update_success"));
      } else {
        await dispatch(addPromotion({ data: payload, file })).unwrap();
        toast.success(t("success.create_success"));
      }
      handleCloseModal();
      dispatch(fetchPromotions(restaurantId));
    } catch {
      toast.error(t("errors.operation_failed"));
    }
  };

  const handleClickDelete = (id: number) => {
    setSelectedPromoId(id);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedPromoId) return;
    try {
      await dispatch(deletePromotion(selectedPromoId)).unwrap();
      toast.success(t("success.delete_success"));
      if (restaurantId) dispatch(fetchPromotions(restaurantId));
    } catch {
      toast.error(t("errors.delete_failed"));
    } finally {
      setOpenDeleteDialog(false);
      setSelectedPromoId(null);
    }
  };

  // Mở dialog gán số tiền tối thiểu
  const handleOpenMinOrderDialog = (promo: Promotion) => {
    setSelectedPromoForMinOrder(promo);
    setMinOrderValue("");
    setOpenMinOrderDialog(true);
  };

  // Đóng dialog gán số tiền tối thiểu
  const handleCloseMinOrderDialog = () => {
    setOpenMinOrderDialog(false);
    setSelectedPromoForMinOrder(null);
    setMinOrderValue("");
  };

  // Gán số tiền tối thiểu để áp dụng khuyến mãi (Order Promotion)
  const handleAssignMinOrderValue = async () => {
    if (!selectedPromoForMinOrder) return;

    const sanitized = minOrderValue.replace(/[^0-9.-]+/g, "");
    const value = Number(sanitized);
    if (!Number.isFinite(value) || value <= 0) {
      toast.warning(t("errors.invalid_min_order"));
      return;
    }

    try {
      await dispatch(
        createOrderPromotion({
          promotionId: selectedPromoForMinOrder.id,
          minOrderValue: value,
          restaurantId: restaurantId ?? undefined,
        })
      ).unwrap();

      toast.success(t("success.assign_min_order"));
      handleCloseMinOrderDialog();
      if (restaurantId) dispatch(fetchPromotions(restaurantId));
    } catch (err) {
      console.error(err);
      toast.error(t("errors.assign_failed"));
    }
  };

  // Huỷ gán số tiền tối thiểu (call delete API)
  const handleCancelOrderPromotion = async (orderPromotionId: number) => {
    try {
      await dispatch(deleteOrderPromotion(orderPromotionId)).unwrap();
      toast.success(t("success.cancel_min_order"));
      if (restaurantId) {
        dispatch(getOrderPromotionsForUser({ restaurantId }));
        dispatch(fetchPromotions(restaurantId));
      }
    } catch (err) {
      console.error("Error cancelling order promotion:", err);
      toast.error(t("errors.cancel_failed"));
    }
  };

  // ===== RENDER =====
  return (
    <Box p={3} pt={0} className="container mx-auto">
      {/* Header */}
      <Box mb={4}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
        >
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {t("title")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("subtitle")}
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => handleOpenModal()}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            {t("btn.create")}
          </Button>
        </Stack>
      </Box>

      {/* Filter bar */}
      <Box mb={3} display="flex" gap={2} alignItems="center" flexWrap="wrap">
        <TextField
          select
          size="small"
          label={t("filter.label")}
          value={filterTarget}
          onChange={(e) =>
            setFilterTarget(e.target.value as "all" | TargetType)
          }
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="all">{t("filter.all")}</MenuItem>
          <MenuItem value="dish">{t("filter.dish")}</MenuItem>
          <MenuItem value="order">{t("filter.order")}</MenuItem>
        </TextField>

        <Typography variant="body2" color="text.secondary">
          {t("summary.total_promotions", {
            count: promotions ? promotions.length : 0,
          })}
        </Typography>
      </Box>

      {/* Content */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={8} pt={0}>
          <CircularProgress size={40} />
        </Box>
      ) : !promotions || promotions.length === 0 ? (
        <Card
          sx={{
            textAlign: "center",
            py: 8,
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.03),
          }}
        >
          <OfferIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t("empty.title")}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {t("empty.subtitle")}
          </Typography>
        </Card>
      ) : (
        <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPromotions.map((promo) => {
            const orderPromotion = orderPromotions.find(
              (o: OrderPromotion) => o.promotionId === promo.id
            );
            const now = new Date();
            const start = new Date(promo.startDate);
            const end = new Date(promo.endDate);
            const isActive = now >= start && now <= end;
            const isUpcoming = now < start;
            const statusLabel = isActive
              ? t("status.active")
              : isUpcoming
              ? t("status.upcoming")
              : t("status.ended");
            const statusColor = isActive
              ? "success"
              : isUpcoming
              ? "info"
              : "default";
            const targetLabel =
              promo.targetType === "order"
                ? t("target.order")
                : promo.targetType === "dish"
                ? t("target.dish")
                : t("target.category");

            return (
              <Card
                key={promo.id}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  transition: "all 0.3s",
                  "&:hover": {
                    boxShadow: 6,
                    transform: "translateY(-4px)",
                  },
                }}
              >
                {/* Image preview */}
                {promo.imageUrl && (
                  <Box sx={{ width: "100%", height: 160, overflow: "hidden" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={promo.imageUrl}
                      alt={promo.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </Box>
                )}
                {/* Status Badge */}
                <Box
                  sx={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    zIndex: 1,
                  }}
                >
                  <Chip
                    label={statusLabel}
                    color={statusColor}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>

                <CardContent sx={{ flexGrow: 1, pb: 2 }}>
                  <Typography
                    variant="h6"
                    fontWeight="600"
                    gutterBottom
                    sx={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {promo.title}
                  </Typography>

                  {/* Description */}
                  {promo.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        mb: 2,
                      }}
                    >
                      {promo.description}
                    </Typography>
                  )}

                  <Divider sx={{ my: 2 }} />

                  {/* Meta Info */}
                  <Stack spacing={1.5}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <EventIcon
                        sx={{ fontSize: 18, color: "text.secondary" }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {fromISO(promo.startDate)} - {fromISO(promo.endDate)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={targetLabel}
                        size="small"
                        variant="outlined"
                      />
                      {orderPromotion && (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            label={t("min_order.label", {
                              amount: `${orderPromotion.minOrderValue.toLocaleString()}đ`,
                            })}
                            size="small"
                            color="info"
                          />
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleCancelOrderPromotion(orderPromotion.id)
                            }
                            aria-label="cancel-order-promotion"
                            title={t("btn.cancel_assign_min")}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      )}
                    </Stack>
                  </Stack>
                </CardContent>

                {/* Actions */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 1,
                    p: 2,
                    pt: 0,
                  }}
                >
                  {/* Gán số tiền tối thiểu áp dụng khuyến mãi (chỉ cho loại Đơn hàng) */}
                  {promo.targetType === "order" && (
                    <IconButton
                      size="small"
                      onClick={() => handleOpenMinOrderDialog(promo)}
                      sx={{
                        backgroundColor: (theme) =>
                          alpha(theme.palette.info.main, 0.06),
                        color: "info.main",
                        "&:hover": {
                          backgroundColor: (theme) =>
                            alpha(theme.palette.info.main, 0.12),
                        },
                      }}
                      aria-label="assign-min-order"
                      title={t("aria.assign_min_order")}
                    >
                      <MoneyIcon fontSize="small" />
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => handleOpenModal(promo)}
                    sx={{
                      backgroundColor: (theme) =>
                        alpha(theme.palette.primary.main, 0.1),
                      "&:hover": {
                        backgroundColor: (theme) =>
                          alpha(theme.palette.primary.main, 0.2),
                      },
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleClickDelete(promo.id)}
                    sx={{
                      backgroundColor: (theme) =>
                        alpha(theme.palette.error.main, 0.1),
                      color: "error.main",
                      "&:hover": {
                        backgroundColor: (theme) =>
                          alpha(theme.palette.error.main, 0.2),
                      },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Modal thêm/sửa */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                backgroundColor: (theme) =>
                  alpha(theme.palette.primary.main, 0.1),
                color: "primary.main",
                p: 1,
                borderRadius: 2,
                display: "flex",
              }}
            >
              <OfferIcon />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {editingPromo
                  ? t("modal.title_update")
                  : t("modal.title_create")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {editingPromo
                  ? t("modal.subtitle_update")
                  : t("modal.subtitle_create")}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            {/* Thông tin cơ bản */}
            <Box>
              <Typography
                variant="subtitle2"
                fontWeight="600"
                color="text.secondary"
                mb={2}
              >
                {t("modal.basic_info_title")}
              </Typography>
              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  label={t("form.title.label")}
                  placeholder={t("form.title.placeholder")}
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((s) => ({ ...s, title: e.target.value }))
                  }
                  required
                  variant="outlined"
                />

                <TextField
                  fullWidth
                  label={t("form.description.label")}
                  placeholder={t("form.description.placeholder")}
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((s) => ({ ...s, description: e.target.value }))
                  }
                  variant="outlined"
                />

                {/* Voucher code (optional) - useful for order-level promotions */}
                <TextField
                  fullWidth
                  label={t("form.voucher.label")}
                  placeholder={t("form.voucher.placeholder")}
                  value={formData.voucherCode}
                  onChange={(e) =>
                    setFormData((s) => ({ ...s, voucherCode: e.target.value }))
                  }
                  variant="outlined"
                  helperText={
                    formData.targetType === "order"
                      ? t("form.voucher.helper_for_order")
                      : t("form.voucher.helper_for_other")
                  }
                />

                {/* Upload ảnh khuyến mãi (tùy chọn) */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" mb={1}>
                    {t("form.image.label")}
                  </Typography>
                  {previewUrl && (
                    <Box mb={1}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewUrl}
                        alt="promotion-preview"
                        style={{
                          width: "100%",
                          maxHeight: 200,
                          objectFit: "cover",
                          borderRadius: 8,
                        }}
                      />
                    </Box>
                  )}
                  <Button
                    variant="outlined"
                    component="label"
                    sx={{ textTransform: "none" }}
                  >
                    {t("btn.choose_image")}
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        setFile(f);
                        if (f) {
                          const url = URL.createObjectURL(f);
                          setPreviewUrl(url);
                        } else {
                          setPreviewUrl(null);
                        }
                      }}
                    />
                  </Button>
                </Box>
              </Stack>
            </Box>

            <Divider />

            {/* Cấu hình giảm giá */}
            <Box>
              <Typography
                variant="subtitle2"
                fontWeight="600"
                color="text.secondary"
                mb={2}
              >
                {t("modal.discount_config_title")}
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  select
                  fullWidth
                  label="Loại giảm giá"
                  value={formData.discountType}
                  onChange={(e) =>
                    setFormData((s) => ({
                      ...s,
                      discountType: e.target.value as DiscountType,
                    }))
                  }
                  SelectProps={{
                    startAdornment:
                      formData.discountType === "percent" ? (
                        <PercentIcon
                          sx={{ ml: 1, mr: -0.5, color: "action.active" }}
                        />
                      ) : (
                        <MoneyIcon
                          sx={{ ml: 1, mr: -0.5, color: "action.active" }}
                        />
                      ),
                  }}
                >
                  <MenuItem value="percent">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <span>{t("discount.percent")}</span>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="fixed_amount">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <span>{t("discount.fixed")}</span>
                    </Stack>
                  </MenuItem>
                </TextField>

                <TextField
                  fullWidth
                  type="text"
                  label={
                    formData.discountType === "percent"
                      ? t("form.discount_value_label_percent")
                      : t("form.discount_value_label_fixed")
                  }
                  placeholder={
                    formData.discountType === "percent"
                      ? t("form.discount_value_placeholder_percent")
                      : t("form.discount_value_placeholder_fixed")
                  }
                  value={formData.discountValue}
                  onChange={(e) => {
                    // allow only digits, remove non-digit chars
                    let raw = e.target.value.replace(/\D/g, "");
                    // remove leading zeros but keep single zero when value is 0
                    raw = raw.replace(/^0+(?=\d)/, "");
                    // enforce percent max
                    if (formData.discountType === "percent") {
                      if (raw === "") raw = "0";
                      const num = Number(raw);
                      if (!Number.isNaN(num) && num > 100) raw = "100";
                    }
                    // keep at least "0" so the field never becomes empty string
                    if (raw === "") raw = "0";
                    setFormData((s) => ({ ...s, discountValue: raw }));
                  }}
                  required
                  inputProps={{
                    inputMode: "numeric",
                    pattern: "[0-9]*",
                    min: 0,
                    max: formData.discountType === "percent" ? 100 : undefined,
                  }}
                />
              </Stack>
            </Box>

            <Divider />

            {/* Phạm vi áp dụng & Thời gian */}
            <Box>
              <Typography
                variant="subtitle2"
                fontWeight="600"
                color="text.secondary"
                mb={2}
              >
                {t("modal.target_title")}
              </Typography>
              <TextField
                select
                fullWidth
                label="Áp dụng cho"
                value={formData.targetType}
                onChange={(e) =>
                  setFormData((s) => ({
                    ...s,
                    targetType: e.target.value as TargetType,
                  }))
                }
              >
                <MenuItem value="dish">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "success.main",
                      }}
                    />
                    <span>{t("target.dish_specific")}</span>
                  </Stack>
                </MenuItem>
                <MenuItem value="order">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "primary.main",
                      }}
                    />
                    <span>{t("target.order_whole")}</span>
                  </Stack>
                </MenuItem>
                {/* <MenuItem value="category">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "warning.main",
                      }}
                    />
                    <span>{t("target.category")}</span>
                  </Stack>
                </MenuItem> */}
              </TextField>
            </Box>

            <Divider />

            {/* Thời gian */}
            <Box>
              <Typography
                variant="subtitle2"
                fontWeight="600"
                color="text.secondary"
                mb={2}
              >
                {t("modal.period_title")}
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  fullWidth
                  type="date"
                  label={t("form.start_date")}
                  InputLabelProps={{ shrink: true }}
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((s) => ({ ...s, startDate: e.target.value }))
                  }
                  required
                  InputProps={{
                    startAdornment: (
                      <EventIcon sx={{ mr: 1, color: "action.active" }} />
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  type="date"
                  label={t("form.end_date")}
                  InputLabelProps={{ shrink: true }}
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData((s) => ({ ...s, endDate: e.target.value }))
                  }
                  required
                  InputProps={{
                    startAdornment: (
                      <EventIcon sx={{ mr: 1, color: "action.active" }} />
                    ),
                  }}
                  inputProps={{
                    min: formData.startDate,
                  }}
                />
              </Stack>
            </Box>
          </Stack>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={handleCloseModal}
            size="large"
            sx={{ px: 3, textTransform: "none" }}
          >
            {t("btn.cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            size="large"
            sx={{
              px: 4,
              textTransform: "none",
              fontWeight: 600,
            }}
            startIcon={editingPromo ? <EditIcon /> : <AddIcon />}
          >
            {editingPromo ? t("btn.update") : t("btn.create")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog xoá */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>{t("dialog.delete_title")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t("dialog.delete_text")}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>
            {t("btn.cancel")}
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDelete}
          >
            {t("btn.delete")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog gán số tiền tối thiểu cho Order Promotion */}
      <Dialog
        open={openMinOrderDialog}
        onClose={handleCloseMinOrderDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <MoneyIcon color="info" />
            <Typography variant="h6" fontWeight="600">
              {t("min_order.title")}
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            {t("min_order.text", {
              title: selectedPromoForMinOrder?.title ?? "",
            })}
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            label={t("min_order.input_label")}
            type="text"
            value={minOrderValue}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, "");
              setMinOrderValue(value);
            }}
            placeholder={t("min_order.placeholder")}
            helperText={t("min_order.helper")}
            InputProps={{
              startAdornment: (
                <MoneyIcon sx={{ mr: 1, color: "action.active" }} />
              ),
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={handleCloseMinOrderDialog}
            size="large"
            sx={{ textTransform: "none" }}
          >
            {t("btn.cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={handleAssignMinOrderValue}
            size="large"
            sx={{ textTransform: "none", fontWeight: 600 }}
            disabled={!minOrderValue || Number(minOrderValue) <= 0}
          >
            {t("btn.confirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PromotionPage;
