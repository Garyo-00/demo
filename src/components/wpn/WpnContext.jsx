import { createContext, useContext, useMemo, useState } from "react";
import { INITIAL_TEMPLATES } from "../../workPlanNeoData.js";
import { initialPlans } from "../../workPlanNeoPlanData.js";

// 作業計画書NEO デモ用の状態。テンプレート・作業計画書を画面間で共有する。
const WpnContext = createContext(null);

export function WpnProvider({ children }) {
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES);
  const [plans, setPlans] = useState(() => initialPlans(INITIAL_TEMPLATES));
  // 元請（ゼネコン）／職長（協力会社）の閲覧ロール。テンプレート設定は元請のみ編集可。
  const [role, setRole] = useState("prime");
  // 現場（プロジェクト）単位の機能設定。設定画面（/workplan-neo/settings）で切り替える。
  const [settings, setSettings] = useState({ primeConfirm: true, meetingSign: true });

  const value = useMemo(
    () => ({
      templates,
      plans,
      role,
      setRole,
      settings,
      saveSettings: setSettings,
      getTemplate: (id) => templates.find((t) => t.id === id) || null,
      saveTemplate: (tpl) =>
        setTemplates((list) => {
          const i = list.findIndex((t) => t.id === tpl.id);
          if (i === -1) return [...list, tpl];
          const next = [...list];
          next[i] = tpl;
          return next;
        }),
      removeTemplate: (id) =>
        setTemplates((list) => list.filter((t) => t.id !== id)),
      getPlan: (id) => plans.find((p) => p.id === id) || null,
      savePlan: (plan) =>
        setPlans((list) => {
          const i = list.findIndex((p) => p.id === plan.id);
          if (i === -1) return [plan, ...list];
          const next = [...list];
          next[i] = plan;
          return next;
        }),
    }),
    [templates, plans, role, settings]
  );

  return <WpnContext.Provider value={value}>{children}</WpnContext.Provider>;
}

export function useWpn() {
  const ctx = useContext(WpnContext);
  if (!ctx) throw new Error("useWpn must be used within WpnProvider");
  return ctx;
}
