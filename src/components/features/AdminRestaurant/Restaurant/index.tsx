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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
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
import { getAccessToken } from "@/lib/utils/tokenHelper";
import StarIcon from "@mui/icons-material/Star";
import { fetchFavoritesByRestaurant } from "@/redux/slices/favoritesSlice";
import {
  getReviewsByRestaurant,
  deleteReview,
} from "@/redux/slices/reviewSlice";
import ReviewList from "@/components/features/Review/ReviewList";
// import { Description } from "@mui/icons-material");

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

  // Favorites for this restaurant (followers)
  const { favorites: restaurantFavorites = [] } = useAppSelector(
    (state) => state.favorites
  );

  // Total reviews from state
  const totalReviewsFromState = useAppSelector(
    (state) => state.restaurant.currentTotalReviews ?? 0
  );

  // Reviews for this restaurant
  const { reviews = [], loading: reviewLoading } = useAppSelector(
    (state) => state.review
  );

  const [isEditing, setIsEditing] = useState(false);
  const isMobile = useMediaQuery("(max-width:600px)");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<number | null>(null);

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
      // Load favorites for this restaurant
      dispatch(fetchFavoritesByRestaurant(restaurantInfo.id));
      // Load reviews for this restaurant
      dispatch(getReviewsByRestaurant(restaurantInfo.id));

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

  /**
   * ✅ Lấy giá tốt nhất từ BE - KHÔNG tự tính toán!
   * BE đã tính sẵn giá giảm trong discountedPrice
   * FE chỉ cần lấy giá thấp nhất từ các promotion
   */
  const bestDiscountByDishId = useMemo(() => {
    const map = new Map<number, number>();

    for (const dish of dishes) {
      const originalPrice = dish.price;
      const relatedPromotions = dishPromotions.filter(
        (p) => p.dishId === dish.id
      );

      if (relatedPromotions.length === 0) continue;

      // ✅ Tìm giá thấp nhất từ discountedPrice mà BE đã tính sẵn
      const bestPrice = Math.min(
        ...relatedPromotions.map((p) => p.discountedPrice || originalPrice)
      );

      if (bestPrice < originalPrice) {
        map.set(dish.id, bestPrice);
      }
    }

    return map;
  }, [dishes, dishPromotions]);

  // Handle delete review
  const handleDeleteReview = async (reviewId: number) => {
    setReviewToDelete(reviewId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteReview = async () => {
    if (!reviewToDelete) return;

    try {
      await dispatch(deleteReview(reviewToDelete)).unwrap();
      toast.success("Đã xóa đánh giá thành công!");
      // Refresh reviews after deletion
      if (restaurantInfo?.id) {
        dispatch(getReviewsByRestaurant(restaurantInfo.id));
      }
    } catch (error) {
      toast.error("Không thể xóa đánh giá. Vui lòng thử lại.");
      console.error("Delete review error:", error);
    } finally {
      setDeleteDialogOpen(false);
      setReviewToDelete(null);
    }
  };

  const cancelDeleteReview = () => {
    setDeleteDialogOpen(false);
    setReviewToDelete(null);
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
                  <strong>Địa chỉ:</strong> {restaurantInfo.address}
                </Typography>
                {restaurantInfo.description && (
                  <Typography variant="body2" sx={{ mb: 1.5 }}>
                    {restaurantInfo.description}
                  </Typography>
                )}

                {/* Operating Hours and Status */}
                <Typography sx={{ mb: 1 }}>
                  <strong>Trạng thái:</strong>{" "}
                  {(() => {
                    const parseHHMM = (v?: string): [number, number] | null => {
                      if (v && v.includes(":")) {
                        const [h, m] = v.split(":");
                        const hh = Number(h);
                        const mm = Number(m);
                        if (Number.isFinite(hh) && Number.isFinite(mm)) {
                          return [hh, mm];
                        }
                      }
                      return null;
                    };

                    const now = new Date();
                    const open = parseHHMM(restaurantInfo.openTime);
                    const close = parseHHMM(restaurantInfo.closeTime);

                    if (!open || !close) {
                      return <span style={{ color: "#666" }}>Không rõ</span>;
                    }

                    const [openHour, openMinute] = open;
                    const [closeHour, closeMinute] = close;
                    const openDate = new Date(now);
                    openDate.setHours(openHour, openMinute, 0, 0);
                    const closeDate = new Date(now);
                    closeDate.setHours(closeHour, closeMinute, 0, 0);
                    if (closeDate <= openDate)
                      closeDate.setDate(closeDate.getDate() + 1);
                    return now >= openDate && now <= closeDate ? (
                      <span style={{ color: "green" }}>Đang mở cửa</span>
                    ) : (
                      <span style={{ color: "red" }}>Đã đóng cửa</span>
                    );
                  })()}
                </Typography>

                <Typography sx={{ mb: 1 }}>
                  <strong>Giờ hoạt động:</strong> {restaurantInfo.openTime} -{" "}
                  {restaurantInfo.closeTime}
                </Typography>

                {/* Followers Count */}
                <Typography sx={{ mb: 1 }}>
                  <strong>Số người theo dõi:</strong>{" "}
                  {restaurantFavorites?.length ?? 0}
                </Typography>

                {/* Rating with Stars */}
                <Box
                  display="flex"
                  alignItems="center"
                  gap={0.5}
                  sx={{ mb: 1.5 }}
                >
                  <strong>Đánh giá:</strong>
                  {Array.from({ length: 5 }).map((_, idx) => {
                    const avgRating =
                      (restaurantInfo as unknown as { averageRating?: number })
                        ?.averageRating ?? 0;
                    return (
                      <StarIcon
                        key={idx}
                        fontSize="small"
                        color={
                          idx < Math.round(avgRating) ? "warning" : "disabled"
                        }
                      />
                    );
                  })}
                  <Typography variant="body2" color="error" sx={{ ml: 0.5 }}>
                    {(
                      (restaurantInfo as unknown as { averageRating?: number })
                        ?.averageRating ?? 0
                    ).toFixed(1)}{" "}
                    ({totalReviewsFromState.toLocaleString()} đánh giá)
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} alignItems="center">
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
      <Box display="flex" justifyContent="center">
        {dishLoading ? (
          <CircularProgress />
        ) : dishes.length === 0 ? (
          <Typography>Chưa có món ăn nào.</Typography>
        ) : (
          (() => {
            // Xác định số món tối đa trên 1 hàng dựa vào màn hình
            //const isMobile = useMediaQuery("(max-width:600px)");
            const itemsPerRow = isMobile ? 2 : 4;

            // Số món còn lại ở hàng cuối
            const remainder = dishes.length % itemsPerRow;

            // Nếu hàng cuối còn lẻ, căn trái, các hàng đầy căn giữa
            return (
              <Grid
                container
                spacing={{ xs: 1.5, md: 2 }}
                justifyContent={remainder === 0 ? "center" : "flex-start"}
              >
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
                      sx={{
                        display: "flex",
                        justifyContent: "center", // card luôn căn giữa trong cột
                      }}
                    >
                      <DishCard
                        dish={dish}
                        discountedPrice={discounted ?? null}
                      />
                    </Grid>
                  );
                })}
              </Grid>
            );
          })()
        )}
      </Box>

      {/* Đánh giá của khách hàng */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
          Đánh giá từ khách hàng
        </Typography>
        {reviewLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : reviews.length === 0 ? (
          <Paper elevation={2} sx={{ p: 3, textAlign: "center" }}>
            <Typography color="text.secondary">
              Chưa có đánh giá nào cho nhà hàng này.
            </Typography>
          </Paper>
        ) : (
          <ReviewList
            reviews={reviews}
            loading={reviewLoading}
            onDelete={handleDeleteReview}
            showDeleteButton={true}
          />
        )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={cancelDeleteReview}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Xác nhận xóa đánh giá
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn
            tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDeleteReview} color="inherit">
            Hủy
          </Button>
          <Button
            onClick={confirmDeleteReview}
            color="error"
            variant="contained"
            autoFocus
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RestaurantPage;
