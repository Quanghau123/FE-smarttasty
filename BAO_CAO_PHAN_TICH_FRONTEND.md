# BÁO CÁO PHÂN TÍCH HỆ THỐNG FRONTEND - SMARTTASTY

**Ngày tạo:** 03/12/2025  
**Dự án:** SmartTasty - Nền tảng đặt món và quản lý nhà hàng  
**Repository:** FE-smarttasty  
**Branch:** main

---

## 📋 MỤC LỤC

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Công nghệ sử dụng](#2-công-nghệ-sử-dụng)
3. [Kiến trúc hệ thống](#3-kiến-trúc-hệ-thống)
4. [Chức năng theo vai trò người dùng](#4-chức-năng-theo-vai-trò-người-dùng)
5. [Các tính năng kỹ thuật nổi bật](#5-các-tính-năng-kỹ-thuật-nổi-bật)
6. [Quản lý State và Data Flow](#6-quản-lý-state-và-data-flow)
7. [Bảo mật và Xác thực](#7-bảo-mật-và-xác-thực)
8. [Tích hợp API và Real-time](#8-tích-hợp-api-và-real-time)
9. [UI/UX và Responsive Design](#9-uiux-và-responsive-design)
10. [Kết luận](#10-kết-luận)

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1. Giới thiệu
**SmartTasty** là một nền tảng web toàn diện cho phép:
- **Khách hàng**: Đặt món ăn online, tìm kiếm nhà hàng, đặt bàn, thanh toán
- **Chủ nhà hàng (Business)**: Quản lý menu, đơn hàng, khuyến mãi, nhân viên
- **Nhân viên (Staff)**: Xử lý đơn hàng, cập nhật trạng thái giao hàng
- **Quản trị viên (Admin)**: Quản lý toàn bộ hệ thống, người dùng, nhà hàng

### 1.2. Đặc điểm chính
- ✅ **Multi-role system**: 4 vai trò người dùng với quyền hạn riêng biệt
- ✅ **Real-time updates**: Cập nhật đơn hàng, thông báo tức thời qua SignalR
- ✅ **Multi-language**: Hỗ trợ tiếng Việt và tiếng Anh
- ✅ **Responsive**: Tương thích với mọi thiết bị
- ✅ **AI Chatbot**: Hỗ trợ khách hàng tự động
- ✅ **Payment Integration**: Tích hợp VNPay và COD

---

## 2. CÔNG NGHỆ SỬ DỤNG

### 2.1. Core Framework
| Công nghệ | Version | Vai trò |
|-----------|---------|---------|
| **Next.js** | 15.3.5 | Framework React với SSR/SSG |
| **React** | 19.1.0 | Library xây dựng UI |
| **TypeScript** | 5.x | Type safety và developer experience |

### 2.2. State Management & Data Fetching
| Công nghệ | Vai trò |
|-----------|---------|
| **Redux Toolkit** | Quản lý global state |
| **React Query (TanStack Query)** | Server state management, caching |
| **Redux Persist** | Lưu trữ state vào localStorage |

### 2.3. UI Libraries
| Library | Mục đích |
|---------|----------|
| **Material-UI (MUI)** v7.3.2 | Component library chính |
| **Ant Design** v5.26.5 | Components bổ sung (Icons, Table, Form) |
| **Tailwind CSS** v3.4.17 | Utility-first CSS |
| **Framer Motion** | Animation và transitions |
| **React Icons** | Icon library |

### 2.4. Form & Validation
- **React Hook Form** v7.61.1: Form state management
- **Yup** v1.6.1: Schema validation
- **Zod** v3.25.67: Alternative validation
- **@hookform/resolvers**: Integration giữa form và validation

### 2.5. Charts & Visualization
- **ApexCharts** + **react-apexcharts**: Biểu đồ interactive
- **Chart.js** + **react-chartjs-2**: Biểu đồ đơn giản
- **Recharts**: Alternative charting library

### 2.6. Internationalization
- **next-intl** v4.3.0: Multi-language support
  - Hỗ trợ: Tiếng Việt (vi), English (en)
  - Default: Tiếng Việt

### 2.7. Real-time Communication
- **@microsoft/signalr** v9.0.6: WebSocket connection với backend
  - Nhận thông báo real-time
  - Cập nhật đơn hàng tức thời
  - Rating updates cho nhà hàng

### 2.8. HTTP Client & API
- **Axios** v1.10.0: HTTP requests với interceptors
  - Auto refresh token
  - Request/Response interceptors
  - Error handling

### 2.9. Authentication & Authorization
- **next-auth** v4.24.11: Authentication framework
- **jwt-decode** v4.0.0: Decode JWT tokens
- Custom token helper utilities

### 2.10. Notification & Toast
- **react-toastify** v11.0.5: Toast notifications
- **notistack** v3.0.2: Alternative snackbar system

### 2.11. Maps & Geolocation
- **Leaflet** v1.9.4: Interactive maps
- **react-leaflet** v5.0.0: React wrapper cho Leaflet
- Tính năng "Nearby Restaurants" dựa trên vị trí

### 2.12. Utilities
| Library | Mục đích |
|---------|----------|
| **dayjs** | Date manipulation |
| **moment** | Alternative date library |
| **numeral** | Number formatting |
| **lodash.debounce** | Performance optimization |
| **react-modal** | Modal dialogs |

### 2.13. Development Tools
- **ESLint**: Code linting
- **Prettier** (implied): Code formatting
- **Vitest**: Unit testing
- **@testing-library**: React component testing

---

## 3. KIẾN TRÚC HỆ THỐNG

### 3.1. Cấu trúc thư mục

```
FE-smarttasty/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── [locale]/            # Internationalized routes
│   │   ├── globals.css          # Global styles
│   │   └── LayoutClient.tsx     # Client-side layout wrapper
│   │
│   ├── components/
│   │   ├── commons/             # Shared components
│   │   │   └── Providers/       # Redux, React Query providers
│   │   ├── features/            # Feature-specific components
│   │   │   ├── Admin/           # Admin dashboard & management
│   │   │   ├── AdminRestaurant/ # Restaurant owner features
│   │   │   ├── Staff/           # Staff features
│   │   │   ├── Chatbot/         # AI Chatbot
│   │   │   ├── Login/           # Authentication
│   │   │   ├── Register/        # User registration
│   │   │   └── ...
│   │   └── layouts/             # Layout components
│   │       ├── Cart/            # Shopping cart
│   │       ├── Payment/         # Payment flow
│   │       ├── Purchase/        # Order history
│   │       └── ...
│   │
│   ├── screens/                 # Page-level components
│   │   ├── Home/               # Homepage
│   │   ├── Admin/              # Admin pages
│   │   ├── AdminRestaurant/    # Restaurant management pages
│   │   ├── Staff/              # Staff pages
│   │   └── ...
│   │
│   ├── redux/                   # State management
│   │   ├── store.ts            # Redux store configuration
│   │   ├── hook.ts             # Typed hooks
│   │   └── slices/             # Redux slices
│   │       ├── userSlice.ts
│   │       ├── dishSlice.ts
│   │       ├── orderSlice.ts
│   │       ├── paymentSlice.ts
│   │       └── ...
│   │
│   ├── lib/                     # Utilities & configurations
│   │   ├── axios/              # Axios instance & interceptors
│   │   ├── signalr/            # SignalR service
│   │   ├── mui/                # MUI theme configuration
│   │   ├── reactQuery/         # React Query setup
│   │   └── utils/              # Helper functions
│   │
│   ├── i18n/                    # Internationalization
│   │   ├── routing.ts          # Route configuration
│   │   ├── request.ts          # Server-side i18n
│   │   └── navigation.ts       # Client-side navigation
│   │
│   ├── middleware/              # Next.js middleware
│   │   └── auth.ts             # Authentication middleware
│   │
│   ├── Model/                   # TypeScript types/interfaces
│   │   ├── DishModel/
│   │   └── UserModel/
│   │
│   ├── types/                   # Additional type definitions
│   │
│   ├── constants/               # Application constants
│   │   └── config/             # Configuration files
│   │
│   └── middleware.ts            # Next.js middleware entry
│
├── messages/                    # Translation files
│   ├── vi.json                 # Vietnamese
│   └── en.json                 # English
│
├── public/                      # Static assets
│
├── docker-compose.yml          # Docker configuration
├── Dockerfile                  # Container setup
├── next.config.ts              # Next.js configuration
├── tailwind.config.js          # Tailwind CSS config
└── package.json                # Dependencies
```

### 3.2. Routing Architecture

#### 3.2.1. Internationalized Routing
- **Pattern**: `/[locale]/[page]`
- **Supported locales**: `vi` (default), `en`
- **Example**: `/vi/login`, `/en/restaurant/123`

#### 3.2.2. Role-based Routes
```typescript
/[locale]/                      # Public pages (Home, Restaurant details)
/[locale]/login                 # Authentication
/[locale]/register              # User registration
/[locale]/register-business     # Business registration
/[locale]/admin/*               # Admin dashboard (role: admin)
/[locale]/admin-restaurant/*    # Restaurant management (role: business)
/[locale]/staff/*               # Staff management (role: staff)
/[locale]/cart                  # Shopping cart
/[locale]/payment               # Checkout
/[locale]/purchase              # Order history
```

### 3.3. Component Architecture

#### 3.3.1. Component Hierarchy
```
LayoutClient (Root)
├── Providers (Redux, React Query, MUI Theme)
│   ├── Page Components (screens/)
│   │   ├── Feature Components (components/features/)
│   │   └── Layout Components (components/layouts/)
│   └── Chatbot (floating)
└── ToastContainer (notifications)
```

#### 3.3.2. Design Patterns
- **Container/Presenter Pattern**: Logic tách biệt khỏi UI
- **Compound Components**: Complex components chia thành sub-components
- **Custom Hooks**: Tái sử dụng logic (useAppDispatch, useAppSelector)
- **HOC Pattern**: Providers wrap application

---

## 4. CHỨC NĂNG THEO VAI TRÒ NGƯỜI DÙNG

### 4.1. 👤 USER (Khách hàng)

#### 4.1.1. Authentication & Account
| Chức năng | Mô tả | File chính |
|-----------|-------|------------|
| **Đăng ký** | Form validation với email, password, phone | `src/components/features/Register/` |
| **Đăng nhập** | JWT-based authentication | `src/components/features/Login/` |
| **Quên mật khẩu** | Reset password qua email | `src/components/features/ForgotPassword/` |
| **Đổi mật khẩu** | Change password (authenticated) | `src/components/features/ChangePassword/` |
| **Quản lý tài khoản** | Profile management | `src/screens/Account/` |

#### 4.1.2. Restaurant Discovery
| Chức năng | Mô tả | Implementation |
|-----------|-------|----------------|
| **Trang chủ** | Hiển thị nhà hàng nổi bật, categories | `src/screens/Home/` |
| **Tìm kiếm** | Search by name, location, cuisine | `src/screens/SearchResults/` |
| **Nearby Restaurants** | Tìm nhà hàng gần (Leaflet maps) | `src/screens/NearbyRestaurant/` |
| **Chi tiết nhà hàng** | Menu, reviews, ratings, info | `src/screens/RestaurantDetails/` |

#### 4.1.3. Shopping & Ordering
| Chức năng | Mô tả | Redux Slice |
|-----------|-------|-------------|
| **Giỏ hàng** | Add/remove items, quantity management | `orderSlice` |
| **Áp dụng khuyến mãi** | Dish-level & order-level promotions | `dishPromotionSlice`, `orderPromotionsSlice` |
| **Chọn địa chỉ giao hàng** | Address autocomplete, edit | Built-in Payment flow |
| **Chọn delivery option** | Priority/Fast/Economy | Payment component |
| **Voucher codes** | Apply discount codes | `orderPromotionsSlice` |

#### 4.1.4. Payment & Checkout
| Phương thức | Mô tả | Implementation |
|-------------|-------|----------------|
| **VNPay** | Online payment, redirect to VNPay | `paymentSlice.createVNPayPayment()` |
| **COD** | Cash on delivery | `paymentSlice.createCODPayment()` |
| **Return handling** | VNPay callback processing | `src/screens/Vnpay-return/` |

**Flow thanh toán:**
1. User chọn items → Cart
2. Review order → Click "Thanh toán"
3. Chọn địa chỉ + delivery option + payment method
4. Apply promotions/vouchers (optional)
5. Confirm → Redirect to VNPay hoặc Create COD order
6. Return → Update order status

#### 4.1.5. Order Management
| Chức năng | Mô tả | File |
|-----------|-------|------|
| **Lịch sử đơn hàng** | View all payments & orders | `src/components/layouts/Purchase/` |
| **Chi tiết đơn hàng** | Order items, status, tracking | Purchase component |
| **Hủy đơn** | Cancel pending orders | `orderSlice.deleteOrder()` |
| **Tracking** | Real-time delivery status | SignalR notifications |

#### 4.1.6. Reservation
| Chức năng | Mô tả | Redux Slice |
|-----------|-------|-------------|
| **Đặt bàn** | Book table at restaurant | `reservationSlice` |
| **Xem lịch đặt** | View reservation history | Reservation component |
| **Hủy đặt bàn** | Cancel reservation | `reservationSlice` |

#### 4.1.7. Reviews & Ratings
| Chức năng | Mô tả | Redux Slice |
|-----------|-------|-------------|
| **Đánh giá nhà hàng** | Star rating + text review | `reviewSlice` |
| **Đánh giá món ăn** | Dish-specific reviews | `reviewSlice` |
| **Xem reviews** | Read other customers' reviews | Restaurant details page |

#### 4.1.8. Favorites & Vouchers
| Chức năng | Mô tả | Redux Slice |
|-----------|-------|-------------|
| **Yêu thích** | Save favorite restaurants | `favoritesSlice` |
| **Vouchers** | View available vouchers | `vouchersSlice` |

#### 4.1.9. Recipes
| Chức năng | Mô tả | Redux Slice |
|-----------|-------|-------------|
| **Xem công thức** | Browse cooking recipes | `recipesSlice` |
| **Đánh giá recipes** | Rate & review recipes | `recipeReviewsSlice` |

#### 4.1.10. AI Chatbot
| Chức năng | Mô tả | File |
|-----------|-------|------|
| **Chat support** | AI-powered customer support | `src/components/features/Chatbot/` |
| **Image upload** | Send images to chatbot | Chatbot component |
| **Auto-hide** | Hide on login/register/admin pages | `LayoutClient.tsx` |

---

### 4.2. 🏢 BUSINESS (Chủ nhà hàng)

#### 4.2.1. Dashboard & Analytics
| Chức năng | Mô tả | Charts |
|-----------|-------|--------|
| **Dashboard** | Revenue, orders, KPIs | ApexCharts, Chart.js |
| **Doanh thu theo tháng** | Monthly revenue chart | Line/Bar chart |
| **Số món theo category** | Dish distribution | Pie chart |
| **Top dishes** | Best-selling items | Bar chart |
| **Filter by date** | Month/Year selection | Date picker |

**KPIs hiển thị:**
- Tổng đơn đã thanh toán
- Doanh thu tháng hiện tại
- Số lượng khuyến mãi active
- Số món ăn theo danh mục

**File:** `src/components/features/AdminRestaurant/Dashboard/`

#### 4.2.2. Restaurant Management
| Chức năng | Mô tả | File |
|-----------|-------|------|
| **Tạo nhà hàng** | Setup new restaurant | `src/components/features/AdminRestaurant/CreateRestaurant/` |
| **Cập nhật thông tin** | Edit name, address, hours, images | `src/components/features/AdminRestaurant/Restaurant/` |
| **Upload images** | Multiple image upload (Cloudinary) | Restaurant component |
| **Địa chỉ thông minh** | AddressAutocomplete component | CreateRestaurant |

#### 4.2.3. Menu Management (Products)
| Chức năng | Mô tả | Implementation |
|-----------|-------|----------------|
| **Thêm món** | Create new dish with image, price, category | `dishSlice.createDish()` |
| **Sửa món** | Update dish info | `dishSlice.updateDish()` |
| **Xóa món** | Delete dish | `dishSlice.deleteDish()` |
| **Bật/tắt hiển thị** | Toggle dish visibility | Update dish status |
| **Chọn category** | Assign dish to category | Dropdown selection |
| **Upload ảnh** | Image upload (Cloudinary/local) | FormData |
| **Tìm kiếm** | Search dishes by name | Search input |
| **Phân trang** | Pagination for dish list | MUI Pagination |

**Dish Promotions:**
- Tự động hiển thị giá tốt nhất khi có promotion
- Gán nhiều promotions cho 1 dish
- Tính toán giá sau khuyến mãi

**File:** `src/components/features/AdminRestaurant/Products/`

#### 4.2.4. Promotion Management
| Chức năng | Mô tả | Redux Slice |
|-----------|-------|-------------|
| **Tạo promotion** | Create new promotion | `promotionSlice` |
| **Upload ảnh** | Promotion banner | Image upload |
| **Chọn target** | Dish-level or Order-level | Dropdown |
| **Dish promotions** | Discount for specific dishes | `dishPromotionSlice` |
| **Order promotions** | Discount for entire order | `orderPromotionsSlice` |
| **Voucher code** | Generate/assign voucher codes | Promotion form |
| **Min order value** | Minimum order for promotion | Order promotion field |
| **Active/Inactive** | Toggle promotion status | Update promotion |
| **Xóa promotion** | Delete promotion | `promotionSlice.deletePromotion()` |

**Types of Promotions:**
1. **Dish Promotion**: Giảm giá món cụ thể (%, fixed amount)
2. **Order Promotion**: Giảm giá toàn đơn hàng (%, fixed, free shipping)
3. **Voucher Code**: Mã giảm giá nhập tay

**File:** `src/components/features/AdminRestaurant/Promotion/`

#### 4.2.5. Order Management
| Chức năng | Mô tả | Status Flow |
|-----------|-------|-------------|
| **Xem đơn hàng** | View all restaurant orders | List with filters |
| **Thay đổi payment status** | Pending → Processing → Paid | Status dropdown |
| **Thay đổi delivery status** | Preparing → Delivering → Delivered | Status dropdown |
| **Xác nhận COD** | Confirm cash received | `confirmCOD()` API |
| **Bảo vệ rollback** | Không cho chuyển status lùi | Validation logic |
| **Real-time updates** | SignalR notifications | Auto-refresh |

**Order Status Flow:**
```
Pending → Processing → Paid
```

**Delivery Status Flow:**
```
Preparing → Delivering/Shipping → Delivered
                                 ↘ Failed (optional)
```

**File:** `src/components/features/AdminRestaurant/OrderAll/`

#### 4.2.6. Staff Management
| Chức năng | Mô tả | Redux Slice |
|-----------|-------|-------------|
| **Tạo nhân viên** | Create staff account (role: staff) | `staffSlice` |
| **Cập nhật thông tin** | Edit staff details | `staffSlice.updateStaff()` |
| **Xóa nhân viên** | Delete staff account | `staffSlice.deleteStaff()` |
| **Danh sách nhân viên** | View all staff | `staffSlice.fetchStaff()` |
| **Phân quyền** | Assign staff to restaurant | Staff creation |

**File:** `src/components/features/AdminRestaurant/StaffManagement/`

#### 4.2.7. Table Booking Management
| Chức năng | Mô tả | Status Options |
|-----------|-------|----------------|
| **Xem đặt bàn** | View all reservations | List view |
| **Cập nhật status** | Confirmed → CheckedIn → Completed | Status update |
| **Hủy đặt bàn** | Cancel by restaurant | Cancel button |
| **Thông báo khách** | Notify customer (email/SMS) | Backend integration |

**Reservation Statuses:**
- Pending (chờ xác nhận)
- Confirmed (đã xác nhận)
- CheckedIn (khách đã tới)
- Completed (hoàn thành)
- Cancelled (đã hủy)

**File:** `src/components/features/AdminRestaurant/TableBooking/`

#### 4.2.8. Navigation
| Component | Description |
|-----------|-------------|
| **SideBar** | Navigation menu cho AdminRestaurant | `src/components/features/AdminRestaurant/SideBar/` |

**Menu items:**
- Dashboard
- Quản lý món ăn
- Quản lý khuyến mãi
- Quản lý đơn hàng
- Quản lý nhân viên
- Quản lý đặt bàn
- Thông tin nhà hàng

---

### 4.3. 👔 STAFF (Nhân viên)

#### 4.3.1. Order Processing
| Chức năng | Mô tả | File |
|-----------|-------|------|
| **Chọn nhà hàng** | Select assigned restaurant | Restaurant dropdown |
| **Xem đơn hàng** | View restaurant orders | `src/components/features/Staff/RestaurantOrders/` |
| **Cập nhật delivery status** | Update shipping status | Status dropdown |
| **Xác nhận COD** | Confirm cash collection | COD button |

**Delivery Status Staff có thể cập nhật:**
- Preparing (đang chuẩn bị)
- Delivering/Shipping (đang giao)
- Delivered (đã giao)
- Failed (thất bại)

**Permissions:**
- Chỉ xem được đơn của nhà hàng được assign
- Không thể thay đổi payment status
- Có thể xác nhận COD (nếu có quyền)

**File:** `src/components/features/Staff/RestaurantOrders/`

---

### 4.4. 👨‍💼 ADMIN (Quản trị viên)

#### 4.4.1. Dashboard
| Chức năng | Mô tả | Charts |
|-----------|-------|--------|
| **Tổng quan hệ thống** | Users, Business users, Restaurants count | Number cards |
| **Biểu đồ theo tháng** | User growth, Restaurant growth | Line chart |
| **Thông tin gần nhất** | Latest updates | Activity feed |

**File:** `src/components/features/Admin/Dashboard/`

#### 4.4.2. User Management
| Chức năng | Mô tả | File |
|-----------|-------|------|
| **Danh sách users** | View all users (role: user) | `src/components/features/Admin/User/` |
| **Tìm kiếm** | Search by name, email, phone | Search input |
| **Phân trang** | Pagination | MUI Pagination |
| **Xem thông tin** | View user details | Detail modal |
| **Xóa user** | Delete user account | Delete button |

#### 4.4.3. Business Management
| Chức năng | Mô tả | File |
|-----------|-------|------|
| **Danh sách business** | View all business accounts | `src/components/features/Admin/Business/` |
| **Xem nhà hàng liên kết** | View associated restaurants | Restaurant list |
| **Tìm kiếm** | Search business accounts | Search input |
| **Xóa business** | Delete business account | Delete button |

#### 4.4.4. Navigation
| Component | Description |
|-----------|-------------|
| **SideBar** | Admin navigation menu | `src/components/features/Admin/SideBar/` |

**Menu items:**
- Dashboard
- Quản lý User
- Quản lý Business
- Reports (optional)

---

## 5. CÁC TÍNH NĂNG KỸ THUẬT NỔI BẬT

### 5.1. Real-time Communication với SignalR

#### 5.1.1. Kết nối SignalR
**File:** `src/lib/signalr/signalRService.ts`

**Features:**
- **WebSocket connection** với automatic reconnection
- **Authentication**: JWT token trong connection
- **Heartbeat/Ping**: Periodic ping (30s interval) để keep-alive
- **Connection lifecycle management**

**Kết nối:**
```typescript
await signalRService.connect(accessToken);
```

#### 5.1.2. Events được lắng nghe
| Event | Mô tả | Handler |
|-------|-------|---------|
| `ReceiveNotification` | Thông báo chung cho user | `onNotification()` |
| `ReceiveRestaurantUpdate` | Cập nhật rating nhà hàng | `onRestaurantRatingUpdate()` |

**Notification Buffer:**
- Buffer notifications nếu callback chưa được register
- Limit: 100 notifications
- Auto-replay khi callback được set

#### 5.1.3. Restaurant Rooms
```typescript
// Join restaurant room để nhận updates
await signalRService.joinRestaurantRoom(restaurantId);
```

**Use cases:**
- Real-time rating updates
- New order notifications
- Status changes

#### 5.1.4. Reconnection Strategy
**Exponential backoff:**
- Retry 0: 0s
- Retry 1: 2s
- Retry 2: 10s
- Retry 3+: 30s

**Auto-rejoin:**
- Tự động rejoin restaurant room sau reconnect
- Restart ping heartbeat

---

### 5.2. Authentication & Token Management

#### 5.2.1. JWT Token Flow
**File:** `src/lib/utils/tokenHelper.ts`

**Token Storage:**
- **Access Token**: `localStorage` (client-side)
- **Refresh Token**: `HttpOnly Cookie` (server-managed)

**Token Functions:**
```typescript
getAccessToken()      // Get current token
setAccessToken(token) // Store new token
clearAccessToken()    // Logout
subscribeAccessTokenChange(callback) // Listen to token changes
```

#### 5.2.2. Automatic Token Refresh
**File:** `src/lib/axios/axiosInstance.ts`

**Response Interceptor:**
```typescript
Response 401 Unauthorized
↓
Check if refreshing
↓
Call /api/User/refresh-token (with refresh_token cookie + old access token)
↓
Receive new access_token
↓
Update localStorage & axios headers
↓
Retry failed requests
↓
Process queued requests
```

**Features:**
- **Queue management**: Queue failed requests during refresh
- **Single refresh**: Only one refresh call at a time
- **Automatic retry**: Retry original request with new token
- **Fallback**: Redirect to `/login` if refresh fails

**Token Sync:**
```typescript
// Redux store sync với token changes
subscribeAccessTokenChange((token) => {
  store.dispatch(updateAccessToken(token));
});
```

#### 5.2.3. Protected Routes
**Middleware:** `src/middleware/auth.ts`

**Route Protection:**
- Check JWT token validity
- Decode token để lấy user role
- Redirect nếu unauthorized

---

### 5.3. Internationalization (i18n)

#### 5.3.1. Setup
**Library:** `next-intl` v4.3.0

**Configuration:**
```typescript
// src/i18n/routing.ts
export const routing = defineRouting({
  locales: ["vi", "en"],
  defaultLocale: "vi",
});
```

#### 5.3.2. Translation Files
**Location:** `messages/`
- `vi.json`: Tiếng Việt
- `en.json`: English

**Structure:**
```json
{
  "layout": {
    "cart": {
      "title": "Giỏ hàng",
      "checkout": "Thanh toán"
    },
    "payment": {
      "method": "Phương thức thanh toán"
    }
  },
  "features": {
    "admin": { ... },
    "user": { ... }
  }
}
```

#### 5.3.3. Usage
```typescript
import { useTranslations } from "next-intl";

const t = useTranslations("layout.cart");
<h1>{t("title")}</h1> // → "Giỏ hàng"
```

#### 5.3.4. Route Generation
**Automatic locale prefix:**
- `/vi/cart`
- `/en/cart`

**Link component:**
```typescript
import { Link } from "@/i18n/navigation";
<Link href="/cart">Cart</Link> // Auto-adds locale
```

---

### 5.4. Form Management với React Hook Form

#### 5.4.1. Setup
**Libraries:**
- `react-hook-form` v7.61.1
- `@hookform/resolvers` v5.1.1
- `yup` v1.6.1 hoặc `zod` v3.25.67

#### 5.4.2. Pattern
```typescript
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const schema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().min(6).required(),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: yupResolver(schema),
});
```

#### 5.4.3. Use Cases
- **Login/Register forms**: Email, password validation
- **Dish creation**: Name, price, category validation
- **Address form**: Required fields, format validation
- **Review form**: Star rating, text validation

---

### 5.5. Image Upload & Management

#### 5.5.1. Cloudinary Integration
**Configuration:** `next.config.ts`

```typescript
images: {
  remotePatterns: [
    {
      protocol: "https",
      hostname: "res.cloudinary.com",
      pathname: "/**",
    }
  ]
}
```

#### 5.5.2. Upload Process
**File uploads:**
- **FormData**: Multi-part form data
- **Client → API → Cloudinary**: Server-side upload
- **Return URL**: Store image URL in database

**Components sử dụng:**
- Restaurant creation/edit
- Dish creation/edit
- Promotion banners
- User avatar
- Chatbot image messages

---

### 5.6. Map Integration với Leaflet

#### 5.6.1. Libraries
- **leaflet** v1.9.4
- **react-leaflet** v5.0.0

#### 5.6.2. Features
- **Nearby restaurants**: Hiển thị nhà hàng trên bản đồ
- **Geolocation**: Lấy vị trí hiện tại của user
- **Markers**: Pin nhà hàng với popup thông tin
- **Interactive**: Click marker → View restaurant details

**File:** `src/screens/NearbyRestaurant/`

---

### 5.7. Charts & Analytics

#### 5.7.1. ApexCharts
**Use cases:**
- Revenue chart (line/area)
- Orders chart (bar)
- Category distribution (pie/donut)

**Features:**
- Interactive tooltips
- Zoom & pan
- Responsive
- Export chart as image

#### 5.7.2. Chart.js
**Use cases:**
- Simple bar charts
- Line charts
- Doughnut charts

**Integration:** `react-chartjs-2`

#### 5.7.3. Recharts
**Alternative charting library**
- Composable components
- React-friendly API

---

### 5.8. Responsive Design

#### 5.8.1. Breakpoints (MUI)
```typescript
xs: 0px     // Mobile
sm: 600px   // Small tablet
md: 900px   // Tablet
lg: 1200px  // Desktop
xl: 1536px  // Large desktop
```

#### 5.8.2. Techniques
- **MUI Grid System**: `Grid` component
- **Tailwind Utilities**: Responsive classes
- **Media queries**: Custom breakpoints
- **Flexbox/Grid**: Layout systems

#### 5.8.3. Mobile-first Approach
- Design for mobile first
- Progressive enhancement for larger screens
- Touch-friendly UI elements

---

## 6. QUẢN LÝ STATE VÀ DATA FLOW

### 6.1. Redux Toolkit Slices

#### 6.1.1. Core Slices
| Slice | Mô tả | File |
|-------|-------|------|
| **userSlice** | User info, authentication | `redux/slices/userSlice.ts` |
| **dishSlice** | Dish management (CRUD) | `redux/slices/dishSlide.ts` |
| **restaurantSlice** | Restaurant data | `redux/slices/restaurantSlice.ts` |
| **orderSlice** | Orders, cart management | `redux/slices/orderSlice.ts` |
| **paymentSlice** | Payment processing | `redux/slices/paymentSlice.ts` |

#### 6.1.2. Feature Slices
| Slice | Mô tả | File |
|-------|-------|------|
| **promotionSlice** | Promotions management | `redux/slices/promotionSlice.ts` |
| **dishPromotionSlice** | Dish-level promotions | `redux/slices/dishPromotionSlice.ts` |
| **orderPromotionsSlice** | Order-level promotions | `redux/slices/orderPromotionsSlice.ts` |
| **staffSlice** | Staff management | `redux/slices/staffSlice.ts` |
| **reservationSlice** | Table reservations | `redux/slices/reservationSlice.ts` |
| **reviewSlice** | Reviews & ratings | `redux/slices/reviewSlice.ts` |

#### 6.1.3. Additional Slices
| Slice | Mô tả | File |
|-------|-------|------|
| **favoritesSlice** | Favorite restaurants | `redux/slices/favoritesSlice.ts` |
| **vouchersSlice** | User vouchers | `redux/slices/vouchersSlice.ts` |
| **recipesSlice** | Cooking recipes | `redux/slices/recipesSlice.ts` |
| **recipeReviewsSlice** | Recipe reviews | `redux/slices/recipeReviewsSlice.ts` |
| **themeSlice** | UI theme (dark/light) | `redux/slices/useThemeSlice.ts` |

### 6.2. Async Thunks Pattern

#### 6.2.1. Structure
```typescript
export const fetchDishes = createAsyncThunk(
  "dishes/fetchDishes",
  async (restaurantId: number, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/api/Dish/${restaurantId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);
```

#### 6.2.2. Lifecycle States
- **pending**: Loading state
- **fulfilled**: Success state
- **rejected**: Error state

#### 6.2.3. Example Flow
```
User clicks "Thêm món"
↓
Dispatch: createDish(dishData)
↓
State: loading = true
↓
API call: POST /api/Dish
↓
Success: Add dish to state, loading = false
↓
UI updates: Show success toast
```

---

## 7. BẢO MẬT VÀ XÁC THỰC

### 7.1. Authentication Flow

#### 7.1.1. Login Flow
```
User submits credentials
↓
POST /api/User/login
↓
Server validates credentials
↓
Return: { access_token, user_info }
Set: refresh_token (HttpOnly cookie)
↓
Store access_token in localStorage
↓
Dispatch: setUser(user_info)
↓
Redirect based on role:
  - admin → /admin
  - business → /admin-restaurant
  - staff → /staff
  - user → /
```

#### 7.1.2. Registration Flow
```
User fills registration form
↓
Validation: Yup schema
↓
POST /api/User/register
↓
Server creates user
↓
Return: success message
↓
Redirect to /login
```

### 7.2. Authorization

#### 7.2.1. Role-based Access Control (RBAC)
**Roles:**
- `admin`: Full system access
- `business`: Restaurant management
- `staff`: Order processing
- `user`: Customer features

#### 7.2.2. Route Protection
**Middleware:** `src/middleware/auth.ts`

**Check flow:**
```typescript
Request to protected route
↓
Middleware checks token
↓
Decode JWT → Extract role
↓
Check if role matches required role
↓
Allow/Deny access
```

#### 7.2.3. Component-level Protection
```typescript
const userRole = useAppSelector((state) => state.user.role);

if (userRole !== "admin") {
  return <AccessDenied />;
}
```

### 7.3. Security Best Practices

#### 7.3.1. Token Storage
- ✅ **Access token**: `localStorage` (short-lived, 15-30 min)
- ✅ **Refresh token**: `HttpOnly cookie` (long-lived, secure)
- ❌ **Never**: Store refresh token in localStorage

#### 7.3.2. HTTPS & Secure Cookies
- Production: HTTPS only
- Cookies: `Secure`, `HttpOnly`, `SameSite=Strict`

#### 7.3.3. XSS Protection
- Input sanitization
- Output encoding
- Content Security Policy (CSP)

#### 7.3.4. CSRF Protection
- SameSite cookies
- CSRF tokens (if needed)

---

## 8. TÍCH HỢP API VÀ REAL-TIME

### 8.1. API Architecture

#### 8.1.1. Base Configuration
```typescript
// axiosInstance.ts
baseURL: process.env.NEXT_PUBLIC_API_BASE_URL
timeout: 60000
withCredentials: true // Send cookies
```

#### 8.1.2. Request Interceptor
**Tự động thêm:**
- Authorization header: `Bearer {access_token}`
- Content-Type: `application/json` (except FormData)

#### 8.1.3. Response Interceptor
**Error handling:**
- 401 → Auto refresh token
- Other errors → Reject with error message

### 8.2. API Endpoints (Examples)

#### 8.2.1. Authentication
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/User/login` | Login |
| POST | `/api/User/register` | Register |
| POST | `/api/User/refresh-token` | Refresh token |
| POST | `/api/User/logout` | Logout |
| POST | `/api/User/forgot-password` | Password reset |

#### 8.2.2. Dishes
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/Dish/{restaurantId}` | Get dishes |
| POST | `/api/Dish` | Create dish |
| PUT | `/api/Dish/{id}` | Update dish |
| DELETE | `/api/Dish/{id}` | Delete dish |

#### 8.2.3. Orders
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/Order/user` | Get user orders |
| GET | `/api/Order/restaurant/{id}` | Get restaurant orders |
| POST | `/api/Order` | Create order |
| PUT | `/api/Order/{id}` | Update order status |
| DELETE | `/api/Order/{id}` | Cancel order |

#### 8.2.4. Payments
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/Payment/vnpay` | Create VNPay payment |
| POST | `/api/Payment/cod` | Create COD payment |
| GET | `/api/Payment/return` | VNPay callback |
| POST | `/api/Payment/confirm-cod` | Confirm COD |

### 8.3. Real-time Communication

#### 8.3.1. SignalR Hub
**Hub URL:**
```
process.env.NEXT_PUBLIC_SOCKET_URL
Default: http://localhost:5003/hubs/notification
```

#### 8.3.2. Connection Management
```typescript
// Connect on user login
useEffect(() => {
  if (accessToken) {
    signalRService.connect(accessToken);
  }
}, [accessToken]);

// Disconnect on logout
useEffect(() => {
  return () => {
    signalRService.disconnect();
  };
}, []);
```

#### 8.3.3. Event Handlers
```typescript
// Listen for notifications
signalRService.onNotification((title, message) => {
  toast.info(`${title}: ${message}`);
});

// Listen for restaurant updates
signalRService.onRestaurantRatingUpdate((data) => {
  // Update restaurant rating in UI
  dispatch(updateRestaurantRating(data));
});
```

### 8.4. Chatbot API

#### 8.4.1. Endpoint
```
POST {NEXT_PUBLIC_API_BASE_URL}/api/Chat/message
```

#### 8.4.2. Request
```typescript
{
  text: string,       // User message
  image?: File        // Optional image
}
```

#### 8.4.3. Response
```typescript
{
  response: string,   // Bot reply
  timestamp: Date
}
```

**File:** `src/components/features/Chatbot/index.tsx`

---

## 9. UI/UX VÀ RESPONSIVE DESIGN

### 9.1. Design System

#### 9.1.1. Material-UI Theme
**File:** `src/lib/mui/theme.ts` (if exists)

**Customization:**
- Primary color
- Secondary color
- Typography
- Spacing
- Breakpoints

#### 9.1.2. Tailwind CSS
**Config:** `tailwind.config.js`

**Custom utilities:**
- Custom colors
- Custom spacing
- Custom fonts
- Custom animations

### 9.2. Component Library Strategy

#### 9.2.1. Primary: Material-UI
**Use for:**
- Forms (TextField, Select, Checkbox)
- Layouts (Grid, Container, Box)
- Feedback (Snackbar, Dialog, Tooltip)
- Navigation (Drawer, Tabs, Breadcrumbs)
- Data display (Table, Card, Chip)

#### 9.2.2. Secondary: Ant Design
**Use for:**
- Icons (@ant-design/icons)
- Advanced tables
- Date pickers
- Upload components

#### 9.2.3. Custom Components
**Common components:**
- AddressAutocomplete
- RobotIcon (Chatbot)
- SlideHeader
- Menu
- Body

### 9.3. Animation & Transitions

#### 9.3.1. Framer Motion
**Use cases:**
- Page transitions
- Component enter/exit animations
- Hover effects
- Scroll animations

**Example:**
```typescript
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
>
  Content
</motion.div>
```

### 9.4. Loading States

#### 9.4.1. Global Loading
- **CircularProgress** (MUI): Full-page loading
- **Skeleton** (MUI): Content placeholders

#### 9.4.2. Component-level Loading
- Button loading states
- Table loading
- Image lazy loading

### 9.5. Error Handling UI

#### 9.5.1. Toast Notifications
**Library:** `react-toastify`

**Types:**
- `toast.success()`: Success messages
- `toast.error()`: Error messages
- `toast.info()`: Info messages
- `toast.warning()`: Warnings

#### 9.5.2. Error Boundaries
- Catch React errors
- Display fallback UI
- Log errors (optional)

#### 9.5.3. Form Errors
- Inline error messages (React Hook Form)
- Field-level validation
- Submit errors

---

## 10. KẾT LUẬN

### 10.1. Điểm Mạnh

#### 10.1.1. Kiến trúc
✅ **Modern stack**: Next.js 15 + React 19 + TypeScript  
✅ **Scalable**: Component-based, modular architecture  
✅ **Type-safe**: TypeScript everywhere  
✅ **SSR/SSG**: Next.js App Router cho SEO & performance  

#### 10.1.2. State Management
✅ **Redux Toolkit**: Predictable state management  
✅ **React Query**: Server state caching & synchronization  
✅ **Separation of concerns**: UI state vs Server state  

#### 10.1.3. Real-time Features
✅ **SignalR**: Bi-directional communication  
✅ **Auto-reconnection**: Resilient connection  
✅ **Heartbeat mechanism**: Keep-alive  

#### 10.1.4. Authentication & Security
✅ **JWT + HttpOnly cookies**: Secure token storage  
✅ **Auto token refresh**: Seamless UX  
✅ **Role-based access**: Granular permissions  

#### 10.1.5. Developer Experience
✅ **TypeScript**: Type safety, IntelliSense  
✅ **ESLint**: Code quality  
✅ **Hot reload**: Fast development  
✅ **Component library**: Reusable UI components  

#### 10.1.6. User Experience
✅ **Responsive design**: Mobile-first  
✅ **Multi-language**: i18n support  
✅ **Real-time notifications**: Instant updates  
✅ **AI Chatbot**: 24/7 support  

### 10.2. Technical Highlights

#### 10.2.1. Performance
- **Code splitting**: Automatic with Next.js
- **Lazy loading**: Images, components
- **Caching**: React Query, Redux Persist
- **Optimistic updates**: Fast UI feedback

#### 10.2.2. Accessibility
- **Semantic HTML**: Proper tags
- **ARIA attributes**: Screen reader support
- **Keyboard navigation**: Tab order
- **Focus management**: Modal, dialogs

#### 10.2.3. SEO
- **SSR**: Server-side rendering
- **Meta tags**: Dynamic per page
- **Sitemap**: Auto-generated
- **robots.txt**: Search engine rules

### 10.3. Tính Năng Nổi Bật

#### 10.3.1. Cho Khách Hàng
1. **AI Chatbot**: Hỗ trợ tự động, upload ảnh
2. **Real-time tracking**: Theo dõi đơn hàng live
3. **Smart promotions**: Tự động áp dụng giá tốt nhất
4. **Map integration**: Tìm nhà hàng gần nhất
5. **Multiple payment**: VNPay + COD

#### 10.3.2. Cho Chủ Nhà Hàng
1. **Comprehensive dashboard**: Analytics & KPIs
2. **Easy menu management**: Drag-drop, images
3. **Flexible promotions**: Dish-level, order-level, vouchers
4. **Real-time orders**: SignalR notifications
5. **Staff management**: Create, assign, manage

#### 10.3.3. Cho Admin
1. **System overview**: Global statistics
2. **User management**: Full CRUD
3. **Business monitoring**: Track restaurants
4. **Reports**: Custom date ranges

### 10.4. Tech Stack Summary

```
Frontend Framework: Next.js 15 (App Router)
UI Library: React 19
Language: TypeScript 5
State Management: Redux Toolkit + React Query
UI Components: Material-UI + Ant Design + Tailwind
Real-time: SignalR (WebSocket)
HTTP Client: Axios (with interceptors)
Authentication: JWT (Access + Refresh tokens)
Internationalization: next-intl
Forms: React Hook Form + Yup/Zod
Charts: ApexCharts + Chart.js
Maps: Leaflet + react-leaflet
Animations: Framer Motion
Notifications: react-toastify + notistack
```

### 10.5. Project Metrics

**Components:**
- Screens: ~20 major pages
- Features: ~15 feature modules
- Layouts: ~10 layout components
- Redux Slices: 16 slices
- API integrations: ~50+ endpoints

**Lines of Code (estimate):**
- TypeScript: ~15,000+ LOC
- Component files: ~100+ files
- Redux logic: ~3,000+ LOC
- API integration: ~2,000+ LOC

### 10.6. Deployment & DevOps

#### 10.6.1. Containerization
✅ **Dockerfile**: Production-ready container  
✅ **docker-compose.yml**: Multi-service setup  
✅ **Environment variables**: `.env` configuration  

#### 10.6.2. CI/CD Ready
- Docker build & push
- Automated testing (Vitest)
- Linting & type checking
- Production optimization

### 10.7. Khuyến Nghị

#### 10.7.1. Tối Ưu Hóa
1. **Performance monitoring**: Add analytics (Google Analytics, Sentry)
2. **Error tracking**: Implement error logging service
3. **Image optimization**: WebP format, responsive images
4. **Bundle optimization**: Analyze & reduce bundle size

#### 10.7.2. Bảo Mật
1. **Security headers**: CSP, HSTS, X-Frame-Options
2. **Rate limiting**: Prevent abuse
3. **Input validation**: Both client & server
4. **HTTPS enforcement**: Production only

#### 10.7.3. Testing
1. **Unit tests**: Component testing
2. **Integration tests**: API mocking
3. **E2E tests**: Playwright/Cypress
4. **Accessibility tests**: axe-core

#### 10.7.4. Documentation
1. **API documentation**: OpenAPI/Swagger
2. **Component storybook**: Visual documentation
3. **User guides**: End-user documentation
4. **Developer docs**: Onboarding guide

---

## 📚 PHỤ LỤC

### A. Environment Variables Required

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000

# SignalR WebSocket
NEXT_PUBLIC_SOCKET_URL=http://localhost:5003/hubs/notification

# Image Storage
NEXT_PUBLIC_IMAGE_BASE_URL=https://res.cloudinary.com/...

# Other (if needed)
NEXT_PUBLIC_VNPAY_RETURN_URL=...
NEXT_PUBLIC_GA_TRACKING_ID=...
```

### B. Key Files Reference

**Core Configuration:**
- `package.json`: Dependencies
- `next.config.ts`: Next.js config
- `tailwind.config.js`: Tailwind config
- `tsconfig.json`: TypeScript config

**Redux:**
- `src/redux/store.ts`: Store configuration
- `src/redux/slices/*`: All slices

**API:**
- `src/lib/axios/axiosInstance.ts`: Axios setup
- `src/lib/signalr/signalRService.ts`: SignalR service

**Routing:**
- `src/middleware.ts`: Next.js middleware
- `src/i18n/routing.ts`: i18n routing

**Components:**
- `src/components/features/*`: Feature components
- `src/components/layouts/*`: Layout components
- `src/screens/*`: Page components

### C. Useful Commands

```bash
# Development
npm run dev          # Start dev server (localhost:3000)

# Production
npm run build        # Build for production
npm start            # Start production server

# Linting
npm run lint         # Run ESLint

# Docker
docker-compose up    # Start all services
docker build -t smarttasty-fe .  # Build image
```

---

## 📞 THÔNG TIN HỖ TRỢ

**Dự án:** SmartTasty Frontend  
**Framework:** Next.js 15.3.5  
**React Version:** 19.1.0  
**TypeScript:** 5.x  

**Repository:** `FE-smarttasty`  
**Branch:** `main`  
**Owner:** Quanghau123  

---

**Ngày tạo báo cáo:** 03/12/2025  
**Phiên bản:** 1.0  

---

## 🎯 TÓM TẮT EXECUTIVE

SmartTasty Frontend là một ứng dụng web hiện đại, được xây dựng với Next.js 15 và React 19, cung cấp trải nghiệm đặt món ăn online toàn diện. Hệ thống hỗ trợ 4 vai trò người dùng (User, Business, Staff, Admin) với các tính năng riêng biệt, tích hợp real-time communication qua SignalR, thanh toán VNPay, AI Chatbot, và quản lý nhà hàng đầy đủ. 

**Công nghệ chính:** Next.js, React, TypeScript, Redux Toolkit, Material-UI, SignalR, Axios, React Hook Form, Leaflet Maps.

**Điểm nổi bật:** 
- Real-time updates với SignalR
- Automatic token refresh mechanism
- Multi-language support (vi, en)
- Comprehensive role-based access control
- AI-powered chatbot support
- Mobile-responsive design

Hệ thống sẵn sàng cho production với Docker containerization và scalable architecture.

---

**END OF REPORT**
