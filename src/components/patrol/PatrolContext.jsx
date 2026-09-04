import { createContext, useContext, useMemo, useState } from "react";
import { INITIAL_RECORDS, USERS, nowStamp } from "../../patrolData.js";

// 巡回/パトロール デモ用の状態。一覧・詳細で巡回記録を共有する。
const PatrolContext = createContext(null);


export function PatrolProvider({ children }) {
  const [records, setRecords] = useState(INITIAL_RECORDS);
  // 元請（ゼネコン）／協力会社の閲覧ロール。元請確認は元請のみ実施できる。
  const [role, setRole] = useState("prime");

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
  }, [records, role, currentUser]);

  return <PatrolContext.Provider value={value}>{children}</PatrolContext.Provider>;
}

export function usePatrol() {
  const ctx = useContext(PatrolContext);
  if (!ctx) throw new Error("usePatrol must be used within PatrolProvider");
  return ctx;
}
