import { Box, Divider, FormControlLabel, Switch, Table, TableBody, TableCell, TableContainer, TableRow, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { H6_SX, ReadOnlyValue } from "./TemplateBlockLayout.jsx";

// ===== 元請確認ブロック（本番 templateEdit/blocks/GeneralContractorCheckBlock） =====
// workflowCatalog の KY作成後 元請確認／元請からの安全指示／作業完了後 元請確認 を設定する。

function SettingsRow({ label, checked, onChange, readOnly, extra }) {
  return (
    <TableRow sx={{ "& td": { borderBottom: "none" } }}>
      <TableCell>{label}</TableCell>
      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
        <FormControlLabel label={checked ? "ON" : "OFF"} labelPlacement="start" sx={{ mr: 0 }} control={<Switch size="small" color="success" checked={!!checked} disabled={readOnly} onChange={(e) => onChange(e.target.checked)} />} />
      </TableCell>
      <TableCell sx={{ minWidth: 180 }}>{extra}</TableCell>
    </TableRow>
  );
}

function ConfirmTypeToggle({ value, onChange, readOnly }) {
  return (
    <ToggleButtonGroup value={value ?? "Sign"} exclusive size="small" disabled={readOnly} onChange={(_, v) => v && onChange(v)} sx={{ "& .MuiToggleButton-root.Mui-disabled": { opacity: 0.5 } }}>
      <ToggleButton value="Sign">サイン</ToggleButton>
      <ToggleButton value="Button">確認ボタン</ToggleButton>
    </ToggleButtonGroup>
  );
}

function SectionTitle({ children }) {
  return (
    <TableRow>
      <TableCell colSpan={3} sx={{ borderBottom: "none", px: 0 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
          {children}
        </Typography>
      </TableCell>
    </TableRow>
  );
}

export function TemplateGeneralContractorCheckBlock({ workflow, onChange, readOnly }) {
  const set = (patch) => onChange({ ...workflow, ...patch });
  return (
    <Box>
      <Typography variant="h6" sx={{ ...H6_SX, mb: 3 }}>
        元請確認ブロック設定
      </Typography>
      <TableContainer>
        <Table size="small" sx={{ minWidth: 520 }}>
          <TableBody>
            <SectionTitle>KY作成後 元請確認</SectionTitle>
            <SettingsRow
              label="KYNEXT作成時 元請確認"
              checked={workflow.hasGeneralContractorConfirmCreateKynextSheet}
              onChange={(v) => set({ hasGeneralContractorConfirmCreateKynextSheet: v })}
              readOnly={readOnly}
              extra={workflow.hasGeneralContractorConfirmCreateKynextSheet && <ConfirmTypeToggle value={workflow.createConfirmType} onChange={(v) => set({ createConfirmType: v })} readOnly={readOnly} />}
            />
            <SettingsRow
              label="元請からの安全衛生指示事項"
              checked={workflow.hasSafetyInstruction}
              onChange={(v) => set({ hasSafetyInstruction: v })}
              readOnly={readOnly}
              extra={
                workflow.hasSafetyInstruction &&
                (readOnly ? (
                  <ReadOnlyValue>{workflow.safetyInstructionLabel}</ReadOnlyValue>
                ) : (
                  <TextField size="small" fullWidth label="表示ラベル" value={workflow.safetyInstructionLabel ?? ""} onChange={(e) => set({ safetyInstructionLabel: e.target.value })} error={!workflow.safetyInstructionLabel} helperText={!workflow.safetyInstructionLabel ? "入力してください" : ""} />
                ))
              }
            />
            <TableRow>
              <TableCell colSpan={3} sx={{ borderBottom: "none", px: 0 }}>
                <Divider sx={{ my: 1 }} />
              </TableCell>
            </TableRow>
            <SectionTitle>作業完了後 元請確認</SectionTitle>
            <SettingsRow
              label="作業完了後 元請確認"
              checked={workflow.hasGeneralContractorConfirmPostWork}
              onChange={(v) => set({ hasGeneralContractorConfirmPostWork: v })}
              readOnly={readOnly}
              extra={workflow.hasGeneralContractorConfirmPostWork && <ConfirmTypeToggle value={workflow.completeConfirmType} onChange={(v) => set({ completeConfirmType: v })} readOnly={readOnly} />}
            />
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
