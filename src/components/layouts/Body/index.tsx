"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Paper,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import {
  fetchRestaurants,
  searchRestaurants,
} from "@/redux/slices/restaurantSlice";
import { fetchAllPromotions } from "@/redux/slices/promotionSlice";
import { fetchDishPromotions } from "@/redux/slices/dishPromotionSlice";
import { fetchAllRecipes } from "@/redux/slices/recipesSlice";
import { fetchRecipeReviews } from "@/redux/slices/recipeReviewsSlice";
import { Recipe } from "@/types/recipes";
import StarIcon from "@mui/icons-material/Star";
// chevron icons are provided inside HorizontalArrows component
import HorizontalArrows from "@/components/commons/HorizontalArrows";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./styles.module.scss";
import Pagination from "@/components/commons/pagination";
import Image from "next/image";
import banerV2 from "../../../assets/Image/SlideHeader/banerV2.png";
import HopTac from "../../../assets/Image/SlideHeader/hoptac.png";
import dayjs from "dayjs";
import { Promotion } from "@/types/promotion";
import { DishPromotion } from "@/types/dishpromotion";

const BodyPage = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  const getMotionProps = (i: number = 0) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.2 },
          transition: { duration: 0.45, delay: i * 0.05 },
        };
  const {
    restaurants,
    loading: restLoading,
    error,
    totalRecords,
  } = useAppSelector((state) => state.restaurant);

  // Current page stored by restaurant slice (server-side pagination)
  const pageNumber = useAppSelector(
    (state) => state.restaurant.pageNumber ?? 1
  );

  // Pagination: use server-side paging via the shared `Pagination` component.
  // Do not keep a separate local `page` state here — rely on the store's
  // `pageNumber` and let the pagination component request data when user
  // changes page.
  const itemsPerPage = 10;
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

  // Load danh sách nhà hàng khi mở trang (initial load / when search changes)
  useEffect(() => {
    if (q && q.trim().length > 0) {
      // Search mode: server returns full list for search endpoint
      dispatch(searchRestaurants(q));
    } else {
      // Fetch paged restaurants from server (initial page = 1)
      dispatch(fetchRestaurants({ pageNumber: 1, pageSize: itemsPerPage }));
    }

    dispatch(fetchAllPromotions());
    dispatch(fetchDishPromotions());
    // Load recipes and their reviews so we can show top-rated recipes on the home page
    dispatch(fetchAllRecipes());
    dispatch(fetchRecipeReviews());
  }, [dispatch, q, itemsPerPage]);

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

  // Suggested arrows visibility state
  const [suggestedOverflow, setSuggestedOverflow] = useState(false);
  const [suggestedCanScrollLeft, setSuggestedCanScrollLeft] = useState(false);
  const [suggestedCanScrollRight, setSuggestedCanScrollRight] = useState(false);

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

  const updatePromotionsState = () => {
    const el = promotionsRef.current;
    if (!el) {
      setPromotionsOverflow(false);
      setPromotionsCanScrollLeft(false);
      setPromotionsCanScrollRight(false);
      return;
    }
    const overflow = el.scrollWidth > el.clientWidth + 1;
    setPromotionsOverflow(overflow);
    setPromotionsCanScrollLeft(el.scrollLeft > 5);
    setPromotionsCanScrollRight(
      el.scrollLeft + el.clientWidth < el.scrollWidth - 5
    );
  };

  // Promotion arrows visibility state
  const [promotionsOverflow, setPromotionsOverflow] = useState(false);
  const [promotionsCanScrollLeft, setPromotionsCanScrollLeft] = useState(false);
  const [promotionsCanScrollRight, setPromotionsCanScrollRight] =
    useState(false);

  useEffect(() => {
    const el = promotionsRef.current;
    if (!el) return;
    updatePromotionsState();
    el.addEventListener("scroll", updatePromotionsState);
    window.addEventListener("resize", updatePromotionsState);
    return () => {
      el.removeEventListener("scroll", updatePromotionsState);
      window.removeEventListener("resize", updatePromotionsState);
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

  const updateRecipesState = () => {
    const el = recipesRef.current;
    if (!el) {
      setRecipesOverflow(false);
      setRecipesCanScrollLeft(false);
      setRecipesCanScrollRight(false);
      return;
    }
    const overflow = el.scrollWidth > el.clientWidth + 1;
    setRecipesOverflow(overflow);
    setRecipesCanScrollLeft(el.scrollLeft > 5);
    setRecipesCanScrollRight(
      el.scrollLeft + el.clientWidth < el.scrollWidth - 5
    );
  };

  // Recipes arrows visibility state
  const [recipesOverflow, setRecipesOverflow] = useState(false);
  const [recipesCanScrollLeft, setRecipesCanScrollLeft] = useState(false);
  const [recipesCanScrollRight, setRecipesCanScrollRight] = useState(false);

  useEffect(() => {
    const el = recipesRef.current;
    if (!el) return;
    updateRecipesState();
    el.addEventListener("scroll", updateRecipesState);
    window.addEventListener("resize", updateRecipesState);
    return () => {
      el.removeEventListener("scroll", updateRecipesState);
      window.removeEventListener("resize", updateRecipesState);
    };
  }, [allRecipes, recipeReviews]);

  // Dish promotions (món đang giảm giá) - ref + scroll giống suggested
  const dishPromotionsRef = useRef<HTMLDivElement | null>(null);
  const scrollDishPromotions = (direction: "left" | "right") => {
    const el = dishPromotionsRef.current;
    if (!el) return;
    const amount = Math.floor(el.clientWidth * 0.85);
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  const updateDishPromotionsState = () => {
    const el = dishPromotionsRef.current;
    if (!el) {
      setDishPromotionsOverflow(false);
      setDishPromotionsCanScrollLeft(false);
      setDishPromotionsCanScrollRight(false);
      return;
    }
    const overflow = el.scrollWidth > el.clientWidth + 1;
    setDishPromotionsOverflow(overflow);
    setDishPromotionsCanScrollLeft(el.scrollLeft > 5);
    setDishPromotionsCanScrollRight(
      el.scrollLeft + el.clientWidth < el.scrollWidth - 5
    );
  };

  const [dishPromotionsOverflow, setDishPromotionsOverflow] = useState(false);
  const [dishPromotionsCanScrollLeft, setDishPromotionsCanScrollLeft] =
    useState(false);
  const [dishPromotionsCanScrollRight, setDishPromotionsCanScrollRight] =
    useState(false);

  // Select dish promotions from redux
  const { items: dishPromotions = [], loading: dishPromotionsLoading } =
    useAppSelector(
      (state) =>
        state.dishpromotion as { items: DishPromotion[]; loading?: boolean }
    );

  useEffect(() => {
    const el = dishPromotionsRef.current;
    if (!el) return;
    updateDishPromotionsState();
    el.addEventListener("scroll", updateDishPromotionsState);
    window.addEventListener("resize", updateDishPromotionsState);
    return () => {
      el.removeEventListener("scroll", updateDishPromotionsState);
      window.removeEventListener("resize", updateDishPromotionsState);
    };
  }, [dishPromotions]);

  // Hàm render danh sách nhà hàng (có thể bật nhãn 'Được đề xuất')
  // Card dùng chung cho cả 2 section
  const renderRestaurantCard = (
    restaurant: (typeof restaurants)[number],
    showSuggestedBadge: boolean,
    index: number = 0
  ) => (
    <motion.div {...getMotionProps(index)}>
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
          {/* Ảnh nhà hàng (bắt buộc 1:1 để giữ layout ổn định) */}
          {restaurant.imageUrl ? (
            <Box className={styles.aspectSquare}>
              <Box
                component="img"
                src={restaurant.imageUrl}
                alt={restaurant.name}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
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

          <CardContent sx={{ flexGrow: 1, width: "100%" }}>
            {/* Tên nhà hàng */}
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              gutterBottom
              className={styles.titleTwoLines}
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
    </motion.div>
  );

  const renderRestaurants = (
    list: typeof restaurants,
    showSuggestedBadge: boolean = false
  ) => (
    <Grid
      container
      rowSpacing={2}
      // spacing={{ xs: 1, sm: 2, md: 2 }}
    >
      {list.map((restaurant, idx) => (
        <Grid
          item
          key={restaurant.id}
          component={"div" as React.ElementType}
          sx={{
            flexBasis: { xs: "100%", sm: "50%", md: "33.3333%", lg: "20%" },
            maxWidth: { xs: "100%", sm: "50%", md: "33.3333%", lg: "20%" },
            px: 1,
            boxSizing: "border-box",
          }}
        >
          {renderRestaurantCard(restaurant, showSuggestedBadge, idx)}
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
        // spacing={{ xs: 1, sm: 2, md: 2 }}
        onScroll={() => updateSuggestedState()}
        sx={{
          flexWrap: "nowrap",
          overflowX: "auto",
          scrollBehavior: "smooth",
          // Thêm khoảng “đệm” hai bên để item đầu/cuối không dính sát lề
          px: { xs: 1, sm: 2 },
          py: 1,
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {visibleRestaurants.map((restaurant, idx) => (
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
            {renderRestaurantCard(restaurant, true, idx)}
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

  // --- Promotion helpers/UI ---

  const renderPromotionCard = (p: Promotion, index: number = 0) => (
    <motion.div {...getMotionProps(index)}>
      <Card
        onClick={() => router.push(`/RestaurantDetails/${p.restaurantId}`)}
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
          <Box className={styles.aspectSquare}>
            <Box
              component="img"
              src={p.imageUrl}
              alt={p.title}
              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
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
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: 24,
            }}
            title={p.restaurant?.name ?? `#${p.restaurantId}`}
            gutterBottom
          >
            {p.restaurant?.name ?? `#${p.restaurantId}`}
          </Typography>

          {/* 2) Tiêu đề khuyến mãi to và nổi bật ngay dưới tên nhà hàng */}
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{
              lineHeight: 1.3,
              mb: 1,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: "2.6em", // Ensures consistent space for 2 lines
            }}
            title={p.title}
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
    </motion.div>
  );

  // Render card for dish promotions (styled similarly to restaurant card)
  const renderDishCard = (d: DishPromotion, index: number = 0) => (
    <motion.div {...getMotionProps(index)}>
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
          onClick={() =>
            router.push(`/RestaurantDetails/${d.dish?.id ?? d.dishId}`)
          }
          sx={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            cursor: "pointer",
          }}
        >
          {d.dish?.imageUrl ? (
            <Box className={styles.aspectSquare}>
              <Box
                component="img"
                src={d.dish.imageUrl}
                alt={d.dish.name}
                sx={{ width: "100%", height: "100%", objectFit: "cover" }}
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
                  Không có ảnh
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

          <CardContent sx={{ flexGrow: 1 }}>
            <Typography
              variant="subtitle1"
              fontWeight="700"
              gutterBottom
              noWrap
              title={d.dish?.name ?? d.dishName}
            >
              {d.dish?.name ?? d.dishName}
            </Typography>

            {/* <Typography variant="body2" color="text.secondary" mb={1}>
            {d.promotion?.title ?? d.promotionTitle}
          </Typography> */}

            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="subtitle1" fontWeight={700} color="error">
                {(
                  d.discountedPrice ??
                  d.dish?.price ??
                  d.discountedPrice
                )?.toLocaleString()}
                ₫
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textDecoration: "line-through" }}
              >
                {(d.originalPrice ?? d.dish?.price)?.toLocaleString()}₫
              </Typography>
            </Box>
          </CardContent>
        </Box>

        <Box sx={{ p: 2, pt: 0 }}>
          <Button
            variant="outlined"
            color="primary"
            fullWidth
            size="small"
            onClick={() =>
              router.push(`/RestaurantDetails/${d.dish?.id ?? d.dishId}`)
            }
          >
            Xem món
          </Button>
        </Box>
      </Card>
    </motion.div>
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

  const renderRecipeCard = (recipe: EnrichedRecipe, index: number = 0) => (
    <motion.div {...getMotionProps(index)}>
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
            <Box className={styles.aspectSquare}>
              <Box
                component="img"
                src={recipe.imageUrl}
                alt={recipe.title}
                sx={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
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
                }}
              />
            </Box>
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
    </motion.div>
  );

  const renderTopRecipesCarousel = () => (
    <Box position="relative">
      <Grid
        ref={recipesRef}
        container
        // spacing={{ xs: 1, sm: 1, md: 1 }}
        onScroll={() => updateRecipesState()}
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
        {topRecipes.map((r, idx) => (
          <Grid
            item
            key={r.id}
            component={"div" as React.ElementType}
            sx={{
              flex: "0 0 auto",
              width: { xs: "72%", sm: "50%", md: "33.3333%", lg: "20%" },
              boxSizing: "border-box",
              px: 1,
            }}
          >
            {renderRecipeCard(r, idx)}
          </Grid>
        ))}
      </Grid>

      <HorizontalArrows
        onLeft={() => scrollRecipes("left")}
        onRight={() => scrollRecipes("right")}
        showLeft={recipesOverflow && recipesCanScrollLeft}
        showRight={recipesOverflow && recipesCanScrollRight}
        leftAria="scroll-left-recipes"
        rightAria="scroll-right-recipes"
      />
    </Box>
  );

  const renderPromotionsCarousel = () => (
    <Box position="relative">
      <Grid
        ref={promotionsRef}
        container
        // spacing={{ xs: 1, sm: 2, md: 2 }}
        onScroll={() => updatePromotionsState()}
        sx={{
          flexWrap: "nowrap",
          overflowX: "auto",
          scrollBehavior: "smooth",
          // Thêm khoảng “đệm” hai bên để item đầu/cuối không dính sát lề
          px: { xs: 1, sm: 2 },
          py: 1,
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {promotions.map((p, idx) => (
          <Grid
            item
            key={p.id}
            component={"div" as React.ElementType}
            sx={{
              flex: "0 0 auto",
              width: { xs: "72%", sm: "50%", md: "33.3333%", lg: "20%" },
              boxSizing: "border-box",
              px: 1,
            }}
          >
            {renderPromotionCard(p, idx)}
          </Grid>
        ))}
      </Grid>

      <HorizontalArrows
        onLeft={() => scrollPromotions("left")}
        onRight={() => scrollPromotions("right")}
        showLeft={promotionsOverflow && promotionsCanScrollLeft}
        showRight={promotionsOverflow && promotionsCanScrollRight}
        leftAria="scroll-left-promotions"
        rightAria="scroll-right-promotions"
      />
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
          {/* Món đang khuyến mãi (hiển thị dạng carousel ngang giống nhà hàng được đề xuất) */}
          <Paper sx={{ p: { xs: 1, sm: 2 }, mb: 4, borderRadius: 2 }}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={1}
            >
              <Typography variant="h5" fontWeight={700}>
                Món đang giảm giá
              </Typography>
              {dishPromotionsLoading && <CircularProgress size={18} />}
            </Box>
            {dishPromotions.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Chưa có món nào đang giảm giá.
              </Typography>
            ) : (
              <Box position="relative">
                <Grid
                  ref={dishPromotionsRef}
                  container
                  onScroll={() => updateDishPromotionsState()}
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
                  {dishPromotions.map((d, idx) => (
                    <Grid
                      item
                      key={d.id}
                      component={"div" as React.ElementType}
                      sx={{
                        flex: "0 0 auto",
                        width: {
                          xs: "72%",
                          sm: "50%",
                          md: "33.3333%",
                          lg: "20%",
                        },
                        boxSizing: "border-box",
                        px: 1,
                      }}
                    >
                      {renderDishCard(d, idx)}
                    </Grid>
                  ))}
                </Grid>

                <HorizontalArrows
                  onLeft={() => scrollDishPromotions("left")}
                  onRight={() => scrollDishPromotions("right")}
                  showLeft={
                    dishPromotionsOverflow && dishPromotionsCanScrollLeft
                  }
                  showRight={
                    dishPromotionsOverflow && dishPromotionsCanScrollRight
                  }
                  leftAria="scroll-left-dishpromotions"
                  rightAria="scroll-right-dishpromotions"
                />
              </Box>
            )}
          </Paper>
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
            {/* Pagination for restaurant listing (server-side) */}
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Pagination
                page={pageNumber}
                onPageChange={(p) =>
                  dispatch(
                    fetchRestaurants({ pageNumber: p, pageSize: itemsPerPage })
                  )
                }
                totalRecords={totalRecords ?? restaurants.length}
                pageSize={itemsPerPage}
                size="small"
                boundaryCount={3}
                siblingCount={1}
              />
            </Box>
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
