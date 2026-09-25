import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useKynext } from "./KynextContext.jsx";
import { useConfirmDialog } from "./KynextCommon.jsx";
import { GeneralConstructorButton } from "./DetailSections.jsx";

// ===== KYシート詳細のダイアログ類（確認・共有・LINE共有・削除） =====

/**
 * 確認ダイアログ（本番 KynextnextConfirmDialog）。
 * 3種の確認ボタン＋説明文。確認済みには CheckCircle と「取消」。
 * 各 data: { showConfirm, canConfirm, cannotMessage, isConfirmed, canCancel }
 */
export function KynextConfirmDialog({ open, onClose, createConfirmData, workCompleteConfirmData, completeConfirmData, onCreateConfirm, onWorkCompleteConfirm, onCompleteConfirm, onCancelCreateConfirm, onCancelWorkCompleteConfirm, onCancelCompleteConfirm }) {
  const row = (data, ButtonComp, labels, description, onConfirm, onCancel) =>
    data.showConfirm && (
      <>
        <Tooltip title={!data.isConfirmed && !data.canConfirm && data.cannotMessage ? data.cannotMessage : ""} arrow>
          <span>
            <ButtonComp
              variant="contained"
              disabled={data.isConfirmed || !data.canConfirm}
              onClick={async () => {
                await onConfirm();
                onClose();
              }}
              sx={{ whiteSpace: "nowrap" }}
            >
              {data.isConfirmed ? labels[1] : labels[0]}
            </ButtonComp>
          </span>
        </Tooltip>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {data.isConfirmed && <CheckCircleIcon color="success" fontSize="small" />}
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
          {data.isConfirmed && data.canCancel && onCancel && (
            <Button
              variant="text"
              color="error"
              size="small"
              sx={{ ml: "auto", flexShrink: 0 }}
              onClick={async () => {
                onClose();
                await onCancel();
              }}
            >
              取消
            </Button>
          )}
        </Box>
      </>
    );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>確認</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "auto 1fr" }, gap: 2, alignItems: "center" }}>
          {row(createConfirmData, GeneralConstructorButton, ["KY作成後 元請確認", "KY作成後 元請確認済"], "作成されたKYシートを確認します", onCreateConfirm, onCancelCreateConfirm)}
          {row(workCompleteConfirmData, Button, ["作業終了後 職長確認", "作業終了後 職長確認済"], "作業の終了を確認します", onWorkCompleteConfirm, onCancelWorkCompleteConfirm)}
          {row(completeConfirmData, GeneralConstructorButton, ["作業完了後 元請確認", "作業完了後 元請確認済"], "KYの完了を確認します", onCompleteConfirm, onCancelCompleteConfirm)}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * 確認まわりの状態とハンドラ（本番 useCreateConfirm / useWorkCompleteConfirm / useCompleteConfirm ＋ detail/hooks の handle*）。
 * createConfirmType / completeConfirmType が 'Sign' なら署名画面へ、'Button' ならその場で確認する。
 */
export function useConfirmActions(sheet, perms) {
  const navigate = useNavigate();
  const { createConfirm, cancelCreateConfirm, workCompleteConfirm, cancelWorkCompleteConfirm, completeConfirm, cancelCompleteConfirm, notify } = useKynext();
  const wf = sheet.catalog?.workflowCatalog ?? {};
  const signatureCatalog = sheet.catalog?.signatureCatalogV2;
  const groupPhotoRequired = (signatureCatalog?.hasGroupPhoto ?? false) && !(signatureCatalog?.groupPhotoOptional ?? true);
  const groupPhotoMissing = groupPhotoRequired && (sheet.groupPhotos?.length ?? 0) === 0;

  const cancelCreateDialog = useConfirmDialog({ title: "確認を取り消しますか？", children: "KY作成後 元請確認を取り消します。" });
  const cancelWorkCompleteDialog = useConfirmDialog({ title: "確認を取り消しますか？", children: "作業終了後 職長確認を取り消します。" });
  const cancelCompleteDialog = useConfirmDialog({ title: "確認を取り消しますか？", children: "作業完了後 元請確認を取り消します。" });

  const createConfirmData = {
    showConfirm: !!wf.hasGeneralContractorConfirmCreateKynextSheet,
    canConfirm: !perms.createConfirmDeniedReason,
    cannotMessage: perms.createConfirmDeniedReason ?? "",
    isConfirmed: !!sheet.createConfirm?.confirmedAt,
    canCancel: perms.createConfirmCancellable,
    confirmType: wf.createConfirmType ?? "Button",
  };
  const workCompleteConfirmData = {
    showConfirm: true,
    canConfirm: !perms.workCompleteConfirmDeniedReason && !groupPhotoMissing,
    cannotMessage: perms.workCompleteConfirmDeniedReason ?? (groupPhotoMissing ? "職長写真がありません" : ""),
    isConfirmed: !!sheet.workCompleteConfirm?.confirmedAt,
    canCancel: perms.workCompleteConfirmCancellable,
  };
  const completeConfirmData = {
    showConfirm: !!wf.hasGeneralContractorConfirmPostWork,
    canConfirm: !perms.completeConfirmDeniedReason,
    cannotMessage: perms.completeConfirmDeniedReason ?? "",
    isConfirmed: !!sheet.completeConfirm?.confirmedAt,
    canCancel: perms.completeConfirmCancellable,
    confirmType: wf.completeConfirmType ?? "Button",
  };

  const handleCreateConfirm = async () => {
    if (createConfirmData.confirmType === "Sign") {
      navigate(`/kynext/ky-sheets/${sheet.id}/create-confirm/sign`);
      return;
    }
    createConfirm(sheet.id);
    notify("シート提出確認が完了しました。");
  };
  const handleWorkCompleteConfirm = async () => {
    if (groupPhotoMissing) {
      notify("職長写真がありません", "error");
      return;
    }
    workCompleteConfirm(sheet.id);
    notify("作業終了確認が完了しました。");
  };
  const handleCompleteConfirm = async () => {
    if (completeConfirmData.confirmType === "Sign") {
      navigate(`/kynext/ky-sheets/${sheet.id}/complete-confirm/sign`);
      return;
    }
    completeConfirm(sheet.id);
    notify("元請確認が完了しました。");
  };
  const handleCancelCreateConfirm = async () => {
    const { accepted } = await cancelCreateDialog.confirm();
    if (!accepted) return;
    cancelCreateConfirm(sheet.id);
    notify("確認を取り消しました。");
  };
  const handleCancelWorkCompleteConfirm = async () => {
    const { accepted } = await cancelWorkCompleteDialog.confirm();
    if (!accepted) return;
    cancelWorkCompleteConfirm(sheet.id);
    notify("確認を取り消しました。");
  };
  const handleCancelCompleteConfirm = async () => {
    const { accepted } = await cancelCompleteDialog.confirm();
    if (!accepted) return;
    cancelCompleteConfirm(sheet.id);
    notify("確認を取り消しました。");
  };

  const visibleItems = [createConfirmData, workCompleteConfirmData, completeConfirmData].filter((d) => d.showConfirm);
  const allConfirmed = visibleItems.length > 0 && visibleItems.every((d) => d.isConfirmed);
  // 全て確認済みで取消もできなければダイアログを開いても何もできないので押せなくする
  const nothingToDo = allConfirmed && !visibleItems.some((d) => d.canCancel);

  const renderCancelDialogs = () => (
    <>
      {cancelCreateDialog.renderDialog()}
      {cancelWorkCompleteDialog.renderDialog()}
      {cancelCompleteDialog.renderDialog()}
    </>
  );

  return {
    createConfirmData,
    workCompleteConfirmData,
    completeConfirmData,
    handleCreateConfirm,
    handleWorkCompleteConfirm,
    handleCompleteConfirm,
    handleCancelCreateConfirm,
    handleCancelWorkCompleteConfirm,
    handleCancelCompleteConfirm,
    allConfirmed,
    nothingToDo,
    renderCancelDialogs,
  };
}

// 「確認」ボタン＋ダイアログ（本番 KynextnextConfirmMenuButton）
export function ConfirmMenuButton({ confirmActions }) {
  const [open, setOpen] = useState(false);
  const a = confirmActions;
  return (
    <>
      <Button variant="contained" startIcon={<CheckCircleIcon />} onClick={() => setOpen(true)} disabled={a.nothingToDo} sx={{ whiteSpace: "nowrap" }}>
        {a.allConfirmed ? "確認済" : "確認"}
      </Button>
      <KynextConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        createConfirmData={a.createConfirmData}
        workCompleteConfirmData={a.workCompleteConfirmData}
        completeConfirmData={a.completeConfirmData}
        onCreateConfirm={a.handleCreateConfirm}
        onWorkCompleteConfirm={a.handleWorkCompleteConfirm}
        onCompleteConfirm={a.handleCompleteConfirm}
        onCancelCreateConfirm={a.handleCancelCreateConfirm}
        onCancelWorkCompleteConfirm={a.handleCancelWorkCompleteConfirm}
        onCancelCompleteConfirm={a.handleCancelCompleteConfirm}
      />
    </>
  );
}

// LINE 色のボタン（本番 LineButton）
const LINE_COLOR = "#06C755";
export function LineButton({ sx, children, ...rest }) {
  return (
    <Button
      {...rest}
      startIcon={
        <Box component="span" sx={{ width: 20, height: 20, borderRadius: "5px", bgcolor: "#fff", color: LINE_COLOR, fontSize: 9, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          LINE
        </Box>
      }
      sx={{
        backgroundColor: LINE_COLOR,
        color: "#FFFFFF",
        "&:hover": { backgroundColor: "#05B34D" },
        "&:active": { backgroundColor: "#048B3C" },
        "&.Mui-disabled": { backgroundColor: "action.disabledBackground", color: "text.disabled" },
        ...sx,
      }}
    >
      {children}
    </Button>
  );
}

/**
 * LINE 共有ダイアログ（本番 LineShareDialog）。
 * 連携済みグループの Radio 一覧＋同期/削除アイコン、「このLINEグループにKYシートを共有しますか？」はい/キャンセル。
 */
export function LineShareDialog({ open, groups, onYes, onNo, onDelete, onSync }) {
  const [group, setGroup] = useState(groups?.[0]?.id ?? 0);
  const [deleteGroupId, setDeleteGroupId] = useState(null);
  const [syncingGroupId, setSyncingGroupId] = useState(null);
  const deleteConfirmDialog = useConfirmDialog({ title: "グループを削除しますか?", color: "error" });

  const handleSyncClick = async (g) => {
    setSyncingGroupId(g.id);
    await onSync?.(g.id, g.name);
    await new Promise((r) => setTimeout(r, 600));
    setSyncingGroupId(null);
  };
  const handleDeleteClick = async (groupId) => {
    setDeleteGroupId(groupId);
    const { accepted } = await deleteConfirmDialog.confirm();
    if (accepted) onDelete?.(groupId);
    setDeleteGroupId(null);
  };

  if (!groups?.length) {
    return (
      <Dialog open={open} onClose={onNo} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>LINE共有</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ alignItems: "center", mx: "auto" }}>
            <Typography variant="h6" sx={{ fontSize: 15 }}>
              連携済みのLINEグループがありません。連携したいLINEグループにArchアカウントを追加してください。
            </Typography>
            <Button onClick={onNo} variant="outlined">
              キャンセル
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onClose={onNo} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>LINE共有</DialogTitle>
        <DialogContent>
          <FormControl sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <RadioGroup name="line-group" value={String(group)} onChange={(_, v) => setGroup(Number(v))} sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              {groups.map((g) => (
                <Stack key={g.id} direction="row" sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", width: { xs: "100%", sm: "60%" } }}>
                  <FormControlLabel value={String(g.id)} control={<Radio />} label={g.name} />
                  <Stack direction="row" spacing={0.5}>
                    {onSync && (
                      <IconButton color="primary" size="small" onClick={() => handleSyncClick(g)} disabled={syncingGroupId === g.id} aria-label="同期">
                        <RefreshIcon />
                      </IconButton>
                    )}
                    {onDelete && (
                      <IconButton color="error" size="small" onClick={() => handleDeleteClick(g.id)} aria-label="削除">
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Stack>
                </Stack>
              ))}
            </RadioGroup>
          </FormControl>
          <Stack spacing={2} sx={{ alignItems: "center", mx: "auto", mt: 3 }}>
            <Typography variant="h6" sx={{ fontSize: 15 }}>
              このLINEグループにKYシートを共有しますか？
            </Typography>
            <Stack spacing={2} direction="row">
              <Button onClick={onNo} variant="outlined">
                キャンセル
              </Button>
              <Button color="primary" onClick={() => onYes(group)} variant="contained">
                はい
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
      {deleteConfirmDialog.renderDialog(<Typography>「{groups.find((g) => g.id === deleteGroupId)?.name}」 との連携を削除します。</Typography>)}
    </>
  );
}

/**
 * LINE 共有の状態（本番 useLineShare）。handleShareLine() でダイアログを開き、はい で共有完了の通知を出す。
 */
export function useLineShare(sheetId) {
  const { lineGroups, unregisterLineGroup, notify } = useKynext();
  const [open, setOpen] = useState(false);

  const handleShareLine = () => setOpen(true);
  const handleYes = () => {
    setOpen(false);
    notify("LINE共有が完了しました。");
  };
  const handleDelete = (groupId) => {
    unregisterLineGroup(groupId);
    notify("LINEグループの連携を解除しました");
  };
  const handleSync = () => {
    notify("LINEグループは最新の状態です");
  };
  const renderDialog = () => <LineShareDialog open={open} groups={lineGroups} onYes={handleYes} onNo={() => setOpen(false)} onDelete={handleDelete} onSync={handleSync} />;
  return { handleShareLine, renderDialog, sheetId };
}

/**
 * 共有ダイアログ（本番 ShareDialog）。
 * 「QRコード」→ QR 画面、「URLコピー」→ clipboard、「LINE共有」→ LineShareDialog。
 */
export function ShareDialog({ open, onClose, sheetId, lineShareDeniedReason, onShareLine }) {
  const navigate = useNavigate();
  const { notify } = useKynext();
  const [copying, setCopying] = useState(false);

  const handleCopyUrl = async () => {
    setCopying(true);
    const url = `${window.location.origin}/kynext/ky-sheets/${sheetId}`;
    try {
      await navigator.clipboard.writeText(url);
      notify("URLをコピーしました。");
      onClose();
    } catch {
      notify("URLのコピーに失敗しました。", "error");
    } finally {
      setCopying(false);
    }
  };

  const rowSx = { direction: { xs: "column", sm: "row" }, spacing: 2, sx: { alignItems: { xs: "flex-start", sm: "center" } } };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>共有</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Stack {...rowSx}>
            <Button
              variant="contained"
              startIcon={<QrCode2Icon />}
              sx={{ width: 140, whiteSpace: "nowrap" }}
              onClick={() => {
                navigate(`/kynext/ky-sheets/${sheetId}/qr-code`);
                onClose();
              }}
            >
              QRコード
            </Button>
            <Typography variant="body2" color="text.secondary">
              作業員サイン用のQRコードを表示します
            </Typography>
          </Stack>
          <Stack {...rowSx}>
            <Button variant="contained" startIcon={<ContentCopyIcon />} sx={{ width: 140, whiteSpace: "nowrap" }} loading={copying} onClick={handleCopyUrl}>
              URLコピー
            </Button>
            <Typography variant="body2" color="text.secondary">
              作業員サイン用のURLをコピーします
            </Typography>
          </Stack>
          <Stack {...rowSx}>
            <LineButton
              sx={{ width: 140, whiteSpace: "nowrap" }}
              disabled={!!lineShareDeniedReason}
              onClick={() => {
                onShareLine();
                onClose();
              }}
            >
              LINE共有
            </LineButton>
            <Typography variant="body2" color={lineShareDeniedReason ? "text.disabled" : "text.secondary"}>
              {lineShareDeniedReason ?? "自身の所属するLINEグループに共有します"}
            </Typography>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * KYシート削除の確認（本番 useDeleteKYNEXTSheet）。
 * 「KYシートを削除しますか？」→ 作業内容表示 → 警告 → 「確認しました」チェック → 「削除する」
 */
export function useDeleteSheetDialog({ onDeleted } = {}) {
  const { deleteSheet, notify } = useKynext();
  const [state, setState] = useState(null);
  const [acknowledged, setAcknowledged] = useState(false);

  const deleteKynextSheet = (sheetId, workContent) => {
    setAcknowledged(false);
    setState({ sheetId, workContent });
  };
  const close = () => setState(null);
  const execute = () => {
    const { sheetId } = state;
    close();
    deleteSheet(sheetId);
    notify("KYシートを削除しました");
    onDeleted?.();
  };

  const renderDeleteDialog = () => (
    <Dialog open={!!state} onClose={close} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: "bold", fontSize: "22px", color: "error.main" }}>KYシートを削除しますか？</DialogTitle>
      <DialogContent>
        {state?.workContent && (
          <Typography variant="h4" sx={{ mb: 2, fontSize: 18, fontWeight: 700 }}>{`作業内容「${state.workContent}」`}</Typography>
        )}
        <Alert severity="warning" sx={{ mb: 2 }}>
          この操作は取り消せません。
        </Alert>
        <FormControlLabel control={<Checkbox checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} />} label={<Typography variant="body2">確認しました</Typography>} />
      </DialogContent>
      <DialogActions sx={{ padding: "16px 24px 24px" }}>
        <Button onClick={close}>キャンセル</Button>
        <Button variant="contained" color="error" onClick={execute} disabled={!acknowledged}>
          削除する
        </Button>
      </DialogActions>
    </Dialog>
  );

  return { deleteKynextSheet, renderDeleteDialog };
}
