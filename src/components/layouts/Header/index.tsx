"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Box,
  Button,
  Popover,
  TextField,
  Typography,
  IconButton,
  Badge,
  Autocomplete,
  Menu,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useSignalR } from "@/lib/signalr";
import { fetchOrdersByUser } from "@/redux/slices/orderSlice";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SearchIcon from "@mui/icons-material/Search";
import WavingHandIcon from "@mui/icons-material/WavingHand";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import LogoutIcon from "@mui/icons-material/Logout";
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
import { useScrollContext } from "@/components/commons/contexts/ScrollContext";

const Header = () => {
  const { scrollToAllRestaurants } = useScrollContext();
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const iconPx = isXs ? 22 : 26; // unified icon size for mobile
  const [localUserName, setLocalUserName] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
  const [authAnchorEl, setAuthAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [categoryMenuAnchor, setCategoryMenuAnchor] =
    useState<HTMLElement | null>(null);
  const isCategoryMenuOpen = Boolean(categoryMenuAnchor);
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

  const handleAuthOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAuthAnchorEl(event.currentTarget);
  };

  const handleAuthClose = () => {
    setAuthAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const notifOpen = Boolean(notifAnchorEl);
  const authOpen = Boolean(authAnchorEl);

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
              width={90}
              height={90}
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
            <>
              <IconButton
                onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                  setCategoryMenuAnchor(e.currentTarget)
                }
                sx={{
                  width: 50,
                  height: 50,
                  textTransform: "none",
                  backgroundColor: "transparent",
                  "&:hover": { backgroundColor: "transparent" },
                  "&:active": { backgroundColor: "transparent" },
                }}
              >
                <MenuIcon sx={{ fontSize: iconPx }} />
              </IconButton>

              <Menu
                anchorEl={categoryMenuAnchor}
                open={isCategoryMenuOpen}
                onClose={() => setCategoryMenuAnchor(null)}
                PaperProps={{
                  sx: {
                    padding: 1,
                    minWidth: 300,
                  },
                }}
                MenuListProps={{
                  sx: {
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)", // 3 cột đều
                    gap: 1,
                    padding: 0,
                  },
                }}
              >
                {[
                  { key: "All", label: t("category_all") },
                  { key: "Buffet", label: t("category_buffet") },
                  { key: "NhaHang", label: t("category_nhahang") },
                  { key: "AnVatViaHe", label: t("category_anvatviahe") },
                  { key: "AnChay", label: t("category_anchay") },
                  { key: "CafeNuocuong", label: t("category_cafenuocuong") },
                  { key: "QuanAn", label: t("category_quanan") },
                  { key: "Bar", label: t("category_bar") },
                  { key: "QuanNhau", label: t("category_quannhau") },
                ].map((item) => (
                  <Box
                    key={item.key}
                    component="button"
                    onClick={() => {
                      setSelectedCategory(item.key);
                      setCategoryMenuAnchor(null);
                      // Cuộn xuống phần "Tất cả nhà hàng"
                      if (scrollToAllRestaurants) {
                        setTimeout(() => scrollToAllRestaurants(), 100);
                      }
                    }}
                    sx={{
                      border: "1px solid #e0e0e0",
                      borderRadius: 1,
                      paddingY: 1,
                      paddingX: 0.5,
                      backgroundColor: "transparent",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      "&:hover": { backgroundColor: "rgba(0,0,0,0.08)" },
                    }}
                  >
                    {item.label}
                  </Box>
                ))}
              </Menu>
            </>

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
                        style={{ cursor: "pointer", fontSize: iconPx }}
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
                  p: 1,
                  "& svg": {
                    fontSize: iconPx,
                    width: iconPx,
                    height: iconPx,
                  },
                }}
              >
                <FaUserCircle size={iconPx} />
              </IconButton>
              <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handlePopoverClose}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "left",
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
                  <Typography
                    fontWeight={600}
                    mb={1}
                    display="flex"
                    alignItems="center"
                    gap={1}
                    paddingBottom={2}
                    borderBottom={`1px solid #eee`}
                  >
                    <WavingHandIcon fontSize="small" />
                    {localUserName}
                  </Typography>

                  <Link href="/account">
                    <Button
                      fullWidth
                      size="small"
                      variant="text"
                      sx={{
                        justifyContent: "flex-start",
                        gap: 1,
                        paddingBottom: 1,
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      <PersonOutlineIcon fontSize="small" />
                      {t("account_btn_title")}
                    </Button>
                  </Link>

                  <Link href="/purchase">
                    <Button
                      fullWidth
                      size="small"
                      variant="text"
                      sx={{
                        justifyContent: "flex-start",
                        gap: 1,
                        paddingBottom: 1,
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      <ReceiptLongIcon fontSize="small" />
                      {t("my_purchase_btn_title")}
                    </Button>
                  </Link>

                  <Link href="/bookingtable">
                    <Button
                      fullWidth
                      size="small"
                      variant="text"
                      sx={{
                        justifyContent: "flex-start",
                        gap: 1,
                        paddingBottom: 1,
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      <EventSeatIcon fontSize="small" />
                      {t("my_booking_btn_title")}
                    </Button>
                  </Link>

                  <Button
                    fullWidth
                    size="small"
                    variant="text"
                    color="error"
                    onClick={handleLogout}
                    sx={{
                      justifyContent: "flex-center",
                      gap: 1,
                      paddingTop: 1.5,
                    }}
                  >
                    <LogoutIcon fontSize="small" />
                    {t("logout_btn_title")}
                  </Button>
                </Box>
              </Popover>
            </>
          ) : (
            <>
              {/* Desktop: keep separate buttons; Mobile: single icon with popover */}
              <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 1 }}>
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
              </Box>

              <IconButton
                onClick={handleAuthOpen}
                sx={{ display: { xs: "inline-flex", sm: "none" }, p: 1 }}
                aria-label="auth"
              >
                <FaUserCircle size={iconPx} />
              </IconButton>

              <Popover
                open={authOpen}
                anchorEl={authAnchorEl}
                onClose={handleAuthClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              >
                <Box
                  sx={(theme) => ({
                    width: 220,
                    p: 1,
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    boxShadow: theme.shadows[4],
                    border: `1px solid ${theme.palette.divider}`,
                  })}
                >
                  <Link href="/login" onClick={handleAuthClose}>
                    <Button
                      fullWidth
                      size="small"
                      variant="text"
                      sx={{ justifyContent: "flex-start", gap: 1, mb: 1 }}
                    >
                      <PersonOutlineIcon fontSize="small" />
                      {t("login_btn_title")}
                    </Button>
                  </Link>
                  <Link href="/register" onClick={handleAuthClose}>
                    <Button
                      fullWidth
                      size="small"
                      variant="text"
                      sx={{ justifyContent: "flex-start", gap: 1 }}
                    >
                      <ReceiptLongIcon fontSize="small" />
                      {t("register_btn_title")}
                    </Button>
                  </Link>
                </Box>
              </Popover>
            </>
          )}

          {/* ✅ Icon giỏ hàng có badge hiển thị số lượng món - Only show for User role */}
          {currentRole === "user" && (
            <Link href="/cart">
              <IconButton>
                <Badge badgeContent={totalOrders} color="primary">
                  <ShoppingCartIcon sx={{ fontSize: iconPx }} />
                </Badge>
              </IconButton>
            </Link>
          )}

          <IconButton onClick={handleNotifOpen} aria-label="notifications">
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsNoneIcon sx={{ fontSize: "1.5rem" }} />
            </Badge>
          </IconButton>

          <Popover
            open={notifOpen}
            anchorEl={notifAnchorEl}
            onClose={handleNotifClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          >
            <Box sx={{ width: 320, maxHeight: 360, overflow: "auto", p: 1 }}>
              <Typography
                fontWeight={600}
                mb={1}
                px={1}
                paddingBottom={1}
                sx={{ borderBottom: "1px solid #eee" }}
              >
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
