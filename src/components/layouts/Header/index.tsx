"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Box,
  Button,
  Popover,
  TextField,
  MenuItem,
  Typography,
  IconButton,
  Badge,
  Autocomplete,
} from "@mui/material";
import { useSignalR } from "@/lib/signalr";
import { fetchOrdersByUser } from "@/redux/slices/orderSlice";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SearchIcon from "@mui/icons-material/Search";
import { FaUserCircle } from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import {
  fetchRestaurants,
  fetchRestaurantsByCategory,
  fetchRestaurantSearchSuggestions,
} from "@/redux/slices/restaurantSlice";
import { useRouter } from "next/navigation";
import { clearUser, logoutUser } from "@/redux/slices/userSlice";
import { getImageUrl } from "@/constants/config/imageBaseUrl";
import { getAccessToken } from "@/lib/utils/tokenHelper";
import LanguageSelector from "@/components/layouts/LanguageSelector";
import ThemeToggleButton from "@/components/layouts/ThemeToggleButton";
import { useTranslations } from "next-intl";
import styles from "./styles.module.scss";

const Header = () => {
  const [localUserName, setLocalUserName] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [query, setQuery] = useState<string>("");
  const suggTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (suggTimer.current) window.clearTimeout(suggTimer.current);
    };
  }, []);

  const dispatch = useAppDispatch();
  const t = useTranslations("header");
  const router = useRouter();
  // Determine role from Redux or localStorage
  const [currentRole, setCurrentRole] = useState<string | null>(null);

  // suggestions from redux
  const { suggestions: searchSuggestions = [], loadingSuggestions } =
    useAppSelector((s) => s.restaurant);

  // Lấy user từ Redux để detect khi login thành công
  const currentUser = useAppSelector((state) => state.user.user);

  // ✅ Lấy thông tin giỏ hàng từ Redux
  // ✅ Lấy toàn bộ danh sách đơn hàng của user
  const orders = useAppSelector((state) => state.order.orders);

  // ✅ Đếm số lượng đơn hàng
  const totalOrders = orders?.length || 0;

  useEffect(() => {
    // Khi user đăng nhập (Redux hoặc localStorage), gọi API lấy giỏ hàng hiện tại
    let id: number | undefined | null = undefined;

    // 1) Nếu có user trong Redux (thường xảy ra ngay khi login thành công)
    if (currentUser && typeof currentUser === "object") {
      // backend/user shape có thể là userId hoặc id
      const cu = currentUser as unknown as {
        userId?: number;
        id?: number;
      };
      id = cu.userId ?? cu.id;
    }

    // 2) Fallback: kiểm tra localStorage (trường hợp reload trang)
    if (!id) {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          id = parsed?.userId ?? parsed?.id;
        } catch {
          // ignore parse error
        }
      }
    }

    if (id) {
      console.log("🧩 Fetching orders for user:", id);
      dispatch(fetchOrdersByUser(Number(id)));
    }
  }, [dispatch, currentUser]);

  useEffect(() => {
    setHydrated(true);

    // ✅ Kiểm tra access_token từ cookie
    const token = getAccessToken();
    setIsLoggedIn(!!token);

    try {
      // Prefer Redux user (available immediately after login), fallback to localStorage
      if (currentUser && typeof currentUser === "object") {
        const cu = currentUser as unknown as {
          userName?: string;
          fullName?: string;
          name?: string;
          role?: string;
        };
        const userName = cu.userName || cu.fullName || cu.name || "User";
        setLocalUserName(userName);
        setCurrentRole(cu.role ?? null);
        setIsLoggedIn(true); // ✅ Đảm bảo set isLoggedIn khi có user trong Redux
      } else {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          const userName =
            parsedUser?.userName ||
            parsedUser?.fullName ||
            parsedUser?.name ||
            "User";
          setLocalUserName(userName);
          setCurrentRole(parsedUser?.role ?? null);
          setIsLoggedIn(true); // ✅ Đảm bảo set isLoggedIn khi có user trong localStorage
        } else {
          setIsLoggedIn(false);
          setLocalUserName(null);
          setCurrentRole(null);
        }
      }
    } catch (e) {
      console.error("Lỗi khi lấy user từ localStorage:", e);
      setIsLoggedIn(false);
      setLocalUserName(null);
      setCurrentRole(null);
    }
  }, [currentUser]);

  // Chỉ fetch danh sách nhà hàng khi hiển thị khối tìm kiếm (user hoặc chưa đăng nhập)
  useEffect(() => {
    const canShowSearch = !isLoggedIn || currentRole === "user";
    if (!canShowSearch) return; // tránh gọi API khi role khác -> giảm lỗi 502
    if (selectedCategory === "All") {
      dispatch(fetchRestaurants());
    } else {
      dispatch(fetchRestaurantsByCategory(selectedCategory));
    }
  }, [selectedCategory, dispatch, isLoggedIn, currentRole]);

  const handleSearchSubmit = (q?: string) => {
    const finalQ = (q ?? query).trim();
    if (!finalQ) {
      // empty -> go home and show all
      dispatch(fetchRestaurants());
      router.push("/");
      return;
    }
    // Navigate to dedicated search results page
    router.push(`/search?q=${encodeURIComponent(finalQ)}`);
  };

  const handleLogout = () => {
    // ✅ Gọi API logout để revoke refresh tokens ở BE
    const userId = currentUser?.userId;

    if (userId) {
      // Có userId, gọi API logout
      dispatch(logoutUser(userId)).finally(() => {
        // Sau khi logout (thành công hoặc thất bại), redirect về login
        setIsLoggedIn(false);
        setLocalUserName(null);
        window.location.href = "/login";
      });
    } else {
      // Không có userId (trường hợp bất thường), vẫn clear local data
      dispatch(clearUser());
      setIsLoggedIn(false);
      setLocalUserName(null);
      window.location.href = "/login";
    }
  };

  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotifOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const handleNotifClose = () => {
    setNotifAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const notifOpen = Boolean(notifAnchorEl);

  // Notifications state
  const [notifications, setNotifications] = useState<
    {
      id: string;
      title: string;
      message: string;
      createdAt: number;
      read?: boolean;
    }[]
  >([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Register SignalR for realtime notifications when logged in
  useSignalR({
    enabled: isLoggedIn,
    onNotification: (title?: string, message?: string) => {
      console.log("🔔 [Header] onNotification callback triggered!");
      console.log("   Title:", title);
      console.log("   Message:", message);
      try {
        const id = String(Date.now()) + Math.random().toString(36).slice(2, 8);
        const newNotif = {
          id,
          title: title || "",
          message: message || "",
          createdAt: Date.now(),
          read: false,
        };
        console.log("   Created notification object:", newNotif);
        setNotifications((prev) => {
          const updated = [newNotif, ...prev];
          console.log("   Updated notifications array:", updated);
          return updated;
        });
      } catch (e) {
        console.error("❌ Error handling realtime notification:", e);
      }
    },
  });

  if (!hydrated) return null;

  return (
    <Box
      className={styles.headerWrapper}
      sx={(theme) => ({
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        color: theme.palette.text.primary,
      })}
    >
      <Box
        className={styles.headerInner}
        sx={{
          justifyContent: "space-between !important",
        }}
      >
        {/* Left: Logo */}
        {currentRole === "user" ? (
          <Link href="/">
            <Image
              src={getImageUrl("Logo/anhdaidienmoi.png")}
              alt={t("logo_alt")}
              width={70}
              height={50}
              priority
            />
          </Link>
        ) : (
          <Box sx={{ cursor: "default" }}>
            <Image
              src={getImageUrl("Logo/anhdaidienmoi.png")}
              alt={t("logo_alt")}
              width={70}
              height={50}
              priority
            />
          </Box>
        )}

        {/* Middle: Filter + Search - hiển thị cho user hoặc chưa đăng nhập */}
        {(!isLoggedIn || currentRole === "user") && (
          <Box className={styles.searchSection}>
            {/* <TextField
              select
              defaultValue="TP. HCM"
              size="small"
              variant="standard"
              className={styles.citySelect}
            >
              <MenuItem value="TP. HCM">TP. HCM</MenuItem>
              <MenuItem value="HN">Hà Nội</MenuItem>
              <MenuItem value="DN">Đà Nẵng</MenuItem>
            </TextField> */}

            <TextField
              select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              size="small"
              variant="standard"
              className={styles.categorySelect}
            >
              <MenuItem value="All">{t("category_all")}</MenuItem>
              <MenuItem value="Buffet">{t("category_buffet")}</MenuItem>
              <MenuItem value="NhaHang">{t("category_nhahang")}</MenuItem>
              <MenuItem value="AnVatViaHe">{t("category_anvatviahe")}</MenuItem>
              <MenuItem value="AnChay">{t("category_anchay")}</MenuItem>
              <MenuItem value="CafeNuocuong">
                {t("category_cafenuocuong")}
              </MenuItem>
              <MenuItem value="QuanAn">{t("category_quanan")}</MenuItem>
              <MenuItem value="Bar">{t("category_bar")}</MenuItem>
              <MenuItem value="QuanNhau">{t("category_quannhau")}</MenuItem>
            </TextField>

            <Autocomplete
              freeSolo
              options={searchSuggestions}
              loading={loadingSuggestions}
              inputValue={query}
              onInputChange={(e, value) => {
                setQuery(value);
                if (suggTimer.current) {
                  window.clearTimeout(suggTimer.current);
                }
                if ((value ?? "").trim().length >= 2) {
                  suggTimer.current = window.setTimeout(() => {
                    dispatch(
                      fetchRestaurantSearchSuggestions((value ?? "").trim())
                    );
                  }, 300);
                }
              }}
              onChange={(_, value) => {
                const val = typeof value === "string" ? value : value ?? "";
                setQuery(val as string);
                handleSearchSubmit(val as string);
              }}
              sx={{ flex: "1 1 0" }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  size="small"
                  variant="outlined"
                  placeholder={t("search_placeholder")}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <SearchIcon
                        onClick={() => handleSearchSubmit()}
                        style={{ cursor: "pointer" }}
                      />
                    ),
                  }}
                  className={styles.searchInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearchSubmit();
                    }
                  }}
                />
              )}
            />
          </Box>
        )}
        {/* Right: Auth, Notification, Language, Theme */}
        <Box className={styles.rightSection}>
          {isLoggedIn ? (
            <>
              <IconButton
                onClick={handlePopoverOpen}
                sx={{
                  p: 0.5,
                  "& svg": {
                    fontSize: { xs: 20, sm: 20, md: 24 },
                    width: { xs: 20, sm: 20, md: 24 },
                    height: { xs: 20, sm: 20, md: 24 },
                  },
                }}
              >
                <FaUserCircle />
              </IconButton>
              <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handlePopoverClose}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
              >
                <Box
                  className={styles.popoverBox}
                  sx={(theme) => ({
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    boxShadow: theme.shadows[4],
                    border: `1px solid ${theme.palette.divider}`,
                  })}
                >
                  <Typography fontWeight={600} mb={1}>
                    {t("welcome_text")}, {localUserName}
                  </Typography>
                  <Link href="/account">
                    <Button fullWidth size="small" variant="text">
                      {t("account_btn_title")}
                    </Button>
                  </Link>
                  <Link href="/purchase">
                    <Button fullWidth size="small" variant="text">
                      {t("my_purchase_btn_title")}
                    </Button>
                  </Link>
                  <Link href="/bookingtable">
                    <Button fullWidth size="small" variant="text">
                      {t("my_booking_btn_title")}
                    </Button>
                  </Link>
                  <Button
                    fullWidth
                    size="small"
                    variant="text"
                    color="error"
                    onClick={handleLogout}
                  >
                    {t("logout_btn_title")}
                  </Button>
                </Box>
              </Popover>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button size="small" variant="text">
                  {t("login_btn_title")}
                </Button>
              </Link>
              <Link href="/register">
                <Button size="small" variant="text">
                  {t("register_btn_title")}
                </Button>
              </Link>
            </>
          )}

          {/* ✅ Icon giỏ hàng có badge hiển thị số lượng món - Only show for User role */}
          {currentRole === "user" && (
            <Link href="/cart">
              <IconButton>
                <Badge badgeContent={totalOrders} color="primary">
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>
            </Link>
          )}

          <IconButton onClick={handleNotifOpen} aria-label="notifications">
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsNoneIcon />
            </Badge>
          </IconButton>

          <Popover
            open={notifOpen}
            anchorEl={notifAnchorEl}
            onClose={handleNotifClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          >
            <Box sx={{ width: 320, maxHeight: 360, overflow: "auto", p: 1 }}>
              <Typography fontWeight={600} mb={1} px={1}>
                {t("notifications_title") || "Notifications"}
              </Typography>
              {notifications.length === 0 ? (
                <Box px={1} py={2}>
                  <Typography variant="body2">
                    {t("no_notifications") || "No notifications"}
                  </Typography>
                </Box>
              ) : (
                notifications.map((n) => (
                  <Box
                    key={n.id}
                    sx={{
                      p: 1,
                      borderBottom: "1px solid rgba(0,0,0,0.04)",
                      background: n.read ? "transparent" : "rgba(0,0,0,0.02)",
                    }}
                  >
                    <Typography variant="subtitle2">{n.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {n.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(n.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </Popover>

          <LanguageSelector />
          <ThemeToggleButton />
        </Box>
      </Box>
    </Box>
  );
};

export default Header;
