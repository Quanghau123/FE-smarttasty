import React from "react";
import clsx from "clsx";
import BpHeading3 from "@/components/commons/headings/BpHeading3";

type BpCardProps = {
  heading?: string;
  contentClass?: string;
  children?: React.ReactNode;
  headingButton?: React.ReactNode;
  headerSlot?: React.ReactNode;
  contentSlot?: React.ReactNode;
  headingCenter?: boolean;
  headingColor?: string;
  headingBold?: boolean;
};

export default function BpCard({
  heading,
  contentClass,
  children,
  headingButton,
  headerSlot,
  contentSlot,
  headingCenter = false,
  headingColor = "text",
  headingBold,
}: BpCardProps) {
  return (
    <div className="w-full overflow-hidden bg-background text-text shadow sm:rounded-lg border border-border transition-colors duration-300">
      {headerSlot ? (
        headerSlot
      ) : heading ? (
        <div
          className={clsx(
            "flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-4 sm:px-6",
            headingButton && "justify-between"
          )}
        >
          <BpHeading3
            title={heading}
            center={headingCenter}
            color={headingColor}
            bold={headingBold}
          />
          {headingButton}
        </div>
      ) : null}

      <div
        className={clsx(
          "bg-background px-4 sm:px-6 pb-4 transition-colors duration-300",
          contentClass
        )}
      >
        {contentSlot ?? children}
      </div>
    </div>
  );
}
