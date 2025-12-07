import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import axiosInstance from "@/lib/axios/axiosInstance";
import { Recipe, RecipeRequest } from "@/types/recipes";

interface RecipesState {
	items: Recipe[];
	allItems?: Recipe[];
	loading: boolean;
	error: string | null;
	// Pagination metadata returned by backend PagedDto
	totalRecords?: number;
	pageNumber?: number;
	pageSize?: number;
	totalPages?: number;
}

const initialState: RecipesState = {
	items: [],
	loading: false,
	error: null,
};

// Helper lấy message từ error
const getErrorMessage = (err: unknown, fallback = "Lỗi không xác định"): string => {
	if (axios.isAxiosError(err)) {
		const responseData = err.response?.data as { message?: string; errMessage?: string } | undefined;
		return responseData?.message ?? responseData?.errMessage ?? fallback;
	}
	return fallback;
};

const normalizeRecipe = (r: Recipe): Recipe => ({
	...r,
	imageUrl: r.imageUrl || (r.image ? r.image : ""),
});

// ================== ASYNC ACTIONS ==================

export const fetchRecipesByUser = createAsyncThunk<
	{ items: Recipe[]; meta?: { totalRecords?: number; pageNumber?: number; pageSize?: number } },
	number,
	{ rejectValue: string }
>("recipes/fetchByUser", async (userId, { rejectWithValue }) => {
	try {
		const res = await axiosInstance.get(`/api/Recipes/user/${userId}`);
		// Backend may return either `data` or `Data` (depending on serializer).
		const body = res.data ?? {};
		const payload = body.data ?? body.Data ?? body;

		// payload may be a paged object: { Data: [...], TotalRecords, PageNumber, PageSize }
		const dataList = payload && (payload.Data || payload.data) ? (payload.Data ?? payload.data) : null;
		const list = Array.isArray(dataList) ? dataList : Array.isArray(payload) ? payload : [];
		const items = list.map(normalizeRecipe);
		const meta = {
			totalRecords: payload?.TotalRecords ?? payload?.totalRecords ?? payload?.total ?? undefined,
			pageNumber: payload?.PageNumber ?? payload?.pageNumber ?? payload?.page ?? undefined,
			pageSize: payload?.PageSize ?? payload?.pageSize ?? undefined,
		};
		return { items, meta };
	} catch (err: unknown) {
		return rejectWithValue(getErrorMessage(err, "Lỗi khi tải công thức"));
	}
});

export const fetchAllRecipes = createAsyncThunk<
	{ items: Recipe[]; meta?: { totalRecords?: number; pageNumber?: number; pageSize?: number } },
	{ pageNumber?: number; pageSize?: number } | void,
	{ rejectValue: string }
>("recipes/fetchAll", async (params, { rejectWithValue }) => {
	try {
		// If pagination params provided, send as query string
		let url = `/api/Recipes`;
		if (params && (params as { pageNumber?: number }).pageNumber) {
			const p = params as { pageNumber?: number; pageSize?: number };
			const qp = new URLSearchParams();
			if (p.pageNumber) qp.append("PageNumber", String(p.pageNumber));
			if (p.pageSize) qp.append("PageSize", String(p.pageSize));
			url = `/api/Recipes?${qp.toString()}`;
		}
		const res = await axiosInstance.get(url);
		const body = res.data ?? {};
		const payload = body.data ?? body.Data ?? body;

		const dataList = payload && (payload.Data || payload.data) ? (payload.Data ?? payload.data) : null;
		const list = Array.isArray(dataList) ? dataList : Array.isArray(payload) ? payload : [];
		const items = list.map(normalizeRecipe);
		const meta = {
			totalRecords: payload?.TotalRecords ?? payload?.totalRecords ?? payload?.total ?? undefined,
			pageNumber: payload?.PageNumber ?? payload?.pageNumber ?? payload?.page ?? undefined,
			pageSize: payload?.PageSize ?? payload?.pageSize ?? undefined,
		};
		return { items, meta };
	} catch (err: unknown) {
		return rejectWithValue(getErrorMessage(err, "Lỗi khi tải danh sách công thức"));
	}
});

export const addRecipe = createAsyncThunk<
	Recipe,
	RecipeRequest,
	{ rejectValue: string }
>("recipes/add", async (payload, { rejectWithValue }) => {
	try {
		const form = new FormData();
		form.append("UserId", String(payload.userId));
		form.append("Title", payload.title);
		form.append("Category", String(payload.category));
		form.append("Ingredients", payload.ingredients);
		form.append("Steps", payload.steps);
		if (payload.description) form.append("Description", payload.description);
		if (payload.image && payload.image instanceof File) {
			form.append("file", payload.image);
		}

		const res = await axiosInstance.post(`/api/Recipes`, form, {
			headers: { "Content-Type": "multipart/form-data" },
		});

	const body = res.data ?? {};
	const respPayload = (body.data ?? body.Data ?? body) as unknown;
	const dto = (respPayload && typeof respPayload === "object") ? (respPayload as Recipe) : (res.data as Recipe);
		return normalizeRecipe(dto);
	} catch (err: unknown) {
		return rejectWithValue(getErrorMessage(err, "Lỗi khi thêm công thức"));
	}
});

export const updateRecipe = createAsyncThunk<
	Recipe,
	{ id: number; payload: RecipeRequest },
	{ rejectValue: string }
>("recipes/update", async ({ id, payload }, { rejectWithValue }) => {
	try {
		const form = new FormData();
		form.append("UserId", String(payload.userId));
		form.append("Title", payload.title);
		form.append("Category", String(payload.category));
		form.append("Ingredients", payload.ingredients);
		form.append("Steps", payload.steps);
		if (payload.description) form.append("Description", payload.description);
		if (payload.image && payload.image instanceof File) {
			form.append("file", payload.image);
		}

		const res = await axiosInstance.put(`/api/Recipes/${id}`, form, {
			headers: { "Content-Type": "multipart/form-data" },
		});

	const body = res.data ?? {};
	const respPayload = (body.data ?? body.Data ?? body) as unknown;
	const dto = (respPayload && typeof respPayload === "object") ? (respPayload as Recipe) : (res.data as Recipe);
		return normalizeRecipe(dto);
	} catch (err: unknown) {
		return rejectWithValue(getErrorMessage(err, "Lỗi khi cập nhật công thức"));
	}
});

export const deleteRecipe = createAsyncThunk<
	number,
	number,
	{ rejectValue: string }
>("recipes/delete", async (id, { rejectWithValue }) => {
	try {
		await axiosInstance.delete(`/api/Recipes/${id}`);
		return id;
	} catch (err: unknown) {
		return rejectWithValue(getErrorMessage(err, "Lỗi khi xóa công thức"));
	}
});


const recipesSlice = createSlice({
	name: "recipes",
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			// FETCH
			.addCase(fetchRecipesByUser.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchRecipesByUser.fulfilled, (state, action) => {
				state.items = action.payload.items;
				if (action.payload.meta) {
					const { totalRecords, pageNumber, pageSize } = action.payload.meta;
					if (totalRecords !== undefined) state.totalRecords = totalRecords;
					if (pageNumber !== undefined) state.pageNumber = pageNumber;
					if (pageSize !== undefined) state.pageSize = pageSize;
					if (state.pageSize && state.totalRecords !== undefined) {
						state.totalPages = Math.ceil(state.totalRecords / state.pageSize);
					}
				}
				state.loading = false;
			})
			.addCase(fetchRecipesByUser.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload ?? "Lỗi tải công thức";
			})
			.addCase(fetchAllRecipes.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchAllRecipes.fulfilled, (state, action) => {
				state.allItems = action.payload.items;
				if (action.payload.meta) {
					state.totalRecords = action.payload.meta.totalRecords;
					state.pageNumber = action.payload.meta.pageNumber;
					state.pageSize = action.payload.meta.pageSize;
					if (state.pageSize && state.totalRecords !== undefined) {
						state.totalPages = Math.ceil(state.totalRecords / state.pageSize);
					}
				}
				state.loading = false;
			})
			.addCase(fetchAllRecipes.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload ?? "Lỗi tải danh sách công thức";
			})
			// ADD
			.addCase(addRecipe.fulfilled, (state, action) => {
				state.items.push(action.payload);
			})
			.addCase(addRecipe.rejected, (state, action) => {
				state.error = action.payload ?? "Lỗi thêm công thức";
			})
			// UPDATE
			.addCase(updateRecipe.fulfilled, (state, action) => {
				const idx = state.items.findIndex((r) => r.id === action.payload.id);
				if (idx !== -1) state.items[idx] = action.payload;
			})
			.addCase(updateRecipe.rejected, (state, action) => {
				state.error = action.payload ?? "Lỗi cập nhật công thức";
			})
			// DELETE
			.addCase(deleteRecipe.fulfilled, (state, action) => {
				state.items = state.items.filter((r) => r.id !== action.payload);
			})
			.addCase(deleteRecipe.rejected, (state, action) => {
				state.error = action.payload ?? "Lỗi xóa công thức";
			});
	},
});

export default recipesSlice.reducer;

