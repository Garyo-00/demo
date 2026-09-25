import { useEffect, useState } from "react";
import { Box, Button, CircularProgress, Divider, IconButton, Stack, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { RequiredMark } from "./KynextCommon.jsx";
import { RiskCalculationModal } from "./RiskCalculationModal.jsx";
import { RiskScoreToggleRow } from "./CreateFormFields.jsx";
import { SYMBOL_MAP, evaluationOf } from "../../kynextData.js";
import { ACTION_GOAL_MAX_LENGTH, RISK_TEXT_MAX_LENGTH, TEXT_MAX_LENGTH, candidateOptionsForStep } from "./CreateSheetLib.js";

// ===== リスク評価ステップの部品（本番 WorkStepInputSection / RiskAssessmentItemCard /
//       WorkRiskAssessmentSection / PointingAndCallingSection / SuggestButton / SuggestionCandidateOptions） =====

// AI提案ボタン（本番 SuggestButton）。デモでは API の代わりに 1 秒待ってから onClick を呼ぶ
export function SuggestButton({ onClick, onFetch, disabled = false, children }) {
  const [fetching, setFetching] = useState(false);
  const handleClick = async () => {
    setFetching(true);
    try {
      if (onFetch) {
        const result = await onFetch();
        await onClick(result);
      } else {
        await new Promise((r) => setTimeout(r, 1000));
        await onClick();
      }
    } finally {
      setFetching(false);
    }
  };
  return (
    <Button variant="outlined" startIcon={fetching ? <CircularProgress size={16} /> : <AutoAwesomeIcon />} disabled={disabled || fetching} onClick={handleClick}>
      {children ?? "AIで作成"}
    </Button>
  );
}

const formatScores = (s) => `可能性${s.possibility}・重大性${s.severity} → 可能性${s.improvedPossibility}・重大性${s.improvedSeverity}`;

// 手順ごとの「提案1〜3」から選ぶ UI（本番 SuggestionCandidateOptions）。候補が2案以上あるときだけ出す
export function SuggestionCandidateOptions({ options, selectedCandidateIndex, collapseUnselected = false, onSelect }) {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  if (options.length <= 1) return null;

  if (selectedCandidateIndex != null && !dismissed && !expanded) {
    return (
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2, flexWrap: "wrap" }}>
        <AutoAwesomeIcon fontSize="small" color="action" />
        <Typography variant="body2" color="text.secondary">
          提案{selectedCandidateIndex + 1}を選択しました
        </Typography>
        <Button size="small" onClick={() => setExpanded(true)}>
          選び直す
        </Button>
      </Stack>
    );
  }
  if ((dismissed || (selectedCandidateIndex == null && collapseUnselected)) && !expanded) {
    return (
      <Box sx={{ mb: 2 }}>
        <Button size="small" startIcon={<AutoAwesomeIcon />} onClick={() => setExpanded(true)}>
          AI提案の中から選ぶ
        </Button>
      </Box>
    );
  }
  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", mb: 1, flexWrap: "wrap" }}>
        <AutoAwesomeIcon fontSize="small" color="action" />
        <Typography variant="body2" color="text.secondary">
          AIの提案（クリックすると下の欄に入ります）
        </Typography>
        <Button
          size="small"
          onClick={() => {
            setDismissed(true);
            setExpanded(false);
          }}
        >
          使用しない
        </Button>
      </Stack>
      <Stack spacing={1}>
        {options.map((option) => {
          const selected = option.candidateIndex === selectedCandidateIndex;
          return (
            <Button
              key={option.candidateIndex}
              fullWidth
              variant="outlined"
              color={selected ? "primary" : "inherit"}
              onClick={() => {
                onSelect(option.candidateIndex);
                setDismissed(false);
                setExpanded(false);
              }}
              sx={{ justifyContent: "flex-start", textAlign: "left", textTransform: "none", fontWeight: "normal", p: 1.5, borderColor: selected ? "primary.main" : "divider", borderWidth: selected ? 2 : 1, bgcolor: selected ? "action.selected" : undefined }}
            >
              <Stack spacing={0.5} sx={{ width: "100%" }}>
                <Typography variant="caption" color="text.secondary">
                  提案{option.candidateIndex + 1}
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 1, rowGap: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    リスク
                  </Typography>
                  <Typography variant="body2">{option.dangerPoint}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    対策
                  </Typography>
                  <Typography variant="body2">{option.counterMeasure}</Typography>
                </Box>
                {option.scores && (
                  <Typography variant="caption" color="text.secondary">
                    {formatScores(option.scores)}
                  </Typography>
                )}
              </Stack>
            </Button>
          );
        })}
      </Stack>
    </Box>
  );
}

// 「手順n」の入力行（本番 WorkStepInputSection）。ドラッグ並び替えの代わりに上下ボタンで並び替える
export function WorkStepInputSection({ workSteps, minItemCount = 3, maxItemCount, errors = {}, onChangeStep, onAddItem, onRemoveItem, onMoveItem }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Stack spacing={2}>
        {workSteps.map((ws, index) => {
          const itemLabel = `手順${index + 1}`;
          const tooLong = !!ws.step && ws.step.length > TEXT_MAX_LENGTH;
          const message = tooLong ? `${TEXT_MAX_LENGTH}文字以下で入力してください` : errors[index]?.step;
          return (
            <Box key={index} sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
              {onMoveItem && (
                <Stack sx={{ mt: -0.5 }}>
                  <IconButton size="small" aria-label="上へ" disabled={index === 0} onClick={() => onMoveItem(index, index - 1)} sx={{ p: 0.25 }}>
                    <ArrowUpwardIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                  <IconButton size="small" aria-label="下へ" disabled={index === workSteps.length - 1} onClick={() => onMoveItem(index, index + 1)} sx={{ p: 0.25 }}>
                    <ArrowDownwardIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Stack>
              )}
              <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", width: "100%" }}>
                <Box sx={{ minWidth: 90, flexShrink: 0, pt: 0.625 }}>
                  <Typography variant="body2">
                    {itemLabel}
                    {index < minItemCount && <RequiredMark />}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 120, width: "100%" }}>
                  <TextField
                    size="small"
                    placeholder={`${itemLabel}を入力`}
                    value={ws.step ?? ""}
                    onChange={(e) => onChangeStep(index, e.target.value)}
                    error={!!message}
                    helperText={message}
                    sx={{ flex: 1 }}
                    slotProps={{ htmlInput: { "aria-label": `workStep${index}` } }}
                  />
                  {index >= minItemCount && onRemoveItem && (
                    <IconButton size="small" color="primary" aria-label="削除" onClick={() => onRemoveItem(index)}>
                      <RemoveIcon />
                    </IconButton>
                  )}
                </Stack>
              </Stack>
            </Box>
          );
        })}
      </Stack>
      {onAddItem && maxItemCount != null && workSteps.length < maxItemCount && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
          <IconButton color="primary" aria-label="追加" onClick={onAddItem}>
            <AddIcon />
          </IconButton>
        </Box>
      )}
    </Box>
  );
}

// 手順ごとのリスク評価カード（本番 RiskAssessmentItemCard）
export function RiskAssessmentItemCard({
  index,
  filteredIndex,
  procedure,
  isItemBased = false,
  showProcedureField = false,
  procedureLabel,
  riskCatalog,
  workStepsLength,
  minItemCount,
  errors = {},
  onChangeStep,
  onChangeRisk,
  onRemoveItem,
  suggestionCandidateOptions,
  selectedCandidateIndex,
  onSelectCandidate,
  onClearCandidate,
}) {
  const [riskModalOpen, setRiskModalOpen] = useState(false);
  // 選んだ候補から入力を書き換えて選択が外れたあとは、一覧を開かず「AI提案の中から選ぶ」に畳む
  const [detachedFromCandidate, setDetachedFromCandidate] = useState(false);
  const risk = procedure.risk ?? {};
  const isSymbolMode = riskCatalog?.scoreTableType === "Symbol";
  const severityOptions = (riskCatalog?.severities ?? []).map((s) => s.score);
  const possibilityOptions = (riskCatalog?.possibilities ?? []).map((p) => p.possibility);

  const getEvaluation = (severity, possibility) => {
    const ev = evaluationOf(riskCatalog, severity, possibility);
    return { text: ev.label, color: ev.color };
  };

  // 「提案nを選択しました」は入力値と候補の一致で決める。書き換えたら外し、提案どおりに戻したら選択済みに戻す
  const matchesOption = (option) =>
    option.dangerPoint === risk.dangerPoint &&
    option.counterMeasure === risk.countermeasure &&
    (!option.scores ||
      (option.scores.possibility === risk.possibility &&
        option.scores.severity === risk.severity &&
        option.scores.improvedPossibility === risk.improvedPossibility &&
        option.scores.improvedSeverity === risk.improvedSeverity));
  const syncCandidateSelection = () => {
    if (!suggestionCandidateOptions || !onClearCandidate) return;
    const selectedOption = suggestionCandidateOptions.find((o) => o.candidateIndex === selectedCandidateIndex);
    if (selectedOption && matchesOption(selectedOption)) return;
    const matched = suggestionCandidateOptions.find(matchesOption);
    if (matched) {
      onSelectCandidate?.(index, matched.candidateIndex);
      return;
    }
    if (selectedOption) {
      setDetachedFromCandidate(true);
      onClearCandidate(index);
    }
  };
  // スコアはトグルで1回の操作で値が確定するので、変わった時点で判定する
  useEffect(() => {
    syncCandidateSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [risk.possibility, risk.severity, risk.improvedPossibility, risk.improvedSeverity]);

  const liveLengthError = (value, max) => (!!value && value.length > max ? `${max}文字以下で入力してください` : undefined);
  const stepMessage = liveLengthError(procedure.step, TEXT_MAX_LENGTH) ?? errors.step;
  const dangerPointMessage = liveLengthError(risk.dangerPoint, RISK_TEXT_MAX_LENGTH) ?? errors.dangerPoint;
  const countermeasureMessage = liveLengthError(risk.countermeasure, RISK_TEXT_MAX_LENGTH) ?? errors.countermeasure;
  const doubleSafetyMessage = liveLengthError(risk.doubleSafety, RISK_TEXT_MAX_LENGTH) ?? errors.doubleSafety;

  return (
    <Box sx={{ mb: 3, border: "1px solid #E0E0E0", borderRadius: 2, p: 2 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
          {isItemBased ? `リスク項目 ${filteredIndex + 1}` : `手順${index + 1}${procedure.step ? `: ${procedure.step}` : ""}`}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Button size="small" sx={{ fontWeight: "normal", whiteSpace: "nowrap" }} onClick={() => setRiskModalOpen(true)}>
            参考:リスク表
          </Button>
          {isItemBased && onRemoveItem && workStepsLength > (minItemCount ?? 1) && (
            <Button variant="outlined" color="error" size="small" onClick={() => onRemoveItem(index)}>
              削除
            </Button>
          )}
        </Stack>
      </Stack>
      <RiskCalculationModal open={riskModalOpen} onClose={() => setRiskModalOpen(false)} riskCatalog={riskCatalog} />

      {onSelectCandidate && (
        <SuggestionCandidateOptions
          options={suggestionCandidateOptions ?? []}
          selectedCandidateIndex={selectedCandidateIndex}
          collapseUnselected={detachedFromCandidate}
          onSelect={(candidateIndex) => {
            setDetachedFromCandidate(false);
            onSelectCandidate(index, candidateIndex);
          }}
        />
      )}

      <Stack spacing={1}>
        {showProcedureField && (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {procedureLabel ?? "作業内容"}
              <RequiredMark />
            </Typography>
            <TextField size="small" fullWidth value={procedure.step ?? ""} onChange={(e) => onChangeStep(index, e.target.value)} error={!!stepMessage} helperText={stepMessage} slotProps={{ htmlInput: { "aria-label": `workStep${index}` } }} />
          </Box>
        )}
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {riskCatalog?.dangerPointLabel || "危険ポイント"}
            <RequiredMark />
          </Typography>
          <TextField
            size="small"
            multiline
            rows={2}
            fullWidth
            value={risk.dangerPoint ?? ""}
            onChange={(e) => onChangeRisk(index, { dangerPoint: e.target.value })}
            // 危険ポイント・対策は入力中に表示が切り替わらないよう、欄を離れたタイミングで候補との一致を判定する
            onBlur={syncCandidateSelection}
            error={!!dangerPointMessage}
            helperText={dangerPointMessage}
            slotProps={{ htmlInput: { "aria-label": `dangerPoint${index}` } }}
          />
        </Box>

        <RiskScoreToggleRow
          severityOptions={severityOptions}
          possibilityOptions={possibilityOptions}
          severity={risk.severity}
          possibility={risk.possibility}
          onSeverityChange={(v) => onChangeRisk(index, { severity: v })}
          onPossibilityChange={(v) => onChangeRisk(index, { possibility: v })}
          required
          evaluation={getEvaluation(risk.severity, risk.possibility)}
          symbolMap={isSymbolMode ? SYMBOL_MAP : undefined}
          severityError={errors.severity}
          possibilityError={errors.possibility}
        />

        <Box sx={{ py: 1 }}>
          <Divider />
        </Box>

        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {riskCatalog?.countermeasureLabel || "私たちはこうする"}
            <RequiredMark />
          </Typography>
          <TextField
            size="small"
            multiline
            rows={2}
            fullWidth
            value={risk.countermeasure ?? ""}
            onChange={(e) => onChangeRisk(index, { countermeasure: e.target.value })}
            onBlur={syncCandidateSelection}
            error={!!countermeasureMessage}
            helperText={countermeasureMessage}
            slotProps={{ htmlInput: { "aria-label": `countermeasure${index}` } }}
          />
        </Box>

        {riskCatalog?.hasDoubleSafety && (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              ダブルセーフティ
            </Typography>
            <TextField size="small" multiline rows={2} fullWidth value={risk.doubleSafety ?? ""} onChange={(e) => onChangeRisk(index, { doubleSafety: e.target.value })} error={!!doubleSafetyMessage} helperText={doubleSafetyMessage} />
          </Box>
        )}

        <RiskScoreToggleRow
          severityOptions={severityOptions}
          possibilityOptions={possibilityOptions}
          severity={risk.improvedSeverity}
          possibility={risk.improvedPossibility}
          onSeverityChange={(v) => onChangeRisk(index, { improvedSeverity: v })}
          onPossibilityChange={(v) => onChangeRisk(index, { improvedPossibility: v })}
          required
          evaluation={getEvaluation(risk.improvedSeverity, risk.improvedPossibility)}
          symbolMap={isSymbolMode ? SYMBOL_MAP : undefined}
          severityError={errors.improvedSeverity}
          possibilityError={errors.improvedPossibility}
        />
      </Stack>
    </Box>
  );
}

// 手順ごとのカードを並べる（本番 WorkRiskAssessmentSection）
export function WorkRiskAssessmentSection({
  workSteps,
  riskCatalog,
  isWithoutProcedure = false,
  showProcedureField = false,
  procedureLabel,
  minItemCount,
  maxItemCount,
  errors = {},
  onChangeStep,
  onChangeRisk,
  onAddItem,
  onRemoveItem,
  suggestionCandidates,
  selectedCandidateIndexes,
  onSelectCandidate,
  onClearCandidate,
}) {
  // 作業内容なし・統合パターンはどちらも「表示している行がそのまま入力項目」で、空行を隠さず増減ボタンを出す
  const isItemBased = isWithoutProcedure || showProcedureField;
  return (
    <Box sx={{ mb: 3 }}>
      {workSteps
        .map((procedure, index) => ({ procedure, index }))
        .filter(({ procedure }) => isItemBased || !!procedure.step)
        .map(({ procedure, index }, filteredIndex) => (
          <RiskAssessmentItemCard
            key={index}
            index={index}
            filteredIndex={filteredIndex}
            procedure={procedure}
            isItemBased={isItemBased}
            showProcedureField={showProcedureField}
            procedureLabel={procedureLabel}
            riskCatalog={riskCatalog}
            workStepsLength={workSteps.length}
            minItemCount={minItemCount}
            errors={errors[index] ?? {}}
            onChangeStep={onChangeStep}
            onChangeRisk={onChangeRisk}
            onRemoveItem={onRemoveItem}
            suggestionCandidateOptions={candidateOptionsForStep(suggestionCandidates ?? [], index, procedure.step)}
            selectedCandidateIndex={selectedCandidateIndexes?.[index]}
            onSelectCandidate={onSelectCandidate}
            onClearCandidate={onClearCandidate}
          />
        ))}
      {isItemBased && onAddItem && (maxItemCount == null || workSteps.length < maxItemCount) && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
          <Button variant="outlined" onClick={onAddItem}>
            項目を追加
          </Button>
        </Box>
      )}
    </Box>
  );
}

// 行動目標の入力（本番 PointingAndCallingSection）
export function PointingAndCallingSection({ value, onChange, error }) {
  const tooLong = !!value && value.length > ACTION_GOAL_MAX_LENGTH;
  const message = tooLong ? `${ACTION_GOAL_MAX_LENGTH}文字以下で入力してください` : error;
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="body2" sx={{ mb: 1 }}>
        行動目標
        <RequiredMark />
      </Typography>
      <TextField multiline rows={4} fullWidth placeholder="〜する時は◯◯しよう、ヨシ！" value={value ?? ""} onChange={(e) => onChange(e.target.value)} error={!!message} helperText={message} slotProps={{ htmlInput: { "aria-label": "actionGoal" } }} />
    </Box>
  );
}
