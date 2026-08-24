import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  InputAdornment,
  MenuItem,
  ScopedCssBaseline,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import {
  WA_PROJECT,
  WA_WORK_SCHEDULES,
  WA_DEFAULT_DATE,
  WA_DNN_ATTENDANCE,
  formatDateStr,
} from "../data.js";

// QR読み取り後の「作業実績入力」画面（協力会社の作業員／職長が現場で開く想定）。
// デモ用に「アカウントあり」「アカウントなし」の2ビューを切り替えられる。
// - アカウントなし：会社名を選択 → その会社の実績入力
// - アカウントあり：会社選択は省略し、ログインユーザーの会社（今回は青木工業と仮定）の実績入力
// 送信後は「ブラウザを閉じてください」の完了画面へ遷移する。

// デモの「当日」（既定表示日）。前日以前は選択可・未来日は不可
const TODAY = WA_DEFAULT_DATE; // 7/9
const WORKER_OPTS = Array.from({ length: 31 }, (_, i) => i); // 0〜30名
// アカウントありビューでログイン中と仮定する会社
const ACCOUNT_COMPANY = "青木工業";

// 指定日に作業登録のある会社（重複なし）
function companiesForDate(date) {
  return [
    ...new Set(WA_WORK_SCHEDULES.filter((w) => w.date === date).map((w) => w.company)),
  ];
}

function worksForCompany(company, date) {
  return WA_WORK_SCHEDULES.filter((w) => w.date === date && w.company === company);
}

// 画面が縦に細いため、予定／実績／工数は常に3列で並べる
function PatternRow({ label, planned, item, patch, wKey, hKey }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>{label}</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
        <TextField
          size="small"
          label="人数（予定）"
          value={planned}
          slotProps={{ input: { readOnly: true }, inputLabel: { shrink: true } }}
          sx={{ "& .MuiOutlinedInput-root": { bgcolor: "action.hover" } }}
        />
        <TextField
          select
          size="small"
          label="人数（実績）"
          value={item[wKey] ?? 0}
          onChange={(e) => patch({ [wKey]: Number(e.target.value) })}
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
          value={item[hKey] ?? 0}
          onChange={(e) => patch({ [hKey]: Number(e.target.value) })}
          slotProps={{
            htmlInput: { min: 0, step: 0.5 },
            input: { endAdornment: <InputAdornment position="end">h</InputAdornment> },
          }}
        />
      </Box>
    </Box>
  );
}

// 1社ぶんの実績入力フォーム（元請の実績入力画面と同じ構成を単一会社に絞ったもの）
function CompanyActualForm({ company, date, onSubmit, onBack }) {
  const [rows, setRows] = useState(() =>
    worksForCompany(company, date).map((w) => ({
      id: w.id,
      jobType: w.jobType,
      content: w.content,
      planned: Number(w.normalWorkers) || 0,
      plannedNormal: Number(w.normalWorkers) || 0,
      plannedOvertime: Number(w.overtimeWorkers) || 0,
      actualNormalWorkers: w.actualNormalWorkers ?? 0,
      actualNormalHours: w.actualNormalHours ?? 0,
      actualOvertimeWorkers: w.actualOvertimeWorkers ?? 0,
      actualOvertimeHours: w.actualOvertimeHours ?? 0,
    }))
  );
  const plannedTotal = rows.reduce((s, r) => s + r.planned, 0);
  // 入場人数：DNN連携があればその値、無ければ予定人数の合計
  const attendance = WA_DNN_ATTENDANCE[company] ?? plannedTotal;

  const patchItem = (i) => (partial) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...partial } : r)));

  if (rows.length === 0) {
    return (
      <Box>
        <Typography sx={{ py: 4, textAlign: "center", fontSize: 13 }} color="text.secondary">
          この日（{formatDateStr(date)}）の {company} の作業予定はありません。
        </Typography>
        {onBack && (
          <Button variant="outlined" onClick={onBack}>
            ← 会社を選び直す
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
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
          <Typography sx={{ fontSize: 14, fontWeight: 700, mr: "auto" }}>{company}</Typography>
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
            入場人数 <strong>{attendance}</strong> 名
          </Typography>
        </Box>
        {rows.map((d, i) => (
          <Box
            key={d.id}
            sx={{
              px: 2,
              py: 1.75,
              borderTop: i === 0 ? 0 : "1px dashed",
              borderColor: "divider",
            }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1.25 }}>
              {d.jobType}／{d.content}
            </Typography>
            <PatternRow
              label="通常作業"
              planned={d.plannedNormal}
              item={d}
              patch={patchItem(i)}
              wKey="actualNormalWorkers"
              hKey="actualNormalHours"
            />
            <PatternRow
              label="早出・残業作業"
              planned={d.plannedOvertime}
              item={d}
              patch={patchItem(i)}
              wKey="actualOvertimeWorkers"
              hKey="actualOvertimeHours"
            />
          </Box>
        ))}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap", mt: 2.25 }}>
        {onBack && (
          <Button variant="outlined" onClick={onBack}>
            ← 会社を選び直す
          </Button>
        )}
        <Button variant="contained" size="large" sx={{ ml: "auto" }} onClick={onSubmit}>
          送信
        </Button>
      </Box>
    </Box>
  );
}

// アカウントなし：会社選択 → 実績入力
function NoAccountView({ date, onSubmit }) {
  const [company, setCompany] = useState(null);
  // 対象日を変えたら会社選択に戻す（その日の会社一覧から選び直し）
  useEffect(() => {
    setCompany(null);
  }, [date]);
  const companies = companiesForDate(date);

  if (!company) {
    return (
      <Box>
        <Typography sx={{ fontSize: 15, textAlign: "center", mb: 1.75, fontWeight: 600 }}>
          会社名を選択してください
        </Typography>
        {companies.length === 0 ? (
          <Typography sx={{ py: 4, textAlign: "center", fontSize: 13 }} color="text.secondary">
            この日（{formatDateStr(date)}）の作業予定はありません。
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
            {companies.map((c) => (
              <Button
                key={c}
                variant="outlined"
                size="large"
                onClick={() => setCompany(c)}
                sx={{ py: 1.75, fontSize: 16, borderColor: "divider", color: "text.primary" }}
              >
                {c}
              </Button>
            ))}
          </Box>
        )}
      </Box>
    );
  }

  return (
    <CompanyActualForm
      key={company + date}
      company={company}
      date={date}
      onSubmit={onSubmit}
      onBack={() => setCompany(null)}
    />
  );
}

// アカウントあり：会社選択を省略し、ログインユーザーの会社の実績入力のみ
function WithAccountView({ date, onSubmit }) {
  return <CompanyActualForm key={ACCOUNT_COMPANY + date} company={ACCOUNT_COMPANY} date={date} onSubmit={onSubmit} />;
}

// 画面全体のシェル（独立ページなので各自 ScopedCssBaseline で包む）
function Screen({ children }) {
  return (
    <ScopedCssBaseline
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        p: { xs: "24px 16px" },
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 440 }}>
        <CardContent sx={{ p: "20px 20px 24px" }}>{children}</CardContent>
      </Card>
    </ScopedCssBaseline>
  );
}

// 送信後の完了画面
function DoneScreen() {
  return (
    <Screen>
      <Box sx={{ textAlign: "center", py: 5 }}>
        <CheckCircleOutlineIcon sx={{ fontSize: 64, color: "primary.main" }} />
        <Typography sx={{ fontSize: 20, fontWeight: 700, mt: 2 }}>送信が完了しました</Typography>
        <Typography sx={{ fontSize: 14, mt: 1.5 }} color="text.secondary">
          ブラウザ画面を閉じてください。
        </Typography>
      </Box>
    </Screen>
  );
}

export default function WorkAdjustActualInput() {
  const [view, setView] = useState("none"); // "none" | "with"
  const [submitted, setSubmitted] = useState(false);
  const [selectedDate, setSelectedDate] = useState(TODAY); // 対象作業日（既定＝当日）

  if (submitted) return <DoneScreen />;

  const submit = () => setSubmitted(true);

  return (
    <Screen>
      {/* デモ用：アカウントあり／なしの切替 */}
      <ToggleButtonGroup
        exclusive
        fullWidth
        size="small"
        value={view}
        onChange={(_, v) => v && setView(v)}
        aria-label="ビュー切替"
        sx={{ mb: 2.5 }}
      >
        <ToggleButton value="with">アカウントあり</ToggleButton>
        <ToggleButton value="none">アカウントなし</ToggleButton>
      </ToggleButtonGroup>

      <Box sx={{ textAlign: "center", mb: 2.75 }}>
        <Typography sx={{ fontSize: 18, fontWeight: 700 }}>{WA_PROJECT.name}</Typography>
        <Typography sx={{ fontSize: 20, fontWeight: 700, mt: 0.75, color: "#1e2a5a" }}>
          作業実績入力
        </Typography>
        <Box
          sx={{
            mt: 1.25,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <TextField
            size="small"
            type="date"
            label="対象作業日"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value || TODAY)}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: TODAY } }}
          />
          {view === "with" && (
            <Typography sx={{ fontSize: 13 }} color="text.secondary">
              ／{ACCOUNT_COMPANY}
            </Typography>
          )}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
          当日を既定表示。前日以前も選択して記入できます（未来日は不可）。
        </Typography>
      </Box>

      {view === "none" ? (
        <NoAccountView date={selectedDate} onSubmit={submit} />
      ) : (
        <WithAccountView date={selectedDate} onSubmit={submit} />
      )}

      <Typography
        component={Link}
        to="/workadjust/qr"
        sx={{
          display: "inline-block",
          mt: 2.75,
          fontSize: 12,
          color: "text.secondary",
          textDecoration: "none",
          "&:hover": { color: "primary.main", textDecoration: "underline" },
        }}
      >
        ← QR発行画面へ戻る（デモ用）
      </Typography>
    </Screen>
  );
}
