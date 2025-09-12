import { createTheme } from "@mui/material/styles";

export const getMuiTheme = (mode: "light" | "dark") =>
  createTheme({
    palette: {
      mode,
      primary: { main: "#1976d2" },
      background: {
        default: mode === "dark" ? "#121212" : "#ffffff",
        paper: mode === "dark" ? "#1c1c1c" : "#fafafa",
      },
      text: {
        primary: mode === "dark" ? "#ffffff" : "#000000",
        secondary: mode === "dark" ? "#aaaaaa" : "#666666",
      },
      action: {
        active: mode === "dark" ? "#ffffff" : "#000000",
        hover: mode === "dark" ? "#444444" : "#dddddd",
      },
      divider: mode === "dark" ? "#444444" : "#e0e0e0",
    },
    typography: {
      fontFamily: "Arial, sans-serif",
    },
  });
