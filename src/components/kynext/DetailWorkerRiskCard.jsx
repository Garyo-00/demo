import { useState } from "react";
import { Box, Button, Divider, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { SYMBOL_MAP, evaluationOf } from "../../kynextData.js";
import { RequiredMark } from "./KynextCommon.jsx";
import { RiskCalculationModal } from "./RiskCalculationModal.jsx";

// ===== 作業員チェックのリスク評価入力（本番 RiskAssessmentItemCard ＋ RiskScoreToggleRow の簡略版） =====

const TEXT_MAX = 255;

// 重大性・可能性の選択行。記号評価（Symbol）のときは ×△◯ で出す
function RiskScoreToggleRow({ label, options, value, onChange, isSymbolMode, error }) {
  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1 }}>
      <Typography variant="body2" sx={{ minWidth: 56 }}>
        {label}
        <RequiredMark />
      </Typography>
      <ToggleButtonGroup exclusive size="small" value={value || null} onChange={(_, v) => v != null && onChange(v)} color="primary">
        {options.map((o) => (
          <ToggleButton key={o.value} value={o.value} sx={{ minWidth: 44, px: 1.5 }} title={o.description}>
            {isSymbolMode ? SYMBOL_MAP[o.value] ?? o.value : o.value}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      {error && (
        <Typography variant="caption" sx={{ color: "#FF1943", fontWeight: "bold" }}>
          {error}
        </Typography>
      )}
    </Stack>
  );
}

function EvaluationRow({ label, evaluation }) {
  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
      <Typography variant="body2" sx={{ minWidth: 56 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={evaluation.color && evaluation.color !== "transparent" ? { bgcolor: evaluation.color, px: 1.5, py: 0.25, borderRadius: 1, fontWeight: 700 } : { fontWeight: 700 }}>
        {evaluation.label}
      </Typography>
    </Stack>
  );
}

/**
 * 手順1件ぶんのリスク評価カード。
 * workStep: { step, risk: { dangerPoint, countermeasure, severity, possibility, improvedSeverity, improvedPossibility } }
 * errors: { step?, dangerPoint?, countermeasure?, severity?, possibility?, improvedSeverity?, improvedPossibility? }
 * isItemBased … 作業内容なし（WithoutProcedure）のとき。見出しが「リスク項目 n」になり削除ボタンを出す
 */
export function WorkerRiskCard({ index, workStep, riskCatalog, errors = {}, onChange, isItemBased = false, itemLabel = "作業内容", canRemove = false, onRemove }) {
  const [riskModalOpen, setRiskModalOpen] = useState(false);
  const risk = workStep.risk ?? {};
  const isSymbolMode = riskCatalog?.scoreTableType === "Symbol";
  const severityOptions = [...(riskCatalog?.severities ?? [])].sort((a, b) => b.score - a.score).map((s) => ({ value: s.score, description: s.description }));
  const possibilityOptions = [...(riskCatalog?.possibilities ?? [])].sort((a, b) => b.possibility - a.possibility).map((p) => ({ value: p.possibility, description: p.description }));
  const before = evaluationOf(riskCatalog, risk.severity, risk.possibility);
  const after = evaluationOf(riskCatalog, risk.improvedSeverity, risk.improvedPossibility);
  const setRisk = (patch) => onChange({ ...workStep, risk: { ...risk, ...patch } });

  return (
    <Box sx={{ mb: 3, border: "1px solid #E0E0E0", borderRadius: 2, p: 2 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
          {isItemBased ? `リスク項目 ${index + 1}` : `${itemLabel}${index + 1}${workStep.step ? `: ${workStep.step}` : ""}`}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Button size="small" sx={{ fontWeight: "normal" }} onClick={() => setRiskModalOpen(true)}>
            参考:リスク表
          </Button>
          {isItemBased && canRemove && (
            <Button variant="outlined" color="error" size="small" onClick={onRemove}>
              削除
            </Button>
          )}
        </Stack>
      </Stack>
      <RiskCalculationModal open={riskModalOpen} onClose={() => setRiskModalOpen(false)} riskCatalog={riskCatalog} />

      <Stack spacing={1.5}>
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {riskCatalog?.dangerPointLabel || "危険ポイント"}
            <RequiredMark />
          </Typography>
          <TextField
            size="small"
            fullWidth
            multiline
            minRows={2}
            value={risk.dangerPoint ?? ""}
            onChange={(e) => setRisk({ dangerPoint: e.target.value })}
            error={!!errors.dangerPoint || (risk.dangerPoint?.length ?? 0) > TEXT_MAX}
            helperText={(risk.dangerPoint?.length ?? 0) > TEXT_MAX ? `${TEXT_MAX}文字以下で入力してください` : errors.dangerPoint}
          />
        </Box>
        <RiskScoreToggleRow label="重大性" options={severityOptions} value={risk.severity} onChange={(v) => setRisk({ severity: v })} isSymbolMode={isSymbolMode} error={errors.severity} />
        <RiskScoreToggleRow label="可能性" options={possibilityOptions} value={risk.possibility} onChange={(v) => setRisk({ possibility: v })} isSymbolMode={isSymbolMode} error={errors.possibility} />
        <EvaluationRow label="評価" evaluation={before} />
        <Divider />
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {riskCatalog?.countermeasureLabel || "私たちはこうする"}
            <RequiredMark />
          </Typography>
          <TextField
            size="small"
            fullWidth
            multiline
            minRows={2}
            value={risk.countermeasure ?? ""}
            onChange={(e) => setRisk({ countermeasure: e.target.value })}
            error={!!errors.countermeasure || (risk.countermeasure?.length ?? 0) > TEXT_MAX}
            helperText={(risk.countermeasure?.length ?? 0) > TEXT_MAX ? `${TEXT_MAX}文字以下で入力してください` : errors.countermeasure}
          />
        </Box>
        <Typography variant="body2" color="text.secondary">
          改善後
        </Typography>
        <RiskScoreToggleRow label="重大性" options={severityOptions} value={risk.improvedSeverity} onChange={(v) => setRisk({ improvedSeverity: v })} isSymbolMode={isSymbolMode} error={errors.improvedSeverity} />
        <RiskScoreToggleRow label="可能性" options={possibilityOptions} value={risk.improvedPossibility} onChange={(v) => setRisk({ improvedPossibility: v })} isSymbolMode={isSymbolMode} error={errors.improvedPossibility} />
        <EvaluationRow label="評価" evaluation={after} />
      </Stack>
    </Box>
  );
}

/** リスク評価カードの必須チェック（本番 createSchema 相当）。戻り値は index → errors */
export const validateWorkerRisks = (workSteps) => {
  const errors = {};
  workSteps.forEach((ws, i) => {
    const e = {};
    const r = ws.risk ?? {};
    if (!r.dangerPoint?.trim()) e.dangerPoint = "入力してください";
    else if (r.dangerPoint.length > TEXT_MAX) e.dangerPoint = `${TEXT_MAX}文字以下で入力してください`;
    if (!r.countermeasure?.trim()) e.countermeasure = "入力してください";
    else if (r.countermeasure.length > TEXT_MAX) e.countermeasure = `${TEXT_MAX}文字以下で入力してください`;
    if (!r.severity) e.severity = "選択してください";
    if (!r.possibility) e.possibility = "選択してください";
    if (!r.improvedSeverity) e.improvedSeverity = "選択してください";
    if (!r.improvedPossibility) e.improvedPossibility = "選択してください";
    if (Object.keys(e).length) errors[i] = e;
  });
  return errors;
};
