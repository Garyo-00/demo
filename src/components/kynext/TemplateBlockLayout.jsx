import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Button, Chip, Paper, Typography } from "@mui/material";

// ===== テンプレート詳細／編集の共通レイアウト部品（本番 templateEdit/TemplateBlockLayout ほか） =====

// 見出しの文字サイズ。デモのテーマは h4/h5 を定義していないので、本番の見た目に近い大きさを固定で与える。
export const H4_SX = { fontSize: 22, fontWeight: 700 };
export const H5_SX = { fontSize: 18, fontWeight: 700 };
export const H6_SX = { fontSize: 16, fontWeight: 700 };

// 「テンプレート名 > ブロック名」の見出し＋Paper。元請テンプレートには右上に「元請」Chip。
export function TemplateBlockLayout({ templateName, blockName, isExternal, startAction, endAction, paperSx, children }) {
  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, gap: 1, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          {startAction}
          <Typography variant="h5" sx={{ ...H5_SX, wordBreak: "break-word" }}>
            {blockName ? `${templateName} > ${blockName}` : templateName}
          </Typography>
        </Box>
        {endAction}
      </Box>
      <Paper sx={{ p: 2, ...paperSx }}>
        {isExternal && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
            <Chip size="small" color="success" label="元請" />
          </Box>
        )}
        {children}
      </Paper>
    </>
  );
}

/**
 * 「使用中ブロック」「未使用ブロック」の 2 列グリッド（本番 TemplateEditMenu / RiskAssessmentBlockMenu / WorkerSignBlockMenu 共通の描画）。
 * blocks: [{ key, label, required, inUse }]
 *  - 詳細（onSelect あり）: outlined ボタン。クリックでブロックを開く。
 *  - 編集（onSelect なし）: 枠内に「必須」または「削除」「新規作成」ボタン。
 */
export function BlockMenuGrid({ blocks, readOnly, onSelect, onDelete, onCreate, editLabel = "使用ブロックを編集する", onEdit, children }) {
  const inUse = blocks.filter((b) => b.required || b.inUse);
  const unused = blocks.filter((b) => !b.required && !b.inUse);

  const renderBlock = (b) => {
    const content = (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 1 }}>
        <span>{b.label}</span>
        {!readOnly && b.required && (
          <Typography variant="body2" color="text.disabled">
            必須
          </Typography>
        )}
        {!readOnly && !b.required && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {b.inUse ? (
              <Button
                size="small"
                variant="contained"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(b.key);
                }}
              >
                削除
              </Button>
            ) : (
              <Button
                size="small"
                variant="contained"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreate?.(b.key);
                }}
              >
                新規作成
              </Button>
            )}
          </Box>
        )}
      </Box>
    );
    return (
      <Box key={b.key}>
        {onSelect ? (
          <Button variant="outlined" size="large" fullWidth sx={{ minHeight: 50, borderRadius: 2 }} onClick={() => onSelect(b.key)} disabled={!readOnly && !b.required && !b.inUse}>
            {content}
          </Button>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid", borderColor: "divider", borderRadius: 2, px: 2, minHeight: 50 }}>
            {content}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <>
      <Typography variant="h5" sx={{ ...H5_SX, mb: 2 }}>
        使用中ブロック
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 2, mt: 2 }}>{inUse.map(renderBlock)}</Box>
      {!readOnly && unused.length > 0 && (
        <>
          <Typography variant="h5" sx={{ ...H5_SX, mb: 2, mt: 4 }}>
            未使用ブロック
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 2, mt: 2 }}>{unused.map(renderBlock)}</Box>
        </>
      )}
      {readOnly && onEdit && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Button variant="text" onClick={onEdit}>
            {editLabel}
          </Button>
        </Box>
      )}
      {children}
    </>
  );
}

// 閲覧時の値表示（本番の readOnly 時の Typography 枠。TextField と同じ高さの薄い枠で出す）
export function ReadOnlyValue({ children, sx }) {
  return (
    <Typography
      variant="body2"
      sx={{ flex: 1, px: 1.5, py: "8.5px", border: "1px solid", borderColor: "divider", borderRadius: 1, color: "text.secondary", bgcolor: "grey.50", minHeight: 37, wordBreak: "break-word", ...sx }}
    >
      {children || " "}
    </Typography>
  );
}

// タブ内容（本番 CustomTabPanel）
export function TabPanel({ value, index, children, sx }) {
  if (value !== index) return null;
  return <Box sx={{ pt: 2, ...sx }}>{children}</Box>;
}

// タブ位置を ?tab= に持つ（本番 useTabSearchParam）。ブロックを開き直しても同じタブに戻る。
export function useTabParam(max) {
  const [params, setParams] = useSearchParams();
  const raw = Number(params.get("tab") ?? 0);
  const value = Number.isInteger(raw) && raw >= 0 && raw < max ? raw : 0;
  const setValue = useCallback(
    (v) =>
      setParams(
        (prev) => {
          if (v) prev.set("tab", String(v));
          else prev.delete("tab");
          return prev;
        },
        { replace: true }
      ),
    [setParams]
  );
  return [value, setValue];
}
