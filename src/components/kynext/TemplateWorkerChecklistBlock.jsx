import { Box, Checkbox, Divider, FormControlLabel, Stack, Switch, TextField, Typography } from "@mui/material";
import { emptyCatalogGroup, emptyWorkerChecklist } from "../../kynextData.js";
import { H5_SX, ReadOnlyValue } from "./TemplateBlockLayout.jsx";
import { CatalogGroupsTable } from "./TemplateCatalogItemTable.jsx";
import { ChecklistSlotTabs } from "./TemplateChecklistBlock.jsx";

// ===== 作業員サインブロック > チェックリストブロック（本番 templateEdit/blocks/WorkerChecklistBlock） =====
// サイン・写真設定（signatureCatalogV2）と、n回目ごとの作業員チェックリスト（workerChecklistCatalogSlots）。

// サイン／写真の 1 行。「必須」は任意フラグ（*Optional）の反転。
function SignatureRow({ label, checked, onChange, required, onRequiredChange, requiredFixed, readOnly }) {
  return (
    <Stack direction="row" sx={{ alignItems: "center", flexWrap: "wrap" }}>
      <FormControlLabel control={<Checkbox checked={!!checked} disabled={readOnly} onChange={(e) => onChange(e.target.checked)} />} label={label} sx={{ width: 180 }} />
      {checked && (
        <Stack direction="row" sx={{ alignItems: "center" }}>
          <Typography variant="body2">(</Typography>
          <Checkbox checked={!!required} disabled={readOnly || requiredFixed} size="small" sx={{ p: 0 }} onChange={(e) => onRequiredChange?.(e.target.checked)} />
          <Typography variant="body2">必須)</Typography>
        </Stack>
      )}
    </Stack>
  );
}

export function TemplateWorkerChecklistBlock({ slots, signatureCatalog, onChange, readOnly }) {
  const sig = signatureCatalog ?? {};
  const setSig = (patch) => onChange({ slots, signatureCatalog: { ...sig, ...patch } });
  const setSlots = (next) => onChange({ slots: next, signatureCatalog: sig });
  // チェックリストなし＝スロットが空（本番 workerChecklistSignatureOnly）
  const signatureOnly = slots.length === 0;

  return (
    <Stack sx={{ alignItems: "center" }}>
      <Box sx={{ width: "100%" }}>
        <Stack spacing={1} sx={{ mb: 2 }}>
          <Typography variant="h5" sx={H5_SX}>
            サイン・写真設定
          </Typography>
          <SignatureRow label="サイン" checked={sig.hasIndividualWorkerSignature} onChange={(v) => setSig({ hasIndividualWorkerSignature: v })} required requiredFixed readOnly={readOnly} />
          <SignatureRow
            label="職人個人写真"
            checked={sig.hasIndividualWorkerPhoto}
            onChange={(v) => setSig({ hasIndividualWorkerPhoto: v, ...(v ? {} : { individualWorkerOptional: true }) })}
            required={!sig.individualWorkerOptional}
            onRequiredChange={(v) => setSig({ individualWorkerOptional: !v })}
            readOnly={readOnly}
          />
          <SignatureRow label="職長撮影写真" checked={sig.hasGroupPhoto} onChange={(v) => setSig({ hasGroupPhoto: v, ...(v ? {} : { groupPhotoOptional: true }) })} required={!sig.groupPhotoOptional} onRequiredChange={(v) => setSig({ groupPhotoOptional: !v })} readOnly={readOnly} />
        </Stack>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="h5" sx={H5_SX}>
          チェックリスト設定
        </Typography>
        <FormControlLabel control={<Checkbox checked={signatureOnly} disabled={readOnly} onChange={(e) => setSlots(e.target.checked ? [] : [emptyWorkerChecklist()])} />} label="チェックリストなし" />
        {!signatureOnly && (
          <ChecklistSlotTabs
            slots={slots}
            onChange={setSlots}
            readOnly={readOnly}
            newSlot={emptyWorkerChecklist}
            confirmMessage="タブの内容が失われますがよろしいですか？"
            renderSlot={(slot, index, update) => (
              <>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" }, mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    {readOnly ? (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          チェックリスト名
                        </Typography>
                        <ReadOnlyValue>{slot.name || `${index + 1}回目チェックリスト`}</ReadOnlyValue>
                      </Box>
                    ) : (
                      <TextField label="チェックリスト名" size="small" fullWidth value={slot.name} placeholder={`${index + 1}回目チェックリスト`} slotProps={{ htmlInput: { maxLength: 100 } }} onChange={(e) => update({ ...slot, name: e.target.value })} />
                    )}
                  </Box>
                  <FormControlLabel label="自分が行う作業を選択させる" labelPlacement="start" sx={{ mr: 0, whiteSpace: "nowrap" }} control={<Switch size="small" color="success" checked={!!slot.selectRiskAssessmentItem} disabled={readOnly} onChange={(e) => update({ ...slot, selectRiskAssessmentItem: e.target.checked })} />} />
                </Stack>
                <CatalogGroupsTable groups={slot.itemGroups ?? []} onChange={(next) => update({ ...slot, itemGroups: next })} readOnly={readOnly} newGroup={emptyCatalogGroup} nameMaxLength={100} />
              </>
            )}
          />
        )}
      </Box>
    </Stack>
  );
}
