import { Alert, Box, Typography } from "@mui/material";
import { usePatrol } from "./PatrolContext.jsx";

// 設定系画面の共通ガード。元請のみ中身を表示し、協力会社（職長）には閲覧させない。
// サイドバーにも出さないが、URLを直接開かれた場合もここで止める。
export default function PrimeOnly({ title, children }) {
  const { role } = usePatrol();
  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 2 }}>
        {title}
      </Typography>
      {role === "prime" ? (
        children
      ) : (
        <Alert severity="warning" sx={{ fontSize: 12.5 }}>
          この画面は元請ユーザーのみ閲覧できます。
        </Alert>
      )}
    </Box>
  );
}
