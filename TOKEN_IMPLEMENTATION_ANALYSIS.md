# 🔍 Phân tích Token Implementation - Backend vs Frontend

## 📋 Tóm tắt
Sau khi kiểm tra code BE và FE, có **MỘT VẤN ĐỀ QUAN TRỌNG** cần sửa trong cách refresh token.

---

## ✅ Những điểm ĐÚNG

### 1. **Backend Implementation (BE)**

#### Access Token
- ✅ Sử dụng JWT với exp claim
- ✅ Expire time: **120 phút** (AccessTokenExpireMinutes = 120)
- ✅ Chứa claims: userId, userName, email, role
- ✅ Signed với HMAC SHA256

```csharp
// BE: UserService.cs - GenerateAccessToken
Expires = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpireMinutes), // 120 phút
```

#### Refresh Token
- ✅ Lưu trong database với các thuộc tính:
  - Token (GUID string)
  - UserId
  - ExpiresAt
  - IsRevoked
- ✅ Expire time: **7 ngày** (RefreshTokenExpireDays = 7)
- ✅ Được set vào **HttpOnly Cookie** khi login/refresh
- ✅ Sử dụng **Token Rotation**: mỗi lần refresh tạo refresh token MỚI và revoke token CŨ

```csharp
// BE: UserController.cs - Login
Response.Cookies.Append("refresh_token", rt, new CookieOptions {
    HttpOnly = true,
    Secure = true,
    SameSite = SameSiteMode.Strict,
    Expires = DateTime.UtcNow.AddDays(7)
});
```

#### Refresh Token Flow
```csharp
// BE: UserController.cs - RefreshToken endpoint
[HttpPost("refresh-token")]
public async Task<IActionResult> RefreshToken()
{
    // ✅ Lấy refresh token từ COOKIE (HttpOnly)
    var refreshToken = Request.Cookies["refresh_token"];
    
    // ✅ Lấy access token từ Authorization header
    var accessToken = Request.Headers["Authorization"].ToString()?.Replace("Bearer ", "");
    
    // ✅ Validate CẢ HAI tokens
    var result = await _userService.RefreshTokenAsync(accessToken, refreshToken);
    
    // ✅ Trả về tokens mới và set refresh token mới vào cookie
    if (result.Data?.RefreshToken is string newRt)
    {
        Response.Cookies.Append("refresh_token", newRt, ...);
    }
}
```

---

### 2. **Frontend Implementation (FE)**

#### Token Storage
- ✅ Access token lưu trong **cookie** (tốt hơn localStorage)
- ✅ Refresh token lưu trong **cookie** (tốt hơn localStorage)
- ✅ Sử dụng secure cookies với SameSite=Strict

```typescript
// FE: tokenHelper.ts - setTokens
setCookie("access_token", accessToken, {
    maxAge: accessTokenMaxAge || 7200, // 2 giờ
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
});

setCookie("refresh_token", refreshToken, {
    maxAge: 604800, // 7 ngày
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
});
```

#### Token Expiry Parsing
- ✅ Đọc exp claim từ JWT để set cookie expiry
- ✅ Fallback về 7200s (2 giờ) nếu không đọc được

```typescript
// FE: tokenHelper.ts - getTokenExpiry
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
```

---

## ❌ VẤN ĐỀ CẦN SỬA

### **Vấn đề: Cách gọi API refresh token KHÔNG ĐÚNG**

#### Backend mong đợi:
```csharp
// BE: UserController.cs
var refreshToken = Request.Cookies["refresh_token"];  // ✅ Từ COOKIE
var accessToken = Request.Headers["Authorization"];    // ✅ Từ HEADER
```

#### Frontend hiện tại đang làm SAI:
```typescript
// FE: axiosInstance.ts - HIỆN TẠI (SAI)
const response = await axios.post(
  `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/User/refresh-token`,
  { 
    accessToken: accessToken,      // ❌ SAI: Gửi trong BODY
    refreshToken: refreshToken     // ❌ SAI: Gửi trong BODY
  }
);
```

### **Tại sao SAI?**

1. **Backend KHÔNG đọc từ body**: Backend đọc `refresh_token` từ **Cookie** và `accessToken` từ **Authorization header**
2. **Security issue**: Gửi tokens trong body làm giảm tính bảo mật (có thể bị log, cache)
3. **Cookie không được gửi tự động**: Nếu refresh token ở cookie là HttpOnly, FE không cần/không thể đọc và gửi lại

---

## 🔧 CÁCH SỬA

### **Sửa file: `src/lib/axios/axiosInstance.ts`**

```typescript
// ✅ ĐÚNG: Gửi accessToken qua Authorization header
// Backend sẽ tự động đọc refresh_token từ HttpOnly Cookie
const response = await axios.post(
  `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/User/refresh-token`,
  {}, // ❌ KHÔNG gửi body
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,  // ✅ Gửi access token qua header
    },
    withCredentials: true  // ✅ Quan trọng: Gửi cookies với request
  }
);
```

### **Giải thích:**
- `Authorization` header: BE đọc để validate access token cũ
- `withCredentials: true`: Tự động gửi cookies (bao gồm refresh_token) đến BE
- Backend tự lấy `refresh_token` từ `Request.Cookies["refresh_token"]`

---

## 📊 So sánh Backend vs Frontend

| Aspect | Backend (C#) | Frontend (TypeScript) | Status |
|--------|-------------|---------------------|--------|
| **Access Token Storage** | Return in response body | ✅ Cookie | ✅ Đúng |
| **Refresh Token Storage** | ✅ HttpOnly Cookie | ✅ Cookie | ✅ Đúng |
| **Access Token Expiry** | 120 phút (JWT exp) | ✅ Đọc từ JWT | ✅ Đúng |
| **Refresh Token Expiry** | 7 ngày (DB) | ✅ 7 ngày | ✅ Đúng |
| **Token Rotation** | ✅ Yes (revoke old, create new) | ✅ Yes | ✅ Đúng |
| **Refresh API Call** | Đọc từ Cookie + Header | ❌ Gửi trong body | ❌ **SAI** |
| **withCredentials** | N/A | ❌ Thiếu | ❌ **SAI** |

---

## 🎯 Checklist sửa lỗi

- [ ] Xóa body trong POST refresh-token
- [ ] Gửi accessToken qua Authorization header
- [ ] Thêm `withCredentials: true` vào axios config
- [ ] Test lại flow refresh token
- [ ] Kiểm tra cookie được gửi tự động

---

## 🔐 Security Best Practices được áp dụng

✅ **Đã làm đúng:**
1. Refresh token ở HttpOnly Cookie (không thể đọc bằng JavaScript)
2. Token Rotation (refresh token chỉ dùng 1 lần)
3. Access token có expire time ngắn (2 giờ)
4. Secure cookies trong production
5. SameSite=Strict để chống CSRF

❌ **Cần cải thiện:**
1. Sửa cách gọi API refresh token
2. Đảm bảo credentials được gửi với mọi request

---

## 📝 Response Types

### Login Response
```typescript
{
  errCode: "success",
  data: {
    access_token: string,    // JWT với exp claim
    refresh_token: string,   // GUID, cũng được set vào cookie
    user: {...}
  }
}
```

### Refresh Token Response
```typescript
{
  errCode: "success",
  data: {
    access_token: string,    // JWT mới
    refresh_token: string    // Refresh token mới (Token Rotation)
  }
}
```

---

## 🚀 Kết luận

**Tình trạng:** FE đang sử dụng access token và refresh token CƠ BẢN ĐÚNG, nhưng có **1 lỗi quan trọng** trong cách gọi API refresh token.

**Mức độ:** 🟡 Trung bình - Cần sửa ngay để đảm bảo refresh token hoạt động đúng

**Impact:** Hiện tại refresh token có thể KHÔNG hoạt động vì:
- Backend không nhận được tokens từ đúng nơi
- Cookies không được gửi tự động (thiếu withCredentials)

**Next steps:** Sửa file `axiosInstance.ts` theo hướng dẫn trên.
