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
      className="p-1 flex items-center justify-center rounded-full bg-transparent text-text hover:bg-button-hover transition border-none focus:outline-none"
      title={`Switch to ${themeMode === "dark" ? "light" : "dark"} mode`}
    >
      {themeMode === "dark" ? (
        <LightModeIcon style={{ fontSize: 28 }} />
      ) : (
        <DarkModeIcon style={{ fontSize: 28 }} />
      )}
    </button>
  );
};

export default ThemeToggleButton;
