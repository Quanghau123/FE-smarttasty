"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { getAccessToken } from "@/lib/utils/tokenHelper";

interface JwtPayload {
  role: string;
  exp: number;
}

export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // ✅ Lấy token từ cookie
    const token = getAccessToken();

    if (!token) {
      console.warn("❌ Không tìm thấy token");
      router.replace("/ErrorPages/notfound");
      return;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);

      if (decoded.role !== "business") {
        console.warn("⛔ Sai role:", decoded.role);
        router.replace("/ErrorPages/notfound");
      } else {
        setAuthorized(true);
      }
    } catch (error) {
      console.error("❌ Token không hợp lệ:", error);
      router.replace("/ErrorPages/notfound");
    }
  }, [router]);

  // Tránh render sớm khi chưa xác thực xong
  if (!authorized) return null;

  return <div style={{ marginTop: "80px", width: "100%" }}>{children}</div>;
}
