import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ThemeMode = "light" | "dark";

interface ThemeState {
  themeMode: ThemeMode;
}

const LOCAL_STORAGE_THEME_KEY = "theme";

const getInitialTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "light";

  let theme = localStorage.getItem(LOCAL_STORAGE_THEME_KEY) as ThemeMode | null;

  if (theme !== "dark" && theme !== "light") {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    theme = prefersDark ? "dark" : "light";
    localStorage.setItem(LOCAL_STORAGE_THEME_KEY, theme);
  }

  document.documentElement.setAttribute("data-theme", theme);
  return theme;
};

const initialState: ThemeState = {
  themeMode: typeof window !== "undefined" ? getInitialTheme() : "light",
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.themeMode = action.payload;
      localStorage.setItem(LOCAL_STORAGE_THEME_KEY, action.payload);
      document.documentElement.setAttribute("data-theme", action.payload);
    },
    toggleTheme(state) {
      const newTheme: ThemeMode =
        state.themeMode === "light" ? "dark" : "light";
      state.themeMode = newTheme;
      localStorage.setItem(LOCAL_STORAGE_THEME_KEY, newTheme);
      document.documentElement.setAttribute("data-theme", newTheme);
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
