import { Box, Button, Typography } from "@mui/material";
import PrintIcon from "@mui/icons-material/PrintOutlined";

// 出力（PDF）プレビューの共通シェル。本番はPDF出力、ここでは擬似プレビュー。
// .pp-overlay / .pp-bar / .pp-scroll のクラス名は @media print の出力指定に使うため残す。
export default function PrintPreview({ title, onClose, children }) {
  return (
    <div className="pp-overlay">
      <Box className="pp-bar" sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{title}</Typography>
        <Typography sx={{ fontSize: 12, color: "#8b98a8" }}>
          プレビュー（本番環境ではPDF出力）
        </Typography>
        <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
          <Button
            size="small"
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
          >
            印刷 / PDF
          </Button>
          <Button size="small" onClick={onClose} sx={{ color: "#fff" }}>
            閉じる
          </Button>
        </Box>
      </Box>
      <div className="pp-scroll">{children}</div>
    </div>
  );
}
