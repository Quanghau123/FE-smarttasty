import { configureStore } from "@reduxjs/toolkit";
import themeReducer from "./slices/useThemeSlice";
import userReducer from "./slices/userSlice";
import dishReducer from "./slices/dishSlide";
import restaurantReducer from "./slices/restaurantSlice";
import promotionReducer from "./slices/promotionSlice";
import dishpromotionReducer from "./slices/dishPromotionSlice";
import reservationReducer from "./slices/reservationSlice";
import reviewReducer from "./slices/reviewSlice";

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    user: userReducer,
    dishes: dishReducer,
    restaurant: restaurantReducer,
    promotion: promotionReducer,
    dishpromotion: dishpromotionReducer,
    reservation:reservationReducer,
    review: reviewReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
