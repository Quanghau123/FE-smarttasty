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
import {
  Person as PersonIcon,
  SpaceDashboard as DashboardIcon,
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material";

const Sidebar = () => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (
      pathname?.startsWith("/products") ||
      pathname?.startsWith("/promotion") ||
      pathname?.startsWith("/restaurant")
    ) {
      setOpen(true);
    }
  }, [pathname]);

  return (
    <Paper
      elevation={2}
      sx={{
        width: 260,
        // keep sidebar below header (header marginTop typically 80px in admin layouts)
        minHeight: "calc(100vh - 80px)",
        position: "sticky",
        top: 80,
        p: 2,
        borderRadius: 2,
        bgcolor: "background.paper",
      }}
    >
      <Box display="flex" flexDirection="column" alignItems="center" mb={1}>
        <Avatar sx={{ width: 56, height: 56, mb: 1 }}>AR</Avatar>
        <Typography variant="h6" fontWeight="bold" textAlign="center">
          Admin Restaurant
        </Typography>
        {/* <Typography variant="body2" color="text.secondary">
          Quản lý cửa hàng
        </Typography> */}
      </Box>

      <Divider sx={{ my: 2 }} />

      <List component="nav" sx={{ px: 1 }}>
        <ListItemButton
          component={Link}
          href="/dashboard"
          selected={pathname === "/dashboard"}
          sx={{ borderRadius: 1, mb: 1 }}
        >
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>

        <ListItemButton
          onClick={() => setOpen(!open)}
          sx={{ borderRadius: 1, mb: 1 }}
        >
          <ListItemIcon>
            <PersonIcon />
          </ListItemIcon>
          <ListItemText primary="Management" />
          {open ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>

        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{ pl: 3 }}>
            <ListItemButton
              component={Link}
              href="/restaurant"
              selected={pathname === "/restaurant"}
              sx={{ borderRadius: 1, mb: 0.5 }}
            >
              <ListItemText primary="Thông Tin Nhà Hàng" />
            </ListItemButton>
            <ListItemButton
              component={Link}
              href="/products"
              selected={pathname === "/products"}
              sx={{ borderRadius: 1, mb: 0.5 }}
            >
              <ListItemText primary="Quản lý" />
            </ListItemButton>
            <ListItemButton
              component={Link}
              href="/promotion"
              selected={pathname === "/promotion"}
              sx={{ borderRadius: 1, mb: 0.5 }}
            >
              <ListItemText primary="Các Ưu Đãi" />
            </ListItemButton>
            <ListItemButton
              component={Link}
              href="/tablebooking"
              selected={pathname === "/tablebooking"}
              sx={{ borderRadius: 1 }}
            >
              <ListItemText primary="Bàn đã đặt" />
            </ListItemButton>
          </List>
        </Collapse>
      </List>
    </Paper>
  );
};

export default Sidebar;
