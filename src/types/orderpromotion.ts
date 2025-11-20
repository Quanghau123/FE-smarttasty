export type OrderPromotion = {
	id: number;
	promotionId: number;
	minOrderValue: number;
	promotionTitle?: string;
	discountType?: string;
	discountValue?: number;
	restaurantId?: number;
	restaurantName?: string;
	targetUserId?: number;
	isGlobal?: boolean;
	// promotion object can be included by backend mapping; keep optional
	promotion?: Record<string, unknown>;
};

export type CreateOrderPromotionRequest = {
	promotionId: number;
	minOrderValue: number;
	restaurantId?: number;
	targetUserId?: number;
	isGlobal?: boolean;
};

export type ApiResponse<T> = {
	errCode: number;
	errMessage: string;
	data: T;
};
