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
  Grid,
  Card,
  CardContent,
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
import { fetchUserById } from "@/redux/slices/userSlice";
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
import HorizontalArrows from "@/components/commons/HorizontalArrows";
import StarIcon from "@mui/icons-material/Star";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { fetchRestaurants } from "@/redux/slices/restaurantSlice";
import { useSignalR, RatingUpdateData } from "@/lib/signalr";
import { applyRealtimeRating } from "@/redux/slices/restaurantSlice";
import {
  fetchFavoritesByRestaurant,
  addFavorite,
  removeFavorite,
} from "@/redux/slices/favoritesSlice";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { Favorite as FavoriteType } from "@/types/favorite";
// Ensure axios has the latest Authorization and refresh-token behavior like other pages
import axiosInstance from "@/lib/axios/axiosInstance";
import { getAccessToken } from "@/lib/utils/tokenHelper";

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

  // Suggested arrows visibility state (for the "Có thể bạn quan tâm" carousel)
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

  useEffect(() => {
    const el = suggestedRef.current;
    if (!el) return;
    // NOTE: effect moved below after allRestaurants is declared
    // placeholder to satisfy linter ordering; real effect is added later.
  }, []);

  const {
    current: restaurant,
    loading: restaurantLoading,
    error: restaurantError,
  } = useAppSelector((state) => state.restaurant);
  const { restaurants: allRestaurants = [] } = useAppSelector(
    (state) => state.restaurant
  );
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

  // Move suggested carousel effect here so dependency `allRestaurants` is defined
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
  }, [allRestaurants]);

  // Favorites for this restaurant (yêu thích)
  const { favorites: restaurantFavorites = [] } = useAppSelector(
    (state) => state.favorites
  );

  // Lấy thông tin user từ Redux store thay vì localStorage
  const currentUser = useAppSelector((state) => state.user.user);

  const isFavorite = useMemo(() => {
    if (!currentUser || !restaurant) return false;
    return restaurantFavorites.some(
      (f: FavoriteType) =>
        f.restaurantId === restaurant.id && f.userId === currentUser.userId
    );
  }, [restaurantFavorites, restaurant, currentUser]);

  // Tổng số review từ BE (lưu trong slice restaurant)
  const totalReviewsFromState = useAppSelector(
    (state: RootState) => state.restaurant.currentTotalReviews ?? 0
  );

  // ================== REALTIME RATING WITH SIGNALR ==================
  // Callback xử lý khi nhận rating update từ SignalR
  // Đúng chuẩn BE: nhận event 'ReceiveRestaurantUpdate' với property PascalCase
  const handleRatingUpdate = (data: RatingUpdateData) => {
    console.log("handleRatingUpdate invoked with:", data);
    if (data.type === "restaurant_rating_update" && data.data) {
      // Chuẩn hóa property PascalCase từ BE
      const payload = data.data as Record<string, unknown>;
      const restaurantIdNum = Number(
        payload.RestaurantId ?? payload.restaurantId
      );
      const avg = Number(payload.AverageRating ?? payload.averageRating) || 0;
      const tot = Number(payload.TotalReviews ?? payload.totalReviews) || 0;
      if (!Number.isFinite(restaurantIdNum)) return;
      // Chỉ cập nhật nếu đúng restaurant hiện tại
      if (restaurantIdNum === Number(id)) {
        dispatch(
          applyRealtimeRating({
            restaurantId: restaurantIdNum,
            averageRating: avg,
            totalReviews: tot,
          })
        );
        console.log("Dispatched applyRealtimeRating:", {
          restaurantId: restaurantIdNum,
          averageRating: avg,
          totalReviews: tot,
        });
        dispatch(getReviewsByRestaurant(restaurantIdNum));
      }
    }
  };

  // Kết nối SignalR và join restaurant room
  useSignalR({
    restaurantId: id ? String(id) : undefined,
    onRatingUpdate: handleRatingUpdate,
    enabled: !!id,
  });

  // ===== INIT - Set token and fetch user like Promotion page =====
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      // Set Authorization header for axiosInstance
      axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;

      // Fetch current user if not in Redux yet (after reload/token refresh)
      if (!currentUser?.userId) {
        try {
          // Try to decode token to get userId
          const parts = token.split(".");
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            const userId =
              payload?.userId ?? payload?.UserId ?? payload?.sub ?? payload?.id;
            if (userId) {
              // Fetch full user info to populate Redux state
              dispatch(fetchUserById(Number(userId)));
            }
          }
        } catch (e) {
          console.warn("Could not decode token or fetch user:", e);
        }
      }
    }
  }, [dispatch, currentUser?.userId]);

  // Luôn lấy rating từ Redux state để đảm bảo realtime
  const displayAverageRating = restaurant?.averageRating ?? 0;
  const displayTotalReviews = totalReviewsFromState;

  useEffect(() => {
    if (!id) return;
    const rid = Number(id);
    dispatch(fetchRestaurantById(rid));
    dispatch(fetchDishes(rid));
    dispatch(getReviewsByRestaurant(rid));
    dispatch(fetchDishPromotions());
    dispatch(fetchPromotions(rid));
    // Load favorites for this restaurant (refresh-token handled by axiosInstance)
    dispatch(fetchFavoritesByRestaurant(rid));
  }, [dispatch, id]);

  // Ensure we have restaurants list to show suggestions
  useEffect(() => {
    if (!allRestaurants || allRestaurants.length === 0) {
      dispatch(fetchRestaurants());
    }
  }, [allRestaurants, dispatch]);

  const router = useRouter();

  // ================== GIẢM GIÁ ==================
  /**
   * ✅ Lấy giá tốt nhất (đã giảm) từ BE - KHÔNG tự tính toán!
   * BE đã tính sẵn giá giảm trong discountedPrice
   * FE chỉ cần lấy giá thấp nhất từ các promotion
   */
  const bestDiscountByDishId = useMemo(() => {
    const map = new Map<number, number>();

    for (const d of dishes) {
      const originalPrice = d.price;
      const relatedPromotions = dishPromotions.filter((p) => p.dishId === d.id);

      if (relatedPromotions.length === 0) continue;

      // ✅ Tìm giá thấp nhất từ discountedPrice mà BE đã tính sẵn
      const bestPrice = Math.min(
        ...relatedPromotions.map((p) => p.discountedPrice || originalPrice)
      );

      if (bestPrice < originalPrice) {
        map.set(d.id, bestPrice);
      }
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

    // Lấy thông tin user từ Redux store (có thể là partial)
    let userId = currentUser?.userId;
    let address = currentUser?.address?.trim() || "";
    let name = currentUser?.userName?.trim() || "";
    let phone = currentUser?.phone?.trim() || "";

    // Nếu có access token nhưng Redux user thiếu thông tin, thử fetch chi tiết từ server
    try {
      const { getAccessToken } = await import("@/lib/utils/tokenHelper");
      const token = getAccessToken();
      if (token && (!userId || !address || !name || !phone)) {
        // Cố gắng lấy userId từ token nếu chưa có
        let resolvedId = userId;
        if (!resolvedId) {
          try {
            const parts = token.split(".");
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]));
              resolvedId =
                payload?.userId ??
                payload?.UserId ??
                payload?.sub ??
                payload?.id;
            }
          } catch {
            // ignore
          }
        }

        if (resolvedId) {
          try {
            const fetched = await dispatch(
              fetchUserById(Number(resolvedId))
            ).unwrap();
            userId = fetched?.userId ?? userId;
            address =
              (fetched?.address?.trim && fetched.address.trim()) || address;
            name = (fetched?.userName?.trim && fetched.userName.trim()) || name;
            phone = (fetched?.phone?.trim && fetched.phone.trim()) || phone;
            console.log(
              "Fetched full user from server for add-to-cart:",
              fetched
            );
          } catch {
            console.warn("Could not fetch full user before add-to-cart");
          }
        }
      }
    } catch {
      // dynamic import or getAccessToken might fail in SSR; ignore
    }

    // Debug log để kiểm tra dữ liệu
    console.log("User data used for order:", {
      userId,
      address,
      name,
      phone,
      currentUser,
    });

    // Chỉ yêu cầu user đã đăng nhập để thêm vào giỏ; thông tin bổ sung sẽ được yêu cầu khi checkout
    const missingFields: string[] = [];
    if (!userId) missingFields.push("User ID");

    if (missingFields.length > 0) {
      const fieldsList = missingFields.join(", ");
      toast.error(`Thiếu thông tin: ${fieldsList}. Vui lòng đăng nhập.`);
      console.warn("Missing fields:", missingFields);
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
      const activeOrder = userOrders.find((o) => {
        // Normalize status to string and compare case-insensitively because
        // backend may return different casings (eg. "pending" vs "Pending").
        const status = String(o.status ?? "").toLowerCase();
        return (
          o.restaurantId === Number(restaurant.id) &&
          o.userId === Number(userId) &&
          status === "pending"
        );
      });

      const discounted =
        bestDiscountByDishId.get(dishId) ??
        dishes.find((d) => d.id === dishId)?.price ??
        0;
      const totalPrice = discounted * quantity;

      let orderId: number | null = null;
      let ok = false;

      if (!activeOrder) {
        // Nếu chưa có đơn hàng → tạo mới cùng với món đã chọn
        console.log("Creating new order with data:", {
          userId: Number(userId),
          restaurantId: Number(restaurant.id),
          deliveryAddress: address,
          recipientName: name,
          recipientPhone: phone,
          items: [{ dishId, quantity }],
        });

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

        console.log("Order created successfully:", createRes);
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
    } catch (error: unknown) {
      console.error("Error adding to cart:", error);

      // Hiển thị thông báo lỗi chi tiết
      let errorMessage = t("error_occurred");

      if (error && typeof error === "object") {
        if ("message" in error && typeof error.message === "string") {
          errorMessage = error.message;
        } else if (
          "errMessage" in error &&
          typeof error.errMessage === "string"
        ) {
          errorMessage = error.errMessage;
        }
      }

      toast.error(errorMessage);
    }
  };

  // Favorite (theo dõi) - toggle handlers
  const handleToggleFavorite = async () => {
    // Kiểm tra token trước - nếu có token thì try fetch user
    const token = getAccessToken();
    let userId = currentUser?.userId;

    if (!userId && token) {
      // Token có nhưng Redux user chưa load -> thử decode token và fetch user
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const uid =
            payload?.userId ?? payload?.UserId ?? payload?.sub ?? payload?.id;
          if (uid) {
            // Fetch user để có đầy đủ thông tin
            const fetchedUser = await dispatch(
              fetchUserById(Number(uid))
            ).unwrap();
            userId = fetchedUser?.userId;
          }
        }
      } catch (e) {
        console.warn("Could not fetch user before toggle favorite:", e);
      }
    }

    if (!userId) {
      toast.error(
        t("please_login_to_favorite") ?? "Vui lòng đăng nhập để theo dõi"
      );
      router.push("/login");
      return;
    }

    try {
      if (!restaurant) return;
      if (isFavorite) {
        const fav = restaurantFavorites.find(
          (f: FavoriteType) =>
            f.restaurantId === restaurant.id && f.userId === userId
        );
        if (!fav) return;
        await dispatch(removeFavorite(fav.id)).unwrap();
        toast.success(t("removed_favorite") ?? "Đã bỏ theo dõi");
      } else {
        await dispatch(
          addFavorite({
            userId: userId,
            restaurantId: Number(restaurant.id),
          })
        ).unwrap();
        toast.success(t("added_favorite") ?? "Đã theo dõi");
      }
      // refresh list
      dispatch(fetchFavoritesByRestaurant(Number(id)));
    } catch (err: unknown) {
      console.error("Favorite toggle error:", err);
      const errMsg =
        err && typeof err === "object" && "message" in err
          ? (err as { message?: string }).message
          : t("error_occurred");
      toast.error(errMsg || t("error_occurred"));
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
  // Sử dụng rating từ realtime nếu có, fallback về state
  const avgRating = displayAverageRating;
  const totalReviews = displayTotalReviews;

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
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                width="100%"
              >
                <Typography variant="h4">{restaurant.name}</Typography>
                <Button
                  aria-label={isFavorite ? "Đã theo dõi" : "Theo dõi"}
                  onClick={handleToggleFavorite}
                  variant={isFavorite ? "contained" : "outlined"}
                  color={isFavorite ? "success" : "primary"}
                  startIcon={
                    isFavorite ? <CheckCircleIcon /> : <PersonAddIcon />
                  }
                  size="small"
                >
                  {isFavorite
                    ? t("following_label") ?? "Đang theo dõi"
                    : t("follow_label") ?? "Theo dõi"}
                </Button>
              </Box>

              <Typography sx={{ mt: 1 }}>
                <strong>{t("address")}:</strong> {restaurant.address}
              </Typography>
              {/* Map is rendered in a dedicated full-width section at the bottom of the page */}
              <Typography sx={{ mt: 1 }}>
                <strong>{t("status")}:</strong>{" "}
                {(() => {
                  const parseHHMM = (v?: unknown): [number, number] | null => {
                    if (typeof v === "string" && v.includes(":")) {
                      const [h, m] = v.split(":");
                      const hh = Number(h);
                      const mm = Number(m);
                      if (Number.isFinite(hh) && Number.isFinite(mm)) {
                        return [hh, mm];
                      }
                    }
                    return null;
                  };
                  const getTimeField = (
                    obj: unknown,
                    names: string[]
                  ): string | undefined => {
                    if (!obj || typeof obj !== "object") return undefined;
                    const rec = obj as Record<string, unknown>;
                    for (const n of names) {
                      const v = rec[n];
                      if (typeof v === "string" && v.length > 0) return v;
                    }
                    return undefined;
                  };

                  const now = new Date();
                  const open = parseHHMM(
                    getTimeField(restaurant, ["openTime", "openingTime"])
                  );
                  const close = parseHHMM(
                    getTimeField(restaurant, ["closeTime", "closingTime"])
                  );

                  if (!open || !close) {
                    return (
                      <span style={{ color: "#666" }}>{t("unknown")}</span>
                    );
                  }

                  const [openHour, openMinute] = open;
                  const [closeHour, closeMinute] = close;
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
                <strong>{t("hours")}:</strong>{" "}
                {(() => {
                  const getTimeField = (
                    obj: unknown,
                    names: string[]
                  ): string | undefined => {
                    if (!obj || typeof obj !== "object") return undefined;
                    const rec = obj as Record<string, unknown>;
                    for (const n of names) {
                      const v = rec[n];
                      if (typeof v === "string" && v.length > 0) return v;
                    }
                    return undefined;
                  };
                  const o =
                    getTimeField(restaurant, ["openTime", "openingTime"]) ??
                    "?";
                  const c =
                    getTimeField(restaurant, ["closeTime", "closingTime"]) ??
                    "?";
                  return `${o} - ${c}`;
                })()}
              </Typography>
              <Typography sx={{ mt: 1 }}>
                <strong>{t("followers_label") ?? "Followers"}:</strong>{" "}
                {restaurantFavorites?.length ?? 0}
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
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1,
                            alignItems: "baseline",
                          }}
                        >
                          <Typography
                            sx={{
                              textDecoration: "line-through",
                              color: "text.secondary",
                              fontSize: "0.95rem",
                            }}
                          >
                            {dish.price.toLocaleString()}đ
                          </Typography>
                          <Typography
                            fontWeight="bold"
                            sx={{ color: "error.main", fontSize: "1rem" }}
                          >
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
        {/* --- Gợi ý: Có thể bạn quan tâm (nhà hàng > 4 sao, trừ nhà hàng hiện tại) --- */}
        {(() => {
          const suggested = (allRestaurants || []).filter((r) => {
            const avg = r.averageRating ?? r.rating ?? 0;
            return avg > 4 && r.id !== restaurant.id;
          });

          if (!suggested || suggested.length === 0) return null;

          const renderCard = (r: (typeof allRestaurants)[number]) => (
            <Card
              key={r.id}
              sx={{ height: "100%", display: "flex", flexDirection: "column" }}
            >
              <Box
                onClick={() => router.push(`/RestaurantDetails/${r.id}`)}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  flexGrow: 1,
                  cursor: "pointer",
                }}
              >
                {r.imageUrl ? (
                  <Box
                    component="img"
                    src={r.imageUrl}
                    alt={r.name}
                    sx={{ width: "100%", height: 160, objectFit: "cover" }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: "100%",
                      height: 160,
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
                )}

                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    gutterBottom
                    noWrap
                    title={r.name}
                  >
                    {r.name}
                  </Typography>
                  <Box display="flex" alignItems="center" mb={1}>
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <StarIcon
                        key={idx}
                        fontSize="small"
                        color={
                          idx < (r.averageRating ?? r.rating ?? 0)
                            ? "warning"
                            : "disabled"
                        }
                      />
                    ))}
                    <Typography variant="body2" color="text.secondary" ml={0.5}>
                      {(r.averageRating ?? r.rating ?? 0).toFixed(1)}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    noWrap
                    title={r.address}
                  >
                    {r.address}
                  </Typography>
                </CardContent>
              </Box>

              <Box sx={{ p: 1, pt: 0 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/RestaurantDetails/${r.id}`);
                  }}
                >
                  Đặt chỗ ngay
                </Button>
              </Box>
            </Card>
          );

          return (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h5" sx={{ mb: 1 }}>
                Có thể bạn quan tâm
              </Typography>
              <Box position="relative">
                <Grid
                  container
                  ref={suggestedRef}
                  spacing={2}
                  onScroll={() => updateSuggestedState()}
                  sx={{
                    flexWrap: "nowrap",
                    overflowX: "auto",
                    px: 1,
                    py: 0,
                    scrollbarWidth: "none",
                    "&::-webkit-scrollbar": { display: "none" },
                  }}
                >
                  {suggested.map((r) => (
                    <Grid
                      item
                      key={r.id}
                      sx={{ flex: "0 0 280px", width: 280 }}
                      component={"div" as React.ElementType}
                    >
                      {renderCard(r)}
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
            </Box>
          );
        })()}
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
