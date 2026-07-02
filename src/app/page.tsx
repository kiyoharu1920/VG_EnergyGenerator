"use client";

import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import { ControlPanel } from "./components/ControlPanel";
import { EnergyGauge, CELL_DEFAULT, getResponsiveCellMax } from "./components/EnergyGauge";
import { EnergyTextCard } from "./components/EnergyTextCard";
import { useStoredSettings, writeStoredSettings } from "./settings-storage";
import type { StoredSettings } from "./settings-storage";
import { getNextSkin } from "./skins";
import { getPageTheme } from "./theme";
import type { CoinResult, ControlPanelLayout, PlayerMode } from "./types";
import { useRandomTool } from "./use-random-tool";
import { useViewportSize } from "./use-viewport-size";
import { animateLayoutChange } from "./view-transition";

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

/**
 * Vanguard Energy Generatorのメイン画面。
 *
 * @returns エネルギー管理ツール全体。
 */
export default function Home(): ReactElement {
  const [p1Energy, setP1Energy] = useState<number>(0);
  const [p2Energy, setP2Energy] = useState<number>(0);
  const [cellSize, setCellSize] = useState<number>(CELL_DEFAULT);
  /** 6面サイコロ。 */
  const dice = useRandomTool<number>(() => Math.floor(Math.random() * 6) + 1);
  /** コイントス。 */
  const coin = useRandomTool<CoinResult>(() => (Math.random() < 0.5 ? "表" : "裏"));
  const storedSettings = useStoredSettings();
  const isDark = storedSettings.theme === "dark";
  const skin = storedSettings.skin;
  const playerMode: PlayerMode = storedSettings.isTwoPlayer ? "double" : "single";
  const showCardText = storedSettings.showDescription;
  const viewport = useViewportSize();
  const maxCellSize = useMemo<number>(
    () => getResponsiveCellMax(viewport.width, viewport.height, playerMode, showCardText),
    [viewport.width, viewport.height, playerMode, showCardText]
  );
  const effectiveCellSize = Math.min(cellSize, maxCellSize);

  const { rootBg } = getPageTheme();
  const isDouble = playerMode === "double";
  const gridRows = getGridRows(playerMode, showCardText);

  /** 保存済みUI設定を一部だけ更新する。 */
  const updateSettings = (settings: Partial<StoredSettings>): void => {
    writeStoredSettings({ ...storedSettings, ...settings });
  };
  /** 大きく配置が変わる設定だけView Transitionを挟む。 */
  const animateSettingsUpdate = (settings: Partial<StoredSettings>): void =>
    animateLayoutChange(() => updateSettings(settings));

  /** エネルギー値とランダム結果を初期状態へ戻す。 */
  const resetGame = (): void => {
    setP1Energy(0);
    setP2Energy(0);
    dice.reset();
    coin.reset();
  };
  /** 効果欄の開閉に伴う大きなレイアウト変更だけ滑らかに切り替える。 */
  const toggleCardText = (): void =>
    animateSettingsUpdate({ showDescription: !storedSettings.showDescription });
  /** プレイヤー数の切替に伴うゲージと説明欄の増減を滑らかに切り替える。 */
  const togglePlayerMode = (): void =>
    animateSettingsUpdate({ isTwoPlayer: !storedSettings.isTwoPlayer });
  /** デザインスキンを次の候補へ巡回させる。 */
  const cycleSkin = (): void => {
    updateSettings({ skin: getNextSkin(skin) });
  };

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
      skin={skin}
      diceResult={dice.result}
      coinResult={coin.result}
      diceRollId={dice.rollId}
      coinTossId={coin.rollId}
      onTogglePlayerMode={togglePlayerMode}
      onResetGame={resetGame}
      onToggleDark={() => updateSettings({ theme: isDark ? "light" : "dark" })}
      onToggleCardText={toggleCardText}
      onCycleSkin={cycleSkin}
      onRollDice={dice.trigger}
      onTossCoin={coin.trigger}
    />
  );

  return (
    <div
      data-skin={skin}
      data-theme={isDark ? "dark" : "light"}
      className={`fixed inset-0 overflow-hidden transition-colors ${rootBg} flex justify-center`}
    >
      <div
        className={`w-full max-w-3xl h-full grid ${gridRows} items-stretch p-[2vmin] box-border gap-[2vmin]`}
      >
        {isDouble && (
          <EnergyGauge
            player="p2"
            energy={p2Energy}
            onEnergyChange={setP2Energy}
            rotate
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
                <EnergyTextCard rotate className="border-[var(--p2-card-border)]" />
              )}
              {isDouble && (
                <div className="portrait:w-full landscape:w-[clamp(96px,18vw,148px)] shrink-0 flex items-center justify-center">
                  {renderControlPanel("responsive")}
                </div>
              )}
              <EnergyTextCard className="border-[var(--p1-card-border)]" />
            </div>
          )}
          {!showCardText && renderControlPanel("horizontal")}
        </div>

        <EnergyGauge
          player="p1"
          energy={p1Energy}
          onEnergyChange={setP1Energy}
          rotate={false}
          cellSize={effectiveCellSize}
          maxCellSize={maxCellSize}
          onCellSizeChange={setCellSize}
          resizeHandlePosition={showCardText ? "top" : "bottom"}
        />
      </div>
    </div>
  );
}
