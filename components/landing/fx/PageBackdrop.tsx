"use client";

import type { Backdrop } from "@/lib/page-builder/types";
import { Aurora, Beams, DotGrid, Mesh, Noise } from "./backgrounds";

/**
 * The fixed atmosphere under every section of a page (themeConfig.backdrop). One shared backdrop
 * is what keeps differently-shuffled sections looking like parts of the same page.
 * `blobs` is the original look and the default for pages saved before backdrops existed.
 */
export function PageBackdrop({ kind, fixed = true }: { kind?: Backdrop | null; fixed?: boolean }) {
  const k: Backdrop = kind ?? "blobs";
  const blobs = (
    <>
      <div className="f-blob a" />
      <div className="f-blob b" />
      <div className="f-blob c" />
    </>
  );
  return (
    <div aria-hidden="true" className={`pointer-events-none ${fixed ? "fixed" : "absolute"} inset-0 overflow-hidden`}>
      {k === "blobs" && blobs}
      {k === "noise" && (
        <>
          {blobs}
          <Noise />
        </>
      )}
      {k === "aurora" && <Aurora fade="none" soft />}
      {k === "grid" && (
        <>
          <div className="f-blob a" />
          <div className="rt-bd-grid" />
        </>
      )}
      {k === "dots" && (
        <>
          <div className="f-blob b" />
          <DotGrid fade="none" interactive={false} />
        </>
      )}
      {k === "beams" && <Beams fade="none" className="opacity-50" />}
      {k === "mesh" && <Mesh fade="none" />}
    </div>
  );
}
