import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  IconButton,
  Paper,
  ScopedCssBaseline,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";

// 点検実施画面（機械／仮設・その他のタブ切替）。
// 添付イメージのレイアウトを再現するデモ実装（各ボタンは表示のみ）。
// 表示パターン（済／未・実施人数・実施事由の表示など）は、コンテンツ左右の余白に
// 配置したデモ用メニュー（DemoPanel）から切り替えてビューを確認できる。

// 現場アプリの実画面に合わせた配色。テーマのパレットには無い色なのでこの画面に閉じて定義する。
const TEAL = "#35b7c4"; // 操作ボタンの枠線
const BANNER = {
  done: { bg: "#e3edfd", fg: "#2563eb" }, // 済＝青
  undone: { bg: "#fce7f3", fg: "#db2777" }, // 未＝ピンク
  red: { bg: "#fee2e2", fg: "#dc2626" }, // 未（要対応）＝赤
};

// 仮設・始業前点検の実施者サンプル（使用者ごとに複数名になり得る）
const TEMP_INSPECTORS = ["佐藤 健", "鈴木 一郎", "高橋 誠", "伊藤 大輔", "渡辺 浩"];
const TEMP_MAX_INSPECTORS = TEMP_INSPECTORS.length;
// 組立後等点検：実施者プールと、実施事由の選択肢（複数選択可）
const ASSEMBLY_INSPECTORS = ["田中 太郎", "山本 健太", "渡辺 浩", "伊藤 大輔", "林 大樹"];
const ASSEMBLY_MAX = ASSEMBLY_INSPECTORS.length;
const ASSEMBLY_REASONS = ["組立後等", "悪天候後", "地震後", "定期", "一部解体後", "変更後", "その他"];

// 点検実施パネルの操作ボタン（表示のみ）
function ActionButton({ children, disabled }) {
  return (
    <Button
      variant="outlined"
      disabled={disabled}
      sx={{
        width: "80%",
        borderRadius: 2,
        borderWidth: 1.5,
        borderColor: TEAL,
        color: "text.primary",
        fontSize: 14,
        fontWeight: 400,
        py: 1.25,
        "&:hover": { borderWidth: 1.5, borderColor: TEAL, bgcolor: "#f0fbfc" },
      }}
    >
      {children}
    </Button>
  );
}

// 補足文（ボタンが押せない理由など）
function Help({ children }) {
  return (
    <Typography sx={{ fontSize: 12, color: "#98a2b3", mt: "-3px" }}>{children}</Typography>
  );
}

// 状態切替トグル（value は "undone" / "done"）。labels でボタン表示を差し替え可能。
function StateToggle({ value, onChange, labels = ["未", "済"] }) {
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={value}
      onChange={(_, v) => v && onChange(v)}
      aria-label="表示切替（デモ）"
      sx={{
        "& .MuiToggleButton-root": {
          px: 1.75,
          py: 0.5,
          fontSize: 12,
          fontWeight: 700,
          color: "text.secondary",
          borderColor: "divider",
        },
        "& .MuiToggleButton-root.Mui-selected": {
          bgcolor: "#374151",
          color: "#fff",
          "&:hover": { bgcolor: "#374151" },
        },
      }}
    >
      <ToggleButton value="undone">{labels[0]}</ToggleButton>
      <ToggleButton value="done">{labels[1]}</ToggleButton>
    </ToggleButtonGroup>
  );
}

// 数値の増減ステッパー（点検人数など）
function Stepper({ value, onChange, min = 0, max = 9 }) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "stretch",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: "background.paper",
        overflow: "hidden",
      }}
    >
      <IconButton size="small" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="減らす">
        <RemoveIcon fontSize="small" />
      </IconButton>
      <Typography
        sx={{
          minWidth: 36,
          textAlign: "center",
          alignSelf: "stretch",
          fontSize: 13,
          fontWeight: 700,
          borderLeft: "1px solid",
          borderRight: "1px solid",
          borderColor: "divider",
          lineHeight: "30px",
        }}
      >
        {value}
      </Typography>
      <IconButton size="small" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="増やす">
        <AddIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

// 複数選択（点検事由など）。選択済みの項目をチェックで増減する。
function MultiSelect({ options, selected, onToggle }) {
  return (
    <FormGroup sx={{ width: "100%" }}>
      {options.map((o) => (
        <FormControlLabel
          key={o}
          control={<Checkbox size="small" checked={selected.includes(o)} onChange={() => onToggle(o)} sx={{ p: 0.5 }} />}
          label={o}
          slotProps={{ typography: { sx: { fontSize: 12.5, fontWeight: selected.includes(o) ? 600 : 400 } } }}
          sx={{ ml: 0, gap: 0.875 }}
        />
      ))}
    </FormGroup>
  );
}

// 左右の余白に置くデモ用メニュー（タブに応じて操作項目を出し分け）
function DemoPanel({ tab, m, t }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        position: "fixed",
        top: 84,
        right: 24,
        width: 214,
        zIndex: 30,
        maxHeight: "calc(100vh - 108px)",
        overflowY: "auto",
        p: "14px 16px",
        textAlign: "left",
        boxShadow: "0 8px 24px rgba(0,0,0,.10)",
        // 狭い画面ではコンテンツ上部にインライン表示
        "@media(max-width:960px)": {
          position: "static",
          width: "auto",
          maxWidth: 460,
          mx: "auto",
          mb: 0.5,
          boxShadow: "none",
          borderStyle: "dashed",
          bgcolor: "#fafbfc",
        },
      }}
    >
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 700,
          color: "text.secondary",
          pb: 1,
          mb: 0.75,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        表示切替（デモ）
      </Typography>
      {tab === "machine" ? (
        <>
          <DemoRow label="始業前点検">
            <StateToggle value={m.start} onChange={m.setStart} />
          </DemoRow>
          <DemoRow label="月例点検" last>
            <StateToggle value={m.monthly} onChange={m.setMonthly} />
          </DemoRow>
        </>
      ) : (
        <>
          <DemoRow label="始業前点検 実施人数">
            <Stepper value={t.startCount} onChange={t.setStartCount} min={0} max={TEMP_MAX_INSPECTORS} />
          </DemoRow>
          <DemoRow label="組立後等点検 実施人数">
            <Stepper value={t.assemblyCount} onChange={t.setAssemblyCount} min={0} max={ASSEMBLY_MAX} />
          </DemoRow>
          <DemoRow label="組立後等点検 実施事由（複数可）" last>
            <MultiSelect options={ASSEMBLY_REASONS} selected={t.assemblyReasons} onToggle={t.toggleReason} />
          </DemoRow>
        </>
      )}
    </Paper>
  );
}

function DemoRow({ label, last, children }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 0.75,
        py: 1.125,
        borderBottom: last ? "none" : "1px dashed",
        borderColor: "divider",
      }}
    >
      <Typography sx={{ fontSize: 12.5, color: "#374151" }}>{label}</Typography>
      {children}
    </Box>
  );
}

// 点検状態の帯（済／未）
function Banner({ tone, title, sub }) {
  const c = BANNER[tone];
  return (
    <Box sx={{ bgcolor: c.bg, borderRadius: 2, p: 1.75, my: 1.5 }}>
      <Typography sx={{ fontWeight: 700, fontSize: 17, letterSpacing: ".08em", color: c.fg }}>{title}</Typography>
      <Typography sx={{ color: "text.secondary", fontSize: 12, mt: 0.5 }}>{sub}</Typography>
    </Box>
  );
}

// 実施者・実施事由などの中立表示（色を変えず情報だけ表示）
function InfoBox({ title, children }) {
  return (
    <Paper variant="outlined" sx={{ p: "12px 14px", my: 1.5, textAlign: "left" }}>
      <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#374151", mb: 0.5 }}>{title}</Typography>
      <Typography sx={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>{children}</Typography>
    </Paper>
  );
}

// 機械タブ：ELV-2 の点検実施パネル
function MachinePanel({ start, monthly }) {
  const startDone = start === "done";
  const monthlyDone = monthly === "done";
  const hasRecords = startDone || monthlyDone;
  const monthlyLatest = monthlyDone ? "2026/07/03" : "2026/06/05";

  return (
    <>
      <Typography sx={{ fontSize: 16, fontWeight: 600, m: "2px 0 14px" }}>ELV - 2</Typography>

      <Box
        sx={{
          display: "inline-block",
          border: "1.5px solid #ec4899",
          bgcolor: "#fdf2f8",
          color: "#9d174d",
          borderRadius: 1.5,
          p: "6px 14px",
          fontSize: 13,
          fontWeight: 600,
          mb: 1.5,
        }}
      >
        使用期間：2026/05/26 〜 2026/05/29
      </Box>
      <Typography sx={{ fontSize: 13, color: "#374151", my: 0.5 }}>使用期限切れ</Typography>
      <Typography sx={{ fontSize: 13, color: "#374151", my: 0.5 }}>
        7月17日：{startDone ? "点検済" : "点検未"}
      </Typography>

      <Box sx={{ textAlign: "left", fontSize: 13, color: "#374151", m: "16px 2px", lineHeight: 2 }}>
        <div>取扱責任者（正）：</div>
        <div>取扱責任者（副）：</div>
      </Box>

      {/* 始業前点検（当日）：済＝青／未＝ピンク */}
      <Banner
        tone={startDone ? "done" : "undone"}
        title={`始業前点検　${startDone ? "済" : "未"}`}
        sub={startDone ? "本日の始業前点検は実施済みです。" : "始業前点検を実施してください。"}
      />

      {/* 月例点検（当月）：済＝青／未＝ピンク。最新点検日は済・未どちらでも表示 */}
      <Banner
        tone={monthlyDone ? "done" : "undone"}
        title={`月例点検　${monthlyDone ? "済" : "未"}`}
        sub={`最新点検日：${monthlyLatest}${monthlyDone ? "（今月実施済）" : "（今月未実施）"}`}
      />

      <Paper variant="outlined" sx={{ p: "12px 14px", m: "16px 0 24px", textAlign: "left" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.25 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>本日の予約</Typography>
          <Button
            size="small"
            variant="outlined"
            sx={{ borderRadius: 1.5, borderColor: TEAL, color: "#0e7c8a", "&:hover": { borderColor: TEAL, bgcolor: "#f0fbfc" } }}
          >
            予約する
          </Button>
        </Box>
        {["AM", "PM"].map((ap) => (
          <Box key={ap} sx={{ display: "flex", alignItems: "center", gap: 1.25, fontSize: 13, my: 1 }}>
            <Box
              sx={{
                bgcolor: "success.main",
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                borderRadius: 1,
                p: "3px 8px",
                minWidth: 30,
                textAlign: "center",
              }}
            >
              {ap}
            </Box>
            <Typography sx={{ fontSize: 13, color: "text.secondary" }}>予約はありません</Typography>
          </Box>
        ))}
      </Paper>

      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.25 }}>
        <ActionButton>始業前点検開始</ActionButton>
        <ActionButton>記録確認</ActionButton>
        <ActionButton disabled>作業計画書・指示書確認</ActionButton>
        <Help>作業計画書・指示書はありません</Help>
        <ActionButton disabled>作業計画書・指示書確認</ActionButton>
        <ActionButton>受理証確認</ActionButton>
        <ActionButton disabled={startDone}>非稼働登録</ActionButton>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.25, mt: 4.5 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#374151", mb: 0.5 }}>管理者メニュー</Typography>
        <ActionButton>月例点検開始</ActionButton>
        <ActionButton disabled={!hasRecords}>点検元請確認</ActionButton>
        {!hasRecords && <Help>点検記録がありません</Help>}
        <ActionButton>持込点検表一覧</ActionButton>
        <ActionButton>過去点検記録確認</ActionButton>
      </Box>
    </>
  );
}

// 仮設・その他タブ：わくぐみあしば の点検実施パネル
// ・始業前点検：実施人数0＝赤色で「未」。1名以上は「済」とはせず実施者名のみ表示
//   （同じ足場でも使用者ごとに点検が必要で、何名で「済」とするかは現場ごとに異なるため）
// ・組立後等点検：「未」ステータスは持たず、常に実施者を表示（いなければ空白）。
//   実施時は実施事由も表示できる（表示/非表示はデモメニューで切替）。
function TempPanel({ startCount, assemblyCount, assemblyReasons }) {
  const startDone = startCount > 0;
  const assemblyDone = assemblyCount > 0;
  const startInspectors = TEMP_INSPECTORS.slice(0, startCount).join("、");
  const assemblyInspectors = ASSEMBLY_INSPECTORS.slice(0, assemblyCount).join("、");
  // 実施事由は選択肢の並び順で表示（複数可）
  const reasonText = ASSEMBLY_REASONS.filter((r) => assemblyReasons.includes(r)).join("、");

  return (
    <>
      <Typography sx={{ fontSize: 16, fontWeight: 600, m: "2px 0 14px" }}>わくぐみあしば</Typography>
      <Typography sx={{ fontSize: 13, color: "#374151", my: 0.5 }}>
        7月17日：{startDone ? "点検実施中" : "点検未"}
      </Typography>

      <Box sx={{ textAlign: "left", fontSize: 13, color: "#374151", m: "16px 2px", lineHeight: 2 }}>
        <div>取扱責任者（正）：</div>
        <div>取扱責任者（副）：</div>
      </Box>

      {/* 始業前点検：実施なし＝赤帯／実施ありは実施者名のみ（「済」表示・色付けはしない） */}
      {startDone ? (
        <InfoBox title="始業前点検">実施者：{startInspectors}</InfoBox>
      ) : (
        <Banner tone="red" title="始業前点検　未" sub="始業前点検を実施してください。" />
      )}

      {/* 組立後等点検：常に実施者を表示（複数可）。実施時は実施事由（複数可）も表示。実施者なしは空白 */}
      <InfoBox title="組立後等点検">
        {assemblyDone ? (
          <>
            実施者：{assemblyInspectors}
            {reasonText && (
              <>
                <br />
                実施事由：{reasonText}
              </>
            )}
          </>
        ) : (
          <Box component="span" sx={{ display: "inline-block", minHeight: 20 }}>
            &nbsp;
          </Box>
        )}
      </InfoBox>

      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.25 }}>
        <ActionButton>組立後等点検開始</ActionButton>
        <ActionButton>始業前点検開始</ActionButton>
        <ActionButton>記録確認</ActionButton>
        <ActionButton disabled>作業計画書・指示書確認</ActionButton>
        <ActionButton>非稼働登録</ActionButton>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.25, mt: 4.5 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#374151", mb: 0.5 }}>管理者メニュー</Typography>
        <ActionButton disabled={!(startDone || assemblyDone)}>点検元請確認</ActionButton>
        {!(startDone || assemblyDone) && <Help>点検記録がありません</Help>}
        <ActionButton>持込点検表一覧</ActionButton>
        <ActionButton>過去点検記録確認</ActionButton>
      </Box>
    </>
  );
}

export default function InspectionRun() {
  const [tab, setTab] = useState("machine"); // machine | temp
  // 機械タブの表示状態
  const [mStart, setMStart] = useState("undone");
  const [mMonthly, setMMonthly] = useState("done");
  // 仮設タブの表示状態
  const [tStartCount, setTStartCount] = useState(0);
  const [tAssemblyCount, setTAssemblyCount] = useState(1);
  const [tAssemblyReasons, setTAssemblyReasons] = useState(["悪天候後"]);
  const toggleReason = (r) =>
    setTAssemblyReasons((rs) => (rs.includes(r) ? rs.filter((x) => x !== r) : [...rs, r]));

  return (
    <ScopedCssBaseline sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Box sx={{ maxWidth: 460, mx: "auto", p: "20px 16px 56px" }}>
        <Box sx={{ mb: 1.75 }}>
          <Button component={Link} to="/" size="small" variant="outlined" color="inherit" startIcon={<ArrowBackIcon />} sx={{ fontSize: 12 }}>
            デモ画面一覧へ戻る
          </Button>
          <Typography component="h1" sx={{ fontSize: 18, fontWeight: 700, textAlign: "center", mt: 1.25 }}>
            点検実施画面
          </Typography>
        </Box>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} centered sx={{ m: "8px auto 20px" }}>
          <Tab value="machine" label="機械" />
          <Tab value="temp" label="仮設・その他" />
        </Tabs>

        {/* 左右の余白に置くデモ用メニュー（狭い画面ではコンテンツ上部にインライン表示） */}
        <DemoPanel
          tab={tab}
          m={{ start: mStart, setStart: setMStart, monthly: mMonthly, setMonthly: setMMonthly }}
          t={{
            startCount: tStartCount, setStartCount: setTStartCount,
            assemblyCount: tAssemblyCount, setAssemblyCount: setTAssemblyCount,
            assemblyReasons: tAssemblyReasons, toggleReason,
          }}
        />

        <Box sx={{ textAlign: "center" }}>
          {tab === "machine" ? (
            <MachinePanel start={mStart} monthly={mMonthly} />
          ) : (
            <TempPanel
              startCount={tStartCount}
              assemblyCount={tAssemblyCount}
              assemblyReasons={tAssemblyReasons}
            />
          )}
        </Box>
      </Box>
    </ScopedCssBaseline>
  );
}
