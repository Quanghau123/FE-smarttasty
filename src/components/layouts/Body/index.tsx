"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  fetchRestaurants,
  searchRestaurants,
} from "@/redux/slices/restaurantSlice";
import { fetchAllPromotions } from "@/redux/slices/promotionSlice";
import { fetchAllRecipes } from "@/redux/slices/recipesSlice";
import { fetchRecipeReviews } from "@/redux/slices/recipeReviewsSlice";
import { Recipe } from "@/types/recipes";
import StarIcon from "@mui/icons-material/Star";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./styles.module.scss";
import Image from "next/image";
import banerV2 from "../../../assets/Image/SlideHeader/banerV2.png";
import HopTac from "../../../assets/Image/SlideHeader/hoptac.png";
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
  const { allItems: allRecipes = [], loading: recipesLoading } = useAppSelector(
    (state) => state.recipes
  );
  const { reviews: recipeReviews = [] } = useAppSelector(
    (state) => state.recipeReviews
  );
  const {
    promotions,
    loading: promoLoading,
    error: promoError,
  } = useAppSelector((state) => state.promotion);

  const searchParams = useSearchParams();
  const q = searchParams?.get("q") ?? "";

  // Load danh sách nhà hàng khi mở trang
  useEffect(() => {
    if (q && q.trim().length > 0) {
      dispatch(searchRestaurants(q));
    } else {
      dispatch(fetchRestaurants());
    }

    dispatch(fetchAllPromotions());
    // Load recipes and their reviews so we can show top-rated recipes on the home page
    dispatch(fetchAllRecipes());
    dispatch(fetchRecipeReviews());
  }, [dispatch, q]);

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

  // Promotion arrows visibility state
  const [promotionsOverflow, setPromotionsOverflow] = useState(false);
  const [promotionsCanScrollLeft, setPromotionsCanScrollLeft] = useState(false);
  const [promotionsCanScrollRight, setPromotionsCanScrollRight] =
    useState(false);

  useEffect(() => {
    const el = promotionsRef.current;
    if (!el) return;
    const update = () => {
      // allow a small epsilon to avoid off-by-1
      const overflow = el.scrollWidth > el.clientWidth + 1;
      setPromotionsOverflow(overflow);
      setPromotionsCanScrollLeft(el.scrollLeft > 5);
      setPromotionsCanScrollRight(
        el.scrollLeft + el.clientWidth < el.scrollWidth - 5
      );
    };
    update();
    el.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [promotions]);

  // Top recipes (>= 4★) carousel
  const recipesRef = useRef<HTMLDivElement | null>(null);
  const scrollRecipes = (direction: "left" | "right") => {
    const el = recipesRef.current;
    if (!el) return;
    const amount = Math.floor(el.clientWidth * 0.85);
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  // Recipes arrows visibility state
  const [recipesOverflow, setRecipesOverflow] = useState(false);
  const [recipesCanScrollLeft, setRecipesCanScrollLeft] = useState(false);
  const [recipesCanScrollRight, setRecipesCanScrollRight] = useState(false);

  useEffect(() => {
    const el = recipesRef.current;
    if (!el) return;
    const update = () => {
      const overflow = el.scrollWidth > el.clientWidth + 1;
      setRecipesOverflow(overflow);
      setRecipesCanScrollLeft(el.scrollLeft > 5);
      setRecipesCanScrollRight(
        el.scrollLeft + el.clientWidth < el.scrollWidth - 5
      );
    };
    update();
    el.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [allRecipes, recipeReviews]);

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
          {/* {p.discountValue != null && (
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
          )} */}
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

  // --- Top recipes helpers ---
  type EnrichedRecipe = Recipe & {
    averageRating?: number;
    totalReviews?: number;
  };

  const topRecipes = useMemo(() => {
    if (!Array.isArray(allRecipes) || allRecipes.length === 0)
      return [] as Recipe[];

    // Compute average rating for each recipe from recipeReviews
    const byId = new Map<number, { sum: number; cnt: number }>();
    recipeReviews.forEach((r) => {
      const cur = byId.get(r.recipeId) ?? { sum: 0, cnt: 0 };
      cur.sum += r.rating ?? 0;
      cur.cnt += 1;
      byId.set(r.recipeId, cur);
    });

    const enriched: EnrichedRecipe[] = allRecipes.map((rec) => {
      const stats = byId.get(rec.id);
      const avg = stats && stats.cnt > 0 ? stats.sum / stats.cnt : 0;
      return {
        ...rec,
        averageRating: avg,
        totalReviews: stats?.cnt ?? 0,
      } as EnrichedRecipe;
    });

    return enriched
      .filter((r: EnrichedRecipe) => (r.averageRating ?? 0) >= 4)
      .sort(
        (a: EnrichedRecipe, b: EnrichedRecipe) =>
          (b.averageRating ?? 0) - (a.averageRating ?? 0)
      )
      .slice(0, 8);
  }, [allRecipes, recipeReviews]);

  const renderRecipeCard = (recipe: EnrichedRecipe) => (
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
        onClick={() => router.push(`/recipes`)}
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          cursor: "pointer",
        }}
      >
        {recipe.imageUrl ? (
          <Box sx={{ position: "relative" }}>
            <Box
              component="img"
              src={recipe.imageUrl}
              alt={recipe.title}
              sx={{
                width: "100%",
                height: { xs: 120, sm: 140, md: 160 },
                objectFit: "cover",
              }}
            />
          </Box>
        ) : (
          <Box
            sx={{
              width: "100%",
              height: { xs: 120, sm: 140, md: 160 },
              backgroundColor: "#f5f5f5",
            }}
          />
        )}

        <CardContent sx={{ flexGrow: 1, width: "100%" }}>
          <Typography
            variant="subtitle1"
            fontWeight="700"
            gutterBottom
            noWrap
            title={recipe.title}
          >
            {recipe.title}
          </Typography>

          <Box display="flex" alignItems="center" mb={1}>
            {Array.from({ length: 5 }).map((_, idx) => (
              <StarIcon
                key={idx}
                fontSize="small"
                color={
                  idx < Math.round(recipe.averageRating ?? 0)
                    ? "warning"
                    : "disabled"
                }
              />
            ))}
            <Typography variant="body2" color="text.secondary" ml={0.5}>
              {(recipe.averageRating ?? 0).toFixed(1)} (
              {recipe.totalReviews ?? 0})
            </Typography>
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: 36,
            }}
          >
            {recipe.description || "Không có mô tả"}
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
            router.push(`/recipes`);
          }}
        >
          Xem công thức
        </Button>
      </Box>
    </Card>
  );

  const renderTopRecipesCarousel = () => (
    <Box position="relative">
      <Grid
        ref={recipesRef}
        container
        spacing={{ xs: 1, sm: 2, md: 2 }}
        sx={{
          flexWrap: "nowrap",
          overflowX: "auto",
          scrollBehavior: "smooth",
          px: { xs: 1, sm: 2 },
          py: 0,
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {topRecipes.map((r) => (
          <Grid
            item
            xs={6}
            sm={6}
            md={4}
            lg={3}
            key={r.id}
            component={"div" as React.ElementType}
            sx={{ flex: "0 0 auto" }}
          >
            {renderRecipeCard(r)}
          </Grid>
        ))}
      </Grid>

      <IconButton
        onClick={() => scrollRecipes("left")}
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
        aria-label="scroll-left-recipes"
      >
        <ChevronLeftIcon />
      </IconButton>
      {recipesOverflow && recipesCanScrollLeft && (
        <IconButton
          onClick={() => scrollRecipes("left")}
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
          aria-label="scroll-left-recipes"
        >
          <ChevronLeftIcon />
        </IconButton>
      )}
      {recipesOverflow && recipesCanScrollRight && (
        <IconButton
          onClick={() => scrollRecipes("right")}
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
          aria-label="scroll-right-recipes"
        >
          <ChevronRightIcon />
        </IconButton>
      )}
    </Box>
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

      {promotionsOverflow && promotionsCanScrollLeft && (
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
      )}
      {promotionsOverflow && promotionsCanScrollRight && (
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
      )}
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
          {/* Banner trước phần công thức - sử dụng ảnh banerV2 */}
          <Paper
            sx={{ mb: 4, borderRadius: 3, overflow: "hidden", boxShadow: 3 }}
          >
            <Box
              sx={{
                position: "relative",
                width: "100%",
                height: { xs: 340, sm: 400, md: 480 },
              }}
            >
              <Image
                src={banerV2}
                alt="Banner công thức"
                fill
                sizes="(max-width:600px) 100vw, (max-width:1200px) 100vw, 1200px"
                //  style={{ objectFit: "cover" }}
              />
            </Box>
          </Paper>

          {topRecipes.length > 0 && (
            <Paper sx={{ p: { xs: 1, sm: 2 }, mb: 4, borderRadius: 2 }}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={1}
              >
                <Typography variant="h5" fontWeight={700}>
                  Các công thức nổi bật trên SmartTasty
                </Typography>
                {recipesLoading && <CircularProgress size={18} />}
              </Box>
              {topRecipes.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Chưa có công thức nổi bật.
                </Typography>
              ) : (
                renderTopRecipesCarousel()
              )}
            </Paper>
          )}

          <Paper sx={{ p: { xs: 1, sm: 2 }, borderRadius: 2 }}>
            <Typography variant="h5" fontWeight={700} mb={2}>
              Tất cả nhà hàng
            </Typography>
            {renderRestaurants(restaurants, false)}
          </Paper>

          {/* Hình hợp tác (giống banner) đặt cuối trang */}
          <Paper
            sx={{
              mb: 4,
              mt: 4,
              borderRadius: 3,
              overflow: "hidden",
              boxShadow: 3,
            }}
          >
            <Box
              sx={{
                position: "relative",
                width: "100%",
                height: { xs: 340, sm: 400, md: 580 },
              }}
            >
              <Image
                src={HopTac}
                alt="Đối tác SmartTasty"
                fill
                sizes="(max-width:600px) 100vw, (max-width:1200px) 100vw, 1200px"
              />
            </Box>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default BodyPage;
