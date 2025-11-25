"use client";

import { Box, Button } from "@mui/material";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

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
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <Box
      display="flex"
      gap={2}
      p={2}
      sx={{
        bgcolor: "background.default",
        color: "text.primary",
      }}
    >
      {menuItems.map((item) => {
        const active = isActive(item.path);
        return (
          <Button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`menu-button ${
              active
                ? item.path === "/recipes"
                  ? "menu-active--strong"
                  : "menu-active"
                : ""
            }`}
            aria-current={active ? "page" : undefined}
            sx={{
              textTransform: "none",
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
