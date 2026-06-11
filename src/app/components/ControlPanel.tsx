import type { ReactElement } from "react";
import { getPageTheme } from "../theme";
import type { CoinResult, ControlPanelLayout } from "../types";

type ControlPanelProps = {
  /** 操作バーを横並び固定にするか、横画面で縦並びへ切り替えるか。 */
  layout?: ControlPanelLayout;
  /** 現在2人用表示かどうか。 */
  isDouble: boolean;
  /** 暗色テーマかどうか。 */
  isDark: boolean;
  /** 効果欄を表示しているかどうか。 */
  showCardText: boolean;
  /** 最後に振った6面サイコロの結果。未実行ならnull。 */
  diceResult: number | null;
  /** 最後のコイントス結果。未実行ならnull。 */
  coinResult: CoinResult | null;
  /** サイコロを振った回数。結果が同じ時も表示更新を識別する。 */
  diceRollId: number;
  /** コイントスを行った回数。結果が同じ時も表示更新を識別する。 */
  coinTossId: number;
  /** 1人用と2人用を切り替える。 */
  onTogglePlayerMode: () => void;
  /** 明色と暗色を切り替える。 */
  onToggleDark: () => void;
  /** 効果欄を開閉する。 */
  onToggleCardText: () => void;
  /** 6面サイコロを振る。 */
  onRollDice: () => void;
  /** コイントスを行う。 */
  onTossCoin: () => void;
};

/**
 * プレイヤー切替、TCG補助ツール、テーマ切替、効果欄開閉をまとめた操作バー。
 *
 * @param props 操作バーの表示状態と各操作ハンドラ。
 * @returns 中央操作バー。
 */
export function ControlPanel({
  layout = "responsive",
  isDouble,
  isDark,
  showCardText,
  diceResult,
  coinResult,
  diceRollId,
  coinTossId,
  onTogglePlayerMode,
  onToggleDark,
  onToggleCardText,
  onRollDice,
  onTossCoin,
}: ControlPanelProps): ReactElement {
  const { controlBg, centerBg } = getPageTheme(isDark);
  const isHorizontal = layout === "horizontal";
  const panelDirectionClass = isHorizontal ? "flex-row" : "portrait:flex-row landscape:flex-col";
  const controlButtonClass = isHorizontal ? "" : "landscape:w-full";
  const diceCoinWrapperClass = isHorizontal ? "w-16" : "w-16 landscape:w-full";
  const themeWrapperClass = isHorizontal ? "w-10" : "w-10 landscape:w-full";

  return (
    <div
      data-testid="center-controls"
      className={`shrink-0 w-full rounded-xl border p-1.5 flex ${panelDirectionClass} items-center justify-center gap-1.5 transition-colors ${centerBg}`}
    >
      <button
        data-testid="player-mode-toggle"
        onClick={onTogglePlayerMode}
        className={`control-pressable h-8 min-w-0 flex-1 ${controlButtonClass} rounded-lg border px-2 text-[12px] font-bold transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.97] ${controlBg}`}
        aria-label={isDouble ? "switch to single player" : "switch to two players"}
      >
        <span key={isDouble ? "double" : "single"} className="control-value-pop">
          {isDouble ? "1人用へ" : "2人用へ"}
        </span>
      </button>
      <div className={`${diceCoinWrapperClass} shrink-0 flex items-center justify-center`}>
        <button
          key={`dice-button-${diceRollId}`}
          data-testid="dice-roll"
          onClick={onRollDice}
          className={`control-pressable h-8 w-16 shrink-0 rounded-full border text-sm font-bold transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.92] ${diceRollId > 0 ? "control-result-confirm" : ""} ${controlBg}`}
          aria-label="roll dice"
          title="サイコロ"
        >
          <span
            key={`dice-${diceRollId}-${diceResult ?? "idle"}`}
            data-animation-id={diceRollId}
            className="control-value-pop"
            aria-live="polite"
          >
            {diceResult ?? "🎲"}
          </span>
        </button>
      </div>
      <div className={`${themeWrapperClass} shrink-0 flex items-center justify-center`}>
        <button
          data-testid="theme-toggle"
          onClick={onToggleDark}
          className={`control-pressable h-8 w-8 shrink-0 rounded-full border text-base font-bold transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.92] ${controlBg}`}
          aria-label="toggle theme"
        >
          <span key={isDark ? "light" : "dark"} className="control-value-pop">
            {isDark ? "☀" : "🌙"}
          </span>
        </button>
      </div>
      <div className={`${diceCoinWrapperClass} shrink-0 flex items-center justify-center`}>
        <button
          key={`coin-button-${coinTossId}`}
          data-testid="coin-toss"
          onClick={onTossCoin}
          className={`control-pressable h-8 w-16 shrink-0 rounded-full border text-[12px] font-bold transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.92] ${coinTossId > 0 ? "control-result-confirm" : ""} ${controlBg}`}
          aria-label="coin toss"
          title="コイントス"
        >
          <span
            key={`coin-${coinTossId}-${coinResult ?? "idle"}`}
            data-animation-id={coinTossId}
            className="control-value-pop"
            aria-live="polite"
          >
            {coinResult ?? "🪙"}
          </span>
        </button>
      </div>
      <button
        data-testid="card-text-toggle"
        onClick={onToggleCardText}
        className={`control-pressable h-8 min-w-0 flex-1 ${controlButtonClass} rounded-lg border px-2 text-[12px] font-bold transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.97] ${controlBg}`}
        aria-expanded={showCardText}
      >
        <span key={showCardText ? "open" : "closed"} className="control-value-pop">
          {showCardText ? "効果欄を閉じる" : "効果欄を開く"}
        </span>
      </button>
    </div>
  );
}
