import type { Player } from "./types";

type GaugeTheme = {
  accentBorder: string;
  panelBg: string;
  cellBorder: string;
  cellDivider: string;
  resizeHandleColor: string;
};

type PageTheme = {
  rootBg: string;
  controlBg: string;
  centerBg: string;
};

/**
 * プレイヤー別のゲージ配色クラスを返す。
 *
 * 実際の色は globals.css のスキン別CSS変数が供給する。
 * ここはどの変数を参照するかだけを決める。
 *
 * @param player 対象プレイヤー。
 * @returns ゲージに使うTailwindクラス群。
 */
export function getGaugeTheme(player: Player): GaugeTheme {
  const isP1 = player === "p1";
  return {
    accentBorder: isP1 ? "border-[var(--p1-accent)]" : "border-[var(--p2-accent)]",
    panelBg: isP1 ? "bg-[var(--p1-panel-bg)]" : "bg-[var(--p2-panel-bg)]",
    cellBorder: "border-[var(--cell-border)]",
    cellDivider: "border-[var(--cell-divider)]",
    resizeHandleColor: "bg-[var(--handle-bg)]",
  };
}

/**
 * ページと操作バーに使うテーマクラスを返す。
 *
 * 実際の色は globals.css のスキン別CSS変数が供給する。
 *
 * @returns ページ背景と操作バーのTailwindクラス群。
 */
export function getPageTheme(): PageTheme {
  return {
    rootBg: "bg-[var(--page-bg)]",
    controlBg:
      "bg-[var(--control-bg)] text-[var(--control-text)] border-[var(--control-border)] hover:bg-[var(--control-hover-bg)]",
    centerBg: "bg-[var(--center-bg)] border-[var(--center-border)]",
  };
}
