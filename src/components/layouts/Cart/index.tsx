"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
// use order slice thunks instead of calling axios directly from the component
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { getAccessToken } from "@/lib/utils/tokenHelper";
import {
  Box,
  Typography,
  Divider,
  CircularProgress,
  Paper,
  Button,
  Checkbox,
  IconButton,
  Container,
  Stack,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import StorefrontIcon from "@mui/icons-material/Storefront";
import {
  fetchOrdersByUser,
  setSelectedOrder,
  deleteOrder,
  deleteOrderItem,
  addItemToOrder,
} from "@/redux/slices/orderSlice";

// Order types are available in the redux state; no direct import required here
const CartPage = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { orders, selectedOrder, loading, error } = useAppSelector(
    (state) => state.order
  );

  const [updatingItem, setUpdatingItem] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning" | "info";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  // Dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = getAccessToken();

    if (!token) {
      console.warn("⚠️ Không có token => chưa đăng nhập");
      return;
    }

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const userId = parsedUser.id || parsedUser.userId;
        if (userId) dispatch(fetchOrdersByUser(userId));
      } catch (e) {
        console.error("Lỗi parse user từ localStorage:", e);
      }
    }
  }, [dispatch]);

  useEffect(() => {
    if (orders.length > 0 && !selectedOrder) {
      const pendingOrder =
        orders.find(
          (o) => (o.status ?? "").toString().toLowerCase() === "pending"
        ) || orders[0];
      dispatch(setSelectedOrder(pendingOrder));
    }
  }, [orders, selectedOrder, dispatch]);

  // Toggle checkbox cho item
  const handleToggleItem = (itemId: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  // Toggle checkbox cho order (chọn tất cả items trong order)
  const handleToggleOrder = (orderId: number) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order?.items) return;

    const newSelectedOrders = new Set(selectedOrders);
    const newSelectedItems = new Set(selectedItems);

    if (newSelectedOrders.has(orderId)) {
      // Bỏ chọn order và tất cả items
      newSelectedOrders.delete(orderId);
      order.items.forEach((item) => newSelectedItems.delete(item.id));
    } else {
      // Chọn order và tất cả items
      newSelectedOrders.add(orderId);
      order.items.forEach((item) => newSelectedItems.add(item.id));
    }

    setSelectedOrders(newSelectedOrders);
    setSelectedItems(newSelectedItems);
  };

  // Kiểm tra xem order có được chọn hết items không
  const isOrderFullySelected = (orderId: number) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order?.items || order.items.length === 0) return false;
    return order.items.every((item) => selectedItems.has(item.id));
  };

  // 🗑️ Xoá đơn hàng
  const handleDeleteOrder = async (orderId: number) => {
    setConfirmDialog({
      open: true,
      title: "Xác nhận xóa đơn hàng",
      message:
        "Bạn có chắc muốn xóa đơn hàng này không? Hành động này không thể hoàn tác.",
      onConfirm: async () => {
        try {
          await dispatch(deleteOrder(orderId));
          setSnackbar({
            open: true,
            message: "✅ Đã xóa đơn hàng thành công",
            severity: "success",
          });
        } catch (error) {
          console.error("Lỗi xóa đơn:", error);
          setSnackbar({
            open: true,
            message: "❌ Không thể xóa đơn hàng",
            severity: "error",
          });
        }
        setConfirmDialog({ ...confirmDialog, open: false });
      },
    });
  };

  // 🗑️ Xoá món khỏi đơn hàng
  const handleRemoveItem = async (orderId: number, orderItemId: number) => {
    setConfirmDialog({
      open: true,
      title: "Xác nhận xóa món ăn",
      message: "Bạn có chắc muốn xóa món này khỏi đơn hàng không?",
      onConfirm: async () => {
        try {
          // Dispatch the thunk and unwrap to throw on rejection so we can catch it
          await dispatch(deleteOrderItem({ orderId, orderItemId })).unwrap();

          setSnackbar({
            open: true,
            message: "✅ Đã xóa món ăn thành công",
            severity: "success",
          });
        } catch (error) {
          console.error("Lỗi xoá món:", error);
          setSnackbar({
            open: true,
            message: "❌ Không thể xóa món ăn",
            severity: "error",
          });
        }
        setConfirmDialog({ ...confirmDialog, open: false });
      },
    });
  };

  // ✏️ Cập nhật số lượng món (tăng/giảm)
  const handleUpdateItemQuantity = async (
    orderId: number,
    itemId: number,
    newQuantity: number
  ) => {
    if (newQuantity <= 0) {
      handleRemoveItem(orderId, itemId);
      return;
    }
    setUpdatingItem(true);
    try {
      const order = orders.find((o) => o.id === orderId);
      const orderItem = order?.items?.find((it) => it.id === itemId);
      const dishId = orderItem?.dishId;
      if (!dishId) throw new Error("Không tìm thấy dishId của món");

      await dispatch(
        addItemToOrder({
          orderId,
          item: { dishId, quantity: newQuantity, totalPrice: 0 },
        })
      );

      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const userId = parsedUser.id || parsedUser.userId;
        if (userId) dispatch(fetchOrdersByUser(userId));
      }
    } catch (error) {
      console.error("Lỗi cập nhật số lượng:", error);
      setSnackbar({
        open: true,
        message: "❌ Không thể cập nhật số lượng món",
        severity: "error",
      });
    } finally {
      setUpdatingItem(false);
    }
  };

  // 💳 Thanh toán đơn hàng
  const handleCheckout = (orderId: number) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      setSnackbar({
        open: true,
        message: "❌ Không tìm thấy đơn hàng để thanh toán",
        severity: "error",
      });
      return;
    }

    localStorage.setItem("checkoutOrder", JSON.stringify(order));
    router.push("/payment");
  };

  // ➕ Mở trang thêm món
  const handleAddMore = (restaurantId: number) => {
    router.push(`/RestaurantDetails/${restaurantId}`);
  };

  // Tính tổng tiền các items được chọn
  const calculateSelectedTotal = () => {
    let total = 0;
    orders.forEach((order) => {
      order.items?.forEach((item) => {
        if (selectedItems.has(item.id)) {
          total += typeof item.totalPrice === "number" ? item.totalPrice : 0;
        }
      });
    });
    return total;
  };

  if (loading)
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography color="error">Lỗi khi tải đơn hàng: {error}</Typography>
        </Paper>
      </Container>
    );

  if (orders.length === 0)
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 6, textAlign: "center" }}>
          <ShoppingCartOutlinedIcon
            sx={{ fontSize: 80, color: "text.disabled", mb: 2 }}
          />
          <Typography variant="h6" color="text.secondary" mb={2}>
            Giỏ hàng của bạn đang trống
          </Typography>
        </Paper>
      </Container>
    );

  return (
    <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh", py: 3 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h5" fontWeight="bold" color="primary">
            <ShoppingCartOutlinedIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            Giỏ Hàng
          </Typography>
        </Paper>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexDirection: { xs: "column", md: "row" },
          }}
        >
          {/* Left side - Cart items */}
          <Box sx={{ flex: { xs: 1, md: "1 1 66%" } }}>
            {orders.map((order) => {
              const maybeRestaurant = order as unknown as Record<
                string,
                unknown
              >;
              const restObj =
                maybeRestaurant?.restaurant &&
                typeof maybeRestaurant.restaurant === "object"
                  ? (maybeRestaurant.restaurant as Record<string, unknown>)
                  : null;
              const restaurantName =
                (restObj && typeof restObj["name"] === "string"
                  ? (restObj["name"] as string)
                  : null) ||
                `Nhà hàng #${order.restaurantId}` ||
                "Nhà hàng không xác định";
              const restaurantAddress =
                (restObj && typeof restObj["address"] === "string"
                  ? (restObj["address"] as string)
                  : null) || "Chưa có địa chỉ";

              return (
                <Paper key={order.id} sx={{ mb: 2, overflow: "hidden" }}>
                  {/* Restaurant Header */}
                  <Box
                    sx={{
                      bgcolor: "#fff",
                      p: 2,
                      borderBottom: "1px solid #e0e0e0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Checkbox
                        checked={isOrderFullySelected(order.id)}
                        onChange={() => handleToggleOrder(order.id)}
                        sx={{ p: 0 }}
                      />
                      <StorefrontIcon color="primary" />
                      <Box>
                        <Typography fontWeight="bold">
                          {restaurantName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {restaurantAddress}
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      size="small"
                      variant="text"
                      color="primary"
                      onClick={() => handleAddMore(order.restaurantId)}
                      startIcon={<AddIcon />}
                    >
                      Thêm món
                    </Button>
                  </Box>

                  {/* Order Items */}
                  {order.items?.length > 0 ? (
                    order.items.map((item) => {
                      const qty = Number(item.quantity ?? 0);
                      const unitPrice =
                        typeof item.totalPrice === "number" && qty > 0
                          ? Math.round(item.totalPrice / qty)
                          : 0;
                      const total =
                        typeof item.totalPrice === "number"
                          ? item.totalPrice
                          : unitPrice * qty;

                      return (
                        <Box
                          key={item.id}
                          sx={{
                            p: 2,
                            borderBottom: "1px solid #f0f0f0",
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            "&:hover": { bgcolor: "#fafafa" },
                          }}
                        >
                          <Checkbox
                            checked={selectedItems.has(item.id)}
                            onChange={() => handleToggleItem(item.id)}
                          />

                          {/* Item Image */}
                          <Box
                            sx={{
                              width: 80,
                              height: 80,
                              borderRadius: 1,
                              overflow: "hidden",
                              bgcolor: "#f0f0f0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              position: "relative",
                              flexShrink: 0,
                            }}
                          >
                            {item.image && !imageErrors.has(item.id) ? (
                              <Image
                                src={item.image}
                                alt={item.dishName || "Món ăn"}
                                fill
                                style={{
                                  objectFit: "cover",
                                }}
                                sizes="80px"
                                unoptimized
                                onError={() => {
                                  setImageErrors((prev) =>
                                    new Set(prev).add(item.id)
                                  );
                                }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Typography variant="h3">🍽️</Typography>
                                {!item.image && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    No image
                                  </Typography>
                                )}
                              </Box>
                            )}
                          </Box>

                          {/* Item Details */}
                          <Box sx={{ flex: 1 }}>
                            <Typography fontWeight="500" mb={0.5}>
                              {item.dishName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {unitPrice.toLocaleString()}đ
                            </Typography>
                          </Box>

                          {/* Quantity Controls */}
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              border: "1px solid #e0e0e0",
                              borderRadius: 1,
                            }}
                          >
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleUpdateItemQuantity(
                                  order.id,
                                  item.id,
                                  qty - 1
                                )
                              }
                              disabled={updatingItem}
                            >
                              <RemoveIcon fontSize="small" />
                            </IconButton>
                            <Typography
                              sx={{
                                px: 2,
                                minWidth: 40,
                                textAlign: "center",
                              }}
                            >
                              {qty}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleUpdateItemQuantity(
                                  order.id,
                                  item.id,
                                  qty + 1
                                )
                              }
                              disabled={updatingItem}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Box>

                          {/* Item Total */}
                          <Typography
                            fontWeight="bold"
                            color="primary"
                            sx={{ minWidth: 100, textAlign: "right" }}
                          >
                            {total.toLocaleString()}đ
                          </Typography>

                          {/* Delete Button */}
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveItem(order.id, item.id)}
                          >
                            <DeleteOutlineIcon />
                          </IconButton>
                        </Box>
                      );
                    })
                  ) : (
                    <Box sx={{ p: 2, textAlign: "center" }}>
                      <Typography variant="body2" color="text.secondary">
                        Không có món ăn nào trong đơn này.
                      </Typography>
                    </Box>
                  )}

                  {/* Order Footer */}
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "#fafafa",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteOutlineIcon />}
                      onClick={() => handleDeleteOrder(order.id)}
                    >
                      Xoá đơn hàng
                    </Button>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Tổng đơn hàng:
                      </Typography>
                      <Typography
                        variant="h6"
                        color="primary"
                        fontWeight="bold"
                      >
                        {(
                          order.items?.reduce(
                            (sum, i) =>
                              sum +
                              (typeof i.totalPrice === "number"
                                ? i.totalPrice
                                : 0),
                            0
                          ) || 0
                        ).toLocaleString()}
                        đ
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              );
            })}
          </Box>

          {/* Right side - Summary */}
          <Box sx={{ flex: { xs: 1, md: "1 1 33%" } }}>
            <Paper
              sx={{
                p: 3,
                position: "sticky",
                top: 80,
              }}
            >
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Thông tin đơn hàng
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={1.5} mb={2}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Tạm tính
                  </Typography>
                  <Typography variant="body2">
                    {calculateSelectedTotal().toLocaleString()}đ
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Giảm giá
                  </Typography>
                  <Typography variant="body2">0đ</Typography>
                </Box>
              </Stack>

              <Divider sx={{ mb: 2 }} />

              <Box display="flex" justifyContent="space-between" mb={3}>
                <Typography variant="body1" fontWeight="bold">
                  Tổng cộng
                </Typography>
                <Typography variant="h6" color="primary" fontWeight="bold">
                  {calculateSelectedTotal().toLocaleString()}đ
                </Typography>
              </Box>

              <Button
                fullWidth
                variant="contained"
                size="large"
                color="primary"
                disabled={selectedItems.size === 0}
                onClick={() => {
                  // Tìm order đầu tiên có items được chọn
                  const orderWithSelectedItems = orders.find((order) =>
                    order.items?.some((item) => selectedItems.has(item.id))
                  );
                  if (orderWithSelectedItems) {
                    handleCheckout(orderWithSelectedItems.id);
                  } else {
                    setSnackbar({
                      open: true,
                      message: "⚠️ Vui lòng chọn món để thanh toán",
                      severity: "warning",
                    });
                  }
                }}
                sx={{
                  py: 1.5,
                  fontWeight: "bold",
                  fontSize: "1rem",
                }}
              >
                Thanh toán ({selectedItems.size})
              </Button>

              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                textAlign="center"
                mt={2}
              >
                Vui lòng chọn món muốn thanh toán
              </Typography>
            </Paper>
          </Box>
        </Box>
      </Container>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {confirmDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
            color="inherit"
          >
            Hủy
          </Button>
          <Button
            onClick={confirmDialog.onConfirm}
            color="error"
            variant="contained"
            autoFocus
          >
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CartPage;


// "use client";

// import Image from "next/image";
// import {
//   Box,
//   Typography,
//   Divider,
//   CircularProgress,
//   Paper,
//   Button,
//   Checkbox,
//   IconButton,
//   Container,
//   Stack,
//   Snackbar,
//   Alert,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogContentText,
//   DialogActions,
// } from "@mui/material";
// import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
// import AddIcon from "@mui/icons-material/Add";
// import RemoveIcon from "@mui/icons-material/Remove";
// import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
// import StorefrontIcon from "@mui/icons-material/Storefront";
// import { useCart } from "@/lib/hooks/useCart";
// import {
//   getRestaurantInfo,
//   getUnitPrice,
//   calculateItemTotal,
//   calculateOrderTotal,
//   formatCurrency,
//   type Order,
// } from "@/Model/CartModel";

// const CartPage = () => {
//   const cart = useCart();

//   // Loading state
//   if (cart.loading)
//     return (
//       <Box
//         display="flex"
//         justifyContent="center"
//         alignItems="center"
//         minHeight="60vh"
//       >
//         <CircularProgress />
//       </Box>
//     );

//   // Error state
//   if (cart.error)
//     return (
//       <Container maxWidth="lg" sx={{ py: 4 }}>
//         <Paper sx={{ p: 3, textAlign: "center" }}>
//           <Typography color="error">
//             Lỗi khi tải đơn hàng: {cart.error}
//           </Typography>
//         </Paper>
//       </Container>
//     );

//   // Empty cart state
//   if (cart.orders.length === 0)
//     return (
//       <Container maxWidth="lg" sx={{ py: 4 }}>
//         <Paper sx={{ p: 6, textAlign: "center" }}>
//           <ShoppingCartOutlinedIcon
//             sx={{ fontSize: 80, color: "text.disabled", mb: 2 }}
//           />
//           <Typography variant="h6" color="text.secondary" mb={2}>
//             Giỏ hàng của bạn đang trống
//           </Typography>
//         </Paper>
//       </Container>
//     );

//   // Main cart UI
//   return (
//     <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh", py: 3 }}>
//       <Container maxWidth="lg">
//         {/* Header */}
//         <Paper sx={{ p: 2, mb: 2 }}>
//           <Typography variant="h5" fontWeight="bold" color="primary">
//             <ShoppingCartOutlinedIcon sx={{ mr: 1, verticalAlign: "middle" }} />
//             Giỏ Hàng
//           </Typography>
//         </Paper>

//         <Box
//           sx={{
//             display: "flex",
//             gap: 2,
//             flexDirection: { xs: "column", md: "row" },
//           }}
//         >
//           {/* Left side - Cart items */}
//           <Box sx={{ flex: { xs: 1, md: "1 1 66%" } }}>
//             {cart.orders.map((order) => {
//               const restaurant = getRestaurantInfo(order as Order);
//               const orderTotal = calculateOrderTotal(order as Order);

//               return (
//                 <Paper key={order.id} sx={{ mb: 2, overflow: "hidden" }}>
//                   {/* Restaurant Header */}
//                   <Box
//                     sx={{
//                       bgcolor: "#fff",
//                       p: 2,
//                       borderBottom: "1px solid #e0e0e0",
//                       display: "flex",
//                       alignItems: "center",
//                       justifyContent: "space-between",
//                     }}
//                   >
//                     <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
//                       <Checkbox
//                         checked={cart.checkOrderFullySelected(order.id)}
//                         onChange={() => cart.toggleOrder(order.id)}
//                         sx={{ p: 0 }}
//                       />
//                       <StorefrontIcon color="primary" />
//                       <Box>
//                         <Typography fontWeight="bold">
//                           {restaurant.name}
//                         </Typography>
//                         <Typography variant="caption" color="text.secondary">
//                           {restaurant.address}
//                         </Typography>
//                       </Box>
//                     </Box>
//                     <Button
//                       size="small"
//                       variant="text"
//                       color="primary"
//                       onClick={() => cart.addMore(order.restaurantId)}
//                       startIcon={<AddIcon />}
//                     >
//                       Thêm món
//                     </Button>
//                   </Box>

//                   {/* Order Items */}
//                   {order.items?.length > 0 ? (
//                     order.items.map((item) => {
//                       const qty = Number(item.quantity ?? 0);
//                       const unitPrice = getUnitPrice(item);
//                       const total = calculateItemTotal(item);

//                       return (
//                         <Box
//                           key={item.id}
//                           sx={{
//                             p: 2,
//                             borderBottom: "1px solid #f0f0f0",
//                             display: "flex",
//                             alignItems: "center",
//                             gap: 2,
//                             "&:hover": { bgcolor: "#fafafa" },
//                           }}
//                         >
//                           <Checkbox
//                             checked={cart.selectedItems.has(item.id)}
//                             onChange={() => cart.toggleItem(item.id)}
//                           />

//                           {/* Item Image */}
//                           <Box
//                             sx={{
//                               width: 80,
//                               height: 80,
//                               borderRadius: 1,
//                               overflow: "hidden",
//                               bgcolor: "#f0f0f0",
//                               display: "flex",
//                               alignItems: "center",
//                               justifyContent: "center",
//                               position: "relative",
//                               flexShrink: 0,
//                             }}
//                           >
//                             {item.image && !cart.imageErrors.has(item.id) ? (
//                               <Image
//                                 src={item.image}
//                                 alt={item.dishName || "Món ăn"}
//                                 fill
//                                 style={{
//                                   objectFit: "cover",
//                                 }}
//                                 sizes="80px"
//                                 unoptimized
//                                 onError={() => cart.handleImageError(item.id)}
//                               />
//                             ) : (
//                               <Box
//                                 sx={{
//                                   display: "flex",
//                                   flexDirection: "column",
//                                   alignItems: "center",
//                                   justifyContent: "center",
//                                 }}
//                               >
//                                 <Typography variant="h3">🍽️</Typography>
//                                 {!item.image && (
//                                   <Typography
//                                     variant="caption"
//                                     color="text.secondary"
//                                   >
//                                     No image
//                                   </Typography>
//                                 )}
//                               </Box>
//                             )}
//                           </Box>

//                           {/* Item Details */}
//                           <Box sx={{ flex: 1 }}>
//                             <Typography fontWeight="500" mb={0.5}>
//                               {item.dishName}
//                             </Typography>
//                             <Typography variant="body2" color="text.secondary">
//                               {formatCurrency(unitPrice)}
//                             </Typography>
//                           </Box>

//                           {/* Quantity Controls */}
//                           <Box
//                             sx={{
//                               display: "flex",
//                               alignItems: "center",
//                               border: "1px solid #e0e0e0",
//                               borderRadius: 1,
//                             }}
//                           >
//                             <IconButton
//                               size="small"
//                               onClick={() => {
//                                 if (qty - 1 <= 0) {
//                                   cart.removeItem(order.id, item.id);
//                                 } else {
//                                   cart.updateItemQuantity(
//                                     order.id,
//                                     item.id,
//                                     qty - 1
//                                   );
//                                 }
//                               }}
//                               disabled={cart.updatingItem}
//                             >
//                               <RemoveIcon fontSize="small" />
//                             </IconButton>
//                             <Typography
//                               sx={{
//                                 px: 2,
//                                 minWidth: 40,
//                                 textAlign: "center",
//                               }}
//                             >
//                               {qty}
//                             </Typography>
//                             <IconButton
//                               size="small"
//                               onClick={() =>
//                                 cart.updateItemQuantity(
//                                   order.id,
//                                   item.id,
//                                   qty + 1
//                                 )
//                               }
//                               disabled={cart.updatingItem}
//                             >
//                               <AddIcon fontSize="small" />
//                             </IconButton>
//                           </Box>

//                           {/* Item Total */}
//                           <Typography
//                             fontWeight="bold"
//                             color="primary"
//                             sx={{ minWidth: 100, textAlign: "right" }}
//                           >
//                             {formatCurrency(total)}
//                           </Typography>

//                           {/* Delete Button */}
//                           <IconButton
//                             size="small"
//                             color="error"
//                             onClick={() => cart.removeItem(order.id, item.id)}
//                           >
//                             <DeleteOutlineIcon />
//                           </IconButton>
//                         </Box>
//                       );
//                     })
//                   ) : (
//                     <Box sx={{ p: 2, textAlign: "center" }}>
//                       <Typography variant="body2" color="text.secondary">
//                         Không có món ăn nào trong đơn này.
//                       </Typography>
//                     </Box>
//                   )}

//                   {/* Order Footer */}
//                   <Box
//                     sx={{
//                       p: 2,
//                       bgcolor: "#fafafa",
//                       display: "flex",
//                       justifyContent: "space-between",
//                       alignItems: "center",
//                     }}
//                   >
//                     <Button
//                       size="small"
//                       variant="outlined"
//                       color="error"
//                       startIcon={<DeleteOutlineIcon />}
//                       onClick={() => cart.handleDeleteOrder(order.id)}
//                     >
//                       Xoá đơn hàng
//                     </Button>
//                     <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
//                       <Typography variant="body2" color="text.secondary">
//                         Tổng đơn hàng:
//                       </Typography>
//                       <Typography
//                         variant="h6"
//                         color="primary"
//                         fontWeight="bold"
//                       >
//                         {formatCurrency(orderTotal)}
//                       </Typography>
//                     </Box>
//                   </Box>
//                 </Paper>
//               );
//             })}
//           </Box>

//           {/* Right side - Summary */}
//           <Box sx={{ flex: { xs: 1, md: "1 1 33%" } }}>
//             <Paper
//               sx={{
//                 p: 3,
//                 position: "sticky",
//                 top: 80,
//               }}
//             >
//               <Typography variant="h6" fontWeight="bold" mb={2}>
//                 Thông tin đơn hàng
//               </Typography>
//               <Divider sx={{ mb: 2 }} />

//               <Stack spacing={1.5} mb={2}>
//                 <Box display="flex" justifyContent="space-between">
//                   <Typography variant="body2" color="text.secondary">
//                     Tạm tính
//                   </Typography>
//                   <Typography variant="body2">
//                     {formatCurrency(cart.selectedTotal)}
//                   </Typography>
//                 </Box>
//                 <Box display="flex" justifyContent="space-between">
//                   <Typography variant="body2" color="text.secondary">
//                     Giảm giá
//                   </Typography>
//                   <Typography variant="body2">0đ</Typography>
//                 </Box>
//               </Stack>

//               <Divider sx={{ mb: 2 }} />

//               <Box display="flex" justifyContent="space-between" mb={3}>
//                 <Typography variant="body1" fontWeight="bold">
//                   Tổng cộng
//                 </Typography>
//                 <Typography variant="h6" color="primary" fontWeight="bold">
//                   {formatCurrency(cart.selectedTotal)}
//                 </Typography>
//               </Box>

//               <Button
//                 fullWidth
//                 variant="contained"
//                 size="large"
//                 color="primary"
//                 disabled={cart.selectedItems.size === 0}
//                 onClick={cart.checkout}
//                 sx={{
//                   py: 1.5,
//                   fontWeight: "bold",
//                   fontSize: "1rem",
//                 }}
//               >
//                 Thanh toán ({cart.selectedItems.size})
//               </Button>

//               <Typography
//                 variant="caption"
//                 color="text.secondary"
//                 display="block"
//                 textAlign="center"
//                 mt={2}
//               >
//                 Vui lòng chọn món muốn thanh toán
//               </Typography>
//             </Paper>
//           </Box>
//         </Box>
//       </Container>

//       {/* Snackbar for notifications */}
//       <Snackbar
//         open={cart.snackbar.open}
//         autoHideDuration={4000}
//         onClose={cart.closeSnackbar}
//         anchorOrigin={{ vertical: "top", horizontal: "right" }}
//       >
//         <Alert
//           onClose={cart.closeSnackbar}
//           severity={cart.snackbar.severity}
//           variant="filled"
//           sx={{ width: "100%" }}
//         >
//           {cart.snackbar.message}
//         </Alert>
//       </Snackbar>

//       {/* Confirmation Dialog */}
//       <Dialog
//         open={cart.confirmDialog.open}
//         onClose={cart.closeDialog}
//         aria-labelledby="alert-dialog-title"
//         aria-describedby="alert-dialog-description"
//       >
//         <DialogTitle id="alert-dialog-title">
//           {cart.confirmDialog.title}
//         </DialogTitle>
//         <DialogContent>
//           <DialogContentText id="alert-dialog-description">
//             {cart.confirmDialog.message}
//           </DialogContentText>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={cart.closeDialog} color="inherit">
//             Hủy
//           </Button>
//           <Button
//             onClick={cart.confirmDialog.onConfirm}
//             color="error"
//             variant="contained"
//             autoFocus
//           >
//             Xác nhận
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </Box>
//   );
// };

// export default CartPage;
