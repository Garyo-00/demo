import { useState, useRef, useEffect, Fragment } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Radio,
  RadioGroup,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PrintIcon from "@mui/icons-material/PrintOutlined";
import {
  WA_VEHICLE_TYPES,
  WA_MY_COMPANY,
  formatDateStr,
} from "../data.js";
import Modal from "../components/wa/Modal.jsx";
import PrintPreview from "../components/wa/PrintPreview.jsx";
import ReservationPrint from "../components/wa/ReservationPrint.jsx";
import { SuggestField, SelectField, ReadonlyField, FormGrid } from "../components/wa/Field.jsx";
import {
  DAY_START,
  DAY_END,
  makeHours,
  makeTimeOptions,
  addMinutes,
  toHour,
  layoutLabeled,
  overlapBands,
  pctHour,
  LABEL_COL,
  INSET,
} from "../components/wa/rsvTimeline.js";
import {
  useWaSettings,
  settingsKeyOf,
  spotDurations,
  intervalMinutes,
} from "../components/wa/WaSettingsContext.jsx";
import { scheduleOfReservation } from "../components/wa/scheduleLinks.js";
import TablePagination from "../components/wa/TablePagination.jsx";
import RsvDayColumns, { MAX_COMPARE } from "../components/wa/RsvDayColumns.jsx";
import { useIsNarrow } from "../components/wa/useIsNarrow.js";

// タブ表示順（揚重機 → ゲート → その他）
const KINDS_ALL = ["lift", "gate", "aerial"];
const CONTENT_MAX = 25; // 作業内容の文字数上限
const REMARK_MAX = 25; // 備考の文字数上限

// 所要時間（分）
const durationMin = (start, end) => Math.round((toHour(end) - toHour(start)) * 60);

// ===== 2部制の予約枠（丸／他社ラベル）のスタイル =====
const SLOT_BASE = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 22,
  height: 22,
  borderRadius: "50%",
  border: "1.5px solid",
  borderColor: "divider",
  bgcolor: "background.paper",
  p: 0,
};
const SLOT_SELF = { ...SLOT_BASE, bgcolor: "primary.main", borderColor: "primary.main" };
const SLOT_DISABLED = {
  ...SLOT_BASE,
  background: "repeating-linear-gradient(45deg,#f4f4f5,#f4f4f5 3px,#e4e4e7 3px,#e4e4e7 6px)",
  cursor: "not-allowed",
};
const SLOT_OTHER = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "auto",
  height: "auto",
  borderRadius: 1.5,
  border: 0,
  bgcolor: "#e4e7ec",
  color: "#667085",
  fontSize: 10,
  fontWeight: 600,
  px: 0.75,
  py: 0.375,
  whiteSpace: "nowrap",
  maxWidth: 66,
  overflow: "hidden",
  textOverflow: "ellipsis",
  cursor: "not-allowed",
};

// 予約に紐づいている作業予定。1つの予約に紐づく作業予定は1件まで（[01] §4-2）。
function LinkedSchedule({ schedules, rsvId }) {
  const rec = scheduleOfReservation(schedules, rsvId);
  if (!rec) {
    return (
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 1.25, mb: 1.75, bgcolor: "action.hover" }}
      >
        この予約に紐づいている作業予定はありません。
      </Typography>
    );
  }
  const place = [rec.building, rec.floor, rec.area, rec.zone].filter(Boolean).join(" / ");
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1.25,
        border: "1px solid",
        borderColor: "primary.main",
        bgcolor: "primary.light",
        borderRadius: 2,
        p: 1.25,
        mb: 1.75,
      }}
    >
      <Chip size="small" label="紐づく作業予定" sx={{ bgcolor: "background.paper", color: "primary.main" }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{rec.content || "（作業内容なし）"}</Typography>
        <Typography variant="caption" color="text.secondary">
          {[rec.company, rec.jobType, place].filter(Boolean).join("／")}
        </Typography>
      </Box>
    </Box>
  );
}

// 予約タブ（資源種別）のラベル
const KIND_LABEL = { lift: "揚重機", gate: "ゲート", aerial: "資機材・その他" };

function emptyRsv(kind, date, resvType = "normal", resource = "") {
  return {
    id: "",
    kind,
    resource,
    company: "",
    date,
    start: "08:00",
    end: "10:00",
    content: "",
    workPlace: "",
    remark: "",
    vehicleType: kind === "gate" ? WA_VEHICLE_TYPES[0] : "",
    resvType,
  };
}

// ===== 2部制（AM/PM）予約グリッド用ヘルパー =====
const pad2 = (n) => String(n).padStart(2, "0");
const dayKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"];
const dayLabel = (d) => `${d.getMonth() + 1}/${d.getDate()}（${WEEKDAY[d.getDay()]}）`;
// 今日から7日間
function computeWeek() {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(base);
    x.setDate(base.getDate() + i);
    return x;
  });
}
// 2部制：ログインユーザーの会社・氏名（アカウントに紐づく想定。デモ用の固定値）
const MY_COMPANY = WA_MY_COMPANY; // 大和建設
const MY_USER = "佐藤 健";

// restrictAerial: 資機材・その他タブのみ表示（アカウントなし予約ポータル用）
// guest: アカウントなし（元請の出力・確定を非表示）
export default function WorkAdjustReservation({ restrictAerial = false, guest = false } = {}) {
  // 共通の作業日／登録済みの資機材・ゲート／予約（共有）
  const {
    interval, time, date, gates, lifts, equipment, role,
    reservations: rows, setReservations: setRows,
    schedules, companies,
  } = useWaSettings();
  // 協力会社名の選択肢は「協力会社設定」に登録された会社（表示順のまま）
  const companyOptions = companies.map((c) => c.name);
  const KINDS = restrictAerial ? ["aerial"] : KINDS_ALL;
  // 元請のみの操作（出力・確定）。アカウントなし（guest）では非表示
  const canManage = !guest && role === "prime";
  const [kindState, setKind] = useState(restrictAerial ? "aerial" : "gate");
  // aerial限定時は常に資機材・その他タブを表示
  const kind = restrictAerial ? "aerial" : kindState;
  // 資機材・その他タブの表示（時間制／2部制）。デモ用のビュー切替。
  // 予約方法は資機材ごとに「資機材・ゲート登録」で設定。ここのトグルは表示中の予約方法の切替。
  const [aerialView, setAerialView] = useState("2部制");
  const [editing, setEditing] = useState(null);
  const [seq, setSeq] = useState(rows.length);
  const [showPrint, setShowPrint] = useState(false);
  // 資機材・その他タブのカテゴリ絞り込み（プルダウンからの複数選択。空＝すべて）
  const [cats, setCats] = useState([]);
  // 予約テーブル（機械の行）のページネーション（50件ずつ）
  const [rsvPage, setRsvPage] = useState(0);
  const [rsvPageSize, setRsvPageSize] = useState(50);
  // 2部制（AM/PM）の予約枠。今日から7日間（日付送りの影響を受けず固定）。key = 資源|日付|am/pm → {company, user}
  const [week] = useState(computeWeek);
  const nowHour = new Date().getHours(); // 当日枠の予約可否判定に使用
  const [slotDialog, setSlotDialog] = useState(null); // 予約の詳細・取消ダイアログ {res,d,p}
  const [bookForm, setBookForm] = useState(null); // アカウントなし予約の入力ダイアログ {res,d,p,name,company}
  const [slots, setSlots] = useState(() => {
    const s = {};
    const set = (res, di, p, co, user) => {
      // self=自分（このユーザー/端末）が予約した枠かどうか。他社サンプルは self:false
      s[`${res}|${dayKey(week[di])}|${p}`] = { company: co, user: user || "", self: false };
    };
    // 他社の既存予約（重複予約できないことの確認用サンプル）
    set("高所作業車 4.5m-001号", 0, "am", "青木工業", "鈴木 一郎");
    set("高所作業車 4.5m-002号", 1, "pm", "みらい電気", "高橋 誠");
    set("高所作業車 4.5m-003号", 0, "am", "青木工業", "鈴木 一郎");
    set("高所作業車 4.5m-005号", 2, "pm", "山本電気", "山本 健太");
    set("駐車場-001", 0, "pm", "東洋設備", "伊藤 大輔");
    set("駐車場-002", 3, "am", "渡辺工務店", "渡辺 浩");
    set("駐車場-004", 1, "am", "林基礎", "林 大樹");
    return s;
  });
  // 当日枠の予約可否（当日0時以降はAM不可、当日12時以降はPM不可。dayIndex 0＝今日）
  function slotDisabled(dayIndex, p) {
    if (dayIndex !== 0) return false;
    return p === "am" || (p === "pm" && nowHour >= 12);
  }
  // 空き枠のクリック。アカウントあり＝ログイン会社で即予約／アカウントなし＝予約者・会社名を入力
  function onEmptySlot(res, d, p) {
    if (guest) {
      setBookForm({ res, d, p, name: "", company: "" });
    } else {
      const key = `${res}|${dayKey(d)}|${p}`;
      setSlots((s) => ({ ...s, [key]: { company: MY_COMPANY, user: MY_USER, self: true } }));
    }
  }
  // アカウントなし予約の確定（予約者名・会社名を入力して予約）
  function submitBook() {
    if (!bookForm.company.trim() || !bookForm.name.trim()) {
      window.alert("会社名と予約者名を入力してください。");
      return;
    }
    const { res, d, p } = bookForm;
    const key = `${res}|${dayKey(d)}|${p}`;
    setSlots((s) => ({ ...s, [key]: { company: bookForm.company.trim(), user: bookForm.name.trim(), self: true } }));
    setBookForm(null);
  }
  // 予約の取消（詳細ダイアログから。自分の予約のみ取消可）
  function cancelSlot() {
    const { res, d, p } = slotDialog;
    const key = `${res}|${dayKey(d)}|${p}`;
    setSlots((s) => {
      const next = { ...s };
      delete next[key];
      return next;
    });
    setSlotDialog(null);
  }
  // 確定は日付単位・全タブ（揚重機/ゲート/その他）共通
  const [confirmedDays, setConfirmedDays] = useState({});
  const isConfirmed = !!confirmedDays[date];

  // トラック（タイムライン）のピクセル幅を計測（ラベル配置の計算に使用）
  const boardRef = useRef(null);
  const [trackW, setTrackW] = useState(900);
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth - LABEL_COL;
      if (w > 0) setTrackW(w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isGate = kind === "gate";
  const isAerial = kind === "aerial";
  // 予約時間設定（1日の予約可能時間）に準拠して時刻の表示範囲を決める
  const timeKey = kind === "lift" ? "lift" : kind === "gate" ? "gate" : "material";
  const dayRange = time?.[timeKey] || { start: DAY_START, end: DAY_END };
  const dayStart = dayRange.start;
  const dayEnd = dayRange.end;
  const HOURS_DYN = makeHours(dayStart, dayEnd);
  // タブに対応する登録一覧（揚重機/ゲート/資機材）→ 予約表示ONのものだけを資源として表示
  const registryForKind = kind === "lift" ? lifts : kind === "gate" ? gates : equipment;
  const shownRegistry = registryForKind.filter((x) => x.show);
  // 資機材・その他はカテゴリで絞り込み可能（複数選択。他タブは対象外）
  const catList = isAerial ? [...new Set(shownRegistry.map((x) => x.category))] : [];
  const filteredRegistry =
    isAerial && cats.length
      ? shownRegistry.filter((x) => cats.includes(x.category))
      : shownRegistry;
  // 資機材・その他は、資機材ごとの「予約方法」（資機材・ゲート登録で設定）に一致するものだけ表示。
  // 表示中の予約方法は下部のトグル（時間制／2部制）で切替える。他タブは全て時間制。
  const methodRegistry = isAerial
    ? filteredRegistry.filter(
        (x) => ((x.reserveType || "2部制") === "2部制") === (aerialView === "2部制")
      )
    : filteredRegistry;
  const resourceItems = methodRegistry.map((x) => x.name);
  const resource = { label: KIND_LABEL[kind], items: resourceItems };
  // 表示中の日付・資源種別の予約のみ
  const visible = rows.filter((r) => r.kind === kind && r.date === date);

  // スポット予約の所要時間候補・予約時刻の選択肢（時間間隔設定に依存）
  const intervalLabel = interval[settingsKeyOf(kind)];
  const spotDurs = spotDurations(intervalLabel);
  const TIME_OPTIONS = makeTimeOptions(intervalMinutes(intervalLabel), dayStart, dayEnd);
  const isSpot = editing?.resvType === "spot";
  // 予約方法（資機材ごとの設定）が「2部制」の資機材・その他は、AM/PMの週間グリッドで予約する
  const twoShift = isAerial && aerialView === "2部制";
  // 機械の行を50件ずつページ表示（縦に長い場合はページ送り）
  const rsvPageCount = Math.max(1, Math.ceil(resourceItems.length / rsvPageSize));
  const rsvSafePage = Math.min(rsvPage, rsvPageCount - 1);
  const pagedItems = resourceItems.slice(
    rsvSafePage * rsvPageSize,
    rsvSafePage * rsvPageSize + rsvPageSize
  );
  // タブ・カテゴリを切り替えたら1ページ目に戻す
  useEffect(() => {
    setRsvPage(0);
  }, [kind, cats, aerialView]);

  // スマホは横スクロールのタイムラインではなく、時刻を縦軸に取った日表示にする。
  // 資源は最大3つまで選んで列として並べ、予約状況を見比べられる。
  const narrow = useIsNarrow();
  const dayColumns = narrow && !twoShift;
  const [compare, setCompare] = useState([]);
  // 表示対象（タブ・カテゴリ・予約方法）が変わったら先頭の資源を選び直す
  useEffect(() => {
    setCompare(resourceItems.slice(0, 1));
    // resourceItems は毎描画で作り直されるため、選択のリセット条件のみを依存に置く
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, cats, aerialView]);
  function toggleCompare(name) {
    setCompare((sel) =>
      sel.includes(name)
        ? sel.filter((x) => x !== name)
        : sel.length >= MAX_COMPARE
        ? sel
        : [...sel, name]
    );
  }
  // 登録から外れた資源が選択に残らないようにする（予約表示OFF・同期解除など）
  const compareShown = compare.filter((name) => resourceItems.includes(name));

  // 予約種別の切替（スポットにしたら所要時間を先頭候補に合わせる）
  function setResvType(t) {
    setEditing((x) => {
      if (t === "spot") {
        return { ...x, resvType: "spot", end: addMinutes(x.start, spotDurs[0], dayEnd) };
      }
      return { ...x, resvType: "normal" };
    });
  }
  // 開始変更（スポットは所要時間を維持して終了を再計算）
  function setStart(v) {
    setEditing((x) => {
      if (x.resvType === "spot") {
        const dur = durationMin(x.start, x.end);
        const use = spotDurs.includes(dur) ? dur : spotDurs[0];
        return { ...x, start: v, end: addMinutes(v, use, dayEnd) };
      }
      return { ...x, start: v };
    });
  }
  function setSpotDur(dur) {
    setEditing((x) => ({ ...x, end: addMinutes(x.start, dur, dayEnd) }));
  }
  // 予約バーのクリック（確定済みの予約は通常・スポットとも編集不可。
  // 確定後に追加したスポット予約は未確定なので編集・削除できる）
  function openBlock(b) {
    // スポット予約は「確定」の概念を持たないため、確定状態でも編集・削除できる
    if (b.confirmed && b.resvType !== "spot") return;
    setEditing({ ...b });
  }

  // カレンダーの空き部分をタップ → その時刻を初期値にして予約作成ダイアログを開く。
  // 必須項目（協力会社名・作業内容ほか）があるため、即時登録ではなくフォームを開く。
  function createAt(resourceName, startHHMM) {
    const base = emptyRsv(kind, date, isConfirmed ? "spot" : "normal", resourceName);
    base.start = startHHMM;
    base.end = addMinutes(startHHMM, base.resvType === "spot" ? spotDurs[0] : 60, dayEnd);
    setEditing(base);
  }
  // 予約を動かせるか。元請は全予定、職長は自分が作成した予定のみ。
  // 確定済みの通常予約は編集不可（スポット予約は確定の概念を持たないため常に可）。
  function canMoveBlock(b) {
    if (guest) return false;
    if (b.confirmed && b.resvType !== "spot") return false;
    if (role === "prime") return true;
    // デモは作成者を識別できないため自社ぶんで代用（本番は作成者ユーザーで判定）
    return b.company === WA_MY_COMPANY;
  }
  // ドラッグ＆ドロップの確定：時刻（と移動先の資源）を書き換える
  function moveBlock(b, next) {
    setRows((rs) => rs.map((r) => (r.id === b.id ? { ...r, ...next } : r)));
  }

  function save() {
    const row = editing;
    // 必須：資源・協力会社名・車種（ゲート）・作業内容
    if (!row.resource) { window.alert(`${resource.label}を選択してください。`); return; }
    if (!row.company || !row.company.trim()) { window.alert("協力会社名を入力してください。"); return; }
    if (row.kind === "gate" && !row.vehicleType) { window.alert("車種を選択してください。"); return; }
    if (!row.content || !row.content.trim()) { window.alert("作業内容を入力してください。"); return; }
    if (row.id) {
      setRows((rs) => rs.map((r) => (r.id === row.id ? row : r)));
    } else {
      const n = seq + 1;
      setSeq(n);
      setRows((rs) => [...rs, { ...row, id: "RSV-" + String(n).padStart(3, "0") }]);
    }
    setEditing(null);
  }
  function remove() {
    setRows((rs) => rs.filter((r) => r.id !== editing.id));
    setEditing(null);
  }

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 1.75 }}>
        予約
      </Typography>

      <Tabs
        value={kind}
        onChange={(_, v) => setKind(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: "1px solid", borderColor: "divider" }}
      >
        {KINDS.map((k) => (
          <Tab key={k} value={k} label={KIND_LABEL[k]} />
        ))}
      </Tabs>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap", my: 2 }}>
        <Typography variant="caption" color="text.secondary">
          {twoShift ? `${resourceItems.length} 台` : `${visible.length} 件`}
        </Typography>
        {!twoShift && canManage && (
          <Button variant="outlined" startIcon={<PrintIcon />} sx={{ ml: "auto" }} onClick={() => setShowPrint(true)}>
            出力
          </Button>
        )}
        {!twoShift && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={canManage ? undefined : { ml: "auto" }}
            onClick={() => {
              const base = emptyRsv(kind, date, isConfirmed ? "spot" : "normal", resourceItems[0] || "");
              if (base.resvType === "spot") base.end = addMinutes(base.start, spotDurs[0], dayEnd);
              setEditing(base);
            }}
            disabled={resourceItems.length === 0}
            title={isConfirmed ? "確定後はスポット予約のみ作成できます" : ""}
          >
            {isConfirmed ? "スポット予約作成" : "予約作成"}
          </Button>
        )}
      </Box>

      {isAerial && (
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center", my: 1.75 }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            {/* 未選択時は「すべて」と出すため、ラベルは常に縮小表示（notched）にする */}
            <InputLabel shrink id="rsv-cat-label">
              カテゴリ
            </InputLabel>
            <Select
              multiple
              labelId="rsv-cat-label"
              input={<OutlinedInput notched label="カテゴリ" />}
              value={cats}
              onChange={(e) => setCats(e.target.value)}
              displayEmpty
              renderValue={() => (cats.length === 0 ? "すべて" : cats.join("、"))}
            >
              {catList.map((c) => (
                <MenuItem key={c} value={c} dense>
                  <Checkbox size="small" checked={cats.includes(c)} sx={{ mr: 0.5 }} />
                  <ListItemText primary={c} slotProps={{ primary: { sx: { fontSize: 13 } } }} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {cats.length > 0 && (
            <Button size="small" onClick={() => setCats([])}>
              クリア（すべて表示）
            </Button>
          )}

          {/* 予約方法の表示切替（右端・2部制→時間制の順） */}
          <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              表示：
            </Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={aerialView}
              onChange={(_, v) => v && setAerialView(v)}
              aria-label="予約方法の表示切替"
            >
              <ToggleButton value="2部制">2部制</ToggleButton>
              <ToggleButton value="時間制">時間制</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
      )}

      {twoShift ? (
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table
            size="small"
            sx={{
              minWidth: 920,
              "& th, & td": { border: "1px solid", borderColor: "divider", textAlign: "center", p: "6px 4px" },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell
                  rowSpan={2}
                  sx={{ textAlign: "left !important", position: "sticky", left: 0, zIndex: 2, minWidth: 170 }}
                >
                  機械名・現場内呼称
                </TableCell>
                {week.map((d, i) => (
                  <TableCell
                    key={i}
                    colSpan={2}
                    sx={{ color: d.getDay() === 0 || d.getDay() === 6 ? "error.main" : undefined }}
                  >
                    {dayLabel(d)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                {week.flatMap((d, i) => [
                  <TableCell key={i + "a"} sx={{ fontSize: 11, width: 40 }}>
                    AM
                  </TableCell>,
                  <TableCell key={i + "p"} sx={{ fontSize: 11, width: 40 }}>
                    PM
                  </TableCell>,
                ])}
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedItems.map((res) => (
                <TableRow key={res}>
                  <TableCell
                    sx={{
                      textAlign: "left !important",
                      whiteSpace: "nowrap",
                      bgcolor: "action.hover",
                      position: "sticky",
                      left: 0,
                      zIndex: 1,
                      fontWeight: 600,
                    }}
                  >
                    {res}
                  </TableCell>
                  {week.flatMap((d, i) =>
                    ["am", "pm"].map((p) => {
                      const val = slots[`${res}|${dayKey(d)}|${p}`];
                      const mine = val && val.self;
                      const disabled = slotDisabled(i, p);
                      return (
                        <TableCell key={`${i}-${p}`} sx={{ p: "4px !important" }}>
                          {val && !mine ? (
                            <Box component="span" sx={SLOT_OTHER} title={`${val.company} 予約済`}>
                              {val.company}
                            </Box>
                          ) : mine ? (
                            <Box
                              component="button"
                              type="button"
                              sx={{ ...SLOT_SELF, cursor: "pointer" }}
                              onClick={() => setSlotDialog({ res, d, p })}
                              title="自分の予約（クリックで詳細・取消）"
                              aria-label="自分の予約"
                            />
                          ) : disabled ? (
                            <Box component="span" sx={SLOT_DISABLED} title="当日のため予約できません" />
                          ) : (
                            <Box
                              component="button"
                              type="button"
                              sx={{
                                ...SLOT_BASE,
                                cursor: "pointer",
                                "&:hover": { borderColor: "primary.main", bgcolor: "primary.light" },
                              }}
                              onClick={() => onEmptySlot(res, d, p)}
                              title="空き（クリックで予約）"
                              aria-label="空き枠"
                            />
                          )}
                        </TableCell>
                      );
                    })
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : dayColumns ? (
        <RsvDayColumns
          items={resourceItems}
          selected={compareShown}
          onToggle={toggleCompare}
          blocksOf={(name) => visible.filter((r) => r.resource === name)}
          dayStart={dayStart}
          dayEnd={dayEnd}
          isGate={isGate}
          onOpen={openBlock}
          onClear={() => setCompare([])}
          onCreate={createAt}
          onMove={moveBlock}
          canMove={canMoveBlock}
          stepMin={intervalMinutes(intervalLabel)}
          label={resource.label}
        />
      ) : (
      // 予約タイムラインは px 単位でバー・ラベルを配置するため既存CSSのまま
      <Box sx={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
      <div className="rsv-board" ref={boardRef}>
        <div className="rsv-corner">{resource.label}＼時刻</div>
        <div className="rsv-hours" style={{ gridTemplateColumns: `repeat(${HOURS_DYN.length}, 1fr)` }}>
          {HOURS_DYN.map((h) => (
            <div key={h} className="rsv-hour" title={h >= 24 ? `翌${h - 24}時` : undefined}>
              {h}:00
              {h >= 24 && <small className="rsv-hour-next">翌{h - 24}</small>}
            </div>
          ))}
        </div>
        {pagedItems.map((item) => {
          const blocks = visible.filter((r) => r.resource === item);
          const { height, rowH, barH, placed } = layoutLabeled(blocks, trackW, isGate, dayStart, dayEnd);
          // 通常予約が重複している時間帯（薄い赤の背景）
          const bands = overlapBands(blocks);
          return (
            <div className="rsv-head" key={item}>
              {/* 資源名は自然な高さ（長い名称は折り返し）。行の高さは名称と予約分の大きい方 */}
              <div className="rsv-reslabel">{item}</div>
              <div className="rsv-track" style={{ minHeight: height }}>
                {bands.map(([s, e], i) => (
                  <div
                    key={"ov" + i}
                    className="rsv-overlap"
                    style={{ left: pctHour(s, dayStart, dayEnd) + "%", width: pctHour(e, dayStart, dayEnd) - pctHour(s, dayStart, dayEnd) + "%" }}
                    title="通常予約が重複しています"
                  />
                ))}
                {placed.map((b) => {
                  const spot = b.resvType === "spot";
                  const barTop = b.row * rowH + (rowH - barH) / 2;
                  const title =
                    `${spot ? "[スポット] " : ""}${b.company}｜${b.start}〜${b.end}` +
                    (isGate && b.vehicleType ? `｜${b.vehicleType}` : "") +
                    (b.content ? `｜${b.content}` : "");
                  // ラベルはバー左端から表示（右流し）／右端では左流し
                  const labelStyle =
                    b.side === "right"
                      ? { left: b.barLeft + INSET, top: b.row * rowH, height: rowH }
                      : { right: trackW - b.barRight + INSET, top: b.row * rowH, height: rowH };
                  // 確定済みの「通常予約」のみグレーアウト（編集不可）。
                  // スポット予約は確定の概念を持たないため常に編集可＝グレーアウトしない。
                  const grayed = b.confirmed && b.resvType !== "spot" ? " confirmed" : "";
                  return (
                    <Fragment key={b.id}>
                      {/* 予約バー（色のみ・テキストは重ねて表示） */}
                      <div
                        className={"rsv-bar" + (spot ? " spot" : "") + grayed}
                        style={{ left: b.barLeft, width: b.barW, top: barTop, height: barH }}
                        onClick={() => openBlock(b)}
                        title={title}
                      />
                      {/* ラベル。ゲートは車種を2行目に改行 */}
                      <div
                        className={"rsv-tlabel " + b.side + (spot ? " spot" : "") + grayed}
                        style={labelStyle}
                        onClick={() => openBlock(b)}
                        title={title}
                      >
                        <span className="tl-line">
                          <b className="tl-co">{b.company}</b>
                          {b.content && <span className="tl-cont">{b.content}</span>}
                          <span className="tl-time">
                            {b.start}〜{b.end}
                          </span>
                        </span>
                        {isGate && b.vehicleType && (
                          <span className="rsv-veh">{b.vehicleType}</span>
                        )}
                      </div>
                    </Fragment>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      </Box>
      )}

      {/* スマホの日表示は資源を選んで表示するため、行のページ送りは不要 */}
      {!dayColumns && (
        <TablePagination
          total={resourceItems.length}
          page={rsvSafePage}
          pageSize={rsvPageSize}
          onPage={setRsvPage}
          onPageSize={(n) => { setRsvPageSize(n); setRsvPage(0); }}
        />
      )}

      {/* 確定（日付単位・全タブ共通）。その日の予約（通常・スポット）をまとめて確定（元請ビューのみ）。2部制は対象外 */}
      {!twoShift && canManage && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.75, mt: 2, flexWrap: "wrap" }}>
          {isConfirmed ? (
            <>
              <Chip size="small" color="success" label="確定済" />
              <Button
                variant="outlined"
                onClick={() => {
                  setConfirmedDays((d) => ({ ...d, [date]: false }));
                  setRows((rs) =>
                    rs.map((r) => (r.date === date ? { ...r, confirmed: false } : r))
                  );
                }}
              >
                確定解除
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              size="large"
              onClick={() => {
                setConfirmedDays((d) => ({ ...d, [date]: true }));
                setRows((rs) =>
                  rs.map((r) => (r.date === date ? { ...r, confirmed: true } : r))
                );
              }}
            >
              確定
            </Button>
          )}
        </Box>
      )}

      {twoShift ? (
        <>
          <Box sx={{ display: "flex", gap: 2.25, mt: 1.25, flexWrap: "wrap", fontSize: 12.5, color: "text.secondary" }}>
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
              <Box component="span" sx={{ ...SLOT_BASE, width: 18, height: 18 }} />
              空き
            </Box>
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
              <Box component="span" sx={{ ...SLOT_SELF, width: 18, height: 18 }} />
              自分の予約
            </Box>
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
              <Box component="span" sx={SLOT_OTHER}>
                他社
              </Box>
              他社予約（不可）
            </Box>
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
              <Box component="span" sx={{ ...SLOT_DISABLED, width: 18, height: 18 }} />
              予約不可（当日）
            </Box>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, lineHeight: 1.7 }}>
            ※ <strong>2部制</strong>表示（予約方法＝2部制の資機材。予約方法は<strong>資機材・ゲート登録</strong>で資機材ごとに設定）。各機械について<strong>今日から7日間（固定・日付送りの影響なし）</strong>の午前（AM）／午後（PM）枠を選択して予約します。
            {guest ? (
              <>予約時に<strong>会社名・予約者名</strong>を入力します（アカウントなし）。</>
            ) : (
              <>予約者の会社名はログインアカウントから自動反映されます（デモ：{MY_COMPANY}／{MY_USER}）。</>
            )}
            <br />
            ※ 空き枠をクリックで予約（青）。自分の予約をクリックすると<strong>予約者・会社名の詳細と取消</strong>ができます（取消は予約者・元請のみ）。<strong>他社が予約済みの枠は選択できません（重複予約不可）</strong>。
            <br />
            ※ <strong>当日はAM予約不可</strong>、<strong>当日12時以降はPM予約不可</strong>です。
          </Typography>
        </>
      ) : (
        <>
          <Box sx={{ display: "flex", gap: 2.25, mt: 1.25, flexWrap: "wrap", fontSize: 12.5, color: "text.secondary" }}>
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
              <Box
                component="span"
                sx={{ width: 22, height: 12, borderRadius: 0.75, border: "1px solid", borderColor: "primary.main", bgcolor: "primary.light" }}
              />
              通常予約
            </Box>
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
              <Box
                component="span"
                sx={{ width: 22, height: 12, borderRadius: 0.75, border: "1px solid", borderColor: "warning.main", bgcolor: "#fdf6e3" }}
              />
              スポット予約（15〜60分）
            </Box>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, lineHeight: 1.7 }}>
            ※ デモでは枠をクリックして編集・削除できます（実運用ではドラッグで新規作成）。予約時間の間隔は<strong>「予約時間間隔設定」の設定</strong>に従います（現在：{intervalLabel}）。
            <br />
            ※ 確定は<strong>すべてのタブ（揚重機／ゲート／資機材・その他）共通（日付単位）</strong>です。確定すると<strong>通常予約がグレーアウト（編集不可）</strong>になります。確定後は<strong>通常予約は作成できず、スポット予約のみ追加</strong>できます。<strong>スポット予約は「確定」の概念を持たず、確定状態でも常に編集・削除できます</strong>（削除は表示OFF＝記録は保持）。
          </Typography>
        </>
      )}

      {editing && (
        <Modal
          title={editing.id ? "予約の編集" : "予約作成"}
          onClose={() => setEditing(null)}
          footer={
            <>
              {editing.id && (
                <Button variant="outlined" color="error" onClick={remove}>
                  削除
                </Button>
              )}
              <Button variant="outlined" sx={{ ml: "auto" }} onClick={() => setEditing(null)}>
                キャンセル
              </Button>
              <Button variant="contained" onClick={save}>
                保存
              </Button>
            </>
          }
        >
          {/* この予約がどの作業予定に使われるか（作業予定側からの紐づけの逆引き） */}
          {editing.id && <LinkedSchedule schedules={schedules} rsvId={editing.id} />}
          <FormGrid>
            <FormControl sx={{ gridColumn: "1 / -1" }}>
              <FormLabel sx={{ fontSize: 12.5, mb: 0.25 }}>予約種別</FormLabel>
              <RadioGroup
                row
                value={editing.resvType}
                onChange={(e) => setResvType(e.target.value)}
              >
                {/* 確定後はスポット予約しか作れないため、通常予約は選べなくする */}
                <FormControlLabel
                  value="normal"
                  control={<Radio size="small" />}
                  label="通常予約"
                  disabled={isConfirmed}
                />
                <FormControlLabel
                  value="spot"
                  control={<Radio size="small" />}
                  label="スポット予約"
                />
              </RadioGroup>
              {isConfirmed && (
                <Typography variant="caption" color="text.secondary">
                  確定後はスポット予約のみ
                </Typography>
              )}
            </FormControl>
            <SelectField
              label={resource.label + "選択"}
              required
              value={editing.resource}
              onChange={(v) => setEditing((x) => ({ ...x, resource: v }))}
              options={resource.items}
            />
            <SuggestField
              label="協力会社名"
              required
              value={editing.company}
              onChange={(v) => setEditing((x) => ({ ...x, company: v }))}
              options={companyOptions}
            />
            {isGate && (
              <SelectField
                label="車種"
                required
                value={editing.vehicleType}
                onChange={(v) => setEditing((x) => ({ ...x, vehicleType: v }))}
                options={WA_VEHICLE_TYPES}
              />
            )}
            <ReadonlyField label="日付" value={formatDateStr(editing.date)} />
            <SelectField
              label="開始"
              value={editing.start}
              onChange={setStart}
              options={TIME_OPTIONS}
            />
            {isSpot ? (
              <SelectField
                label="所要時間"
                value={durationMin(editing.start, editing.end)}
                onChange={(v) => setSpotDur(Number(v))}
                options={spotDurs.map((d) => ({ value: d, label: d + "分" }))}
                hint={`スポットは ${intervalLabel} 間隔で15〜60分（終了 ${editing.end}）`}
              />
            ) : (
              <SelectField
                label="終了"
                value={editing.end}
                onChange={(v) => setEditing((x) => ({ ...x, end: v }))}
                options={TIME_OPTIONS}
              />
            )}
            <SuggestField
              full
              label="作業内容"
              required
              value={editing.content}
              onChange={(v) => setEditing((x) => ({ ...x, content: v }))}
              options={["生コン搬入", "資材搬入", "鉄骨揚重", "設備機器揚重", "高所作業"]}
              maxLength={CONTENT_MAX}
              hint={`最大 ${CONTENT_MAX} 文字（必須）`}
            />
            {!isGate && (
              <SuggestField
                full
                label="作業場所"
                value={editing.workPlace || ""}
                onChange={(v) => setEditing((x) => ({ ...x, workPlace: v }))}
                options={["外観整備", "塔屋1階", "北エリア", "南エリア", "1F", "2F", "東ゲート前"]}
                hint="任意"
              />
            )}
            <TextField
              multiline
              minRows={2}
              size="small"
              label="備考"
              value={editing.remark || ""}
              onChange={(e) => setEditing((x) => ({ ...x, remark: e.target.value }))}
              placeholder="備考（任意・25文字まで）"
              slotProps={{ htmlInput: { maxLength: REMARK_MAX } }}
              sx={{ gridColumn: "1 / -1" }}
            />
          </FormGrid>
        </Modal>
      )}

      {/* 2部制：自分の予約の詳細・取消ダイアログ */}
      {slotDialog && (() => {
        const sv = slots[`${slotDialog.res}|${dayKey(slotDialog.d)}|${slotDialog.p}`] || {};
        return (
          <Modal
            title="2部制予約の詳細"
            onClose={() => setSlotDialog(null)}
            footer={
              <>
                <Button variant="outlined" color="error" onClick={cancelSlot}>
                  取消
                </Button>
                <Button variant="outlined" sx={{ ml: "auto" }} onClick={() => setSlotDialog(null)}>
                  キャンセル
                </Button>
              </>
            }
          >
            <FormGrid>
              <ReadonlyField label="機械・現場内呼称" value={slotDialog.res} />
              <ReadonlyField label="日付" value={dayLabel(slotDialog.d)} />
              <ReadonlyField label="区分" value={slotDialog.p === "am" ? "午前（AM）" : "午後（PM）"} />
              <ReadonlyField label="予約者" value={sv.user} />
              <ReadonlyField label="会社名" value={sv.company} />
            </FormGrid>
          </Modal>
        );
      })()}

      {/* 2部制：アカウントなし予約の入力ダイアログ（予約者名・会社名） */}
      {bookForm && (
        <Modal
          title="予約者情報の入力"
          onClose={() => setBookForm(null)}
          footer={
            <>
              <Button variant="outlined" sx={{ ml: "auto" }} onClick={() => setBookForm(null)}>
                キャンセル
              </Button>
              <Button variant="contained" onClick={submitBook}>
                予約する
              </Button>
            </>
          }
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {bookForm.res}／{dayLabel(bookForm.d)}／{bookForm.p === "am" ? "午前（AM）" : "午後（PM）"} を予約します。
          </Typography>
          <FormGrid>
            <SuggestField
              label="会社名"
              required
              value={bookForm.company}
              onChange={(v) => setBookForm((x) => ({ ...x, company: v }))}
              options={companyOptions}
            />
            <TextField
              size="small"
              required
              label="予約者名"
              value={bookForm.name}
              onChange={(e) => setBookForm((x) => ({ ...x, name: e.target.value }))}
              placeholder="予約者名を入力"
            />
          </FormGrid>
        </Modal>
      )}

      {/* 出力プレビュー（現在のタブ＝資源種別ごと） */}
      {showPrint && (
        <PrintPreview
          title={`予約表（${resource.label}） － 出力プレビュー`}
          onClose={() => setShowPrint(false)}
        >
          <ReservationPrint
            date={date}
            label={resource.label}
            isGate={isGate}
            items={resource.items}
            reservations={visible}
            dayStart={dayStart}
            dayEnd={dayEnd}
          />
        </PrintPreview>
      )}
    </Box>
  );
}
