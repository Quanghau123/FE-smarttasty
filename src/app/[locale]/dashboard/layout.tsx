"use client";

import Sidebar from "@/components/features/AdminRestaurant/SideBar";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Drawer, IconButton, Box, Typography } from "@mui/material";
import { useState } from "react";
import MenuIcon from "@mui/icons-material/Menu";

export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobile = useMediaQuery("(max-width:600px)");
  const [openDrawer, setOpenDrawer] = useState(false);

  return (
    <div style={{ display: "flex", marginTop: "20px" }}>
      {!isMobile && (
        <div>
          <Sidebar />
        </div>
      )}
  <Box style={{ flex: 1, minWidth: 0 }}>
        {isMobile && (
          <Box sx={{ px: 2, mb: 1, display: "flex", alignItems: "center" }}>
            <IconButton
              onClick={() => setOpenDrawer(true)}
              aria-label="Mở menu"
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ ml: 1 }}>
              Menu quản lý
            </Typography>
          </Box>
        )}
        {children}
      </Box>

      <Drawer
        anchor="left"
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        ModalProps={{ keepMounted: true }}
        PaperProps={{ sx: { width: 280 } }}
      >
        <Box sx={{ pt: 2, px: 1 }}>
          <Sidebar inDrawer onNavigate={() => setOpenDrawer(false)} />
        </Box>
      </Drawer>
    </div>
  );
}
