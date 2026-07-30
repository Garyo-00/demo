import { createContext, useContext, useState, useRef } from "react";
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

// 閲覧ロール（元請 / 職長）。画面の出し分けはこの値を各ページで参照する想定。
// 現状は切替の器のみで表示内容は共通。localStorageに保持しリロードしても維持。
const ROLE_KEY = "wa-role";
function initialRole() {
  try {
    const v = localStorage.getItem(ROLE_KEY);
    if (v === "prime" || v === "foreman") return v;
  } catch {
    /* localStorage不可な環境は既定値 */
  }
  return "prime";
}

export function WaSettingsProvider({ children }) {
  const [date, setDate] = useState(WA_DEFAULT_DATE); // 全ページ共通の作業日
  const [role, setRoleState] = useState(initialRole); // "prime" | "foreman"
  function setRole(next) {
    setRoleState(next);
    try {
      localStorage.setItem(ROLE_KEY, next);
    } catch {
      /* 保存失敗は無視（デモ用途） */
    }
  }
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
  // 画面遷移ガード（未保存の編集がある画面が dirty を立て、遷移前に確認する）
  const navDirtyRef = useRef(false);
  function setNavDirty(v) {
    navDirtyRef.current = !!v;
  }
  function confirmLeave() {
    if (navDirtyRef.current) {
      return window.confirm(
        "未保存の編集内容があります。移動すると変更は破棄されます。移動しますか？"
      );
    }
    return true;
  }
  return (
    <Ctx.Provider
      value={{
        role, setRole,
        date, setDate, time, setTime, perm, setPerm, rtype, setRtype,
        interval, setInterval, templates, setTemplates,
        gates, setGates, lifts, setLifts, equipment, setEquipment,
        reservations, setReservations,
        setNavDirty, confirmLeave,
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
