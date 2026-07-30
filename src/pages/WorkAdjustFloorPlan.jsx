import { useState, useRef, useEffect } from "react";
import { WA_SAMPLE_PLAN_IMAGE, WA_SAMPLE_PLAN_IMAGE_2F, WA_PROJECT, shiftDate, formatDateStr } from "../data.js";
import { useWaSettings } from "../components/wa/WaSettingsContext.jsx";

// ===== スタンプ（右側パレット。クリックで台紙に配置→ドラッグで移動） =====
const STAMP_GROUPS = [
  {
    group: "重機・車両",
    items: [
      { name: "バックホウ", icon: "🚜", color: "#12b76a" },
      { name: "ラフタークレーン", icon: "🏗️", color: "#e5484d" },
      { name: "クローラークレーン", icon: "🏗️", color: "#1f6feb" },
      { name: "垂直昇降式高所作業車", icon: "🛗", color: "#1f6feb" },
      { name: "ブーム式高所作業車", icon: "🏗️", color: "#1f6feb" },
      { name: "フォークリフト", icon: "🚜", color: "#12b76a" },
      { name: "ポンプ車", icon: "🚒", color: "#e5484d" },
      { name: "ユニック車", icon: "🚚", color: "#1f6feb" },
      { name: "タワークレーン", icon: "🏗️", color: "#e5484d" },
      { name: "ミキサー車", icon: "🚛", color: "#1f6feb" },
      { name: "ブルドーザー", icon: "🚜", color: "#12b76a" },
      { name: "不整地運搬車", icon: "🚚", color: "#12b76a" },
      { name: "ロードローラー", icon: "🚛", color: "#12b76a" },
      { name: "10tダンプ", icon: "🚚", color: "#1f6feb" },
      { name: "トレーラー", icon: "🚛", color: "#1f6feb" },
      { name: "タイヤローラー", icon: "🚜", color: "#12b76a" },
      { name: "杭打機", icon: "🏗️", color: "#12b76a" },
    ],
  },
  {
    group: "作業員・区画",
    items: [
      { name: "作業員", icon: "👷", color: "#e5484d" },
      { name: "誘導員", icon: "🦺", color: "#f79009" },
      { name: "立入禁止", icon: "⛔", color: "#e5484d" },
      { name: "資機材置場", icon: "📦", color: "#137a4b" },
      { name: "ゲート", icon: "🚧", color: "#b54708" },
      { name: "注意", icon: "⚠️", color: "#b42318" },
    ],
  },
];

// 配置図（デモ用の初期プラン。日付ごと・台紙を選んで作成）
const INITIAL_PLANS = [
  { id: "F-001", date: "2026-07-09", templateId: "FP-001", name: "1F平面図", image: WA_SAMPLE_PLAN_IMAGE, saved: true },
  // 前日（7/8）の2F平面図の配置図。7/9に「2F平面図」を選ぶと「前日からコピー」がアクティブになる
  { id: "F-000", date: "2026-07-08", templateId: "FP-002", name: "2F平面図", image: WA_SAMPLE_PLAN_IMAGE_2F, saved: true },
];
const INITIAL_MARKERS = {
  "F-001": [
    { id: "m1", name: "配筋作業（大和建設）", icon: "👷", color: "#1f6feb", x: 30, y: 35 },
    { id: "m2", name: "鉄筋置場", icon: "📦", color: "#137a4b", x: 62, y: 28 },
    { id: "m3", name: "東ゲート", icon: "🚧", color: "#b54708", x: 15, y: 70 },
    { id: "m4", name: "上下作業注意", icon: "⚠️", color: "#b42318", x: 55, y: 60 },
  ],
  "F-000": [
    { id: "n1", name: "内装ボード貼り", icon: "👷", color: "#1f6feb", x: 40, y: 40 },
    { id: "n2", name: "資材置場", icon: "📦", color: "#137a4b", x: 68, y: 30 },
    { id: "n3", name: "高所作業注意", icon: "⚠️", color: "#b42318", x: 30, y: 65 },
  ],
};

// 元請連絡事項（日付ごと。デモ用の初期値）
const INITIAL_NOTES = {
  "2026-07-09": "本日は北エリアで上下作業あり。11:00〜生コン打設のため東ゲートを優先とする。",
};
// 元請連絡事項の更新メタ（最終更新者・時刻・版番号。楽観的ロックに使用）
const INITIAL_NOTES_META = {
  "2026-07-09": { by: "田中 太郎", at: "2026/07/09 08:12", version: 1 },
};
// ログイン中の元請ユーザー（デモ用の固定値）
const CURRENT_USER = "田中 太郎";

const clampPct = (v) => Math.min(100, Math.max(0, v));
// 現在時刻を "YYYY/MM/DD HH:MM" で返す
function fmtNow() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function WorkAdjustFloorPlan() {
  const { date, templates, setNavDirty } = useWaSettings(); // 共通の作業日／登録済みの台紙／遷移ガード
  const [plans, setPlans] = useState(INITIAL_PLANS);
  const [markers, setMarkers] = useState(INITIAL_MARKERS);
  const [notes, setNotes] = useState(INITIAL_NOTES); // 元請連絡事項（日付ごと）
  const [notesMeta, setNotesMeta] = useState(INITIAL_NOTES_META); // 最終更新者・時刻・版
  const [editBaseVersion, setEditBaseVersion] = useState(0); // 編集開始時の版（楽観的ロック）
  const [selectedTemplateId, setSelectedTemplateId] = useState(""); // 初期は未選択（プルダウンのみ）
  const [editor, setEditor] = useState(null); // 作成/編集ダイアログ { mode, planId, templateId, name, image, markers }
  const [draggingId, setDraggingId] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [editingNotes, setEditingNotes] = useState(false); // 元請連絡事項の編集モード
  const [noteDraft, setNoteDraft] = useState("");
  const idRef = useRef(1000);
  const canvasRef = useRef(null);

  const nextId = (prefix) => prefix + ++idRef.current;

  // 選択中の台紙（平面図）と、当日・その台紙の配置図
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || null;
  const currentPlan = selectedTemplateId
    ? plans.find((p) => p.date === date && p.templateId === selectedTemplateId) || null
    : null;
  const currentMarkers = currentPlan ? markers[currentPlan.id] || [] : [];
  // 前日の同一平面図の配置図があるか（無ければ「前日からコピー」を非アクティブ）
  const hasPrevPlan =
    !!selectedTemplateId &&
    plans.some((p) => p.date === shiftDate(date, -1) && p.templateId === selectedTemplateId);

  // ===== 新規作成 / 編集（いずれもダイアログ内でのみスタンプ配置可能） =====
  function openEditor(base) {
    setEditor(base);
    setUndoStack([]);
    setRedoStack([]);
    setZoom(1);
    setDraggingId(null);
  }
  function openCreate() {
    if (!selectedTemplate) return;
    openEditor({ mode: "new", planId: null, templateId: selectedTemplate.id, name: selectedTemplate.floorName, image: selectedTemplate.image, markers: [] });
  }
  function openEdit() {
    if (!currentPlan) return;
    openEditor({
      mode: "edit",
      planId: currentPlan.id,
      templateId: currentPlan.templateId,
      name: currentPlan.name,
      image: currentPlan.image,
      markers: (markers[currentPlan.id] || []).map((m) => ({ ...m })),
    });
  }
  function saveEditor() {
    const ed = editor;
    setEditor(null);
    if (ed.mode === "new") {
      const id = nextId("F-");
      setPlans((ps) => [...ps, { id, date, templateId: ed.templateId, name: ed.name, image: ed.image, saved: true }]);
      setMarkers((m) => ({ ...m, [id]: ed.markers }));
      setNotes((no) => (no[date] != null ? no : { ...no, [date]: "" }));
    } else {
      setMarkers((m) => ({ ...m, [ed.planId]: ed.markers }));
    }
  }

  // ダイアログ内の台紙（平面図）切替
  function changeEditorTemplate(id) {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setEditor((ed) => ({ ...ed, templateId: t.id, name: t.floorName, image: t.image }));
  }

  // ===== undo / redo =====
  function snapshot() {
    setUndoStack((u) => [...u, editor.markers]);
    setRedoStack([]);
  }
  function doUndo() {
    if (!undoStack.length) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, editor.markers]);
    setUndoStack((u) => u.slice(0, -1));
    setEditor((ed) => ({ ...ed, markers: prev }));
  }
  function doRedo() {
    if (!redoStack.length) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, editor.markers]);
    setRedoStack((r) => r.slice(0, -1));
    setEditor((ed) => ({ ...ed, markers: next }));
  }

  // ===== スタンプの配置・移動・削除 =====
  function addStamp(s) {
    snapshot();
    const off = (editor.markers.length % 6) * 4;
    const mk = { id: nextId("m"), name: s.name, icon: s.icon, color: s.color, x: 44 + off, y: 42 + off };
    setEditor((ed) => ({ ...ed, markers: [...ed.markers, mk] }));
  }
  function deleteStamp(id) {
    snapshot();
    setEditor((ed) => ({ ...ed, markers: ed.markers.filter((m) => m.id !== id) }));
  }
  function startDrag(e, id) {
    e.preventDefault();
    e.stopPropagation();
    snapshot();
    setDraggingId(id);
  }
  function onCanvasMove(e) {
    if (!draggingId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = clampPct(Math.round(((e.clientX - rect.left) / rect.width) * 100));
    const y = clampPct(Math.round(((e.clientY - rect.top) / rect.height) * 100));
    setEditor((ed) => ({ ...ed, markers: ed.markers.map((m) => (m.id === draggingId ? { ...m, x, y } : m)) }));
  }
  function endDrag() {
    if (draggingId) setDraggingId(null);
  }

  // 前日の配置図（配置）を当日にコピーして作成（選択中の平面図のみ）
  function copyFromPrevDay() {
    if (!selectedTemplate) return;
    const prev = shiftDate(date, -1);
    const prevPlan = plans.find((p) => p.date === prev && p.templateId === selectedTemplateId);
    if (!prevPlan) {
      window.alert(`前日（${formatDateStr(prev)}）の「${selectedTemplate.floorName}」の配置図がありません。`);
      return;
    }
    if (!window.confirm(`前日（${formatDateStr(prev)}）の「${selectedTemplate.floorName}」の配置図をコピーしますか？`)) return;
    const id = nextId("F-");
    setPlans((ps) => [...ps, { id, date, templateId: prevPlan.templateId, name: prevPlan.name, image: prevPlan.image, saved: true }]);
    setMarkers((m) => ({ ...m, [id]: (m[prevPlan.id] || []).map((mk, i) => ({ ...mk, id: "m" + id + "-" + i })) }));
    setNotes((no) => (no[date] != null ? no : { ...no, [date]: no[prev] || "" }));
  }

  function deletePlan() {
    if (!currentPlan) return;
    if (!window.confirm(`「${currentPlan.name}」（${formatDateStr(date)}）の配置図を削除しますか？`)) return;
    const id = currentPlan.id;
    setPlans((ps) => ps.filter((p) => p.id !== id));
    setMarkers((m) => {
      const { [id]: _drop, ...rest } = m;
      return rest;
    });
  }

  function outputPlan() {
    if (!currentPlan) return;
    window.print(); // 配置図＋元請連絡事項を印刷（下部の .fp-print を @media print で出力）
  }

  // ===== 元請連絡事項の編集（鉛筆→編集→保存/キャンセル） =====
  function startEditNotes() {
    setNoteDraft(notes[date] || "");
    setEditBaseVersion(notesMeta[date]?.version ?? 0); // 編集開始時点の版を記録
    setEditingNotes(true);
  }
  function saveNotes() {
    // 楽観的ロック：編集開始後に他ユーザーが更新していたら上書きしない
    const curVersion = notesMeta[date]?.version ?? 0;
    if (curVersion !== editBaseVersion) {
      window.alert("他のユーザーが更新しました。内容を破棄して再読込してください。");
      return;
    }
    setNotes((n) => ({ ...n, [date]: noteDraft }));
    setNotesMeta((m) => ({ ...m, [date]: { by: CURRENT_USER, at: fmtNow(), version: curVersion + 1 } }));
    setEditingNotes(false);
  }
  function cancelNotes() {
    setEditingNotes(false);
  }

  // 元請連絡事項の編集中に離脱（リロード/タブを閉じる/外部遷移）しようとしたら警告
  useEffect(() => {
    if (!editingNotes) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [editingNotes]);

  // 編集中はアプリ内遷移（サイドバー/日付送り）でも確認する（遷移ガード）
  useEffect(() => {
    setNavDirty(editingNotes);
    return () => setNavDirty(false);
  }, [editingNotes, setNavDirty]);

  // 日付が変わったら連絡事項の編集モードを解除（別日の内容に切替）
  useEffect(() => {
    setEditingNotes(false);
  }, [date]);

  return (
    <div>
      <div className="page-title">配置図作成</div>

      {/* 平面図（台紙）の選択：作業配置図設定に登録された図面をすべて表示 */}
      <div className="toolbar">
        <label className="fp-select-label">平面図</label>
        <select
          value={selectedTemplateId}
          onChange={(e) => setSelectedTemplateId(e.target.value)}
          style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--line)", fontSize: 13, minWidth: 200 }}
        >
          <option value="">選択してください</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.floorName}
            </option>
          ))}
        </select>
      </div>

      {/* 未選択 */}
      {!selectedTemplateId && (
        <div className="fp-bg-empty" style={{ position: "static", height: 260, borderRadius: 10, border: "1px dashed var(--line)" }}>
          平面図を選択してください。
        </div>
      )}

      {/* 選択済み：当日の配置図の作成状況で表示を切替 */}
      {selectedTemplate && (
        <div className="fp-editbar">
          <strong className="fp-editbar-name">{selectedTemplate.floorName}</strong>
          {currentPlan ? (
            <>
              <span className="badge-green">本日の配置図：作成済</span>
              <button className="ghost-btn spacer" onClick={openEdit}>
                編集
              </button>
              <button className="ghost-btn danger" onClick={deletePlan}>
                削除
              </button>
              <button className="ghost-btn has-icon" onClick={outputPlan}>
                <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="18" fill="currentColor">
                  <path d="M640-640v-120H320v120h-80v-200h480v200h-80Zm-480 80h640-640Zm560 100q17 0 28.5-11.5T760-500q0-17-11.5-28.5T720-540q-17 0-28.5 11.5T680-500q0 17 11.5 28.5T720-460Zm-80 260v-160H320v160h320Zm80 80H240v-160H80v-240q0-51 35-85.5t85-34.5h560q51 0 85.5 34.5T880-520v240H720v160Zm80-240v-160q0-17-11.5-28.5T760-560H200q-17 0-28.5 11.5T160-520v160h80v-80h480v80h80Z" />
                </svg>
                出力
              </button>
            </>
          ) : (
            <>
              <span className="badge-red">本日の配置図：未作成</span>
              <button
                className="ghost-btn spacer"
                onClick={copyFromPrevDay}
                disabled={!hasPrevPlan}
                title={hasPrevPlan ? "前日の配置図を複製" : "前日に同じ平面図の配置図がありません"}
              >
                ⧉ 前日からコピー
              </button>
              <button className="primary-btn" onClick={openCreate}>
                ＋ 新規作成
              </button>
            </>
          )}
        </div>
      )}

      {/* プレビュー（作成済みのときのみ。プレビュー上では編集不可） */}
      {currentPlan && (
        <>
          <div className="fp-canvas">
            {currentPlan.image ? (
              <img className="fp-bg" src={currentPlan.image} alt={currentPlan.name} />
            ) : (
              <div className="fp-bg-empty">この台紙には平面図画像が未登録です（作業配置図設定でアップロード）。</div>
            )}
            {currentMarkers.map((m) => (
              <div key={m.id} className="fp-stamp-marker" style={{ left: m.x + "%", top: m.y + "%" }}>
                <span className="fp-stamp-marker-icon" style={{ borderColor: m.color }}>
                  {m.icon}
                </span>
                <span className="fp-stamp-marker-label">{m.name}</span>
              </div>
            ))}
          </div>

          {/* 元請連絡事項（配置図が作成されている場合のみ表示。鉛筆で編集） */}
          <div className="fp-notes">
            <div className="fp-notes-head">
              <label className="fp-notes-label">元請連絡事項</label>
              {!editingNotes && (
                <button className="fp-notes-edit" onClick={startEditNotes} title="編集" aria-label="編集">
                  <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="18" fill="currentColor">
                    <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
                  </svg>
                </button>
              )}
            </div>
            {editingNotes ? (
              <>
                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="当日の連絡事項を記入してください"
                  autoFocus
                />
                <div className="fp-notes-actions">
                  <button className="ghost-btn" onClick={cancelNotes}>
                    キャンセル
                  </button>
                  <button className="primary-btn" onClick={saveNotes}>
                    保存
                  </button>
                </div>
              </>
            ) : (
              <div className="fp-notes-view">{notes[date] ? notes[date] : "（連絡事項は未記入です）"}</div>
            )}
            {notesMeta[date] && (
              <div className="fp-notes-meta">
                最終更新：{notesMeta[date].by}（{notesMeta[date].at}）
              </div>
            )}
          </div>

          {/* 印刷用レイアウト（A4縦・画面では非表示、出力ボタン＝window.print で出力。
              ヘッダーは作業予定の印刷プレビューを踏襲。押印欄は無し） */}
          <div className="fp-print" aria-hidden="true">
            <div className="pf-topline">
              <span>工事番号 {WA_PROJECT.number}</span>
              <span>工事名称 {WA_PROJECT.name}</span>
            </div>
            <div className="pf-headrow">
              <div className="pf-titleblock">
                <h2>作業配置図</h2>
                <div className="pf-meta">
                  対象日：{formatDateStr(date)}／平面図：{currentPlan.name}
                </div>
              </div>
            </div>
            <div className="fp-print-canvas">
              {currentPlan.image && <img src={currentPlan.image} alt={currentPlan.name} />}
              {currentMarkers.map((m) => (
                <div key={m.id} className="fp-stamp-marker" style={{ left: m.x + "%", top: m.y + "%" }}>
                  <span className="fp-stamp-marker-icon" style={{ borderColor: m.color }}>
                    {m.icon}
                  </span>
                  <span className="fp-stamp-marker-label">{m.name}</span>
                </div>
              ))}
            </div>
            <div className="fp-print-notes">
              <div className="fp-print-notes-h">元請連絡事項</div>
              <div className="fp-print-notes-b">{notes[date] ? notes[date] : "（記入なし）"}</div>
            </div>
          </div>
        </>
      )}

      {/* 作成 / 編集ダイアログ：スタンプを台紙にドロップ→ドラッグで移動 */}
      {editor && (
        <div className="fp-dlg-overlay">
          <div className="fp-dlg">
            <div className="fp-dlg-head">
              <h3>作業平面図の{editor.mode === "new" ? "作成" : "編集"}</h3>
              <button className="x" onClick={() => setEditor(null)} aria-label="閉じる">
                ×
              </button>
            </div>

            <div className="fp-dlg-sub">
              <select
                className="fp-dlg-tmpl"
                value={editor.templateId}
                onChange={(e) => changeEditorTemplate(e.target.value)}
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.floorName}
                  </option>
                ))}
              </select>
              <div className="fp-dlg-toolicons">
                <button className="fp-icon-btn" onClick={doUndo} disabled={!undoStack.length} title="元に戻す">
                  ↩
                </button>
                <button className="fp-icon-btn" onClick={doRedo} disabled={!redoStack.length} title="やり直し">
                  ↪
                </button>
              </div>
              <button className="primary-btn spacer" onClick={saveEditor}>
                保存
              </button>
            </div>

            <div className="fp-dlg-body">
              {/* 台紙キャンバス */}
              <div className="fp-dlg-canvas-wrap">
                <div
                  className={"fp-dlg-canvas" + (draggingId ? " dragging" : "")}
                  ref={canvasRef}
                  style={{ transform: `scale(${zoom})` }}
                  onMouseMove={onCanvasMove}
                  onMouseUp={endDrag}
                  onMouseLeave={endDrag}
                >
                  {editor.image ? (
                    <img className="fp-bg" src={editor.image} alt={editor.name} draggable={false} />
                  ) : (
                    <div className="fp-bg-empty">この台紙には平面図画像が未登録です。</div>
                  )}
                  {editor.markers.length === 0 && (
                    <div className="fp-hint">右のスタンプをクリックして配置し、ドラッグで移動します。</div>
                  )}
                  {editor.markers.map((m) => (
                    <div
                      key={m.id}
                      className={"fp-stamp-marker editable" + (draggingId === m.id ? " dragging" : "")}
                      style={{ left: m.x + "%", top: m.y + "%" }}
                      onMouseDown={(e) => startDrag(e, m.id)}
                    >
                      <span className="fp-stamp-marker-icon" style={{ borderColor: m.color }}>
                        {m.icon}
                      </span>
                      <span className="fp-stamp-marker-label">{m.name}</span>
                      <button
                        className="fp-stamp-del"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          deleteStamp(m.id);
                        }}
                        title="削除"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                {/* ズーム操作 */}
                <div className="fp-zoom">
                  <button onClick={() => setZoom((z) => Math.min(2, Math.round((z + 0.1) * 10) / 10))} title="拡大">
                    ＋
                  </button>
                  <button onClick={() => setZoom((z) => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))} title="縮小">
                    －
                  </button>
                  <button onClick={() => setZoom(1)} title="全体表示">
                    ⤢
                  </button>
                </div>
              </div>

              {/* スタンプパレット */}
              <div className="fp-dlg-palette">
                <div className="fp-palette-title">スタンプ</div>
                {STAMP_GROUPS.map((g) => (
                  <div key={g.group} className="fp-palette-group">
                    <div className="fp-palette-group-name">{g.group}</div>
                    <div className="fp-stamp-grid">
                      {g.items.map((s) => (
                        <button key={s.name} className="fp-stamp" onClick={() => addStamp(s)} title={`${s.name}を配置`}>
                          <span className="fp-stamp-icon" style={{ borderColor: s.color }}>
                            {s.icon}
                          </span>
                          <span className="fp-stamp-name">{s.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
