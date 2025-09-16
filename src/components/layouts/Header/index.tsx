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
} from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import SearchIcon from "@mui/icons-material/Search";
import { FaUserCircle } from "react-icons/fa";
import { useAppDispatch } from "@/redux/hook";
import {
  fetchRestaurants,
  fetchRestaurantsByCategory,
} from "@/redux/slices/restaurantSlice";
import { getImageUrl } from "@/constants/config/imageBaseUrl";
import LanguageSelector from "@/components/layouts/LanguageSelector";
import ThemeToggleButton from "@/components/layouts/ThemeToggleButton";
import { useTranslations } from "next-intl"; // ✅ thêm vào
import styles from "./styles.module.scss";

const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
};

const Header = () => {
  const [localUserName, setLocalUserName] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const dispatch = useAppDispatch();
  const t = useTranslations("header"); // ✅ gọi namespace header

  useEffect(() => {
    setHydrated(true);

    const token = getCookie("token");
    setIsLoggedIn(!!token);

    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const userName = parsedUser?.userName || "User";
        setLocalUserName(userName);
      }
    } catch (err) {
      console.error("Lỗi khi lấy user từ localStorage:", err);
    }
  }, []);

  useEffect(() => {
    if (selectedCategory === "All") {
      dispatch(fetchRestaurants());
    } else {
      dispatch(fetchRestaurantsByCategory(selectedCategory));
    }
  }, [selectedCategory, dispatch]);

  const handleLogout = () => {
    document.cookie = "token=; path=/; max-age=0";
    localStorage.removeItem("user");
    localStorage.removeItem("id");
    setIsLoggedIn(false);
    setLocalUserName(null);
    window.location.href = "/login";
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
    <Box className={styles.headerWrapper}>
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
          <TextField
            select
            defaultValue="TP. HCM"
            size="small"
            variant="standard"
            className={styles.citySelect}
          >
            <MenuItem value="TP. HCM">TP. HCM</MenuItem>
            <MenuItem value="HN">Hà Nội</MenuItem>
            <MenuItem value="DN">Đà Nẵng</MenuItem>
          </TextField>

          <TextField
            select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            size="small"
            variant="standard"
            className={styles.categorySelect}
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
                <Box className={styles.popoverBox}>
                  <Typography fontWeight={600} mb={1}>
                    {t("welcome_text")}, {localUserName}
                  </Typography>
                  <Link href="/account">
                    <Button fullWidth size="small" variant="text">
                      {t("account_btn_title")}
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
