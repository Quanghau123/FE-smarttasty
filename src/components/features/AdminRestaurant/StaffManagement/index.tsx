"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  TableContainer,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  type AlertColor,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { User } from "@/types/user";
import {
  fetchStaffsByBusiness,
  createStaff,
  updateStaff,
  deleteStaff,
} from "@/redux/slices/staffSlice";

export default function StaffManagement() {
  const dispatch = useAppDispatch();
  const { staffs, loading, error } = useAppSelector((s) => s.staff);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({
    userName: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    role: "staff",
  });
  type SnackState = { open: boolean; message: string; severity: AlertColor };
  const [snack, setSnack] = useState<SnackState>({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    dispatch(fetchStaffsByBusiness());
  }, [dispatch]);

  useEffect(() => {
    if (error) setSnack({ open: true, message: error, severity: "error" });
  }, [error]);

  const handleOpenCreate = () => {
    setEditing(null);
    setForm({
      userName: "",
      email: "",
      phone: "",
      address: "",
      password: "",
      role: "staff",
    });
    setOpen(true);
  };

  const handleEdit = (s: User) => {
    setEditing(s);
    setForm({
      userName: s.userName || "",
      email: s.email || "",
      phone: s.phone || "",
      address: s.address || "",
      password: "",
      role: s.role || "staff",
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editing) {
        await dispatch(
          updateStaff({
            userId: editing.userId,
            userName: form.userName,
            email: form.email,
            phone: form.phone,
            address: form.address,
          })
        ).unwrap();
        setSnack({
          open: true,
          message: "Cập nhật thành công",
          severity: "success",
        });
      } else {
        await dispatch(
          createStaff({
            userName: form.userName,
            email: form.email,
            phone: form.phone,
            address: form.address,
            password: form.password,
          })
        ).unwrap();
        setSnack({
          open: true,
          message: "Tạo nhân viên thành công",
          severity: "success",
        });
      }
      setOpen(false);
      dispatch(fetchStaffsByBusiness());
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setSnack({ open: true, message: msg || "Lỗi", severity: "error" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa nhân viên này?")) return;
    try {
      await dispatch(deleteStaff(id)).unwrap();
      setSnack({ open: true, message: "Xóa thành công", severity: "success" });
      dispatch(fetchStaffsByBusiness());
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setSnack({
        open: true,
        message: msg || "Xóa thất bại",
        severity: "error",
      });
    }
  };

  return (
    <Container maxWidth="lg" sx={{ pt: 0, pb: 3 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        sx={{
          flexDirection: { xs: "column", sm: "row" },
          gap: { xs: 1, sm: 0 },
        }}
      >
        <Typography variant="h5">Quản lý tài khoản con</Typography>
        <Button
          variant="contained"
          onClick={handleOpenCreate}
          sx={{
            mt: { xs: 1, sm: 0 },
            alignSelf: { xs: "stretch", sm: "auto" },
          }}
        >
          Tạo tài khoản
        </Button>
      </Box>

      <Paper variant="outlined" sx={{ p: { xs: 1, sm: 2 } }}>
        {loading ? (
          <Box display="flex" alignItems="center" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Tên</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {staffs.map((s: User) => (
                  <TableRow key={s.userId}>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {s.userId}
                    </TableCell>
                    <TableCell>{s.userName}</TableCell>
                    <TableCell
                      sx={{
                        maxWidth: 240,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {s.email}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {s.phone}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleEdit(s)}
                        aria-label="edit"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(s.userId)}
                        aria-label="delete"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editing ? "Cập nhật nhân viên" : "Tạo nhân viên"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Tên"
              value={form.userName}
              onChange={(e) => setForm({ ...form, userName: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              fullWidth
            />
            <TextField
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              fullWidth
            />
            <TextField
              label="Địa chỉ"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              fullWidth
            />
            {!editing && (
              <TextField
                label="Mật khẩu (mặc định nếu bỏ trống sẽ được tạo tự động)"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                fullWidth
              />
            )}
            {/* <FormControl>
              <InputLabel>Vai trò</InputLabel>
              <Select
                value={form.role}
                label="Vai trò"
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value as string })
                }
              >
                <MenuItem value="staff">Staff</MenuItem>
                <MenuItem value="delivery">Giao hàng</MenuItem>
              </Select>
            </FormControl> */}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editing ? "Cập nhật" : "Tạo"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack({ ...snack, open: false })}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
