"use client";

import React, { useEffect, useState } from "react";

interface Props {
  isTalking?: boolean; // bot đang trả lời
  size?: number; // kích thước SVG
}

const RobotIcon: React.FC<Props> = ({ isTalking = false, size = 64 }) => {
  const [eyePos, setEyePos] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);

  // 👀 Di chuyển mắt theo chuột
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 15; // tăng biên độ
      const y = (e.clientY / window.innerHeight - 0.5) * 15;
      setEyePos({ x, y });
    };

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  // 😉 Nháy mắt tự nhiên
  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150); // mắt nhắm 150ms
    };

    const interval = setInterval(blink, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  // Thông số mắt và miệng
  const eyeRadius = size * 0.09; // ~6 với size 64
  const pupilRadius = size * 0.06; // ~4 với size 64
  const leftEye = { cx: 0.35 * size, cy: 0.45 * size };
  const rightEye = { cx: 0.65 * size, cy: 0.45 * size };
  const mouthY = 0.7 * size;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Thân */}
      <circle cx={size / 2} cy={size / 2} r={0.45 * size} fill="#4dabf5" />

      {/* Miệng */}
      {isTalking ? (
        <ellipse
          cx={size / 2}
          cy={mouthY}
          rx={0.18 * size}
          ry={0.22 * size}
          fill="#1b1b1b"
        />
      ) : (
        <rect
          x={0.38 * size}
          y={mouthY - 0.02 * size}
          width={0.24 * size}
          height={0.06 * size}
          rx={0.03 * size}
          fill="#1b1b1b"
        />
      )}

      {/* Mắt trái */}
      <circle cx={leftEye.cx} cy={leftEye.cy} r={eyeRadius} fill="white" />
      {isBlinking ? (
        <rect
          x={leftEye.cx - eyeRadius}
          y={leftEye.cy - pupilRadius / 2}
          width={eyeRadius * 2}
          height={pupilRadius}
          fill="black"
          rx={pupilRadius / 2}
        />
      ) : (
        <circle
          cx={leftEye.cx + eyePos.x * 0.8}
          cy={leftEye.cy + eyePos.y * 0.8}
          r={pupilRadius}
          fill={isTalking ? "#ff4444" : "black"}
        />
      )}

      {/* Mắt phải */}
      <circle cx={rightEye.cx} cy={rightEye.cy} r={eyeRadius} fill="white" />
      {isBlinking ? (
        <rect
          x={rightEye.cx - eyeRadius}
          y={rightEye.cy - pupilRadius / 2}
          width={eyeRadius * 2}
          height={pupilRadius}
          fill="black"
          rx={pupilRadius / 2}
        />
      ) : (
        <circle
          cx={rightEye.cx + eyePos.x * 0.8}
          cy={rightEye.cy + eyePos.y * 0.8}
          r={pupilRadius}
          fill={isTalking ? "#ff4444" : "black"}
        />
      )}
    </svg>
  );
};

export default RobotIcon;
