import { useRef, useCallback } from "react";

/**
 * Pointer-drag hook untuk menggeser panel.
 * onMove dipanggil dengan delta total dari awal drag (bukan per frame).
 */
export function usePointerDrag(
  initial: { x: number; y: number },
  onChange: (next: { x: number; y: number }) => void
) {
  const start = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    start.current = { px: e.clientX, py: e.clientY, ox: initial.x, oy: initial.y };
    e.preventDefault();
  }, [initial.x, initial.y]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!start.current) return;
    const dx = e.clientX - start.current.px;
    const dy = e.clientY - start.current.py;
    onChange({ x: start.current.ox + dx, y: start.current.oy + dy });
  }, [onChange]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    start.current = null;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp };
}
