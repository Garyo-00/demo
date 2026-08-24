import { useState, useRef } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useWaSettings } from "../components/wa/WaSettingsContext.jsx";
import {
  WA_COMPANY_LIST,
  WA_INDUSTRIES,
  WA_JOBTYPES_BY_INDUSTRY,
  WA_FOREMAN_USERS,
} from "../data.js";
import Modal from "../components/wa/Modal.jsx";

function emptyEntry() {
  return { industry: "", jobType: "", show: true, foremen: [] };
}
function emptyCompany() {
  return { id: "", name: "", entries: [emptyEntry()] };
}

// CSVセルのエスケープ／簡易パース
function csvCell(v) {
  return /[",\n]/.test(v) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v);
}
function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') q = false;
      else cur += ch;
    } else {
      if (ch === '"') q = true;
      else if (ch === ",") { out.push(cur); cur = ""; }
      else cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export default function WorkAdjustCompanies() {
  const { companies, setCompanies } = useWaSettings();
  const [view, setView] = useState("list"); // list | form
  const [form, setForm] = useState(null); // 編集中の会社
  const [query, setQuery] = useState("");
  const [applied, setApplied] = useState("");
  const [seq, setSeq] = useState(WA_COMPANY_LIST.length);
  const [showRef, setShowRef] = useState(false);
  const fileRef = useRef(null);

  const isEdit = form && form.id;
  const filtered = applied
    ? companies.filter((c) => c.name.includes(applied))
    : companies;


  // フォーム操作
  function openCreate() {
    setForm(emptyCompany());
    setView("form");
  }
  function openEdit(c) {
    setForm({ ...c, entries: c.entries.map((e) => ({ ...e })) });
    setView("form");
  }
  function setEntry(i, patch) {
    setForm((f) => ({
      ...f,
      entries: f.entries.map((e, idx) => (idx === i ? { ...e, ...patch } : e)),
    }));
  }
  function addEntry() {
    setForm((f) => ({ ...f, entries: [...f.entries, emptyEntry()] }));
  }
  function removeEntry(i) {
    setForm((f) => ({ ...f, entries: f.entries.filter((_, idx) => idx !== i) }));
  }
  function saveForm() {
    if (!form.name.trim()) {
      window.alert("協力会社名を入力してください。");
      return;
    }
    const valid = form.entries.filter((e) => e.industry && e.jobType);
    if (valid.length === 0) {
      window.alert("業種名・職種名を選択してください。");
      return;
    }
    const rec = { ...form, entries: valid };
    if (form.id) {
      setCompanies((cs) => cs.map((c) => (c.id === form.id ? rec : c)));
    } else {
      const n = seq + 1;
      setSeq(n);
      setCompanies((cs) => [...cs, { ...rec, id: "C-" + String(n).padStart(3, "0") }]);
    }
    setView("list");
    setForm(null);
  }

  // エクスポート（協力会社名／業種名／職種名）
  function exportCsv() {
    const rows = [["協力会社名", "業種名", "職種名"]];
    companies.forEach((c) =>
      c.entries.forEach((e) => rows.push([c.name, e.industry, e.jobType]))
    );
    const csv = rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "協力会社一覧.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  // インポート（同形式のCSV）
  function importCsv(file) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result).replace(/^﻿/, "");
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length <= 1) {
        window.alert("取り込むデータがありません。");
        return;
      }
      // 1行目はヘッダーとしてスキップ
      const parsed = lines.slice(1).map(parseCsvLine);
      setCompanies((cs) => {
        const next = cs.map((c) => ({ ...c, entries: c.entries.map((e) => ({ ...e })) }));
        let n = seq;
        parsed.forEach(([name, industry, jobType]) => {
          if (!name) return;
          let c = next.find((x) => x.name === name);
          if (!c) {
            n += 1;
            c = { id: "C-" + String(n).padStart(3, "0"), name, entries: [] };
            next.push(c);
          }
          const dup = c.entries.some(
            (e) => e.industry === industry && e.jobType === jobType
          );
          if (!dup) c.entries.push({ industry, jobType, show: true, foremen: [] });
        });
        setSeq(n);
        return next;
      });
      window.alert("インポートが完了しました。");
    };
    reader.readAsText(file, "UTF-8");
  }

  // ===== フォーム画面 =====
  if (view === "form") {
    return (
      <Box>
        <Typography variant="h1" sx={{ mb: 1.75 }}>
          協力会社設定
        </Typography>
        <Typography variant="h2" color="text.secondary" sx={{ mb: 1.25, letterSpacing: ".04em" }}>
          {isEdit ? "編集" : "新規作成"}
        </Typography>

        <Card>
          <CardContent>
            <TextField
              fullWidth
              size="small"
              required
              label="協力会社名"
              placeholder="協力会社名を入力してください"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              sx={{ mb: 2 }}
            />

            <Button variant="outlined" onClick={() => setShowRef(true)} sx={{ mb: 2.5 }}>
              参考：使用できる業種・職種
            </Button>

            {form.entries.map((en, i) => (
              <Box
                key={i}
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2.5, mb: 2 }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                  <Typography sx={{ color: "primary.main", fontSize: 14, fontWeight: 600 }}>
                    業種・職種 {i + 1}
                  </Typography>
                  {form.entries.length > 1 && (
                    <Button size="small" color="error" onClick={() => removeEntry(i)}>
                      削除
                    </Button>
                  )}
                </Box>
                <TextField
                  select
                  fullWidth
                  size="small"
                  required
                  label="業種名"
                  value={en.industry}
                  onChange={(e) => setEntry(i, { industry: e.target.value, jobType: "" })}
                  sx={{ mb: 2 }}
                >
                  <MenuItem value="">業種名を選択してください</MenuItem>
                  {WA_INDUSTRIES.map((v) => (
                    <MenuItem key={v} value={v}>
                      {v}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  fullWidth
                  size="small"
                  required
                  label="職種名"
                  value={en.jobType}
                  onChange={(e) => setEntry(i, { jobType: e.target.value })}
                  disabled={!en.industry}
                  sx={{ mb: 2 }}
                >
                  <MenuItem value="">職種名を選択してください</MenuItem>
                  {(WA_JOBTYPES_BY_INDUSTRY[en.industry] || []).map((v) => (
                    <MenuItem key={v} value={v}>
                      {v}
                    </MenuItem>
                  ))}
                </TextField>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  職長ユーザー
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                  {WA_FOREMAN_USERS.map((u) => (
                    <FormControlLabel
                      key={u}
                      control={
                        <Checkbox
                          size="small"
                          checked={en.foremen.includes(u)}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...en.foremen, u]
                              : en.foremen.filter((x) => x !== u);
                            // 表示順（マスタ順）の昇順で保持＝先頭が既定の職長になる
                            next.sort(
                              (a, b) => WA_FOREMAN_USERS.indexOf(a) - WA_FOREMAN_USERS.indexOf(b)
                            );
                            setEntry(i, { foremen: next });
                          }}
                        />
                      }
                      label={u}
                      slotProps={{ typography: { sx: { fontSize: 13 } } }}
                    />
                  ))}
                  <Typography variant="caption" color="text.secondary">
                    複数選択可能（先頭が既定の職長）
                  </Typography>
                </Box>
              </Box>
            ))}

            <Box sx={{ textAlign: "center" }}>
              <Button startIcon={<AddIcon />} onClick={addEntry}>
                職種を追加
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mt: 2.25 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setView("list");
              setForm(null);
            }}
          >
            キャンセル
          </Button>
          <Button variant="contained" onClick={saveForm}>
            {isEdit ? "保存" : "登録"}
          </Button>
        </Box>

        {showRef && (
          <Modal wide title="使用できる業種・職種" onClose={() => setShowRef(false)}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {WA_INDUSTRIES.map((ind) => (
                <Box
                  key={ind}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "130px 1fr" },
                    gap: 1.75,
                    pb: 1.5,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{ind}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {WA_JOBTYPES_BY_INDUSTRY[ind].join("、")}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Modal>
        )}
      </Box>
    );
  }

  // ===== 一覧画面 =====
  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 1 }}>
        協力会社設定
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.25 }}>
        出面・日報管理および他サービスで共通利用する協力会社設定
      </Typography>

      <Card>
        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
          <TextField
            fullWidth
            size="small"
            placeholder="協力会社名"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setApplied(query.trim())}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            <Button variant="contained" onClick={() => setApplied(query.trim())}>
              検索
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setQuery("");
                setApplied("");
              }}
            >
              クリア
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.25, flexWrap: "wrap", my: 2.25 }}>
        <Button variant="outlined" startIcon={<FileUploadOutlinedIcon />} onClick={() => fileRef.current?.click()}>
          インポート
        </Button>
        <Button variant="outlined" startIcon={<FileDownloadOutlinedIcon />} onClick={exportCsv}>
          エクスポート
        </Button>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          新規作成
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importCsv(f);
            e.target.value = "";
          }}
        />
      </Box>

      {filtered.length === 0 ? (
        <Typography sx={{ py: 4, textAlign: "center", fontSize: 13 }} color="text.secondary">
          該当する協力会社はありません。
        </Typography>
      ) : (
        <TableContainer component={Card}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>協力会社</TableCell>
                <TableCell>職種</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((c) =>
                c.entries.map((e, i) => (
                  <TableRow key={c.id + "-" + i} hover>
                    {i === 0 && (
                      <TableCell rowSpan={c.entries.length} sx={{ fontWeight: 700, verticalAlign: "middle" }}>
                        {c.name}
                      </TableCell>
                    )}
                    <TableCell>{e.jobType}</TableCell>
                    {i === 0 && (
                      <TableCell rowSpan={c.entries.length} align="right" sx={{ verticalAlign: "middle" }}>
                        <Button size="small" endIcon={<ChevronRightIcon />} onClick={() => openEdit(c)}>
                          編集
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
