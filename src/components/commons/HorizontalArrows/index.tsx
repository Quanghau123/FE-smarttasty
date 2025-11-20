import React from "react";
import { IconButton, SxProps, Theme } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

type Props = {
  onLeft: () => void;
  onRight: () => void;
  showLeft?: boolean;
  showRight?: boolean;
  leftAria?: string;
  rightAria?: string;
  size?: "small" | "medium" | "large";
  leftSx?: SxProps<Theme>;
  rightSx?: SxProps<Theme>;
};

const defaultBtnSx: SxProps<Theme> = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  bgcolor: "background.paper",
  boxShadow: 2,
  "&:hover": { bgcolor: "background.paper" },
};

export default function HorizontalArrows({
  onLeft,
  onRight,
  showLeft = true,
  showRight = true,
  leftAria = "scroll-left",
  rightAria = "scroll-right",
  size = "small",
  leftSx,
  rightSx,
}: Props) {
  return (
    <>
      {showLeft && (
        <IconButton
          onClick={onLeft}
          sx={[defaultBtnSx, { left: 8 }, leftSx] as SxProps<Theme>}
          size={size}
          aria-label={leftAria}
        >
          <ChevronLeftIcon />
        </IconButton>
      )}

      {showRight && (
        <IconButton
          onClick={onRight}
          sx={[defaultBtnSx, { right: 8 }, rightSx] as SxProps<Theme>}
          size={size}
          aria-label={rightAria}
        >
          <ChevronRightIcon />
        </IconButton>
      )}
    </>
  );
}
