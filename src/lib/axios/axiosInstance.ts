// @/axios/axiosInstance.ts
import axios from "axios";
import { getAccessToken, getRefreshToken, updateAccessToken, setTokens } from "@/lib/utils/tokenHelper";

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
    // ✅ Lấy access token từ cookie
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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

// Response interceptor để xử lý refresh token khi access token hết hạn
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi 401 và chưa retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // ✅ Lấy refresh token từ cookie
        const refreshToken = getRefreshToken();
        const accessToken = getAccessToken();
        
        if (!refreshToken || !accessToken) {
          // Không có tokens, chuyển về login
          if (typeof window !== "undefined") {
            localStorage.removeItem("user");
            window.location.href = "/login";
          }
          return Promise.reject(error);
        }

        // ✅ Gọi API refresh token với CẢ accessToken VÀ refreshToken
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/User/refresh-token`,
          { 
            accessToken: accessToken,
            refreshToken: refreshToken 
          }
        );

        if (response.data.errCode === "success" && response.data.data?.access_token) {
          const newAccessToken = response.data.data.access_token;
          const newRefreshToken = response.data.data.refresh_token;
          
          // ✅ Cập nhật CẢ HAI tokens mới vào cookie (Token Rotation)
          if (newRefreshToken) {
            // Cập nhật cả access token và refresh token
            setTokens(newAccessToken, newRefreshToken);
          } else {
            // Chỉ cập nhật access token nếu không có refresh token mới
            updateAccessToken(newAccessToken);
          }

          // Retry request ban đầu với token mới
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token thất bại, đăng xuất
        if (typeof window !== "undefined") {
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
