import type { ReactElement } from "react";
import { EnergyCells } from "./EnergyCells";
import { CELL_MAX, CELL_MIN } from "./energyGaugeConstants";
import { ResizeHandle } from "./ResizeHandle";
import type { ResizeHandlePosition } from "./ResizeHandle";
import { StepButtons } from "./StepButtons";
import { getGaugeTheme } from "../theme";
import type { Player, PlayerMode } from "../types";

export { CELL_DEFAULT } from "./energyGaugeConstants";

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
  /** セル高さ。 */
  cellSize: number;
  /** 画面内に収まるセル高さの上限。 */
  maxCellSize: number;
  /** セル高さを更新する。 */
  onCellSizeChange: (size: number) => void;
  /** リサイズつまみを上端または下端のどちらに出すか。 */
  resizeHandlePosition?: ResizeHandlePosition;
};

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
 * エネルギー値の表示、タップ/ドラッグ変更、増減ボタン、サイズ変更を扱うゲージ。
 *
 * @param props プレイヤー、エネルギー値、サイズ制御。
 * @returns エネルギー操作パネル。
 */
export function EnergyGauge({
  player,
  energy,
  onEnergyChange,
  rotate,
  cellSize,
  maxCellSize,
  onCellSizeChange,
  resizeHandlePosition = "top",
}: EnergyGaugeProps): ReactElement {
  const { accentBorder, panelBg, cellBorder, cellDivider, resizeHandleColor } =
    getGaugeTheme(player);
  const { btnHeight, btnPx, btnFontSize, cellFontSize } =
    calcCellMetrics(cellSize);
  const resizeHandle: ReactElement = (
    <ResizeHandle
      cellSize={cellSize}
      maxCellSize={maxCellSize}
      onCellSizeChange={onCellSizeChange}
      rotate={rotate}
      resizeHandlePosition={resizeHandlePosition}
      handleColor={resizeHandleColor}
      player={player}
    />
  );

  return (
    <div
      data-testid={`${player}-gauge`}
      className={`flex flex-col items-center w-full rounded-2xl border gap-1 px-[clamp(10px,7vw,72px)] pb-2 pt-1 transition-colors ${panelBg} ${accentBorder} ${rotate ? "rotate-180" : ""}`}
    >
      {resizeHandlePosition === "top" && resizeHandle}

      <div className="w-full flex flex-col gap-2">
        {/* エネルギーセル: flex-1均等分割で常に全幅表示 */}
        <EnergyCells
          player={player}
          energy={energy}
          onEnergyChange={onEnergyChange}
          rotate={rotate}
          cellSize={cellSize}
          cellFontSize={cellFontSize}
          cellBorder={cellBorder}
          cellDivider={cellDivider}
        />

        {/* 操作ボタン行: 5列固定で小幅端末の横はみ出しを防ぐ */}
        <StepButtons
          player={player}
          energy={energy}
          onEnergyChange={onEnergyChange}
          btnHeight={btnHeight}
          btnPx={btnPx}
          btnFontSize={btnFontSize}
        />
      </div>
      {resizeHandlePosition === "bottom" && resizeHandle}
    </div>
  );
}
