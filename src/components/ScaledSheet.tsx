"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** 210mm at 96dpi */
const SHEET_PX = (210 / 25.4) * 96;

/**
 * Renders the A4 sheet at real size and scales it down to fit its container
 * (used for the live preview beside the form).
 */
export default function ScaledSheet({ children }: { children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const update = () => {
      const s = Math.min(1, o.clientWidth / SHEET_PX);
      setScale(s);
      setHeight(i.offsetHeight * s);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(o);
    ro.observe(i);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={outer} style={{ height }} className="w-full overflow-hidden">
      <div
        ref={inner}
        style={{ width: SHEET_PX, transform: `scale(${scale})`, transformOrigin: "top left" }}
        className="shadow-lg ring-1 ring-black/5"
      >
        {children}
      </div>
    </div>
  );
}
