import { useState } from "react";
import { Box, Chip, FormControl, InputLabel, Menu, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { SYMBOL_MAP } from "../../kynextData.js";
import { ReadOnlyValue } from "./TemplateBlockLayout.jsx";

// ===== 記号評価の設定（本番 templateEdit/blocks/SymbolEvaluationBlock） =====
// 重大性×可能性（◯△×）の 9 通りの組み合わせを危険度（1〜段階数）に振り分ける。
// 本番はチップをドラッグして行を移動するが、@dnd-kit が無いのでチップをクリックして移動先の危険度を選ぶ。

const MAX_EVALUATION_OPTIONS = [2, 3, 4, 5];
// 可能性 × 重大性の全組み合わせ（×× → ◯◯ の順）
export const SYMBOL_COMBINATIONS = [3, 2, 1].flatMap((p) => [3, 2, 1].map((s) => ({ possibility: p, severity: s })));
const comboKey = (p, s) => `${p}-${s}`;
const comboLabel = (p, s) => `${SYMBOL_MAP[p]}${SYMBOL_MAP[s]}`;

// 既定の振り分け（本番 DEFAULT_SYMBOL_EVALUATION_MAPPING）。全て危険度 1。
export const defaultEvaluationsBySymbol = (levels = 3) =>
  Array.from({ length: levels }, (_, i) => ({
    score: i + 1,
    pair: i === 0 ? SYMBOL_COMBINATIONS.map((c) => ({ ...c })) : [],
    evaluation: "",
    description: "",
  }));

export function TemplateSymbolEvaluationBlock({ rc, onChange, readOnly }) {
  const entries = rc.evaluationsBySymbol?.length ? rc.evaluationsBySymbol : defaultEvaluationsBySymbol();
  const maxEvaluation = entries.length;
  const [menu, setMenu] = useState(null); // { el, key }

  // key → 危険度 のマップ
  const mapping = Object.fromEntries(entries.flatMap((e) => e.pair.map((p) => [comboKey(p.possibility, p.severity), e.score])));
  const levelOf = (key) => mapping[key] ?? 1;

  const commit = (nextEntries) => onChange({ ...rc, evaluationsBySymbol: nextEntries });

  const assign = (key, level) => {
    const [p, s] = key.split("-").map(Number);
    commit(
      entries.map((e) => ({
        ...e,
        pair: e.score === level ? [...e.pair.filter((x) => comboKey(x.possibility, x.severity) !== key), { possibility: p, severity: s }] : e.pair.filter((x) => comboKey(x.possibility, x.severity) !== key),
      }))
    );
  };

  // 段階数の変更。減らしたときに溢れた組み合わせは危険度 1 に戻す（本番と同じ）。
  const changeMax = (n) => {
    const next = Array.from({ length: n }, (_, i) => entries[i] ?? { score: i + 1, pair: [], evaluation: "", description: "" }).map((e) => ({ ...e, pair: [...e.pair] }));
    entries.slice(n).forEach((e) => next[0].pair.push(...e.pair));
    commit(next);
  };

  const setText = (level, key, value) => commit(entries.map((e) => (e.score === level ? { ...e, [key]: value } : e)));

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 70 }}>
          <InputLabel>段階</InputLabel>
          <Select value={maxEvaluation} label="段階" disabled={readOnly} onChange={(e) => changeMax(Number(e.target.value))}>
            {MAX_EVALUATION_OPTIONS.map((n) => (
              <MenuItem key={n} value={n}>
                {n}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {!readOnly && (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
            組み合わせをクリックすると危険度を変更できます
          </Typography>
        )}
      </Box>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small" sx={{ minWidth: 560 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 160 }}>
                危険の見積
                <br />
                (重大性x可能性)
              </TableCell>
              <TableCell sx={{ width: 160 }}>危険性の評価</TableCell>
              <TableCell sx={{ width: 60 }} align="center">
                危険度
              </TableCell>
              <TableCell>優先度</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[...entries]
              .sort((a, b) => b.score - a.score)
              .map((e) => {
                const assigned = SYMBOL_COMBINATIONS.filter((c) => levelOf(comboKey(c.possibility, c.severity)) === e.score);
                return (
                  <TableRow key={e.score}>
                    <TableCell>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, minHeight: 32 }}>
                        {assigned.map((c) => {
                          const key = comboKey(c.possibility, c.severity);
                          return <Chip key={key} label={comboLabel(c.possibility, c.severity)} size="small" clickable={!readOnly} onClick={readOnly ? undefined : (ev) => setMenu({ el: ev.currentTarget, key })} />;
                        })}
                        {assigned.length === 0 && (
                          <Typography variant="caption" color="text.disabled">
                            なし
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{readOnly ? <ReadOnlyValue>{e.evaluation}</ReadOnlyValue> : <TextField size="small" fullWidth value={e.evaluation ?? ""} onChange={(ev) => setText(e.score, "evaluation", ev.target.value)} />}</TableCell>
                    <TableCell align="center">{e.score}</TableCell>
                    <TableCell>{readOnly ? <ReadOnlyValue>{e.description}</ReadOnlyValue> : <TextField size="small" fullWidth value={e.description ?? ""} onChange={(ev) => setText(e.score, "description", ev.target.value)} />}</TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
      <Menu anchorEl={menu?.el ?? null} open={!!menu} onClose={() => setMenu(null)}>
        {Array.from({ length: maxEvaluation }, (_, i) => maxEvaluation - i).map((level) => (
          <MenuItem
            key={level}
            selected={menu ? levelOf(menu.key) === level : false}
            onClick={() => {
              assign(menu.key, level);
              setMenu(null);
            }}
          >
            危険度 {level} へ移動
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
