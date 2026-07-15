import { useState, useRef } from "react";
import Modal from "../components/wa/Modal.jsx";
import { SelectField, SuggestField } from "../components/wa/Field.jsx";
import { WA_COMPANIES, WA_SAMPLE_PLAN_IMAGE, shiftDate, formatDateStr } from "../data.js";
import { useWaSettings } from "../components/wa/WaSettingsContext.jsx";

// 配置図（デモ用の初期プラン。日付ごと・台紙を選んで作成）
const INITIAL_PLANS = [
  { id: "F-001", date: "2026-07-09", templateId: "FP-001", name: "1F平面図", image: WA_SAMPLE_PLAN_IMAGE, saved: true },
];
const INITIAL_MARKERS = {
  "F-001": [
    { id: "m1", type: "作業", label: "配筋作業（大和建設）", x: 30, y: 35 },
    { id: "m2", type: "資機材", label: "鉄筋置場", x: 62, y: 28 },
    { id: "m3", type: "ゲート", label: "東ゲート", x: 15, y: 70 },
    { id: "m4", type: "注意", label: "上下作業注意", x: 55, y: 60 },
  ],
};

const MARKER_TYPES = ["作業", "資機材", "ゲート", "注意"];
const TYPE_COLOR = {
  作業: "#1f6feb",
  資機材: "#137a4b",
  ゲート: "#b54708",
  注意: "#b42318",
};

function emptyMarker(x = 50, y = 50) {
  return { id: "", type: "作業", label: "", x, y };
}

// 元請連絡事項（日付ごと。デモ用の初期値）
const INITIAL_NOTES = {
  "2026-07-09": "本日は北エリアで上下作業あり。11:00〜生コン打設のため東ゲートを優先とする。",
};

export default function WorkAdjustFloorPlan() {
  const { date, templates } = useWaSettings(); // 共通の作業日／登録済みの台紙
  const [plans, setPlans] = useState(INITIAL_PLANS);
  const [markers, setMarkers] = useState(INITIAL_MARKERS);
  const [notes, setNotes] = useState(INITIAL_NOTES); // 元請連絡事項（日付ごと）
  const [current, setCurrent] = useState("F-001");
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(null); // 台紙選択ダイアログ
  const [seq, setSeq] = useState(100);
  const canvasRef = useRef(null);

  // 表示中の日付の配置図のみ。current が無ければ当日の先頭を使う
  const dayPlans = plans.filter((p) => p.date === date);
  const activeId = dayPlans.some((p) => p.id === current)
    ? current
    : dayPlans[0]?.id ?? null;
  const activePlan = dayPlans.find((p) => p.id === activeId) || null;
  const list = activeId ? markers[activeId] || [] : [];
  // 未保存の配置図は編集モード（台紙クリックで配置追加・保存で確定）
  const isEditing = !!activePlan && !activePlan.saved;

  // まだ当日に作成していない台紙のみ（1日ごとに台紙分だけ作成可）
  const usedTemplateIds = new Set(dayPlans.map((p) => p.templateId));
  const availableTemplates = templates.filter((t) => !usedTemplateIds.has(t.id));

  // 配置図の新規作成（台紙を選択して作成）
  function openCreate() {
    if (templates.length === 0) {
      window.alert("台紙が登録されていません。先に「作業配置図設定」で台紙を登録してください。");
      return;
    }
    if (availableTemplates.length === 0) {
      window.alert("この日は登録済みの台紙をすべて配置図化済みです。");
      return;
    }
    setCreating({ templateId: availableTemplates[0].id });
  }
  function commitCreate() {
    const t = templates.find((x) => x.id === creating.templateId);
    if (!t) return;
    const n = seq + 1;
    setSeq(n);
    const id = "F-" + String(n).padStart(3, "0");
    // 未保存（編集モード）で作成 → 台紙上に配置を追加していく
    setPlans((ps) => [...ps, { id, date, templateId: t.id, name: t.floorName, image: t.image, saved: false }]);
    setMarkers((m) => ({ ...m, [id]: [] }));
    setCurrent(id);
    setCreating(null);
  }

  // 前日の配置図（名称・配置）と元請連絡事項を当日にコピーして作成
  function copyFromPrevDay() {
    const prev = shiftDate(date, -1);
    const prevPlans = plans.filter((p) => p.date === prev);
    if (prevPlans.length === 0) {
      window.alert(`前日（${formatDateStr(prev)}）の配置図がありません。`);
      return;
    }
    if (!window.confirm(`前日（${formatDateStr(prev)}）の配置図 ${prevPlans.length} 件を当日にコピーしますか？`)) {
      return;
    }
    let n = seq;
    const newPlans = [];
    const newMarkers = {};
    prevPlans.forEach((p) => {
      n += 1;
      const id = "F-" + String(n).padStart(3, "0");
      newPlans.push({ id, date, templateId: p.templateId, name: p.name, image: p.image, saved: true });
      newMarkers[id] = (markers[p.id] || []).map((mk, i) => ({ ...mk, id: "m" + n + "-" + i }));
    });
    setSeq(n);
    setPlans((ps) => [...ps, ...newPlans]);
    setMarkers((m) => ({ ...m, ...newMarkers }));
    setCurrent(newPlans[0].id);
    setNotes((no) => (no[date] ? no : { ...no, [date]: no[prev] || "" }));
  }

  // 配置図を保存（確定）／再編集
  function finalizePlan() {
    setPlans((ps) => ps.map((p) => (p.id === activeId ? { ...p, saved: true } : p)));
  }
  function reEditPlan() {
    setPlans((ps) => ps.map((p) => (p.id === activeId ? { ...p, saved: false } : p)));
  }

  // 台紙クリックで配置を追加（編集モードのみ）
  function onCanvasClick(e) {
    if (!isEditing || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.min(100, Math.max(0, Math.round(((e.clientY - rect.top) / rect.height) * 100)));
    setEditing(emptyMarker(x, y));
  }

  function save() {
    const mk = editing;
    setMarkers((m) => {
      const cur = m[activeId] || [];
      if (mk.id) {
        return { ...m, [activeId]: cur.map((x) => (x.id === mk.id ? mk : x)) };
      }
      const n = seq + 1;
      setSeq(n);
      return { ...m, [activeId]: [...cur, { ...mk, id: "m" + n }] };
    });
    setEditing(null);
  }
  function remove() {
    setMarkers((m) => ({
      ...m,
      [activeId]: (m[activeId] || []).filter((x) => x.id !== editing.id),
    }));
    setEditing(null);
  }

  return (
    <div>
      <div className="crumb">配置図作成</div>
      <div className="toolbar">
        {dayPlans.length > 0 ? (
          <select
            value={activeId}
            onChange={(e) => setCurrent(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--line)", fontSize: 13 }}
          >
            {dayPlans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.saved ? "" : "（編集中）"}
              </option>
            ))}
          </select>
        ) : (
          <span className="subtle">この日の配置図はありません</span>
        )}
        <button className="ghost-btn" onClick={copyFromPrevDay}>
          ⧉ 前日からコピー
        </button>
        <button className="primary-btn spacer" onClick={openCreate}>
          ＋ 配置図を新規作成
        </button>
      </div>

      {/* 編集／確定バー */}
      {activePlan && (
        <div className="fp-editbar">
          <strong className="fp-editbar-name">{activePlan.name}</strong>
          {isEditing ? (
            <>
              <span className="subtle">台紙をクリックして配置を追加できます。</span>
              <button className="primary-btn spacer" onClick={finalizePlan}>
                保存して確定
              </button>
            </>
          ) : (
            <>
              <span className="badge-green">確定済</span>
              <button className="ghost-btn spacer" onClick={reEditPlan}>
                編集
              </button>
            </>
          )}
        </div>
      )}

      <div
        className={"fp-canvas" + (isEditing ? " editing" : "")}
        ref={canvasRef}
        onClick={onCanvasClick}
      >
        {/* 台紙（作業配置図設定で登録した平面図）を背景に表示 */}
        {activePlan?.image ? (
          <img className="fp-bg" src={activePlan.image} alt={activePlan.name} />
        ) : (
          <div className="fp-bg-empty">
            {activeId
              ? "この台紙には平面図画像が未登録です（作業配置図設定でアップロード）。"
              : "「＋ 配置図を新規作成」で台紙を選択してください。"}
          </div>
        )}
        {isEditing && list.length === 0 && (
          <div className="fp-hint">台紙をクリックして作業・資機材・ゲート等を配置します。</div>
        )}
        {list.map((mk) => (
          <button
            key={mk.id}
            onClick={(e) => {
              e.stopPropagation();
              if (isEditing) setEditing({ ...mk });
            }}
            style={{
              position: "absolute",
              left: mk.x + "%",
              top: mk.y + "%",
              transform: "translate(-50%,-50%)",
              background: "#fff",
              border: `2px solid ${TYPE_COLOR[mk.type]}`,
              color: TYPE_COLOR[mk.type],
              borderRadius: 8,
              padding: "4px 10px",
              fontSize: 12,
              cursor: isEditing ? "pointer" : "default",
              whiteSpace: "nowrap",
              boxShadow: "0 2px 6px rgba(0,0,0,.08)",
            }}
            title={isEditing ? "クリックで編集・削除" : ""}
          >
            <span style={{ fontWeight: 700 }}>{mk.type}</span>：{mk.label}
          </button>
        ))}
      </div>
      <p className="rsv-note">
        ※ 「＋ 配置図を新規作成」で台紙を選択 → 台紙上をクリックして配置を追加・編集 → 「保存して確定」で図面を確定します。
      </p>

      {/* 元請連絡事項（日付ごと・元請が記入） */}
      <div className="fp-notes">
        <label className="fp-notes-label">
          元請連絡事項<span className="fp-notes-sub">（{formatDateStr(date)}／元請が記入）</span>
        </label>
        <textarea
          value={notes[date] || ""}
          onChange={(e) => setNotes((n) => ({ ...n, [date]: e.target.value }))}
          placeholder="当日の連絡事項を記入してください"
        />
      </div>

      {editing && (
        <Modal
          title={editing.id ? "配置の編集" : "配置の追加"}
          onClose={() => setEditing(null)}
          footer={
            <>
              {editing.id && (
                <button className="mini-btn danger" onClick={remove}>
                  削除
                </button>
              )}
              <button className="ghost-btn spacer" onClick={() => setEditing(null)}>
                キャンセル
              </button>
              <button className="primary-btn" onClick={save}>
                保存
              </button>
            </>
          }
        >
          <div className="form-grid">
            <SelectField
              label="種別"
              value={editing.type}
              onChange={(v) => setEditing((x) => ({ ...x, type: v }))}
              options={MARKER_TYPES}
            />
            <SuggestField
              label="ラベル"
              value={editing.label}
              onChange={(v) => setEditing((x) => ({ ...x, label: v }))}
              options={WA_COMPANIES}
            />
            <div className="field">
              <label>位置 X（%）</label>
              <input
                type="number"
                min={0}
                max={100}
                value={editing.x}
                onChange={(e) => setEditing((x) => ({ ...x, x: Number(e.target.value) }))}
              />
            </div>
            <div className="field">
              <label>位置 Y（%）</label>
              <input
                type="number"
                min={0}
                max={100}
                value={editing.y}
                onChange={(e) => setEditing((x) => ({ ...x, y: Number(e.target.value) }))}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* 台紙を選択して配置図を新規作成（プレビューなし） */}
      {creating && (
        <Modal
          title="配置図の新規作成（台紙を選択）"
          onClose={() => setCreating(null)}
          footer={
            <>
              <button className="ghost-btn" onClick={() => setCreating(null)}>
                キャンセル
              </button>
              <button className="primary-btn" onClick={commitCreate}>
                この台紙で作成
              </button>
            </>
          }
        >
          <p className="subtle" style={{ marginTop: 0 }}>
            作業配置図設定で登録された台紙から選択します。選択後、台紙上に配置を追加していきます。
          </p>
          <div className="form-grid">
            <SelectField
              full
              label="台紙（フロア）"
              value={creating.templateId}
              onChange={(v) => setCreating({ templateId: v })}
              options={availableTemplates.map((t) => ({ value: t.id, label: t.floorName }))}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
