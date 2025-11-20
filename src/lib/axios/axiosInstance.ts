import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
} from "@/lib/utils/tokenHelper";

const axiosInstance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 60000,
  withCredentials: true, // gửi cookie HttpOnly (refresh_token)
  headers: {
    Accept: "application/json",
  },
});

// Queue
let isRefreshing = false;

type QueueItem = {
  resolve: (
    value?:
      | AxiosResponse<unknown>
      | PromiseLike<AxiosResponse<unknown>>
      | undefined
  ) => void;
  reject: (error?: unknown) => void;
  originalRequest: InternalAxiosRequestConfig & { _retry?: boolean };
};

let failedQueue: QueueItem[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject, originalRequest }) => {
    if (error) {
      reject(error);
    } else {
      if (token && originalRequest.headers) {
        (originalRequest.headers as Record<string, string>)[
          "Authorization"
        ] = `Bearer ${token}`;
      }
      axiosInstance(originalRequest).then(resolve).catch(reject);
    }
  });
  failedQueue = [];
};

// Request interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>)[
        "Authorization"
      ] = `Bearer ${token}`;
    }

    const isFormData =
      config.data instanceof FormData ||
      (typeof FormData !== "undefined" && config.data instanceof FormData);
    if (!isFormData) {
      config.headers = config.headers ?? {};
      if (!("Content-Type" in (config.headers as Record<string, unknown>))) {
        (config.headers as Record<string, string>)["Content-Type"] =
          "application/json";
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<AxiosResponse<unknown> | undefined>(
        (resolve, reject) => {
          failedQueue.push({ resolve, reject, originalRequest });
        }
      );
    }

    originalRequest._retry = true;
    isRefreshing = true;

 try {
  const refreshUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/User/refresh-token`;
  
  // ✅ Lấy access token cũ (đã hết hạn) để gửi lên BE
  const oldAccessToken = getAccessToken();

  // debug logs removed

  // ✅ Gửi cả 2 dữ liệu: 
  // 1. Refresh token qua cookie (withCredentials: true)
  // 2. Access token qua Authorization header
  const refreshResponse = await axios.post(
    refreshUrl, 
    {}, 
    { 
      withCredentials: true,  // Gửi cookie refresh_token
      headers: {
        'Authorization': `Bearer ${oldAccessToken}`  // Gửi access token cũ
      }
    }
  );

  // debug logs removed

      // 🔎 Try to extract new access token from various common shapes
      const body: unknown = refreshResponse.data;
      const pickToken = (o: unknown): string | undefined => {
        if (!o || typeof o !== "object") return undefined;
        const obj = o as Record<string, unknown>;
        return (
          (obj["access_token"] as string | undefined) ||
          (obj["accessToken"] as string | undefined) ||
          (obj["AccessToken"] as string | undefined) ||
          (obj["token"] as string | undefined) ||
          (obj["Token"] as string | undefined) ||
          (obj["jwt"] as string | undefined) ||
          (obj["jwtToken"] as string | undefined) ||
          (obj["JwtToken"] as string | undefined)
        );
      };

      const obj = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : undefined;
      const newAccessToken: string | undefined =
        pickToken(body) ||
        pickToken(obj?.["data"]) ||
        pickToken(obj?.["Data"]);

      if (!newAccessToken) {
        throw new Error("No new access token from refresh endpoint");
      }

      // Persist new token for subsequent requests
      setAccessToken(newAccessToken);
      // Also update axios default header immediately to avoid any race with callers
      try {
        axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
      } catch {
        // ignore
      }

      processQueue(null, newAccessToken);

      if (originalRequest.headers)
        (originalRequest.headers as Record<string, string>)[
          "Authorization"
        ] = `Bearer ${newAccessToken}`;
      isRefreshing = false;
      return axiosInstance(originalRequest);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      isRefreshing = false;
      try {
        clearAccessToken();
      } catch {
        // ignore
      }

      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
        window.location.href = "/login";
      }

      return Promise.reject(refreshErr);
    }
  }
);

export default axiosInstance;