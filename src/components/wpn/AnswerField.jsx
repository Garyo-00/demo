import {
  Box,
  Button,
  Checkbox,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import { useIsNarrow } from "./Responsive.jsx";

// 「持込機械選択」「作業員選択」はマスタ連携が前提のため、デモでは固定の選択肢を出す
const MACHINE_OPTS = ["移動式クレーン（クローラー式）", "ブレーカ（油圧式）", "ホイールローダ"];
const WORKER_OPTS = ["門脇_管理者", "星野 恵河", "職長 佐藤"];

// 日付・時刻入力は readOnly のとき type を text に落とす（ピッカーを出さないため）
function nativeType(type, readOnly) {
  return readOnly ? "text" : type;
}

/**
 * 回答形式ごとの入力欄。作成画面（編集可）と詳細画面（閲覧）で共用する。
 * テンプレートで定義した「回答形式」が、作業計画書のどの入力UIになるかを示す。
 */
export default function AnswerField({ item, value, onChange, readOnly = false }) {
  const set = (v) => onChange && onChange(v);
  const opts = (item.options || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const field = (props) => (
    <TextField fullWidth disabled={readOnly} value={value || ""} onChange={(e) => set(e.target.value)} {...props} />
  );

  switch (item.type) {
    case "checkbox":
      return (
        <Checkbox
          size="small"
          checked={!!value}
          disabled={readOnly}
          onChange={(e) => set(e.target.checked)}
        />
      );
    case "select":
    case "machine":
    case "worker": {
      const list = item.type === "machine" ? MACHINE_OPTS : item.type === "worker" ? WORKER_OPTS : opts;
      return (
        <Select fullWidth displayEmpty disabled={readOnly} value={value || ""} onChange={(e) => set(e.target.value)}>
          <MenuItem value="">
            <em>未選択</em>
          </MenuItem>
          {list.map((o) => (
            <MenuItem key={o} value={o}>
              {o}
            </MenuItem>
          ))}
        </Select>
      );
    }
    case "multiSelect":
      return (
        <Select
          fullWidth
          multiple
          displayEmpty
          disabled={readOnly}
          value={value || []}
          onChange={(e) => set(e.target.value)}
          renderValue={(v) => (v.length === 0 ? "0 件選択" : v.join("、"))}
        >
          {opts.map((o) => (
            <MenuItem key={o} value={o}>
              <Checkbox size="small" checked={(value || []).includes(o)} />
              {o}
            </MenuItem>
          ))}
        </Select>
      );
    case "textarea":
      return field({ multiline: true, minRows: 2 });
    case "number":
      return field({ type: "number" });
    case "time":
      return field({ type: nativeType("time", readOnly), placeholder: "hh:mm" });
    case "datetime":
      return field({ type: nativeType("datetime-local", readOnly), placeholder: "YYYY/MM/DD hh:mm" });
    case "date":
      return field({ type: nativeType("date", readOnly), placeholder: "YYYY/MM/DD" });
    case "timeRange":
    case "dateRange": {
      const t = item.type === "timeRange" ? "time" : "date";
      const ph = t === "time" ? "hh:mm" : "YYYY/MM/DD";
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <TextField
            fullWidth
            type={nativeType(t, readOnly)}
            placeholder={ph}
            disabled={readOnly}
            value={value?.[0] || ""}
            onChange={(e) => set([e.target.value, value?.[1] || ""])}
          />
          <Box component="span" sx={{ flex: "none", color: "text.secondary" }}>
            〜
          </Box>
          <TextField
            fullWidth
            type={nativeType(t, readOnly)}
            placeholder={ph}
            disabled={readOnly}
            value={value?.[1] || ""}
            onChange={(e) => set([value?.[0] || "", e.target.value])}
          />
        </Box>
      );
    }
    case "photo":
    case "file":
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button variant="contained" size="small" disabled={readOnly}>
            ファイルを選択
          </Button>
          {item.type === "photo" && <PhotoCameraOutlinedIcon fontSize="small" sx={{ color: "text.secondary" }} />}
        </Box>
      );
    default:
      return field({});
  }
}

// 項目 / 回答内容 / 備考 の3列テーブル（作成・詳細で共用）。
// 狭い画面では3列が入らないため、項目→回答→備考を縦積みにする。
export function AnswerTable({ items, values, onChange, readOnly = false, leadingRow = null }) {
  const narrow = useIsNarrow();

  if (!items?.length && !leadingRow) {
    return (
      <Typography align="center" color="text.secondary" sx={{ py: 4, fontSize: 12.5 }}>
        項目がありません。
      </Typography>
    );
  }

  if (narrow) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {leadingRow}
        {items?.map((it) => (
          <Box key={it.id}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 600, mb: 0.75 }}>
              {it.label}
              {it.required && (
                <Box component="span" sx={{ color: "error.main", ml: 0.25 }}>
                  *
                </Box>
              )}
            </Typography>
            <AnswerField
              item={it}
              value={values?.[it.id]}
              readOnly={readOnly}
              onChange={(v) => onChange && onChange(it.id, v)}
            />
            {it.note && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                {it.note}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: "26%" }}>項目</TableCell>
            <TableCell>回答内容</TableCell>
            <TableCell sx={{ width: "18%" }}>備考</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {leadingRow}
          {items?.map((it) => (
            <TableRow key={it.id}>
              <TableCell>
                {it.label}
                {it.required && (
                  <Box component="span" sx={{ color: "error.main", ml: 0.25 }}>
                    *
                  </Box>
                )}
              </TableCell>
              <TableCell>
                <AnswerField
                  item={it}
                  value={values?.[it.id]}
                  readOnly={readOnly}
                  onChange={(v) => onChange && onChange(it.id, v)}
                />
              </TableCell>
              <TableCell sx={{ color: "text.secondary" }}>{it.note || "備考"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
