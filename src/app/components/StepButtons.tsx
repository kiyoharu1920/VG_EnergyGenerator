import type { ReactElement } from "react";
import { ENERGY_MAX } from "./energyGaugeConstants";

type StepButton = readonly [delta: number, colorClass: string];

type StepButtonsProps = {
  /** 現在のエネルギー値。 */
  energy: number;
  /** エネルギー値を更新する。 */
  onEnergyChange: (value: number) => void;
  /** ボタン高さ。 */
  btnHeight: number;
  /** ボタン左右余白。 */
  btnPx: number;
  /** ボタン文字サイズ。 */
  btnFontSize: number;
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

function clampEnergy(value: number): number {
  return Math.max(0, Math.min(ENERGY_MAX, value));
}

/**
 * エネルギー増減ボタン行を表示する。
 *
 * @param props エネルギー値、更新関数、ボタン寸法。
 * @returns 増減ボタン行。
 */
export function StepButtons({
  energy,
  onEnergyChange,
  btnHeight,
  btnPx,
  btnFontSize,
}: StepButtonsProps): ReactElement {
  return (
    <div className="grid grid-cols-5 gap-1 sm:gap-2 w-full pb-1">
      {STEP_BUTTONS.map(([d, cls]) => (
        <button
          key={d}
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
  );
}
