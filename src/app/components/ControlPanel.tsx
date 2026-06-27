import type { ReactElement } from "react";
import { getPageTheme } from "../theme";
import type { CoinResult, ControlPanelLayout, DesignSkin } from "../types";

type ControlPanelProps = {
  /** 操作バーを横並び固定にするか、横画面で縦並びへ切り替えるか。 */
  layout?: ControlPanelLayout;
  /** 現在2人用表示かどうか。 */
  isDouble: boolean;
  /** 暗色テーマかどうか。 */
  isDark: boolean;
  /** 効果欄を表示しているかどうか。 */
  showCardText: boolean;
  /** 現在のデザインスキン。 */
  skin: DesignSkin;
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
  /** デザインスキンを次へ切り替える。 */
  onCycleSkin: () => void;
  /** 6面サイコロを振る。 */
  onRollDice: () => void;
  /** コイントスを行う。 */
  onTossCoin: () => void;
};

/** デザイン切替ボタンに表示する各スキンの短縮名。 */
const SKIN_LABEL: Record<DesignSkin, string> = {
  original: "元",
  tcg: "卓上",
  minimal: "ミニ",
  led: "LED",
};

type RandomToolButtonProps = {
  /** ボタンのテストID。 */
  testid: "dice-roll" | "coin-toss";
  /** 結果更新を識別する実行回数。 */
  rollId: number;
  /** 表示する結果。未実行ならnull。 */
  result: number | CoinResult | null;
  /** 未実行時に表示するアイコン。 */
  idleIcon: string;
  /** ツールチップ文言。 */
  title: string;
  /** 支援技術向けラベル。 */
  ariaLabel: string;
  /** ボタン内の文字サイズクラス。 */
  fontSizeClass: string;
  /** 外側ラッパーの幅クラス。 */
  wrapperClass: string;
  /** ボタン押下時の処理。 */
  onClick: () => void;
  /** テーマに応じた背景クラス。 */
  controlBg: string;
};

/**
 * サイコロやコイントスの結果表示つき実行ボタン。
 *
 * @param props ランダムツールボタンの表示状態と操作ハンドラ。
 * @returns ランダムツール用ボタン。
 */
function RandomToolButton(props: RandomToolButtonProps): ReactElement {
  const {
    testid,
    rollId,
    result,
    idleIcon,
    title,
    ariaLabel,
    fontSizeClass,
    wrapperClass,
    onClick,
    controlBg,
  } = props;
  const toolKey = testid === "dice-roll" ? "dice" : "coin";

  return (
    <div
      className={`${wrapperClass} shrink-0 flex items-center justify-center`}
    >
      <button
        data-testid={testid}
        onClick={onClick}
        className={`control-pressable focus-ring h-8 w-16 shrink-0 rounded-[var(--radius-btn)] [border-width:var(--border-w)]${fontSizeClass} font-bold transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.92] ${rollId > 0 ? "control-result-confirm" : ""} ${controlBg}`}
        aria-label={ariaLabel}
        title={title}
      >
        <span
          key={`${toolKey}-${rollId}-${result ?? "idle"}`}
          data-animation-id={rollId}
          className="control-value-pop"
          aria-live="polite"
        >
          {result ?? idleIcon}
        </span>
      </button>
    </div>
  );
}

/**
 * プレイヤー切替、TCG補助ツール、テーマ/デザイン切替、効果欄開閉をまとめた操作バー。
 *
 * @param props 操作バーの表示状態と各操作ハンドラ。
 * @returns 中央操作バー。
 */
export function ControlPanel({
  layout = "responsive",
  isDouble,
  isDark,
  showCardText,
  skin,
  diceResult,
  coinResult,
  diceRollId,
  coinTossId,
  onTogglePlayerMode,
  onToggleDark,
  onToggleCardText,
  onCycleSkin,
  onRollDice,
  onTossCoin,
}: ControlPanelProps): ReactElement {
  const { controlBg, centerBg } = getPageTheme();
  const isHorizontal = layout === "horizontal";
  const panelDirectionClass = isHorizontal ? "flex-row" : "portrait:flex-row landscape:flex-col";
  const controlButtonClass = isHorizontal ? "" : "landscape:w-full";
  const diceCoinWrapperClass = isHorizontal ? "w-16" : "w-16 landscape:w-full";
  const themeWrapperClass = isHorizontal ? "w-10" : "w-10 landscape:w-full";
  const skinWrapperClass = isHorizontal ? "w-16" : "w-16 landscape:w-full";

  return (
    <div
      data-testid="center-controls"
      className={`shrink-0 w-full rounded-[var(--radius-control)] [border-width:var(--border-w)] shadow-[var(--control-shadow)] p-1.5 flex ${panelDirectionClass} items-center justify-center gap-1.5 transition-colors ${centerBg}`}
    >
      <button
        data-testid="player-mode-toggle"
        onClick={onTogglePlayerMode}
        className={`control-pressable focus-ring h-8 min-w-0 flex-1 ${controlButtonClass} rounded-[var(--radius-control)] [border-width:var(--border-w)] px-2 text-[12px] font-bold transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.97] ${controlBg}`}
        aria-label={isDouble ? "1人用へ切り替える" : "2人用へ切り替える"}
      >
        <span key={isDouble ? "double" : "single"} className="control-value-pop">
          {isDouble ? "1人用へ" : "2人用へ"}
        </span>
      </button>
      <RandomToolButton
        testid="dice-roll"
        rollId={diceRollId}
        result={diceResult}
        idleIcon="🎲"
        title="サイコロ"
        ariaLabel="サイコロを振る"
        fontSizeClass="text-sm"
        wrapperClass={diceCoinWrapperClass}
        onClick={onRollDice}
        controlBg={controlBg}
      />
      <div className={`${themeWrapperClass} shrink-0 flex items-center justify-center`}>
        <button
          data-testid="theme-toggle"
          onClick={onToggleDark}
          className={`control-pressable focus-ring h-8 w-8 shrink-0 rounded-[var(--radius-btn)] [border-width:var(--border-w)]text-base font-bold transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.92] ${controlBg}`}
          aria-label={isDark ? "明色テーマへ切り替える" : "暗色テーマへ切り替える"}
        >
          <span key={isDark ? "light" : "dark"} className="control-value-pop">
            {isDark ? "☀" : "🌙"}
          </span>
        </button>
      </div>
      <RandomToolButton
        testid="coin-toss"
        rollId={coinTossId}
        result={coinResult}
        idleIcon="🪙"
        title="コイントス"
        ariaLabel="コイントスをする"
        fontSizeClass="text-[12px]"
        wrapperClass={diceCoinWrapperClass}
        onClick={onTossCoin}
        controlBg={controlBg}
      />
      <div className={`${skinWrapperClass} shrink-0 flex items-center justify-center`}>
        <button
          data-testid="skin-toggle"
          onClick={onCycleSkin}
          className={`control-pressable focus-ring h-8 w-16 shrink-0 rounded-[var(--radius-btn)] [border-width:var(--border-w)]text-[12px] font-bold transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.92] ${controlBg}`}
          aria-label={`デザインを切り替える（現在 ${SKIN_LABEL[skin]}）`}
          title="デザイン切替"
        >
          <span key={skin} className="control-value-pop">
            {SKIN_LABEL[skin]}
          </span>
        </button>
      </div>
      <button
        data-testid="card-text-toggle"
        onClick={onToggleCardText}
        className={`control-pressable focus-ring h-8 min-w-0 flex-1 ${controlButtonClass} rounded-[var(--radius-control)] [border-width:var(--border-w)] px-2 text-[12px] font-bold transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.97] ${controlBg}`}
        aria-expanded={showCardText}
      >
        <span key={showCardText ? "open" : "closed"} className="control-value-pop">
          {showCardText ? "効果欄を閉じる" : "効果欄を開く"}
        </span>
      </button>
    </div>
  );
}
