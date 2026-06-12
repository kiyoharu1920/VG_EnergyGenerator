"use client";

import { useEffect, useState } from "react";

export type ViewportSize = {
  width: number;
  height: number;
};

/**
 * 現在のビューポートサイズを購読する。
 *
 * @returns 最新のビューポート幅と高さ。
 */
export function useViewportSize(): ViewportSize {
  const [viewport, setViewport] = useState<ViewportSize>({ width: 390, height: 844 });

  useEffect(() => {
    const update = (): void =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return viewport;
}
