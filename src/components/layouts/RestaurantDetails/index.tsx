"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  CircularProgress,
  Typography,
  Chip,
  useTheme,
  Stack,
  IconButton,
  Button,
} from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import { ToggleButtonGroup, ToggleButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import Image from "next/image";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import type { RootState } from "@/redux/store";
import { fetchRestaurantById } from "@/redux/slices/restaurantSlice";
import { fetchDishes } from "@/redux/slices/dishSlide";
import { getReviewsByRestaurant } from "@/redux/slices/reviewSlice";
import { fetchDishPromotions } from "@/redux/slices/dishPromotionSlice";
import { fetchPromotions } from "@/redux/slices/promotionSlice";
import {
  fetchOrdersByUser,
  createOrder,
  addItemToOrder,
} from "@/redux/slices/orderSlice";
import styles from "./styles.module.scss";
import ReviewForm from "@/components/features/Review/ReviewForm";
import ReviewList from "@/components/features/Review/ReviewList";
import ReservationForm from "@/components/features/Reservation";
import MapView from "@/components/layouts/MapView";
import StarIcon from "@mui/icons-material/Star";
import { useTranslations } from "next-intl";

// Toast
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const RestaurantDetailPage = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:600px)");
  const t = useTranslations("restaurantDetails");
  const [mobileView, setMobileView] = useState<
    "info" | "menu" | "map" | "reviews" | "reserve"
  >("info");
  const infoRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);
  const reserveRef = useRef<HTMLDivElement>(null);

  const {
    current: restaurant,
    loading: restaurantLoading,
    error: restaurantError,
  } = useAppSelector((state) => state.restaurant);
  const { items: dishes, loading: dishesLoading } = useAppSelector(
    (state) => state.dishes
  );
  const { items: dishPromotions } = useAppSelector(
    (state) => state.dishpromotion
  );
  const { promotions: restaurantPromotions = [], loading: promoLoading } =
    useAppSelector((state: RootState) => state.promotion);
  const {
    reviews = [],
    loading: reviewLoading,
    error: reviewError,
  } = useAppSelector((state) => state.review);

  const authUserId = useAppSelector((s: unknown) => {
    try {
      const ss = s as unknown as Record<string, unknown>;
      const auth = ss["auth"] as Record<string, unknown> | undefined;
      const user = auth?.["user"] as Record<string, unknown> | undefined;
      const id = user?.["id"] as number | undefined;
      return id ?? null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!id) return;
    const rid = Number(id);
    dispatch(fetchRestaurantById(rid));
    dispatch(fetchDishes(rid));
    dispatch(getReviewsByRestaurant(rid));
    dispatch(fetchDishPromotions());
    dispatch(fetchPromotions(rid));
  }, [dispatch, id]);

  // ================== GIẢM GIÁ ==================
  const computeDiscountedPrice = (
    orig: number,
    discountType?: string,
    discountValue?: number
  ) => {
    if (!discountType) return orig;
    if (discountType === "percent")
      return Math.max(
        0,
        Math.round(
          orig * (1 - Math.max(0, Math.min(100, Number(discountValue))) / 100)
        )
      );
    if (discountType === "fixed_amount")
      return Math.max(0, orig - (Number(discountValue) || 0));
    return orig;
  };

  const bestDiscountByDishId = useMemo(() => {
    const map = new Map<number, number>();
    for (const d of dishes) {
      const orig = d.price;
      const related = dishPromotions.filter((p) => p.dishId === d.id);
      if (related.length === 0) continue;

      let best = orig;
      for (const p of related) {
        const pr = p as unknown as Record<string, unknown>;
        const after = computeDiscountedPrice(
          orig,
          typeof pr["discountType"] === "string"
            ? (pr["discountType"] as string)
            : undefined,
          pr["discountValue"] !== undefined
            ? Number(pr["discountValue"])
            : undefined
        );
        if (after < best) best = after;
      }
      if (best < orig) map.set(d.id, best);
    }
    return map;
  }, [dishes, dishPromotions]);

  // ================== SỐ LƯỢNG ==================
  const [qtyMap, setQtyMap] = useState<Record<number, number>>({});
  const inc = (id: number) =>
    setQtyMap((m) => ({ ...m, [id]: (m[id] || 0) + 1 }));
  const dec = (id: number) =>
    setQtyMap((m) => {
      const cur = m[id] || 0;
      const next = Math.max(0, cur - 1);
      const copy = { ...m };
      if (next === 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });

  // ================== Thêm vào giỏ ==================
  const handleAddToCart = async (dishId: number) => {
    const quantity = qtyMap[dishId] || 0;
    if (quantity <= 0) return;

    // Lấy thông tin user
    let userId = authUserId;
    let address = "";
    let name = "";
    let phone = "";

    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          userId = parsed.userId ?? userId;
          address = parsed.address?.trim() || "";
          name = parsed.userName?.trim() || "";
          phone = parsed.phone?.trim() || "";
        } catch {}
      }
    }

    if (!userId || !address || !name || !phone) {
      toast.error(t("error_missing_info"));
      return;
    }

    try {
      if (!restaurant) {
        toast.error(t("error_no_restaurant"));
        return;
      }

      // Lấy danh sách đơn hàng hiện tại của user
      const userOrders = await dispatch(
        fetchOrdersByUser(Number(userId))
      ).unwrap();

      // Tìm đơn hàng đang mở với nhà hàng này
      const activeOrder = userOrders.find(
        (o) =>
          o.restaurantId === Number(restaurant.id) &&
          o.userId === Number(userId) &&
          o.status === "Pending"
      );

      const discounted =
        bestDiscountByDishId.get(dishId) ??
        dishes.find((d) => d.id === dishId)?.price ??
        0;
      const totalPrice = discounted * quantity;

      let orderId: number | null = null;
      let ok = false;

      if (!activeOrder) {
        // Nếu chưa có đơn hàng → tạo mới cùng với món đã chọn
        const createRes = await dispatch(
          createOrder({
            userId: Number(userId),
            restaurantId: Number(restaurant.id),
            deliveryAddress: address,
            recipientName: name,
            recipientPhone: phone,
            items: [
              {
                dishId,
                quantity,
              },
            ],
          })
        ).unwrap();
        orderId = createRes.id;
        ok = Boolean(createRes?.id);
      } else {
        orderId = activeOrder.id;

        // Gọi API thêm món vào đơn hàng hiện có
        const res = await dispatch(
          addItemToOrder({
            orderId,
            item: { dishId, quantity, totalPrice },
          })
        );
        ok = res.meta.requestStatus === "fulfilled";
      }
      if (ok) {
        toast.success(t("success_added"));
        setQtyMap((m) => {
          const copy = { ...m };
          delete copy[dishId];
          return copy;
        });
        dispatch(fetchOrdersByUser(Number(userId)));
      } else {
        toast.error(t("error_add_to_cart"));
      }
    } catch (error) {
      console.error(error);
      toast.error(t("error_occurred"));
    }
  };

  // ================== LOADING & ERROR ==================
  if (restaurantLoading || dishesLoading) {
    return (
      <Box className={styles.centered}>
        <CircularProgress />
      </Box>
    );
  }

  if (restaurantError || !restaurant) {
    return (
      <Box className={styles.centered}>
        <Typography variant="h5">
          {restaurantError || t("restaurant_not_found")}
        </Typography>
      </Box>
    );
  }

  // ================== PHẦN CÒN LẠI ==================
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;
  const totalReviews = reviews.length;

  return (
    <Box className={styles.container}>
      {isMobile && (
        <Box className={styles.mobileToggle}>
          <ToggleButtonGroup
            value={mobileView}
            exclusive
            onChange={(_, v) => {
              if (!v) return;
              setMobileView(v);
              const mapToRef: Record<
                string,
                React.RefObject<HTMLDivElement | null>
              > = {
                info: infoRef,
                menu: menuRef,
                map: mapRef,
                reviews: reviewsRef,
                reserve: reserveRef,
              };
              const r = mapToRef[v as keyof typeof mapToRef];
              r?.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
            sx={{ width: "100%", flexWrap: "wrap", gap: 1 }}
            aria-label="Chuyển mục xem"
          >
            <ToggleButton value="info" aria-label={t("info")}>
              {t("info")}
            </ToggleButton>
            <ToggleButton value="menu" aria-label={t("menu")}>
              {t("menu")}
            </ToggleButton>
            <ToggleButton value="map" aria-label={t("map")}>
              {t("map")}
            </ToggleButton>
            <ToggleButton value="reviews" aria-label={t("reviews")}>
              {t("reviews")}
            </ToggleButton>
            <ToggleButton value="reserve" aria-label={t("reserve")}>
              {t("reserve")}
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}
      {/* Bên trái */}
      <Box className={styles.leftContent}>
        <Box ref={infoRef} sx={{ scrollMarginTop: { xs: 80, md: 0 } }}>
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
              {restaurant.imageUrl ? (
                <Image src={restaurant.imageUrl} alt={restaurant.name} fill />
              ) : (
                <Box
                  sx={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: "#f5f5f5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {t("no_image")}
                  </Typography>
                </Box>
              )}
            </Box>
            <Box className={styles.restaurantInfo} sx={{ mt: 2 }}>
              <Typography variant="h4">{restaurant.name}</Typography>

              <Typography sx={{ mt: 1 }}>
                <strong>{t("address")}:</strong> {restaurant.address}
              </Typography>
              {/* Map is rendered in a dedicated full-width section at the bottom of the page */}
              <Typography sx={{ mt: 1 }}>
                <strong>{t("status")}:</strong>{" "}
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
                    <span style={{ color: "green" }}>{t("open")}</span>
                  ) : (
                    <span style={{ color: "red" }}>{t("closed")}</span>
                  );
                })()}
              </Typography>
              <Typography sx={{ mt: 1 }}>
                <strong>{t("hours")}:</strong> {restaurant.openTime} -{" "}
                {restaurant.closeTime}
              </Typography>
              <Box display="flex" alignItems="center" gap={0.2} sx={{ mt: 1 }}>
                <strong>{t("rating")}:</strong>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <StarIcon
                    key={idx}
                    fontSize="small"
                    color={idx < Math.round(avgRating) ? "warning" : "disabled"}
                  />
                ))}
                <Typography variant="body2" color="error" sx={{ ml: 0.5 }}>
                  {avgRating.toFixed(1)} ({totalReviews.toLocaleString()}{" "}
                  {t("rating")})
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Khuyến mãi của nhà hàng - chỉ hiển thị khi có khuyến mãi */}
        {(() => {
          // Lọc các khuyến mãi: chỉ lấy TargetType = "order" và còn hạn
          const validPromotions = restaurantPromotions.slice().filter((p) => {
            // Chỉ lấy promotion áp dụng cho order
            if (p.targetType !== "order") return false;

            try {
              if (!p.endDate) return true;
              const end = new Date(p.endDate);
              const now = new Date();
              const endYMD = new Date(
                end.getFullYear(),
                end.getMonth(),
                end.getDate()
              );
              const nowYMD = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate()
              );
              return endYMD >= nowYMD;
            } catch {
              return true;
            }
          });

          // Nếu không có khuyến mãi hợp lệ, không hiển thị gì
          if (!promoLoading && validPromotions.length === 0) {
            return null;
          }

          return (
            <Box
              sx={{
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                borderRadius: 2,
                p: 2,
                mt: 3,
              }}
            >
              <Typography variant="h5" sx={{ mb: 1 }}>
                {t("promotions_title")}
              </Typography>
              {promoLoading ? (
                <Box display="flex" alignItems="center" gap={1}>
                  <CircularProgress size={20} />
                  <Typography variant="body2">
                    {t("loading_promotions")}
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {validPromotions
                    .sort((a, b) => a.startDate.localeCompare(b.startDate))
                    .map((promo) => {
                      const endLabel = new Date(
                        promo.endDate
                      ).toLocaleDateString();
                      return (
                        <Box
                          key={promo.id}
                          sx={{
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                            p: 2,
                          }}
                        >
                          <Typography variant="h6">{promo.title}</Typography>
                          {promo.description && (
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {promo.description}
                            </Typography>
                          )}
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 1, display: "block" }}
                          >
                            {t("valid_until")}: {endLabel}
                          </Typography>
                        </Box>
                      );
                    })}
                </Stack>
              )}
            </Box>
          );
        })()}

        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            borderRadius: 2,
            p: 2,
          }}
        >
          {restaurant.name && (
            <Typography variant="h6" sx={{ mt: 1 }}>
              {t("summary")} {restaurant.name}
            </Typography>
          )}
          {restaurant.description && (
            <Typography sx={{ mt: 1 }}>{restaurant.description}</Typography>
          )}
        </Box>

        {/* Thực đơn */}
        <Box
          ref={menuRef}
          className={styles.menuSection}
          sx={{
            scrollMarginTop: { xs: 80, md: 0 },
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            borderRadius: 2,
            p: 2,
            mt: 3,
          }}
        >
          <Typography variant="h5">{t("menu_title")}</Typography>
          {dishes.length === 0 ? (
            <Typography>{t("no_dishes")}</Typography>
          ) : (
            <Box className={styles.dishGrid}>
              {dishes.map((dish) => {
                const discounted = bestDiscountByDishId.get(dish.id) ?? null;
                const showDiscount =
                  discounted !== null && discounted < dish.price;
                const qty = qtyMap[dish.id] || 0;
                const unitPrice = discounted ?? dish.price;

                return (
                  <Box
                    key={dish.id}
                    className={styles.dishCard}
                    sx={{
                      backgroundColor: theme.palette.background.default,
                      color: theme.palette.text.primary,
                      borderRadius: 2,
                      p: 2,
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    <Box className={styles.dishImage}>
                      {dish.imageUrl ? (
                        <Image
                          src={dish.imageUrl}
                          alt={dish.name}
                          width={300}
                          height={160}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 300,
                            height: 160,
                            backgroundColor: "#f5f5f5",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 1,
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            {t("no_dish_image")}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    <Box className={styles.dishInfo}>
                      <Typography variant="h6">
                        {dish.name}
                        {!dish.isActive && (
                          <Chip
                            label={t("out_of_stock")}
                            size="small"
                            sx={{
                              ml: 1,
                              backgroundColor: theme.palette.error.main,
                              color: theme.palette.error.contrastText,
                            }}
                          />
                        )}
                      </Typography>
                      {showDiscount ? (
                        <Box>
                          <Typography
                            sx={{
                              textDecoration: "line-through",
                              color: "#777",
                            }}
                          >
                            {dish.price.toLocaleString()}đ
                          </Typography>
                          <Typography fontWeight="bold" color="primary">
                            {discounted!.toLocaleString()}đ
                          </Typography>
                        </Box>
                      ) : (
                        <Typography className={styles.price}>
                          {dish.price.toLocaleString()}đ
                        </Typography>
                      )}
                    </Box>

                    {/* Chọn số lượng + Thêm vào giỏ */}
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      mt={1}
                      gap={1}
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <IconButton
                          size="small"
                          onClick={() => dec(dish.id)}
                          disabled={qty === 0}
                          aria-label={t("decrease_quantity")}
                        >
                          <RemoveIcon />
                        </IconButton>
                        <Typography minWidth={24} textAlign="center">
                          {qty}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => inc(dish.id)}
                          disabled={!dish.isActive}
                          aria-label={t("increase_quantity")}
                        >
                          <AddIcon />
                        </IconButton>
                      </Stack>
                      <Button
                        variant="contained"
                        size="small"
                        disabled={!dish.isActive || qty === 0}
                        onClick={() => handleAddToCart(dish.id)}
                      >
                        {t("add_to_cart")} ({(unitPrice * qty).toLocaleString()}
                        đ)
                      </Button>
                    </Stack>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        {/* Bản đồ */}
        <Box
          ref={mapRef}
          sx={{ width: "100%", mt: 3, scrollMarginTop: { xs: 80, md: 0 } }}
        >
          {Number.isFinite(restaurant.latitude) &&
          Number.isFinite(restaurant.longitude) &&
          (restaurant.latitude !== 0 || restaurant.longitude !== 0) ? (
            <Box
              sx={{
                backgroundColor: theme.palette.background.paper,
                borderRadius: 2,
                p: 2,
              }}
            >
              <Typography variant="h6">{t("map_title")}</Typography>
              <Box sx={{ mt: 1 }}>
                <MapView lat={restaurant.latitude} lng={restaurant.longitude} />
              </Box>
              <Button
                size="small"
                variant="outlined"
                sx={{ mt: 1 }}
                href={`https://www.google.com/maps/search/?api=1&query=${restaurant.latitude},${restaurant.longitude}`}
                target="_blank"
                rel="noreferrer"
              >
                {t("open_google_maps")}
              </Button>
            </Box>
          ) : (
            <Box sx={{ p: 2 }}>
              <Typography>
                <strong>{t("location")}:</strong> {t("no_coordinates")}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Khu vực đánh giá */}
        <Box
          ref={reviewsRef}
          sx={{
            display: "flex",
            gap: 3,
            mt: 3,
            flexDirection: { xs: "column", md: "row" },
            scrollMarginTop: { xs: 80, md: 0 },
          }}
        >
          <Box sx={{ flex: 2 }}>
            <ReviewList
              reviews={reviews}
              loading={reviewLoading}
              error={reviewError}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <ReviewForm />
          </Box>
        </Box>
      </Box>

      {/* Bên phải: Form đặt bàn */}
      <Box
        ref={reserveRef}
        className={styles.rightContent}
        sx={{ scrollMarginTop: { xs: 80, md: 0 } }}
      >
        <ReservationForm restaurantId={restaurant.id} />
      </Box>

      {/* Toast container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
      />
    </Box>
  );
};

export default RestaurantDetailPage;
