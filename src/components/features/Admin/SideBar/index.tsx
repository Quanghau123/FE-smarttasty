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
import { useTranslations } from "next-intl";

interface SidebarProps {
  inDrawer?: boolean;
  onNavigate?: () => void;
}

const Sidebar = ({ inDrawer = false, onNavigate }: SidebarProps) => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const t = useTranslations("sidebarAdmin");

  const handleNavigate = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <Box
      sx={(theme) => ({
        width: inDrawer ? "100%" : 240,
        minHeight: inDrawer ? "auto" : "calc(100vh - 72px)",
        position: inDrawer ? "static" : "sticky",
        top: inDrawer ? "auto" : 72,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderRight: inDrawer ? "none" : `1px solid ${theme.palette.divider}`,
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
        {t("title")}
      </Box>
      <List>
        <ListItemButton
          component={Link}
          href="/admin"
          selected={pathname === "/admin"}
          onClick={handleNavigate}
        >
          <ListItemIcon>
            <SpaceDashboardIcon />
          </ListItemIcon>
          <ListItemText primary={t("dashboard")} />
        </ListItemButton>

        <ListItemButton onClick={() => setOpen(!open)}>
          <ListItemIcon>
            <PersonIcon />
          </ListItemIcon>
          <ListItemText primary={t("management")} />
          {open ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>

        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
              <ListItemButton
              component={Link}
              href="/admin/commission"
              sx={{ pl: 4 }}
              selected={pathname === "/admin/commission"}
              onClick={handleNavigate}
            >
              <ListItemText primary={t("commission_reports")} />
            </ListItemButton>
            <ListItemButton
              component={Link}
              href="/admin/users"
              sx={{ pl: 4 }}
              selected={pathname === "/admin/users"}
              onClick={handleNavigate}
            >
              <ListItemText primary={t("user")} />
            </ListItemButton>
            <ListItemButton
              component={Link}
              href="/admin/business"
              sx={{ pl: 4 }}
              selected={pathname === "/admin/business"}
              onClick={handleNavigate}
            >
              <ListItemText primary={t("business")} />
            </ListItemButton>
          </List>
        </Collapse>
      </List>
    </Box>
  );
};

export default Sidebar;
