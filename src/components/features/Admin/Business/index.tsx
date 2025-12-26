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
  CircularProgress,
  Tooltip,
  Switch,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import { useEffect, useState, useMemo } from "react";
import moment from "moment";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import {
  fetchUsers,
  deleteUser,
  updateUser,
  createUser,
} from "@/redux/slices/userSlice";
import { fetchAllRestaurants } from "@/redux/slices/restaurantSlice";
import { User, CreateUserDto } from "@/types/user";
import { useTranslations } from "next-intl";

interface ExtendedUser extends User {
  restaurants?: string;
}

const BusinessUserPage = () => {
  const dispatch = useAppDispatch();
  const { users, loading, error } = useAppSelector((state) => state.user);
  const { restaurants, allRestaurants } = useAppSelector(
    (state) => state.restaurant
  );

  const t = useTranslations("adminBusiness");

  const [search, setSearch] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState<CreateUserDto>({
    role: "business",
    userName: "",
    userPassword: "",
    email: "",
    phone: "",
    address: "",
    isActive: true,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 7;
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<ExtendedUser | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    dispatch(fetchAllRestaurants());
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleCreateUser = async () => {
    if (!newUser.userName || !newUser.email || !newUser.userPassword) {
      toast.error(t("validation_required_fields"));
      return;
    }
    try {
      setCreating(true);
      await dispatch(createUser(newUser)).unwrap();
      toast.success(t("create_success"));
      setOpenCreateDialog(false);
      setNewUser({
        role: "business",
        userName: "",
        userPassword: "",
        email: "",
        phone: "",
        address: "",
        isActive: true,
      });
      await dispatch(fetchUsers());
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message || t("create_failed"));
      else toast.error(t("create_failed"));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUserId) return;
    try {
      await dispatch(deleteUser(selectedUserId)).unwrap();
      toast.success(t("delete_success"));
      setOpenDialog(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || t("delete_failed"));
      } else {
        toast.error(t("delete_failed"));
      }
    }
  };

  const businessUsers: ExtendedUser[] = useMemo(() => {
    return users
      .filter((u) => u.role === "business")
      .map((user) => {
        const source =
          Array.isArray(allRestaurants) && allRestaurants.length > 0
            ? allRestaurants
            : restaurants;
        const userRestaurants = source
          .filter((r) => r.ownerId === user.userId)
          .map((r) => r.name)
          .join(", ");
        return { ...user, restaurants: userRestaurants || t("no_restaurants") };
      });
  }, [users, restaurants, allRestaurants, t]);

  const filteredData = businessUsers.filter(
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

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "70vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, pt: 0 }}>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 600,
          mb: 3,
          color: (theme) => theme.palette.text.primary,
        }}
      >
        {t("title")}
      </Typography>

      <Box
        sx={{
          mb: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <TextField
          label={t("search_label")}
          variant="outlined"
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
          sx={{ width: "60%" }}
        />

        <Box sx={{ display: "flex", justifyContent: "flex-end", width: "40%" }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateDialog(true)}
          >
            {t("btn_create")}
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="left">{t("col_username")}</TableCell>
              <TableCell align="center">{t("col_email")}</TableCell>
              <TableCell align="center">{t("col_role")}</TableCell>
              <TableCell align="center">{t("col_restaurants")}</TableCell>
              <TableCell align="center">{t("col_status")}</TableCell>
              <TableCell align="center">{t("col_created_at")}</TableCell>
              {/* <TableCell align="center">{t("col_delete")}</TableCell> */}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((user: ExtendedUser) => (
              <TableRow key={user.userId}>
                <TableCell align="left">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar>{user.userName.charAt(0).toUpperCase()}</Avatar>
                    <Typography>{user.userName}</Typography>
                  </Box>
                </TableCell>
                <TableCell align="center">{user.email}</TableCell>
                <TableCell align="center">{user.role}</TableCell>
                <TableCell align="center">{user.restaurants}</TableCell>
                <TableCell align="center">
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Switch
                      checked={user.isActive ?? true}
                      color="primary"
                      size="small"
                      disabled
                    />
                  </Box>
                </TableCell>
                <TableCell align="center">
                  {moment(user.createdAt).format("DD/MM/YYYY")}
                </TableCell>
                <TableCell align="center">
                  <Box
                    sx={{ display: "flex", gap: 1, justifyContent: "center" }}
                  >
                    <IconButton
                      onClick={() => {
                        setEditingUser(user);
                        setOpenEditDialog(true);
                      }}
                      sx={{ color: "#5E6C84" }}
                    >
                      <EditIcon />
                    </IconButton>
                    <Tooltip title={t("tooltip_delete")}>
                      <IconButton
                        onClick={() => {
                          setSelectedUserId(user.userId);
                          setOpenDialog(true);
                        }}
                        sx={{ color: "#5E6C84" }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
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
        <DialogTitle>{t("confirm_title")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t("confirm_text")}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>{t("cancel")}</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            {t("delete_btn")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{t("create_dialog_title")}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={t("form.name")}
            margin="normal"
            value={newUser.userName}
            onChange={(e) =>
              setNewUser({ ...newUser, userName: e.target.value })
            }
          />
          <TextField
            fullWidth
            label={t("form.email")}
            margin="normal"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          />
          <TextField
            fullWidth
            label={t("form.password")}
            type="password"
            margin="normal"
            value={newUser.userPassword}
            onChange={(e) =>
              setNewUser({ ...newUser, userPassword: e.target.value })
            }
          />
          <TextField
            fullWidth
            label={t("form.phone")}
            margin="normal"
            value={newUser.phone}
            onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
          />
          <TextField
            fullWidth
            label={t("form.address")}
            margin="normal"
            value={newUser.address}
            onChange={(e) =>
              setNewUser({ ...newUser, address: e.target.value })
            }
          />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label={t("form.role")}
              margin="normal"
              value={newUser.role}
              disabled
            />
            <FormControl fullWidth>
              <InputLabel id="create-status-label">
                {t("form.status")}
              </InputLabel>
              <Select
                labelId="create-status-label"
                label={t("form.status")}
                value={newUser.isActive ? "active" : "inactive"}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    isActive: String(e.target.value) === "active",
                  })
                }
              >
                <MenuItem value="active">{t("status_active")}</MenuItem>
                <MenuItem value="inactive">{t("status_inactive")}</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleCreateUser}
            variant="contained"
            disabled={creating}
          >
            {creating ? t("create_loading") : t("create_submit")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{t("edit_dialog_title")}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={t("form.name")}
            margin="normal"
            value={editingUser?.userName ?? ""}
            onChange={(e) =>
              setEditingUser((prev) =>
                prev ? { ...prev, userName: e.target.value } : prev
              )
            }
          />
          <TextField
            fullWidth
            label={t("form.email")}
            margin="normal"
            value={editingUser?.email ?? ""}
            onChange={(e) =>
              setEditingUser((prev) =>
                prev ? { ...prev, email: e.target.value } : prev
              )
            }
          />
          <TextField
            fullWidth
            label={t("form.phone")}
            margin="normal"
            value={editingUser?.phone ?? ""}
            onChange={(e) =>
              setEditingUser((prev) =>
                prev ? { ...prev, phone: e.target.value } : prev
              )
            }
          />
          <TextField
            fullWidth
            label={t("form.address")}
            margin="normal"
            value={editingUser?.address ?? ""}
            onChange={(e) =>
              setEditingUser((prev) =>
                prev ? { ...prev, address: e.target.value } : prev
              )
            }
          />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label={t("form.role")}
              margin="normal"
              value={editingUser?.role ?? "business"}
              disabled
            />
            <FormControl fullWidth>
              <InputLabel id="edit-status-label">{t("form.status")}</InputLabel>
              <Select
                labelId="edit-status-label"
                label={t("form.status")}
                value={editingUser?.isActive ? "active" : "inactive"}
                onChange={(e) =>
                  setEditingUser((prev) =>
                    prev
                      ? {
                          ...prev,
                          isActive: String(e.target.value) === "active",
                        }
                      : prev
                  )
                }
              >
                <MenuItem value="active">{t("status_active")}</MenuItem>
                <MenuItem value="inactive">{t("status_inactive")}</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>
            {t("cancel")}
          </Button>
          <Button
            onClick={async () => {
              if (!editingUser) return;
              try {
                setEditing(true);
                await dispatch(
                  updateUser({
                    userId: editingUser.userId,
                    userName: editingUser.userName,
                    email: editingUser.email,
                    phone: editingUser.phone,
                    address: editingUser.address,
                    role: editingUser.role,
                    isActive: editingUser.isActive,
                  })
                ).unwrap();
                toast.success(t("edit_success"));
                setOpenEditDialog(false);
                setEditingUser(null);
                await dispatch(fetchUsers());
              } catch (err: unknown) {
                if (err instanceof Error)
                  toast.error(err.message || t("edit_failed"));
                else toast.error(t("edit_failed"));
              } finally {
                setEditing(false);
              }
            }}
            variant="contained"
            disabled={editing}
          >
            {editing ? t("edit_loading") : t("edit_submit")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BusinessUserPage;
