"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import {
  fetchPromotions,
  addPromotion,
  updatePromotion,
  deletePromotion,
} from "@/redux/slices/promotionSlice";
import { Promotion } from "@/types/promotion";

interface Restaurant {
  id: string;
  ownerId: number;
  name?: string;
}

interface PromotionForm {
  title: string;
  description?: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
}

interface LocalUser {
  token?: string;
  user?: { userId: number };
}

const getUserFromLocalStorage = (): LocalUser => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const PromotionPage = () => {
  const dispatch = useAppDispatch();
  const { promotions, loading } = useAppSelector((state) => state.promotion);

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState<PromotionForm>({
    title: "",
    description: "",
    discountPercent: 0,
    startDate: "",
    endDate: "",
  });

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
        const myRestaurant: Restaurant | undefined = data?.data?.find(
          (r: Restaurant) => r.ownerId === userId
        );
        if (!myRestaurant?.id) return alert("Tài khoản chưa có nhà hàng!");
        setRestaurantId(myRestaurant.id);
        dispatch(fetchPromotions(myRestaurant.id));
      } catch {
        alert("Không thể lấy thông tin nhà hàng");
      }
    };

    fetchRestaurant();
  }, [dispatch]);

  const handleOpenModal = (promo: Promotion | null = null) => {
    if (promo) {
      setEditing(promo);
      setFormData({
        title: promo.title,
        description: promo.description ?? "",
        discountPercent: promo.discountPercent,
        startDate: promo.startDate?.split("T")[0] || "",
        endDate: promo.endDate?.split("T")[0] || "",
      });
    } else {
      setEditing(null);
      setFormData({
        title: "",
        description: "",
        discountPercent: 0,
        startDate: "",
        endDate: "",
      });
    }
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!restaurantId) return;
    const payload = { ...formData, restaurantId };

    try {
      if (editing) {
        await dispatch(
          updatePromotion({ id: editing.id, data: payload })
        ).unwrap();
        alert("Cập nhật thành công");
      } else {
        await dispatch(addPromotion(payload)).unwrap();
        alert("Tạo thành công");
      }
      setOpen(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Thao tác thất bại");
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa?")) return;
    try {
      await dispatch(deletePromotion(id)).unwrap();
      alert("Đã xóa thành công");
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Không thể xóa");
      }
    }
  };

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
                    <TableCell>Giảm giá (%)</TableCell>
                    <TableCell>Ngày áp dụng</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {promotions.map((promo: Promotion) => (
                    <TableRow key={promo.id}>
                      <TableCell>{promo.title}</TableCell>
                      <TableCell>{promo.description}</TableCell>
                      <TableCell>{promo.discountPercent}</TableCell>
                      <TableCell>
                        {promo.startDate?.split("T")[0]} -{" "}
                        {promo.endDate?.split("T")[0]}
                      </TableCell>
                      <TableCell>
                        {promo.isActive ? "Đang hoạt động" : "Ngừng"}
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleOpenModal(promo)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(promo.id)}
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

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editing ? "Sửa khuyến mãi" : "Thêm khuyến mãi"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={12} component={"div" as React.ElementType}>
              <TextField
                fullWidth
                label="Tiêu đề"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} component={"div" as React.ElementType}>
              <TextField
                fullWidth
                label="Mô tả"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} component={"div" as React.ElementType}>
              <TextField
                fullWidth
                type="number"
                label="Giảm giá (%)"
                value={formData.discountPercent}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discountPercent: Number(e.target.value),
                  })
                }
              />
            </Grid>
            <Grid item xs={12} component={"div" as React.ElementType}>
              <TextField
                fullWidth
                type="date"
                label="Ngày bắt đầu"
                InputLabelProps={{ shrink: true }}
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} component={"div" as React.ElementType}>
              <TextField
                fullWidth
                type="date"
                label="Ngày kết thúc"
                InputLabelProps={{ shrink: true }}
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Hủy</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editing ? "Cập nhật" : "Thêm"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PromotionPage;
