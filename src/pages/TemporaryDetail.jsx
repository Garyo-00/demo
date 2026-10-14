import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useTemporaries } from "../components/TemporaryContext.jsx";
import { TP_INSPECTOR_GROUPS, fmt } from "../temporaryData.js";

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

// 点検者の指名（区分ごとに No./点検者/会社 の表）
function InspectorTable({ list }) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell sx={{ width: 56 }}>No.</TableCell>
          <TableCell>点検者</TableCell>
          <TableCell>会社</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {list.length === 0 ? (
          <TableRow>
            <TableCell colSpan={3} sx={{ color: "text.secondary" }}>
              指名なし
            </TableCell>
          </TableRow>
        ) : (
          list.map((p, i) => (
            <TableRow key={p.id}>
              <TableCell>{i + 1}</TableCell>
              <TableCell>{p.name}</TableCell>
              <TableCell>{p.company}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

export default function TemporaryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getItem, saveItem, removeItem } = useTemporaries();
  const t = getItem(id);

  if (!t) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography sx={{ fontWeight: 700, mb: 1 }}>仮設・その他が見つかりません</Typography>
        <Button onClick={() => navigate("/app/temporary")}>一覧に戻る</Button>
      </Box>
    );
  }

  return (
    <Box>
      <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => navigate("/app/temporary")} sx={{ mb: 1 }}>
        戻る
      </Button>
      <Typography variant="h1" align="center" sx={{ mb: 2 }}>
        仮設・その他詳細
      </Typography>

      <Card sx={{ p: 3 }}>
        <Section title="登録情報">
          <KV
            rows={[
              ["仮設・その他種類", t.type],
              ["名称", t.name],
              ["設置場所", t.place],
              ["現場内管理番号", t.mgmtNo],
              ["管理会社名", t.company],
              ["登録者", t.registrant],
            ]}
          />
        </Section>

        <Section title="点検記録">
          {t.inspections.length === 0 ? (
            <Typography color="text.secondary" sx={{ fontSize: 12.5, py: 2, textAlign: "center" }}>
              点検記録は登録されていません
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>点検表の種類</TableCell>
                    <TableCell sx={{ width: "25%" }}>点検月</TableCell>
                    <TableCell sx={{ width: "35%" }}>点検記録</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {t.inspections.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell>{i.type}</TableCell>
                      <TableCell>{fmt(i.month)}</TableCell>
                      <TableCell>{i.file}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Section>

        <Section title="点検者の指名">
          <TableContainer>
            <Table size="small">
              <TableBody>
                {TP_INSPECTOR_GROUPS.map((g) => (
                  <TableRow key={g.key}>
                    <TableCell component="th" sx={{ width: "30%", bgcolor: "#fafbfd", color: "text.secondary" }}>
                      {g.label}
                    </TableCell>
                    <TableCell sx={{ p: 0 }}>
                      <InspectorTable list={t.inspectors?.[g.key] || []} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Section>

        <Section title="登録状況">
          <KV rows={[["Arch ID", String(t.archId)], ["登録日", fmt(t.registeredAt)]]} />
        </Section>

        <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5 }}>
          <Button variant="outlined" size="small" onClick={() => navigate(`/app/temporary/${t.id}/edit`)}>
            編集
          </Button>
          <Button variant="outlined" size="small" onClick={() => navigate(`/app/temporary/new?copy=${t.id}`)}>
            コピー
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="error"
            onClick={() => {
              if (confirm(`「${t.name}」を削除しますか？`)) {
                removeItem(t.id);
                navigate("/app/temporary");
              }
            }}
          >
            削除
          </Button>
          <Button variant="outlined" size="small" onClick={() => saveItem({ ...t, archived: !t.archived })}>
            {t.archived ? "アーカイブ解除" : "アーカイブ"}
          </Button>
        </Box>
      </Card>
    </Box>
  );
}
