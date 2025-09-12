import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "@/lib/axios/axiosInstance";
import { User } from "@/types/user";

interface UserState {
  users: User[];
  user: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  users: [],
  user: null,
  loading: false,
  error: null,
};

// Login
export const loginUser = createAsyncThunk(
  "user/loginUser",
  async (
    data: { email: string; userPassword: string; remember: boolean },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post("/api/User/login", data);
      const { errMessage, data: resData } = response.data;

      if (errMessage === "OK" && resData?.user && resData?.token) {
        // lưu token vào cookie
        document.cookie = `token=${resData.token}; path=/; max-age=86400`;

        // ✅ luôn lưu user và token để duy trì trạng thái đăng nhập
        localStorage.setItem("user", JSON.stringify(resData.user));
        localStorage.setItem("token", resData.token);

        // ✅ chỉ lưu thông tin login (email, password) khi user tick "remember"
        if (data.remember) {
          localStorage.setItem(
            "rememberedLogin",
            JSON.stringify({
              email: data.email,
              userPassword: data.userPassword,
            })
          );
        } else {
          localStorage.removeItem("rememberedLogin");
        }

        return resData.user as User;
      } else {
        return rejectWithValue("Email hoặc mật khẩu không chính xác!");
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.errMessage || "Lỗi đăng nhập"
      );
    }
  }
);

// Get all users
export const fetchUsers = createAsyncThunk(
  "user/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/api/User");
      return res.data.data as User[];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.errMessage || "Lỗi lấy danh sách người dùng"
      );
    }
  }
);

// Create user (không gán cứng role)
export const createUser = createAsyncThunk(
  "user/createUser",
  async (newUser: Omit<User, "id">, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/User", newUser); // 👈 Role do component truyền vào
      const { errCode, errMessage, data } = res.data;

      if (errCode === 0) {
        return data;
      } else {
        return rejectWithValue(errMessage || "Tạo tài khoản thất bại");
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.errMessage || "Lỗi tạo người dùng"
      );
    }
  }
);

// Update user
export const updateUser = createAsyncThunk(
  "user/updateUser",
  async (
    { id, updatedData }: { id: number; updatedData: FormData },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.put(`/api/User/${id}`, updatedData);
      return res.data.data as User;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.errMessage || "Lỗi cập nhật người dùng"
      );
    }
  }
);

// Delete user
export const deleteUser = createAsyncThunk(
  "user/deleteUser",
  async (id: number, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/api/User/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.errMessage || "Lỗi xóa người dùng"
      );
    }
  }
);

// Slice
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
    },
  },
  extraReducers: (builder) => {
    builder

      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create user
      .addCase(createUser.fulfilled, (state, action) => {
        state.users.push(action.payload);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Update user
      .addCase(updateUser.fulfilled, (state, action) => {
        state.users = state.users.map((user) =>
          user.id === action.payload.id ? action.payload : user
        );
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Delete user
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((user) => user.id !== action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
