"use client";

import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { ThemeProvider as MuiThemeProvider, CssBaseline } from "@mui/material";
import { getMuiTheme } from "@/lib/mui/theme";
import { initializeTheme, setTheme } from "@/redux/slices/useThemeSlice";

export function MuiProviders({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const themeMode = useSelector((state: RootState) => state.theme.themeMode);
  const muiTheme = getMuiTheme(themeMode);

  useEffect(() => {
    // Initialize theme sau khi component mount để tránh hydration mismatch
    const savedTheme = initializeTheme();
    if (savedTheme !== themeMode) {
      dispatch(setTheme(savedTheme));
    }
  }, [dispatch, themeMode]);

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
