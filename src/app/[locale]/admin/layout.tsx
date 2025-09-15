"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import Sidebar from "@/components/features/Admin/SideBar";

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

  useEffect(() => {
    let token: string | null = null;

    // Ưu tiên lấy token từ cookie
    const cookieToken = document.cookie
      .split("; ")
      .find((c) => c.startsWith("token="));
    if (cookieToken) {
      token = cookieToken.split("=")[1];
    }

    // Fallback nếu cookie không có
    if (!token) {
      token = localStorage.getItem("token");
    }

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
    <div style={{ display: "flex", marginTop: "80px" }}>
      <div>
        <Sidebar />
      </div>
      <div style={{ width: "100%" }}>{children}</div>
    </div>
  );
}
