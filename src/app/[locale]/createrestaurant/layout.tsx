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
    const token = getAccessToken();

    if (!token) {
      router.replace("/ErrorPages/notfound");
      return;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);

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

  return <div style={{ marginTop: "80px", width: "100%" }}>{children}</div>;
}
