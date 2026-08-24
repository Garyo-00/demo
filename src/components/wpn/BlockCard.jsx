import { Box, Card, CardContent, FormControlLabel, Switch, Typography } from "@mui/material";

/**
 * 作業計画書を構成するブロックのカード。
 * 詳細仕様が決まっているブロックは children に中身を渡す（未定のものは使用可否のみ設定できる）。
 */
export default function BlockCard({ block, enabled, onToggle, children }) {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1.5, gap: 1 }}>
          <Typography variant="h2">
            {block.label}
            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1, fontWeight: 400 }}>
              {block.hint}
            </Typography>
          </Typography>
          <FormControlLabel
            sx={{ ml: "auto", mr: 0, whiteSpace: "nowrap" }}
            control={<Switch size="small" checked={enabled} onChange={(e) => onToggle(e.target.checked)} />}
            label="このブロックを使用する"
            slotProps={{ typography: { sx: { fontSize: 12, color: "text.secondary" } } }}
          />
        </Box>

        {enabled && children ? (
          children
        ) : (
          <Box
            sx={{
              border: "1px dashed #d7dbe4",
              borderRadius: 2,
              py: 3.25,
              px: 2,
              textAlign: "center",
              fontSize: 12,
              color: "text.secondary",
              bgcolor: "#fbfcfe",
              opacity: enabled ? 1 : 0.6,
            }}
          >
            {enabled ? "詳細仕様は後日設定予定です。" : "このテンプレートでは使用しません。"}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
