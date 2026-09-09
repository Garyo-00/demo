import { useState, useRef } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  InputAdornment,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PrintIcon from "@mui/icons-material/PrintOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  WA_COMPANIES,
  WA_INDUSTRIES,
  WA_JOBTYPES_BY_INDUSTRY,
  WA_FOREMEN,
  defaultForeman,
  WA_HISTORY,
  WA_VEHICLE_TYPES,
  WA_STATUS_LABEL,
  WA_STATUS_PILL,
  WA_PRIME_USERS,
  currentUserName,
  WA_MY_COMPANY,
  WA_DNN_ATTENDANCE,
  hasDnnAttendance,
  formatDateStr,
} from "../data.js";
import Modal from "../components/wa/Modal.jsx";
import PrintPreview from "../components/wa/PrintPreview.jsx";
import SchedulePrint from "../components/wa/SchedulePrint.jsx";
import {
  useWaSettings,
  settingsKeyOf,
  intervalMinutes,
} from "../components/wa/WaSettingsContext.jsx";
import TablePagination from "../components/wa/TablePagination.jsx";
import ResourcePicker from "../components/wa/ResourcePicker.jsx";
import { useIsNarrow } from "../components/wa/useIsNarrow.js";
import {
  RSV_KIND_LABEL,
  resourceOptions,
  linkState,
  rsvTimeLabel,
  defaultTimes,
  claimsOf,
  scheduleLabel,
} from "../components/wa/scheduleLinks.js";
import { makeTimeOptions } from "../components/wa/rsvTimeline.js";
import {
  SuggestField,
  SelectField,
  TextAreaField,
  DateField,
  FormGrid,
} from "../components/wa/Field.jsx";

// コピー作成の候補として表示する件数（元請は協力会社ごと／職長は自分ぶんの通算）
const COPY_RECENT_LIMIT = 5;
// ステータスのpillクラス → Chipの色
const STATUS_COLOR = { approved: "success", pending: "warning", idle: "default" };
// 「直近」の並び：日付の新しい順、同日はID（登録順）の新しい順
function byRecent(a, b) {
  return b.date.localeCompare(a.date) || b.id.localeCompare(a.id);
}

// 実績入力ダイアログ用：ドラフトを会社ごとにまとめる（元の並び順・indexは保持）。
// 同一会社に複数作業があっても1つの会社グループにまとめて表示するため。
function groupDraftByCompany(draft) {
  const order = [];
  const map = new Map();
  draft.forEach((item, index) => {
    if (!map.has(item.company)) {
      map.set(item.company, []);
      order.push(item.company);
    }
    map.get(item.company).push({ item, index });
  });
  return order.map((company) => {
    const items = map.get(company);
    const plannedTotal = items.reduce((s, { item }) => s + (item.planned || 0), 0);
    // 入場人数：DNN連携がある会社のみ表示（無ければ非表示）
    const hasAttendance = hasDnnAttendance(company);
    const attendance = hasAttendance ? WA_DNN_ATTENDANCE[company] : null;
    return { company, items, plannedTotal, hasAttendance, attendance };
  });
}

// 作業ブロック（棟・階・エリア・工区・作業内容・作業人数・工数）
function emptyBlock() {
  return {
    building: "", floor: "", area: "", zone: "", content: "",
    normalWorkers: 1, normalHours: 8, overtimeWorkers: 0, overtimeHours: 0,
    safetyNote: "",
    // 使用する資機材・ゲート [{kind, name, rsvId}]
    resources: [],
  };
}
// 新規作成フォーム（共通項目＋作業ブロックを複数）
function emptyForm(date) {
  return {
    id: "",
    date,
    company: "",
    industry: "",
    jobType: "",
    foreman: "",
    blocks: [emptyBlock()],
  };
}
// 既存レコード → 編集フォーム（ブロック1つ）
function toForm(r) {
  return {
    id: r.id,
    date: r.date,
    company: r.company,
    industry: r.industry,
    jobType: r.jobType,
    foreman: r.foreman,
    blocks: [
      {
        building: r.building, floor: r.floor, area: r.area, zone: r.zone, content: r.content,
        normalWorkers: r.normalWorkers, normalHours: r.normalHours,
        overtimeWorkers: r.overtimeWorkers, overtimeHours: r.overtimeHours,
        safetyNote: r.safetyNote || "",
        resources: r.resources || [],
      },
    ],
  };
}

// 一覧に出す「使用する資機材・ゲート」のチップ。予約と紐づいていれば青、無ければ橙。
function ResourceChips({ row, reservations, claims }) {
  const list = row.resources || [];
  if (list.length === 0) return null;
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
      {list.map((res) => {
        const { reservation, state, dateMismatch } = linkState(
          reservations,
          { date: row.date, company: row.company, claims, selfId: row.id },
          res
        );
        const linked = state === "linked" && !dateMismatch;
        return (
          <Chip
            key={res.kind + "|" + res.name}
            size="small"
            variant="outlined"
            color={linked ? "primary" : "warning"}
            label={res.name}
            title={
              `${RSV_KIND_LABEL[res.kind]}：${res.name}｜` +
              (state === "linked"
                ? `予約 ${rsvTimeLabel(reservation)} に紐づけ` +
                  (dateMismatch ? `（予約日 ${reservation.date}）` : "")
                : state === "claimed"
                ? "他の作業予定に紐づけ済み"
                : "予約なし")
            }
          />
        );
      })}
    </Box>
  );
}

// コピー作成 手順2：複製する予定ごとに、紐づける資機材・ゲートを選ぶ。
// 複製元が資機材を使っていない予定も一覧に出し、この場で追加できるようにする。
function CopyResourceSelectStep({ picked, picks, options, onChange }) {
  const total = Object.values(picks).reduce((n, l) => n + l.length, 0);
  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        複製する <b>{picked.length} 件</b>の予定に紐づける資機材・ゲートを選びます
        （初期値は複製元の選択。<b>{total} 件</b>選択中）。使わない場合は空のままで構いません。
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
        {picked.map((r) => {
          const list = picks[r.id] || [];
          const place = [r.building, r.floor, r.area, r.zone].filter(Boolean).join(" / ");
          return (
            <Box
              key={r.id}
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1.1fr" },
                gap: 1.5,
                alignItems: "center",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                px: 1.75,
                py: 1.25,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                  {r.company}／{r.content || "（作業内容なし）"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {[r.jobType, place].filter(Boolean).join("／")}
                </Typography>
              </Box>
              <FormControl size="small" fullWidth>
                <InputLabel>使用する資機材・ゲート</InputLabel>
                <Select
                  multiple
                  label="使用する資機材・ゲート"
                  value={list.map((x) => x.kind + "|" + x.name)}
                  onChange={(e) =>
                    onChange(
                      r.id,
                      e.target.value.map((v) => {
                        const [kind, name] = v.split("|");
                        return { kind, name };
                      })
                    )
                  }
                  renderValue={(sel) =>
                    sel.length === 0 ? (
                      "使用しない"
                    ) : (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {sel.map((v) => (
                          <Chip key={v} size="small" label={v.split("|")[1]} />
                        ))}
                      </Box>
                    )
                  }
                >
                  {options.map((o) => (
                    <MenuItem key={o.kind + "|" + o.name} value={o.kind + "|" + o.name}>
                      <Checkbox
                        size="small"
                        checked={list.some((x) => x.kind === o.kind && x.name === o.name)}
                      />
                      <ListItemText primary={o.name} secondary={RSV_KIND_LABEL[o.kind]} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// コピー作成 手順3：紐づけた資機材ごとに予約を作る。
// 予約日は複製先の作業日で固定。時間・車種は複製元の予約を引き継ぎ、無ければ空欄。
function CopyReserveStep({ plan, date, onToggleAll, onChangeRow, timeOptionsFor }) {
  const editable = plan.filter((x) => !x.linked);
  const allOn = editable.length > 0 && editable.every((x) => x.create);
  const createCount = editable.filter((x) => x.create).length;

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        紐づける資機材・ゲートは <b>{plan.length} 件</b>です。予約日は作業予定と同じ
        <b>{formatDateStr(date)}</b>。<b>{formatDateStr(date)}</b> にすでに予約があるものは自動で紐づきます。
        予約を作らない場合はチェックを外してください（{createCount} / {editable.length} 件を作成）。
      </Typography>

      {editable.length > 0 && (
        <FormControlLabel
          sx={{ mb: 1.5 }}
          control={<Checkbox size="small" checked={allOn} onChange={(e) => onToggleAll(e.target.checked)} />}
          label="予約をまとめて作成する"
        />
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
        {plan.map((row) => {
          const opts = timeOptionsFor(row.res.kind);
          const isGate = row.res.kind === "gate";
          return (
            <Box
              key={row.key}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                px: 1.75,
                py: 1.25,
                bgcolor: row.linked ? "action.hover" : "background.paper",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: row.linked ? 0 : 1.25 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{row.res.name}</Typography>
                <Chip size="small" variant="outlined" label={RSV_KIND_LABEL[row.res.kind]} />
                <Typography variant="caption" color="text.secondary">
                  {row.label || "（作業内容なし）"}
                </Typography>
                {row.linked ? (
                  <Chip
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ ml: "auto" }}
                    label={`予約あり ${rsvTimeLabel(row.linked)} に紐づけ`}
                  />
                ) : (
                  <FormControlLabel
                    sx={{ ml: "auto", mr: 0 }}
                    control={
                      <Checkbox
                        size="small"
                        checked={row.create}
                        onChange={(e) => onChangeRow(row.key, { create: e.target.checked })}
                      />
                    }
                    label={<Typography sx={{ fontSize: 12.5 }}>予約を作成する</Typography>}
                  />
                )}
              </Box>

              {!row.linked && (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: isGate ? "1fr 1.4fr auto auto auto" : "1fr 1.4fr auto auto" },
                    gap: 1.25,
                    alignItems: "start",
                    opacity: row.create ? 1 : 0.5,
                  }}
                >
                  <TextField
                    size="small"
                    label="協力会社名"
                    disabled={!row.create}
                    value={row.company}
                    onChange={(e) => onChangeRow(row.key, { company: e.target.value })}
                  />
                  <TextField
                    size="small"
                    label="作業内容"
                    disabled={!row.create}
                    value={row.content}
                    onChange={(e) => onChangeRow(row.key, { content: e.target.value })}
                    slotProps={{ htmlInput: { maxLength: 25 } }}
                  />
                  <TextField
                    select
                    size="small"
                    label="開始"
                    disabled={!row.create}
                    value={row.start}
                    onChange={(e) => onChangeRow(row.key, { start: e.target.value })}
                    sx={{ minWidth: 104 }}
                  >
                    <MenuItem value="">未設定</MenuItem>
                    {opts.map((t) => (
                      <MenuItem key={t} value={t}>{t}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    size="small"
                    label="終了"
                    disabled={!row.create}
                    value={row.end}
                    onChange={(e) => onChangeRow(row.key, { end: e.target.value })}
                    sx={{ minWidth: 104 }}
                  >
                    <MenuItem value="">未設定</MenuItem>
                    {opts.map((t) => (
                      <MenuItem key={t} value={t}>{t}</MenuItem>
                    ))}
                  </TextField>
                  {isGate && (
                    <TextField
                      select
                      size="small"
                      label="車種"
                      disabled={!row.create}
                      value={row.vehicleType}
                      onChange={(e) => onChangeRow(row.key, { vehicleType: e.target.value })}
                      sx={{ minWidth: 120 }}
                    >
                      <MenuItem value="">未選択</MenuItem>
                      {WA_VEHICLE_TYPES.map((v) => (
                        <MenuItem key={v} value={v}>{v}</MenuItem>
                      ))}
                    </TextField>
                  )}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// 各パターンの作業人数の選択肢（0〜30名）
const WORKER_OPTS = Array.from({ length: 31 }, (_, i) => i);
// 予定の作業人数（通常作業のみをカウント／テーブル表示用）
function totalWorkers(r) {
  return Number(r.normalWorkers) || 0;
}
// 実績の作業人数（通常作業のみ。未入力なら null）
function actualTotal(r) {
  if (r.actualNormalWorkers == null) return null;
  return Number(r.actualNormalWorkers) || 0;
}

// 1人あたりの標準作業時間。作業人数から工数を自動計算するのに使う
const HOURS_PER_WORKER = 8;

// 作業人数・工数の1パターン分の行。plannedWorkers を渡すと
// 作業人数（実績）の左に「作業人数（予定）」を表示する（実績入力用）。
// autoHours=true の行は、作業人数を変えると工数に「人数 × 8h」を自動で入れる。
function PatternRow({ obj, setObj, label, wKey, hKey, plannedWorkers, autoHours }) {
  const hasPlanned = plannedWorkers != null;
  function setWorkers(n) {
    setObj((x) => (autoHours ? { ...x, [wKey]: n, [hKey]: n * HOURS_PER_WORKER } : { ...x, [wKey]: n }));
  }
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: hasPlanned
          ? { xs: "repeat(3, 1fr)", sm: "120px minmax(96px, 0.7fr) 1fr 1fr" }
          : { xs: "1fr", sm: "120px 1fr 1fr" },
        gap: 1.25,
        alignItems: "center",
      }}
    >
      <Typography
        sx={{ fontSize: 13, fontWeight: 600, gridColumn: { xs: "1 / -1", sm: "auto" } }}
      >
        {label}
      </Typography>
      {hasPlanned && (
        <TextField
          size="small"
          label="人数（予定）"
          value={plannedWorkers}
          slotProps={{ input: { readOnly: true }, inputLabel: { shrink: true } }}
          sx={{ "& .MuiOutlinedInput-root": { bgcolor: "action.hover" } }}
        />
      )}
      <TextField
        select
        size="small"
        label={hasPlanned ? "人数（実績）" : "作業人数"}
        value={obj[wKey] ?? 0}
        onChange={(e) => setWorkers(Number(e.target.value))}
      >
        {WORKER_OPTS.map((n) => (
          <MenuItem key={n} value={n}>
            {n}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        size="small"
        type="number"
        label="工数"
        value={obj[hKey] ?? 0}
        onChange={(e) => setObj((x) => ({ ...x, [hKey]: Number(e.target.value) }))}
        slotProps={{
          htmlInput: { min: 0, step: 0.5 },
          input: { endAdornment: <InputAdornment position="end">h</InputAdornment> },
        }}
      />
    </Box>
  );
}

// 一覧のカラム定義（すべてソート可能）。幅は固定レイアウトで配分する
// （見出しが長いため auto だと列が右へはみ出して操作列が見えなくなる）
const COLUMNS = [
  ["status", "ステータス", 96],
  ["company", "協力会社名", 100],
  ["industry", "業種", 88],
  ["jobType", "職種", 96],
  ["location", "作業場所（棟/階/エリア/工区）", 140],
  ["content", "作業内容", "auto"],
  ["planned", "作業人数（予定）", 72],
  ["actual", "作業人数（実績）", 72],
  ["safety", "安全指示事項", 132],
];

export default function WorkAdjustSchedule() {
  // 共通の作業日／閲覧ロールに加え、資機材・ゲート登録と予約（紐づけ用）を参照する
  const {
    date, role, gates, lifts, equipment,
    reservations, setReservations, interval, time,
    schedules: rows, setSchedules: setRows,
    primeNotes, setPrimeNote,
  } = useWaSettings();
  const [editing, setEditing] = useState(null); // 作成/編集中の行
  const [confirmDraft, setConfirmDraft] = useState(null); // 確定ダイアログ（全未確定の下書き）
  const [actualDraft, setActualDraft] = useState(null); // 実績入力ダイアログ（全確定の下書き）
  const [seq, setSeq] = useState(1000);
  const [showPrint, setShowPrint] = useState(false);
  const [copyMode, setCopyMode] = useState(null); // "prime" | "foreman" | null
  const [copySel, setCopySel] = useState(() => new Set()); // 複製元として選択したID
  // 手順1（複製元選択）→ 手順2（資機材の選択）→ 手順3（予約の作成）
  const [copyStep, setCopyStep] = useState("pick");
  const [copyPicks, setCopyPicks] = useState({}); // 手順2：予定ID → 紐づける資機材
  const [copyPlan, setCopyPlan] = useState([]); // 手順3：予定×資機材ごとの予約入力
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState(""); // 協力会社名での検索
  const [sortKey, setSortKey] = useState("industry"); // 初期は業種ソート
  const [sortDir, setSortDir] = useState("asc");
  const narrow = useIsNarrow();
  // 作業予定から作る予約のID採番（既存の RSV-xxx と衝突しない位置から開始）
  const rsvSeq = useRef(900);

  // 列ごとの比較（全カラムでソート可能）
  function cmpBy(a, b, key) {
    switch (key) {
      case "status": return a.status.localeCompare(b.status);
      case "company": return a.company.localeCompare(b.company, "ja");
      case "industry": return a.industry.localeCompare(b.industry, "ja");
      case "jobType": return a.jobType.localeCompare(b.jobType, "ja");
      case "location": return (a.building || "").localeCompare(b.building || "", "ja");
      case "content": return (a.content || "").localeCompare(b.content || "", "ja");
      case "planned": return totalWorkers(a) - totalWorkers(b);
      case "actual": return (actualTotal(a) ?? -1) - (actualTotal(b) ?? -1);
      case "safety": return (a.safetyNote || "").localeCompare(b.safetyNote || "", "ja");
      default: return 0;
    }
  }
  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(0);
  }

  // 表示中の日付の作業予定（確定・実績・出力はこの全件が対象）
  const dateRows = rows.filter((r) => r.date === date);
  // 一覧表示用：協力会社名で検索し、指定カラムでソート
  const dayRows = dateRows
    .filter((r) => !search.trim() || r.company.includes(search.trim()))
    .slice()
    .sort((a, b) => {
      const c = cmpBy(a, b, sortKey);
      return sortDir === "asc" ? c : -c;
    });

  // ページネーション（表示行のみ切り出し）
  const pageCount = Math.max(1, Math.ceil(dayRows.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = dayRows.slice(safePage * pageSize, safePage * pageSize + pageSize);

  // 確定状態の集計（確定・実績・出力は当日の全作業が対象）
  const pendingRows = dateRows.filter((r) => r.status !== "approved");
  const approvedRows = dateRows.filter((r) => r.status === "approved");
  const hasPending = pendingRows.length > 0;
  const allConfirmed = dateRows.length > 0 && !hasPending;

  function openCreate() {
    setEditing(emptyForm(date));
  }
  function openEdit(row) {
    if (row.status === "approved") return; // 確定中は編集不可（要・確定解除）
    setEditing(toForm(row));
  }
  function remove(row) {
    if (row.status === "approved") return; // 確定中は削除不可
    if (window.confirm(`作業予定「${row.content || row.id}」を削除しますか？`)) {
      setRows((rs) => rs.filter((r) => r.id !== row.id));
    }
  }

  function save() {
    const f = editing;
    // 必須：協力会社名・業種・職種・職長名
    if (!f.company || !f.company.trim()) {
      window.alert("協力会社名を入力してください。");
      return;
    }
    if (!f.industry) {
      window.alert("業種を選択してください。");
      return;
    }
    if (!f.jobType) {
      window.alert("職種を選択してください。");
      return;
    }
    if (!f.foreman) {
      window.alert("職長を選択してください。");
      return;
    }
    // 作業内容は必須。新規は作業ブロックが複数あるため、何件目かを示して知らせる
    const blank = f.blocks.findIndex((b) => !b.content || !b.content.trim());
    if (blank !== -1) {
      window.alert(
        f.blocks.length > 1
          ? `作業 ${blank + 1} の作業内容を入力してください。`
          : "作業内容を入力してください。"
      );
      return;
    }
    if (f.id) {
      // 編集：既存レコードを更新（ステータス・安全指示・実績は保持）
      const b = f.blocks[0];
      setRows((rs) =>
        rs.map((r) =>
          r.id === f.id
            ? {
                ...r,
                date: f.date, company: f.company, industry: f.industry,
                jobType: f.jobType, foreman: f.foreman,
                building: b.building, floor: b.floor, area: b.area, zone: b.zone, content: b.content,
                normalWorkers: b.normalWorkers, normalHours: b.normalHours,
                overtimeWorkers: b.overtimeWorkers, overtimeHours: b.overtimeHours,
                safetyNote: b.safetyNote || "",
                resources: fixLinks(b.resources, {
                  date: f.date, company: f.company, selfId: f.id,
                }),
              }
            : r
        )
      );
    } else {
      // 新規：作業ブロックごとにレコードを作成
      let n = seq;
      const newRows = f.blocks.map((b) => {
        n += 1;
        return {
          id: "W-" + String(n).padStart(3, "0"),
          date: f.date, status: "pending",
          company: f.company, industry: f.industry, jobType: f.jobType, foreman: f.foreman,
          building: b.building, floor: b.floor, area: b.area, zone: b.zone, content: b.content,
          normalWorkers: b.normalWorkers, normalHours: b.normalHours,
          overtimeWorkers: b.overtimeWorkers, overtimeHours: b.overtimeHours,
          resources: fixLinks(b.resources, {
            date: f.date, company: f.company, selfId: "W-" + String(n).padStart(3, "0"),
          }),
          safetyNote: b.safetyNote || "",
          actualNormalWorkers: null, actualNormalHours: null,
          actualOvertimeWorkers: null, actualOvertimeHours: null,
        };
      });
      setSeq(n);
      setRows((rs) => [...rs, ...newRows]);
    }
    setEditing(null);
  }

  // ===== 資機材・ゲートの紐づけ =====
  // 予約表示ONの資源だけを選択肢にする（資機材・ゲート登録の設定に従う）
  const resOptions = resourceOptions({ lifts, gates, equipment });
  // 予約ID → 掴んでいる作業予定。1つの予約に紐づく作業予定は1件までとする
  const claims = claimsOf(rows);
  // 照合で見つかった予約IDを確定させる。以後は日付を変えても紐づけを保持する。
  function fixLinks(resources, ctx) {
    return (resources || []).map((res) => {
      if (res.rsvId) return res;
      const { reservation, state } = linkState(reservations, { ...ctx, claims }, res);
      return state === "linked" && reservation ? { ...res, rsvId: reservation.id } : res;
    });
  }
  // 予約作成の時刻候補。資源種別ごとの予約可能時間・時間間隔設定に従う
  function timeOptionsFor(kind) {
    const key = kind === "lift" ? "lift" : kind === "gate" ? "gate" : "material";
    const range = time?.[key] || { start: 6, end: 24 };
    return makeTimeOptions(intervalMinutes(interval[settingsKeyOf(kind)]), range.start, range.end);
  }
  // 作業予定から予約を作成する。作成した予約のIDを返し、呼び出し側で紐づける。
  function createReservationFor(res, { start, end, vehicleType }, ctx) {
    const id = "RSV-" + String(rsvSeq.current++).padStart(3, "0");
    setReservations((rs) => [
      ...rs,
      {
        id,
        kind: res.kind,
        resource: res.name,
        company: ctx.company,
        date: ctx.date,
        start,
        end,
        content: ctx.content || "作業予定より作成",
        workPlace: res.kind === "gate" ? "" : ctx.workPlace || "",
        remark: "",
        vehicleType: res.kind === "gate" ? vehicleType : "",
        resvType: "normal",
      },
    ]);
    return id;
  }

  // 協力会社を選ぶと職長の選択肢を自動で埋め、既定で表示順の先頭を適用（複数いる場合は選択可）
  function setCompany(company) {
    setEditing((e) => ({ ...e, company, foreman: defaultForeman(company) }));
  }
  // 作業ブロックの操作
  function setBlock(i, patch) {
    setEditing((e) => ({
      ...e,
      blocks: e.blocks.map((b, idx) => (idx === i ? { ...b, ...patch } : b)),
    }));
  }
  const setBlockObj = (i) => (updater) =>
    setEditing((e) => ({
      ...e,
      blocks: e.blocks.map((b, idx) => (idx === i ? updater(b) : b)),
    }));
  function addBlock() {
    setEditing((e) => ({ ...e, blocks: [...e.blocks, emptyBlock()] }));
  }
  function removeBlock(i) {
    setEditing((e) => ({ ...e, blocks: e.blocks.filter((_, idx) => idx !== i) }));
  }

  // --- コピー作成（過去の作業予定を本日ぶんとして複製）---
  // 表示中日付より前の予定（複製元の候補）。ISO日付なので文字列比較でOK。
  const pastRows = rows.filter((r) => r.date < date);
  // 直近 n 件（日付の新しい順／同日は登録の新しい順）を取り出す
  function recentItems(list, n) {
    return [...list].sort(byRecent).slice(0, n);
  }
  // 元請版：協力会社ごとの直近5件 ／ 職長版：自分が作成した予定の直近5件
  const copySource =
    copyMode === "prime"
      ? [...new Set(pastRows.map((r) => r.company))].flatMap((company) =>
          recentItems(pastRows.filter((r) => r.company === company), COPY_RECENT_LIMIT)
        )
      : copyMode === "foreman"
      ? // デモは作成者を識別できないため自社ぶんで代用（本番は作成者ユーザーで判定）
        recentItems(pastRows.filter((r) => r.company === WA_MY_COMPANY), COPY_RECENT_LIMIT)
      : [];
  // 会社→レコード配列（元請版の大カテゴリ見出し用）／ 会社は50音で安定表示
  const copyGroups = [...new Set(copySource.map((r) => r.company))]
    .sort((a, b) => a.localeCompare(b, "ja"))
    .map((company) => ({
      company,
      items: copySource.filter((r) => r.company === company).sort(byRecent),
    }));

  function openCopy(mode) {
    setCopyMode(mode);
    setCopySel(new Set());
    setCopyStep("pick");
    setCopyPicks({});
    setCopyPlan([]);
  }
  function toggleCopy(id) {
    setCopySel((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleCopyGroup(items) {
    const ids = items.map((r) => r.id);
    const allOn = ids.every((id) => copySel.has(id));
    setCopySel((s) => {
      const next = new Set(s);
      ids.forEach((id) => (allOn ? next.delete(id) : next.add(id)));
      return next;
    });
  }
  // ===== コピー作成：手順2（資機材の選択）→ 手順3（予約の作成）=====
  // 手順2：複製する予定ごとに、紐づける資機材・ゲートを選ぶ。初期値は複製元の選択。
  // 資機材を使っていない予定も一覧に出し、この場で紐づけ先を選べるようにする。
  function buildCopyPicks(picked) {
    const picks = {};
    picked.forEach((r) => {
      picks[r.id] = (r.resources || []).map((res) => ({ kind: res.kind, name: res.name }));
    });
    return picks;
  }
  // 手順3：予定×資機材ごとの予約行。予約日は複製先の作業日で固定。
  // 時間・車種は複製元の予約から引き継ぎ、複製元に予約が無ければ空欄で始める。
  function buildCopyPlan(picked, picks) {
    const plan = [];
    // 1予約＝1予定。すでに他の予定が掴んでいる予約を取り合わないよう順に控える
    const taken = new Map(claims);
    picked.forEach((r) => {
      (picks[r.id] || []).forEach((res) => {
        // 複製先の日付に、まだ空いている自社の予約があればそれに紐づける
        const target = linkState(reservations, { date, company: r.company, claims: taken }, { ...res, rsvId: null });
        if (target.state === "linked" && target.reservation) taken.set(target.reservation.id, r);
        // 複製元が同じ資機材で予約を持っていれば、その時間・車種を初期値にする
        const srcRes = (r.resources || []).find((x) => x.kind === res.kind && x.name === res.name);
        const src = srcRes?.rsvId ? reservations.find((x) => x.id === srcRes.rsvId) : null;
        plan.push({
          key: r.id + "|" + res.kind + "|" + res.name,
          rowId: r.id,
          res,
          label: [r.jobType, r.content].filter(Boolean).join("／"),
          linked: target.state === "linked" ? target.reservation : null,
          claimedBy: target.state === "claimed" ? target.owner : null,
          // 複製元に予約があった場合だけ、既定で作成をONにする
          create: target.state !== "linked" && !!src,
          company: r.company, // 予定の協力会社名を初期値に
          content: src?.content || r.content || "", // 作業内容は複製元を踏襲
          start: src?.start || "",
          end: src?.end || "",
          vehicleType: res.kind === "gate" ? src?.vehicleType || "" : "",
        });
      });
    });
    return plan;
  }

  // 手順1 → 手順2（複製元が資機材を使っていなくても、手順2で選べるよう必ず表示する）
  function proceedToResources() {
    const picked = copySource.filter((r) => copySel.has(r.id));
    setCopyPicks(buildCopyPicks(picked));
    setCopyStep("resources");
  }
  // 手順2 → 手順3（資機材を1つも選んでいなければ予約は不要なのでそのまま登録）
  function proceedToReserve() {
    const picked = copySource.filter((r) => copySel.has(r.id));
    const plan = buildCopyPlan(picked, copyPicks);
    if (plan.length === 0) {
      commitCopy([]);
      return;
    }
    setCopyPlan(plan);
    setCopyStep("reserve");
  }
  // 手順2で選んだ資機材の更新
  function setPicksFor(rowId, list) {
    setCopyPicks((p) => ({ ...p, [rowId]: list }));
  }
  // 選択中の資機材の総数（ボタン文言の出し分けに使う）
  const copyPickedResourceCount = Object.values(copyPicks).reduce((n, l) => n + l.length, 0);

  function setPlanRow(key, patch) {
    setCopyPlan((p) => p.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  }
  // 予約をまとめて作成する／しない（すでに既存予約に紐づく行は対象外）
  function toggleAllCreate(on) {
    setCopyPlan((p) => p.map((x) => (x.linked ? x : { ...x, create: on })));
  }

  function commitCopy(plan) {
    // 作成する予約の入力チェック
    const bad = plan.find(
      (x) =>
        !x.linked &&
        x.create &&
        (!x.company.trim() || !x.content.trim() || !x.start || !x.end ||
          x.start >= x.end || (x.res.kind === "gate" && !x.vehicleType))
    );
    if (bad) {
      window.alert(
        `「${bad.res.name}」の予約内容を確認してください。\n` +
          "協力会社名・作業内容・開始/終了（終了は開始より後）" +
          "、ゲートは車種が必要です。"
      );
      return;
    }
    const picked = copySource.filter((r) => copySel.has(r.id));
    // 先に予約を作り、資源キー → 予約ID の対応を作る
    const linkOf = {};
    plan.forEach((row) => {
      if (row.linked) {
        linkOf[row.key] = row.linked.id;
      } else if (row.create) {
        linkOf[row.key] = createReservationFor(
          row.res,
          { start: row.start, end: row.end, vehicleType: row.vehicleType },
          { company: row.company, date, content: row.content }
        );
      }
    });
    let n = seq;
    const newRows = picked.map((r) => {
      n += 1;
      return {
        ...r,
        id: "W-" + String(n).padStart(3, "0"),
        date, // 表示中の日付ぶんとして登録
        status: "pending", // 未確定でコピー（元請の確定はこれから）
        safetyNote: "", // 元請安全指示事項は確定時に入力
        // 手順2で選んだ資機材を採用し、紐づけ先は複製先の日付の予約にする
        resources: (copyPicks[r.id] || []).map((res) => ({
          ...res,
          rsvId: linkOf[r.id + "|" + res.kind + "|" + res.name] || null,
        })),
        actualNormalWorkers: null, actualNormalHours: null,
        actualOvertimeWorkers: null, actualOvertimeHours: null,
      };
    });
    setSeq(n);
    setRows((rs) => [...rs, ...newRows]);
    closeCopy();
  }
  function closeCopy() {
    setCopyMode(null);
    setCopySel(new Set());
    setCopyStep("pick");
    setCopyPicks({});
    setCopyPlan([]);
  }

  // 確定（全未確定を対象。元請安全指示事項は作業日ごとに1つ入力する）
  // 確定後に予定が追加され再確定する場合も、既存の指示事項を初期値に出して更新できる。
  function openConfirm() {
    if (!hasPending) return;
    setConfirmDraft({ count: pendingRows.length, note: primeNotes[date] || "" });
  }
  function commitConfirm() {
    if (!confirmDraft.note.trim()) {
      window.alert("元請安全指示事項を入力してください（必須）。");
      return;
    }
    const ids = new Set(pendingRows.map((r) => r.id));
    setRows((rs) => rs.map((r) => (ids.has(r.id) ? { ...r, status: "approved" } : r)));
    setPrimeNote(date, confirmDraft.note.trim());
    setConfirmDraft(null);
  }
  // 確定解除（全確定済みを未確定に戻す）
  function releaseAll() {
    const ids = new Set(approvedRows.map((r) => r.id));
    setRows((rs) => rs.map((r) => (ids.has(r.id) ? { ...r, status: "pending" } : r)));
  }
  // 協力会社単位の安全指示事項の履歴（重複排除・最新5件・新しい作成データ優先）
  function safetyHistoryFor(company) {
    const seen = new Set();
    const out = [];
    for (let i = rows.length - 1; i >= 0 && out.length < 5; i--) {
      const r = rows[i];
      const note = (r.safetyNote || "").trim();
      if (r.company === company && note && !seen.has(note)) {
        seen.add(note);
        out.push(note);
      }
    }
    return out;
  }
  // 元請安全指示事項（日単位）の履歴。他の日に入力した指示を候補に出す。
  function primeNoteHistory() {
    return [...new Set(Object.entries(primeNotes)
      .filter(([d, v]) => d !== date && (v || "").trim())
      .map(([, v]) => v.trim()))].slice(-5).reverse();
  }
  // 1レコードだけを対象に実績入力ダイアログを開く（職長画面の各レコードのボタン用）
  function openActualOne(r) {
    setActualDraft([
      {
        id: r.id, company: r.company, jobType: r.jobType, content: r.content,
        planned: totalWorkers(r),
        plannedNormalWorkers: Number(r.normalWorkers) || 0,
        plannedOvertimeWorkers: Number(r.overtimeWorkers) || 0,
        actualNormalWorkers: r.actualNormalWorkers ?? 0,
        actualNormalHours: r.actualNormalHours ?? 0,
        actualOvertimeWorkers: r.actualOvertimeWorkers ?? 0,
        actualOvertimeHours: r.actualOvertimeHours ?? 0,
      },
    ]);
  }
  // 実績入力（全確定済みを対象にダイアログを開く）
  function openActual() {
    setActualDraft(
      approvedRows.map((r) => ({
        id: r.id, company: r.company, jobType: r.jobType, content: r.content,
        planned: totalWorkers(r),
        plannedNormalWorkers: Number(r.normalWorkers) || 0,
        plannedOvertimeWorkers: Number(r.overtimeWorkers) || 0,
        actualNormalWorkers: r.actualNormalWorkers ?? 0,
        actualNormalHours: r.actualNormalHours ?? 0,
        actualOvertimeWorkers: r.actualOvertimeWorkers ?? 0,
        actualOvertimeHours: r.actualOvertimeHours ?? 0,
      }))
    );
  }
  function commitActual() {
    const map = new Map(actualDraft.map((d) => [d.id, d]));
    const user = currentUserName(role); // 実績を入力・更新したユーザー
    setRows((rs) =>
      rs.map((r) => {
        const a = map.get(r.id);
        if (!a) return r;
        // 値が変わった行だけ入力者を記録する（一括保存で無関係な行まで更新者にしない）
        const changed =
          a.actualNormalWorkers !== r.actualNormalWorkers ||
          a.actualNormalHours !== r.actualNormalHours ||
          a.actualOvertimeWorkers !== r.actualOvertimeWorkers ||
          a.actualOvertimeHours !== r.actualOvertimeHours;
        return {
          ...r,
          actualNormalWorkers: a.actualNormalWorkers,
          actualNormalHours: a.actualNormalHours,
          actualOvertimeWorkers: a.actualOvertimeWorkers,
          actualOvertimeHours: a.actualOvertimeHours,
          // 初回入力なら作成ユーザー、2回目以降は最終更新ユーザーとして残す
          actualCreatedBy: changed ? r.actualCreatedBy || user : r.actualCreatedBy ?? null,
          actualUpdatedBy: changed
            ? r.actualCreatedBy
              ? user
              : null
            : r.actualUpdatedBy ?? null,
        };
      })
    );
    setActualDraft(null);
  }
  // ダイアログ内の配列アイテム更新用セッター
  const setDraftItem = (setter) => (i) => (updater) =>
    setter((d) => d.map((it, idx) => (idx === i ? updater(it) : it)));
  const setConfirmItem = setDraftItem(setConfirmDraft);
  const setActualItem = setDraftItem(setActualDraft);

  // 行の操作ボタン（テーブル・カード共通）
  const rowActions = (r) => (
    <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
      <Button
        size="small"
        variant="outlined"
        onClick={() => openEdit(r)}
        disabled={r.status === "approved"}
        title={r.status === "approved" ? "確定済みのため編集できません" : ""}
      >
        編集
      </Button>
      <Button
        size="small"
        variant="outlined"
        color="error"
        onClick={() => remove(r)}
        disabled={r.status === "approved"}
        title={r.status === "approved" ? "確定済みのため削除できません" : ""}
      >
        削除
      </Button>
      {role === "foreman" && (
        <Button
          size="small"
          variant="outlined"
          onClick={() => openActualOne(r)}
          disabled={r.status !== "approved"}
          title={r.status !== "approved" ? "確定後に実績入力できます" : "実績を入力"}
        >
          実績入力
        </Button>
      )}
    </Box>
  );
  const statusChip = (r) => (
    <Chip
      size="small"
      color={STATUS_COLOR[WA_STATUS_PILL[r.status]] || "default"}
      label={WA_STATUS_LABEL[r.status]}
    />
  );

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 1.75 }}>
        作業予定一覧
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap", my: 2 }}>
        <Typography variant="caption" color="text.secondary">
          {dayRows.length} 件
        </Typography>
        <TextField
          size="small"
          placeholder="協力会社名で検索"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          sx={{ minWidth: 200 }}
        />
        {role === "prime" && (
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            sx={{ ml: "auto" }}
            onClick={() => setShowPrint(true)}
            disabled={approvedRows.length === 0}
            title={approvedRows.length === 0 ? "確定済みの作業予定がありません" : "確定済みのみ出力します"}
          >
            出力
          </Button>
        )}
        {/* コピー作成はビューに応じて元請/職長のロジックを適用（ボタンは1つ）。
            出力が非表示になる職長ビューでは右寄せを引き継ぐ */}
        <Button
          variant="outlined"
          startIcon={<ContentCopyOutlinedIcon />}
          sx={role === "prime" ? undefined : { ml: "auto" }}
          onClick={() => openCopy(role)}
        >
          コピー作成
        </Button>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          新規作成
        </Button>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", my: 1.5, lineHeight: 1.7 }}>
        ※ 各カラムのヘッダークリックでソートできます（初期は業種順）。協力会社名で検索できます。
        <br />
        ※ 運用フロー：職長が予定を作成 → 元請が確定（元請安全指示事項を入力）→ 元請または職長が実績を入力。
        <br />
        ※ 確定後のレコードは「編集」で確定を解除するまで編集・削除できません。
      </Typography>

      {/* 元請安全指示事項（その日の全作業に共通）。確定時に入力されたら一覧の上に出す */}
      {primeNotes[date] && (
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            alignItems: "flex-start",
            border: "1px solid",
            borderColor: "primary.main",
            bgcolor: "primary.light",
            borderRadius: 2,
            px: 2,
            py: 1.5,
            mb: 2,
          }}
        >
          <Chip size="small" color="primary" label="元請安全指示事項" sx={{ flex: "none" }} />
          <Typography sx={{ fontSize: 13, whiteSpace: "pre-wrap", minWidth: 0 }}>
            {primeNotes[date]}
          </Typography>
        </Box>
      )}

      {dayRows.length === 0 ? (
        <Typography sx={{ py: 4, textAlign: "center", fontSize: 13 }} color="text.secondary">
          この日の作業予定はありません。
        </Typography>
      ) : (
        <>
          {narrow ? (
            // モバイル：カード表示（横スクロールなしで全項目を表示）
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {pageRows.map((r) => (
                <Box
                  key={r.id}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    p: 2,
                    bgcolor: r.status === "approved" ? "action.hover" : "background.paper",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.5 }}>
                    {statusChip(r)}
                    <Typography sx={{ fontSize: 15, fontWeight: 700 }}>{r.company}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                    {[
                      ["業種／職種", `${r.industry}／${r.jobType}`],
                      ["作業場所", [r.building, r.floor, r.area, r.zone].filter(Boolean).join(" / ")],
                      [
                        "作業内容",
                        <>
                          {r.content || "—"}
                          <ResourceChips row={r} reservations={reservations} claims={claims} />
                        </>,
                      ],
                      [
                        "作業人数（予定／実績）",
                        `${totalWorkers(r)} 名 ／ ${actualTotal(r) != null ? actualTotal(r) + " 名" : "—"}`,
                      ],
                      ["安全指示事項", r.safetyNote || "—"],
                    ].map(([label, value]) => (
                      <Box
                        key={label}
                        sx={{ display: "grid", gridTemplateColumns: "118px 1fr", gap: 1.25, fontSize: 13 }}
                      >
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          {label}
                        </Typography>
                        <Box sx={{ fontSize: 13, lineHeight: 1.5 }}>{value}</Box>
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{ mt: 1.75, pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
                    {rowActions(r)}
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table
                size="small"
                sx={{
                  minWidth: 1060,
                  tableLayout: "fixed",
                  "& th, & td": { overflowWrap: "anywhere" },
                  "& th": { whiteSpace: "normal" },
                }}
              >
                <TableHead>
                  <TableRow>
                    {COLUMNS.map(([key, label, width]) => (
                      <TableCell
                        key={key}
                        width={width === "auto" ? undefined : width}
                        sortDirection={sortKey === key ? sortDir : false}
                      >
                        <TableSortLabel
                          active={sortKey === key}
                          direction={sortKey === key ? sortDir : "asc"}
                          onClick={() => toggleSort(key)}
                        >
                          {label}
                        </TableSortLabel>
                      </TableCell>
                    ))}
                    <TableCell width={132} sx={{ whiteSpace: "nowrap" }}>
                      操作
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pageRows.map((r) => (
                    <TableRow
                      key={r.id}
                      hover
                      sx={r.status === "approved" ? { "& td": { bgcolor: "action.hover", color: "text.secondary" } } : undefined}
                    >
                      <TableCell>{statusChip(r)}</TableCell>
                      <TableCell>{r.company}</TableCell>
                      <TableCell>{r.industry}</TableCell>
                      <TableCell>{r.jobType}</TableCell>
                      <TableCell>
                        {r.building} / {r.floor} / {r.area} /{" "}
                        <Typography component="span" variant="caption" color="text.secondary">
                          {r.zone}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {r.content}
                        <ResourceChips row={r} reservations={reservations} claims={claims} />
                      </TableCell>
                      <TableCell>{totalWorkers(r)} 名</TableCell>
                      <TableCell>
                        {actualTotal(r) != null ? (
                          actualTotal(r) + " 名"
                        ) : (
                          <Typography component="span" variant="caption" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {r.safetyNote ? (
                          r.safetyNote
                        ) : (
                          <Typography component="span" variant="caption" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{rowActions(r)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <TablePagination
            total={dayRows.length}
            page={safePage}
            pageSize={pageSize}
            onPage={setPage}
            onPageSize={(n) => { setPageSize(n); setPage(0); }}
          />

          {/* テーブル下：全作業共通の確定／確定解除／実績入力（元請ビューのみ） */}
          {role === "prime" && (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.75, mt: 2, flexWrap: "wrap" }}>
              {allConfirmed ? (
                <>
                  <Button variant="outlined" onClick={releaseAll}>
                    確定解除
                  </Button>
                  <Button variant="contained" size="large" onClick={openActual}>
                    実績入力
                  </Button>
                </>
              ) : (
                <Button variant="contained" size="large" onClick={openConfirm} disabled={!hasPending}>
                  確定
                </Button>
              )}
            </Box>
          )}
        </>
      )}

      {/* 新規作成／編集 */}
      {editing && (
        <Modal
          wide
          title={editing.id ? "作業予定の編集" : "作業予定の新規作成"}
          onClose={() => setEditing(null)}
          footer={
            <>
              <Button variant="outlined" onClick={() => setEditing(null)}>
                キャンセル
              </Button>
              <Button variant="contained" onClick={save}>
                保存
              </Button>
            </>
          }
        >
          {/* 共通項目 */}
          <FormGrid>
            <DateField
              label="日付"
              required
              value={editing.date}
              onChange={(v) => setEditing((x) => ({ ...x, date: v }))}
              hint="この日付の作業予定として登録されます"
            />
            <SuggestField
              label="協力会社名"
              required
              value={editing.company}
              onChange={setCompany}
              options={WA_COMPANIES}
              hint="選択式＋自由記述（DNNの設定を参照）"
            />
            <SelectField
              label="業種"
              required
              value={editing.industry}
              onChange={(v) =>
                setEditing((x) => ({ ...x, industry: v, jobType: "" }))
              }
              options={[
                { value: "", label: "業種を選択してください" },
                ...WA_INDUSTRIES.map((v) => ({ value: v, label: v })),
              ]}
              hint="一覧から選択してください（自由記述不可）"
            />
            <SelectField
              label="職種"
              required
              value={editing.jobType}
              onChange={(v) => setEditing((x) => ({ ...x, jobType: v }))}
              options={
                editing.industry
                  ? [
                      { value: "", label: "職種を選択してください" },
                      ...(WA_JOBTYPES_BY_INDUSTRY[editing.industry] || []).map((v) => ({
                        value: v,
                        label: v,
                      })),
                    ]
                  : [{ value: "", label: "先に業種を選択してください" }]
              }
              hint={
                editing.industry
                  ? "選択中の業種に紐づく職種から選択してください（自由記述不可）"
                  : "先に業種を選択してください"
              }
            />
            <SelectField
              label="職長"
              required
              value={editing.foreman}
              onChange={(v) => setEditing((x) => ({ ...x, foreman: v }))}
              options={
                (WA_FOREMEN[editing.company] || []).length
                  ? (WA_FOREMEN[editing.company] || []).map((v) => ({ value: v, label: v }))
                  : [{ value: "", label: "先に協力会社を選択してください" }]
              }
              hint="協力会社の職長ユーザーから選択（自動反映。既定は表示順の先頭）"
            />
          </FormGrid>

          {/* 作業ブロック（棟・階・エリア・工区・作業内容・作業人数・工数）。新規は複数追加可 */}
          {editing.blocks.map((bk, i) => (
            <Box
              key={i}
              sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2.5, mt: 2 }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography sx={{ color: "primary.main", fontSize: 14, fontWeight: 600 }}>
                  作業 {i + 1}
                </Typography>
                {editing.blocks.length > 1 && (
                  <Button size="small" color="error" onClick={() => removeBlock(i)}>
                    削除
                  </Button>
                )}
              </Box>
              <FormGrid>
                <SuggestField
                  label="棟"
                  value={bk.building}
                  onChange={(v) => setBlock(i, { building: v })}
                  options={WA_HISTORY.building}
                  hint="自由記述＋履歴から選択"
                />
                <SuggestField
                  label="階"
                  value={bk.floor}
                  onChange={(v) => setBlock(i, { floor: v })}
                  options={WA_HISTORY.floor}
                  hint="自由記述＋履歴から選択"
                />
                {/* 入力順は 棟 → 階 → 工区 → エリア（工区のほうが上位の区分のため） */}
                <SuggestField
                  label="工区"
                  value={bk.zone}
                  onChange={(v) => setBlock(i, { zone: v })}
                  options={WA_HISTORY.zone}
                  hint="自由記述＋履歴から選択"
                />
                <SuggestField
                  label="エリア"
                  value={bk.area}
                  onChange={(v) => setBlock(i, { area: v })}
                  options={WA_HISTORY.area}
                  hint="自由記述＋履歴から選択"
                />
                <SuggestField
                  full
                  required
                  label="作業内容"
                  value={bk.content}
                  onChange={(v) => setBlock(i, { content: v })}
                  options={WA_HISTORY.content}
                  hint="自由記述＋履歴から選択"
                />
                <Box sx={{ gridColumn: "1 / -1" }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    作業人数・工数
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, mt: 0.75 }}>
                    <PatternRow obj={bk} setObj={setBlockObj(i)} label="通常作業" wKey="normalWorkers" hKey="normalHours" autoHours />
                    <PatternRow obj={bk} setObj={setBlockObj(i)} label="早出・残業作業" wKey="overtimeWorkers" hKey="overtimeHours" />
                  </Box>
                </Box>
                {/* 安全指示事項。職長が記入する想定だが、入力漏れに備えて元請も作成時に入力できる */}
                <TextAreaField
                  full
                  maxLength={255}
                  label="安全指示事項"
                  value={bk.safetyNote}
                  onChange={(v) => setBlock(i, { safetyNote: v })}
                  placeholder="この作業の安全指示を記入（任意・255文字まで）"
                  history={safetyHistoryFor(editing.company)}
                />
                {/* 使用する資機材・ゲート。選ぶとその日の予約と紐づき、無ければここから作成できる */}
                <ResourcePicker
                  options={resOptions}
                  value={bk.resources || []}
                  onChange={(v) => setBlock(i, { resources: v })}
                  reservations={reservations}
                  date={editing.date}
                  company={editing.company}
                  timeOptions={timeOptionsFor("lift")}
                  vehicleTypes={WA_VEHICLE_TYPES}
                  claims={claims}
                  selfId={editing.id}
                  onCreateReservation={(res, draft) =>
                    createReservationFor(res, draft, {
                      company: editing.company,
                      date: editing.date,
                      content: bk.content,
                      workPlace: [bk.building, bk.floor, bk.area, bk.zone]
                        .filter(Boolean)
                        .join(" "),
                    })
                  }
                />
              </FormGrid>
            </Box>
          ))}

          {!editing.id && (
            <Box sx={{ textAlign: "center", mt: 1.5 }}>
              <Button startIcon={<AddIcon />} onClick={addBlock}>
                作業を追加
              </Button>
            </Box>
          )}
        </Modal>
      )}

      {/* コピー作成（過去の予定を選択して本日ぶんとして複製） */}
      {copyMode && (
        <Modal
          wide
          title={
            copyStep === "reserve"
              ? "コピー作成 － 手順3／3：資機材・ゲートの予約"
              : copyStep === "resources"
              ? "コピー作成 － 手順2／3：紐づける資機材・ゲートの選択"
              : copyMode === "prime"
              ? "コピー作成（元請）－ 手順1／3：協力会社ごとの直近5件"
              : "コピー作成（職長）－ 手順1／3：自分が作成した直近5件"
          }
          onClose={closeCopy}
          footer={
            copyStep === "reserve" ? (
              <>
                <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => setCopyStep("resources")}>
                  資機材の選択に戻る
                </Button>
                <Button variant="contained" onClick={() => commitCopy(copyPlan)}>
                  {formatDateStr(date)}の予定として登録（{copySel.size} 件／予約
                  {copyPlan.filter((x) => !x.linked && x.create).length} 件を作成）
                </Button>
              </>
            ) : copyStep === "resources" ? (
              <>
                <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => setCopyStep("pick")}>
                  複製元の選択に戻る
                </Button>
                <Button variant="contained" onClick={proceedToReserve}>
                  {copyPickedResourceCount > 0
                    ? `次へ：資機材・ゲートの予約（${copyPickedResourceCount} 件）`
                    : `${formatDateStr(date)}の予定として登録（${copySel.size} 件）`}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outlined" onClick={closeCopy}>
                  キャンセル
                </Button>
                <Button variant="contained" onClick={proceedToResources} disabled={copySel.size === 0}>
                  次へ：資機材・ゲートの選択（{copySel.size} 件）
                </Button>
              </>
            )
          }
        >
        {copyStep === "reserve" ? (
          <CopyReserveStep
            plan={copyPlan}
            date={date}
            onToggleAll={toggleAllCreate}
            onChangeRow={setPlanRow}
            timeOptionsFor={timeOptionsFor}
          />
        ) : copyStep === "resources" ? (
          <CopyResourceSelectStep
            picked={copySource.filter((r) => copySel.has(r.id))}
            picks={copyPicks}
            options={resOptions}
            onChange={setPicksFor}
          />
        ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
            {copyMode === "prime" ? (
              <>
                過去の作業予定を協力会社別に、<b>各社ごとの直近{COPY_RECENT_LIMIT}件</b>まで表示しています。
                複製する作業を選択すると、<b>{formatDateStr(date)}</b> の作業予定として一括登録されます（未確定で登録）。
              </>
            ) : (
              <>
                自分が作成した過去の作業予定を<b>直近{COPY_RECENT_LIMIT}件</b>まで表示しています（デモは自社
                <b>{WA_MY_COMPANY}</b>ぶんで代用）。 複製する作業を選択すると、
                <b>{formatDateStr(date)}</b> の作業予定として登録されます（未確定で登録）。
              </>
            )}
          </Typography>

          {copyGroups.length === 0 ? (
            <Typography sx={{ py: 4, textAlign: "center", fontSize: 13 }} color="text.secondary">
              複製できる過去の作業予定がありません。
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {copyGroups.map((g) => {
                const allOn = g.items.every((r) => copySel.has(r.id));
                return (
                  <Box
                    key={g.company}
                    sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        bgcolor: "action.hover",
                        px: 1.75,
                        py: 1,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{g.company}</Typography>
                      <Button size="small" onClick={() => toggleCopyGroup(g.items)}>
                        {allOn ? "選択を解除" : "すべて選択"}
                      </Button>
                    </Box>
                    {g.items.map((r) => (
                      <Box
                        key={r.id}
                        component="label"
                        sx={{
                          display: "grid",
                          gridTemplateColumns: {
                            xs: "20px 74px 1fr auto",
                            md: "20px 92px 1fr 1.2fr 1fr 52px",
                          },
                          alignItems: "center",
                          gap: 1.25,
                          px: 1.75,
                          py: 1,
                          borderTop: "1px solid",
                          borderColor: "divider",
                          fontSize: 13,
                          cursor: "pointer",
                          bgcolor: copySel.has(r.id) ? "primary.light" : "transparent",
                          "&:hover": { bgcolor: copySel.has(r.id) ? "primary.light" : "action.hover" },
                        }}
                      >
                        <Checkbox
                          size="small"
                          sx={{ p: 0 }}
                          checked={copySel.has(r.id)}
                          onChange={() => toggleCopy(r.id)}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {formatDateStr(r.date)}
                        </Typography>
                        {/* 狭い画面では業種・場所を省略して主要項目のみ表示 */}
                        <Typography sx={{ fontSize: 13, display: { xs: "none", md: "block" } }}>
                          {r.industry}／{r.jobType}
                        </Typography>
                        <Typography sx={{ fontSize: 13, display: { xs: "none", md: "block" } }}>
                          {[r.building, r.floor, r.area, r.zone].filter(Boolean).join(" / ")}
                        </Typography>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{r.content}</Typography>
                          {/* 複製元が使っている資機材と、その日の予約との紐づけ状態 */}
                          <ResourceChips row={r} reservations={reservations} claims={claims} />
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ textAlign: "right" }}>
                          {totalWorkers(r)} 名
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                );
              })}
            </Box>
          )}
        </>
        )}
        </Modal>
      )}

      {/* 確定ダイアログ（全未確定を一括確定・元請安全指示事項を入力） */}
      {confirmDraft && (
        <Modal
          wide
          title="作業予定の確定"
          onClose={() => setConfirmDraft(null)}
          footer={
            <>
              <Button variant="outlined" onClick={() => setConfirmDraft(null)}>
                キャンセル
              </Button>
              <Button variant="contained" onClick={commitConfirm}>
                確定する（{confirmDraft.count} 件）
              </Button>
            </>
          }
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            未確定の作業予定 <b>{confirmDraft.count} 件</b>をまとめて確定します。
            元請安全指示事項は<b>その日の全作業に共通の1つ</b>です
            {primeNotes[date] ? "（すでに入力済みの内容を編集できます）" : ""}。
          </Typography>
          <TextAreaField
            full
            required
            maxLength={255}
            label={`元請安全指示事項（${formatDateStr(date)}）`}
            value={confirmDraft.note}
            onChange={(v) => setConfirmDraft((d) => ({ ...d, note: v }))}
            placeholder="その日の全作業に対する安全指示を記入（必須・255文字まで）"
            history={primeNoteHistory()}
          />
        </Modal>
      )}

      {/* 実績入力ダイアログ（全確定済みを一括入力） */}
      {actualDraft && (
        <Modal
          wide
          title="作業人数（実績）の入力"
          onClose={() => setActualDraft(null)}
          footer={
            <>
              <Button variant="outlined" onClick={() => setActualDraft(null)}>
                キャンセル
              </Button>
              <Button variant="contained" onClick={commitActual}>
                保存（{actualDraft.length} 件）
              </Button>
            </>
          }
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            確定済みの各作業について、作業人数（実績）を入力してください。
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
            {groupDraftByCompany(actualDraft).map((g) => (
              <Box
                key={g.company}
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    flexWrap: "wrap",
                    px: 2,
                    py: 1.25,
                    bgcolor: "primary.light",
                    color: "primary.main",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography sx={{ fontSize: 14, fontWeight: 700, mr: "auto" }}>{g.company}</Typography>
                  {g.hasAttendance && (
                    <Typography
                      title="DNN（出面管理）連携の入場人数"
                      sx={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "text.primary",
                        bgcolor: "background.paper",
                        border: "1px solid",
                        borderColor: "primary.main",
                        borderRadius: 999,
                        px: 1.5,
                        py: 0.25,
                      }}
                    >
                      入場人数 <strong>{g.attendance}</strong> 名
                    </Typography>
                  )}
                </Box>
                {g.items.map(({ item: d, index: i }, k) => (
                  <Box
                    key={d.id}
                    sx={{ px: 2, py: 1.75, borderTop: k === 0 ? 0 : "1px dashed", borderColor: "divider" }}
                  >
                    <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1.25 }}>
                      {d.jobType}／{d.content}
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                      <PatternRow
                        obj={d}
                        setObj={setActualItem(i)}
                        label="通常作業"
                        wKey="actualNormalWorkers"
                        hKey="actualNormalHours"
                        plannedWorkers={d.plannedNormalWorkers}
                      />
                      <PatternRow
                        obj={d}
                        setObj={setActualItem(i)}
                        label="早出・残業作業"
                        wKey="actualOvertimeWorkers"
                        hKey="actualOvertimeHours"
                        plannedWorkers={d.plannedOvertimeWorkers}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        </Modal>
      )}

      {/* 出力プレビュー（確定済みのみ） */}
      {showPrint && (
        <PrintPreview
          title="作業予定一覧 － 出力プレビュー"
          onClose={() => setShowPrint(false)}
        >
          <SchedulePrint
            date={date}
            rows={approvedRows}
            manager={WA_PRIME_USERS[0].name}
            primeNote={primeNotes[date]}
          />
        </PrintPreview>
      )}
    </Box>
  );
}
