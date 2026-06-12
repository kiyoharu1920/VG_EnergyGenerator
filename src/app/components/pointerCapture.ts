export function setPointerCaptureSafely(
  element: HTMLElement,
  pointerId: number,
): void {
  try {
    element.setPointerCapture(pointerId);
  } catch {
    // capture できない場合もタップ処理自体は継続する。
  }
}
