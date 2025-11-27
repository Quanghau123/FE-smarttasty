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
            {/* Wrapped slide content with Shine; programmatic sweeping enabled */}
            <Shine
              hoverOnly={false}
              initialRuns={1}
              intervalMs={5000}
              style={{ height: "100%" }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                }}
              >
                <Image
                  src={img}
                  alt={`Slide ${idx + 1}`}
                  fill
                  priority={idx === 0}
                  draggable={false}
                  style={{ objectFit: "cover" }}
                />
              </div>
            </Shine>
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

type ShineProps = {
  children: React.ReactNode;
  hoverOnly?: boolean;
  className?: string;
  style?: React.CSSProperties;
  initialRuns?: number;
  intervalMs?: number;
};

function Shine({
  children,
  hoverOnly = true,
  className = "",
  style,
  initialRuns = 1,
  intervalMs = 3000,
}: ShineProps) {
  const [active, setActive] = useState(false);
  const runCountRef = useRef(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (hoverOnly) return;

    const trigger = () => {
      setActive(true);
      const timeout = window.setTimeout(() => setActive(false), 1300);
      return timeout;
    };

    const timeouts: number[] = [];
    for (let i = 0; i < initialRuns; i++) {
      const t = window.setTimeout(() => {
        runCountRef.current += 1;
        trigger();
      }, i * 1400);
      timeouts.push(t);
    }

    const startInterval = () => {
      intervalRef.current = window.setInterval(() => {
        trigger();
      }, intervalMs) as unknown as number;
    };
    const afterInitial = window.setTimeout(
      startInterval,
      initialRuns * 1400 + 200
    );

    return () => {
      timeouts.forEach((t) => window.clearTimeout(t));
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      window.clearTimeout(afterInitial);
    };
  }, [hoverOnly, initialRuns, intervalMs]);

  const classes = [
    "shine",
    hoverOnly ? "shine-hover" : "",
    active ? "shine-active" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      style={{ position: "relative", overflow: "hidden", ...style }}
    >
      {children}
      {/* overlay element that moves across */}
      <div className="shine-overlay" aria-hidden="true" />
      {/* scoped styles for the shine effect */}
      <style jsx>{`
        .shine {
          position: relative;
          display: block;
        }
        .shine-overlay {
          pointer-events: none;
          position: absolute;
          inset: 0;
          opacity: 0;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.35) 45%,
            rgba(255, 255, 255, 0.65) 50%,
            rgba(255, 255, 255, 0.35) 55%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: translateX(-120%);
          transition: none;
        }
        /* hover-only mode: play on hover */
        .shine-hover:hover .shine-overlay {
          animation: sweep 1.2s ease-in-out 1;
          opacity: 1;
        }
        /* programmatic trigger (class toggled) */
        .shine-active .shine-overlay {
          animation: sweep 1.2s ease-in-out 1;
          opacity: 1;
        }
        @keyframes sweep {
          0% {
            transform: translateX(-120%);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          50% {
            transform: translateX(120%);
            opacity: 1;
          }
          100% {
            transform: translateX(120%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default SlideHeader;
