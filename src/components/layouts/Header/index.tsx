"use client";

import { useState, useEffect } from "react";
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
} from "@mui/material";
import { fetchOrdersByUser } from "@/redux/slices/orderSlice";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SearchIcon from "@mui/icons-material/Search";
import { FaUserCircle } from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import {
  fetchRestaurants,
  fetchRestaurantsByCategory,
} from "@/redux/slices/restaurantSlice";
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
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const dispatch = useAppDispatch();
  const t = useTranslations("header");

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
        };
        const userName = cu.userName || cu.fullName || cu.name || "User";
        setLocalUserName(userName);
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
          setIsLoggedIn(true); // ✅ Đảm bảo set isLoggedIn khi có user trong localStorage
        } else {
          setIsLoggedIn(false);
          setLocalUserName(null);
        }
      }
    } catch (e) {
      console.error("Lỗi khi lấy user từ localStorage:", e);
      setIsLoggedIn(false);
      setLocalUserName(null);
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedCategory === "All") {
      dispatch(fetchRestaurants());
    } else {
      dispatch(fetchRestaurantsByCategory(selectedCategory));
    }
  }, [selectedCategory, dispatch]);

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

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

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
      <Box className={styles.headerInner}>
        {/* Left: Logo */}
        <Link href="/">
          <Image
            src={getImageUrl("Logo/anhdaidienmoi.png")}
            alt="Logo"
            width={70}
            height={50}
            priority
          />
        </Link>

        {/* Middle: Filter + Search */}
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
            defaultValue="Ăn uống"
          >
            <MenuItem value="All">Ăn uống</MenuItem>
            <MenuItem value="Buffet">Buffet</MenuItem>
            <MenuItem value="NhaHang">Nhà Hàng</MenuItem>
            <MenuItem value="AnVatViaHe">Ăn vặt/vỉa hè</MenuItem>
            <MenuItem value="AnChay">Ăn chay</MenuItem>
            <MenuItem value="CafeNuocuong">Cafe/Nước uống</MenuItem>
            <MenuItem value="QuanAn">Quán ăn</MenuItem>
            <MenuItem value="Bar">Bar</MenuItem>
            <MenuItem value="QuanNhau">Quán nhậu</MenuItem>
          </TextField>

          <TextField
            size="small"
            variant="outlined"
            placeholder="Địa điểm, món ăn, loại hình..."
            InputProps={{
              endAdornment: <SearchIcon />,
            }}
            className={styles.searchInput}
          />
        </Box>

        {/* Right: Auth, Notification, Language, Theme */}
        <Box className={styles.rightSection}>
          {isLoggedIn ? (
            <>
              <IconButton onClick={handlePopoverOpen}>
                <FaUserCircle size={24} />
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

          {/* ✅ Icon giỏ hàng có badge hiển thị số lượng món */}
          <Link href="/cart">
            <IconButton>
              <Badge badgeContent={totalOrders} color="primary">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
          </Link>

          <IconButton>
            <NotificationsNoneIcon />
          </IconButton>

          <LanguageSelector />
          <ThemeToggleButton />
        </Box>
      </Box>
    </Box>
  );
};

export default Header;
