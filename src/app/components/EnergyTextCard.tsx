import type { ReactElement } from "react";

/** 表示するクレスト効果テキスト。 */
const energyGeneratorText = `《エネルギージェネレーター/Energy Generator》
ライドデッキクレスト

（ライドデッキクレストをライドデッキに１枚だけ入れられる）
【自】【ライドデッキ】：あなたがライドした時、このカードをクレストゾーンに置き、あなたが後攻なら【エネルギーチャージ】(3)。
【永】：あなたはエネルギーを10個まで持てる。
【自】：あなたのライドフェイズ開始時、【エネルギーチャージ】(3)。
【起】【ターン1回】：【コスト】[【エネルギーブラスト】(7)]することで、１枚引く。
`;

type EnergyTextCardProps = {
  /** 対面プレイヤー向けに180度回転するかどうか。 */
  rotate?: boolean;
  /** プレイヤー別の枠色などを追加するクラス。 */
  className?: string;
};

/**
 * エネルギージェネレーターの効果欄。色はスキン別CSS変数が供給する。
 *
 * @param props 表示方向、追加クラス。
 * @returns 効果テキストカード。
 */
export function EnergyTextCard({
  rotate = false,
  className = "",
}: EnergyTextCardProps): ReactElement {
  return (
    <pre
      aria-label="エネルギージェネレーターの効果"
      className={`no-scrollbar whitespace-pre-wrap [border-width:var(--border-w)] p-[clamp(4px,1.2vmin,16px)] text-[clamp(9px,1.8vmin,20px)] leading-relaxed flex-1 overflow-auto rounded-[var(--radius-card)] shadow-[var(--panel-shadow)] transition-colors bg-[var(--card-bg)] text-[var(--card-text)] ${rotate ? "rotate-180" : ""} ${className}`}
    >
      {energyGeneratorText}
    </pre>
  );
}
