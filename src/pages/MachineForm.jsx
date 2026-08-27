import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useMachines } from "../components/BroughtMachineContext.jsx";
import {
  BM_CATEGORIES,
  INSPECTION_TYPES,
  SPECIFIC_INSPECTION,
  fmt,
  specificInspection,
} from "../broughtMachineData.js";

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

function Row({ label, children }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "220px 1fr" },
        gap: 1.5,
        alignItems: "center",
        py: 1,
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography variant="body2">{label}</Typography>
      {children}
    </Box>
  );
}

let seq = 0;
const newInspection = () => ({ id: `ni${++seq}`, type: "", month: "", file: "" });

function emptyMachine() {
  return {
    id: `bm${Date.now()}`,
    archId: Math.floor(100000 + Math.random() * 900000),
    category: "",
    name: "",
    alias: "",
    mgmtNo: "",
    primary: "",
    company: "",
    operator: "",
    bringDate: "",
    useFrom: "",
    useTo: "",
    tags: [],
    archived: false,
    registeredAt: "",
    repName: "",
    maker: "",
    spec: "",
    madeYear: "",
    usePlace: "",
    vehicleInspExpiry: "",
    insurance: { person: "", object: "", passenger: "", other: "" },
    inspections: [newInspection()],
    approval: { status: "", applyNo: "", applyDate: "", applicant: "" },
  };
}

/**
 * 持込資機材の新規登録／登録内容編集。
 * 点検記録は「点検表の種類・点検月・記録ファイル」を必要な数だけ追加できる。
 * 種類に「年次、特定自主検査表」を選ぶと期限管理の対象になる。
 */
export default function MachineForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getMachine, saveMachine } = useMachines();
  const editing = getMachine(id);
  const [m, setM] = useState(() => editing || emptyMachine());
  // 使用届の入力方法（実画面と同じ2択）
  const [entryMode, setEntryMode] = useState(editing ? "fields" : "");

  const set = (patch) => setM((s) => ({ ...s, ...patch }));
  const setIns = (iid, patch) =>
    set({ inspections: m.inspections.map((i) => (i.id === iid ? { ...i, ...patch } : i)) });

  const preview = specificInspection({ inspections: m.inspections });

  function submit() {
    if (!m.company.trim() || !m.operator.trim() || !m.useFrom || !m.useTo || !m.primary.trim()) {
      alert("入力必須の項目（持込会社名・運転者・使用期間・一次会社名）を入力してください。");
      return;
    }
    saveMachine({
      ...m,
      // 点検表の種類が未選択の行は保存しない
      inspections: m.inspections.filter((i) => i.type && i.month),
      bringDate: m.bringDate || fmt(m.useFrom),
      registeredAt: m.registeredAt || fmt(m.useFrom),
    });
    navigate(editing ? `/app/machines/${m.id}` : "/app/machines");
  }

  return (
    <Box>
      <Button
        size="small"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(editing ? `/app/machines/${m.id}` : "/app/machines")}
        sx={{ mb: 1 }}
      >
        戻る
      </Button>
      <Typography variant="h1" align="center" sx={{ mb: 0.5 }}>
        {editing ? "登録内容編集" : "持込資機材登録"}
      </Typography>
      {editing && (
        <Typography align="center" color="text.secondary" sx={{ fontSize: 13, mb: 2 }}>
          機械
        </Typography>
      )}

      <Card sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
        {!editing && (
          <Section title="資機材選択">
            <Row label="持込資機材の種類を選択してください *">
              <RadioGroup row defaultValue="machine">
                <FormControlLabel value="machine" control={<Radio size="small" />} label="機械" />
                <FormControlLabel value="temp" control={<Radio size="small" />} label="仮設・その他" />
              </RadioGroup>
            </Row>
            <Row label="始業前点検表を選択してください *">
              <TextField select fullWidth value={m.category} onChange={(e) => set({ category: e.target.value })}>
                {BM_CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </TextField>
            </Row>
            <Row label="機械名">
              <TextField fullWidth value={m.name} onChange={(e) => set({ name: e.target.value })} />
            </Row>
          </Section>
        )}

        <Section title={editing ? "受理証の内容" : "持込機械受理証の内容"}>
          {editing && (
            <Row label="機種">
              <TextField fullWidth value={m.name} onChange={(e) => set({ name: e.target.value })} />
            </Row>
          )}
          <Row label="現場内呼称">
            <TextField fullWidth value={m.alias} onChange={(e) => set({ alias: e.target.value })} />
          </Row>
          <Row label="持込会社名 *">
            <TextField fullWidth required value={m.company} onChange={(e) => set({ company: e.target.value })} />
          </Row>
          <Row label="運転者（取扱者）*">
            <TextField fullWidth required value={m.operator} onChange={(e) => set({ operator: e.target.value })} />
          </Row>
          <Row label="使用期間 *">
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TextField
                fullWidth
                type="date"
                value={m.useFrom}
                onChange={(e) => set({ useFrom: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <Box component="span" sx={{ color: "text.secondary" }}>〜</Box>
              <TextField
                fullWidth
                type="date"
                value={m.useTo}
                onChange={(e) => set({ useTo: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>
          </Row>
          <Row label="一次会社名 *">
            <TextField fullWidth required value={m.primary} onChange={(e) => set({ primary: e.target.value })} />
          </Row>
        </Section>

        <Section title="持込機械使用届の内容">
          <Typography align="center" color="text.secondary" sx={{ fontSize: 12.5, mb: 1.5 }}>
            グリーンファイル等で作成した持込機械使用届をお持ちの場合は写真またはデータをアップロードしてください。
            <br />
            それ以外の場合は項目入力してください。
          </Typography>
          <RadioGroup value={entryMode} onChange={(e) => setEntryMode(e.target.value)} sx={{ mb: 1 }}>
            <FormControlLabel value="upload" control={<Radio size="small" />} label="持込機械使用届のデータ・写真をアップロード" />
            <FormControlLabel value="fields" control={<Radio size="small" />} label="項目入力" />
          </RadioGroup>

          {entryMode === "upload" && (
            <Button variant="outlined" size="small">ファイルを選択</Button>
          )}
          {entryMode === "fields" && (
            <>
              <Row label="使用会社代表者名">
                <TextField fullWidth value={m.repName} onChange={(e) => set({ repName: e.target.value })} />
              </Row>
              <Row label="メーカー">
                <TextField fullWidth value={m.maker} onChange={(e) => set({ maker: e.target.value })} />
              </Row>
              <Row label="規格・性能">
                <TextField fullWidth value={m.spec} onChange={(e) => set({ spec: e.target.value })} />
              </Row>
              <Row label="製造年（西暦）">
                <TextField value={m.madeYear} onChange={(e) => set({ madeYear: e.target.value })} sx={{ width: 140 }} />
              </Row>
              <Row label="使用場所">
                <TextField fullWidth value={m.usePlace} onChange={(e) => set({ usePlace: e.target.value })} />
              </Row>
              <Row label="自動車検査証有効期限">
                <TextField
                  type="date"
                  value={m.vehicleInspExpiry}
                  onChange={(e) => set({ vehicleInspExpiry: e.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ width: 190 }}
                />
              </Row>
              {[
                ["person", "対人"],
                ["object", "対物"],
                ["passenger", "搭乗者"],
                ["other", "その他"],
              ].map(([k, label]) => (
                <Row key={k} label={`任意保険加入額 ${label}（千円）`}>
                  <TextField
                    value={m.insurance[k]}
                    onChange={(e) => set({ insurance: { ...m.insurance, [k]: e.target.value } })}
                    sx={{ width: 140 }}
                  />
                </Row>
              ))}
            </>
          )}
        </Section>

        <Section title="点検記録">
          {/* 特定自主検査を選ぶと、点検月の1年後が次回期限になる */}
          {preview.state !== "none" && (
            <Alert severity={preview.state === "overdue" ? "error" : "info"} sx={{ mb: 2 }}>
              特定自主検査の次回期限は <strong>{fmt(preview.due)}</strong> になります
              （直近の点検月 {fmt(preview.latest)} の1年後）。期限の30日前から通知します。
            </Alert>
          )}

          {m.inspections.map((i, idx) => (
            <Box key={i.id} sx={{ mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Typography variant="body2">点検記録{idx + 1}</Typography>
                {m.inspections.length > 1 && (
                  <IconButton
                    size="small"
                    sx={{ ml: "auto" }}
                    aria-label="この点検記録を削除"
                    onClick={() => set({ inspections: m.inspections.filter((x) => x.id !== i.id) })}
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
                {INSPECTION_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                type="month"
                label="点検月"
                value={i.month}
                onChange={(e) => setIns(i.id, { month: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
                helperText={
                  i.type === SPECIFIC_INSPECTION
                    ? "この月の1日に実施したものとして次回期限を計算します"
                    : " "
                }
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
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => set({ inspections: [...m.inspections, newInspection()] })}
            >
              入力欄を追加
            </Button>
          </Box>
        </Section>

        {editing ? (
          <Section title="登録状況">
            <Row label="Arch ID">
              <Typography variant="body2">{m.archId}</Typography>
            </Row>
          </Section>
        ) : (
          <Section title="QRコード">
            <RadioGroup defaultValue="new">
              <FormControlLabel value="new" control={<Radio size="small" />} label="QRコードを新規発行する" />
              <FormControlLabel value="exist" control={<Radio size="small" />} label="発行済みのQRコードを使用する" />
            </RadioGroup>
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
