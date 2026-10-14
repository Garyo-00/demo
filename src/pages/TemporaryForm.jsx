import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  Divider,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useTemporaries } from "../components/TemporaryContext.jsx";
import {
  TP_INSPECTION_TYPES,
  TP_INSPECTOR_GROUPS,
  TP_TYPES,
  emptyTemporary,
  fmt,
  newInspection,
  newInspector,
} from "../temporaryData.js";

function Section({ title, children }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ bgcolor: "#f7f8fb", border: "1px solid", borderColor: "divider", borderRadius: 1, py: 1, mb: 2 }}>
        <Typography align="center" sx={{ fontSize: 14, fontWeight: 700 }}>
          {title}
        </Typography>
      </Box>
      {children}
    </Box>
  );
}

function Field({ label, required, children }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        {label}
        {required && <Box component="span" sx={{ color: "error.main", ml: 0.5 }}>*</Box>}
      </Typography>
      {children}
    </Box>
  );
}

// 今日（デモ固定日）
const TODAY = "2026-10-13";

export default function TemporaryForm() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { getItem, saveItem } = useTemporaries();
  const editing = getItem(id);
  // 詳細の「コピー」から来た場合は元データを複製して新規登録にする
  const copyFrom = !editing && params.get("copy") ? getItem(params.get("copy")) : null;
  const [t, setT] = useState(() => {
    // 編集時、点検者・点検記録が空なら入力欄を1つ出しておく（参考画面と同じ）
    if (editing) {
      return {
        ...editing,
        inspectors: {
          daily: editing.inspectors.daily.length ? editing.inspectors.daily : [newInspector()],
          afterBuild: editing.inspectors.afterBuild.length ? editing.inspectors.afterBuild : [newInspector()],
        },
        inspections: editing.inspections.length ? editing.inspections : [newInspection()],
      };
    }
    const base = emptyTemporary();
    if (!copyFrom) return base;
    return {
      ...base,
      type: copyFrom.type,
      name: `${copyFrom.name}(コピー)`,
      place: copyFrom.place,
      company: copyFrom.company,
      inspectors: {
        daily: copyFrom.inspectors.daily.map((p) => ({ ...newInspector(), name: p.name, company: p.company })),
        afterBuild: copyFrom.inspectors.afterBuild.map((p) => ({ ...newInspector(), name: p.name, company: p.company })),
      },
    };
  });

  const set = (patch) => setT((s) => ({ ...s, ...patch }));
  const setInspector = (key, pid, patch) =>
    set({
      inspectors: {
        ...t.inspectors,
        [key]: t.inspectors[key].map((p) => (p.id === pid ? { ...p, ...patch } : p)),
      },
    });
  const setIns = (iid, patch) =>
    set({ inspections: t.inspections.map((i) => (i.id === iid ? { ...i, ...patch } : i)) });

  function submit() {
    if (!t.type || !t.name.trim() || !t.place.trim() || !t.registrant.trim()) {
      alert("入力必須の項目（種類・名称・設置場所・登録者）を入力してください。");
      return;
    }
    saveItem({
      ...t,
      // 名前が空の点検者、種類未選択の点検記録は保存しない
      inspectors: {
        daily: t.inspectors.daily.filter((p) => p.name.trim()),
        afterBuild: t.inspectors.afterBuild.filter((p) => p.name.trim()),
      },
      inspections: t.inspections.filter((i) => i.type && i.month),
      registeredAt: t.registeredAt || TODAY,
    });
    navigate(editing ? `/app/temporary/${t.id}` : "/app/temporary");
  }

  const back = () => navigate(editing ? `/app/temporary/${t.id}` : "/app/temporary");

  return (
    <Box>
      <Button size="small" startIcon={<ArrowBackIcon />} onClick={back} sx={{ mb: 1 }}>
        戻る
      </Button>
      <Typography variant="h1" align="center" sx={{ mb: 2 }}>
        {editing ? "登録内容編集" : "仮設・その他登録"}
      </Typography>

      <Card sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
        <Section title="登録情報">
          <Typography variant="caption" color="error" sx={{ display: "block", textAlign: "right", mb: 1 }}>
            * 入力必須
          </Typography>
          <Field label="種類" required>
            <TextField select fullWidth value={t.type} onChange={(e) => set({ type: e.target.value })}>
              {TP_TYPES.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </TextField>
          </Field>
          <Field label="名称" required>
            <TextField fullWidth value={t.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label="設置場所" required>
            <TextField fullWidth value={t.place} onChange={(e) => set({ place: e.target.value })} />
          </Field>
          <Field label="現場内管理番号">
            <TextField fullWidth value={t.mgmtNo} onChange={(e) => set({ mgmtNo: e.target.value })} />
          </Field>
          <Field label="管理会社名">
            <TextField fullWidth value={t.company} onChange={(e) => set({ company: e.target.value })} />
          </Field>
          <Field label="登録者" required>
            <TextField fullWidth value={t.registrant} onChange={(e) => set({ registrant: e.target.value })} />
          </Field>
        </Section>

        <Section title="点検者の指名">
          {TP_INSPECTOR_GROUPS.map((g) => (
            <Box key={g.key} sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                {g.label}
              </Typography>
              <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 2 }}>
                {t.inspectors[g.key].map((p, idx) => (
                  <Box key={p.id} sx={{ mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>点検者 {idx + 1}</Typography>
                      {t.inspectors[g.key].length > 1 && (
                        <IconButton
                          size="small"
                          sx={{ ml: "auto" }}
                          aria-label="この点検者を削除"
                          onClick={() =>
                            set({
                              inspectors: {
                                ...t.inspectors,
                                [g.key]: t.inspectors[g.key].filter((x) => x.id !== p.id),
                              },
                            })
                          }
                        >
                          <DeleteOutlinedIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                    <Field label="点検者名">
                      <TextField
                        fullWidth
                        placeholder="点検者名を入力してください"
                        value={p.name}
                        onChange={(e) => setInspector(g.key, p.id, { name: e.target.value })}
                      />
                    </Field>
                    <Field label="会社名">
                      <TextField
                        fullWidth
                        placeholder="会社名を入力してください"
                        value={p.company}
                        onChange={(e) => setInspector(g.key, p.id, { company: e.target.value })}
                      />
                    </Field>
                  </Box>
                ))}
                <Box sx={{ textAlign: "center" }}>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() =>
                      set({ inspectors: { ...t.inspectors, [g.key]: [...t.inspectors[g.key], newInspector()] } })
                    }
                  >
                    入力欄を追加
                  </Button>
                </Box>
              </Box>
            </Box>
          ))}
        </Section>

        <Section title="点検記録">
          {t.inspections.map((i, idx) => (
            <Box key={i.id} sx={{ mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Typography variant="body2">点検記録{idx + 1}</Typography>
                {t.inspections.length > 1 && (
                  <IconButton
                    size="small"
                    sx={{ ml: "auto" }}
                    aria-label="この点検記録を削除"
                    onClick={() => set({ inspections: t.inspections.filter((x) => x.id !== i.id) })}
                  >
                    <DeleteOutlinedIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
              <TextField
                select
                fullWidth
                label="点検表の種類"
                value={i.type}
                onChange={(e) => setIns(i.id, { type: e.target.value })}
                sx={{ mb: 1.5 }}
              >
                {TP_INSPECTION_TYPES.map((x) => (
                  <MenuItem key={x} value={x}>{x}</MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                type="month"
                label="点検月"
                value={i.month}
                onChange={(e) => setIns(i.id, { month: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
                helperText=" "
                sx={{ mb: 1 }}
              />
              <Button variant="outlined" size="small" onClick={() => setIns(i.id, { file: "点検記録.pdf" })}>
                ファイルを選択
              </Button>
              {i.file && (
                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1.5 }}>
                  {i.file}
                </Typography>
              )}
              <Divider sx={{ mt: 2 }} />
            </Box>
          ))}
          <Box sx={{ textAlign: "center" }}>
            <Button size="small" startIcon={<AddIcon />} onClick={() => set({ inspections: [...t.inspections, newInspection()] })}>
              入力欄を追加
            </Button>
          </Box>
        </Section>

        {editing && (
          <Section title="登録状況">
            <Box sx={{ display: "grid", gridTemplateColumns: "220px 1fr", rowGap: 1 }}>
              <Typography variant="body2" sx={{ bgcolor: "#fafbfd", px: 1, py: 0.5 }}>Arch ID</Typography>
              <Typography variant="body2" sx={{ py: 0.5 }}>{t.archId}</Typography>
              <Typography variant="body2" sx={{ bgcolor: "#fafbfd", px: 1, py: 0.5 }}>登録日</Typography>
              <Typography variant="body2" sx={{ py: 0.5 }}>{fmt(t.registeredAt)}</Typography>
            </Box>
          </Section>
        )}

        <Box sx={{ textAlign: "center" }}>
          <Button variant="contained" onClick={submit}>
            {editing ? "保存" : "登録"}
          </Button>
        </Box>
      </Card>
    </Box>
  );
}
