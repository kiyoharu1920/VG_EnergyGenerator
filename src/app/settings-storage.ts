"use client";

import { useSyncExternalStore } from "react";
import { normalizeSkin } from "./skins";
import type { DesignSkin } from "./types";

export type StoredSettings = {
  isTwoPlayer: boolean;
  theme: "light" | "dark";
  showDescription: boolean;
  skin: DesignSkin;
};

/** UI設定をlocalStorageへ保存するキー。 */
const SETTINGS_STORAGE_KEY = "vg-energy-generator:settings:v1";
/** 同一タブ内で保存変更を通知するイベント名。 */
const SETTINGS_CHANGED_EVENT = "vg-energy-generator:settings-changed";

/** 保存設定の初期値。 */
const DEFAULT_SETTINGS: StoredSettings = {
  isTwoPlayer: true,
  theme: "light",
  showDescription: true,
  skin: "original",
};

let inMemorySettings: StoredSettings = DEFAULT_SETTINGS;
let cachedRawSettings: string | null | undefined;
let cachedStoredSettings: StoredSettings | null = null;

/**
 * localStorageからUI設定を安全に読み込む。
 *
 * 保存形式が壊れている場合や古い場合は初期値を使う。
 *
 * @returns 保存済みUI設定。読み込めない場合はnull。
 */
function readStoredSettings(): StoredSettings | null {
  if (typeof window === "undefined") return null;

  try {
    const rawSettings = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (rawSettings === cachedRawSettings) return cachedStoredSettings;

    cachedRawSettings = rawSettings;
    cachedStoredSettings = null;
    if (!rawSettings) return null;

    const settings = JSON.parse(rawSettings) as Partial<StoredSettings>;
    if (
      typeof settings.isTwoPlayer !== "boolean" ||
      (settings.theme !== "light" && settings.theme !== "dark") ||
      typeof settings.showDescription !== "boolean"
    ) {
      return null;
    }

    cachedStoredSettings = {
      isTwoPlayer: settings.isTwoPlayer,
      theme: settings.theme,
      showDescription: settings.showDescription,
      skin: normalizeSkin(settings.skin),
    };
    return cachedStoredSettings;
  } catch {
    return null;
  }
}

/**
 * UI設定をlocalStorageへ安全に保存する。
 *
 * 保存できない環境では表示状態の更新だけ継続する。
 *
 * @param settings 保存するUI設定。
 */
export function writeStoredSettings(settings: StoredSettings): void {
  inMemorySettings = settings;
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorageが使えない環境でもUI操作は継続する。
  }
  window.dispatchEvent(new Event(SETTINGS_CHANGED_EVENT));
}

/**
 * 現在の保存設定を返す。
 *
 * localStorageが読めない場合はメモリ上の最新値を使う。
 *
 * @returns UI設定。
 */
function getStoredSettingsSnapshot(): StoredSettings {
  return readStoredSettings() ?? inMemorySettings;
}

/**
 * 設定変更を購読する。
 *
 * @param onStoreChange 設定変更時に呼ぶ関数。
 * @returns 購読解除関数。
 */
function subscribeStoredSettings(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handleStorage = (event: StorageEvent): void => {
    if (event.key === SETTINGS_STORAGE_KEY) onStoreChange();
  };
  const handleLocalChange = (): void => onStoreChange();

  window.addEventListener("storage", handleStorage);
  window.addEventListener(SETTINGS_CHANGED_EVENT, handleLocalChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(SETTINGS_CHANGED_EVENT, handleLocalChange);
  };
}

/**
 * 保存済みUI設定をReact stateとして購読する。
 *
 * @returns 現在のUI設定。
 */
export function useStoredSettings(): StoredSettings {
  return useSyncExternalStore(
    subscribeStoredSettings,
    getStoredSettingsSnapshot,
    () => DEFAULT_SETTINGS
  );
}
