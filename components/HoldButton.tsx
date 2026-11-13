"use client";

import { useEffect, useRef, useState } from "react";
import type { Engine } from "@/lib/engine/Engine";

const HOLD_MS = 1100;
const R = 19;
const C = 2 * Math.PI * R;

type Props = {
  engine: Engine | null;
  labelOn: string;
  labelOff: string;
  poweredLabel: string;
};

/** Hold-to-power with a progress ring. The same gesture unlocks audio and tilt. */
export default function HoldButton({ engine, labelOn, labelOff, poweredLabel }: Props) {
  const [powered, setPowered] = useState(false);
  const [progress, setProgress] = useState(0);
  const poweredRef = useRef(false);
  const holding = useRef(false);
  const raf = useRef(0);
  const start = useRef(0);
  const lastStep = useRef(0);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const tick = (now: number) => {
    if (holding.current) {
      const p = Math.min(1, (now - start.current) / HOLD_MS);
      setProgress(p);
      if (p - lastStep.current > 0.09) {
        lastStep.current = p;
        engine?.audio.holdStep(p);
      }
      if (p >= 1) {
        holding.current = false;
        poweredRef.current = !poweredRef.current;
        engine?.setPower(poweredRef.current);
        setPowered(poweredRef.current);
        setProgress(0);
        return;
      }
    } else {
      let done = false;
      setProgress((p) => {
        const n = Math.max(0, p - 0.06);
        done = n === 0;
        return n;
      });
      if (done) return;
    }
    raf.current = requestAnimationFrame(tick);
  };

  const down = () => {
    if (holding.current) return;
    void engine?.enableSensors();
    holding.current = true;
    lastStep.current = 0;
    start.current = performance.now() - progress * HOLD_MS;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(tick);
  };
  const up = () => {
    if (!holding.current) return;
    holding.current = false;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(tick);
  };

  return (
    <button
      type="button"
      className={`hold ${powered ? "is-on" : ""}`}
      onPointerDown={down}
      onPointerUp={up}
      onPointerLeave={up}
      onPointerCancel={up}
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && !e.repeat) {
          e.preventDefault();
          down();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === " " || e.key === "Enter") up();
      }}
      onContextMenu={(e) => e.preventDefault()}
      aria-pressed={powered}
    >
      <svg className="hold-ring" viewBox="0 0 44 44" aria-hidden="true">
        <circle cx="22" cy="22" r={R} className="hold-track" />
        <circle
          cx="22"
          cy="22"
          r={R}
          className="hold-progress"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - progress)}
        />
        <circle cx="22" cy="22" r="5" className="hold-dot" />
      </svg>
      <span className="hold-text">
        {powered && <em>{poweredLabel} · </em>}
        {powered ? labelOff : labelOn}
      </span>
    </button>
  );
}
