import type { ReactElement } from "react";
import { ENERGY_MAX } from "./energyGaugeConstants";
import type { Player } from "../types";

type StepButton = readonly [delta: number, colorClass: string];

type StepButtonsProps = {
  /** 操作対象プレイヤー。aria-labelの文脈に使う。 */
  player: Player;
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

/** エネルギー増減ボタン。色はカードゲームの増減方向が見分けやすい順に固定する。実際の色はスキン別CSS変数が供給する。 */
const STEP_BUTTONS = [
  [-7, "bg-[var(--step-dec3)]"],
  [-3, "bg-[var(--step-dec2)]"],
  [-1, "bg-[var(--step-dec1)]"],
  [+1, "bg-[var(--step-inc1)]"],
  [+3, "bg-[var(--step-inc2)]"],
] as const satisfies readonly StepButton[];

function clampEnergy(value: number): number {
  return Math.max(0, Math.min(ENERGY_MAX, value));
}

/**
 * エネルギー増減ボタン行を表示する。
 *
 * @param props プレイヤー、エネルギー値、更新関数、ボタン寸法。
 * @returns 増減ボタン行。
 */
export function StepButtons({
  player,
  energy,
  onEnergyChange,
  btnHeight,
  btnPx,
  btnFontSize,
}: StepButtonsProps): ReactElement {
  const label = player === "p1" ? "P1" : "P2";
  return (
    <div className="grid grid-cols-5 gap-1 sm:gap-2 w-full pb-1">
      {STEP_BUTTONS.map(([d, cls]) => (
        <button
          key={d}
          type="button"
          className={`step-btn focus-ring min-w-0 flex items-center justify-center text-[var(--step-text)] rounded-[var(--radius-btn)] shadow-[var(--btn-shadow)] select-none font-bold transition-all active:scale-95 ${cls}`}
          style={{
            height: btnHeight,
            paddingInline: btnPx,
            fontSize: btnFontSize,
          }}
          onClick={() => onEnergyChange(clampEnergy(energy + d))}
          aria-label={`${label} エネルギーを${Math.abs(d)}${d > 0 ? "増やす" : "減らす"}`}
        >
          {d > 0 ? `+${d}` : d}
        </button>
      ))}
    </div>
  );
}
