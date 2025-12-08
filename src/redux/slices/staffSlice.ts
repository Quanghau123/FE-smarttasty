import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "@/lib/axios/axiosInstance";
import { User } from "@/types/user";

interface StaffState {
  staffs: User[];
  loading: boolean;
  error: string | null;
  currentStaff: User | null;
}

const initialState: StaffState = {
  staffs: [],
  loading: false,
  error: null,
  currentStaff: null,
};

export const fetchStaffsByBusiness = createAsyncThunk<User[]>(
  "staff/fetchStaffsByBusiness",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/api/User/business/staff");
      const body = res.data ?? {};
      const data = (body.data ?? body) as User[];
      return data || [];
    } catch (err: unknown) {
      if (err instanceof Error) return rejectWithValue(err.message);
      return rejectWithValue("Lỗi lấy danh sách nhân viên");
    }
  }
);

export const createStaff = createAsyncThunk<User, { userName: string; email: string; phone: string; address?: string; password?: string }>(
  "staff/createStaff",
  async (payload, { rejectWithValue }) => {
    try {
      const body = {
        UserName: payload.userName,
        Email: payload.email,
        Phone: payload.phone,
        Address: payload.address ?? "",
        Password: payload.password ?? undefined,
      };
      const res = await axiosInstance.post("/api/User/business/staff", body);
      const r = res.data ?? {};
      const data = (r.data ?? r) as User;
      if (!data) throw new Error(r.errMessage || "Tạo nhân viên thất bại");
      return data;
    } catch (err: unknown) {
      if (err instanceof Error) return rejectWithValue(err.message);
      return rejectWithValue("Lỗi tạo nhân viên");
    }
  }
);

type UpdateStaffRequest = {
  UserId: number;
  UserName?: string;
  Email?: string;
  Phone?: string;
  Address?: string;
  IsActive?: boolean | null;
};

export const updateStaff = createAsyncThunk<User, Partial<User> & { userId: number; isActive?: boolean }>(
  "staff/updateStaff",
  async (payload, { rejectWithValue }) => {
    try {
      const body: UpdateStaffRequest = {
        UserId: payload.userId,
      };
      if (payload.userName) body.UserName = payload.userName;
      if (payload.email) body.Email = payload.email;
      if (payload.phone) body.Phone = payload.phone;
      if (payload.address) body.Address = payload.address;
      if (typeof payload.isActive !== "undefined") body.IsActive = payload.isActive ?? null;

      const res = await axiosInstance.put("/api/User/business/staff", body);
      const r = res.data ?? {};
      const data = (r.data ?? r) as User;
      return data || (payload as User);
    } catch (err: unknown) {
      if (err instanceof Error) return rejectWithValue(err.message);
      return rejectWithValue("Lỗi cập nhật nhân viên");
    }
  }
);

export const deleteStaff = createAsyncThunk<number, number>(
  "staff/deleteStaff",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/api/User/business/staff/${id}`);
      return id;
    } catch (err: unknown) {
      if (err instanceof Error) return rejectWithValue(err.message);
      return rejectWithValue("Lỗi xóa nhân viên");
    }
  }
);

export const fetchMyStaffInfo = createAsyncThunk<User | null>(
  "staff/fetchMyStaffInfo",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/api/User/staff");
      const body = res.data ?? {};
      const data = (body.data ?? body) as User | null;
      return data || null;
    } catch (err: unknown) {
      if (err instanceof Error) return rejectWithValue(err.message);
      return rejectWithValue("Lỗi lấy thông tin nhân viên");
    }
  }
);

const staffSlice = createSlice({
  name: "staff",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStaffsByBusiness.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStaffsByBusiness.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.loading = false;
        state.staffs = action.payload;
      })
      .addCase(fetchStaffsByBusiness.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Lỗi lấy danh sách nhân viên";
      })

      .addCase(createStaff.fulfilled, (state, action: PayloadAction<User>) => {
        state.staffs.push(action.payload);
      })
      .addCase(createStaff.rejected, (state, action) => {
        state.error = (action.payload as string) || "Tạo nhân viên thất bại";
      })

      .addCase(updateStaff.fulfilled, (state, action: PayloadAction<User>) => {
        const idx = state.staffs.findIndex((s) => s.userId === action.payload.userId);
        if (idx !== -1) state.staffs[idx] = action.payload;
      })
      .addCase(updateStaff.rejected, (state, action) => {
        state.error = (action.payload as string) || "Cập nhật nhân viên thất bại";
      })

      .addCase(deleteStaff.fulfilled, (state, action: PayloadAction<number>) => {
        state.staffs = state.staffs.filter((s) => s.userId !== action.payload);
      })
      .addCase(deleteStaff.rejected, (state, action) => {
        state.error = (action.payload as string) || "Xóa nhân viên thất bại";
      });

    builder
      .addCase(fetchMyStaffInfo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyStaffInfo.fulfilled, (state, action: PayloadAction<User | null>) => {
        state.loading = false;
        state.currentStaff = action.payload;
      })
      .addCase(fetchMyStaffInfo.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Lỗi lấy thông tin nhân viên";
      });
  },
});

export default staffSlice.reducer;
