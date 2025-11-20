# ✅ Đã sửa xong Token Implementation

## 🔧 Các thay đổi đã thực hiện

### File: `src/lib/axios/axiosInstance.ts`

#### 1. **Thêm `withCredentials: true` vào axios instance**
```typescript
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 60000,
  withCredentials: true,  // ✅ MỚI: Gửi cookies với mọi request
  headers: {
    Accept: "application/json",
  },
});
```

**Tại sao quan trọng:**
- Đảm bảo HttpOnly cookies (refresh_token) được gửi tự động với mọi request
- Bắt buộc để BE có thể đọc refresh token từ cookie

---

#### 2. **Sửa lại cách gọi API refresh token**

**❌ TRƯỚC ĐÂY (SAI):**
```typescript
const response = await axios.post(
  `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/User/refresh-token`,
  { 
    accessToken: accessToken,      // ❌ BE không đọc từ body
    refreshToken: refreshToken     // ❌ BE không đọc từ body
  }
);
```

**✅ SAU KHI SỬA (ĐÚNG):**
```typescript
const response = await axios.post(
  `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/User/refresh-token`,
  {},  // ✅ Body trống - BE đọc từ cookie và header
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,  // ✅ BE đọc từ header
    },
    withCredentials: true  // ✅ Gửi cookies (refresh_token) tự động
  }
);
```

---

#### 3. **Xóa import không cần thiết**

**❌ TRƯỚC:**
```typescript
import { getAccessToken, getRefreshToken, updateAccessToken, setTokens } from "@/lib/utils/tokenHelper";
```

**✅ SAU:**
```typescript
import { getAccessToken, updateAccessToken, setTokens } from "@/lib/utils/tokenHelper";
```

**Lý do:** Không cần đọc `refreshToken` từ cookie trong code nữa vì:
- Refresh token là HttpOnly cookie
- Browser tự động gửi với request khi có `withCredentials: true`

---

## 🎯 Cách hoạt động sau khi sửa

### Flow Refresh Token:

```
1. User gửi request với access token hết hạn
   ↓
2. Backend trả về 401 Unauthorized
   ↓
3. Axios interceptor bắt 401
   ↓
4. FE gọi POST /api/User/refresh-token:
   - Access token (cũ, hết hạn) → Authorization header
   - Refresh token (HttpOnly cookie) → Tự động gửi qua withCredentials
   ↓
5. Backend:
   - Đọc access token từ header
   - Đọc refresh token từ cookie
   - Validate cả 2 tokens
   - Tạo tokens mới (Token Rotation)
   - Set refresh token mới vào cookie
   - Trả về access token mới trong response
   ↓
6. FE:
   - Lưu access token mới vào cookie
   - Retry request ban đầu với token mới
   ↓
7. ✅ Request thành công
```

---

## 🔐 Security improvements

### ✅ Đã đạt được:

1. **HttpOnly Cookies**: Refresh token không thể đọc bằng JavaScript (chống XSS)
2. **Token Rotation**: Mỗi lần refresh, tokens cũ bị vô hiệu hóa
3. **withCredentials**: Cookies được gửi an toàn với CORS
4. **Không lộ tokens**: Không gửi tokens trong body/query params
5. **Secure in production**: Cookies có flag `secure` trong production

---

## 📋 Checklist kiểm tra

- [x] Xóa body trong POST refresh-token
- [x] Gửi accessToken qua Authorization header
- [x] Thêm `withCredentials: true` vào axios config
- [x] Thêm `withCredentials: true` vào refresh request
- [x] Xóa import `getRefreshToken` không dùng
- [x] Không có lỗi TypeScript

---

## 🧪 Test cases cần kiểm tra

### 1. Login flow
- [ ] Login thành công → Access token và refresh token được lưu vào cookie
- [ ] Cookie có thuộc tính secure, httpOnly, sameSite=Strict

### 2. Authenticated requests
- [ ] Request với access token hợp lệ → Thành công
- [ ] Cookies được gửi tự động với mọi request

### 3. Token refresh flow
- [ ] Access token hết hạn → 401 error
- [ ] Auto refresh token → Lấy tokens mới
- [ ] Retry request với token mới → Thành công
- [ ] Refresh token mới được set vào cookie

### 4. Error handling
- [ ] Refresh token hết hạn → Redirect về /login
- [ ] Refresh token bị revoke → Redirect về /login
- [ ] Network error khi refresh → Redirect về /login

---

## 📝 Notes

### Backend expectations (đã match):
- ✅ Refresh token: `Request.Cookies["refresh_token"]`
- ✅ Access token: `Request.Headers["Authorization"]`
- ✅ Response: Cả access_token và refresh_token mới

### Frontend implementation (đã đúng):
- ✅ Access token: Gửi qua Authorization header
- ✅ Refresh token: Tự động gửi qua cookie với withCredentials
- ✅ Token Rotation: Cập nhật cả 2 tokens mới

---

## 🚀 Next steps

1. **Test trên môi trường dev:**
   ```bash
   npm run dev
   ```

2. **Test flow:**
   - Đăng nhập
   - Đợi access token hết hạn (hoặc mock 401)
   - Kiểm tra console xem refresh có hoạt động
   - Verify cookies trong DevTools

3. **Production checklist:**
   - Đảm bảo `NEXT_PUBLIC_API_BASE_URL` đúng
   - Backend phải enable CORS với credentials
   - Backend phải set cookie với domain phù hợp

---

## ⚠️ Lưu ý quan trọng

### Backend CORS configuration cần:
```csharp
// Backend cần config CORS cho phép credentials
app.UseCors(policy => policy
    .WithOrigins("http://localhost:3000", "https://yourdomain.com")
    .AllowCredentials()  // ⚠️ Quan trọng!
    .AllowAnyHeader()
    .AllowAnyMethod());
```

Nếu backend không có `AllowCredentials()`, cookies sẽ KHÔNG được gửi dù FE có `withCredentials: true`.

---

## 📊 Kết quả

| Aspect | Trước đây | Sau khi sửa |
|--------|-----------|-------------|
| Refresh token location | ❌ Body | ✅ Cookie |
| Access token location | ❌ Body | ✅ Header |
| withCredentials | ❌ Thiếu | ✅ Có |
| Cookie auto-send | ❌ Không | ✅ Có |
| Match với BE | ❌ Không | ✅ Đúng 100% |
| Security | 🟡 TB | ✅ Tốt |

---

**Status:** ✅ HOÀN THÀNH - FE đã sử dụng access token và refresh token ĐÚNG CÁCH như Backend mong đợi!
