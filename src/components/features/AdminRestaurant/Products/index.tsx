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
  DialogContentText,
  DialogTitle,
  IconButton,
  MenuItem,
  Chip,
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
import useMediaQuery from "@mui/material/useMediaQuery";
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
  deleteDishPromotion,
  fetchDishPromotions,
} from "@/redux/slices/dishPromotionSlice";
import styles from "./styles.module.scss";

type FormState = {
  name: string;
  price: string;
  category: "ThucAn" | "NuocUong" | "ThucAnThem";
  isActive: boolean;
  description: string;
};

const defaultForm: FormState = {
  name: "",
  price: "",
  category: "ThucAn",
  isActive: true,
  description: "",
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
  const isMobile = useMediaQuery("(max-width:600px)");
  const t = useTranslations("products");

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
      // Fetch từ server với category filter và pagination
      dispatch(
        fetchDishes({
          restaurantId: restaurant.id,
          pageNumber: currentPage,
          pageSize: itemsPerPage,
          category: selectedCategory !== "All" ? selectedCategory : undefined,
        })
      );
      // load promotions to attach in dialog
      dispatch(fetchPromotions(restaurant.id));
      // ✅ load toàn bộ dish promotions để hiển thị giá giảm
      dispatch(fetchDishPromotions());
    } else if (restaurant) {
      toast.warning(t("errors.missing_restaurant"));
    }
  }, [restaurant, dispatch, t, selectedCategory, currentPage]);

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
        description: dish.description || "",
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
    if (!formData.name.trim()) return toast.warning(t("errors.enter_name"));
    if (!formData.description.trim())
      return toast.warning(
        t("errors.enter_description") || "Vui lòng nhập mô tả"
      );
    const priceNum = Number(formData.price);
    if (!Number.isFinite(priceNum) || priceNum <= 0)
      return toast.warning("Giá không hợp lệ");
    if (!editingDish && !file) return toast.warning(t("errors.upload_image"));

    const form = new FormData();
    form.append("name", formData.name.trim());
    form.append("description", formData.description.trim());
    form.append("price", String(Math.round(priceNum)));
    form.append("category", formData.category);
    form.append("isActive", String(formData.isActive));
    form.append("RestaurantId", String(restaurantId));
    if (file) form.append("file", file);

    try {
      if (editingDish) {
        await dispatch(updateDish({ id: editingDish.id, data: form })).unwrap();
        toast.success(t("errors.update_success"));
      } else {
        await dispatch(addDish(form)).unwrap();
        toast.success(t("errors.add_success"));
      }
      handleCloseModal();
      // Reload current page after change
      if (restaurantId)
        dispatch(
          fetchDishes({
            restaurantId,
            pageNumber: currentPage,
            pageSize: itemsPerPage,
          })
        );
      // Sau khi thêm/cập nhật món, có thể giá trị khuyến mãi áp dụng thay đổi theo danh sách món
      dispatch(fetchDishPromotions());
    } catch {
      toast.error(t("errors.operation_failed"));
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

  // Hủy một voucher (mapping) đang áp cho món trong dialog
  const handleRemoveVoucherItem = async (dishPromotionId: number) => {
    try {
      await dispatch(deleteDishPromotion(dishPromotionId)).unwrap();
      toast.success(t("errors.remove_voucher_success"));
      dispatch(fetchDishPromotions());
    } catch (err: unknown) {
      let message = t("errors.remove_voucher_failed");
      if (err && typeof err === "object" && "message" in err) {
        message = (err as { message: string }).message;
      }
      toast.error(message);
    }
  };

  const handleAddVoucher = async () => {
    if (!voucherDish) return toast.error(t("errors.missing_dish"));
    if (!selectedPromotionId)
      return toast.warning(t("errors.select_promotion"));
    try {
      // ✅ Chỉ cần gửi dishId và promotionId, BE sẽ tự tính toán giá
      const payload = {
        dishId: voucherDish.id,
        promotionId: Number(selectedPromotionId),
      };

      await dispatch(createDishPromotion(payload)).unwrap();
      toast.success(t("errors.add_voucher_success"));

      // Refresh toàn bộ danh sách khuyến mãi món để cột giá cập nhật ngay
      dispatch(fetchDishPromotions());

      handleCloseVoucherModal();
    } catch (err: unknown) {
      let message = t("errors.assign_voucher_failed");
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
      toast.success(t("errors.delete_success"));
      if (restaurantId)
        dispatch(
          fetchDishes({
            restaurantId,
            pageNumber: currentPage,
            pageSize: itemsPerPage,
          })
        );
      // Xoá món xong reload promotions để tránh hiển thị dư
      dispatch(fetchDishPromotions());
    } catch (error: unknown) {
      let message = t("errors.delete_failed");
      if (error && typeof error === "object" && "message" in error) {
        message = (error as { message: string }).message;
      }
      toast.error(message);
    } finally {
      setOpenDeleteDialog(false);
      setSelectedDishId(null);
    }
  };

  // Lọc keyword trên client từ dữ liệu đã được server phân trang
  const filteredDishes = dishes.filter((dish) => {
    const matchKeyword = dish.name
      .toLowerCase()
      .includes(searchKeyword.toLowerCase());
    return matchKeyword;
  });

  // Sử dụng dishes từ server (đã phân trang sẵn)
  const paginatedDishes = filteredDishes;

  // Lấy totalPages từ Redux state nếu có, fallback về tính từ items
  const { totalRecords } = useAppSelector((state) => state.dishes);
  const totalPages =
    totalRecords && totalRecords > 0
      ? Math.ceil(totalRecords / itemsPerPage)
      : Math.ceil(dishes.length / itemsPerPage);

  /**
   * ✅ Helper: Lấy giá tốt nhất (thấp nhất) từ danh sách khuyến mãi
   *
   * BE đã tính toán sẵn giá giảm qua API GET /api/DishPromotions
   * FE chỉ cần lấy giá thấp nhất từ các discountedPrice mà BE đã tính
   *
   * @param dishId - ID của món ăn
   * @returns { originalPrice, bestPrice, hasDiscount }
   */
  const getBestPriceForDish = (dishId: number, fallbackPrice: number) => {
    const relatedPromotions = dishPromotions.filter(
      (dp) => dp.dishId === dishId
    );

    if (relatedPromotions.length === 0) {
      return {
        originalPrice: fallbackPrice,
        bestPrice: fallbackPrice,
        hasDiscount: false,
      };
    }

    // Lấy giá gốc từ promotion đầu tiên (tất cả promotion cùng món có giá gốc giống nhau)
    const originalPrice = relatedPromotions[0].originalPrice || fallbackPrice;

    // Tìm giá tốt nhất (thấp nhất) từ các discountedPrice mà BE đã tính sẵn
    const bestPrice = Math.min(
      ...relatedPromotions.map((dp) => dp.discountedPrice || originalPrice)
    );

    return {
      originalPrice,
      bestPrice,
      hasDiscount: bestPrice < originalPrice,
    };
  };

  return (
    <Box className={styles.productPage}>
      <Card className={styles.card}>
        <CardContent>
          <Box className={styles.header}>
            <Typography variant="h6">{t("title")}</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenModal()}
              fullWidth={isMobile}
            >
              {t("add")}
            </Button>
          </Box>

          <Box className={styles.filter}>
            <TextField
              label={t("search")}
              variant="outlined"
              size="small"
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.searchInput}
              fullWidth={isMobile}
            />
            <TextField
              label={t("category_label")}
              select
              size="small"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.categorySelect}
              fullWidth={isMobile}
            >
              <MenuItem value="All">{t("category_all")}</MenuItem>
              <MenuItem value="ThucAn">{t("category.ThucAn")}</MenuItem>
              <MenuItem value="NuocUong">{t("category.NuocUong")}</MenuItem>
              <MenuItem value="ThucAnThem">{t("category.ThucAnThem")}</MenuItem>
            </TextField>
          </Box>

          {loading ? (
            <CircularProgress />
          ) : isMobile ? (
            <>
              <Box sx={{ display: "grid", gap: 2 }}>
                {paginatedDishes.map((dish) => {
                  // ✅ Lấy giá tốt nhất từ BE (đã tính sẵn)
                  const { originalPrice, bestPrice, hasDiscount } =
                    getBestPriceForDish(dish.id, dish.price);

                  return (
                    <Card key={dish.id} variant="outlined">
                      <CardContent>
                        <Box sx={{ display: "flex", gap: 2 }}>
                          <Box>
                            {dish.imageUrl ? (
                              <Image
                                src={dish.imageUrl}
                                alt={dish.name}
                                width={96}
                                height={96}
                                style={{ objectFit: "cover", borderRadius: 8 }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  width: 96,
                                  height: 96,
                                  bgcolor: "#f5f5f5",
                                  borderRadius: 1,
                                }}
                              />
                            )}
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="subtitle1"
                              fontWeight={600}
                              noWrap
                            >
                              {dish.name}
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                flexWrap: "wrap",
                                mt: 0.5,
                              }}
                            >
                              <Chip
                                label={t(`category.${dish.category}`)}
                                size="small"
                                variant="outlined"
                              />
                              <Chip
                                label={
                                  dish.isActive
                                    ? t("status.selling")
                                    : t("status.out")
                                }
                                size="small"
                                color={dish.isActive ? "success" : "default"}
                                variant={dish.isActive ? "filled" : "outlined"}
                              />
                            </Box>
                            <Box sx={{ mt: 1 }}>
                              {hasDiscount ? (
                                <>
                                  <Typography
                                    sx={{
                                      textDecoration: "line-through",
                                      color: "#999",
                                    }}
                                  >
                                    {originalPrice.toLocaleString()}đ
                                  </Typography>
                                  <Typography color="error" fontWeight={700}>
                                    {bestPrice.toLocaleString()}đ
                                  </Typography>
                                </>
                              ) : (
                                <Typography fontWeight={700}>
                                  {originalPrice.toLocaleString()}đ
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Box>
                        <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleOpenModal(dish)}
                            startIcon={<EditIcon />}
                            fullWidth
                          >
                            {t("edit")}
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleOpenVoucherModal(dish)}
                            startIcon={<LocalOfferIcon />}
                            fullWidth
                          >
                            {t("voucher")}
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            variant="contained"
                            onClick={() => handleClickDelete(dish.id)}
                            startIcon={<DeleteIcon />}
                            fullWidth
                          >
                            {t("delete")}
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>

              <Box display="flex" justifyContent="center" mt={2}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(_, page) => setCurrentPage(page)}
                  color="primary"
                />
              </Box>
            </>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t("col_name")}</TableCell>
                      <TableCell>{t("col_price")}</TableCell>
                      <TableCell>{t("col_category")}</TableCell>
                      <TableCell>{t("col_status")}</TableCell>
                      <TableCell>{t("col_image")}</TableCell>
                      <TableCell>{t("col_actions")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedDishes.map((dish) => {
                      // ✅ Lấy giá tốt nhất từ BE (đã tính sẵn)
                      const { originalPrice, bestPrice, hasDiscount } =
                        getBestPriceForDish(dish.id, dish.price);

                      return (
                        <TableRow key={dish.id}>
                          <TableCell>{dish.name}</TableCell>
                          <TableCell>
                            {/* ✅ Hiển thị giá từ BE - không cần tính toán */}
                            {hasDiscount ? (
                              <>
                                <div
                                  style={{
                                    textDecoration: "line-through",
                                    color: "#999",
                                  }}
                                >
                                  {originalPrice.toLocaleString()}đ
                                </div>
                                <div
                                  style={{
                                    color: "#d32f2f",
                                    fontWeight: 600,
                                  }}
                                >
                                  {bestPrice.toLocaleString()}đ
                                </div>
                              </>
                            ) : (
                              <>{originalPrice.toLocaleString()}đ</>
                            )}
                          </TableCell>
                          <TableCell>
                            {t(`category.${dish.category}`)}
                          </TableCell>
                          <TableCell>
                            <Typography
                              className={
                                dish.isActive
                                  ? styles.statusActive
                                  : styles.statusInactive
                              }
                            >
                              {dish.isActive
                                ? t("status.selling")
                                : t("status.out")}
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
                              <Typography>{t("no_image_text")}</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <IconButton onClick={() => handleOpenModal(dish)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              title={t("assign_voucher_btn_title")}
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
                      );
                    })}
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
          {editingDish
            ? t("update_dish_dialog_title")
            : t("add_dish_dialog_title")}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label={t("name_label")}
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              fullWidth
            />
            <TextField
              label={t("price_label")}
              type="number"
              value={formData.price}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, price: e.target.value }))
              }
              fullWidth
              inputProps={{ min: 0 }}
            />
            <TextField
              label={t("category_label")}
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
              <MenuItem value="ThucAn">{t("category.ThucAn")}</MenuItem>
              <MenuItem value="NuocUong">{t("category.NuocUong")}</MenuItem>
              <MenuItem value="ThucAnThem">{t("category.ThucAnThem")}</MenuItem>
            </TextField>

            <TextField
              label={t("description_label")}
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              fullWidth
              multiline
              minRows={3}
            />

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
                {formData.isActive ? t("status.selling") : t("status.out")}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={2}>
              <Button variant="outlined" component="label">
                {file ? t("change_image") : t("choose_image")}
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
          <Button onClick={handleCloseModal}>{t("cancel")}</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingDish ? t("update_btn") : t("add_btn")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog xác nhận xóa */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>{t("confirm_delete_title")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t("confirm_delete_text")}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>
            {t("cancel")}
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDelete}
          >
            {t("delete")}
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
        <DialogTitle>{t("assign_voucher_title")}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label={t("dish_label")}
              value={voucherDish?.name || ""}
              fullWidth
              disabled
            />

            {voucherDish &&
              (() => {
                const related = dishPromotions.filter(
                  (dp) => dp.dishId === voucherDish.id
                );
                if (related.length === 0) return null;
                return (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      {t("voucher_applied_title")}
                    </Typography>
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      {related.map((rp) => {
                        const promoInfo =
                          rp.promotion ||
                          promotions?.find((p) => p.id === rp.promotionId);
                        const disc = Number(promoInfo?.discountValue);
                        const hasDisc = Number.isFinite(disc) && disc > 0;
                        const suffix = promoInfo
                          ? promoInfo.discountType === "percent"
                            ? hasDisc
                              ? ` (${disc}%)`
                              : ""
                            : hasDisc
                            ? ` (${disc.toLocaleString()}đ)`
                            : ""
                          : "";
                        const label = promoInfo
                          ? `${
                              promoInfo.title ?? `KM #${rp.promotionId}`
                            }${suffix}`
                          : `ID ${rp.promotionId}`;
                        return (
                          <Box
                            key={rp.id}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 1,
                            }}
                          >
                            <Chip
                              label={label}
                              size="small"
                              variant="outlined"
                            />
                            <Button
                              color="error"
                              size="small"
                              sx={{ textTransform: "none", px: 0 }}
                              onClick={() => handleRemoveVoucherItem(rp.id)}
                            >
                              Hủy voucher
                            </Button>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                );
              })()}

            <TextField
              label={t("choose_promotion_label")}
              select
              value={selectedPromotionId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const v = e.target.value;
                setSelectedPromotionId(v === "" ? "" : Number(v));
              }}
              fullWidth
            >
              <MenuItem value="">{t("voucher_select")}</MenuItem>
              {filteredPromotions
                .filter(
                  (p) =>
                    !(
                      voucherDish &&
                      dishPromotions.some(
                        (dp) =>
                          dp.dishId === voucherDish.id &&
                          dp.promotionId === p.id
                      )
                    )
                )
                .map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.title}
                  </MenuItem>
                ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseVoucherModal}>{t("cancel")}</Button>
          <Button
            variant="contained"
            onClick={handleAddVoucher}
            disabled={
              !Array.isArray(promotions) ||
              promotions.length === 0 ||
              selectedPromotionId === ""
            }
          >
            {t("assign_btn")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductPage;
