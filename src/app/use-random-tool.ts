"use client";

import { useState } from "react";

export type RandomTool<T> = {
  /** 最後の結果。未実行ならnull。 */
  result: T | null;
  /** 実行回数。結果が同じ時も表示更新を識別する。 */
  rollId: number;
  /** 新しい結果を生成し、同じ結果でも表示アニメーションを再実行する。 */
  trigger: () => void;
  /** 未実行状態へ戻す。 */
  reset: () => void;
};

/**
 * サイコロやコイントスなどランダムツールの結果と実行回数を管理する。
 *
 * @param generate 新しい結果を返す関数。
 * @returns 結果・実行回数・操作関数。
 */
export function useRandomTool<T>(generate: () => T): RandomTool<T> {
  const [result, setResult] = useState<T | null>(null);
  const [rollId, setRollId] = useState<number>(0);

  const trigger = (): void => {
    setResult(generate());
    setRollId((current) => current + 1);
  };
  const reset = (): void => {
    setResult(null);
    setRollId(0);
  };

  return { result, rollId, trigger, reset };
}
