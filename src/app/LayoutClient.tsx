"use client";

import Providers from "@/components/commons/Providers/Providers";
import Chatbot from "@/components/features/Chatbot";
import { usePathname } from "next/navigation";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideChatbot = (() => {
    const p = (pathname || "").toLowerCase();
    return (
      p.includes("/login") || p.includes("/register") || p.includes("/admin") || p.includes("/staff") || p.includes("/register-business")
    );
  })();
  return (
    <Providers>
      {children}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      {/* Chatbot floating button - hiển thị ở mọi trang */}
      {!hideChatbot && <Chatbot />}
    </Providers>
  );
}
