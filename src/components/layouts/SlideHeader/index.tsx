"use client";

import { useState, useEffect, useRef } from "react";
//import "react-datepicker/dist/react-datepicker.css";
import styles from "./styles.module.scss";

//import anh1 from "@/assets/Image/SlideHeader/anh1.jpg";
//import anh2 from "@/assets/Image/SlideHeader/anh2.jpg";
//import anh3 from "@/assets/Image/SlideHeader/anh3.jpg";
import anh4 from "@/assets/Image/SlideHeader/anh5.jpg";

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
      sliderRef.current.style.transform = `translateX(-${
        currentIndex * 100
      }vw)`;
      sliderRef.current.style.transition = "transform 0.5s ease-in-out"; // Thêm hiệu ứng chuyển mượt
    }
  }, [currentIndex]);

  return (
    <div className={styles.container}>
      <div className={styles.imageWrapper} ref={sliderRef}>
        {images.map((img, idx) => (
          <img
            key={idx}
            src={img.src}
            alt={`Slide ${idx + 1}`}
            draggable={false} // tránh kéo ảnh gây khó chịu UX
            className={styles.slideImage} // thêm class nếu cần style riêng cho img
          />
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
