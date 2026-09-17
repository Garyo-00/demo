import { createContext, useContext, useMemo, useState } from "react";
import {
  EMPTY_RECORD,
  INITIAL_ANSWER_SETTINGS,
  EMPTY_SEARCH,
  INITIAL_ANSWER_OPTIONS,
  INITIAL_PATROL_ITEMS,
  INITIAL_RECORDS,
  USERS,
  currentMonth,
  nowStamp,
} from "../../patrolData.js";

// 巡回/パトロール デモ用の状態。一覧・詳細で巡回記録を共有する。
const PatrolContext = createContext(null);


export function PatrolProvider({ children }) {
  const [records, setRecords] = useState(INITIAL_RECORDS);
  // 元請（ゼネコン）／協力会社の閲覧ロール。元請確認は元請のみ実施できる。
  const [role, setRole] = useState("prime");

  // 一覧の検索条件と巡回月。画面間で保持する。
  // ブラウザバックでは両方が残り、詳細画面の「一覧へ戻る」では検索条件だけを初期化する。
  // 巡回月の初期値は当月
  const [listSearch, setListSearch] = useState({ month: currentMonth(), cond: EMPTY_SEARCH });

  // 設定画面で編集するマスタ（巡回項目・回答の選択肢）
  const [patrolItems, setPatrolItems] = useState(INITIAL_PATROL_ITEMS);
  const [answerOptions, setAnswerOptions] = useState(INITIAL_ANSWER_OPTIONS);
  const [answerSettings, setAnswerSettings] = useState(INITIAL_ANSWER_SETTINGS);

  // ログインユーザー。デモではロール切替でそのまま切り替わる。
  const currentUser = USERS[role];

  const value = useMemo(() => {
    const patch = (id, fn) => setRecords((list) => list.map((r) => (r.id === id ? fn(r) : r)));
    const patchNotes = (id, fn) => patch(id, (r) => ({ ...r, notes: fn(r.notes) }));
    return {
      records,
      role,
      setRole,
      currentUser,
      patrolItems,
      savePatrolItems: setPatrolItems,
      answerOptions,
      answerSettings,
      // 回答編集の「登録」。選択肢と設定をまとめて保存する。
      saveAnswerConfig: (options, settings) => {
        setAnswerOptions(options);
        setAnswerSettings(settings);
      },
      listSearch,
      setListSearch,
      // 「一覧へ戻る」用。巡回月は保持し、検索条件だけを初期化する。
      resetListCond: () => setListSearch((v) => ({ ...v, cond: EMPTY_SEARCH })),
      // 追記を編集・削除できるのは登録したユーザー本人のみ
      canEditNote: (note) => note.authorId === currentUser.id,
      getRecord: (id) => records.find((r) => r.id === id) || null,
      // 是正内容・是正写真の保存。元請確認の前後を問わず何度でも実行できる。
      saveFixes: (id, { items, photos }) => patch(id, (r) => ({ ...r, items, photos })),
      // 元請確認。作業所コメントは必須で、確認後は編集できない。
      confirmRecord: (id, { items, photos, siteComment }) =>
        patch(id, (r) => ({
          ...r,
          items,
          photos,
          siteComment,
          confirmedDate: new Date().toISOString().slice(0, 10),
          confirmedBy: USERS.prime.name,
        })),
      // 巡回記録の登録（QR読み取り後の実施入力から呼ばれる）。
      // 次回巡回予定が入っている場合は、その日付を予定日とする記録も併せて作る（予定：ステータス「未」）。
      // 予定側は実施会社・実施者を引き継ぐが、一次会社は引き継がない（現行システムの挙動）。
      addRecord: (rec) => {
        const no = String(Math.max(...records.map((r) => Number(r.no) || 0)) + 1);
        const created = { ...rec, id: `p${no}`, no };
        const planned = rec.nextDate
          ? [
              {
                ...EMPTY_RECORD,
                id: `p${Number(no) + 1}`,
                no: String(Number(no) + 1),
                plannedDate: rec.nextDate,
                company: rec.company,
                inspector: rec.inspector,
              },
            ]
          : [];
        setRecords((list) => [...list, created, ...planned]);
        return created;
      },
      // 追記の登録。元請・協力会社のどちらも、実施済みの書類に自由に追加できる。
      addNote: (id, { text, files }) =>
        patchNotes(id, (notes) => [
          ...notes,
          {
            id: `n${Date.now()}`,
            authorId: currentUser.id,
            authorName: currentUser.name,
            authorLabel: currentUser.label,
            createdAt: nowStamp(),
            updatedAt: "",
            text,
            files,
          },
        ]),
      // 追記の更新。本人以外の追記は変更しない。
      updateNote: (id, noteId, { text, files }) =>
        patchNotes(id, (notes) =>
          notes.map((n) =>
            n.id === noteId && n.authorId === currentUser.id ? { ...n, text, files, updatedAt: nowStamp() } : n
          )
        ),
      // 追記の削除。本人以外の追記は消さない。
      removeNote: (id, noteId) =>
        patchNotes(id, (notes) => notes.filter((n) => !(n.id === noteId && n.authorId === currentUser.id))),
    };
  }, [records, role, currentUser, listSearch, patrolItems, answerOptions, answerSettings]);

  return <PatrolContext.Provider value={value}>{children}</PatrolContext.Provider>;
}

export function usePatrol() {
  const ctx = useContext(PatrolContext);
  if (!ctx) throw new Error("usePatrol must be used within PatrolProvider");
  return ctx;
}
