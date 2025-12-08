import { configureStore } from "@reduxjs/toolkit";
import themeReducer from "./slices/useThemeSlice";
import userReducer, { updateAccessToken } from "./slices/userSlice";
import dishReducer from "./slices/dishSlide";
import restaurantReducer from "./slices/restaurantSlice";
import promotionReducer from "./slices/promotionSlice";
import staffReducer from "./slices/staffSlice";
import favoritesReducer from "./slices/favoritesSlice";
import vouchersReducer from "./slices/vouchersSlice";
import dishpromotionReducer from "./slices/dishPromotionSlice";
import reservationReducer from "./slices/reservationSlice";
import reviewReducer from "./slices/reviewSlice";
import orderRenducer from "./slices/orderSlice";
import paymentRenducer from "./slices/paymentSlice";
import orderPromtionRenducer from "./slices/orderPromotionsSlice";
import recipeReducer from "./slices/recipesSlice";
import recipeReviewsReducer from "./slices/recipeReviewsSlice";
import { subscribeAccessTokenChange } from "@/lib/utils/tokenHelper";

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    user: userReducer,
    dishes: dishReducer,
    restaurant: restaurantReducer,
    promotion: promotionReducer,
    staff: staffReducer,
    dishpromotion: dishpromotionReducer,
    reservation: reservationReducer,
    review: reviewReducer,
    favorites: favoritesReducer,
    vouchers: vouchersReducer,
    recipes: recipeReducer,
    recipeReviews: recipeReviewsReducer,
    order: orderRenducer,
    payment: paymentRenducer,
    orderPromotion: orderPromtionRenducer,
  },
});

try {
  subscribeAccessTokenChange((token) => {
    if (token) {
      store.dispatch(updateAccessToken(token));
    }
  });
} catch {
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
