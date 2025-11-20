# 🔐 Frontend Authentication Fixes - Đồng bộ với Backend

## 📋 Tổng Quan

Document này mô tả các thay đổi đã thực hiện để đồng bộ hóa xác thực FE với BE.

---

## ✅ Các Vấn Đề Đã Sửa

### 1. **Logout không gọi API Backend** ❌ → ✅

#### **Trước khi sửa:**
```typescript
// Header/index.tsx
const handleLogout = () => {
    dispatch(clearUser());  // Chỉ xóa ở client
    window.location.href = "/login";
};
```

**Vấn đề:**
- Refresh token vẫn còn trong database
- Không revoke token khỏi tất cả devices
- Không bảo mật nếu token bị đánh cắp

#### **Sau khi sửa:**
```typescript
// userSlice.ts - Thêm logout thunk
export const logoutUser = createAsyncThunk<void, number, { rejectValue: string }>(
  "user/logoutUser",
  async (userId, { rejectWithValue }) => {
    try {
      await axiosInstance.post(`/api/User/logout/${userId}`);
      clearTokens();
      return;
    } catch (err: unknown) {
      clearTokens(); // Dù lỗi vẫn xóa tokens ở client
      if (err instanceof Error) return rejectWithValue(err.message);
      return rejectWithValue("Lỗi đăng xuất");
    }
  }
);

// Header/index.tsx - Sử dụng logoutUser
const handleLogout = () => {
    const userId = currentUser?.userId;
    
    if (userId) {
      dispatch(logoutUser(userId)).finally(() => {
        setIsLoggedIn(false);
        setLocalUserName(null);
        window.location.href = "/login";
      });
    } else {
      dispatch(clearUser());
      window.location.href = "/login";
    }
};
```

**Lợi ích:**
- ✅ Revoke tất cả refresh tokens trong database
- ✅ Logout khỏi tất cả devices
- ✅ Bảo mật cao hơn

---

### 2. **Refresh Token API sai format** ❌ → ✅

#### **Trước khi sửa:**
```typescript
// axiosInstance.ts
const response = await axios.post("/api/User/refresh-token", {
    refreshToken  // ❌ Chỉ gửi refreshToken
});
```

**Vấn đề:**
- Backend yêu cầu CẢ `accessToken` VÀ `refreshToken`
- Backend cần validate accessToken (dù hết hạn) để lấy userId
- API call sẽ bị reject với lỗi "Missing required token fields"

#### **Sau khi sửa:**
```typescript
// axiosInstance.ts
const refreshToken = getRefreshToken();
const accessToken = getAccessToken();

if (!refreshToken || !accessToken) {
  // Redirect to login
  window.location.href = "/login";
  return Promise.reject(error);
}

const response = await axios.post("/api/User/refresh-token", {
    accessToken: accessToken,     // ✅ Gửi cả accessToken
    refreshToken: refreshToken    // ✅ và refreshToken
});
```

**Backend xử lý như thế nào:**
```csharp
// Backend ValidateToken với ValidateLifetime = false
var principal = tokenHandler.ValidateToken(accessToken, new TokenValidationParameters
{
    ValidateLifetime = false  // Cho phép token hết hạn
}, out validatedToken);

var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;

// Tìm refresh token trong DB với userId từ accessToken
var dbToken = await _context.RefreshTokens
    .FirstOrDefaultAsync(x => 
        x.Token == refreshToken && 
        x.UserId.ToString() == userIdClaim && 
        !x.IsRevoked && 
        x.ExpiresAt > DateTime.UtcNow
    );
```

---

### 3. **Không xử lý Refresh Token mới (Token Rotation)** ❌ → ✅

#### **Trước khi sửa:**
```typescript
if (response.data.errCode === "success" && response.data.data?.access_token) {
    const newAccessToken = response.data.data.access_token;
    updateAccessToken(newAccessToken);  // ❌ Chỉ update accessToken
}
```

**Vấn đề:**
- Backend implement **Token Rotation** (mỗi lần refresh tạo tokens mới)
- Backend revoke refresh token cũ và trả về refresh token mới
- Frontend không lưu refresh token mới → lần refresh tiếp theo sẽ fail

#### **Sau khi sửa:**
```typescript
if (response.data.errCode === "success" && response.data.data?.access_token) {
    const newAccessToken = response.data.data.access_token;
    const newRefreshToken = response.data.data.refresh_token;
    
    // ✅ Cập nhật CẢ HAI tokens (Token Rotation)
    if (newRefreshToken) {
        setTokens(newAccessToken, newRefreshToken);
    } else {
        updateAccessToken(newAccessToken);
    }
    
    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
    return axiosInstance(originalRequest);
}
```

**Backend Response:**
```csharp
return new ApiResponse<object>
{
    ErrCode = ErrorCode.Success,
    Data = new
    {
        access_token = jwt,              // ⭐ Access Token mới
        refresh_token = newRefreshToken.Token  // ⭐ Refresh Token mới
    }
};
```

**Token Rotation Flow:**
```
1. Client gửi: { accessToken: "old", refreshToken: "token123" }
2. Backend:
   - Validate accessToken (lấy userId)
   - Kiểm tra refreshToken trong DB
   - Revoke token cũ: dbToken.IsRevoked = true
   - Tạo tokens mới
3. Backend trả về: { access_token: "new_jwt", refresh_token: "token456" }
4. Client lưu CẢ HAI tokens mới
```

---

## 🔄 Flow Hoàn Chỉnh

### **Login Flow:**
```
1. User nhập email/password
2. POST /api/User/login
3. Backend trả về:
   {
     user: {...},
     access_token: "jwt...",
     refresh_token: "guid..."
   }
4. Frontend lưu:
   - Tokens vào cookies (httpOnly nếu có thể)
   - User info vào localStorage
   - User vào Redux state
```

### **API Call với Token:**
```
1. axiosInstance.interceptors.request:
   - Lấy accessToken từ cookie
   - Gắn vào header: Authorization: Bearer <token>

2. Nếu response 401:
   - Lấy cả accessToken và refreshToken
   - POST /api/User/refresh-token { accessToken, refreshToken }
   - Lưu tokens mới
   - Retry request ban đầu
```

### **Logout Flow:**
```
1. User click logout
2. dispatch(logoutUser(userId))
3. POST /api/User/logout/{userId}
4. Backend revoke ALL refresh tokens của user
5. Frontend clear:
   - Cookies (access_token, refresh_token)
   - localStorage (user)
   - Redux state
6. Redirect to /login
```

---

## 📁 Files Đã Thay Đổi

### 1. **src/redux/slices/userSlice.ts**
- ✅ Thêm `logoutUser` async thunk
- ✅ Thêm reducers cho logout (pending, fulfilled, rejected)
- ✅ Export `logoutUser`

### 2. **src/lib/axios/axiosInstance.ts**
- ✅ Import thêm `setTokens`
- ✅ Gửi cả `accessToken` và `refreshToken` khi refresh
- ✅ Lưu cả 2 tokens mới khi nhận response

### 3. **src/components/layouts/Header/index.tsx**
- ✅ Import `logoutUser` từ userSlice
- ✅ Sửa `handleLogout` để gọi API logout
- ✅ Xử lý fallback nếu không có userId

---

## 🔐 Security Best Practices

### ✅ **Đã Implement:**
1. **Token Rotation**: Refresh token mới mỗi lần refresh
2. **Token Revocation**: Logout revoke tất cả tokens
3. **Secure Cookies**: Tokens lưu trong cookies với Secure & SameSite
4. **Auto Cleanup**: Backend xóa tokens hết hạn khi login

### 🚀 **Có thể cải thiện thêm:**
1. **HttpOnly Cookies**: Cần backend set-cookie để tránh XSS
2. **CSRF Protection**: Thêm CSRF token nếu dùng cookies
3. **Rate Limiting**: Giới hạn số lần refresh token
4. **Device Tracking**: Lưu device info với refresh token
5. **Logout All Devices**: Thêm option logout từ 1 hoặc tất cả devices

---

## 🧪 Testing Checklist

### Logout:
- [ ] Logout thành công revoke tokens trong DB
- [ ] Không thể dùng refresh token cũ sau logout
- [ ] Logout từ nhiều tabs cùng lúc
- [ ] Logout khi API lỗi vẫn clear local data

### Refresh Token:
- [ ] Access token hết hạn → auto refresh thành công
- [ ] Refresh thành công lưu cả 2 tokens mới
- [ ] Refresh token hết hạn → redirect login
- [ ] Refresh token bị revoke → redirect login
- [ ] Đồng thời nhiều API calls → chỉ refresh 1 lần

### Token Rotation:
- [ ] Mỗi lần refresh có tokens mới
- [ ] Token cũ bị revoke
- [ ] Không thể reuse token cũ

---

## 📝 API Endpoints

### Login
```
POST /api/User/login
Body: { email, userPassword }
Response: { 
  errCode: "success",
  data: {
    user: {...},
    access_token: "jwt",
    refresh_token: "guid"
  }
}
```

### Refresh Token
```
POST /api/User/refresh-token
Body: { 
  accessToken: "jwt",
  refreshToken: "guid"
}
Response: {
  errCode: "success",
  data: {
    access_token: "new_jwt",
    refresh_token: "new_guid"
  }
}
```

### Logout
```
POST /api/User/logout/{userId}
Response: {
  errCode: "success",
  errMessage: "Logged out and refresh tokens revoked."
}
```

---

## 🎯 Kết Luận

Sau khi sửa, authentication flow của FE đã đồng bộ hoàn toàn với BE:
- ✅ Logout gọi API BE để revoke tokens
- ✅ Refresh token gửi đúng format (cả accessToken + refreshToken)
- ✅ Hỗ trợ Token Rotation (lưu tokens mới)
- ✅ Bảo mật cao hơn với proper token management

**Next Steps:**
1. Test kỹ các scenarios trên
2. Consider implement HttpOnly cookies
3. Add monitoring/logging cho token refresh
4. Document cho team về flow mới
