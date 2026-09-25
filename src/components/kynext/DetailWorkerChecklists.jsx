import { useNavigate } from "react-router-dom";
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Divider, IconButton, Paper, Stack, Tooltip, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteIcon from "@mui/icons-material/Delete";
import ClearIcon from "@mui/icons-material/Clear";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import UploadIcon from "@mui/icons-material/CloudUpload";
import { PHOTO_A, newId } from "../../kynextData.js";
import { useKynext } from "./KynextContext.jsx";
import { DisabledTooltip, RequiredMark, useConfirmDialog, useIsMobile, useIsTabletOrMobile } from "./KynextCommon.jsx";
import { DetailAccordionSection, GeneralConstructorButton, ItemGroupBlock, SignatureView, WorkRiskAssessmentDetail, useIsLargeFontSize } from "./DetailSections.jsx";
import { resolveWorkerCheckEntry } from "./DetailLib.js";

// 作業員チェックセクションの Paper id（スクロール誘導の目標。本番 WORKER_CHECKLISTS_SECTION_ID）
export const WORKER_CHECKLISTS_SECTION_ID = "worker-checklists-section";
const MAX_GROUP_PHOTOS = 3;

/**
 * 職長撮影写真（本番 GroupPhotoCapture）。
 * デモではカメラを起動できないので「撮影」「アップロード」でダミー画像（PHOTO_A）を追加する。
 */
function GroupPhotoCapture({ photos, disabledReason, onAdd, onDelete }) {
  const disabled = !!disabledReason;
  const canAddMore = photos.length < MAX_GROUP_PHOTOS;
  return (
    <Stack spacing={1}>
      {photos.length > 0 && (
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
          {photos.map((photo) => (
            <Paper key={photo.id} elevation={0} sx={{ position: "relative", display: "inline-block" }}>
              <Box component="img" src={photo.path} alt="集合写真" sx={{ width: 120, height: 120, objectFit: "cover", display: "block", borderRadius: 1 }} />
              {!disabled && (
                <IconButton
                  size="small"
                  onClick={() => onDelete(photo.id)}
                  className="no-print"
                  sx={{ position: "absolute", top: 2, right: 2, backgroundColor: "rgba(0,0,0,.5)", color: "#fff", p: "2px", "&:hover": { backgroundColor: "rgba(0,0,0,.7)" } }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              )}
            </Paper>
          ))}
        </Stack>
      )}
      {canAddMore && (
        <Stack direction="row" spacing={1} className="no-print">
          {disabled ? (
            <Tooltip title={disabledReason} arrow>
              <span>
                <Button variant="outlined" startIcon={<PhotoCameraIcon />} disabled>
                  撮影する
                </Button>
              </span>
            </Tooltip>
          ) : (
            <>
              <Button variant="outlined" startIcon={<PhotoCameraIcon />} onClick={onAdd}>
                撮影
              </Button>
              <Button variant="outlined" startIcon={<UploadIcon />} onClick={onAdd}>
                アップロード
              </Button>
            </>
          )}
        </Stack>
      )}
    </Stack>
  );
}

// 削除アイコン（本番 DeleteWorkerChecklistButton）。Accordion の開閉に伝播させない
function DeleteWorkerChecklistButton({ deniedReason, onDelete }) {
  return (
    <Tooltip title={deniedReason ?? ""} arrow>
      <span style={{ marginLeft: "auto" }} onClick={(e) => e.stopPropagation()} className="no-print">
        <IconButton color="error" disabled={!!deniedReason} onClick={onDelete} aria-label="作業員チェックを削除">
          <DeleteIcon />
        </IconButton>
      </span>
    </Tooltip>
  );
}

/**
 * 作業員ごとの行（本番 WorkerChecklistItem ＋ SignatureWithDelete）。
 * 見出し行: 署名（または氏名）・担当手順番号・写真・削除。
 * 開くとリスク評価（workerRiskAssessment があれば）とチェックリスト回答（項目名｜回答）。
 */
function WorkerChecklistItem({ checklist, catalogSlots, workerRiskCatalog, hasAnyPhoto, deleteDeniedReason, onDelete }) {
  const isTabletOrMobile = useIsTabletOrMobile();
  const isLarge = useIsLargeFontSize();
  const riskItems = checklist.workerRiskAssessment?.items ?? [];
  const hasItemGroups = catalogSlots.some((c) => (c.itemGroups?.length ?? 0) > 0);
  const hasContent = hasItemGroups || riskItems.length > 0;

  const header = (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0, width: "100%" }}>
      <SignatureView
        workerName={checklist.workerName}
        signaturePath={checklist.signature?.path}
        photoPath={checklist.photo?.path}
        showPhotoColumn={hasAnyPhoto}
        riskAssessmentItems={checklist.riskAssessmentItems}
      />
      <DeleteWorkerChecklistButton deniedReason={deleteDeniedReason} onDelete={onDelete} />
    </Stack>
  );

  if (!hasContent) return <Stack>{header}</Stack>;

  return (
    <Stack>
      <Accordion disableGutters elevation={0} sx={{ border: "1px solid", borderColor: "divider", "&:before": { display: "none" } }}>
        <AccordionSummary component="div" expandIcon={<ExpandMoreIcon />} sx={{ p: isTabletOrMobile ? 1 : undefined, "& .MuiAccordionSummary-content": { minWidth: 0 } }}>
          {header}
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            {riskItems.length > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                  リスク評価
                </Typography>
                <WorkRiskAssessmentDetail items={riskItems} riskCatalog={workerRiskCatalog} itemLabel="作業内容" />
                <Divider />
              </>
            )}
            {catalogSlots.map((slot, index) => (
              <Stack key={slot.id} spacing={1}>
                {catalogSlots.length > 1 && (
                  <>
                    {index > 0 && <Divider sx={{ borderBottomWidth: 3 }} />}
                    <Typography>{slot.name}</Typography>
                  </>
                )}
                {(slot.itemGroups ?? []).map((group) => (
                  <ItemGroupBlock key={group.id} group={group} values={checklist.answers ?? {}} notUse={checklist.groupNotUse ?? {}} isLarge={isLarge} isLast />
                ))}
              </Stack>
            ))}
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <DeleteWorkerChecklistButton deniedReason={deleteDeniedReason} onDelete={onDelete} />
            </Box>
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Stack>
  );
}

/**
 * 「作業員チェック」セクション（本番 WorkerChecklistsSection）。
 * 職長撮影写真（signatureCatalogV2.hasGroupPhoto のとき）、作業員ごとの行、右下に「サイン」。
 * サインは Completed なら「元請確認済みです」、今日の作業でなければ「本日の作業ではありません」で disabled。
 */
export function WorkerChecklistsSection({ sheet, perms }) {
  const navigate = useNavigate();
  const { setGroupPhotos, deleteWorkerChecklist, notify } = useKynext();
  const catalog = sheet.catalog;
  const catalogSlots = catalog?.workerChecklistCatalogSlots ?? [];
  const signatureCatalog = catalog?.signatureCatalogV2;
  const hasGroupPhoto = signatureCatalog?.hasGroupPhoto ?? false;
  const groupPhotoRequired = hasGroupPhoto && !(signatureCatalog?.groupPhotoOptional ?? true);
  const workerRiskCatalog = catalog?.workerRiskAssessmentCatalog ?? null;
  const entry = resolveWorkerCheckEntry(catalog);
  const hasAnyPhoto = sheet.workerChecklists.some((c) => c.photo?.path);

  // 削除確認（本番 useDeleteKYNEXTSheetWorkerChecklist）
  const deleteDialog = useConfirmDialog({ title: "作業員チェックリストを削除しますか？", children: "この操作は取り消せません。", color: "error" });
  const handleDelete = async (checklistId) => {
    const { accepted } = await deleteDialog.confirm();
    if (!accepted) return;
    deleteWorkerChecklist(sheet.id, checklistId);
    notify("作業員チェックリストを削除しました");
  };

  const groupPhotos = sheet.groupPhotos ?? [];
  const addGroupPhoto = () => {
    if (groupPhotos.length >= MAX_GROUP_PHOTOS) {
      notify(`写真は最大${MAX_GROUP_PHOTOS}枚までです`, "warning");
      return;
    }
    setGroupPhotos(sheet.id, [...groupPhotos, { id: newId(), name: `group_${groupPhotos.length + 1}.jpg`, path: PHOTO_A }]);
  };

  return (
    <>
      <DetailAccordionSection id={WORKER_CHECKLISTS_SECTION_ID} title="作業員チェック">
        <Stack spacing={1}>
          {hasGroupPhoto && (
            <>
              <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                職長撮影写真
                {groupPhotoRequired && <RequiredMark />}
              </Typography>
              {/* 職長撮影写真も作業員チェックの回答権限（元請確認済みなら不可）で判定する */}
              <GroupPhotoCapture photos={groupPhotos} disabledReason={perms.workerCheckDeniedReason} onAdd={addGroupPhoto} onDelete={(photoId) => setGroupPhotos(sheet.id, groupPhotos.filter((p) => p.id !== photoId))} />
            </>
          )}
          {sheet.workerChecklists.map((checklist) => (
            <WorkerChecklistItem
              key={checklist.id}
              checklist={checklist}
              catalogSlots={catalogSlots}
              workerRiskCatalog={workerRiskCatalog}
              hasAnyPhoto={hasAnyPhoto}
              deleteDeniedReason={perms.workerChecklistDeleteDeniedReason}
              onDelete={() => handleDelete(checklist.id)}
            />
          ))}
          {sheet.workerChecklists.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              作業員チェックはまだありません
            </Typography>
          )}
          {entry.hasEntry && (
            <Stack direction="row" spacing={2} className="no-print" sx={{ justifyContent: "flex-end", mt: 2 }}>
              <DisabledTooltip disabled={!!perms.workerCheckDeniedReason} title={perms.workerCheckDeniedReason ?? ""}>
                <Button variant="contained" disabled={!!perms.workerCheckDeniedReason} onClick={() => navigate(`/kynext/ky-sheets/${sheet.id}/worker-check/${entry.suffix}`)}>
                  サイン
                </Button>
              </DisabledTooltip>
            </Stack>
          )}
        </Stack>
      </DetailAccordionSection>
      {deleteDialog.renderDialog()}
    </>
  );
}

/**
 * 職長チェックリストのセクション群（本番 ChecklistsSection ＋ ChecklistResult）。
 * forepersonChecklistCatalogs ごとに1セクション。回答済みなら項目名｜回答＋確認者の署名、未回答なら「未実施」＋「確認する」。
 * デモの回答（forepersonChecklistAnswer）は1件なので、先頭のカタログに紐づける。
 */
export function ForepersonChecklistsSection({ sheet, perms }) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isLarge = useIsLargeFontSize();
  const catalogs = sheet.catalog?.forepersonChecklistCatalogs ?? [];
  const guestCreated = sheet.createSourceType === "ConstructionGuestUser";

  return catalogs.map((cat, index) => {
    const answer = index === 0 ? sheet.forepersonChecklistAnswer : null;
    const isAnswered = !!answer?.answeredAt;
    const itemGroups = cat.itemGroups ?? [];
    return (
      <DetailAccordionSection key={cat.id} title={cat.name}>
        <Stack spacing={2}>
          {isAnswered ? (
            <>
              {itemGroups.map((group, i) => (
                <ItemGroupBlock key={group.id} group={group} values={answer.answers ?? {}} notUse={answer.groupNotUse ?? {}} isLarge={isLarge} isLast={i === itemGroups.length - 1} />
              ))}
              {cat.hasSignature && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Stack direction={isMobile ? "column" : "row"}>
                    <Box sx={{ mb: isMobile ? 0 : 1, width: "100%" }}>
                      <Typography variant="h5" sx={{ fontSize: 17, fontWeight: 700 }}>
                        確認者
                      </Typography>
                    </Box>
                    <Box sx={{ width: "100%" }}>
                      <SignatureView workerName={answer.answerer?.name ?? ""} signaturePath={answer.signature?.path} />
                    </Box>
                  </Stack>
                </>
              )}
            </>
          ) : (
            <>
              <Typography>未実施</Typography>
              {!guestCreated && (
                <Box sx={{ display: "flex", justifyContent: "flex-end" }} className="no-print">
                  <DisabledTooltip disabled={!!perms.checklistAnswerDeniedReason} title={perms.checklistAnswerDeniedReason ?? ""}>
                    <Button variant="contained" disabled={!!perms.checklistAnswerDeniedReason} onClick={() => navigate(`/kynext/ky-sheets/${sheet.id}/checklists/${cat.id}`)}>
                      確認する
                    </Button>
                  </DisabledTooltip>
                </Box>
              )}
            </>
          )}
        </Stack>
      </DetailAccordionSection>
    );
  });
}

/**
 * 元請からの安全指示セクション（本番 SafetyInstructionsSection）。
 * 見出しは workflowCatalog.safetyInstructionLabel。本文が無ければ「未入力」。元請なら右下に「入力する」/「編集する」。
 */
export function SafetyInstructionsSection({ sheet, perms }) {
  const navigate = useNavigate();
  const wf = sheet.catalog?.workflowCatalog;
  const title = wf?.safetyInstructionLabel || "元請からの安全指示";
  const instruction = sheet.safetyInstruction?.safetyInstruction;
  const isEdited = !!sheet.safetyInstruction;
  return (
    <DetailAccordionSection title={title}>
      <Stack sx={{ width: "100%" }}>
        <Box>{instruction ? <Typography sx={{ whiteSpace: "pre-line", mb: 2 }}>{instruction}</Typography> : <Typography>未入力</Typography>}</Box>
        {perms.safetyInstructionEditable && (
          <Stack direction="row" spacing={2} className="no-print" sx={{ justifyContent: "flex-end", mt: 4 }}>
            <GeneralConstructorButton onClick={() => navigate(`/kynext/ky-sheets/${sheet.id}/safety-instructions`)}>{isEdited ? "編集する" : "入力する"}</GeneralConstructorButton>
          </Stack>
        )}
      </Stack>
    </DetailAccordionSection>
  );
}
