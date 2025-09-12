"use client";

import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Pagination,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import { useEffect, useState } from "react";
import moment from "moment";
import { toast } from "react-toastify";
import axiosInstance from "@/lib/axios/axiosInstance";
import { User } from "@/types/user";
import styles from "./styles.module.scss";

const UserPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 7;
  
  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get("/api/User");
      const allUsers: User[] = res.data.data || [];
      const filteredUsers = allUsers.filter((user) => user.role === "user");
      setUsers(filteredUsers);
    } catch (error) {
      toast.error("Không thể lấy danh sách người dùng!");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async () => {
    if (!selectedUserId) return;
    try {
      await axiosInstance.delete(`/api/User/${selectedUserId}`);
      toast.success("Xoá thành công!");
      fetchUsers();
      setOpenDialog(false);
    } catch (error) {
      toast.error("Xoá thất bại!");
    }
  };

  const filteredData = users.filter(
    (user) =>
      user.userName.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  const pageCount = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  return (
    <Box className={styles.container}>
      <Typography className={styles.header}>Thông Tin User</Typography>

      <Box className={styles.searchBox}>
        <TextField
          label="Tìm kiếm người dùng"
          variant="outlined"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1); // reset về trang đầu khi tìm
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <TableContainer component={Paper} className={styles.tableContainer}>
        <Table className={styles.table}>
          <TableHead>
            <TableRow>
              <TableCell align="center">Xoá</TableCell>
              <TableCell align="left">UserName</TableCell>
              <TableCell align="center">Email</TableCell>
              <TableCell align="center">Phone</TableCell>
              <TableCell align="center">Role</TableCell>
              <TableCell align="center">Ngày tạo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((user) => (
              <TableRow key={user.userId}>
                <TableCell align="center">
                  <IconButton
                    onClick={() => {
                      setSelectedUserId(user.userId);
                      setOpenDialog(true);
                    }}
                    className={styles.deleteBtn}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
                <TableCell align="left">
                  <Box className={styles.avatarCell}>
                    <Avatar>{user.userName.charAt(0).toUpperCase()}</Avatar>
                    <Typography className={styles.name}>
                      {user.userName}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="center">{user.email}</TableCell>
                <TableCell align="center">{user.phone}</TableCell>
                <TableCell align="center">{user.role}</TableCell>
                <TableCell align="center">
                  {moment(user.createdAt).format("DD/MM/YYYY")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
        <Pagination
          count={pageCount}
          page={currentPage}
          onChange={handlePageChange}
          color="primary"
          shape="rounded"
        />
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Xác nhận xoá</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xoá người dùng này không?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Xoá
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserPage;
