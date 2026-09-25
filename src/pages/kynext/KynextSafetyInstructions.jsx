import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Button, Container, Paper, Stack, TextField, Typography } from "@mui/material";
import { useKynext } from "../../components/kynext/KynextContext.jsx";
import { useIsTabletOrMobile } from "../../components/kynext/KynextCommon.jsx";
import { resolveSheetPermissions } from "../../components/kynext/DetailLib.js";

/**
 * 元請からの安全指示の入力（/kynext/ky-sheets/:id/safety-instructions。本番 SafetyInstructions）。
 * Paper に見出し（safetyInstructionLabel）＋複数行テキスト、右下に「戻る」「確認する」（既入力なら「修正する」）。
 * 元請以外は「編集できません」＋戻る。
 */
export default function KynextSafetyInstructions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getSheet, me, setSafetyInstruction, notify } = useKynext();
  const isTabletOrMobile = useIsTabletOrMobile();
  const sheet = getSheet(id);
  const [text, setText] = useState(sheet?.safetyInstruction?.safetyInstruction ?? "");
  const [error, setError] = useState("");

  const detailPath = `/kynext/ky-sheets/${id}`;
  const handleBack = () => navigate(detailPath);

  if (!sheet) {
    return (
      <Container maxWidth="lg">
        <Stack spacing={4} sx={{ alignItems: "center" }}>
          <Typography>KYシートが見つかりません</Typography>
          <Button variant="contained" onClick={() => navigate("/kynext")}>
            一覧へ戻る
          </Button>
        </Stack>
      </Container>
    );
  }

  const perms = resolveSheetPermissions(sheet, me);
  if (!perms.safetyInstructionEditable) {
    return (
      <Container maxWidth="lg">
        <Stack spacing={4} sx={{ alignItems: "center" }}>
          <Typography>編集できません</Typography>
          <Box>
            <Button variant="contained" onClick={handleBack}>
              戻る
            </Button>
          </Box>
        </Stack>
      </Container>
    );
  }

  const label = sheet.catalog?.workflowCatalog?.safetyInstructionLabel || "元請からの安全指示";
  const isEdited = !!sheet.safetyInstruction;

  const handleSubmit = () => {
    if (!text.trim()) {
      setError("入力してください");
      return;
    }
    setSafetyInstruction(sheet.id, text.trim());
    notify(isEdited ? `${label}を修正しました。` : `${label}を登録しました。`);
    navigate(detailPath);
  };

  return (
    <Container maxWidth="lg">
      <Stack spacing={2} sx={{ alignItems: "center" }}>
        <Paper sx={{ p: 4, width: isTabletOrMobile ? "100%" : "80%" }}>
          <Stack sx={{ px: 2, py: 2.5 }}>
            <Stack spacing={2} sx={{ mt: 4 }}>
              <Typography variant="h6" component="h2" sx={{ fontWeight: "bold" }}>
                {label}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (error) setError("");
                }}
                error={!!error}
                helperText={error}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1, backgroundColor: "#FFFFFF" } }}
              />
            </Stack>
            <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end", mt: 4 }}>
              <Button variant="outlined" onClick={handleBack}>
                戻る
              </Button>
              <Button variant="contained" onClick={handleSubmit}>
                {isEdited ? "修正する" : "確認する"}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
