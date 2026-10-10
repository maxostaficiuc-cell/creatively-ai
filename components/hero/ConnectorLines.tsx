"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { TONE } from "@/components/hero/AnalysisCard";
import type { AnalysisTone } from "@/lib/demoCreative";

export type ConnectorLine = {
  id: string;
  tone: AnalysisTone;
  /** start point on the card edge, in stage pixels */
  from: { x: number; y: number };
  /** end point on the ad image, in stage pixels */
  to: { x: number; y: number };
};

export type ConnectorLinesHandle = {
  /** progress 0 → 1 per line id: draws the stroke and fades in the anchor dot */
  setProgress: (id: string, progress: number) => void;
};

/**
 * Thin illuminated lines from each analysis card to the part of the ad it
 * talks about. Drawn with `pathLength=1` + stroke-dashoffset so the draw
 * animation is a single compositor-friendly property per line.
 */
export const ConnectorLines = forwardRef<
  ConnectorLinesHandle,
  { lines: ConnectorLine[]; width: number; height: number; className?: string }
>(function ConnectorLines({ lines, width, height, className }, ref) {
  const pathRefs = useRef(new Map<string, SVGElement[]>());
  const dotRefs = useRef(new Map<string, SVGGElement>());

  useImperativeHandle(ref, () => ({
    setProgress(id, progress) {
      const p = Math.max(0, Math.min(1, progress));
      pathRefs.current.get(id)?.forEach((path) => {
        path.style.strokeDashoffset = String(1 - p);
        path.style.opacity = p > 0 ? "1" : "0";
      });
      const dot = dotRefs.current.get(id);
      if (dot) dot.style.opacity = String(Math.max(0, (p - 0.82) / 0.18));
    },
  }));

  if (!width || !height) return null;

  return (
    <svg
      className={`pointer-events-none absolute inset-0 ${className || ""}`}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
    >
      {lines.map((line) => {
        const rgb = TONE[line.tone].rgb;
        const dir = line.to.x > line.from.x ? 1 : -1;
        const k = Math.min(140, Math.abs(line.to.x - line.from.x) * 0.55);
        const d = `M ${line.from.x} ${line.from.y} C ${line.from.x + dir * k} ${line.from.y}, ${
          line.to.x - dir * k
        } ${line.to.y}, ${line.to.x} ${line.to.y}`;
        const register = (el: SVGElement | null) => {
          if (!el) return;
          const list = pathRefs.current.get(line.id) ?? [];
          if (!list.includes(el)) list.push(el);
          pathRefs.current.set(line.id, list);
        };
        return (
          <g key={line.id}>
            {/* soft glow underlay */}
            <path
              ref={register}
              d={d}
              pathLength={1}
              fill="none"
              stroke={`rgba(${rgb},0.22)`}
              strokeWidth={5}
              strokeLinecap="round"
              style={{ strokeDasharray: 1, strokeDashoffset: 1, opacity: 0 }}
            />
            {/* crisp core line */}
            <path
              ref={register}
              d={d}
              pathLength={1}
              fill="none"
              stroke={`rgba(${rgb},0.9)`}
              strokeWidth={1.2}
              strokeLinecap="round"
              style={{ strokeDasharray: 1, strokeDashoffset: 1, opacity: 0 }}
            />
            {/* anchor on the ad */}
            <g
              ref={(el) => {
                if (el) dotRefs.current.set(line.id, el);
              }}
              style={{ opacity: 0 }}
            >
              <circle cx={line.to.x} cy={line.to.y} r={9} fill={`rgba(${rgb},0.16)`} className="hero-anchor-pulse" />
              <circle cx={line.to.x} cy={line.to.y} r={3.5} fill={`rgb(${rgb})`} />
              <circle cx={line.to.x} cy={line.to.y} r={3.5} fill="none" stroke="white" strokeOpacity={0.7} strokeWidth={1} />
            </g>
            {/* start cap on the card edge */}
            <circle ref={register} cx={line.from.x} cy={line.from.y} r={2} fill={`rgb(${rgb})`} style={{ opacity: 0 }} />
          </g>
        );
      })}
    </svg>
  );
});
