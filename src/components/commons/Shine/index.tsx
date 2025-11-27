import React, { useEffect, useRef, useState } from "react";

type ShineProps = {
  children: React.ReactNode;
  hoverOnly?: boolean; // when true, plays only on hover
  className?: string; // additional classes for the wrapper
  style?: React.CSSProperties; // optional inline styles
  initialRuns?: number; // number of sweeps to run on mount
  intervalMs?: number; // interval for repeated sweeps after initial
};

/**
 * Shine/glass sweep overlay wrapper.
 * - Base `.shine` sets overlay; `.shine-active` triggers a single sweep.
 * - `.shine-hover` plays only on hover.
 * - When `hoverOnly=false`, component programmatically triggers sweeps:
 *   runs `initialRuns` times on mount, then one sweep every `intervalMs`.
 */
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
    if (hoverOnly) return; // hover handles activation via CSS

    const trigger = () => {
      // Toggle active to retrigger CSS animation
      setActive(true);
      // Remove active after animation duration (~1.2s)
      const timeout = window.setTimeout(() => setActive(false), 1300);
      return timeout;
    };

    // Run initial sweeps back-to-back
    const timeouts: number[] = [];
    for (let i = 0; i < initialRuns; i++) {
      const t = window.setTimeout(() => {
        runCountRef.current += 1;
        trigger();
      }, i * 1400); // slight buffer beyond 1.2s
      timeouts.push(t);
    }

    // After initial runs, set interval for periodic sweeps
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
