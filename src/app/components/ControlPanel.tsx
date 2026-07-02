import type { ReactElement, ReactNode } from "react";
import { SKIN_LABEL } from "../skins";
import { getPageTheme } from "../theme";
import type { CoinResult, ControlPanelLayout, DesignSkin } from "../types";
import type { RandomTool } from "../use-random-tool";

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
  /** 6面サイコロの結果・実行回数・操作。 */
  dice: RandomTool<number>;
  /** コイントスの結果・実行回数・操作。 */
  coin: RandomTool<CoinResult>;
  /** 1人用と2人用を切り替える。 */
  onTogglePlayerMode: () => void;
  /** エネルギーとランダム結果を初期化する。 */
  onResetGame: () => void;
  /** 明色と暗色を切り替える。 */
  onToggleDark: () => void;
  /** 効果欄を開閉する。 */
  onToggleCardText: () => void;
  /** デザインスキンを次へ切り替える。 */
  onCycleSkin: () => void;
};

const CONTROL_BUTTON_BASE =
  "control-pressable focus-ring h-8 font-bold transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0";

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

type ControlButtonProps = {
  testid: string;
  onClick: () => void;
  className: string;
  ariaLabel: string;
  title?: string;
  ariaExpanded?: boolean;
  children: ReactNode;
};

type ControlSlotProps = {
  className: string;
  children: ReactNode;
};

/** 中央操作バー内のボタン共通設定。 */
function ControlButton({
  testid,
  onClick,
  className,
  ariaLabel,
  title,
  ariaExpanded,
  children,
}: ControlButtonProps): ReactElement {
  return (
    <button
      type="button"
      data-testid={testid}
      onClick={onClick}
      className={`${CONTROL_BUTTON_BASE} ${className}`}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      title={title}
    >
      {children}
    </button>
  );
}

/** 固定幅ボタンを中央揃えで配置する枠。 */
function ControlSlot({ className, children }: ControlSlotProps): ReactElement {
  return (
    <div className={`${className} shrink-0 flex items-center justify-center`}>
      {children}
    </div>
  );
}

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
    <ControlSlot className={wrapperClass}>
      <ControlButton
        testid={testid}
        onClick={onClick}
        className={`w-full shrink-0 rounded-[var(--radius-btn)] [border-width:var(--border-w)] ${fontSizeClass} active:scale-[0.92] ${rollId > 0 ? "control-result-confirm" : ""} ${controlBg}`}
        ariaLabel={ariaLabel}
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
      </ControlButton>
    </ControlSlot>
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
  dice,
  coin,
  onTogglePlayerMode,
  onResetGame,
  onToggleDark,
  onToggleCardText,
  onCycleSkin,
}: ControlPanelProps): ReactElement {
  const { controlBg, centerBg } = getPageTheme();
  const isHorizontal = layout === "horizontal";
  const panelDirectionClass = isHorizontal ? "flex-row" : "portrait:flex-row landscape:flex-col";
  const controlButtonClass = isHorizontal ? "" : "landscape:w-full";
  const wideActionWrapperClass = isHorizontal
    ? "w-[clamp(2.5rem,14vw,4rem)]"
    : "w-[clamp(2.5rem,14vw,4rem)] landscape:w-full";
  const diceCoinWrapperClass = wideActionWrapperClass;
  const resetWrapperClass = wideActionWrapperClass;
  const themeWrapperClass = isHorizontal ? "w-10" : "w-10 landscape:w-full";
  const skinWrapperClass = wideActionWrapperClass;

  return (
    <div
      data-testid="center-controls"
      className={`shrink-0 w-full rounded-[var(--radius-control)] [border-width:var(--border-w)] shadow-[var(--control-shadow)] p-1.5 flex ${panelDirectionClass} items-center justify-center gap-1.5 transition-colors ${centerBg}`}
    >
      <ControlButton
        testid="player-mode-toggle"
        onClick={onTogglePlayerMode}
        className={`min-w-0 flex-1 ${controlButtonClass} rounded-[var(--radius-control)] [border-width:var(--border-w)] px-1 text-[12px] active:scale-[0.97] ${controlBg}`}
        ariaLabel={isDouble ? "1人用へ切り替える" : "2人用へ切り替える"}
      >
        <span key={isDouble ? "double" : "single"} className="control-value-pop whitespace-nowrap">
          {isDouble ? "1人" : "2人"}
        </span>
      </ControlButton>
      <ControlSlot className={resetWrapperClass}>
        <ControlButton
          testid="reset-game"
          onClick={onResetGame}
          className={`w-full shrink-0 rounded-[var(--radius-btn)] [border-width:var(--border-w)] text-base active:scale-[0.92] ${controlBg}`}
          ariaLabel="エネルギーとランダム結果をリセットする"
          title="リセット"
        >
          <span className="control-value-pop" aria-hidden="true">
            ↺
          </span>
        </ControlButton>
      </ControlSlot>
      <RandomToolButton
        testid="dice-roll"
        rollId={dice.rollId}
        result={dice.result}
        idleIcon="🎲"
        title="サイコロ"
        ariaLabel="サイコロを振る"
        fontSizeClass="text-sm"
        wrapperClass={diceCoinWrapperClass}
        onClick={dice.trigger}
        controlBg={controlBg}
      />
      <ControlSlot className={themeWrapperClass}>
        <ControlButton
          testid="theme-toggle"
          onClick={onToggleDark}
          className={`w-8 shrink-0 rounded-[var(--radius-btn)] [border-width:var(--border-w)] text-base active:scale-[0.92] ${controlBg}`}
          ariaLabel={isDark ? "明色テーマへ切り替える" : "暗色テーマへ切り替える"}
        >
          <span key={isDark ? "light" : "dark"} className="control-value-pop">
            {isDark ? "☀" : "🌙"}
          </span>
        </ControlButton>
      </ControlSlot>
      <RandomToolButton
        testid="coin-toss"
        rollId={coin.rollId}
        result={coin.result}
        idleIcon="🪙"
        title="コイントス"
        ariaLabel="コイントスをする"
        fontSizeClass="text-[12px]"
        wrapperClass={diceCoinWrapperClass}
        onClick={coin.trigger}
        controlBg={controlBg}
      />
      <ControlSlot className={skinWrapperClass}>
        <ControlButton
          testid="skin-toggle"
          onClick={onCycleSkin}
          className={`w-full shrink-0 rounded-[var(--radius-btn)] [border-width:var(--border-w)] text-[12px] active:scale-[0.92] ${controlBg}`}
          ariaLabel={`デザインを切り替える（現在 ${SKIN_LABEL[skin]}）`}
          title="デザイン切替"
        >
          <span key={skin} className="control-value-pop">
            {SKIN_LABEL[skin]}
          </span>
        </ControlButton>
      </ControlSlot>
      <ControlButton
        testid="card-text-toggle"
        onClick={onToggleCardText}
        className={`min-w-0 flex-1 ${controlButtonClass} rounded-[var(--radius-control)] [border-width:var(--border-w)] px-1 text-[12px] active:scale-[0.97] ${controlBg}`}
        ariaExpanded={showCardText}
        ariaLabel={showCardText ? "効果欄を閉じる" : "効果欄を開く"}
        title={showCardText ? "効果欄を閉じる" : "効果欄を開く"}
      >
        <span key={showCardText ? "open" : "closed"} className="control-value-pop whitespace-nowrap">
          {showCardText ? "閉" : "開"}
        </span>
      </ControlButton>
    </div>
  );
}
