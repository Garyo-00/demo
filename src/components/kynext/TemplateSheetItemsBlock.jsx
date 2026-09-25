import { Box, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import { emptyCatalogGroup } from "../../kynextData.js";
import { ReadOnlyValue, TabPanel, useTabParam } from "./TemplateBlockLayout.jsx";
import { CatalogGroupsTable } from "./TemplateCatalogItemTable.jsx";

// ===== 基本情報ブロック（本番 templateEdit/blocks/SheetItemsBlock） =====
// 「シート項目」タブ … グループごとの項目表。項目の追加・削除・並び替え・設定ダイアログ。
// 「一覧表示項目名」タブ … 一覧・検索で使う 一次会社／作業内容／作業日 のラベル。
// 本番の 2 つ目のタブは「押印欄設定」だが、デモのカタログは押印欄を持たないので一覧表示項目名に置き換えている。

const LIST_LABELS = [
  { key: "firstCompanyLabel", label: "一次会社", hint: "KYシート一覧の会社名欄と検索で使います" },
  { key: "workContentLabel", label: "作業内容", hint: "KYシート一覧の作業内容欄で使います" },
  { key: "workDateLabel", label: "作業日", hint: "日付での絞り込みに使います" },
];

export function TemplateSheetItemsBlock({ catalog, onChange, readOnly }) {
  const [tab, setTab] = useTabParam(2);
  const groups = catalog.groups ?? [];

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="シート項目" />
          <Tab label="一覧表示項目名" />
        </Tabs>
      </Box>
      <TabPanel value={tab} index={0}>
        <CatalogGroupsTable groups={groups} onChange={(next) => onChange({ ...catalog, groups: next })} readOnly={readOnly} newGroup={emptyCatalogGroup} allowReferenceSelection />
      </TabPanel>
      <TabPanel value={tab} index={1}>
        <Stack spacing={2} sx={{ maxWidth: 520 }}>
          <Typography variant="body2" color="text.secondary">
            KYシート一覧で見出しに使う項目名です。基本情報の項目名とは別に設定できます。
          </Typography>
          {LIST_LABELS.map((f) => (
            <Box key={f.key}>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                {f.label}
              </Typography>
              {readOnly ? (
                <ReadOnlyValue>{catalog[f.key]}</ReadOnlyValue>
              ) : (
                <TextField size="small" fullWidth value={catalog[f.key] ?? ""} onChange={(e) => onChange({ ...catalog, [f.key]: e.target.value })} error={!catalog[f.key]} helperText={!catalog[f.key] ? "入力してください" : f.hint} />
              )}
            </Box>
          ))}
        </Stack>
      </TabPanel>
    </Box>
  );
}
