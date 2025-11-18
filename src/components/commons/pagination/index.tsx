"use client";

import React from "react";
import { Box, Pagination as MuiPagination, Typography } from "@mui/material";
// import { flex } from "@mui/system";

interface Props {
  page: number;
  onPageChange: (page: number) => void;
  totalRecords: number;
  pageSize?: number;
  size?: "small" | "medium";
  boundaryCount?: number;
  siblingCount?: number;
  showRange?: boolean;
}

const Pagination: React.FC<Props> = ({
  page,
  onPageChange,
  totalRecords,
  pageSize = 10,
  size = "small",
  boundaryCount = 1,
  siblingCount = 1,
  showRange = false,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  const handleChange = (_: React.ChangeEvent<unknown>, value: number) => {
    onPageChange(value);
  };

  const start = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(totalRecords, page * pageSize);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      {showRange ? (
        <Typography variant="caption" sx={{ minWidth: 80 }}>
          {start}-{end} / {totalRecords}
        </Typography>
      ) : null}

      <MuiPagination
        count={totalPages}
        page={page}
        onChange={handleChange}
        color="primary"
        size={size}
        boundaryCount={boundaryCount}
        siblingCount={siblingCount}
      />
    </Box>
  );
};

export default Pagination;
