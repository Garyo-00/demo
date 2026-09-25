import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  Dialog,
  Divider,
  FormControlLabel,
  MobileStepper,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckIcon from "@mui/icons-material/Check";
import SendIcon from "@mui/icons-material/Send";
import ImageIcon from "@mui/icons-material/Image";
import { useKynext } from "../../components/kynext/KynextContext.jsx";
import { SplitFab, useIsTabletOrMobile } from "../../components/kynext/KynextCommon.jsx";
import { ButtonSelectionField, CheckboxSelectionField, FileAnswerField, FormItem, NumberPickerField } from "../../components/kynext/CreateFormFields.jsx";
import { PointingAndCallingSection, SuggestButton, WorkRiskAssessmentSection, WorkStepInputSection } from "../../components/kynext/CreateRiskForm.jsx";
import { CreateRiskAssessmentView } from "../../components/kynext/CreateRiskAssessmentView.jsx";
import {
  ACTION_GOAL_MAX_LENGTH,
  MERGED_PROCEDURE_LABEL,
  STEP_PARAM,
  TEXT_MAX_LENGTH,
  applyCandidateToWorkSteps,
  buildBasicDetails,
  buildRiskAssessmentAnswers,
  buildRiskFormDefaultValues,
  candidateToWorkSteps,
  candidateWorkStepsWithoutRisk,
  clearDraft,
  emptyState,
  filterAnsweredWorkSteps,
  findItemByInternalUseType,
  loadDraft,
  normalizeRiskAssessments,
  saveDraft,
  stateFromSheet,
  suggestRiskCandidates,
  suggestWorkSteps,
  validateAllRiskAssessments,
  validateBasicItems,
  validateCopySchedule,
  validateRiskForm,
} from "../../components/kynext/CreateSheetLib.js";
import { TODAY, buildVirtualSteps, displayAnswer, emptyRisk, isItemVisible, isMergedProcedure, selectRiskCatalogs } from "../../kynextData.js";

// ===== KYシート作成・修正フォーム（本番 CreateCustomKYNEXTSheetPage） =====
// ルート: /kynext/ky-sheets/create（mode=create。location.state.copy があれば過去シートのコピー）
//         /kynext/ky-sheets/:id/edit（mode=edit。status が Provisional なら仮作成の本作成）
// フロー種別（本番 flow.ts）:
//   create      … 新規作成。createSheet でシートを作る
//   provisional … 仮作成シートの本作成。データは edit と同じ既存シート宛てだが、画面は create と同じ導線
//   edit        … 提出済みシートの修正（確定ボタン・「更新」表記・AI提案なし）

const VISUALLY_HIDDEN_SX = { position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" };

// ---------- ステッパー ----------
// 本番の TextStepper variant="progress" は無いので MUI Stepper で代替。スマホは MobileStepper（進捗バー）
function FormStepper({ labels, activeStep }) {
  const isTabletOrMobile = useIsTabletOrMobile();
  if (isTabletOrMobile) {
    return (
      <MobileStepper
        variant="progress"
        steps={labels.length}
        position="static"
        activeStep={activeStep}
        sx={{ width: "100%", bgcolor: "transparent", px: 0, "& .MuiLinearProgress-root": { flex: 1, mx: 2 } }}
        backButton={
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: "bold" }}>
            {labels[activeStep]}
          </Typography>
        }
        nextButton={
          <Typography variant="body2" color="text.secondary" noWrap>
            {activeStep + 1} / {labels.length}
          </Typography>
        }
      />
    );
  }
  return (
    <Stepper activeStep={activeStep} alternativeLabel sx={{ width: "100%" }}>
      {labels.map((label, i) => (
        <Step key={`${label}-${i}`}>
          <StepLabel>{label}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}

// 各ステップの枠（本番 CreateStepPaper）。見出しはステッパーに出しているので画面上には出さない
function StepPaper({ title, headerAction, children }) {
  const isTabletOrMobile = useIsTabletOrMobile();
  return (
    <Paper sx={{ p: 2, width: isTabletOrMobile ? "100%" : "80%" }}>
      <Typography variant="h6" component="h2" sx={VISUALLY_HIDDEN_SX}>
        {title}
      </Typography>
      {headerAction && <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mb: 3 }}>{headerAction}</Box>}
      {children}
    </Paper>
  );
}

// PC 用のステップ操作ボタン（各ステップの Paper の下、右寄せ）
function DesktopNavigation({ children }) {
  return (
    <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end", width: "80%", mt: 2 }}>
      {children}
    </Stack>
  );
}

// ---------- 基本情報ステップ ----------
// 項目タイプ別の入力（本番 CustomItemField）
function ItemField({ item, value, files, error, catalog, copy, copyErrors, onChange, onChangeFiles, onChangeCopy }) {
  const errorMessage = error?.message;
  // 一覧・検索で参照する項目は internalUseType を aria-label にする（本番と同じ。E2E・支援技術向け）
  const ariaLabel = item.internalUseType && item.internalUseType !== "None" ? item.internalUseType : undefined;
  const element = (() => {
    switch (item.type) {
      case "Text": {
        const tooLong = typeof value === "string" && value.length > TEXT_MAX_LENGTH;
        return (
          <TextField
            size="small"
            sx={{ width: "100%", maxWidth: 400 }}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            error={tooLong || !!error}
            helperText={tooLong ? `${TEXT_MAX_LENGTH}文字以下で入力してください` : errorMessage}
            slotProps={{ htmlInput: { "aria-label": ariaLabel } }}
          />
        );
      }
      case "ButtonSelection":
        return <ButtonSelectionField value={value} onChange={onChange} options={item.options ?? []} optional={item.optional} error={error} />;
      case "CheckboxSelection":
        return <CheckboxSelectionField value={value} onChange={onChange} options={item.options ?? []} error={error} />;
      case "Date": {
        const dateField = (
          <TextField
            type="date"
            size="small"
            sx={{ width: 200 }}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            error={!!error}
            helperText={errorMessage}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { "aria-label": ariaLabel } }}
          />
        );
        // 作業日で定期作成できるテンプレートだけ「定期作成」のチェックと期間を出す
        if (item.internalUseType !== "WorkDate" || !catalog?.canScheduleCopy) return dateField;
        return (
          <Stack spacing={1}>
            {dateField}
            <FormControlLabel control={<Checkbox checked={!!copy.enabled} onChange={(e) => onChangeCopy({ ...copy, enabled: e.target.checked })} />} label="定期作成（明日以降は作業日当日AM4:00に作成されます）" />
            {copy.enabled && (
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                <TextField type="date" size="small" label="開始日" value={copy.startAt ?? ""} onChange={(e) => onChangeCopy({ ...copy, startAt: e.target.value })} error={!!copyErrors.startAt} helperText={copyErrors.startAt} slotProps={{ inputLabel: { shrink: true } }} />
                <Typography>〜</Typography>
                <TextField type="date" size="small" label="終了日" value={copy.endAt ?? ""} onChange={(e) => onChangeCopy({ ...copy, endAt: e.target.value })} error={!!copyErrors.endAt} helperText={copyErrors.endAt} slotProps={{ inputLabel: { shrink: true } }} />
              </Stack>
            )}
          </Stack>
        );
      }
      case "HourMinutes":
        return <TextField size="small" placeholder="HH:MM" sx={{ width: 120 }} value={value ?? ""} onChange={(e) => onChange(e.target.value)} error={!!error} helperText={errorMessage} slotProps={{ htmlInput: { "aria-label": ariaLabel } }} />;
      case "Number":
        return <TextField size="small" placeholder="例：100" sx={{ width: 120 }} value={value ?? ""} onChange={(e) => onChange(e.target.value)} error={!!error} helperText={errorMessage} slotProps={{ htmlInput: { inputMode: "numeric", "aria-label": ariaLabel } }} />;
      case "NumberPicker":
        return (
          <Box sx={{ width: 120 }}>
            <NumberPickerField value={value} onChange={onChange} settings={item.settings?.numberPickerSettings ?? {}} error={error} ariaLabel={ariaLabel} />
          </Box>
        );
      case "File":
        return <FileAnswerField value={files ?? []} onChange={onChangeFiles} errorMessage={errorMessage} />;
      default:
        return null;
    }
  })();
  return <FormItem title={item.name} required={!item.optional} element={element} />;
}

// グループ（本番 CustomGroupSection）。任意グループは「該当なし」で項目ごと隠せる
function GroupSection({ group, formInputs, notUse, onChangeNotUse, renderItem }) {
  const visibleItems = (group.items ?? []).filter((item) => isItemVisible(item, formInputs));
  if (visibleItems.length === 0) return null;
  return (
    <Box sx={{ mb: 3 }}>
      {group.optional ? (
        <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: "center" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
            {group.name}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="body2" sx={{ mr: 0.5 }}>
              該当なし
            </Typography>
            <Checkbox checked={!!notUse} onChange={(e) => onChangeNotUse(e.target.checked)} slotProps={{ input: { "aria-label": `${group.name} 該当なし` } }} />
          </Box>
        </Stack>
      ) : (
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
          {group.name}
        </Typography>
      )}
      {!notUse && <Stack spacing={2}>{visibleItems.map((item) => renderItem(item))}</Stack>}
    </Box>
  );
}

// 基本情報の入力（本番 CustomInputForm + useCustomKYNEXTSheetInputForm）
function BasicDetailsStep({ ctx }) {
  const { state, setState, catalog, flow, title, goToNextStep, goToConfirmation, isTabletOrMobile } = ctx;
  const [errors, setErrors] = useState({});
  const [copyErrors, setCopyErrors] = useState({});
  // 定期作成の入力。チェックが入るまでは開始日を作業日に追従させる（本番 CustomItemField の effect）
  const [copy, setCopy] = useState(() => ({ enabled: !!state.copySchedule, startAt: state.copySchedule?.startAt ?? "", endAt: state.copySchedule?.endAt ?? "" }));
  const workDateItem = findItemByInternalUseType(catalog, "WorkDate");
  const workDateValue = workDateItem ? state.formInputs[workDateItem.id] : undefined;
  useEffect(() => {
    if (copy.enabled || typeof workDateValue !== "string") return;
    setCopy((c) => (c.startAt === workDateValue ? c : { ...c, startAt: workDateValue }));
  }, [copy.enabled, workDateValue]);

  // 提出済みシートの修正だけ、途中ステップから確認画面へ飛べるショートカット（確定）を出す
  const showConfirmAction = flow === "edit";
  const groups = catalog?.basicDetailCatalog?.groups ?? [];

  const setInput = (itemId, value) => {
    setState((prev) => ({ ...prev, formInputs: { ...prev.formInputs, [itemId]: value } }));
    setErrors((e) => {
      if (!e[itemId]) return e;
      const { [itemId]: _removed, ...rest } = e;
      return rest;
    });
  };
  const setFiles = (itemId, files) => {
    setState((prev) => ({ ...prev, fileInputs: { ...prev.fileInputs, [itemId]: files }, formInputs: { ...prev.formInputs, [itemId]: files } }));
    setErrors((e) => {
      const { [itemId]: _removed, ...rest } = e;
      return rest;
    });
  };
  const setNotUse = (group, notUse) => setState((prev) => ({ ...prev, groupNotUse: { ...prev.groupNotUse, [group.id]: notUse } }));

  const validateAndSave = () => {
    const { errors: itemErrors } = validateBasicItems(catalog, state);
    const scheduleErrors = catalog?.canScheduleCopy && workDateItem ? validateCopySchedule(copy) : {};
    setErrors(itemErrors);
    setCopyErrors(scheduleErrors);
    if (Object.keys(itemErrors).length > 0 || Object.keys(scheduleErrors).length > 0) return false;
    setState((prev) => ({ ...prev, copySchedule: copy.enabled ? { startAt: copy.startAt, endAt: copy.endAt } : undefined }));
    return true;
  };
  const handleNext = () => validateAndSave() && goToNextStep();
  const handleGoToConfirmation = () => validateAndSave() && goToConfirmation();

  return (
    <>
      <StepPaper title={title}>
        {groups.map((group) => (
          <GroupSection
            key={group.id}
            group={group}
            formInputs={state.formInputs}
            notUse={state.groupNotUse?.[group.id]}
            onChangeNotUse={(v) => setNotUse(group, v)}
            renderItem={(item) => (
              <ItemField
                key={item.id}
                item={item}
                value={state.formInputs[item.id]}
                files={state.fileInputs?.[item.id]}
                error={errors[item.id]}
                catalog={catalog}
                copy={copy}
                copyErrors={copyErrors}
                onChange={(v) => setInput(item.id, v)}
                onChangeFiles={(files) => setFiles(item.id, files)}
                onChangeCopy={(next) => {
                  setCopy(next);
                  setCopyErrors({});
                }}
              />
            )}
          />
        ))}
      </StepPaper>
      {isTabletOrMobile ? (
        <SplitFab actions={[...(showConfirmAction ? [{ label: "確定", icon: <CheckIcon />, onClick: handleGoToConfirmation }] : []), { label: "次へ", icon: <ArrowForwardIcon />, onClick: handleNext }]} />
      ) : (
        <DesktopNavigation>
          {showConfirmAction && (
            <Button variant="contained" onClick={handleGoToConfirmation}>
              確定
            </Button>
          )}
          <Button variant="contained" onClick={handleNext}>
            次へ
          </Button>
        </DesktopNavigation>
      )}
    </>
  );
}

// ---------- リスク評価ステップ（作業手順 / リスク評価 / 指差呼称） ----------
// 本番 CustomRiskForm + useCustomRiskForm + useCustomRiskFormActions + useSuggestionCandidates。
// 同じリスク評価内（作業手順 → リスク評価 → 指差呼称）は再マウントせず入力を引き継ぐ（親で key=riskIndex）
function RiskFormStep({ ctx, section, riskIndex }) {
  const { state, updateRiskAssessment, catalog, flow, title, riskCatalogs, goToNextStep, goToPreviousStep, goToConfirmation, isTabletOrMobile } = ctx;
  const rc = riskCatalogs[riskIndex];
  const isWithoutProcedure = rc?.assessmentType === "WithoutProcedure";
  const merged = isMergedProcedure(rc);
  // 作業手順ページを持たないパターンは、AI提案が手順そのものを決める（カスケード）
  const isCascade = isWithoutProcedure || merged;
  const [form, setForm] = useState(() => buildRiskFormDefaultValues(rc, state.riskAssessments[riskIndex]));
  const [errors, setErrors] = useState({ workSteps: {}, actionGoal: undefined });
  const [cascadeLabel, setCascadeLabel] = useState("AIで作成");

  const riskAssessment = state.riskAssessments[riskIndex] ?? {};
  const candidates = riskAssessment.suggestionCandidates ?? [];
  const selectedCandidateIndexes = riskAssessment.selectedSuggestionCandidateIndexes ?? [];
  // 提出済みシートの修正では AI 提案を出さない。AI 提案は安全KYだけが対象（品質・その他は対象外）
  const showSuggest = flow !== "edit" && rc?.type === "Safety";
  const showConfirmAction = flow === "edit";
  // 複数の候補を取得できたあとは各項目の選択肢から選べばよいので、生成し直すボタンは出さない
  const hasCandidateOptions = candidates.length >= 2;
  const minCount = rc?.minProcedureCount ?? 3;
  const maxCount = rc?.maxProcedureCount;

  const workContentItem = findItemByInternalUseType(catalog, "WorkContent");
  const workContent = workContentItem ? String(state.formInputs[workContentItem.id] ?? "") : "";

  const setStep = (i, step) => setForm((f) => ({ ...f, workSteps: f.workSteps.map((ws, j) => (j === i ? { ...ws, step } : ws)) }));
  const setRisk = (i, patch) => setForm((f) => ({ ...f, workSteps: f.workSteps.map((ws, j) => (j === i ? { ...ws, risk: { ...emptyRisk(), ...ws.risk, ...patch } } : ws)) }));
  const addItem = () => setForm((f) => ({ ...f, workSteps: [...f.workSteps, { step: "", risk: emptyRisk() }] }));
  const removeItem = (i) => setForm((f) => ({ ...f, workSteps: f.workSteps.filter((_, j) => j !== i) }));
  const moveItem = (from, to) =>
    setForm((f) => {
      if (to < 0 || to >= f.workSteps.length) return f;
      const next = [...f.workSteps];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return { ...f, workSteps: next };
    });

  // 作業手順ステップの「次へ」（本番 validateStepInput）。min 件までは必須、末尾の空行は落として保存する
  const validateStepInput = (onSuccess) => {
    const stepErrors = {};
    form.workSteps.forEach((ws, i) => {
      if (i < minCount && !ws.step?.trim()) stepErrors[i] = { step: "入力してください" };
      else if (ws.step && ws.step.length > TEXT_MAX_LENGTH) stepErrors[i] = { step: `${TEXT_MAX_LENGTH}文字以下で入力してください` };
    });
    setErrors((e) => ({ ...e, workSteps: stepErrors }));
    if (Object.keys(stepErrors).length > 0) return;
    const trimmed = [...form.workSteps];
    while (trimmed.length > 0 && !trimmed[trimmed.length - 1]?.step?.trim()) trimmed.pop();
    setForm((f) => ({ ...f, workSteps: trimmed }));
    updateRiskAssessment(riskIndex, { workSteps: trimmed });
    onSuccess();
  };

  // リスク評価ステップの「次へ」（本番 handleSubmitRisk）。回答のある行だけ保存する
  const submitRisk = (onSuccess) => {
    const riskErrors = validateRiskForm(rc, form.workSteps);
    setErrors((e) => ({ ...e, workSteps: riskErrors }));
    if (Object.keys(riskErrors).length > 0) return;
    updateRiskAssessment(riskIndex, { workSteps: filterAnsweredWorkSteps(rc, form.workSteps) });
    onSuccess();
  };

  // 指差呼称ステップの「次へ」（本番 validatePointingAndCalling）
  const validatePointingAndCalling = (onSuccess) => {
    const actionGoal = form.actionGoal ?? "";
    if (!actionGoal.trim()) {
      setErrors((e) => ({ ...e, actionGoal: "入力してください" }));
      return;
    }
    if (actionGoal.length > ACTION_GOAL_MAX_LENGTH) {
      setErrors((e) => ({ ...e, actionGoal: `${ACTION_GOAL_MAX_LENGTH}文字以下で入力してください` }));
      return;
    }
    setErrors((e) => ({ ...e, actionGoal: undefined }));
    updateRiskAssessment(riskIndex, { actionGoal });
    onSuccess();
  };

  // --- AI提案（デモ用の固定データ） ---
  const handleSuggestWorkSteps = () => {
    const suggestions = suggestWorkSteps(workContent, form.workSteps.length);
    setForm((f) => ({ ...f, workSteps: f.workSteps.map((ws, i) => ({ ...ws, step: suggestions[i] ?? "" })) }));
    setErrors((e) => ({ ...e, workSteps: {} }));
  };
  const currentStepNames = () => form.workSteps.map((ws) => ws.step).filter(Boolean);
  // 候補を受け取る（本番 receiveCandidates）。候補が1件なら流し込み、複数なら手順ごとに選ばせる
  const receiveCandidates = (received) => {
    if (!received?.length) return;
    updateRiskAssessment(riskIndex, { suggestionCandidates: received, selectedSuggestionCandidateIndexes: [] });
    setErrors((e) => ({ ...e, workSteps: {} }));
    if (received.length === 1) {
      setForm((f) => ({ ...f, workSteps: isCascade ? candidateToWorkSteps(received[0]) : applyCandidateToWorkSteps(f.workSteps, received[0]) }));
      return;
    }
    // 作業手順はどの候補でも同じ一覧に対する提案なので、選択対象にはせず先に埋める
    if (isCascade) setForm((f) => ({ ...f, workSteps: candidateWorkStepsWithoutRisk(received[0]) }));
  };
  const candidateCount = rc?.hasMultipleAiSuggestion ? 3 : 1;
  const handleSuggestRisks = () => receiveCandidates(suggestRiskCandidates(currentStepNames(), candidateCount));
  // 統合パターンには作業手順ページが無いので、手順とリスクを一度に作るカスケードサジェスト
  const handleCascadeRiskFetch = async () => {
    setCascadeLabel("手順検討中");
    await new Promise((r) => setTimeout(r, 600));
    const steps = suggestWorkSteps(workContent, Math.max(form.workSteps.length, minCount)).filter(Boolean);
    setCascadeLabel("リスク項目生成中");
    await new Promise((r) => setTimeout(r, 600));
    setCascadeLabel("AIで作成");
    return suggestRiskCandidates(steps, candidateCount);
  };
  const selectCandidateForStep = (stepIndex, candidateIndex) => {
    const candidate = candidates.find((c) => c.index === candidateIndex);
    if (!candidate) return;
    const stepName = form.workSteps[stepIndex]?.step;
    const item = stepName ? candidate.items.find((i) => i.workProcedure === stepName) : candidate.items[stepIndex];
    if (!item) return;
    setRisk(stepIndex, { dangerPoint: item.dangerPoint, countermeasure: item.counterMeasure, ...(item.scores ?? {}) });
    updateRiskAssessment(riskIndex, (prev) => {
      const selected = [...(prev.selectedSuggestionCandidateIndexes ?? [])];
      while (selected.length <= stepIndex) selected.push(null);
      selected[stepIndex] = candidateIndex;
      return { selectedSuggestionCandidateIndexes: selected };
    });
  };
  // 選んだ候補から入力を書き換えたら選択済みの表示を外す。入力欄の値はそのまま残す
  const clearCandidateForStep = (stepIndex) => {
    if (selectedCandidateIndexes[stepIndex] == null) return;
    updateRiskAssessment(riskIndex, (prev) => {
      const selected = [...(prev.selectedSuggestionCandidateIndexes ?? [])];
      selected[stepIndex] = null;
      return { selectedSuggestionCandidateIndexes: selected };
    });
  };

  const isWorkStepSection = section === "WorkStepInput";
  const isRiskAssessmentSection = section === "WorkRiskAssessment";
  const onNext = isWorkStepSection ? () => validateStepInput(goToNextStep) : isRiskAssessmentSection ? () => submitRisk(goToNextStep) : () => validatePointingAndCalling(goToNextStep);
  const onConfirm = isWorkStepSection ? () => validateStepInput(goToConfirmation) : isRiskAssessmentSection ? () => submitRisk(goToConfirmation) : () => validatePointingAndCalling(goToConfirmation);

  const headerAction = (() => {
    if (!showSuggest) return undefined;
    if (isWorkStepSection) return <SuggestButton onClick={handleSuggestWorkSteps} />;
    if (isRiskAssessmentSection && !hasCandidateOptions) {
      if (isCascade) {
        return (
          <SuggestButton onFetch={handleCascadeRiskFetch} onClick={receiveCandidates}>
            {cascadeLabel}
          </SuggestButton>
        );
      }
      return <SuggestButton onClick={handleSuggestRisks} />;
    }
    return undefined;
  })();

  return (
    <>
      <StepPaper title={title} headerAction={headerAction}>
        {isWorkStepSection && (
          <WorkStepInputSection workSteps={form.workSteps} minItemCount={minCount} maxItemCount={maxCount} errors={errors.workSteps} onChangeStep={setStep} onAddItem={addItem} onRemoveItem={removeItem} onMoveItem={moveItem} />
        )}
        {isRiskAssessmentSection && (
          <WorkRiskAssessmentSection
            workSteps={form.workSteps}
            riskCatalog={rc}
            isWithoutProcedure={isWithoutProcedure}
            showProcedureField={merged}
            procedureLabel={MERGED_PROCEDURE_LABEL}
            minItemCount={minCount}
            maxItemCount={maxCount}
            errors={errors.workSteps}
            onChangeStep={setStep}
            onChangeRisk={setRisk}
            onAddItem={addItem}
            onRemoveItem={removeItem}
            suggestionCandidates={showSuggest ? candidates : undefined}
            selectedCandidateIndexes={selectedCandidateIndexes}
            onSelectCandidate={showSuggest ? selectCandidateForStep : undefined}
            onClearCandidate={showSuggest ? clearCandidateForStep : undefined}
          />
        )}
        {section === "PointingAndCalling" && <PointingAndCallingSection value={form.actionGoal} onChange={(v) => setForm((f) => ({ ...f, actionGoal: v }))} error={errors.actionGoal} />}
      </StepPaper>
      {isTabletOrMobile ? (
        <SplitFab
          actions={[
            { label: "戻る", icon: <ArrowBackIcon />, onClick: goToPreviousStep },
            ...(showConfirmAction ? [{ label: "確定", icon: <CheckIcon />, onClick: onConfirm }] : []),
            { label: "次へ", icon: <ArrowForwardIcon />, onClick: onNext },
          ]}
        />
      ) : (
        <DesktopNavigation>
          <Button variant="outlined" sx={{ bgcolor: "white" }} onClick={goToPreviousStep}>
            戻る
          </Button>
          {showConfirmAction && (
            <Button variant="contained" onClick={onConfirm}>
              確定
            </Button>
          )}
          <Button variant="contained" onClick={onNext}>
            次へ
          </Button>
        </DesktopNavigation>
      )}
    </>
  );
}

// ---------- 確認ステップ ----------
// セクション見出し＋「修正画面に戻る」（本番 SectionDetail の確認画面用途）
function SectionHeader({ title, onEditClick }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, mb: 1 }}>
      <Typography component="span" variant="h6" noWrap sx={{ fontWeight: "bold" }}>
        {title}
      </Typography>
      <Button onClick={onEditClick} sx={{ whiteSpace: "nowrap", flexShrink: 0 }}>
        修正画面に戻る
      </Button>
    </Box>
  );
}

const LABEL_WIDTH = 160;

// 基本情報の確認（本番 CustomConfirmationBasicDetailSection）。グループごとに「項目名｜値」を並べる
function ConfirmationBasicDetails({ ctx, onPreviewImage }) {
  const { state, catalog, virtualSteps, goToStep } = ctx;
  const groups = catalog?.basicDetailCatalog?.groups ?? [];
  return (
    <Stack>
      <SectionHeader title={virtualSteps[0]?.stepperName ?? "基本情報"} onEditClick={() => goToStep(0)} />
      <Stack spacing={3}>
        {groups.map((group) => {
          const isNotUse = group.optional && !!state.groupNotUse?.[group.id];
          return (
            <Stack key={group.id} spacing={0}>
              {group.name && (
                <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: "bold" }}>
                  {group.name}
                  {isNotUse && (
                    <Typography component="span" variant="body2" color="text.disabled" sx={{ ml: 1 }}>
                      （該当なし）
                    </Typography>
                  )}
                </Typography>
              )}
              {!isNotUse &&
                (group.items ?? [])
                  .filter((item) => isItemVisible(item, state.formInputs))
                  .map((item) => {
                    if (item.type === "File") {
                      const files = state.fileInputs?.[item.id] ?? [];
                      return (
                        <Box key={item.id}>
                          <Typography variant="body2">{item.name}</Typography>
                          {files.length === 0 ? (
                            <Typography variant="body2">-</Typography>
                          ) : (
                            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, mt: 1 }}>
                              {files.map((f) => (
                                <Chip key={f.id} icon={<ImageIcon />} label={f.name} variant="outlined" onClick={() => onPreviewImage(f.path)} />
                              ))}
                            </Stack>
                          )}
                        </Box>
                      );
                    }
                    const copySchedule = item.internalUseType === "WorkDate" ? state.copySchedule : undefined;
                    return (
                      <Fragment key={item.id}>
                        <Stack direction="row" spacing={1}>
                          <Box sx={{ minWidth: LABEL_WIDTH, maxWidth: LABEL_WIDTH, flexShrink: 0, wordBreak: "break-word" }}>
                            <Typography variant="body2">{item.name}</Typography>
                          </Box>
                          <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                            {displayAnswer(item, state.formInputs[item.id]) || "-"}
                          </Typography>
                        </Stack>
                        {copySchedule && (
                          <Stack direction="row" spacing={1}>
                            <Box sx={{ minWidth: LABEL_WIDTH, maxWidth: LABEL_WIDTH, flexShrink: 0 }}>
                              <Typography variant="body2">(定期作成)</Typography>
                            </Box>
                            <Typography variant="body2">
                              {copySchedule.startAt} 〜 {copySchedule.endAt}
                            </Typography>
                          </Stack>
                        )}
                      </Fragment>
                    );
                  })}
            </Stack>
          );
        })}
      </Stack>
    </Stack>
  );
}

// リスク評価・指差呼称の確認（本番 CustomConfirmationRiskAssessmentSection）
function ConfirmationRiskAssessment({ ctx, riskCatalog, riskIndex }) {
  const { state, virtualSteps, goToStep } = ctx;
  const value = state.riskAssessments[riskIndex] ?? { workSteps: [] };
  const isWithoutProcedure = riskCatalog.assessmentType === "WithoutProcedure";
  const riskWorkSteps = value.workSteps.filter((ws) => (isWithoutProcedure ? !!ws.risk : !!ws.step && !!ws.risk));
  const risksStepIndex = virtualSteps.findIndex((s) => s.riskIndex === riskIndex && s.content === "WorkRiskAssessment");
  const pointingStepIndex = virtualSteps.findIndex((s) => s.riskIndex === riskIndex && s.content === "PointingAndCalling");
  return (
    <>
      {riskWorkSteps.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Stack>
            {/* リスク評価が複数あると「リスク評価」が並んで区別できないため、タイトル付きのステッパー用ラベルを見出しに使う */}
            <SectionHeader title={virtualSteps[risksStepIndex]?.stepperName ?? ""} onEditClick={() => goToStep(risksStepIndex)} />
            <CreateRiskAssessmentView
              items={riskWorkSteps.map((ws, index) => ({
                id: index,
                workName: isWithoutProcedure ? "" : ws.step,
                dangerPoint: ws.risk.dangerPoint,
                countermeasure: ws.risk.countermeasure,
                doubleSafety: ws.risk.doubleSafety,
                evaluation: { severity: ws.risk.severity, possibility: ws.risk.possibility },
                improvedEvaluation: { severity: ws.risk.improvedSeverity, possibility: ws.risk.improvedPossibility },
              }))}
              riskCatalog={riskCatalog}
              itemLabel={isMergedProcedure(riskCatalog) ? MERGED_PROCEDURE_LABEL : undefined}
            />
          </Stack>
        </>
      )}
      {riskCatalog.hasPointingAndCalling && value.actionGoal && (
        <>
          <Divider sx={{ my: 2 }} />
          <Stack>
            <SectionHeader title={virtualSteps[pointingStepIndex]?.stepperName ?? ""} onEditClick={() => goToStep(pointingStepIndex)} />
            <Stack spacing={1}>
              <Typography color="secondary">行動目標</Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {value.actionGoal}
              </Typography>
            </Stack>
          </Stack>
        </>
      )}
    </>
  );
}

// 確認画面（本番 CustomConfirmation + useCustomConfirmationSubmit）
function ConfirmationStep({ ctx }) {
  const { state, catalog, riskCatalogs, flow, title, sheet, goToPreviousStep, goToEntryStep, isTabletOrMobile } = ctx;
  const { createSheet, updateSheet, notify } = useKynext();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [previewSrc, setPreviewSrc] = useState(null);
  // 提出済みシートの修正だけ「更新」表記で、戻り先も確認画面へ入った位置に復帰させる
  const isUpdate = flow === "edit";
  const handleBack = isUpdate ? goToEntryStep : goToPreviousStep;

  const handleSubmit = () => {
    if (submitting) return;
    const allErrors = [...validateBasicItems(catalog, state).messages, ...validateAllRiskAssessments(riskCatalogs, state.riskAssessments)];
    if (allErrors.length > 0) {
      allErrors.slice(0, 3).forEach((m) => notify(m, "error"));
      return;
    }
    setSubmitting(true);
    const payload = {
      basicDetails: buildBasicDetails(catalog, state),
      riskAssessments: buildRiskAssessmentAnswers(riskCatalogs, state.riskAssessments),
      groupNotUse: state.groupNotUse ?? {},
      copySchedule: state.copySchedule ?? null,
    };
    let id;
    if (flow === "create") {
      id = createSheet(payload);
    } else if (flow === "provisional") {
      // 仮作成シートの本作成もシート自体は既に存在するので、そのシートへ書き込む
      id = createSheet({ ...payload, provisionalId: sheet.id });
    } else {
      updateSheet(sheet.id, payload);
      id = sheet.id;
    }
    clearDraft();
    notify(isUpdate ? "KYシートを更新しました" : "KYシートを提出しました");
    navigate(`/kynext/ky-sheets/${id}`);
  };

  return (
    <>
      <Dialog open={previewSrc !== null} onClose={() => setPreviewSrc(null)} maxWidth="md">
        {previewSrc && <Box component="img" src={previewSrc} alt="" sx={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }} />}
      </Dialog>
      <StepPaper title={title}>
        <Stack spacing={3}>
          <ConfirmationBasicDetails ctx={ctx} onPreviewImage={setPreviewSrc} />
          {riskCatalogs.map((riskCatalog, riskIndex) => (
            <ConfirmationRiskAssessment key={riskCatalog.id} ctx={ctx} riskCatalog={riskCatalog} riskIndex={riskIndex} />
          ))}
        </Stack>
      </StepPaper>
      {isTabletOrMobile ? (
        <SplitFab
          disabled={submitting}
          actions={[
            { label: "戻る", icon: <ArrowBackIcon />, onClick: handleBack },
            { label: isUpdate ? "更新" : "提出", icon: isUpdate ? <CheckIcon /> : <SendIcon />, onClick: handleSubmit },
          ]}
        />
      ) : (
        <DesktopNavigation>
          <Button variant="outlined" sx={{ bgcolor: "white" }} onClick={handleBack}>
            戻る
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            {isUpdate ? "更新" : "提出"}
          </Button>
        </DesktopNavigation>
      )}
    </>
  );
}

// ---------- フォーム本体 ----------
// 入力状態と現在ステップを持つ（本番 CustomKYNEXTSheetProvider）。
// 現在ステップは ?step=<virtualStep.id> で管理し、初回マウント時に無ければ replace で付ける
function SheetForm({ flow, catalog, sheet, initialState, initialStepIndex }) {
  const navigate = useNavigate();
  const isTabletOrMobile = useIsTabletOrMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const virtualSteps = useMemo(() => buildVirtualSteps(catalog), [catalog]);
  const stepIds = useMemo(() => virtualSteps.map((s) => s.id), [virtualSteps]);
  const riskCatalogs = useMemo(() => selectRiskCatalogs(catalog), [catalog]);

  // 新規作成フロー以外は initialState が必ず渡るため下書きを読まない。書き込みも新規作成だけ
  const isDraftEnabled = flow === "create";
  const [state, setStateRaw] = useState(() => {
    const loaded = initialState ?? (isDraftEnabled ? loadDraft() : null) ?? emptyState();
    // 作業日が未入力なら今日を入れておく（本番 useCustomKYNEXTSheetInputForm の Date 既定値）
    const workDateItem = findItemByInternalUseType(catalog, "WorkDate");
    const formInputs = workDateItem && !loaded.formInputs?.[workDateItem.id] ? { ...loaded.formInputs, [workDateItem.id]: TODAY } : loaded.formInputs;
    return { ...loaded, formInputs, riskAssessments: normalizeRiskAssessments(loaded.riskAssessments, riskCatalogs.length) };
  });
  const setState = useCallback(
    (updater) =>
      setStateRaw((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        if (isDraftEnabled) saveDraft(next);
        return next;
      }),
    [isDraftEnabled]
  );
  // patch は差分オブジェクトか、直前の値を受け取る関数。連続した候補選択などクリック時のクロージャが
  // 古い値を掴んだまま呼ばれる経路があるため、必ず関数型更新で書き込む（本番 updateRiskAssessment と同じ）
  const updateRiskAssessment = useCallback(
    (index, patch) =>
      setState((prev) => ({
        ...prev,
        riskAssessments: prev.riskAssessments.map((v, i) => (i === index ? { ...v, ...(typeof patch === "function" ? patch(v) : patch) } : v)),
      })),
    [setState]
  );

  useEffect(() => {
    if (searchParams.has(STEP_PARAM)) return;
    const initialId = stepIds[initialStepIndex ?? 0];
    if (!initialId) return;
    const next = new URLSearchParams(searchParams);
    next.set(STEP_PARAM, initialId);
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentStep = Math.max(stepIds.indexOf(searchParams.get(STEP_PARAM)), 0);
  const pushStep = useCallback(
    (index) => {
      const clamped = Math.min(Math.max(index, 0), stepIds.length - 1);
      const next = new URLSearchParams(searchParams);
      next.set(STEP_PARAM, stepIds[clamped]);
      setSearchParams(next);
      window.scrollTo?.({ top: 0 });
    },
    [searchParams, setSearchParams, stepIds]
  );
  // 最初のステップより前に戻るときは一覧（仮作成・修正は詳細）へ
  const exitPath = flow === "create" ? "/kynext" : `/kynext/ky-sheets/${sheet?.id}`;
  const goToPreviousStep = () => (currentStep <= 0 ? navigate(exitPath) : pushStep(currentStep - 1));
  const goToNextStep = () => pushStep(currentStep + 1);
  // 「確定」で確認画面へ飛ぶときは、確認画面の「戻る」で戻れるよう入ったステップを覚える
  const goToConfirmation = () => {
    setState((prev) => ({ ...prev, entryStep: currentStep }));
    pushStep(stepIds.length - 1);
  };
  const goToEntryStep = () => pushStep(state.entryStep ?? currentStep - 1);

  const current = virtualSteps[currentStep];
  const ctx = {
    state,
    setState,
    updateRiskAssessment,
    catalog,
    riskCatalogs,
    virtualSteps,
    flow,
    sheet,
    title: current?.name ?? "",
    isTabletOrMobile,
    goToNextStep,
    goToPreviousStep,
    goToConfirmation,
    goToEntryStep,
    goToStep: pushStep,
  };

  const content = (() => {
    switch (current?.content) {
      case "Custom":
        return <BasicDetailsStep ctx={ctx} />;
      case "Confirmation":
        return <ConfirmationStep ctx={ctx} />;
      case "WorkStepInput":
      case "WorkRiskAssessment":
      case "PointingAndCalling":
        // リスク評価をまたぐときだけ再マウントさせる（key）。同じリスク評価内では入力を引き継ぐ
        return <RiskFormStep key={current.riskIndex} ctx={ctx} section={current.content} riskIndex={current.riskIndex ?? 0} />;
      default:
        return null;
    }
  })();

  return (
    <Container maxWidth="xl">
      <Stack spacing={2} sx={{ alignItems: "center" }}>
        <FormStepper labels={virtualSteps.map((s) => s.stepperName)} activeStep={currentStep} />
        {content}
      </Stack>
    </Container>
  );
}

/**
 * 作成／修正フォームのエントリ。mode と location.state / シートのステータスからフローを決め、
 * 使うカタログ（新規・コピーは使用中テンプレート、修正・本作成はシート自身のカタログ）と初期状態を組み立てる。
 */
export default function KynextSheetForm({ mode = "create" }) {
  const { id } = useParams();
  const location = useLocation();
  const { catalog: currentCatalog, getSheet } = useKynext();

  const copyState = mode === "create" && location.state?.copy ? location.state : null;
  const targetSheet = mode === "edit" ? getSheet(id) : copyState ? getSheet(copyState.kynextSheet) : null;
  const flow = mode === "create" ? "create" : targetSheet?.status === "Provisional" ? "provisional" : "edit";
  const catalog = flow === "create" ? currentCatalog : targetSheet?.catalog;

  // 初期状態は最初のレンダーで確定させる（提出後にシートが変わっても入力中の値を上書きしない）
  const [initial] = useState(() => {
    if (mode === "edit" && targetSheet) {
      return { state: stateFromSheet(targetSheet), stepIndex: 0 };
    }
    if (copyState && targetSheet) {
      // コピーは入力済みの状態から始まるので確認画面を最初に見せる
      return { state: stateFromSheet(targetSheet, { overrideDateToToday: true }), stepIndex: buildVirtualSteps(currentCatalog).length - 1 };
    }
    return { state: undefined, stepIndex: 0 };
  });

  if (mode === "edit" && !targetSheet) {
    return (
      <Container maxWidth="xl">
        <Typography color="text.secondary">KYシートが見つかりませんでした</Typography>
      </Container>
    );
  }
  if (!catalog) {
    return (
      <Container maxWidth="xl">
        <Typography color="text.secondary">カタログが取得できませんでした</Typography>
      </Container>
    );
  }

  return <SheetForm key={`${flow}-${targetSheet?.id ?? "new"}`} flow={flow} catalog={catalog} sheet={mode === "edit" ? targetSheet : null} initialState={initial.state} initialStepIndex={initial.stepIndex} />;
}
