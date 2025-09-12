"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Grid,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  TextField,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import {
  fetchRestaurantByOwner,
  clearCurrentRestaurant,
  updateRestaurant,
} from "@/redux/slices/restaurantSlice";
import { fetchDishes } from "@/redux/slices/dishSlide";

const RestaurantPage = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { current: restaurantInfo, loading: restaurantLoading } =
    useAppSelector((state) => state.restaurant);
  const { items: dishes, loading: dishLoading } = useAppSelector(
    (state) => state.dishes
  );

  const [isEditing, setIsEditing] = useState(false);

  const [formState, setFormState] = useState({
    name: "",
    address: "",
    openTime: "",
    closeTime: "",
    file: null as File | null,
  });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");
    const role = userData?.role;

    if (!token || role !== "business") {
      toast.error("Bạn không có quyền truy cập.");
      return;
    }

    dispatch(fetchRestaurantByOwner({ token }));

    return () => {
      dispatch(clearCurrentRestaurant());
    };
  }, [dispatch]);

  useEffect(() => {
    if (restaurantInfo?.id) {
      dispatch(fetchDishes(restaurantInfo.id.toString()));
      setFormState({
        name: restaurantInfo.name || "",
        address: restaurantInfo.address || "",
        openTime: restaurantInfo.openTime || "",
        closeTime: restaurantInfo.closeTime || "",
        file: null,
      });
    }
  }, [restaurantInfo, dispatch]);

  const handleUpdate = async () => {
    if (!restaurantInfo) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Không tìm thấy token, vui lòng đăng nhập lại.");
      return;
    }

    const formPayload = {
      ...restaurantInfo,
      name: formState.name,
      address: formState.address,
      openTime: formState.openTime,
      closeTime: formState.closeTime,
      file: formState.file,
    };

    try {
      await dispatch(
        updateRestaurant({ token, id: restaurantInfo.id, data: formPayload })
      ).unwrap();

      toast.success("Cập nhật nhà hàng thành công!");
      dispatch(fetchRestaurantByOwner({ token }));
      setIsEditing(false);
    } catch {
      toast.error("Cập nhật thất bại.");
    }
  };

  const handleCancelEdit = () => {
    if (!restaurantInfo) return;
    setFormState({
      name: restaurantInfo.name || "",
      address: restaurantInfo.address || "",
      openTime: restaurantInfo.openTime || "",
      closeTime: restaurantInfo.closeTime || "",
      file: null,
    });
    setIsEditing(false);
  };

  if (restaurantLoading) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }

  if (!restaurantInfo) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <Paper elevation={3} sx={{ padding: 4, textAlign: "center" }}>
          <Typography variant="h5" gutterBottom>
            Bạn chưa có nhà hàng
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => router.push("/createrestaurant")}
          >
            Tạo nhà hàng
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Paper elevation={3} sx={{ display: "flex", gap: 4, p: 3, mb: 4 }}>
        <Box>
          <img
            src={
              formState.file
                ? URL.createObjectURL(formState.file)
                : restaurantInfo.imageUrl ||
                  `https://res.cloudinary.com/djcur1ymq/image/upload/${restaurantInfo.imagePublicId}`
            }
            alt="Ảnh nhà hàng"
            style={{
              width: 300,
              height: 200,
              objectFit: "cover",
              borderRadius: 8,
            }}
          />
          {isEditing && (
            <Button
              variant="outlined"
              component="label"
              sx={{ mt: 2 }}
            >
              Chọn ảnh mới
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    file: e.target.files?.[0] || null,
                  })
                }
              />
            </Button>
          )}
        </Box>

        <Box flex={1}>
          {isEditing ? (
            <>
              <TextField
                fullWidth
                label="Tên nhà hàng"
                value={formState.name}
                onChange={(e) =>
                  setFormState({ ...formState, name: e.target.value })
                }
                margin="normal"
              />
              <TextField
                fullWidth
                label="Địa chỉ"
                value={formState.address}
                onChange={(e) =>
                  setFormState({ ...formState, address: e.target.value })
                }
                margin="normal"
              />
              <TextField
                fullWidth
                label="Giờ mở cửa"
                value={formState.openTime}
                onChange={(e) =>
                  setFormState({ ...formState, openTime: e.target.value })
                }
                margin="normal"
              />
              <TextField
                fullWidth
                label="Giờ đóng cửa"
                value={formState.closeTime}
                onChange={(e) =>
                  setFormState({ ...formState, closeTime: e.target.value })
                }
                margin="normal"
              />
              <Box display="flex" gap={2} mt={2}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleUpdate}
                >
                  Lưu thay đổi
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleCancelEdit}
                >
                  Huỷ
                </Button>
              </Box>
            </>
          ) : (
            <>
              <Typography variant="h4">{restaurantInfo.name}</Typography>
              <Typography>
                <strong>Địa chỉ:</strong> {restaurantInfo.address}
              </Typography>
              <Typography>
                <strong>Giờ hoạt động:</strong> {restaurantInfo.openTime} -{" "}
                {restaurantInfo.closeTime}
              </Typography>
              <Button
                variant="outlined"
                onClick={() => setIsEditing(true)}
                sx={{ mt: 2 }}
              >
                Sửa
              </Button>
            </>
          )}
        </Box>
      </Paper>

      {/* Thực đơn */}
      <Box>
        <Typography variant="h5" gutterBottom>
          Thực đơn
        </Typography>
        {dishLoading ? (
          <CircularProgress />
        ) : dishes.length === 0 ? (
          <Typography>Chưa có món ăn nào.</Typography>
        ) : (
          <Grid container spacing={2}>
            {dishes.map((dish) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={dish.id}>
                <Paper elevation={2}>
                  <img
                    src={dish.imageUrl}
                    alt={dish.name}
                    style={{ width: "100%", height: 160, objectFit: "cover" }}
                  />
                  <Box p={2}>
                    <Typography variant="h6">
                      {dish.name}
                      {!dish.isActive && (
                        <Chip
                          label="Ngưng bán"
                          color="error"
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Typography>
                    <Typography fontWeight="bold" color="primary">
                      {dish.price.toLocaleString()}đ
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default RestaurantPage;
