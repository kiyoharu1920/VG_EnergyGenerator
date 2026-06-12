import { flushSync } from "react-dom";

export type ViewTransitionDocument = Document & {
  startViewTransition?: (updateCallback: () => void) => void;
};

/**
 * レイアウト変化をブラウザのView Transitionで滑らかに反映する。
 *
 * @param update DOMに反映したいReact state更新。
 */
export function animateLayoutChange(update: () => void): void {
  const transitionDocument = document as ViewTransitionDocument;
  if (typeof transitionDocument.startViewTransition !== "function") {
    update();
    return;
  }

  transitionDocument.startViewTransition(() => {
    flushSync(update);
  });
}
