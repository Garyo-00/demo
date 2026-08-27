import {
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { BASIC_ITEMS } from "../../workPlanNeoData.js";

/**
 * 「基本情報ブロック」の中身。作業配置図と作業期間で構成する。
 * ブロック固有のため、テンプレートでは表示のみ（編集不可）。
 */
export default function BasicInfoBlock() {
  return (
    <TableContainer sx={{ overflowX: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>項目</TableCell>
            <TableCell sx={{ width: "34%" }}>回答形式</TableCell>
            <TableCell sx={{ width: 84 }}>必須</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {BASIC_ITEMS.map((it) => (
            <TableRow key={it.label}>
              <TableCell>
                {it.label}
                {it.hint && (
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    {it.hint}
                  </Typography>
                )}
              </TableCell>
              <TableCell>{it.type}</TableCell>
              <TableCell>
                <Checkbox size="small" checked disabled slotProps={{ input: { "aria-label": "必須（固定）" } }} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
