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
 * Lấy thời gian hết hạn từ JWT token (exp claim)
 * @param token - JWT token
 * @returns Số giây còn lại đến khi hết hạn, hoặc null nếu không parse được
 */
const getTokenExpiry = (token: string): number | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = payload.exp - now;
      return expiresIn > 0 ? expiresIn : null;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Lưu tokens vào cookie
 * ✅ Sử dụng thời gian expire từ BE (đọc từ JWT token)
 * @param accessToken - JWT access token (có exp claim từ BE)
 * @param refreshToken - Refresh token
 */
export const setTokens = (
  accessToken: string,
  refreshToken: string
): void => {
  // ✅ Lấy thời gian hết hạn từ JWT token (BE đã set)
  const accessTokenMaxAge = getTokenExpiry(accessToken);
  
  setCookie("access_token", accessToken, {
    maxAge: accessTokenMaxAge || 7200, // Fallback 2 giờ nếu không đọc được
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });

  // ✅ Refresh token: dùng 7 ngày (BE set trong DB, không có trong token)
  setCookie("refresh_token", refreshToken, {
    maxAge: 604800, // 7 ngày (khớp với BE: RefreshTokenExpireDays = 7)
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });
};

/**
 * Cập nhật access token mới (sau khi refresh)
 * ✅ Sử dụng thời gian expire từ BE (đọc từ JWT token)
 */
export const updateAccessToken = (
  accessToken: string
): void => {
  // ✅ Lấy thời gian hết hạn từ JWT token (BE đã set)
  const maxAge = getTokenExpiry(accessToken);
  
  setCookie("access_token", accessToken, {
    maxAge: maxAge || 7200, // Fallback 2 giờ nếu không đọc được
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

/**
 * 🔍 DEBUG: Lấy thông tin chi tiết về token expiry
 * @param token - JWT token để kiểm tra
 * @returns Object chứa thông tin expire time
 */
export const getTokenExpiryInfo = (token: string): {
  expiresAt: Date | null;
  expiresInSeconds: number | null;
  isExpired: boolean;
} => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp) {
      const expiresAt = new Date(payload.exp * 1000);
      const now = Math.floor(Date.now() / 1000);
      const expiresInSeconds = payload.exp - now;
      return {
        expiresAt,
        expiresInSeconds: expiresInSeconds > 0 ? expiresInSeconds : 0,
        isExpired: expiresInSeconds <= 0,
      };
    }
    return { expiresAt: null, expiresInSeconds: null, isExpired: true };
  } catch {
    return { expiresAt: null, expiresInSeconds: null, isExpired: true };
  }
};

/**
 * 🔍 DEBUG: Log thông tin về tokens hiện tại
 */
export const debugTokens = (): void => {
  if (typeof window === "undefined") return;
  
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  
  console.group("🔐 Token Debug Info");
  
  if (accessToken) {
    const info = getTokenExpiryInfo(accessToken);
    console.log("✅ Access Token:", {
      exists: true,
      expiresAt: info.expiresAt?.toLocaleString(),
      expiresIn: info.expiresInSeconds 
        ? `${Math.floor(info.expiresInSeconds / 60)} phút (${info.expiresInSeconds}s)`
        : "N/A",
      isExpired: info.isExpired,
    });
  } else {
    console.log("❌ Access Token: Không tồn tại");
  }
  
  if (refreshToken) {
    console.log("✅ Refresh Token:", {
      exists: true,
      token: `${refreshToken.substring(0, 20)}...`,
      note: "Expire time được quản lý bởi BE (7 ngày)",
    });
  } else {
    console.log("❌ Refresh Token: Không tồn tại");
  }
  
  console.groupEnd();
};
