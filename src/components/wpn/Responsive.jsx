import { Box, Card, CardActionArea, CardContent, Typography } from "@mui/material";
import { useIsNarrow } from "../wa/useIsNarrow.js";

export { useIsNarrow };

/**
 * 狭い画面でテーブルの代わりに出すカード。
 * title（見出し）＋ rows（[ラベル, 値] の配列）で1レコードを表す。
 * 値が空文字・null の行は出さない（モバイルで余白が増えるため）。
 */
export function RecordCard({ title, headRight, rows, footer, onClick, sx }) {
  const main = (
    <>
      {title && (
        <Typography sx={{ fontSize: 14, fontWeight: 700, mb: rows?.length ? 1.25 : 0 }}>{title}</Typography>
      )}
      {rows?.length > 0 && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            columnGap: 1.5,
            rowGap: 0.75,
            fontSize: 12.5,
            alignItems: "start",
          }}
        >
          {rows
            .filter(([, v]) => v !== "" && v !== null && v !== undefined)
            .map(([k, v], i) => (
              <Box key={`${k}${i}`} sx={{ display: "contents" }}>
                <Box sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>{k}</Box>
                <Box sx={{ minWidth: 0, overflowWrap: "anywhere" }}>{v}</Box>
              </Box>
            ))}
        </Box>
      )}
    </>
  );

  return (
    <Card variant="outlined" sx={{ boxShadow: "none", ...sx }}>
      <Box sx={{ display: "flex", alignItems: "flex-start" }}>
        {/* headRight にボタンが入ることがあるため、CardActionArea の外に出す（button の入れ子を避ける） */}
        {onClick ? (
          <CardActionArea onClick={onClick} sx={{ flex: 1, minWidth: 0 }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>{main}</CardContent>
          </CardActionArea>
        ) : (
          <CardContent sx={{ flex: 1, minWidth: 0, p: 2, "&:last-child": { pb: 2 } }}>{main}</CardContent>
        )}
        {headRight && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flex: "none", p: 1.5, pl: 0 }}>
            {headRight}
          </Box>
        )}
      </Box>
      {footer && <Box sx={{ px: 2, pb: 2 }}>{footer}</Box>}
    </Card>
  );
}

// カードを縦に並べる入れ物
export function CardList({ children, empty }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children;
  if (!items || (Array.isArray(items) && items.length === 0)) {
    return (
      <Typography align="center" color="text.secondary" sx={{ py: 4, fontSize: 12.5 }}>
        {empty}
      </Typography>
    );
  }
  return <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>{items}</Box>;
}
