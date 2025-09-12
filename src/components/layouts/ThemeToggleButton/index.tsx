"use client";

import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { toggleTheme } from "@/redux/slices/useThemeSlice";

import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

const ThemeToggleButton = () => {
  const themeMode = useSelector((state: RootState) => state.theme.themeMode);
  const dispatch = useDispatch();

  return (
    <button
      onClick={() => dispatch(toggleTheme())}
      className="w-10 h-10 flex items-center justify-center rounded-full bg-button border border-border text-text hover:bg-button-hover transition"
      title={`Switch to ${themeMode === "dark" ? "light" : "dark"} mode`}
    >
      {themeMode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
    </button>
  );
};

export default ThemeToggleButton;
