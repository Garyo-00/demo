import { Fragment, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HelpOutlineIcon from "@mui/icons-material/HelpOutlineOutlined";
import ImageIcon from "@mui/icons-material/Image";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import LinkIcon from "@mui/icons-material/Link";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SettingsIcon from "@mui/icons-material/Settings";
import { ITEM_TYPE_LABEL, INTERNAL_USE_LABEL, emptyCatalogItem, emptyCatalogOption, isCatalogItemEditable, newId } from "../../kynextData.js";
import { ReadOnlyValue } from "./TemplateBlockLayout.jsx";

// ===== カタログ項目の表（本番 settings/CatalogItemGroupTable + CatalogItemTable + OptionItemsTable + 各設定ダイアログ） =====
// 基本情報ブロック・職長チェックリスト・作業員チェックリストで同じ UI を使う。
// 本番は react-hook-form のパスで値を持つが、デモは items 配列と onChange(next) で持ち回る。
// 並び替えは @dnd-kit が無いので上下ボタンで代替する。

// 上限（本番 validateChecklistItem）
export const GROUP_MAX_COUNT = 30;
export const ITEM_MAX_COUNT = 50;
export const OPTION_MAX_COUNT = 100;

// 回答タイプの選択肢（本番 useItemTypes）。参照選択は基本情報ブロックだけ。
const ITEM_TYPES = ["ButtonSelection", "CheckboxSelection", "Text", "HourMinutes", "Date", "Number", "NumberPicker", "File"];

const isSelectionType = (t) => t === "ButtonSelection" || t === "CheckboxSelection";
const isNumberType = (t) => t === "Number" || t === "NumberPicker";

// 配列操作のユーティリティ
const moveItem = (list, from, to) => {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [m] = next.splice(from, 1);
  next.splice(to, 0, m);
  return next;
};
const replaceAt = (list, index, value) => list.map((x, i) => (i === index ? value : x));
const deepCopy = (v) => JSON.parse(JSON.stringify(v));

// 関連付け（条件）の表示ラベル（本番 getConditionLabel）
const conditionLabel = (item, items) => {
  const cond = item.settings?.condition;
  if (!cond?.item) return null;
  const src = items.find((x) => x.id === cond.item);
  const opt = src?.options?.find((o) => o.id === cond.option);
  const srcName = src?.name || "項目";
  return opt ? `[${srcName} / ${opt.name || "選択肢"}]` : `[${srcName}]`;
};

// ---------- 選択肢の設定ダイアログ（本番 OptionSettingsDialog） ----------
function OptionSettingsDialog({ option, isAlerted, useText, readOnly, onClose, onSave }) {
  const [alerted, setAlerted] = useState(isAlerted);
  const [hasText, setHasText] = useState(!!option.hasText);
  const [textLabel, setTextLabel] = useState(option.textLabel ?? "");
  const [textRequired, setTextRequired] = useState(!!option.textRequired);
  const textLabelError = textLabel.length > 100 ? "100文字以内で入力してください" : undefined;

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>設定</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            選択肢: {option.name || "(未入力)"}
          </Typography>
          <FormControlLabel control={<Switch checked={alerted} onChange={() => setAlerted((v) => !v)} disabled={readOnly} />} label="通知" />
          {useText && (
            <>
              <FormControlLabel control={<Switch checked={hasText} onChange={() => setHasText((v) => !v)} disabled={readOnly} />} label="(+自由記述)" />
              {hasText && (
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <TextField size="small" label="自由記述ラベル" value={textLabel} onChange={(e) => setTextLabel(e.target.value)} disabled={readOnly} error={!!textLabelError} helperText={textLabelError} sx={{ flex: 1 }} />
                  <FormControlLabel control={<Checkbox checked={textRequired} onChange={() => setTextRequired((v) => !v)} disabled={readOnly} size="small" />} label="必須" />
                </Stack>
              )}
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{readOnly ? "閉じる" : "キャンセル"}</Button>
        {!readOnly && (
          <Button variant="contained" disabled={!!textLabelError} onClick={() => onSave({ alerted, hasText, textLabel, textRequired })}>
            OK
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

// ---------- 選択肢の表（本番 OptionItemsTable） ----------
function OptionItemsTable({ item, onChange, readOnly, itemEditable }) {
  const options = item.options ?? [];
  const [settingsIdx, setSettingsIdx] = useState(null);
  const alerted = item.settings?.alertSettings?.options ?? [];
  const setOptions = (next) => onChange({ ...item, options: next });

  return (
    <Box sx={{ px: { xs: 0, sm: "50px" } }}>
      <Table size="small" sx={{ tableLayout: "fixed" }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 72, px: 0 }} />
            <TableCell sx={{ width: 32, textAlign: "center" }}>#</TableCell>
            <TableCell>選択肢名</TableCell>
            <TableCell sx={{ width: 40, px: 0, textAlign: "center" }}>設定</TableCell>
            <TableCell sx={{ width: 32, px: 0 }} />
          </TableRow>
        </TableHead>
        <TableBody>
          {options.map((opt, i) => (
            <TableRow key={opt.id ?? i}>
              <TableCell sx={{ px: 0 }}>
                {!readOnly && itemEditable && (
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <IconButton size="small" disabled={i === 0} onClick={() => setOptions(moveItem(options, i, i - 1))} sx={{ p: 0.25 }}>
                      <ArrowUpwardIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton size="small" disabled={i === options.length - 1} onClick={() => setOptions(moveItem(options, i, i + 1))} sx={{ p: 0.25 }}>
                      <ArrowDownwardIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                )}
              </TableCell>
              <TableCell sx={{ textAlign: "center" }}>
                <Typography variant="body2">{i + 1}</Typography>
              </TableCell>
              <TableCell>
                {readOnly ? (
                  <ReadOnlyValue>{opt.name}</ReadOnlyValue>
                ) : (
                  <TextField size="small" fullWidth value={opt.name} disabled={!itemEditable} onChange={(e) => setOptions(replaceAt(options, i, { ...opt, name: e.target.value }))} error={!opt.name} helperText={!opt.name ? "入力してください" : ""} />
                )}
              </TableCell>
              <TableCell sx={{ px: 0, textAlign: "center" }}>
                <Tooltip title="設定">
                  <span>
                    <IconButton size="small" onClick={() => setSettingsIdx(i)} sx={{ p: 0.5 }}>
                      <SettingsIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </TableCell>
              <TableCell sx={{ px: 0 }}>
                {!readOnly && itemEditable && options.length > 2 && (
                  <IconButton size="small" onClick={() => setOptions(options.filter((_, j) => j !== i))}>
                    <DeleteIcon fontSize="small" color="error" />
                  </IconButton>
                )}
              </TableCell>
            </TableRow>
          ))}
          {!readOnly && itemEditable && options.length < OPTION_MAX_COUNT && (
            <TableRow>
              <TableCell colSpan={5} sx={{ textAlign: "center", py: 0.5, border: 0 }}>
                <IconButton size="small" onClick={() => setOptions([...options, emptyCatalogOption()])} aria-label="選択肢を追加">
                  <AddIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {settingsIdx != null && options[settingsIdx] && (
        <OptionSettingsDialog
          option={options[settingsIdx]}
          isAlerted={alerted.includes(options[settingsIdx].id)}
          useText={isSelectionType(item.type)}
          readOnly={readOnly || !itemEditable}
          onClose={() => setSettingsIdx(null)}
          onSave={({ alerted: isAlerted, hasText, textLabel, textRequired }) => {
            const opt = options[settingsIdx];
            const nextAlert = isAlerted ? Array.from(new Set([...alerted, opt.id])) : alerted.filter((x) => x !== opt.id);
            onChange({
              ...item,
              options: replaceAt(options, settingsIdx, { ...opt, hasText, textLabel: hasText ? textLabel : "", textRequired: hasText ? textRequired : false }),
              settings: { ...(item.settings ?? {}), alertSettings: nextAlert.length ? { options: nextAlert } : undefined },
            });
            setSettingsIdx(null);
          }}
        />
      )}
    </Box>
  );
}

// ---------- 項目の設定ダイアログ（本番 ItemSettingsDialog + ConditionSettingsDialog） ----------
// 一般設定（参考画像）／数値設定／自由記述設定 に加えて、他項目の選択肢で表示を切り替える「関連付け」をここで設定する。
function ItemSettingsDialog({ item, items, readOnly, onClose, onSave }) {
  const showNumber = isNumberType(item.type);
  const hideStep = item.type === "Number";
  const showText = item.type === "Text";
  const nps = item.settings?.numberPickerSettings ?? {};
  const [attachmentName, setAttachmentName] = useState(item.attachment?.name ?? "");
  const [decimalPlaces, setDecimalPlaces] = useState(nps.decimalPlaces ?? 0);
  const [min, setMin] = useState(nps.min ?? "");
  const [max, setMax] = useState(nps.max ?? "");
  const [step, setStep] = useState(nps.step ?? "");
  const [numberErrors, setNumberErrors] = useState([]);
  const maxAnswer = item.settings?.textSettings?.maxAnswerCount;
  const [multipleAnswer, setMultipleAnswer] = useState((maxAnswer ?? 0) > 1);
  const [maxAnswerCount, setMaxAnswerCount] = useState(maxAnswer > 1 ? maxAnswer : 2);
  // 関連付け。条件にできるのは同じグループ内の自分以外の単一／複数選択項目
  const cond = item.settings?.condition;
  const [hasCondition, setHasCondition] = useState(!!cond?.item);
  const [condItem, setCondItem] = useState(cond?.item ?? "");
  const [condOption, setCondOption] = useState(cond?.option ?? "");
  const availableItems = items.filter((x) => x.id !== item.id && isSelectionType(x.type));
  const selectedSrc = availableItems.find((x) => x.id === condItem);

  const handleSave = () => {
    const next = { ...item, settings: { ...(item.settings ?? {}) } };
    if (showNumber) {
      const errs = [];
      const minN = min === "" ? null : Number(min);
      const maxN = max === "" ? null : Number(max);
      if (!hideStep && minN == null) errs.push("最小値を入力してください");
      if (!hideStep && maxN == null) errs.push("最大値を入力してください");
      if (minN != null && maxN != null && minN >= maxN) errs.push("最大値は最小値より大きい値を設定してください");
      if (errs.length) {
        setNumberErrors(errs);
        return;
      }
      next.settings.numberPickerSettings = { decimalPlaces, step: hideStep || step === "" ? undefined : Number(step), min: minN ?? undefined, max: maxN ?? undefined };
    }
    if (showText) next.settings.textSettings = multipleAnswer ? { maxAnswerCount } : undefined;
    next.settings.condition = hasCondition && condItem ? { item: condItem, option: condOption || null } : undefined;
    next.attachment = attachmentName ? { id: item.attachment?.id ?? newId(), name: attachmentName, path: "" } : null;
    onSave(next);
  };

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>設定</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Stack spacing={1.5}>
            <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
              一般設定
            </Typography>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 80, flexShrink: 0 }}>
                <Typography variant="body2">参考画像</Typography>
                <Tooltip title="項目名の横に参考画像として表示されます">
                  <HelpOutlineIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                </Tooltip>
              </Box>
              {readOnly ? (
                attachmentName && (
                  <Typography variant="body2" color="success.main" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <ImageIcon fontSize="small" /> {attachmentName}
                  </Typography>
                )
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Button size="small" component="label" startIcon={<ImageIcon fontSize="small" />} sx={{ color: attachmentName ? "success.main" : "text.primary" }}>
                    {attachmentName || "画像アップロード"}
                    <input type="file" accept="image/*" hidden onChange={(e) => setAttachmentName(e.target.files?.[0]?.name ?? "")} />
                  </Button>
                  {attachmentName && (
                    <IconButton size="small" onClick={() => setAttachmentName("")} aria-label="参考画像を外す">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              )}
            </Stack>
          </Stack>

          {showNumber && (
            <>
              <Divider />
              <Stack spacing={2}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                  {hideStep ? "数値入力設定" : "数値選択設定"}
                </Typography>
                {numberErrors.length > 0 && (
                  <Alert severity="error">
                    {numberErrors.map((e) => (
                      <div key={e}>{e}</div>
                    ))}
                  </Alert>
                )}
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <Typography variant="body2" sx={{ minWidth: 80, flexShrink: 0 }}>
                    小数点桁数
                  </Typography>
                  <Select size="small" value={decimalPlaces} onChange={(e) => setDecimalPlaces(Number(e.target.value))} sx={{ minWidth: 100 }} disabled={readOnly}>
                    <MenuItem value={0}>0（整数）</MenuItem>
                    <MenuItem value={1}>1</MenuItem>
                    <MenuItem value={2}>2</MenuItem>
                    <MenuItem value={3}>3</MenuItem>
                  </Select>
                </Stack>
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <Typography variant="body2" sx={{ minWidth: 80, flexShrink: 0 }}>
                    最小値
                  </Typography>
                  <TextField label="最小値" size="small" type="number" value={min} onChange={(e) => setMin(e.target.value)} placeholder="例: 0" disabled={readOnly} error={numberErrors.length > 0} />
                </Stack>
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <Typography variant="body2" sx={{ minWidth: 80, flexShrink: 0 }}>
                    最大値
                  </Typography>
                  <TextField label="最大値" size="small" type="number" value={max} onChange={(e) => setMax(e.target.value)} placeholder="例: 100" disabled={readOnly} error={numberErrors.length > 0} />
                </Stack>
                {!hideStep && (
                  <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                    <Typography variant="body2" sx={{ minWidth: 80, flexShrink: 0 }}>
                      刻み
                    </Typography>
                    <TextField label="刻み" size="small" type="number" value={step} onChange={(e) => setStep(e.target.value)} placeholder="例: 1" disabled={readOnly} />
                  </Stack>
                )}
              </Stack>
            </>
          )}

          {showText && (
            <>
              <Divider />
              <Stack spacing={1.5}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                  自由記述設定
                </Typography>
                <FormControlLabel control={<Checkbox checked={multipleAnswer} onChange={(e) => setMultipleAnswer(e.target.checked)} disabled={readOnly} />} label="複数回答" />
                {multipleAnswer && (
                  <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                    <Typography variant="body2" sx={{ minWidth: 120, flexShrink: 0 }}>
                      上限
                    </Typography>
                    <Select size="small" value={maxAnswerCount} onChange={(e) => setMaxAnswerCount(Number(e.target.value))} sx={{ minWidth: 100 }} disabled={readOnly}>
                      {Array.from({ length: 19 }, (_, i) => i + 2).map((n) => (
                        <MenuItem key={n} value={n}>
                          {n}
                        </MenuItem>
                      ))}
                    </Select>
                  </Stack>
                )}
              </Stack>
            </>
          )}

          <Divider />
          <Stack spacing={1.5}>
            <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
              関連付け設定
            </Typography>
            <FormControlLabel label="関連付け" control={<Checkbox checked={hasCondition} onChange={(e) => setHasCondition(e.target.checked)} disabled={readOnly || availableItems.length === 0} size="small" />} />
            {availableItems.length === 0 && (
              <Typography variant="caption" color="text.secondary">
                関連付けできる対象がありません
              </Typography>
            )}
            {hasCondition && (
              <>
                <FormControl size="small" fullWidth>
                  <InputLabel>項目（条件）</InputLabel>
                  <Select
                    value={condItem}
                    label="項目（条件）"
                    disabled={readOnly}
                    onChange={(e) => {
                      setCondItem(e.target.value);
                      setCondOption("");
                    }}
                  >
                    {availableItems.map((x) => (
                      <MenuItem key={x.id} value={x.id}>
                        {x.name || `項目${items.indexOf(x) + 1}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" fullWidth>
                  <InputLabel>選択肢</InputLabel>
                  <Select value={condOption} label="選択肢" disabled={readOnly || !condItem} onChange={(e) => setCondOption(e.target.value)}>
                    {(selectedSrc?.options ?? []).map((o, i) => (
                      <MenuItem key={o.id} value={o.id}>
                        {o.name || `選択肢${i + 1}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{readOnly ? "閉じる" : "キャンセル"}</Button>
        {!readOnly && (
          <Button variant="contained" onClick={handleSave}>
            保存
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

// ---------- 項目の表（本番 CatalogItemTable） ----------
export function CatalogItemTable({ items, onChange, readOnly, maxCount = ITEM_MAX_COUNT, allowReferenceSelection = false, groupEditable = true }) {
  const [closed, setClosed] = useState({});
  const [menu, setMenu] = useState(null); // { el, index }
  const [settingsIdx, setSettingsIdx] = useState(null);
  const itemTypes = allowReferenceSelection ? [...ITEM_TYPES, "ReferenceSelection"] : ITEM_TYPES;

  const setItem = (i, next) => onChange(replaceAt(items, i, next));
  const addAt = (index) => {
    if (items.length >= maxCount) return;
    const next = [...items];
    next.splice(index, 0, emptyCatalogItem());
    onChange(next);
  };
  const copyAt = (src, index) => {
    if (items.length >= maxCount) return;
    const copied = { ...deepCopy(items[src]), id: newId(), name: `${items[src].name}_コピー` };
    copied.options = (copied.options ?? []).map((o) => ({ ...o, id: newId() }));
    const next = [...items];
    next.splice(index, 0, copied);
    onChange(next);
  };

  const expandable = items.map((it, i) => (isSelectionType(it.type) ? i : -1)).filter((i) => i >= 0);
  const allClosed = expandable.length > 0 && expandable.every((i) => closed[i]);

  const changeType = (i, type) => {
    const it = items[i];
    const next = { ...it, type };
    if (isSelectionType(type) && (it.options ?? []).length === 0) next.options = [emptyCatalogOption(), emptyCatalogOption()];
    setItem(i, next);
    if (isSelectionType(type) && closed[i]) setClosed((c) => ({ ...c, [i]: false }));
  };

  return (
    <>
      <Box sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ tableLayout: "fixed", minWidth: 640 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 28, px: 0 }}>
                {expandable.length > 0 && (
                  <IconButton size="small" sx={{ p: 0.5 }} onClick={() => setClosed(allClosed ? {} : Object.fromEntries(expandable.map((i) => [i, true])))}>
                    {allClosed ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowUpIcon fontSize="small" />}
                  </IconButton>
                )}
              </TableCell>
              <TableCell sx={{ width: readOnly ? 0 : 88, px: 0 }} />
              <TableCell sx={{ width: 30, textAlign: "center", px: 0 }}>#</TableCell>
              <TableCell>項目名</TableCell>
              <TableCell sx={{ width: 150 }}>回答タイプ</TableCell>
              <TableCell sx={{ width: 56 }}>必須</TableCell>
              <TableCell sx={{ width: 48 }}>設定</TableCell>
              <TableCell sx={{ width: 36, px: 0 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, i) => {
              const editable = isCatalogItemEditable(item) && groupEditable;
              const hasOptions = isSelectionType(item.type);
              const open = !closed[i];
              const typeOptions = itemTypes.includes(item.type) ? itemTypes : [...itemTypes, item.type];
              const cLabel = conditionLabel(item, items);
              return (
                <Fragment key={item.id ?? i}>
                  <TableRow>
                    <TableCell sx={{ px: 0 }}>
                      {hasOptions && (
                        <IconButton size="small" sx={{ p: 0.5 }} onClick={() => setClosed((c) => ({ ...c, [i]: !c[i] }))}>
                          {open ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                        </IconButton>
                      )}
                    </TableCell>
                    <TableCell sx={{ px: 0 }}>
                      {!readOnly && (
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <IconButton size="small" sx={{ p: 0.25 }} disabled={i === 0} onClick={() => onChange(moveItem(items, i, i - 1))} aria-label="上へ">
                            <ArrowUpwardIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                          <IconButton size="small" sx={{ p: 0.25 }} disabled={i === items.length - 1} onClick={() => onChange(moveItem(items, i, i + 1))} aria-label="下へ">
                            <ArrowDownwardIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                          <IconButton size="small" onClick={(e) => setMenu({ el: e.currentTarget, index: i })}>
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell sx={{ textAlign: "center", px: 0 }}>
                      <Typography variant="body2">{i + 1}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {INTERNAL_USE_LABEL[item.internalUseType] && (
                          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                            ({INTERNAL_USE_LABEL[item.internalUseType]})
                          </Typography>
                        )}
                        {readOnly ? (
                          <ReadOnlyValue>{item.name}</ReadOnlyValue>
                        ) : (
                          <TextField size="small" fullWidth value={item.name} onChange={(e) => setItem(i, { ...item, name: e.target.value })} error={!item.name} helperText={!item.name ? "入力してください" : ""} />
                        )}
                        {cLabel && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
                            <LinkIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                              {cLabel}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <Select value={item.type} disabled={readOnly || !editable} onChange={(e) => changeType(i, e.target.value)}>
                          {typeOptions.map((t) => (
                            <MenuItem key={t} value={t}>
                              {ITEM_TYPE_LABEL[t] ?? t}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <Checkbox checked={!item.optional} size="small" disabled={readOnly || !editable} onChange={(e) => setItem(i, { ...item, optional: !e.target.checked })} />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => setSettingsIdx(i)} title="設定">
                        <SettingsIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                    <TableCell sx={{ px: 0 }}>
                      {!readOnly && (
                        <IconButton size="small" color="error" disabled={!editable} onClick={() => onChange(items.filter((_, j) => j !== i))}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                  {hasOptions && (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ py: 0, borderBottom: "none" }}>
                        <Collapse in={open} timeout="auto" unmountOnExit>
                          <OptionItemsTable item={item} onChange={(next) => setItem(i, next)} readOnly={readOnly} itemEditable={editable} />
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </Box>
      {!readOnly && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
          <Button variant="outlined" startIcon={<AddIcon />} size="small" onClick={() => addAt(items.length)} disabled={items.length >= maxCount}>
            項目を追加
          </Button>
        </Box>
      )}
      {/* 行メニュー（本番 ItemRowMenu） */}
      <Menu anchorEl={menu?.el ?? null} open={!!menu} onClose={() => setMenu(null)}>
        {[
          { label: "上に追加", icon: <AddIcon fontSize="small" />, run: () => addAt(menu.index) },
          { label: "下に追加", icon: <AddIcon fontSize="small" />, run: () => addAt(menu.index + 1) },
          { label: "上にコピー", icon: <ContentCopyIcon fontSize="small" />, run: () => copyAt(menu.index, menu.index), copy: true },
          { label: "下にコピー", icon: <ContentCopyIcon fontSize="small" />, run: () => copyAt(menu.index, menu.index + 1), copy: true },
        ].map((m) => (
          <MenuItem
            key={m.label}
            disabled={items.length >= maxCount || (m.copy && menu && !isCatalogItemEditable(items[menu.index]))}
            onClick={() => {
              m.run();
              setMenu(null);
            }}
          >
            <ListItemIcon>{m.icon}</ListItemIcon>
            <ListItemText>{m.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
      {settingsIdx != null && items[settingsIdx] && (
        <ItemSettingsDialog
          item={items[settingsIdx]}
          items={items}
          readOnly={readOnly || !isCatalogItemEditable(items[settingsIdx])}
          onClose={() => setSettingsIdx(null)}
          onSave={(next) => {
            setItem(settingsIdx, next);
            setSettingsIdx(null);
          }}
        />
      )}
    </>
  );
}

// ---------- グループの表（本番 CatalogItemGroupTable） ----------
// groups: [{ id, name, optional, items }]。「必須」チェック＝該当なし不可（optional=false）。
export function CatalogGroupsTable({ groups, onChange, readOnly, newGroup, maxCount = GROUP_MAX_COUNT, nameMaxLength, allowReferenceSelection = false, showAddButton = true }) {
  const [closed, setClosed] = useState({});
  const [menu, setMenu] = useState(null);
  const allOpen = groups.length > 0 && groups.every((_, i) => !closed[i]);
  const setGroup = (i, next) => onChange(replaceAt(groups, i, next));
  const addAt = (index) => {
    if (groups.length >= maxCount) return;
    const next = [...groups];
    next.splice(index, 0, newGroup());
    onChange(next);
  };

  return (
    <>
      <Box sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ tableLayout: "fixed", minWidth: 640 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 32, px: 0 }}>
                {groups.length > 0 && (
                  <IconButton size="small" sx={{ p: 0.5 }} onClick={() => setClosed(allOpen ? Object.fromEntries(groups.map((_, i) => [i, true])) : {})}>
                    {allOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  </IconButton>
                )}
              </TableCell>
              <TableCell sx={{ width: readOnly ? 0 : 88, px: 0 }} />
              <TableCell sx={{ width: 32, textAlign: "center", px: 0 }}>#</TableCell>
              <TableCell>グループ名</TableCell>
              <TableCell sx={{ width: 64, textAlign: "center" }}>必須</TableCell>
              <TableCell sx={{ width: 40, px: 0 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {groups.map((g, i) => {
              const items = g.items ?? [];
              // 基本情報グループ（内部項目を含む）は名前を変えられない（本番 group.editable）
              const groupEditable = !items.some((it) => !isCatalogItemEditable(it));
              const canDelete = !items.some((it) => it.optional === false);
              const open = !closed[i];
              return (
                <Fragment key={g.id ?? i}>
                  <TableRow>
                    <TableCell sx={{ px: 0 }}>
                      <IconButton size="small" sx={{ p: 0.5 }} onClick={() => setClosed((c) => ({ ...c, [i]: !c[i] }))}>
                        {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                      </IconButton>
                    </TableCell>
                    <TableCell sx={{ px: 0 }}>
                      {!readOnly && (
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <IconButton size="small" sx={{ p: 0.25 }} disabled={i === 0} onClick={() => onChange(moveItem(groups, i, i - 1))} aria-label="上へ">
                            <ArrowUpwardIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                          <IconButton size="small" sx={{ p: 0.25 }} disabled={i === groups.length - 1} onClick={() => onChange(moveItem(groups, i, i + 1))} aria-label="下へ">
                            <ArrowDownwardIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                          <IconButton size="small" onClick={(e) => setMenu({ el: e.currentTarget, index: i })}>
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell sx={{ textAlign: "center", px: 0 }}>
                      <Typography variant="body2">{i + 1}</Typography>
                    </TableCell>
                    <TableCell>
                      {!readOnly && groupEditable ? (
                        <TextField size="small" fullWidth value={g.name} slotProps={{ htmlInput: nameMaxLength ? { maxLength: nameMaxLength } : undefined }} onChange={(e) => setGroup(i, { ...g, name: e.target.value })} error={!g.name} helperText={!g.name ? "入力してください" : ""} />
                      ) : (
                        <ReadOnlyValue>{g.name}</ReadOnlyValue>
                      )}
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      <Checkbox checked={!g.optional} size="small" disabled={readOnly || !groupEditable} onChange={(e) => setGroup(i, { ...g, optional: !e.target.checked })} />
                    </TableCell>
                    <TableCell sx={{ px: 0 }}>
                      {!readOnly && (
                        <Tooltip title={!canDelete ? "必須項目が含まれているため削除できません" : ""}>
                          <span>
                            <IconButton size="small" color="error" disabled={!canDelete} onClick={() => onChange(groups.filter((_, j) => j !== i))}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 0, borderBottom: "none" }}>
                      <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 1.5 }}>
                          <CatalogItemTable items={items} onChange={(next) => setGroup(i, { ...g, items: next })} readOnly={readOnly} allowReferenceSelection={allowReferenceSelection} groupEditable />
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </Box>
      {!readOnly && showAddButton && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
          <Button variant="outlined" startIcon={<AddIcon />} size="small" onClick={() => addAt(groups.length)} disabled={groups.length >= maxCount}>
            グループを追加
          </Button>
        </Box>
      )}
      <Menu anchorEl={menu?.el ?? null} open={!!menu} onClose={() => setMenu(null)}>
        <MenuItem
          disabled={groups.length >= maxCount}
          onClick={() => {
            addAt(menu.index);
            setMenu(null);
          }}
        >
          <ListItemIcon>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>上に追加</ListItemText>
        </MenuItem>
        <MenuItem
          disabled={groups.length >= maxCount}
          onClick={() => {
            addAt(menu.index + 1);
            setMenu(null);
          }}
        >
          <ListItemIcon>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>下に追加</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
