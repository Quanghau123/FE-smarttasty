"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import Sidebar from "@/components/features/AdminRestaurant/SideBar";
import { getAccessToken } from "@/lib/utils/tokenHelper";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Drawer, IconButton, Box, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

interface JwtPayload {
  sub: string;
  nameid: string;
  unique_name: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
  nbf: number;
}

export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);
  const isMobile = useMediaQuery("(max-width:600px)");

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      router.replace("/ErrorPages/notfound");
      return;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      console.log("  - User ID:", decoded.sub || decoded.nameid);
      console.log("  - Username:", decoded.unique_name);
      console.log("  - Role:", decoded.role);
      console.log("  - Email:", decoded.email);

      if (decoded.role !== "business") {
        router.replace("/ErrorPages/notfound");
      } else {
        setAuthorized(true);
      }
    } catch (error) {
      console.error("Token không hợp lệ:", error);
      router.replace("/ErrorPages/notfound");
    }
  }, [router]);

  // Tránh render sớm khi chưa xác thực xong
  if (!authorized) return null;

  return (
    <div style={{ display: "flex", marginTop: "20px" }}>
      {!isMobile && (
        <div>
          <Sidebar />
        </div>
      )}
      <div style={{ width: "100%" }}>
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
      </div>

      {/* Drawer mobile */}
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
