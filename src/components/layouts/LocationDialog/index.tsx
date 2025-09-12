"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  const handleLogin = async () => {
    // 🚀 giả sử login thành công
    setIsLogin(true);
    // Mở popup hỏi quyền vị trí
    setOpenDialog(true);
  };

  const handleAllowLocation = () => {
    setOpenDialog(false);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          console.log("Vị trí hiện tại:", lat, lng);

          // Gọi API lấy danh sách nhà hàng gần nhất
          fetch(`/api/restaurants/nearby?lat=${lat}&lng=${lng}`)
            .then((res) => res.json())
            .then((data) => {
              console.log("Nhà hàng gần bạn:", data);
            });
        },
        (err) => {
          console.error("Người dùng từ chối hoặc lỗi:", err);
        }
      );
    } else {
      console.error("Trình duyệt không hỗ trợ geolocation");
    }
  };

  return (
    <>
      {!isLogin ? (
        <Button variant="contained" onClick={handleLogin}>
          Đăng nhập
        </Button>
      ) : (
        <Typography>Chào mừng bạn đã đăng nhập!</Typography>
      )}

      {/* Dialog hỏi quyền vị trí */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Bạn có muốn xem kết quả gần vị trí của mình hơn không?</DialogTitle>
        <DialogContent>
          <Typography>
            Để nhận được kết quả tìm kiếm gần nhất, hãy cho phép ứng dụng sử dụng vị trí chính xác
            của thiết bị.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setOpenDialog(false)}>
            Để sau
          </Button>
          <Button variant="contained" onClick={handleAllowLocation}>
            Sử dụng vị trí chính xác
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
