import type { PointerEvent, ReactElement } from "react";
import { useRef } from "react";
import { CELL_MIN } from "./energyGaugeConstants";
import { setPointerCaptureSafely } from "./pointerCapture";
import type { Player } from "../types";

export type ResizeHandlePosition = "top" | "bottom";

type ResizeHandleProps = {
  /** セル高さ。 */
  cellSize: number;
  /** 画面内に収まるセル高さの上限。 */
  maxCellSize: number;
  /** セル高さを更新する。 */
  onCellSizeChange: (size: number) => void;
  /** 対面プレイヤー向けに180度回転するかどうか。 */
  rotate: boolean;
  /** リサイズつまみを上端または下端のどちらに出すか。 */
  resizeHandlePosition: ResizeHandlePosition;
  /** つまみのテーマ色クラス。 */
  handleColor: string;
  /** data-testidに使うプレイヤー。 */
  player: Player;
};

/**
 * エネルギーセルの高さを変更するリサイズつまみ。
 *
 * @param props サイズ制御、回転状態、表示位置、テーマ色。
 * @returns リサイズ用ハンドル。
 */
export function ResizeHandle({
  cellSize,
  maxCellSize,
  onCellSizeChange,
  rotate,
  resizeHandlePosition,
  handleColor,
  player,
}: ResizeHandleProps): ReactElement {
  const resizeStart = useRef<{ y: number; size: number } | null>(null);

  /** リサイズ開始時のポインター位置とセル高さを保持する。 */
  const handleResizeDown = (e: PointerEvent<HTMLDivElement>): void => {
    e.stopPropagation();
    setPointerCaptureSafely(e.currentTarget as HTMLDivElement, e.pointerId);
    resizeStart.current = { y: e.clientY, size: cellSize };
  };

  /** リサイズハンドルを配置した端から外側へ動かすとセルを拡大する。 */
  const handleResizeMove = (e: PointerEvent<HTMLDivElement>): void => {
    if (!resizeStart.current) return;
    const { y: startY, size: startSize } = resizeStart.current;
    const sign =
      resizeHandlePosition === "bottom" ? (rotate ? -1 : 1) : rotate ? 1 : -1;
    const newSize = Math.max(
      CELL_MIN,
      Math.min(
        maxCellSize,
        Math.round(startSize + sign * (e.clientY - startY) * 0.5),
      ),
    );
    onCellSizeChange(newSize);
  };

  /** リサイズ状態を解除する。 */
  const handleResizeUp = (): void => {
    resizeStart.current = null;
  };

  return (
    <div
      data-testid={`${player}-resize`}
      className="w-full h-5 flex items-center justify-center cursor-ns-resize touch-none select-none"
      onPointerDown={handleResizeDown}
      onPointerMove={handleResizeMove}
      onPointerUp={handleResizeUp}
      onPointerCancel={handleResizeUp}
      onLostPointerCapture={handleResizeUp}
    >
      <div className={`w-12 h-1 rounded-[var(--radius-handle)] ${handleColor}`} />
    </div>
  );
}
