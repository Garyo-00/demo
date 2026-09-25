import { Fragment, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Dialog,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ImageIcon from "@mui/icons-material/Image";
import { SYMBOL_MAP, displayAnswer, evaluationOf, fmtDate, isItemVisible, isMergedProcedure, riskSectionTitle, selectRiskCatalogs } from "../../kynextData.js";
import { useKynext } from "./KynextContext.jsx";
import { DisabledTooltip, InfoRow, LABEL_COLUMN_WIDTH, StatusChip, useIsMobile, useIsTabletOrMobile } from "./KynextCommon.jsx";
import { RiskCalculationModal } from "./RiskCalculationModal.jsx";
import { circledNumber } from "./DetailLib.js";

// ===== KYシート詳細のセクション部品（本番 features/kySheet/detail/*） =====

// 文字サイズ「大」のときは項目名｜値を縦並びにする（本番 useIsLargeFontSize）
export const useIsLargeFontSize = () => useKynext().fontSize === "large";

// 元請の操作ボタン（本番 GeneralConstructorButton。緑系で元請アクションを区別する）
export function GeneralConstructorButton({ sx, children, ...rest }) {
  return (
    <Button variant="contained" {...rest} sx={{ backgroundColor: "#78A75A", "&:hover": { backgroundColor: "#568538" }, ...sx }}>
      {children}
    </Button>
  );
}

// 署名画像（本番 ConfirmSection / Signature の img スタイル）
export const SIGNATURE_IMG_STYLE = { width: 200, height: 50, border: "1px solid #000", display: "block", background: "#fff" };

/**
 * 詳細画面の大枠（本番 DetailAccordionSection）。
 * Paper（PC は幅 80%、タブレット以下は 100%）の中に Accordion。見出しは h4 ＋ ステータス ＋ ゲストChip。
 */
export function DetailAccordionSection({ id, title, status, guestCreated = false, defaultExpanded = true, children }) {
  const isMobile = useIsMobile();
  const isTabletOrMobile = useIsTabletOrMobile();
  return (
    <Paper id={id} sx={{ p: isMobile ? 1 : 2, width: isTabletOrMobile ? "100%" : "80%" }}>
      <Accordion defaultExpanded={defaultExpanded} disableGutters elevation={0} sx={{ "&:before": { display: "none" } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h4" sx={{ fontSize: 20, fontWeight: 700 }}>
              {title}
            </Typography>
            {status && <StatusChip status={status} onClick={(e) => e.stopPropagation()} />}
            {guestCreated && <Chip label="ゲスト" variant="filled" color="default" size="small" onClick={(e) => e.stopPropagation()} />}
          </Box>
        </AccordionSummary>
        <AccordionDetails>{children}</AccordionDetails>
      </Accordion>
    </Paper>
  );
}

/**
 * セクション（本番 SectionDetail）。見出し h6 bold ＋ 右に「編集する」。
 * リスク評価セクションでは「参考: リスク表」で RiskCalculationModal を開く。
 * onEditClick を渡さないと編集ボタンは描画しない。編集できないときは disabled＋理由をツールチップに出す。
 */
export function SectionDetail({ title, element, isRiskAssessmentSection = false, riskCatalog = null, isEditable = true, editDeniedReason = null, onEditClick }) {
  const isMobile = useIsMobile();
  const isTabletOrMobile = useIsTabletOrMobile();
  const [riskModalOpen, setRiskModalOpen] = useState(false);
  const editDisabled = !!onEditClick && !isEditable;

  const modals = isRiskAssessmentSection && (
    <Stack direction="row" spacing={1} sx={[{ alignItems: "center" }, isTabletOrMobile ? { mb: 1, ml: isMobile ? -1 : 0 } : undefined]}>
      <Button onClick={() => setRiskModalOpen(true)} size="small">
        <span style={{ whiteSpace: "nowrap" }}>参考: リスク表</span>
      </Button>
      <RiskCalculationModal open={riskModalOpen} onClose={() => setRiskModalOpen(false)} riskCatalog={riskCatalog} />
    </Stack>
  );

  return (
    <Stack>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, mb: 1, overflow: "hidden" }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexShrink: 1, minWidth: 0 }}>
          <Typography component="span" variant="h6" noWrap sx={{ fontWeight: "bold" }}>
            {title}
          </Typography>
          {!isTabletOrMobile && modals}
        </Stack>
        {onEditClick && (
          <Box sx={{ flexShrink: 0 }} className="no-print">
            <DisabledTooltip disabled={editDisabled} title={editDeniedReason ?? ""}>
              <Button onClick={onEditClick} disabled={editDisabled} sx={{ whiteSpace: "nowrap" }}>
                編集する
              </Button>
            </DisabledTooltip>
          </Box>
        )}
      </Box>
      {isTabletOrMobile && modals}
      {element}
    </Stack>
  );
}

// 画像添付の回答（本番 FileAnswerChip）
function FileAnswerChip({ file }) {
  if (!file.path) {
    return (
      <Box sx={{ width: 80, height: 80, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid", borderColor: "divider", borderRadius: 1, bgcolor: "action.hover" }}>
        <ImageIcon color="disabled" />
      </Box>
    );
  }
  return <Box component="img" src={file.path} alt={file.name} sx={{ maxWidth: "100%", maxHeight: 240, borderRadius: 1 }} />;
}

// 1行（本番 ItemRow）。File は画像を並べ、参考画像があれば「(参考画像)」で拡大表示
function ItemRow({ item, value, isLarge, copySchedule }) {
  const [previewSrc, setPreviewSrc] = useState(null);
  const showPreviewButton = !!item.attachment?.path;

  if (item.type === "File") {
    const files = Array.isArray(value) ? value : [];
    return (
      <Stack direction="column" sx={{ width: "100%" }}>
        <Typography color="text.secondary">{item.name}</Typography>
        {files.length === 0 ? (
          <Typography>-</Typography>
        ) : (
          <Stack direction="column" sx={{ alignItems: "center", gap: 1, mt: 1 }}>
            {files.map((f) => (
              <FileAnswerChip key={f.id} file={f} />
            ))}
          </Stack>
        )}
      </Stack>
    );
  }

  const text = displayAnswer(item, value);
  if (!showPreviewButton) {
    return (
      <>
        <InfoRow title={item.name} value={text} isLarge={isLarge} />
        {item.internalUseType === "WorkDate" && copySchedule && (
          <InfoRow title="(定期作成)" value={`${fmtDate(copySchedule.startAt?.slice(0, 10))} 〜 ${fmtDate(copySchedule.endAt?.slice(0, 10))}`} isLarge={isLarge} />
        )}
      </>
    );
  }

  return (
    <>
      <Stack direction={isLarge ? "column" : "row"} sx={{ width: "100%", gap: isLarge ? 0 : 2 }}>
        <Box sx={isLarge ? undefined : { width: LABEL_COLUMN_WIDTH, flexShrink: 0, whiteSpace: "normal", wordBreak: "break-word" }}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            <Typography color="text.secondary">{item.name}</Typography>
            <Button variant="text" size="small" sx={{ minWidth: 0, p: 0.5, fontWeight: "normal" }} onClick={() => setPreviewSrc(item.attachment.path)}>
              (参考画像)
            </Button>
          </Stack>
        </Box>
        <Typography>{text || "-"}</Typography>
      </Stack>
      <Dialog open={previewSrc !== null} onClose={() => setPreviewSrc(null)} maxWidth="md">
        {previewSrc && <Box component="img" src={previewSrc} alt="" sx={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }} />}
      </Dialog>
    </>
  );
}

/**
 * 項目グループの表示（本番 ItemGroupBlock ＋ ItemGroupHeader）。
 * グループ見出し（optional で該当なしなら「（該当なし）」）→ 項目名｜値。
 * 条件付き項目は条件が満たされたときだけ出す。基本情報・職長チェックリスト・作業員チェックリストで共用。
 */
export function ItemGroupBlock({ group, values = {}, notUse = {}, isLarge = false, isLast = true, copySchedule }) {
  const isMobile = useIsMobile();
  const isNotUse = !!group.optional && !!notUse[group.id];
  const items = (group.items ?? []).filter((i) => !i.omit);
  if (items.length === 0) return null;
  return (
    <Fragment>
      <Stack spacing={2}>
        {group.name && (
          <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "text.secondary" }}>
            {group.name}
            {isNotUse && (
              <Typography component="span" variant="body2" color="text.disabled" sx={{ ml: 1 }}>
                （該当なし）
              </Typography>
            )}
          </Typography>
        )}
        {!isNotUse && (
          <Stack spacing={isMobile ? 1.5 : 1}>
            {items.map((item) => (isItemVisible(item, values) ? <ItemRow key={item.id} item={item} value={values[item.id]} isLarge={isLarge} copySchedule={copySchedule} /> : null))}
          </Stack>
        )}
      </Stack>
      {!isLast && <Divider sx={{ my: 2 }} />}
    </Fragment>
  );
}

// 基本情報セクション（本番 BasicDetailsKynextnextSection）
export function BasicDetailsSection({ sheet }) {
  const isLarge = useIsLargeFontSize();
  const groups = sheet.catalog?.basicDetailCatalog?.groups ?? [];
  return (
    <Stack spacing={3}>
      {groups.map((group) => (
        <ItemGroupBlock key={group.id} group={group} values={sheet.basicDetails} notUse={sheet.groupNotUse} isLarge={isLarge} isLast copySchedule={sheet.copySchedule ?? undefined} />
      ))}
    </Stack>
  );
}

/**
 * リスク評価の表示（本番 WorkRiskAssessmentKynextnextSection）。
 * items: [{ workName, dangerPoint, countermeasure, doubleSafety, severity, possibility, improvedSeverity, improvedPossibility }]
 * 手順ごとに枠: 「手順n: 作業名」／危険ポイント／対策／（ダブルセーフティ）／Divider／重大性・可能性・評価の before → after
 */
export function WorkRiskAssessmentDetail({ items, riskCatalog, itemLabel }) {
  const isSymbolMode = riskCatalog?.scoreTableType === "Symbol";
  const dangerPointLabel = riskCatalog?.dangerPointLabel || "危険ポイント";
  const countermeasureLabel = riskCatalog?.countermeasureLabel || "私たちはこうする";
  const formatValue = (v) => (isSymbolMode ? SYMBOL_MAP[v] ?? String(v) : String(v ?? 0));

  return (
    <Stack spacing={2}>
      {items.map((item, index) => {
        const before = evaluationOf(riskCatalog, item.severity, item.possibility);
        const after = evaluationOf(riskCatalog, item.improvedSeverity, item.improvedPossibility);
        const textRows = [
          { label: dangerPointLabel, value: item.dangerPoint },
          { label: countermeasureLabel, value: item.countermeasure },
        ];
        if (riskCatalog?.hasDoubleSafety && item.doubleSafety) textRows.push({ label: "ダブルセーフティ", value: item.doubleSafety });
        const beforeAfterRows = [
          { label: "重大性", before: formatValue(item.severity), after: formatValue(item.improvedSeverity) },
          { label: "可能性", before: formatValue(item.possibility), after: formatValue(item.improvedPossibility) },
          { label: "評価", before: before.label, after: after.label, beforeColor: before.color, afterColor: after.color },
        ];
        // 項目が複数並ぶため、統合パターンの「作業内容」にも通し番号を付ける
        const heading = `${itemLabel ?? "手順"}${index + 1}`;
        return (
          <Box key={index} sx={{ border: "1px solid #E0E0E0", borderRadius: 1, p: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
              {item.workName ? `${heading}: ${item.workName}` : `リスク項目 ${index + 1}`}
            </Typography>
            <Stack spacing={0} sx={{ mb: 1 }}>
              {textRows.map(({ label, value }) => (
                <Stack key={label} direction="column" spacing={0}>
                  <Typography variant="body2" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography variant="body2">{value || "-"}</Typography>
                </Stack>
              ))}
            </Stack>
            <Divider sx={{ my: 1 }} />
            <Stack spacing={0.5}>
              {beforeAfterRows.map(({ label, before: b, after: a, beforeColor, afterColor }) => (
                <Stack key={label} direction="column" spacing={0}>
                  <Typography variant="body2" color="text.secondary">
                    {label}
                  </Typography>
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                    <Typography variant="body2" sx={beforeColor && beforeColor !== "transparent" ? { bgcolor: beforeColor, px: 1, borderRadius: 1 } : undefined}>
                      {b}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      →
                    </Typography>
                    <Typography variant="body2" sx={afterColor && afterColor !== "transparent" ? { bgcolor: afterColor, px: 1, borderRadius: 1 } : undefined}>
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

// シートの riskAssessments[i].workSteps を表示用の items に変換する
export const toRiskItems = (workSteps = []) =>
  workSteps.map((ws) => ({
    workName: ws.step,
    dangerPoint: ws.risk?.dangerPoint ?? "",
    countermeasure: ws.risk?.countermeasure ?? "",
    doubleSafety: ws.risk?.doubleSafety ?? "",
    severity: ws.risk?.severity ?? 0,
    possibility: ws.risk?.possibility ?? 0,
    improvedSeverity: ws.risk?.improvedSeverity ?? 0,
    improvedPossibility: ws.risk?.improvedPossibility ?? 0,
  }));

/**
 * リスク評価セクション群（本番 RiskAssessmentDetailSections）。
 * カタログ順（selectRiskCatalogs）に、リスク評価と指差呼称（行動目標）を並べる。
 * onEditClick(target, riskIndex) を渡すと「編集する」を出す。
 */
export function RiskAssessmentDetailSections({ sheet, isEditable, editDeniedReason, onEditClick }) {
  const riskCatalogs = selectRiskCatalogs(sheet.catalog);
  return (
    <>
      {riskCatalogs.map((rc, riskIndex) => {
        const answer = sheet.riskAssessments?.[riskIndex];
        const items = toRiskItems(answer?.workSteps ?? []).filter((it) => it.workName || it.dangerPoint);
        const actionGoal = answer?.actionGoal;
        const label = rc.title || (rc.type === "Quality" ? "品質KY" : "");
        const withTitle = (n) => (label ? `${label}（${n}）` : n);
        return (
          <Fragment key={rc.id}>
            {items.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <SectionDetail
                  title={riskSectionTitle(rc)}
                  isRiskAssessmentSection
                  riskCatalog={rc}
                  element={<WorkRiskAssessmentDetail items={items} riskCatalog={rc} itemLabel={isMergedProcedure(rc) ? "作業内容" : undefined} />}
                  onEditClick={onEditClick && (() => onEditClick("WorkRiskAssessment", riskIndex))}
                  isEditable={isEditable}
                  editDeniedReason={editDeniedReason}
                />
              </>
            )}
            {actionGoal && (
              <>
                <Divider sx={{ my: 2 }} />
                <SectionDetail
                  title={withTitle("指差呼称")}
                  element={
                    <Stack spacing={1}>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        行動目標
                      </Typography>
                      <Typography variant="body2">{actionGoal}</Typography>
                    </Stack>
                  }
                  onEditClick={onEditClick && (() => onEditClick("PointingAndCalling", riskIndex))}
                  isEditable={isEditable}
                  editDeniedReason={editDeniedReason}
                />
              </>
            )}
          </Fragment>
        );
      })}
    </>
  );
}

/**
 * 署名の表示（本番 workerChecklistsSection/components/Signature）。
 * 署名画像（200x50 枠線）か氏名、担当手順の番号（①②…）、写真列。
 */
export function SignatureView({ workerName, signaturePath, photoPath, showPhotoColumn = false, riskAssessmentItems }) {
  return (
    <Box width="100%">
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 0.5 }}>
        {signaturePath ? (
          <Box>
            <img src={signaturePath} alt="Signature" style={SIGNATURE_IMG_STYLE} />
          </Box>
        ) : (
          workerName && (
            <Box width="200px">
              <Typography>{workerName}</Typography>
            </Box>
          )
        )}
        {signaturePath && workerName && (
          <Typography variant="body2" sx={{ minWidth: 0 }}>
            {workerName}
          </Typography>
        )}
        {riskAssessmentItems && riskAssessmentItems.length > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ letterSpacing: ".1em" }} title="担当手順">
            {riskAssessmentItems.map((i) => circledNumber(i + 1)).join("")}
          </Typography>
        )}
        {showPhotoColumn && (
          <Box sx={{ width: 50, height: 50, flexShrink: 0 }}>
            {photoPath && <img src={photoPath} alt="Worker photo" style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 4, border: "1px solid #000" }} />}
          </Box>
        )}
      </Stack>
    </Box>
  );
}

// ---------- 確認セクション（本番 ConfirmSection） ----------

function ConfirmInfoRow({ title, value, isMobile }) {
  return (
    <Stack direction={isMobile ? "column" : "row"} spacing={isMobile ? 0.25 : 1}>
      <Box sx={{ minWidth: 160, flexShrink: 0 }}>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </Box>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  );
}

function ConfirmRow({ title, confirm, isMobile }) {
  if (!confirm?.confirmedAt) return <ConfirmInfoRow title={title} value="未" isMobile={isMobile} />;
  const nameAndDate = `${confirm.confirmer?.name ?? confirm.confirmerName ?? ""} (${fmtDate(confirm.confirmedAt.slice(0, 10))})`;
  if (!confirm.signature?.path) return <ConfirmInfoRow title={title} value={nameAndDate} isMobile={isMobile} />;
  return (
    <Stack direction={isMobile ? "column" : "row"} spacing={isMobile ? 0.25 : 1}>
      <Box sx={{ minWidth: 160, flexShrink: 0 }}>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </Box>
      <Stack spacing={0.5}>
        <img src={confirm.signature.path} alt="署名" style={SIGNATURE_IMG_STYLE} />
        <Typography variant="body2">{nameAndDate}</Typography>
      </Stack>
    </Stack>
  );
}

/** 「確認」セクション。KY作成後 元請確認／作業終了後 職長確認／作業完了後 元請確認を「未」または「氏名 (日付)」＋署名で出す */
export function ConfirmSection({ sheet }) {
  const isMobile = useIsMobile();
  const wf = sheet.catalog?.workflowCatalog;
  return (
    <DetailAccordionSection title="確認">
      <Stack spacing={isMobile ? 1.5 : 1}>
        {wf?.hasGeneralContractorConfirmCreateKynextSheet && (
          <ConfirmRow title={sheet.createConfirm?.confirmedAt ? "KY作成後 元請確認済" : "KY作成後 元請確認"} confirm={sheet.createConfirm} isMobile={isMobile} />
        )}
        <ConfirmInfoRow
          title={sheet.workCompleteConfirm?.confirmedAt ? "作業終了後 職長確認済" : "作業終了後 職長確認"}
          value={sheet.workCompleteConfirm?.confirmedAt ? `${sheet.workCompleteConfirm.confirmer?.name ?? sheet.workCompleteConfirm.confirmerName ?? ""} (${fmtDate(sheet.workCompleteConfirm.confirmedAt.slice(0, 10))})` : "未"}
          isMobile={isMobile}
        />
        {wf?.hasGeneralContractorConfirmPostWork && (
          <ConfirmRow title={sheet.completeConfirm?.confirmedAt ? "作業完了後 元請確認済" : "作業完了後 元請確認"} confirm={sheet.completeConfirm} isMobile={isMobile} />
        )}
      </Stack>
    </DetailAccordionSection>
  );
}
