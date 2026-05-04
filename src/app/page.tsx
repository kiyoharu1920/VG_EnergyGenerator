"use client";
import { useState, useRef } from "react";

const ENERGY_MAX = 10;
const clampEnergy = (value: number) => Math.max(0, Math.min(ENERGY_MAX, value));

const CELL_DEFAULT = 44;
const CELL_MIN = 28;
const CELL_MAX = 144;

type StepButton = readonly [delta: number, colorClass: string];

const STEP_BUTTONS: StepButton[] = [
  [-7, "bg-violet-700 hover:bg-violet-600 active:bg-violet-500 shadow-lg shadow-violet-900/50"],
  [-3, "bg-blue-700 hover:bg-blue-600 active:bg-blue-500 shadow-lg shadow-blue-900/50"],
  [-1, "bg-blue-500 hover:bg-blue-400 active:bg-blue-300 shadow-md shadow-blue-700/50"],
  [+1, "bg-rose-500 hover:bg-rose-400 active:bg-rose-300 shadow-md shadow-rose-700/50"],
  [+3, "bg-rose-700 hover:bg-rose-600 active:bg-rose-500 shadow-lg shadow-rose-900/50"],
];
const NEGATIVE_STEP_BUTTONS = STEP_BUTTONS.filter(([delta]) => delta < 0);
const POSITIVE_STEP_BUTTONS = STEP_BUTTONS.filter(([delta]) => delta > 0);

const energyGeneratorText = `《エネルギージェネレーター/Energy Generator》
ライドデッキクレスト

（ライドデッキクレストをライドデッキに１枚だけ入れられる）
【自】【ライドデッキ】：あなたがライドした時、このカードをクレストゾーンに置き、あなたが後攻なら【エネルギーチャージ】(3)。
【永】：あなたはエネルギーを10個まで持てる。
【自】：あなたのライドフェイズ開始時、【エネルギーチャージ】(3)。
【起】【ターン1回】：【コスト】[【エネルギーブラスト】(7)]することで、１枚引く。
`;

function getCellBgClass(index: number, energy: number, isDark: boolean): string {
  if (index === energy) return "bg-emerald-400";
  if (index < energy) return "bg-cyan-500/80";
  return isDark ? "bg-slate-800/60" : "bg-slate-200";
}

function getCellTextClass(index: number, energy: number, isDark: boolean): string {
  if (index <= energy) return "text-slate-900";
  return isDark ? "text-slate-500" : "text-slate-400";
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

type EnergyGaugeProps = {
  player: "p1" | "p2";
  energy: number;
  onEnergyChange: (value: number) => void;
  rotate: boolean;
  isDark: boolean;
  cellSize: number;
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
        getIndexFromPointer(
          e.clientX,
          cellsRef.current.getBoundingClientRect(),
          rotate
        )
      );
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || !cellsRef.current) return;
    onEnergyChange(
      getIndexFromPointer(
        e.clientX,
        cellsRef.current.getBoundingClientRect(),
        rotate
      )
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
      Math.min(CELL_MAX, Math.round(startSize + sign * (e.clientY - startY) * 0.5))
    );
    onCellSizeChange(newSize);
  };

  const handleResizeUp = () => {
    resizeStart.current = null;
  };

  const accentBorder = player === "p1" ? "border-blue-400/50" : "border-red-400/50";
  const panelBg = player === "p1"
    ? isDark ? "bg-blue-950/50" : "bg-blue-50"
    : isDark ? "bg-red-950/50" : "bg-red-50";
  const cellBorder = isDark ? "border-slate-600" : "border-slate-300";
  const cellDivider = isDark ? "border-slate-600/50" : "border-slate-300/70";
  const handleColor = isDark ? "bg-slate-500" : "bg-slate-300";

  const btnHeight = Math.min(Math.round(cellSize * 0.8), 64);
  const btnPx = Math.min(Math.round(cellSize * 0.45), 28);
  const btnFontSize = Math.max(10, Math.min(Math.round(cellSize * 0.28), 16));
  const cellFontSize = Math.max(10, Math.min(Math.round(cellSize * 0.35), 22));

  return (
    <div
      className={`flex flex-col items-center w-full rounded-2xl border gap-2 px-[10%] pb-2 pt-1 transition-colors ${panelBg} ${accentBorder} ${rotate ? "rotate-180" : ""}`}
    >
      {/* リサイズハンドル: 内側エッジ(DOM上端) */}
      <div
        className="w-full h-5 flex items-center justify-center cursor-ns-resize touch-none select-none"
        onPointerDown={handleResizeDown}
        onPointerMove={handleResizeMove}
        onPointerUp={handleResizeUp}
        onPointerCancel={handleResizeUp}
      >
        <div className={`w-12 h-1 rounded-full ${handleColor}`} />
      </div>

      <div className="w-full flex flex-col gap-3">

        {/* エネルギーセル: flex-1均等分割で常に全幅表示 */}
        <div
          ref={cellsRef}
          className={`w-full flex border ${cellBorder} rounded-xl overflow-hidden touch-none`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {Array.from({ length: ENERGY_MAX + 1 }, (_, i) => (
            <button
              key={i}
              type="button"
              className={`
                flex-1 min-w-0 font-bold
                ${getCellBgClass(i, energy, isDark)}
                ${getCellTextClass(i, energy, isDark)}
                flex items-center justify-center border-r ${cellDivider} text-center select-none transition-colors
              `}
              style={{ height: cellSize, fontSize: cellFontSize }}
              onClick={() => onEnergyChange(i)}
              aria-label={`${player} energy ${i}`}
              aria-pressed={i === energy}
            >
              {i}
            </button>
          ))}
        </div>

        {/* 操作ボタン行: パネル全幅でjustify-between */}
        <div className="flex items-center w-full justify-between pb-1">
          <div className="flex gap-2">
            {NEGATIVE_STEP_BUTTONS.map(([d, cls]) => (
              <button
                key={d}
                className={`flex items-center justify-center text-white rounded-full select-none font-bold transition-all active:scale-95 ${cls}`}
                style={{ height: btnHeight, paddingInline: btnPx, fontSize: btnFontSize }}
                onClick={() => onEnergyChange(clampEnergy(energy + d))}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {POSITIVE_STEP_BUTTONS.map(([d, cls]) => (
              <button
                key={d}
                className={`flex items-center justify-center text-white rounded-full select-none font-bold transition-all active:scale-95 ${cls}`}
                style={{ height: btnHeight, paddingInline: btnPx, fontSize: btnFontSize }}
                onClick={() => onEnergyChange(clampEnergy(energy + d))}
              >
                +{d}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function Home() {
  const [p1Energy, setP1Energy] = useState(0);
  const [p2Energy, setP2Energy] = useState(0);
  const [isDark, setIsDark] = useState(false);
  const [cellSize, setCellSize] = useState(CELL_DEFAULT);

  const rootBg = isDark ? "bg-slate-950" : "bg-slate-100";
  const controlBg = isDark
    ? "bg-slate-700 hover:bg-slate-600 text-white"
    : "bg-white hover:bg-slate-200 text-slate-600 shadow-md";

  return (
    <div className={`fixed inset-0 transition-colors ${rootBg} flex justify-center`}>
      {/* テーマ切替ボタン */}
      <button
        onClick={() => setIsDark(!isDark)}
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center text-base transition-all ${controlBg}`}
        aria-label="toggle theme"
      >
        {isDark ? "☀" : "🌙"}
      </button>

      <div className="w-full max-w-3xl h-full flex flex-col items-center justify-between p-[2vmin] box-border gap-[2vmin]">
        <EnergyGauge
          player="p2"
          energy={p2Energy}
          onEnergyChange={setP2Energy}
          rotate
          isDark={isDark}
          cellSize={cellSize}
          onCellSizeChange={setCellSize}
        />

        {/* カードテキスト: フォントサイズはvminベース、スクロールバー非表示 */}
        <div className="flex portrait:flex-col landscape:flex-row gap-[2vmin] items-stretch w-full flex-1 min-h-0">
          <EnergyTextCard rotate isDark={isDark} className="border-red-500/30" />
          <EnergyTextCard isDark={isDark} className="border-blue-500/30" />
        </div>

        <EnergyGauge
          player="p1"
          energy={p1Energy}
          onEnergyChange={setP1Energy}
          rotate={false}
          isDark={isDark}
          cellSize={cellSize}
          onCellSizeChange={setCellSize}
        />
      </div>
    </div>
  );
}
