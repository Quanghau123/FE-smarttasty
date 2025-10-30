# 🤖 Chatbot Component - SmartTasty

## 📋 Mô tả

Component Chatbot UI cho phép người dùng tương tác với trợ lý ảo SmartTasty thông qua:
- ✅ Gửi tin nhắn văn bản
- ✅ Gửi hình ảnh
- ✅ Nhận phản hồi tự động từ AI
- ✅ Giao diện floating chat button
- ✅ Real-time conversation history

## 🏗️ Cấu trúc

```
src/components/features/Chatbot/
├── index.tsx              # Main chatbot component
└── README.md             # Documentation (file này)
```

## 🔧 Cài đặt

### 1. Environment Variables

Thêm vào `.env.local`:

```bash
# Chatbot API URL
NEXT_PUBLIC_CHATBOT_API_URL=https://chatbot.smart-tasty.io.vn

# Hoặc local development:
# NEXT_PUBLIC_CHATBOT_API_URL=http://localhost:5003
```

### 2. Backend Requirements

**Chatbot Service phải có:**
- ✅ Endpoint: `POST /api/Chat/send-form`
- ✅ Content-Type: `multipart/form-data`
- ✅ CORS cho phép origin từ FE

**Request Format:**
```typescript
FormData {
  AccessToken: string,  // JWT token từ FE
  Text: string,         // Tin nhắn user
  Image?: File          // Hình ảnh (optional)
}
```

**Response Format:**
```json
{
  "user": "User message text",
  "bot": "Bot response text"
}
```

## 📦 Dependencies

```json
{
  "@mui/material": "^5.x",
  "@mui/icons-material": "^5.x",
  "axios": "^1.x"
}
```

## 🚀 Sử dụng

### Cách 1: Thêm vào Layout (Hiển thị global)

```tsx
// app/LayoutClient.tsx
import Chatbot from "@/components/features/Chatbot";

export default function LayoutClient({ children }) {
  return (
    <Providers>
      {children}
      <Chatbot /> {/* Hiển thị ở mọi trang */}
    </Providers>
  );
}
```

### Cách 2: Thêm vào trang cụ thể

```tsx
// app/[locale]/page.tsx
import Chatbot from "@/components/features/Chatbot";

export default function HomePage() {
  return (
    <>
      <YourContent />
      <Chatbot />
    </>
  );
}
```

## 🎨 Giao diện

### Floating Button
- 📍 Vị trí: Bottom-right corner
- 🎨 Màu: Primary color (có thể thay đổi trong theme)
- 📏 Kích thước: 56x56px (Material-UI Fab default)
- 🎭 Animation: Fade in/out khi mở/đóng

### Chat Window
- 📐 Kích thước: 380x600px
- 📍 Vị trí: Above floating button
- 🎨 Theme: Theo Material-UI theme của app
- 📱 Responsive: Fixed size (có thể customize)

### Message Bubbles
- 👤 User messages: Primary color, right-aligned
- 🤖 Bot messages: White background, left-aligned
- 🖼️ Image preview: Inline trong message
- ⏰ Timestamp: Below each message

## 🔒 Authentication

Chatbot **yêu cầu user phải đăng nhập**:

```typescript
const accessToken = getAccessToken();
if (!accessToken) {
  alert("Vui lòng đăng nhập để sử dụng chatbot");
  return;
}
```

Nếu user chưa login → hiển thị alert yêu cầu đăng nhập.

## 📸 Tính năng gửi hình ảnh

### Upload Flow:
1. User click icon 📷
2. Chọn file image (jpg, png, gif, etc.)
3. Preview hiển thị trước khi gửi
4. Gửi kèm theo text message (hoặc chỉ image)

### File Types:
```typescript
accept="image/*"  // Chấp nhận mọi loại image
```

### Preview:
- Thumbnail 60x60px
- Hiển thị filename
- Button xóa (X) để hủy

## 🔄 Message Flow

```
1. User nhập text/chọn image
   ↓
2. Click Send hoặc Enter
   ↓
3. Add user message to UI (immediate)
   ↓
4. Clear input fields
   ↓
5. Show loading indicator
   ↓
6. Call API với FormData
   ↓
7. Receive bot response
   ↓
8. Add bot message to UI
   ↓
9. Auto scroll to bottom
```

## ⚙️ Customization

### Thay đổi màu sắc

```tsx
<Fab
  color="secondary"  // Thay vì "primary"
  // hoặc
  sx={{ bgcolor: '#FF5722' }}
/>
```

### Thay đổi kích thước chat window

```tsx
<Paper
  sx={{
    width: 400,    // Thay vì 380
    height: 700,   // Thay vì 600
  }}
/>
```

### Thay đổi vị trí floating button

```tsx
<Fab
  sx={{
    bottom: 16,   // Thay vì 24
    right: 16,    // Hoặc left: 16 (bên trái)
  }}
/>
```

### Custom welcome message

```tsx
const [messages, setMessages] = useState<Message[]>([
  {
    id: "welcome",
    text: "Your custom welcome message here!",
    sender: "bot",
    timestamp: new Date(),
  },
]);
```

## 🐛 Troubleshooting

### 1. Chatbot không hiển thị
**Kiểm tra:**
- ✅ Component đã được import trong Layout/Page?
- ✅ z-index có bị conflict với element khác?

### 2. API call lỗi 401 Unauthorized
**Nguyên nhân:**
- ❌ User chưa đăng nhập
- ❌ Access token hết hạn

**Giải pháp:**
```typescript
// Refresh token trước khi gọi chatbot API
const accessToken = getAccessToken();
if (!accessToken) {
  // Redirect to login or show alert
}
```

### 3. API call lỗi CORS
**Backend cần:**
```csharp
// Program.cs
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
```

### 4. Image upload không hoạt động
**Kiểm tra:**
- ✅ Backend có hỗ trợ `multipart/form-data`?
- ✅ File size có vượt quá giới hạn?
- ✅ Content-Type header đúng?

### 5. Scroll không tự động xuống dưới
**Solution:**
```typescript
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);
```

## 📝 API Contract

### Request
```http
POST /api/Chat/send-form
Content-Type: multipart/form-data

FormData:
  - AccessToken: "Bearer eyJ..."
  - Text: "Hello bot"
  - Image: [binary file data]
```

### Response (Success)
```json
{
  "user": "Hello bot",
  "bot": "Xin chào! Tôi có thể giúp gì cho bạn?"
}
```

### Response (Error)
```json
{
  "error": "Invalid or expired token"
}
```

## 🚦 Testing

### Manual Testing Checklist:
- [ ] Floating button hiển thị đúng vị trí
- [ ] Click button → Chat window mở/đóng
- [ ] Gửi text message → Nhận response
- [ ] Gửi image → Preview hiển thị
- [ ] Gửi text + image → Cả 2 đều gửi
- [ ] Enter key → Gửi message
- [ ] Shift+Enter → Xuống dòng (không gửi)
- [ ] Loading indicator hiển thị khi chờ response
- [ ] Auto scroll khi có message mới
- [ ] Timestamp hiển thị đúng format
- [ ] Xóa image preview hoạt động
- [ ] Error handling khi API fail
- [ ] Alert khi user chưa login

## 🎯 Future Enhancements

Các tính năng có thể thêm:
- 🔊 Text-to-speech cho bot response
- 🎤 Voice input từ user
- 📎 Gửi file (PDF, doc, etc.)
- 💾 Lưu conversation history
- 🌐 Multi-language support
- 🎨 Theme switcher (light/dark mode)
- 📊 Bot typing indicator
- ✅ Message read receipts
- 🔔 Desktop notifications
- 📱 Mobile responsive improvements
- 🤝 Transfer to human agent

## 📚 Tài liệu tham khảo

- [Material-UI Fab](https://mui.com/material-ui/react-floating-action-button/)
- [Material-UI Paper](https://mui.com/material-ui/react-paper/)
- [Axios FormData](https://axios-http.com/docs/multipart)
- [React useRef](https://react.dev/reference/react/useRef)

## 👥 Contributors

- Chatbot UI Component - SmartTasty Team
- Backend Integration - N8N Webhook Service

## 📄 License

Internal project - SmartTasty Platform
