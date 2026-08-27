import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useMachines } from "../components/BroughtMachineContext.jsx";
import {
  INSPECTION_STATE,
  NOTIFY_DAYS_BEFORE,
  SPECIFIC_INSPECTION,
  fmt,
  specificInspection,
} from "../broughtMachineData.js";

// 実画面に合わせた「見出し帯＋2列テーブル」のセクション
function Section({ title, children }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ bgcolor: "#f7f8fb", border: "1px solid", borderColor: "divider", borderRadius: 1, py: 1 }}>
        <Typography align="center" sx={{ fontSize: 14, fontWeight: 700 }}>
          {title}
        </Typography>
      </Box>
      {children}
    </Box>
  );
}

function KV({ rows }) {
  return (
    <TableContainer>
      <Table size="small">
        <TableBody>
          {rows.map(([k, v]) => (
            <TableRow key={k}>
              <TableCell component="th" sx={{ width: "30%", bgcolor: "#fafbfd", color: "text.secondary" }}>
                {k}
              </TableCell>
              <TableCell>{v || "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function MachineDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getMachine, saveMachine, removeMachine } = useMachines();
  const m = getMachine(id);

  if (!m) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography sx={{ fontWeight: 700, mb: 1 }}>持込機械が見つかりません</Typography>
        <Button onClick={() => navigate("/app/machines")}>一覧に戻る</Button>
      </Box>
    );
  }

  const s = specificInspection(m);
  const st = INSPECTION_STATE[s.state];

  return (
    <Box>
      <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => navigate("/app/machines")} sx={{ mb: 1 }}>
        戻る
      </Button>
      <Typography variant="h1" align="center" sx={{ mb: 2 }}>
        持込機械詳細
      </Typography>

      {/* 期限の30日前から通知する */}
      {s.state !== "ok" && (
        <Alert severity={s.state === "overdue" ? "error" : "warning"} sx={{ mb: 2 }}>
          {s.state === "none"
            ? "特定自主検査の記録が登録されていません。実施済みの場合は編集から記録を追加してください。"
            : s.state === "overdue"
              ? `特定自主検査の期限（${fmt(s.due)}）を ${-s.days} 日超過しています。実施のうえ記録を追加してください。`
              : `特定自主検査の期限（${fmt(s.due)}）まで残り ${s.days} 日です。${NOTIFY_DAYS_BEFORE}日前から通知しています。`}
        </Alert>
      )}

      <Card sx={{ p: 3 }}>
        <Section title="持込機械受理証">
          <KV
            rows={[
              ["機械名", m.name],
              ["現場内呼称", m.alias],
              ["持込会社名", m.company],
              ["運転者", m.operator],
              ["使用期間", `${fmt(m.useFrom)} 〜 ${fmt(m.useTo)}`],
              ["一次会社名", m.primary],
            ]}
          />
        </Section>

        <Section title="持込機械使用届">
          <KV
            rows={[
              ["使用会社代表者名", m.repName],
              ["メーカー", m.maker],
              ["規格・性能", m.spec],
              ["製造年", m.madeYear],
              ["使用場所", m.usePlace],
              ["自動車検査証有効期限", fmt(m.vehicleInspExpiry)],
              ["任意保険加入額 対人（千円）", m.insurance.person],
              ["任意保険加入額 対物（千円）", m.insurance.object],
              ["任意保険加入額 搭乗者（千円）", m.insurance.passenger],
              ["任意保険加入額 その他（千円）", m.insurance.other],
            ]}
          />
        </Section>

        <Section title="点検記録">
          {m.inspections.length === 0 ? (
            <Typography color="text.secondary" sx={{ fontSize: 12.5, py: 2, textAlign: "center" }}>
              点検記録は登録されていません
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>点検表の種類</TableCell>
                    <TableCell sx={{ width: "20%" }}>点検月</TableCell>
                    <TableCell sx={{ width: "30%" }}>点検記録</TableCell>
                    <TableCell sx={{ width: "20%" }}>次回期限</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {m.inspections.map((i) => {
                    const isSpec = i.type === SPECIFIC_INSPECTION;
                    // 期限は直近の実施月から計算するため、最新行にだけ状態を出す
                    const isLatest = isSpec && i.month === s.latest;
                    return (
                      <TableRow key={i.id}>
                        <TableCell>
                          {i.type}
                          {isSpec && <Chip size="small" label="期限管理対象" variant="outlined" sx={{ ml: 1 }} />}
                        </TableCell>
                        <TableCell>{fmt(i.month)}</TableCell>
                        <TableCell>{i.file}</TableCell>
                        <TableCell>
                          {isLatest && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                              <Chip size="small" label={st.label} color={st.color} />
                              {fmt(s.due)}
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Section>

        <Section title="登録状況">
          <KV rows={[["Arch ID", String(m.archId)], ["登録日", m.registeredAt]]} />
        </Section>

        <Section title="承認状況">
          <KV
            rows={[
              ["ステータス", m.approval.status ? <Chip key="s" size="small" label={m.approval.status} color="success" /> : ""],
              ["申請No.", m.approval.applyNo],
              ["申請日", m.approval.applyDate],
              ["申請者", m.approval.applicant],
            ]}
          />
        </Section>

        <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5 }}>
          <Button variant="outlined" size="small">出力</Button>
          <Button variant="outlined" size="small" onClick={() => navigate(`/app/machines/${m.id}/edit`)}>
            編集
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="error"
            onClick={() => {
              if (confirm(`「${m.name}」を削除しますか？`)) {
                removeMachine(m.id);
                navigate("/app/machines");
              }
            }}
          >
            削除
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              saveMachine({ ...m, archived: !m.archived });
            }}
          >
            {m.archived ? "アーカイブ解除" : "アーカイブ"}
          </Button>
        </Box>
      </Card>
    </Box>
  );
}
