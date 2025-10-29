"use client";

import { useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { fetchRestaurants } from "@/redux/slices/restaurantSlice";
import StarIcon from "@mui/icons-material/Star";
import { useRouter } from "next/navigation";
import styles from "./styles.module.scss";

const BodyPage = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { restaurants, loading, error } = useAppSelector(
    (state) => state.restaurant
  );

  // Load danh sách nhà hàng khi mở trang
  useEffect(() => {
    dispatch(fetchRestaurants());
  }, [dispatch]);

  // Hàm render danh sách nhà hàng
  const renderRestaurants = () => (
    <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
      {restaurants.map((restaurant) => (
        <Grid
          item
          xs={6}
          sm={6}
          md={4}
          lg={3}
          key={restaurant.id}
          component={"div" as React.ElementType}
        >
          <Card
            className={styles.card}
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: 4,
              },
            }}
          >
            <Box
              onClick={() => router.push(`/RestaurantDetails/${restaurant.id}`)}
              sx={{
                display: "flex",
                flexDirection: "column",
                flexGrow: 1,
                cursor: "pointer",
              }}
            >
              {/* Ảnh nhà hàng */}
              {restaurant.imageUrl ? (
                <Box
                  component="img"
                  src={restaurant.imageUrl}
                  alt={restaurant.name}
                  sx={{
                    width: "100%",
                    height: { xs: 150, sm: 180, md: 200 },
                    objectFit: "cover",
                    borderTopLeftRadius: "4px",
                    borderTopRightRadius: "4px",
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: "100%",
                    height: { xs: 150, sm: 180, md: 200 },
                    backgroundColor: "#f5f5f5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderTopLeftRadius: "4px",
                    borderTopRightRadius: "4px",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Chưa có ảnh
                  </Typography>
                </Box>
              )}

              <CardContent sx={{ flexGrow: 1, width: "100%" }}>
                {/* Tên nhà hàng */}
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  gutterBottom
                  noWrap
                  title={restaurant.name}
                >
                  {restaurant.name}
                </Typography>

                {/* Rating */}
                {/* Rating + tổng sao */}
                <Box display="flex" alignItems="center" mb={1}>
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <StarIcon
                      key={idx}
                      fontSize="small"
                      color={
                        idx < (restaurant.rating ?? 0) ? "warning" : "disabled"
                      }
                    />
                  ))}
                  <Typography variant="body2" color="text.secondary" ml={0.5}>
                    {restaurant.rating ? restaurant.rating.toFixed(1) : "0.0"}
                  </Typography>
                </Box>

                {/* Địa chỉ */}
                <Typography
                  variant="body2"
                  color="text.secondary"
                  noWrap
                  title={restaurant.address}
                  mb={1}
                >
                  {restaurant.address || "Đang cập nhật địa chỉ"}
                </Typography>
              </CardContent>
            </Box>

            {/* Button đặt chỗ */}
            <Box sx={{ p: 2, pt: 0 }}>
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/RestaurantDetails/${restaurant.id}`);
                }}
              >
                Đặt chỗ ngay
              </Button>
            </Box>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Box
      p={{ xs: 1, sm: 2, md: 3 }}
      sx={{
        maxWidth: 1440,
        margin: "0 auto",
      }}
    >
      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      ) : restaurants.length === 0 ? (
        <Typography textAlign="center" mt={4}>
          Không có nhà hàng nào.
        </Typography>
      ) : (
        renderRestaurants()
      )}
    </Box>
  );
};

export default BodyPage;
