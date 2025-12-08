"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Button,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTranslations } from "next-intl";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { fetchNearbyRestaurants } from "@/redux/slices/restaurantSlice";
import { Restaurant } from "@/types/restaurant";
import StarIcon from "@mui/icons-material/Star";
import CloseIcon from "@mui/icons-material/Close";
import DirectionsIcon from "@mui/icons-material/Directions";
import styles from "./styles.module.scss";
import nhahang from "@/assets/Image/MapView/nhahang.png";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Cài đặt icon mặc định
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/marker-icon-blue.png",
  iconUrl: "/marker-icon-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Icon cho user
const userIcon = new L.Icon({
  iconUrl: "/marker-icon-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Icon cho restaurant
const restaurantIcon = new L.Icon({
  iconUrl: (nhahang as { src: string }).src,
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Types cho OSRM API response
interface OSRMManeuver {
  type: string;
  modifier?: string;
  instruction?: string;
  exit?: number;
}

interface OSRMStep {
  distance: number;
  duration: number;
  name?: string;
  mode?: string;
  maneuver?: OSRMManeuver;
}

interface OSRMLeg {
  steps: OSRMStep[];
}

interface OSRMRoute {
  distance: number;
  duration: number;
  geometry: {
    coordinates: Array<[number, number]>;
  };
  legs: OSRMLeg[];
}

const NearbyRestaurantsPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const t = useTranslations("layout");
  const { nearby, loadingNearby } = useAppSelector((state) => state.restaurant);
  const isMobile = useMediaQuery("(max-width:600px)");
  const [mobileView, setMobileView] = useState<"list" | "map">("list");

  // Hàm tạo câu hướng dẫn từ translation
  const createInstruction = (
    type: string,
    modifier: string,
    streetName: string,
    exit?: number
  ): string => {
    const hasStreet = !!streetName;
    const streetType = hasStreet ? "withStreet" : "withoutStreet";

    switch (type) {
      case "depart":
        return t(
          `nearbyRestaurant.directions.instructions.depart.${streetType}`,
          {
            street: streetName,
          }
        );

      case "arrive":
        return t(
          `nearbyRestaurant.directions.instructions.arrive.${streetType}`,
          {
            street: streetName,
          }
        );

      case "turn": {
        // Lấy hướng từ translation hoặc dùng modifier làm fallback
        const directionKey = `nearbyRestaurant.directions.instructions.turn.directions.${modifier}`;
        const direction = modifier
          ? t(directionKey, { defaultValue: modifier })
          : "";
        return t(
          `nearbyRestaurant.directions.instructions.turn.${streetType}`,
          {
            direction,
            street: streetName,
          }
        );
      }

      case "continue":
        return t(
          `nearbyRestaurant.directions.instructions.continue.${streetType}`,
          {
            street: streetName,
          }
        );

      case "merge":
        return t(
          `nearbyRestaurant.directions.instructions.merge.${streetType}`,
          {
            street: streetName,
          }
        );

      case "on ramp":
      case "off ramp":
        return t(
          `nearbyRestaurant.directions.instructions.ramp.${streetType}`,
          {
            street: streetName,
          }
        );

      case "roundabout":
        return t(
          `nearbyRestaurant.directions.instructions.roundabout.${streetType}`,
          {
            exit: exit || 1,
            street: streetName,
          }
        );

      default:
        return t(
          `nearbyRestaurant.directions.instructions.fallback.${streetType}`,
          {
            street: streetName,
          }
        );
    }
  };

  const [userPosition, setUserPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [routeCoords, setRouteCoords] = useState<Array<
    [number, number]
  > | null>(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<
    number | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [directions, setDirections] = useState<Array<{
    instruction: string;
    distance: number;
    duration: number;
    streetName?: string;
    mode?: string;
  }> | null>(null);
  const [routeInfo, setRouteInfo] = useState<{
    totalDistance: number;
    totalDuration: number;
  } | null>(null);
  const [showDirections, setShowDirections] = useState(false);

  // Lấy vị trí từ session hoặc hỏi người dùng
  useEffect(() => {
    const saved = sessionStorage.getItem("user_location");
    if (saved) {
      const { lat, lng } = JSON.parse(saved);
      setUserPosition({ lat, lng });
      dispatch(fetchNearbyRestaurants({ lat, lng }));
    } else {
      setOpenDialog(true); // Hiện popup nếu chưa có vị trí
    }
  }, [dispatch]);

  // Hàm lấy vị trí thực tế từ browser
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          setUserPosition({ lat, lng });
          sessionStorage.setItem("user_location", JSON.stringify({ lat, lng }));
          dispatch(fetchNearbyRestaurants({ lat, lng }));
        },
        (err) => {
          console.error("Không lấy được vị trí:", err);
          setError(t("nearbyRestaurant.errors.location_permission"));
        }
      );
    } else {
      setError(t("nearbyRestaurant.errors.geo_not_supported"));
    }
  };

  const handleAllow = () => {
    setOpenDialog(false);
    getUserLocation();
  };

  const handleLater = () => {
    setOpenDialog(false);
  };

  const handleCloseSnackbar = () => {
    setError(null);
  };

  return (
    <Box className={styles.container}>
      {/* Modal xin quyền location */}
      <Dialog open={openDialog}>
        <DialogTitle>{t("nearbyRestaurant.dialog.title")}</DialogTitle>
        <DialogContent>
          <Typography>{t("nearbyRestaurant.dialog.content")}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLater}>
            {t("nearbyRestaurant.btn.later")}
          </Button>
          <Button variant="contained" color="error" onClick={handleAllow}>
            {t("nearbyRestaurant.btn.allow")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading */}
      {loadingNearby ? (
        <Box display="flex" justifyContent="center" mt={2} mb={2}>
          <CircularProgress size={24} />
        </Box>
      ) : nearby.length === 0 ? (
        <Typography color="text.secondary" mb={3}>
          {t("nearbyRestaurant.empty.no_nearby")}
        </Typography>
      ) : (
        <>
          {isMobile && (
            <Box className={styles.mobileToggle}>
              <ToggleButtonGroup
                value={mobileView}
                exclusive
                onChange={(_, v) => v && setMobileView(v)}
                sx={{ width: "100%" }}
                aria-label={t("nearbyRestaurant.aria.toggleView")}
              >
                <ToggleButton
                  value="list"
                  aria-label={t("nearbyRestaurant.toggle.list")}
                >
                  {t("nearbyRestaurant.toggle.list")}
                </ToggleButton>
                <ToggleButton
                  value="map"
                  aria-label={t("nearbyRestaurant.toggle.map")}
                >
                  {t("nearbyRestaurant.toggle.map")}
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          )}

          <Box className={styles.mainContent}>
            {/* Danh sách nhà hàng */}
            {(!isMobile || mobileView === "list") && (
              <Box className={styles.list}>
                {nearby.map((restaurant: Restaurant) => (
                  <Card
                    key={restaurant.id}
                    className={styles.card}
                    onClick={() =>
                      router.push(`/RestaurantDetails/${restaurant.id}`)
                    }
                    sx={{ cursor: "pointer" }}
                  >
                    <Box
                      component="img"
                      src={restaurant.imageUrl}
                      alt={restaurant.name}
                      sx={{
                        width: "100%",
                        height: { xs: 160, sm: 180, md: 200 },
                        objectFit: "cover",
                        borderTopLeftRadius: "4px",
                        borderTopRightRadius: "4px",
                      }}
                    />

                    <CardContent className={styles.content}>
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
                          const avg =
                            restaurant.averageRating ?? restaurant.rating ?? 0;
                          return (
                            <>
                              {Array.from({ length: 5 }).map((_, idx) => (
                                <StarIcon
                                  key={idx}
                                  fontSize="small"
                                  color={idx < avg ? "warning" : "disabled"}
                                />
                              ))}
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
                        {restaurant.address}
                      </Typography>

                      {restaurant.distanceKm && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          mb={1}
                        >
                          {t("nearbyRestaurant.labels.distance", {
                            distance: restaurant.distanceKm.toFixed(2),
                          })}
                        </Typography>
                      )}

                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/RestaurantDetails/${restaurant.id}`);
                        }}
                      >
                        {t("nearbyRestaurant.btn.reserve_now")}
                      </Button>
                      <Box mt={1}>
                        <Button
                          variant="outlined"
                          color="secondary"
                          fullWidth
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!userPosition) {
                              setError(
                                t("nearbyRestaurant.errors.permission_needed")
                              );
                              return;
                            }
                            setSelectedRestaurantId(restaurant.id);
                            const userLon = userPosition.lng;
                            const userLat = userPosition.lat;
                            const destLon = restaurant.longitude;
                            const destLat = restaurant.latitude;

                            fetch(
                              `https://router.project-osrm.org/route/v1/driving/${userLon},${userLat};${destLon},${destLat}?overview=full&geometries=geojson&steps=true`
                            )
                              .then((r) => r.json())
                              .then((data: { routes?: OSRMRoute[] }) => {
                                if (
                                  data &&
                                  data.routes &&
                                  data.routes.length > 0
                                ) {
                                  const route: OSRMRoute = data.routes[0];
                                  const coords: Array<[number, number]> =
                                    route.geometry.coordinates.map(
                                      (c: [number, number]) => [c[1], c[0]]
                                    );
                                  setRouteCoords(coords);

                                  // Lấy thông tin tổng quát về tuyến đường
                                  setRouteInfo({
                                    totalDistance: route.distance,
                                    totalDuration: route.duration,
                                  });

                                  // Lấy các bước chỉ đường chi tiết
                                  const steps: Array<{
                                    instruction: string;
                                    distance: number;
                                    duration: number;
                                    streetName?: string;
                                    mode?: string;
                                  }> = [];

                                  route.legs.forEach((leg: OSRMLeg) => {
                                    leg.steps.forEach((step: OSRMStep) => {
                                      const streetName = step.name || "";
                                      const mode = step.mode || "driving";
                                      let instruction = "";

                                      if (step.maneuver) {
                                        const maneuver = step.maneuver;
                                        const type = maneuver.type || "";
                                        const modifier =
                                          maneuver.modifier || "";
                                        const exit = maneuver.exit;

                                        // Sử dụng hàm tạo câu hướng dẫn đa ngôn ngữ
                                        instruction = createInstruction(
                                          type,
                                          modifier,
                                          streetName,
                                          exit
                                        );
                                      } else {
                                        const hasStreet = !!streetName;
                                        instruction = t(
                                          `nearbyRestaurant.directions.instructions.fallback.${
                                            hasStreet
                                              ? "withStreet"
                                              : "withoutStreet"
                                          }`,
                                          { street: streetName }
                                        );
                                      }

                                      if (instruction) {
                                        steps.push({
                                          instruction,
                                          distance: step.distance,
                                          duration: step.duration,
                                          streetName,
                                          mode,
                                        });
                                      }
                                    });
                                  });

                                  setDirections(steps);
                                  setShowDirections(true);
                                  return;
                                }
                                setRouteCoords([
                                  [userLat, userLon],
                                  [destLat, destLon],
                                ]);
                                setDirections(null);
                                setRouteInfo(null);
                              })
                              .catch(() => {
                                setRouteCoords([
                                  [userLat, userLon],
                                  [destLat, destLon],
                                ]);
                                setDirections(null);
                                setRouteInfo(null);
                              });
                            if (isMobile) setMobileView("map");
                          }}
                        >
                          {t("nearbyRestaurant.btn.get_directions")}
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}

            {/* Bản đồ */}
            {(!isMobile || mobileView === "map") && (
              <Box
                className={`${styles.map} ${
                  showDirections ? styles.withDirections : ""
                }`}
              >
                <MapContainer
                  center={
                    userPosition
                      ? [userPosition.lat, userPosition.lng]
                      : [10.7769, 106.7009]
                  }
                  zoom={14}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {userPosition && (
                    <Marker
                      position={[userPosition.lat, userPosition.lng]}
                      icon={userIcon}
                    >
                      <Popup>{t("nearbyRestaurant.map.youAreHere")}</Popup>
                    </Marker>
                  )}
                  {nearby.map((restaurant) => (
                    <Marker
                      key={restaurant.id}
                      position={[restaurant.latitude, restaurant.longitude]}
                      icon={restaurantIcon}
                    >
                      <Popup>
                        <Typography fontWeight="bold">
                          {restaurant.name}
                        </Typography>
                        <Typography variant="body2">
                          {restaurant.address}
                        </Typography>
                      </Popup>
                    </Marker>
                  ))}
                  {routeCoords && (
                    <>
                      <Polyline
                        positions={routeCoords}
                        color="blue"
                        weight={4}
                      />
                      {selectedRestaurantId &&
                        (() => {
                          const r = nearby.find(
                            (x) => x.id === selectedRestaurantId
                          );
                          if (!r) return null;
                          return (
                            <Marker
                              position={[r.latitude, r.longitude]}
                              icon={restaurantIcon}
                            >
                              <Popup>
                                <Typography fontWeight="bold">
                                  {r.name}
                                </Typography>
                                <Typography variant="body2">
                                  {r.address}
                                </Typography>
                              </Popup>
                            </Marker>
                          );
                        })()}
                    </>
                  )}
                </MapContainer>
              </Box>
            )}

            {/* Panel hướng dẫn chỉ đường */}
            {(!isMobile || mobileView === "map") &&
              showDirections &&
              directions && (
                <Box className={styles.directionsPanel}>
                  <Box className={styles.header}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <DirectionsIcon color="primary" />
                      <Typography variant="h6" fontWeight="bold">
                        {t("nearbyRestaurant.directions.title")}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      onClick={() => {
                        setShowDirections(false);
                        setRouteCoords(null);
                        setDirections(null);
                        setRouteInfo(null);
                        setSelectedRestaurantId(null);
                      }}
                      startIcon={<CloseIcon />}
                    >
                      {t("nearbyRestaurant.btn.close")}
                    </Button>
                  </Box>

                  {routeInfo && (
                    <Box className={styles.routeInfo}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        <strong>
                          {t("nearbyRestaurant.directions.distance")}:
                        </strong>{" "}
                        {(routeInfo.totalDistance / 1000).toFixed(2)} km
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>
                          {t("nearbyRestaurant.directions.duration")}:
                        </strong>{" "}
                        {Math.round(routeInfo.totalDuration / 60)}{" "}
                        {t("nearbyRestaurant.directions.minutes")}
                      </Typography>
                    </Box>
                  )}

                  <Box>
                    {directions.map((step, index) => (
                      <Box
                        key={index}
                        className={`${styles.stepCard} ${
                          index === 0 ? styles.active : ""
                        }`}
                      >
                        <Box display="flex" alignItems="flex-start" gap={2}>
                          <Box
                            sx={{
                              minWidth: 28,
                              height: 28,
                              borderRadius: "50%",
                              bgcolor:
                                index === 0 ? "primary.dark" : "primary.main",
                              color: "primary.contrastText",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "bold",
                              fontSize: "0.875rem",
                            }}
                          >
                            {index + 1}
                          </Box>
                          <Box flex={1}>
                            <Typography
                              variant="body2"
                              fontWeight="medium"
                              gutterBottom
                            >
                              {step.instruction}
                            </Typography>
                            {step.streetName && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "primary.main",
                                  fontWeight: 500,
                                  display: "block",
                                  mb: 0.5,
                                }}
                              >
                                📍 {step.streetName}
                              </Typography>
                            )}
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {step.distance > 0 && (
                                <>
                                  {step.distance >= 1000
                                    ? `${(step.distance / 1000).toFixed(1)} km`
                                    : `${Math.round(step.distance)} m`}
                                  {step.duration > 0 && (
                                    <>
                                      {" • "}
                                      {Math.round(step.duration / 60)}{" "}
                                      {t("nearbyRestaurant.directions.minutes")}
                                    </>
                                  )}
                                </>
                              )}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
          </Box>
        </>
      )}
      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="error" onClose={handleCloseSnackbar}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NearbyRestaurantsPage;
