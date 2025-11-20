"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { Box, IconButton, Drawer } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import useMediaQuery from "@mui/material/useMediaQuery";
import Sidebar from "@/components/features/Admin/SideBar";
import { getAccessToken } from "@/lib/utils/tokenHelper";

interface JwtPayload {
  role: string;
  exp: number;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width:768px)");

  useEffect(() => {
    // ✅ Lấy token từ cookie
    const token = getAccessToken();

    if (!token) {
      // console.warn("❌ Không tìm thấy token");
      router.replace("/ErrorPages/notfound");
      return;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      //      console.log("✅ Token decode:", decoded);

      if (decoded.role !== "admin") {
        // console.warn("⛔ Sai role:", decoded.role);
        router.replace("/ErrorPages/notfound");
      } else {
        setAuthorized(true);
      }
    } catch {
      //   console.error("❌ Lỗi khi decode token:", error);
      router.replace("/ErrorPages/notfound");
    }
  }, [router]);

  if (!authorized) return null;

  return (
    <Box sx={{ display: "flex", mt: "20px", position: "relative" }}>
      {/* Mobile menu button */}
      {isMobile && (
        <IconButton
          onClick={() => setDrawerOpen(true)}
          sx={{
            position: "fixed",
            top: 80,
            left: 10,
            zIndex: 1100,
            bgcolor: "background.paper",
            boxShadow: 2,
            "&:hover": {
              bgcolor: "action.hover",
            },
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <Box>
          <Sidebar />
        </Box>
      )}

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Sidebar inDrawer={true} onNavigate={() => setDrawerOpen(false)} />
      </Drawer>

      {/* Main content */}
      <Box sx={{ width: "100%", px: { xs: 2, sm: 3 } }}>{children}</Box>
    </Box>
  );
}
