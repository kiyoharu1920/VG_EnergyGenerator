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
 * プレイヤーとテーマからゲージ配色クラスを返す。
 *
 * @param player 対象プレイヤー。
 * @param isDark 暗色テーマかどうか。
 * @returns ゲージに使うTailwindクラス群。
 */
export function getGaugeTheme(player: Player, isDark: boolean): GaugeTheme {
  return {
    accentBorder: player === "p1" ? "border-blue-400/50" : "border-red-400/50",
    panelBg: player === "p1"
      ? isDark ? "bg-blue-950/50" : "bg-blue-50"
      : isDark ? "bg-red-950/50" : "bg-red-50",
    cellBorder: isDark ? "border-slate-600" : "border-slate-300",
    cellDivider: isDark ? "border-slate-600/50" : "border-slate-300/70",
    resizeHandleColor: isDark ? "bg-slate-500" : "bg-slate-300",
  };
}

/**
 * ページと操作バーに使うテーマクラスを返す。
 *
 * @param isDark 暗色テーマかどうか。
 * @returns ページ背景と操作バーのTailwindクラス群。
 */
export function getPageTheme(isDark: boolean): PageTheme {
  return {
    rootBg: isDark ? "bg-slate-950" : "bg-slate-100",
    controlBg: isDark
      ? "bg-slate-700 hover:bg-slate-600 text-white border-slate-500"
      : "bg-white hover:bg-slate-200 text-slate-700 border-slate-200 shadow-md",
    centerBg: isDark
      ? "bg-slate-900/70 border-slate-700"
      : "bg-white/90 border-slate-200",
  };
}
