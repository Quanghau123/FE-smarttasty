"use client";

import { Box, Button } from "@mui/material";
import { useRouter } from "next/navigation";

const Menu = () => {
  const router = useRouter();

  return (
    <Box
      display="flex"
      gap={4}
      p={3}
      sx={{
        bgcolor: "background.default",
        color: "text.primary",
      }}
    >
      {/* Nút menu chính */}
      <Button
        variant="contained"
        color="primary"
        onClick={() => router.push("/")}
      >
        Tất cả nhà hàng
      </Button>

      {/* Nút dẫn sang trang nhà hàng gần bạn */}
      <Button
        variant="outlined"
        color="secondary"
        onClick={() => router.push("/NearbyRestaurant")}
      >
        Nhà hàng gần bạn
      </Button>
    </Box>
  );
};

export default Menu;
