"use client";

import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { ControlPanel } from "./components/ControlPanel";
import { EnergyGauge, CELL_DEFAULT, getResponsiveCellMax } from "./components/EnergyGauge";
import { EnergyTextCard } from "./components/EnergyTextCard";
import { useStoredSettings, writeStoredSettings } from "./settings-storage";
import { getPageTheme } from "./theme";
import type { CoinResult, ControlPanelLayout, PlayerMode } from "./types";

type ViewportSize = {
  width: number;
  height: number;
};

type ViewTransitionDocument = Document & {
  startViewTransition?: (updateCallback: () => void) => void;
};

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
 * Vanguard Energy Generatorのメイン画面。
 *
 * @returns エネルギー管理ツール全体。
 */
export default function Home(): ReactElement {
  const [p1Energy, setP1Energy] = useState<number>(0);
  const [p2Energy, setP2Energy] = useState<number>(0);
  const [cellSize, setCellSize] = useState<number>(CELL_DEFAULT);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [coinResult, setCoinResult] = useState<CoinResult | null>(null);
  const [diceRollId, setDiceRollId] = useState<number>(0);
  const [coinTossId, setCoinTossId] = useState<number>(0);
  const storedSettings = useStoredSettings();
  const isDark = storedSettings.theme === "dark";
  const playerMode: PlayerMode = storedSettings.isTwoPlayer ? "double" : "single";
  const showCardText = storedSettings.showDescription;
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
    animateLayoutChange(() =>
      writeStoredSettings({
        ...storedSettings,
        showDescription: !storedSettings.showDescription,
      })
    );
  /** プレイヤー数の切替に伴うゲージと説明欄の増減を滑らかに切り替える。 */
  const togglePlayerMode = (): void =>
    animateLayoutChange(() =>
      writeStoredSettings({
        ...storedSettings,
        isTwoPlayer: !storedSettings.isTwoPlayer,
      })
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
      onToggleDark={() =>
        writeStoredSettings({
          ...storedSettings,
          theme: isDark ? "light" : "dark",
        })
      }
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
