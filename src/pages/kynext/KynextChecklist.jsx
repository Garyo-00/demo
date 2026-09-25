import { Fragment, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Button, Checkbox, Container, Divider, FormControlLabel, Paper, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckIcon from "@mui/icons-material/Check";
import SendIcon from "@mui/icons-material/Send";
import { useKynext } from "../../components/kynext/KynextContext.jsx";
import { FontSizeScope, FontSizeToggle, SignaturePad, SplitFab, useIsMobile, useIsTabletOrMobile } from "../../components/kynext/KynextCommon.jsx";
import { ChecklistGroupInput, initChecklistValues, validateChecklistValues } from "../../components/kynext/DetailChecklistInputs.jsx";
import { resolveSheetPermissions } from "../../components/kynext/DetailLib.js";

// 戻るボタンだけの案内（既に回答済み／回答できない理由）
function NoticePaper({ message, onBack, isTabletOrMobile }) {
  return (
    <Stack spacing={2} sx={{ alignItems: "center" }}>
      <Paper sx={{ p: 4, width: isTabletOrMobile ? "100%" : "80%" }}>
        <Stack sx={{ px: 2, py: 2.5 }}>
          <Typography>{message}</Typography>
          <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end", mt: 4 }}>
            <Button variant="contained" onClick={onBack}>
              戻る
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}

/**
 * 職長チェックリストの回答（/kynext/ky-sheets/:id/checklists/:checklist。本番 CheckList）。
 * 見出しはカタログ名。Paper に itemGroups の入力。必須未入力はエラー表示。
 * hasSignature なら「署名する」→ 署名ステップ（SignaturePad＋スキップ）→「登録」。署名なしなら「確認する」で登録。
 */
function CheckList({ sheet, checklistCatalog }) {
  const navigate = useNavigate();
  const { me, answerForepersonChecklist, notify } = useKynext();
  const isMobile = useIsMobile();
  const isTabletOrMobile = useIsTabletOrMobile();
  const itemGroups = checklistCatalog.itemGroups ?? [];
  const requireSignature = !!checklistCatalog.hasSignature;

  const [step, setStep] = useState("checklist"); // 'checklist' | 'signature'
  const [{ values, notUse }, setForm] = useState(() => initChecklistValues(itemGroups));
  const [errors, setErrors] = useState({});
  const [skipSignature, setSkipSignature] = useState(false);
  const padApi = useRef(null);

  const detailPath = `/kynext/ky-sheets/${sheet.id}`;
  const perms = resolveSheetPermissions(sheet, me);
  const isAnswered = !!sheet.forepersonChecklistAnswer?.answeredAt;

  const handleBack = () => {
    if (step === "checklist") navigate(detailPath);
    else setStep("checklist");
  };

  if (isAnswered) return <NoticePaper message="既に回答済みです。" onBack={() => navigate(detailPath)} isTabletOrMobile={isTabletOrMobile} />;
  if (perms.checklistAnswerDeniedReason) return <NoticePaper message={perms.checklistAnswerDeniedReason} onBack={() => navigate(detailPath)} isTabletOrMobile={isTabletOrMobile} />;

  const validate = () => {
    const e = validateChecklistValues(itemGroups, values, notUse);
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const onChange = (itemId, v) => {
    setForm((f) => ({ ...f, values: { ...f.values, [itemId]: v } }));
    if (errors[itemId]) setErrors((e) => ({ ...e, [itemId]: undefined }));
  };
  const onNotUseChange = (groupId, checked) => setForm((f) => ({ ...f, notUse: { ...f.notUse, [groupId]: checked } }));

  const register = (signature) => {
    answerForepersonChecklist(sheet.id, { answers: values, signature, groupNotUse: notUse, answerer: { name: me.name } });
    notify("チェックリストを登録しました");
    navigate(detailPath);
  };
  // 署名なしのカタログ: 「確認する」でそのまま登録
  const handleSubmit = () => {
    if (!validate()) return;
    register(null);
  };
  // 署名ありのカタログ: 「署名する」で署名ステップへ
  const handleNext = () => {
    if (!validate()) return;
    setStep("signature");
  };
  const submitWithSignature = () => {
    const api = padApi.current;
    const signature = skipSignature || !api || api.isEmpty() ? null : api.toDataURL();
    register(signature);
  };

  const isSignatureStep = step === "signature";
  const backAction = { label: "戻る", icon: <ArrowBackIcon />, onClick: handleBack };
  const fabActions = isSignatureStep
    ? [backAction, { label: "登録", icon: <SendIcon />, onClick: submitWithSignature }]
    : requireSignature
      ? [backAction, { label: "署名する", icon: <ArrowForwardIcon />, onClick: handleNext }]
      : [backAction, { label: "確認する", icon: <CheckIcon />, onClick: handleSubmit }];

  return (
    <Stack spacing={2} sx={{ alignItems: "center" }}>
      <Typography variant="h4" sx={{ mb: 4, fontSize: 22, fontWeight: 700 }}>
        {checklistCatalog.name}
      </Typography>
      {!isSignatureStep && (
        <Paper sx={{ p: isMobile ? 2 : 4, width: isTabletOrMobile ? "100%" : "80%" }}>
          <Stack spacing={2}>
            {itemGroups.map((group, index) => (
              <Fragment key={group.id}>
                <ChecklistGroupInput group={group} values={values} notUse={notUse} errors={errors} onChange={onChange} onNotUseChange={onNotUseChange} isMobile={isMobile} />
                {index !== itemGroups.length - 1 && <Divider sx={{ my: 2 }} />}
              </Fragment>
            ))}
          </Stack>
        </Paper>
      )}
      {isSignatureStep && (
        <Box sx={{ width: "100%" }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              下記にサインをしてください
            </Typography>
            <SignaturePad disabled={skipSignature} onReady={(api) => (padApi.current = api)} />
            <FormControlLabel control={<Checkbox checked={skipSignature} onChange={(e) => setSkipSignature(e.target.checked)} />} label="署名をスキップする(署名ができないとき)" />
          </Stack>
        </Box>
      )}
      {isTabletOrMobile ? (
        <SplitFab actions={fabActions} />
      ) : (
        <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end", mt: 4 }}>
          <Button variant="outlined" onClick={handleBack}>
            戻る
          </Button>
          {isSignatureStep ? (
            <Button variant="contained" onClick={submitWithSignature}>
              登録
            </Button>
          ) : requireSignature ? (
            <Button variant="contained" onClick={handleNext}>
              署名する
            </Button>
          ) : (
            <Button variant="contained" onClick={handleSubmit}>
              確認する
            </Button>
          )}
        </Stack>
      )}
    </Stack>
  );
}

export default function KynextChecklist() {
  const { id, checklist } = useParams();
  const navigate = useNavigate();
  const { getSheet } = useKynext();
  const isTabletOrMobile = useIsTabletOrMobile();
  const sheet = getSheet(id);
  const checklistCatalog = sheet?.catalog?.forepersonChecklistCatalogs?.find((c) => c.id === Number(checklist)) ?? null;

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 1, mb: 1 }}>
        <FontSizeToggle />
      </Box>
      <FontSizeScope>
        {!sheet || !checklistCatalog ? (
          <NoticePaper message="チェックリストが見つかりません" onBack={() => navigate(sheet ? `/kynext/ky-sheets/${sheet.id}` : "/kynext")} isTabletOrMobile={isTabletOrMobile} />
        ) : (
          <CheckList sheet={sheet} checklistCatalog={checklistCatalog} />
        )}
      </FontSizeScope>
    </Container>
  );
}
