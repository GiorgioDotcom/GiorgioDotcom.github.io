"use client";

import { useEffect, useRef } from "react";
import type { Engine } from "@/lib/engine/Engine";
import type { Copy, PartId } from "@/lib/content";

const PARTS: PartId[] = ["ihs", "die", "caps", "substrate", "balls"];

type Props = {
  labels: Copy["stack"]["labels"];
  onEngine: (e: Engine | null) => void;
  onReady: () => void;
  onFail: () => void;
};

/** One fixed full-screen canvas behind the story, plus the callout layer. */
export default function Experience({ labels, onEngine, onReady, onFail }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    let engine: Engine | null = null;
    let cancelled = false;
    (async () => {
      try {
        performance.mark("fonts-wait");
        await document.fonts.ready; // the lid engraving uses the site fonts
        const { Engine } = await import("@/lib/engine/Engine");
        if (cancelled) return;
        engine = new Engine({
          canvas: canvasRef.current!,
          labelLayer: labelRef.current!,
          lineSvg: svgRef.current!,
          onReady,
        });
        onEngine(engine);
        if (process.env.NODE_ENV !== "production") (window as unknown as { __engine: Engine }).__engine = engine;
      } catch (err) {
        console.error(err);
        onFail();
      }
    })();
    return () => {
      cancelled = true;
      engine?.dispose();
      onEngine(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="stage" aria-hidden="true" />
      <div className="stage-glow" aria-hidden="true" />
      <svg ref={svgRef} className="callout-lines" aria-hidden="true">
        {PARTS.map((id) => (
          <path key={id} data-line={id} />
        ))}
      </svg>
      <div ref={labelRef} className="callouts" aria-hidden="true">
        {PARTS.map((id) => (
          <div key={id} className="callout" data-part={id}>
            <span className="callout-title">{labels[id].title}</span>
            <span className="callout-items">{labels[id].items}</span>
          </div>
        ))}
      </div>
    </>
  );
}
