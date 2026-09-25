import { Fragment, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  Divider,
  FormControlLabel,
  FormHelperText,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DrawIcon from "@mui/icons-material/Draw";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import DeleteIcon from "@mui/icons-material/Delete";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { PHOTO_B, emptyRisk } from "../../kynextData.js";
import { useKynext } from "../../components/kynext/KynextContext.jsx";
import { FontSizeScope, FontSizeToggle, RequiredMark, SPLIT_FAB_HEIGHT, SignaturePad, SplitFab, useIsMobile, useIsTabletOrMobile } from "../../components/kynext/KynextCommon.jsx";
import { ChecklistGroupInput, initChecklistValues, validateChecklistValues } from "../../components/kynext/DetailChecklistInputs.jsx";
import { WorkerRiskCard, validateWorkerRisks } from "../../components/kynext/DetailWorkerRiskCard.jsx";
import { resolveSheetPermissions } from "../../components/kynext/DetailLib.js";

// ===== 作業員チェック（/kynext/ky-sheets/:id/worker-check/{procedures|risks|checklist|sign}） =====
// 本番 workerCheck/* ＋ workerCheckLogined/* をステップごとに1ファイルで再現する。
// ステップ間の入力は react-router の location.state で受け渡す（本番と同じ）。

const STEP_MAX_LENGTH = 100;

// ---------- スクロール誘導（本番 useScrollBottomProgress ＋ ScrollCue） ----------

// レイアウトのスクロール領域（overflowY: auto の親）を探して、下端まで読んだかと進捗を返す
function useScrollBottomProgress(ref, { bottomOffset = SPLIT_FAB_HEIGHT } = {}) {
  const [state, setState] = useState({ reached: false, progress: 0 });
  useEffect(() => {
    let el = ref.current?.parentElement;
    while (el && el !== document.body) {
      const { overflowY } = getComputedStyle(el);
      if (overflowY === "auto" || overflowY === "scroll") break;
      el = el.parentElement;
    }
    const target = el && el !== document.body ? el : null;
    const measure = () => {
      const scrollTop = target ? target.scrollTop : window.scrollY;
      const clientHeight = target ? target.clientHeight : window.innerHeight;
      const scrollHeight = target ? target.scrollHeight : document.documentElement.scrollHeight;
      const remain = scrollHeight - (scrollTop + clientHeight);
      const total = Math.max(1, scrollHeight - clientHeight);
      setState({ reached: remain <= bottomOffset + 4, progress: Math.min(1, Math.max(0, scrollTop / total)) });
    };
    measure();
    const t = setTimeout(measure, 300);
    const listener = target ?? window;
    listener.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(t);
      listener.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [ref, bottomOffset]);
  return state;
}

function ScrollCue({ visible, progress, label }) {
  const value = Math.round(progress * 100);
  return (
    <Box aria-hidden="true" sx={{ opacity: visible ? 1 : 0, transition: "opacity 0.3s ease", pointerEvents: "none", width: "100%" }}>
      <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", height: 44, pl: 0.5, pr: 2, borderRadius: 2, bgcolor: "primary.main", color: "common.white", boxShadow: 6, width: "100%" }}>
        <Box sx={{ position: "relative", width: 36, height: 36 }}>
          <CircularProgress variant="determinate" value={100} size={36} thickness={4} sx={{ color: "rgba(255,255,255,0.2)" }} />
          <CircularProgress variant="determinate" value={value} size={36} thickness={4} sx={{ color: "common.white", position: "absolute", left: 0, top: 0 }} />
          <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", "@keyframes bounce": { "0%, 100%": { transform: "translateY(-2px)" }, "50%": { transform: "translateY(2px)" } } }}>
            <KeyboardArrowDownIcon sx={{ fontSize: 18, color: "common.white", animation: "bounce 1.2s ease-in-out infinite" }} />
          </Box>
        </Box>
        <Typography variant="button" noWrap sx={{ lineHeight: 1 }}>
          {label}
        </Typography>
      </Stack>
    </Box>
  );
}

// PC は中央にボタン、タブレット・スマホは SplitFab（各ステップ共通）
function StepActions({ isTabletOrMobile, backLabel = "戻る", nextLabel, nextIcon, onBack, onNext, disabled = false, visible = true, overlay = null }) {
  if (isTabletOrMobile) {
    return (
      <SplitFab
        disabled={disabled}
        visible={visible}
        overlay={overlay}
        actions={[
          { label: backLabel, icon: <ArrowBackIcon />, onClick: onBack },
          { label: nextLabel, icon: nextIcon, onClick: onNext },
        ]}
      />
    );
  }
  return (
    <Stack direction="row" spacing={2} sx={{ justifyContent: "center" }}>
      <Button variant="outlined" onClick={onBack}>
        {backLabel}
      </Button>
      <Button variant="contained" onClick={onNext} disabled={disabled}>
        {nextLabel}
      </Button>
    </Stack>
  );
}

// 作業員チェックの次のステップ（リスク評価の後）。チェックリストがあれば checklist、無ければ sign
const nextSuffixAfterRisks = (catalog) => ((catalog?.workerChecklistCatalogSlots?.length ?? 0) > 0 ? "checklist" : "sign");

// 初期の作業内容行数（本番 useWorkerRiskForm）
const initialProcedureCount = (min, max) => Math.min(min >= 6 ? min : Math.max(min, 3), max);

// ---------- procedures: 作業内容の入力（本番 Procedures / WorkStepInputSection） ----------
function ProceduresStep({ sheet, riskCatalog }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isTabletOrMobile = useIsTabletOrMobile();
  const min = riskCatalog.minProcedureCount ?? 1;
  const max = riskCatalog.maxProcedureCount ?? 3;
  const initial = location.state?.workSteps?.length ? location.state.workSteps : Array.from({ length: initialProcedureCount(min, max) }, () => ({ step: "" }));
  const [workSteps, setWorkSteps] = useState(initial);
  const [errors, setErrors] = useState({});
  const basePath = `/kynext/ky-sheets/${sheet.id}`;

  const setStep = (i, v) => setWorkSteps((ws) => ws.map((w, j) => (j === i ? { ...w, step: v } : w)));
  const add = () => workSteps.length < max && setWorkSteps((ws) => [...ws, { step: "" }]);
  const remove = (i) => setWorkSteps((ws) => ws.filter((_, j) => j !== i));

  // 本番 validateStepInput: 最低数までは必須、100文字以下。末尾の空行は詰めて次へ渡す
  const handleNext = () => {
    const e = {};
    workSteps.forEach((w, i) => {
      if (i < min && !w.step?.trim()) e[i] = "入力してください";
      else if (w.step && w.step.length > STEP_MAX_LENGTH) e[i] = `${STEP_MAX_LENGTH}文字以下で入力してください`;
    });
    setErrors(e);
    if (Object.keys(e).length) return;
    const trimmed = [...workSteps];
    while (trimmed.length > 0 && !trimmed[trimmed.length - 1].step?.trim()) trimmed.pop();
    setWorkSteps(trimmed);
    navigate(`${basePath}/worker-check/risks`, { state: { workSteps: trimmed } });
  };

  return (
    <>
      <Stack spacing={2} sx={{ alignItems: "center" }}>
        <Typography variant="h3" sx={{ fontSize: 24, fontWeight: 700 }}>
          作業内容
        </Typography>
        <Paper sx={{ width: isMobile ? "100%" : "80%", p: 3 }}>
          <Stack spacing={1.5}>
            {workSteps.map((w, i) => {
              const label = `作業内容${i + 1}`;
              return (
                <Stack key={i} direction="row" spacing={1} sx={{ alignItems: "flex-start", width: "100%" }}>
                  <Box sx={{ minWidth: 90, flexShrink: 0, pt: 0.625 }}>
                    <Typography variant="body2">
                      {label}
                      {i < min && <RequiredMark />}
                    </Typography>
                  </Box>
                  <TextField size="small" placeholder={`${label}を入力`} value={w.step} onChange={(e) => setStep(i, e.target.value)} error={!!errors[i]} helperText={errors[i]} sx={{ flex: 1 }} />
                  {i >= min && (
                    <IconButton size="small" color="primary" onClick={() => remove(i)} aria-label="削除">
                      <RemoveIcon />
                    </IconButton>
                  )}
                </Stack>
              );
            })}
            {workSteps.length < max && (
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={add}>
                  追加
                </Button>
              </Box>
            )}
          </Stack>
        </Paper>
        {!isTabletOrMobile && <StepActions isTabletOrMobile={false} nextLabel="次へ" onBack={() => navigate(basePath)} onNext={handleNext} />}
      </Stack>
      {isTabletOrMobile && <StepActions isTabletOrMobile nextLabel="次へ" nextIcon={<ArrowForwardIcon />} onBack={() => navigate(basePath)} onNext={handleNext} />}
    </>
  );
}

// ---------- risks: リスク評価（本番 Risks / WorkRiskAssessmentSection） ----------
function RisksStep({ sheet, riskCatalog }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isTabletOrMobile = useIsTabletOrMobile();
  const isWithoutProcedure = riskCatalog.assessmentType === "WithoutProcedure";
  const min = riskCatalog.minProcedureCount ?? 1;
  const max = riskCatalog.maxProcedureCount ?? 3;
  const basePath = `/kynext/ky-sheets/${sheet.id}`;

  const stateWorkSteps = location.state?.workSteps;
  const restored = location.state?.workerRiskAssessmentData?.workSteps;
  const [workSteps, setWorkSteps] = useState(() => {
    if (restored?.length) return restored.map((ws) => ({ step: ws.step ?? "", risk: { ...emptyRisk(), ...(ws.risk ?? {}) } }));
    if (isWithoutProcedure) return Array.from({ length: min }, () => ({ step: "", risk: emptyRisk() }));
    return (stateWorkSteps ?? []).map((ws) => ({ step: ws.step, risk: { ...emptyRisk(), ...(ws.risk ?? {}) } }));
  });
  const [errors, setErrors] = useState({});

  const handleBack = () => {
    if (isWithoutProcedure) navigate(basePath);
    else navigate(`${basePath}/worker-check/procedures`, { state: { workSteps: workSteps.map((ws) => ({ step: ws.step })) } });
  };
  const handleNext = () => {
    const e = validateWorkerRisks(workSteps, { isWithoutProcedure });
    setErrors(e);
    if (Object.keys(e).length) return;
    navigate(`${basePath}/worker-check/${nextSuffixAfterRisks(sheet.catalog)}`, { state: { workerRiskAssessmentData: { workSteps } } });
  };

  if (!isWithoutProcedure && workSteps.length === 0) {
    return (
      <Stack spacing={2} sx={{ alignItems: "center" }}>
        <Typography>作業内容が入力されていません</Typography>
        <Button variant="contained" onClick={() => navigate(`${basePath}/worker-check/procedures`)}>
          作業内容を入力する
        </Button>
      </Stack>
    );
  }

  return (
    <>
      <Stack spacing={2} sx={{ alignItems: "center" }}>
        <Typography variant="h3" sx={{ fontSize: 24, fontWeight: 700 }}>
          リスク評価
        </Typography>
        <Paper sx={{ width: isMobile ? "100%" : "80%", p: 3 }}>
          {workSteps.map((ws, i) => (
            <WorkerRiskCard
              key={i}
              index={i}
              workStep={ws}
              riskCatalog={riskCatalog}
              errors={errors[i]}
              itemLabel="作業内容"
              isItemBased={isWithoutProcedure}
              canRemove={workSteps.length > min}
              onRemove={() => setWorkSteps((list) => list.filter((_, j) => j !== i))}
              onChange={(next) => setWorkSteps((list) => list.map((w, j) => (j === i ? next : w)))}
            />
          ))}
          {isWithoutProcedure && workSteps.length < max && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
              <Button variant="outlined" onClick={() => setWorkSteps((list) => [...list, { step: "", risk: emptyRisk() }])}>
                項目を追加
              </Button>
            </Box>
          )}
        </Paper>
        {!isTabletOrMobile && <StepActions isTabletOrMobile={false} nextLabel="次へ" onBack={handleBack} onNext={handleNext} />}
      </Stack>
      {isTabletOrMobile && <StepActions isTabletOrMobile nextLabel="次へ" nextIcon={<ArrowForwardIcon />} onBack={handleBack} onNext={handleNext} />}
    </>
  );
}

// ---------- checklist: 作業員チェックリスト（本番 WorkerCheckList ＋ RiskAssessmentItemSelectCard） ----------
function ChecklistStep({ sheet }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isTabletOrMobile = useIsTabletOrMobile();
  const basePath = `/kynext/ky-sheets/${sheet.id}`;
  const checklistCatalog = sheet.catalog?.workerChecklistCatalogSlots?.[0] ?? null;
  const itemGroups = checklistCatalog?.itemGroups ?? [];
  const state = location.state ?? {};
  const workerRiskAssessmentData = state.workerRiskAssessmentData ?? null;
  // 自分が行う作業の選択肢は、シートのリスク評価（先頭のカタログ）の手順
  const steps = (sheet.riskAssessments?.[0]?.workSteps ?? []).map((ws, i) => ({ index: i, name: ws.step }));

  const [{ values, notUse }, setForm] = useState(() => {
    const init = initChecklistValues(itemGroups);
    return { values: { ...init.values, ...(state.answers ?? {}) }, notUse: { ...init.notUse, ...(state.groupNotUse ?? {}) } };
  });
  const [riskItems, setRiskItems] = useState(state.riskAssessmentItems ?? []);
  const [errors, setErrors] = useState({});
  const [riskItemsError, setRiskItemsError] = useState("");

  const bottomRef = useRef(null);
  const { reached, progress } = useScrollBottomProgress(bottomRef);

  const onChange = (itemId, v) => {
    setForm((f) => ({ ...f, values: { ...f.values, [itemId]: v } }));
    if (errors[itemId]) setErrors((e) => ({ ...e, [itemId]: undefined }));
  };
  const onNotUseChange = (groupId, checked) => setForm((f) => ({ ...f, notUse: { ...f.notUse, [groupId]: checked } }));
  const toggleRiskItem = (index, checked) => {
    setRiskItems((list) => (checked ? [...list, index].sort((a, b) => a - b) : list.filter((i) => i !== index)));
    setRiskItemsError("");
  };

  const handleBack = () => {
    if (workerRiskAssessmentData) navigate(`${basePath}/worker-check/risks`, { state: { workerRiskAssessmentData } });
    else navigate(basePath);
  };
  const handleSubmit = () => {
    const e = validateChecklistValues(itemGroups, values, notUse);
    setErrors(e);
    let ok = Object.keys(e).length === 0;
    if (checklistCatalog?.selectRiskAssessmentItem && steps.length > 0 && riskItems.length === 0) {
      setRiskItemsError("選択してください");
      ok = false;
    }
    if (!ok) return;
    navigate(`${basePath}/worker-check/sign`, { state: { answers: values, groupNotUse: notUse, riskAssessmentItems: riskItems, workerRiskAssessmentData } });
  };

  if (!checklistCatalog) {
    return (
      <Stack spacing={2} sx={{ alignItems: "center" }}>
        <Typography>作業員チェックリストが見つかりません</Typography>
        <Button variant="contained" onClick={() => navigate(basePath)}>
          戻る
        </Button>
      </Stack>
    );
  }

  return (
    <>
      <Stack spacing={2} sx={{ alignItems: "center" }}>
        <Typography variant="h4" sx={{ fontSize: 22, fontWeight: 700 }}>
          {checklistCatalog.name ?? "作業チェックリスト"}
        </Typography>
        {(checklistCatalog.selectRiskAssessmentItem || itemGroups.length > 0) && (
          <Paper sx={{ width: isMobile ? "100%" : "80%", p: 3 }}>
            <Stack direction="column" spacing={2}>
              {checklistCatalog.selectRiskAssessmentItem && (
                <Box>
                  <Typography>自分が行う作業を選択してください</Typography>
                  <Stack spacing={0}>
                    {steps.map((s) => (
                      <FormControlLabel
                        key={s.index}
                        control={<Checkbox size="small" checked={riskItems.includes(s.index)} onChange={(e) => toggleRiskItem(s.index, e.target.checked)} />}
                        label={`手順${s.index + 1}: ${s.name}`}
                      />
                    ))}
                    {riskItemsError && <FormHelperText error>{riskItemsError}</FormHelperText>}
                  </Stack>
                </Box>
              )}
              {itemGroups.map((group, index) => (
                <Fragment key={group.id}>
                  <ChecklistGroupInput group={group} values={values} notUse={notUse} errors={errors} onChange={onChange} onNotUseChange={onNotUseChange} isMobile={isMobile} />
                  {index !== itemGroups.length - 1 && <Divider sx={{ my: 2 }} />}
                </Fragment>
              ))}
            </Stack>
          </Paper>
        )}
        {!isTabletOrMobile && <StepActions isTabletOrMobile={false} nextLabel="署名する" onBack={handleBack} onNext={handleSubmit} />}
        <div ref={bottomRef} />
      </Stack>
      {/* スマホ・タブレットでは下までスクロールして項目を確認するまで押せない（本番 ScrollCue） */}
      {isTabletOrMobile && (
        <StepActions
          isTabletOrMobile
          nextLabel="署名する"
          nextIcon={<DrawIcon />}
          onBack={handleBack}
          onNext={handleSubmit}
          disabled={!reached}
          visible={reached}
          overlay={<ScrollCue visible={!reached} progress={progress} label="チェック項目を入力してください" />}
        />
      )}
    </>
  );
}

// ---------- sign: 署名（本番 workerCheckLogined/sign/Sign.tsx ＋ SignLayout ＋ WorkerPhotoUpload） ----------
function SignStep({ sheet }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { addWorkerChecklist, notify } = useKynext();
  const isTabletOrMobile = useIsTabletOrMobile();
  const basePath = `/kynext/ky-sheets/${sheet.id}`;
  const state = location.state ?? {};
  const signatureCatalog = sheet.catalog?.signatureCatalogV2;
  const hasIndividualWorkerSignature = signatureCatalog?.hasIndividualWorkerSignature ?? true;
  const hasIndividualWorkerPhoto = signatureCatalog?.hasIndividualWorkerPhoto ?? false;
  const photoRequired = hasIndividualWorkerPhoto && !(signatureCatalog?.individualWorkerOptional ?? true);
  const signatureOnly = (sheet.catalog?.workerChecklistCatalogSlots?.length ?? 0) === 0;
  const workerRiskAssessmentData = state.workerRiskAssessmentData ?? null;

  const [showNameInput, setShowNameInput] = useState(false);
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState(null);
  const padApi = useRef(null);

  const handleBack = () => {
    if (signatureOnly && workerRiskAssessmentData) navigate(`${basePath}/worker-check/risks`, { state: { workerRiskAssessmentData } });
    else if (signatureOnly) navigate(basePath);
    else navigate(`${basePath}/worker-check/checklist`, { state });
  };

  const handleAnswer = () => {
    const api = padApi.current;
    const padEmpty = !api || api.isEmpty();
    if (photoRequired && !photo) {
      notify("写真を撮影してください", "error");
      return;
    }
    if (hasIndividualWorkerSignature && !name && padEmpty) {
      notify("署名または名前を入力してください", "error");
      return;
    }
    if (name.length > 30) {
      notify("名前は30文字以内で入力してください", "error");
      return;
    }
    const signature = hasIndividualWorkerSignature && !showNameInput && !padEmpty ? api.toDataURL() : null;
    const workerRiskAssessment = workerRiskAssessmentData
      ? {
          items: workerRiskAssessmentData.workSteps.map((ws) => ({
            workName: ws.step || "",
            dangerPoint: ws.risk?.dangerPoint ?? "",
            countermeasure: ws.risk?.countermeasure ?? "",
            severity: ws.risk?.severity ?? 0,
            possibility: ws.risk?.possibility ?? 0,
            improvedSeverity: ws.risk?.improvedSeverity ?? 0,
            improvedPossibility: ws.risk?.improvedPossibility ?? 0,
          })),
        }
      : null;
    addWorkerChecklist(sheet.id, {
      workerName: name,
      signature,
      photo,
      riskAssessmentItems: state.riskAssessmentItems ?? [],
      answers: state.answers ?? {},
      groupNotUse: state.groupNotUse ?? {},
      workerRiskAssessment,
    });
    notify("作業員チェックを登録しました");
    navigate(basePath);
  };

  // 写真の撮影（本番 WorkerPhotoUpload。デモではダミー画像を1枚付ける）
  const photoSection = hasIndividualWorkerPhoto && (
    <>
      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
        写真を撮影
        {photoRequired && <RequiredMark />}
      </Typography>
      <Stack direction="column">
        {!photo ? (
          <Stack direction="row" sx={{ alignItems: "center" }}>
            <IconButton onClick={() => setPhoto(PHOTO_B)} aria-label="写真を撮影">
              <AddAPhotoIcon />
            </IconButton>
          </Stack>
        ) : (
          <Box sx={{ m: 1 }}>
            <Paper elevation={2} sx={{ position: "relative", display: "inline-block" }}>
              <Box component="img" src={photo} alt="作業員写真" sx={{ width: 120, height: 120, objectFit: "cover", display: "block", borderRadius: 1 }} />
              <IconButton size="small" onClick={() => setPhoto(null)} sx={{ position: "absolute", top: 4, right: 4, backgroundColor: "rgba(255,255,255,.8)", "&:hover": { backgroundColor: "rgba(255,255,255,.9)" } }}>
                <DeleteIcon color="error" fontSize="small" />
              </IconButton>
            </Paper>
          </Box>
        )}
      </Stack>
    </>
  );

  const actions = (
    <StepActions isTabletOrMobile={isTabletOrMobile} nextLabel="登録" nextIcon={<DrawIcon />} onBack={handleBack} onNext={handleAnswer} disabled={name.length > 30} />
  );

  // 署名なし（写真のみ）のカタログ
  if (!hasIndividualWorkerSignature) {
    return (
      <Box>
        <Stack spacing={2}>
          {photoSection}
          {!isTabletOrMobile && actions}
        </Stack>
        {isTabletOrMobile && actions}
      </Box>
    );
  }

  return (
    <Box>
      <Stack spacing={2}>
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          下記にサインをしてください
          <RequiredMark />
        </Typography>
        <SignaturePad disabled={showNameInput} onReady={(api) => (padApi.current = api)} />
        <Typography variant="h6" sx={{ fontWeight: "bold", fontSize: 15 }}>
          記入できない場合は
          <Button
            variant="text"
            onClick={() => {
              setName("");
              padApi.current?.clear();
              setShowNameInput((p) => !p);
            }}
            sx={{ p: 0, minWidth: 0, ml: 0.5 }}
          >
            こちら
          </Button>
        </Typography>
        {showNameInput && (
          <TextField label="名前を入力してください" value={name} onChange={(e) => setName(e.target.value)} error={name.length > 30} helperText={name.length > 30 ? "署名は30文字以内で入力してください" : undefined} fullWidth />
        )}
        {photoSection}
        {!isTabletOrMobile && actions}
      </Stack>
      {isTabletOrMobile && actions}
    </Box>
  );
}

/**
 * 作業員チェックのページ。step ごとに分岐する。右上に文字サイズ切替（本番と同じ）。
 * 回答できない（元請確認済み／本日の作業ではない）ときは理由を出す。
 */
export default function KynextWorkerCheck({ step = "checklist" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getSheet, me } = useKynext();
  const sheet = getSheet(id);

  let body;
  if (!sheet) {
    body = (
      <Stack spacing={2} sx={{ alignItems: "center" }}>
        <Typography>KYシートが見つかりません</Typography>
        <Button variant="contained" onClick={() => navigate("/kynext")}>
          一覧へ戻る
        </Button>
      </Stack>
    );
  } else {
    const perms = resolveSheetPermissions(sheet, me);
    const riskCatalog = sheet.catalog?.workerRiskAssessmentCatalog ?? null;
    if (perms.workerCheckDeniedReason) {
      body = (
        <Stack spacing={2} sx={{ alignItems: "center" }}>
          <Typography>{perms.workerCheckDeniedReason}</Typography>
          <Button variant="contained" onClick={() => navigate(`/kynext/ky-sheets/${sheet.id}`)}>
            戻る
          </Button>
        </Stack>
      );
    } else if ((step === "procedures" || step === "risks") && !riskCatalog) {
      body = (
        <Stack spacing={2} sx={{ alignItems: "center" }}>
          <Typography>リスク評価カタログが見つかりません</Typography>
          <Button variant="contained" onClick={() => navigate(`/kynext/ky-sheets/${sheet.id}`)}>
            戻る
          </Button>
        </Stack>
      );
    } else if (step === "procedures") body = <ProceduresStep sheet={sheet} riskCatalog={riskCatalog} />;
    else if (step === "risks") body = <RisksStep sheet={sheet} riskCatalog={riskCatalog} />;
    else if (step === "checklist") body = <ChecklistStep sheet={sheet} />;
    else body = <SignStep sheet={sheet} />;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 1, mb: 1 }}>
        <FontSizeToggle />
      </Box>
      <FontSizeScope>{body}</FontSizeScope>
    </Container>
  );
}
