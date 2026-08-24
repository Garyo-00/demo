import {
  Box,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  CRANE_AUTO_ITEMS,
  CRANE_INPUT_ITEMS,
  defaultCraneAuto,
} from "../../workPlanNeoData.js";

function Section({ title, hint, children }) {
  return (
    <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2.5, p: 2, mb: 1.5 }}>
      <Typography sx={{ fontSize: 12.5, fontWeight: 700, mb: 1.25 }}>
        {title}
        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1, fontWeight: 400 }}>
          {hint}
        </Typography>
      </Typography>
      {children}
    </Box>
  );
}

/**
 * 「クレーンブロック」の設定。
 * 入力項目はブロック固有のため表示のみ（編集不可）。
 * 自動反映項目は使用／未使用をテンプレートごとに選び、安全率はこの画面で設定する。
 */
export default function CraneAutoBlock({ value, onChange }) {
  const cfg = value || defaultCraneAuto();
  const auto = cfg.auto || {};
  const setAuto = (key, on) => onChange({ ...cfg, auto: { ...auto, [key]: on } });

  return (
    <Box>
      <Section title="入力項目" hint="職長が作業計画書で入力します（編集不可）">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>項目</TableCell>
                <TableCell sx={{ width: "34%" }}>回答形式</TableCell>
                <TableCell sx={{ width: 84 }}>必須</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {CRANE_INPUT_ITEMS.map((it) => (
                <TableRow key={it.label}>
                  <TableCell>{it.label}</TableCell>
                  <TableCell>{it.type}</TableCell>
                  <TableCell>
                    <Checkbox size="small" checked disabled slotProps={{ input: { "aria-label": "必須（固定）" } }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Section>

      <Section title="自動反映" hint="入力項目から自動で計算・取得します">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>項目</TableCell>
                <TableCell sx={{ width: "42%" }}>反映元</TableCell>
                <TableCell align="center" sx={{ width: 84 }}>使用</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {CRANE_AUTO_ITEMS.map((it) => (
                <TableRow key={it.key}>
                  <TableCell>{it.label}</TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>{it.source}</TableCell>
                  <TableCell align="center">
                    <Checkbox
                      size="small"
                      checked={!!auto[it.key]}
                      onChange={(e) => setAuto(it.key, e.target.checked)}
                      slotProps={{ input: { "aria-label": `${it.label}を使用する` } }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Section>

      <Section title="設定" hint="荷重率がこの値以下なら判定は「◯」になります">
        <TextField
          label="安全率（％）"
          type="number"
          value={cfg.safetyRate ?? ""}
          onChange={(e) =>
            onChange({
              ...cfg,
              safetyRate: e.target.value === "" ? "" : Number(e.target.value),
            })
          }
          slotProps={{ htmlInput: { min: 0, max: 100 } }}
          sx={{ width: 160 }}
        />
      </Section>
    </Box>
  );
}
