import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Chip,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  REQUESTS,
  REQUEST_TYPES,
  APPROVAL_STATUS_LABEL,
  CURRENT_USER,
  MY_PENDING_APPROVALS,
} from "../data.js";

// 申請の種別サブタブ（null = すべて）
const TYPE_TABS = [null, ...REQUEST_TYPES];

// 申請状態の色。差戻しは色を持たせずグレーで扱う。
const STATUS_TONE = { approved: "success", pending: "warning", rejected: null };

// 絞り込みチップ。選択中は primary の淡色で塗る。
function FilterChip({ label, on, onClick }) {
  return (
    <Chip
      size="small"
      label={label}
      onClick={onClick}
      variant="outlined"
      sx={{
        bgcolor: on ? "primary.light" : "background.paper",
        borderColor: on ? "primary.main" : "divider",
        color: on ? "primary.main" : "text.secondary",
      }}
    />
  );
}

function StatusChip({ status }) {
  const tone = STATUS_TONE[status];
  return (
    <Chip
      size="small"
      label={APPROVAL_STATUS_LABEL[status]}
      sx={(t) => {
        const c = tone ? t.palette[tone].main : t.palette.text.secondary;
        return { bgcolor: alpha(c, 0.12), color: c };
      }}
    />
  );
}

export default function ApprovalRequests() {
  const [params, setParams] = useSearchParams();
  // 上位タブ: approval=承認 / request=申請（既定は承認）
  const tab = params.get("tab") === "request" ? "request" : "approval";
  const type = params.get("type");
  // 承認タブの表示範囲: mine=自分の承認待ち（既定） / all=すべての承認待ち
  const scope = params.get("scope") === "all" ? "all" : "mine";

  function setParam(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }

  function selectTab(t) {
    const next = new URLSearchParams();
    if (t === "request") next.set("tab", "request");
    setParams(next); // タブ切替時は種別の絞り込みをリセット
  }

  // 承認待ち件数（承認タブのバッジ用）
  const myPending = MY_PENDING_APPROVALS;

  const rows = useMemo(() => {
    if (tab === "approval") {
      // 承認待ちの申請。既定は自分が承認者のもの、フィルタですべてに切替可能
      return REQUESTS.filter(
        (r) =>
          r.status === "pending" &&
          (scope === "all" || r.approver === CURRENT_USER.name)
      );
    }
    // 申請: すべて／種別で絞り込み
    return REQUESTS.filter((r) => !type || r.type === type);
  }, [tab, type, scope]);

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
        承認・申請
      </Typography>
      <Typography sx={{ fontSize: 15, fontWeight: 700 }}>承認・申請</Typography>

      <Tabs
        value={tab}
        onChange={(_, v) => selectTab(v)}
        sx={{ mt: 2, borderBottom: "1px solid", borderColor: "divider" }}
      >
        <Tab
          value="approval"
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              承認
              {myPending > 0 && (
                <Chip
                  size="small"
                  label={myPending}
                  sx={(t) => ({
                    height: 18,
                    fontSize: 11,
                    bgcolor: alpha(t.palette.warning.main, 0.15),
                    color: "warning.main",
                  })}
                />
              )}
            </Box>
          }
        />
        <Tab value="request" label="申請" />
      </Tabs>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center", my: 1.75 }}>
        {tab === "approval" ? (
          <>
            <FilterChip label="自分の承認待ち" on={scope === "mine"} onClick={() => setParam("scope", null)} />
            <FilterChip label="すべての承認待ち" on={scope === "all"} onClick={() => setParam("scope", "all")} />
          </>
        ) : (
          TYPE_TABS.map((t, i) => (
            <FilterChip
              key={"t" + i}
              label={t || "すべて"}
              on={type === t || (!type && t === null)}
              onClick={() => setParam("type", t)}
            />
          ))
        )}
      </Box>

      {rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ p: 4, textAlign: "center" }}>
          該当する申請はありません。
        </Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>申請番号</TableCell>
                <TableCell>種別</TableCell>
                <TableCell>申請内容</TableCell>
                <TableCell>申請者</TableCell>
                <TableCell>承認者</TableCell>
                <TableCell>申請日</TableCell>
                {tab === "request" && <TableCell>状態</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.id}</TableCell>
                  <TableCell>{r.type}</TableCell>
                  <TableCell>{r.title}</TableCell>
                  <TableCell>{r.applicant}</TableCell>
                  <TableCell>{r.approver}</TableCell>
                  <TableCell>{r.date}</TableCell>
                  {tab === "request" && (
                    <TableCell>
                      <StatusChip status={r.status} />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
