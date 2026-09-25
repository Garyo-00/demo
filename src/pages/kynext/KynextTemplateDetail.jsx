import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Alert, Box, Button, Container, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import { useKynext } from "../../components/kynext/KynextContext.jsx";
import { useConfirmDialog } from "../../components/kynext/KynextCommon.jsx";
import { BLOCK_LABELS, QUALITY_RISK_CATALOG, SAFETY_RISK_CATALOG, WORKER_RISK_CATALOG, emptyForepersonChecklist, emptyWorkerChecklist, newId } from "../../kynextData.js";
import { TemplateBlockLayout } from "../../components/kynext/TemplateBlockLayout.jsx";
import { RiskAssessmentBlockMenu, TemplateEditMenu, TemplateMenuHeader, WorkerSignBlockMenu, blockUsage } from "../../components/kynext/TemplateEditMenu.jsx";
import { TemplateSheetItemsBlock } from "../../components/kynext/TemplateSheetItemsBlock.jsx";
import { RISK_BLOCK_CONFIG, TemplateRiskAssessmentBlock, isRiskBlockKey } from "../../components/kynext/TemplateRiskAssessmentBlock.jsx";
import { TemplateChecklistBlock } from "../../components/kynext/TemplateChecklistBlock.jsx";
import { TemplateWorkerChecklistBlock } from "../../components/kynext/TemplateWorkerChecklistBlock.jsx";
import { TemplateGeneralContractorCheckBlock } from "../../components/kynext/TemplateGeneralContractorCheckBlock.jsx";

// ===== テンプレート詳細／編集（本番 pages/templates/[template] と [template]/edit → TemplateEditPage） =====
// URL: /kynext/templates/:template（詳細）／/kynext/templates/:template/edit（編集）。
// ?block= で開くブロック、?tab= でブロック内のタブを指定する（本番 useTemplateEditPage / useTabSearchParam）。
// 編集内容はページ内 state（draft）に持ち、「保存」で updateTemplate する。
// ブロックの新規作成・削除、テンプレート名、基本設定はその場で updateTemplate する（本番も個別の mutation）。

const deepCopy = (v) => JSON.parse(JSON.stringify(v));
const BLOCK_KEYS = Object.keys(BLOCK_LABELS);

// 種別ごとのリスク評価カタログの置き場（本番 riskAssessmentCatalogs(types:)）
const RISK_LIST_KEY = {
  "risk-assessment": "safetyRiskAssessmentCatalogs",
  "quality-risk-assessment": "qualityRiskAssessmentCatalogs",
  "other-risk-assessment": "otherRiskAssessmentCatalogs",
};
const RISK_DEFAULT = {
  "risk-assessment": () => ({ ...deepCopy(SAFETY_RISK_CATALOG), id: newId() }),
  "quality-risk-assessment": () => ({ ...deepCopy(QUALITY_RISK_CATALOG), id: newId() }),
  "other-risk-assessment": () => ({ ...deepCopy(SAFETY_RISK_CATALOG), id: newId(), type: "Other", title: "", hasPointingAndCalling: false, hasMultipleAiSuggestion: false, dangerPointLabel: "どんなリスクがあるか" }),
};

// ブロックの新規作成／削除をカタログに適用する
const createBlockIn = (catalog, key) => {
  const c = deepCopy(catalog);
  if (key === "risk-assessments") c.safetyRiskAssessmentCatalogs = [RISK_DEFAULT["risk-assessment"]()];
  else if (isRiskBlockKey(key)) c[RISK_LIST_KEY[key]] = [RISK_DEFAULT[key]()];
  else if (key === "foreperson-checklist") c.forepersonChecklistCatalogs = [emptyForepersonChecklist()];
  else if (key === "worker-risk-assessment") c.workerRiskAssessmentCatalog = { ...deepCopy(WORKER_RISK_CATALOG), id: newId() };
  return c;
};
const deleteBlockIn = (catalog, key) => {
  const c = deepCopy(catalog);
  if (key === "risk-assessments") {
    c.safetyRiskAssessmentCatalogs = [];
    c.qualityRiskAssessmentCatalogs = [];
    c.otherRiskAssessmentCatalogs = [];
  } else if (isRiskBlockKey(key)) c[RISK_LIST_KEY[key]] = [];
  else if (key === "foreperson-checklist") c.forepersonChecklistCatalogs = [];
  else if (key === "worker-risk-assessment") c.workerRiskAssessmentCatalog = null;
  return c;
};

// 各ブロックの見出し（本番 TemplateEditPage の blockName / backLabel）
const blockTitle = (key) => {
  if (key === "worker-checklist") return "作業員サインブロック > チェックリストブロック";
  if (key === "worker-risk-assessment") return "作業員サインブロック > リスク評価ブロック";
  if (isRiskBlockKey(key)) return `${BLOCK_LABELS["risk-assessments"]} > ${BLOCK_LABELS[key]}`;
  return BLOCK_LABELS[key];
};
// 未作成（任意ブロックがカタログに無い）か
const isBlockMissing = (key, usage) => (isRiskBlockKey(key) && !usage[key]) || (key === "foreperson-checklist" && !usage["foreperson-checklist"]) || (key === "worker-risk-assessment" && !usage["worker-risk-assessment"]);
const parentOf = (key) => (key === "worker-checklist" || key === "worker-risk-assessment" ? "worker-sign" : isRiskBlockKey(key) ? "risk-assessments" : null);

export default function KynextTemplateDetail({ readOnly: readOnlyProp = false }) {
  const { template: templateParam } = useParams();
  const { me, getTemplate } = useKynext();
  const template = getTemplate(templateParam);

  if (!me.templateEditable) {
    return (
      <Container maxWidth="lg">
        <Alert severity="warning" action={<Button component={RouterLink} to="/kynext" color="inherit" size="small">一覧へ</Button>}>
          テンプレートを編集する権限がありません
        </Alert>
      </Container>
    );
  }
  if (!template) {
    return (
      <Container maxWidth="lg">
        <Alert severity="warning" action={<Button component={RouterLink} to="/kynext/templates" color="inherit" size="small">テンプレート一覧へ</Button>}>
          テンプレートが見つかりません
        </Alert>
      </Container>
    );
  }
  // 保存でバージョンが上がったら draft を取り直す（key でリセット）
  return <TemplateEditor key={`${template.id}-${template.latestCatalog?.version}`} template={template} readOnlyProp={readOnlyProp} />;
}

function TemplateEditor({ template, readOnlyProp }) {
  const navigate = useNavigate();
  const { settings, projectTemplateIds, updateTemplate, deleteTemplate, notify } = useKynext();
  const [searchParams, setSearchParams] = useSearchParams();
  const id = template.id;

  // 一括適用されたテンプレート（元請）は編集不可。編集 URL を直接開いても詳細表示にする（本番 permissions.editable）
  const canEdit = !template.isExternal;
  const readOnly = readOnlyProp || !canEdit;

  const [draft, setDraft] = useState(() => deepCopy(template.catalog));
  const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(template.catalog), [draft, template.catalog]);

  const blockParam = searchParams.get("block");
  const activeBlock = blockParam && BLOCK_KEYS.includes(blockParam) ? blockParam : null;
  const setActiveBlock = (block) =>
    setSearchParams(
      (prev) => {
        if (block) prev.set("block", block);
        else prev.delete("block");
        prev.delete("tab");
        return prev;
      },
      { replace: true }
    );
  const query = searchParams.toString();
  const blockQuery = query ? `?${query}` : "";

  // 未保存の変更があるときに離れる前の確認（本番 useNavigationBlock）
  const leave = (to) => {
    if (!readOnly && isDirty && !window.confirm("変更内容が保存されていません。\nページを離れますか?")) return;
    navigate(to);
  };

  const menuTitle = readOnly ? "テンプレート詳細" : "テンプレート編集";

  // 編集時に未作成のブロックを直接開いたら、空の既定値を用意して編集を始める（本番 createEmptyRiskAssessment などの既定値）
  const needsDefault = !readOnly && activeBlock != null && isBlockMissing(activeBlock, blockUsage(draft));
  useEffect(() => {
    if (needsDefault) setDraft((d) => createBlockIn(d, activeBlock));
  }, [needsDefault, activeBlock]);

  // 一括適用されたテンプレートの編集 URL を開いたときの案内（本番 permissions.editable.deniedReason）
  const externalNotice = readOnlyProp || canEdit ? null : <Alert severity="info">一括適用されたテンプレートは編集できません</Alert>;

  // --- その場で保存する操作（本番も個別 mutation） ---
  const patchCatalog = (fn, message = "テンプレートを更新しました") => {
    updateTemplate(id, (t) => ({ ...t, catalog: fn(t.catalog) }));
    notify(message);
  };
  const handleUpdateName = (name) => {
    updateTemplate(id, (t) => ({ ...t, name }));
    notify("テンプレート名を更新しました");
  };
  const handleCreateBlock = (key) => {
    patchCatalog((c) => createBlockIn(c, key));
    navigate(`/kynext/templates/${id}/edit?block=${key === "risk-assessments" ? "risk-assessment" : key}`);
  };
  const handleDeleteBlock = (key) => patchCatalog((c) => deleteBlockIn(c, key));

  // --- 削除・エクスポート（本番 useTemplateEditPage） ---
  const deleteDialog = useConfirmDialog({ title: "テンプレート削除", children: "削除すると元に戻せませんがよろしいですか？", yesLabel: "削除", color: "error" });
  const usedByOtherProject = Object.values(projectTemplateIds).includes(id);
  const deleteDisabledReason = template.isExternal ? undefined : settings.currentTemplateId === id ? "適用中のテンプレートです" : usedByOtherProject ? "他の現場で設定されているため削除できません" : undefined;
  const handleDelete = async () => {
    const { accepted } = await deleteDialog.confirm();
    if (!accepted) return;
    deleteTemplate(id);
    notify("テンプレートを削除しました");
    navigate("/kynext/templates");
  };
  const handleExport = () => {
    // 本番は presigned URL の JSON を取得して保存する。デモではカタログをそのまま JSON にして落とす。
    const json = { name: template.name, version: template.latestCatalog?.version ?? 1, catalog: template.catalog };
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `KYNEXTテンプレート_${template.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- 保存（ブロック内の編集をまとめて反映） ---
  const handleSave = () => {
    updateTemplate(id, (t) => ({ ...t, catalog: draft }));
    notify("テンプレートを更新しました");
  };

  // ---------- ブロック一覧 ----------
  if (activeBlock === null) {
    return (
      <Container maxWidth="lg">
        <Stack spacing={2}>
          <TemplateMenuHeader title={menuTitle} backLabel="テンプレート一覧に戻る" onBack={readOnly ? () => navigate("/kynext/templates") : undefined} />
          {externalNotice}
          <TemplateEditMenu
            template={template}
            readOnly={readOnly}
            canEdit={canEdit}
            onSelectBlock={setActiveBlock}
            onEdit={() => navigate(`/kynext/templates/${id}/edit`)}
            onBack={readOnly ? undefined : () => navigate(`/kynext/templates/${id}`)}
            onUpdateName={handleUpdateName}
            onUpdateBasicSettings={(s) => patchCatalog((c) => ({ ...c, ...s }))}
            onCreateBlock={handleCreateBlock}
            onDeleteBlock={handleDeleteBlock}
            onExport={handleExport}
            onDelete={handleDelete}
            deleteDisabledReason={deleteDisabledReason}
          />
        </Stack>
        {deleteDialog.renderDialog()}
      </Container>
    );
  }

  // ---------- 中間ページ（リスク評価ブロック／作業員サインブロック） ----------
  if (activeBlock === "risk-assessments" || activeBlock === "worker-sign") {
    const Menu = activeBlock === "risk-assessments" ? RiskAssessmentBlockMenu : WorkerSignBlockMenu;
    return (
      <Container maxWidth="lg">
        <Stack spacing={2}>
          <TemplateMenuHeader title={menuTitle} backLabel="ブロック一覧に戻る" onBack={() => setActiveBlock(null)} />
          {externalNotice}
          <TemplateBlockLayout templateName={template.name} blockName={BLOCK_LABELS[activeBlock]} isExternal={template.isExternal}>
            <Menu
              catalog={template.catalog}
              readOnly={readOnly}
              onSelectBlock={setActiveBlock}
              onEdit={canEdit ? () => navigate(`/kynext/templates/${id}/edit?block=${activeBlock}`) : undefined}
              onCreateBlock={handleCreateBlock}
              onDeleteBlock={handleDeleteBlock}
            />
          </TemplateBlockLayout>
        </Stack>
      </Container>
    );
  }

  // ---------- 各ブロックの中身（本番 TemplateEditBlockView） ----------
  const parent = parentOf(activeBlock);
  const backLabel = parent ? `${BLOCK_LABELS[parent]}に戻る` : "ブロック一覧に戻る";
  const onBack = parent ? () => setActiveBlock(parent) : readOnly ? () => setActiveBlock(null) : () => leave(`/kynext/templates/${id}`);
  const usage = blockUsage(draft);
  const missing = isBlockMissing(activeBlock, usage);

  const setRisk = (key, next) => setDraft((d) => ({ ...d, [RISK_LIST_KEY[key]]: [next] }));

  const content = missing ? (
    <Typography color="text.secondary">このブロックは未作成です。</Typography>
  ) : activeBlock === "basic-details" ? (
    <TemplateSheetItemsBlock catalog={draft.basicDetailCatalog} onChange={(next) => setDraft((d) => ({ ...d, basicDetailCatalog: next }))} readOnly={readOnly} />
  ) : isRiskBlockKey(activeBlock) ? (
    <TemplateRiskAssessmentBlock rc={draft[RISK_LIST_KEY[activeBlock]][0]} onChange={(next) => setRisk(activeBlock, next)} readOnly={readOnly} config={RISK_BLOCK_CONFIG[activeBlock]} />
  ) : activeBlock === "foreperson-checklist" ? (
    <TemplateChecklistBlock checklists={draft.forepersonChecklistCatalogs} onChange={(next) => setDraft((d) => ({ ...d, forepersonChecklistCatalogs: next }))} readOnly={readOnly} />
  ) : activeBlock === "worker-checklist" ? (
    <TemplateWorkerChecklistBlock slots={draft.workerChecklistCatalogSlots ?? []} signatureCatalog={draft.signatureCatalogV2} onChange={({ slots, signatureCatalog }) => setDraft((d) => ({ ...d, workerChecklistCatalogSlots: slots, signatureCatalogV2: signatureCatalog }))} readOnly={readOnly} />
  ) : activeBlock === "worker-risk-assessment" ? (
    <TemplateRiskAssessmentBlock rc={draft.workerRiskAssessmentCatalog} onChange={(next) => setDraft((d) => ({ ...d, workerRiskAssessmentCatalog: next }))} readOnly={readOnly} config={RISK_BLOCK_CONFIG["worker-risk-assessment"]} />
  ) : activeBlock === "general-contractor-check" ? (
    <TemplateGeneralContractorCheckBlock workflow={draft.workflowCatalog} onChange={(next) => setDraft((d) => ({ ...d, workflowCatalog: next }))} readOnly={readOnly} />
  ) : null;

  const endAction =
    readOnly && canEdit ? (
      <Button variant="contained" color="success" startIcon={<EditIcon />} onClick={() => navigate(`/kynext/templates/${id}/edit${blockQuery}`)}>
        編集
      </Button>
    ) : !readOnly ? (
      <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={() => leave(`/kynext/templates/${id}${blockQuery}`)}>
        戻る
      </Button>
    ) : undefined;

  return (
    <Container maxWidth="lg">
      <Stack spacing={2}>
        <TemplateMenuHeader title={menuTitle} backLabel={backLabel} onBack={onBack} />
        {externalNotice}
        <TemplateBlockLayout templateName={template.name} blockName={blockTitle(activeBlock)} isExternal={template.isExternal} endAction={endAction} paperSx={{ position: "relative" }}>
          <Stack spacing={2}>
            {content}
            {!readOnly && (
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={!isDirty}>
                  保存
                </Button>
              </Box>
            )}
          </Stack>
        </TemplateBlockLayout>
      </Stack>
    </Container>
  );
}
