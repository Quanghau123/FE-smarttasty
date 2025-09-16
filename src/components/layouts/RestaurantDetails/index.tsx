"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { Box, CircularProgress, Typography, Chip } from "@mui/material";
import Image from "next/image";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { fetchRestaurantById } from "@/redux/slices/restaurantSlice";
import { fetchDishes } from "@/redux/slices/dishSlide";
import styles from "./styles.module.scss";

const RestaurantDetailPage = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();

  const {
    current: restaurant,
    loading: restaurantLoading,
    error: restaurantError,
  } = useAppSelector((state) => state.restaurant);
  const { items: dishes, loading: dishesLoading } = useAppSelector(
    (state) => state.dishes
  );

  useEffect(() => {
    if (!id) return;
    dispatch(fetchRestaurantById(Number(id)));
    dispatch(fetchDishes(Number(id)));
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

  const now = new Date();
  const [openHour, openMinute] = restaurant.openTime.split(":").map(Number);
  const [closeHour, closeMinute] = restaurant.closeTime.split(":").map(Number);
  const openDate = new Date(now);
  openDate.setHours(openHour, openMinute, 0, 0);
  const closeDate = new Date(now);
  closeDate.setHours(closeHour, closeMinute, 0, 0);
  if (closeDate <= openDate) closeDate.setDate(closeDate.getDate() + 1);
  const isOpen = now >= openDate && now <= closeDate;

  return (
    <Box className={styles.container}>
      {/* Thông tin nhà hàng */}
      <Box className={styles.restaurantCard}>
        <Box className={styles.restaurantImage}>
          <Image
            src={restaurant.imageUrl}
            alt={restaurant.name}
            width={300}
            height={200}
          />
        </Box>
        <Box className={styles.restaurantInfo}>
          <Typography variant="h4">{restaurant.name}</Typography>
          {restaurant.description && (
            <Typography>
              <strong>Mô tả:</strong> {restaurant.description}
            </Typography>
          )}
          <Typography>
            <strong>Địa chỉ:</strong> {restaurant.address}
          </Typography>
          <Typography>
            <strong>Trạng thái:</strong>{" "}
            <span className={isOpen ? styles.open : styles.closed}>
              {isOpen ? "Đang mở cửa" : "Đóng cửa"}
            </span>
          </Typography>
          <Typography>
            <strong>Giờ hoạt động:</strong> {restaurant.openTime} -{" "}
            {restaurant.closeTime}
          </Typography>
        </Box>
      </Box>

      {/* Thực đơn */}
      <Box className={styles.menuSection}>
        <Typography variant="h5">Thực đơn</Typography>
        {dishes.length === 0 ? (
          <Typography>Chưa có món ăn nào.</Typography>
        ) : (
          <Box className={styles.dishGrid}>
            {dishes.map((dish) => (
              <Box key={dish.id} className={styles.dishCard}>
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
                        className={styles.chip}
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
    </Box>
  );
};

export default RestaurantDetailPage;
