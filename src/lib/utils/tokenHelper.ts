let accessToken: string | null = null;

type AccessTokenListener = (token: string | null) => void;
const accessTokenListeners: AccessTokenListener[] = [];

const notifyAccessTokenChanged = () => {
  for (const l of accessTokenListeners) {
    try { l(accessToken); } catch { /* ignore */ }
  }
};

export const setAccessToken = (token: string) => {
  accessToken = token;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("access_token", token);
    } catch {
    }
  }
  notifyAccessTokenChanged();
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
  notifyAccessTokenChanged();
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



export const clearTokens = () => {
  clearAccessToken();
  clearUser();
};


export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};

export const subscribeAccessTokenChange = (listener: AccessTokenListener) => {
  accessTokenListeners.push(listener);
  return () => {
    const idx = accessTokenListeners.indexOf(listener);
    if (idx >= 0) accessTokenListeners.splice(idx, 1);
  };
};

export const logTokenExpiry = () => {
  const token = getAccessToken();
  if (!token) {
    return;
  }

  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return;
    }

    const payload = JSON.parse(atob(parts[1]));
    
    if (payload.exp) {
    } else {
    }
  } catch {
  }
};
