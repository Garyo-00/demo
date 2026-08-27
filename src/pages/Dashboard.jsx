import { useNavigate } from "react-router-dom";
import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { MACHINES, TEMPS, summarize, MONTHLY, ASSEMBLY, UNAPPROVED } from "../data.js";
import { useMachines } from "../components/BroughtMachineContext.jsx";
import { NOTIFY_DAYS_BEFORE, inspectionSummary } from "../broughtMachineData.js";

const mSum = summarize(MACHINES);
const tSum = summarize(TEMPS);

// tone → 数値の色。点検済＝緑／未点検＝橙／非稼働＝グレー。
const TONE_COLOR = { ok: "success.main", warn: "warning.main", idle: "text.secondary" };

function SummaryCard({ label, value, unit, tone, onLink, linkLabel = "点検記録確認" }) {
  return (
    <Card sx={{ display: "flex", minHeight: 118 }}>
      <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", p: "16px 18px 12px", "&:last-child": { pb: 1.5 } }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography sx={{ fontSize: 34, fontWeight: 700, lineHeight: 1.1, mt: 1, color: TONE_COLOR[tone] || "text.primary" }}>
          {value}
          {unit && (
            <Box component="span" sx={{ fontSize: 14, fontWeight: 500, color: "text.secondary", ml: "3px" }}>
              {unit}
            </Box>
          )}
        </Typography>
        {onLink && (
          <Box sx={{ mt: "auto", display: "flex", justifyContent: "flex-end", pt: 1.25 }}>
            <Button size="small" onClick={onLink} endIcon={<ChevronRightIcon />} sx={{ fontSize: 12 }}>
              {linkLabel}
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function SectionTitle({ children, first }) {
  return (
    <Typography
      variant="h2"
      color="text.secondary"
      sx={{ letterSpacing: ".04em", mt: first ? 0 : 3, mb: 1.25 }}
    >
      {children}
    </Typography>
  );
}

// カードの列数はカード幅を保つため画面幅で切り替える（4→2→1列）
function CardGrid({ columns = 4, children }) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: "14px",
        gridTemplateColumns: `repeat(${columns},1fr)`,
        "@media(max-width:1100px)": { gridTemplateColumns: "repeat(2,1fr)" },
        "@media(max-width:620px)": { gridTemplateColumns: "1fr" },
      }}
    >
      {children}
    </Box>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  // 特定自主検査は期限の30日前から通知する
  const insp = inspectionSummary(useMachines().machines);

  // 点検記録確認へ（種別・状態で絞り込み）
  function go(category, status) {
    const p = new URLSearchParams();
    if (category) p.set("category", category);
    if (status) p.set("status", status);
    const qs = p.toString();
    navigate("/app/inspection" + (qs ? "?" + qs : ""));
  }

  return (
    <Box>
      <SectionTitle first>機械 ｜ 当日点検サマリ</SectionTitle>
      <CardGrid>
        <SummaryCard label="点検対象機械台数" value={mSum.target} unit="台" onLink={() => go("機械", null)} />
        <SummaryCard label="点検済み機械台数" value={mSum.inspected} unit="台" tone="ok" onLink={() => go("機械", "inspected")} />
        <SummaryCard label="未点検機械台数" value={mSum.uninspected} unit="台" tone="warn" onLink={() => go("機械", "uninspected")} />
        <SummaryCard label="非稼働台数" value={mSum.idle} unit="台" tone="idle" onLink={() => go("機械", "idle")} />
      </CardGrid>

      <SectionTitle>仮設・その他 ｜ 当日点検サマリ</SectionTitle>
      <CardGrid>
        <SummaryCard label="点検対象仮設・その他数" value={tSum.target} unit="件" onLink={() => go("仮設・その他", null)} />
        <SummaryCard label="点検済み仮設・その他数" value={tSum.inspected} unit="件" tone="ok" onLink={() => go("仮設・その他", "inspected")} />
        <SummaryCard label="未点検仮設・その他数" value={tSum.uninspected} unit="件" tone="warn" onLink={() => go("仮設・その他", "uninspected")} />
        <SummaryCard label="非稼働数" value={tSum.idle} unit="件" tone="idle" onLink={() => go("仮設・その他", "idle")} />
      </CardGrid>

      <SectionTitle>月例・組立後等点検</SectionTitle>
      <CardGrid columns={3}>
        <SummaryCard label="月例点検対象数" value={MONTHLY.target} unit="件" onLink={() => go(null, null)} />
        <SummaryCard label="月例点検実施数" value={MONTHLY.done} unit="件" tone="ok" onLink={() => go(null, null)} />
        <SummaryCard label="組立後等点検実施数" value={ASSEMBLY.done} unit="件" tone="ok" onLink={() => go(null, null)} />
      </CardGrid>

      <SectionTitle>特定自主検査 ｜ 期限管理</SectionTitle>
      <CardGrid columns={3}>
        <SummaryCard
          label="期限超過"
          value={insp.overdue}
          unit="台"
          tone={insp.overdue > 0 ? "warn" : "idle"}
          onLink={() => navigate("/app/machines?attention=1")}
          linkLabel="持込機械へ"
        />
        <SummaryCard
          label={`期限まで${NOTIFY_DAYS_BEFORE}日以内`}
          value={insp.due}
          unit="台"
          tone={insp.due > 0 ? "warn" : "idle"}
          onLink={() => navigate("/app/machines?attention=1")}
          linkLabel="持込機械へ"
        />
        <SummaryCard
          label="検査記録なし"
          value={insp.none}
          unit="台"
          tone="idle"
          onLink={() => navigate("/app/machines?attention=1")}
          linkLabel="持込機械へ"
        />
      </CardGrid>

      <SectionTitle>未承認</SectionTitle>
      <CardGrid>
        <SummaryCard label="未承認機械" value={UNAPPROVED.machines} unit="台" tone="warn" onLink={() => navigate("/app/approval?scope=all")} linkLabel="承認・申請へ" />
        <SummaryCard label="未承認ユーザー" value={UNAPPROVED.users} unit="人" tone="warn" onLink={() => navigate("/app/approval?scope=all")} linkLabel="承認・申請へ" />
      </CardGrid>
    </Box>
  );
}
