"use client";

import React, { useEffect, useState } from "react";
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
import { fetchRestaurantByOwner } from "@/redux/slices/restaurantSlice";
import { Promotion, DiscountType, TargetType } from "@/types/promotion";
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
  const {
    promotions,
    loading,
    error: promotionError,
  } = useAppSelector((state) => state.promotion);
  const { current: restaurant } = useAppSelector((state) => state.restaurant);

  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedPromoId, setSelectedPromoId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    discountType: "percent" as DiscountType,
    discountValue: 0,
    targetType: "dish" as TargetType,
  });

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
    } else if (restaurant) {
      toast.warning("Tài khoản chưa có nhà hàng!");
    }
  }, [restaurant, dispatch, promotionError]);

  // ===== HANDLERS =====
  const handleOpenModal = (promo: Promotion | null = null) => {
    if (promo) {
      setEditingPromo(promo);
      setFormData({
        title: promo.title,
        description: promo.description || "",
        startDate: fromISO(promo.startDate),
        endDate: fromISO(promo.endDate),
        discountType: promo.discountType as DiscountType,
        discountValue: promo.discountValue ?? 0,
        targetType: promo.targetType as TargetType,
      });
    } else {
      setEditingPromo(null);
      setFormData({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        discountType: "percent",
        discountValue: 0,
        targetType: "dish",
      });
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingPromo(null);
    setFormData({
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      discountType: "percent",
      discountValue: 0,
      targetType: "dish",
    });
  };

  const handleSubmit = async () => {
    if (!restaurantId) return toast.error("Thiếu nhà hàng!");
    if (!formData.title.trim()) return toast.warning("Nhập tiêu đề!");
    if (!formData.startDate || !formData.endDate)
      return toast.warning("Chọn ngày bắt đầu & kết thúc!");

    const payload = {
      restaurantId,
      title: formData.title.trim(),
      description: formData.description?.trim() || "",
      startDate: toISO(formData.startDate),
      endDate: toISO(formData.endDate),
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue),
      targetType: formData.targetType,
    };

    try {
      if (editingPromo) {
        await dispatch(
          updatePromotion({ id: editingPromo.id, data: payload })
        ).unwrap();
        toast.success("Cập nhật khuyến mãi thành công ✅");
      } else {
        await dispatch(addPromotion(payload)).unwrap();
        toast.success("Thêm khuyến mãi thành công ✅");
      }
      handleCloseModal();
      dispatch(fetchPromotions(restaurantId));
    } catch {
      toast.error("Thao tác thất bại. Vui lòng thử lại!");
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
      toast.success("Xoá khuyến mãi thành công ✅");
      if (restaurantId) dispatch(fetchPromotions(restaurantId));
    } catch {
      toast.error("Không thể xoá. Vui lòng thử lại!");
    } finally {
      setOpenDeleteDialog(false);
      setSelectedPromoId(null);
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
              Quản lý khuyến mãi
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tạo và quản lý các chương trình khuyến mãi cho nhà hàng của bạn
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
            Tạo khuyến mãi
          </Button>
        </Stack>
      </Box>

      {/* Content */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
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
            Chưa có khuyến mãi nào
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Hãy tạo chương trình khuyến mãi đầu tiên để thu hút khách hàng
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenModal()}
          >
            Tạo khuyến mãi đầu tiên
          </Button>
        </Card>
      ) : (
        <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promotions.map((promo) => {
            const now = new Date();
            const start = new Date(promo.startDate);
            const end = new Date(promo.endDate);
            const isActive = now >= start && now <= end;
            const isUpcoming = now < start;
            const statusLabel = isActive
              ? "Đang diễn ra"
              : isUpcoming
              ? "Sắp diễn ra"
              : "Đã kết thúc";
            const statusColor = isActive
              ? "success"
              : isUpcoming
              ? "info"
              : "default";

            const discount = Number(promo.discountValue ?? NaN);
            const hasDiscount = Number.isFinite(discount) && discount > 0;
            const discountLabel =
              promo.discountType === "percent"
                ? `${discount}%`
                : `${discount.toLocaleString()}đ`;

            const targetLabel =
              promo.targetType === "order"
                ? "Đơn hàng"
                : promo.targetType === "dish"
                ? "Món ăn"
                : "Danh mục";

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
                  {/* Discount Badge */}
                  {hasDiscount && (
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.5,
                        backgroundColor: (theme) =>
                          alpha(theme.palette.primary.main, 0.1),
                        color: "primary.main",
                        px: 2,
                        py: 0.5,
                        borderRadius: 2,
                        mb: 2,
                      }}
                    >
                      {promo.discountType === "percent" ? (
                        <PercentIcon sx={{ fontSize: 18 }} />
                      ) : (
                        <MoneyIcon sx={{ fontSize: 18 }} />
                      )}
                      <Typography variant="h6" fontWeight="bold">
                        {discountLabel}
                      </Typography>
                    </Box>
                  )}

                  {/* Title */}
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
                    <Stack direction="row" spacing={1}>
                      <Chip
                        label={targetLabel}
                        size="small"
                        variant="outlined"
                      />
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
                {editingPromo ? "Cập nhật khuyến mãi" : "Tạo khuyến mãi mới"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {editingPromo
                  ? "Chỉnh sửa thông tin khuyến mãi"
                  : "Điền đầy đủ thông tin bên dưới"}
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
                Thông tin cơ bản
              </Typography>
              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  label="Tiêu đề khuyến mãi"
                  placeholder="VD: Giảm giá cuối tuần, Combo tiết kiệm..."
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((s) => ({ ...s, title: e.target.value }))
                  }
                  required
                  variant="outlined"
                />

                <TextField
                  fullWidth
                  label="Mô tả chi tiết"
                  placeholder="Mô tả về chương trình khuyến mãi..."
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((s) => ({ ...s, description: e.target.value }))
                  }
                  variant="outlined"
                />
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
                Cấu hình giảm giá
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
                      <PercentIcon fontSize="small" />
                      <span>Phần trăm (%)</span>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="fixed_amount">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <MoneyIcon fontSize="small" />
                      <span>Số tiền cố định (VNĐ)</span>
                    </Stack>
                  </MenuItem>
                </TextField>

                <TextField
                  fullWidth
                  type="number"
                  label={
                    formData.discountType === "percent"
                      ? "Giá trị giảm (%)"
                      : "Giá trị giảm (VNĐ)"
                  }
                  placeholder={
                    formData.discountType === "percent" ? "10" : "50000"
                  }
                  value={formData.discountValue}
                  onChange={(e) =>
                    setFormData((s) => ({
                      ...s,
                      discountValue: Number(e.target.value),
                    }))
                  }
                  required
                  inputProps={{
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
                Phạm vi áp dụng
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
                    <span>Món ăn cụ thể</span>
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
                    <span>Toàn bộ đơn hàng</span>
                  </Stack>
                </MenuItem>
                <MenuItem value="category">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "warning.main",
                      }}
                    />
                    <span>Danh mục món ăn</span>
                  </Stack>
                </MenuItem>
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
                Thời gian hiệu lực
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  fullWidth
                  type="date"
                  label="Ngày bắt đầu"
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
                  label="Ngày kết thúc"
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
            Hủy bỏ
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
            {editingPromo ? "Cập nhật" : "Tạo khuyến mãi"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog xoá */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Xác nhận xoá</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xoá khuyến mãi này không?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Hủy</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDelete}
          >
            Xoá
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PromotionPage;
