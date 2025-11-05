"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { toast } from "react-toastify";
import {
  fetchRecipesByUser,
  addRecipe,
  updateRecipe,
  deleteRecipe,
} from "@/redux/slices/recipesSlice";
import {
  RecipeCategory,
  RecipeCategoryDisplayNames,
  Recipe,
  RecipeRequest,
} from "@/types/recipes";
import { getAccessToken } from "@/lib/utils/tokenHelper";
import axiosInstance from "@/lib/axios/axiosInstance";

const RecipesLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items: recipes, loading } = useAppSelector((s) => s.recipes);
  const userFromRedux = useAppSelector((s) => s.user.user);

  // Compute stable effectiveUserId (prefers Redux user, fallback to localStorage)
  const effectiveUserId = React.useMemo<number | null>(() => {
    if (userFromRedux && typeof userFromRedux === "object") {
      const cast = userFromRedux as { userId?: number; id?: number };
      const id = cast.userId ?? cast.id;
      return typeof id === "number" ? id : null;
    }
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        const id = parsed?.userId ?? parsed?.id;
        return typeof id === "number" ? id : null;
      }
    } catch {
      // ignore
    }
    return null;
  }, [userFromRedux]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Recipe | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<RecipeCategory | string>(
    RecipeCategory.ThucAn
  );
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      try {
        axiosInstance.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${token}`;
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (effectiveUserId && typeof effectiveUserId === "number") {
      dispatch(fetchRecipesByUser(effectiveUserId));
    }
  }, [effectiveUserId, dispatch]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const openForCreate = () => {
    setEditing(null);
    setTitle("");
    setCategory(RecipeCategory.ThucAn);
    setDescription("");
    setIngredients("");
    setSteps("");
    setFile(null);
    setPreview(null);
    setOpen(true);
  };

  const openForEdit = (r: Recipe) => {
    setEditing(r);
    setTitle(r.title || "");
    setCategory(r.category || RecipeCategory.ThucAn);
    setDescription(r.description || "");
    setIngredients(r.ingredients || "");
    setSteps(r.steps || "");
    setFile(null);
    setPreview(r.imageUrl || null);
    setOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async () => {
    if (!effectiveUserId || typeof effectiveUserId !== "number")
      return toast.error("Thiếu thông tin người dùng");
    if (!title.trim() || !ingredients.trim() || !steps.trim())
      return toast.warning(
        "Vui lòng điền đầy đủ tiêu đề, nguyên liệu và các bước"
      );
    if (!editing && !file)
      return toast.warning("Vui lòng tải ảnh cho công thức");

    const payload: RecipeRequest = {
      userId: effectiveUserId,
      title: title.trim(),
      category,
      description: description.trim(),
      ingredients: ingredients.trim(),
      steps: steps.trim(),
      image: file ?? undefined,
    };

    try {
      if (editing) {
        await dispatch(updateRecipe({ id: editing.id, payload })).unwrap();
        toast.success("Cập nhật công thức thành công");
      } else {
        await dispatch(addRecipe(payload)).unwrap();
        toast.success("Tạo công thức thành công");
      }
      setOpen(false);
      // reload
      dispatch(fetchRecipesByUser(effectiveUserId));
    } catch (error: unknown) {
      let msg = "Thao tác thất bại";
      if (error && typeof error === "object" && "message" in error)
        msg = (error as { message?: string }).message ?? msg;
      console.error(error);
      toast.error(msg);
    }
  };

  const handleDelete = async (id: number) => {
    if (!effectiveUserId || typeof effectiveUserId !== "number") return;
    if (!confirm("Bạn có chắc muốn xóa công thức này?")) return;
    try {
      await dispatch(deleteRecipe(id)).unwrap();
      toast.success("Xóa công thức thành công");
      dispatch(fetchRecipesByUser(effectiveUserId));
    } catch (error: unknown) {
      console.error(error);
      toast.error("Xóa thất bại");
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Card>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6">Công thức của tôi</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openForCreate}
            >
              Tạo công thức
            </Button>
          </Box>

          {loading ? (
            <CircularProgress />
          ) : (
            <Box sx={{ display: "grid", gap: 2 }}>
              {recipes.length === 0 && (
                <Typography>Chưa có công thức nào</Typography>
              )}
              {recipes.map((r) => (
                <Card key={r.id} variant="outlined">
                  <CardContent
                    sx={{ display: "flex", gap: 2, alignItems: "center" }}
                  >
                    <Box
                      sx={{
                        width: 120,
                        height: 90,
                        flex: "0 0 120px",
                        bg: "#f5f5f5",
                      }}
                    >
                      {r.imageUrl ? (
                        // simple img tag to avoid Next/Image layout issues
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.imageUrl}
                          alt={r.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: "100%",
                            height: "100%",
                            background: "#eee",
                          }}
                        />
                      )}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1">{r.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {RecipeCategoryDisplayNames[
                          r.category as RecipeCategory
                        ] ?? r.category}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {r.description}
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton onClick={() => openForEdit(r)} title="Sửa">
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(r.id)}
                        title="Xóa"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>
          {editing ? "Cập nhật công thức" : "Tạo công thức"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "grid", gap: 2, mt: 1 }}>
            <TextField
              label="Tiêu đề"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
            />
            <TextField
              select
              label="Danh mục"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {Object.values(RecipeCategory).map((c) => (
                <MenuItem key={c} value={c}>
                  {RecipeCategoryDisplayNames[c as RecipeCategory] ?? c}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Mô tả"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Nguyên liệu"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              label="Các bước"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              fullWidth
              multiline
              rows={4}
            />

            <Box>
              <input type="file" accept="image/*" onChange={handleFileChange} />
              {preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="preview"
                  style={{ marginTop: 8, maxWidth: "100%", maxHeight: 240 }}
                />
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Hủy</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editing ? "Cập nhật" : "Tạo"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RecipesLayout;
