import { useEffect, useState } from "react";

// 画面幅がスマホ相当かどうか。既定値はCSSのブレークポイント（768px）と揃えてある。
export function useIsNarrow(maxWidth = 768) {
  const query = `(max-width:${maxWidth}px)`;
  const [narrow, setNarrow] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = (e) => setNarrow(e.matches);
    setNarrow(mq.matches); // 初期描画後にクエリが変わった場合に追随する
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return narrow;
}
