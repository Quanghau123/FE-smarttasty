"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  MenuItem,
  Pagination,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalOffer as LocalOfferIcon,
} from "@mui/icons-material";
import Image from "next/image";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { getAccessToken } from "@/lib/utils/tokenHelper";
import {
  fetchDishes,
  addDish,
  updateDish,
  deleteDish,
} from "@/redux/slices/dishSlide";
import { fetchRestaurantByOwner } from "@/redux/slices/restaurantSlice";
import { fetchPromotions } from "@/redux/slices/promotionSlice";
import { Dish } from "@/types/dish";
import axiosInstance from "@/lib/axios/axiosInstance";
import { toast } from "react-toastify";
import {
  createDishPromotion,
  // ❌ bỏ fetchDishPromotionById (N+1)
  fetchDishPromotions, // ✅ gọi tổng
} from "@/redux/slices/dishPromotionSlice";
import styles from "./styles.module.scss";
import type { DishPromotion } from "@/types/dishpromotion";

type FormState = {
  name: string;
  price: string;
  category: "ThucAn" | "NuocUong" | "ThucAnThem";
  isActive: boolean;
};

const defaultForm: FormState = {
  name: "",
  price: "",
  category: "ThucAn",
  isActive: true,
};

const getUserFromLocalStorage = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = getAccessToken();
    return { user, token };
  } catch {
    return { user: {}, token: null };
  }
};

const ProductPage = () => {
  const dispatch = useAppDispatch();
  const { items: dishes, loading } = useAppSelector((state) => state.dishes);
  const { current: restaurant } = useAppSelector((state) => state.restaurant);

  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [formData, setFormData] = useState<FormState>(defaultForm);
  const [file, setFile] = useState<File | null>(null);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedDishId, setSelectedDishId] = useState<number | null>(null);

  // voucher (dish-promotion) dialog state
  const [openVoucherDialog, setOpenVoucherDialog] = useState(false);
  const [voucherDish, setVoucherDish] = useState<Dish | null>(null);
  const [selectedPromotionId, setSelectedPromotionId] = useState<number | "">(
    ""
  );

  useEffect(() => {
    const { token } = getUserFromLocalStorage();
    if (token) {
      axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
      dispatch(fetchRestaurantByOwner({ token }));
    }
  }, [dispatch]);

  const { promotions } = useAppSelector((state) => state.promotion);
  // only promotions that target dishes should be available on this page
  const filteredPromotions = Array.isArray(promotions)
    ? promotions.filter((p) => p.targetType === "dish")
    : [];

  const { items: dishPromotions } = useAppSelector(
    (state) => state.dishpromotion
  );

  useEffect(() => {
    if (restaurant?.id) {
      setRestaurantId(restaurant.id);
      dispatch(fetchDishes(restaurant.id));
      // load promotions to attach in dialog
      dispatch(fetchPromotions(restaurant.id));
      // ✅ load toàn bộ dish promotions để hiển thị giá giảm
      dispatch(fetchDishPromotions());
    } else if (restaurant) {
      toast.warning("Tài khoản chưa có nhà hàng!");
    }
  }, [restaurant, dispatch]);

  // ❌ BỎ hẳn N+1 theo từng món
  // useEffect(() => {
  //   if (dishes && dishes.length > 0) {
  //     dishes.forEach((d) => dispatch(fetchDishPromotionById(d.id)));
  //   }
  // }, [dishes, dispatch]);

  // debug: watch promotions from store
  useEffect(() => {
    if (promotions) console.debug("promotions in store:", promotions);
  }, [promotions]);

  const handleOpenModal = (dish: Dish | null = null) => {
    if (dish) {
      setEditingDish(dish);
      setFormData({
        name: dish.name,
        price: dish.price.toString(),
        category: dish.category as FormState["category"],
        isActive: dish.isActive,
      });
      setFile(null);
    } else {
      setEditingDish(null);
      setFormData(defaultForm);
      setFile(null);
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingDish(null);
    setFormData(defaultForm);
    setFile(null);
  };

  const handleSubmit = async () => {
    if (!restaurantId) return toast.error("Thiếu nhà hàng!");
    if (!formData.name.trim()) return toast.warning("Vui lòng nhập tên món");
    const priceNum = Number(formData.price);
    if (!Number.isFinite(priceNum) || priceNum <= 0)
      return toast.warning("Giá không hợp lệ");
    if (!editingDish && !file) return toast.warning("Vui lòng tải ảnh món ăn");

    const form = new FormData();
    form.append("name", formData.name.trim());
    form.append("price", String(Math.round(priceNum)));
    form.append("category", formData.category);
    form.append("isActive", String(formData.isActive));
    form.append("RestaurantId", String(restaurantId));
    if (file) form.append("file", file);

    try {
      if (editingDish) {
        await dispatch(updateDish({ id: editingDish.id, data: form })).unwrap();
        toast.success("Cập nhật món ăn thành công ✅");
      } else {
        await dispatch(addDish(form)).unwrap();
        toast.success("Thêm món ăn thành công ✅");
      }
      handleCloseModal();
      dispatch(fetchDishes(restaurantId));
      // Sau khi thêm/cập nhật món, có thể giá trị khuyến mãi áp dụng thay đổi theo danh sách món
      dispatch(fetchDishPromotions());
    } catch {
      toast.error("Thao tác thất bại. Vui lòng thử lại!");
    }
  };

  const handleClickDelete = (id: number) => {
    setSelectedDishId(id);
    setOpenDeleteDialog(true);
  };

  const handleOpenVoucherModal = (dish: Dish) => {
    setVoucherDish(dish);
    setSelectedPromotionId("");
    setOpenVoucherDialog(true);
    // ❌ không cần gọi fetch theo dish id nữa
  };

  const handleCloseVoucherModal = () => {
    setOpenVoucherDialog(false);
    setVoucherDish(null);
    setSelectedPromotionId("");
  };

  const handleAddVoucher = async () => {
    if (!voucherDish) return toast.error("Thiếu món ăn");
    if (!selectedPromotionId) return toast.warning("Vui lòng chọn khuyến mãi");
    try {
      const payload: Omit<
        import("@/types/dishpromotion").DishPromotion,
        "dish" | "promotion"
      > = {
        id: 0,
        dishId: voucherDish.id,
        promotionId: Number(selectedPromotionId),
      };

      await dispatch(createDishPromotion(payload)).unwrap();
      toast.success("Gán voucher cho món thành công ✅");

      // ✅ Refresh toàn bộ danh sách khuyến mãi món để cột giá cập nhật ngay
      dispatch(fetchDishPromotions());

      handleCloseVoucherModal();
    } catch (err: unknown) {
      let message = "Gán voucher thất bại. Vui lòng thử lại!";
      if (err && typeof err === "object" && "message" in err) {
        message = (err as { message: string }).message;
      }
      toast.error(message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedDishId) return;
    try {
      await dispatch(deleteDish(selectedDishId)).unwrap();
      toast.success("Xóa món ăn thành công ✅");
      if (restaurantId) dispatch(fetchDishes(restaurantId));
      // Xoá món xong reload promotions để tránh hiển thị dư
      dispatch(fetchDishPromotions());
    } catch (error: unknown) {
      let message = "Xóa món ăn thất bại. Vui lòng thử lại!";
      if (error && typeof error === "object" && "message" in error) {
        message = (error as { message: string }).message;
      }
      toast.error(message);
    } finally {
      setOpenDeleteDialog(false);
      setSelectedDishId(null);
    }
  };

  const filteredDishes = useMemo(() => {
    return dishes.filter((dish) => {
      const matchKeyword = dish.name
        .toLowerCase()
        .includes(searchKeyword.toLowerCase());
      const matchCategory =
        selectedCategory === "All" || dish.category === selectedCategory;
      return matchKeyword && matchCategory;
    });
  }, [dishes, searchKeyword, selectedCategory]);

  const paginatedDishes = useMemo(
    () =>
      filteredDishes.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      ),
    [filteredDishes, currentPage]
  );

  const totalPages = Math.ceil(filteredDishes.length / itemsPerPage);

  // Helper tính giá đã giảm từ 1 promotion record
  const computeDiscountedPrice = (
    orig: number,
    discountType?: string,
    discountValue?: number
  ) => {
    if (!discountType) return orig;
    if (discountType === "percent") {
      const pct = Number(discountValue) || 0;
      const safePct = Math.max(0, Math.min(100, pct)); // clamp để tránh dữ liệu sai
      return Math.max(0, Math.round(orig * (1 - safePct / 100)));
    }
    if (discountType === "fixed_amount") {
      const amt = Number(discountValue) || 0;
      return Math.max(0, orig - amt);
    }
    return orig;
  };

  return (
    <Box className={styles.productPage}>
      <Card className={styles.card}>
        <CardContent>
          <Box className={styles.header}>
            <Typography variant="h6">Quản lý món ăn</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenModal()}
            >
              Thêm món
            </Button>
          </Box>

          <Box className={styles.filter}>
            <TextField
              label="Tìm kiếm món ăn"
              variant="outlined"
              size="small"
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.searchInput}
            />
            <TextField
              label="Danh mục"
              select
              size="small"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.categorySelect}
            >
              <MenuItem value="All">Tất cả</MenuItem>
              <MenuItem value="ThucAn">Thức ăn</MenuItem>
              <MenuItem value="NuocUong">Nước uống</MenuItem>
              <MenuItem value="ThucAnThem">Thức ăn thêm</MenuItem>
            </TextField>
          </Box>

          {loading ? (
            <CircularProgress />
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Tên món</TableCell>
                      <TableCell>Giá</TableCell>
                      <TableCell>Danh mục</TableCell>
                      <TableCell>Trạng thái</TableCell>
                      <TableCell>Hình ảnh</TableCell>
                      <TableCell>Hành động</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedDishes.map((dish) => (
                      <TableRow key={dish.id}>
                        <TableCell>{dish.name}</TableCell>
                        <TableCell>
                          {/* Tính giá đã giảm dựa trên danh sách dishPromotions (toàn trang) */}
                          {(() => {
                            const related = dishPromotions.filter(
                              (it) => it.dishId === dish.id
                            );

                            if (related.length > 0) {
                              const orig = dish.price;

                              // Nếu có nhiều KM áp cho cùng món, chọn giá thấp nhất
                              type DishPromotionFlat = DishPromotion & {
                                discountType?: "percent" | "fixed_amount";
                                discountValue?: number;
                              };
                              const getDiscount = (dp: DishPromotionFlat) => ({
                                type:
                                  dp.promotion?.discountType ?? dp.discountType,
                                value:
                                  dp.promotion?.discountValue ??
                                  dp.discountValue,
                              });

                              const bestDiscounted = related.reduce(
                                (min, p) => {
                                  const { type, value } = getDiscount(
                                    p as DishPromotionFlat
                                  );
                                  const priceAfter = computeDiscountedPrice(
                                    orig,
                                    type,
                                    Number(value)
                                  );
                                  return Math.min(min, priceAfter);
                                },
                                orig
                              );

                              if (bestDiscounted < orig) {
                                return (
                                  <>
                                    <div
                                      style={{
                                        textDecoration: "line-through",
                                        color: "#999",
                                      }}
                                    >
                                      {orig.toLocaleString()}đ
                                    </div>
                                    <div
                                      style={{
                                        color: "#d32f2f",
                                        fontWeight: 600,
                                      }}
                                    >
                                      {bestDiscounted.toLocaleString()}đ
                                    </div>
                                  </>
                                );
                              }
                            }

                            // Không có KM
                            return <>{dish.price.toLocaleString()}đ</>;
                          })()}
                        </TableCell>
                        <TableCell>{dish.category}</TableCell>
                        <TableCell>
                          <Typography
                            className={
                              dish.isActive
                                ? styles.statusActive
                                : styles.statusInactive
                            }
                          >
                            {dish.isActive ? "Đang bán" : "Ngưng"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {dish.imageUrl ? (
                            <Image
                              src={dish.imageUrl}
                              alt={dish.name}
                              width={80}
                              height={80}
                            />
                          ) : (
                            <Typography>Không có ảnh</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <IconButton onClick={() => handleOpenModal(dish)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            title="Gán voucher"
                            onClick={() => handleOpenVoucherModal(dish)}
                          >
                            <LocalOfferIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleClickDelete(dish.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box display="flex" justifyContent="center" mt={2}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(_, page) => setCurrentPage(page)}
                  color="primary"
                />
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal thêm/sửa món */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingDish ? "Cập nhật món ăn" : "Thêm món ăn"}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Tên món"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              fullWidth
            />
            <TextField
              label="Giá"
              type="number"
              value={formData.price}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, price: e.target.value }))
              }
              fullWidth
              inputProps={{ min: 0 }}
            />
            <TextField
              label="Danh mục"
              select
              value={formData.category}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  category: e.target.value as FormState["category"],
                }))
              }
              fullWidth
            >
              <MenuItem value="ThucAn">Thức ăn</MenuItem>
              <MenuItem value="NuocUong">Nước uống</MenuItem>
              <MenuItem value="ThucAnThem">Thức ăn thêm</MenuItem>
            </TextField>

            <Box display="flex" alignItems="center" gap={1}>
              <Switch
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isActive: e.target.checked,
                  }))
                }
              />
              <Typography>
                {formData.isActive ? "Đang bán" : "Ngưng"}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={2}>
              <Button variant="outlined" component="label">
                {file ? "Đổi ảnh" : "Chọn ảnh"}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </Button>
              {(file || editingDish?.imageUrl) && (
                <Image
                  src={
                    file
                      ? URL.createObjectURL(file)
                      : editingDish?.imageUrl || "/default.png"
                  }
                  alt="preview"
                  width={80}
                  height={80}
                  style={{ objectFit: "cover", borderRadius: 8 }}
                />
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Hủy</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingDish ? "Cập nhật" : "Thêm"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog xác nhận xóa */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Xác nhận xoá</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xoá món ăn này không?
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

      {/* Dialog gán voucher cho món */}
      <Dialog
        open={openVoucherDialog}
        onClose={handleCloseVoucherModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Gán voucher cho món</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Món"
              value={voucherDish?.name || ""}
              fullWidth
              disabled
            />

            <TextField
              label="Chọn khuyến mãi"
              select
              value={selectedPromotionId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const v = e.target.value;
                setSelectedPromotionId(v === "" ? "" : Number(v));
              }}
              fullWidth
            >
              <MenuItem value="">-- Chọn --</MenuItem>
              {filteredPromotions.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.title}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseVoucherModal}>Hủy</Button>
          <Button
            variant="contained"
            onClick={handleAddVoucher}
            disabled={
              !Array.isArray(promotions) ||
              promotions.length === 0 ||
              selectedPromotionId === ""
            }
          >
            Gán
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductPage;
