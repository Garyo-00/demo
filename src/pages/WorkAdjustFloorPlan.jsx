import { useState, useRef, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/PrintOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";
import { WA_SAMPLE_PLAN_IMAGE, WA_SAMPLE_PLAN_IMAGE_2F, WA_PROJECT, formatDateStr } from "../data.js";
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
  // 3日前（7/6）の2F平面図の配置図。7/9に「2F平面図」を選ぶと「前回からコピー」がアクティブになる。
  // 前日（7/8）ではなく数日空けてあるのは、「前日」ではなく「前回作成した日」を辿る挙動を確認するため。
  { id: "F-000", date: "2026-07-06", templateId: "FP-002", name: "2F平面図", image: WA_SAMPLE_PLAN_IMAGE_2F, saved: true },
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
  // 「前回」＝表示中の日付より前で、同一平面図の配置図が作られた直近の日のもの。
  // 前日に限らず遡って探す（無ければ「前回からコピー」を非アクティブ）。
  const prevPlan = !selectedTemplateId
    ? null
    : plans
        .filter((p) => p.templateId === selectedTemplateId && p.date < date)
        .sort((a, b) => b.date.localeCompare(a.date))[0] || null;

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

  // 前回作成した配置図（配置）を当日にコピーして作成（選択中の平面図のみ）
  function copyFromPrevPlan() {
    if (!selectedTemplate) return;
    if (!prevPlan) {
      window.alert(`「${selectedTemplate.floorName}」の配置図は過去に作成されていません。`);
      return;
    }
    const prev = prevPlan.date;
    if (!window.confirm(`前回（${formatDateStr(prev)}）の「${selectedTemplate.floorName}」の配置図をコピーしますか？`)) return;
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
    <Box>
      <Typography variant="h1" sx={{ mb: 1.75 }}>
        配置図作成
      </Typography>

      {/* 平面図（台紙）の選択：作業配置図設定に登録された図面をすべて表示 */}
      <Box sx={{ my: 2 }}>
        <TextField
          select
          size="small"
          label="図面"
          value={selectedTemplateId}
          onChange={(e) => setSelectedTemplateId(e.target.value)}
          sx={{ minWidth: 240 }}
        >
          <MenuItem value="">選択してください</MenuItem>
          {templates.map((t) => (
            <MenuItem key={t.id} value={t.id}>
              {t.floorName}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {/* 未選択 */}
      {!selectedTemplateId && (
        <Box
          sx={{
            height: 260,
            borderRadius: 2.5,
            border: "1px dashed",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            color: "text.secondary",
          }}
        >
          図面を選択してください。
        </Box>
      )}

      {/* 選択済み：当日の配置図の作成状況で表示を切替 */}
      {selectedTemplate && (
        <Card sx={{ mb: 1.25 }}>
          <CardContent
            sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", p: "10px 14px !important" }}
          >
            <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{selectedTemplate.floorName}</Typography>
            {currentPlan ? (
              <>
                <Chip size="small" color="success" label="本日の配置図：作成済" />
                <Button variant="outlined" sx={{ ml: "auto" }} onClick={openEdit}>
                  編集
                </Button>
                <Button variant="outlined" color="error" onClick={deletePlan}>
                  削除
                </Button>
                <Button variant="outlined" startIcon={<PrintIcon />} onClick={outputPlan}>
                  出力
                </Button>
              </>
            ) : (
              <>
                <Chip size="small" color="error" variant="outlined" label="本日の配置図：未作成" />
                <Button
                  variant="outlined"
                  startIcon={<ContentCopyOutlinedIcon />}
                  sx={{ ml: "auto" }}
                  onClick={copyFromPrevPlan}
                  disabled={!prevPlan}
                  title={
                    prevPlan
                      ? `前回（${formatDateStr(prevPlan.date)}）の配置図を複製`
                      : "同じ図面の配置図が過去に作成されていません"
                  }
                >
                  前回からコピー
                </Button>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                  新規作成
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* プレビュー（作成済みのときのみ。プレビュー上では編集不可）。
          スタンプはピクセル座標で重ねるため既存CSSのまま。 */}
      {currentPlan && (
        <>
          <div className="fp-canvas">
            {currentPlan.image ? (
              <img className="fp-bg" src={currentPlan.image} alt={currentPlan.name} />
            ) : (
              <div className="fp-bg-empty">この台紙には図面画像が未登録です（作業配置図設定でアップロード）。</div>
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
          <Card sx={{ mt: 2 }}>
            <CardContent sx={{ p: "14px 16px !important" }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="h2">元請連絡事項</Typography>
                {!editingNotes && (
                  <IconButton
                    size="small"
                    onClick={startEditNotes}
                    title="編集"
                    aria-label="編集"
                    sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
              {editingNotes ? (
                <>
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    size="small"
                    autoFocus
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="当日の連絡事項を記入してください"
                  />
                  <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.25, mt: 1.25 }}>
                    <Button variant="outlined" onClick={cancelNotes}>
                      キャンセル
                    </Button>
                    <Button variant="contained" onClick={saveNotes}>
                      保存
                    </Button>
                  </Box>
                </>
              ) : (
                <Typography sx={{ fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", minHeight: 24 }}>
                  {notes[date] ? notes[date] : "（連絡事項は未記入です）"}
                </Typography>
              )}
              {notesMeta[date] && (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, textAlign: "right" }}>
                  最終更新：{notesMeta[date].by}（{notesMeta[date].at}）
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* 印刷用レイアウト（A4縦・画面では非表示、出力ボタン＝window.print で出力。
              ヘッダーは作業予定の印刷プレビューを踏襲。押印欄は無し） */}
          <div className="fp-print" aria-hidden="true">
            {/* 工事番号は出力しない（工事名称のみ） */}
            <div className="pf-topline">
              <span>工事名称 {WA_PROJECT.name}</span>
            </div>
            <div className="pf-headrow">
              <div className="pf-titleblock">
                <h2>作業配置図</h2>
                <div className="pf-meta">
                  対象日：{formatDateStr(date)}／図面：{currentPlan.name}
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
        <Dialog
          open
          fullWidth
          maxWidth="lg"
          onClose={() => setEditor(null)}
          slotProps={{ paper: { sx: { height: "calc(100vh - 32px)", m: 2 } } }}
        >
          <DialogTitle
            component="div"
            sx={{ display: "flex", alignItems: "center", gap: 1, py: 1.5, px: 2.5, bgcolor: "action.hover" }}
          >
            <Typography sx={{ fontSize: 15, fontWeight: 700, flex: 1 }}>
              作業図面の{editor.mode === "new" ? "作成" : "編集"}
            </Typography>
            <IconButton size="small" onClick={() => setEditor(null)} aria-label="閉じる">
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 2.5,
              py: 1.5,
              borderTop: "1px solid",
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <TextField
              select
              size="small"
              value={editor.templateId}
              onChange={(e) => changeEditorTemplate(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              {templates.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.floorName}
                </MenuItem>
              ))}
            </TextField>
            <IconButton
              size="small"
              onClick={doUndo}
              disabled={!undoStack.length}
              title="元に戻す"
              sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
            >
              <UndoIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={doRedo}
              disabled={!redoStack.length}
              title="やり直し"
              sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
            >
              <RedoIcon fontSize="small" />
            </IconButton>
            <Button variant="contained" sx={{ ml: "auto" }} onClick={saveEditor}>
              保存
            </Button>
          </Box>

          <DialogContent sx={{ p: 0, display: "flex", overflow: "hidden" }}>
            {/* 台紙キャンバス（座標配置のため既存CSSのまま） */}
            <div className="fp-dlg-body">
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
                    <div className="fp-bg-empty">この台紙には図面画像が未登録です。</div>
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
                <Box
                  sx={{
                    position: "absolute",
                    left: 16,
                    bottom: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                    zIndex: 6,
                  }}
                >
                  {[
                    { title: "拡大", Icon: ZoomInIcon, run: () => setZoom((z) => Math.min(2, Math.round((z + 0.1) * 10) / 10)) },
                    { title: "縮小", Icon: ZoomOutIcon, run: () => setZoom((z) => Math.max(0.5, Math.round((z - 0.1) * 10) / 10)) },
                    { title: "全体表示", Icon: ZoomOutMapIcon, run: () => setZoom(1) },
                  ].map(({ title, Icon, run }) => (
                    <IconButton
                      key={title}
                      size="small"
                      title={title}
                      onClick={run}
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                        bgcolor: "background.paper",
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                    >
                      <Icon fontSize="small" />
                    </IconButton>
                  ))}
                </Box>
              </div>

              {/* スタンプパレット */}
              <Box className="fp-dlg-palette">
                <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1.25, textAlign: "center" }}>
                  スタンプ
                </Typography>
                {STAMP_GROUPS.map((g) => (
                  <Box key={g.group} sx={{ mb: 1.75 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: "block",
                        fontWeight: 700,
                        mb: 1,
                        pb: 0.5,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      {g.group}
                    </Typography>
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
                  </Box>
                ))}
              </Box>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
}
