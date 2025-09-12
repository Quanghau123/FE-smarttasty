"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { ThemeProvider as MuiThemeProvider, CssBaseline } from "@mui/material";
import { getMuiTheme } from "@/lib/mui/theme";

export function MuiProviders({ children }: { children: React.ReactNode }) {
  const themeMode = useSelector((state: RootState) => state.theme.themeMode);
  const muiTheme = getMuiTheme(themeMode);

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
