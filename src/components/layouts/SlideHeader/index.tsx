"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import styles from "./styles.module.scss";

import anh4 from "@/assets/Image/SlideHeader/banner5.png";

const images = [anh4, anh4, anh4, anh4];

const Index = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (sliderRef.current) {
      // use percentage relative to the slider container so each slide
      // shifts by exactly one slide width (works when container is not full viewport)
      sliderRef.current.style.transform = `translateX(-${currentIndex * 100}%)`;
      sliderRef.current.style.transition = "transform 0.5s ease-in-out";
    }
  }, [currentIndex]);

  return (
    <div className={styles.container}>
      <div className={styles.imageWrapper} ref={sliderRef}>
        {images.map((img, idx) => (
          <div key={idx} className={styles.slideImage}>
            <Image
              src={img}
              alt={`Slide ${idx + 1}`}
              fill
              priority={idx === 0} // slide đầu load trước
              draggable={false}
              className="object-cover" // giống như background-size: cover
            />
          </div>
        ))}
      </div>

      <div className={styles.overlay}></div>

      <div className={styles.dotWrapper}>
        {images.map((_, idx) => (
          <span
            key={idx}
            className={`${styles.dot} ${
              idx === currentIndex ? styles.active : ""
            }`}
            onClick={() => setCurrentIndex(idx)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setCurrentIndex(idx);
            }}
            style={{ cursor: "pointer" }}
            aria-label={`Chuyển đến slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Index;
