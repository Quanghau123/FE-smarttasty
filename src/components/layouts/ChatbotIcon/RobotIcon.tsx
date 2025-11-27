"use client";

import React, { useEffect, useState } from "react";

interface Props {
  isTalking?: boolean;
  size?: number;
  className?: string; // optional: allow CSS sizing via class
  style?: React.CSSProperties; // optional inline styles
  scale?: number; // <-- added: control internal SVG scale (1 = 100%)
}

const RobotIcon: React.FC<Props> = ({
  isTalking = false,
  className,
  style,
  scale = 1, // <-- default scale
}) => {
  const [eyePos, setEyePos] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);

  // 👀 Di chuyển mắt theo chuột
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const maxOffset = 0.5;
      const x = (e.clientX / window.innerWidth - 0.5) * 2 * maxOffset;
      const y = (e.clientY / window.innerHeight - 0.5) * 2 * maxOffset;
      setEyePos({ x, y });
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  // 😉 Nháy mắt
  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    };
    const interval = setInterval(blink, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  const leftEye = { cx: 9, cy: 13 };
  const rightEye = { cx: 15, cy: 13 };
  const eyeRadius = 1.5;
  const pupilRadius = 0.75;
  const mouthY = 17;

  // compute transform so scaling occurs about the SVG center (12,12)
  const center = 12;
  const tx = center - center * scale;
  const ty = center - center * scale;
  const groupTransform = `translate(${tx} ${ty}) scale(${scale})`;

  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 24 24"
      // width/height intentionally omitted so parent CSS can control sizing
    >
      {/* Added: gradient defs for orange -> red transition */}
      <defs>
        <linearGradient id="robotGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF8C00" />
          <stop offset="50%" stopColor="#FF6A00" />
          <stop offset="100%" stopColor="#FF4500" />
        </linearGradient>

        <linearGradient id="robotAccent" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFA84D" />
          <stop offset="100%" stopColor="#FF3B3B" />
        </linearGradient>
      </defs>

      {/* Wrap all visible shapes in a group so they scale around the center (12,12) */}
      <g transform={groupTransform}>
        {/* Body (use gradient) - added stroke for outline */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12.0196 14.9374C11.7284 14.9374 11.4307 14.9818 11.1784 15.0796C11.0546 15.1275 10.9032 15.2031 10.7699 15.3252C10.6361 15.4479 10.4632 15.6749 10.4632 15.9999C10.4632 16.3249 10.6361 16.5519 10.7699 16.6745C10.9032 16.7967 11.0546 16.8722 11.1784 16.9202C11.4307 17.018 11.7284 17.0624 12.0196 17.0624C12.3109 17.0624 12.6085 17.018 12.8609 16.9202C12.9846 16.8722 13.136 16.7967 13.2693 16.6745C13.4032 16.5519 13.5761 16.3249 13.5761 15.9999C13.5761 15.6749 13.4032 15.4479 13.2693 15.3252C13.136 15.2031 12.9846 15.1275 12.8609 15.0796C12.6085 14.9818 12.3109 14.9374 12.0196 14.9374Z"
          fill="url(#robotGradient)"
          stroke="#2b1500"
          strokeWidth={0.35}
          strokeLinejoin="round"
        />

        {/* Smaller facial blobs - add same subtle outline */}
        <path
          d="M14.0365 12.6464C14.2015 12.38 14.5274 12.0625 15.0163 12.0625C15.5051 12.0625 15.831 12.38 15.996 12.6464C16.1681 12.9243 16.2501 13.2612 16.2501 13.5938C16.2501 13.9263 16.1681 14.2632 15.996 14.5411C15.831 14.8075 15.5051 15.125 15.0163 15.125C14.5274 15.125 14.2015 14.8075 14.0365 14.5411C13.8644 14.2632 13.7824 13.9263 13.7824 13.5938C13.7824 13.2612 13.8644 12.9243 14.0365 12.6464Z"
          fill="url(#robotGradient)"
          stroke="#2b1500"
          strokeWidth={0.28}
          strokeLinejoin="round"
        />
        <path
          d="M9.01634 12.0625C8.52751 12.0625 8.20161 12.38 8.03658 12.6464C7.86445 12.9243 7.78247 13.2612 7.78247 13.5938C7.78247 13.9263 7.86445 14.2632 8.03658 14.5411C8.20161 14.8075 8.52751 15.125 9.01634 15.125C9.50518 15.125 9.83108 14.8075 9.9961 14.5411C10.1682 14.2632 10.2502 13.9263 10.2502 13.5938C10.2502 13.2612 10.1682 12.9243 9.9961 12.6464C9.83108 12.38 9.50518 12.0625 9.01634 12.0625Z"
          fill="url(#robotGradient)"
          stroke="#2b1500"
          strokeWidth={0.28}
          strokeLinejoin="round"
        />

        {/* Big outer shape - add subtle outline to define silhouette */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M6.09485 4.25C5.48148 4.25 4.77463 4.42871 4.20882 4.91616C3.62226 5.4215 3.27004 6.18781 3.27004 7.1875V9.0625L3.27005 9.06545C3.2712 9.35941 3.3211 9.94757 3.4888 10.4392C3.54365 10.6001 3.63129 10.8134 3.77764 11.0058C3.49364 11.5688 3.35904 12.1495 3.29787 12.7095C3.2468 13.1771 3.24611 13.6679 3.25424 14.1211C2.5932 14.3507 1.90877 14.6349 1.5932 14.8387C1.24524 15.0634 1.14534 15.5277 1.37006 15.8756C1.59478 16.2236 2.05903 16.3235 2.40698 16.0988C2.5234 16.0236 2.86686 15.8664 3.31867 15.6939C3.38755 16.173 3.52716 16.6095 3.7221 17.0063C3.56621 17.1035 3.42847 17.1935 3.31889 17.2652C3.27694 17.2926 3.23912 17.3173 3.20599 17.3387C2.85803 17.5634 2.75813 18.0277 2.98285 18.3756C3.20757 18.7236 3.67182 18.8235 4.01978 18.5988C4.0609 18.5722 4.10473 18.5436 4.15098 18.5134C4.28216 18.4278 4.43287 18.3294 4.59701 18.2288C5.18653 18.8313 5.91865 19.2964 6.67916 19.6462C8.45998 20.4654 10.569 20.75 12.0001 20.75C13.4311 20.75 15.5402 20.4654 17.321 19.6462C18.0815 19.2964 18.8136 18.8313 19.4031 18.2288C19.5673 18.3294 19.718 18.4278 19.8491 18.5134C19.8954 18.5436 19.9392 18.5722 19.9803 18.5988C20.3283 18.8235 20.7925 18.7236 21.0173 18.3756C21.242 18.0277 21.1421 17.5634 20.7941 17.3387C20.761 17.3173 20.7232 17.2926 20.6812 17.2652C20.5716 17.1935 20.4339 17.1035 20.2781 17.0063C20.473 16.6095 20.6127 16.173 20.6815 15.6938C21.1335 15.8663 21.4771 16.0236 21.5936 16.0988C21.9415 16.3235 22.4058 16.2236 22.6305 15.8756C22.8552 15.5277 22.7553 15.0634 22.4074 14.8387C22.0917 14.6349 21.4071 14.3506 20.7459 14.121C20.7541 13.6678 20.7534 13.177 20.7023 12.7095C20.6412 12.1495 20.5065 11.5688 20.2225 11.0058C20.3689 10.8134 20.4565 10.6001 20.5114 10.4392C20.6791 9.94758 20.729 9.35941 20.7301 9.06545L20.7302 9.0625V7.18761C20.7302 6.18792 20.3779 5.42162 19.7914 4.91628C19.2256 4.42882 18.5187 4.25011 17.9054 4.25011C17.4969 4.25011 17.0744 4.40685 16.7337 4.56076C16.3726 4.72392 15.9952 4.9359 15.6558 5.13136C15.5828 5.17339 15.5119 5.21444 15.443 5.25432L15.441 5.25548C15.177 5.4084 14.9427 5.5441 14.7339 5.65167C14.6042 5.7185 14.5035 5.7643 14.4285 5.79206C14.3969 5.80377 14.3767 5.80966 14.3663 5.81242C14.1129 5.81102 13.9514 5.79033 13.7181 5.76044C13.6681 5.75403 13.6147 5.74719 13.5564 5.74003C13.2098 5.69743 12.7722 5.65636 12.0001 5.65636C11.228 5.65636 10.7905 5.69743 10.4438 5.74003C10.3855 5.74719 10.3322 5.75403 10.2821 5.76044C10.0489 5.79033 9.88738 5.81102 9.63388 5.81242C9.62352 5.80966 9.60332 5.80376 9.57174 5.79206C9.49678 5.7643 9.39604 5.71849 9.26633 5.65166C9.05755 5.54408 8.82331 5.40842 8.55926 5.25548C8.48975 5.21523 8.41818 5.17377 8.34446 5.13132C8.00502 4.93584 7.62764 4.72384 7.26652 4.56067C6.92587 4.40675 6.50329 4.25 6.09485 4.25Z"
          fill="url(#robotGradient)"
          stroke="#2b1500"
          strokeWidth={0.45}
          strokeLinejoin="round"
        />

        {/* Eyes (whites remain white; pupils use accent gradient when talking) */}
        <circle
          cx={leftEye.cx}
          cy={leftEye.cy}
          r={eyeRadius}
          fill="white"
          stroke="#2b1500"
          strokeWidth={0.12}
        />
        {isBlinking ? (
          <rect
            x={leftEye.cx - eyeRadius}
            y={leftEye.cy - pupilRadius / 2}
            width={eyeRadius * 2}
            height={pupilRadius}
            rx={pupilRadius / 2}
            fill="black"
          />
        ) : (
          <circle
            cx={leftEye.cx + eyePos.x}
            cy={leftEye.cy + eyePos.y}
            r={pupilRadius}
            fill={isTalking ? "url(#robotAccent)" : "black"}
            stroke={isTalking ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.03)"}
            strokeWidth={0.06}
          />
        )}

        <circle
          cx={rightEye.cx}
          cy={rightEye.cy}
          r={eyeRadius}
          fill="white"
          stroke="#2b1500"
          strokeWidth={0.12}
        />
        {isBlinking ? (
          <rect
            x={rightEye.cx - eyeRadius}
            y={rightEye.cy - pupilRadius / 2}
            width={eyeRadius * 2}
            height={pupilRadius}
            rx={pupilRadius / 2}
            fill="black"
          />
        ) : (
          <circle
            cx={rightEye.cx + eyePos.x}
            cy={rightEye.cy + eyePos.y}
            r={pupilRadius}
            fill={isTalking ? "url(#robotAccent)" : "black"}
            stroke={isTalking ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.03)"}
            strokeWidth={0.06}
          />
        )}

        {/* Miệng */}
        {isTalking ? (
          <ellipse
            cx={12}
            cy={mouthY}
            rx={1.5}
            ry={0.75}
            fill="url(#robotAccent)"
            stroke="rgba(0,0,0,0.12)"
            strokeWidth={0.08}
          />
        ) : (
          <path
            d="M10,17 Q12,18 14,17"
            stroke="#FFB6B6"
            strokeWidth={0.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="transparent"
          />
        )}
      </g>
    </svg>
  );
};

export default RobotIcon;
