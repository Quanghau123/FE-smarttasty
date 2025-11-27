"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Box } from "@mui/material";

import anh4 from "@/assets/Image/SlideHeader/banner5.png";
import anh5 from "@/assets/Image/SlideHeader/bannerv6.png";
import anh6 from "@/assets/Image/SlideHeader/bannerv5.jpg";
import anh7 from "@/assets/Image/SlideHeader/bannerv7.png";

const images = [anh4, anh5, anh6, anh7];

const SlideHeader: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    el.style.transform = `translateX(-${currentIndex * 100}%)`;
    el.style.transition = "transform 0.5s ease-in-out";
  }, [currentIndex]);

  return (
    <Box
      component="section"
      sx={{
        position: "relative",
        width: "100%",
        height: {
          xs: "18vh",
          sm: "28vh",
          md: "calc(32vh + 50px)",
          lg: "calc(36vh + 50px)",
          xl: "calc(43vh + 50px)",
        },
        // On small devices in landscape the viewport height is much smaller
        // (so `vh` values look tiny). Increase header height specifically
        // for mobile landscape using a media query.
        "@media (orientation: landscape) and (max-width:600px)": {
          height: "44vh",
          // keep a reasonable cap so images don't overflow on some devices
          maxHeight: 520,
        },
        maxHeight: 900,
        overflow: "hidden",
      }}
    >
      <Box
        ref={sliderRef as unknown as React.RefObject<HTMLDivElement>}
        sx={{ display: "flex", width: "100%", height: "100%" }}
      >
        {images.map((img, idx) => (
          <Box
            key={idx}
            sx={{ position: "relative", flex: "0 0 100%", height: "100%" }}
          >
            <Image
              src={img}
              alt={`Slide ${idx + 1}`}
              fill
              priority={idx === 0}
              draggable={false}
              style={{ objectFit: "cover" }}
            />
          </Box>
        ))}
      </Box>

      {/* subtle overlay if needed */}
      {/* <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.12))",
          pointerEvents: "none",
        }}
      /> */}

      {/* dots */}
      <Box
        sx={{
          position: "absolute",
          bottom: { xs: 8, sm: 12, md: 16 },
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 1,
          zIndex: 10,
        }}
        role="tablist"
        aria-label="Slide navigation"
      >
        {images.map((_, idx) => (
          <Box
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setCurrentIndex(idx);
            }}
            role="tab"
            tabIndex={0}
            aria-selected={idx === currentIndex}
            aria-label={`Chuyển đến slide ${idx + 1}`}
            sx={{
              width: { xs: 6, sm: 8, md: 10, lg: 12 },
              height: { xs: 6, sm: 8, md: 10, lg: 12 },
              borderRadius: "50%",
              bgcolor:
                idx === currentIndex ? "#fff" : "rgba(255, 255, 255, 0.8)",
              cursor: "pointer",
              boxShadow: idx === currentIndex ? 2 : "none",
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default SlideHeader;
