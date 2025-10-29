# 🔄 Token Expiry - Đồng Bộ FE với BE

## 📋 Vấn Đề Trước Đây

### ❌ **FE tự set thời gian expire (Hard-coded)**
```typescript
// Trước: FE tự định nghĩa thời gian
export const setTokens = (
  accessToken: string,
  refreshToken: string,
  accessTokenMaxAge: number = 7200,    // ❌ Hard-coded 2 giờ
  refreshTokenMaxAge: number = 604800  // ❌ Hard-coded 7 ngày
)
```

**Vấn đề:**
- ❌ FE và BE có thể không đồng bộ
- ❌ Khi BE thay đổi config, phải nhớ sửa FE
- ❌ Cookie expire khác với JWT expire → confusing
- ❌ Không tận dụng thông tin từ BE

---

## ✅ Giải Pháp Mới

### ✅ **FE đọc thời gian từ JWT token (từ BE)**

```typescript
// Sau: FE đọc từ JWT token mà BE đã tạo
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

export const setTokens = (
  accessToken: string,
  refreshToken: string
): void => {
  // ✅ Lấy expire time từ JWT token (BE đã set)
  const accessTokenMaxAge = getTokenExpiry(accessToken);
  
  setCookie("access_token", accessToken, {
    maxAge: accessTokenMaxAge || 7200, // Fallback nếu parse lỗi
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });
  
  // Refresh token: 7 ngày (khớp với BE config)
  setCookie("refresh_token", refreshToken, {
    maxAge: 604800, // 7 ngày
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });
};
```

---

## 🔐 Cách Hoạt Động

### **Backend (C#) - Tạo JWT Token:**
```csharp
// Backend: UserService.cs
private string GenerateAccessToken(User user)
{
    var tokenDescriptor = new SecurityTokenDescriptor
    {
        Subject = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            // ... other claims
        }),
        // ⭐ BE set expire time ở đây
        Expires = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpireMinutes),
        SigningCredentials = new SigningCredentials(...)
    };
    
    return tokenHandler.WriteToken(token);
}
```

**JWT Token Structure:**
```json
{
  "header": { "alg": "HS256", "typ": "JWT" },
  "payload": {
    "sub": "123",
    "email": "user@example.com",
    "exp": 1698765432,  // ⭐ Expire timestamp (BE set)
    "iat": 1698758232
  },
  "signature": "..."
}
```

### **Frontend (TypeScript) - Đọc từ JWT:**
```typescript
// Frontend: tokenHelper.ts
const getTokenExpiry = (token: string): number | null => {
  // 1. Decode JWT token (Base64)
  const payload = JSON.parse(atob(token.split('.')[1]));
  
  // 2. Lấy "exp" claim (Unix timestamp)
  const expTimestamp = payload.exp; // VD: 1698765432
  
  // 3. Tính số giây còn lại
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = expTimestamp - now;
  
  // 4. Return số giây (dùng cho cookie maxAge)
  return expiresIn > 0 ? expiresIn : null;
};
```

---

## 🎯 Lợi Ích

### ✅ **Single Source of Truth**
- BE là nguồn duy nhất định nghĩa expire time
- FE chỉ đọc và sử dụng
- Không có hard-coded values ở FE

### ✅ **Tự Động Đồng Bộ**
- BE thay đổi config → JWT token thay đổi
- FE tự động đọc được thời gian mới
- Không cần update code FE

### ✅ **Cookie Expire = JWT Expire**
- Cookie hết hạn đúng lúc JWT hết hạn
- Không có tình trạng cookie còn nhưng JWT đã expired
- Tránh confusion và bugs

---

## 📊 Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  BACKEND (C#)                                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  JwtSettings.AccessTokenExpireMinutes = 120                │
│                 ↓                                           │
│  GenerateAccessToken()                                     │
│    → Expires = DateTime.UtcNow.AddMinutes(120)            │
│    → JWT Token: { ..., "exp": 1698765432 }                │
│                 ↓                                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ API Response
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND (TypeScript)                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Nhận JWT token: "eyJhbGc..."                              │
│                 ↓                                           │
│  getTokenExpiry(token)                                     │
│    → Decode Base64                                         │
│    → Read "exp" claim: 1698765432                          │
│    → Calculate: exp - now = 7200 seconds                   │
│                 ↓                                           │
│  setTokens(accessToken, refreshToken)                      │
│    → setCookie("access_token", token, {                    │
│         maxAge: 7200  ← ✅ Lấy từ JWT                     │
│       })                                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 API Changes

### **Before:**
```typescript
// ❌ Phải truyền maxAge thủ công
setTokens(accessToken, refreshToken, 7200, 604800);
updateAccessToken(newToken, 7200);
```

### **After:**
```typescript
// ✅ Tự động lấy từ JWT
setTokens(accessToken, refreshToken);
updateAccessToken(newToken);
```

---

## 🧪 Testing & Debug

### **Kiểm tra thời gian expire của token:**
```typescript
import { getTokenExpiryInfo, debugTokens } from "@/lib/utils/tokenHelper";

// Cách 1: Chi tiết
const token = getAccessToken();
if (token) {
  const info = getTokenExpiryInfo(token);
  console.log("Token expires at:", info.expiresAt);
  console.log("Expires in:", info.expiresInSeconds, "seconds");
  console.log("Is expired:", info.isExpired);
}

// Cách 2: Quick debug
debugTokens();
```

**Console Output:**
```
🔐 Token Debug Info
  ✅ Access Token: {
    exists: true,
    expiresAt: "28/10/2025, 14:30:00",
    expiresIn: "115 phút (6900s)",
    isExpired: false
  }
  ✅ Refresh Token: {
    exists: true,
    token: "3fa85f64-5717-4562-b...",
    note: "Expire time được quản lý bởi BE (7 ngày)"
  }
```

### **Test trong Browser Console:**
```javascript
// Import helper (nếu có global access)
const { debugTokens } = window;

// Xem thông tin tokens
debugTokens();

// Hoặc trực tiếp decode JWT
const token = document.cookie.match(/access_token=([^;]+)/)?.[1];
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log("Expires at:", new Date(payload.exp * 1000));
}
```

---

## 📝 Files Changed

### 1. **`src/lib/utils/tokenHelper.ts`**

**Thêm function:**
- ✅ `getTokenExpiry()` - Private helper để đọc exp từ JWT
- ✅ `getTokenExpiryInfo()` - Public function để debug
- ✅ `debugTokens()` - Console log token info

**Sửa function:**
- ✅ `setTokens()` - Bỏ parameters maxAge, tự động đọc từ JWT
- ✅ `updateAccessToken()` - Bỏ parameter maxAge, tự động đọc từ JWT

### 2. **Không cần sửa:**
- ✅ `userSlice.ts` - Đã gọi `setTokens(access, refresh)` đúng
- ✅ `axiosInstance.ts` - Đã gọi `setTokens()` đúng

---

## ⚙️ Configuration Reference

### **Backend (C#)**
```csharp
// Infrastructure/Configurations/JwtSettings.cs
public class JwtSettings
{
    public int AccessTokenExpireMinutes { get; set; } = 120;  // 2 giờ
    public int RefreshTokenExpireDays { get; set; } = 7;      // 7 ngày
}
```

### **Frontend (TypeScript)**
```typescript
// lib/utils/tokenHelper.ts
const getTokenExpiry = (token: string): number | null => {
  // ✅ Đọc từ JWT token (BE set)
  const payload = JSON.parse(atob(token.split('.')[1]));
  const expiresIn = payload.exp - Math.floor(Date.now() / 1000);
  return expiresIn > 0 ? expiresIn : null;
};

export const setTokens = (accessToken: string, refreshToken: string): void => {
  // ✅ Access token: lấy từ JWT
  const accessTokenMaxAge = getTokenExpiry(accessToken);
  setCookie("access_token", accessToken, {
    maxAge: accessTokenMaxAge || 7200, // Fallback
  });
  
  // ✅ Refresh token: 7 ngày (khớp BE config)
  setCookie("refresh_token", refreshToken, {
    maxAge: 604800, // 7 * 24 * 60 * 60
  });
};
```

---

## 🎯 Best Practices

### ✅ **DO:**
- Luôn đọc expire time từ JWT token
- Có fallback value khi parse lỗi
- Log/debug để verify cookie expire = JWT expire
- Đồng bộ refresh token expire với BE config

### ❌ **DON'T:**
- Hard-code expire time ở FE
- Set cookie expire khác với JWT expire
- Quên update khi BE thay đổi config
- Ignore JWT exp claim

---

## 🚀 Future Improvements

### 1. **Refresh Token cũng dùng JWT:**
```csharp
// Backend có thể tạo refresh token dạng JWT
var refreshTokenJwt = new JwtSecurityToken(
    expires: DateTime.UtcNow.AddDays(7),
    // ... claims
);

// FE có thể đọc expire của refresh token
const refreshExpiry = getTokenExpiry(refreshToken);
```

### 2. **Dynamic Cookie Settings từ BE:**
```json
// API response có thể include settings
{
  "access_token": "jwt...",
  "refresh_token": "guid...",
  "cookie_settings": {
    "access_token_max_age": 7200,
    "refresh_token_max_age": 604800,
    "secure": true,
    "same_site": "Strict"
  }
}
```

### 3. **Token Refresh trước khi hết hạn:**
```typescript
// Auto refresh trước khi hết hạn 5 phút
const shouldRefresh = (token: string): boolean => {
  const info = getTokenExpiryInfo(token);
  return info.expiresInSeconds !== null && 
         info.expiresInSeconds < 300; // < 5 phút
};
```

---

## 📖 Summary

### **Trước:**
```typescript
// ❌ FE tự set, có thể không khớp BE
setTokens(token, refresh, 7200, 604800);
```

### **Sau:**
```typescript
// ✅ FE đọc từ JWT, luôn khớp BE
setTokens(token, refresh); // Auto-detect expire time
```

**Kết quả:**
- ✅ Single source of truth (BE)
- ✅ Tự động đồng bộ
- ✅ Cookie expire = JWT expire
- ✅ Dễ maintain và debug
