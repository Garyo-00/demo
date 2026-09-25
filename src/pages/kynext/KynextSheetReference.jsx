import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Container, Divider, FormControl, FormControlLabel, MenuItem, Paper, Radio, RadioGroup, Select, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useKynext } from "../../components/kynext/KynextContext.jsx";
import { SplitFab, useConfirmDialog, useIsTabletOrMobile } from "../../components/kynext/KynextCommon.jsx";
import { clearDraft } from "../../components/kynext/CreateSheetLib.js";
import { TODAY, addDays, fmtDate } from "../../kynextData.js";

// 履歴から選べる期間（本番 HISTORY_DAYS）と、最初に並べる直近期間（本番 DISPLAY_DAYS）
const HISTORY_DAYS = 30;
const DISPLAY_DAYS = 14;
const EXPAND_VALUE = "__expand__";

/**
 * 新規作成（参照選択）画面（本番 pages/create/reference + KYNEXTSheetReference）。
 * 「最初から入力」か「履歴から選択」を選び、履歴を選んだ場合は過去シートのコピーとして作成フローへ渡す。
 */
export default function KynextSheetReference() {
  const navigate = useNavigate();
  const { sheets, me, catalog } = useKynext();
  const isTabletOrMobile = useIsTabletOrMobile();
  const [type, setType] = useState("new");
  const [historyId, setHistoryId] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  // 「さらにN件を表示」を押したときは Select を閉じない（本番 expandClickedRef）
  const expandClickedRef = useRef(false);

  const confirmDialog = useConfirmDialog({
    title: "確認",
    children: (
      <Typography>
        テンプレートに変更がありました。
        <br />
        コピーが不完全な場合があるので提出前に確認してください
      </Typography>
    ),
  });

  // 自社（協力会社は一次会社が自社のもの、元請は全件）の過去30日分を作業日降順で並べる。
  // 仮作成シートは中身が無いのでコピー元にしない
  const histories = useMemo(() => {
    const startAt = addDays(TODAY, -HISTORY_DAYS);
    return sheets
      .filter((s) => s.status !== "Provisional")
      .filter((s) => (me.key === "partner" ? s.firstCompanyName === me.company : true))
      .filter((s) => s.workDate >= startAt)
      .sort((a, b) => b.workDate.localeCompare(a.workDate) || b.id - a.id);
  }, [sheets, me]);

  const cutoff = addDays(TODAY, -DISPLAY_DAYS);
  const recentHistories = histories.filter((h) => h.workDate >= cutoff);
  const hasOlderHistories = histories.some((h) => h.workDate < cutoff);
  // 直近14日間にシートなし && 15〜30日前にシートあり → 全表示（+ボタンなし）
  const isLongAbsence = recentHistories.length === 0 && hasOlderHistories;
  const visibleHistories = showAll || isLongAbsence ? histories : recentHistories;
  const hasMore = !showAll && !isLongAbsence && hasOlderHistories;

  const isNextDisabled = type === "history" && !historyId;

  const handleBack = () => navigate("/kynext");

  const handleNext = async () => {
    if (isNextDisabled) return;
    if (type === "history" && historyId) {
      const history = histories.find((h) => h.id === Number(historyId));
      if (!history) return;
      // コピー元のカタログが使用中テンプレートと違うときは、引き継げない項目があり得ることを断る
      if (history.catalog?.id !== catalog?.id) {
        const { accepted } = await confirmDialog.confirm();
        if (!accepted) return;
      }
      navigate("/kynext/ky-sheets/create", { state: { copy: true, kynextSheet: history.id } });
      return;
    }
    clearDraft();
    navigate("/kynext/ky-sheets/create");
  };

  return (
    <Container maxWidth="xl">
      {confirmDialog.renderDialog()}
      <Paper sx={{ mx: "auto", width: isTabletOrMobile ? "100%" : "80%", mt: 5 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: "bold" }}>
            新規作成
          </Typography>
          <FormControl component="fieldset" sx={{ mt: 2 }}>
            <RadioGroup value={type} onChange={(e) => setType(e.target.value)}>
              <FormControlLabel value="new" control={<Radio size="small" />} label="最初から入力" />
              <FormControlLabel value="history" control={<Radio size="small" />} label={`履歴から選択(過去${HISTORY_DAYS}日分)`} />
            </RadioGroup>
          </FormControl>
          {type === "history" && (
            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth>
                <Select
                  open={selectOpen}
                  onOpen={() => setSelectOpen(true)}
                  onClose={() => {
                    if (expandClickedRef.current) {
                      expandClickedRef.current = false;
                      return;
                    }
                    setSelectOpen(false);
                  }}
                  value={historyId}
                  onChange={(e) => {
                    if (e.target.value === EXPAND_VALUE) return;
                    setHistoryId(e.target.value);
                  }}
                  displayEmpty
                  variant="outlined"
                  // 選択後の表示は「一次会社／作業内容 - 日付」を1行にまとめる
                  renderValue={(v) => {
                    if (!v) return <Typography>履歴を選択してください</Typography>;
                    const h = histories.find((x) => x.id === Number(v));
                    return h ? `${h.firstCompanyName}／${h.workContent} - ${fmtDate(h.workDate)}` : "";
                  }}
                >
                  <MenuItem value="">
                    <Typography>履歴を選択してください</Typography>
                  </MenuItem>
                  {visibleHistories.map((history) => (
                    <MenuItem key={history.id} value={history.id}>
                      <Stack>
                        <Typography variant="body1">{history.firstCompanyName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {history.workContent} - {fmtDate(history.workDate)}
                        </Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                  {hasMore && <Divider />}
                  {hasMore && (
                    <MenuItem
                      value={EXPAND_VALUE}
                      onMouseDown={() => {
                        expandClickedRef.current = true;
                      }}
                      onClick={() => setShowAll(true)}
                      sx={{ justifyContent: "center", color: "primary.main" }}
                    >
                      <AddIcon fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="body2">さらに{histories.length - recentHistories.length}件を表示</Typography>
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            </Box>
          )}
          {!isTabletOrMobile && (
            <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end", mt: 4 }}>
              <Button variant="outlined" onClick={handleBack}>
                キャンセル
              </Button>
              <Button variant="contained" onClick={handleNext} disabled={isNextDisabled}>
                次へ
              </Button>
            </Stack>
          )}
        </Box>
      </Paper>
      {isTabletOrMobile && (
        <SplitFab
          actions={[
            { label: "キャンセル", icon: <ArrowBackIcon />, onClick: handleBack },
            { label: "次へ", icon: <ArrowForwardIcon />, onClick: handleNext, disabled: isNextDisabled },
          ]}
        />
      )}
    </Container>
  );
}
