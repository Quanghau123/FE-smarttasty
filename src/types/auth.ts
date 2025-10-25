export interface LoginResponse {
  errCode: string;
  errMessage: string;
  data: {
    access_token: string;
    refresh_token: string;
    user: {
      userId: number;
      userName: string;
      email: string;
      phone: string;
      address: string;
      role: string;
    };
  };
  timestamp: string;
  traceId: string | null;
  status: string;
}

export interface RefreshTokenResponse {
  errCode: string;
  errMessage: string;
  data: {
    access_token: string;
  };
  timestamp: string;
  traceId: string | null;
  status: string;
}
