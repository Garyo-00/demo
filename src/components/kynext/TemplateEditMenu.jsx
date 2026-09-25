import { useEffect, useState } from "react";
import { Box, Button, Checkbox, FormControlLabel, Stack, TextField, Tooltip, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import { BLOCK_LABELS } from "../../kynextData.js";
import { useConfirmDialog } from "./KynextCommon.jsx";
import { BlockMenuGrid, H5_SX, TemplateBlockLayout } from "./TemplateBlockLayout.jsx";

// ===== テンプレート詳細／編集のブロック一覧（本番 TemplateEditMenu / RiskAssessmentBlockMenu / WorkerSignBlockMenu） =====

// カタログから各ブロックの使用状況を求める（本番 useTemplateEditForm の has*Catalog）
export const blockUsage = (catalog) => ({
  "risk-assessments": (catalog.safetyRiskAssessmentCatalogs ?? []).length > 0,
  "risk-assessment": (catalog.safetyRiskAssessmentCatalogs ?? []).length > 0,
  "quality-risk-assessment": (catalog.qualityRiskAssessmentCatalogs ?? []).length > 0,
  "other-risk-assessment": (catalog.otherRiskAssessmentCatalogs ?? []).length > 0,
  "foreperson-checklist": (catalog.forepersonChecklistCatalogs ?? []).length > 0,
  "worker-risk-assessment": catalog.workerRiskAssessmentCatalog != null,
});

// 基本設定（定期作成を許可）。編集時は「更新」で即時保存する。
function BasicSettingsSection({ canScheduleCopy, onUpdate, onEdit }) {
  const [value, setValue] = useState(!!canScheduleCopy);
  useEffect(() => setValue(!!canScheduleCopy), [canScheduleCopy]);
  const editable = !!onUpdate;
  return (
    <>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
        <Typography variant="h5" sx={H5_SX}>
          基本設定
        </Typography>
        {onEdit && (
          <Button variant="text" onClick={onEdit}>
            基本設定・使用ブロックを編集する
          </Button>
        )}
      </Stack>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 2 }}>
        <FormControlLabel control={<Checkbox checked={value} disabled={!editable} onChange={(_, c) => setValue(c)} />} label="定期作成を許可" />
        {editable && (
          <Button variant="contained" size="small" disabled={value === !!canScheduleCopy} onClick={() => onUpdate({ canScheduleCopy: value })}>
            更新
          </Button>
        )}
      </Stack>
    </>
  );
}

/**
 * ブロック一覧（activeBlock=null のとき）。
 * readOnly … 詳細表示。ブロックのボタンで各ブロックを開き、下部にエクスポート／削除。
 * 編集 … テンプレート名の変更、基本設定、任意ブロックの削除／新規作成。
 */
export function TemplateEditMenu({ template, readOnly, canEdit, onSelectBlock, onEdit, onBack, onUpdateName, onUpdateBasicSettings, onCreateBlock, onDeleteBlock, onExport, onDelete, deleteDisabledReason }) {
  const { name: templateName, isExternal, catalog } = template;
  const usage = blockUsage(catalog);

  const [nameInput, setNameInput] = useState(templateName ?? "");
  useEffect(() => setNameInput(templateName ?? ""), [templateName]);
  const trimmed = nameInput.trim();
  const nameError = trimmed.length === 0 ? "入力してください" : nameInput.length > 20 ? "20文字以内で入力してください" : undefined;
  const canUpdateName = !nameError && nameInput !== templateName;

  const deleteRisk = useConfirmDialog({ title: "リスク評価ブロックの削除", children: "リスク評価ブロックを削除すると、リスク評価ブロックのデータは消えてしまいますがよろしいですか？" });
  const deleteForeperson = useConfirmDialog({ title: "職長チェックリストブロックの削除", children: "職長チェックリストブロックを削除してよろしいですか？" });

  const blocks = [
    { key: "basic-details", label: BLOCK_LABELS["basic-details"], required: true },
    { key: "risk-assessments", label: BLOCK_LABELS["risk-assessments"], inUse: usage["risk-assessments"] },
    { key: "foreperson-checklist", label: BLOCK_LABELS["foreperson-checklist"], inUse: usage["foreperson-checklist"] },
    { key: "worker-sign", label: BLOCK_LABELS["worker-sign"], required: true },
    { key: "general-contractor-check", label: BLOCK_LABELS["general-contractor-check"], required: true },
  ];

  const handleDelete = async (key) => {
    const dialog = key === "risk-assessments" ? deleteRisk : deleteForeperson;
    const { accepted } = await dialog.confirm();
    if (accepted) onDeleteBlock(key);
  };

  return (
    <>
      <TemplateBlockLayout
        templateName={templateName}
        isExternal={isExternal}
        endAction={
          onBack ? (
            <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={onBack}>
              戻る
            </Button>
          ) : undefined
        }
      >
        {!readOnly && (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "flex-start" }, mb: 3 }}>
            <TextField label="テンプレート名" size="small" value={nameInput} onChange={(e) => setNameInput(e.target.value)} error={!!nameError} helperText={nameError} sx={{ flexGrow: 1 }} />
            <Button variant="contained" disabled={!canUpdateName} onClick={() => onUpdateName(trimmed)} sx={{ mt: { sm: 0.5 }, whiteSpace: "nowrap" }}>
              テンプレート名変更
            </Button>
          </Stack>
        )}
        <BasicSettingsSection canScheduleCopy={catalog.canScheduleCopy} onUpdate={readOnly ? undefined : onUpdateBasicSettings} onEdit={readOnly && canEdit ? onEdit : undefined} />
        <BlockMenuGrid blocks={blocks} readOnly={readOnly} onSelect={readOnly ? onSelectBlock : undefined} onDelete={handleDelete} onCreate={onCreateBlock} />
        {readOnly && (
          <Stack spacing={2} sx={{ alignItems: "flex-end", mt: 2 }}>
            <Stack direction="row" spacing={2}>
              <Button variant="contained" color="success" startIcon={<DownloadIcon />} onClick={onExport}>
                エクスポート
              </Button>
              {onDelete && (
                <Tooltip title={deleteDisabledReason ?? ""}>
                  <span>
                    <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={onDelete} disabled={!!deleteDisabledReason}>
                      {isExternal ? "一覧から削除" : "削除"}
                    </Button>
                  </span>
                </Tooltip>
              )}
            </Stack>
          </Stack>
        )}
      </TemplateBlockLayout>
      {deleteRisk.renderDialog()}
      {deleteForeperson.renderDialog()}
    </>
  );
}

/**
 * リスク評価ブロックの中間ページ。安全KY（必須）・品質KY・その他KY（任意）を並べる。
 */
export function RiskAssessmentBlockMenu({ catalog, readOnly, onSelectBlock, onEdit, onCreateBlock, onDeleteBlock }) {
  const usage = blockUsage(catalog);
  const [pending, setPending] = useState(null);
  const label = pending ? BLOCK_LABELS[pending] : "";
  const { confirm, renderDialog } = useConfirmDialog({ title: `${label}の削除`, children: `${label}を削除すると、設定したデータは消えてしまいますがよろしいですか？` });

  const blocks = [
    { key: "risk-assessment", label: BLOCK_LABELS["risk-assessment"], required: true },
    { key: "quality-risk-assessment", label: BLOCK_LABELS["quality-risk-assessment"], inUse: usage["quality-risk-assessment"] },
    { key: "other-risk-assessment", label: BLOCK_LABELS["other-risk-assessment"], inUse: usage["other-risk-assessment"] },
  ];

  const handleDelete = async (key) => {
    setPending(key);
    const { accepted } = await confirm();
    if (accepted) onDeleteBlock(key);
  };

  return (
    <>
      <BlockMenuGrid blocks={blocks} readOnly={readOnly} onSelect={readOnly ? onSelectBlock : undefined} onDelete={handleDelete} onCreate={onCreateBlock} onEdit={onEdit} />
      {renderDialog()}
    </>
  );
}

/**
 * 作業員サインブロックの中間ページ。リスク評価ブロック（任意）とチェックリストブロック（必須）。
 */
export function WorkerSignBlockMenu({ catalog, readOnly, onSelectBlock, onEdit, onCreateBlock, onDeleteBlock }) {
  const usage = blockUsage(catalog);
  const { confirm, renderDialog } = useConfirmDialog({ title: "リスク評価ブロックの削除", children: "リスク評価ブロックを削除すると、リスク評価ブロックのデータは消えてしまいますがよろしいですか？" });
  const blocks = [
    { key: "worker-risk-assessment", label: "リスク評価ブロック", inUse: usage["worker-risk-assessment"] },
    { key: "worker-checklist", label: "チェックリストブロック", required: true },
  ];
  const handleDelete = async (key) => {
    const { accepted } = await confirm();
    if (accepted) onDeleteBlock(key);
  };
  return (
    <>
      <BlockMenuGrid blocks={blocks} readOnly={readOnly} onSelect={readOnly ? onSelectBlock : undefined} onDelete={handleDelete} onCreate={onCreateBlock} onEdit={onEdit} />
      {renderDialog()}
    </>
  );
}

// ブロック一覧・中間ページの共通ヘッダ（見出し＋右の戻るボタン）
export function TemplateMenuHeader({ title, backLabel, onBack }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
      <Typography variant="h4" sx={{ fontSize: 22, fontWeight: 700 }}>
        {title}
      </Typography>
      {onBack && (
        <Button startIcon={<ArrowBackIcon />} onClick={onBack}>
          {backLabel}
        </Button>
      )}
    </Box>
  );
}
