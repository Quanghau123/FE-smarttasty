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
      const refreshResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/User/refresh-token`,
        {},
        { withCredentials: true }
      );

      const newAccessToken =
        refreshResponse.data?.access_token ??
        refreshResponse.data?.data?.access_token ??
        refreshResponse.data?.Data?.access_token;

      if (!newAccessToken) {
        throw new Error("No new access token from refresh endpoint");
      }

      setAccessToken(newAccessToken);

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
