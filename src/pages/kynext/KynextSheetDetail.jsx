import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Box, Button, Container, Divider, GlobalStyles, IconButton, Paper, Stack, Typography } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import DeleteIcon from "@mui/icons-material/Delete";
import IosShareIcon from "@mui/icons-material/IosShare";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useKynext } from "../../components/kynext/KynextContext.jsx";
import { DisabledTooltip, FontSizeScope, FontSizeToggle, SplitFab, useIsMobile, useIsTabletOrMobile } from "../../components/kynext/KynextCommon.jsx";
import { BasicDetailsSection, ConfirmSection, DetailAccordionSection, RiskAssessmentDetailSections, SectionDetail } from "../../components/kynext/DetailSections.jsx";
import { ForepersonChecklistsSection, SafetyInstructionsSection, WorkerChecklistsSection } from "../../components/kynext/DetailWorkerChecklists.jsx";
import { ConfirmMenuButton, KynextConfirmDialog, ShareDialog, useConfirmActions, useDeleteSheetDialog, useLineShare } from "../../components/kynext/DetailDialogs.jsx";
import { isGuestCreated, resolveEditStepId, resolveSheetPermissions } from "../../components/kynext/DetailLib.js";

// 印刷（本番 useKYNEXTSheetPdf は PDF を組んで印刷する。デモはブラウザ印刷）
const printSheet = () => window.print();

// 印刷時にサイドバー等の操作 UI を隠す（本番 PDF 印刷の代替）
const printStyles = (
  <GlobalStyles
    styles={{
      "@media print": {
        ".no-print": { display: "none !important" },
        ".MuiPaper-root": { boxShadow: "none !important" },
      },
    }}
  />
);

/**
 * KYシート詳細の本体（本番 DetailKynextnext ＋ detail/hooks の useDetailPage）。
 * 基本情報／リスク評価／指差呼称 → 元請からの安全指示 → 作業員チェック → 職長チェックリスト → 確認 の順に並べ、
 * PC は右下に「確認」「共有」「削除」、タブレット・スマホは下部の SplitFab に載せる。
 */
function Detail({ sheet }) {
  const navigate = useNavigate();
  const { me } = useKynext();
  const isMobile = useIsMobile();
  const isTabletOrMobile = useIsTabletOrMobile();
  const perms = resolveSheetPermissions(sheet, me);
  const confirmActions = useConfirmActions(sheet, perms);
  const lineShare = useLineShare(sheet.id);
  const { deleteKynextSheet, renderDeleteDialog } = useDeleteSheetDialog({ onDeleted: () => navigate("/kynext") });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // ゲストが作成したシート。ステータスの横に「ゲスト」チップを出し、編集の導線は出さない
  const guestCreated = isGuestCreated(sheet);
  const hasSafetyInstruction = sheet.catalog?.workflowCatalog?.hasSafetyInstruction ?? false;

  // 「編集する」→ 修正画面。step は buildVirtualSteps の id（基本情報 / リスク評価 / 指差呼称）
  const handleEdit = (target, riskIndex = 0) => {
    const step = resolveEditStepId(sheet.catalog, target, riskIndex);
    navigate(`/kynext/ky-sheets/${sheet.id}/edit?step=${step}`);
  };
  const handleDelete = () => deleteKynextSheet(sheet.id, sheet.workContent);

  // タブレット・スマホ下部の操作（本番 DetailKynextnextFab）。スマホの印刷は文字サイズ切替の横に出すので載せない
  const fabActions = [
    { label: confirmActions.allConfirmed ? "確認済" : "確認", icon: <CheckCircleIcon />, onClick: () => setConfirmOpen(true), disabled: confirmActions.nothingToDo },
    ...(!isMobile ? [{ label: "印刷", icon: <PrintIcon />, onClick: printSheet }] : []),
    { label: "共有", icon: <IosShareIcon />, onClick: () => setShareOpen(true) },
    { label: "削除", icon: <DeleteIcon />, onClick: handleDelete, disabled: !!perms.deleteDeniedReason },
  ];

  return (
    <Stack spacing={2} sx={{ alignItems: "center" }}>
      {!isMobile && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-end", gap: 1, width: isTabletOrMobile ? "100%" : "80%" }} className="no-print">
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={printSheet}>
            印刷
          </Button>
        </Box>
      )}

      <DetailAccordionSection title="KYシート詳細" status={sheet.status} guestCreated={guestCreated}>
        <SectionDetail title="基本情報" element={<BasicDetailsSection sheet={sheet} />} onEditClick={guestCreated ? undefined : () => handleEdit()} isEditable={perms.isEditable} editDeniedReason={perms.editDeniedReason} />
        <RiskAssessmentDetailSections sheet={sheet} isEditable={perms.isEditable} editDeniedReason={perms.editDeniedReason} onEditClick={guestCreated ? undefined : handleEdit} />
        {guestCreated && sheet.createdBy?.name && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary">
              作成者: {sheet.createdBy.name}
            </Typography>
          </>
        )}
      </DetailAccordionSection>

      {hasSafetyInstruction && <SafetyInstructionsSection sheet={sheet} perms={perms} />}
      <WorkerChecklistsSection sheet={sheet} perms={perms} />
      <ForepersonChecklistsSection sheet={sheet} perms={perms} />
      <ConfirmSection sheet={sheet} />

      {!isTabletOrMobile && (
        <Stack direction="row" spacing={2} className="no-print" sx={{ justifyContent: "flex-end", alignItems: "center", mt: 4, width: "80%" }}>
          <ConfirmMenuButton confirmActions={confirmActions} />
          <Button variant="contained" startIcon={<IosShareIcon />} onClick={() => setShareOpen(true)} sx={{ whiteSpace: "nowrap" }}>
            共有
          </Button>
          <DisabledTooltip disabled={!!perms.deleteDeniedReason} title={perms.deleteDeniedReason ?? ""}>
            <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={handleDelete} disabled={!!perms.deleteDeniedReason} sx={{ whiteSpace: "nowrap" }}>
              削除
            </Button>
          </DisabledTooltip>
        </Stack>
      )}

      {isTabletOrMobile && (
        <Box className="no-print" sx={{ width: "100%" }}>
          <SplitFab actions={fabActions} />
          <KynextConfirmDialog
            open={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            createConfirmData={confirmActions.createConfirmData}
            workCompleteConfirmData={confirmActions.workCompleteConfirmData}
            completeConfirmData={confirmActions.completeConfirmData}
            onCreateConfirm={confirmActions.handleCreateConfirm}
            onWorkCompleteConfirm={confirmActions.handleWorkCompleteConfirm}
            onCompleteConfirm={confirmActions.handleCompleteConfirm}
            onCancelCreateConfirm={confirmActions.handleCancelCreateConfirm}
            onCancelWorkCompleteConfirm={confirmActions.handleCancelWorkCompleteConfirm}
            onCancelCompleteConfirm={confirmActions.handleCancelCompleteConfirm}
          />
        </Box>
      )}

      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} sheetId={sheet.id} lineShareDeniedReason={perms.lineShareDeniedReason} onShareLine={lineShare.handleShareLine} />
      {lineShare.renderDialog()}
      {renderDeleteDialog()}
      {confirmActions.renderCancelDialogs()}

      {sheet.catalog && (
        <Typography variant="caption" color="text.secondary">
          {sheet.catalog.template?.name} - {String(sheet.catalog.version).padStart(3, "0")}
        </Typography>
      )}
    </Stack>
  );
}

/**
 * KYシート詳細（/kynext/ky-sheets/:id。本番 pages/kySheets/[kySheet]/index.tsx）。
 * 右上に（スマホは印刷アイコン＋）文字サイズ切替。仮作成シートは修正画面へ、存在しない id は一覧へ戻す導線。
 */
export default function KynextSheetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getSheet } = useKynext();
  const isMobile = useIsMobile();
  const sheet = getSheet(id);

  if (!sheet) {
    return (
      <Container maxWidth="lg">
        <Paper sx={{ p: 4 }}>
          <Stack spacing={2} sx={{ alignItems: "center" }}>
            <Typography>KYシートが見つかりません</Typography>
            <Button variant="contained" onClick={() => navigate("/kynext")}>
              一覧へ戻る
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  // 仮作成（作業間調整proから自動作成など）は中身が未入力なので、そのまま本作成の入力画面へ
  if (sheet.status === "Provisional") {
    return <Navigate to={`/kynext/ky-sheets/${sheet.id}/edit`} replace />;
  }

  return (
    <Container maxWidth="lg">
      {printStyles}
      <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", pt: 1, mb: 1 }} className="no-print">
        {isMobile && (
          <IconButton aria-label="印刷" color="primary" size="small" onClick={printSheet} sx={{ mr: 1 }}>
            <PrintIcon />
          </IconButton>
        )}
        <FontSizeToggle />
      </Box>
      <FontSizeScope>
        <Detail key={sheet.id} sheet={sheet} />
      </FontSizeScope>
    </Container>
  );
}
