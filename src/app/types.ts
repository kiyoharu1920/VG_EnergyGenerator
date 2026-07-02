export type Player = "p1" | "p2";
export type PlayerMode = "single" | "double";
export type ControlPanelLayout = "horizontal" | "responsive";
export type CoinResult = "表" | "裏";
/** スキン定義本体は skins.ts。既存の import 経路を保つためここから再輸出する。 */
export type { DesignSkin } from "./skins";
