import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { User, CreateUserDto } from "@/types/user";
import axiosInstance from "@/lib/axios/axiosInstance";
import {
  setAccessToken,
  getAccessToken,
  clearTokens,
  setUser as saveUserToStorage,
  logTokenExpiry,
} from "@/lib/utils/tokenHelper";

interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

interface UserState {
  users: User[];
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
  changePasswordLoading: boolean;
  changePasswordError: string | null;
  changePasswordSuccess: boolean;
}

const initialState: UserState = {
  users: [],
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
  error: null,
  changePasswordLoading: false,
  changePasswordError: null,
  changePasswordSuccess: false,
};

// ================== THUNKS ==================

// Login
export const loginUser = createAsyncThunk<
  { user: User; access_token: string; refresh_token?: string },
  { email: string; userPassword: string; remember: boolean },
  { rejectValue: string }
>("user/loginUser", async (data, { rejectWithValue }) => {
  try {
    // Transform to PascalCase for C# backend
    const loginPayload = {
      Email: data.email,
      UserPassword: data.userPassword,
    };
    
    const response = await axiosInstance.post("/api/User/login", loginPayload);
    const payload = response.data ?? {};

    // support both wrapper shapes
    const wrapper = payload.data ?? payload;
    const accessToken =
      wrapper?.accessToken ??
      wrapper?.access_token ??
      payload?.accessToken ??
      payload?.access_token;
    const refreshToken =
      wrapper?.refreshToken ??
      wrapper?.refresh_token ??
      payload?.refreshToken ??
      payload?.refresh_token;
    const userObj = wrapper?.user ?? payload?.user;

    const errMessage = payload.errMessage ?? payload.message ?? null;

    if (accessToken && userObj) {
      setAccessToken(accessToken);
      try {
        axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      } catch {
        // ignore
      }
      saveUserToStorage(userObj);

      // Log token expiry info
      if (typeof window !== "undefined") {
        setTimeout(() => {
          logTokenExpiry();
        }, 100);
      }

      if (data.remember) {
        localStorage.setItem(
          "rememberedLogin",
          JSON.stringify({ email: data.email, userPassword: data.userPassword })
        );
      } else {
        localStorage.removeItem("rememberedLogin");
      }

      return {
        user: userObj as User,
        access_token: accessToken,
        refresh_token: refreshToken,
      };
    }

    return rejectWithValue(
      errMessage || "Email hoặc mật khẩu không chính xác!"
    );
  } catch (err: unknown) {
    if (err instanceof Error) return rejectWithValue(err.message);
    return rejectWithValue("Lỗi đăng nhập");
  }
});

// Fetch users
export const fetchUsers = createAsyncThunk<
  User[],
  void,
  { rejectValue: string }
>("user/fetchUsers", async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get("/api/User");
    return res.data.data as User[];
  } catch (err: unknown) {
    if (err instanceof Error) return rejectWithValue(err.message);
    return rejectWithValue("Lỗi lấy danh sách người dùng");
  }
});

// Create user
export const createUser = createAsyncThunk<
  User,
  CreateUserDto,
  { rejectValue: string }
>("user/createUser", async (newUser, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post("/api/User", newUser);
    const { errCode, errMessage, data } = res.data;
    if (errCode === "success") return data as User;

    return rejectWithValue(errMessage || "Tạo tài khoản thất bại");
  } catch (err: unknown) {
    if (err instanceof Error) return rejectWithValue(err.message);
    return rejectWithValue("Lỗi tạo người dùng");
  }
});

// Update user
export const updateUser = createAsyncThunk<
  User,
  Partial<User> & { userId: number },
  { rejectValue: string }
>("user/updateUser", async (updatedUser, { rejectWithValue }) => {
  try {
    const token = getAccessToken();
    await axiosInstance.put("/api/User", updatedUser, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const currentUser = localStorage.getItem("user");
    if (currentUser) {
      const parsedUser = JSON.parse(currentUser);
      localStorage.setItem(
        "user",
        JSON.stringify({ ...parsedUser, ...updatedUser })
      );
    }
    return updatedUser as User;
  } catch (err: unknown) {
    if (err instanceof Error) return rejectWithValue(err.message);
    return rejectWithValue("Lỗi cập nhật người dùng");
  }
});

// Delete user
export const deleteUser = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("user/deleteUser", async (id, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/api/User/${id}`);
    return id;
  } catch (err: unknown) {
    if (err instanceof Error) return rejectWithValue(err.message);
    return rejectWithValue("Lỗi xóa người dùng");
  }
});

// Change password
export const changePassword = createAsyncThunk<
  void,
  ChangePasswordPayload,
  { rejectValue: string }
>("user/changePassword", async (payload, { rejectWithValue }) => {
  try {
    const token = getAccessToken();
    const res = await axiosInstance.post("/api/User/change-password", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const { errCode, errMessage, status } = res.data;
    if (errCode === "success" || status === "success") return;
    return rejectWithValue(errMessage || "Đổi mật khẩu thất bại!");
  } catch (err: unknown) {
    if (err instanceof Error) return rejectWithValue(err.message);
    return rejectWithValue("Đổi mật khẩu thất bại!");
  }
});

// Logout - Gọi API BE để revoke refresh tokens
export const logoutUser = createAsyncThunk<
  void,
  number, // userId
  { rejectValue: string }
>("user/logoutUser", async (userId, { rejectWithValue }) => {
  try {
    // ✅ Gọi API BE để revoke tất cả refresh tokens
    await axiosInstance.post(`/api/User/logout/${userId}`);
    
    // ✅ Xóa tokens và user data ở client
    clearTokens();
    
    return;
  } catch (err: unknown) {
    // Dù lỗi vẫn xóa tokens ở client để đảm bảo logout
    clearTokens();
    
    if (err instanceof Error) return rejectWithValue(err.message);
    return rejectWithValue("Lỗi đăng xuất");
  }
});

// ================== SLICE ==================
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      // ✅ Xóa tokens từ cookie và localStorage
      clearTokens();
      state.loading = false;
      state.error = null;
      state.changePasswordLoading = false;
      state.changePasswordError = null;
      state.changePasswordSuccess = false;
    },
    updateAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      // ✅ Cập nhật access token trong localStorage
      setAccessToken(action.payload);
    },
    resetChangePasswordState: (state) => {
      state.changePasswordLoading = false;
      state.changePasswordError = null;
      state.changePasswordSuccess = false;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.access_token;
        state.refreshToken = action.payload.refresh_token ?? null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Lỗi đăng nhập";
      })

      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Lỗi lấy danh sách người dùng";
      })

      // Create user
      .addCase(createUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.users.push(action.payload);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.error = action.payload ?? "Tạo người dùng thất bại";
      })

      // Update user
      .addCase(updateUser.fulfilled, (state, action: PayloadAction<User>) => {
        const updatedUser = action.payload;
        const index = state.users.findIndex(
          (u) => u.userId === updatedUser.userId
        );
        if (index !== -1) state.users[index] = updatedUser;
        if (state.user?.userId === updatedUser.userId) state.user = updatedUser;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.error = action.payload ?? "Cập nhật thất bại";
      })

      // Delete user
      .addCase(deleteUser.fulfilled, (state, action: PayloadAction<number>) => {
        state.users = state.users.filter((u) => u.userId !== action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.error = action.payload ?? "Xóa thất bại";
      })

      // Change password
      .addCase(changePassword.pending, (state) => {
        state.changePasswordLoading = true;
        state.changePasswordError = null;
        state.changePasswordSuccess = false;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.changePasswordLoading = false;
        state.changePasswordSuccess = true;
        state.changePasswordError = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.changePasswordLoading = false;
        state.changePasswordError = action.payload ?? "Đổi mật khẩu thất bại";
        state.changePasswordSuccess = false;
      })

      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        // ✅ Clear tất cả user data
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.loading = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        // ✅ Dù lỗi vẫn clear user data
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.loading = false;
        state.error = action.payload ?? "Lỗi đăng xuất";
      });
  },
});

export const { setUser, clearUser, updateAccessToken, resetChangePasswordState } =
  userSlice.actions;

export default userSlice.reducer;
