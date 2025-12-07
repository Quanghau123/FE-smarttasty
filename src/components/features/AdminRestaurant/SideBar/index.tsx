"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Paper,
  Avatar,
  Divider,
  Box,
} from "@mui/material";
import { useTranslations } from "next-intl";
import {
  Person as PersonIcon,
  SpaceDashboard as DashboardIcon,
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material";

type SidebarProps = {
  inDrawer?: boolean;
  onNavigate?: () => void;
};

const Sidebar = ({ inDrawer = false, onNavigate }: SidebarProps) => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const t = useTranslations("sidebarAdmin");

  useEffect(() => {
    if (
      pathname?.startsWith("/products") ||
      pathname?.startsWith("/promotion") ||
      pathname?.startsWith("/restaurant") ||
      pathname?.startsWith("/orderall")
    ) {
      setOpen(true);
    }
  }, [pathname]);

  return (
    <Paper
      elevation={2}
      sx={{
        width: 260,
        minHeight: inDrawer ? "auto" : "calc(100vh - 72px)",
        position: inDrawer ? "static" : "sticky",
        top: inDrawer ? undefined : 72,
        p: 2,
        borderRadius: 2,
        bgcolor: "background.paper",
      }}
    >
      <Box display="flex" flexDirection="column" alignItems="center" mb={1}>
        <Avatar sx={{ width: 56, height: 56, mb: 1 }}>AR</Avatar>
        <Typography variant="h6" fontWeight="bold" textAlign="center">
          {t("admin_restaurant_title")}
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      <List component="nav" sx={{ px: 1 }}>
        <ListItemButton
          component={Link}
          href="/dashboard"
          selected={pathname === "/dashboard"}
          sx={{ borderRadius: 1, mb: 1 }}
          onClick={onNavigate}
        >
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary={t("dashboard")} />
        </ListItemButton>

        <ListItemButton
          onClick={() => setOpen(!open)}
          sx={{ borderRadius: 1, mb: 1 }}
        >
          <ListItemIcon>
            <PersonIcon />
          </ListItemIcon>
          <ListItemText primary={t("management")} />
          {open ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>

        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{ pl: 3 }}>
            <ListItemButton
              component={Link}
              href="/restaurant"
              selected={pathname === "/restaurant"}
              sx={{ borderRadius: 1, mb: 0.5 }}
              onClick={onNavigate}
            >
              <ListItemText primary={t("restaurant_info")} />
            </ListItemButton>
            <ListItemButton
              component={Link}
              href="/products"
              selected={pathname === "/products"}
              sx={{ borderRadius: 1, mb: 0.5 }}
              onClick={onNavigate}
            >
              <ListItemText primary={t("products_management")} />
            </ListItemButton>
            <ListItemButton
              component={Link}
              href="/promotion"
              selected={pathname === "/promotion"}
              sx={{ borderRadius: 1, mb: 0.5 }}
              onClick={onNavigate}
            >
              <ListItemText primary={t("promotions")} />
            </ListItemButton>
            <ListItemButton
              component={Link}
              href="/tablebooking"
              selected={pathname === "/tablebooking"}
              sx={{ borderRadius: 1 }}
              onClick={onNavigate}
            >
              <ListItemText primary={t("tablebooking")} />
            </ListItemButton>
            <ListItemButton
              component={Link}
              href="/orderall"
              selected={pathname === "/orderall"}
              sx={{ borderRadius: 1 }}
              onClick={onNavigate}
            >
              <ListItemText primary={t("orders_all")} />
            </ListItemButton>
            <ListItemButton
              component={Link}
              href="/staffs"
              selected={pathname === "/staffs"}
              sx={{ borderRadius: 1, mt: 0.5 }}
              onClick={onNavigate}
            >
              <ListItemText primary={t("staff_accounts")} />
            </ListItemButton>
          </List>
        </Collapse>
      </List>
    </Paper>
  );
};

export default Sidebar;
