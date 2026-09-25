import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Button, Checkbox, Container, FormControlLabel, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DrawIcon from "@mui/icons-material/Draw";
import { useKynext } from "../../components/kynext/KynextContext.jsx";
import { SignaturePad, SplitFab, useIsTabletOrMobile } from "../../components/kynext/KynextCommon.jsx";
import { resolveSheetPermissions } from "../../components/kynext/DetailLib.js";

/**
 * 元請確認の署名画面（本番 createConfirmButton/sign/Sign.tsx ＋ completeConfirmButton/sign/Sign.tsx ＋ SignLayout）。
 * kind="create" … KY作成後 元請確認（「シート提出確認」）／ kind="complete" … 作業完了後 元請確認（「確認」）。
 * 「署名をスキップする」を ON にすると署名欄を無効化して署名なしで確認する。
 */
export default function KynextConfirmSign({ kind = "create" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getSheet, me, createConfirm, completeConfirm, notify } = useKynext();
  const isTabletOrMobile = useIsTabletOrMobile();
  const sheet = getSheet(id);
  const [skipSignature, setSkipSignature] = useState(false);
  const padApi = useRef(null);

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
  const deniedReason = kind === "create" ? perms.createConfirmDeniedReason : perms.completeConfirmDeniedReason;
  if (deniedReason) {
    return (
      <Container maxWidth="lg">
        <Stack spacing={4} sx={{ alignItems: "center" }}>
          <Typography>{deniedReason}</Typography>
          <Box>
            <Button variant="contained" onClick={handleBack}>
              戻る
            </Button>
          </Box>
        </Stack>
      </Container>
    );
  }

  const confirmLabel = kind === "create" ? "シート提出確認" : "確認";

  const handleConfirm = () => {
    const api = padApi.current;
    if (!skipSignature && (!api || api.isEmpty())) {
      notify("署名を入力してください", "error");
      return;
    }
    const signature = skipSignature ? undefined : api.toDataURL();
    if (kind === "create") {
      createConfirm(sheet.id, signature);
      notify("シート提出確認が完了しました。");
    } else {
      completeConfirm(sheet.id, signature);
      notify("元請確認が完了しました。");
    }
    // 本番の完了確認は一覧へ戻るが、デモでは確認結果が見える詳細へ戻す
    navigate(detailPath);
  };

  return (
    <Container maxWidth="lg">
      <Box>
        <Stack spacing={2}>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            署名を入力してください
          </Typography>
          <SignaturePad disabled={skipSignature} onReady={(api) => (padApi.current = api)} />
          <FormControlLabel control={<Checkbox checked={skipSignature} onChange={(e) => setSkipSignature(e.target.checked)} />} label="署名をスキップする(署名ができないとき)" />
          {!isTabletOrMobile && (
            <Stack direction="row" spacing={2} sx={{ justifyContent: "center" }}>
              <Button variant="outlined" onClick={handleBack}>
                戻る
              </Button>
              <Button variant="contained" onClick={handleConfirm}>
                {confirmLabel}
              </Button>
            </Stack>
          )}
        </Stack>
        {isTabletOrMobile && (
          <SplitFab
            actions={[
              { label: "戻る", icon: <ArrowBackIcon />, onClick: handleBack },
              { label: confirmLabel, icon: <DrawIcon />, onClick: handleConfirm },
            ]}
          />
        )}
      </Box>
    </Container>
  );
}
