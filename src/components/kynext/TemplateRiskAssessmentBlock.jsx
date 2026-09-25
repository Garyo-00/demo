import { Box, FormControl, InputLabel, MenuItem, Paper, Select, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { SYMBOL_MAP } from "../../kynextData.js";
import { RequiredMark } from "./KynextCommon.jsx";
import { ReadOnlyValue, TabPanel, useTabParam } from "./TemplateBlockLayout.jsx";
import { TemplateWorkProcedureBlock } from "./TemplateWorkProcedureBlock.jsx";
import { TemplateSymbolEvaluationBlock, defaultEvaluationsBySymbol } from "./TemplateSymbolEvaluationBlock.jsx";

// ===== リスク評価ブロック（本番 templateEdit/blocks/RiskAssessmentBlock） =====
// タブ: 記述パターン（作業手順設定）／重大性／可能性／評価。
// rc はリスク評価カタログ（kynextData の SAFETY_RISK_CATALOG の形）で、変更は onChange(next) で親に返す。

const MAX_OPTIONS = [2, 3, 4, 5];
// 評価の既定色（本番には無い。デモの評価表示（evaluationOf）が色を使うので設定できるようにしている）
const DEFAULT_COLORS = ["#d9f0d3", "#fde8b5", "#f8c5c5", "#f3b0d8", "#c9c3f5"];

// ブロック種別ごとの表示設定（本番 riskAssessmentBlocks）
export const RISK_BLOCK_CONFIG = {
  "risk-assessment": {
    type: "Safety",
    required: true,
    showPointingAndCalling: true,
    showDoubleSafety: true,
    showMultipleAiSuggestion: true,
    showTitle: false,
    defaultDangerPointLabel: "どんな危険があるか（予想される災害）",
    useWorkContentLabel: false,
    dangerTerm: "危険",
  },
  "quality-risk-assessment": {
    type: "Quality",
    required: false,
    showPointingAndCalling: false,
    showDoubleSafety: false,
    showMultipleAiSuggestion: false,
    showTitle: false,
    defaultDangerPointLabel: "どんな不具合があるか",
    useWorkContentLabel: true,
    dangerTerm: "問題",
    dangerPointHint: "どのような品質低下・不具合につながるか",
  },
  "other-risk-assessment": {
    type: "Other",
    required: false,
    showPointingAndCalling: false,
    showDoubleSafety: false,
    showMultipleAiSuggestion: false,
    showTitle: true,
    defaultDangerPointLabel: "どんなリスクがあるか",
    useWorkContentLabel: true,
    dangerTerm: "危険",
  },
  // 作業員サインブロック内のリスク評価（作業員が自分の作業 1 件を評価する）
  "worker-risk-assessment": {
    type: "Safety",
    required: false,
    showAISettings: true,
    showPointingAndCalling: false,
    showDoubleSafety: false,
    showMultipleAiSuggestion: false,
    showTitle: false,
    maxProcedureCountLimit: 3,
    hideProcedureCounts: true,
    useWorkContentLabel: true,
    dangerTerm: "危険",
  },
};

export const isRiskBlockKey = (key) => key === "risk-assessment" || key === "quality-risk-assessment" || key === "other-risk-assessment";

// 評価点の最大値（本番 computeExpectedMax）
const expectedMaxOf = (rc) => {
  const maxS = Math.max(0, ...rc.severities.map((s) => s.score));
  const maxP = Math.max(0, ...rc.possibilities.map((p) => p.possibility));
  return rc.scoreType === "Addition" ? maxS + maxP : maxS * maxP;
};

// 評価の配列を「低い順」に揃える（データは高い順に並んでいてもよい）
const ascending = (evaluations) => [...evaluations].sort((a, b) => a.scoreMin - b.scoreMin);

// scoreMin は前行の scoreMax+1、最終行の scoreMax は最大点に自動で揃える（本番の useEffect 同期）
const normalizeEvaluations = (rc, evaluations) => {
  const max = expectedMaxOf(rc);
  return evaluations.map((e, i, arr) => ({
    ...e,
    scoreMin: i === 0 ? 1 : (arr[i - 1].scoreMax || 0) + 1,
    scoreMax: i === arr.length - 1 ? max : e.scoreMax,
  }));
};

export function TemplateRiskAssessmentBlock({ rc, onChange, readOnly, config }) {
  const [tab, setTab] = useTabParam(4);
  const isSymbol = rc.scoreTableType === "Symbol";
  const evaluations = ascending(rc.evaluations ?? []);
  const expectedMax = expectedMaxOf(rc);

  const set = (patch) => onChange({ ...rc, ...patch });
  const setEvaluations = (next, base = rc) => onChange({ ...base, evaluations: normalizeEvaluations(base, next) });

  // 段階数（重大性・可能性の最大値）の変更。減らすと末尾を落とし、増やすと空行を足す。
  const resize = (key, valueKey, n) => {
    const list = rc[key];
    const next = n > list.length ? [...list, ...Array.from({ length: n - list.length }, (_, i) => ({ [valueKey]: list.length + i + 1, description: "" }))] : list.slice(0, n);
    // 並びは高い順（表示）ではなく値の昇順で持つ
    const sorted = [...next].sort((a, b) => a[valueKey] - b[valueKey]);
    const base = { ...rc, [key]: sorted };
    setEvaluations(evaluations, base);
  };

  const resizeEvaluations = (n) => {
    const next = n > evaluations.length ? [...evaluations, ...Array.from({ length: n - evaluations.length }, (_, i) => ({ scoreMin: 0, scoreMax: 0, evaluation: "", description: "", color: DEFAULT_COLORS[(evaluations.length + i) % DEFAULT_COLORS.length] }))] : evaluations.slice(0, n);
    setEvaluations(next);
  };

  // スコア方式 ⇄ 記号方式（本番 handleScoringMethodChange）。記号方式は 3 段階固定。
  const changeScoringMethod = (method) => {
    if (method === "Symbol") {
      const three = (key, valueKey) => [1, 2, 3].map((v) => rc[key].find((x) => x[valueKey] === v) ?? { [valueKey]: v, description: "" });
      set({ scoreTableType: "Symbol", severities: three("severities", "score"), possibilities: three("possibilities", "possibility"), evaluationsBySymbol: rc.evaluationsBySymbol?.length ? rc.evaluationsBySymbol : defaultEvaluationsBySymbol() });
    } else {
      const base = { ...rc, scoreTableType: "Number" };
      setEvaluations(evaluations.length ? evaluations : [{ scoreMin: 0, scoreMax: 0, evaluation: "", description: "", color: DEFAULT_COLORS[0] }, { scoreMin: 0, scoreMax: 0, evaluation: "", description: "", color: DEFAULT_COLORS[1] }], base);
    }
  };

  const descriptionTable = (key, valueKey) => (
    <>
      {!isSymbol && (
        <Box sx={{ mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 70 }}>
            <InputLabel>最大値</InputLabel>
            <Select value={rc[key].length} label="最大値" disabled={readOnly} onChange={(e) => resize(key, valueKey, Number(e.target.value))}>
              {MAX_OPTIONS.map((n) => (
                <MenuItem key={n} value={n}>
                  {n}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 60 }}>値</TableCell>
              <TableCell>説明テキスト</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[...rc[key]]
              .sort((a, b) => b[valueKey] - a[valueKey])
              .map((row) => (
                <TableRow key={row[valueKey]}>
                  <TableCell>{isSymbol ? SYMBOL_MAP[row[valueKey]] : row[valueKey]}</TableCell>
                  <TableCell>
                    {readOnly ? (
                      <ReadOnlyValue>{row.description}</ReadOnlyValue>
                    ) : (
                      <TextField size="small" fullWidth value={row.description ?? ""} onChange={(e) => set({ [key]: rc[key].map((x) => (x[valueKey] === row[valueKey] ? { ...x, description: e.target.value } : x)) })} error={!row.description} helperText={!row.description ? "入力してください" : ""} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );

  // 評価の範囲エラー（本番 getEvaluationRangeErrors / isLastEvalRowInvalid）
  const rangeErrors = evaluations.map((e, i) => (i < evaluations.length - 1 && e.scoreMax < e.scoreMin ? "最大値が最小値より小さいです" : i < evaluations.length - 1 && e.scoreMax >= expectedMax ? "最大値が評価点の最大値以上です" : null));
  const lastInvalid = evaluations.length > 0 && evaluations[evaluations.length - 1].scoreMin > expectedMax;

  return (
    <Box>
      {config.showTitle && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            タイトル
            <RequiredMark />
          </Typography>
          {readOnly ? <ReadOnlyValue>{rc.title}</ReadOnlyValue> : <TextField size="small" fullWidth value={rc.title ?? ""} onChange={(e) => set({ title: e.target.value })} error={!rc.title} helperText={!rc.title ? "入力してください" : ""} />}
        </Box>
      )}
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile>
          <Tab label="記述パターン" />
          <Tab label="重大性" />
          <Tab label="可能性" />
          <Tab label="評価" />
        </Tabs>
      </Box>
      <TabPanel value={tab} index={0}>
        <TemplateWorkProcedureBlock rc={rc} onChange={onChange} readOnly={readOnly} config={config} onScoringMethodChange={changeScoringMethod} />
      </TabPanel>
      <TabPanel value={tab} index={1}>
        {descriptionTable("severities", "score")}
      </TabPanel>
      <TabPanel value={tab} index={2}>
        {descriptionTable("possibilities", "possibility")}
      </TabPanel>
      <TabPanel value={tab} index={3}>
        {isSymbol ? (
          <TemplateSymbolEvaluationBlock rc={rc} onChange={onChange} readOnly={readOnly} />
        ) : (
          <>
            <Box sx={{ mb: 3 }}>
              <ToggleButtonGroup value={rc.scoreType ?? "Multiplication"} exclusive disabled={readOnly} onChange={(_, v) => v && setEvaluations(evaluations, { ...rc, scoreType: v })}>
                <ToggleButton value="Multiplication">乗算型</ToggleButton>
                <ToggleButton value="Addition">加算型</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Box sx={{ mb: 2 }}>
              <FormControl size="small" sx={{ minWidth: 70 }}>
                <InputLabel>段階</InputLabel>
                <Select value={evaluations.length} label="段階" disabled={readOnly} onChange={(e) => resizeEvaluations(Number(e.target.value))}>
                  {MAX_OPTIONS.map((n) => (
                    <MenuItem key={n} value={n}>
                      {n}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small" sx={{ minWidth: 640 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 80 }}>最小値</TableCell>
                    <TableCell sx={{ width: 20 }}>〜</TableCell>
                    <TableCell sx={{ width: 80 }}>最大値</TableCell>
                    <TableCell sx={{ width: 100 }}>評価テキスト</TableCell>
                    <TableCell>説明テキスト</TableCell>
                    <TableCell sx={{ width: 56 }}>色</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {evaluations
                    .map((e, index) => ({ e, index }))
                    .reverse()
                    .map(({ e, index }) => {
                      const isLast = index === evaluations.length - 1;
                      const update = (patch) => setEvaluations(evaluations.map((x, i) => (i === index ? { ...x, ...patch } : x)));
                      return (
                        <TableRow key={index}>
                          <TableCell>{readOnly ? <ReadOnlyValue>{e.scoreMin}</ReadOnlyValue> : <TextField size="small" value={e.scoreMin} disabled />}</TableCell>
                          <TableCell>〜</TableCell>
                          <TableCell>
                            {readOnly ? (
                              <ReadOnlyValue>{e.scoreMax}</ReadOnlyValue>
                            ) : isLast ? (
                              <TextField size="small" value={expectedMax} disabled error={lastInvalid} />
                            ) : (
                              <TextField size="small" type="number" value={e.scoreMax} error={!!rangeErrors[index]} slotProps={{ htmlInput: { min: 0 } }} sx={{ minWidth: 60 }} onChange={(ev) => update({ scoreMax: Number(ev.target.value) })} />
                            )}
                          </TableCell>
                          <TableCell>{readOnly ? <ReadOnlyValue sx={{ width: 80 }}>{e.evaluation}</ReadOnlyValue> : <TextField size="small" sx={{ width: 90 }} value={e.evaluation ?? ""} onChange={(ev) => update({ evaluation: ev.target.value })} error={!e.evaluation} />}</TableCell>
                          <TableCell>{readOnly ? <ReadOnlyValue>{e.description}</ReadOnlyValue> : <TextField size="small" fullWidth value={e.description ?? ""} onChange={(ev) => update({ description: ev.target.value })} />}</TableCell>
                          <TableCell>
                            <Box component="input" type="color" value={e.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]} disabled={readOnly} onChange={(ev) => update({ color: ev.target.value })} sx={{ width: 36, height: 28, p: 0, border: "1px solid", borderColor: "divider", borderRadius: 1, bgcolor: "transparent", cursor: readOnly ? "default" : "pointer" }} aria-label="評価の色" />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>
            {(rangeErrors.some(Boolean) || lastInvalid) && (
              <Box sx={{ mt: 1 }}>
                {rangeErrors.map((msg, i) =>
                  msg ? (
                    <Typography key={i} variant="caption" color="error" sx={{ display: "block" }}>
                      {evaluations.length - i}行目: {msg}
                    </Typography>
                  ) : null
                )}
                {lastInvalid && (
                  <Typography variant="caption" color="error" sx={{ display: "block" }}>
                    1行目: 最大値が最小値より小さいです
                  </Typography>
                )}
              </Box>
            )}
          </>
        )}
      </TabPanel>
    </Box>
  );
}
