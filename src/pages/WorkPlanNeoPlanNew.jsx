import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopyOutlined";
import { useWpn } from "../components/wpn/WpnContext.jsx";
import { AnswerTable } from "../components/wpn/AnswerField.jsx";
import { TEMPLATE_BLOCKS, newId } from "../workPlanNeoData.js";
import { APPROVAL_FLOWS, MACHINES, MACHINE_CATEGORIES, flowById } from "../workPlanNeoPlanData.js";

function SectionCard({ title, hint, children }) {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h2" sx={{ mb: 1.75 }}>
          {title}
          {hint && (
            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1, fontWeight: 400 }}>
              {hint}
            </Typography>
          )}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );
}

export default function WorkPlanNeoPlanNew() {
  const navigate = useNavigate();
  const { templates, savePlan } = useWpn();
  const [tab, setTab] = useState("bring"); // bring | rental
  const [category, setCategory] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState([]);
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  // 既定でデモ用テンプレートを選択し、全ブロックが反映された状態を確認できるようにする
  const [templateId, setTemplateId] = useState("tplDemo");
  const [flowId, setFlowId] = useState("");
  const [perPage, setPerPage] = useState(50);
  // テンプレート項目（その他ブロック）への回答
  const [other, setOther] = useState({});
  const [floorPlanMode, setFloorPlanMode] = useState("upload"); // draw | upload

  const tpl = templates.find((t) => t.id === templateId) || null;
  const blocks = tpl?.blocks || {};

  const machines = MACHINES.filter((m) => {
    if (m.kind !== tab) return false;
    if (category && m.category !== category) return false;
    if (keyword && !(m.company + m.alias).includes(keyword)) return false;
    return true;
  });
  const rows = machines.slice(0, perPage);
  const allChecked = rows.length > 0 && rows.every((m) => selected.includes(m.id));

  function toggle(id) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }
  function toggleAll() {
    setSelected((s) =>
      allChecked ? s.filter((id) => !rows.some((m) => m.id === id)) : [...new Set([...s, ...rows.map((m) => m.id)])]
    );
  }

  function submit() {
    // 作業期間は基本情報ブロックの中にあるため、ブロックがONのときだけ必須
    if (!name.trim() || !templateId || !flowId || (blocks.basic && (!start || !end))) {
      alert("必須項目（作業計画書名・テンプレート・承認フロー・作業期間）を入力してください。");
      return;
    }
    const flow = flowById(flowId);
    savePlan({
      id: newId("plan"),
      name: name.trim(),
      templateId,
      templateName: tpl?.name || "",
      start: start.replaceAll("-", "/"),
      end: end.replaceAll("-", "/"),
      applicant: "門脇_管理者",
      author: "門脇_管理者",
      company: "株式会社Arch",
      status: "applying",
      machineIds: selected,
      flowId,
      approvals:
        flow?.steps.map((s) => ({
          no: s.no,
          group: s.group,
          status: "applying",
          rows: s.approvers.map((a) => ({ approver: a, date: "", status: "applying", comment: "" })),
        })) || [],
      other,
      files: tpl?.files || [],
      memo: "",
      checklistResults: [],
      safetyInstructions: [],
      meetingSigns: [],
    });
    navigate("/workplan-neo/plans");
  }

  const actions = (
    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.25, mb: 2 }}>
      <Button variant="outlined" size="small" onClick={() => navigate("/workplan-neo/plans")}>
        キャンセル
      </Button>
      <Button variant="contained" size="small" onClick={submit}>
        登録
      </Button>
    </Box>
  );

  return (
    <Box>
      {actions}

      <SectionCard title="機械の選択">
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}>
          <Tab value="bring" label="持込機械" />
          <Tab value="rental" label="レンタル機械" />
        </Tabs>

        <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
          <Select displayEmpty value={category} onChange={(e) => setCategory(e.target.value)} sx={{ width: 240 }}>
            <MenuItem value="">カテゴリで絞り込み</MenuItem>
            {MACHINE_CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </Select>
          <TextField
            placeholder="協力会社名・現場内呼称で検索"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            sx={{ width: 280 }}
          />
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 42 }}>
                  <Checkbox size="small" checked={allChecked} onChange={toggleAll} slotProps={{ input: { "aria-label": "全選択" } }} />
                </TableCell>
                <TableCell sx={{ width: "18%" }}>機械カテゴリ</TableCell>
                <TableCell>機械名（仕様）</TableCell>
                <TableCell sx={{ width: "16%" }}>現場内呼称</TableCell>
                <TableCell sx={{ width: "14%" }}>現場内管理番号</TableCell>
                <TableCell sx={{ width: "14%" }}>協力会社</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ color: "text.secondary", py: 5 }}>
                    行がありません。
                  </TableCell>
                </TableRow>
              )}
              {rows.map((m) => (
                <TableRow key={m.id} hover>
                  <TableCell align="center">
                    <Checkbox
                      size="small"
                      checked={selected.includes(m.id)}
                      onChange={() => toggle(m.id)}
                      slotProps={{ input: { "aria-label": m.name } }}
                    />
                  </TableCell>
                  <TableCell>{m.category}</TableCell>
                  <TableCell>{m.name}</TableCell>
                  <TableCell>{m.alias}</TableCell>
                  <TableCell>{m.mgmtNo}</TableCell>
                  <TableCell>{m.company}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={machines.length}
          page={0}
          onPageChange={() => {}}
          rowsPerPage={perPage}
          rowsPerPageOptions={[25, 50, 100]}
          onRowsPerPageChange={(e) => setPerPage(Number(e.target.value))}
          labelRowsPerPage="ページあたりの行数:"
          labelDisplayedRows={({ from, to, count }) => `${from}〜${to} / ${count}`}
        />
      </SectionCard>

      <SectionCard title="必須項目">
        <TextField
          fullWidth
          label="作業計画書名"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          select
          fullWidth
          required
          label="作業計画書テンプレート"
          value={templateId}
          onChange={(e) => {
            setTemplateId(e.target.value);
            setOther({});
          }}
        >
          {templates.map((t) => (
            <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
          ))}
        </TextField>
        <Button size="small" startIcon={<ContentCopyIcon />} sx={{ mt: 1 }}>
          過去の作業計画書からコピー
        </Button>
      </SectionCard>

      {/* ここから下はテンプレートでONにしたブロックが順に表示される */}
      {tpl &&
        TEMPLATE_BLOCKS.filter((b) => blocks[b.key]).map((b) => (
          <SectionCard key={b.key} title={b.label} hint={b.hint}>
            {b.key === "basic" ? (
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ width: "26%" }}>
                        作業配置図
                        <Box component="span" sx={{ color: "error.main", ml: 0.25 }}>*</Box>
                      </TableCell>
                      <TableCell>
                        <RadioGroup
                          row
                          value={floorPlanMode}
                          onChange={(e) => setFloorPlanMode(e.target.value)}
                          sx={{ mb: 1 }}
                        >
                          <FormControlLabel value="draw" control={<Radio size="small" />} label="作図" />
                          <FormControlLabel value="upload" control={<Radio size="small" />} label="アップロード" />
                        </RadioGroup>
                        {floorPlanMode === "upload" ? (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Button variant="contained" size="small">ファイルを選択</Button>
                            <PhotoCameraOutlinedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                          </Box>
                        ) : (
                          <Button variant="outlined" size="small">配置図を作図する</Button>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        作業期間
                        <Box component="span" sx={{ color: "error.main", ml: 0.25 }}>*</Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <TextField
                            fullWidth
                            type="date"
                            label="作業開始日"
                            slotProps={{ inputLabel: { shrink: true } }}
                            value={start}
                            onChange={(e) => setStart(e.target.value)}
                          />
                          <Box component="span" sx={{ flex: "none", color: "text.secondary" }}>〜</Box>
                          <TextField
                            fullWidth
                            type="date"
                            label="作業終了日"
                            slotProps={{ inputLabel: { shrink: true } }}
                            value={end}
                            onChange={(e) => setEnd(e.target.value)}
                          />
                        </Box>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            ) : b.key === "other" ? (
              <AnswerTable
                items={tpl.other}
                values={other}
                onChange={(id, v) => setOther((c) => ({ ...c, [id]: v }))}
              />
            ) : (
              <Box
                sx={{
                  border: "1px dashed #d7dbe4",
                  borderRadius: 2,
                  py: 3.25,
                  textAlign: "center",
                  fontSize: 12,
                  color: "text.secondary",
                  bgcolor: "#fbfcfe",
                }}
              >
                詳細仕様は後日設定予定です。
              </Box>
            )}
          </SectionCard>
        ))}

      {tpl && (
        <SectionCard title="書類添付" hint="テンプレートで登録された書類が添付されます">
          {tpl.files?.length ? (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
              {tpl.files.map((f) => (
                <Chip key={f.id} label={f.name} variant="outlined" />
              ))}
            </Box>
          ) : (
            <Typography color="text.secondary" sx={{ fontSize: 12.5, mb: 1.5 }}>
              添付書類はありません
            </Typography>
          )}
          <Button variant="contained" size="small">ファイルを選択</Button>
        </SectionCard>
      )}

      <SectionCard title="承認フロー">
        <TextField
          select
          fullWidth
          required
          label="承認フロー"
          value={flowId}
          onChange={(e) => setFlowId(e.target.value)}
        >
          {APPROVAL_FLOWS.map((f) => (
            <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
          ))}
        </TextField>
      </SectionCard>

      {actions}
    </Box>
  );
}
