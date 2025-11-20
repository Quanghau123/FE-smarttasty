"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Box,
  Button,
  Paper,
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
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        pt: 0,
        pb: { xs: 2, sm: 3, md: 4 },
        px: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: "1600px", mx: "auto" }}>
        {/* Restaurant Info Card */}
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2.5, sm: 3, md: 4 },
            mb: 4,
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          {/* Header with Edit Button */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
              pb: 2,
              borderBottom: "2px solid",
              borderColor: "divider",
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontSize: { xs: "1.25rem", sm: "1.5rem" },
                fontWeight: 700,
                color: "text.primary",
              }}
            >
              Thông tin nhà hàng
            </Typography>
            {!isEditing && (
              <Button
                variant="contained"
                onClick={() => setIsEditing(true)}
                sx={{
                  px: 3,
                  py: 1,
                  fontSize: "0.938rem",
                  fontWeight: 600,
                  textTransform: "none",
                  boxShadow: 2,
                }}
              >
                Chỉnh sửa
              </Button>
            )}
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: { xs: 2.5, sm: 3, md: 4 },
              alignItems: "stretch",
              flexDirection: { xs: "column", md: "row" },
            }}
          >
            {/* Restaurant Image */}
            <Box
              sx={{
                width: { xs: "100%", md: 350 },
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  height: { xs: 220, sm: 280, md: 300 },
                  borderRadius: 2,
                  overflow: "hidden",
                  boxShadow: 3,
                  border: "3px solid",
                  borderColor: "divider",
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
                  sx={{
                    mt: 2,
                    py: 1.5,
                    fontWeight: 600,
                    borderWidth: 2,
                    "&:hover": {
                      borderWidth: 2,
                    },
                  }}
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

            {/* Restaurant Details */}
            <Box
              flex={1}
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minWidth: 0,
              }}
            >
              <Box>
                {isEditing ? (
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <TextField
                      fullWidth
                      label="Tên nhà hàng"
                      value={formState.name}
                      onChange={(e) =>
                        setFormState({ ...formState, name: e.target.value })
                      }
                      size="medium"
                      sx={{ "& .MuiInputBase-root": { fontSize: "1rem" } }}
                    />
                    <TextField
                      fullWidth
                      label="Địa chỉ"
                      value={formState.address}
                      onChange={(e) =>
                        setFormState({ ...formState, address: e.target.value })
                      }
                      size="medium"
                    />
                    <TextField
                      fullWidth
                      label="Mô tả"
                      value={formState.description}
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          description: e.target.value,
                        })
                      }
                      multiline
                      minRows={3}
                      size="medium"
                    />

                    <Box
                      sx={{
                        display: "flex",
                        gap: 2,
                        flexDirection: { xs: "column", sm: "row" },
                      }}
                    >
                      <TextField
                        label="Giờ mở cửa"
                        value={formState.openTime}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            openTime: e.target.value,
                          })
                        }
                        fullWidth
                        size="medium"
                      />
                      <TextField
                        label="Giờ đóng cửa"
                        value={formState.closeTime}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            closeTime: e.target.value,
                          })
                        }
                        fullWidth
                        size="medium"
                      />
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Typography
                      variant="h4"
                      gutterBottom
                      sx={{
                        fontSize: {
                          xs: "1.5rem",
                          sm: "1.75rem",
                          md: "2.125rem",
                        },
                        fontWeight: 700,
                        color: "text.primary",
                        mb: 2,
                        wordBreak: "break-word",
                      }}
                    >
                      {restaurantInfo.name}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.5,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 1,
                        }}
                      >
                        <Typography
                          component="span"
                          sx={{
                            fontWeight: 700,
                            minWidth: { xs: "110px", sm: "140px" },
                            color: "text.secondary",
                            fontSize: { xs: "0.938rem", sm: "1rem" },
                          }}
                        >
                          Địa chỉ:
                        </Typography>
                        <Typography
                          sx={{
                            flex: 1,
                            fontSize: { xs: "0.938rem", sm: "1rem" },
                          }}
                        >
                          {restaurantInfo.address}
                        </Typography>
                      </Box>

                      {restaurantInfo.description && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 1,
                          }}
                        >
                          <Typography
                            component="span"
                            sx={{
                              fontWeight: 700,
                              minWidth: { xs: "110px", sm: "140px" },
                              color: "text.secondary",
                              fontSize: { xs: "0.938rem", sm: "1rem" },
                            }}
                          >
                            Mô tả:
                          </Typography>
                          <Typography
                            sx={{
                              flex: 1,
                              fontSize: { xs: "0.938rem", sm: "1rem" },
                              color: "text.secondary",
                            }}
                          >
                            {restaurantInfo.description}
                          </Typography>
                        </Box>
                      )}

                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography
                          component="span"
                          sx={{
                            fontWeight: 700,
                            minWidth: { xs: "110px", sm: "140px" },
                            color: "text.secondary",
                            fontSize: { xs: "0.938rem", sm: "1rem" },
                          }}
                        >
                          Trạng thái:
                        </Typography>
                        {(() => {
                          const parseHHMM = (
                            v?: string
                          ): [number, number] | null => {
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
                            return (
                              <Chip
                                label="Không rõ"
                                size="small"
                                sx={{ bgcolor: "grey.300" }}
                              />
                            );
                          }

                          const [openHour, openMinute] = open;
                          const [closeHour, closeMinute] = close;
                          const openDate = new Date(now);
                          openDate.setHours(openHour, openMinute, 0, 0);
                          const closeDate = new Date(now);
                          closeDate.setHours(closeHour, closeMinute, 0, 0);
                          if (closeDate <= openDate)
                            closeDate.setDate(closeDate.getDate() + 1);

                          const isOpen = now >= openDate && now <= closeDate;
                          return (
                            <Chip
                              label={isOpen ? "Đang mở cửa" : "Đã đóng cửa"}
                              color={isOpen ? "success" : "error"}
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          );
                        })()}
                      </Box>

                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography
                          component="span"
                          sx={{
                            fontWeight: 700,
                            minWidth: { xs: "110px", sm: "140px" },
                            color: "text.secondary",
                            fontSize: { xs: "0.938rem", sm: "1rem" },
                          }}
                        >
                          Giờ hoạt động:
                        </Typography>
                        <Typography
                          sx={{ fontSize: { xs: "0.938rem", sm: "1rem" } }}
                        >
                          {restaurantInfo.openTime} - {restaurantInfo.closeTime}
                        </Typography>
                      </Box>

                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography
                          component="span"
                          sx={{
                            fontWeight: 700,
                            minWidth: { xs: "110px", sm: "140px" },
                            color: "text.secondary",
                            fontSize: { xs: "0.938rem", sm: "1rem" },
                          }}
                        >
                          Người theo dõi:
                        </Typography>
                        <Chip
                          label={`${restaurantFavorites?.length ?? 0} người`}
                          color="primary"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>

                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography
                          component="span"
                          sx={{
                            fontWeight: 700,
                            minWidth: { xs: "110px", sm: "140px" },
                            color: "text.secondary",
                            fontSize: { xs: "0.938rem", sm: "1rem" },
                          }}
                        >
                          Đánh giá:
                        </Typography>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          {Array.from({ length: 5 }).map((_, idx) => {
                            const avgRating =
                              (
                                restaurantInfo as unknown as {
                                  averageRating?: number;
                                }
                              )?.averageRating ?? 0;
                            return (
                              <StarIcon
                                key={idx}
                                fontSize="small"
                                sx={{
                                  color:
                                    idx < Math.round(avgRating)
                                      ? "warning.main"
                                      : "grey.300",
                                }}
                              />
                            );
                          })}
                          <Typography
                            variant="body2"
                            sx={{
                              ml: 0.5,
                              fontWeight: 600,
                              fontSize: { xs: "0.875rem", sm: "0.938rem" },
                            }}
                          >
                            {(
                              (
                                restaurantInfo as unknown as {
                                  averageRating?: number;
                                }
                              )?.averageRating ?? 0
                            ).toFixed(1)}{" "}
                            {(totalReviewsFromState ?? 0) > 0 && (
                              <Typography
                                component="span"
                                color="text.secondary"
                                sx={{
                                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                }}
                              >
                                ({(totalReviewsFromState ?? 0).toLocaleString()}{" "}
                                đánh giá)
                              </Typography>
                            )}
                          </Typography>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mt: 0.5,
                        }}
                      >
                        {(() => {
                          const ri = restaurantInfo as unknown as {
                            isVerified?: boolean;
                          };
                          return ri.isVerified ? (
                            <Chip
                              label="✓ Đã xác thực"
                              color="success"
                              size="medium"
                              sx={{ fontWeight: 600 }}
                            />
                          ) : null;
                        })()}
                      </Box>
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Action Buttons */}
              {isEditing && (
                <Box
                  sx={{
                    mt: 3,
                    pt: 2,
                    borderTop: "2px solid",
                    borderColor: "divider",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      flexDirection: { xs: "column", sm: "row" },
                    }}
                  >
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth={isMobile}
                      onClick={handleUpdate}
                      sx={{
                        py: 1.5,
                        fontSize: "1rem",
                        fontWeight: 600,
                        textTransform: "none",
                        boxShadow: 2,
                      }}
                    >
                      Lưu thay đổi
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      fullWidth={isMobile}
                      onClick={handleCancelEdit}
                      sx={{
                        py: 1.5,
                        fontSize: "1rem",
                        fontWeight: 600,
                        textTransform: "none",
                        borderWidth: 2,
                        "&:hover": {
                          borderWidth: 2,
                        },
                      }}
                    >
                      Huỷ
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Paper>

        {/* Menu Section */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              mb: 3,
              fontSize: { xs: "1.25rem", sm: "1.5rem" },
              fontWeight: 700,
            }}
          >
            Thực đơn
          </Typography>

          {dishLoading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : dishes.length === 0 ? (
            <Paper
              elevation={2}
              sx={{
                p: 4,
                textAlign: "center",
                bgcolor: "background.paper",
                borderRadius: 2,
              }}
            >
              <Typography color="text.secondary">
                Chưa có món ăn nào.
              </Typography>
            </Paper>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: { xs: 2, sm: 2.5, md: 3 },
              }}
            >
              {dishes.map((dish) => {
                const discounted = bestDiscountByDishId.get(dish.id) ?? null;

                return (
                  <Box
                    key={dish.id}
                    sx={{
                      // Responsive columns: 1 / 2 / 3 / 4 / 5 (xl)
                      flex: {
                        xs: "1 1 100%",
                        sm: "1 1 calc(50% - 10px)",
                        md: "1 1 calc(33.333% - 16px)",
                        lg: "1 1 calc(25% - 19px)",
                        xl: "1 1 calc(20% - 22px)",
                      },
                      // Allow items to shrink enough for 5 columns on wide screens
                      minWidth: { xs: "100%", sm: "220px", md: "200px" },
                      maxWidth: {
                        xs: "100%",
                        sm: "calc(50% - 10px)",
                        md: "calc(33.333% - 16px)",
                        lg: "calc(25% - 19px)",
                        xl: "calc(20% - 22px)",
                      },
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <DishCard
                      dish={dish}
                      discountedPrice={discounted ?? null}
                    />
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        {/* Reviews Section */}
        <Box>
          {reviewLoading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : reviews.length === 0 ? (
            <Paper
              elevation={2}
              sx={{
                p: 4,
                textAlign: "center",
                bgcolor: "background.paper",
                borderRadius: 2,
              }}
            >
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
          PaperProps={{
            sx: {
              borderRadius: 2,
              minWidth: { xs: "90%", sm: 400 },
            },
          }}
        >
          <DialogTitle
            id="delete-dialog-title"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "1.125rem", sm: "1.25rem" },
            }}
          >
            Xác nhận xóa đánh giá
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="delete-dialog-description">
              Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể
              hoàn tác.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, gap: 1 }}>
            <Button
              onClick={cancelDeleteReview}
              color="inherit"
              sx={{
                px: 3,
                py: 1,
                fontWeight: 600,
                textTransform: "none",
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={confirmDeleteReview}
              color="error"
              variant="contained"
              autoFocus
              sx={{
                px: 3,
                py: 1,
                fontWeight: 600,
                textTransform: "none",
                boxShadow: 2,
              }}
            >
              Xóa
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default RestaurantPage;
