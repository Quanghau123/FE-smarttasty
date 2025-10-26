export type OrderPromotion = {
	id: number;
	promotionId: number;
	minOrderValue: number;
		// promotion object can be included by backend mapping; keep optional
		promotion?: Record<string, unknown>;
};

export type CreateOrderPromotionRequest = {
	promotionId: number;
	minOrderValue: number;
};

export type ApiResponse<T> = {
	errCode: number;
	errMessage: string;
	data: T;
};
