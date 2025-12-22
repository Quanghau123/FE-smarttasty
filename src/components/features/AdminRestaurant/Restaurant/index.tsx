"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  Box,
  Button,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Pagination,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import DishCard from "@/components/features/AdminRestaurant/Restaurant/dish";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import {
  fetchRestaurantByOwner,
  clearCurrentRestaurant,
  updateRestaurant,
} from "@/redux/slices/restaurantSlice";
import { fetchDishes } from "@/redux/slices/dishSlide";
import { fetchDishPromotions } from "@/redux/slices/dishPromotionSlice";
import { getAccessToken } from "@/lib/utils/tokenHelper";
import StarIcon from "@mui/icons-material/Star";
import { fetchFavoritesByRestaurant } from "@/redux/slices/favoritesSlice";
import {
  getReviewsByRestaurant,
  deleteReview,
} from "@/redux/slices/reviewSlice";
import ReviewList from "@/components/features/Review/ReviewList";
import dynamic from "next/dynamic";
import AddressAutocomplete from "@/components/features/AdminRestaurant/CreateRestaurant/AddressAutocomplete";

const MapPicker = dynamic(() => import("@/components/layouts/MapPicker"), {
  ssr: false,
});

async function reverseGeocode(
  lat: number,
  lon: number
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
    );
    const data = (await res.json()) as {
      display_name?: string;
      address?: Record<string, string>;
    };
    if (!data) return null;
    const house = data.address?.house_number || "";
    const road =
      data.address?.road ||
      data.address?.pedestrian ||
      data.address?.residential ||
      "";
    const city =
      data.address?.city || data.address?.town || data.address?.village || "";
    const composed = `${house ? house + " " : ""}${road}${
      city ? `, ${city}` : ""
    }`.trim();
    if (composed) return composed;
    return data.display_name ?? null;
  } catch {
    return null;
  }
}

const RestaurantPage = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const t = useTranslations("adminRestaurant.restaurant");

  const { current: restaurantInfo, loading: restaurantLoading } =
    useAppSelector((state) => state.restaurant);
  const {
    items: dishes,
    loading: dishLoading,
    totalRecords,
  } = useAppSelector((state) => state.dishes);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  const totalPages =
    totalRecords && totalRecords > 0
      ? Math.ceil(totalRecords / itemsPerPage)
      : Math.ceil(dishes.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [restaurantInfo?.id]);

  const { items: dishPromotions } = useAppSelector(
    (state) => state.dishpromotion
  );

  const { favorites: restaurantFavorites = [] } = useAppSelector(
    (state) => state.favorites
  );

  const totalReviewsFromState = useAppSelector(
    (state) => state.restaurant.currentTotalReviews ?? 0
  );

  const { reviews = [], loading: reviewLoading } = useAppSelector(
    (state) => state.review
  );

  const [isEditing, setIsEditing] = useState(false);
  const isMobile = useMediaQuery("(max-width:600px)");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<number | null>(null);

  const [formState, setFormState] = useState({
    name: "",
    address: "",
    description: "",
    openTime: "",
    closeTime: "",
    latitude: 0,
    longitude: 0,
    file: null as File | null,
  });
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const token = getAccessToken();
    const role = userData?.role;

    if (!token || role !== "business") {
      toast.error(t("errors.no_permission"));
      return;
    }

    dispatch(fetchRestaurantByOwner({ token }));

    return () => {
      dispatch(clearCurrentRestaurant());
    };
  }, [dispatch, t]);

  useEffect(() => {
    if (restaurantInfo?.id) {
      dispatch(
        fetchDishes({
          restaurantId: restaurantInfo.id,
          pageNumber: currentPage,
          pageSize: itemsPerPage,
        })
      );
      // lấy giá khuyến mãi món cho các món của nhà hàng này
      dispatch(fetchDishPromotions());
      dispatch(fetchFavoritesByRestaurant(restaurantInfo.id));
      dispatch(getReviewsByRestaurant(restaurantInfo.id));

      setFormState({
        name: restaurantInfo.name || "",
        address: restaurantInfo.address || "",
        description: restaurantInfo.description || "",
        openTime: restaurantInfo.openTime || "",
        closeTime: restaurantInfo.closeTime || "",
        latitude: restaurantInfo.latitude ?? 0,
        longitude: restaurantInfo.longitude ?? 0,
        file: null,
      });
    }
  }, [restaurantInfo, dispatch, currentPage]);

  const handleUpdate = async () => {
    if (!restaurantInfo) return;

    const token = getAccessToken();
    if (!token) {
      toast.error(t("errors.no_token"));
      return;
    }

    const formPayload = {
      ...restaurantInfo,
      name: formState.name,
      address: formState.address,
      description: formState.description,
      openTime: formState.openTime,
      closeTime: formState.closeTime,
      latitude: formState.latitude,
      longitude: formState.longitude,
      file: formState.file,
    };

    try {
      await dispatch(
        updateRestaurant({ token, id: restaurantInfo.id, data: formPayload })
      ).unwrap();

      toast.success(t("success.update_success"));
      dispatch(fetchRestaurantByOwner({ token }));
      setIsEditing(false);
    } catch {
      toast.error(t("errors.update_failed"));
    }
  };

  const handleCancelEdit = () => {
    if (!restaurantInfo) return;
    setFormState({
      name: restaurantInfo.name || "",
      address: restaurantInfo.address || "",
      description: restaurantInfo.description || "",
      openTime: restaurantInfo.openTime || "",
      closeTime: restaurantInfo.closeTime || "",
      latitude: restaurantInfo.latitude ?? 0,
      longitude: restaurantInfo.longitude ?? 0,
      file: null,
    });
    setIsEditing(false);
  };
  const bestDiscountByDishId = useMemo(() => {
    const map = new Map<number, number>();

    for (const dish of dishes) {
      const originalPrice = dish.price;
      const relatedPromotions = dishPromotions.filter(
        (p) => p.dishId === dish.id
      );

      if (relatedPromotions.length === 0) continue;

      // ✅ Tìm giá thấp nhất từ discountedPrice mà BE đã tính sẵn
      const bestPrice = Math.min(
        ...relatedPromotions.map((p) => p.discountedPrice || originalPrice)
      );

      if (bestPrice < originalPrice) {
        map.set(dish.id, bestPrice);
      }
    }

    return map;
  }, [dishes, dishPromotions]);

  const handleDeleteReview = async (reviewId: number) => {
    setReviewToDelete(reviewId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteReview = async () => {
    if (!reviewToDelete) return;

    try {
      await dispatch(deleteReview(reviewToDelete)).unwrap();
      toast.success(t("success.delete_review_success"));
      if (restaurantInfo?.id) {
        dispatch(getReviewsByRestaurant(restaurantInfo.id));
      }
    } catch (error) {
      toast.error(t("errors.delete_review_failed"));
      console.error("Delete review error:", error);
    } finally {
      setDeleteDialogOpen(false);
      setReviewToDelete(null);
    }
  };

  const cancelDeleteReview = () => {
    setDeleteDialogOpen(false);
    setReviewToDelete(null);
  };

  if (restaurantLoading) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }

  if (!restaurantInfo) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <Paper elevation={3} sx={{ padding: 4, textAlign: "center" }}>
          <Typography variant="h5" gutterBottom>
            {t("no_restaurant")}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => router.push("/createrestaurant")}
          >
            {t("create_restaurant")}
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        pt: 0,
        pb: { xs: 2, sm: 3, md: 4 },
        px: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: "1600px", mx: "auto" }}>
        {/* Restaurant Info Card */}
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2.5, sm: 3, md: 4 },
            mb: 4,
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          {/* Header with Edit Button */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
              pb: 2,
              borderBottom: "2px solid",
              borderColor: "divider",
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontSize: { xs: "1.25rem", sm: "1.5rem" },
                fontWeight: 700,
                color: "text.primary",
              }}
            >
              {t("title")}
            </Typography>
            {!isEditing && (
              <Button
                variant="contained"
                onClick={() => setIsEditing(true)}
                sx={{
                  px: 3,
                  py: 1,
                  fontSize: "0.938rem",
                  fontWeight: 600,
                  textTransform: "none",
                  boxShadow: 2,
                }}
              >
                {t("btn.edit")}
              </Button>
            )}
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: { xs: 2.5, sm: 3, md: 4 },
              alignItems: "stretch",
              flexDirection: { xs: "column", md: "row" },
            }}
          >
            {/* Restaurant Image */}
            <Box
              sx={{
                width: { xs: "100%", md: 350 },
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  height: { xs: 220, sm: 280, md: 300 },
                  borderRadius: 2,
                  overflow: "hidden",
                  boxShadow: 3,
                  border: "3px solid",
                  borderColor: "divider",
                }}
              >
                <Image
                  src={
                    formState.file
                      ? URL.createObjectURL(formState.file)
                      : restaurantInfo.imageUrl ||
                        `https://res.cloudinary.com/djcur1ymq/image/upload/${restaurantInfo.imagePublicId}`
                  }
                  alt={t("image_alt")}
                  fill
                  style={{ objectFit: "cover" }}
                />
              </Box>
              {isEditing && (
                <Button
                  fullWidth
                  variant="outlined"
                  component="label"
                  sx={{
                    mt: 2,
                    py: 1.5,
                    fontWeight: 600,
                    borderWidth: 2,
                    "&:hover": {
                      borderWidth: 2,
                    },
                  }}
                >
                  {t("btn.choose_image")}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        file: e.target.files?.[0] || null,
                      })
                    }
                  />
                </Button>
              )}
            </Box>

            <Box
              flex={1}
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minWidth: 0,
              }}
            >
              <Box>
                {isEditing ? (
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <TextField
                      fullWidth
                      label={t("label.name")}
                      value={formState.name}
                      onChange={(e) =>
                        setFormState({ ...formState, name: e.target.value })
                      }
                      size="medium"
                      sx={{ "& .MuiInputBase-root": { fontSize: "1rem" } }}
                    />
                    <AddressAutocomplete
                      value={formState.address}
                      onChange={(v) =>
                        setFormState({ ...formState, address: v })
                      }
                      onSelect={(address, lat, lon) => {
                        setFormState({
                          ...formState,
                          address,
                          latitude: lat,
                          longitude: lon,
                        });
                      }}
                      placeholder={t("label.address") as string}
                    />
                    {mounted && (
                      <Box mt={1}>
                        <Box
                          sx={{
                            height: 300,
                            borderRadius: 1,
                            overflow: "hidden",
                          }}
                        >
                          <MapPicker
                            lat={formState.latitude || 10.762622}
                            lng={formState.longitude || 106.660172}
                            onChange={({ lat, lng }) => {
                              setFormState({
                                ...formState,
                                latitude: lat,
                                longitude: lng,
                              });
                              reverseGeocode(lat, lng).then((addr) => {
                                if (addr) {
                                  setFormState((prev) => ({
                                    ...prev,
                                    address: addr,
                                  }));
                                }
                              });
                            }}
                          />
                        </Box>
                      </Box>
                    )}
                    <TextField
                      fullWidth
                      label={t("label.description")}
                      value={formState.description}
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          description: e.target.value,
                        })
                      }
                      multiline
                      minRows={3}
                      size="medium"
                    />

                    <Box
                      sx={{
                        display: "flex",
                        gap: 2,
                        flexDirection: { xs: "column", sm: "row" },
                      }}
                    >
                      <TextField
                        label={t("label.open_time")}
                        value={formState.openTime}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            openTime: e.target.value,
                          })
                        }
                        fullWidth
                        size="medium"
                      />
                      <TextField
                        label={t("label.close_time")}
                        value={formState.closeTime}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            closeTime: e.target.value,
                          })
                        }
                        fullWidth
                        size="medium"
                      />
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Typography
                      variant="h4"
                      gutterBottom
                      sx={{
                        fontSize: {
                          xs: "1.5rem",
                          sm: "1.75rem",
                          md: "2.125rem",
                        },
                        fontWeight: 700,
                        color: "text.primary",
                        mb: 2,
                        wordBreak: "break-word",
                      }}
                    >
                      {restaurantInfo.name}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.5,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 1,
                        }}
                      >
                        <Typography
                          component="span"
                          sx={{
                            fontWeight: 700,
                            minWidth: { xs: "110px", sm: "140px" },
                            color: "text.secondary",
                            fontSize: { xs: "0.938rem", sm: "1rem" },
                          }}
                        >
                          {t("view.address")}
                        </Typography>
                        <Typography
                          sx={{
                            flex: 1,
                            fontSize: { xs: "0.938rem", sm: "1rem" },
                          }}
                        >
                          {restaurantInfo.address}
                        </Typography>
                      </Box>

                      {restaurantInfo.description && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 1,
                          }}
                        >
                          <Typography
                            component="span"
                            sx={{
                              fontWeight: 700,
                              minWidth: { xs: "110px", sm: "140px" },
                              color: "text.secondary",
                              fontSize: { xs: "0.938rem", sm: "1rem" },
                            }}
                          >
                            {t("view.description")}
                          </Typography>
                          <Typography
                            sx={{
                              flex: 1,
                              fontSize: { xs: "0.938rem", sm: "1rem" },
                              color: "text.secondary",
                            }}
                          >
                            {restaurantInfo.description}
                          </Typography>
                        </Box>
                      )}

                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography
                          component="span"
                          sx={{
                            fontWeight: 700,
                            minWidth: { xs: "110px", sm: "140px" },
                            color: "text.secondary",
                            fontSize: { xs: "0.938rem", sm: "1rem" },
                          }}
                        >
                          {t("view.status")}
                        </Typography>
                        {(() => {
                          const parseHHMM = (
                            v?: string
                          ): [number, number] | null => {
                            if (v && v.includes(":")) {
                              const [h, m] = v.split(":");
                              const hh = Number(h);
                              const mm = Number(m);
                              if (Number.isFinite(hh) && Number.isFinite(mm)) {
                                return [hh, mm];
                              }
                            }
                            return null;
                          };

                          const now = new Date();
                          const open = parseHHMM(restaurantInfo.openTime);
                          const close = parseHHMM(restaurantInfo.closeTime);

                          if (!open || !close) {
                            return (
                              <Chip
                                label={t("status.unknown")}
                                size="small"
                                sx={{ bgcolor: "grey.300" }}
                              />
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

                          const isOpen = now >= openDate && now <= closeDate;
                          return (
                            <Chip
                              label={
                                isOpen ? t("status.open") : t("status.closed")
                              }
                              color={isOpen ? "success" : "error"}
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          );
                        })()}
                      </Box>

                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography
                          component="span"
                          sx={{
                            fontWeight: 700,
                            minWidth: { xs: "110px", sm: "140px" },
                            color: "text.secondary",
                            fontSize: { xs: "0.938rem", sm: "1rem" },
                          }}
                        >
                          {t("view.hours")}
                        </Typography>
                        <Typography
                          sx={{ fontSize: { xs: "0.938rem", sm: "1rem" } }}
                        >
                          {restaurantInfo.openTime} - {restaurantInfo.closeTime}
                        </Typography>
                      </Box>

                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography
                          component="span"
                          sx={{
                            fontWeight: 700,
                            minWidth: { xs: "110px", sm: "140px" },
                            color: "text.secondary",
                            fontSize: { xs: "0.938rem", sm: "1rem" },
                          }}
                        >
                          {t("view.followers")}
                        </Typography>
                        <Chip
                          label={`${restaurantFavorites?.length ?? 0} người`}
                          color="primary"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>

                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography
                          component="span"
                          sx={{
                            fontWeight: 700,
                            minWidth: { xs: "110px", sm: "140px" },
                            color: "text.secondary",
                            fontSize: { xs: "0.938rem", sm: "1rem" },
                          }}
                        >
                          Đánh giá:
                        </Typography>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          {Array.from({ length: 5 }).map((_, idx) => {
                            const avgRating =
                              (
                                restaurantInfo as unknown as {
                                  averageRating?: number;
                                }
                              )?.averageRating ?? 0;
                            return (
                              <StarIcon
                                key={idx}
                                fontSize="small"
                                sx={{
                                  color:
                                    idx < Math.round(avgRating)
                                      ? "warning.main"
                                      : "grey.300",
                                }}
                              />
                            );
                          })}
                          <Typography
                            variant="body2"
                            sx={{
                              ml: 0.5,
                              fontWeight: 600,
                              fontSize: { xs: "0.875rem", sm: "0.938rem" },
                            }}
                          >
                            {(
                              (
                                restaurantInfo as unknown as {
                                  averageRating?: number;
                                }
                              )?.averageRating ?? 0
                            ).toFixed(1)}{" "}
                            {(totalReviewsFromState ?? 0) > 0 && (
                              <Typography
                                component="span"
                                color="text.secondary"
                                sx={{
                                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                }}
                              >
                                ({(totalReviewsFromState ?? 0).toLocaleString()}{" "}
                                {t("view.reviews_count")})
                              </Typography>
                            )}
                          </Typography>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mt: 0.5,
                        }}
                      >
                        {(() => {
                          const ri = restaurantInfo as unknown as {
                            isVerified?: boolean;
                          };
                          return ri.isVerified ? (
                            <Chip
                              label={t("verified")}
                              color="success"
                              size="medium"
                              sx={{ fontWeight: 600 }}
                            />
                          ) : null;
                        })()}
                      </Box>
                    </Box>
                  </Box>
                )}
              </Box>

              {isEditing && (
                <Box
                  sx={{
                    mt: 3,
                    pt: 2,
                    borderTop: "2px solid",
                    borderColor: "divider",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      flexDirection: { xs: "column", sm: "row" },
                    }}
                  >
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth={isMobile}
                      onClick={handleUpdate}
                      sx={{
                        py: 1.5,
                        fontSize: "1rem",
                        fontWeight: 600,
                        textTransform: "none",
                        boxShadow: 2,
                      }}
                    >
                      {t("btn.save_changes")}
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      fullWidth={isMobile}
                      onClick={handleCancelEdit}
                      sx={{
                        py: 1.5,
                        fontSize: "1rem",
                        fontWeight: 600,
                        textTransform: "none",
                        borderWidth: 2,
                        "&:hover": {
                          borderWidth: 2,
                        },
                      }}
                    >
                      {t("btn.cancel")}
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Paper>

        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              mb: 3,
              fontSize: { xs: "1.25rem", sm: "1.5rem" },
              fontWeight: 700,
            }}
          >
            {t("menu.title")}
          </Typography>

          {dishLoading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : dishes.length === 0 ? (
            <Paper
              elevation={2}
              sx={{
                p: 4,
                textAlign: "center",
                bgcolor: "background.paper",
                borderRadius: 2,
              }}
            >
              <Typography color="text.secondary">
                {t("menu.no_dishes")}
              </Typography>
            </Paper>
          ) : (
            <Box>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: { xs: 2, sm: 2.5, md: 3 },
                }}
              >
                {dishes.map((dish) => {
                  const discounted = bestDiscountByDishId.get(dish.id) ?? null;

                  return (
                    <Box
                      key={dish.id}
                      sx={{
                        flex: {
                          xs: "1 1 100%",
                          sm: "1 1 calc(50% - 10px)",
                          md: "1 1 calc(33.333% - 16px)",
                          lg: "1 1 calc(25% - 19px)",
                          xl: "1 1 calc(20% - 22px)",
                        },
                        minWidth: { xs: "100%", sm: "220px", md: "200px" },
                        maxWidth: {
                          xs: "100%",
                          sm: "calc(50% - 10px)",
                          md: "calc(33.333% - 16px)",
                          lg: "calc(25% - 19px)",
                          xl: "calc(20% - 22px)",
                        },
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <DishCard
                        dish={dish}
                        discountedPrice={discounted ?? null}
                      />
                    </Box>
                  );
                })}
              </Box>
              <Box display="flex" justifyContent="center" mt={2}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(_, page) => setCurrentPage(page)}
                  color="primary"
                />
              </Box>
            </Box>
          )}
        </Box>

        <Box>
          {reviewLoading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : reviews.length === 0 ? (
            <Paper
              elevation={2}
              sx={{
                p: 4,
                textAlign: "center",
                bgcolor: "background.paper",
                borderRadius: 2,
              }}
            >
              <Typography color="text.secondary">
                {t("reviews.no_reviews_for_restaurant")}
              </Typography>
            </Paper>
          ) : (
            <ReviewList
              reviews={reviews}
              loading={reviewLoading}
              onDelete={handleDeleteReview}
              showDeleteButton={true}
            />
          )}
        </Box>

        <Dialog
          open={deleteDialogOpen}
          onClose={cancelDeleteReview}
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
          PaperProps={{
            sx: {
              borderRadius: 2,
              minWidth: { xs: "90%", sm: 400 },
            },
          }}
        >
          <DialogTitle
            id="delete-dialog-title"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "1.125rem", sm: "1.25rem" },
            }}
          >
            {t("dialog.delete_review_title")}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="delete-dialog-description">
              {t("dialog.delete_review_text")}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, gap: 1 }}>
            <Button
              onClick={cancelDeleteReview}
              color="inherit"
              sx={{
                px: 3,
                py: 1,
                fontWeight: 600,
                textTransform: "none",
              }}
            >
              {t("btn.cancel")}
            </Button>
            <Button
              onClick={confirmDeleteReview}
              color="error"
              variant="contained"
              autoFocus
              sx={{
                px: 3,
                py: 1,
                fontWeight: 600,
                textTransform: "none",
                boxShadow: 2,
              }}
            >
              {t("btn.delete")}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default RestaurantPage;
