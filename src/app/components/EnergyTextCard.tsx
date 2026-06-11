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
export function EnergyTextCard({
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
