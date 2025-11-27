"use client";

import { Box, Button } from "@mui/material";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

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
    <Box display="flex" gap={2} p={2}>
      {menuItems.map((item) => {
        const active = isActive(item.path);
        return (
          <Button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`menu-button ${active ? "menu-active" : ""}`}
            sx={{
              textTransform: "none",
              borderRadius: "8px",
              boxShadow: "none !important",

              bgcolor: active ? "#FFA726" : "rgba(0,0,0,0.06)",
              color: active ? "#fff" : "inherit",

              transition: "background-color 0.2s ease",

              "&:hover": {
                bgcolor: active ? "#FB8C00" : "rgba(0,0,0,0.1)",
              },
            }}
          >
            {item.label}
          </Button>
        );
      })}
    </Box>
  );
};

export default Menu;
