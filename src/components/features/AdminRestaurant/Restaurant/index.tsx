"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Box,
  Button,
  Grid,
  Paper,
  Card,
  Stack,
  Typography,
  Chip,
  CircularProgress,
  TextField,
} from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import DishCard from "@/components/features/AdminRestaurant/Dish";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import {
  fetchRestaurantByOwner,
  clearCurrentRestaurant,
  updateRestaurant,
} from "@/redux/slices/restaurantSlice";
import { fetchDishes } from "@/redux/slices/dishSlide";
import { fetchDishPromotions } from "@/redux/slices/dishPromotionSlice"; // ✅ lấy tất cả KM món
import type { DishPromotion } from "@/types/dishpromotion";
import { getAccessToken } from "@/lib/utils/tokenHelper";
// import { Description } from "@mui/icons-material";

const RestaurantPage = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { current: restaurantInfo, loading: restaurantLoading } =
    useAppSelector((state) => state.restaurant);
  const { items: dishes, loading: dishLoading } = useAppSelector(
    (state) => state.dishes
  );

  // ✅ danh sách DishPromotions toàn trang (id, dishId, promotionId, discountType, discountValue, ...)
  const { items: dishPromotions } = useAppSelector(
    (state) => state.dishpromotion
  );

  const [isEditing, setIsEditing] = useState(false);
  const isMobile = useMediaQuery("(max-width:600px)");

  const [formState, setFormState] = useState({
    name: "",
    address: "",
    description: "",
    openTime: "",
    closeTime: "",

    file: null as File | null,
  });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const token = getAccessToken();
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
      dispatch(fetchDishes(restaurantInfo.id));
      // ✅ lấy toàn bộ khuyến mãi món để tính giá hiển thị
      dispatch(fetchDishPromotions());

      setFormState({
        name: restaurantInfo.name || "",
        address: restaurantInfo.address || "",
        description: restaurantInfo.description || "",
        openTime: restaurantInfo.openTime || "",
        closeTime: restaurantInfo.closeTime || "",
        file: null,
      });
    }
  }, [restaurantInfo, dispatch]);

  const handleUpdate = async () => {
    if (!restaurantInfo) return;

    const token = getAccessToken();
    if (!token) {
      toast.error("Không tìm thấy token, vui lòng đăng nhập lại.");
      return;
    }

    const formPayload = {
      ...restaurantInfo,
      name: formState.name,
      address: formState.address,
      description: formState.description,
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
      description: restaurantInfo.description || "",
      openTime: restaurantInfo.openTime || "",
      closeTime: restaurantInfo.closeTime || "",
      file: null,
    });
    setIsEditing(false);
  };

  // helper: tính giá sau giảm theo 1 record KM
  const computeDiscountedPrice = (
    orig: number,
    discountType?: string,
    discountValue?: number
  ) => {
    if (!discountType) return orig;
    if (discountType === "percent") {
      const pct = Number(discountValue) || 0;
      const safePct = Math.max(0, Math.min(100, pct)); // đề phòng dữ liệu sai
      return Math.max(0, Math.round(orig * (1 - safePct / 100)));
    }
    if (discountType === "fixed_amount") {
      const amt = Number(discountValue) || 0;
      return Math.max(0, orig - amt);
    }
    return orig;
  };

  // memo: map dishId -> best discounted price (chọn giá thấp nhất nếu có nhiều KM)
  const bestDiscountByDishId = useMemo(() => {
    type DishPromotionFlat = DishPromotion & {
      discountType?: "percent" | "fixed_amount";
      discountValue?: number;
    };

    const getDiscount = (dp: DishPromotionFlat) => ({
      type: dp.promotion?.discountType ?? dp.discountType,
      value: dp.promotion?.discountValue ?? dp.discountValue,
    });

    const map = new Map<number, number>();
    for (const dish of dishes) {
      const orig = dish.price;
      const related = dishPromotions.filter((p) => p.dishId === dish.id);
      if (related.length === 0) continue;

      let best = orig;
      for (const p of related) {
        const { type, value } = getDiscount(p as DishPromotionFlat);
        const after = computeDiscountedPrice(orig, type, Number(value));
        if (after < best) best = after;
      }
      if (best < orig) map.set(dish.id, best);
    }
    return map;
  }, [dishes, dishPromotions]);

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
    // remove top padding so layout sits directly under header
    <Box sx={{ pt: 0, px: { xs: 2, md: 4 }, pb: 4 }}>
      <Card
        elevation={3}
        sx={{
          display: "flex",
          gap: { xs: 2, md: 4 },
          p: { xs: 2, md: 3 },
          mb: 4,
          alignItems: "stretch",
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        <Box sx={{ width: { xs: "100%", sm: 300 }, flexShrink: 0 }}>
          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: { xs: 180, sm: 200 },
              borderRadius: 2,
              overflow: "hidden",
              boxShadow: 1,
            }}
          >
            <Image
              src={
                formState.file
                  ? URL.createObjectURL(formState.file)
                  : restaurantInfo.imageUrl ||
                    `https://res.cloudinary.com/djcur1ymq/image/upload/${restaurantInfo.imagePublicId}`
              }
              alt="Ảnh nhà hàng"
              fill
              style={{ objectFit: "cover" }}
            />
          </Box>
          {isEditing && (
            <Button
              fullWidth
              variant="outlined"
              component="label"
              sx={{ mt: 1 }}
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

        <Box
          flex={1}
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Box>
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
                  label="Mô tả"
                  value={formState.description}
                  onChange={(e) =>
                    setFormState({ ...formState, description: e.target.value })
                  }
                  margin="normal"
                  multiline
                  minRows={3}
                />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label="Giờ mở cửa"
                    value={formState.openTime}
                    onChange={(e) =>
                      setFormState({ ...formState, openTime: e.target.value })
                    }
                    margin="normal"
                    fullWidth
                  />
                  <TextField
                    label="Giờ đóng cửa"
                    value={formState.closeTime}
                    onChange={(e) =>
                      setFormState({ ...formState, closeTime: e.target.value })
                    }
                    margin="normal"
                    fullWidth
                  />
                </Stack>
              </>
            ) : (
              <>
                <Typography
                  variant={isMobile ? "h5" : "h4"}
                  gutterBottom
                  sx={{ wordBreak: "break-word" }}
                >
                  {restaurantInfo.name}
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 1 }}>
                  {restaurantInfo.address}
                </Typography>
                {restaurantInfo.description && (
                  <Typography variant="body2" sx={{ mb: 1.5 }}>
                    {restaurantInfo.description}
                  </Typography>
                )}

                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    label={`Giờ: ${restaurantInfo.openTime} - ${restaurantInfo.closeTime}`}
                    size="small"
                  />
                  {(() => {
                    const ri = restaurantInfo as unknown as {
                      isVerified?: boolean;
                    };
                    return ri.isVerified ? (
                      <Chip label="Đã xác thực" color="success" size="small" />
                    ) : null;
                  })()}
                </Stack>
              </>
            )}
          </Box>

          <Box sx={{ mt: 2 }}>
            {isEditing ? (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth={isMobile}
                  onClick={handleUpdate}
                >
                  Lưu thay đổi
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  fullWidth={isMobile}
                  onClick={handleCancelEdit}
                >
                  Huỷ
                </Button>
              </Stack>
            ) : (
              <Button
                variant="contained"
                fullWidth={isMobile}
                onClick={() => setIsEditing(true)}
                sx={{ mt: 1 }}
              >
                Sửa nhà hàng
              </Button>
            )}
          </Box>
        </Box>
      </Card>

      {/* Thực đơn */}
      <Box>
        {dishLoading ? (
          <CircularProgress />
        ) : dishes.length === 0 ? (
          <Typography>Chưa có món ăn nào.</Typography>
        ) : (
          <Grid container spacing={{ xs: 1.5, md: 2 }} justifyContent="center">
            {dishes.map((dish) => {
              const discounted = bestDiscountByDishId.get(dish.id) ?? null;

              return (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={3}
                  lg={3}
                  key={dish.id}
                  component={"div" as React.ElementType}
                  sx={{ display: "flex", justifyContent: "center" }}
                >
                  <DishCard dish={dish} discountedPrice={discounted ?? null} />
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default RestaurantPage;
