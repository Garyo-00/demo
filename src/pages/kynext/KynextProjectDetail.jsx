import { useState } from "react";
import { Button, Chip, Container, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Paper, Stack, TextField, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { useKynext } from "../../components/kynext/KynextContext.jsx";
import { InfoRow } from "../../components/kynext/KynextCommon.jsx";

// 現場の固定情報（本番は @repo/features の ProjectCard が現場マスタから表示する。デモでは静的に持つ）
const DEFAULT_ADDRESS = "東京都江東区有明3-7-26";
const PROJECT_INFO = {
  type: "新築",
  usage: "物流倉庫",
  period: "2026/04/01 〜 2027/03/31",
  generalContractor: "株式会社Arch",
};
// 現場設定（本番 ProjectCard の設定表示）
const PROJECT_SETTINGS = [
  { label: "天気表示", on: true },
  { label: "ダイレクト連携", on: true },
  { label: "作業間調整pro", on: true },
  { label: "出面・日報管理", on: true },
];

/**
 * 現場情報（本番 pages/projects/detail 相当）。
 * 本番は社内パッケージ @repo/features の ProjectCard を使うため、デモでは同じ構成を InfoRow で組む。
 */
export default function KynextProjectDetail() {
  const { project, updateProject, notify } = useKynext();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", address: "" });
  const [errors, setErrors] = useState({});
  const address = project.address ?? DEFAULT_ADDRESS;

  const openEdit = () => {
    setForm({ name: project.name, address });
    setErrors({});
    setOpen(true);
  };
  const save = () => {
    const next = {};
    if (!form.name.trim()) next.name = "入力してください";
    if (!form.address.trim()) next.address = "入力してください";
    setErrors(next);
    if (Object.keys(next).length) return;
    updateProject({ name: form.name.trim(), address: form.address.trim() });
    notify("現場情報を更新しました");
    setOpen(false);
  };

  return (
    <Container maxWidth="lg">
      <Stack spacing={2}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: "bold", fontSize: 18 }}>
            現場情報
          </Typography>
          <Button variant="outlined" startIcon={<EditIcon />} onClick={openEdit}>
            編集
          </Button>
        </Stack>
        <Paper sx={{ p: 3 }}>
          <Stack spacing={2} divider={<Divider flexItem />}>
            <InfoRow title="現場名" value={project.name} />
            <InfoRow title="現場ID" value={String(project.id)} />
            <InfoRow title="工事種別" value={PROJECT_INFO.type} />
            <InfoRow title="用途" value={PROJECT_INFO.usage} />
            <InfoRow title="所在地" value={address} />
            <InfoRow title="工期" value={PROJECT_INFO.period} />
            <InfoRow title="元請会社" value={PROJECT_INFO.generalContractor} />
            <InfoRow
              title="現場設定"
              value={PROJECT_SETTINGS.map((s) => (
                <Stack key={s.label} direction="row" spacing={1} component="span" sx={{ alignItems: "center" }}>
                  <span>{s.label}</span>
                  {/* InfoRow は値を <p> に包むので、入れ子が不正にならないよう span で描く */}
                  <Chip component="span" label={s.on ? "ON" : "OFF"} size="small" color={s.on ? "success" : "default"} />
                </Stack>
              ))}
            />
          </Stack>
        </Paper>
      </Stack>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>現場情報の編集</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="現場名" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={!!errors.name} helperText={errors.name} fullWidth />
            <TextField label="所在地" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} error={!!errors.address} helperText={errors.address} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          <Button variant="contained" onClick={save}>
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
