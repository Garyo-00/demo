import { Box, Button, Checkbox, Divider, FormControlLabel, IconButton, Radio, RadioGroup, Stack, Switch, Table, TableBody, TableCell, TableContainer, TableRow, TextField, Typography } from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import CloseIcon from "@mui/icons-material/Close";
import { ReadOnlyValue } from "./TemplateBlockLayout.jsx";

// ===== 作業手順設定（本番 templateEdit/blocks/WorkProcedureBlock） =====
// リスク評価ブロックの「記述パターン」タブ。記述パターン／項目設定（ラベル・参考画像・評価方式・各種スイッチ）／手順数。

// 参考画像の添付ボタン（本番 WorkProcedureAttachmentButton）。デモではファイル名だけ保持する。
function AttachmentButton({ value, onChange, readOnly, inputId }) {
  if (readOnly) {
    return value ? (
      <Typography variant="caption" color="success.main" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
        <ImageIcon sx={{ fontSize: 16 }} /> {value.name}
      </Typography>
    ) : null;
  }
  return (
    <Box sx={{ position: "relative", display: "inline-flex" }}>
      <Button size="small" component="label" htmlFor={inputId} startIcon={<ImageIcon fontSize="small" />} sx={{ color: value ? "success.main" : "text.primary", minWidth: "auto", whiteSpace: "nowrap" }}>
        {value ? value.name : "参考画像"}
        <input id={inputId} type="file" accept="image/*" hidden onChange={(e) => onChange(e.target.files?.[0] ? { name: e.target.files[0].name } : null)} />
      </Button>
      {value && (
        <IconButton size="small" onClick={() => onChange(null)} sx={{ position: "absolute", top: -6, right: -6, width: 16, height: 16, p: 0, bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }} aria-label="参考画像を外す">
          <CloseIcon sx={{ fontSize: 10 }} />
        </IconButton>
      )}
    </Box>
  );
}

function OnOffSwitch({ checked, onChange, disabled }) {
  return <FormControlLabel label={checked ? "ON" : "OFF"} labelPlacement="start" sx={{ mr: 0 }} control={<Switch size="small" color="success" checked={!!checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />} />;
}

export function TemplateWorkProcedureBlock({ rc, onChange, readOnly, config, onScoringMethodChange }) {
  const set = (patch) => onChange({ ...rc, ...patch });
  const hasProcedure = rc.assessmentType !== "WithoutProcedure";
  const procedureTerm = config.useWorkContentLabel ? "作業内容" : "作業手順";
  const procedureItemLabel = config.useWorkContentLabel ? "作業内容" : "作業手順・内容";
  const procedureUnitTerm = config.useWorkContentLabel ? "作業内容" : "手順";
  const dangerTerm = config.dangerTerm ?? "危険";
  const dangerPointHint = config.dangerPointHint ?? `各${procedureUnitTerm}に対する${dangerTerm}ポイント`;
  const maxCountLabel = hasProcedure ? (config.useWorkContentLabel ? "項目上限数" : "手順上限数") : `${dangerTerm}上限数`;
  const minCountLabel = hasProcedure ? (config.useWorkContentLabel ? "必須項目数" : "手順必須数") : `${dangerTerm}必須数`;
  const limit = config.maxProcedureCountLimit ?? 20;

  const labelField = (key) =>
    readOnly ? (
      <ReadOnlyValue>{rc[key]}</ReadOnlyValue>
    ) : (
      <TextField size="small" fullWidth value={rc[key] ?? ""} onChange={(e) => set({ [key]: e.target.value })} error={!rc[key]} helperText={!rc[key] ? "入力してください" : ""} />
    );

  return (
    <>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        記述パターン選択
      </Typography>
      <RadioGroup value={rc.assessmentType ?? "WithProcedure"} onChange={(e) => set({ assessmentType: e.target.value })}>
        <FormControlLabel value="WithProcedure" control={<Radio />} label={`パターン1：${procedureTerm} + ${dangerTerm} + 対策 + 評価`} disabled={readOnly} />
        <FormControlLabel value="WithoutProcedure" control={<Radio />} label={`パターン2：${dangerTerm} + 対策 + 評価（${procedureTerm}なし）`} disabled={readOnly} />
      </RadioGroup>

      <Divider sx={{ my: 2 }} />

      {config.showAISettings && (
        <>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            AI設定
          </Typography>
          <FormControlLabel control={<Checkbox checked={!!rc.useArchIntelligence} disabled={readOnly} onChange={(e) => set({ useArchIntelligence: e.target.checked })} />} label="AIの提案を許可" />
          <Divider sx={{ my: 2 }} />
        </>
      )}

      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        項目設定
      </Typography>
      <TableContainer>
        <Table size="small" sx={{ minWidth: 560 }}>
          <TableBody>
            {hasProcedure && (
              <TableRow>
                <TableCell>{procedureItemLabel}</TableCell>
                <TableCell sx={{ color: "text.secondary" }} />
                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                  <Typography variant="body2" color="error">
                    必須
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            <TableRow>
              <TableCell sx={{ width: "40%" }}>{labelField("dangerPointLabel")}</TableCell>
              <TableCell sx={{ color: "text.secondary" }}>{dangerPointHint}</TableCell>
              <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "flex-end" }}>
                  <AttachmentButton inputId="work-procedure-danger-point-attachment" value={rc.dangerPointAttachment ?? null} onChange={(v) => set({ dangerPointAttachment: v })} readOnly={readOnly} />
                  <Typography variant="body2" color="error">
                    必須
                  </Typography>
                </Stack>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{labelField("countermeasureLabel")}</TableCell>
              <TableCell sx={{ color: "text.secondary" }}>具体的な対策内容</TableCell>
              <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "flex-end" }}>
                  <AttachmentButton inputId="work-procedure-countermeasure-attachment" value={rc.countermeasureAttachment ?? null} onChange={(v) => set({ countermeasureAttachment: v })} readOnly={readOnly} />
                  <Typography variant="body2" color="error">
                    必須
                  </Typography>
                </Stack>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>リスク評価（事前/事後）</TableCell>
              <TableCell sx={{ color: "text.secondary" }}>リスク評価方式</TableCell>
              <TableCell align="right">
                <RadioGroup row value={rc.scoreTableType === "Symbol" ? "Symbol" : "Number"} onChange={(e) => onScoringMethodChange(e.target.value)} sx={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
                  <FormControlLabel value="Number" control={<Radio size="small" />} label="スコア方式" disabled={readOnly} />
                  <FormControlLabel value="Symbol" control={<Radio size="small" />} label="記号方式" disabled={readOnly} />
                </RadioGroup>
              </TableCell>
            </TableRow>
            {config.showMultipleAiSuggestion && (
              <TableRow>
                <TableCell>複数AI提案</TableCell>
                <TableCell sx={{ color: "text.secondary" }}>AI提案を複数候補から選ぶ</TableCell>
                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                  <OnOffSwitch checked={rc.hasMultipleAiSuggestion} disabled={readOnly} onChange={(v) => set({ hasMultipleAiSuggestion: v })} />
                </TableCell>
              </TableRow>
            )}
            {config.showDoubleSafety && (
              <TableRow>
                <TableCell>ダブルセーフティ</TableCell>
                <TableCell sx={{ color: "text.secondary" }}>テキスト入力</TableCell>
                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                  <OnOffSwitch checked={rc.hasDoubleSafety} disabled={readOnly} onChange={(v) => set({ hasDoubleSafety: v })} />
                </TableCell>
              </TableRow>
            )}
            {config.showPointingAndCalling && (
              <TableRow>
                <TableCell>指差呼称（行動目標）</TableCell>
                <TableCell sx={{ color: "text.secondary" }}>テキスト入力</TableCell>
                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                  <OnOffSwitch checked={rc.hasPointingAndCalling} disabled={readOnly} onChange={(v) => set({ hasPointingAndCalling: v })} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {!config.hideProcedureCounts && (
        <>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
            <Typography variant="body2">{maxCountLabel}：</Typography>
            <TextField type="number" size="small" sx={{ width: 80 }} value={rc.maxProcedureCount ?? ""} disabled={readOnly} slotProps={{ htmlInput: { min: 1, max: limit } }} onChange={(e) => set({ maxProcedureCount: e.target.value === "" ? null : Number(e.target.value) })} />
            <Typography variant="body2">件</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
            <Typography variant="body2">{minCountLabel}：</Typography>
            <TextField type="number" size="small" sx={{ width: 80 }} value={rc.minProcedureCount ?? ""} disabled={readOnly} slotProps={{ htmlInput: { min: 1, max: limit } }} onChange={(e) => set({ minProcedureCount: e.target.value === "" ? null : Number(e.target.value) })} />
            <Typography variant="body2">件</Typography>
          </Box>
          {rc.minProcedureCount != null && rc.maxProcedureCount != null && rc.minProcedureCount > rc.maxProcedureCount && (
            <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>
              必須数は上限数以下にしてください
            </Typography>
          )}
        </>
      )}
    </>
  );
}
