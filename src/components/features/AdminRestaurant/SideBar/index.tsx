"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Paper,
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
      pathname.startsWith("/products") ||
      pathname.startsWith("/promotion") ||
      pathname.startsWith("/restaurant")
    ) {
      setOpen(true);
    }
  }, [pathname]);

  return (
    <Paper
      elevation={2}
      sx={{
        width: 240,
        height: "100vh",
        p: 2,
        borderRadius: 2,
        bgcolor: "background.paper",
      }}
    >
      <Typography variant="h6" fontWeight="bold" textAlign="center" mb={2}>
        Admin Restaurant
      </Typography>

      <List component="nav">
        <ListItemButton
          component={Link}
          href="/dashboard"
          selected={pathname === "/dashboard"}
        >
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>

        <ListItemButton onClick={() => setOpen(!open)}>
          <ListItemIcon>
            <PersonIcon />
          </ListItemIcon>
          <ListItemText primary="Management" />
          {open ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>

        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{ pl: 4 }}>
            <ListItemButton
              component={Link}
              href="/restaurant"
              selected={pathname === "/restaurant"}
            >
              <ListItemText primary="Thông Tin Nhà Hàng" />
            </ListItemButton>
            <ListItemButton
              component={Link}
              href="/products"
              selected={pathname === "/products"}
            >
              <ListItemText primary="Quản lý" />
            </ListItemButton>
            <ListItemButton
              component={Link}
              href="/promotion"
              selected={pathname === "/promotion"}
            >
              <ListItemText primary="Các Ưu Đãi" />
            </ListItemButton>
            <ListItemButton
              component={Link}
              href="/tablebooking"
              selected={pathname === "/tablebooking"}
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
