import { Box, Divider, Stack, Typography } from "@mui/material";
import { SYMBOL_MAP, evaluationOf } from "../../kynextData.js";

/**
 * リスク評価の表示（本番 WorkRiskAssessmentKynextnextSection）。作成フローの確認画面で使う。
 * items … [{ id, workName, dangerPoint, countermeasure, doubleSafety, evaluation{severity,possibility}, improvedEvaluation{...} }]
 * itemLabel … 見出しラベル。未指定時は「手順n」。統合パターンでは「作業内容n」
 */
export function CreateRiskAssessmentView({ items, riskCatalog, itemLabel }) {
  const isSymbolMode = riskCatalog?.scoreTableType === "Symbol";
  const dangerPointLabel = riskCatalog?.dangerPointLabel || "危険ポイント";
  const countermeasureLabel = riskCatalog?.countermeasureLabel || "私たちはこうする";
  const formatValue = (v) => (isSymbolMode ? (SYMBOL_MAP[v] ?? String(v)) : String(v));
  const colorSx = (color) => (color && color !== "transparent" ? { bgcolor: color, px: 1, borderRadius: 1 } : undefined);

  return (
    <Stack spacing={2}>
      {items.map((item, index) => {
        const before = evaluationOf(riskCatalog, item.evaluation.severity, item.evaluation.possibility);
        const after = evaluationOf(riskCatalog, item.improvedEvaluation.severity, item.improvedEvaluation.possibility);
        const textRows = [
          { label: dangerPointLabel, value: item.dangerPoint },
          { label: countermeasureLabel, value: item.countermeasure },
        ];
        if (riskCatalog?.hasDoubleSafety && item.doubleSafety) textRows.push({ label: "ダブルセーフティ", value: item.doubleSafety });
        const beforeAfterRows = [
          { label: "重大性", before: formatValue(item.evaluation.severity), after: formatValue(item.improvedEvaluation.severity) },
          { label: "可能性", before: formatValue(item.evaluation.possibility), after: formatValue(item.improvedEvaluation.possibility) },
          { label: "評価", before: before.label, after: after.label, beforeColor: before.color, afterColor: after.color },
        ];
        // 項目が複数並ぶため、統合パターンの「作業内容」にも通し番号を付ける
        const heading = `${itemLabel ?? "手順"}${index + 1}`;
        return (
          <Box key={item.id ?? index} sx={{ border: "1px solid #E0E0E0", borderRadius: 1, p: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              {item.workName ? `${heading}: ${item.workName}` : `リスク項目 ${index + 1}`}
            </Typography>
            <Stack spacing={0} sx={{ mb: 1 }}>
              {textRows.map(({ label, value }) => (
                <Stack key={label} spacing={0}>
                  <Typography variant="body2" color="secondary">
                    {label}
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {value}
                  </Typography>
                </Stack>
              ))}
            </Stack>
            <Divider sx={{ my: 1 }} />
            <Stack spacing={0.5}>
              {beforeAfterRows.map(({ label, before: b, after: a, beforeColor, afterColor }) => (
                <Stack key={label} spacing={0}>
                  <Typography variant="body2" color="secondary">
                    {label}
                  </Typography>
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                    <Typography variant="body2" sx={colorSx(beforeColor)}>
                      {b}
                    </Typography>
                    <Typography variant="body2" color="secondary">
                      →
                    </Typography>
                    <Typography variant="body2" sx={colorSx(afterColor)}>
                      {a}
                    </Typography>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
}

export default CreateRiskAssessmentView;
