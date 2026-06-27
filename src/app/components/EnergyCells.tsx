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
  /** セル高さ。 */
  cellSize: number;
  /** セル内の文字サイズ。 */
  cellFontSize: number;
  /** セル列の枠線クラス。 */
  cellBorder: string;
  /** セル間の区切り線クラス。 */
  cellDivider: string;
};

/** プレイヤーの日本語表示名。aria-labelに使う。 */
const PLAYER_LABEL: Record<Player, string> = { p1: "P1", p2: "P2" };

/** セルの状態（選択中／以下／空）に応じた配色クラスを返す。実際の色はスキン別CSS変数が供給する。 */
function getCellClasses(index: number, energy: number): string {
  if (index === energy) return "bg-[var(--cell-on-bg)] text-[var(--cell-on-text)]";
  if (index < energy) return "bg-[var(--cell-fill-bg)] text-[var(--cell-fill-text)]";
  return "bg-[var(--cell-empty-bg)] text-[var(--cell-empty-text)]";
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
  cellSize,
  cellFontSize,
  cellBorder,
  cellDivider,
}: EnergyCellsProps): ReactElement {
  const cellsRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  /** 最後にemitしたエネルギー値。同値の連続更新を抑止する。 */
  const lastEmitted = useRef<number>(-1);

  /** 同値なら更新をスキップし、変化時だけ親へ通知する。 */
  const emitEnergy = (value: number): void => {
    if (value === lastEmitted.current) return;
    lastEmitted.current = value;
    onEnergyChange(value);
  };

  /** セル列の押下開始時に、押した位置のエネルギーへ変更する。 */
  const handlePointerDown = (e: PointerEvent<HTMLDivElement>): void => {
    // 主ポインターの左ボタンのみ受け付け、副ボタン・複数タッチの誤操作を防ぐ。
    if (!e.isPrimary || e.button !== 0) return;
    isDragging.current = true;
    const el = cellsRef.current;
    if (!el) return;
    setPointerCaptureSafely(el, e.pointerId);
    emitEnergy(getIndexFromPointer(e.clientX, el.getBoundingClientRect(), rotate));
  };

  /** セル列をドラッグ中だけ、ポインター位置に合わせてエネルギーを更新する。 */
  const handlePointerMove = (e: PointerEvent<HTMLDivElement>): void => {
    if (!isDragging.current || !cellsRef.current) return;
    emitEnergy(
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
    lastEmitted.current = -1;
  };

  return (
    <div
      ref={cellsRef}
      data-testid={`${player}-cells`}
      role="radiogroup"
      aria-label={`${PLAYER_LABEL[player]} エネルギー量`}
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
          role="radio"
          className={`focus-ring relative flex-1 min-w-0 font-bold flex items-center justify-center border-r ${cellDivider} text-center select-none transition-colors ${getCellClasses(i, energy)}`}
          style={{ height: cellSize, fontSize: cellFontSize }}
          onClick={(e) => {
            if (e.detail === 0) onEnergyChange(i);
          }}
          aria-label={`${PLAYER_LABEL[player]} エネルギー ${i}`}
          aria-checked={i === energy}
        >
          {i}
        </button>
      ))}
    </div>
  );
}
