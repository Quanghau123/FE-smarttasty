**Tổng Quan**
- **Mục đích**: Danh sách các chức năng (features) phân theo vai trò: **Admin**, **Business (owner)**, **Staff**, **User**. Tài liệu được sinh tự động từ mã nguồn frontend.

**Admin**
- **Dashboard**: Báo cáo tổng quan (số người dùng thường, người dùng business, số nhà hàng), biểu đồ theo tháng, thông tin cập nhật gần nhất. (xem `src/components/features/Admin/Dashboard/index.tsx`)
- **Quản lý người dùng (User)**: Tìm kiếm, phân trang, xem thông tin, xoá user (vai trò `user`). (xem `src/components/features/Admin/User/index.tsx`)
- **Quản lý business**: Danh sách tài khoản business, hiển thị nhà hàng liên kết, tìm kiếm, xoá. (xem `src/components/features/Admin/Business/index.tsx`)
- **Sidebar điều hướng Admin**: Liên kết tới dashboard, user, business. (xem `src/components/features/Admin/SideBar/index.tsx`)

**Business (Owner / AdminRestaurant)**
- **Dashboard nhà hàng**: Thống kê doanh thu theo tháng, số món theo danh mục, số khuyến mãi, KPI (đơn đã thanh toán, doanh thu...). Cho phép filter theo tháng/năm. (xem `src/components/features/AdminRestaurant/Dashboard/index.tsx`)
- **Quản lý món (Products / Dish)**: Thêm / sửa / xoá món, upload ảnh, chọn danh mục, bật/tắt hiển thị, tìm kiếm, phân trang. Lấy giá tốt nhất khi có khuyến mãi (dish promotions). (xem `src/components/features/AdminRestaurant/Products/index.tsx`)
- **Quản lý khuyến mãi (Promotion)**: Tạo/cập nhật/xoá khuyến mãi, upload ảnh, chọn target (dish/order), voucher code, gán giá trị min-order (order promotion). Hiển thị/huỷ gán order-promotion. (xem `src/components/features/AdminRestaurant/Promotion/index.tsx`)
- **Quản lý đơn hàng (OrderAll)**: Xem các payment/order liên quan nhà hàng, thay đổi trạng thái order (pending → processing → paid), thay đổi trạng thái giao hàng (preparing/delivering/delivered), xác nhận COD, bảo vệ chuyển trạng thái lùi. (xem `src/components/features/AdminRestaurant/OrderAll/index.tsx`)
- **Quản lý nhân sự (StaffManagement)**: Tạo / cập nhật / xoá tài khoản nhân viên (role `staff`), hiển thị danh sách nhân viên. (xem `src/components/features/AdminRestaurant/StaffManagement/index.tsx`)
- **Quản lý đặt bàn (TableBooking / Reservation)**: Xem danh sách đặt bàn của nhà hàng, cập nhật trạng thái (Confirmed, CheckedIn, Completed), hủy đặt bàn bởi nhà hàng. (xem `src/components/features/AdminRestaurant/TableBooking/index.tsx`)
- **Quản lý thông tin nhà hàng**: Tạo nhà hàng, cập nhật thông tin, địa chỉ (AddressAutocomplete), xem/ chỉnh sửa thông tin nhà hàng. (xem `src/components/features/AdminRestaurant/CreateRestaurant/index.tsx`, `src/components/features/AdminRestaurant/Restaurant/index.tsx`)
- **SideBar nhà hàng**: Điều hướng cho khu vực quản trị nhà hàng. (xem `src/components/features/AdminRestaurant/SideBar/index.tsx`)

**Staff**
- **Xem đơn hàng theo nhà hàng được phân quyền**: Nhân viên có thể chọn nhà hàng (nếu được ghép) và xem các payments/orders liên quan. (xem `src/components/features/Staff/RestaurantOrders/index.tsx`)
- **Cập nhật trạng thái giao hàng**: Thay đổi delivery status (preparing, delivering/shipping, delivered, failed), có thể đánh dấu Đã giao. (xem `src/components/features/Staff/RestaurantOrders/index.tsx`)
- **Xác nhận COD (nếu có quyền)**: Gửi request xác nhận thu COD qua payment id. (xem `src/components/features/Staff/RestaurantOrders/index.tsx`)

**User (Khách hàng bình thường)**
- **Đăng ký / Đăng nhập / Quên mật khẩu / Đổi mật khẩu**: Forms và validation cho đăng ký, đăng nhập, reset/change password. (xem `src/components/features/Register/index.tsx`, `src/components/features/Login/index.tsx`, `src/components/features/ForgotPassword/index.tsx`, `src/components/features/ChangePassword/index.tsx`)
- **Đăng ký Business**: Form đăng ký với vai trò `business` (mục đích đăng ký tài khoản owner). (xem `src/components/features/RegisterBusiness/index.tsx`)
- **Trang chính (Home) / Tìm kiếm / Nearby / RestaurantDetails**: Duyệt nhà hàng, tìm kiếm, xem chi tiết nhà hàng và menu. (Các màn hình: `src/screens/Home`, `src/screens/SearchResults`, `src/screens/NearbyRestaurant`, `src/screens/RestaurantDetails`)
- **Giỏ hàng (Cart)**: Xem đơn, chọn/bỏ chọn items, tăng/giảm số lượng (gọi các thunk add/delete item), xoá item, tính tổng, chuyển tới thanh toán. (xem `src/components/layouts/Cart/index.tsx`)
- **Thanh toán (Payment)**: Chọn phương thức (COD, VNPay), nhập/chỉnh sửa địa chỉ giao hàng, chọn delivery option (priority/fast/economy), áp dụng voucher/khuyến mãi order-level hoặc voucher code, tạo payment VNPay (redirect), tạo COD payment. (xem `src/components/layouts/Payment/index.tsx`)
- **Lịch sử mua hàng / Purchase**: Xem lịch sử thanh toán, trạng thái thanh toán, huỷ đơn (nếu được phép). (xem `src/components/layouts/Purchase/index.tsx`)
- **Đặt bàn (Reservation)**: Form/flow đặt bàn (nếu có), và trạng thái đặt bàn (xem trong TableBooking/reservation slice). (xem `src/components/features/Reservation/index.tsx`, `src/components/features/AdminRestaurant/TableBooking/index.tsx`)
- **Review / Ratings (nếu có)**: Các component/flow đánh giá/nhận xét (tìm trong `src/components/features/Review` nếu cần). (xem `src/components/features/Review/*`)

**Các Thành Phần, API liên quan (tham chiếu nhanh)**
- Redux slices/logic tham chiếu: `src/redux/slices/*` (ví dụ `restaurantSlice`, `userSlice`, `dishSlide`, `promotionSlice`, `orderSlice`, `paymentSlice`, `staffSlice`, `reservationSlice`, `dishPromotionSlice`).
- Helpers / utils: `src/lib/*` (axios instance, token helper, utils). 

**Ghi chú & Next steps**
- Tài liệu này được sinh từ việc đọc các component màn hình chính của frontend. Một số chức năng nhỏ có thể nằm ở các component con hoặc hooks (ví dụ applyPromotion, dish promotions mapping, voucher mapping). Nếu bạn muốn, tôi có thể:
  - mở rộng danh sách bằng cách liệt kê chi tiết hơn các endpoint API gọi bởi từng slice,
  - hoặc lọc/nhóm thêm tính năng theo ưu tiên (CRITICAL / OPTIONAL).

File tham khảo chính đã đọc: `src/components/features/Admin/**`, `src/components/features/AdminRestaurant/**`, `src/components/features/Staff/**`, `src/components/layouts/Cart/**`, `src/components/layouts/Payment/**`, `src/components/layouts/Purchase/**`, `src/components/features/RegisterBusiness/index.tsx`.

---
Generated automatically from frontend code scan.
