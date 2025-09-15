import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "@/lib/axios/axiosInstance";
import { User, CreateUserDto } from "@/types/user";

interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

interface UserState {
  users: User[];
  user: User | null;
  loading: boolean;
  error: string | null;
  changePasswordLoading: boolean;
  changePasswordError: string | null;
  changePasswordSuccess: boolean;
}

const initialState: UserState = {
  users: [],
  user: null,
  loading: false,
  error: null,
  changePasswordLoading: false,
  changePasswordError: null,
  changePasswordSuccess: false,
};

// Helper lấy token
const getToken = (): string | null => localStorage.getItem("token");

// ================== THUNKS ==================

// Login
export const loginUser = createAsyncThunk<
  User,
  { email: string; userPassword: string; remember: boolean },
  { rejectValue: string }
>("user/loginUser", async (data, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post("/api/User/login", data);
    const { errMessage, data: resData } = response.data;
    if (errMessage === "OK" && resData?.user && resData?.token) {
      document.cookie = `token=${resData.token}; path=/; max-age=86400`;
      localStorage.setItem("user", JSON.stringify(resData.user));
      localStorage.setItem("token", resData.token);
      if (data.remember) {
        localStorage.setItem(
          "rememberedLogin",
          JSON.stringify({ email: data.email, userPassword: data.userPassword })
        );
      } else localStorage.removeItem("rememberedLogin");
      return resData.user as User;
    } else {
      return rejectWithValue("Email hoặc mật khẩu không chính xác!");
    }
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
    const token = getToken();
    await axiosInstance.put("/api/User", updatedUser, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    localStorage.setItem("user", JSON.stringify({ ...updatedUser, token }));
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
    const token = getToken();
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
      document.cookie = "token=; path=/; max-age=0";
      localStorage.removeItem("user");
      state.loading = false;
      state.error = null;
      state.changePasswordLoading = false;
      state.changePasswordError = null;
      state.changePasswordSuccess = false;
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
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.user = action.payload;
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
      });
  },
});

export const { setUser, clearUser, resetChangePasswordState } =
  userSlice.actions;
export default userSlice.reducer;
