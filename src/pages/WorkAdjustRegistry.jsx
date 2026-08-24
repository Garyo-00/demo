import { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SyncOutlinedIcon from "@mui/icons-material/SyncOutlined";
import {
  WA_EQUIP_CATEGORIES,
  WA_COMPANIES,
  WA_SAFETY_MACHINES,
  WA_RENTAL_MACHINES,
  formatDateStr,
} from "../data.js";
import Modal from "../components/wa/Modal.jsx";
import { SuggestField, FormGrid } from "../components/wa/Field.jsx";
import { useWaSettings } from "../components/wa/WaSettingsContext.jsx";
import TablePagination from "../components/wa/TablePagination.jsx";
import { useIsNarrow } from "../components/wa/useIsNarrow.js";

// 表示名（現場内呼称）サジェスト候補
const EQUIP_NAMES = [
  "タワークレーン1号", "ラフター25t", "高所作業車 4.5m", "駐車場",
  "発電機 25kVA",
];

function emptyEquip() {
  return { id: "", category: "", name: "", bringIn: "", primary: "", show: true };
}
// 既存リストのID末尾番号から連番でIDを採番
function nextIds(list, prefix, count) {
  let max = 0;
  list.forEach((x) => {
    const m = /(\d+)$/.exec(x.id);
    if (m) max = Math.max(max, Number(m[1]));
  });
  return Array.from({ length: count }, (_, i) => prefix + "-" + String(max + i + 1).padStart(3, "0"));
}

// 揚重機登録・資機材登録の共通セクション（テーブル構成は同一）。list/setListは共有状態
const RESERVE_TYPES = ["2部制", "時間制"]; // 予約方法（既定は2部制）

// カード表示の1項目
function CardField({ label, children }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "118px 1fr", gap: 1.25, fontSize: 13, alignItems: "center" }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Box sx={{ fontSize: 13 }}>{children}</Box>
    </Box>
  );
}

function EquipmentSection({
  label, list, setList, idPrefix, withReserveType = false,
  safetyPool, setSafetyPool, rentalPool, setRentalPool,
}) {
  const [edit, setEdit] = useState(null);
  const [bulk, setBulk] = useState(null); // 一括登録の行配列
  const [importSel, setImportSel] = useState(null); // 同期インポート（選択id集合。null=閉）
  const [importKind, setImportKind] = useState("safety"); // "safety"（持込機械）| "rental"（レンタル品）
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const narrow = useIsNarrow();

  // ページネーション（ページ範囲外になったら丸める）
  const pageCount = Math.max(1, Math.ceil(list.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = list.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const valid = (e) => e.category && e.name && e.bringIn && e.primary;

  function save() {
    const e = edit;
    if (!valid(e)) {
      window.alert("カテゴリ・表示名（現場内呼称）・持込会社名・一次会社は必須です。");
      return;
    }
    if (e.id) setList((es) => es.map((x) => (x.id === e.id ? e : x)));
    else {
      // 新規登録したアイテムは「持込機械」として扱う（同期解除で持込機械プールに戻る）
      setList((es) => [...es, { ...e, id: nextIds(es, idPrefix, 1)[0], show: true, reserveType: e.reserveType || "2部制", source: "safety" }]);
    }
    setEdit(null);
  }
  // 同期解除：一覧から外し、同期元プール（持込機械／レンタル）へ戻す（＝再同期できる状態に）
  function unsync(e) {
    if (!window.confirm(`「${e.name}」の同期を解除しますか？（同期元リストに戻り、いつでも再同期できます）`)) return;
    setList((es) => es.filter((x) => x.id !== e.id));
    const poolItem = {
      id: e.id, archId: e.id, category: e.category, name: e.name, bringIn: e.bringIn, primary: e.primary,
    };
    const setPool = e.source === "rental" ? setRentalPool : setSafetyPool;
    setPool((p) => (p.some((m) => m.id === poolItem.id) ? p : [...p, poolItem]));
  }
  // 予約ページへの表示／非表示の切替
  function toggleShow(e) {
    setList((es) => es.map((x) => (x.id === e.id ? { ...x, show: !x.show } : x)));
  }
  // 予約方法（時間制／2部制）の変更。値が変わるたびに即時更新
  function setReserveType(e, val) {
    setList((es) => es.map((x) => (x.id === e.id ? { ...x, reserveType: val } : x)));
  }

  // 一括登録
  function openBulk() {
    setBulk([emptyEquip(), emptyEquip(), emptyEquip()]);
  }
  function setBulkRow(i, key, val) {
    setBulk((b) => b.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));
  }
  function commitBulk() {
    const rows = bulk.filter(valid);
    if (rows.length === 0) {
      window.alert("必須項目（4項目）を入力した行がありません。");
      return;
    }
    setList((es) => {
      const ids = nextIds(es, idPrefix, rows.length);
      // 一括登録したアイテムも「持込機械」として扱う
      return [...es, ...rows.map((r, i) => ({ ...r, id: ids[i], show: true, reserveType: "2部制", source: "safety" }))];
    });
    setBulk(null);
  }

  // 同期の取込元（持込機械＝安全セーフティ／レンタル品）。プールはWorkAdjustRegistryで共有管理
  const importSource = importKind === "rental" ? rentalPool : safetyPool;
  const importMeta =
    importKind === "rental"
      ? { title: "レンタル品から同期", label: "レンタル品", desc: <>レンタル管理の一覧から選択して取り込みます。</> }
      : { title: "持込機械から同期", label: "持込機械", desc: <>別サービス「<strong>安全セーフティ</strong>」の持込機械一覧から選択して取り込みます。</> };

  // 持込機械／レンタル品から登録（archIdをArchIDとして採用。取込元プールからは除外＝重複登録なし）
  function openImport(kind) {
    setImportKind(kind);
    setImportSel(new Set());
  }
  function toggleImport(id) {
    setImportSel((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function commitImport() {
    const picks = importSource.filter((m) => importSel.has(m.id));
    if (picks.length === 0) {
      window.alert(`取り込む${importMeta.label}を選択してください。`);
      return;
    }
    setList((es) => {
      const existing = new Set(es.map((e) => e.id));
      const rows = picks
        .filter((m) => !existing.has(m.archId)) // 既に取込済み（同一ArchID）は重複追加しない
        .map((m) => ({
          id: m.archId, category: m.category, name: m.name, bringIn: m.bringIn, primary: m.primary,
          show: true, reserveType: "2部制", source: importKind,
        }));
      return [...es, ...rows];
    });
    // 取込元プールから除去（＝同一機械が同時に複数登録されない）
    const pickIds = new Set(picks.map((m) => m.id));
    const setPool = importKind === "rental" ? setRentalPool : setSafetyPool;
    setPool((p) => p.filter((m) => !pickIds.has(m.id)));
    setImportSel(null);
  }

  const reserveTypeSelect = (e) => (
    <TextField
      select
      size="small"
      value={e.reserveType || "2部制"}
      onChange={(ev) => setReserveType(e, ev.target.value)}
      title="予約方法（時間制／2部制）"
      sx={{ minWidth: 100 }}
    >
      {RESERVE_TYPES.map((t) => (
        <MenuItem key={t} value={t}>
          {t}
        </MenuItem>
      ))}
    </TextField>
  );
  const showCheck = (e) => (
    <FormControlLabel
      control={<Checkbox size="small" checked={e.show} onChange={() => toggleShow(e)} />}
      label="表示する"
      title="予約ページへの表示／非表示"
      slotProps={{ typography: { sx: { fontSize: 13 } } }}
    />
  );
  const rowActions = (e) => (
    <Box sx={{ display: "flex", gap: 0.75 }}>
      <Button size="small" variant="outlined" onClick={() => setEdit({ ...e })}>
        編集
      </Button>
      <Button size="small" variant="outlined" color="error" onClick={() => unsync(e)}>
        同期解除
      </Button>
    </Box>
  );

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap", my: 2 }}>
        <Typography variant="caption" color="text.secondary">
          全 {list.length} 件
        </Typography>
        <Box sx={{ ml: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" startIcon={<SyncOutlinedIcon />} onClick={() => openImport("safety")}>
              持込機械から同期
            </Button>
            <Button variant="outlined" startIcon={<SyncOutlinedIcon />} onClick={() => openImport("rental")}>
              レンタル品から同期
            </Button>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" onClick={openBulk}>
              一括登録
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEdit(emptyEquip())}>
              新規登録
            </Button>
          </Box>
        </Box>
      </Box>

      {narrow ? (
        // モバイル：カード表示（横スクロール不要）
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {pageRows.map((e) => (
            <Box key={e.id} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.5 }}>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, bgcolor: "action.hover", borderRadius: 1, px: 1, py: 0.25 }}
                  color="text.secondary"
                >
                  ArchID {e.id}
                </Typography>
                <Typography sx={{ fontSize: 15, fontWeight: 700 }}>{e.name}</Typography>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                <CardField label="カテゴリ">{e.category}</CardField>
                <CardField label="持込会社名">{e.bringIn}</CardField>
                <CardField label="一次会社">{e.primary}</CardField>
                {withReserveType && <CardField label="予約方法">{reserveTypeSelect(e)}</CardField>}
                <CardField label="予約表示">{showCheck(e)}</CardField>
              </Box>
              <Box sx={{ mt: 1.75, pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
                {rowActions(e)}
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ArchID</TableCell>
                <TableCell>カテゴリ</TableCell>
                <TableCell>表示名（現場内呼称）</TableCell>
                <TableCell>持込会社名</TableCell>
                <TableCell>一次会社</TableCell>
                {withReserveType && <TableCell>予約方法</TableCell>}
                <TableCell>予約表示</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageRows.map((e) => (
                <TableRow key={e.id} hover>
                  <TableCell>{e.id}</TableCell>
                  <TableCell>{e.category}</TableCell>
                  <TableCell>{e.name}</TableCell>
                  <TableCell>{e.bringIn}</TableCell>
                  <TableCell>{e.primary}</TableCell>
                  {withReserveType && <TableCell>{reserveTypeSelect(e)}</TableCell>}
                  <TableCell>{showCheck(e)}</TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{rowActions(e)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <TablePagination
        total={list.length}
        page={safePage}
        pageSize={pageSize}
        onPage={setPage}
        onPageSize={(n) => { setPageSize(n); setPage(0); }}
      />

      {/* 新規／編集 */}
      {edit && (
        <Modal
          title={edit.id ? label + "の編集" : label + "の新規登録"}
          onClose={() => setEdit(null)}
          footer={
            <>
              <Button variant="outlined" onClick={() => setEdit(null)}>
                キャンセル
              </Button>
              <Button variant="contained" onClick={save}>
                保存
              </Button>
            </>
          }
        >
          {!edit.id && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              ※ 登録したアイテムは<strong>持込機械</strong>として登録されます。
            </Typography>
          )}
          <FormGrid>
            <SuggestField
              label="カテゴリ"
              required
              value={edit.category}
              onChange={(v) => setEdit((x) => ({ ...x, category: v }))}
              options={WA_EQUIP_CATEGORIES}
              hint="サジェスト＋自由記述"
            />
            <SuggestField
              label="表示名（現場内呼称）"
              required
              value={edit.name}
              onChange={(v) => setEdit((x) => ({ ...x, name: v }))}
              options={EQUIP_NAMES}
              hint="サジェスト＋自由記述"
            />
            <SuggestField
              label="持込会社名"
              required
              value={edit.bringIn}
              onChange={(v) => setEdit((x) => ({ ...x, bringIn: v }))}
              options={WA_COMPANIES}
              hint="サジェスト＋自由記述"
            />
            <SuggestField
              label="一次会社"
              required
              value={edit.primary}
              onChange={(v) => setEdit((x) => ({ ...x, primary: v }))}
              options={WA_COMPANIES}
              hint="サジェスト＋自由記述"
            />
          </FormGrid>
        </Modal>
      )}

      {/* 一括登録 */}
      {bulk && (
        <Modal
          wide
          title={label + "の一括登録"}
          onClose={() => setBulk(null)}
          footer={
            <>
              <Button startIcon={<AddIcon />} onClick={() => setBulk((b) => [...b, emptyEquip()])}>
                行を追加
              </Button>
              <Button variant="outlined" sx={{ ml: "auto" }} onClick={() => setBulk(null)}>
                キャンセル
              </Button>
              <Button variant="contained" onClick={commitBulk}>
                まとめて登録
              </Button>
            </>
          }
        >
          <Typography variant="body2" color="text.secondary">
            4項目すべて入力された行のみ登録されます（カテゴリ／表示名（現場内呼称）／持込会社名／一次会社）。
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            ※ 登録したアイテムは<strong>持込機械</strong>として登録されます。
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {bulk.map((r, i) => (
              <Box
                key={i}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" },
                  gap: 1.25,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  p: 1.5,
                }}
              >
                <SuggestField
                  label="カテゴリ"
                  required
                  value={r.category}
                  options={WA_EQUIP_CATEGORIES}
                  onChange={(v) => setBulkRow(i, "category", v)}
                />
                <SuggestField
                  label="表示名（現場内呼称）"
                  required
                  value={r.name}
                  options={EQUIP_NAMES}
                  onChange={(v) => setBulkRow(i, "name", v)}
                />
                <SuggestField
                  label="持込会社名"
                  required
                  value={r.bringIn}
                  options={WA_COMPANIES}
                  onChange={(v) => setBulkRow(i, "bringIn", v)}
                />
                <SuggestField
                  label="一次会社"
                  required
                  value={r.primary}
                  options={WA_COMPANIES}
                  onChange={(v) => setBulkRow(i, "primary", v)}
                />
              </Box>
            ))}
          </Box>
        </Modal>
      )}

      {/* 持込機械／レンタル品から同期（取込元は importKind で切替） */}
      {importSel && (
        <Modal
          wide
          title={importMeta.title}
          onClose={() => setImportSel(null)}
          footer={
            <>
              <Button variant="outlined" onClick={() => setImportSel(null)}>
                キャンセル
              </Button>
              <Button variant="contained" onClick={commitImport}>
                取り込む（{importSel.size}件）
              </Button>
            </>
          }
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {importMeta.desc}
          </Typography>
          {narrow ? (
            <List dense disablePadding>
              {importSource.map((m) => (
                <ListItem key={m.id} disablePadding divider>
                  <ListItemButton onClick={() => toggleImport(m.id)}>
                    <Checkbox size="small" edge="start" checked={importSel.has(m.id)} tabIndex={-1} />
                    <ListItemText
                      primary={m.name}
                      secondary={`${m.archId}／${m.category}／${m.bringIn}／${m.primary}`}
                      slotProps={{
                        primary: { sx: { fontSize: 13, fontWeight: 600 } },
                        secondary: { sx: { fontSize: 11.5 } },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" />
                    <TableCell>ArchID</TableCell>
                    <TableCell>カテゴリ</TableCell>
                    <TableCell>表示名（現場内呼称）</TableCell>
                    <TableCell>持込会社名</TableCell>
                    <TableCell>一次会社</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {importSource.map((m) => (
                    <TableRow
                      key={m.id}
                      hover
                      selected={importSel.has(m.id)}
                      onClick={() => toggleImport(m.id)}
                      sx={{ cursor: "pointer" }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox size="small" checked={importSel.has(m.id)} onChange={() => toggleImport(m.id)} />
                      </TableCell>
                      <TableCell>{m.archId}</TableCell>
                      <TableCell>{m.category}</TableCell>
                      <TableCell>{m.name}</TableCell>
                      <TableCell>{m.bringIn}</TableCell>
                      <TableCell>{m.primary}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Modal>
      )}
    </>
  );
}

function emptyGate() {
  return { id: "", name: "", location: "", note: "", show: true };
}

export default function WorkAdjustRegistry() {
  const { gates, setGates, lifts, setLifts, equipment, setEquipment, reservations } =
    useWaSettings();
  // 同期元プール（持込機械／レンタル）。揚重機・資機材で共通利用。同期で取り込むとプールから外れ、
  // 同期解除で戻る（＝同一機械が同時に複数登録されない）。
  const [safetyPool, setSafetyPool] = useState(WA_SAFETY_MACHINES);
  const [rentalPool, setRentalPool] = useState(WA_RENTAL_MACHINES);
  const poolProps = { safetyPool, setSafetyPool, rentalPool, setRentalPool };
  const [tab, setTab] = useState("lift");
  const [gateEdit, setGateEdit] = useState(null);
  const [gPage, setGPage] = useState(0);
  const [gPageSize, setGPageSize] = useState(50);
  const narrow = useIsNarrow();
  const gPageCount = Math.max(1, Math.ceil(gates.length / gPageSize));
  const gSafePage = Math.min(gPage, gPageCount - 1);
  const gatePageRows = gates.slice(gSafePage * gPageSize, gSafePage * gPageSize + gPageSize);

  function saveGate() {
    const g = gateEdit;
    if (g.id) setGates((gs) => gs.map((x) => (x.id === g.id ? g : x)));
    else {
      setGates((gs) => [...gs, { ...g, id: nextIds(gs, "G", 1)[0], show: true }]);
    }
    setGateEdit(null);
  }
  // 予約実績のあるゲートは、削除前に件数と直近の予約日を示して警告する。
  // 本番はゲートも論理削除とし、削除後も予約記録は保持する（[07] §8）。
  function removeGate(g) {
    const booked = reservations.filter((r) => r.kind === "gate" && r.resource === g.name);
    let message = `ゲート「${g.name}」を削除しますか？`;
    if (booked.length > 0) {
      const latest = booked.map((r) => r.date).sort().reverse()[0];
      message =
        `⚠️ ゲート「${g.name}」には予約実績が ${booked.length} 件あります（直近：${formatDateStr(latest)}）。\n\n` +
        "削除すると予約画面に表示されなくなります（予約記録自体は残ります）。\n" +
        "本当に削除しますか？";
    }
    if (window.confirm(message)) setGates((gs) => gs.filter((x) => x.id !== g.id));
  }
  function toggleGateShow(g) {
    setGates((gs) => gs.map((x) => (x.id === g.id ? { ...x, show: !x.show } : x)));
  }

  const gateShowCheck = (g) => (
    <FormControlLabel
      control={<Checkbox size="small" checked={g.show} onChange={() => toggleGateShow(g)} />}
      label="表示する"
      title="予約ページへの表示／非表示"
      slotProps={{ typography: { sx: { fontSize: 13 } } }}
    />
  );
  const gateActions = (g) => (
    <Box sx={{ display: "flex", gap: 0.75 }}>
      <Button size="small" variant="outlined" onClick={() => setGateEdit({ ...g })}>
        編集
      </Button>
      <Button size="small" variant="outlined" color="error" onClick={() => removeGate(g)}>
        削除
      </Button>
    </Box>
  );

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 1.75 }}>
        資機材・ゲート登録
      </Typography>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: "1px solid", borderColor: "divider" }}
      >
        <Tab value="lift" label="揚重機" />
        <Tab value="gate" label="ゲート" />
        <Tab value="equip" label="資機材・その他" />
      </Tabs>

      {tab === "gate" && (
        <>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap", my: 2 }}>
            <Typography variant="caption" color="text.secondary">
              全 {gates.length} 件
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ ml: "auto" }}
              onClick={() => setGateEdit(emptyGate())}
            >
              ゲート登録
            </Button>
          </Box>

          {narrow ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {gatePageRows.map((g) => (
                <Box key={g.id} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.5 }}>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 600, bgcolor: "action.hover", borderRadius: 1, px: 1, py: 0.25 }}
                      color="text.secondary"
                    >
                      {g.id}
                    </Typography>
                    <Typography sx={{ fontSize: 15, fontWeight: 700 }}>{g.name}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                    <CardField label="設置場所">{g.location || "—"}</CardField>
                    <CardField label="備考">{g.note || "—"}</CardField>
                    <CardField label="予約表示">{gateShowCheck(g)}</CardField>
                  </Box>
                  <Box sx={{ mt: 1.75, pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
                    {gateActions(g)}
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ゲートID</TableCell>
                    <TableCell>ゲート名</TableCell>
                    <TableCell>設置場所</TableCell>
                    <TableCell>備考</TableCell>
                    <TableCell>予約表示</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {gatePageRows.map((g) => (
                    <TableRow key={g.id} hover>
                      <TableCell>{g.id}</TableCell>
                      <TableCell>{g.name}</TableCell>
                      <TableCell>{g.location}</TableCell>
                      <TableCell>
                        {g.note || (
                          <Typography component="span" variant="caption" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{gateShowCheck(g)}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{gateActions(g)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <TablePagination
            total={gates.length}
            page={gSafePage}
            pageSize={gPageSize}
            onPage={setGPage}
            onPageSize={(n) => { setGPageSize(n); setGPage(0); }}
          />
        </>
      )}

      {tab === "lift" && (
        <EquipmentSection label="揚重機" list={lifts} setList={setLifts} idPrefix="L" {...poolProps} />
      )}
      {tab === "equip" && (
        <EquipmentSection label="資機材・その他" list={equipment} setList={setEquipment} idPrefix="E" withReserveType {...poolProps} />
      )}

      {/* ゲート登録／編集 */}
      {gateEdit && (
        <Modal
          title={gateEdit.id ? "ゲートの編集" : "ゲート登録"}
          onClose={() => setGateEdit(null)}
          footer={
            <>
              <Button variant="outlined" onClick={() => setGateEdit(null)}>
                キャンセル
              </Button>
              <Button variant="contained" onClick={saveGate}>
                保存
              </Button>
            </>
          }
        >
          <FormGrid>
            <TextField
              size="small"
              required
              label="ゲート名"
              value={gateEdit.name}
              onChange={(e) => setGateEdit((x) => ({ ...x, name: e.target.value }))}
            />
            <TextField
              size="small"
              label="設置場所"
              value={gateEdit.location}
              onChange={(e) => setGateEdit((x) => ({ ...x, location: e.target.value }))}
            />
            <TextField
              size="small"
              label="備考"
              value={gateEdit.note}
              onChange={(e) => setGateEdit((x) => ({ ...x, note: e.target.value }))}
              sx={{ gridColumn: "1 / -1" }}
            />
          </FormGrid>
        </Modal>
      )}
    </Box>
  );
}
