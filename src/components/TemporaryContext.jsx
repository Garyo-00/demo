import { createContext, useContext, useMemo, useState } from "react";
import { INITIAL_TEMPORARIES } from "../temporaryData.js";

// 仮設・その他のデモ用状態。一覧・詳細・編集・新規登録で共有する。
const Ctx = createContext(null);

export function TemporaryProvider({ children }) {
  const [items, setItems] = useState(INITIAL_TEMPORARIES);

  const value = useMemo(
    () => ({
      items,
      getItem: (id) => items.find((x) => x.id === id) || null,
      saveItem: (t) =>
        setItems((list) => {
          const i = list.findIndex((x) => x.id === t.id);
          if (i === -1) return [...list, t];
          const next = [...list];
          next[i] = t;
          return next;
        }),
      removeItem: (id) => setItems((list) => list.filter((x) => x.id !== id)),
      // 選択した仮設をまとめてアーカイブ／解除／タグ付け
      patchItems: (ids, patch) =>
        setItems((list) => list.map((x) => (ids.includes(x.id) ? { ...x, ...patch } : x))),
    }),
    [items]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTemporaries() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTemporaries must be used within TemporaryProvider");
  return ctx;
}
