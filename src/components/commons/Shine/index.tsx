import React, { useEffect, useRef, useState } from "react";

type ShineProps = {
  children: React.ReactNode;
  hoverOnly?: boolean; 
  className?: string; 
  style?: React.CSSProperties; 
  initialRuns?: number; 
  intervalMs?: number; 
};
//Tạo hiệu ứng shine (ánh sáng lướt qua) cho các thành phần con
export default function Shine({
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
      }, intervalMs);
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
    <div className={classes} style={style}>
      {children}
    </div>
  );
}
