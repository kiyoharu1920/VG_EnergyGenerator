import type { PointerEvent, ReactElement } from "react";
import { useRef } from "react";
import { ENERGY_CELL_COUNT, ENERGY_MAX } from "./energyGaugeConstants";
import { setPointerCaptureSafely } from "./pointerCapture";
import type { Player } from "../types";

type EnergyCellsProps = {
  /** 操作対象プレイヤー。 */
  player: Player;
  /** 現在のエネルギー値。 */
  energy: number;
  /** エネルギー値を更新する。 */
  onEnergyChange: (value: number) => void;
  /** 対面プレイヤー向けに180度回転するかどうか。 */
  rotate: boolean;
  /** 暗色テーマかどうか。 */
  isDark: boolean;
  /** セル高さ。 */
  cellSize: number;
  /** セル内の文字サイズ。 */
  cellFontSize: number;
  /** セル列の枠線クラス。 */
  cellBorder: string;
  /** セル間の区切り線クラス。 */
  cellDivider: string;
};

function getCellClasses(
  index: number,
  energy: number,
  isDark: boolean,
): string {
  if (index === energy) return "bg-emerald-400 text-slate-900";
  if (index < energy) return "bg-cyan-500/80 text-slate-900";
  return isDark
    ? "bg-slate-800/60 text-slate-500"
    : "bg-slate-200 text-slate-400";
}

function getIndexFromPointer(
  clientX: number,
  rect: DOMRect,
  rotate: boolean,
): number {
  const cellWidth = rect.width / ENERGY_CELL_COUNT;
  const raw = Math.max(
    0,
    Math.min(ENERGY_MAX, Math.floor((clientX - rect.left) / cellWidth)),
  );
  return rotate ? ENERGY_MAX - raw : raw;
}

/**
 * エネルギーセル列を表示し、タップ/ドラッグでエネルギー値を変更する。
 *
 * @param props プレイヤー、エネルギー値、テーマ、セル寸法。
 * @returns エネルギーセル列。
 */
export function EnergyCells({
  player,
  energy,
  onEnergyChange,
  rotate,
  isDark,
  cellSize,
  cellFontSize,
  cellBorder,
  cellDivider,
}: EnergyCellsProps): ReactElement {
  const cellsRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  /** セル列の押下開始時に、押した位置のエネルギーへ変更する。 */
  const handlePointerDown = (e: PointerEvent<HTMLDivElement>): void => {
    isDragging.current = true;
    const el = cellsRef.current;
    if (!el) return;
    setPointerCaptureSafely(el, e.pointerId);
    onEnergyChange(
      getIndexFromPointer(e.clientX, el.getBoundingClientRect(), rotate),
    );
  };

  /** セル列をドラッグ中だけ、ポインター位置に合わせてエネルギーを更新する。 */
  const handlePointerMove = (e: PointerEvent<HTMLDivElement>): void => {
    if (!isDragging.current || !cellsRef.current) return;
    onEnergyChange(
      getIndexFromPointer(
        e.clientX,
        cellsRef.current.getBoundingClientRect(),
        rotate,
      ),
    );
  };

  /** セル列のドラッグ状態を解除する。 */
  const handlePointerUp = (): void => {
    isDragging.current = false;
  };

  return (
    <div
      ref={cellsRef}
      data-testid={`${player}-cells`}
      className={`w-full flex border ${cellBorder} rounded-xl overflow-hidden touch-none`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onLostPointerCapture={handlePointerUp}
    >
      {Array.from({ length: ENERGY_MAX + 1 }, (_, i) => (
        <button
          key={i}
          type="button"
          className={`flex-1 min-w-0 font-bold flex items-center justify-center border-r ${cellDivider} text-center select-none transition-colors ${getCellClasses(i, energy, isDark)}`}
          style={{ height: cellSize, fontSize: cellFontSize }}
          onClick={(e) => {
            if (e.detail === 0) onEnergyChange(i);
          }}
          aria-label={`${player} energy ${i}`}
          aria-pressed={i === energy}
        >
          {i}
        </button>
      ))}
    </div>
  );
}
