// Recipe Category Enum
export enum RecipeCategory {
  ThucAn = "ThucAn",
  NuocUong = "NuocUong",
  KhaiVi = "KhaiVi",
  MonChinh = "MonChinh",
  TrangMieng = "TrangMieng",
  AnVat = "AnVat",
  AnChay = "AnChay",
  MonNuong = "MonNuong",
  MonChienXao = "MonChienXao",
  MonLuocHap = "MonLuocHap",
  MonCanhSup = "MonCanhSup",
  MonCuonGoi = "MonCuonGoi",
  BanhNgot = "BanhNgot",
  BanhMan = "BanhMan",
  MonChoBe = "MonChoBe",
  MonAnKieng = "MonAnKieng",
  MonTruyenThong = "MonTruyenThong",
  MonTheoMua = "MonTheoMua",
  MonQuocTe = "MonQuocTe",
}

// Category Display Names (Vietnamese)
export const RecipeCategoryDisplayNames: Record<RecipeCategory, string> = {
  [RecipeCategory.ThucAn]: "Thức ăn",
  [RecipeCategory.NuocUong]: "Nước uống",
  [RecipeCategory.KhaiVi]: "Món khai vị",
  [RecipeCategory.MonChinh]: "Món chính",
  [RecipeCategory.TrangMieng]: "Món tráng miệng",
  [RecipeCategory.AnVat]: "Ăn vặt",
  [RecipeCategory.AnChay]: "Ăn chay",
  [RecipeCategory.MonNuong]: "Món nướng",
  [RecipeCategory.MonChienXao]: "Món chiên/xào",
  [RecipeCategory.MonLuocHap]: "Món luộc/hấp",
  [RecipeCategory.MonCanhSup]: "Món canh/súp",
  [RecipeCategory.MonCuonGoi]: "Món cuốn/gỏi",
  [RecipeCategory.BanhNgot]: "Bánh ngọt",
  [RecipeCategory.BanhMan]: "Bánh mặn",
  [RecipeCategory.MonChoBe]: "Món cho bé",
  [RecipeCategory.MonAnKieng]: "Món ăn kiêng/healthy",
  [RecipeCategory.MonTruyenThong]: "Món truyền thống",
  [RecipeCategory.MonTheoMua]: "Món theo mùa",
  [RecipeCategory.MonQuocTe]: "Món quốc tế",
};

// User for Recipe DTO
export interface UserForRecipe {
  id: number;
  userName: string;
  phone: string;
}

// Recipe DTO
export interface Recipe {
  id: number;
  title: string;
  category: string;
  description: string;
  ingredients: string;
  steps: string;
  createdAt: string | Date;
  image: string;
  imageUrl: string;
  user: UserForRecipe;
}

// Recipe Review DTO
export interface RecipeReview {
  id: number;
  userId: number;
  userName?: string;
  recipeId: number;
  title?: string;
  rating: number;
  comment: string;
  createdAt: string | Date;
}

// Recipe Create/Update Request
export interface RecipeRequest {
  userId: number;
  title: string;
  category: RecipeCategory | string;
  description?: string;
  ingredients: string;
  steps: string;
  image?: File | string;
}

// Recipe Review Request
export interface RecipeReviewRequest {
  userId: number;
  recipeId: number;
  rating: number;
  comment?: string;
}

// Recipe Response with Reviews
export interface RecipeWithReviews extends Recipe {
  recipeReviews: RecipeReview[];
  averageRating?: number;
  totalReviews?: number;
}

// Recipe Filter/Search Options
export interface RecipeFilterOptions {
  userId?: number;
  category?: RecipeCategory | string;
  searchTerm?: string;
  sortBy?: "createdAt" | "rating" | "title";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

// Recipe API Response
export interface RecipeApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

// Paginated Recipe Response
export interface PaginatedRecipeResponse {
  recipes: Recipe[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
