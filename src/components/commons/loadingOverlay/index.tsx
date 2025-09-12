"use client";

import React from "react";

export default function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="w-12 h-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
    </div>
  );
}
