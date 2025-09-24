"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  CircularProgress,
  Typography,
  Chip,
  useTheme,
} from "@mui/material";
import Image from "next/image";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { fetchRestaurantById } from "@/redux/slices/restaurantSlice";
import { fetchDishes } from "@/redux/slices/dishSlide";
import { getReviewsByRestaurant } from "@/redux/slices/reviewSlice";
import styles from "./styles.module.scss";
import ReviewForm from "@/components/features/Review/ReviewForm";
import ReviewList from "@/components/features/Review/ReviewList";
import ReservationForm from "@/components/features/Reservation";
import StarIcon from "@mui/icons-material/Star";

const RestaurantDetailPage = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const theme = useTheme();

  // Restaurant
  const {
    current: restaurant,
    loading: restaurantLoading,
    error: restaurantError,
  } = useAppSelector((state) => state.restaurant);

  // Dishes
  const { items: dishes, loading: dishesLoading } = useAppSelector(
    (state) => state.dishes
  );

  // Reviews
  const {
    reviews = [],
    loading: reviewLoading,
    error: reviewError,
  } = useAppSelector((state) => state.review);

  useEffect(() => {
    if (!id) return;
    dispatch(fetchRestaurantById(Number(id)));
    dispatch(fetchDishes(Number(id)));
    dispatch(getReviewsByRestaurant(Number(id)));
  }, [dispatch, id]);

  if (restaurantLoading || dishesLoading)
    return (
      <Box className={styles.centered}>
        <CircularProgress />
      </Box>
    );

  if (restaurantError || !restaurant)
    return (
      <Box className={styles.centered}>
        <Typography variant="h5">
          {restaurantError || "Không tìm thấy nhà hàng"}
        </Typography>
      </Box>
    );

  // Tính trung bình và tổng lượt đánh giá
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;
  const totalReviews = reviews.length;

  return (
    <Box className={styles.container}>
      {/* Bên trái */}
      <Box className={styles.leftContent}>
        {/* Thông tin nhà hàng */}
        <Box
          className={styles.restaurantCard}
          sx={{
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            borderRadius: 2,
            p: 2,
          }}
        >
          <Box className={styles.restaurantImage}>
            <Image src={restaurant.imageUrl} alt={restaurant.name} fill />
          </Box>

          <Box className={styles.restaurantInfo} sx={{ mt: 2 }}>
            <Typography variant="h4">{restaurant.name}</Typography>

            {/* Mô tả */}
            {restaurant.description && (
              <Typography sx={{ mt: 1 }}>
                <strong>Mô tả:</strong> {restaurant.description}
              </Typography>
            )}

            {/* Địa chỉ */}
            <Typography sx={{ mt: 1 }}>
              <strong>Địa chỉ:</strong> {restaurant.address}
            </Typography>

            {/* Trạng thái mở cửa */}
            <Typography sx={{ mt: 1 }}>
              <strong>Trạng thái:</strong>{" "}
              {(() => {
                const now = new Date();
                const [openHour, openMinute] = restaurant.openTime
                  .split(":")
                  .map(Number);
                const [closeHour, closeMinute] = restaurant.closeTime
                  .split(":")
                  .map(Number);

                const openDate = new Date(now);
                openDate.setHours(openHour, openMinute, 0, 0);

                const closeDate = new Date(now);
                closeDate.setHours(closeHour, closeMinute, 0, 0);

                if (closeDate <= openDate)
                  closeDate.setDate(closeDate.getDate() + 1);

                return now >= openDate && now <= closeDate ? (
                  <span style={{ color: "green" }}>Đang mở cửa</span>
                ) : (
                  <span style={{ color: "red" }}>Đóng cửa</span>
                );
              })()}
            </Typography>

            {/* Giờ hoạt động */}
            <Typography sx={{ mt: 1 }}>
              <strong>Giờ hoạt động:</strong> {restaurant.openTime} -{" "}
              {restaurant.closeTime}
            </Typography>

            {/* Đánh giá trung bình */}
            <Box display="flex" alignItems="center" gap={0.2} sx={{ mt: 1 }}>
              <strong>Đánh giá:</strong>
              {Array.from({ length: 5 }).map((_, idx) => (
                <StarIcon
                  key={idx}
                  fontSize="small"
                  color={idx < Math.round(avgRating) ? "warning" : "disabled"}
                />
              ))}
              <Typography variant="body2" color="error" sx={{ ml: 0.5 }}>
                {avgRating.toFixed(1)} ({totalReviews.toLocaleString()} Đánh
                Giá)
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Thực đơn */}
        <Box
          className={styles.menuSection}
          sx={{
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            borderRadius: 2,
            p: 2,
            mt: 3,
          }}
        >
          <Typography variant="h5">Thực đơn</Typography>
          {dishes.length === 0 ? (
            <Typography>Chưa có món ăn nào.</Typography>
          ) : (
            <Box className={styles.dishGrid}>
              {dishes.map((dish) => (
                <Box
                  key={dish.id}
                  className={styles.dishCard}
                  sx={{
                    backgroundColor: theme.palette.background.default,
                    color: theme.palette.text.primary,  
                    borderRadius: 2,
                    p: 2,         
                  }}
                >
                  <Box className={styles.dishImage}>
                    <Image
                      src={dish.imageUrl}
                      alt={dish.name}
                      width={300}
                      height={160}
                    />
                  </Box>
                  <Box className={styles.dishInfo}>
                    <Typography variant="h6">
                      {dish.name}
                      {!dish.isActive && (
                        <Chip
                          label="Ngưng bán"
                          size="small"
                          sx={{
                            ml: 1,
                            backgroundColor: theme.palette.error.main,
                            color: theme.palette.error.contrastText,
                          }}
                        />
                      )}
                    </Typography>
                    <Typography className={styles.price}>
                      {dish.price.toLocaleString()}đ
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Khu vực đánh giá */}
        <Box sx={{ display: "flex", gap: 3, mt: 3 }}>
          {/* Review List bên trái */}
          <Box sx={{ flex: 2 }}>
            <ReviewList
              reviews={reviews}
              loading={reviewLoading}
              error={reviewError}
            />
          </Box>

          {/* Review Form bên phải */}
          <Box sx={{ flex: 1 }}>
            <ReviewForm />
          </Box>
        </Box>
      </Box>

      {/* Bên phải: Form đặt bàn */}
      <Box className={styles.rightContent}>
        <ReservationForm restaurantId={restaurant.id} />
      </Box>
    </Box>
  );
};

export default RestaurantDetailPage;
