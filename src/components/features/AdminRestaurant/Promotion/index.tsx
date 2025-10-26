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
  // Grid,
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  DialogContentText,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
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
    <Box p={3}>
      <Card>
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6">Quản lý khuyến mãi</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenModal()}
            >
              Thêm khuyến mãi
            </Button>
          </Box>

          {loading ? (
            <CircularProgress />
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tiêu đề</TableCell>
                    <TableCell>Mô tả</TableCell>
                    <TableCell>Thời gian</TableCell>
                    <TableCell>Nhà hàng</TableCell>
                    <TableCell>Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.isArray(promotions) &&
                    promotions.map((promo) => (
                      <TableRow key={promo.id}>
                        <TableCell>{promo.title}</TableCell>
                        <TableCell>{promo.description}</TableCell>
                        <TableCell>
                          {fromISO(promo.startDate)} - {fromISO(promo.endDate)}
                        </TableCell>
                        <TableCell>{promo.restaurant?.name ?? "—"}</TableCell>
                        <TableCell>
                          <IconButton onClick={() => handleOpenModal(promo)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleClickDelete(promo.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Modal thêm/sửa */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingPromo ? "Cập nhật khuyến mãi" : "Thêm khuyến mãi"}
        </DialogTitle>
        <DialogContent>
          <Box mt={1} sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ width: "100%" }}>
              <TextField
                fullWidth
                label="Tiêu đề"
                value={formData.title}
                onChange={(e) =>
                  setFormData((s) => ({ ...s, title: e.target.value }))
                }
              />
            </Box>

            <Box sx={{ width: "100%" }}>
              <TextField
                fullWidth
                label="Mô tả"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData((s) => ({ ...s, description: e.target.value }))
                }
              />
            </Box>

            <Box sx={{ width: { xs: "100%", sm: "50%" } }}>
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
              >
                <MenuItem value="percent">Phần trăm</MenuItem>
                <MenuItem value="fixed_amount">Số tiền</MenuItem>
              </TextField>
            </Box>

            <Box sx={{ width: { xs: "100%", sm: "50%" } }}>
              <TextField
                fullWidth
                type="number"
                label={
                  formData.discountType === "percent"
                    ? "Giảm (%)"
                    : "Giảm (VNĐ)"
                }
                value={formData.discountValue}
                onChange={(e) =>
                  setFormData((s) => ({
                    ...s,
                    discountValue: Number(e.target.value),
                  }))
                }
              />
            </Box>

            <Box sx={{ width: { xs: "100%", sm: "50%" } }}>
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
                <MenuItem value="dish">Món ăn</MenuItem>
                <MenuItem value="order">Đơn hàng</MenuItem>
                <MenuItem value="category">Danh mục</MenuItem>
              </TextField>
            </Box>

            <Box sx={{ width: { xs: "100%", sm: "50%" } }}>
              <TextField
                fullWidth
                type="date"
                label="Ngày bắt đầu"
                InputLabelProps={{ shrink: true }}
                value={formData.startDate}
                onChange={(e) =>
                  setFormData((s) => ({ ...s, startDate: e.target.value }))
                }
              />
            </Box>

            <Box sx={{ width: { xs: "100%", sm: "50%" } }}>
              <TextField
                fullWidth
                type="date"
                label="Ngày kết thúc"
                InputLabelProps={{ shrink: true }}
                value={formData.endDate}
                onChange={(e) =>
                  setFormData((s) => ({ ...s, endDate: e.target.value }))
                }
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Hủy</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingPromo ? "Cập nhật" : "Thêm"}
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
