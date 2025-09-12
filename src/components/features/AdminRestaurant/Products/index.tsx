"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Switch,
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
  Pagination,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import {
  fetchDishes,
  addDish,
  updateDish,
  deleteDish,
} from "@/redux/slices/dishSlide";
import { fetchRestaurantByOwner } from "@/redux/slices/restaurantSlice";
import { Dish } from "@/types/dish";
import axiosInstance from "@/lib/axios/axiosInstance";
import styles from "./styles.module.scss";
import { toast } from "react-toastify";

const getUserFromLocalStorage = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");
    return { user, token };
  } catch {
    return { user: {}, token: null };
  }
};

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

const ProductPage = () => {
  const dispatch = useAppDispatch();

  // dishes từ redux
  const { items: dishes, loading } = useAppSelector((state) => state.dishes);

  // restaurant từ redux
  const { current: restaurant } = useAppSelector((state) => state.restaurant);

  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [formData, setFormData] = useState<FormState>(defaultForm);
  const [file, setFile] = useState<File | null>(null);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 6;

  // setup token vào axios
  useEffect(() => {
    const { token } = getUserFromLocalStorage();
    if (token) {
      axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
      dispatch(fetchRestaurantByOwner({ token }));
    }
  }, [dispatch]);

  // khi có restaurant -> fetch dishes
  useEffect(() => {
    if (restaurant) {
      if (restaurant.id) {
        setRestaurantId(restaurant.id);
        dispatch(fetchDishes(restaurant.id));
      } else {
        toast.warning("Tài khoản chưa có nhà hàng!");
      }
    }
  }, [restaurant, dispatch]);

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
    setOpen(true);
  };

  const handleCloseModal = () => {
    setOpen(false);
    setEditingDish(null);
    setFormData(defaultForm);
    setFile(null);
  };

  const handleSubmit = async () => {
    if (!restaurantId) {
      toast.error("Thiếu nhà hàng!");
      return;
    }
    if (!formData.name.trim()) {
      toast.warning("Vui lòng nhập tên món");
      return;
    }
    const priceNum = Number(formData.price);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      toast.warning("Giá không hợp lệ");
      return;
    }
    if (!editingDish && !file) {
      toast.warning("Vui lòng tải ảnh món ăn");
      return;
    }

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
        toast.success("Cập nhật món ăn thành công");
      } else {
        await dispatch(addDish(form)).unwrap();
        toast.success("Thêm món ăn thành công");
      }
      handleCloseModal();
      dispatch(fetchDishes(restaurantId));
    } catch {
      toast.error("Thao tác thất bại");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn chắc chắn muốn xoá món ăn này?")) return;
    try {
      await dispatch(deleteDish(id)).unwrap();
      toast.success("Đã xoá món ăn");
      if (restaurantId) dispatch(fetchDishes(restaurantId));
    } catch {
      toast.error("Xoá món ăn thất bại");
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
              className={styles.addBtn}
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
              <TableContainer component={Paper} className={styles.table}>
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
                        <TableCell>{dish.price.toLocaleString()}đ</TableCell>
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
                            <img
                              src={dish.imageUrl}
                              alt={dish.name}
                              className={styles.dishImage}
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
                            color="error"
                            onClick={() => handleDelete(dish.id)}
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
      <Dialog open={open} onClose={handleCloseModal} maxWidth="sm" fullWidth>
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
                <img
                  src={file ? URL.createObjectURL(file) : editingDish?.imageUrl}
                  alt="preview"
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
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
    </Box>
  );
};

export default ProductPage;
