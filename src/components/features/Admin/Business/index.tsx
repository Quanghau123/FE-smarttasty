"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Pagination,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { fetchRestaurants } from "@/redux/slices/restaurantSlice";
import { toast } from "react-toastify";
import axiosInstance from "@/lib/axios/axiosInstance";
import { User } from "@/types/user";

interface ExtendedUser extends User {
  restaurants?: string;
}

const UserPage = () => {
  const dispatch = useAppDispatch();
  const { restaurants } = useAppSelector((state) => state.restaurant);

  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const pageSize = 6;

  // 🔹 Fetch users và gán nhà hàng
  // 🔹 Fetch users và gán nhà hàng (chỉ business)
  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get("/api/User");
      const allUsers: User[] = res.data?.data || [];

      // lọc role === 'business' và map nhà hàng
      const enrichedUsers: ExtendedUser[] = allUsers
        .filter((user) => user.role === "business")
        .map((user) => {
          const userRestaurants = restaurants
            .filter((r) => r.ownerId === user.userId)
            .map((r) => r.name)
            .join(", ");
          return { ...user, restaurants: userRestaurants || "Chưa có" };
        });

      setUsers(enrichedUsers);
    } catch (err) {
      toast.error("Lấy danh sách người dùng thất bại!");
    }
  };

  // 🔹 Xoá user
  const handleDelete = async () => {
    if (!selectedUserId) return;
    try {
      await axiosInstance.delete(`/api/User/${selectedUserId}`);
      toast.success("Xoá thành công!");
      fetchUsers();
      setOpenDialog(false);
    } catch (err) {
      toast.error("Xoá thất bại!");
    }
  };

  useEffect(() => {
    dispatch(fetchRestaurants()); // fetch tất cả nhà hàng trước
  }, [dispatch]);

  useEffect(() => {
    fetchUsers();
  }, [restaurants]); // reload users khi có dữ liệu nhà hàng

  // 🔹 Filter + Pagination
  const filteredData = users.filter(
    (u) =>
      u.userName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );
  const pageCount = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <Box>
      <Typography variant="h4" mb={2}>
        Danh sách Business User
      </Typography>

      <TextField
        label="Tìm kiếm user"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setCurrentPage(1);
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        fullWidth
        sx={{ mb: 2 }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center">Xoá</TableCell>
              <TableCell>UserName</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Nhà hàng</TableCell>
              <TableCell>Ngày tạo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((user) => (
              <TableRow key={user.userId}>
                <TableCell align="center">
                  <Tooltip title="Xoá người dùng">
                    <IconButton
                      onClick={() => {
                        setSelectedUserId(user.userId);
                        setOpenDialog(true);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell>{user.userName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.restaurants || "Chưa có"}</TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box display="flex" justifyContent="center" mt={2}>
        <Pagination
          count={pageCount}
          page={currentPage}
          onChange={(_, v) => setCurrentPage(v)}
        />
      </Box>

      {/* 🔹 Dialog xác nhận xoá */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Xác nhận xoá</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xoá người dùng này không?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Huỷ</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Xoá
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserPage;
