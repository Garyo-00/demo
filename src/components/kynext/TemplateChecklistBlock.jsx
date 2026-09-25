import { useState } from "react";
import { Box, Button, FormControlLabel, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Stack, Switch, Tab, Tabs, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { emptyCatalogGroup, emptyForepersonChecklist, newId } from "../../kynextData.js";
import { useConfirmDialog } from "./KynextCommon.jsx";
import { ReadOnlyValue, TabPanel, useTabParam } from "./TemplateBlockLayout.jsx";
import { CatalogGroupsTable } from "./TemplateCatalogItemTable.jsx";

// ===== 職長チェックリストブロック（本番 templateEdit/blocks/KYNEXTSheetChecklistBlock） =====
// 「n回目」のタブごとにチェックリストを持つ（最大 10）。タブの ⋮ で移動・追加・コピー・削除。

const MAX_SLOTS = 10;
const deepCopy = (v) => JSON.parse(JSON.stringify(v));
const withNewIds = (checklist) => ({
  ...deepCopy(checklist),
  id: newId(),
  itemGroups: checklist.itemGroups.map((g) => ({ ...deepCopy(g), id: newId(), items: g.items.map((it) => ({ ...deepCopy(it), id: newId(), options: (it.options ?? []).map((o) => ({ ...o, id: newId() })) })) })),
});

/**
 * スロット（n回目）タブの共通部品。作業員チェックリストブロックでも使う。
 * slots: チェックリストの配列 / renderSlot(slot, index, update) / newSlot() / confirmMessage
 */
export function ChecklistSlotTabs({ slots, onChange, readOnly, renderSlot, newSlot, confirmMessage }) {
  const [tab, setTab] = useTabParam(MAX_SLOTS);
  const [menu, setMenu] = useState(null); // { el, index }
  const effectiveTab = tab < slots.length ? tab : 0;
  const canAdd = slots.length < MAX_SLOTS;
  const { confirm, renderDialog } = useConfirmDialog({ title: "確認", children: confirmMessage });

  const insertAt = (index, slot) => {
    if (!canAdd) return;
    const next = [...slots];
    next.splice(index, 0, slot);
    onChange(next);
    setTab(index);
  };
  const move = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= slots.length) return;
    const next = [...slots];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
    setTab(target);
  };
  const remove = async (index) => {
    if (slots.length <= 1) return;
    const { accepted } = await confirm();
    if (!accepted) return;
    onChange(slots.filter((_, i) => i !== index));
    if (tab >= index) setTab(Math.max(0, tab - 1));
  };

  const menuIndex = menu?.index ?? 0;
  const run = (fn) => () => {
    setMenu(null);
    fn();
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center" }}>
        <Tabs value={effectiveTab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 48 }} variant="scrollable" allowScrollButtonsMobile>
          {slots.map((_, index) => (
            <Tab
              key={index}
              value={index}
              label={
                !readOnly ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    {`${index + 1}回目`}
                    <IconButton
                      component="span"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenu({ el: e.currentTarget, index });
                      }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ) : (
                  `${index + 1}回目`
                )
              }
            />
          ))}
        </Tabs>
        {canAdd && !readOnly && (
          <Button size="small" variant="text" startIcon={<AddIcon />} onClick={() => insertAt(slots.length, newSlot())} sx={{ ml: 1, whiteSpace: "nowrap" }}>
            追加する
          </Button>
        )}
      </Box>
      {slots.map((slot, index) => (
        <TabPanel key={index} value={effectiveTab} index={index}>
          {renderSlot(slot, index, (next) => onChange(slots.map((s, i) => (i === index ? next : s))))}
        </TabPanel>
      ))}
      <Menu anchorEl={menu?.el ?? null} open={!!menu} onClose={() => setMenu(null)}>
        <MenuItem disabled={menuIndex <= 0} onClick={run(() => move(menuIndex, -1))}>
          <ListItemIcon>
            <ArrowBackIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>左に移動</ListItemText>
        </MenuItem>
        <MenuItem disabled={menuIndex >= slots.length - 1} onClick={run(() => move(menuIndex, 1))}>
          <ListItemIcon>
            <ArrowForwardIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>右に移動</ListItemText>
        </MenuItem>
        <MenuItem disabled={!canAdd} onClick={run(() => insertAt(menuIndex, newSlot()))}>
          <ListItemIcon>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>左に追加</ListItemText>
        </MenuItem>
        <MenuItem disabled={!canAdd} onClick={run(() => insertAt(menuIndex + 1, newSlot()))}>
          <ListItemIcon>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>右に追加</ListItemText>
        </MenuItem>
        <MenuItem disabled={!canAdd} onClick={run(() => insertAt(menuIndex, withNewIds(slots[menuIndex])))}>
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>左にコピー</ListItemText>
        </MenuItem>
        <MenuItem disabled={!canAdd} onClick={run(() => insertAt(menuIndex + 1, withNewIds(slots[menuIndex])))}>
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>右にコピー</ListItemText>
        </MenuItem>
        <MenuItem disabled={slots.length <= 1} onClick={run(() => remove(menuIndex))}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>削除</ListItemText>
        </MenuItem>
      </Menu>
      {renderDialog()}
    </Box>
  );
}

export function TemplateChecklistBlock({ checklists, onChange, readOnly }) {
  // 編集時にスロットが空なら 1 つ目を作って始める（本番 isFirstSlotNull）
  const slots = checklists.length ? checklists : [emptyForepersonChecklist()];

  return (
    <Stack sx={{ alignItems: "center" }}>
      <ChecklistSlotTabs
        slots={slots}
        onChange={onChange}
        readOnly={readOnly}
        newSlot={emptyForepersonChecklist}
        confirmMessage="タブ内容が失われますがよろしいですか？"
        renderSlot={(slot, _index, update) => (
          <>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" }, mb: 2 }}>
              <Box sx={{ flex: 1 }}>
                {readOnly ? (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      チェックリスト名
                    </Typography>
                    <ReadOnlyValue>{slot.name}</ReadOnlyValue>
                  </Box>
                ) : (
                  <TextField label="チェックリスト名" size="small" fullWidth value={slot.name} slotProps={{ htmlInput: { maxLength: 100 } }} onChange={(e) => update({ ...slot, name: e.target.value })} error={!slot.name} helperText={!slot.name ? "入力してください" : ""} />
                )}
              </Box>
              <FormControlLabel label="署名あり" labelPlacement="start" sx={{ mr: 0, whiteSpace: "nowrap" }} control={<Switch size="small" color="success" checked={!!slot.hasSignature} disabled={readOnly} onChange={(e) => update({ ...slot, hasSignature: e.target.checked })} />} />
            </Stack>
            <CatalogGroupsTable groups={slot.itemGroups ?? []} onChange={(next) => update({ ...slot, itemGroups: next })} readOnly={readOnly} newGroup={emptyCatalogGroup} nameMaxLength={100} />
          </>
        )}
      />
    </Stack>
  );
}
