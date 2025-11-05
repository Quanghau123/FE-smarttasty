import { configureStore } from "@reduxjs/toolkit";
import themeReducer from "./slices/useThemeSlice";
import userReducer, { updateAccessToken } from "./slices/userSlice";
import dishReducer from "./slices/dishSlide";
import restaurantReducer from "./slices/restaurantSlice";
import promotionReducer from "./slices/promotionSlice";
import dishpromotionReducer from "./slices/dishPromotionSlice";
import reservationReducer from "./slices/reservationSlice";
import reviewReducer from "./slices/reviewSlice";
import orderRenducer from "./slices/orderSlice";
import paymentRenducer from "./slices/paymentSlice";
import orderPromtionRenducer from "./slices/orderPromotionsSlice";
import recipeReducer from "./slices/recipesSlice";
import { subscribeAccessTokenChange } from "@/lib/utils/tokenHelper";

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    user: userReducer,
    dishes: dishReducer,
    restaurant: restaurantReducer,
    promotion: promotionReducer,
    dishpromotion: dishpromotionReducer,
    reservation: reservationReducer,
    review: reviewReducer,
    recipes: recipeReducer,
    order: orderRenducer,
    payment: paymentRenducer,
    orderPromotion: orderPromtionRenducer,
  },
});

// Keep Redux state in sync with tokenHelper/localStorage updates
// This ensures that after a background refresh, components/selectors relying
// on Redux see the latest token as well.

try {
  subscribeAccessTokenChange((token) => {
    if (token) {
      store.dispatch(updateAccessToken(token));
    }
  });
} catch {
  // ignore subscription issues in non-browser contexts
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
