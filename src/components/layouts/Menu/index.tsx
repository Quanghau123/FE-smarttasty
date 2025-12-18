"use client";

import { Box, Button, Typography } from "@mui/material";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { spacing } from "@mui/system";

const stripLocale = (path: string) => {
  const parts = path.split("/");
  if (parts.length > 1 && parts[1].length === 2) {
    return "/" + parts.slice(2).join("/");
  }
  return path;
};

const Menu = () => {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const t = useTranslations("menu");

  const menuItems = [
    { label: t("all_restaurants"), path: "/" },
    { label: t("nearby_restaurants"), path: "/NearbyRestaurant" },
    { label: t("recipes"), path: "/recipes" },
  ];

  const isActive = (path: string) => {
    const cleanPath = stripLocale(pathname);
    if (path === "/") return cleanPath === "/";
    return cleanPath.startsWith(path);
  };

  return (
    <Box
      display="flex"
      justifyContent={"space-between"}
      alignItems="center"
      gap={2}
      p={2}
    >
      {/* Menu */}
      <Box display="flex" gap={2}>
        {menuItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Button
              key={item.path}
              onClick={() => router.push(item.path)}
              sx={{
                textTransform: "none",
                borderRadius: "8px",
                bgcolor: active ? "#FFA726" : "rgba(0,0,0,0.06)",
                color: active ? "#fff" : "inherit",
              }}
            >
              {item.label}
            </Button>
          );
        })}
      </Box>

      <Box display="flex" gap={1} flexWrap="wrap">
        <Box px={1.5} py={0.5} bgcolor="#E3F2FD" borderRadius="8px">
          <Typography variant="body2">
            <b>Doanh nghiệp</b>: khang@gmail.com | Abc@123
          </Typography>
        </Box>

        <Box px={1.5} py={0.5} bgcolor="#F1F8E9" borderRadius="8px">
          <Typography variant="body2">
            <b>Người dùng</b>: bao@gmail.com | Abc@123
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Menu;
