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

export interface UserForRecipe {
  id: number;
  userName: string;
  phone: string;
}

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

export interface RecipeRequest {
  userId: number;
  title: string;
  category: RecipeCategory | string;
  description?: string;
  ingredients: string;
  steps: string;
  image?: File | string;
}

export interface RecipeReviewRequest {
  userId: number;
  recipeId: number;
  rating: number;
  comment?: string;
}

export interface RecipeWithReviews extends Recipe {
  recipeReviews: RecipeReview[];
  averageRating?: number;
  totalReviews?: number;
}

export interface RecipeFilterOptions {
  userId?: number;
  category?: RecipeCategory | string;
  searchTerm?: string;
  sortBy?: "createdAt" | "rating" | "title";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface RecipeApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

export interface PaginatedRecipeResponse {
  recipes: Recipe[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
