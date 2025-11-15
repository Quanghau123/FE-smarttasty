"use client";

import React, { useEffect } from "react";
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
import StarIcon from "@mui/icons-material/Star";
// Chevron icons not used in search results (kept in Body for carousels)
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { searchRestaurants } from "@/redux/slices/restaurantSlice";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "@/components/layouts/Body/styles.module.scss";
import { Restaurant } from "@/types/restaurant";

const SearchResults: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const params = useSearchParams();
  const q = params?.get("q") ?? "";

  const {
    restaurants = [],
    loading,
    error,
  } = useAppSelector((s) => s.restaurant);

  useEffect(() => {
    if (q && q.trim().length > 0) dispatch(searchRestaurants(q));
  }, [dispatch, q]);

  const renderRestaurantCard = (
    restaurant: Restaurant,
    showSuggestedBadge: boolean = false
  ) => (
    <Card
      className={styles.card}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": { transform: "translateY(-4px)", boxShadow: 4 },
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
        {restaurant.imageUrl ? (
          <Box sx={{ position: "relative" }}>
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
            {showSuggestedBadge && (
              <Box
                sx={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  bgcolor: "error.main",
                  color: "#fff",
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  fontSize: 12,
                  fontWeight: 700,
                  boxShadow: 1,
                }}
              >
                Được đề xuất
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ position: "relative" }}>
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
            {showSuggestedBadge && (
              <Box
                sx={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  bgcolor: "error.main",
                  color: "#fff",
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  fontSize: 12,
                  fontWeight: 700,
                  boxShadow: 1,
                }}
              >
                Được đề xuất
              </Box>
            )}
          </Box>
        )}

        <CardContent sx={{ flexGrow: 1, width: "100%" }}>
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            gutterBottom
            noWrap
            title={restaurant.name}
          >
            {restaurant.name}
          </Typography>

          <Box display="flex" alignItems="center" mb={1}>
            {(() => {
              const avg = restaurant.averageRating ?? restaurant.rating ?? 0;
              return (
                <>
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <StarIcon
                      key={idx}
                      fontSize="small"
                      color={idx < avg ? "warning" : "disabled"}
                    />
                  ))}
                  <Typography variant="body2" color="text.secondary" ml={0.5}>
                    {avg ? avg.toFixed(1) : "0.0"}
                  </Typography>
                </>
              );
            })()}
          </Box>

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
          Xem chi tiết
        </Button>
      </Box>
    </Card>
  );

  const renderRestaurants = (list: Restaurant[]) => (
    <Grid container spacing={{ xs: 1, sm: 2, md: 2 }}>
      {list.map((r) => (
        <Grid
          item
          xs={6}
          sm={6}
          md={4}
          lg={3}
          key={r.id}
          component={"div" as React.ElementType}
        >
          {renderRestaurantCard(r)}
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Box sx={{ px: { xs: 1, md: 3 }, py: 3 }}>
      <Typography variant="h5" fontWeight={700} mb={2}>
        {`Kết quả tìm kiếm cho "${q}"`}
      </Typography>

      {loading && (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && restaurants.length === 0 && (
        <Alert severity="info">Không tìm thấy nhà hàng liên quan.</Alert>
      )}

      {!loading && !error && restaurants.length > 0 && (
        <Box>{renderRestaurants(restaurants)}</Box>
      )}
    </Box>
  );
};

export default SearchResults;
