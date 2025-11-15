# Hướng dẫn: Áp dụng giảm giá cho món ăn (Dish Promotion)

## 📋 Tổng quan

Document này giải thích cách Frontend sử dụng API Backend để hiển thị giá đã giảm cho món ăn trong trang quản lý sản phẩm của Admin Restaurant.

---

## 🔧 Các API Backend liên quan

### 1. **GET /api/DishPromotions** - Lấy tất cả khuyến mãi món ăn

**Endpoint:** `GET /api/DishPromotions`

**Response Structure:**
```json
{
  "errCode": "success",
  "errMessage": "OK",
  "data": [
    {
      "id": 1,
      "dishId": 10,
      "promotionId": 5,
      "dishName": "Phở Bò",
      "promotionTitle": "Giảm 20% Hải Sản",
      "discountType": "percent",  // hoặc "fixed_amount"
      "discountValue": 20
    }
  ]
}
```

**Mapping trong Backend:**
- Được xử lý bởi `DishPromotionService.GetAllAsync()`
- Tự động include `Dish` và `Promotion` để lấy đầy đủ thông tin
- AutoMapper map sang `DishPromotionDto` với đầy đủ `discountType` và `discountValue`

---

### 2. **GET /api/Dishes/restaurant/{restaurantId}** - Lấy danh sách món ăn

**Endpoint:** `GET /api/Dishes/restaurant/{restaurantId}`

**Response Structure:**
```json
{
  "errCode": "success",
  "errMessage": "OK",
  "data": [
    {
      "id": 10,
      "name": "Phở Bò",
      "category": "ThucAn",
      "price": 50000,  // Giá gốc (chưa giảm)
      "image": "dishes/abc123",
      "imageUrl": "https://...",
      "isActive": true,
      "restaurant": { ... }
    }
  ]
}
```

**Lưu ý:** API này **chỉ trả về giá gốc**, không tự tính giá đã giảm.

---

## 🎯 Quy trình áp dụng giảm giá trong Frontend

### Bước 1: Load dữ liệu từ BE

```typescript
useEffect(() => {
  if (restaurant?.id) {
    // 1. Load danh sách món ăn (giá gốc)
    dispatch(fetchDishes(restaurant.id));
    
    // 2. Load danh sách khuyến mãi (targetType = "dish")
    dispatch(fetchPromotions(restaurant.id));
    
    // 3. Load tất cả dish promotions (mapping món ↔ khuyến mãi)
    dispatch(fetchDishPromotions());
  }
}, [restaurant, dispatch]);
```

### Bước 2: Tính giá đã giảm

```typescript
/**
 * Helper: Tính giá đã giảm dựa trên thông tin từ BE
 * 
 * @param originalPrice - Giá gốc của món
 * @param discountType - "percent" | "fixed_amount" (từ BE)
 * @param discountValue - Giá trị giảm (% hoặc số tiền) (từ BE)
 * @returns Giá sau khi giảm
 */
const computeDiscountedPrice = (
  originalPrice: number,
  discountType?: string,
  discountValue?: number
): number => {
  if (!discountType || discountValue === undefined) {
    return originalPrice;
  }

  const value = Number(discountValue);
  
  if (discountType === "percent") {
    const safePercent = Math.max(0, Math.min(100, value));
    const discountAmount = originalPrice * (safePercent / 100);
    return Math.max(0, Math.round(originalPrice - discountAmount));
  }
  
  if (discountType === "fixed_amount") {
    return Math.max(0, Math.round(originalPrice - value));
  }
  
  return originalPrice;
};
```

### Bước 3: Hiển thị giá cho từng món

```typescript
{paginatedDishes.map((dish) => {
  // Lấy tất cả khuyến mãi áp dụng cho món này
  const relatedPromotions = dishPromotions.filter(
    (dp) => dp.dishId === dish.id
  );
  
  const originalPrice = dish.price;
  let bestDiscountedPrice = originalPrice;

  // Nếu có nhiều khuyến mãi, chọn giá thấp nhất
  if (relatedPromotions.length > 0) {
    bestDiscountedPrice = relatedPromotions.reduce(
      (minPrice, promotion) => {
        const discountType = promotion.promotion?.discountType;
        const discountValue = promotion.promotion?.discountValue;
        
        const priceAfterDiscount = computeDiscountedPrice(
          originalPrice,
          discountType,
          discountValue
        );
        
        return Math.min(minPrice, priceAfterDiscount);
      },
      originalPrice
    );
  }

  const hasDiscount = bestDiscountedPrice < originalPrice;

  return (
    <div>
      {hasDiscount ? (
        <>
          <span style={{ textDecoration: "line-through" }}>
            {originalPrice.toLocaleString()}đ
          </span>
          <span style={{ color: "red", fontWeight: 700 }}>
            {bestDiscountedPrice.toLocaleString()}đ
          </span>
        </>
      ) : (
        <span>{originalPrice.toLocaleString()}đ</span>
      )}
    </div>
  );
})}
```

---

## ✅ Nguyên tắc quan trọng

### 1. **Frontend KHÔNG tự tạo logic giảm giá**
- ❌ Không hard-code công thức tính toán
- ✅ Sử dụng `discountType` và `discountValue` từ BE
- ✅ Chỉ implement công thức chuẩn theo BE

### 2. **Backend là nguồn chân lý duy nhất**
- Backend quyết định loại giảm giá (`percent` vs `fixed_amount`)
- Backend quyết định giá trị giảm
- Frontend chỉ hiển thị và format

### 3. **Xử lý nhiều khuyến mãi**
- Một món có thể có nhiều khuyến mãi đang hoạt động
- Luôn chọn giá thấp nhất (tốt nhất cho khách hàng)
- Sử dụng `Array.reduce()` để tìm giá tốt nhất

---

## 🔄 So sánh: Trước và Sau

### ❌ Trước (Tự tính toán - Không tốt)

```typescript
// FE tự tạo logic, dễ sai lệch với BE
const discount = promotion.discountType === "percent" 
  ? price * (promotion.discountValue / 100)
  : promotion.discountValue;
```

### ✅ Sau (Sử dụng dữ liệu BE - Tốt)

```typescript
// Sử dụng trực tiếp dữ liệu từ BE API
const discountType = promotion.promotion?.discountType;  // từ BE
const discountValue = promotion.promotion?.discountValue; // từ BE

const finalPrice = computeDiscountedPrice(
  originalPrice,
  discountType,
  discountValue
);
```

---

## 📝 Lưu ý về API ApplyPromotion

### API: `POST /api/ApplyPromotion/{orderId}`

**Mục đích:** Tính tổng tiền cuối cùng cho đơn hàng (Order)

**Không phù hợp cho:** Hiển thị giá món ăn trong trang quản lý

**Lý do:**
- API này yêu cầu `orderId` (đơn hàng đã tạo)
- Áp dụng đồng thời: DishPromotion + OrderPromotion + Voucher
- Dùng khi khách hàng thanh toán, không phải khi admin xem danh sách món

**Khi nào dùng:**
```typescript
// ✅ Đúng: Khi khách thanh toán
const result = await applyPromotion({
  orderId: 123,
  voucherCode: "SUMMER2024"
});
console.log(result.finalTotal); // Tổng tiền sau tất cả giảm giá

// ❌ Sai: Hiển thị giá món trong trang admin
// Không thể dùng vì chưa có orderId
```

---

## 🧪 Testing

### Test Case 1: Món không có khuyến mãi
```typescript
const dish = { id: 1, price: 50000 };
const relatedPromotions = []; // Rỗng

// Kết quả: Hiển thị 50,000đ (giá gốc)
```

### Test Case 2: Món có 1 khuyến mãi giảm %
```typescript
const dish = { id: 1, price: 50000 };
const relatedPromotions = [{
  promotion: {
    discountType: "percent",
    discountValue: 20
  }
}];

// Kết quả: 
// - Giá gốc: 50,000đ (gạch ngang)
// - Giá giảm: 40,000đ (màu đỏ)
```

### Test Case 3: Món có nhiều khuyến mãi
```typescript
const dish = { id: 1, price: 50000 };
const relatedPromotions = [
  { promotion: { discountType: "percent", discountValue: 20 } },      // 40,000đ
  { promotion: { discountType: "fixed_amount", discountValue: 5000 } } // 45,000đ
];

// Kết quả: Chọn giá thấp nhất = 40,000đ
```

---

## 🎨 UI Components đã cập nhật

### File: `src/components/features/AdminRestaurant/Products/index.tsx`

**Các thay đổi chính:**

1. ✅ Xóa logic tính toán tự tạo
2. ✅ Sử dụng dữ liệu từ `promotion.promotion?.discountType` và `promotion.promotion?.discountValue`
3. ✅ Thêm comments giải thích rõ ràng
4. ✅ Cải thiện tên biến (`originalPrice`, `bestDiscountedPrice` thay vì `orig`, `bestDiscounted`)
5. ✅ Xử lý edge cases (null, undefined)

---

## 📚 Tham khảo

- **Backend Flow:** Xem file `luong hoat dong promotion.txt`
- **API Documentation:** Backend Swagger UI
- **Redux Slices:**
  - `dishSlide.ts` - Quản lý dishes
  - `dishPromotionSlice.ts` - Quản lý dish promotions
  - `promotionSlice.ts` - Quản lý promotions

---

## 🚀 Kết luận

Với implementation mới:

✅ Frontend không tự tính toán giảm giá  
✅ Sử dụng 100% dữ liệu từ Backend API  
✅ Dễ maintain và ít bug hơn  
✅ Nhất quán với logic Backend  
✅ Dễ dàng mở rộng thêm loại giảm giá mới  

**Nguyên tắc vàng:** Backend là single source of truth cho business logic!
