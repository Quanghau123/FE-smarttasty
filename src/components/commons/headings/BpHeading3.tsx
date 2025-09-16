import React from "react";
import clsx from "clsx";

type BpHeading3Props = {
  title: string;
  center?: boolean;
  color?: string;
  bold?: boolean;
};

export default function BpHeading3({
  title,
  center = false,
  color = "text",
  bold = false,
}: BpHeading3Props) {
  return (
    <h3
      className={clsx(
        "text-lg sm:text-xl",
        color === "text" ? "text-text" : color,
        bold && "font-bold",
        center && "text-center"
      )}
    >
      {title}
    </h3>
  );
}
