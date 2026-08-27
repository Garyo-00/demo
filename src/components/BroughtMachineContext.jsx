import { createContext, useContext, useMemo, useState } from "react";
import { INITIAL_MACHINES } from "../broughtMachineData.js";

// 持込機械のデモ用状態。一覧・詳細・編集・新規登録で共有する。
const Ctx = createContext(null);

export function BroughtMachineProvider({ children }) {
  const [machines, setMachines] = useState(INITIAL_MACHINES);

  const value = useMemo(
    () => ({
      machines,
      getMachine: (id) => machines.find((m) => m.id === id) || null,
      saveMachine: (m) =>
        setMachines((list) => {
          const i = list.findIndex((x) => x.id === m.id);
          if (i === -1) return [...list, m];
          const next = [...list];
          next[i] = m;
          return next;
        }),
      removeMachine: (id) => setMachines((list) => list.filter((m) => m.id !== id)),
      // 選択した機械をまとめてアーカイブ／タグ付け
      patchMachines: (ids, patch) =>
        setMachines((list) => list.map((m) => (ids.includes(m.id) ? { ...m, ...patch } : m))),
    }),
    [machines]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMachines() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMachines must be used within BroughtMachineProvider");
  return ctx;
}
