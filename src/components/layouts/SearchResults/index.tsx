"use client";

import React, { useEffect, useRef, useState } from "react";
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
import HorizontalArrows from "@/components/commons/HorizontalArrows";

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

  // Suggested restaurants (4★+), shown in a horizontal carousel
  const visibleRestaurants = restaurants.filter((r) => {
    const avg = r.averageRating ?? r.rating ?? 0;
    return avg >= 4;
  });

  const suggestedRef = useRef<HTMLDivElement | null>(null);
  const [suggestedOverflow, setSuggestedOverflow] = useState(false);
  const [suggestedCanScrollLeft, setSuggestedCanScrollLeft] = useState(false);
  const [suggestedCanScrollRight, setSuggestedCanScrollRight] = useState(false);

  const updateSuggestedState = () => {
    const el = suggestedRef.current;
    if (!el) {
      setSuggestedOverflow(false);
      setSuggestedCanScrollLeft(false);
      setSuggestedCanScrollRight(false);
      return;
    }
    const overflow = el.scrollWidth > el.clientWidth + 1;
    setSuggestedOverflow(overflow);
    setSuggestedCanScrollLeft(el.scrollLeft > 5);
    setSuggestedCanScrollRight(
      el.scrollLeft + el.clientWidth < el.scrollWidth - 5
    );
  };

  const scrollSuggested = (direction: "left" | "right") => {
    const el = suggestedRef.current;
    if (!el) return;
    const amount = Math.floor(el.clientWidth * 0.85);
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const el = suggestedRef.current;
    if (!el) return;
    updateSuggestedState();
    el.addEventListener("scroll", updateSuggestedState);
    window.addEventListener("resize", updateSuggestedState);
    return () => {
      el.removeEventListener("scroll", updateSuggestedState);
      window.removeEventListener("resize", updateSuggestedState);
    };
  }, [visibleRestaurants]);

  useEffect(() => {
    if (q && q.trim().length > 0) dispatch(searchRestaurants(q));
  }, [dispatch, q]);

  const renderRestaurantCard = (
    restaurant: Restaurant,
    showSuggestedBadge: boolean = false
  ) => (
    <Card className={styles.card} sx={{ height: "100%" }}>
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
          <Box className={styles.aspectSquare}>
            <Box
              component="img"
              src={restaurant.imageUrl}
              alt={restaurant.name}
              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
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
          <Box className={styles.aspectSquare}>
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "#f5f5f5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
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

        <CardContent className={styles.cardContentCompact} sx={{ flexGrow: 1 }}>
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            gutterBottom
            className={styles.textClamp}
            sx={{ WebkitLineClamp: 2 }}
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
    <Grid container rowSpacing={2}>
      {list.map((r) => (
        <Grid
          item
          key={r.id}
          component={"div" as React.ElementType}
          sx={{
            flexBasis: { xs: "100%", sm: "50%", md: "33.3333%", lg: "20%" },
            maxWidth: { xs: "100%", sm: "50%", md: "33.3333%", lg: "20%" },
            px: 1,
            boxSizing: "border-box",
          }}
        >
          {renderRestaurantCard(r)}
        </Grid>
      ))}
    </Grid>
  );

  const renderSuggestedCarousel = () => (
    <Box position="relative" mt={4}>
      <Typography variant="h6" fontWeight={700} mb={1}>
        Có thể bạn quan tâm
      </Typography>
      <Grid
        ref={suggestedRef}
        container
        onScroll={() => updateSuggestedState()}
        sx={{
          flexWrap: "nowrap",
          overflowX: "auto",
          scrollBehavior: "smooth",
          px: { xs: 1, sm: 2 },
          py: 1,
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {visibleRestaurants.map((restaurant) => (
          <Grid
            item
            key={restaurant.id}
            component={"div" as React.ElementType}
            sx={{
              flex: "0 0 auto",
              width: { xs: "72%", sm: "50%", md: "33.3333%", lg: "20%" },
              boxSizing: "border-box",
              px: 1,
            }}
          >
            {renderRestaurantCard(restaurant, true)}
          </Grid>
        ))}
      </Grid>

      <HorizontalArrows
        onLeft={() => scrollSuggested("left")}
        onRight={() => scrollSuggested("right")}
        showLeft={suggestedOverflow && suggestedCanScrollLeft}
        showRight={suggestedOverflow && suggestedCanScrollRight}
        leftAria="scroll-left-suggested"
        rightAria="scroll-right-suggested"
      />
    </Box>
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
        <Box>
          {renderRestaurants(restaurants)}
          {visibleRestaurants.length > 0 && renderSuggestedCarousel()}
        </Box>
      )}
    </Box>
  );
};

export default SearchResults;
