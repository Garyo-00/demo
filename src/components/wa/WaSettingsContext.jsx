import { createContext, useContext, useState } from "react";
import {
  WA_DEFAULT_DATE,
  WA_FLOORPLAN_SETTINGS,
  WA_GATE_REGISTRY,
  WA_LIFT_EQUIPMENT,
  WA_EQUIPMENT,
  WA_RESERVATIONS,
} from "../../data.js";

// 作業間調整pro の各種設定・共通の作業日を画面間で共有するContext
const Ctx = createContext(null);

const DEFAULT_TIME = {
  lift: { start: 6, end: 24 },
  gate: { start: 6, end: 24 },
  material: { start: 6, end: 24 },
};
const DEFAULT_PERM = { lift: "アカウント必須", gate: "アカウント必須", other: "アカウント必須" };
const DEFAULT_TYPE = { lift: "時間制", gate: "時間制", other: "時間制" };
const DEFAULT_INTERVAL = { lift: "30分", gate: "30分", other: "30分" };

export function WaSettingsProvider({ children }) {
  const [date, setDate] = useState(WA_DEFAULT_DATE); // 全ページ共通の作業日
  const [time, setTime] = useState(DEFAULT_TIME);
  const [perm, setPerm] = useState(DEFAULT_PERM);
  const [rtype, setRtype] = useState(DEFAULT_TYPE);
  const [interval, setInterval] = useState(DEFAULT_INTERVAL);
  // 作業配置図設定で登録した台紙（配置図作成で共通利用）
  const [templates, setTemplates] = useState(WA_FLOORPLAN_SETTINGS);
  // 資機材・ゲート登録（予約ページで共通利用。show=予約表示）
  const [gates, setGates] = useState(WA_GATE_REGISTRY);
  const [lifts, setLifts] = useState(WA_LIFT_EQUIPMENT);
  const [equipment, setEquipment] = useState(WA_EQUIPMENT);
  // 予約（ヘッダーの重複通知でも参照するため共有）
  const [reservations, setReservations] = useState(WA_RESERVATIONS);
  return (
    <Ctx.Provider
      value={{
        date, setDate, time, setTime, perm, setPerm, rtype, setRtype,
        interval, setInterval, templates, setTemplates,
        gates, setGates, lifts, setLifts, equipment, setEquipment,
        reservations, setReservations,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useWaSettings() {
  return useContext(Ctx);
}

// 予約種別（kind）→ 設定キーの対応（その他 = aerial ↔ other）
export function settingsKeyOf(kind) {
  return kind === "aerial" ? "other" : kind;
}

// "30分" → 30
export function intervalMinutes(label) {
  return parseInt(label, 10) || 30;
}

// スポット予約で選べる所要時間（分）: 時間間隔の倍数で15〜60分
export function spotDurations(intervalLabel) {
  const step = intervalMinutes(intervalLabel);
  const list = [];
  for (let d = step; d <= 60; d += step) list.push(d);
  return list.length ? list : [step];
}
