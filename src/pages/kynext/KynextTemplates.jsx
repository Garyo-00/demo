import { useMemo, useRef, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Checkbox,
  Chip,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import UploadIcon from "@mui/icons-material/Upload";
import { useKynext } from "../../components/kynext/KynextContext.jsx";
import { useConfirmDialog } from "../../components/kynext/KynextCommon.jsx";
import { buildCatalog } from "../../kynextData.js";
import { H4_SX, H6_SX } from "../../components/kynext/TemplateBlockLayout.jsx";

// ===== 設定（本番 pages/templates/index.tsx → TemplatesList） =====
// 使用中テンプレート・未ログインユーザーによる作成許可（現場設定）、テンプレート一覧（インポート／新規作成）、
// 元請向けの一括適用（ProjectApplicationDataGrid）と元請設定（CompanyKYNextSettings）。

// yyyy/MM/dd HH:mm（本番 formatDateTime）
const formatDateTime = (iso) => {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

// テンプレート名の入力ダイアログ（本番 useTemplateImport の renderDefaultDialog / renderImportDialog）
function TemplateNameDialogBody({ message, name, onChange, duplicate }) {
  return (
    <>
      <Typography sx={{ mb: 2 }}>{message}</Typography>
      <TextField label="テンプレート名" value={name} onChange={(e) => onChange(e.target.value)} fullWidth size="small" error={duplicate} helperText={duplicate ? "すでに存在します" : undefined} autoFocus />
    </>
  );
}

// 元請現場のテンプレート適用状況（本番 ProjectApplicationDataGrid）。DataGrid の代わりに MUI Table。
function ProjectApplicationTable({ projectTemplates }) {
  const { project, projects, templates, projectTemplateIds, applyTemplateToProjects, notify } = useKynext();
  const [selected, setSelected] = useState([]);
  const [templateId, setTemplateId] = useState("");
  const rows = useMemo(
    () =>
      projects
        .filter((p) => p.id !== project.id)
        .map((p) => {
          const t = templates.find((x) => x.id === projectTemplateIds[p.id]) ?? null;
          return { id: p.id, name: p.name, current: t };
        }),
    [projects, project.id, templates, projectTemplateIds]
  );
  const selectedTemplate = templates.find((t) => t.id === templateId);
  // 同名の別テンプレートが適用中の現場には適用できない（本番 hasNameConflict）
  const hasNameConflict = !!selectedTemplate && selected.some((pid) => {
    const cur = rows.find((r) => r.id === pid)?.current;
    return cur && cur.name === selectedTemplate.name && cur.id !== selectedTemplate.id;
  });
  const dialog = useConfirmDialog({ title: "確認", children: `${selected.length}個の現場に即時適用されます。本当によろしいですか？` });

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const allChecked = rows.length > 0 && selected.length === rows.length;

  const handleApply = async () => {
    const { accepted } = await dialog.confirm();
    if (!accepted) return;
    applyTemplateToProjects(templateId, selected);
    notify("テンプレートを適用しました");
    setSelected([]);
    setTemplateId("");
  };

  return (
    <>
      <Typography variant="h6" sx={{ ...H6_SX, my: 2 }}>
        元請現場のテンプレート適用状況
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "right", mb: 1 }}>
          (この現場は除く)
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox size="small" checked={allChecked} indeterminate={selected.length > 0 && !allChecked} onChange={(e) => setSelected(e.target.checked ? rows.map((r) => r.id) : [])} />
                </TableCell>
                <TableCell>現場名</TableCell>
                <TableCell>適用中テンプレート</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} hover selected={selected.includes(r.id)} onClick={() => toggle(r.id)} sx={{ cursor: "pointer" }}>
                  <TableCell padding="checkbox">
                    <Checkbox size="small" checked={selected.includes(r.id)} />
                  </TableCell>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <Typography variant="body2">{r.current?.name ?? "未設定"}</Typography>
                      {r.current?.isExternal && <Chip size="small" color="success" label="元請" />}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ color: "text.secondary" }}>
                    現場がありません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", mt: 2, flexWrap: "wrap", gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 240 }}>
            <Select value={templateId} displayEmpty onChange={(e) => setTemplateId(Number(e.target.value))} renderValue={(v) => (v ? <Typography>{templates.find((t) => t.id === v)?.name || "（名称未設定）"}</Typography> : <Typography color="text.secondary">選択してください</Typography>)}>
              {projectTemplates.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name || "（名称未設定）"}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" disabled={!templateId || selected.length === 0 || hasNameConflict} onClick={handleApply}>
            一括適用
          </Button>
          {hasNameConflict && (
            <Typography variant="body2" color="error">
              同名の別テンプレートが存在するため適用できません
            </Typography>
          )}
        </Stack>
      </Paper>
      {dialog.renderDialog()}
    </>
  );
}

// 元請設定（本番 companySettings/CompanyKYNextSettings）。リスクアセスメント AI の追加プロンプト。
function CompanyKynextSettings() {
  const { me, companySettings, updateCompanySettings, notify } = useKynext();
  const [form, setForm] = useState(companySettings);
  const [tune, setTune] = useState({ days: 3, maxSamples: 10, minSamples: 1 });
  const isDirty = JSON.stringify(form) !== JSON.stringify(companySettings);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const promptError = form.riskAssessmentAdditionalPrompt.length > 2000 ? "2000文字以内で入力してください" : undefined;

  const handleSave = () => {
    if (promptError) return;
    updateCompanySettings(form);
    notify("元請設定を更新しました");
  };
  const handleManualTune = () => {
    // 本番は直近の採用実績からプロンプトを再生成する。デモでは件数だけ通知する。
    notify(`追加プロンプトを更新しました（サンプル${tune.maxSamples}件 / 採用${Math.min(tune.maxSamples, 4)}件）`);
  };
  const numField = (key, label, max) => (
    <TextField label={label} type="number" size="small" sx={{ width: 120 }} value={tune[key]} slotProps={{ htmlInput: { min: 1, max, step: 1 } }} onChange={(e) => setTune((t) => ({ ...t, [key]: Number(e.target.value) }))} />
  );

  return (
    <>
      <Typography variant="h6" sx={{ ...H6_SX, my: 2 }}>
        元請設定({me.company} 全現場共通)
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle2">リスクアセスメントAI設定</Typography>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Typography sx={{ flexGrow: 1 }}>追加プロンプトを使用</Typography>
            <FormControlLabel label={form.useRiskAssessmentCustomPrompt ? "ON" : "OFF"} labelPlacement="start" sx={{ mr: 0 }} control={<Switch size="small" color="success" checked={form.useRiskAssessmentCustomPrompt} onChange={(e) => set({ useRiskAssessmentCustomPrompt: e.target.checked })} />} />
          </Stack>
          {form.useRiskAssessmentCustomPrompt && (
            <>
              <Stack spacing={0.5}>
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <Typography sx={{ flexGrow: 1 }}>追加プロンプトの更新方法</Typography>
                  <ToggleButtonGroup value={form.autoTuneRiskAssessmentSuggestionPrompt ? "auto" : "manual"} exclusive size="small" onChange={(_, v) => v && set({ autoTuneRiskAssessmentSuggestionPrompt: v === "auto" })}>
                    <ToggleButton value="auto">自動更新</ToggleButton>
                    <ToggleButton value="manual">手動入力</ToggleButton>
                  </ToggleButtonGroup>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: "right" }}>
                  毎週日曜日 AM03:00
                </Typography>
              </Stack>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: "right" }}>
                  プロンプトの手動更新（テスト用）
                </Typography>
                <TextField label="追加プロンプト" multiline minRows={4} fullWidth value={form.riskAssessmentAdditionalPrompt} disabled={form.autoTuneRiskAssessmentSuggestionPrompt} onChange={(e) => set({ riskAssessmentAdditionalPrompt: e.target.value })} error={!!promptError} helperText={promptError} slotProps={{ inputLabel: { shrink: true } }} />
              </Stack>
            </>
          )}
          <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
            <Button variant="contained" disabled={!isDirty || !!promptError} onClick={handleSave}>
              保存
            </Button>
          </Stack>
          {form.useRiskAssessmentCustomPrompt && (
            <>
              <Divider />
              <Typography variant="subtitle2">プロンプト更新手動実行（Arch管理者のみ）</Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { sm: "flex-start" } }}>
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                  {numField("days", "集計期間(日)", 365)}
                  {numField("maxSamples", "サンプル上限", 200)}
                  {numField("minSamples", "サンプル下限", 200)}
                </Stack>
                <Button variant="outlined" onClick={handleManualTune} sx={{ mt: 0.5, whiteSpace: "nowrap" }}>
                  手動更新
                </Button>
              </Stack>
            </>
          )}
        </Stack>
      </Paper>
    </>
  );
}

export default function KynextTemplates() {
  const navigate = useNavigate();
  const { me, templates, settings, applySettings, createTemplate, notify } = useKynext();
  const externalTemplates = templates.filter((t) => t.isExternal);
  const projectTemplates = templates.filter((t) => !t.isExternal);

  // 現場設定フォーム（本番 useForm）。変更が無ければ「適用」は disabled。
  const [form, setForm] = useState({ template: settings.currentTemplateId ?? 0, allowCreateGuestSheet: settings.allowCreateGuestSheet });
  const isDirty = form.template !== settings.currentTemplateId || form.allowCreateGuestSheet !== settings.allowCreateGuestSheet;
  const handleApply = () => {
    applySettings({ template: form.template, allowCreateGuestSheet: form.allowCreateGuestSheet });
    notify("現場の設定を変更しました");
  };

  // インポート／新規作成（本番 useTemplateImport）
  const fileInputRef = useRef(null);
  const [nameInput, setNameInputState] = useState("");
  // ダイアログの「はい」まで待つ間に state は閉じ込められるので、最新の入力値は ref でも持つ
  const nameRef = useRef("");
  const setNameInput = (v) => {
    nameRef.current = v;
    setNameInputState(v);
  };
  const isDuplicate = templates.some((t) => t.name === nameInput);
  // 入力名の検証（本番は yesDisabled で防ぐ。デモの確認ダイアログには無いので確定後に検証する）
  const validateName = () => {
    const name = nameRef.current.trim();
    if (!name) {
      notify("テンプレート名を入力してください", "error");
      return null;
    }
    if (templates.some((t) => t.name === name)) {
      notify("すでに存在します", "error");
      return null;
    }
    return name;
  };
  const importDialog = useConfirmDialog({ title: "テンプレートインポート確認", yesLabel: "はい" });
  const createDialog = useConfirmDialog({ title: "テンプレート新規作成", yesLabel: "はい" });

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    let parsed;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      notify("JSONファイルの読み込みに失敗しました", "error");
      return;
    }
    setNameInput(parsed?.name ?? "");
    const { accepted } = await importDialog.confirm();
    if (!accepted) return;
    const name = validateName();
    if (!name) return;
    // エクスポートした JSON（catalog 付き）ならそのまま取り込み、無ければ既定のカタログで作る
    const catalog = parsed?.catalog?.basicDetailCatalog ? parsed.catalog : buildCatalog();
    createTemplate({ name, catalog });
    notify("テンプレートをインポートしました");
  };
  const handleCreateFromDefault = async () => {
    setNameInput("標準テンプレート");
    const { accepted } = await createDialog.confirm();
    if (!accepted) return;
    const name = validateName();
    if (!name) return;
    const id = createTemplate({ name, catalog: buildCatalog() });
    notify("デフォルトテンプレートを作成しました");
    navigate(`/kynext/templates/${id}/edit`);
  };

  if (!me.templateEditable) {
    return (
      <Container maxWidth="lg">
        <Alert severity="warning" action={<Button component={RouterLink} to="/kynext" color="inherit" size="small">一覧へ</Button>}>
          テンプレートを編集する権限がありません
        </Alert>
      </Container>
    );
  }

  const templateName = (t) => t.name || "（名称未設定）";
  const templateSelect = (
    <FormControl size="small" sx={{ minWidth: 240, maxWidth: "100%" }}>
      <Select
        value={form.template || ""}
        displayEmpty
        onChange={(e) => setForm((f) => ({ ...f, template: Number(e.target.value) }))}
        renderValue={(selected) => {
          if (!selected) return <Typography color="text.secondary">選択してください</Typography>;
          const t = templates.find((x) => x.id === selected);
          return (
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Typography>{t ? templateName(t) : "（名称未設定）"}</Typography>
              {t?.isExternal && <Chip size="small" color="success" label="元請" />}
            </Stack>
          );
        }}
      >
        {externalTemplates.map((t) => (
          <MenuItem key={t.id} value={t.id}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Typography>{templateName(t)}</Typography>
              <Chip size="small" color="success" label="元請" />
            </Stack>
          </MenuItem>
        ))}
        {projectTemplates.map((t) => (
          <MenuItem key={t.id} value={t.id}>
            {templateName(t)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  const dialogBody = (message) => <TemplateNameDialogBody message={message} name={nameInput} onChange={setNameInput} duplicate={isDuplicate} />;

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" sx={H4_SX}>
        KY設定
      </Typography>

      {/* 現場設定（使用中テンプレート・未ログインユーザーによる作成を許可） */}
      <Paper sx={{ p: 2, my: 2 }}>
        <Grid container spacing={1} sx={{ alignItems: "center" }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="subtitle1">使用中テンプレート</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }}>{templateSelect}</Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography component="label" htmlFor="allow-create-guest-sheet-switch" variant="subtitle1" sx={{ cursor: "pointer" }}>
              未ログインユーザーによる作成を許可
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }}>
            {/* Switch のつまみは root の padding 分だけ内側に描画されるため、上の Select と左端を揃える */}
            <Switch id="allow-create-guest-sheet-switch" checked={form.allowCreateGuestSheet} onChange={(_, c) => setForm((f) => ({ ...f, allowCreateGuestSheet: c }))} sx={{ ml: -1.5 }} />
          </Grid>
          <Grid size={12} sx={{ textAlign: "right" }}>
            <Button variant="contained" disabled={!isDirty} onClick={handleApply}>
              適用
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* テンプレート一覧 */}
      <Typography variant="h6" sx={{ ...H6_SX, my: 2 }}>
        テンプレート一覧
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mb: 1, flexWrap: "wrap" }}>
          <Button variant="outlined" startIcon={<UploadIcon />} onClick={() => fileInputRef.current?.click()}>
            インポート
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            hidden
            onChange={(e) => {
              handleFileChange(e);
              e.target.value = "";
            }}
          />
          <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={handleCreateFromDefault}>
            新規作成
          </Button>
        </Box>
        {templates.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
            テンプレートがありません
          </Typography>
        ) : (
          <Grid container spacing={1}>
            {[...externalTemplates, ...projectTemplates].map((t) => (
              <Grid key={t.id} size={{ xs: 12, sm: 6 }}>
                <Card variant="outlined">
                  <CardActionArea onClick={() => navigate(`/kynext/templates/${t.id}`)}>
                    <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                      <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: "center", flexWrap: "wrap" }}>
                        <Typography variant="body1" color={t.name ? "text.primary" : "text.secondary"}>
                          {templateName(t)}
                        </Typography>
                        {t.id === settings.currentTemplateId && <Chip size="small" color="primary" label="使用中" />}
                        {t.isExternal && <Chip size="small" color="success" label="元請" />}
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        更新日時: {formatDateTime(t.latestCatalog.createdAt)}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* 元請のみ: 一括適用と元請設定（本番は Arch 管理者のみ） */}
      {me.templateEditable && (
        <>
          <ProjectApplicationTable projectTemplates={projectTemplates} />
          <CompanyKynextSettings />
        </>
      )}

      {importDialog.renderDialog(dialogBody("新しいテンプレートとしてインポートします。"))}
      {createDialog.renderDialog(dialogBody("テンプレート名を入力してください。"))}
    </Container>
  );
}
