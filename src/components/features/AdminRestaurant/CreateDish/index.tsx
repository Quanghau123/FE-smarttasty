"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  Select,
  TextField,
  Typography,
  InputLabel,
  FormControl,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios/axiosInstance";
import { toast } from "react-toastify";

interface Restaurant {
  id: number;
  name: string;
}

const DishCreatePage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    restaurantId: "",
    isActive: true,
  });

  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await axiosInstance.get("/api/Restaurant");
        setRestaurants(res.data);
      } catch (error) {
        toast.error("Lỗi khi lấy danh sách nhà hàng.");
      }
    };

    fetchRestaurants();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (e: any) => {
    setForm((prev) => ({ ...prev, category: e.target.value }));
  };

  const handleRestaurantChange = (e: any) => {
    setForm((prev) => ({ ...prev, restaurantId: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!file) {
        toast.error("Vui lòng chọn ảnh món ăn.");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("category", form.category);
      formData.append("price", form.price.toString());
      formData.append("restaurantId", form.restaurantId); // ✅ đúng key
      formData.append("isActive", form.isActive ? "true" : "false"); // ✅ fix key từ IsActive -> isActive
      formData.append("file", file);

      const res = await axiosInstance.post("/api/Dishes", formData);
      const { errMessage } = res.data;

      if (errMessage === "Created") {
        toast.success("Tạo món ăn thành công!");
        router.push("/dish");
      } else {
        toast.error("Tạo món ăn thất bại!");
      }
    } catch (error) {
      console.error("Lỗi khi tạo món ăn:", error);
      toast.error("Đã xảy ra lỗi khi tạo món ăn.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" justifyContent="center" p={3}>
      <Card sx={{ width: 600 }}>
        <CardContent>
          <Typography variant="h5" align="center" gutterBottom>
            Tạo món ăn mới
          </Typography>
          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <TextField
              fullWidth
              label="Tên món ăn"
              name="name"
              value={form.name}
              onChange={handleChange}
              margin="normal"
              required
            />

            <FormControl fullWidth margin="normal" required>
              <InputLabel>Danh mục</InputLabel>
              <Select
                value={form.category}
                onChange={handleSelectChange}
                label="Danh mục"
              >
                <MenuItem value="ThucAn">Thức ăn</MenuItem>
                <MenuItem value="NuocUong">Thức uống</MenuItem>
                <MenuItem value="ThucAnThem">Thức ăn thêm</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Giá"
              name="price"
              type="number"
              value={form.price}
              onChange={handleChange}
              margin="normal"
              required
            />

            <FormControl fullWidth margin="normal" required>
              <InputLabel>Nhà hàng</InputLabel>
              <Select
                value={form.restaurantId}
                onChange={handleRestaurantChange}
                label="Nhà hàng"
              >
                {restaurants.map((res) => (
                  <MenuItem key={res.id} value={res.id.toString()}>
                    {res.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                />
              }
              label="Hoạt động"
              sx={{ mt: 2 }}
            />

            <Box mt={2}>
              <Button variant="outlined" component="label">
                Chọn ảnh món ăn
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setFile(e.target.files[0]);
                    }
                  }}
                />
              </Button>
              {file && (
                <Typography variant="body2" mt={1}>
                  Đã chọn: {file.name}
                </Typography>
              )}
            </Box>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? "Đang tạo..." : "Tạo món ăn"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DishCreatePage;
