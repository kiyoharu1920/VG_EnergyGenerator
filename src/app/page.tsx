"use client";
import { useEffect, useMemo, useRef, useState } from "react";

const ENERGY_MAX = 10;
const clampEnergy = (value: number) => Math.max(0, Math.min(ENERGY_MAX, value));

const CELL_DEFAULT = 44;
const CELL_MIN = 28;
const CELL_MAX = 112;

type PlayerMode = "single" | "double";

type StepButton = readonly [delta: number, colorClass: string];

const STEP_BUTTONS: StepButton[] = [
  [-7, "bg-violet-700 hover:bg-violet-600 active:bg-violet-500 shadow-lg shadow-violet-900/50"],
  [-3, "bg-blue-700 hover:bg-blue-600 active:bg-blue-500 shadow-lg shadow-blue-900/50"],
  [-1, "bg-blue-500 hover:bg-blue-400 active:bg-blue-300 shadow-md shadow-blue-700/50"],
  [+1, "bg-rose-500 hover:bg-rose-400 active:bg-rose-300 shadow-md shadow-rose-700/50"],
  [+3, "bg-rose-700 hover:bg-rose-600 active:bg-rose-500 shadow-lg shadow-rose-900/50"],
];

const energyGeneratorText = `《エネルギージェネレーター/Energy Generator》
ライドデッキクレスト

（ライドデッキクレストをライドデッキに１枚だけ入れられる）
【自】【ライドデッキ】：あなたがライドした時、このカードをクレストゾーンに置き、あなたが後攻なら【エネルギーチャージ】(3)。
【永】：あなたはエネルギーを10個まで持てる。
【自】：あなたのライドフェイズ開始時、【エネルギーチャージ】(3)。
【起】【ターン1回】：【コスト】[【エネルギーブラスト】(7)]することで、１枚引く。
`;

// セル背景・文字色を一括で返す（選択中・以下・空の3状態）
function getCellClasses(index: number, energy: number, isDark: boolean): string {
  if (index === energy) return "bg-emerald-400 text-slate-900";
  if (index < energy) return "bg-cyan-500/80 text-slate-900";
  return isDark ? "bg-slate-800/60 text-slate-500" : "bg-slate-200 text-slate-400";
}

// セルコンテナ幅からインデックス計算 (flex-1均等分割前提)
function getIndexFromPointer(
  clientX: number,
  rect: DOMRect,
  rotate: boolean
): number {
  const cellWidth = rect.width / (ENERGY_MAX + 1);
  const raw = Math.max(
    0,
    Math.min(ENERGY_MAX, Math.floor((clientX - rect.left) / cellWidth))
  );
  return rotate ? ENERGY_MAX - raw : raw;
}

// セルサイズからボタン・フォントサイズを計算
function calcCellMetrics(cellSize: number) {
  return {
    btnHeight: Math.min(Math.round(cellSize * 0.8), 64),
    btnPx: Math.min(Math.round(cellSize * 0.28), 18),
    btnFontSize: Math.max(10, Math.min(Math.round(cellSize * 0.28), 16)),
    cellFontSize: Math.max(10, Math.min(Math.round(cellSize * 0.35), 22)),
  };
}

// 画面高さに応じたセル上限。閉じた説明枠や1人用では大きめに使える。
function getResponsiveCellMax(
  width: number,
  height: number,
  playerMode: PlayerMode,
  showCardText: boolean
) {
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

function useViewportSize() {
  const [viewport, setViewport] = useState({ width: 390, height: 844 });

  useEffect(() => {
    const update = () =>
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

// プレイヤー・テーマによるゲージ配色クラスを返す
function getGaugeTheme(player: "p1" | "p2", isDark: boolean) {
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

type EnergyGaugeProps = {
  player: "p1" | "p2";
  energy: number;
  onEnergyChange: (value: number) => void;
  rotate: boolean;
  isDark: boolean;
  cellSize: number;
  maxCellSize: number;
  onCellSizeChange: (size: number) => void;
};

type EnergyTextCardProps = {
  rotate?: boolean;
  isDark: boolean;
  className?: string;
};

function EnergyTextCard({ rotate = false, isDark, className = "" }: EnergyTextCardProps) {
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

function EnergyGauge({
  player,
  energy,
  onEnergyChange,
  rotate,
  isDark,
  cellSize,
  maxCellSize,
  onCellSizeChange,
}: EnergyGaugeProps) {
  const cellsRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const resizeStart = useRef<{ y: number; size: number } | null>(null);

  // エネルギーセル操作
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = true;
    cellsRef.current?.setPointerCapture(e.pointerId);
    if (cellsRef.current)
      onEnergyChange(
        getIndexFromPointer(e.clientX, cellsRef.current.getBoundingClientRect(), rotate)
      );
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || !cellsRef.current) return;
    onEnergyChange(
      getIndexFromPointer(e.clientX, cellsRef.current.getBoundingClientRect(), rotate)
    );
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  // リサイズハンドル: 内側エッジ(DOM上端)に配置
  // P1(rotate=false): 上方向ドラッグ=拡大 → sign=-1
  // P2(rotate=true): 下方向ドラッグ=拡大(P2視点) → sign=1
  const handleResizeDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    resizeStart.current = { y: e.clientY, size: cellSize };
  };

  const handleResizeMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizeStart.current) return;
    const { y: startY, size: startSize } = resizeStart.current;
    const sign = rotate ? 1 : -1;
    const newSize = Math.max(
      CELL_MIN,
      Math.min(maxCellSize, Math.round(startSize + sign * (e.clientY - startY) * 0.5))
    );
    onCellSizeChange(newSize);
  };

  const handleResizeUp = () => {
    resizeStart.current = null;
  };

  const { accentBorder, panelBg, cellBorder, cellDivider, resizeHandleColor } =
    getGaugeTheme(player, isDark);
  const { btnHeight, btnPx, btnFontSize, cellFontSize } = calcCellMetrics(cellSize);

  return (
    <div
      data-testid={`${player}-gauge`}
      className={`flex flex-col items-center w-full rounded-2xl border gap-1 px-[clamp(10px,7vw,72px)] pb-2 pt-1 transition-colors ${panelBg} ${accentBorder} ${rotate ? "rotate-180" : ""}`}
    >
      {/* リサイズハンドル: 内側エッジ(DOM上端) */}
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
    </div>
  );
}

export default function Home() {
  const [p1Energy, setP1Energy] = useState(0);
  const [p2Energy, setP2Energy] = useState(0);
  const [isDark, setIsDark] = useState(false);
  const [playerMode, setPlayerMode] = useState<PlayerMode>("double");
  const [showCardText, setShowCardText] = useState(true);
  const [cellSize, setCellSize] = useState(CELL_DEFAULT);
  const viewport = useViewportSize();
  const maxCellSize = useMemo(
    () => getResponsiveCellMax(viewport.width, viewport.height, playerMode, showCardText),
    [viewport.width, viewport.height, playerMode, showCardText]
  );
  const effectiveCellSize = Math.min(cellSize, maxCellSize);

  const rootBg = isDark ? "bg-slate-950" : "bg-slate-100";
  const controlBg = isDark
    ? "bg-slate-700 hover:bg-slate-600 text-white border-slate-500"
    : "bg-white hover:bg-slate-200 text-slate-700 border-slate-200 shadow-md";
  const centerBg = isDark
    ? "bg-slate-900/70 border-slate-700"
    : "bg-white/90 border-slate-200";
  const isDouble = playerMode === "double";
  const gridRows = isDouble
    ? showCardText
      ? "grid-rows-[auto_minmax(0,1fr)_auto]"
      : "grid-rows-[auto_auto_auto] content-center"
    : showCardText
      ? "grid-rows-[minmax(0,1fr)_auto]"
      : "grid-rows-[auto_auto] content-center";

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
          {/* 中央操作: 対戦人数・説明枠・テーマ */}
          <div className={`shrink-0 w-full rounded-xl border p-1.5 flex items-center justify-center gap-1.5 transition-colors ${centerBg}`}>
            <button
              data-testid="player-mode-toggle"
              onClick={() => setPlayerMode(isDouble ? "single" : "double")}
              className={`h-8 min-w-0 flex-1 rounded-lg border px-2 text-[12px] font-bold transition-colors ${controlBg}`}
              aria-label="toggle player mode"
            >
              {isDouble ? "2人用" : "1人用"}
            </button>
            <button
              data-testid="card-text-toggle"
              onClick={() => setShowCardText(!showCardText)}
              className={`h-8 min-w-0 flex-1 rounded-lg border px-2 text-[12px] font-bold transition-colors ${controlBg}`}
              aria-expanded={showCardText}
            >
              {showCardText ? "説明 閉" : "説明 開"}
            </button>
            <button
              data-testid="theme-toggle"
              onClick={() => setIsDark(!isDark)}
              className={`h-8 min-w-0 flex-1 rounded-lg border px-2 text-[12px] font-bold transition-colors ${controlBg}`}
              aria-label="toggle theme"
            >
              {isDark ? "明色" : "暗色"}
            </button>
          </div>

          {/* カードテキスト: 閉じた時は中央操作だけ残し、ゲージ側へ高さを戻す */}
          {showCardText && (
            <div className="flex portrait:flex-col landscape:flex-row gap-[2vmin] items-stretch w-full flex-1 min-h-0">
              {isDouble && (
                <EnergyTextCard rotate isDark={isDark} className="border-red-500/30" />
              )}
              <EnergyTextCard isDark={isDark} className="border-blue-500/30" />
            </div>
          )}
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
        />
      </div>
    </div>
  );
}
