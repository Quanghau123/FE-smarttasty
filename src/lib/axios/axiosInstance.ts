// @/axios/axiosInstance.ts
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 60000,
  headers: {
    Accept: "application/json",
    // Không set Content-Type ở đây để có thể tùy biến theo từng request
  },
});

// Interceptor: Gắn token + xử lý Content-Type động
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          const token = localStorage.getItem("token");
          //  const token = parsed.token;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (err) {
          console.warn("Lỗi khi parse user data:", err);
        }
      }
    }

    // ✅ Nếu là FormData, KHÔNG tự set Content-Type (để axios tự gán với boundary)
    const isFormData =
      config.data instanceof FormData ||
      (typeof FormData !== "undefined" && config.data instanceof FormData);

    if (!isFormData && !config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
