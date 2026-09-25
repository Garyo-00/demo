import {
  Box,
  Dialog,
  DialogContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { SYMBOL_MAP } from "../../kynextData.js";
import { useIsMobile } from "./KynextCommon.jsx";

// 記号評価の「重大性×可能性」の組み合わせ表記（本番 getSymbolPairLabel）
const symbolPairLabel = (possibility, severity) => `${SYMBOL_MAP[possibility] ?? "?"}${SYMBOL_MAP[severity] ?? "?"}`;

/**
 * 「参考: リスク表」モーダル（本番 RiskCalculationModal）。
 * リスク評価カタログの重大性・可能性の見積り基準と評価基準を表で出す。
 * 詳細画面・作成フロー・作業員チェックのリスク評価で共用する。
 *
 * props: { open, onClose, riskCatalog }
 *   riskCatalog … severities / possibilities / evaluations / scoreType / scoreTableType / evaluationsBySymbol を持つカタログ
 */
export function RiskCalculationModal({ open, onClose, riskCatalog }) {
  const isMobile = useIsMobile();
  const severities = riskCatalog?.severities ?? [];
  const possibilities = riskCatalog?.possibilities ?? [];
  const evaluations = riskCatalog?.evaluations ?? [];
  const evaluationsBySymbol = riskCatalog?.evaluationsBySymbol ?? [];
  const isSymbolMode = riskCatalog?.scoreTableType === "Symbol";
  const scoreLabel = riskCatalog?.scoreType === "Addition" ? "重大性 ＋ 可能性" : "重大性 × 可能性";
  const hasData = severities.length > 0 && possibilities.length > 0;

  const scaleTable = (title, rows, keyOf, descOf) => (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
        {title}
      </Typography>
      <Table size="small" sx={{ minWidth: 200 }}>
        <TableHead>
          <TableRow>
            <TableCell align="center" width={60}>
              {isSymbolMode ? "記号" : "点数"}
            </TableCell>
            <TableCell>説明</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {[...rows]
            .sort((a, b) => keyOf(b) - keyOf(a))
            .map((r) => (
              <TableRow key={keyOf(r)}>
                <TableCell align="center">{isSymbolMode ? (SYMBOL_MAP[keyOf(r)] ?? keyOf(r)) : keyOf(r)}</TableCell>
                <TableCell>{descOf(r)}</TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" aria-labelledby="risk-matrix-modal-title">
      <DialogContent sx={{ p: 3, border: "2px solid #000", borderRadius: 1 }}>
        {hasData ? (
          <Stack spacing={3}>
            <Stack direction={isMobile ? "column" : "row"} spacing={3}>
              {scaleTable(
                "重大性の見積り基準",
                severities,
                (s) => s.score,
                (s) => s.description
              )}
              {scaleTable(
                "可能性の見積り基準",
                possibilities,
                (p) => p.possibility,
                (p) => p.description
              )}
              {!isSymbolMode && evaluations.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                    評価基準（{scoreLabel}）
                  </Typography>
                  <Table size="small" sx={{ minWidth: 300 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell align="center" width={70}>
                          点数
                        </TableCell>
                        <TableCell align="center" width={60}>
                          評価
                        </TableCell>
                        <TableCell>説明</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[...evaluations]
                        .sort((a, b) => b.scoreMax - a.scoreMax)
                        .map((e) => (
                          <TableRow key={`${e.evaluation}-${e.scoreMin}`}>
                            <TableCell align="center">{e.scoreMin === e.scoreMax ? e.scoreMin : `${e.scoreMin}〜${e.scoreMax}`}</TableCell>
                            <TableCell align="center" sx={{ backgroundColor: e.color ?? undefined }}>
                              {e.evaluation}
                            </TableCell>
                            <TableCell>{e.description}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Stack>
            {isSymbolMode && evaluationsBySymbol.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                  評価基準
                </Typography>
                <Table size="small" sx={{ width: "100%" }}>
                  <TableHead>
                    <TableRow>
                      <TableCell width={140}>
                        危険の見積
                        <br />
                        (重大性x可能性)
                      </TableCell>
                      <TableCell align="center" width={140}>
                        評価
                      </TableCell>
                      <TableCell align="center" width={80}>
                        危険度
                      </TableCell>
                      <TableCell width={240}>優先度</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...evaluationsBySymbol]
                      .sort((a, b) => b.score - a.score)
                      .map((e, i, arr) => (
                        <TableRow key={e.score}>
                          <TableCell>{e.pair.map((p) => symbolPairLabel(p.possibility, p.severity)).join(", ")}</TableCell>
                          <TableCell align="center">{e.evaluation ?? "-"}</TableCell>
                          <TableCell align="center">{arr.length - i}</TableCell>
                          <TableCell>{e.description}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Stack>
        ) : (
          // 本番はカタログが無いとき固定画像（riskMatrix.png）を出す。デモでは文言で代替する
          <Typography color="text.secondary">リスク表の設定がありません</Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default RiskCalculationModal;
