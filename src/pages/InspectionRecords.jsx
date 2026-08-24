import { useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { ALL, STATUS_LABEL } from "../data.js";

const CATS = [null, "機械", "仮設・その他"];
const STATS = [null, "inspected", "uninspected", "idle"];

// 状態の色。非稼働は色を持たせずグレーで扱う。
const STATUS_TONE = { inspected: "success", uninspected: "warning", idle: null };

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
      label={STATUS_LABEL[status]}
      sx={(t) => {
        const c = tone ? t.palette[tone].main : t.palette.text.secondary;
        return { bgcolor: alpha(c, 0.12), color: c };
      }}
    />
  );
}

export default function InspectionRecords() {
  const [params, setParams] = useSearchParams();
  const category = params.get("category");
  const status = params.get("status");

  const rows = useMemo(
    () =>
      ALL.filter(
        (r) =>
          (!category || r.category === category) &&
          (!status || r.status === status)
      ),
    [category, status]
  );

  function setFilter(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
        点検 ＞ 点検記録確認
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Button component={Link} to="/app" size="small" variant="outlined" color="inherit" startIcon={<ArrowBackIcon />}>
          ダッシュボードへ戻る
        </Button>
        <Typography sx={{ fontSize: 15, fontWeight: 700 }}>点検記録確認</Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center", my: 1.75 }}>
        {CATS.map((c, i) => (
          <FilterChip
            key={"c" + i}
            label={c || "全種別"}
            on={category === c || (!category && c === null)}
            onClick={() => setFilter("category", c)}
          />
        ))}
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        {STATS.map((s, i) => (
          <FilterChip
            key={"s" + i}
            label={s ? STATUS_LABEL[s] : "全状態"}
            on={status === s || (!status && s === null)}
            onClick={() => setFilter("status", s)}
          />
        ))}
      </Box>

      {rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ p: 4, textAlign: "center" }}>
          該当する記録はありません。
        </Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>管理番号</TableCell>
                <TableCell>種別</TableCell>
                <TableCell>名称</TableCell>
                <TableCell>型式</TableCell>
                <TableCell>状態</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.id}</TableCell>
                  <TableCell>{r.category}</TableCell>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.model}</TableCell>
                  <TableCell>
                    <StatusChip status={r.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
