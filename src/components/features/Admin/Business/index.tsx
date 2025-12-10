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
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import { useEffect, useState, useMemo } from "react";
import moment from "moment";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { fetchUsers, deleteUser } from "@/redux/slices/userSlice";
import { fetchAllRestaurants } from "@/redux/slices/restaurantSlice";
import { User } from "@/types/user";
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
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 7;

  useEffect(() => {
    dispatch(fetchAllRestaurants());
    dispatch(fetchUsers());
  }, [dispatch]);

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
    <Box sx={{p: 3, pt: 0 }}>
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

      <Box sx={{ mb: 3, maxWidth: 400 }}>
        <TextField
          fullWidth
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
        />
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center">{t("col_delete")}</TableCell>
              <TableCell align="left">{t("col_username")}</TableCell>
              <TableCell align="center">{t("col_email")}</TableCell>
              <TableCell align="center">{t("col_role")}</TableCell>
              <TableCell align="center">{t("col_restaurants")}</TableCell>
              <TableCell align="center">{t("col_created_at")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((user: ExtendedUser) => (
              <TableRow key={user.userId}>
                <TableCell align="center">
                  <Tooltip title={t("tooltip_delete")}>
                    <IconButton
                      onClick={() => {
                        setSelectedUserId(user.userId);
                        setOpenDialog(true);
                      }}
                      sx={{ color: (theme) => theme.palette.error.main }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
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
    </Box>
  );
};

export default BusinessUserPage;
