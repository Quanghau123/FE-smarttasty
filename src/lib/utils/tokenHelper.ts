let accessToken: string | null = null;

export const setAccessToken = (token: string) => {
  accessToken = token;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("access_token", token);
    } catch {
      // ignore storage errors
    }
  }
};

export const getAccessToken = (): string | null => {
  if (accessToken) return accessToken;
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
};

export const clearAccessToken = () => {
  accessToken = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
  }
};

export const setUser = (user: {
  userId: number;
  userName: string;
  role: string;
}) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(user));
  }
};

export const getUser = (): {
  userId: number;
  userName: string;
  role: string;
} | null => {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
};

export const clearUser = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("user");
  }
};

export const isAuthenticated = (): boolean => !!getAccessToken();
