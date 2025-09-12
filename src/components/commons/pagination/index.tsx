"use client";

import React from "react";

type PaginationProps = {
  currentPage: number;
  totalPage: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({
  currentPage,
  totalPage,
  onPageChange,
}: PaginationProps) {
  if (totalPage <= 1) return null;

  const pages = Array.from({ length: totalPage }, (_, i) => i + 1);

  return (
    <div className="inline-flex space-x-2">
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-1 rounded-md text-sm font-semibold ${
            currentPage === page
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          {page}
        </button>
      ))}
    </div>
  );
}
