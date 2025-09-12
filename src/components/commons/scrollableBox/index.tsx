import React from "react";
import clsx from "clsx";
import styles from "@/components/commons/scrollableBox/styles.module.scss";

type ScrollableBoxProps = {
  className?: string;
  children: React.ReactNode;
  maxHeight?: string;
};

export default function ScrollableBox({
  className = "",
  children,
  maxHeight = "600px",
}: ScrollableBoxProps) {
  return (
    <div
      className={clsx(
        "overflow-auto shadow border-b rounded-md bg-[var(--background)]",
        styles.scrollbarCustom,
        className
      )}
      style={{ maxHeight }}
    >
      {children}
    </div>
  );
}
