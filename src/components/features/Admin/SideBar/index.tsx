"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import SpaceDashboardIcon from "@mui/icons-material/SpaceDashboard";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { useState } from "react";

const Sidebar = () => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Box
      sx={(theme) => ({
        width: 240,
        height: "100vh",
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderRight: `1px solid ${theme.palette.divider}`,
      })}
    >
      <Box
        sx={{
          fontSize: 20,
          fontWeight: 700,
          textAlign: "center",
          py: 2,
        }}
      >
        Admin
      </Box>
      <List>
        {/* Dashboard */}
        <ListItemButton
          component={Link}
          href="/admin"
          selected={pathname === "/admin"}
        >
          <ListItemIcon>
            <SpaceDashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>

        {/* Management with Collapse */}
        <ListItemButton onClick={() => setOpen(!open)}>
          <ListItemIcon>
            <PersonIcon />
          </ListItemIcon>
          <ListItemText primary="Management" />
          {open ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>

        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton
              component={Link}
              href="/admin/users"
              sx={{ pl: 4 }}
              selected={pathname === "/admin/users"}
            >
              <ListItemText primary="User" />
            </ListItemButton>
            <ListItemButton
              component={Link}
              href="/admin/business"
              sx={{ pl: 4 }}
              selected={pathname === "/admin/business"}
            >
              <ListItemText primary="Business" />
            </ListItemButton>
          </List>
        </Collapse>
      </List>
    </Box>
  );
};

export default Sidebar;
