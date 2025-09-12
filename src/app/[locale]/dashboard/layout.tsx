"use client";

import Sidebar from "@/components/features/AdminRestaurant/SideBar";

export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Tránh render sớm khi chưa xác thực xong
  // if (!authorized) return null;

  return (
    <div style={{ display: "flex", marginTop: "80px" }}>
      <div>
        <Sidebar />
      </div>
      <div style={{ width: "100%" }}>{children}</div>
    </div>
  );
}
