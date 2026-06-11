import type { PointerEvent, ReactElement } from "react";
import { useRef } from "react";
import { getGaugeTheme } from "../theme";
import type { Player, PlayerMode } from "../types";

/** エネルギーゲージの最大値。 */
const ENERGY_MAX = 10;
/** 0を含むエネルギーセルの個数。 */
const ENERGY_CELL_COUNT = ENERGY_MAX + 1;

/** 初期セル高さ。 */
export const CELL_DEFAULT = 44;
/** ドラッグ縮小時に維持する最小セル高さ。 */
const CELL_MIN = 28;
/** 画面に余裕がある時の最大セル高さ。 */
const CELL_MAX = 112;

type ResizeHandlePosition = "top" | "bottom";
type StepButton = readonly [delta: number, colorClass: string];

type CellMetrics = {
  btnHeight: number;
  btnPx: number;
  btnFontSize: number;
  cellFontSize: number;
};

type EnergyGaugeProps = {
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
  /** 画面内に収まるセル高さの上限。 */
  maxCellSize: number;
  /** セル高さを更新する。 */
  onCellSizeChange: (size: number) => void;
  /** リサイズつまみを上端または下端のどちらに出すか。 */
  resizeHandlePosition?: ResizeHandlePosition;
};

/** エネルギー増減ボタン。色はカードゲームの増減方向が見分けやすい順に固定する。 */
const STEP_BUTTONS: StepButton[] = [
  [
    -7,
    "bg-violet-700 hover:bg-violet-600 active:bg-violet-500 shadow-lg shadow-violet-900/50",
  ],
  [
    -3,
    "bg-blue-700 hover:bg-blue-600 active:bg-blue-500 shadow-lg shadow-blue-900/50",
  ],
  [
    -1,
    "bg-blue-500 hover:bg-blue-400 active:bg-blue-300 shadow-md shadow-blue-700/50",
  ],
  [
    +1,
    "bg-rose-500 hover:bg-rose-400 active:bg-rose-300 shadow-md shadow-rose-700/50",
  ],
  [
    +3,
    "bg-rose-700 hover:bg-rose-600 active:bg-rose-500 shadow-lg shadow-rose-900/50",
  ],
];

/**
 * エネルギー値を有効範囲内へ丸める。
 *
 * @param value 丸める前のエネルギー値。
 * @returns 0からENERGY_MAXまでに制限した値。
 */
function clampEnergy(value: number): number {
  return Math.max(0, Math.min(ENERGY_MAX, value));
}

/**
 * エネルギーセルの状態別クラスを返す。
 *
 * @param index セル番号。
 * @param energy 現在のエネルギー値。
 * @param isDark 暗色テーマかどうか。
 * @returns 選択中、充填済み、空セルのTailwindクラス。
 */
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

/**
 * ポインター位置からエネルギー値を算出する。
 *
 * @param clientX 画面上のポインターX座標。
 * @param rect セル列の表示矩形。
 * @param rotate 対面プレイヤー用に180度回転しているかどうか。
 * @returns 0からENERGY_MAXまでのエネルギー値。
 */
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
 * セル高さから、ゲージ内部のボタンと文字の寸法を決める。
 *
 * @param cellSize 現在のセル高さ。
 * @returns セルと操作ボタンに使う寸法。
 */
function calcCellMetrics(cellSize: number): CellMetrics {
  return {
    btnHeight: Math.min(Math.round(cellSize * 0.8), 64),
    btnPx: Math.min(Math.round(cellSize * 0.28), 18),
    btnFontSize: Math.max(10, Math.min(Math.round(cellSize * 0.28), 16)),
    cellFontSize: Math.max(10, Math.min(Math.round(cellSize * 0.35), 22)),
  };
}

/**
 * 画面サイズと表示モードから、セル高さの上限を計算する。
 *
 * @param width ビューポート幅。
 * @param height ビューポート高さ。
 * @param playerMode 1人用または2人用。
 * @param showCardText 効果欄を表示しているかどうか。
 * @returns レイアウト内に収まるセル高さの上限。
 */
export function getResponsiveCellMax(
  width: number,
  height: number,
  playerMode: PlayerMode,
  showCardText: boolean,
): number {
  const gaugeCount = playerMode === "double" ? 2 : 1;
  const shortestSide = Math.min(width, height);
  const pagePadding = Math.max(8, shortestSide * 0.04);
  const centerReserve = showCardText
    ? playerMode === "double"
      ? 86
      : 126
    : 54;
  const availablePerGauge =
    (height - pagePadding * 2 - centerReserve - 18) / gaugeCount;
  const maxFromHeight = Math.floor((availablePerGauge - 58) / 1.8);
  return Math.max(CELL_MIN, Math.min(CELL_MAX, maxFromHeight));
}

/**
 * pointer captureを安全に設定する。
 *
 * 一部の合成ポインターイベントではcapture対象が存在しないため、失敗時は操作を続行する。
 *
 * @param element capture対象のHTML要素。
 * @param pointerId pointerイベントID。
 */
function setPointerCaptureSafely(
  element: HTMLElement,
  pointerId: number,
): void {
  try {
    element.setPointerCapture(pointerId);
  } catch {
    // capture できない場合もタップ処理自体は継続する。
  }
}

/**
 * エネルギー値の表示、タップ/ドラッグ変更、増減ボタン、サイズ変更を扱うゲージ。
 *
 * @param props プレイヤー、エネルギー値、テーマ、サイズ制御。
 * @returns エネルギー操作パネル。
 */
export function EnergyGauge({
  player,
  energy,
  onEnergyChange,
  rotate,
  isDark,
  cellSize,
  maxCellSize,
  onCellSizeChange,
  resizeHandlePosition = "top",
}: EnergyGaugeProps): ReactElement {
  const cellsRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const resizeStart = useRef<{ y: number; size: number } | null>(null);

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

  const { accentBorder, panelBg, cellBorder, cellDivider, resizeHandleColor } =
    getGaugeTheme(player, isDark);
  const { btnHeight, btnPx, btnFontSize, cellFontSize } =
    calcCellMetrics(cellSize);
  const resizeHandle: ReactElement = (
    <div
      data-testid={`${player}-resize`}
      className="w-full h-5 flex items-center justify-center cursor-ns-resize touch-none select-none"
      onPointerDown={handleResizeDown}
      onPointerMove={handleResizeMove}
      onPointerUp={handleResizeUp}
      onPointerCancel={handleResizeUp}
      onLostPointerCapture={handleResizeUp}
    >
      <div className={`w-12 h-1 rounded-full ${resizeHandleColor}`} />
    </div>
  );

  return (
    <div
      data-testid={`${player}-gauge`}
      className={`flex flex-col items-center w-full rounded-2xl border gap-1 px-[clamp(10px,7vw,72px)] pb-2 pt-1 transition-colors ${panelBg} ${accentBorder} ${rotate ? "rotate-180" : ""}`}
    >
      {resizeHandlePosition === "top" && resizeHandle}

      <div className="w-full flex flex-col gap-2">
        {/* エネルギーセル: flex-1均等分割で常に全幅表示 */}
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

        {/* 操作ボタン行: 5列固定で小幅端末の横はみ出しを防ぐ */}
        <div className="grid grid-cols-5 gap-1 sm:gap-2 w-full pb-1">
          {STEP_BUTTONS.map(([d, cls]) => (
            <button
              key={d}
              type="button"
              className={`min-w-0 flex items-center justify-center text-white rounded-full select-none font-bold transition-all active:scale-95 ${cls}`}
              style={{
                height: btnHeight,
                paddingInline: btnPx,
                fontSize: btnFontSize,
              }}
              onClick={() => onEnergyChange(clampEnergy(energy + d))}
            >
              {d > 0 ? `+${d}` : d}
            </button>
          ))}
        </div>
      </div>
      {resizeHandlePosition === "bottom" && resizeHandle}
    </div>
  );
}
