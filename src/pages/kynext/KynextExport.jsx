import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  Checkbox,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useKynext } from "../../components/kynext/KynextContext.jsx";
import { useIsMobile } from "../../components/kynext/KynextCommon.jsx";
import { DateNavigator, EXPORTABLE_STATUSES, SearchCard, SheetTable, matchKeyword, useBasicDetailItemNames } from "../../components/kynext/KynextListParts.jsx";
import { TODAY } from "../../kynextData.js";

// 未確認＝提出後の元請確認（createConfirm）が無いもの、と簡略化している
const isConfirmed = (s) => !!s.createConfirm;

// 選択したシートの出力確認（本番 ExportModal）
function ExportModal({ open, count, onCancel, onExport }) {
  return (
    <Dialog open={open} fullWidth maxWidth="sm">
      <DialogTitle>
        <Typography variant="h6" component="span">KYシート出力</Typography>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mt: 2 }}>
          {count > 1 ? `${count}件のKYシートをPDF形式出力します。これには時間がかかる場合があります。画面を閉じないでください。` : "KYシートをPDF形式で出力します。"}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} variant="outlined">
          キャンセル
        </Button>
        <Button variant="contained" color="primary" onClick={onExport}>
          出力
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// 期間指定出力の条件入力（本番 AllExportModal）
function AllExportModal({ open, onCancel, onExport }) {
  const [mode, setMode] = useState("range"); // 'range' | 'all'
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [includeUnConfirmed, setIncludeUnConfirmed] = useState(false);

  // 閉じたら条件を初期化する
  useEffect(() => {
    if (!open) {
      setMode("range");
      setStartAt("");
      setEndAt("");
      setIncludeUnConfirmed(false);
    }
  }, [open]);

  const handleExport = () =>
    onExport(mode === "range" ? { all: false, startAt: startAt || null, endAt: endAt || null, includeUnConfirmed } : { all: true, startAt: null, endAt: null, includeUnConfirmed });
  const isExportDisabled = mode === "range" && !startAt && !endAt;

  return (
    <Dialog open={open} fullWidth maxWidth="sm">
      <DialogTitle>
        <Typography variant="h6" component="span">期間指定出力</Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <FormControlLabel control={<Checkbox checked={includeUnConfirmed} onChange={(_, c) => setIncludeUnConfirmed(c)} />} label="未確認を含む" />
          <FormControl>
            <RadioGroup value={mode} onChange={(_, v) => setMode(v)}>
              <FormControlLabel value="range" control={<Radio />} label="期間指定" />
              {mode === "range" && (
                <Stack direction="row" spacing={2} sx={{ alignItems: "center", ml: 4, my: 1 }}>
                  <TextField type="date" size="small" label="開始日" value={startAt} onChange={(e) => setStartAt(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                  <Typography>〜</Typography>
                  <TextField type="date" size="small" label="終了日" value={endAt} onChange={(e) => setEndAt(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                </Stack>
              )}
              <FormControlLabel value="all" control={<Radio />} label="全期間" />
            </RadioGroup>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} variant="outlined">
          キャンセル
        </Button>
        <Button variant="contained" color="primary" onClick={handleExport} disabled={isExportDisabled}>
          出力
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// 期間指定出力の件数確認（本番 ExportConfirmModal）
function ExportConfirmModal({ open, count, onCancel, onConfirm }) {
  return (
    <Dialog open={open} fullWidth maxWidth="sm">
      <DialogTitle>
        <Typography variant="h6" component="span">KYシート出力</Typography>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mt: 2 }}>
          {count > 0 ? `${count}件のKYシートを出力しますか？これには時間がかかる場合があります。画面を閉じないでください。` : "対象のKYシートがありません。"}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} variant="outlined">
          キャンセル
        </Button>
        <Button variant="contained" color="primary" onClick={onConfirm} disabled={count === 0}>
          出力
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * KY出力（本番 pages/kynextExport/index.tsx + features/kySheet/export/*）。
 * 一覧で選んだシートの PDF 出力と、期間を指定した一括出力。
 * @react-pdf/renderer が無いので、出力は通知で「出力しました（デモ）」を出す。
 */
export default function KynextExport() {
  const mobile = useIsMobile();
  const { sheets, notify } = useKynext();
  const labels = useBasicDetailItemNames();

  const [draft, setDraft] = useState("");
  const [keyword, setKeyword] = useState("");
  const [date, setDate] = useState(TODAY);
  const [includeUnconfirmed, setIncludeUnconfirmed] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [allExportModalOpen, setAllExportModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [exportParams, setExportParams] = useState(null);

  // 仮作成は対象外。未確認を含めないときは元請確認済みのみ。
  const exportable = useMemo(() => sheets.filter((s) => EXPORTABLE_STATUSES.includes(s.status)), [sheets]);
  const rows = useMemo(
    () => exportable.filter((s) => s.workDate === date && matchKeyword(s, keyword) && (includeUnconfirmed || isConfirmed(s))),
    [exportable, date, keyword, includeUnconfirmed]
  );
  // 表示から外れた行の選択は捨てる（日付や条件を変えたとき）
  const selectedVisible = selectedIds.filter((id) => rows.some((r) => r.id === id));

  // 期間指定出力の対象件数（本番 useCountKYNEXTSheetsForExport）
  const allExportCount = useMemo(() => {
    if (!exportParams) return 0;
    return exportable.filter((s) => {
      if (!exportParams.includeUnConfirmed && !isConfirmed(s)) return false;
      if (exportParams.all) return true;
      if (exportParams.startAt && s.workDate < exportParams.startAt) return false;
      if (exportParams.endAt && s.workDate > exportParams.endAt) return false;
      return true;
    }).length;
  }, [exportable, exportParams]);

  const handleExportSelected = () => {
    setExportModalOpen(false);
    notify(`PDFを出力しました（デモ・${selectedVisible.length}件）`);
  };
  const handleExportAll = (params) => {
    setExportParams(params);
    setAllExportModalOpen(false);
    setConfirmOpen(true);
  };
  const handleConfirmExport = () => {
    setConfirmOpen(false);
    notify(`PDFを出力しました（デモ・${allExportCount}件）`);
  };

  return (
    <Container maxWidth="lg">
      <Stack direction="column" spacing={2}>
        <SearchCard
          mode="export"
          keyword={draft}
          onKeywordChange={setDraft}
          onSearch={() => setKeyword(draft)}
          onClear={() => {
            setDraft("");
            setKeyword("");
          }}
          firstCompanyName={labels.firstCompanyName}
          workContentName={labels.workContentName}
        />
        <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
          <Button disabled={selectedVisible.length === 0} variant="contained" onClick={() => setExportModalOpen(true)}>
            出力
          </Button>
          <Button variant="contained" onClick={() => setAllExportModalOpen(true)}>
            期間指定出力
          </Button>
        </Stack>
        <Card>
          <CardContent>
            <Stack direction="column" sx={{ width: "100%" }}>
              <Stack direction={mobile ? "column" : "row"} spacing={1} sx={{ justifyContent: "space-between", mb: 1 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <Typography>{`件数: ${rows.length}件`}</Typography>
                  <FormControlLabel control={<Checkbox checked={includeUnconfirmed} onChange={(e) => setIncludeUnconfirmed(e.target.checked)} size="small" />} label="未確認を含む" />
                </Stack>
                <DateNavigator date={date} onChange={setDate} />
              </Stack>
              <SheetTable rows={rows} mode="export" labels={labels} selectedIds={selectedVisible} onSelectedIdsChange={setSelectedIds} />
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <ExportModal open={exportModalOpen} count={selectedVisible.length} onCancel={() => setExportModalOpen(false)} onExport={handleExportSelected} />
      <AllExportModal open={allExportModalOpen} onCancel={() => setAllExportModalOpen(false)} onExport={handleExportAll} />
      <ExportConfirmModal open={confirmOpen} count={allExportCount} onCancel={() => setConfirmOpen(false)} onConfirm={handleConfirmExport} />
    </Container>
  );
}
