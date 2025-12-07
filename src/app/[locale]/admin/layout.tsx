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
    const token = getAccessToken();

    if (!token) {
      router.replace("/ErrorPages/notfound");
      return;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);

      if (decoded.role !== "admin") {
        router.replace("/ErrorPages/notfound");
      } else {
        setAuthorized(true);
      }
    } catch {
      router.replace("/ErrorPages/notfound");
    }
  }, [router]);

  if (!authorized) return null;

  return (
    <Box sx={{ display: "flex", mt: "20px", position: "relative" }}>
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

      {!isMobile && (
        <Box>
          <Sidebar />
        </Box>
      )}

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Sidebar inDrawer={true} onNavigate={() => setDrawerOpen(false)} />
      </Drawer>

      <Box sx={{ width: "100%", px: { xs: 2, sm: 3 } }}>{children}</Box>
    </Box>
  );
}
