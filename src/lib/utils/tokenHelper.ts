/**
 * Helper functions để xử lý authentication tokens với cookies
 */

/**
 * Lấy giá trị cookie theo tên
 */
const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
};

/**
 * Set cookie với các options bảo mật
 */
const setCookie = (
  name: string,
  value: string,
  options: {
    maxAge?: number; // seconds
    path?: string;
    secure?: boolean;
    sameSite?: "Strict" | "Lax" | "None";
  } = {}
): void => {
  if (typeof document === "undefined") return;

  const {
    maxAge = 86400, // 1 day default
    path = "/",
    secure = true,
    sameSite = "Strict",
  } = options;

  let cookieString = `${name}=${encodeURIComponent(value)}`;
  cookieString += `; max-age=${maxAge}`;
  cookieString += `; path=${path}`;
  if (secure) cookieString += "; secure";
  cookieString += `; samesite=${sameSite}`;

  document.cookie = cookieString;
};

/**
 * Xóa cookie
 */
const deleteCookie = (name: string, path: string = "/"): void => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=${path}; max-age=0`;
};

/**
 * Lấy access token từ cookie
 */
export const getAccessToken = (): string | null => {
  return getCookie("access_token");
};

/**
 * Lấy refresh token từ cookie
 */
export const getRefreshToken = (): string | null => {
  return getCookie("refresh_token");
};

/**
 * Lưu tokens vào cookie
 * @param accessToken - JWT access token
 * @param refreshToken - Refresh token
 * @param accessTokenMaxAge - Thời gian sống của access token (seconds), mặc định 2 giờ
 * @param refreshTokenMaxAge - Thời gian sống của refresh token (seconds), mặc định 7 ngày
 */
export const setTokens = (
  accessToken: string,
  refreshToken: string,
  accessTokenMaxAge: number = 7200, // 2 hours
  refreshTokenMaxAge: number = 604800 // 7 days
): void => {
  setCookie("access_token", accessToken, {
    maxAge: accessTokenMaxAge,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });

  setCookie("refresh_token", refreshToken, {
    maxAge: refreshTokenMaxAge,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });
};

/**
 * Cập nhật access token mới (sau khi refresh)
 */
export const updateAccessToken = (
  accessToken: string,
  maxAge: number = 7200
): void => {
  setCookie("access_token", accessToken, {
    maxAge,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });
};

/**
 * Xóa tất cả tokens và user data
 */
export const clearTokens = (): void => {
  deleteCookie("access_token");
  deleteCookie("refresh_token");
  if (typeof window !== "undefined") {
    localStorage.removeItem("user");
  }
};

/**
 * Kiểm tra xem user có đăng nhập hay không
 */
export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};
