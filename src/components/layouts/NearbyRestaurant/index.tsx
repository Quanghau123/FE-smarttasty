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
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { fetchNearbyRestaurants } from "@/redux/slices/restaurantSlice";
import { Restaurant } from "@/types/restaurant";
import StarIcon from "@mui/icons-material/Star";
import styles from "./styles.module.scss";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
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
  iconUrl: "/marker-icon-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const NearbyRestaurantsPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { nearby, loadingNearby } = useAppSelector((state) => state.restaurant);

  const [userPosition, setUserPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

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
          setError("Bạn cần cho phép truy cập vị trí để xem nhà hàng gần bạn.");
        }
      );
    } else {
      setError("Trình duyệt của bạn không hỗ trợ định vị.");
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
        <DialogTitle>Cho phép Smarttasty truy cập vị trí</DialogTitle>
        <DialogContent>
          <Typography>
            Cho phép Smarttasty quyền vị trí để tìm kiếm chính xác điểm đến xung
            quanh bạn
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLater}>Để sau</Button>
          <Button variant="contained" color="error" onClick={handleAllow}>
            Cho phép
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
          Không tìm thấy nhà hàng gần bạn hoặc bạn chưa cho phép sử dụng vị trí.
        </Typography>
      ) : (
        <Box className={styles.mainContent}>
          {/* Danh sách nhà hàng */}
          <Box className={styles.list}>
            {nearby.map((restaurant: Restaurant) => (
              <Card
                key={restaurant.id}
                className={styles.card}
                onClick={() =>
                  router.push(`/RestaurantDetails/${restaurant.id}`)
                }
                sx={{ cursor: "pointer" }} // để hiện dấu tay khi hover
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
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <StarIcon
                        key={idx}
                        fontSize="small"
                        color={idx < restaurant.rating ? "warning" : "disabled"}
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

                  {restaurant.distanceKm && (
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      Cách bạn {restaurant.distanceKm.toFixed(2)} km
                    </Typography>
                  )}

                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation(); // tránh click button cũng chạy click Card
                      router.push(`/RestaurantDetails/${restaurant.id}`);
                    }}
                  >
                    Đặt chỗ ngay
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Bản đồ */}
          <Box className={styles.map}>
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
                  <Popup>Bạn đang ở đây</Popup>
                </Marker>
              )}
              {nearby.map((restaurant) => (
                <Marker
                  key={restaurant.id}
                  position={[restaurant.latitude, restaurant.longitude]}
                  icon={restaurantIcon}
                >
                  <Popup>
                    <Typography fontWeight="bold">{restaurant.name}</Typography>
                    <Typography variant="body2">
                      {restaurant.address}
                    </Typography>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </Box>
        </Box>
      )}

      {/* Snackbar báo lỗi */}
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
