"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Fade,
  IconButton,
  InputAdornment,
  MenuItem,
  Rating,
  Stack,
  TextField,
  Typography,
  CircularProgress,
  Avatar,
  Tabs,
  Tab,
  alpha,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Restaurant as RestaurantIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Star as StarIcon,
  Close as CloseIcon,
  Send as SendIcon,
  RestaurantMenu as MenuIcon,
} from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import Pagination from "@/components/commons/pagination";
import { toast } from "react-toastify";
import {
  fetchRecipesByUser,
  fetchAllRecipes,
  addRecipe,
  updateRecipe,
  deleteRecipe,
} from "@/redux/slices/recipesSlice";
import {
  fetchRecipeReviews,
  createRecipeReview,
  deleteRecipeReview,
} from "@/redux/slices/recipeReviewsSlice";
import {
  RecipeCategory,
  RecipeCategoryDisplayNames,
  Recipe,
  RecipeRequest,
  RecipeReview,
  RecipeReviewRequest,
} from "@/types/recipes";
import { getAccessToken } from "@/lib/utils/tokenHelper";
import axiosInstance from "@/lib/axios/axiosInstance";

const RecipesLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    items: myRecipes,
    allItems,
    loading,
    totalRecords: recipesTotal = 0,
  } = useAppSelector((s) => s.recipes);
  const { reviews: allReviews } = useAppSelector((s) => s.recipeReviews);
  const userFromRedux = useAppSelector((s) => s.user.user);

  // Compute stable effectiveUserId
  const effectiveUserId = useMemo<number | null>(() => {
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

  // State
  const [tabValue, setTabValue] = useState(0); // 0: All Recipes, 1: My Recipes
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Recipe | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<RecipeCategory | string>(
    RecipeCategory.ThucAn
  );
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Review state
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState("");

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

  // Local pagination state for the All Recipes tab
  const [page, setPage] = useState<number>(1);
  const pageSize = 12;
  // Local pagination state for My Recipes tab (client-side)
  const [myRecipesPage, setMyRecipesPage] = useState<number>(1);

  // Fetch reviews once on mount
  useEffect(() => {
    dispatch(fetchRecipeReviews());
  }, [dispatch]);

  // Fetch all recipes when page changes
  useEffect(() => {
    dispatch(fetchAllRecipes({ pageNumber: page, pageSize }));
  }, [page, dispatch]);

  // Fetch user's recipes when userId is available
  useEffect(() => {
    if (effectiveUserId && typeof effectiveUserId === "number") {
      dispatch(fetchRecipesByUser(effectiveUserId));
    }
  }, [effectiveUserId, dispatch]);

  // Reset page when filters or tab change
  useEffect(() => {
    setPage(1);
    setMyRecipesPage(1);
  }, [tabValue, searchQuery, categoryFilter]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // Filtered recipes with pagination
  const displayedRecipes = useMemo(() => {
    const source = tabValue === 0 ? allItems || [] : myRecipes;
    let filtered = source;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.ingredients?.toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((r) => r.category === categoryFilter);
    }

    // For My Recipes tab (client-side pagination)
    if (tabValue === 1) {
      const startIndex = (myRecipesPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      return filtered.slice(startIndex, endIndex);
    }

    return filtered;
  }, [
    tabValue,
    allItems,
    myRecipes,
    searchQuery,
    categoryFilter,
    myRecipesPage,
  ]);

  // Recipe reviews grouped by recipeId
  const reviewsByRecipe = useMemo(() => {
    const map = new Map<number, RecipeReview[]>();
    allReviews.forEach((rev) => {
      const existing = map.get(rev.recipeId) || [];
      existing.push(rev);
      map.set(rev.recipeId, existing);
    });
    return map;
  }, [allReviews]);

  const getRecipeReviews = (recipeId: number) =>
    reviewsByRecipe.get(recipeId) || [];

  const getAverageRating = (recipeId: number) => {
    const reviews = getRecipeReviews(recipeId);
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / reviews.length;
  };

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
      // refresh current page
      dispatch(fetchAllRecipes({ pageNumber: page, pageSize }));
      if (effectiveUserId) dispatch(fetchRecipesByUser(effectiveUserId));
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
      // refresh current page
      dispatch(fetchAllRecipes({ pageNumber: page, pageSize }));
      dispatch(fetchRecipesByUser(effectiveUserId));
    } catch (error: unknown) {
      console.error(error);
      toast.error("Xóa thất bại");
    }
  };

  const handlePageChange = (newPage: number) => {
    if (tabValue === 0) {
      setPage(newPage);
    } else {
      setMyRecipesPage(newPage);
    }
  };

  const openDetail = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setDetailOpen(true);
    setReviewRating(5);
    setReviewComment("");
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedRecipe(null);
  };

  const handleSubmitReview = async () => {
    if (!effectiveUserId || !selectedRecipe)
      return toast.error("Thiếu thông tin");
    if (!reviewComment.trim()) return toast.warning("Vui lòng nhập đánh giá");

    const payload: RecipeReviewRequest = {
      userId: effectiveUserId,
      recipeId: selectedRecipe.id,
      rating: reviewRating,
      comment: reviewComment.trim(),
    };

    try {
      await dispatch(createRecipeReview(payload)).unwrap();
      toast.success("Gửi đánh giá thành công");
      setReviewRating(5);
      setReviewComment("");
      dispatch(fetchRecipeReviews());
    } catch (error: unknown) {
      console.error(error);
      toast.error("Gửi đánh giá thất bại");
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm("Xóa đánh giá này?")) return;
    try {
      await dispatch(deleteRecipeReview(reviewId)).unwrap();
      toast.success("Xóa đánh giá thành công");
      dispatch(fetchRecipeReviews());
    } catch (error: unknown) {
      console.error(error);
      toast.error("Xóa đánh giá thất bại");
    }
  };

  const isMyRecipe = (recipe: Recipe) => {
    if (!effectiveUserId) return false;
    // Check both user.id and user.userId for compatibility
    const user = recipe.user as { id?: number; userId?: number } | undefined;
    const recipeUserId = user?.userId || user?.id;
    return recipeUserId === effectiveUserId;
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Hero Section */}
      <Box
        className="recipes-hero"
        sx={{
          py: 8,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          <Stack spacing={3} alignItems="center" textAlign="center">
            <RestaurantIcon sx={{ fontSize: 64 }} />
            <Typography
              variant="h2"
              fontWeight="bold"
              sx={{ textShadow: "2px 2px 4px rgba(0,0,0,0.2)" }}
            >
              Kho Công Thức Nấu Ăn
            </Typography>
            <Typography variant="h6" sx={{ maxWidth: 700, opacity: 0.95 }}>
              Khám phá và chia sẻ những công thức nấu ăn tuyệt vời từ cộng đồng.
              Từ món ăn truyền thống đến sáng tạo hiện đại.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={openForCreate}
              sx={{
                bgcolor: "white",
                color: "var(--recipes-primary)",
                px: 4,
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: "bold",
                "&:hover": {
                  bgcolor: alpha("#ffffff", 0.9),
                  transform: "translateY(-2px)",
                  boxShadow: 6,
                },
                transition: "all 0.3s ease",
              }}
            >
              Tạo Công Thức Mới
            </Button>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: -4, position: "relative", zIndex: 2 }}>
        {/* Search & Filter Card */}
        <Card
          elevation={6}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 3,
            background: (theme) =>
              `linear-gradient(135deg, ${alpha(
                theme.palette.background.paper,
                0.95
              )} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`,
            backdropFilter: "blur(10px)",
          }}
        >
          <Stack spacing={3}>
            <Tabs
              value={tabValue}
              onChange={(_, v) => setTabValue(v)}
              variant="fullWidth"
              sx={{
                bgcolor: "var(--recipes-primary-rgba)",
                borderRadius: 2,
                p: 0.5,
                color: "text.primary",
                "& .MuiTab-root": {
                  fontWeight: "bold",
                  textTransform: "none",
                  fontSize: "1rem",
                  borderRadius: 1.5,
                  color: "inherit",
                },
                // active tab label and icon
                "& .MuiTab-root.Mui-selected": {
                  color: "var(--recipes-primary) !important",
                },
                // indicator color
                "& .MuiTabs-indicator": {
                  backgroundColor: "var(--recipes-primary)",
                },
                // make sure icon inside tab inherits color
                "& .MuiTab-iconWrapper": {
                  color: "inherit",
                },
              }}
            >
              <Tab
                label="Tất Cả Công Thức"
                icon={<MenuIcon />}
                iconPosition="start"
              />
              <Tab
                label="Công Thức Của Tôi"
                icon={<PersonIcon />}
                iconPosition="start"
              />
            </Tabs>

            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", md: "7fr 5fr" },
                alignItems: "center",
              }}
            >
              <Box>
                <TextField
                  fullWidth
                  placeholder="Tìm kiếm công thức..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: "var(--recipes-primary)" }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 3,
                      bgcolor: "background.paper",
                    },
                  }}
                />
              </Box>
              <Box>
                <TextField
                  select
                  fullWidth
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FilterIcon sx={{ color: "var(--recipes-primary)" }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 3,
                      bgcolor: "background.paper",
                    },
                  }}
                >
                  <MenuItem value="all">Tất cả danh mục</MenuItem>
                  {Object.values(RecipeCategory).map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {RecipeCategoryDisplayNames[cat as RecipeCategory] ?? cat}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>
          </Stack>
        </Card>

        {/* Recipes Grid */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress size={60} />
          </Box>
        ) : displayedRecipes.length === 0 ? (
          <Card sx={{ p: 6, textAlign: "center", borderRadius: 3 }}>
            <RestaurantIcon
              sx={{ fontSize: 80, color: "text.secondary", mb: 2 }}
            />
            <Typography variant="h5" color="text.secondary" gutterBottom>
              Không tìm thấy công thức nào
            </Typography>
            <Typography color="text.secondary">
              {tabValue === 1
                ? "Bạn chưa tạo công thức nào. Hãy bắt đầu chia sẻ công thức của bạn!"
                : "Thử tìm kiếm với từ khóa khác hoặc thay đổi bộ lọc"}
            </Typography>
          </Card>
        ) : (
          <Box
            sx={{
              display: "grid",
              gap: 2,
              pb: 6,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
              },
              alignItems: "stretch",
              justifyContent: "center",
            }}
          >
            {displayedRecipes.map((recipe) => {
              const avgRating = getAverageRating(recipe.id);
              const reviewCount = getRecipeReviews(recipe.id).length;
              const isOwner = isMyRecipe(recipe);

              return (
                <Box key={recipe.id}>
                  <Fade in timeout={500}>
                    <Card
                      sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        borderRadius: 3,
                        overflow: "hidden",
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                        "&:hover": {
                          transform: "translateY(-8px)",
                          boxShadow: 12,
                        },
                      }}
                      onClick={() => openDetail(recipe)}
                    >
                      {/* Image container with img tag for proper image display */}
                      <Box
                        sx={{
                          height: 200,
                          width: "100%",
                          backgroundColor: "grey.200",
                          overflow: "hidden",
                          flexShrink: 0,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={recipe.imageUrl || "/placeholder-recipe.jpg"}
                          alt={recipe.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      </Box>
                      <CardContent
                        sx={{
                          flexGrow: 1,
                          position: "relative",
                          justifyContent: "space-between",
                        }}
                      >
                        {isOwner && (
                          <Chip
                            label="Của tôi"
                            size="small"
                            sx={{
                              position: "absolute",
                              top: 12,
                              right: 12,
                              fontWeight: "bold",
                              bgcolor: "var(--recipes-primary)",
                              color: "#ffffff",
                            }}
                          />
                        )}
                        <Typography
                          variant="h6"
                          gutterBottom
                          sx={{
                            fontWeight: "bold",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            // minHeight: 56,
                          }}
                        >
                          {recipe.title}
                        </Typography>

                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{ mb: 1.5 }}
                        >
                          <Chip
                            label={
                              RecipeCategoryDisplayNames[
                                recipe.category as RecipeCategory
                              ] ?? recipe.category
                            }
                            size="small"
                            sx={{ fontWeight: "500" }}
                          />
                        </Stack>

                        <Stack
                          direction="row"
                          spacing={0.5}
                          alignItems="center"
                          sx={{ mb: 1.5 }}
                        >
                          <Rating
                            value={avgRating}
                            precision={0.5}
                            size="small"
                            readOnly
                          />
                          <Typography variant="body2" color="text.secondary">
                            ({reviewCount})
                          </Typography>
                        </Stack>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            minHeight: 20,
                            width: "300px",
                          }}
                        >
                          {recipe.description || "Không có mô tả"}
                        </Typography>

                        <Divider sx={{ my: 1.5 }} />

                        <Stack direction="row" spacing={2} alignItems="center">
                          <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                          >
                            <PersonIcon
                              sx={{ fontSize: 16, color: "text.secondary" }}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {recipe.user?.userName || "Ẩn danh"}
                            </Typography>
                          </Stack>
                          <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                          >
                            <TimeIcon
                              sx={{ fontSize: 16, color: "text.secondary" }}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {new Date(recipe.createdAt).toLocaleDateString(
                                "vi-VN"
                              )}
                            </Typography>
                          </Stack>
                        </Stack>

                        {(tabValue === 1 || isOwner) && (
                          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<EditIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                openForEdit(recipe);
                              }}
                              fullWidth
                            >
                              Sửa
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<DeleteIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(recipe.id);
                              }}
                              fullWidth
                            >
                              Xóa
                            </Button>
                          </Stack>
                        )}
                      </CardContent>
                    </Card>
                  </Fade>
                </Box>
              );
            })}
          </Box>
        )}

        {/* Pagination */}
        {!loading && displayedRecipes.length > 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 3, pb: 4 }}>
            {tabValue === 0 ? (
              // Server-side pagination for All Recipes
              <Pagination
                page={page}
                onPageChange={handlePageChange}
                totalRecords={recipesTotal}
                pageSize={pageSize}
                size="medium"
              />
            ) : (
              // Client-side pagination for My Recipes
              (() => {
                // Calculate total filtered my recipes before pagination
                const source = myRecipes;
                let filtered = source;

                if (searchQuery.trim()) {
                  const q = searchQuery.toLowerCase();
                  filtered = filtered.filter(
                    (r) =>
                      r.title.toLowerCase().includes(q) ||
                      r.description?.toLowerCase().includes(q) ||
                      r.ingredients?.toLowerCase().includes(q)
                  );
                }

                if (categoryFilter !== "all") {
                  filtered = filtered.filter(
                    (r) => r.category === categoryFilter
                  );
                }

                const totalMyRecords = filtered.length;

                return totalMyRecords > pageSize ? (
                  <Pagination
                    page={myRecipesPage}
                    onPageChange={handlePageChange}
                    totalRecords={totalMyRecords}
                    pageSize={pageSize}
                    size="medium"
                  />
                ) : null;
              })()
            )}
          </Box>
        )}
      </Container>

      {/* Create/Edit Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: "bold", fontSize: "1.5rem" }}>
          {editing ? "Cập nhật công thức" : "Tạo công thức mới"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Tiêu đề công thức"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              required
            />
            <TextField
              select
              label="Danh mục"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              {Object.values(RecipeCategory).map((c) => (
                <MenuItem key={c} value={c}>
                  {RecipeCategoryDisplayNames[c as RecipeCategory] ?? c}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Mô tả ngắn"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
              placeholder="Giới thiệu ngắn gọn về món ăn..."
            />
            <TextField
              label="Nguyên liệu"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              fullWidth
              multiline
              rows={4}
              required
              placeholder="Liệt kê các nguyên liệu cần thiết..."
            />
            <TextField
              label="Các bước thực hiện"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              fullWidth
              multiline
              rows={5}
              required
              placeholder="Bước 1: ...&#10;Bước 2: ..."
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                Ảnh món ăn {!editing && <span style={{ color: "red" }}>*</span>}
              </Typography>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ py: 1.5, borderRadius: 2 }}
              >
                Chọn ảnh
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleFileChange}
                />
              </Button>
              {preview && (
                <Box sx={{ mt: 2, textAlign: "center" }}>
                  <Box
                    sx={{
                      width: "100%",
                      height: 220,
                      borderRadius: 2,
                      overflow: "hidden",
                      mx: "auto",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt="preview"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </Box>
                </Box>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} size="large">
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            size="large"
            sx={{ px: 4 }}
          >
            {editing ? "Cập nhật" : "Tạo"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Recipe Detail Dialog */}
      <Dialog
        open={detailOpen}
        onClose={closeDetail}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 3, maxHeight: "90vh" } }}
      >
        {selectedRecipe && (
          <>
            <DialogTitle sx={{ p: 0, position: "relative" }}>
              <IconButton
                onClick={closeDetail}
                sx={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  bgcolor: "rgba(0,0,0,0.5)",
                  color: "white",
                  zIndex: 10,
                  "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                }}
              >
                <CloseIcon />
              </IconButton>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  height: { xs: "auto", sm: 300 },
                }}
              >
                {/* Image Section - 50% */}
                <Box
                  sx={{
                    width: { xs: "100%", sm: "50%" },
                    height: { xs: 250, sm: 300 },
                    position: "relative",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedRecipe.imageUrl || "/placeholder-recipe.jpg"}
                    alt={selectedRecipe.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </Box>

                {/* Title & Info Section - 50% */}
                <Box
                  sx={{
                    width: { xs: "100%", sm: "50%" },
                    height: { xs: "auto", sm: 300 },
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    p: 3,
                    bgcolor: "var(--recipes-primary-rgba)",
                    flexShrink: 0,
                  }}
                >
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    {selectedRecipe.title}
                  </Typography>

                  <Stack spacing={2}>
                    <Chip
                      label={
                        RecipeCategoryDisplayNames[
                          selectedRecipe.category as RecipeCategory
                        ] ?? selectedRecipe.category
                      }
                      sx={{
                        width: "fit-content",
                        fontWeight: "bold",
                        bgcolor: "var(--recipes-primary)",
                        color: "white",
                      }}
                    />

                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <PersonIcon
                        sx={{ fontSize: 18, color: "text.secondary" }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {selectedRecipe.user?.userName || "Ẩn danh"}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <TimeIcon
                        sx={{ fontSize: 18, color: "text.secondary" }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {new Date(selectedRecipe.createdAt).toLocaleDateString(
                          "vi-VN"
                        )}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
              </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
              <Stack spacing={3}>
                {/* Rating Summary */}
                <Card
                  sx={{
                    p: 2,
                    bgcolor: "var(--recipes-primary-rgba)",
                    borderRadius: 2,
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box textAlign="center">
                      <Typography
                        variant="h3"
                        fontWeight="bold"
                        sx={{ color: "var(--recipes-primary)" }}
                      >
                        {getAverageRating(selectedRecipe.id).toFixed(1)}
                      </Typography>
                      <Rating
                        value={getAverageRating(selectedRecipe.id)}
                        precision={0.5}
                        readOnly
                      />
                      <Typography variant="body2" color="text.secondary">
                        {getRecipeReviews(selectedRecipe.id).length} đánh giá
                      </Typography>
                    </Box>
                  </Stack>
                </Card>

                {selectedRecipe.description && (
                  <Box>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Mô tả
                    </Typography>
                    <Typography color="text.secondary">
                      {selectedRecipe.description}
                    </Typography>
                  </Box>
                )}

                <Box>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <RestaurantIcon sx={{ color: "var(--recipes-primary)" }} />{" "}
                    Nguyên liệu
                  </Typography>
                  <Typography sx={{ whiteSpace: "pre-line", pl: 2 }}>
                    {selectedRecipe.ingredients}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <MenuIcon sx={{ color: "var(--recipes-primary)" }} /> Các
                    bước thực hiện
                  </Typography>
                  <Typography sx={{ whiteSpace: "pre-line", pl: 2 }}>
                    {selectedRecipe.steps}
                  </Typography>
                </Box>

                <Divider />

                {/* Reviews Section */}
                <Box>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <StarIcon sx={{ color: "var(--recipes-primary)" }} /> Đánh
                    giá ({getRecipeReviews(selectedRecipe.id).length})
                  </Typography>

                  {/* Add Review */}
                  {effectiveUserId && (
                    <Card
                      sx={{
                        p: 2,
                        mb: 2,
                        bgcolor: "background.default",
                        borderRadius: 2,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        fontWeight="bold"
                        gutterBottom
                      >
                        Viết đánh giá của bạn
                      </Typography>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="body2" gutterBottom>
                            Đánh giá:
                          </Typography>
                          <Rating
                            value={reviewRating}
                            onChange={(_, v) => setReviewRating(v || 5)}
                            size="large"
                          />
                        </Box>
                        <TextField
                          placeholder="Chia sẻ cảm nhận của bạn về công thức này..."
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          multiline
                          rows={3}
                          fullWidth
                        />
                        <Button
                          variant="contained"
                          startIcon={<SendIcon />}
                          onClick={handleSubmitReview}
                          sx={{ alignSelf: "flex-end" }}
                        >
                          Gửi đánh giá
                        </Button>
                      </Stack>
                    </Card>
                  )}

                  {/* Review List */}
                  <Stack spacing={2}>
                    {getRecipeReviews(selectedRecipe.id).length === 0 ? (
                      <Typography
                        color="text.secondary"
                        textAlign="center"
                        sx={{ py: 3 }}
                      >
                        Chưa có đánh giá nào. Hãy là người đầu tiên!
                      </Typography>
                    ) : (
                      getRecipeReviews(selectedRecipe.id).map((review) => (
                        <Card key={review.id} sx={{ p: 2, borderRadius: 2 }}>
                          <Stack
                            direction="row"
                            spacing={2}
                            alignItems="flex-start"
                          >
                            <Avatar sx={{ bgcolor: "var(--recipes-primary)" }}>
                              {review.userName?.[0] || "U"}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Box>
                                  <Typography
                                    variant="subtitle2"
                                    fontWeight="bold"
                                  >
                                    {review.userName || "Ẩn danh"}
                                  </Typography>
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                  >
                                    <Rating
                                      value={review.rating}
                                      size="small"
                                      readOnly
                                    />
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {new Date(
                                        review.createdAt
                                      ).toLocaleDateString("vi-VN")}
                                    </Typography>
                                  </Stack>
                                </Box>
                                {review.userId === effectiveUserId && (
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() =>
                                      handleDeleteReview(review.id)
                                    }
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </Stack>
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                {review.comment}
                              </Typography>
                            </Box>
                          </Stack>
                        </Card>
                      ))
                    )}
                  </Stack>
                </Box>
              </Stack>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default RecipesLayout;
