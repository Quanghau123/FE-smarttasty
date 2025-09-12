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
  ButtonBase,
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

  useEffect(() => {
    dispatch(fetchRestaurants());
  }, [dispatch]);

  const renderRestaurants = () => (
    <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
      {restaurants.map((restaurant) => (
        <Grid
          item
          xs={4} // Mobile: full width
          sm={6} // Tablet: 2 cột
          md={4} // Desktop nhỏ: 3 cột
          lg={3} // Desktop lớn: 4 cột
          key={restaurant.id}
        >
          <Card
            className={styles.card}
            sx={{ height: "100%", display: "flex", flexDirection: "column" }}
          >
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
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                gutterBottom
                noWrap
                title={restaurant.name}
                component={ButtonBase}
                onClick={() =>
                  router.push(`/RestaurantDetails/${restaurant.id}`)
                }
                sx={{ textAlign: "left", width: "100%" }}
              >
                {restaurant.name}
              </Typography>

              <Box display="flex" alignItems="center" mb={1}>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <StarIcon
                    key={idx}
                    fontSize="small"
                    color={
                      idx < (restaurant as any).rating ? "warning" : "disabled"
                    }
                  />
                ))}
              </Box>

              <Typography
                variant="body2"
                color="text.secondary"
                noWrap
                title={restaurant.address}
                mb={1}
              >
                {restaurant.address}
              </Typography>

              <Button
                variant="outlined"
                color="primary"
                fullWidth
                size="small"
                onClick={() =>
                  router.push(`/RestaurantDetails/${restaurant.id}`)
                }
              >
                Đặt chỗ ngay
              </Button>
            </CardContent>
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
