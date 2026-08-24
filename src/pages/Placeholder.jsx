import { useParams } from "react-router-dom";
import { Paper, Typography } from "@mui/material";

export default function Placeholder() {
  const { name } = useParams();
  return (
    <Paper variant="outlined" sx={{ p: 6, textAlign: "center", borderStyle: "dashed" }}>
      <Typography variant="body2" color="text.secondary">
        「{decodeURIComponent(name || "")}」画面はデモ未実装です。
      </Typography>
    </Paper>
  );
}
