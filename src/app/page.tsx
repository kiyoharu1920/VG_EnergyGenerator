"use client";
import type { PointerEvent, ReactElement } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";

/** エネルギーゲージの最大値。 */
const ENERGY_MAX = 10;
/** 0を含むエネルギーセルの個数。 */
const ENERGY_CELL_COUNT = ENERGY_MAX + 1;

/**
 * エネルギー値を有効範囲内へ丸める。
 *
 * @param value 丸める前のエネルギー値。
 * @returns 0からENERGY_MAXまでに制限した値。
 */
const clampEnergy = (value: number): number => Math.max(0, Math.min(ENERGY_MAX, value));

/** 初期セル高さ。 */
const CELL_DEFAULT = 44;
/** ドラッグ縮小時に維持する最小セル高さ。 */
const CELL_MIN = 28;
/** 画面に余裕がある時の最大セル高さ。 */
const CELL_MAX = 112;

type Player = "p1" | "p2";
type PlayerMode = "single" | "double";
type ResizeHandlePosition = "top" | "bottom";
type ControlPanelLayout = "horizontal" | "responsive";
type CoinResult = "表" | "裏";

type StepButton = readonly [delta: number, colorClass: string];

type CellMetrics = {
  btnHeight: number;
  btnPx: number;
  btnFontSize: number;
  cellFontSize: number;
};

type ViewportSize = {
  width: number;
  height: number;
};

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

type ViewTransitionDocument = Document & {
  startViewTransition?: (updateCallback: () => void) => void;
};

/** エネルギー増減ボタン。色はカードゲームの増減方向が見分けやすい順に固定する。 */
const STEP_BUTTONS: StepButton[] = [
  [-7, "bg-violet-700 hover:bg-violet-600 active:bg-violet-500 shadow-lg shadow-violet-900/50"],
  [-3, "bg-blue-700 hover:bg-blue-600 active:bg-blue-500 shadow-lg shadow-blue-900/50"],
  [-1, "bg-blue-500 hover:bg-blue-400 active:bg-blue-300 shadow-md shadow-blue-700/50"],
  [+1, "bg-rose-500 hover:bg-rose-400 active:bg-rose-300 shadow-md shadow-rose-700/50"],
  [+3, "bg-rose-700 hover:bg-rose-600 active:bg-rose-500 shadow-lg shadow-rose-900/50"],
];

/** 表示するクレスト効果テキスト。 */
const energyGeneratorText = `《エネルギージェネレーター/Energy Generator》
ライドデッキクレスト

（ライドデッキクレストをライドデッキに１枚だけ入れられる）
【自】【ライドデッキ】：あなたがライドした時、このカードをクレストゾーンに置き、あなたが後攻なら【エネルギーチャージ】(3)。
【永】：あなたはエネルギーを10個まで持てる。
【自】：あなたのライドフェイズ開始時、【エネルギーチャージ】(3)。
【起】【ターン1回】：【コスト】[【エネルギーブラスト】(7)]することで、１枚引く。
`;

/**
 * エネルギーセルの状態別クラスを返す。
 *
 * @param index セル番号。
 * @param energy 現在のエネルギー値。
 * @param isDark 暗色テーマかどうか。
 * @returns 選択中、充填済み、空セルのTailwindクラス。
 */
function getCellClasses(index: number, energy: number, isDark: boolean): string {
  if (index === energy) return "bg-emerald-400 text-slate-900";
  if (index < energy) return "bg-cyan-500/80 text-slate-900";
  return isDark ? "bg-slate-800/60 text-slate-500" : "bg-slate-200 text-slate-400";
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
  rotate: boolean
): number {
  const cellWidth = rect.width / ENERGY_CELL_COUNT;
  const raw = Math.max(
    0,
    Math.min(ENERGY_MAX, Math.floor((clientX - rect.left) / cellWidth))
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
function getResponsiveCellMax(
  width: number,
  height: number,
  playerMode: PlayerMode,
  showCardText: boolean
): number {
  const gaugeCount = playerMode === "double" ? 2 : 1;
  const shortestSide = Math.min(width, height);
  const pagePadding = Math.max(8, shortestSide * 0.04);
  const centerReserve = showCardText
    ? playerMode === "double" ? 86 : 126
    : 54;
  const availablePerGauge =
    (height - pagePadding * 2 - centerReserve - 18) / gaugeCount;
  const maxFromHeight = Math.floor((availablePerGauge - 58) / 1.8);
  return Math.max(CELL_MIN, Math.min(CELL_MAX, maxFromHeight));
}

/**
 * 現在のビューポートサイズを購読する。
 *
 * @returns 最新のビューポート幅と高さ。
 */
function useViewportSize(): ViewportSize {
  const [viewport, setViewport] = useState<ViewportSize>({ width: 390, height: 844 });

  useEffect(() => {
    const update = (): void =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return viewport;
}

/**
 * pointer captureを安全に設定する。
 *
 * 一部の合成ポインターイベントではcapture対象が存在しないため、失敗時は操作を続行する。
 *
 * @param element capture対象のHTML要素。
 * @param pointerId pointerイベントID。
 */
function setPointerCaptureSafely(element: HTMLElement, pointerId: number): void {
  try {
    element.setPointerCapture(pointerId);
  } catch {
    // capture できない場合もタップ処理自体は継続する。
  }
}

/**
 * プレイヤーとテーマからゲージ配色クラスを返す。
 *
 * @param player 対象プレイヤー。
 * @param isDark 暗色テーマかどうか。
 * @returns ゲージに使うTailwindクラス群。
 */
function getGaugeTheme(player: Player, isDark: boolean): GaugeTheme {
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
function getPageTheme(isDark: boolean): PageTheme {
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

/**
 * プレイヤー数と効果欄の状態から、ページ全体の行構成を返す。
 *
 * @param playerMode 1人用または2人用。
 * @param showCardText 効果欄を表示しているかどうか。
 * @returns Tailwind arbitrary valueを含むgrid-rowクラス。
 */
function getGridRows(playerMode: PlayerMode, showCardText: boolean): string {
  const isDouble = playerMode === "double";
  if (isDouble) {
    return showCardText
      ? "grid-rows-[auto_minmax(0,1fr)_auto]"
      : "grid-rows-[auto_auto_auto] content-center";
  }
  return showCardText
    ? "grid-rows-[minmax(0,1fr)_auto]"
    : "grid-rows-[auto_auto] content-center";
}

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

/** 中央操作バーの表示と操作をまとめるProps。 */
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
function ControlPanel({
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

type EnergyTextCardProps = {
  /** 対面プレイヤー向けに180度回転するかどうか。 */
  rotate?: boolean;
  /** 暗色テーマかどうか。 */
  isDark: boolean;
  /** プレイヤー別の枠色などを追加するクラス。 */
  className?: string;
};

/**
 * エネルギージェネレーターの効果欄。
 *
 * @param props 表示方向、テーマ、追加クラス。
 * @returns 効果テキストカード。
 */
function EnergyTextCard({
  rotate = false,
  isDark,
  className = "",
}: EnergyTextCardProps): ReactElement {
  const cardBg = isDark
    ? "bg-slate-900/80 text-slate-300"
    : "bg-white text-slate-700";
  return (
    <pre
      className={`no-scrollbar whitespace-pre-wrap border p-[clamp(4px,1.2vmin,16px)] text-[clamp(9px,1.8vmin,20px)] leading-relaxed flex-1 overflow-auto rounded-2xl transition-colors ${cardBg} ${rotate ? "rotate-180" : ""} ${className}`}
    >
      {energyGeneratorText}
    </pre>
  );
}

/**
 * レイアウト変化をブラウザのView Transitionで滑らかに反映する。
 *
 * @param update DOMに反映したいReact state更新。
 */
function animateLayoutChange(update: () => void): void {
  const transitionDocument = document as ViewTransitionDocument;
  if (typeof transitionDocument.startViewTransition !== "function") {
    update();
    return;
  }

  transitionDocument.startViewTransition(() => {
    flushSync(update);
  });
}

/**
 * エネルギー値の表示、タップ/ドラッグ変更、増減ボタン、サイズ変更を扱うゲージ。
 *
 * @param props プレイヤー、エネルギー値、テーマ、サイズ制御。
 * @returns エネルギー操作パネル。
 */
function EnergyGauge({
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
    onEnergyChange(getIndexFromPointer(e.clientX, el.getBoundingClientRect(), rotate));
  };

  /** セル列をドラッグ中だけ、ポインター位置に合わせてエネルギーを更新する。 */
  const handlePointerMove = (e: PointerEvent<HTMLDivElement>): void => {
    if (!isDragging.current || !cellsRef.current) return;
    onEnergyChange(
      getIndexFromPointer(e.clientX, cellsRef.current.getBoundingClientRect(), rotate)
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
    const sign = resizeHandlePosition === "bottom" ? (rotate ? -1 : 1) : rotate ? 1 : -1;
    const newSize = Math.max(
      CELL_MIN,
      Math.min(maxCellSize, Math.round(startSize + sign * (e.clientY - startY) * 0.5))
    );
    onCellSizeChange(newSize);
  };

  /** リサイズ状態を解除する。 */
  const handleResizeUp = (): void => {
    resizeStart.current = null;
  };

  const { accentBorder, panelBg, cellBorder, cellDivider, resizeHandleColor } =
    getGaugeTheme(player, isDark);
  const { btnHeight, btnPx, btnFontSize, cellFontSize } = calcCellMetrics(cellSize);
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
              className={`min-w-0 flex items-center justify-center text-white rounded-full select-none font-bold transition-all active:scale-95 ${cls}`}
              style={{ height: btnHeight, paddingInline: btnPx, fontSize: btnFontSize }}
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

/**
 * Vanguard Energy Generatorのメイン画面。
 *
 * @returns エネルギー管理ツール全体。
 */
export default function Home(): ReactElement {
  const [p1Energy, setP1Energy] = useState<number>(0);
  const [p2Energy, setP2Energy] = useState<number>(0);
  const [isDark, setIsDark] = useState<boolean>(false);
  const [playerMode, setPlayerMode] = useState<PlayerMode>("double");
  const [showCardText, setShowCardText] = useState<boolean>(true);
  const [cellSize, setCellSize] = useState<number>(CELL_DEFAULT);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [coinResult, setCoinResult] = useState<CoinResult | null>(null);
  const [diceRollId, setDiceRollId] = useState<number>(0);
  const [coinTossId, setCoinTossId] = useState<number>(0);
  const viewport = useViewportSize();
  const maxCellSize = useMemo<number>(
    () => getResponsiveCellMax(viewport.width, viewport.height, playerMode, showCardText),
    [viewport.width, viewport.height, playerMode, showCardText]
  );
  const effectiveCellSize = Math.min(cellSize, maxCellSize);

  const { rootBg } = getPageTheme(isDark);
  const isDouble = playerMode === "double";
  const gridRows = getGridRows(playerMode, showCardText);

  /** 6面サイコロを振り、同じ結果でも表示アニメーションを再実行する。 */
  const rollDice = (): void => {
    setDiceResult(Math.floor(Math.random() * 6) + 1);
    setDiceRollId((current) => current + 1);
  };
  /** コイントスを行い、同じ結果でも表示アニメーションを再実行する。 */
  const tossCoin = (): void => {
    setCoinResult(Math.random() < 0.5 ? "表" : "裏");
    setCoinTossId((current) => current + 1);
  };
  /** 効果欄の開閉に伴う大きなレイアウト変更だけ滑らかに切り替える。 */
  const toggleCardText = (): void =>
    animateLayoutChange(() => setShowCardText((current) => !current));
  /** プレイヤー数の切替に伴うゲージと説明欄の増減を滑らかに切り替える。 */
  const togglePlayerMode = (): void =>
    animateLayoutChange(() =>
      setPlayerMode((current) => (current === "double" ? "single" : "double"))
    );

  /**
   * 配置場所ごとの向きで中央操作バーを描画する。
   *
   * 2人用のカード間だけ横画面で縦並びにし、それ以外は高さが伸びないよう横並び固定にする。
   */
  const renderControlPanel = (layout: ControlPanelLayout): ReactElement => (
    <ControlPanel
      layout={layout}
      isDouble={isDouble}
      isDark={isDark}
      showCardText={showCardText}
      diceResult={diceResult}
      coinResult={coinResult}
      diceRollId={diceRollId}
      coinTossId={coinTossId}
      onTogglePlayerMode={togglePlayerMode}
      onToggleDark={() => setIsDark(!isDark)}
      onToggleCardText={toggleCardText}
      onRollDice={rollDice}
      onTossCoin={tossCoin}
    />
  );

  return (
    <div className={`fixed inset-0 overflow-hidden transition-colors ${rootBg} flex justify-center`}>
      <div
        className={`w-full max-w-3xl h-full grid ${gridRows} items-stretch p-[2vmin] box-border gap-[2vmin]`}
      >
        {isDouble && (
          <EnergyGauge
            player="p2"
            energy={p2Energy}
            onEnergyChange={setP2Energy}
            rotate
            isDark={isDark}
            cellSize={effectiveCellSize}
            maxCellSize={maxCellSize}
            onCellSizeChange={setCellSize}
          />
        )}

        <div className="min-h-0 flex flex-col gap-[1.5vmin]">
          {/* 中央操作: 説明表示中は2枚のカード説明の間へ置く */}
          {showCardText && (
            <div
              className={`flex portrait:flex-col ${isDouble ? "landscape:flex-row" : "landscape:flex-col"} gap-[2vmin] items-stretch w-full flex-1 min-h-0`}
            >
              {!isDouble && renderControlPanel("horizontal")}
              {isDouble && (
                <EnergyTextCard rotate isDark={isDark} className="border-red-500/30" />
              )}
              {isDouble && (
                <div className="portrait:w-full landscape:w-[clamp(96px,18vw,148px)] shrink-0 flex items-center justify-center">
                  {renderControlPanel("responsive")}
                </div>
              )}
              <EnergyTextCard isDark={isDark} className="border-blue-500/30" />
            </div>
          )}
          {!showCardText && renderControlPanel("horizontal")}
        </div>

        <EnergyGauge
          player="p1"
          energy={p1Energy}
          onEnergyChange={setP1Energy}
          rotate={false}
          isDark={isDark}
          cellSize={effectiveCellSize}
          maxCellSize={maxCellSize}
          onCellSizeChange={setCellSize}
          resizeHandlePosition={showCardText ? "top" : "bottom"}
        />
      </div>
    </div>
  );
}
