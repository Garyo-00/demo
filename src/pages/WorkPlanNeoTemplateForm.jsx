import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useWpn } from "../components/wpn/WpnContext.jsx";
import ItemTable from "../components/wpn/ItemTable.jsx";
import BlockCard from "../components/wpn/BlockCard.jsx";
import BasicInfoBlock from "../components/wpn/BasicInfoBlock.jsx";
import CraneAutoBlock from "../components/wpn/CraneAutoBlock.jsx";
import ChecklistEditor from "../components/wpn/ChecklistEditor.jsx";
import {
  ANSWER_TYPES,
  FIXED_ITEMS,
  TEMPLATE_BLOCKS,
  defaultBlocks,
  defaultCraneAuto,
  makeChecklist,
  newId,
} from "../workPlanNeoData.js";

function todayStr() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())}`;
}

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

export default function WorkPlanNeoTemplateForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getTemplate, saveTemplate } = useWpn();
  const editing = getTemplate(id);

  const [name, setName] = useState(editing?.name || "");
  const [blocks, setBlocks] = useState(editing?.blocks || defaultBlocks(["basic", "other"]));
  const [craneAuto, setCraneAuto] = useState(editing?.craneAuto || defaultCraneAuto());
  const [other, setOther] = useState(editing?.other || []);
  const [checklists, setChecklists] = useState(editing?.checklists || [makeChecklist()]);
  const [files, setFiles] = useState(editing?.files || []);
  const fileRef = useRef(null);

  function pickFiles(e) {
    const picked = Array.from(e.target.files || []).map((f) => ({ id: newId("f"), name: f.name }));
    setFiles((list) => [...list, ...picked]);
    e.target.value = "";
  }

  // 中身の仕様が決まっているブロックだけ、カード内に設定UIを出す（未定のものは使用可否のみ）
  function blockBody(key) {
    if (key === "basic") return <BasicInfoBlock />;
    if (key === "crane") return <CraneAutoBlock value={craneAuto} onChange={setCraneAuto} />;
    if (key === "other") return <ItemTable rows={other} onChange={setOther} types={ANSWER_TYPES} />;
    return null;
  }

  function submit() {
    if (!name.trim()) {
      alert("テンプレート名を入力してください。");
      return;
    }
    saveTemplate({
      id: editing?.id || newId("tpl"),
      name: name.trim(),
      kind: editing?.kind || "custom",
      updatedAt: todayStr(),
      updatedBy: "元請 田中",
      blocks,
      craneAuto,
      other,
      checklists,
      files,
    });
    navigate("/workplan-neo/templates");
  }

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 1 }}>
        作業計画書テンプレート設定{editing ? "編集" : "作成"}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
        作業計画書の書式はゼネコン各社で異なるため、元請ユーザーが項目を自由に設定します。
        ここで作成したテンプレートを、職長ユーザーが作業計画書を新規作成する際に選択します。
      </Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <TextField
            fullWidth
            label="テンプレート名"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例：移動式クレーン作業"
          />
        </CardContent>
      </Card>

      {/* 必須項目（全テンプレート共通・編集不可） */}
      <SectionCard title="必須項目" hint="全テンプレート共通で作業計画書に入る項目です（編集不可）">
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>項目</TableCell>
                <TableCell sx={{ width: "34%" }}>回答形式</TableCell>
                <TableCell sx={{ width: 84 }}>必須</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {FIXED_ITEMS.map((it) => (
                <TableRow key={it.label}>
                  <TableCell>{it.label}</TableCell>
                  <TableCell>{it.type}</TableCell>
                  <TableCell>
                    <Checkbox size="small" checked disabled slotProps={{ input: { "aria-label": "必須（固定）" } }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </SectionCard>

      {/* ブロック（作業計画書はブロック単位で構成する） */}
      {TEMPLATE_BLOCKS.map((b) => (
        <BlockCard
          key={b.key}
          block={b}
          enabled={!!blocks[b.key]}
          onToggle={(v) => setBlocks((s) => ({ ...s, [b.key]: v }))}
        >
          {blockBody(b.key)}
        </BlockCard>
      ))}

      <SectionCard title="書類添付" hint="作業手順書など、この計画書に常に添付する書類">
        {files.length > 0 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
            {files.map((f) => (
              <Chip
                key={f.id}
                label={f.name}
                variant="outlined"
                onDelete={() => setFiles((list) => list.filter((x) => x.id !== f.id))}
                deleteIcon={<CloseIcon />}
              />
            ))}
          </Box>
        )}
        <input ref={fileRef} type="file" multiple hidden onChange={pickFiles} />
        <Button variant="contained" size="small" onClick={() => fileRef.current?.click()}>
          ファイルを選択
        </Button>
      </SectionCard>

      <SectionCard
        title="チェックリスト"
        hint="承認後、点検QR（機械個体）から作業計画書を閲覧する際に、運転者が確認する項目"
      >
        <ChecklistEditor lists={checklists} onChange={setChecklists} />
      </SectionCard>

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.25, pb: 1 }}>
        <Button variant="outlined" onClick={() => navigate("/workplan-neo/templates")}>
          キャンセル
        </Button>
        <Button variant="contained" onClick={submit}>
          登録
        </Button>
      </Box>
    </Box>
  );
}
