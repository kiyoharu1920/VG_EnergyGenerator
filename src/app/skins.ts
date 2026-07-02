/** デザインスキンの定義。巡回順・型・表示名・正規化をここに一元化する。 */

/** デザイン切替ボタンで巡回する順序。スキン追加時はここと globals.css を更新する。 */
export const DESIGN_SKINS = [
  "original",
  "neon",
  "wafu",
  "chuka",
  "tcg",
  "led",
] as const;

/** UIの見た目スキン。標準＋ネオン＋和風＋中華＋TCG卓上＋レトロLED。各スキンが明暗両対応。 */
export type DesignSkin = (typeof DESIGN_SKINS)[number];

/** デザイン切替ボタンに表示する各スキンの短縮名。 */
export const SKIN_LABEL: Record<DesignSkin, string> = {
  original: "標準",
  neon: "ネオン",
  wafu: "和風",
  chuka: "中華",
  tcg: "卓上",
  led: "LED",
};

/** 不明値は元デザインへ寄せて、旧保存データとも後方互換にする。 */
export function normalizeSkin(value: unknown): DesignSkin {
  return DESIGN_SKINS.includes(value as DesignSkin)
    ? (value as DesignSkin)
    : "original";
}

/** 巡回順で次のスキンを返す。 */
export function getNextSkin(skin: DesignSkin): DesignSkin {
  const nextIndex = (DESIGN_SKINS.indexOf(skin) + 1) % DESIGN_SKINS.length;
  return DESIGN_SKINS[nextIndex];
}
