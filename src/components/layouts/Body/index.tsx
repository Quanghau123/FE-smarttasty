"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Paper,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { fetchRestaurants } from "@/redux/slices/restaurantSlice";
import { fetchAllPromotions } from "@/redux/slices/promotionSlice";
import StarIcon from "@mui/icons-material/Star";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useRouter } from "next/navigation";
import styles from "./styles.module.scss";
import dayjs from "dayjs";
import { Promotion } from "@/types/promotion";

const BodyPage = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const {
    restaurants,
    loading: restLoading,
    error,
  } = useAppSelector((state) => state.restaurant);
  const {
    promotions,
    loading: promoLoading,
    error: promoError,
  } = useAppSelector((state) => state.promotion);

  // Load danh sách nhà hàng khi mở trang
  useEffect(() => {
    dispatch(fetchRestaurants());
    dispatch(fetchAllPromotions());
  }, [dispatch]);

  // Lọc nhà hàng đề xuất: từ 4 sao trở lên
  const visibleRestaurants = useMemo(() => {
    return restaurants.filter((restaurant) => {
      const avg = restaurant.averageRating ?? restaurant.rating ?? 0;
      return avg >= 4;
    });
  }, [restaurants]);

  // Ref và hàm scroll cho danh sách đề xuất (1 hàng, kéo ngang)
  const suggestedRef = useRef<HTMLDivElement | null>(null);
  const scrollSuggested = (direction: "left" | "right") => {
    const el = suggestedRef.current;
    if (!el) return;
    const amount = Math.floor(el.clientWidth * 0.85);
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  // Ref + scroll cho danh sách khuyến mãi (1 hàng, kéo ngang)
  const promotionsRef = useRef<HTMLDivElement | null>(null);
  const scrollPromotions = (direction: "left" | "right") => {
    const el = promotionsRef.current;
    if (!el) return;
    const amount = Math.floor(el.clientWidth * 0.85);
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  // Hàm render danh sách nhà hàng (có thể bật nhãn 'Được đề xuất')
  // Card dùng chung cho cả 2 section
  const renderRestaurantCard = (
    restaurant: (typeof restaurants)[number],
    showSuggestedBadge: boolean
  ) => (
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

          {/* Rating + tổng sao */}
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
  );

  const renderRestaurants = (
    list: typeof restaurants,
    showSuggestedBadge: boolean = false
  ) => (
    <Grid container spacing={{ xs: 1, sm: 2, md: 2 }}>
      {list.map((restaurant) => (
        <Grid
          item
          xs={6}
          sm={6}
          md={4}
          lg={3}
          key={restaurant.id}
          component={"div" as React.ElementType}
        >
          {renderRestaurantCard(restaurant, showSuggestedBadge)}
        </Grid>
      ))}
    </Grid>
  );

  // Hiển thị danh sách đề xuất theo dạng 1 hàng kéo ngang cho gọn
  const renderSuggestedCarousel = () => (
    <Box position="relative">
      <Grid
        ref={suggestedRef}
        container
        spacing={{ xs: 1, sm: 2, md: 2 }}
        sx={{
          flexWrap: "nowrap",
          overflowX: "auto",
          scrollBehavior: "smooth",
          // Thêm khoảng “đệm” hai bên để item đầu/cuối không dính sát lề
          px: { xs: 1, sm: 2 },
          py: 0,
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {visibleRestaurants.map((restaurant) => (
          <Grid
            item
            xs={6}
            sm={6}
            md={4}
            lg={3}
            key={restaurant.id}
            component={"div" as React.ElementType}
            sx={{ flex: "0 0 auto" }}
          >
            {renderRestaurantCard(restaurant, true)}
          </Grid>
        ))}
      </Grid>
      <IconButton
        onClick={() => scrollSuggested("left")}
        sx={{
          position: "absolute",
          top: "50%",
          left: 8,
          transform: "translateY(-50%)",
          bgcolor: "background.paper",
          boxShadow: 2,
          "&:hover": { bgcolor: "background.paper" },
        }}
        size="small"
        aria-label="scroll-left"
      >
        <ChevronLeftIcon />
      </IconButton>
      <IconButton
        onClick={() => scrollSuggested("right")}
        sx={{
          position: "absolute",
          top: "50%",
          right: 8,
          transform: "translateY(-50%)",
          bgcolor: "background.paper",
          boxShadow: 2,
          "&:hover": { bgcolor: "background.paper" },
        }}
        size="small"
        aria-label="scroll-right"
      >
        <ChevronRightIcon />
      </IconButton>
    </Box>
  );

  // --- Promotion helpers/UI ---

  const renderPromotionCard = (p: Promotion) => (
    <Card
      className={styles.card}
      sx={{
        height: "100%",
        minHeight: 200,
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": { transform: "translateY(-4px)", boxShadow: 4 },
      }}
    >
      {/* Image area similar to restaurant card */}
      {p.imageUrl ? (
        <Box sx={{ position: "relative" }}>
          <Box
            component="img"
            src={p.imageUrl}
            alt={p.title}
            sx={{
              width: "100%",
              height: { xs: 140, sm: 160, md: 180 },
              objectFit: "cover",
              borderTopLeftRadius: "4px",
              borderTopRightRadius: "4px",
            }}
          />
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
            Khuyến mãi
          </Box>
          {p.discountValue != null && (
            <Box
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                bgcolor: "rgba(255,255,255,0.9)",
                color: "error.main",
                px: 1,
                py: 0.25,
                borderRadius: 1,
                fontSize: 12,
                fontWeight: 800,
                border: "1px solid",
                borderColor: "error.main",
              }}
            >
              {p.discountType === "percent"
                ? `${Number(p.discountValue)}%`
                : `${Number(p.discountValue).toLocaleString()}đ`}
            </Box>
          )}
        </Box>
      ) : (
        <Box sx={{ position: "relative" }}>
          <Box
            sx={{
              width: "100%",
              height: { xs: 140, sm: 160, md: 180 },
              backgroundColor: "#f5f5f5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderTopLeftRadius: "4px",
              borderTopRightRadius: "4px",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Không có ảnh khuyến mãi
            </Typography>
          </Box>
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
            Khuyến mãi
          </Box>
        </Box>
      )}

      <CardContent
        sx={{ pt: 2, flexGrow: 1, display: "flex", flexDirection: "column" }}
      >
        {/* 1) Tên nhà hàng */}
        <Typography
          variant="subtitle1"
          fontWeight={700}
          noWrap
          title={p.restaurant?.name ?? `#${p.restaurantId}`}
          gutterBottom
        >
          {p.restaurant?.name ?? `#${p.restaurantId}`}
        </Typography>

        {/* 2) Tiêu đề khuyến mãi to và nổi bật ngay dưới tên nhà hàng */}
        <Typography
          variant="h6"
          fontWeight={800}
          sx={{
            lineHeight: 1.25,
            mb: 1,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: 22,
          }}
        >
          {p.title}
        </Typography>

        {/* Spacer to push details to bottom when title is short, making card heights consistent */}
        <Box sx={{ flexGrow: 1 }} />

        {/* 3) Thời gian hiệu lực */}
        <Typography variant="body2" color="text.secondary">
          Áp dụng đến{" "}
          {dayjs(p.endDate).isValid()
            ? dayjs(p.endDate).format("DD/MM/YYYY")
            : "khi có thông báo mới"}
        </Typography>
      </CardContent>

      <Box sx={{ p: 2, pt: 0 }}>
        <Button
          variant="outlined"
          color="primary"
          fullWidth
          size="small"
          onClick={() => router.push(`/RestaurantDetails/${p.restaurantId}`)}
        >
          Xem ưu đãi
        </Button>
      </Box>
    </Card>
  );

  const renderPromotionsCarousel = () => (
    <Box position="relative">
      <Grid
        ref={promotionsRef}
        container
        spacing={{ xs: 1, sm: 2, md: 2 }}
        sx={{
          flexWrap: "nowrap",
          overflowX: "auto",
          scrollBehavior: "smooth",
          // Thêm khoảng “đệm” hai bên để item đầu/cuối không dính sát lề
          px: { xs: 1, sm: 2 },
          py: 0,
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {promotions.map((p) => (
          <Grid
            item
            xs={6}
            sm={6}
            md={4}
            lg={3}
            key={p.id}
            component={"div" as React.ElementType}
            sx={{ flex: "0 0 auto" }}
          >
            {renderPromotionCard(p)}
          </Grid>
        ))}
      </Grid>

      <IconButton
        onClick={() => scrollPromotions("left")}
        sx={{
          position: "absolute",
          top: "50%",
          left: 8,
          transform: "translateY(-50%)",
          bgcolor: "background.paper",
          boxShadow: 2,
          "&:hover": { bgcolor: "background.paper" },
        }}
        size="small"
        aria-label="scroll-left-promotions"
      >
        <ChevronLeftIcon />
      </IconButton>
      <IconButton
        onClick={() => scrollPromotions("right")}
        sx={{
          position: "absolute",
          top: "50%",
          right: 8,
          transform: "translateY(-50%)",
          bgcolor: "background.paper",
          boxShadow: 2,
          "&:hover": { bgcolor: "background.paper" },
        }}
        size="small"
        aria-label="scroll-right-promotions"
      >
        <ChevronRightIcon />
      </IconButton>
    </Box>
  );

  return (
    <Box
      p={{ xs: 1, sm: 2, md: 3 }}
      sx={{
        maxWidth: 1440,
        margin: "0 auto",
      }}
    >
      {restLoading ? (
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
        <>
          {/* Khuyến mãi - tất cả, dạng 1 hàng kéo ngang */}
          <Paper sx={{ p: { xs: 1, sm: 2 }, mb: 4, borderRadius: 2 }}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={1}
            >
              <Typography variant="h5" fontWeight={700}>
                Ưu đãi hiện có trên SmartTasty
              </Typography>
              {promoLoading && <CircularProgress size={18} />}
            </Box>
            {promoError ? (
              <Alert severity="warning">{promoError}</Alert>
            ) : promotions.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Chưa có khuyến mãi.
              </Typography>
            ) : (
              renderPromotionsCarousel()
            )}
          </Paper>

          {visibleRestaurants.length > 0 && (
            <Paper sx={{ p: { xs: 1, sm: 2 }, mb: 4, borderRadius: 2 }}>
              <Typography variant="h5" fontWeight={700} mb={1}>
                Nhà hàng được đề xuất
              </Typography>
              {renderSuggestedCarousel()}
            </Paper>
          )}

          <Paper sx={{ p: { xs: 1, sm: 2 }, borderRadius: 2 }}>
            <Typography variant="h5" fontWeight={700} mb={2}>
              Tất cả nhà hàng
            </Typography>
            {renderRestaurants(restaurants, false)}
          </Paper>
        </>
      )}
    </Box>
  );
};

export default BodyPage;
